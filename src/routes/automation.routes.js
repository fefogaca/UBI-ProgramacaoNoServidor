const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { getMode, updateMode } = require("../controllers/automation.controller");

const router = express.Router();

router.get("/mode", asyncHandler(getMode));
router.put("/mode", asyncHandler(updateMode));

module.exports = router;
