const mongoose = require("mongoose");
const { User } = require("../models/user.model");
const { HttpError } = require("../utils/http-error");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_ROLES = ["tecnico", "responsavel", "administrador"];

function ensureValidId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "VALIDATION_ERROR", "userId invalido.");
  }
}

async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  return res.status(200).json(users);
}

async function createUser(req, res) {
  const { name, email, role } = req.body;
  if (!name || !email || !role) {
    throw new HttpError(400, "VALIDATION_ERROR", "Campos obrigatorios: name, email, role.");
  }
  if (!VALID_ROLES.includes(role)) {
    throw new HttpError(400, "VALIDATION_ERROR", "role invalido.");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw new HttpError(409, "CONFLICT", "Ja existe um utilizador com este email.");
  }

  const user = await User.create({ name, email, role });

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "user.create",
    entityType: "User",
    entityId: user._id,
    metadata: { email: user.email, role: user.role },
  });

  return res.status(201).json(user.toJSON());
}

async function getUserById(req, res) {
  ensureValidId(req.params.userId);
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "Utilizador nao encontrado.");
  }
  return res.status(200).json(user.toJSON());
}

async function patchUser(req, res) {
  ensureValidId(req.params.userId);
  const update = {};
  if (req.body.name !== undefined) update.name = req.body.name;
  if (req.body.role !== undefined) {
    if (!VALID_ROLES.includes(req.body.role)) {
      throw new HttpError(400, "VALIDATION_ERROR", "role invalido.");
    }
    update.role = req.body.role;
  }
  if (req.body.active !== undefined) update.active = !!req.body.active;

  const user = await User.findByIdAndUpdate(req.params.userId, update, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "Utilizador nao encontrado.");
  }

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "user.update",
    entityType: "User",
    entityId: user._id,
    metadata: update,
  });

  return res.status(200).json(user.toJSON());
}

async function deleteUser(req, res) {
  ensureValidId(req.params.userId);
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { active: false },
    { new: true }
  );
  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "Utilizador nao encontrado.");
  }

  await recordAuditLog({
    actorId: req.header("x-actor-id"),
    action: "user.deactivate",
    entityType: "User",
    entityId: user._id,
  });

  return res.status(204).send();
}

module.exports = {
  listUsers,
  createUser,
  getUserById,
  patchUser,
  deleteUser,
};
