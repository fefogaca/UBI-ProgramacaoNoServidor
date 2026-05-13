const mongoose = require("mongoose");
const { Task } = require("../models/task.model");
const { Batch } = require("../models/batch.model");
const { HttpError } = require("../utils/http-error");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_TYPES = ["rega", "fertilizacao", "colheita", "monitorizacao"];
const VALID_STATUS = ["pendente", "concluida"];

function ensureValidId(id, label = "taskId") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} invalido.`);
  }
}

async function listTasks(req, res) {
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
  const tasks = await Task.find(query).sort({ scheduledAt: 1 });
  return res.status(200).json(tasks);
}

async function createTask(req, res) {
  const { batchId, type, scheduledAt } = req.body;
  if (!batchId || !type || !scheduledAt) {
    throw new HttpError(400, "VALIDATION_ERROR", "Campos obrigatorios: batchId, type, scheduledAt.");
  }
  if (!VALID_TYPES.includes(type)) {
    throw new HttpError(400, "VALIDATION_ERROR", "type invalido.");
  }
  ensureValidId(batchId, "batchId");

  const batch = await Batch.findById(batchId);
  if (!batch) {
    throw new HttpError(400, "VALIDATION_ERROR", "Lote nao encontrado.");
  }

  const task = await Task.create({ batchId, type, scheduledAt });

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "task.create",
    entityType: "Task",
    entityId: task._id,
    metadata: { batchId, type },
  });

  return res.status(201).json(task.toJSON());
}

async function getTaskById(req, res) {
  ensureValidId(req.params.taskId);
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new HttpError(404, "NOT_FOUND", "Tarefa nao encontrada.");
  return res.status(200).json(task.toJSON());
}

async function patchTask(req, res) {
  ensureValidId(req.params.taskId);
  const update = {};
  if (req.body.scheduledAt !== undefined) update.scheduledAt = req.body.scheduledAt;
  if (req.body.status !== undefined) {
    if (!VALID_STATUS.includes(req.body.status)) {
      throw new HttpError(400, "VALIDATION_ERROR", "status invalido.");
    }
    update.status = req.body.status;
  }

  const task = await Task.findByIdAndUpdate(req.params.taskId, update, {
    new: true,
    runValidators: true,
  });
  if (!task) throw new HttpError(404, "NOT_FOUND", "Tarefa nao encontrada.");

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "task.update",
    entityType: "Task",
    entityId: task._id,
    metadata: update,
  });

  return res.status(200).json(task.toJSON());
}

async function completeTask(req, res) {
  ensureValidId(req.params.taskId);
  const { executedAt } = req.body;
  if (!executedAt) {
    throw new HttpError(400, "VALIDATION_ERROR", "executedAt e obrigatorio.");
  }

  const task = await Task.findByIdAndUpdate(
    req.params.taskId,
    {
      status: "concluida",
      executedAt,
      executedBy: req.header("x-actor-id") || "system",
    },
    { new: true }
  );
  if (!task) throw new HttpError(404, "NOT_FOUND", "Tarefa nao encontrada.");

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "task.complete",
    entityType: "Task",
    entityId: task._id,
    metadata: { executedAt },
  });

  return res.status(200).json(task.toJSON());
}

module.exports = {
  listTasks,
  createTask,
  getTaskById,
  patchTask,
  completeTask,
};
