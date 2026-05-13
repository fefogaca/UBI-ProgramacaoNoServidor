const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const {
  listAlerts,
  getAlertById,
  resolveAlert,
  ignoreAlert,
} = require("../controllers/alerts.controller");

const router = express.Router();

router.get("/", asyncHandler(listAlerts));
router.get("/:alertId", asyncHandler(getAlertById));
router.post("/:alertId/resolve", asyncHandler(resolveAlert));
router.post("/:alertId/ignore", asyncHandler(ignoreAlert));

module.exports = router;
