const { Batch } = require("../models/batch.model");
const { CultivationPlan } = require("../models/cultivation-plan.model");
const { Measurement } = require("../models/measurement.model");
const { HttpError } = require("../utils/http-error");
const {
  ensureObjectId,
  ensureNonEmptyString,
  ensureFiniteNumber,
  ensureEnum,
  ensureDate,
  optionalDate,
} = require("../utils/validators");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_STATUS = ["ativo", "concluido", "comprometido"];

async function listBatches(req, res) {
  const query = {};
  if (req.query.status) {
    query.status = ensureEnum(req.query.status, "status", VALID_STATUS);
  }
  const batches = await Batch.find(query).sort({ createdAt: -1 });
  return res.status(200).json(batches);
}

async function createBatch(req, res) {
  const code = ensureNonEmptyString(req.body.code, "code");
  const startedAt = ensureDate(req.body.startedAt, "startedAt");
  const expectedEndAt = optionalDate(req.body.expectedEndAt, "expectedEndAt") || null;
  const initialQuantity =
    req.body.initialQuantity !== undefined && req.body.initialQuantity !== null
      ? ensureFiniteNumber(req.body.initialQuantity, "initialQuantity", { min: 0 })
      : null;

  const batch = await Batch.create({
    code,
    startedAt,
    expectedEndAt,
    initialQuantity,
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
  ensureObjectId(req.params.batchId, "batchId");
  const batch = await Batch.findById(req.params.batchId);
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");
  return res.status(200).json(batch.toJSON());
}

async function patchBatch(req, res) {
  ensureObjectId(req.params.batchId, "batchId");
  const update = {};
  if (req.body.status !== undefined) {
    update.status = ensureEnum(req.body.status, "status", VALID_STATUS);
  }
  if (req.body.endedAt !== undefined) {
    update.endedAt = req.body.endedAt === null ? null : ensureDate(req.body.endedAt, "endedAt");
  }
  if (req.body.expectedEndAt !== undefined) {
    update.expectedEndAt =
      req.body.expectedEndAt === null
        ? null
        : ensureDate(req.body.expectedEndAt, "expectedEndAt");
  }
  if (req.body.yieldKg !== undefined) {
    update.yieldKg = ensureFiniteNumber(req.body.yieldKg, "yieldKg", { min: 0 });
  }

  if (Object.keys(update).length === 0) {
    const current = await Batch.findById(req.params.batchId);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");
    return res.status(200).json(current.toJSON());
  }

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
  ensureObjectId(req.params.batchId, "batchId");
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
  ensureObjectId(req.params.batchId, "batchId");
  ensureObjectId(req.body.planId, "planId");

  const plan = await CultivationPlan.findById(req.body.planId);
  if (!plan) {
    throw new HttpError(400, "VALIDATION_ERROR", "Plano nao encontrado.");
  }

  const batch = await Batch.findByIdAndUpdate(
    req.params.batchId,
    { $addToSet: { planIds: plan._id } },
    { new: true }
  );
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "batch.attach_plan",
    entityType: "Batch",
    entityId: batch._id,
    metadata: { planId: String(plan._id) },
  });

  return res.status(200).json(batch.toJSON());
}

async function splitBatch(req, res) {
  ensureObjectId(req.params.batchId, "batchId");

  const { childBatches } = req.body;
  if (!Array.isArray(childBatches) || childBatches.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "childBatches deve ser um array nao vazio.");
  }

  const seenCodes = new Set();
  const validated = childBatches.map((child, idx) => {
    const code = ensureNonEmptyString(child.code, `childBatches[${idx}].code`);
    const quantity = ensureFiniteNumber(child.quantity, `childBatches[${idx}].quantity`, {
      min: 0,
    });
    if (seenCodes.has(code)) {
      throw new HttpError(400, "VALIDATION_ERROR", `code duplicado em childBatches: ${code}.`);
    }
    seenCodes.add(code);
    return { code, quantity };
  });

  const existing = await Batch.find({ code: { $in: Array.from(seenCodes) } }).select("code");
  if (existing.length > 0) {
    throw new HttpError(409, "CONFLICT", `Lotes ja existem com codigos: ${existing.map((b) => b.code).join(", ")}.`);
  }

  const parent = await Batch.findById(req.params.batchId);
  if (!parent) throw new HttpError(404, "NOT_FOUND", "Lote pai nao encontrado.");

  const created = await Batch.insertMany(
    validated.map((child) => ({
      code: child.code,
      startedAt: parent.startedAt,
      expectedEndAt: parent.expectedEndAt,
      planIds: parent.planIds,
      parentBatchId: parent._id,
      initialQuantity: child.quantity,
    }))
  );

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "batch.split",
    entityType: "Batch",
    entityId: parent._id,
    metadata: { childIds: created.map((c) => String(c._id)) },
  });

  return res.status(201).json({
    parentBatch: parent.toJSON(),
    children: created.map((c) => c.toJSON()),
  });
}

async function registerLoss(req, res) {
  ensureObjectId(req.params.batchId, "batchId");
  const quantity = ensureFiniteNumber(req.body.quantity, "quantity", { min: 0 });
  const reason = ensureNonEmptyString(req.body.reason, "reason");
  if (reason.length < 3) {
    throw new HttpError(400, "VALIDATION_ERROR", "reason deve ter pelo menos 3 caracteres.");
  }

  const batch = await Batch.findByIdAndUpdate(
    req.params.batchId,
    { $push: { losses: { quantity, reason, createdAt: new Date() } } },
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

function round(value) {
  return Math.round(value * 100) / 100;
}

async function getProductivity(req, res) {
  ensureObjectId(req.params.batchId, "batchId");
  const batch = await Batch.findById(req.params.batchId);
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");

  const yieldKg = batch.yieldKg || 0;
  const lossKg = calculateLossKg(batch);
  const initial = batch.initialQuantity || yieldKg + lossKg;
  const productivityPercent = initial > 0 ? (yieldKg / initial) * 100 : 0;

  return res.status(200).json({
    batchId: batch._id.toString(),
    yieldKg: round(yieldKg),
    lossKg: round(lossKg),
    productivityPercent: round(productivityPercent),
    cycleDurationDays: round(calculateCycleDurationDays(batch)),
  });
}

async function getPlanVsActual(req, res) {
  ensureObjectId(req.params.batchId, "batchId");
  const batch = await Batch.findById(req.params.batchId);
  if (!batch) throw new HttpError(404, "NOT_FOUND", "Lote nao encontrado.");

  const generatedAt = new Date().toISOString();
  if (!Array.isArray(batch.planIds) || batch.planIds.length === 0) {
    return res.status(200).json({ batchId: batch._id.toString(), generatedAt, indicators: [] });
  }

  const plan = await CultivationPlan.findOne({
    _id: { $in: batch.planIds },
    type: "regular",
  });
  if (!plan || !plan.regularConfig) {
    return res.status(200).json({ batchId: batch._id.toString(), generatedAt, indicators: [] });
  }

  const measurements = await Measurement.find({ batchId: batch._id });
  const metrics = ["temperature", "humidity", "luminosity"];
  const indicators = [];

  for (const metric of metrics) {
    const range = plan.regularConfig[metric];
    if (!range) continue;

    const values = measurements
      .map((m) => m[metric])
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const inRange = values.length > 0 && average >= range.min && average <= range.max;
    indicators.push({
      metric,
      expectedRange: { min: range.min, max: range.max },
      actualAverage: round(average),
      status: inRange ? "within_range" : "out_of_range",
    });
  }

  return res.status(200).json({
    batchId: batch._id.toString(),
    generatedAt,
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
