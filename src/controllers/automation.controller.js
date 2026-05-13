const { AutomationSetting } = require("../models/automation-setting.model");
const { ensureEnum } = require("../utils/validators");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_MODES = ["manual", "automatico"];
const DEFAULT_MODE = "manual";

async function getMode(req, res) {
  const setting = await AutomationSetting.findOne({ key: "global" });
  return res.status(200).json({ mode: setting ? setting.mode : DEFAULT_MODE });
}

async function updateMode(req, res) {
  const mode = ensureEnum(req.body.mode, "mode", VALID_MODES);

  const setting = await AutomationSetting.findOneAndUpdate(
    { key: "global" },
    { mode },
    { new: true, upsert: true, setDefaultsOnInsert: true }
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
