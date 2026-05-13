const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cultivationPlansRouter = require("./routes/cultivation-plans.routes");
const herbsRouter = require("./routes/herbs.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error-handler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/cultivation-plans", cultivationPlansRouter);
app.use("/api/v1/herbs", herbsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
