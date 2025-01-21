const { poolPromise, sql } = require("../services/db");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

// Obtener todos los usuarios con filtros opcionales
const getUsuarios = async (req, res) => {
  try {
    const { perfil } = req.query; // Filtro por perfil
    const pool = await poolPromise;

    // Consulta SQL corregida
    let query = `
      SELECT 
        usuario_id AS id_usuario, 
        nombre, 
        email, 
        password, 
        CASE 
          WHEN perfil = 1 THEN 'Administrador' 
          WHEN perfil = 2 THEN 'Usuario' 
          WHEN perfil = 3 THEN 'Empleado' 
          ELSE 'Sin perfil' 
        END AS perfil,
        fecha_creacion 
      FROM Usuarios
    `;

    const filters = [];

    // Agregar filtro opcional
    if (perfil) {
      filters.push(`perfil = ${perfil}`); // Usa el tipo adecuado (entero en este caso)
    }

    if (filters.length > 0) {
      query += " WHERE " + filters.join(" AND ");
    }

    const result = await pool.request().query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};


// Crear un nuevo usuario
const createUsuario = async (req, res) => {
  try {
    const { nombre, email, password, perfil } = req.body;
    const pool = await poolPromise;
    const hash = crypto.createHash('sha256')
      .update(password)
      .digest('hex');  // El formato puede ser 'hex', 'base64', o 'latin1'

    // Insertar el nuevo usuario en la base de datos
    const result = await pool
      .request()
      .input("nombre", sql.NVarChar, nombre)
      .input("email", sql.NVarChar, email)
      .input("password", sql.NVarChar, hash) // Asegúrate de cifrar la contraseña antes de guardarla
      .input("perfil", sql.NVarChar, perfil)
      .query(
        "INSERT INTO Usuarios (nombre, email, password, perfil) OUTPUT INSERTED.usuario_id VALUES (@nombre, @email, @password, @perfil)"
      );
    res.status(201).json({ id: result.recordset[0].usuario_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar un usuario
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params; // ID del usuario a actualizar
    const { username, email, password, perfil } = req.body; // Nuevos datos enviados para actualizar

    // Validar que al menos un campo esté presente
    if (!username && !email && !password && !perfil) {
      return res.status(400).json({ message: "No se enviaron datos para actualizar." });
    }

    const pool = await poolPromise;
    const request = pool.request();

    // Construir dinámicamente la consulta SQL
    let query = "UPDATE Usuarios SET";
    const updates = [];

    if (username) {
      updates.push(" username = @username");
      request.input("username", sql.NVarChar, username);
    }
    if (email) {
      updates.push(" email = @email");
      request.input("email", sql.NVarChar, email);
    }
    if (password) {
      updates.push(" password = @password");
      request.input("password", sql.NVarChar, password);
    }
    if (perfil) {
      updates.push(" perfil = @perfil");
      request.input("perfil", sql.NVarChar, perfil);
    }

    // Concatenar las actualizaciones y agregar la condición WHERE
    query += updates.join(",") + ", fecha_modificacion = GETDATE() WHERE usuario_id = @id";
    request.input("id", sql.Int, id);

    // Ejecutar la consulta
    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "No se encontró el usuario con el ID proporcionado." });
    }

    res.status(200).json({ message: "Usuario actualizado correctamente." });
  } catch (err) {
    console.error("Error al actualizar el usuario:", err);
    res.status(500).json({ error: err.message });
  }
};


// Eliminar un usuario
const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params; // ID del usuario a eliminar
    const pool = await poolPromise;
    await pool.request().input("id", sql.Int, id).query("DELETE FROM Usuarios WHERE usuario_id = @id");
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Método para validar usuario y generar token
const loginUsuario = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(username)

    // Verificar que el usuario y la contraseña fueron proporcionados
    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
    }

    const pool = await poolPromise;

    const hash = crypto.createHash('sha256')
      .update(password)
      .digest('hex');

    // Verificar las credenciales del usuario
    const result = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .input("password", sql.NVarChar, hash)  // Aquí debes encriptar y verificar la contraseña
      .query("SELECT usuario_id, nombre, perfil FROM Usuarios WHERE email = @username AND password = @password");

    console.log(result)

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // Si las credenciales son correctas, generar un token
    const usuario = result.recordset[0];
    const payload = { usuario_id: usuario.usuario_id, nombre: usuario.nombre, perfil: usuario.perfil };

    // Acceder a la clave secreta desde .env
    const secretKey = process.env.JWT_SECRET;

    // Generar el token con una clave secreta (usa una clave segura y adecuada)
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    // Guardar el token en la base de datos
    const tokenResult = await pool
      .request()
      .input("usuario_id", sql.Int, usuario.usuario_id)
      .input("token", sql.NVarChar, token)
      .input("fecha_expiracion", sql.DateTime, new Date(Date.now() + 60 * 60 * 1000)) // 1 hora de expiración
      .query(
        "INSERT INTO Token (usuario_id, token, fecha_expiracion) OUTPUT INSERTED.token_id VALUES (@usuario_id, @token, @fecha_expiracion)"
      );

    // Responder con el token generado
    res.status(200).json({
      message: "Inicio de sesión exitoso",
      token: token,
      usuario_id: usuario.usuario_id,
      perfil: usuario.perfil
    });

  } catch (err) {
    console.error("Error al autenticar el usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsuarios, createUsuario, updateUsuario, deleteUsuario, loginUsuario };
