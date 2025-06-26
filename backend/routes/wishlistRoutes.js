// routes/wishlistRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getWishlist, toggleWishlist, removeFromWishlist, checkWishlist } = require("../controllers/wishlistController");

router.get("/wishlist", auth, getWishlist);
router.post("/wishlist", auth, toggleWishlist);
router.delete("/wishlist/:movieId", auth, removeFromWishlist);
router.get("/wishlist/check/:movieId", auth, checkWishlist);

module.exports = router;
