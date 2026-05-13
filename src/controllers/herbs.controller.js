const mongoose = require("mongoose");
const { Herb } = require("../models/herb.model");
const { HttpError } = require("../utils/http-error");
const { recordAuditLog } = require("../services/audit-log.service");

function ensureValidId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "VALIDATION_ERROR", "Identificador invalido.");
  }
}

async function listHerbs(req, res) {
  const herbs = await Herb.find().sort({ commonName: 1 });
  return res.status(200).json(herbs);
}

async function createHerb(req, res) {
  const { commonName, scientificName, notes } = req.body;

  if (!commonName || !scientificName) {
    throw new HttpError(400, "VALIDATION_ERROR", "Campos obrigatorios: commonName, scientificName.");
  }

  const herb = await Herb.create({ commonName, scientificName, notes });

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "herb.create",
    entityType: "Herb",
    entityId: herb._id,
    metadata: { commonName, scientificName },
  });

  return res.status(201).json(herb.toJSON());
}

async function getHerbById(req, res) {
  ensureValidId(req.params.herbId);
  const herb = await Herb.findById(req.params.herbId);
  if (!herb) {
    throw new HttpError(404, "NOT_FOUND", "Erva nao encontrada.");
  }
  return res.status(200).json(herb.toJSON());
}

async function patchHerb(req, res) {
  ensureValidId(req.params.herbId);
  const allowed = ["commonName", "scientificName", "notes"];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const herb = await Herb.findByIdAndUpdate(req.params.herbId, update, {
    new: true,
    runValidators: true,
  });

  if (!herb) {
    throw new HttpError(404, "NOT_FOUND", "Erva nao encontrada.");
  }

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "herb.update",
    entityType: "Herb",
    entityId: herb._id,
    metadata: update,
  });

  return res.status(200).json(herb.toJSON());
}

async function deleteHerb(req, res) {
  ensureValidId(req.params.herbId);
  const herb = await Herb.findByIdAndDelete(req.params.herbId);
  if (!herb) {
    throw new HttpError(404, "NOT_FOUND", "Erva nao encontrada.");
  }

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "herb.delete",
    entityType: "Herb",
    entityId: herb._id,
  });

  return res.status(204).send();
}

async function importHerbs(req, res) {
  const importId = new mongoose.Types.ObjectId().toString();

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "herb.import.queued",
    entityType: "Herb",
    entityId: importId,
  });

  return res.status(202).json({
    importId,
    status: "queued",
  });
}

module.exports = {
  listHerbs,
  createHerb,
  getHerbById,
  patchHerb,
  deleteHerb,
  importHerbs,
};
