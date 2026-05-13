const { Herb } = require("../models/herb.model");
const { HttpError } = require("../utils/http-error");

async function createHerb(req, res) {
  const { commonName, scientificName, notes } = req.body;

  if (!commonName || !scientificName) {
    throw new HttpError(400, "VALIDATION_ERROR", "Campos obrigatorios: commonName, scientificName.");
  }

  const herb = await Herb.create({
    commonName,
    scientificName,
    notes,
  });

  return res.status(201).json(herb.toJSON());
}

module.exports = {
  createHerb,
};
