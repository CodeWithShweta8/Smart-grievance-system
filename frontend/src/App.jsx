import { useState } from "react";
import "./App.css";
import LocationPicker from "./LocationPicker";

function App() {
    const [page, setPage] = useState("login");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [user, setUser] = useState(null);

    const [grievances, setGrievances] = useState([]);

    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [grievanceHistory, setGrievanceHistory] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [loadingGrievances, setLoadingGrievances] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState("medium");
    const [photo, setPhoto] = useState(null);
    const [locationAddress, setLocationAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [locationMessage, setLocationMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleViewGrievances = async () => {
    setLoadingGrievances(true);

    try {
        const response = await fetch(
            "http://localhost:5000/api/grievances/my",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to load grievances.");
            return;
        }

        setGrievances(data.grievances || []);
        setPage("my-grievances");
    } catch (error) {
        alert("Unable to connect to the server. Please try again.");
    } finally {
        setLoadingGrievances(false);
    }
};


const handleViewAllOfficerGrievances = async () => {
    setLoadingGrievances(true);

    try {
        const response = await fetch(
            "http://localhost:5000/api/grievances/officer/all",
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to load grievances.");
            return;
        }

        setGrievances(data.grievances || []);
        setPage("officer-grievances");
    } catch (error) {
        console.error("Officer grievances error:", error);
        alert("Unable to connect to the server.");
    } finally {
        setLoadingGrievances(false);
    }
};

const handleTrackGrievance = async (grievanceId) => {
    setLoadingDetails(true);

    try {
        const response = await fetch(
            `http://localhost:5000/api/grievances/${grievanceId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to load grievance details.");
            return;
        }

        const grievance = data.grievance || data;
        setSelectedGrievance(grievance);
        setGrievanceHistory(
    data.status_history ||
    data.history ||
    data.statusHistory ||
    grievance.status_history ||
    []
);
        setPage("track-details");
    } catch (error) {
        console.error("Track grievance error:", error);
        alert("Unable to connect to the server.");
    } finally {
        setLoadingDetails(false);
    }
};


const handleOfficerViewDetails = async (grievanceId) => {
    setLoadingDetails(true);

    try {
        const response = await fetch(
            `http://localhost:5000/api/grievances/officer/${grievanceId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );

        const data = await response.json();
        console.log("Officer grievance data:", data);

        if (!response.ok) {
            alert(data.message || "Unable to load grievance details.");
            return;
        }

        const grievance = data.grievance || data;

        setSelectedGrievance({
            ...grievance,
            attachments: data.attachments || [],
            status_history:
                data.status_history || data.history || data.statusHistory || [],
        });

        setGrievanceHistory(
            data.status_history || data.history || data.statusHistory || []
        );

        setPage("track-details");
    } catch (error) {
        console.error("Officer grievance details error:", error);
        alert("Unable to connect to the server.");
    } finally {
        setLoadingDetails(false);
    }
};


    const departments = [
        { id: 1, name: "Water Supply" },
        { id: 2, name: "Electricity" },
        { id: 3, name: "Roads and Transport" },
        { id: 4, name: "Sanitation" },
        { id: 5, name: "Municipal Services" },
        { id: 6, name: "Public Health" },
        { id: 7, name: "Street Lighting" }
    ];

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "http://localhost:5000/api/users/login",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login failed");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setUser(data.user);

            console.log("Logged-in user:", data.user);
            console.log("User role:", data.user.role);

            setPage(data.user.role === "officer" ? "officer-dashboard" : "dashboard");
        } catch (error) {
            console.error(error);
            alert("Unable to connect to server.");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/users/register",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: fullName,
                        email,
                        password,
                        phone,
                        role: "citizen"
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Registration failed");
                return;
            }

            alert("Registration successful! Please log in.");

            setEmail("");
            setPassword("");
            setFullName("");
            setPhone("");
            setConfirmPassword("");
            setPage("login");
        } catch (error) {
            console.error(error);
            alert("Unable to connect to server.");
        }
    };

    const handleSubmitGrievance = async (e) => {
        e.preventDefault();

        if (!photo) {
            alert("Please upload a photo of the issue.");
            return;
        }

        if (photo.size > 5 * 1024 * 1024) {
            alert("Photo size must be 5 MB or less.");
            return;
        }

        if (!locationAddress.trim()) {
            alert("Please enter the location of the issue.");
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();

            formData.append("title", title);
            formData.append("description", description);
            formData.append(
                "department_id",
                departmentId ? String(Number(departmentId)) : ""
            );
            formData.append("category", category);
            formData.append("priority", priority);
            formData.append("location_address", locationAddress.trim());

            if (latitude !== "" && longitude !== "") {
                formData.append("latitude", latitude);
                formData.append("longitude", longitude);
            }

            formData.append("photo", photo);

            const response = await fetch(
                "http://localhost:5000/api/grievances",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Unable to submit grievance");
                return;
            }

            alert(
                `Grievance submitted successfully! Grievance ID: ${
                    data.grievance.grievance_id
                }`
            );

            setTitle("");
            setDescription("");
            setDepartmentId("");
            setCategory("");
            setPriority("medium");
            setPhoto(null);
            setLocationAddress("");
            setLatitude("");
            setLongitude("");
            setLocationMessage("");

            // Clear the file input after a successful submission.
            const photoInput = document.getElementById("grievance-photo");
            if (photoInput) photoInput.value = "";

            setPage("dashboard");
        } catch (error) {
            console.error("Submit grievance error:", error);
            alert("Unable to connect to server.");
        } finally {
            setSubmitting(false);
        }
    };

    
const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
        setLocationMessage(
            "GPS is not supported by this browser."
        );
        return;
    }

    setLocationMessage("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            setLatitude(String(lat));
            setLongitude(String(lng));

            setLocationMessage(
                `Location captured! Accuracy: approximately ${Math.round(accuracy)} metres.`
            );
        },
        (error) => {
            console.error("GPS error:", error.code, error.message);

            if (error.code === 1) {
                setLocationMessage(
                    "Location permission denied. Allow location access in Chrome."
                );
            } else if (error.code === 2) {
                setLocationMessage(
                    "Location unavailable. Check your device location settings and try again."
                );
            } else if (error.code === 3) {
                setLocationMessage(
                    "Location request timed out. Please try again."
                );
            } else {
                setLocationMessage(
                    "Unable to detect location. Enter the address manually."
                );
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        }
    );
};

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setEmail("");
        setPassword("");
        setPage("login");
    };

    
if (page === "track-details" && selectedGrievance) {
    const g = selectedGrievance;

    return (
        <div className="dashboard">
            <nav className="navbar">
                <h2>Smart Grievance System</h2>
                <button onClick={() => setPage("my-grievances")}>
                    Back to My Grievances
                </button>
            </nav>

            <div className="dashboard-content">
                <h1>Grievance Tracking</h1>
                <p>Track the details and progress of your complaint.</p>

                <div className="dashboard-card">
                    <h3>Grievance #{g.grievance_id || g.id}</h3>
                    <p><strong>Title:</strong> {g.title || "N/A"}</p>
                    <p><strong>Description:</strong> {g.description || "N/A"}</p>
                    <p>
                        <strong>Department:</strong>{" "}
                        {g.department_name || g.department || "Not assigned"}
                    </p>
                    <p><strong>Priority:</strong> {g.priority || "Medium"}</p>
                    <p>
                        <strong>Current Status:</strong>{" "}
                        <span className="status-badge">
                            {(g.status || "submitted").replace("_", " ")}
                        </span>
                    </p>
                    <p>
                        <strong>Date Submitted:</strong>{" "}
                        {g.created_at
                            ? new Date(g.created_at).toLocaleDateString("en-IN")
                            : "N/A"}
                    </p>
                </div>

                
<div className="dashboard-card" style={{ marginTop: "24px" }}>
    <h2>Complaint Location & Photo</h2>

    <p><strong>Address:</strong> {selectedGrievance.location_address || "No address provided"}</p>
    <p><strong>Latitude:</strong> {selectedGrievance.latitude ?? "Not available"}</p>
    <p><strong>Longitude:</strong> {selectedGrievance.longitude ?? "Not available"}</p>

    <h3>Complaint Photo</h3>
    {selectedGrievance.attachments?.length > 0 ? (
        selectedGrievance.attachments.map((attachment) => (
            <div key={attachment.attachment_id}>
                <img
                    src={`http://localhost:5000${attachment.file_path}`}
                    alt="Complaint evidence"
                    style={{ width: "400px", maxWidth: "100%", maxHeight: "300px", objectFit: "contain" }}
                />
            </div>
        ))
    ) : (
        <p>No complaint photo uploaded.</p>
    )}

    {selectedGrievance.latitude != null && selectedGrievance.longitude != null && (
        <>
            <h3>Map Location</h3>
            <iframe
                title="Complaint location map"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: "8px" }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?marker=${selectedGrievance.latitude},${selectedGrievance.longitude}&layer=mapnik`}
            />
        </>
    )}
</div>


                <div className="dashboard-card" style={{ marginTop: "24px" }}>
                    <h2>Status History</h2>
                    {grievanceHistory.length === 0 ? (
                        <p>No additional status history is available yet.</p>
                    ) : (
                        grievanceHistory.map((item, index) => (
                            <div
                                key={item.id || index}
                                style={{
                                    padding: "14px 0",
                                    borderBottom: "1px solid #e2e8f0"
                                }}
                            >
                                <strong>
                                    {(item.status || item.new_status || "Updated")
                                        .replace("_", " ")}
                                </strong>
                                <p>
                                    {item.remarks ||
                                        item.comment ||
                                        item.description ||
                                        "Status recorded"}
                                </p>
                                <small>
                                    {item.created_at
                                        ? new Date(item.created_at).toLocaleString("en-IN")
                                        : ""}
                                </small>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

    if (page === "my-grievances") {
        
    return (
        <div className="dashboard">
            <nav className="navbar">
                <h2>Smart Grievance System</h2>
                <button onClick={() => setPage("dashboard")}>
                    Back to Dashboard
                </button>
            </nav>

            <div className="dashboard-content">
                <h1>My Grievances</h1>
                <p>View and track the complaints you have submitted.</p>

                {grievances.length === 0 ? (
                    <div className="dashboard-card">
                        <h3>No grievances found</h3>
                        <p>You have not submitted any grievances yet.</p>
                    </div>
                ) : (
                    <div className="grievance-table-wrapper">
                        <table className="grievance-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Department</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Date Submitted</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {grievances.map((g) => (
                                    <tr key={g.grievance_id || g.id}>
                                        <td>{g.grievance_id || g.id}</td>
                                        <td>{g.title}</td>
                                        <td>
                                            {g.department_name ||
                                                g.department ||
                                                "Not assigned"}
                                        </td>
                                        <td>{g.priority || "Medium"}</td>
                                        <td>
                                            <span className="status-badge">
                                                {(g.status || "submitted")
                                                    .replace("_", " ")}
                                            </span>
                                        </td>
                                        <td>
                                            {g.created_at
                                                ? new Date(
                                                      g.created_at
                                                  ).toLocaleDateString("en-IN")
                                                : "N/A"}
                                        </td>
                                    <td>
                                    <button
                                    onClick={() => handleTrackGrievance(g.grievance_id || g.id)}
                                    disabled={loadingDetails}
                                    >
                                    Track
                                    </button>
                                    </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <button
                    onClick={() => setPage("submit")}
                    className="new-grievance-button"
                >
                    + Submit New Grievance
                </button>
            </div>
        </div>
    );
}
if (page === "submit") {
        return (
            <div className="dashboard">
                <nav className="navbar">
                    <h2>Smart Grievance System</h2>
                    <button onClick={() => setPage("dashboard")}>
                        Back to Dashboard
                    </button>
                </nav>

                <div className="form-page">
                    <div className="form-card">
                        <h1>Submit a Grievance</h1>
                        <p className="subtitle">
                            Report your civic problem to the concerned department.
                        </p>

                        <form onSubmit={handleSubmitGrievance}>
                            <label>Grievance Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Street light not working"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                maxLength={200}
                            />

                            <label>Problem Description</label>
                            <textarea
                                placeholder="Describe the problem and its location..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={5}
                            />

                            <label>Government Department</label>
                            <select
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                            >
                                <option value="">Select a department</option>
                                {departments.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {department.name}
                                    </option>
                                ))}
                            </select>

                            <label>Category</label>
                            <input
                                type="text"
                                placeholder="e.g. Repair, Water Leakage"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            />

                            <label>Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>

                            <label>Issue Location / Address</label>
                            <input
                                type="text"
                                placeholder="e.g. Near main bus stop, Rankala Road, Kolhapur"
                                value={locationAddress}
                                onChange={(e) => setLocationAddress(e.target.value)}
                                required
                                maxLength={500}
                            />

                            <button
                                type="button"
                                onClick={handleUseCurrentLocation}
                                className="secondary-button"
                            >
                                Use My Current GPS Location
                            </button>

                            {locationMessage && (
                                <p role="status">{locationMessage}</p>
                            )}

                            {latitude && longitude && (
                                <p>
                                    GPS saved: {latitude}, {longitude}
                                </p>
                            )}

                            <LocationPicker
                            latitude={latitude}
                            longitude={longitude}
                            setLatitude={setLatitude}
                            setLongitude={setLongitude}
                            />

                            <label>Upload Issue Photo (required, max 5 MB)</label>
                            <input
                                id="grievance-photo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const selectedFile = e.target.files?.[0] || null;

                                    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
                                        alert("Photo size must be 5 MB or less.");
                                        e.target.value = "";
                                        setPhoto(null);
                                        return;
                                    }

                                    setPhoto(selectedFile);
                                }}
                                required
                            />

                            {photo && (
                                <p>Selected photo: {photo.name}</p>
                            )}

                            <button type="submit" disabled={submitting}>
                                {submitting
                                    ? "Submitting..."
                                    : "Submit Grievance"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    
if (page === "officer-grievances" && user?.role === "officer") {
    return (
        <div className="dashboard">
            <nav className="navbar">
                <h2>Smart Grievance System — Officer</h2>
                <button onClick={() => setPage("officer-dashboard")}>
                    Back to Officer Dashboard
                </button>
            </nav>

            <div className="dashboard-content">
                <h1>All Citizen Grievances</h1>
                <p>Review complaints submitted by citizens.</p>

                {grievances.length === 0 ? (
                    <div className="dashboard-card">
                        <h3>No grievances found</h3>
                    </div>
                ) : (
                    <div className="grievance-table-wrapper">
                        <table className="grievance-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Citizen</th>
                                    <th>Title</th>
                                    <th>Department</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grievances.map((g) => (
                                    <tr key={g.grievance_id}>
                                        <td>{g.grievance_id}</td>
                                        <td>{g.citizen_name || "N/A"}</td>
                                        <td>{g.title}</td>
                                        <td>{g.department_name || "Not assigned"}</td>
                                        <td>{g.priority || "Medium"}</td>
                                        
                                        <td>
                                            <span className="status-badge">
                                                {(g.status || "submitted").replace("_", " ")}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleOfficerViewDetails(g.grievance_id)}
                                                disabled={loadingDetails}
                                            >
                                            View Details
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

console.log("Current page:", page);
console.log("Current user:", user);

if (page === "officer-dashboard" && user?.role === "officer") {
    return (
        <div className="dashboard">
            <nav className="navbar">
                <h2>Smart Grievance System — Officer</h2>
                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        setUser(null);
                        setPage("login");
                    }}
                >
                    Logout
                </button>
            </nav>

            <div className="dashboard-content">
                <h1>Welcome, {user.full_name || "Officer"}!</h1>
                <p>Manage and respond to citizen grievances.</p>

                <div className="dashboard-card">
                    <h3>Officer Dashboard</h3>
                    <p>View submitted complaints, review their details, and update their status.</p>
                    <button
                    onClick={handleViewAllOfficerGrievances}
                    disabled={loadingGrievances}
                    >
                    {loadingGrievances ? "Loading..." : "View All Grievances"}
                    </button>
                </div>
            </div>
        </div>
    );
}

    if (page === "dashboard" && user) {
        return (
            <div className="dashboard">
                <nav className="navbar">
                    <h2>Smart Grievance System</h2>
                    <button onClick={handleLogout}>Logout</button>
                </nav>

                <div className="dashboard-content">
                    <h1>Welcome, {user.full_name} 👋</h1>
                    <p className="dashboard-subtitle">
                        Manage and track your grievances from here.
                    </p>

                    <div className="dashboard-cards">
                        <div className="dashboard-card">
                            <h3>📝 Submit Grievance</h3>
                            <p>Report a new problem or complaint.</p>
                            <button onClick={() => setPage("submit")}>
                                Submit Grievance
                            </button>
                        </div>

                        <div className="dashboard-card">
                            <h3>📋 My Grievances</h3>
                            <p>View your submitted grievances.</p>
                            <button onClick={handleViewGrievances} disabled={loadingGrievances}>
                                 {loadingGrievances ? "Loading..." : "View Grievances"}
                            </button>
                        </div>

                        <div className="dashboard-card">
                            <h3>🔍 Track Grievance</h3>
                            <p>Check the status of your complaint.</p>
                            <button onClick={handleViewGrievances}>
                                Track Status
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (page === "register") {
        return (
            <div className="login-page">
                <div className="login-container">
                    <h1>Create Account</h1>
                    <p className="subtitle">
                        Register for the Smart Grievance System
                    </p>

                    <form onSubmit={handleRegister}>
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />

                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label>Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />

                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                        />

                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={6}
                            required
                        />

                        <button type="submit">Create Account</button>
                    </form>

                    <p className="register-text">
                        Already registered?{" "}
                        <span onClick={() => setPage("login")}>Login</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>Smart Grievance System</h1>
                <p className="subtitle">
                    Login to submit and track your grievances
                </p>

                <form onSubmit={handleLogin}>
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit">Login</button>
                </form>

                <p className="register-text">
                    Don't have an account?{" "}
                    <span onClick={() => setPage("register")}>Register</span>
                </p>
            </div>
        </div>
    );
}

export default App;
