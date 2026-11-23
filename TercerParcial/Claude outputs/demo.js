// La página hace fetch a la API y maneja el JWT en memoria (variable local).
// El token NO se guarda en localStorage ni en cookies para esta demo;
// vive solo mientras la pestaña esté abierta.

'use strict';

const $ = (id) => document.getElementById(id);

// ── Estado del cliente ───────────────────────────────────────────────────────
let tokenActual = null; // aquí guardamos el JWT que nos da el servidor

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Cabeceras para peticiones autenticadas. */
function cabeceras() {
  const h = { 'Content-Type': 'application/json' };
  if (tokenActual) h['Authorization'] = `Bearer ${tokenActual}`;
  return h;
}

/** Muestra la respuesta en el log de la bitácora. */
function bitacora(metodo, url, respuesta, ok) {
  const li = document.createElement('li');
  li.className = ok ? 'ok' : 'error';
  li.innerHTML = `<strong>${metodo} ${url}</strong><br><pre>${JSON.stringify(respuesta, null, 2)}</pre>`;
  $('bitacora').prepend(li);
}

/** Actualiza el panel "¿Quién soy?" con los datos del JWT. */
function actualizarEstado(datos) {
  const $estado = $('estado');

  if (!tokenActual) {
    $estado.textContent = 'Sin sesión (sin token)';
    $estado.className   = 'estado sin-sesion';
    return;
  }

  if (datos && datos.usuario) {
    $estado.textContent = `✅ ${datos.usuario.nombre} · rol: ${datos.usuario.rol} · visitas: ${datos.visitas} · expira en ${datos.expiraEnSegundos}s`;
    $estado.className   = 'estado con-sesion';
  }
}

/** Decodifica el payload del JWT SIN verificar (solo para mostrar en pantalla). */
function decodificarPayload(token) {
  try {
    const partes  = token.split('.');
    const payload = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

/** Muestra lo que el JS de la página puede "ver" del token (payload decodificado). */
function mostrarPayload() {
  const $pre = $('cookie-js');
  if (!tokenActual) {
    $pre.textContent = '(sin token)';
    return;
  }
  const payload = decodificarPayload(tokenActual);
  $pre.textContent = payload
    ? JSON.stringify(payload, null, 2)
    : '(token ilegible)';
}

// ── Acciones principales ──────────────────────────────────────────────────────

async function refrescarEstado() {
  if (!tokenActual) {
    actualizarEstado(null);
    mostrarPayload();
    return;
  }

  try {
    const r    = await fetch('/api/sesion', { headers: cabeceras() });
    const data = await r.json();

    if (r.ok) {
      // Si el servidor devolvió un token renovado (rolling:true), lo guardamos
      if (data.tokenRenovado) tokenActual = data.tokenRenovado;
      actualizarEstado(data);
    } else {
      // Token expirado o inválido
      tokenActual = null;
      actualizarEstado(null);
    }
  } catch {
    $('estado').textContent = 'Error de red';
  }

  mostrarPayload();
}

async function iniciarSesion(e) {
  e.preventDefault();

  const usuario   = $('usuario').value;
  const contrasena = $('contrasena').value;

  const r    = await fetch('/api/login', {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ usuario, contraseña: contrasena }),
  });
  const data = await r.json();

  if (r.ok && data.token) {
    tokenActual = data.token;
    bitacora('POST', '/api/login', { usuario: data.usuario, tokenCorto: data.tokenCorto }, true);
    await refrescarEstado();
  } else {
    bitacora('POST', '/api/login', data, false);
  }
}

// ── Botones de demo ───────────────────────────────────────────────────────────

document.querySelectorAll('[data-url]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const url    = btn.dataset.url;
    const metodo = btn.dataset.metodo || 'GET';

    const r = await fetch(url, {
      method: metodo,
      headers: cabeceras(),
    });
    const data = await r.json();

    // Algunas rutas devuelven un token actualizado (perfil, visita)
    if (data.token) tokenActual = data.token;

    bitacora(metodo, url, data, r.ok);
    await refrescarEstado();
  });
});

// ── Tabla de sesiones del servidor ────────────────────────────────────────────

async function actualizarTablaSesiones() {
  const r    = await fetch('/api/diagnostico/sesiones', { headers: cabeceras() });
  const data = await r.json();

  $('donde').textContent = `Almacén: ${data.almacen}${data.nota ? ' — ' + data.nota : ''}`;

  const tbody = $('tabla-sesiones');
  if (!data.sesiones || data.sesiones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">(sin sesiones)</td></tr>';
    return;
  }

  tbody.innerHTML = data.sesiones.map((s) => `
    <tr class="${s.esLaTuya ? 'mi-sesion' : ''}">
      <td>${s.tokenCorto}</td>
      <td>${s.usuario} ${s.esLaTuya ? '← tú' : ''}</td>
      <td>${s.visitas}</td>
      <td>${s.expira ? new Date(s.expira).toLocaleTimeString() : '—'}</td>
    </tr>
  `).join('');
}

// ── Inicializar ───────────────────────────────────────────────────────────────

$('form-login').addEventListener('submit', iniciarSesion);
$('btn-refrescar').addEventListener('click', refrescarEstado);
$('btn-sesiones').addEventListener('click', actualizarTablaSesiones);

// Cargar config
fetch('/api/config')
  .then((r) => r.json())
  .then((data) => { $('config').textContent = JSON.stringify(data, null, 2); });

// Estado inicial
refrescarEstado();
actualizarTablaSesiones();
