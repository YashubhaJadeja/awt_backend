const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  createUser,
  getUserById,
} = require("../controllers/userController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// POST /api/users         — manager only: create a user
router.post("/", verifyToken, authorizeRoles("manager"), createUser);

// GET /api/users          — manager only: list all users
router.get("/", verifyToken, authorizeRoles("manager"), getAllUsers);

// GET /api/users/:id      — manager or self
router.get("/:id", verifyToken, getUserById);

module.exports = router;
