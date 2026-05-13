const { AuditLog } = require("../models/audit-log.model");

async function recordAuditLog({ actorId, action, entityType, entityId, metadata }) {
  try {
    await AuditLog.create({
      actorId: actorId || "system",
      action,
      entityType,
      entityId: String(entityId),
      metadata: metadata || {},
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Falha a registar audit log:", error.message);
  }
}

module.exports = {
  recordAuditLog,
};
