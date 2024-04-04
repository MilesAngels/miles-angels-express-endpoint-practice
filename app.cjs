const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

require('dotenv').config();

const port = process.env.PORT;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

app.use(async function (req, res, next) {
    try {
        req.db = await pool.getConnection();
        req.db.connection.config.namedPlaceholders = true;

        await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
        await req.db.query(`SET time_zone = '-8:00'`);

        await next();

        req.db.release();
    } catch (err) {
        console.log(err);

        if (req.db) req.db.release();
        throw err;
    }
});

app.use(cors());

app.use(express.json());

// GET CARS
app.get('/car', async function (req, res) {
    try {

        const [cars] = await req.db.query(`SELECT * FROM car`)
        res.json({ cars });
    } catch (err) {
        res.json({ success: false, message: err, data: null })

    }
});

app.use(async function (req, res, next) {
    try {
        console.log('Middleware after the get /cars');

        await next();

    } catch (err) {

    }
});

// POST
app.post('/car', async function (req, res) {
    try {
        const { make, model, year } = req.body;
        const [insert] = await req.db.query(`
            INSERT INTO car (make, model, year)
            VALUES ("Honda", "Civic", 2020)
            `, [make, model, year]);

        res.json({ success: true, message: 'Car successfully created', data: { make, model, year } });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Error creating car', data: null });
    }
});


// DELETE
app.delete('/car/:id', async function (req, res) {
    try {
        const { id } = req.params;
        await req.db.query(`UPDATE car SET deleted_flag = 1 WHERE id = 8`, { id })
        console.log('req.params /cars/:id', req.params)

        res.json({ success: true, message: 'successfully deleted'})
    } catch (err) {
        res.json({ success: false, message: err, data: null })
    }
});

app.put('/car/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const { make, model, year } = req.body;

        await req.db.query(
            `UPDATE car SET make = 'Volvo', model = 'None', year = 2021 WHERE id = 7`,
            [make, model, year, id]
        );

        res.json({ success: true, message: 'Car successfully updated', id: {id} });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Error updating car', data: null });
    }
});


// Start the Express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});