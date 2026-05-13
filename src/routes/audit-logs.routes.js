const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { listAuditLogs } = require("../controllers/audit-logs.controller");

const router = express.Router();

router.get("/", asyncHandler(listAuditLogs));

module.exports = router;
