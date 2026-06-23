/**
 * @file clientes.model.js
 * @description Modelo de BD. Define las consultas SQL e interacción con la base de datos directa. ¡Ojo con las inyecciones SQL!
 * @date 8 de abril de 2026
 * 
 * Este componente centraliza la lógica respectiva para evitar código espagueti.

 */
const db = require('../config/db.js');

const Cliente = {
  obtenerTodos: async () => {
    try {
      const [resultados] = await db.query('SELECT *, COALESCE(ACTIVO, 1) AS ACTIVO FROM CLIENTES ORDER BY ID_CLIENTE DESC');
      return resultados;
    } catch (err) {
      throw new Error('Error al obtener clientes: ' + err.message);
    }
  },

  buscar: async (termino) => {
    const sql = `
      SELECT *, COALESCE(ACTIVO, 1) AS ACTIVO FROM CLIENTES 
      WHERE NOMBRE LIKE ? OR APELLIDO LIKE ? OR TELEFONO LIKE ? OR EMAIL LIKE ?
      ORDER BY ID_CLIENTE DESC
    `;
    const likeTerm = `%${termino}%`;
    try {
      const [resultados] = await db.query(sql, [likeTerm, likeTerm, likeTerm, likeTerm]);
      return resultados;
    } catch (err) {
      throw new Error('Error al buscar clientes: ' + err.message);
    }
  },

  agregar: async (datos) => {
    // Asumimos que ID_CLIENTE es Auto Increment.
    // OJO: No enviamos ID_VENDEDOR porque no está en tu formulario HTML.
    const sql = 'INSERT INTO CLIENTES (NOMBRE, APELLIDO, TELEFONO, EMAIL, CEDULA) VALUES (?, ?, ?, ?, ?)';
    try {
      const [result] = await db.query(sql, datos);
      return result;
    } catch (err) {
      throw new Error('Error al agregar cliente: ' + err.message);
    }
  },

  actualizar: async (datos) => {
    const sql = 'UPDATE CLIENTES SET NOMBRE=?, APELLIDO=?, TELEFONO=?, EMAIL=?, CEDULA=? WHERE ID_CLIENTE=?';
    try {
      await db.query(sql, datos);
    } catch (err) {
      throw new Error('Error al actualizar cliente: ' + err.message);
    }
  },

  eliminar: async (id) => {
    const sql = 'UPDATE CLIENTES SET ACTIVO = 0 WHERE ID_CLIENTE=?';
    try {
      await db.query(sql, [id]);
    } catch (err) {
      throw new Error('Error al dar de baja el cliente: ' + err.message);
    }
  },

  activar: async (id) => {
    const sql = 'UPDATE CLIENTES SET ACTIVO = 1 WHERE ID_CLIENTE=?';
    try {
      await db.query(sql, [id]);
    } catch (err) {
      throw new Error('Error al dar de alta el cliente: ' + err.message);
    }
  },

  // LLAMADO A PROCEDIMIENTO ALMACENADO sp_NuevoCliente
  agregarRapido: async (nombre, apellido, telefono, email, id_empleado, cedula) => {
    try {
      const sql = 'CALL sp_NuevoCliente(?, ?, ?, ?, ?, ?)';
      const [result] = await db.query(sql, [nombre, apellido, telefono, email, id_empleado, cedula]);
      return result;
    } catch (err) {
      throw new Error('Error al registrar cliente rápido: ' + err.message);
    }
  }
};

module.exports = Cliente;