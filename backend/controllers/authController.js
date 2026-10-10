// controllers/authController.js
const db = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashed],
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.json({ message: "Username or email already exists" });
                }
                return res.json({ message: "Registration failed" });
            }
            res.json({ message: "User registered successfully" });
        }
    );
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
        if (err || results.length === 0) return res.json({ message: "User not found" });

        const user = results[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "Lax", // or "None" for cross-site
            secure: false    // ✅ Set to true if using HTTPS
          });
          
        res.json({ message: "Login successful", user: { id: user.id, username: user.username } });
    });
};

exports.logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "Lax",
        secure: false
    });
    res.json({ message: "Logged out successfully" });
};

exports.checkStatus = (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ authenticated: false });

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ authenticated: true, user });
    } catch {
        res.json({ authenticated: false });
    }
};