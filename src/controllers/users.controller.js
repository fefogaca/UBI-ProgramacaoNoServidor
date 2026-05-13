const { User } = require("../models/user.model");
const { HttpError } = require("../utils/http-error");
const { ensureObjectId, ensureNonEmptyString, ensureEnum } = require("../utils/validators");
const { recordAuditLog } = require("../services/audit-log.service");

const VALID_ROLES = ["tecnico", "responsavel", "administrador"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ensureEmail(value) {
  const email = ensureNonEmptyString(value, "email").toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new HttpError(400, "VALIDATION_ERROR", "email invalido.");
  }
  return email;
}

async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  return res.status(200).json(users);
}

async function createUser(req, res) {
  const name = ensureNonEmptyString(req.body.name, "name");
  const email = ensureEmail(req.body.email);
  const role = ensureEnum(req.body.role, "role", VALID_ROLES);

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
  ensureObjectId(req.params.userId, "userId");
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "Utilizador nao encontrado.");
  }
  return res.status(200).json(user.toJSON());
}

async function patchUser(req, res) {
  ensureObjectId(req.params.userId, "userId");
  const update = {};
  if (req.body.name !== undefined) {
    update.name = ensureNonEmptyString(req.body.name, "name");
  }
  if (req.body.role !== undefined) {
    update.role = ensureEnum(req.body.role, "role", VALID_ROLES);
  }
  if (req.body.active !== undefined) {
    update.active = Boolean(req.body.active);
  }

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
  ensureObjectId(req.params.userId, "userId");
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
