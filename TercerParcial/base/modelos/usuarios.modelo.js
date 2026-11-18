// Consultas a la tabla usuarios. Siempre con ? (consulta parametrizada), nunca pegando texto en el SQL.
// Consultas a la tabla usuarios. Siempre con ? (consulta parametrizada), nunca pegando texto en el SQL.
const bcrypt = require('bcryptjs');

function crearModeloUsuarios(pool) {
  // Regresa el usuario (sin el hash) si la contraseña es correcta, o null si no.
  async function verificar(usuario, contrasena) {
    // 1. Busca en MySQL al usuario por su nombre de usuario
    const [filas] = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    // 2. Si no existe ese usuario, regresa null (credenciales incorrectas)
    if (filas.length === 0) return null;

    const fila = filas[0];

    // 3. Compara la contraseña que escribió el usuario
    //    con el hash guardado en la base de datos
    const coincide = await bcrypt.compare(contrasena, fila.contrasena_hash);

    // 4. Si la contraseña es incorrecta, regresa null
    if (!coincide) return null;

    // 5. Si todo está bien, regresa el usuario SIN el hash
    //    (nunca mandamos el hash al cliente)
    const { contrasena_hash, ...datos } = fila;
    return datos;
  }

  return { verificar };
}

module.exports = { crearModeloUsuarios };
