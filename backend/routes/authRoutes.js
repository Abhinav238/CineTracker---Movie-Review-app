// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login, logout, checkStatus } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/auth-status", checkStatus);

module.exports = router;
