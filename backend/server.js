const express = require("express");
const pool = require("./config/db");
const cors = require("cors");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const grievanceRoutes = require("./routes/grievanceRoutes");

const app = express();

const fs = require("fs");

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Test route
app.get("/", (req, res) => {
    res.send("AI-Based Smart Grievance System Backend is Running!");
});

// Test PostgreSQL connection
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Database connected successfully!",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// User routes
app.use("/api/users", userRoutes);
app.use("/api/grievances", grievanceRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({
        message: "You accessed a protected route!",
        user: req.user
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});