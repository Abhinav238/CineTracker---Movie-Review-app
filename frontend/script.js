// Keep the API hostname aligned with the page hostname so the authentication
// cookie is sent whether Live Server uses localhost or 127.0.0.1.
const BASE_URL = window.location.hostname
    ? `http://${window.location.hostname}:5000`
    : "http://localhost:5000";


document.addEventListener("DOMContentLoaded", function () {
    // API Keys and Base URLs
    const OMDB_API_KEY = "76d2d268"; // Replace with your actual API key
    const OMDB_API_URL = "https://www.omdbapi.com/?apikey=" + OMDB_API_KEY;

    // DOM Elements
    const searchBox = document.getElementById("searchBox");
    const searchButton = document.getElementById("searchButton");
    const movieResults = document.getElementById("movieResults");
    const recommendedMovies = document.getElementById("recommendedMovies");
    const wishlistContent = document.getElementById("wishlistContent");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const loginButton = document.getElementById("loginButton");
    const signupButton = document.getElementById("signupButton");
    const logoutButton = document.getElementById("logoutButton");
    const userProfile = document.getElementById("userProfile");
    const authButtons = document.querySelector(".auth-buttons");
    const userGreeting = document.getElementById("userGreeting");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const movieModal = document.getElementById("movieModal");
    const reviewModal = document.getElementById("reviewModal");
    const authForms = document.getElementById("authForms");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginFormElement = document.getElementById("loginFormElement");
    const signupFormElement = document.getElementById("signupFormElement");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const closeModalButtons = document.querySelectorAll(".close-modal");
    const homeButton = document.getElementById("homeButton");
    const wishlistButton = document.getElementById("wishlistButton");
    const mainContent = document.getElementById("mainContent");
    const reviewStars = document.querySelectorAll("#reviewForm .stars button");
    const reviewForm = document.getElementById("reviewForm");

    // App State
    let currentUser = null;
    let darkMode = localStorage.getItem("darkMode") === "true";

    // Check Authentication Status
    checkAuthStatus();

    // Event Listeners
    searchBox.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            searchButton.click();
        }
    });

    searchButton.addEventListener("click", () => {
        const movieName = searchBox.value.trim();
        if (movieName) {
            fetchMovies(movieName);
        }
    });

    darkModeToggle.addEventListener("click", toggleDarkMode);
    loginButton.addEventListener("click", showLoginForm);
    signupButton.addEventListener("click", showSignupForm);
    logoutButton.addEventListener("click", logoutUser);
    document.getElementById("switchToSignup").addEventListener("click", showSignupForm);
    document.getElementById("switchToLogin").addEventListener("click", showLoginForm);
    loginFormElement.addEventListener("submit", handleLogin);
    signupFormElement.addEventListener("submit", handleSignup);
    homeButton.addEventListener("click", showHomePage);
    wishlistButton.addEventListener("click", showWishlist);

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const tabName = button.getAttribute("data-tab");
            // The "My Wishlist" tab and the navigation Wishlist button should
            // always show the same freshly loaded data.
            if (tabName === "wishlistContent") {
                showWishlist();
            } else {
                homeButton.classList.add("active");
                wishlistButton.classList.remove("active");
                switchTab(tabName);
            }
        });
    });

    // Close modals
    closeModalButtons.forEach(button => {
        button.addEventListener("click", () => {
            button.closest(".modal").classList.add("hidden");
        });
    });

    // Handle clicking outside modal to close
    window.addEventListener("click", (event) => {
        if (event.target === movieModal) {
            movieModal.classList.add("hidden");
        }
        if (event.target === reviewModal) {
            reviewModal.classList.add("hidden");
        }
    });

    // Rating stars
    reviewStars.forEach(star => {
        star.addEventListener("click", () => {
            const rating = star.getAttribute("data-rating");
            document.getElementById("ratingValue").value = rating;
            document.getElementById("ratingDescription").textContent = `${rating} out of 5`;
            
            // Update visual state
            reviewStars.forEach(s => {
                if (s.getAttribute("data-rating") <= rating) {
                    s.classList.add("active");
                    s.setAttribute("aria-checked", "true");
                } else {
                    s.classList.remove("active");
                    s.setAttribute("aria-checked", "false");
                }
            });
        });
    });

    // Review form submission
    reviewForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        if (!currentUser) {
            showAlert("Please log in to submit a review", "error");
            return;
        }
        
        const movieId = document.getElementById("reviewMovieId").value;
        const rating = document.getElementById("ratingValue").value;
        const reviewText = document.getElementById("reviewText").value;
        
        if (rating === "0") {
            showAlert("Please select a rating", "error");
            return;
        }
        
        submitReview(movieId, rating, reviewText);
    });

    // Initialize
    applyDarkMode();
    displayRecommendations();

    // Authentication Functions
    function checkAuthStatus() {
        showLoading();
        fetch(`${BASE_URL}/api/auth-status`, { credentials: "include" })
            .then(response => response.json())
            .then(data => {
                if (data.authenticated) {
                    currentUser = data.user;
                    updateUIForLoggedInUser();
                } else {
                    updateUIForLoggedOutUser();
                }
                hideLoading();
            })
            .catch(error => {
                console.error("Error checking auth status:", error);
                updateUIForLoggedOutUser();
                hideLoading();
            });
    }

    function handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById("loginUsername").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        
        if (!username || !password) {
            document.getElementById("loginError").textContent = "Please fill in all fields";
            return;
        }
        
        showLoading();
        
        fetch(`${BASE_URL}/api/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ username, password })
        })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                
                if (data.message === "Login successful") {
                    currentUser = data.user;
                    updateUIForLoggedInUser();
                    hideAuthForms();
                    // If login started from the wishlist, replace the signed-out
                    // placeholder with this user's current wishlist right away.
                    if (wishlistContent.classList.contains("active")) {
                        fetchWishlist();
                    }
                    showAlert("Login successful!", "success");
                } else {
                    document.getElementById("loginError").textContent = data.message;
                }
            })
            .catch(error => {
                hideLoading();
                console.error("Login error:", error);
                document.getElementById("loginError").textContent = "An error occurred. Please try again.";
            });
    }

    function handleSignup(event) {
        event.preventDefault();
        
        const username = document.getElementById("signupUsername").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            document.getElementById("signupError").textContent = "Please fill in all fields";
            return;
        }
        
        if (password !== confirmPassword) {
            document.getElementById("signupError").textContent = "Passwords don't match";
            return;
        }
        
        showLoading();
        
        fetch(`${BASE_URL}/api/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                
                if (data.message === "User registered successfully") {
                    document.getElementById("signupError").textContent = "";
                    showLoginForm();
                    showAlert("Registration successful! Please log in.", "success");
                } else {
                    document.getElementById("signupError").textContent = data.message;
                }
            })
            .catch(error => {
                hideLoading();
                console.error("Signup error:", error);
                document.getElementById("signupError").textContent = "An error occurred. Please try again.";
            });
    }

    function logoutUser() {
        fetch(`${BASE_URL}/api/logout`, {
            method: "POST",
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => {
                currentUser = null;
                updateUIForLoggedOutUser();
                // Clear cards rendered for the previous user immediately.
                fetchWishlist();
                showAlert("Logged out successfully", "info");
            })
            .catch(error => {
                console.error("Logout error:", error);
                showAlert("Error logging out", "error");
            });
    }

    function updateUIForLoggedInUser() {
        authButtons.querySelector(".auth-btn").classList.add("hidden");
        document.getElementById("signupButton").classList.add("hidden");
        userProfile.classList.remove("hidden");
        userGreeting.textContent = `Hello, ${currentUser.username}`;
    }

    function updateUIForLoggedOutUser() {
        authButtons.querySelector(".auth-btn").classList.remove("hidden");
        document.getElementById("signupButton").classList.remove("hidden");
        userProfile.classList.add("hidden");
    }

    // Movie Search & Wishlist Functions
    function fetchMovies(movieName) {
        showLoading();
        movieResults.innerHTML = "";
        
        fetch(`${OMDB_API_URL}&s=${encodeURIComponent(movieName)}`)
            .then(response => response.json())
            .then(data => {
                hideLoading();
                
                if (data.Response === "True") {
                    displayMovies(data.Search);
                    switchTab("movieResults");
                } else {
                    movieResults.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><p>No movies found for "${movieName}"</p></div>`;
                    switchTab("movieResults");
                }
            })
            .catch(error => {
                hideLoading();
                console.error("Error fetching movies:", error);
                movieResults.innerHTML = `<div class="no-results"><i class="fas fa-exclamation-circle"></i><p>Error loading movies. Please try again.</p></div>`;
            });
    }

    function displayMovies(movies) {
        movieResults.innerHTML = createMovieCards(movies);
    }

    function displayRecommendations() {
        const recommendationPosters = {
            tt0111161: "https://image.tmdb.org/t/p/w500/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg",
            tt1375666: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
            tt4154796: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
            tt0816692: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            tt0468569: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            tt0109830: "https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
            tt0133093: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
            tt0120737: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
            tt6751668: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
            tt2582802: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
            tt7286456: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"
        };
        const recommendations = [
            { imdbID: "tt0111161", Title: "The Shawshank Redemption", Year: "1994", Poster: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzYtYzVlMC00MzM0LWJhY2UtOWQ2NThhZGIyYzY0XkEyXkFqcGc@._V1_SX300.jpg" },
            { imdbID: "tt1375666", Title: "Inception", Year: "2010", Poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzYzODQ4Nl5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg" },
            { imdbID: "tt4154796", Title: "Avengers: Endgame", Year: "2019", Poster: "https://m.media-amazon.com/images/M/MV5BMTc5MDY1Mzg5MV5BMl5BanBnXkFtZTgwMTQ2MzIwNzM@._V1_SX300.jpg" },
            { imdbID: "tt0816692", Title: "Interstellar", Year: "2014", Poster: "https://m.media-amazon.com/images/M/MV5BMjIxNjgxOTYwNV5BMl5BanBnXkFtZTgwODE2MTMxMTE@._V1_SX300.jpg" },
            { imdbID: "tt0468569", Title: "The Dark Knight", Year: "2008", Poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODI1Nl5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg" },
            { imdbID: "tt0109830", Title: "Forrest Gump", Year: "1994", Poster: "https://m.media-amazon.com/images/M/MV5BNWIwYmY0ZGUtY2ZiZC00ODg0LTk5YzAtOWFhNjQ1ODZhZjYwXkEyXkFqcGc@._V1_SX300.jpg" },
            { imdbID: "tt0133093", Title: "The Matrix", Year: "1999", Poster: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3NzAtNzQ2My00MmM5LWEyYzItMGFkYjE4YjVlZTRiXkEyXkFqcGc@._V1_SX300.jpg" },
            { imdbID: "tt0120737", Title: "The Lord of the Rings: The Fellowship of the Ring", Year: "2001", Poster: "https://m.media-amazon.com/images/M/MV5BN2EyZjM1NzktZmNhNC00ZTAwLWFmZGQtYWQyM2M0NjA5OTYzXkEyXkFqcGc@._V1_SX300.jpg" },
            { imdbID: "tt6751668", Title: "Parasite", Year: "2019", Poster: "https://m.media-amazon.com/images/M/MV5BYWY1MzdkMjQtNzU3OC00MTA1LWEyOTYtZWZmOGU1N2ZlN2Q0XkEyXkFqcGc@._V1_SX300.jpg" },
            { imdbID: "tt2582802", Title: "Whiplash", Year: "2014", Poster: "https://m.media-amazon.com/images/M/MV5BMjM2MDM3MDk3OV5BMl5BanBnXkFtZTgwNjM5MjM2MTE@._V1_SX300.jpg" },
            { imdbID: "tt7286456", Title: "Joker", Year: "2019", Poster: "https://m.media-amazon.com/images/M/MV5BYmY0YmY3ZDUtYWU4MC00ZjBjLTlhM2QtY2RhZTVlM2YwZTY1XkEyXkFqcGc@._V1_SX300.jpg" },
            { imdbID: "tt2380307", Title: "Coco", Year: "2017", Poster: "https://m.media-amazon.com/images/M/MV5BNWQ4OTZiNTctMGE3YS00YmM2LTg4MzItNThjY2Y2ZGZkNTRmXkEyXkFqcGc@._V1_SX300.jpg" }
        ];

        // A new shuffled selection is shown every time the page is loaded.
        const shuffledRecommendations = recommendations
            .map((movie, index) => ({
                ...movie,
                Poster: recommendationPosters[movie.imdbID] || movie.Poster,
                isRecommendation: true,
                artworkStyle: index % 6
            }))
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);

        recommendedMovies.innerHTML = createMovieCards(shuffledRecommendations);
    }

    function createMovieCards(movies) {
        let output = "";
        
        movies.forEach(movie => {
            const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster";
            const posterMarkup = movie.isRecommendation
                ? `<div class="recommendation-art artwork-${movie.artworkStyle}">
                        <i class="fas fa-film"></i>
                        <span>${movie.Title}</span>
                   </div>`
                : `<img src="${posterUrl}" alt="${movie.Title}" onerror="this.remove(); this.parentElement.classList.add('poster-unavailable');">`;
            
            output += `
                <div class="movie-card">
                    <div class="movie-image">
                        ${posterMarkup}
                    </div>
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.Title}</h3>
                        <p class="movie-year">${movie.Year}</p>
                        <div class="card-buttons">
                            <button class="wishlist-btn" onclick="toggleWishlist('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}', '${posterUrl}')">
                                <i class="fas fa-heart"></i> Wishlist
                            </button>
                            <button class="details-btn" onclick="showMovieDetails('${movie.imdbID}')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return output;
    }

    function showMovieDetails(movieId) {
        if (!movieId) return;
        
        showLoading();
        
        fetch(`${OMDB_API_URL}&i=${movieId}&plot=full`)
            .then(response => response.json())
            .then(movie => {
                hideLoading();
                
                if (movie.Response === "True") {
                    const detailContent = document.getElementById("movieDetailContent");
                    const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster";
                    
                    let detailHTML = `
                        <div class="movie-detail">
                            <div class="movie-poster">
                                <img src="${posterUrl}" alt="${movie.Title}">
                            </div>
                            <div class="movie-details-info">
                                <h2>${movie.Title} (${movie.Year})</h2>
                                <div class="movie-meta">
                                    <span><i class="fas fa-film"></i> ${movie.Genre}</span>
                                    <span><i class="fas fa-clock"></i> ${movie.Runtime}</span>
                                    <span><i class="fas fa-star"></i> ${movie.imdbRating}/10</span>
                                </div>
                                <p class="movie-plot">${movie.Plot}</p>
                                <p><strong>Director:</strong> ${movie.Director}</p>
                                <p><strong>Cast:</strong> ${movie.Actors}</p>
                                <div class="movie-actions">
                                    <button class="wishlist-btn" onclick="toggleWishlist('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}', '${posterUrl}')">
                                        <i class="fas fa-heart"></i> Add to Wishlist
                                    </button>
                                    <button class="review-btn" onclick="openReviewForm('${movie.imdbID}')">
                                        <i class="fas fa-edit"></i> Write Review
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="reviews-section">
                            <h3>Reviews</h3>
                            <div id="movieReviews">
                                <p>Loading reviews...</p>
                            </div>
                        </div>
                    `;
                    
                    detailContent.innerHTML = detailHTML;
                    movieModal.classList.remove("hidden");
                    
                    // Fetch reviews
                    fetchReviews(movieId);
                }
            })
            .catch(error => {
                hideLoading();
                console.error("Error fetching movie details:", error);
                showAlert("Error loading movie details", "error");
            });
    }

    function fetchWishlist() {
        if (!currentUser) {
            wishlistContent.innerHTML = `
                <div class="not-logged-in">
                    <i class="fas fa-user-lock"></i>
                    <p>Please log in to view your wishlist</p>
                    <button class="auth-btn" onclick="showLoginForm()">Login</button>
                </div>
            `;
            return;
        }
        
        showLoading();
        
        fetch(`${BASE_URL}/api/wishlist`, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                
                if (data.wishlist && data.wishlist.length > 0) {
                    let output = "";
                    
                    data.wishlist.forEach(movie => {
                        output += `
                            <div class="movie-card">
                                <div class="movie-image">
                                    <img src="${movie.movie_poster}" alt="${movie.movie_title}">
                                </div>
                                <div class="movie-info">
                                    <h3 class="movie-title">${movie.movie_title}</h3>
                                    <div class="card-buttons">
                                        <button class="details-btn" onclick="showMovieDetails('${movie.movie_id}')">
                                            <i class="fas fa-info-circle"></i> Details
                                        </button>
                                        <button class="remove-btn" onclick="removeFromWishlist('${movie.movie_id}')">
                                            <i class="fas fa-trash-alt"></i> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    wishlistContent.innerHTML = output;
                } else {
                    wishlistContent.innerHTML = `
                        <div class="no-results">
                            <i class="fas fa-heart-broken"></i>
                            <p>Your wishlist is empty</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                hideLoading();
                console.error("Error fetching wishlist:", error);
                wishlistContent.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Error loading wishlist. Please try again.</p>
                    </div>
                `;
            });
    }

    function fetchReviews(movieId) {
        const reviewsContainer = document.getElementById("movieReviews");
        
        fetch(`${BASE_URL}/api/reviews/${movieId}`)
            .then(response => response.json())
            .then(data => {
                if (data.reviews && data.reviews.length > 0) {
                    let reviewsHTML = "";
                    
                    data.reviews.forEach(review => {
                        const date = new Date(review.created_at).toLocaleDateString();
                        const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
                        
                        reviewsHTML += `
                            <div class="review-item">
                                <div class="review-header">
                                    <span class="reviewer-name">${review.username}</span>
                                    <span class="review-date">${date}</span>
                                </div>
                                <div class="review-rating">${stars}</div>
                                <div class="review-content">${review.review_text}</div>
                            </div>
                        `;
                    });
                    
                    reviewsContainer.innerHTML = reviewsHTML;
                } else {
                    reviewsContainer.innerHTML = "<p>No reviews yet. Be the first to review!</p>";
                }
            })
            .catch(error => {
                console.error("Error fetching reviews:", error);
                reviewsContainer.innerHTML = "<p>Error loading reviews</p>";
            });
    }

    // function submitReview(movieId, rating, reviewText) {
    //     showLoading();
        
    //     fetch(`${BASE_URL}/api/reviews`, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify({ movieId, rating, reviewText }),
    //         credentials: 'include'
    //     })
    //         .then(response => response.json())
    //         .then(data => {
    //             hideLoading();
                
    //             if (data.message === "Review added successfully") {
    //                 reviewModal.classList.add("hidden");
    //                 showAlert("Review submitted successfully", "success");
                    
    //                 // Refresh the reviews
    //                 fetchReviews(movieId);
    //             } else {
    //                 showAlert("Error submitting review", "error");
    //             }
    //         })
    //         .catch(error => {
    //             hideLoading();
    //             console.error("Error submitting review:", error);
    //             showAlert("Error submitting review", "error");
    //         });
    // }

    // UI Helper Functions
    function toggleDarkMode() {
        darkMode = !darkMode;
        localStorage.setItem("darkMode", darkMode);
        applyDarkMode();
    }

    function applyDarkMode() {
        if (darkMode) {
            document.body.classList.add("dark-mode");
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove("dark-mode");
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    function showLoginForm() {
        authForms.classList.remove("hidden");
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
        mainContent.classList.add("hidden");
        document.getElementById("loginError").textContent = "";
    }

    function showSignupForm() {
        authForms.classList.remove("hidden");
        signupForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
        mainContent.classList.add("hidden");
        document.getElementById("signupError").textContent = "";
    }

    function hideAuthForms() {
        authForms.classList.add("hidden");
        mainContent.classList.remove("hidden");
    }

    function showHomePage() {
        hideAuthForms();
        homeButton.classList.add("active");
        wishlistButton.classList.remove("active");
        switchTab("homeContent");
    }

    function showWishlist() {
        hideAuthForms();
        wishlistButton.classList.add("active");
        homeButton.classList.remove("active");
        switchTab("wishlistContent");
        fetchWishlist();
    }

    function switchTab(tabName) {
        tabContents.forEach(content => {
            content.classList.remove("active");
        });
        
        tabButtons.forEach(btn => {
            btn.classList.remove("active");
            if (btn.getAttribute("data-tab") === tabName) {
                btn.classList.add("active");
            }
        });
        
        document.getElementById(tabName).classList.add("active");
    }

    function showLoading() {
        loadingSpinner.classList.remove("hidden");
    }

    function hideLoading() {
        loadingSpinner.classList.add("hidden");
    }

    function showAlert(message, type) {
        const alertContainer = document.getElementById("alertContainer");
        const alertId = Date.now();
        
        const alertHTML = `
            <div class="alert alert-${type}" id="alert-${alertId}">
                <span>${message}</span>
                <button class="alert-close" onclick="dismissAlert('alert-${alertId}')">&times;</button>
            </div>
        `;
        
        alertContainer.innerHTML += alertHTML;
        alertContainer.classList.remove("hidden");
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            dismissAlert(`alert-${alertId}`);
        }, 5000);
    }
});

// Global functions that are referenced in the HTML
function toggleWishlist(movieId, movieTitle, posterUrl) {
    // Check if user is logged in
    if (!document.getElementById("userProfile").classList.contains("hidden")) {
        const clicked = window.event && window.event.target ? window.event.target : null;
        const wishlistBtn = clicked ? clicked.closest(".wishlist-btn") : null;
        
        fetch(`${BASE_URL}/api/wishlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({
                movieId: movieId,
                movieTitle: movieTitle,
                posterUrl: posterUrl
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === "added") {
                    if (wishlistBtn) {
                        wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Remove';
                        wishlistBtn.classList.add("active");
                    }
                    showAlert("Added to wishlist", "success");
                } else if (data.status === "removed") {
                    if (wishlistBtn) {
                        wishlistBtn.innerHTML = '<i class="far fa-heart"></i> Wishlist';
                        wishlistBtn.classList.remove("active");
                    }
                    showAlert("Removed from wishlist", "info");
                    
                    // If we're on the wishlist page, refresh it
                    if (document.getElementById("wishlistContent").classList.contains("active")) {
                        fetchWishlist();
                    }
                } else {
                    showAlert(data.message || "Error updating wishlist", "error");
                }
            })
            .catch(error => {
                console.error("Error toggling wishlist:", error);
                showAlert("Error updating wishlist", "error");
            });
    } else {
        showAlert("Please log in to add to wishlist", "error");
        showLoginForm();
    }
}

function removeFromWishlist(movieId) {
    fetch(`${BASE_URL}/api/wishlist/${movieId}`, {
        method: "DELETE",
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Movie removed from wishlist") {
                showAlert("Removed from wishlist", "info");
                fetchWishlist();
            } else {
                showAlert("Error removing from wishlist", "error");
            }
        })
        .catch(error => {
            console.error("Error removing from wishlist:", error);
            showAlert("Error removing from wishlist", "error");
        });
}

function openReviewForm(movieId) {
    if (!document.getElementById("userProfile").classList.contains("hidden")) {
        document.getElementById("reviewMovieId").value = movieId;
        document.getElementById("ratingValue").value = "0";
        document.getElementById("reviewText").value = "";
        document.getElementById("ratingDescription").textContent = "Choose a rating";
        
        // Reset star UI
        const stars = document.querySelectorAll("#reviewForm .stars button");
        stars.forEach(star => {
            star.classList.remove("active");
            star.setAttribute("aria-checked", "false");
        });
        
        document.getElementById("reviewModal").classList.remove("hidden");
    } else {
        showAlert("Please log in to write a review", "error");
        showLoginForm();
    }
}

function dismissAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.classList.add("fade-out");
        setTimeout(() => {
            alert.remove();
            
            // Hide container if empty
            const alertContainer = document.getElementById("alertContainer");
            if (alertContainer.children.length === 0) {
                alertContainer.classList.add("hidden");
            }
        }, 300);
    }
}

function showLoginForm() {
    const authForms = document.getElementById("authForms");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const mainContent = document.getElementById("mainContent");
    
    authForms.classList.remove("hidden");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    mainContent.classList.add("hidden");
    document.getElementById("loginError").textContent = "";
}

function fetchWishlist() {
    const wishlistContent = document.getElementById("wishlistContent");
    const userProfile = document.getElementById("userProfile");
    
    if (userProfile.classList.contains("hidden")) {
        wishlistContent.innerHTML = `
            <div class="not-logged-in">
                <i class="fas fa-user-lock"></i>
                <p>Please log in to view your wishlist</p>
                <button class="auth-btn" onclick="showLoginForm()">Login</button>
            </div>
        `;
        return;
    }
    
    const loadingSpinner = document.getElementById("loadingSpinner");
    loadingSpinner.classList.remove("hidden");
    
    fetch(`${BASE_URL}/api/wishlist`, {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            loadingSpinner.classList.add("hidden");
            
            if (data.wishlist && data.wishlist.length > 0) {
                let output = "";
                
                data.wishlist.forEach(movie => {
                    output += `
                        <div class="movie-card">
                            <div class="movie-image">
                                <img src="${movie.movie_poster}" alt="${movie.movie_title}">
                            </div>
                            <div class="movie-info">
                                <h3 class="movie-title">${movie.movie_title}</h3>
                                <div class="card-buttons">
                                    <button class="details-btn" onclick="showMovieDetails('${movie.movie_id}')">
                                        <i class="fas fa-info-circle"></i> Details
                                    </button>
                                    <button class="remove-btn" onclick="removeFromWishlist('${movie.movie_id}')">
                                        <i class="fas fa-trash-alt"></i> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                wishlistContent.innerHTML = output;
            } else {
                wishlistContent.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-heart-broken"></i>
                        <p>Your wishlist is empty</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            loadingSpinner.classList.add("hidden");
            console.error("Error fetching wishlist:", error);
            wishlistContent.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading wishlist. Please try again.</p>
                </div>
            `;
        });
}

function showMovieDetails(movieId) {
    const movieModal = document.getElementById("movieModal");
    const loadingSpinner = document.getElementById("loadingSpinner");
    
    if (!movieId) return;
    
    loadingSpinner.classList.remove("hidden");
    
    const OMDB_API_KEY = "76d2d268"; // This should match the one in the main script
    const OMDB_API_URL = "https://www.omdbapi.com/?apikey=" + OMDB_API_KEY;
    
    fetch(`${OMDB_API_URL}&i=${movieId}&plot=full`)
        .then(response => response.json())
        .then(movie => {
            loadingSpinner.classList.add("hidden");
            
            if (movie.Response === "True") {
                const detailContent = document.getElementById("movieDetailContent");
                const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster";
                
                let detailHTML = `
                    <div class="movie-detail">
                        <div class="movie-poster">
                            <img src="${posterUrl}" alt="${movie.Title}">
                        </div>
                        <div class="movie-details-info">
                            <h2>${movie.Title} (${movie.Year})</h2>
                            <div class="movie-meta">
                                <span><i class="fas fa-film"></i> ${movie.Genre}</span>
                                <span><i class="fas fa-clock"></i> ${movie.Runtime}</span>
                                <span><i class="fas fa-star"></i> ${movie.imdbRating}/10</span>
                            </div>
                            <p class="movie-plot">${movie.Plot}</p>
                            <p><strong>Director:</strong> ${movie.Director}</p>
                            <p><strong>Cast:</strong> ${movie.Actors}</p>
                            <div class="movie-actions">
                                <button class="wishlist-btn" onclick="toggleWishlist('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}', '${posterUrl}')">
                                    <i class="fas fa-heart"></i> Add to Wishlist
                                </button>
                                <button class="review-btn" onclick="openReviewForm('${movie.imdbID}')">
                                    <i class="fas fa-edit"></i> Write Review
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="reviews-section">
                        <h3>Reviews</h3>
                        <div id="movieReviews">
                            <p>Loading reviews...</p>
                        </div>
                    </div>
                `;
                
                detailContent.innerHTML = detailHTML;
                movieModal.classList.remove("hidden");
                
                // Fetch reviews
                fetchReviews(movieId);
                
                // Check if this movie is in user's wishlist to update button state
                if (!document.getElementById("userProfile").classList.contains("hidden")) {
                    fetch(`${BASE_URL}/api/wishlist/check/${movieId}`, {
                        credentials: 'include'
                    })
                        .then(response => response.json())
                        .then(data => {
                            const wishlistBtn = document.querySelector(".movie-actions .wishlist-btn");
                            if (data.inWishlist) {
                                wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Wishlist';
                                wishlistBtn.classList.add("active");
                            } else {
                                wishlistBtn.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
                                wishlistBtn.classList.remove("active");
                            }
                        })
                        .catch(error => {
                            console.error("Error checking wishlist status:", error);
                        });
                }
            }
        })
        .catch(error => {
            loadingSpinner.classList.add("hidden");
            console.error("Error fetching movie details:", error);
            showAlert("Error loading movie details", "error");
        });
}

function fetchReviews(movieId) {
    const reviewsContainer = document.getElementById("movieReviews");
    
    fetch(`${BASE_URL}/api/reviews/${movieId}`)
        .then(response => response.json())
        .then(data => {
            if (data.reviews && data.reviews.length > 0) {
                let reviewsHTML = "";
                
                data.reviews.forEach(review => {
                    const date = new Date(review.created_at).toLocaleDateString();
                    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
                    const isCurrentUsersReview = !document.getElementById("userProfile").classList.contains("hidden")
                        && document.getElementById("userGreeting").textContent === `Hello, ${review.username}`;
                    const reviewActions = isCurrentUsersReview
                        ? `<div class="review-actions">
                                <button class="edit-review-btn" onclick="editReview('${review.id}', '${encodeURIComponent(review.review_text)}', '${movieId}')"><i class="fas fa-pen"></i> Edit</button>
                                <button class="delete-review-btn" onclick="deleteReview('${review.id}', '${movieId}')"><i class="fas fa-trash-alt"></i> Delete</button>
                           </div>`
                        : "";
                    
                    reviewsHTML += `
                        <div class="review-item">
                            <div class="review-header">
                                <span class="reviewer-name">${review.username}</span>
                                <span class="review-date">${date}</span>
                            </div>
                            <div class="review-rating">${stars}</div>
                            <div class="review-content">${review.review_text}</div>
                            ${reviewActions}
                        </div>
                    `;
                });
                
                reviewsContainer.innerHTML = reviewsHTML;
            } else {
                reviewsContainer.innerHTML = "<p>No reviews yet. Be the first to review!</p>";
            }
        })
        .catch(error => {
            console.error("Error fetching reviews:", error);
            reviewsContainer.innerHTML = "<p>Error loading reviews</p>";
        });
}

function editReview(reviewId, encodedReviewText, movieId) {
    const modal = document.getElementById("editReviewModal");
    const textarea = document.getElementById("editReviewText");

    modal.dataset.reviewId = reviewId;
    modal.dataset.movieId = movieId;
    textarea.value = decodeURIComponent(encodedReviewText);
    modal.classList.remove("hidden");
    textarea.focus();
}

function saveEditedReview() {
    const modal = document.getElementById("editReviewModal");
    const reviewId = modal.dataset.reviewId;
    const movieId = modal.dataset.movieId;
    const updatedText = document.getElementById("editReviewText").value.trim();

    if (!updatedText) {
        showAlert("Your review cannot be empty", "error");
        return;
    }

    fetch(`${BASE_URL}/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reviewText: updatedText })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Review updated successfully") {
                closeReviewDialogs();
                showAlert("Review updated successfully", "success");
                fetchReviews(movieId);
            } else {
                showAlert(data.message || "Could not update review", "error");
            }
        })
        .catch(() => showAlert("Could not update review", "error"));
}

function deleteReview(reviewId, movieId) {
    const modal = document.getElementById("deleteReviewModal");
    modal.dataset.reviewId = reviewId;
    modal.dataset.movieId = movieId;
    modal.classList.remove("hidden");
}

function confirmDeleteReview() {
    const modal = document.getElementById("deleteReviewModal");
    const reviewId = modal.dataset.reviewId;
    const movieId = modal.dataset.movieId;

    fetch(`${BASE_URL}/api/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include"
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Review deleted successfully") {
                closeReviewDialogs();
                showAlert("Review deleted successfully", "success");
                fetchReviews(movieId);
            } else {
                showAlert(data.message || "Could not delete review", "error");
            }
        })
        .catch(() => showAlert("Could not delete review", "error"));
}

function closeReviewDialogs() {
    document.getElementById("editReviewModal").classList.add("hidden");
    document.getElementById("deleteReviewModal").classList.add("hidden");
}

function closeNewReviewModal() {
    document.getElementById("reviewModal").classList.add("hidden");
}

function submitReview(movieId, rating, reviewText) {
    const loadingSpinner = document.getElementById("loadingSpinner");
    const reviewModal = document.getElementById("reviewModal");
    
    loadingSpinner.classList.remove("hidden");
    
    fetch(`${BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ movieId, rating, reviewText }),
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            loadingSpinner.classList.add("hidden");
            
            if (data.message === "Review added successfully") {
                reviewModal.classList.add("hidden");
                showAlert("Review submitted successfully", "success");
                
                // Refresh the reviews
                fetchReviews(movieId);
            } else {
                showAlert(data.message || "Error submitting review", "error");
            }
        })
        .catch(error => {
            loadingSpinner.classList.add("hidden");
            console.error("Error submitting review:", error);
            showAlert("Error submitting review", "error");
        });
}

function showAlert(message, type) {
    const alertContainer = document.getElementById("alertContainer");
    const alertId = Date.now();
    
    const alertHTML = `
        <div class="alert alert-${type}" id="alert-${alertId}">
            <span>${message}</span>
            <button class="alert-close" onclick="dismissAlert('alert-${alertId}')">&times;</button>
        </div>
    `;
    
    alertContainer.innerHTML += alertHTML;
    alertContainer.classList.remove("hidden");
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        dismissAlert(`alert-${alertId}`);
    }, 5000);
}
