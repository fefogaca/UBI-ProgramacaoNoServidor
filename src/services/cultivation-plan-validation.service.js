const { HttpError } = require("../utils/http-error");

function hasAllKeys(target, keys) {
  return keys.every((key) => target && target[key] !== undefined && target[key] !== null);
}

function validateRange(name, range) {
  if (!range || typeof range !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", `${name} e obrigatorio.`);
  }

  const { min, max } = range;
  if (typeof min !== "number" || typeof max !== "number") {
    throw new HttpError(400, "VALIDATION_ERROR", `${name}.min e ${name}.max devem ser numericos.`);
  }

  if (min > max) {
    throw new HttpError(400, "VALIDATION_ERROR", `${name}.min nao pode ser maior que ${name}.max.`);
  }
}

function validateRegularConfig(regularConfig) {
  if (!regularConfig || typeof regularConfig !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "regularConfig e obrigatorio para plano regular.");
  }

  const requiredRoot = ["temperature", "humidity", "luminosity", "irrigation", "fertilization", "expectedDurationDays"];
  if (!hasAllKeys(regularConfig, requiredRoot)) {
    throw new HttpError(400, "VALIDATION_ERROR", "regularConfig incompleto para plano regular.");
  }

  validateRange("regularConfig.temperature", regularConfig.temperature);
  validateRange("regularConfig.humidity", regularConfig.humidity);
  validateRange("regularConfig.luminosity", regularConfig.luminosity);

  if (
    typeof regularConfig.irrigation.frequencyHours !== "number" ||
    regularConfig.irrigation.frequencyHours < 1 ||
    typeof regularConfig.irrigation.amountMl !== "number" ||
    regularConfig.irrigation.amountMl < 0
  ) {
    throw new HttpError(400, "VALIDATION_ERROR", "irrigation invalido para plano regular.");
  }

  if (
    typeof regularConfig.fertilization.frequencyDays !== "number" ||
    regularConfig.fertilization.frequencyDays < 1 ||
    typeof regularConfig.fertilization.dosage !== "string" ||
    !regularConfig.fertilization.dosage.trim()
  ) {
    throw new HttpError(400, "VALIDATION_ERROR", "fertilization invalido para plano regular.");
  }

  if (
    typeof regularConfig.expectedDurationDays !== "number" ||
    regularConfig.expectedDurationDays < 1
  ) {
    throw new HttpError(400, "VALIDATION_ERROR", "expectedDurationDays deve ser maior ou igual a 1.");
  }
}

function validateEmergencyConfig(emergencyConfig) {
  if (!emergencyConfig || typeof emergencyConfig !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "emergencyConfig e obrigatorio para plano emergencia.");
  }

  const requiredRoot = ["minIntervalMinutes", "interventionType", "intensityOrDosage"];
  if (!hasAllKeys(emergencyConfig, requiredRoot)) {
    throw new HttpError(400, "VALIDATION_ERROR", "emergencyConfig incompleto para plano emergencia.");
  }

  if (typeof emergencyConfig.minIntervalMinutes !== "number" || emergencyConfig.minIntervalMinutes < 1) {
    throw new HttpError(400, "VALIDATION_ERROR", "minIntervalMinutes deve ser maior ou igual a 1.");
  }
}

function validatePontualConfig(pontualConfig) {
  if (!pontualConfig || typeof pontualConfig !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "pontualConfig e obrigatorio para plano pontual.");
  }

  const requiredRoot = ["interventionType", "intensityOrDosage", "approval"];
  if (!hasAllKeys(pontualConfig, requiredRoot)) {
    throw new HttpError(400, "VALIDATION_ERROR", "pontualConfig incompleto para plano pontual.");
  }

  const approvalRequired = ["approvedBy", "approvedAt"];
  if (!hasAllKeys(pontualConfig.approval, approvalRequired)) {
    throw new HttpError(400, "VALIDATION_ERROR", "approval incompleto para plano pontual.");
  }
}

function validateCreateCultivationPlanPayload(payload) {
  const required = ["herbId", "name", "type"];
  if (!hasAllKeys(payload, required)) {
    throw new HttpError(400, "VALIDATION_ERROR", "Campos obrigatorios: herbId, name, type.");
  }

  if (!["regular", "emergencia", "pontual"].includes(payload.type)) {
    throw new HttpError(400, "VALIDATION_ERROR", "type deve ser regular, emergencia ou pontual.");
  }

  if (payload.type === "regular") {
    validateRegularConfig(payload.regularConfig);
  }

  if (payload.type === "emergencia") {
    validateEmergencyConfig(payload.emergencyConfig);
  }

  if (payload.type === "pontual") {
    validatePontualConfig(payload.pontualConfig);
  }
}

module.exports = {
  validateCreateCultivationPlanPayload,
};
