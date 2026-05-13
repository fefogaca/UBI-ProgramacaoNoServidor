const { Measurement } = require("../models/measurement.model");
const { HttpError } = require("../utils/http-error");

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportReport(req, res) {
  const { format } = req.query;
  if (!format) {
    throw new HttpError(400, "VALIDATION_ERROR", "format e obrigatorio.");
  }
  if (!["csv", "xlsx"].includes(format)) {
    throw new HttpError(400, "VALIDATION_ERROR", "format deve ser csv ou xlsx.");
  }

  if (format === "xlsx") {
    throw new HttpError(
      501,
      "NOT_IMPLEMENTED",
      "Exportacao XLSX ainda nao implementada nesta sprint; use format=csv."
    );
  }

  const measurements = await Measurement.find().sort({ measuredAt: -1 }).limit(1000);
  const header = ["id", "batchId", "temperature", "humidity", "luminosity", "measuredAt", "source"];
  const rows = measurements.map((m) =>
    [m._id, m.batchId, m.temperature, m.humidity, m.luminosity, m.measuredAt.toISOString(), m.source]
      .map(escapeCsv)
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=greenherb-report.csv");
  return res.status(200).send(csv);
}

module.exports = {
  exportReport,
};
