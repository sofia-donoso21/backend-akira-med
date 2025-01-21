const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

router.get('/usuarios', usuariosController.getUsuarios); 
router.post('/usuarios', usuariosController.createUsuario); 
router.put('/usuarios/:id', usuariosController.updateUsuario); 
router.delete('/usuarios/:id', usuariosController.deleteUsuario); 
router.post('/login', usuariosController.loginUsuario);

module.exports = router;
