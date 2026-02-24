const express = require("express");
const router = express.Router();
const {
  createTicket,
  getTickets,
  assignTicket,
  updateTicketStatus,
  deleteTicket,
} = require("../controllers/ticketController");
const { addComment, getComments } = require("../controllers/commentController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// POST /api/tickets               — USER, MANAGER
router.post("/", verifyToken, authorizeRoles("user", "manager"), createTicket);

// GET  /api/tickets               — MANAGER (all), SUPPORT (assigned), USER (own)
router.get("/", verifyToken, getTickets);

// PATCH /api/tickets/:id/assign   — MANAGER, SUPPORT
router.patch(
  "/:id/assign",
  verifyToken,
  authorizeRoles("manager", "support"),
  assignTicket
);

// PATCH /api/tickets/:id/status   — MANAGER, SUPPORT
router.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles("manager", "support"),
  updateTicketStatus
);

// DELETE /api/tickets/:id         — MANAGER
router.delete("/:id", verifyToken, authorizeRoles("manager"), deleteTicket);

// ─── Comments sub-routes ──────────────────────────────────────────────────────
// POST /api/tickets/:id/comments  — all authenticated users
router.post("/:id/comments", verifyToken, addComment);

// GET  /api/tickets/:id/comments  — all authenticated users
router.get("/:id/comments", verifyToken, getComments);

module.exports = router;
