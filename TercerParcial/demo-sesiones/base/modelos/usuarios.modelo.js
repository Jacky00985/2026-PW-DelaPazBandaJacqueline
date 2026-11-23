// Consultas a la tabla usuarios. Siempre con ? (consulta parametrizada), nunca pegando texto en el SQL.
const bcrypt = require('bcryptjs');

function crearModeloUsuarios(pool) {
  // Regresa el usuario (sin el hash) si la contraseña es correcta, o null si no.
  async function verificar(usuario, contrasena) {
    // Paso 1 — buscar el usuario en la BD
    const [filas] = await pool.query(
      'SELECT id, usuario, nombre, rol, contrasena_hash FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    if (filas.length === 0) return null; // usuario no existe

    const fila = filas[0];

    // Paso 2 — comparar contraseña con el hash guardado en MySQL
    const correcta = await bcrypt.compare(contrasena, fila.contrasena_hash);
    if (!correcta) return null;

    // Regresamos los datos del usuario SIN el hash
    return {
      id:      fila.id,
      usuario: fila.usuario,
      nombre:  fila.nombre,
      rol:     fila.rol,
    };
  }

  return { verificar };
}

module.exports = { crearModeloUsuarios };
