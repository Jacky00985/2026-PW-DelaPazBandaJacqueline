const express = require('express');
const app = express();

app.use(express.json());

const PORT = 4000;  //Exprees suele ser entre 3000 y 4000//

// Ejemplo de una peticion por medio de ruta principal GET//
app.get('/saludo', (req, res) => {  // Get - Peticion ,  con una request y un respond//

    res.json({mensaje: ' hola esto es una prueba en GET'});
});  

app.post('/eco', (req, res)=>{// POST - cambio como nuevo registro //

    const {texto} = req.body;
    if(!texto){
        return res.status(400).json({error: 'El texto es obligatorio'});

    }
    res.status(201).json({eco:texto});

});

app.listen(PORT, () =>{
    console.log(`Sevidor escuchando en el puerto: ${PORT}`);
});