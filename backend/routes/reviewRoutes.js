// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { submitReview, getReviews } = require("../controllers/reviewController");

router.post("/reviews", auth, submitReview);
router.get("/reviews/:movieId", getReviews);

module.exports = router;
