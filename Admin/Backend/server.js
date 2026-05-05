/*server.js*/

const app = require('./app');  // Importamos la app configurada
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  //console.log("DEBUG: Server started with updated code.");
});