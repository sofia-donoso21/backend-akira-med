const express = require('express');
const router = express.Router();
const dueniosController = require("../controllers/dueniosController");

router.get("/", dueniosController.getDuenios);
router.post("/", dueniosController.createDuenio);
router.delete("/:id", dueniosController.deleteDuenio);
router.patch("/:id", dueniosController.updateDuenio);

module.exports = router;
