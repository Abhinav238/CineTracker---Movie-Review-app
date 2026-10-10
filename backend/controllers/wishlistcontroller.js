// controllers/wishlistController.js
const db = require("../models/db");

exports.getWishlist = (req, res) => {
    db.query(
        "SELECT * FROM wishlist WHERE user_id = ?",
        [req.user.id],
        (err, results) => {
            if (err) return res.json({ message: "Failed to load wishlist" });
            res.json({ wishlist: results });
        }
    );
};

exports.toggleWishlist = (req, res) => {
    const { movieId, movieTitle, posterUrl } = req.body;
    const userId = req.user.id;

    if (!movieId || !movieTitle) {
        return res.status(400).json({ message: "Movie details are required" });
    }

    db.query(
        "SELECT * FROM wishlist WHERE user_id = ? AND movie_id = ?",
        [userId, movieId],
        (err, results) => {
            if (err) {
                console.error("Failed to check wishlist:", err);
                return res.status(500).json({ message: "Could not update wishlist" });
            }

            if (results.length > 0) {
                db.query(
                    "DELETE FROM wishlist WHERE user_id = ? AND movie_id = ?",
                    [userId, movieId],
                    (deleteErr) => {
                        if (deleteErr) {
                            console.error("Failed to remove wishlist item:", deleteErr);
                            return res.status(500).json({ message: "Could not update wishlist" });
                        }
                        res.json({ status: "removed" });
                    }
                );
            } else {
                db.query(
                    "INSERT INTO wishlist (user_id, movie_id, movie_title, movie_poster) VALUES (?, ?, ?, ?)",
                    [userId, movieId, movieTitle, posterUrl],
                    (insertErr) => {
                        if (insertErr) {
                            console.error("Failed to add wishlist item:", insertErr);
                            return res.status(500).json({ message: "Could not update wishlist" });
                        }
                        res.json({ status: "added" });
                    }
                );
            }
        }
    );
};

exports.removeFromWishlist = (req, res) => {
    db.query(
        "DELETE FROM wishlist WHERE user_id = ? AND movie_id = ?",
        [req.user.id, req.params.movieId],
        (err) => {
            if (err) return res.json({ message: "Failed to remove" });
            res.json({ message: "Movie removed from wishlist" });
        }
    );
};

exports.checkWishlist = (req, res) => {
    db.query(
        "SELECT * FROM wishlist WHERE user_id = ? AND movie_id = ?",
        [req.user.id, req.params.movieId],
        (err, results) => {
            if (err) return res.json({ inWishlist: false });
            res.json({ inWishlist: results.length > 0 });
        }
    );
};
