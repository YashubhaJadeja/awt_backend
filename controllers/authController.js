const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config(); 

 
// ─── Login ──
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        // Find user by email
        const userResult = await pool.query(
            `SELECT u.id, u.name, u.email, u.password, u.created_at, r.name AS role
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.email = $1`,
            [email]
        );
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        const user = userResult.rows[0];
        // Compare password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role.toLowerCase() },
            process.env.SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
        );
        res.status(200).json({
            message: "Login successful.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            },
            token,
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = { login };