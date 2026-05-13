const mongoose = require("mongoose");
const { Herb } = require("../models/herb.model");
const { HttpError } = require("../utils/http-error");
const { ensureObjectId, ensureNonEmptyString } = require("../utils/validators");
const { recordAuditLog } = require("../services/audit-log.service");

async function listHerbs(req, res) {
  const herbs = await Herb.find().sort({ commonName: 1 });
  return res.status(200).json(herbs);
}

async function createHerb(req, res) {
  const commonName = ensureNonEmptyString(req.body.commonName, "commonName");
  const scientificName = ensureNonEmptyString(req.body.scientificName, "scientificName");
  const notes = req.body.notes ? String(req.body.notes).trim() : null;

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
  ensureObjectId(req.params.herbId, "herbId");
  const herb = await Herb.findById(req.params.herbId);
  if (!herb) {
    throw new HttpError(404, "NOT_FOUND", "Erva nao encontrada.");
  }
  return res.status(200).json(herb.toJSON());
}

async function patchHerb(req, res) {
  ensureObjectId(req.params.herbId, "herbId");
  const update = {};
  if (req.body.commonName !== undefined) {
    update.commonName = ensureNonEmptyString(req.body.commonName, "commonName");
  }
  if (req.body.scientificName !== undefined) {
    update.scientificName = ensureNonEmptyString(req.body.scientificName, "scientificName");
  }
  if (req.body.notes !== undefined) {
    update.notes = req.body.notes === null ? null : String(req.body.notes).trim();
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
  ensureObjectId(req.params.herbId, "herbId");
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
