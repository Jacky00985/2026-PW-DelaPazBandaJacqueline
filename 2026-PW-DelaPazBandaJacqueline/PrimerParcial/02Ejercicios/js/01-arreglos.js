// 01-arreglos.js
// Métodos de arreglo más usados en JS/Node — practícalos sobre esta lista
// de talleres (misma forma que la API real de CECyT9). Completa cada TODO.

const talleres = [
  { nombre: 'Introducción a Python', instructor: 'Ing. María López', cupo: 25, inscritos: 25 },
  { nombre: 'Fundamentos de Redes', instructor: 'Ing. Carlos Ramírez', cupo: 30, inscritos: 18 },
  { nombre: 'Diseño de Bases de Datos', instructor: 'Ing. Ana Torres', cupo: 20, inscritos: 20 },
  { nombre: 'Desarrollo Web con JS', instructor: 'Ing. María López', cupo: 25, inscritos: 10 },
];

function pintarTabla() {
    const tbody = document.querySelector('#tabla-talleres tbody');
    if (!tbody) return;

    tbody.innerHTML = ''; 

    talleres.forEach(taller => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${taller.nombre}</td>
            <td>${taller.instructor}</td>
            <td>${taller.cupo}</td>
            <td>${taller.inscritos}</td>
        `;
        tbody.appendChild(fila);
    });
}

// Llamar a la función pintar tabla
pintarTabla();

// TODO: forEach — imprime "- <nombre> (<inscritos>/<cupo>)" de cada taller
console.log("Aplicando un forEach para imprimir los talleres:");
talleres.forEach((t) => console.log(`- ${t.nombre} (${t.inscritos}/${t.cupo})`));

// TODO: map — crea un arreglo `nombres` solo con los nombres de los talleres
console.log("Aplicando funcion Map con solo Nombres")
const nombres = talleres.map((t) => t.nombre);
console.log(nombres);

// TODO: filter — crea un arreglo `llenos` con los talleres donde inscritos >= cupo

console.log("Aplicando la función Filter en los talleres")
const llenos = talleres.filter((t) => t.inscritos >= t.cupo);
console.log(llenos.map((t)=> t.nombre))


// TODO: find — encuentra el PRIMER taller impartido por 'Ing. María López'
const primerTallerLopez = talleres.find((t) => t.instructor === 'Ing. María López');
console.log("Primer taller impartido por Ing. María López:", primerTallerLopez);

// TODO: reduce — calcula `totalInscritos`, la suma de inscritos de todos los talleres
const totalInscritos = talleres.reduce((acumulador, t) => acumulador + t.inscritos, 0);
console.log("Total de inscritos en todos los talleres:", totalInscritos);

// TODO: filter + map encadenados — nombres de los talleres que SÍ tienen cupo disponible
const conCupoDisponibles = talleres
  .filter((t) => t.inscritos < t.cupo)
  .map((t) => t.nombre);
console.log("Talleres con cupo disponible:", conCupoDisponibles);


const formArreglos = document.getElementById('form-arreglos');
const selectOperacion = document.getElementById('operacion-arreglo');
const outputResultado = document.getElementById('resultado-arreglo');

formArreglos.addEventListener('submit', (e) => {
    e.preventDefault();
    const operacionSeleccionada = selectOperacion.value;
    let resultadoTexto = '';

    switch (operacionSeleccionada) {
        case 'forEach':
            let listaForEach = [];
            talleres.forEach((t) => listaForEach.push(`- ${t.nombre} (${t.inscritos}/${t.cupo})`));
            resultadoTexto = `<strong>forEach:</strong><br>` + listaForEach.join('<br>');
            break;

        case 'map':
            resultadoTexto = `<strong>map (Nombres):</strong> ${nombres.join(', ')}`;
            break;

        case 'filter':
            const nombresLlenos = llenos.map(t => t.nombre);
            resultadoTexto = `<strong>filter (Cupo lleno):</strong> ${nombresLlenos.length > 0 ? nombresLlenos.join(', ') : 'Ninguno'}`;
            break;

        case 'find':
            resultadoTexto = `<strong>find (Primer taller de Ing. María López):</strong> ${primerTallerLopez ? primerTallerLopez.nombre : 'No encontrado'}`;
            break;

        case 'reduce':
            resultadoTexto = `<strong>reduce (Total de inscritos):</strong> ${totalInscritos} alumnos en total.`;
            break;

        case 'encadenado':
            resultadoTexto = `<strong>filter + map (Cupo disponible):</strong> ${conCupoDisponibles.join(', ')}`;
            break;

        default:
            resultadoTexto = 'Selecciona una operación válida.';
    }

    outputResultado.innerHTML = resultadoTexto;
});