# Manual: Conexión de un Formulario Web a una Base de Datos SQL (SQLite) mediante Node.js

Este documento detalla el proceso para establecer la conexión entre un formulario web y una base de datos. Utilizaremos SQLite por su practicidad, ya que no requiere la instalación de un motor de base de datos independiente y almacena la información en un único archivo local. La lógica del servidor estará desarrollada en JavaScript usando el entorno de Node.js.

---

## 1. ¿Cómo funciona un conector de Base de Datos?

Un conector es una librería o módulo que actúa como puente de comunicación entre nuestra aplicación en Node.js y la base de datos. Puesto que JavaScript y SQL tienen propósitos y sintaxis distintos, el conector (en este proyecto, el paquete `sqlite3`) se encarga de mediar entre ambos.

Sus funciones principales son:

1. Establecer y mantener la conexión con el archivo de la base de datos.
2. Recibir los parámetros definidos en el servidor (como los valores capturados de un formulario web).
3. Interpretar las instrucciones y enviar consultas SQL válidas al motor de base de datos.
4. Ejecutar las consultas y, cuando corresponde, devolver los resultados en un formato que JavaScript pueda procesar de forma nativa, como un arreglo de objetos.

---

## 2. Preparación del entorno

Antes de desarrollar el código, es necesario inicializar el proyecto en Node.js e instalar las dependencias requeridas. Desde la terminal, ubicados en el directorio del proyecto, se deben ejecutar los siguientes comandos:

```bash
npm init -y
npm install express sqlite3

```

Este paso nos proporciona `express` para la creación del servidor web y `sqlite3` para gestionar la conexión con la base de datos.

---

## 3. Estructura del Formulario Web (HTML)

Para permitir el ingreso de datos, requerimos una interfaz en HTML. Es fundamental prestar atención a la configuración de la etiqueta `<form>` y al uso del atributo `name` en cada campo de entrada, ya que esto determina cómo el servidor identificará la información.

Se debe crear un archivo llamado `index.html` con el siguiente contenido:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registro de Biblioteca</title>
</head>
<body>
    <h1>Agregar Libro</h1>
    
    <!-- El atributo action define la ruta de destino y el método POST la forma de envío -->
    <form action="/agregar" method="POST">
        <label>Libro:</label>
        <input type="text" name="libro" required><br>

        <label>Autor:</label>
        <input type="text" name="autor" required><br>

        <label>Tema:</label>
        <input type="text" name="tema" required><br>

        <label>Precio:</label>
        <input type="number" name="precio" step="0.01" required><br>

        <button type="submit">Guardar en Base de Datos</button>
    </form>
</body>
</html>

```

En este formulario, `action="/agregar"` indica la ruta específica del servidor que procesará los datos, mientras que `method="POST"` asegura que la información se envíe en el cuerpo de la petición de forma segura.

---

## 4. Configuración del Servidor y Base de Datos (Node.js)

El siguiente paso es crear el archivo principal del servidor, al que llamaremos `index.js`. Este script tiene la responsabilidad de levantar el servicio web, asegurar la existencia de la base de datos y su tabla, y manejar las rutas para insertar y extraer la información.

```javascript
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Configuración para procesar los datos enviados desde formularios HTML
app.use(express.urlencoded({ extended: true }));

// 1. Inicialización del conector de la base de datos
// Si el archivo biblioteca.db no existe en el directorio, el conector lo generará de forma automática.
const db = new sqlite3.Database('./biblioteca.db', (err) => {
    if (err) {
        console.error('Error en la conexión a la base de datos:', err.message);
    } else {
        console.log('Conexión establecida con SQLite.');
    }
});

// 2. Creación de la estructura de datos (Tabla)
// db.serialize garantiza que las consultas se ejecuten de manera secuencial.
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS libros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT,
            autor TEXT,
            tema TEXT,
            precio REAL
        )
    `);
});

// Ruta principal para proveer el formulario al usuario
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. Proceso para insertar información en la Base de Datos
// Se procesa la petición POST enviada desde el formulario HTML
app.post('/agregar', (req, res) => {
    // Se extraen los valores a partir de los atributos "name" del formulario
    const { libro, autor, tema, precio } = req.body;

    // Se define la consulta SQL. El uso de signos de interrogación previene inyecciones SQL.
    const query = `INSERT INTO libros (titulo, autor, tema, precio) VALUES (?, ?, ?, ?)`;
    
    // Se ejecuta la consulta pasando el arreglo de valores correspondientes
    db.run(query, [libro, autor, tema, precio], function(err) {
        if (err) {
            return res.status(500).send('Se produjo un error al guardar el registro.');
        }
        res.send('Registro guardado correctamente. <a href="/">Volver</a> <br> <a href="/ver-datos">Consultar registros</a>');
    });
});

// 4. Proceso para extraer información de la Base de Datos
// Ruta destinada a visualizar los datos almacenados
app.get('/ver-datos', (req, res) => {
    const query = `SELECT * FROM libros`;
    
    // db.all recupera todas las filas que coinciden con la consulta
    db.all(query, [], (err, filas) => {
        if (err) {
            return res.status(500).send('Error al obtener los datos.');
        }
        
        // Los resultados se devuelven en formato JSON
        res.json(filas);
    });
});

// Inicialización del puerto de escucha del servidor
app.listen(3000, () => {
    console.log('El servidor está en ejecución en http://localhost:3000');
});

```

### Resumen de las operaciones SQL implementadas:

* **Para insertar datos (`INSERT INTO`):** Implementado en el bloque `app.post`. Esta instrucción toma los datos estructurados que recibimos a través del objeto `req.body` y los inserta como un nuevo registro en la tabla especificada.
* **Para extraer datos (`SELECT * FROM`):** Utilizado en el bloque `app.get('/ver-datos')`. Esta consulta solicita al motor de la base de datos devolver la totalidad de los registros existentes en la tabla `libros`, los cuales son procesados y mostrados posteriormente.

Para comprobar el funcionamiento del código, basta con guardar ambos archivos y ejecutar el comando `node index.js` en la terminal. Finalmente, el formulario estará disponible accediendo a `http://localhost:3000` desde cualquier navegador web.
