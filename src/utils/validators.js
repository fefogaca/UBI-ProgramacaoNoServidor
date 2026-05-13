const mongoose = require("mongoose");
const { HttpError } = require("./http-error");

function ensureObjectId(value, label = "id") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} invalido.`);
  }
}

function ensureNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} e obrigatorio.`);
  }
  return value.trim();
}

function ensureFiniteNumber(value, label, { min, max } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} deve ser numerico.`);
  }
  if (min !== undefined && value < min) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} deve ser >= ${min}.`);
  }
  if (max !== undefined && value > max) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} deve ser <= ${max}.`);
  }
  return value;
}

function ensureDate(value, label) {
  if (value === undefined || value === null || value === "") {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} e obrigatorio.`);
  }
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "VALIDATION_ERROR", `${label} deve ser uma data ISO valida.`);
  }
  return parsed;
}

function ensureEnum(value, label, allowed) {
  if (!allowed.includes(value)) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      `${label} invalido. Valores aceites: ${allowed.join(", ")}.`
    );
  }
  return value;
}

function optionalDate(value, label) {
  if (value === undefined || value === null || value === "") return undefined;
  return ensureDate(value, label);
}

module.exports = {
  ensureObjectId,
  ensureNonEmptyString,
  ensureFiniteNumber,
  ensureDate,
  optionalDate,
  ensureEnum,
};
