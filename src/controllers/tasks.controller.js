const { Task } = require("../models/task.model");
const { Batch } = require("../models/batch.model");
const { HttpError } = require("../utils/http-error");
const {
  ensureObjectId,
  ensureEnum,
  ensureDate,
} = require("../utils/validators");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_TYPES = ["rega", "fertilizacao", "colheita", "monitorizacao"];
const VALID_STATUS = ["pendente", "concluida"];

async function listTasks(req, res) {
  const query = {};
  if (req.query.batchId) {
    ensureObjectId(req.query.batchId, "batchId");
    query.batchId = req.query.batchId;
  }
  if (req.query.status) {
    query.status = ensureEnum(req.query.status, "status", VALID_STATUS);
  }
  const tasks = await Task.find(query).sort({ scheduledAt: 1 });
  return res.status(200).json(tasks);
}

async function createTask(req, res) {
  ensureObjectId(req.body.batchId, "batchId");
  const type = ensureEnum(req.body.type, "type", VALID_TYPES);
  const scheduledAt = ensureDate(req.body.scheduledAt, "scheduledAt");

  const batch = await Batch.findById(req.body.batchId);
  if (!batch) {
    throw new HttpError(400, "VALIDATION_ERROR", "Lote nao encontrado.");
  }

  const task = await Task.create({ batchId: req.body.batchId, type, scheduledAt });

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "task.create",
    entityType: "Task",
    entityId: task._id,
    metadata: { batchId: req.body.batchId, type },
  });

  return res.status(201).json(task.toJSON());
}

async function getTaskById(req, res) {
  ensureObjectId(req.params.taskId, "taskId");
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new HttpError(404, "NOT_FOUND", "Tarefa nao encontrada.");
  return res.status(200).json(task.toJSON());
}

async function patchTask(req, res) {
  ensureObjectId(req.params.taskId, "taskId");
  const update = {};
  if (req.body.scheduledAt !== undefined) {
    update.scheduledAt = ensureDate(req.body.scheduledAt, "scheduledAt");
  }
  if (req.body.status !== undefined) {
    update.status = ensureEnum(req.body.status, "status", VALID_STATUS);
  }

  if (Object.keys(update).length === 0) {
    const current = await Task.findById(req.params.taskId);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Tarefa nao encontrada.");
    return res.status(200).json(current.toJSON());
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
  ensureObjectId(req.params.taskId, "taskId");
  const executedAt = ensureDate(req.body.executedAt, "executedAt");
  const actor = req.header("x-actor-id") || "system";

  const task = await Task.findByIdAndUpdate(
    req.params.taskId,
    {
      status: "concluida",
      executedAt,
      executedBy: actor,
    },
    { new: true }
  );
  if (!task) throw new HttpError(404, "NOT_FOUND", "Tarefa nao encontrada.");

  await recordAuditLog({
    actorId: actor,
    action: "task.complete",
    entityType: "Task",
    entityId: task._id,
    metadata: { executedAt: executedAt.toISOString() },
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
