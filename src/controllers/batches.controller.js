const mongoose = require("mongoose");
const { Batch } = require("../models/batch.model");
const { CultivationPlan } = require("../models/cultivation-plan.model");
const { Measurement } = require("../models/measurement.model");
const { HttpError } = require("../utils/http-error");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_STATUS = ["ativo", "concluido", "comprometido"];

function ensureValidId(id, label = "batchId") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} invalido.`);
  }
}

async function listBatches(req, res) {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  const batches = await Batch.find(query).sort({ createdAt: -1 });
  return res.status(200).json(batches);
}

async function createBatch(req, res) {
  const { code, startedAt, expectedEndAt, initialQuantity } = req.body;
  if (!code || !startedAt) {
    throw new HttpError(400, "VALIDATION_ERROR", "Campos obrigatorios: code, startedAt.");
  }
  const exists = await Batch.findOne({ code });
  if (exists) {
    throw new HttpError(409, "CONFLICT", "Ja existe um lote com este code.");
  }
  const batch = await Batch.create({
    code,
    startedAt,
    expectedEndAt: expectedEndAt || null,
    initialQuantity: initialQuantity ?? null,
  });

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "batch.create",
    entityType: "Batch",
    entityId: batch._id,
    metadata: { code },
  });

  return res.status(201).json(batch.toJSON());
}

async function getBatchById(req, res) {
  ensureValidId(req.params.batchId);
  const batch = await Batch.findById(req.params.batchId);
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");
  return res.status(200).json(batch.toJSON());
}

async function patchBatch(req, res) {
  ensureValidId(req.params.batchId);
  const update = {};
  if (req.body.status !== undefined) {
    if (!VALID_STATUS.includes(req.body.status)) {
      throw new HttpError(400, "VALIDATION_ERROR", "status invalido.");
    }
    update.status = req.body.status;
  }
  if (req.body.endedAt !== undefined) update.endedAt = req.body.endedAt;
  if (req.body.expectedEndAt !== undefined) update.expectedEndAt = req.body.expectedEndAt;
  if (req.body.yieldKg !== undefined) update.yieldKg = req.body.yieldKg;

  const batch = await Batch.findByIdAndUpdate(req.params.batchId, update, {
    new: true,
    runValidators: true,
  });
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "batch.update",
    entityType: "Batch",
    entityId: batch._id,
    metadata: update,
  });

  return res.status(200).json(batch.toJSON());
}

async function deleteBatch(req, res) {
  ensureValidId(req.params.batchId);
  const batch = await Batch.findByIdAndDelete(req.params.batchId);
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "batch.delete",
    entityType: "Batch",
    entityId: batch._id,
  });

  return res.status(204).send();
}

async function attachPlan(req, res) {
  ensureValidId(req.params.batchId);
  const { planId } = req.body;
  if (!planId) {
    throw new HttpError(400, "VALIDATION_ERROR", "planId e obrigatorio.");
  }
  ensureValidId(planId, "planId");

  const plan = await CultivationPlan.findById(planId);
  if (!plan) {
    throw new HttpError(400, "VALIDATION_ERROR", "Plano nao encontrado.");
  }

  const batch = await Batch.findByIdAndUpdate(
    req.params.batchId,
    { $addToSet: { planIds: planId } },
    { new: true }
  );
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "batch.attach_plan",
    entityType: "Batch",
    entityId: batch._id,
    metadata: { planId },
  });

  return res.status(200).json(batch.toJSON());
}

async function splitBatch(req, res) {
  ensureValidId(req.params.batchId);
  const { childBatches } = req.body;
  if (!Array.isArray(childBatches) || childBatches.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "childBatches deve ser um array nao vazio.");
  }
  for (const child of childBatches) {
    if (!child.code || typeof child.quantity !== "number" || child.quantity < 0) {
      throw new HttpError(400, "VALIDATION_ERROR", "Cada child precisa de code e quantity >= 0.");
    }
  }

  const parent = await Batch.findById(req.params.batchId);
  if (!parent) throw new HttpError(404, "NOT_FOUND", "Lote pai nao encontrado.");

  const created = [];
  for (const child of childBatches) {
    const newBatch = await Batch.create({
      code: child.code,
      startedAt: parent.startedAt,
      expectedEndAt: parent.expectedEndAt,
      planIds: parent.planIds,
      parentBatchId: parent._id,
      initialQuantity: child.quantity,
    });
    created.push(newBatch.toJSON());
  }

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "batch.split",
    entityType: "Batch",
    entityId: parent._id,
    metadata: { childCount: created.length },
  });

  return res.status(201).json({
    parentBatch: parent.toJSON(),
    children: created,
  });
}

async function registerLoss(req, res) {
  ensureValidId(req.params.batchId);
  const { quantity, reason } = req.body;
  if (typeof quantity !== "number" || quantity < 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "quantity deve ser >= 0.");
  }
  if (!reason || reason.trim().length < 3) {
    throw new HttpError(400, "VALIDATION_ERROR", "reason e obrigatorio (minimo 3 caracteres).");
  }

  const batch = await Batch.findByIdAndUpdate(
    req.params.batchId,
    {
      $push: { losses: { quantity, reason, createdAt: new Date() } },
    },
    { new: true }
  );
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "batch.loss.register",
    entityType: "Batch",
    entityId: batch._id,
    metadata: { quantity, reason },
  });

  return res.status(201).json({
    batchId: batch._id.toString(),
    quantity,
    reason,
  });
}

function calculateLossKg(batch) {
  if (!batch.losses || batch.losses.length === 0) return 0;
  return batch.losses.reduce((sum, loss) => sum + (loss.quantity || 0), 0);
}

function calculateCycleDurationDays(batch) {
  if (!batch.startedAt) return 0;
  const end = batch.endedAt ? new Date(batch.endedAt) : new Date();
  const start = new Date(batch.startedAt);
  return (end - start) / (1000 * 60 * 60 * 24);
}

async function getProductivity(req, res) {
  ensureValidId(req.params.batchId);
  const batch = await Batch.findById(req.params.batchId);
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");

  const yieldKg = batch.yieldKg || 0;
  const lossKg = calculateLossKg(batch);
  const initial = batch.initialQuantity || yieldKg + lossKg;
  const productivityPercent = initial > 0 ? (yieldKg / initial) * 100 : 0;

  return res.status(200).json({
    batchId: batch._id.toString(),
    yieldKg,
    lossKg,
    productivityPercent: Math.round(productivityPercent * 100) / 100,
    cycleDurationDays: Math.round(calculateCycleDurationDays(batch) * 100) / 100,
  });
}

async function getPlanVsActual(req, res) {
  ensureValidId(req.params.batchId);
  const batch = await Batch.findById(req.params.batchId);
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");

  if (!batch.planIds || batch.planIds.length === 0) {
    return res.status(200).json({
      batchId: batch._id.toString(),
      generatedAt: new Date().toISOString(),
      indicators: [],
    });
  }

  const plan = await CultivationPlan.findOne({
    _id: { $in: batch.planIds },
    type: "regular",
  });

  if (!plan || !plan.regularConfig) {
    return res.status(200).json({
      batchId: batch._id.toString(),
      generatedAt: new Date().toISOString(),
      indicators: [],
    });
  }

  const measurements = await Measurement.find({ batchId: batch._id });
  const metrics = ["temperature", "humidity", "luminosity"];
  const indicators = [];

  for (const metric of metrics) {
    const range = plan.regularConfig[metric];
    if (!range) continue;

    const values = measurements.map((m) => m[metric]).filter((v) => typeof v === "number");
    const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const inRange = average >= range.min && average <= range.max;
    indicators.push({
      metric,
      expectedRange: { min: range.min, max: range.max },
      actualAverage: Math.round(average * 100) / 100,
      status: inRange ? "within_range" : "out_of_range",
    });
  }

  return res.status(200).json({
    batchId: batch._id.toString(),
    generatedAt: new Date().toISOString(),
    indicators,
  });
}

module.exports = {
  listBatches,
  createBatch,
  getBatchById,
  patchBatch,
  deleteBatch,
  attachPlan,
  splitBatch,
  registerLoss,
  getProductivity,
  getPlanVsActual,
};
