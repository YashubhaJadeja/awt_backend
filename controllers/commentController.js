const pool = require("../db");

// ─── Add Comment to Ticket ────────────────────────────────────────────────────
const addComment = async (req, res) => {
  const { id: ticketId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content is required." });
  }

  try {
    // Verify ticket exists
    const ticketCheck = await pool.query("SELECT id FROM tickets WHERE id = $1", [ticketId]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    const result = await pool.query(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [ticketId, req.user.id, content.trim()]
    );

    res.status(201).json({ message: "Comment added.", comment: result.rows[0] });
  } catch (err) {
    console.error("Add comment error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── List Comments for a Ticket ──────────────────────────────────────────────
const getComments = async (req, res) => {
  const { id: ticketId } = req.params;

  try {
    // Verify ticket exists
    const ticketCheck = await pool.query("SELECT id FROM tickets WHERE id = $1", [ticketId]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    const result = await pool.query(
      `SELECT c.*, u.name AS author_name, r.name AS author_role
       FROM ticket_comments c
       JOIN users u ON c.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at ASC`,
      [ticketId]
    );

    res.status(200).json({ comments: result.rows });
  } catch (err) {
    console.error("Get comments error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Edit Comment (author or MANAGER) ────────────────────────────────────────
const editComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content is required." });
  }

  try {
    const commentResult = await pool.query(
      "SELECT * FROM ticket_comments WHERE id = $1",
      [id]
    );
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const comment = commentResult.rows[0];

    // Only the author or a manager can edit
    if (req.user.role !== "manager" && comment.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Access denied. You can only edit your own comments." });
    }

    const result = await pool.query(
      `UPDATE ticket_comments
       SET comment = $1
       WHERE id = $2
       RETURNING *`,
      [content.trim(), id]
    );

    res.status(200).json({ message: "Comment updated.", comment: result.rows[0] });
  } catch (err) {
    console.error("Edit comment error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Delete Comment (user or MANAGER) ──────────────────────────────────────
const deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const commentResult = await pool.query(
      "SELECT * FROM ticket_comments WHERE id = $1",
      [id]
    );
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const comment = commentResult.rows[0];

    // Only the author or a manager can delete
    if (req.user.role !== "manager" && comment.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Access denied. You can only delete your own comments." });
    }

    await pool.query("DELETE FROM ticket_comments WHERE id = $1", [id]);
    res.status(200).json({ message: "Comment deleted." });
  } catch (err) {
    console.error("Delete comment error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { addComment, getComments, editComment, deleteComment };
