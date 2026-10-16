const bcrypt = require(`bcryptjs`);

const usuariosModel = require('../MODELO/usuarios_modelo');
 
const {validarCorreo, validarBoleta, validarContrasena} = require
('../validacione')
//validacionrs
 
function esDuplicado(error){
    return error.code === 'ER_DUP_ENTRY' || error.code ===
    '23505';
}
 
 async function listarUsuarios(req, res){
    try{
        const usuarios = await usuariosModel,listar();
        res.json(usuarios);
    }catch{
        res.status(500).json({error: error, message});
    }
 }

 async function obtenerUsuario(req, res){
    try{
        const usuario = await usuariosModel.obtenerPorId(req.params.id);
        if(!usuario) return res.status(404).json({error :
            'Usuario no encontrado'});
            res.json(usuario);
    } catch(error){
        res.status(500).json({error: error.message});
    }
 }