const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { createHerb } = require("../controllers/herbs.controller");

const router = express.Router();

router.post("/", asyncHandler(createHerb));

module.exports = router;
