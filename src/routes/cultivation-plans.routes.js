const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const {
  listCultivationPlans,
  createCultivationPlan,
  getCultivationPlanById,
  patchCultivationPlan,
  deleteCultivationPlan,
} = require("../controllers/cultivation-plans.controller");

const router = express.Router();

router.get("/", asyncHandler(listCultivationPlans));
router.post("/", asyncHandler(createCultivationPlan));
router.get("/:planId", asyncHandler(getCultivationPlanById));
router.patch("/:planId", asyncHandler(patchCultivationPlan));
router.delete("/:planId", asyncHandler(deleteCultivationPlan));

module.exports = router;
