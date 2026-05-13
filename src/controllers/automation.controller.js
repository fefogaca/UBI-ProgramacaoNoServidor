const { AutomationSetting } = require("../models/automation-setting.model");
const { HttpError } = require("../utils/http-error");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_MODES = ["manual", "automatico"];

async function getMode(req, res) {
  let setting = await AutomationSetting.findOne({ key: "global" });
  if (!setting) {
    setting = await AutomationSetting.create({ key: "global", mode: "manual" });
  }
  return res.status(200).json({ mode: setting.mode });
}

async function updateMode(req, res) {
  const { mode } = req.body;
  if (!mode || !VALID_MODES.includes(mode)) {
    throw new HttpError(400, "VALIDATION_ERROR", "mode deve ser manual ou automatico.");
  }

  const setting = await AutomationSetting.findOneAndUpdate(
    { key: "global" },
    { mode },
    { new: true, upsert: true }
  );

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "automation.mode.update",
    entityType: "AutomationSetting",
    entityId: setting._id,
    metadata: { mode },
  });

  return res.status(200).json({ mode: setting.mode });
}

module.exports = {
  getMode,
  updateMode,
};
