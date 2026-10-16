

const mysql = require('mysql2/promise');

/**
 * La base de datos local la usaremos para verificar pruebas
 * internas, se budcara que deben de crear cada uno una cuenta 
 * en supabase.com y generaremos una api para conectarnos a un 
 * servicio en bd en la nube, para ello debemos configurar el archivo
 * .env
 */

const pool = mysql.createPool({   //Creamos una pool para no generar varias conexiones por usuario//
    host:'localhost',
    port:3306,
    user:'root',
    password:'n0m3l0',
    datase:'cecyt9_local',
    dateStrings: true
});