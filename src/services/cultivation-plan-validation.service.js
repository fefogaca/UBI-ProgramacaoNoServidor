const { HttpError } = require("../utils/http-error");
const {
  ensureNonEmptyString,
  ensureFiniteNumber,
  ensureEnum,
  ensureDate,
} = require("../utils/validators");

const PLAN_TYPES = ["regular", "emergencia", "pontual"];

function validateRange(name, range) {
  if (!range || typeof range !== "object" || Array.isArray(range)) {
    throw new HttpError(400, "VALIDATION_ERROR", `${name} e obrigatorio.`);
  }
  ensureFiniteNumber(range.min, `${name}.min`);
  ensureFiniteNumber(range.max, `${name}.max`);
  if (range.min > range.max) {
    throw new HttpError(400, "VALIDATION_ERROR", `${name}.min nao pode ser maior que ${name}.max.`);
  }
  return { min: range.min, max: range.max };
}

function validateRegularConfig(regularConfig) {
  if (!regularConfig || typeof regularConfig !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "regularConfig e obrigatorio para plano regular.");
  }

  const temperature = validateRange("regularConfig.temperature", regularConfig.temperature);
  const humidity = validateRange("regularConfig.humidity", regularConfig.humidity);
  const luminosity = validateRange("regularConfig.luminosity", regularConfig.luminosity);

  if (!regularConfig.irrigation || typeof regularConfig.irrigation !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "regularConfig.irrigation e obrigatorio.");
  }
  const irrigation = {
    frequencyHours: ensureFiniteNumber(
      regularConfig.irrigation.frequencyHours,
      "irrigation.frequencyHours",
      { min: 1 }
    ),
    amountMl: ensureFiniteNumber(regularConfig.irrigation.amountMl, "irrigation.amountMl", {
      min: 0,
    }),
  };

  if (!regularConfig.fertilization || typeof regularConfig.fertilization !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "regularConfig.fertilization e obrigatorio.");
  }
  const fertilization = {
    frequencyDays: ensureFiniteNumber(
      regularConfig.fertilization.frequencyDays,
      "fertilization.frequencyDays",
      { min: 1 }
    ),
    dosage: ensureNonEmptyString(regularConfig.fertilization.dosage, "fertilization.dosage"),
  };

  const expectedDurationDays = ensureFiniteNumber(
    regularConfig.expectedDurationDays,
    "expectedDurationDays",
    { min: 1 }
  );

  return {
    temperature,
    humidity,
    luminosity,
    irrigation,
    fertilization,
    expectedDurationDays,
  };
}

function validateEmergencyConfig(emergencyConfig) {
  if (!emergencyConfig || typeof emergencyConfig !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "emergencyConfig e obrigatorio para plano emergencia.");
  }

  return {
    minIntervalMinutes: ensureFiniteNumber(
      emergencyConfig.minIntervalMinutes,
      "minIntervalMinutes",
      { min: 1 }
    ),
    interventionType: ensureNonEmptyString(emergencyConfig.interventionType, "interventionType"),
    intensityOrDosage: ensureNonEmptyString(
      emergencyConfig.intensityOrDosage,
      "intensityOrDosage"
    ),
  };
}

function validatePontualConfig(pontualConfig) {
  if (!pontualConfig || typeof pontualConfig !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "pontualConfig e obrigatorio para plano pontual.");
  }

  if (!pontualConfig.approval || typeof pontualConfig.approval !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "approval e obrigatorio para plano pontual.");
  }

  return {
    interventionType: ensureNonEmptyString(pontualConfig.interventionType, "interventionType"),
    intensityOrDosage: ensureNonEmptyString(
      pontualConfig.intensityOrDosage,
      "intensityOrDosage"
    ),
    approval: {
      approvedBy: ensureNonEmptyString(pontualConfig.approval.approvedBy, "approval.approvedBy"),
      approvedAt: ensureDate(pontualConfig.approval.approvedAt, "approval.approvedAt"),
      notes:
        pontualConfig.approval.notes !== undefined && pontualConfig.approval.notes !== null
          ? String(pontualConfig.approval.notes).trim() || null
          : null,
    },
  };
}

function buildCultivationPlanFromPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "VALIDATION_ERROR", "Corpo do pedido em falta.");
  }

  const name = ensureNonEmptyString(payload.name, "name");
  const herbId = ensureNonEmptyString(payload.herbId, "herbId");
  const type = ensureEnum(payload.type, "type", PLAN_TYPES);

  const plan = { name, herbId, type };

  if (type === "regular") {
    plan.regularConfig = validateRegularConfig(payload.regularConfig);
  } else if (type === "emergencia") {
    plan.emergencyConfig = validateEmergencyConfig(payload.emergencyConfig);
  } else if (type === "pontual") {
    plan.pontualConfig = validatePontualConfig(payload.pontualConfig);
  }

  return plan;
}

module.exports = {
  PLAN_TYPES,
  buildCultivationPlanFromPayload,
  validateRegularConfig,
  validateEmergencyConfig,
  validatePontualConfig,
};
