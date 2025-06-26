// controllers/reviewController.js
const db = require("../models/db");

exports.submitReview = (req, res) => {
    const { movieId, rating, reviewText } = req.body;

    db.query(
        "INSERT INTO reviews (user_id, movie_id, rating, review_text) VALUES (?, ?, ?, ?)",
        [req.user.id, movieId, rating, reviewText],
        (err) => {
            if (err) return res.json({ message: "Failed to add review" });
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
