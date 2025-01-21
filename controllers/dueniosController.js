const { poolPromise, sql } = require("../services/db");


const getDuenios = async (req, res) => {
  try {
    const pool = await poolPromise;
    let query = "SELECT id_duenio, nombre, telefono, correo_electronico, fecha_creacion FROM duenios";
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createDuenio = async (req, res) => {
  try {
    const { nombre, telefono, correo_electronico } = req.body;
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("nombre", sql.VarChar, nombre)
      .input("telefono", sql.VarChar, telefono)
      .input("correo_electronico", sql.VarChar, correo_electronico)
      .query(
        "INSERT INTO duenios (nombre, telefono, correo_electronico, fecha_creacion) OUTPUT INSERTED.id_duenio VALUES (@nombre, @telefono, @correo_electronico, GETDATE())"
      );
    res.status(201).json({
      id: result.recordset[0].id_duenio,
      message: "Dueño ingresado correctamente."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteDuenio = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = parseInt(id);
    if (isNaN(parsed)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const pool = await poolPromise;
    const resut = await pool
      .request()
      .input("id", sql.Int, parsed)
      .query("DELETE FROM mascotas WHERE id_duenio = @id");
    const result = await pool
      .request()
      .input("id", sql.Int, parsed)
      .query("DELETE FROM citas WHERE id_duenio = @id");
    const result2 = await pool
      .request()
      .input("id", sql.Int, parsed)
      .query("DELETE FROM duenios WHERE id_duenio = @id");
    if (result2.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "No se encontró al dueño con el ID proporcionado" });
    }
    await pool
      .request()
      .query("DBCC CHECKIDENT ('mascotas', RESEED, 0)");
    await pool
      .request()
      .query("DBCC CHECKIDENT ('citas', RESEED, 0)");
    await pool
      .request()
      .query("DBCC CHECKIDENT ('duenios', RESEED, 0)");
    res.status(200).json({ message: "Eliminado correctamente." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateDuenio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, correo_electronico } = req.body; 
    if (!nombre && !telefono && !correo_electronico) {
      return res.status(400).json({ message: "No se enviaron datos para actualizar." });
    }
    const pool = await poolPromise;
    const request = pool.request();
    let query = "UPDATE duenios SET";
    const updates = [];
    if (nombre) {
      updates.push(" nombre = @nombre");
      request.input("nombre", sql.VarChar, nombre);
    }
    if (telefono) {
      updates.push(" telefono = @telefono");
      request.input("telefono", sql.VarChar, telefono);
    }
    if (correo_electronico) {
      updates.push(" correo_electronico = @correo_electronico");
      request.input("correo_electronico", sql.VarChar, correo_electronico);
    }
    query += updates.join(",") + " WHERE id_duenio = @id";
    request.input("id", sql.Int, id);
    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "No se encontró al dueño con el ID proporcionado." });
    }
    res.status(200).json({ message: "Dueño actualizado correctamente." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDuenios, createDuenio, deleteDuenio, updateDuenio };
