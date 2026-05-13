const mongoose = require("mongoose");

function mongooseConnectOptionsFromEnv() {
  const parsed = parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || "5000", 10);
  const serverSelectionTimeoutMS = Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;

  return {
    serverSelectionTimeoutMS,
  };
}

/**
 * Liga ao MongoDB com as opções alinhadas a .env.example.
 * Espera uma URI completa incluindo o nome da BD no path (/greenherb).
 */
async function connectToDatabase(uriFromEnv = process.env.MONGODB_URI) {
  if (!uriFromEnv || typeof uriFromEnv !== "string" || !uriFromEnv.trim()) {
    throw new Error(
      "MONGODB_URI nao definido. Copia .env.example para .env e configura o URI (Docker: porta 27018)."
    );
  }

  const uri = uriFromEnv.trim();
  const options = mongooseConnectOptionsFromEnv();

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, options);
}

async function disconnectFromDatabase() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
};
