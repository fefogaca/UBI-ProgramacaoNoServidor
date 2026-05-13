const mongoose = require("mongoose");
const { Alert } = require("../models/alert.model");
const { HttpError } = require("../utils/http-error");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_STATUS = ["ativo", "resolvido", "ignorado"];
const VALID_SEVERITY = ["informativo", "aviso", "critico"];

function ensureValidId(id, label = "alertId") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} invalido.`);
  }
}

async function listAlerts(req, res) {
  const query = {};
  if (req.query.batchId) {
    ensureValidId(req.query.batchId, "batchId");
    query.batchId = req.query.batchId;
  }
  if (req.query.status) {
    if (!VALID_STATUS.includes(req.query.status)) {
      throw new HttpError(400, "VALIDATION_ERROR", "status invalido.");
    }
    query.status = req.query.status;
  }
  if (req.query.severity) {
    if (!VALID_SEVERITY.includes(req.query.severity)) {
      throw new HttpError(400, "VALIDATION_ERROR", "severity invalido.");
    }
    query.severity = req.query.severity;
  }

  const alerts = await Alert.find(query).sort({ createdAt: -1 });
  return res.status(200).json(alerts);
}

async function getAlertById(req, res) {
  ensureValidId(req.params.alertId);
  const alert = await Alert.findById(req.params.alertId);
  if (!alert) throw new HttpError(404, "NOT_FOUND", "Alerta nao encontrado.");
  return res.status(200).json(alert.toJSON());
}

async function resolveAlert(req, res) {
  ensureValidId(req.params.alertId);
  const actor = req.header("x-actor-id") || "system";
  const alert = await Alert.findByIdAndUpdate(
    req.params.alertId,
    {
      status: "resolvido",
      resolvedAt: new Date(),
      resolvedBy: actor,
    },
    { new: true }
  );
  if (!alert) throw new HttpError(404, "NOT_FOUND", "Alerta nao encontrado.");

  await recordAuditLog({
    actorId: actor,
    action: "alert.resolve",
    entityType: "Alert",
    entityId: alert._id,
  });

  return res.status(200).json(alert.toJSON());
}

async function ignoreAlert(req, res) {
  ensureValidId(req.params.alertId);
  const { reason } = req.body;
  if (!reason || reason.trim().length < 3) {
    throw new HttpError(400, "VALIDATION_ERROR", "reason e obrigatorio (minimo 3 caracteres).");
  }
  const actor = req.header("x-actor-id") || "system";
  const alert = await Alert.findByIdAndUpdate(
    req.params.alertId,
    {
      status: "ignorado",
      ignoredReason: reason.trim(),
      resolvedBy: actor,
      resolvedAt: new Date(),
    },
    { new: true }
  );
  if (!alert) throw new HttpError(404, "NOT_FOUND", "Alerta nao encontrado.");

  await recordAuditLog({
    actorId: actor,
    action: "alert.ignore",
    entityType: "Alert",
    entityId: alert._id,
    metadata: { reason: reason.trim() },
  });

  return res.status(200).json(alert.toJSON());
}

module.exports = {
  listAlerts,
  getAlertById,
  resolveAlert,
  ignoreAlert,
};
