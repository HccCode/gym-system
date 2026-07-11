import express from 'express';
import cors from 'cors';
import pool from './db.js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para permitir peticiones desde Vite en la red local
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Límite ampliado por si envías fotos Base64

// ==========================================
// RUTA 1: AUTENTICACIÓN (LOGIN)
// ==========================================
app.post('/api/login', async (req, res) => {
  const { pin } = req.body;
  
  try {
    const query = 'SELECT id, nombre, rol, permisos FROM usuarios WHERE pin = $1';
    const { rows } = await pool.query(query, [pin]);

    if (rows.length > 0) {
      res.json({ valido: true, usuario: rows[0] });
    } else {
      res.status(401).json({ valido: false, mensaje: 'PIN incorrecto' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// RUTA 2: OBTENER TODOS LOS MIEMBROS
// ==========================================
app.get('/api/miembros', async (req, res) => {
  try {
    const query = 'SELECT * FROM miembros ORDER BY nombre ASC';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener miembros:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// ==========================================
// RUTA 3: REGISTRAR UN NUEVO MIEMBRO (SIN SUSCRIPCIÓN)
// ==========================================
app.post('/api/miembros', async (req, res) => {
  const { nombre, telefono, email, foto, estado, matricula } = req.body;
  
  try {
    const query = `
      INSERT INTO miembros (matricula, nombre, telefono, email, foto, estado)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [matricula, nombre, telefono, email, foto, estado];
    const { rows } = await pool.query(query, values);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error al crear miembro:', error);
    res.status(500).json({ error: 'Error al guardar el miembro' });
  }
});

// ==========================================
// RUTA 4: CATÁLOGO DE PLANES
// ==========================================
app.get('/api/planes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM planes WHERE active = true ORDER BY precio ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los planes' });
  }
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 Escuchando peticiones de la red local...`);
});