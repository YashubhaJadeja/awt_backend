const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const authRoutes    = require("./routes/authRoutes");
const userRoutes    = require("./routes/userRoutes");
const ticketRoutes  = require("./routes/ticketRoutes");
const commentRoutes = require("./routes/commentRoutes");

const app = express();

// ─── Middleware ─
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes 
app.use("/auth",     authRoutes);
app.use("/users",    userRoutes);
app.use("/tickets",  ticketRoutes);
app.use("/comments", commentRoutes);

// ─── Root health-check 
app.get("/", (req, res) => {
  res.json({ message: "Backend API is running!", status: "OK" });
});

// ─── 404 handler ─
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});


// ─── Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Internal server error." });
});

// ─── Start server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
