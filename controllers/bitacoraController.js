const { poolPromise, sql } = require("../services/db");

const getEventos = async (req, res) => {
    try {
        const { id } = req.params;

        console.log("Id mascota:::", req.params)

        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("id", sql.Int, id)
            .query(`
          SELECT b.id_evento, b.fecha, b.descripcion, b.tipo_evento, b.estado, u.nombre AS veterinario
          FROM bitacora b
          LEFT JOIN usuarios u ON b.usuario_id = u.usuario_id
          WHERE b.id_mascota = @id
          ORDER BY b.fecha DESC
        `);

        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addEvento = async (req, res) => {
    try {
        const { id_mascota, descripcion, usuario_id, tipo_evento } = req.body;
        console.log("Body:::::", req.body);

        if (!id_mascota || !descripcion || !usuario_id || !tipo_evento) {
            return res.status(400).json({ error: "Todos los campos obligatorios deben ser completados." });
        }

        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("id_mascota", sql.Int, id_mascota)
            .input("descripcion", sql.Text, descripcion)
            .input("usuario_id", sql.Int, usuario_id)
            .input("tipo_evento", sql.VarChar, tipo_evento)
            .query(`
        INSERT INTO bitacora (id_mascota, descripcion, usuario_id, tipo_evento)
        OUTPUT INSERTED.id_evento
        VALUES (@id_mascota, @descripcion, @usuario_id, @tipo_evento)
      `);

        res.status(201).json({ id_evento: result.recordset[0].id_evento, message: "Evento registrado exitosamente en la bitácora." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateEvento = async (req, res) => {
    try {
        const { id_evento } = req.params;
        const { descripcion, tipo_evento, usuario_id, estado } = req.body;

        if (!id_evento) {
            return res.status(400).json({ error: "El ID del evento es obligatorio." });
        }

        const pool = await poolPromise;
        await pool
            .request()
            .input("id_evento", sql.Int, id_evento)
            .input("descripcion", sql.Text, descripcion || null)
            .input("tipo_evento", sql.VarChar, tipo_evento || null)
            .input("usuario_id", sql.Int, veterinario_id || null)
            .input("estado", sql.VarChar, estado || 'Activo')
            .query(`
          UPDATE bitacora
          SET descripcion = ISNULL(@descripcion, descripcion),
              tipo_evento = ISNULL(@tipo_evento, tipo_evento),
              id_usuario = ISNULL(@usuario_id, id_usuario),
              estado = ISNULL(@estado, estado)
          WHERE id_evento = @id_evento
        `);

        res.status(200).json({ message: "Evento actualizado exitosamente." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteEvento = async (req, res) => {
    try {
        const { id_evento } = req.params;

        if (!id_evento) {
            return res.status(400).json({ error: "El ID del evento es obligatorio." });
        }

        const pool = await poolPromise;
        await pool
            .request()
            .input("id_evento", sql.Int, id_evento)
            .query(`
          DELETE FROM bitacora
          WHERE id_evento = @id_evento
        `);

        res.status(200).json({ message: "Evento eliminado exitosamente." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { addEvento, getEventos, updateEvento, deleteEvento };