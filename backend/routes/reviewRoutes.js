// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { submitReview, getReviews, updateReview, deleteReview } = require("../controllers/reviewController");

router.post("/reviews", auth, submitReview);
router.get("/reviews/:movieId", getReviews);
router.put("/reviews/:reviewId", auth, updateReview);
router.delete("/reviews/:reviewId", auth, deleteReview);

module.exports = router;
