const { Alert } = require("../models/alert.model");
const { Batch } = require("../models/batch.model");
const { CultivationPlan } = require("../models/cultivation-plan.model");

const METRICS = [
  { key: "temperature", label: "Temperatura" },
  { key: "humidity", label: "Humidade" },
  { key: "luminosity", label: "Luminosidade" },
];

function classifySeverity(value, range) {
  const span = range.max - range.min;
  const deviation = Math.max(range.min - value, value - range.max);
  if (span <= 0) {
    return deviation > 0 ? "critico" : "informativo";
  }
  const ratio = deviation / span;
  if (ratio <= 0.1) return "informativo";
  if (ratio <= 0.3) return "aviso";
  return "critico";
}

async function generateAlertsForMeasurement(measurement) {
  const batch = await Batch.findById(measurement.batchId);
  if (!batch || !Array.isArray(batch.planIds) || batch.planIds.length === 0) {
    return [];
  }

  const plan = await CultivationPlan.findOne({
    _id: { $in: batch.planIds },
    type: "regular",
  });
  if (!plan || !plan.regularConfig) {
    return [];
  }

  const alertsToCreate = [];

  for (const { key, label } of METRICS) {
    const range = plan.regularConfig[key];
    if (!range || typeof range.min !== "number" || typeof range.max !== "number") continue;
    const value = measurement[key];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;

    if (value < range.min || value > range.max) {
      const direction = value > range.max ? "acima do limite superior" : "abaixo do limite inferior";
      alertsToCreate.push({
        batchId: measurement.batchId,
        measurementId: measurement._id,
        severity: classifySeverity(value, range),
        status: "ativo",
        message: `${label} ${value} ${direction} do plano (${range.min} - ${range.max}).`,
      });
    }
  }

  if (alertsToCreate.length === 0) return [];

  const created = await Alert.insertMany(alertsToCreate);
  return created.map((a) => a.toJSON());
}

module.exports = {
  generateAlertsForMeasurement,
  classifySeverity,
};
