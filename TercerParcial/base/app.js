// La aplicación de la demo. server.js la arranca; las pruebas la arrancan con otras configuraciones.
// Lo que dice "(en clase)" lo programamos juntos, paso por paso. Mientras no esté, esa ruta responde 501.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');

const NOMBRE_COOKIE = 'connect.sid';

// Si hay una sesión, obtenerla del almacén, si no, crearla
function todasLasSesiones(almacen) {
  return new Promise((resolve, reject) => {
    const promesa = almacen.all((error, sesiones) => (error ?
      reject(error) : resolve(sesiones))
    );
    if (promesa && typeof promesa.then === 'function') {
      promesa.then(resolve, reject);
    }
  });
}

// Necesitamos visualizar el id de la sesión para compararla en la pantalla
const idCorto = (id) => (id ? `${id.slice(0, 8)}...` : null);

function crearApp(config, pool) {
  const app = express();
  app.use(express.json());

  // Primero debemos obtener el modelo de la BD
  const usuarios = crearModeloUsuarios(pool);

  // Identificar si la sesión es por tabla en bd o como cookie en memoria del navegador, o una mezcla
  const almacen = config.almacen === 'memoria' ?
    new session.MemoryStore() :
    new MySQLStore({ createDataBaseTable: false, clearExpired: false }, pool);

  app.locals.almacen = almacen;

  // Configuración del middleware de sesión
  app.use(session({
    name: NOMBRE_COOKIE,
    secret: config.secret || process.env.SESSION_SECRET || 'secreto-solo-para-la-demo',
    store: almacen,
    resave: false,
    saveUninitialized: false,
    rolling: config.rolling || false,
    cookie: {
      maxAge: config.maxAge || 1000 * 60 * 60 * 24, // 1 día
      httpOnly: config.httpOnly ?? true,
      sameSite: config.sameSite || 'lax',
      secure: config.secure || false, // true si es https
    },
  }));

  // Ocupamos un middleware para verificar si la sesión expiró
  function vencida(sesion) {
    const desde = config.rolling ? sesion.ultimoUso : sesion.creada;
    return (Date.now() - desde) > config.maxAge;
  }

  // Mandar 401, NO SÉ quién eres
  function requiereSesion(req, res, next) {
    if (req.session && req.session.usuario && vencida(req.session)) {
      return req.session.destroy(() => {
        res.clearCookie(NOMBRE_COOKIE);
        res.status(401).json({ error: 'Sesión expirada, Vuelve a Iniciar Sesión' });
      });
    }

    if (!req.session || !req.session.usuario) {
      return res.status(401).json({ error: '401, No has iniciado sesion con la cuenta correcta' });
    }

    req.session.ultimoUso = Date.now();
    next();
  }

  function requiereRol(rol) {
    return (req, res, next) => {
      if (!req.session.usuario || req.session.usuario.rol !== rol) {
        return res.status(403).json({ error: `Eres ${req.session.usuario?.rol || 'desconocido'}, pero esta ruta es para ${rol}` });
      }
      next();
    };
  }

  // Definir las rutas de acceso
  app.get('/api/config', (req, res) => {
    res.json(config);
  });

  // Ruta para una visita básica sin iniciar sesión
  app.post('/api/visita', (req, res) => {
    if (!req.session) return res.json({ error: 'no tiene acceso' });
    req.session.visitas = (req.session.visitas || 0) + 1;
    res.json({ visitas: req.session.visitas, sesion: idCorto(req.sessionID) });
  });

  // Ruta para autenticarse (Login)
  app.post('/api/login', async (req, res, next) => {
    try {
      const { usuario, contrasena } = req.body || {};
      const datos = await usuarios.verificar(usuario, contrasena);
      if (!datos) return res.status(401).json({
        error: 'usuario o contrasena incorrectos'
      });
      
      const antes = req.session.visitas !== undefined ? idCorto(req.sessionID) : null;
      const visitas = req.session.visitas || 0;

      const guardar = () => {
        req.session.usuario = datos;
        req.session.visitas = visitas;
        req.session.creada = Date.now();
        req.session.ultimoUso = Date.now();
        req.session.save((error) => {
          if (error) return next(error);
          res.json({ usuario: datos, sesionAntes: antes, sesionDespues: idCorto(req.sessionID) });
        });
      };

      if (config.regenerarAlEntrar) {
        req.session.regenerate((error) => (error ? next(error) : guardar()));
      } else {
        guardar();
      }

    } catch (error) {
      next(error);
    }
  });

  app.post('/api/logout', (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie(NOMBRE_COOKIE);
      res.json({ mensaje: 'Sesion cerrada' });
    });
  });

  app.get('/api/sesion', requiereSesion, (req, res) => {
    const desde = config.rolling ? req.session.ultimoUso : req.session.creada;
    res.json({
      usuario: req.session.usuario,
      sesion: idCorto(req.sessionID),
      expiraEnSegundos: Math.max(0, Math.round((desde + config.maxAge - Date.now()) / 1000)),
    });
  });

  app.get('/api/perfil', requiereSesion, (req, res) => {
    req.session.visitas = (req.session.visitas || 0) + 1;
    res.json({
      mensaje: `Hola ${req.session.usuario.nombre}, rol: ${req.session.usuario.rol}, visitas: ${req.session.visitas}`
    });
  });

  // Diagnóstico de sesiones
  app.get('/api/diagnostico/sesiones', async (req, res, next) => {
    try {
      const sesiones = await todasLasSesiones(almacen);
      const lista = Object.entries(sesiones || {}).map(([id, s]) => ({
        sesion: idCorto(id),
        esLaTuya: id === req.sessionID,
        usuario: s.usuario ? s.usuario.usuario : 'Sin iniciar sesion',
        visitas: s.visitas || 0,
        expira: s.cookie && s.cookie.expires,
      }));
      res.json({ almacen: config.almacen, sesiones: lista });
    } catch (error) {
      next(error);
    }
  });

  app.use(express.static(path.join(__dirname, 'public')));

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
  
  return app;
}

module.exports = { crearApp, NOMBRE_COOKIE };