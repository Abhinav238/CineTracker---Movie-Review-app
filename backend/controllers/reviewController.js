// controllers/reviewController.js
const db = require("../models/db");

exports.submitReview = (req, res) => {
    const { movieId, rating, reviewText } = req.body;
    const numericRating = Number(rating);

    if (!movieId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: "Choose a rating from 1 to 5" });
    }

    db.query(
        "INSERT INTO reviews (user_id, movie_id, rating, review_text) VALUES (?, ?, ?, ?)",
        [req.user.id, movieId, numericRating, reviewText || ""],
        (err) => {
            if (err) {
                console.error("Failed to add review:", err);
                return res.status(500).json({ message: "Could not add review" });
            }
            res.json({ message: "Review added successfully" });
        }
    );
};

exports.getReviews = (req, res) => {
    db.query(
        `SELECT r.*, u.username 
         FROM reviews r JOIN users u ON r.user_id = u.id 
         WHERE r.movie_id = ? 
         ORDER BY r.created_at DESC`,
        [req.params.movieId],
        (err, results) => {
            if (err) return res.json({ reviews: [] });
            res.json({ reviews: results });
        }
    );
};

exports.updateReview = (req, res) => {
    const { reviewText } = req.body;

    if (typeof reviewText !== "string" || !reviewText.trim()) {
        return res.status(400).json({ message: "A review comment is required" });
    }

    db.query(
        "UPDATE reviews SET review_text = ? WHERE id = ? AND user_id = ?",
        [reviewText.trim(), req.params.reviewId, req.user.id],
        (err, result) => {
            if (err) {
                console.error("Failed to update review:", err);
                return res.status(500).json({ message: "Could not update review" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Review not found or not yours to edit" });
            }
            res.json({ message: "Review updated successfully" });
        }
    );
};

exports.deleteReview = (req, res) => {
    db.query(
        "DELETE FROM reviews WHERE id = ? AND user_id = ?",
        [req.params.reviewId, req.user.id],
        (err, result) => {
            if (err) {
                console.error("Failed to delete review:", err);
                return res.status(500).json({ message: "Could not delete review" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Review not found or not yours to delete" });
            }
            res.json({ message: "Review deleted successfully" });
        }
    );
};
