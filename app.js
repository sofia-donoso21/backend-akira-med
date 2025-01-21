const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mascotasRoutes = require("./routes/mascotas");
const dueniosRoutes = require("./routes/duenios");
const usuariosRoutes = require("./routes/usuarios");
const citasRoutes = require('./routes/citas');
const bitacoraRoutes = require('./routes/bitacora');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/mascotas", mascotasRoutes);
app.use("/api/duenios", dueniosRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/bitacora", bitacoraRoutes);

app.get("/", ( res) => {
  res.send("¡El servidor está funcionando correctamente!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
