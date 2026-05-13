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
  if (span <= 0) return "aviso";
  const deviation = Math.max(range.min - value, value - range.max);
  if (deviation <= span * 0.1) return "informativo";
  if (deviation <= span * 0.3) return "aviso";
  return "critico";
}

async function generateAlertsForMeasurement(measurement) {
  const batch = await Batch.findById(measurement.batchId);
  if (!batch || !batch.planIds || batch.planIds.length === 0) {
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
    if (!range || typeof measurement[key] !== "number") continue;

    if (measurement[key] < range.min || measurement[key] > range.max) {
      const direction = measurement[key] > range.max ? "acima do limite superior" : "abaixo do limite inferior";
      alertsToCreate.push({
        batchId: measurement.batchId,
        measurementId: measurement._id,
        severity: classifySeverity(measurement[key], range),
        status: "ativo",
        message: `${label} ${measurement[key]} ${direction} do plano (${range.min} - ${range.max}).`,
      });
    }
  }

  if (alertsToCreate.length === 0) return [];

  const created = await Alert.insertMany(alertsToCreate);
  return created.map((a) => a.toJSON());
}

module.exports = {
  generateAlertsForMeasurement,
};
