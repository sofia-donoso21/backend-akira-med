const express = require('express');
const router = express.Router();
const mascotasController = require("../controllers/mascotasController");

router.get("/", mascotasController.getMascotas);
router.post("/", mascotasController.createMascota);
router.put("/:id", mascotasController.updateMascota);
router.delete("/:id", mascotasController.deleteMascota);

module.exports = router;

