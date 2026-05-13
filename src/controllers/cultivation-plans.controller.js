const { CultivationPlan } = require("../models/cultivation-plan.model");
const { Herb } = require("../models/herb.model");
const { HttpError } = require("../utils/http-error");
const { ensureObjectId, ensureNonEmptyString, ensureEnum } = require("../utils/validators");
const { recordAuditLog } = require("../services/audit-log.service");
const {
  PLAN_TYPES,
  buildCultivationPlanFromPayload,
  validateRegularConfig,
  validateEmergencyConfig,
  validatePontualConfig,
} = require("../services/cultivation-plan-validation.service");

async function listCultivationPlans(req, res) {
  const query = {};
  if (req.query.type) {
    query.type = ensureEnum(req.query.type, "type", PLAN_TYPES);
  }
  const plans = await CultivationPlan.find(query).sort({ createdAt: -1 });
  return res.status(200).json(plans);
}

async function createCultivationPlan(req, res) {
  const planPayload = buildCultivationPlanFromPayload(req.body);
  ensureObjectId(planPayload.herbId, "herbId");

  const herb = await Herb.findById(planPayload.herbId);
  if (!herb) {
    throw new HttpError(400, "VALIDATION_ERROR", "herbId nao corresponde a nenhuma erva.");
  }

  const plan = await CultivationPlan.create(planPayload);

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "cultivation_plan.create",
    entityType: "CultivationPlan",
    entityId: plan._id,
    metadata: { type: plan.type, herbId: String(plan.herbId) },
  });

  return res.status(201).json(plan.toJSON());
}

async function getCultivationPlanById(req, res) {
  ensureObjectId(req.params.planId, "planId");
  const plan = await CultivationPlan.findById(req.params.planId);
  if (!plan) {
    throw new HttpError(404, "NOT_FOUND", "Plano de cultivo nao encontrado.");
  }
  return res.status(200).json(plan.toJSON());
}

async function patchCultivationPlan(req, res) {
  ensureObjectId(req.params.planId, "planId");

  const current = await CultivationPlan.findById(req.params.planId);
  if (!current) {
    throw new HttpError(404, "NOT_FOUND", "Plano de cultivo nao encontrado.");
  }

  const update = {};
  if (req.body.name !== undefined) {
    update.name = ensureNonEmptyString(req.body.name, "name");
  }

  if (req.body.regularConfig !== undefined) {
    if (current.type !== "regular") {
      throw new HttpError(400, "VALIDATION_ERROR", "regularConfig so aplicavel a plano regular.");
    }
    update.regularConfig = validateRegularConfig(req.body.regularConfig);
  }
  if (req.body.emergencyConfig !== undefined) {
    if (current.type !== "emergencia") {
      throw new HttpError(400, "VALIDATION_ERROR", "emergencyConfig so aplicavel a plano emergencia.");
    }
    update.emergencyConfig = validateEmergencyConfig(req.body.emergencyConfig);
  }
  if (req.body.pontualConfig !== undefined) {
    if (current.type !== "pontual") {
      throw new HttpError(400, "VALIDATION_ERROR", "pontualConfig so aplicavel a plano pontual.");
    }
    update.pontualConfig = validatePontualConfig(req.body.pontualConfig);
  }

  if (Object.keys(update).length === 0) {
    return res.status(200).json(current.toJSON());
  }

  const updated = await CultivationPlan.findByIdAndUpdate(req.params.planId, update, {
    new: true,
    runValidators: true,
  });

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "cultivation_plan.update",
    entityType: "CultivationPlan",
    entityId: updated._id,
    metadata: { fields: Object.keys(update) },
  });

  return res.status(200).json(updated.toJSON());
}

async function deleteCultivationPlan(req, res) {
  ensureObjectId(req.params.planId, "planId");
  const deleted = await CultivationPlan.findByIdAndDelete(req.params.planId);
  if (!deleted) {
    throw new HttpError(404, "NOT_FOUND", "Plano de cultivo nao encontrado.");
  }

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "cultivation_plan.delete",
    entityType: "CultivationPlan",
    entityId: deleted._id,
  });

  return res.status(204).send();
}

module.exports = {
  listCultivationPlans,
  createCultivationPlan,
  getCultivationPlanById,
  patchCultivationPlan,
  deleteCultivationPlan,
};
