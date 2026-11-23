// Configuración de la sesión / JWT. Durante la demo vas a cambiar estos valores.
// Después de cada cambio: detén el servidor (Ctrl+C) y vuelve a correr  npm start
module.exports = {
  // Dónde guarda el servidor las sesiones:
  //  'mysql'   → en la tabla sessions de tu base de datos (sobreviven a un reinicio).
  //  'memoria' → en la memoria del servidor (se pierden al reiniciar).
  //  'jwt'     → el token viaja en el cliente; el servidor NO guarda nada.
  almacen: 'jwt',

  // Cuánto dura la sesión, en milisegundos. 10 minutos = 10 * 60 * 1000
  maxAge: 10 * 60 * 1000,

  // true: cada petición reinicia el reloj de la expiración (vence por inactividad).
  // false: vence a la hora fija, aunque el usuario siga usando la página.
  rolling: false,

  // true: al iniciar sesión el servidor cambia el id de la sesión
  //       (en JWT esto equivale a emitir un token nuevo).
  regenerarAlEntrar: true,

  // Secreto con el que se firman los JWT.
  // En producción usa una cadena larga y aleatoria (y guárdala en .env).
  jwtSecret: process.env.JWT_SECRET || 'secreto-jwt-solo-para-la-demo',
};
