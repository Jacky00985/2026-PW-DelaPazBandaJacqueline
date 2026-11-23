// La aplicación de la demo con JWT.
// server.js la arranca; las pruebas la arrancan con otras configuraciones.
//
// Flujo JWT:
//   1. POST /api/login   → verifica usuario/contraseña → emite un JWT firmado
//   2. Rutas protegidas  → el cliente manda el token en la cabecera Authorization: Bearer <token>
//   3. POST /api/logout  → el cliente descarta el token (el servidor no guarda estado)
//
// Los "elementos de la sesión" que antes vivían en req.session.usuario
// ahora viven en el PAYLOAD del JWT:
//   { id, usuario, nombre, rol, creada, ultimoUso, visitas }

'use strict';

const path    = require('path');
const express = require('express');
const jwt     = require('jsonwebtoken');

const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');

// ─── helpers ────────────────────────────────────────────────────────────────

/** Muestra solo los primeros 8 caracteres de un string largo. */
const cortoId = (id) => (id ? `${id.slice(0, 8)}...` : null);

// ─── fábrica principal ───────────────────────────────────────────────────────

function crearApp(config, pool) {
  const app = express();
  app.use(express.json());

  const usuarios = crearModeloUsuarios(pool);

  // ── Middleware JWT ──────────────────────────────────────────────────────────
  // Lee el token del encabezado Authorization: Bearer <token>
  // Si es válido, deja req.usuarioJWT con los datos del payload.
  // NO falla si no hay token; eso lo hace requiereSesion().

  function leerJWT(req, _res, next) {
    const cabecera = req.headers['authorization'] || '';
    const token    = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;

    if (!token) return next();

    try {
      req.usuarioJWT = jwt.verify(token, config.jwtSecret);
    } catch {
      // token inválido o expirado → se trata como sin sesión
      req.usuarioJWT = null;
    }

    next();
  }

  app.use(leerJWT);

  // ── Verificar que la sesión es válida ─────────────────────────────────────
  // Devuelve 401 si no hay usuario en el token o si el token ya venció
  // según nuestra lógica de maxAge/rolling.

  function vencida(payload) {
    const desde = config.rolling ? payload.ultimoUso : payload.creada;
    return (Date.now() - desde) > config.maxAge;
  }

  function requiereSesion(req, res, next) {
    if (!req.usuarioJWT) {
      return res.status(401).json({ error: '401 — No has iniciado sesión' });
    }

    if (vencida(req.usuarioJWT)) {
      return res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar sesión.' });
    }

    next();
  }

  // ── Verificar rol ─────────────────────────────────────────────────────────

  function requiereRol(rol) {
    return (req, res, next) => {
      if (req.usuarioJWT.rol !== rol) {
        return res.status(403).json({
          error: `Eres "${req.usuarioJWT.usuario}", pero esta ruta es solo para el rol "${rol}".`
        });
      }
      next();
    };
  }

  // ── Emitir un nuevo token con los datos actualizados ──────────────────────

  function emitirToken(payload) {
    // jwt.sign() NO incluye automáticamente campos como creada/ultimoUso;
    // los añadimos nosotros para controlar la expiración manualmente.
    const datos = {
      id:        payload.id,
      usuario:   payload.usuario,
      nombre:    payload.nombre,
      rol:       payload.rol,
      visitas:   payload.visitas   || 0,
      creada:    payload.creada    || Date.now(),
      ultimoUso: Date.now(),
    };

    // expiresIn de jsonwebtoken es solo un seguro extra;
    // nuestra función vencida() es la que realmente decide.
    return jwt.sign(datos, config.jwtSecret, {
      expiresIn: Math.floor(config.maxAge / 1000), // en segundos
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RUTAS
  // ════════════════════════════════════════════════════════════════════════════

  // GET /api/config — devuelve la config activa (sin el secreto)
  app.get('/api/config', (_req, res) => {
    const { jwtSecret: _oculto, ...publica } = config; // nunca mandar el secreto
    res.json(publica);
  });

  // ── POST /api/visita ── contador de visitas sin login ─────────────────────
  // Si hay token lo actualiza; si no, emite uno nuevo de visitante.

  app.post('/api/visita', (req, res) => {
    const payload = req.usuarioJWT || {};
    const visitas = (payload.visitas || 0) + 1;

    const nuevo = emitirToken({
      ...payload,
      usuario: payload.usuario || 'visitante',
      nombre:  payload.nombre  || 'Visitante',
      rol:     payload.rol     || 'visitante',
      visitas,
    });

    res.json({
      visitas,
      tokenCorto: cortoId(nuevo),
      token: nuevo,          // el cliente lo guarda en localStorage
    });
  });

  // ── POST /api/login ───────────────────────────────────────────────────────

  app.post('/api/login', async (req, res, next) => {
    try {
      const { usuario, contraseña } = req.body || {};
      const datos = await usuarios.verificar(usuario, contraseña);

      if (!datos) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      }

      // Si ya tenía visitas de visitante las conservamos
      const visitas = req.usuarioJWT ? (req.usuarioJWT.visitas || 0) : 0;

      const token = emitirToken({
        ...datos,
        visitas,
        creada:    Date.now(),
        ultimoUso: Date.now(),
      });

      res.json({
        usuario: datos,
        tokenCorto: cortoId(token),
        token,          // el cliente lo guarda en localStorage / memoria
      });
    } catch (error) {
      next(error);
    }
  });

  // ── POST /api/logout ──────────────────────────────────────────────────────
  // Con JWT el servidor no guarda estado; simplemente le decimos al cliente
  // que descarte el token. El token seguirá siendo técnicamente válido hasta
  // que expire, pero sin él el cliente ya no puede usarlo.

  app.post('/api/logout', (_req, res) => {
    res.json({ mensaje: 'Sesión cerrada. Descarta el token en el cliente.' });
  });

  // ── GET /api/sesion ───────────────────────────────────────────────────────
  // Presenta los elementos de la sesión leídos del JWT.

  app.get('/api/sesion', requiereSesion, (req, res) => {
    const p     = req.usuarioJWT;
    const desde = config.rolling ? p.ultimoUso : p.creada;

    // Si rolling está activo re-emitimos el token con ultimoUso fresco
    const tokenRenovado = config.rolling
      ? emitirToken({ ...p, visitas: p.visitas })
      : null;

    res.json({
      // ── Elementos del usuario ─────────────────────────────
      usuario: {
        id:      p.id,
        usuario: p.usuario,
        nombre:  p.nombre,
        rol:     p.rol,
      },
      // ── Metadatos de la sesión ────────────────────────────
      visitas:            p.visitas || 0,
      creada:             new Date(p.creada).toISOString(),
      ultimoUso:          new Date(p.ultimoUso).toISOString(),
      expiraEnSegundos:   Math.max(0, Math.round((desde + config.maxAge - Date.now()) / 1000)),
      tokenCorto:         cortoId(req.headers['authorization']?.slice(7)),
      // ── Token renovado (solo si rolling:true) ─────────────
      ...(tokenRenovado ? { tokenRenovado } : {}),
    });
  });

  // ── GET /api/perfil ───────────────────────────────────────────────────────

  app.get('/api/perfil', requiereSesion, (req, res) => {
    const p = req.usuarioJWT;
    const visitas = (p.visitas || 0) + 1;

    // Incrementamos visitas y re-emitimos token actualizado
    const token = emitirToken({ ...p, visitas });

    res.json({
      mensaje:  `Hola ${p.nombre}`,
      rol:      p.rol,
      visitas,
      token,    // cliente actualiza su copia
    });
  });

  // ── GET /api/admin/reporte ────────────────────────────────────────────────

  app.get('/api/admin/reporte', requiereSesion, requiereRol('administrador'), (_req, res) => {
    res.json({ mensaje: 'Reporte solo para administradores.' });
  });

  // ── GET /api/diagnostico/sesiones ────────────────────────────────────────
  // Con JWT no hay almacén; mostramos la info del token actual.

  app.get('/api/diagnostico/sesiones', (req, res) => {
    if (!req.usuarioJWT) {
      return res.json({ almacen: 'jwt', sesiones: [] });
    }

    const p = req.usuarioJWT;
    res.json({
      almacen: 'jwt',
      nota: 'JWT no tiene almacén en el servidor. Solo se muestra tu propio token.',
      sesiones: [{
        tokenCorto: cortoId(req.headers['authorization']?.slice(7)),
        esLaTuya:   true,
        usuario:    p.usuario,
        nombre:     p.nombre,
        rol:        p.rol,
        visitas:    p.visitas || 0,
        creada:     new Date(p.creada).toISOString(),
        ultimoUso:  new Date(p.ultimoUso).toISOString(),
        expira:     new Date(p.creada + config.maxAge).toISOString(),
      }],
    });
  });

  // ── Archivos estáticos ────────────────────────────────────────────────────
  app.use(express.static(path.join(__dirname, 'public')));

  // ── Ruta 404 para /api ────────────────────────────────────────────────────
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

  // ── Manejador de errores ─────────────────────────────────────────────────
  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  return app;
}

module.exports = { crearApp };
