const express = require("express");
const router = express.Router();
const { editComment, deleteComment } = require("../controllers/commentController");
const { verifyToken } = require("../middleware/authMiddleware");

// PATCH  /api/comments/:id  — author or MANAGER
router.patch("/:id", verifyToken, editComment);

// DELETE /api/comments/:id  — author or MANAGER
router.delete("/:id", verifyToken, deleteComment);

module.exports = router;
