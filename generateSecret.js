const crypto = require('crypto');

// Generar una clave secreta aleatoria de 64 bytes en formato hexadecimal
const secret = crypto.randomBytes(64).toString('hex');

// Imprimir la clave secreta generada
console.log('Clave secreta generada:', secret);
