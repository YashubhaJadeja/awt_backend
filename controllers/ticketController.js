const pool = require("../db");

// ─── Create Ticket (USER, MANAGER) ───────────────────────────────────────────
const createTicket = async (req, res) => {
  const { title, description, priority } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tickets (title, description, status, priority, created_by)
       VALUES ($1, $2, 'OPEN', $3, $4)
       RETURNING *`,
      [title, description || null, (priority || "MEDIUM").toUpperCase(), req.user.id]
    );
    res.status(201).json({ message: "Ticket created.", ticket: result.rows[0] });
  } catch (err) {
    console.error("Create ticket error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Get Tickets ─ as given in doc 
// MANAGER → all tickets
// SUPPORT → tickets assigned to them
// USER    → tickets they created

const getTickets = async (req, res) => {
  const { role, id } = req.user;

  try {
    let result;

    if (role === "manager") {
      result = await pool.query(
        `SELECT t.*, 
                u1.name AS created_by_name, 
                u2.name AS assigned_to_name
         FROM tickets t
         LEFT JOIN users u1 ON t.created_by  = u1.id
         LEFT JOIN users u2 ON t.assigned_to = u2.id
         ORDER BY t.created_at DESC`
      );
    } else if (role === "support") {
      result = await pool.query(
        `SELECT t.*, 
                u1.name AS created_by_name, 
                u2.name AS assigned_to_name
         FROM tickets t
         LEFT JOIN users u1 ON t.created_by  = u1.id
         LEFT JOIN users u2 ON t.assigned_to = u2.id
         WHERE t.assigned_to = $1
         ORDER BY t.created_at DESC`,
        [id]
      );
    } else {
      // role === "user"
      result = await pool.query(
        `SELECT t.*, 
                u1.name AS created_by_name, 
                u2.name AS assigned_to_name
         FROM tickets t
         LEFT JOIN users u1 ON t.created_by  = u1.id
         LEFT JOIN users u2 ON t.assigned_to = u2.id
         WHERE t.created_by = $1
         ORDER BY t.created_at DESC`,
        [id]
      );
    }

    res.status(200).json({ tickets: result.rows });
  } catch (err) {
    console.error("Get tickets error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Assign Ticket (MANAGER, SUPPORT) ────────────────────────────────────────
const assignTicket = async (req, res) => {
  const { id } = req.params;
  const { assigned_to } = req.body;

  if (!assigned_to) {
    return res.status(400).json({ message: "assigned_to user ID is required." });
  }

  try {
    // Verify ticket exists
    const ticketCheck = await pool.query("SELECT id FROM tickets WHERE id = $1", [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    // Verify assignee exists and has support or manager role
    const userCheck = await pool.query(
      `SELECT u.id, r.name AS role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [assigned_to]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "Assignee user not found." });
    }
    if (!["support", "manager"].includes(userCheck.rows[0].role)) {
      return res
        .status(400)
        .json({ message: "Tickets can only be assigned to support or manager users." });
    }

    const result = await pool.query(
      `UPDATE tickets
       SET assigned_to = $1
       WHERE id = $2
       RETURNING *`,
      [assigned_to, id]
    );
    res.status(200).json({ message: "Ticket assigned.", ticket: result.rows[0] });
  } catch (err) {
    console.error("Assign ticket error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Update Ticket Status (MANAGER, SUPPORT) ─────────────────────────────────
const updateTicketStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return res
      .status(400)
      .json({ message: `Status must be one of: ${validStatuses.join(", ")}.` });
  }

  try {
    const ticketCheck = await pool.query("SELECT id, assigned_to FROM tickets WHERE id = $1", [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    // SUPPORT can only update tickets assigned to them
    if (
      req.user.role === "support" &&
      ticketCheck.rows[0].assigned_to !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Access denied. Ticket is not assigned to you." });
    }

    const result = await pool.query(
      `UPDATE tickets
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status.toUpperCase(), id]
    );
    res.status(200).json({ message: "Ticket status updated.", ticket: result.rows[0] });
  } catch (err) {
    console.error("Update ticket status error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Delete Ticket (MANAGER) ─────────────────────────────────────────────────
const deleteTicket = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM tickets WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }
    res.status(200).json({ message: "Ticket deleted." });
  } catch (err) {
    console.error("Delete ticket error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  createTicket,
  getTickets,
  assignTicket,
  updateTicketStatus,
  deleteTicket,
};
