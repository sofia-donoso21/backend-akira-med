const express = require('express');
const router = express.Router();
const bitacoraController = require("../controllers/bitacoraController");

router.get("/:id", bitacoraController.getEventos);
router.post("/", bitacoraController.addEvento);
router.put('/:id_evento', bitacoraController.updateEvento);
router.delete('/:id_evento', bitacoraController.deleteEvento);

module.exports = router;
