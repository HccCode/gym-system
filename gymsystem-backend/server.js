import express from 'express';
import cors from 'cors';
import pool from './db.js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// ==========================================
// MÓDULO: MIEMBLES
// ==========================================
app.get('/api/miembros', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM miembros ORDER BY id DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/miembros', async (req, res) => {
  const { matricula, nombre, telefono, email, foto, estado, fechaRegistro, fechaVencimiento } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO miembros (matricula, nombre, telefono, email, foto, estado, fecha_registro, fecha_vencimiento) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [matricula, nombre, telefono, email, foto, estado || 'Inactivo', fechaRegistro, fechaVencimiento]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/miembros/:id', async (req, res) => {
  const { nombre, telefono, email, foto, estado, fechaVencimiento } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE miembros 
       SET nombre = COALESCE($1, nombre), 
           telefono = COALESCE($2, telefono), 
           email = COALESCE($3, email), 
           foto = COALESCE($4, foto), 
           estado = COALESCE($5, estado), 
           fecha_vencimiento = COALESCE($6, fecha_vencimiento) 
       WHERE id = $7 RETURNING *`,
      [nombre, telefono, email, foto, estado, fechaVencimiento, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Miembro no encontrado" });
    res.json(rows[0]);
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

app.put('/api/productos/:id', async (req, res) => {
  const { nombre, categoria, precio, stock } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE productos SET nombre = $1, categoria = $2, precio = $3, stock = $4 WHERE id = $5 RETURNING *",
      [nombre, categoria, precio, stock, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/productos/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM productos WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MÓDULO: PLANES (CONECTADO A POSTGRESQL)
// ==========================================
app.get('/api/planes', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM planes WHERE active = true ORDER BY precio ASC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/planes', async (req, res) => {
  const { nombre, precio, duracionDias, active } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO planes (nombre, precio, duracion_dias, active) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, precio, duracionDias, active !== undefined ? active : true]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/planes/:id', async (req, res) => {
  const { nombre, precio, duracionDias, active } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE planes SET nombre = $1, precio = $2, duracion_dias = $3, active = $4 WHERE id = $5 RETURNING *",
      [nombre, precio, duracionDias, active !== undefined ? active : true, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Plan no encontrado" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/planes/:id', async (req, res) => {
  try {
    // Soft delete: Se desactiva para no romper relaciones ni históricos contables
    await pool.query("UPDATE planes SET active = false WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MÓDULO: USUARIOS (ACCESOS Y PERMISOS)
// ==========================================
app.get('/api/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM usuarios ORDER BY id ASC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/usuarios', async (req, res) => {
  const { nombre, rol, pin, permisos } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO usuarios (nombre, rol, pin, permisos) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, rol, pin, permisos]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { nombre, rol, pin, permisos } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE usuarios SET nombre = $1, rol = $2, pin = $3, permisos = $4 WHERE id = $5 RETURNING *",
      [nombre, rol, pin, permisos, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM usuarios WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MÓDULO MAESTRO: CAJA (FINANZAS REGISTRADAS)
// ==========================================
app.get('/api/caja/movimientos', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM movimientos_caja WHERE corte_id IS NULL ORDER BY hora DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/caja/movimientos', async (req, res) => {
  const { id, tipo, descripcion, total, hora } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO movimientos_caja (id, tipo, descripcion, total, hora) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [id, tipo, descripcion, total, hora]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/caja/cortes', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM cortes_caja ORDER BY fecha DESC, hora DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/caja/cortes', async (req, res) => {
  const { id, fecha, hora, totalMovimientos, totalVentas, totalIngresos } = req.body;
  try {
    await pool.query("BEGIN"); 
    
    const { rows } = await pool.query(
      "INSERT INTO cortes_caja (id, fecha, hora, total_movimientos, total_ventas, total_ingresos) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [id, fecha, hora, totalMovimientos, totalVentas, totalIngresos]
    );

    await pool.query("UPDATE movimientos_caja SET corte_id = $1 WHERE corte_id IS NULL", [id]);
    
    await pool.query("COMMIT"); 
    res.status(201).json(rows[0]);
  } catch (err) {
    await pool.query("ROLLBACK"); 
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Backend en el puerto ${PORT}`);
});