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
