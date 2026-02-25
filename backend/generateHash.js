const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'clubfama123'; // Tu contraseña
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('🔐 Hash bcrypt generado:');
  console.log(hash);
  console.log('');
  console.log('📋 Query para MongoDB Compass/Atlas:');
  console.log(`db.users.updateOne(
  { email: "admin@clubfama.com" },
  { $set: { password: "${hash}" } }
)`);
}

generateHash();
