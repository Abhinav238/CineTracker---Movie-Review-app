// server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const session = require("express-session");

dotenv.config();


const authRoutes = require("./routes/authRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || "secretkey", // Store in .env for safety
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,         // true if using HTTPS
        httpOnly: true,
        sameSite: "lax"        // or "none" if you're testing with HTTPS and cross-origin
    }
}));

app.use(cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"], // ✅ allow both  //origin: ["http://localhost:5500", "http://127.0.0.1:5500"], // ✅ allow both
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api", authRoutes);
app.use("/api", wishlistRoutes);
app.use("/api", reviewRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
