const pool = require("../config/db");

// Create a new grievance

const createGrievance = async (req, res) => {
    let client;
    let transactionStarted = false;

    try {
        client = await pool.connect();

        const {
            title,
            description,
            department_id,
            category,
            priority,
            location_address,
            latitude,
            longitude
        } = req.body;

        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                message: "Title and description are required"
            });
        }

        // Validate GPS coordinates when provided
        const lat = latitude === "" || latitude == null
            ? null
            : Number(latitude);

        const lng = longitude === "" || longitude == null
            ? null
            : Number(longitude);

        if (
            (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
            (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180))
        ) {
            return res.status(400).json({
                message: "Invalid GPS coordinates"
            });
        }

        await client.query("BEGIN");
        transactionStarted = true;

        // Save grievance and location
        const grievanceResult = await client.query(
            `INSERT INTO grievances
            (
                user_id,
                department_id,
                title,
                description,
                category,
                priority,
                status,
                location_address,
                latitude,
                longitude
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                req.user.user_id,
                department_id || null,
                title,
                description,
                category || null,
                priority || "medium",
                "submitted",
                location_address || null,
                lat,
                lng
            ]
        );

        const grievance = grievanceResult.rows[0];

        // Save uploaded photo information, if provided
        if (req.file) {
            await client.query(
                `INSERT INTO attachments
                (grievance_id, file_name, file_path, file_type)
                VALUES ($1, $2, $3, $4)`,
                [
                    grievance.grievance_id,
                    req.file.originalname,
                    `/uploads/${req.file.filename}`,
                    req.file.mimetype
                ]
            );
        }

        // Record initial status history
        await client.query(
            `INSERT INTO grievance_status_history
            (grievance_id, status, remarks, changed_by)
            VALUES ($1, $2, $3, $4)`,
            [
                grievance.grievance_id,
                "submitted",
                "Grievance submitted successfully by the citizen.",
                req.user.user_id
            ]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        res.status(201).json({
            message: "Grievance submitted successfully",
            grievance: grievance,
            photo: req.file
                ? `/uploads/${req.file.filename}`
                : null
        });

    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError.message);
            }
        }

        console.error("Create grievance error:", error.message);

        res.status(500).json({
            message: "Server error while creating grievance"
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// Get grievances submitted by logged-in user
const getMyGrievances = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                g.grievance_id,
                g.title,
                g.description,
                g.category,
                g.priority,
                g.status,
                d.department_name,
                g.created_at,
                g.updated_at
            FROM grievances g
            LEFT JOIN departments d
                ON g.department_id = d.department_id
            WHERE g.user_id = $1
            ORDER BY g.created_at DESC`,
            [req.user.user_id]
        );

        res.json({
            message: "Grievances fetched successfully",
            grievances: result.rows
        });

    } catch (error) {
        console.error("Get grievances error:", error.message);

        res.status(500).json({
            message: "Server error while fetching grievances"
        });
    }
};


const getGrievanceById = async (req, res) => {
    try {
        const { id } = req.params;

        const grievanceResult = await pool.query(
            `SELECT
                g.grievance_id,
                g.title,
                g.description,
                g.category,
                g.priority,
                g.status,
                g.location_address,
                g.latitude,
                g.longitude,
                d.department_name,
                g.created_at,
                g.updated_at
            FROM grievances g
            LEFT JOIN departments d
                ON g.department_id = d.department_id
            WHERE g.grievance_id = $1
            AND g.user_id = $2`,
            [id, req.user.user_id]
        );

        if (grievanceResult.rows.length === 0) {
            return res.status(404).json({
                message: "Grievance not found"
            });
        }

        const attachmentResult = await pool.query(
            `SELECT
                attachment_id,
                file_name,
                file_path,
                file_type,
                uploaded_at
            FROM attachments
            WHERE grievance_id = $1
            ORDER BY uploaded_at ASC`,
            [id]
        );

        const historyResult = await pool.query(
            `SELECT
                history_id,
                status,
                remarks,
                changed_by,
                changed_at
            FROM grievance_status_history
            WHERE grievance_id = $1
            ORDER BY changed_at ASC`,
            [id]
        );

        res.json({
            message: "Grievance details fetched successfully",
            grievance: {
                ...grievanceResult.rows[0],
                attachments: attachmentResult.rows
            },
            status_history: historyResult.rows
        });

    } catch (error) {
        console.error("Get grievance details error:", error.message);

        res.status(500).json({
            message: "Server error while fetching grievance details"
        });
    }
};


const getAllGrievances = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                g.grievance_id,
                g.title,
                g.description,
                g.category,
                g.priority,
                g.status,
                u.full_name AS citizen_name,
                d.department_name,
                g.created_at,
                g.updated_at
            FROM grievances g
            JOIN users u
                ON g.user_id = u.user_id
            LEFT JOIN departments d
                ON g.department_id = d.department_id
            ORDER BY g.created_at DESC`
        );

        res.json({
            message: "All grievances fetched successfully",
            grievances: result.rows
        });

    } catch (error) {
        console.error("Get all grievances error:", error.message);

        res.status(500).json({
            message: "Server error while fetching grievances"
        });
    }
};

const updateGrievanceStatus = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        const allowedStatuses = [
            "submitted",
            "in_progress",
            "resolved",
            "rejected"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        await client.query("BEGIN");

        const grievanceResult = await client.query(
            `UPDATE grievances
             SET status = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE grievance_id = $2
             RETURNING *`,
            [status, id]
        );

        if (grievanceResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Grievance not found"
            });
        }

        await client.query(
            `INSERT INTO grievance_status_history
             (grievance_id, status, remarks, changed_by)
             VALUES ($1, $2, $3, $4)`,
            [
                id,
                status,
                remarks || null,
                req.user.user_id
            ]
        );

        await client.query("COMMIT");

        res.json({
            message: "Grievance status updated successfully",
            grievance: grievanceResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Update grievance status error:",
            error.message
        );

        res.status(500).json({
            message: "Server error while updating grievance status"
        });

    } finally {
        client.release();
    }
};


const getOfficerGrievanceById = async (req, res) => {
    try {
        const { id } = req.params;

        const grievanceResult = await pool.query(
            `SELECT
                g.grievance_id,
                g.title,
                g.description,
                g.category,
                g.priority,
                g.status,
                g.location_address,
                g.latitude,
                g.longitude,
                u.full_name AS citizen_name,
                u.email AS citizen_email,
                u.phone AS citizen_phone,
                d.department_name,
                g.created_at,
                g.updated_at
            FROM grievances g
            JOIN users u
                ON g.user_id = u.user_id
            LEFT JOIN departments d
                ON g.department_id = d.department_id
            WHERE g.grievance_id = $1`,
            [id]
        );

        if (grievanceResult.rows.length === 0) {
            return res.status(404).json({
                message: "Grievance not found"
            });
        }

        const attachmentResult = await pool.query(
            `SELECT
                attachment_id,
                file_name,
                file_path,
                file_type,
                uploaded_at
            FROM attachments
            WHERE grievance_id = $1
            ORDER BY uploaded_at ASC`,
            [id]
        );

        const historyResult = await pool.query(
            `SELECT
                h.history_id,
                h.status,
                h.remarks,
                u.full_name AS changed_by_name,
                h.changed_at
            FROM grievance_status_history h
            LEFT JOIN users u
                ON h.changed_by = u.user_id
            WHERE h.grievance_id = $1
            ORDER BY h.changed_at ASC`,
            [id]
        );

        res.json({
            message: "Officer grievance details fetched successfully",
            grievance: grievanceResult.rows[0],
            attachments: attachmentResult.rows,
            status_history: historyResult.rows
        });

    } catch (error) {
        console.error(
            "Get officer grievance details error:",
            error.message
        );

        res.status(500).json({
            message: "Server error while fetching grievance details"
        });
    }
};

module.exports = {
    createGrievance,
    getMyGrievances,
    getGrievanceById,
    getAllGrievances,
    updateGrievanceStatus,
    getOfficerGrievanceById
};