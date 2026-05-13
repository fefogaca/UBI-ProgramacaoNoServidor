const { Measurement } = require("../models/measurement.model");
const { Batch } = require("../models/batch.model");
const { HttpError } = require("../utils/http-error");
const {
  ensureObjectId,
  ensureFiniteNumber,
  ensureDate,
  ensureEnum,
  optionalDate,
} = require("../utils/validators");
const { recordAuditLog } = require("../services/audit-log.service");
const { generateAlertsForMeasurement } = require("../services/alert-generation.service");

const VALID_SOURCES = ["manual", "sensor"];

async function listMeasurements(req, res) {
  const query = {};
  if (req.query.batchId) {
    ensureObjectId(req.query.batchId, "batchId");
    query.batchId = req.query.batchId;
  }
  const from = optionalDate(req.query.from, "from");
  const to = optionalDate(req.query.to, "to");
  if (from || to) {
    query.measuredAt = {};
    if (from) query.measuredAt.$gte = from;
    if (to) query.measuredAt.$lte = to;
  }
  const measurements = await Measurement.find(query).sort({ measuredAt: -1 });
  return res.status(200).json(measurements);
}

async function createMeasurement(req, res) {
  ensureObjectId(req.body.batchId, "batchId");
  const temperature = ensureFiniteNumber(req.body.temperature, "temperature");
  const humidity = ensureFiniteNumber(req.body.humidity, "humidity");
  const luminosity = ensureFiniteNumber(req.body.luminosity, "luminosity");
  const measuredAt = ensureDate(req.body.measuredAt, "measuredAt");
  const source = req.body.source
    ? ensureEnum(req.body.source, "source", VALID_SOURCES)
    : "manual";
  const sensorId = req.body.sensorId ? String(req.body.sensorId).trim() : null;

  const batch = await Batch.findById(req.body.batchId);
  if (!batch) {
    throw new HttpError(400, "VALIDATION_ERROR", "Lote nao encontrado.");
  }

  const measurement = await Measurement.create({
    batchId: req.body.batchId,
    temperature,
    humidity,
    luminosity,
    measuredAt,
    source,
    sensorId,
  });

  let generatedAlerts = [];
  try {
    generatedAlerts = await generateAlertsForMeasurement(measurement);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Falha ao gerar alertas para a medicao:", error.message);
  }

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "measurement.create",
    entityType: "Measurement",
    entityId: measurement._id,
    metadata: { batchId: req.body.batchId, alertsCreated: generatedAlerts.length },
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
