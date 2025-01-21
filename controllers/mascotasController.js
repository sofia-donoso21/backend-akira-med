const { poolPromise, sql } = require("../services/db");

const getMascotas = async (req, res) => {
  try {
    const { tipo, raza, duenio } = req.query; // Filtros
    const pool = await poolPromise;
    
    let query = "SELECT a.id_mascota, a.nombre, a.tipo, a.raza, CAST(COALESCE(a.edad, 0) AS DECIMAL(5, 2)) AS edad, CASE WHEN a.id_duenio IS NULL THEN 'Sin dueño' ELSE b.nombre  END AS nombre_duenio, a.fecha_creacion FROM mascotas a LEFT JOIN duenios b ON a.id_duenio = b.id_duenio";
    
    const filters = [];
    
    // Filtros
    if (tipo) filters.push(`a.tipo = '${tipo}'`);
    if (raza) filters.push(`a.raza = '${raza}'`);
    if (duenio) filters.push(`a.id_duenio = '${duenio}'`);

    // Si hay filtros, agregarlos a la consulta
    if (filters.length > 0) {
      query += " WHERE " + filters.join(" AND ");
    }

    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const createMascota = async (req, res) => {
  try {
    const { nombre, tipo, raza, edad, duenio } = req.body;
    const parsed  = parseInt(duenio);
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("nombre", sql.VarChar, nombre)
      .input("tipo", sql.VarChar, tipo)
      .input("raza", sql.VarChar, raza)
      .input("edad", sql.Decimal(5, 2), edad)
      .input("id_duenio", sql.Int, parsed)
      .query(
        "INSERT INTO mascotas (nombre, tipo, raza, edad, id_duenio) OUTPUT INSERTED.id_mascota VALUES (@nombre, @tipo, @raza, @edad, @id_duenio)"
      );
    res.status(201).json({ id: result.recordset[0].id_mascota });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateMascota = async (req, res) => {
  try {
    const { id } = req.params; // ID de la mascota a actualizar
    const { nombre, tipo, raza, edad } = req.body; // Datos enviados para actualizar

    // Validar que al menos un campo esté presente
    if (!nombre && !tipo && !raza && !edad) {
      return res.status(400).json({ message: "No se enviaron datos para actualizar." });
    }

    const pool = await poolPromise;
    const request = pool.request();

    // Construir dinámicamente la consulta SQL
    let query = "UPDATE mascotas SET";
    const updates = [];

    if (nombre) {
      updates.push(" nombre = @nombre");
      request.input("nombre", sql.VarChar, nombre);
    }
    if (tipo) {
      updates.push(" tipo = @tipo");
      request.input("tipo", sql.VarChar, tipo);
    }
    if (raza) {
      updates.push(" raza = @raza");
      request.input("raza", sql.VarChar, raza);
    }
    if (edad) {
      updates.push(" edad = @edad");
      request.input("edad", sql.Int, edad);
    }

    // Concatenar las actualizaciones y agregar la condición WHERE
    query += updates.join(",") + ", fecha_actualizacion = GETDATE() WHERE id_mascota = @id";
    request.input("id", sql.Int, id);

    // Ejecutar la consulta
    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "No se encontró la mascota con el ID proporcionado." });
    }

    res.status(200).json({ message: "Mascota actualizada correctamente." });
  } catch (err) {
    console.error("Error al actualizar la mascota:", err);
    res.status(500).json({ error: err.message });
  }
};


const deleteMascota = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request().input("id", sql.Int, id).query("DELETE FROM mascotas WHERE id_mascota = @id");
    res.status(200).json({ message: "Mascota eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMascotas, createMascota, updateMascota, deleteMascota };
