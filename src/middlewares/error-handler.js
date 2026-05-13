function notFoundHandler(req, res) {
  return res.status(404).json({
    code: "NOT_FOUND",
    message: "Rota nao encontrada.",
  });
}

function mapMongooseError(err) {
  if (err && err.name === "ValidationError") {
    const details = {};
    for (const [field, info] of Object.entries(err.errors || {})) {
      details[field] = info.message;
    }
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Erro de validacao.",
      details,
    };
  }

  if (err && err.name === "CastError") {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: `Valor invalido para o campo "${err.path}".`,
    };
  }

  if (err && err.code === 11000) {
    return {
      statusCode: 409,
      code: "CONFLICT",
      message: "Recurso ja existe.",
      details: err.keyValue,
    };
  }

  return null;
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err && err.statusCode) {
    const payload = {
      code: err.code || "BAD_REQUEST",
      message: err.message || "Pedido invalido.",
    };
    if (err.details) payload.details = err.details;
    return res.status(err.statusCode).json(payload);
  }

  const mapped = mapMongooseError(err);
  if (mapped) {
    const payload = {
      code: mapped.code,
      message: mapped.message,
    };
    if (mapped.details) payload.details = mapped.details;
    return res.status(mapped.statusCode).json(payload);
  }

  // eslint-disable-next-line no-console
  console.error("Erro inesperado:", err);
  return res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Erro interno no servidor.",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
