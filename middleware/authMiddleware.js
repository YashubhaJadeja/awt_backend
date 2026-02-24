const jwt = require("jsonwebtoken");
require("dotenv").config();
const verifyToken = (req, res, next) => {
  // Token can come from Authorization header: "Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 
    if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
    }
    try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // { id, email, role }
    next();
    }

    catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
    }
};
// Role-based authorization middleware factory
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Access denied. Required role: ${roles.join(" or ")}` });
    }
    next();
  };
};
module.exports = { verifyToken, authorizeRoles };

