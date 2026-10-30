
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

async function createOfficer() {
    try {
        const full_name = "Test Officer";
        const email = "officer@test.com";
        const password = "Officer@123";

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `UPDATE users
             SET password = $1, role = 'officer'
             WHERE email = $2`,
            [hashedPassword, email]
        );

        console.log("Officer account password updated.");
        console.log("Email: " + email);
        console.log("Password: " + password);
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await pool.end();
    }
}

createOfficer();
