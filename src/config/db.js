const mongoose = require("mongoose");

async function connectToDatabase(uri) {
  if (!uri) {
    throw new Error("MONGODB_URI nao definido.");
  }

  await mongoose.connect(uri);
}

module.exports = {
  connectToDatabase,
};
