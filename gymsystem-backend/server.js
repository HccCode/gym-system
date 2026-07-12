import express from 'express';
import cors from 'cors';
import pool from './db.js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// ==========================================
// MÓDULO: MIEMBROS
// ==========================================
app.get('/api/miembros', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM miembros ORDER BY id DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/miembros', async (req, res) => {
  const { matricula, nombre, telefono, email, foto, estado } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO miembros (matricula, nombre, telefono, email, foto, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [matricula, nombre, telefono, email, foto, estado || 'Inactivo']
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/miembros/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM miembros WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MÓDULO: PRODUCTOS (INVENTARIO)
// ==========================================
app.get('/api/productos', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM productos ORDER BY categoria, nombre");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/productos', async (req, res) => {
  const { nombre, categoria, precio, stock } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO productos (nombre, categoria, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, categoria, precio, stock]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/productos/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM productos WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MÓDULO: PLANES
// ==========================================
app.get('/api/planes', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM planes WHERE active = true ORDER BY precio ASC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Backend en el puerto ${PORT}`);
});