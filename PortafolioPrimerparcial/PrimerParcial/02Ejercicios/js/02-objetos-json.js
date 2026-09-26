// 02-objetos-json.js
// Object.keys/values/entries y JSON.stringify/parse. Completa cada TODO.

const taller = {
  nombre: 'Introducción a Python',
  instructor: 'Ing. María López',
  cupo: 25,
  inscritos: 25,
};

// TODO: Object.keys — imprime solo los nombres de las propiedades de `taller`
console.log('Manejo de keys');
console.log(Object.keys(taller));

// TODO: Object.values — imprime solo los valores
console.log('Manejo de valores en un objeto');
console.log(Object.values(taller));

// TODO: Object.entries — recorre con for..of e imprime "campo: valor" de cada propiedad
console.log('Manejo de propiedades de un objeto');
for(const [campo, valor] of Object.entries(taller)){
  console.log(`${campo}: ${valor}`);
}


// TODO: JSON.stringify — convierte `taller` a texto (guárdalo en `textoJson`) e imprímelo
console.log('Transformación de JSON a Cadena')
const textoJson = JSON.stringify(taller, null, 2);
console.log(textoJson);
console.log('tipo: ', typeof textoJson);

// TODO: JSON.parse — convierte `textoJson` de vuelta a objeto (guárdalo en `objetoDeVuelta`)
//       e imprime `objetoDeVuelta.nombre`
console.log('Ahora de JSON a Objeto')
const objetoDeVuelta = JSON.parse(textoJson);
console.log('tipo: ', typeof objetoDeVuelta);
console.log(objetoDeVuelta.nombre);

const formObjetos = document.getElementById('form-objetos'); // Asegúrate de que coincida con el ID de tu formulario en el HTML
const selectOperacionObj = document.getElementById('operacion-objeto'); // El select con las opciones de objetos
const outputResultadoObj = document.getElementById('resultado-objeto'); // El contenedor de resultados

const tallerEscolar = {
  nombre: 'Introducción a Python',
  instructor: 'Ing. María López',
  cupo: 25,
  inscritos: 25,
};

formObjetos.addEventListener('submit', (e) => {
    e.preventDefault();
    const operacionSeleccionada = selectOperacionObj.value;
    let resultadoTexto = '';

    switch (operacionSeleccionada) {
        case 'keys':
            const keys = Object.keys(tallerEscolar);
            resultadoTexto = `<strong>Object.keys (Propiedades):</strong> ${keys.join(', ')}`;
            break;

        case 'values':
            const values = Object.values(tallerEscolar);
            resultadoTexto = `<strong>Object.values (Valores):</strong> ${values.join(', ')}`;
            break;

        case 'entries':
            let listaEntries = [];
            for (const [campo, valor] of Object.entries(tallerEscolar)) {
                listaEntries.push(`- <strong>${campo}:</strong> ${valor}`);
            }
            resultadoTexto = `<strong>Object.entries (Campo y valor):</strong><br>` + listaEntries.join('<br>');
            break;

        case 'stringify':
            const textoJson = JSON.stringify(tallerEscolar, null, 2);
            resultadoTexto = `<strong>JSON.stringify (Tipo: ${typeof textoJson}):</strong><pre>${textoJson}</pre>`;
            break;

        case 'parse':
            const jsonString = JSON.stringify(tallerEscolar, null, 2);
            const objetoDeVuelta = JSON.parse(jsonString);
            resultadoTexto = `<strong>JSON.parse (Tipo: ${typeof objetoDeVuelta}):</strong> Objeto recuperado exitosamente. Propiedad nombre: "${objetoDeVuelta.nombre}"`;
            break;

        default:
            resultadoTexto = 'Selecciona una operación válida.';
    }

    outputResultadoObj.innerHTML = resultadoTexto;
});