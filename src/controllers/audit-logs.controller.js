const { AuditLog } = require("../models/audit-log.model");

async function listAuditLogs(req, res) {
  const query = {};
  if (req.query.actorId) query.actorId = req.query.actorId;
  if (req.query.from || req.query.to) {
    query.createdAt = {};
    if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
  }
  const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(500);
  return res.status(200).json(logs);
}

module.exports = {
  listAuditLogs,
};
