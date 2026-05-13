const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const cultivationPlansRouter = require("./routes/cultivation-plans.routes");
const herbsRouter = require("./routes/herbs.routes");
const usersRouter = require("./routes/users.routes");
const batchesRouter = require("./routes/batches.routes");
const tasksRouter = require("./routes/tasks.routes");
const measurementsRouter = require("./routes/measurements.routes");
const alertsRouter = require("./routes/alerts.routes");
const automationRouter = require("./routes/automation.routes");
const reportsRouter = require("./routes/reports.routes");
const auditLogsRouter = require("./routes/audit-logs.routes");

const { notFoundHandler, errorHandler } = require("./middlewares/error-handler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/users", usersRouter);
app.use("/api/v1/herbs", herbsRouter);
app.use("/api/v1/cultivation-plans", cultivationPlansRouter);
app.use("/api/v1/batches", batchesRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/measurements", measurementsRouter);
app.use("/api/v1/alerts", alertsRouter);
app.use("/api/v1/automation", automationRouter);
app.use("/api/v1/reports", reportsRouter);
app.use("/api/v1/audit-logs", auditLogsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
