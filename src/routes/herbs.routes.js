const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const {
  listHerbs,
  createHerb,
  getHerbById,
  patchHerb,
  deleteHerb,
  importHerbs,
} = require("../controllers/herbs.controller");

const router = express.Router();

router.get("/", asyncHandler(listHerbs));
router.post("/", asyncHandler(createHerb));
router.post("/import", asyncHandler(importHerbs));
router.get("/:herbId", asyncHandler(getHerbById));
router.patch("/:herbId", asyncHandler(patchHerb));
router.delete("/:herbId", asyncHandler(deleteHerb));

module.exports = router;
