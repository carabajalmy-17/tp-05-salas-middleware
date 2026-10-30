const fs = require ("node:fs/promises");

async function leerReservas(ruta) {
    const contenido = await fs.readFile(ruta, "utf8");
    return JSON.parse(contenido)
    
}

module.exports = { leerReservas };