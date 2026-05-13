const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const {
  listUsers,
  createUser,
  getUserById,
  patchUser,
  deleteUser,
} = require("../controllers/users.controller");

const router = express.Router();

router.get("/", asyncHandler(listUsers));
router.post("/", asyncHandler(createUser));
router.get("/:userId", asyncHandler(getUserById));
router.patch("/:userId", asyncHandler(patchUser));
router.delete("/:userId", asyncHandler(deleteUser));

module.exports = router;
