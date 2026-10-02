const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Configuración de middlewares para procesar datos del formulario y archivos estáticos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Inicialización de la base de datos SQLite
const db = new sqlite3.Database('./biblioteca.db', (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear la tabla si no existe
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS libros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            autor TEXT NOT NULL,
            tema TEXT NOT NULL,
            precio REAL NOT NULL
        )
    `);
});

// Ruta para servir la página HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para recibir los datos del formulario e insertarlos en la BD
app.post('/agregar-libro', (req, res) => {
    const { libro, autor, tema, precio } = req.body;

    const sql = `INSERT INTO libros (titulo, autor, tema, precio) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [libro, autor, tema, precio], function(err) {
        if (err) {
            console.error('Error al insertar registro:', err.message);
            return res.status(500).send('Error al guardar el libro.');
        }
        res.send('Libro registrado con éxito. <a href="/">Volver</a>');
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});