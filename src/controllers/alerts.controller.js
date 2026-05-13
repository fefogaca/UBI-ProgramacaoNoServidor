const { Alert } = require("../models/alert.model");
const { HttpError } = require("../utils/http-error");
const { ensureObjectId, ensureEnum, ensureNonEmptyString } = require("../utils/validators");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_STATUS = ["ativo", "resolvido", "ignorado"];
const VALID_SEVERITY = ["informativo", "aviso", "critico"];

async function listAlerts(req, res) {
  const query = {};
  if (req.query.batchId) {
    ensureObjectId(req.query.batchId, "batchId");
    query.batchId = req.query.batchId;
  }
  if (req.query.status) {
    query.status = ensureEnum(req.query.status, "status", VALID_STATUS);
  }
  if (req.query.severity) {
    query.severity = ensureEnum(req.query.severity, "severity", VALID_SEVERITY);
  }

  const alerts = await Alert.find(query).sort({ createdAt: -1 });
  return res.status(200).json(alerts);
}

async function getAlertById(req, res) {
  ensureObjectId(req.params.alertId, "alertId");
  const alert = await Alert.findById(req.params.alertId);
  if (!alert) throw new HttpError(404, "NOT_FOUND", "Alerta nao encontrado.");
  return res.status(200).json(alert.toJSON());
}

async function resolveAlert(req, res) {
  ensureObjectId(req.params.alertId, "alertId");
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
  ensureObjectId(req.params.alertId, "alertId");
  const reason = ensureNonEmptyString(req.body.reason, "reason");
  if (reason.length < 3) {
    throw new HttpError(400, "VALIDATION_ERROR", "reason deve ter pelo menos 3 caracteres.");
  }
  const actor = req.header("x-actor-id") || "system";

  const alert = await Alert.findByIdAndUpdate(
    req.params.alertId,
    {
      status: "ignorado",
      ignoredReason: reason,
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
    metadata: { reason },
  });

  return res.status(200).json(alert.toJSON());
}

module.exports = {
  listAlerts,
  getAlertById,
  resolveAlert,
  ignoreAlert,
};
