function notFoundHandler(req, res) {
  return res.status(404).json({
    code: "NOT_FOUND",
    message: "Rota nao encontrada.",
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || 500;
  const payload = {
    code: err.code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST"),
    message: err.message || "Erro interno no servidor.",
  };

  if (err.details) {
    payload.details = err.details;
  }

  return res.status(status).json(payload);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
