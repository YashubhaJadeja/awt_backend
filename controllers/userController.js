const pool = require("../db");
const bcrypt = require("bcrypt");

// get all users (Manager only)
const getAllUsers = async (req, res) => {
    if (req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied. Manager only." });
    }
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at, r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    res.status(200).json({ users: result.rows });
  } catch (err) {
    console.error("Get all users error:", err.message);
    res.status(500).json({ message: "Internal server error." });
  } 
};

// create new user (Manager only)
const createUser = async (req, res) => {
    if (req.user.role !== "manager") {  
        return res.status(403).json({ message: "Access denied. Manager only." });
    }
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required." });
    }   
    try {
        // Check if email already exists
        const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);    
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: "Email already in use." });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Look up role_id
        const roleResult = await pool.query("SELECT id FROM roles WHERE LOWER(name) = LOWER($1)", [role]);
        if (roleResult.rows.length === 0) {
            return res.status(400).json({ message: `Invalid role '${role}'. Valid roles: user, support, manager.` });
        }
        const roleId = roleResult.rows[0].id;
        // Insert new user
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, created_at`,
            [name, email, hashedPassword, roleId]
        );
        res.status(201).json({ message: "User created successfully.", user: { ...result.rows[0], role } });
    } catch (err) {
        console.error("Create user error:", err.message);
        res.status(500).json({ message: "Internal server error." });
    } 
};

// Get user by ID (manager or self)
const getUserById = async (req, res) => {
    const { id } = req.params;
    // Only manager or the user themselves can access
    if (req.user.role !== "manager" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: "Access denied." });
    }  
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.created_at, r.name AS role
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [id]
      );    
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error("Get user by ID error:", err.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = { getAllUsers, createUser, getUserById };



