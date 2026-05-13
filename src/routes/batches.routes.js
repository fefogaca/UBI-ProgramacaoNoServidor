const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const {
  listBatches,
  createBatch,
  getBatchById,
  patchBatch,
  deleteBatch,
  attachPlan,
  splitBatch,
  registerLoss,
  getProductivity,
  getPlanVsActual,
} = require("../controllers/batches.controller");

const router = express.Router();

router.get("/", asyncHandler(listBatches));
router.post("/", asyncHandler(createBatch));
router.get("/:batchId", asyncHandler(getBatchById));
router.patch("/:batchId", asyncHandler(patchBatch));
router.delete("/:batchId", asyncHandler(deleteBatch));
router.post("/:batchId/plans", asyncHandler(attachPlan));
router.post("/:batchId/split", asyncHandler(splitBatch));
router.post("/:batchId/losses", asyncHandler(registerLoss));
router.get("/:batchId/productivity", asyncHandler(getProductivity));
router.get("/:batchId/plan-vs-actual", asyncHandler(getPlanVsActual));

module.exports = router;
