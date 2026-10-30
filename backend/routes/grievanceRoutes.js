
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createGrievance,
    getMyGrievances,
    getGrievanceById,
    getAllGrievances,
    updateGrievanceStatus,
    getOfficerGrievanceById
} = require("../controllers/grievanceController");

// Configure photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName);
    }
});

// Accept image files only, with a 5 MB limit
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed"));
        }

        cb(null, true);
    }
});

// Create grievance with an optional issue photo
router.post(
    "/",
    authMiddleware,
    upload.single("photo"),
    createGrievance
);

// Get logged-in user's grievances
router.get("/my", authMiddleware, getMyGrievances);

// Temporary officer test route
router.get(
    "/officer-test",
    authMiddleware,
    roleMiddleware("officer"),
    (req, res) => {
        res.json({
            message: "Officer access granted!",
            user: req.user
        });
    }
);

router.get(
    "/officer/all",
    authMiddleware,
    roleMiddleware("officer"),
    getAllGrievances
);

router.put(
    "/officer/:id/status",
    authMiddleware,
    roleMiddleware("officer"),
    updateGrievanceStatus
);

router.get(
    "/officer/:id",
    authMiddleware,
    roleMiddleware("officer"),
    getOfficerGrievanceById
);

// Get single grievance details
router.get("/:id", authMiddleware, getGrievanceById);

module.exports = router;
