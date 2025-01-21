const { poolPromise, sql } = require("../services/db");

const getCitas = async (req, res) => {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        c.id_cita, 
        c.fecha, 
        c.descripcion, 
        c.estado, 
        c.correo_duenio, 
        c.fecha_creacion, 
        c.fecha_modificacion, 
        m.nombre AS nombre_mascota, 
        d.nombre AS nombre_duenio, 
        u.nombre AS nombre_veterinario
      FROM citas c
      LEFT JOIN mascotas m ON c.id_mascota = m.id_mascota
      LEFT JOIN duenios d ON c.id_duenio = d.id_duenio
      LEFT JOIN usuarios u ON c.id_usuario = u.usuario_id
      ORDER BY c.fecha ASC
    `;

    const result = await pool.request().query(query);
    console.log(result);
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCitaById = async (req, res) => {
  try {
    const { id_cita } = req.params;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_cita", sql.Int, id_cita)
      .query(`
        SELECT 
          c.id_cita, 
          c.fecha, 
          c.descripcion, 
          c.estado, 
          c.correo_duenio, 
          c.fecha_creacion, 
          c.fecha_modificacion, 
          m.nombre AS nombre_mascota, 
          d.nombre AS nombre_duenio, 
          u.nombre AS nombre_veterinario
        FROM citas c
        LEFT JOIN mascotas m ON c.id_mascota = m.id_mascota
        LEFT JOIN duenios d ON c.id_duenio = d.id_duenio
        LEFT JOIN usuarios u ON c.id_usuario = u.usuario_id
        WHERE c.id_cita = @id_cita;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCita = async (req, res) => {
  try {
    const { fecha, hora, descripcion, correo_duenio, id_mascota, id_duenio, id_usuario } = req.body;

    if (!fecha || !hora || !descripcion || !correo_duenio || !id_mascota || !id_duenio || !id_usuario) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("fecha", sql.DateTime, `${fecha} ${hora}`)
      .input("descripcion", sql.VarChar, descripcion)
      .input("correo_duenio", sql.VarChar, correo_duenio)
      .input("id_mascota", sql.Int, id_mascota)
      .input("id_duenio", sql.Int, id_duenio)
      .input("id_usuario", sql.Int, id_usuario)
      .query(`
        INSERT INTO citas (fecha, descripcion, estado, id_usuario, id_duenio, id_mascota, correo_duenio, fecha_creacion)
        OUTPUT INSERTED.id_cita
        VALUES (@fecha, @descripcion, 'Creada', @id_usuario, @id_duenio, @id_mascota, @correo_duenio, GETDATE())
      `);

    res.status(201).json({ id_cita: result.recordset[0].id_cita, message: "Cita creada exitosamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const updateCita = async (req, res) => {
  try {
    const { id_cita } = req.params;
    const { fecha, descripcion, estado, correo_duenio } = req.body;

    if (!id_cita) {
      return res.status(400).json({ error: "El ID de la cita es obligatorio." });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("id_cita", sql.Int, id_cita)
      .input("fecha", sql.DateTime, fecha || null)
      .input("descripcion", sql.VarChar, descripcion || null)
      .input("estado", sql.VarChar, estado || null)
      .input("correo_duenio", sql.VarChar, correo_duenio || null)
      .query(`
        UPDATE citas
        SET fecha = ISNULL(@fecha, fecha),
            descripcion = ISNULL(@descripcion, descripcion),
            estado = ISNULL(@estado, estado),
            correo_duenio = ISNULL(@correo_duenio, correo_duenio),
            fecha_modificacion = GETDATE()
        WHERE id_cita = @id_cita
      `);

    res.status(200).json({ message: "Cita actualizada exitosamente." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCita = async (req, res) => {
  try {
    const { id_cita } = req.params;

    if (!id_cita) {
      return res.status(400).json({ error: "El ID de la cita es obligatorio." });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("id_cita", sql.Int, id_cita)
      .query(`
        DELETE FROM citas
        WHERE id_cita = @id_cita
      `);

    res.status(200).json({ message: "Cita eliminada exitosamente." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getCitas,
  getCitaById,
  createCita,
  updateCita,
  deleteCita
};
