const mongoose = require("mongoose");
const { CultivationPlan } = require("../models/cultivation-plan.model");
const { Herb } = require("../models/herb.model");
const { HttpError } = require("../utils/http-error");
const { validateCreateCultivationPlanPayload } = require("../services/cultivation-plan-validation.service");

async function listCultivationPlans(req, res) {
  const { type } = req.query;
  const query = {};

  if (type) {
    query.type = type;
  }

  const plans = await CultivationPlan.find(query).sort({ createdAt: -1 });
  return res.status(200).json(plans);
}

async function createCultivationPlan(req, res) {
  validateCreateCultivationPlanPayload(req.body);

  if (!mongoose.Types.ObjectId.isValid(req.body.herbId)) {
    throw new HttpError(400, "VALIDATION_ERROR", "herbId invalido.");
  }

  const herb = await Herb.findById(req.body.herbId);
  if (!herb) {
    throw new HttpError(400, "VALIDATION_ERROR", "Herb nao encontrado para o herbId informado.");
  }

  const plan = await CultivationPlan.create(req.body);
  return res.status(201).json(plan.toJSON());
}

async function getCultivationPlanById(req, res) {
  const { planId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    throw new HttpError(400, "VALIDATION_ERROR", "planId invalido.");
  }

  const plan = await CultivationPlan.findById(planId);
  if (!plan) {
    throw new HttpError(404, "NOT_FOUND", "Plano de cultivo nao encontrado.");
  }

  return res.status(200).json(plan.toJSON());
}

async function patchCultivationPlan(req, res) {
  const { planId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    throw new HttpError(400, "VALIDATION_ERROR", "planId invalido.");
  }

  const current = await CultivationPlan.findById(planId);
  if (!current) {
    throw new HttpError(404, "NOT_FOUND", "Plano de cultivo nao encontrado.");
  }

  const merged = {
    ...current.toObject(),
    ...req.body,
  };
  validateCreateCultivationPlanPayload(merged);

  const updated = await CultivationPlan.findByIdAndUpdate(planId, req.body, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json(updated.toJSON());
}

async function deleteCultivationPlan(req, res) {
  const { planId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    throw new HttpError(400, "VALIDATION_ERROR", "planId invalido.");
  }

  const deleted = await CultivationPlan.findByIdAndDelete(planId);
  if (!deleted) {
    throw new HttpError(404, "NOT_FOUND", "Plano de cultivo nao encontrado.");
  }

  return res.status(204).send();
}

module.exports = {
  listCultivationPlans,
  createCultivationPlan,
  getCultivationPlanById,
  patchCultivationPlan,
  deleteCultivationPlan,
};
