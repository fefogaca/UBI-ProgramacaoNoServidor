const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { exportReport } = require("../controllers/reports.controller");

const router = express.Router();

router.get("/export", asyncHandler(exportReport));

module.exports = router;
