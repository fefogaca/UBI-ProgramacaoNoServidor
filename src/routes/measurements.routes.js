const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const {
  listMeasurements,
  createMeasurement,
} = require("../controllers/measurements.controller");

const router = express.Router();

router.get("/", asyncHandler(listMeasurements));
router.post("/", asyncHandler(createMeasurement));

module.exports = router;
