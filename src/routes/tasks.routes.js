const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const {
  listTasks,
  createTask,
  getTaskById,
  patchTask,
  completeTask,
} = require("../controllers/tasks.controller");

const router = express.Router();

router.get("/", asyncHandler(listTasks));
router.post("/", asyncHandler(createTask));
router.get("/:taskId", asyncHandler(getTaskById));
router.patch("/:taskId", asyncHandler(patchTask));
router.post("/:taskId/complete", asyncHandler(completeTask));

module.exports = router;
