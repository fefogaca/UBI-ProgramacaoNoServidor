const mongoose = require("mongoose");
const { Measurement } = require("../models/measurement.model");
const { Batch } = require("../models/batch.model");
const { HttpError } = require("../utils/http-error");
const { recordAuditLog } = require("../services/audit-log.service");
const { generateAlertsForMeasurement } = require("../services/alert-generation.service");

function ensureValidId(id, label = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} invalido.`);
  }
}

async function listMeasurements(req, res) {
  const query = {};
  if (req.query.batchId) {
    ensureValidId(req.query.batchId, "batchId");
    query.batchId = req.query.batchId;
  }
  if (req.query.from || req.query.to) {
    query.measuredAt = {};
    if (req.query.from) query.measuredAt.$gte = new Date(req.query.from);
    if (req.query.to) query.measuredAt.$lte = new Date(req.query.to);
  }
  const measurements = await Measurement.find(query).sort({ measuredAt: -1 });
  return res.status(200).json(measurements);
}

async function createMeasurement(req, res) {
  const { batchId, temperature, humidity, luminosity, measuredAt, source, sensorId } = req.body;
  if (
    !batchId ||
    typeof temperature !== "number" ||
    typeof humidity !== "number" ||
    typeof luminosity !== "number" ||
    !measuredAt
  ) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Campos obrigatorios: batchId, temperature, humidity, luminosity, measuredAt."
    );
  }
  ensureValidId(batchId, "batchId");

  const batch = await Batch.findById(batchId);
  if (!batch) {
    throw new HttpError(400, "VALIDATION_ERROR", "Lote nao encontrado.");
  }

  const measurement = await Measurement.create({
    batchId,
    temperature,
    humidity,
    luminosity,
    measuredAt,
    source: source || "manual",
    sensorId: sensorId || null,
  });

  const generatedAlerts = await generateAlertsForMeasurement(measurement);

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "measurement.create",
    entityType: "Measurement",
    entityId: measurement._id,
    metadata: { batchId, alertsCreated: generatedAlerts.length },
  });

  return res.status(201).json({
    measurement: measurement.toJSON(),
    generatedAlerts,
  });
}

module.exports = {
  listMeasurements,
  createMeasurement,
};
