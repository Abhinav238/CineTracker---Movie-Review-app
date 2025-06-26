const BASE_URL = "http://localhost:5000"; // Leave empty for relative paths or set to your server URL


document.addEventListener("DOMContentLoaded", function () {
    // API Keys and Base URLs
    const OMDB_API_KEY = "76d2d268"; // Replace with your actual API key
    const OMDB_API_URL = "https://www.omdbapi.com/?apikey=" + OMDB_API_KEY;

    // DOM Elements
    const searchBox = document.getElementById("searchBox");
    const searchButton = document.getElementById("searchButton");
    const movieResults = document.getElementById("movieResults");
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
    const reviewStars = document.querySelectorAll("#reviewForm .stars i");
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
            switchTab(tabName);
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
            
            // Update visual state
            reviewStars.forEach(s => {
                if (s.getAttribute("data-rating") <= rating) {
                    s.classList.add("active");
                } else {
                    s.classList.remove("active");
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

    // Authentication Functions
    function checkAuthStatus() {
        showLoading();
        fetch(`${BASE_URL}/api/auth-status`)
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
            method: "POST"
        })
            .then(response => response.json())
            .then(data => {
                currentUser = null;
                updateUIForLoggedOutUser();
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
        let output = "";
        
        movies.forEach(movie => {
            const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster";
            
            output += `
                <div class="movie-card">
                    <div class="movie-image">
                        <img src="${posterUrl}" alt="${movie.Title}">
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
        
        movieResults.innerHTML = output;
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
        switchTab("movieResults");
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
        const wishlistBtn = event.target.closest(".wishlist-btn");
        
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
                    wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Remove';
                    wishlistBtn.classList.add("active");
                    showAlert("Added to wishlist", "success");
                } else if (data.status === "removed") {
                    wishlistBtn.innerHTML = '<i class="far fa-heart"></i> Wishlist';
                    wishlistBtn.classList.remove("active");
                    showAlert("Removed from wishlist", "info");
                    
                    // If we're on the wishlist page, refresh it
                    if (document.getElementById("wishlistContent").classList.contains("active")) {
                        fetchWishlist();
                    }
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
    fetch(`/api/wishlist/${movieId}`, {
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
        
        // Reset star UI
        const stars = document.querySelectorAll("#reviewForm .stars i");
        stars.forEach(star => star.classList.remove("active"));
        
        reviewModal.classList.remove("hidden");
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
    
    fetch("/api/wishlist", {
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
                    fetch(`/api/wishlist/check/${movieId}`, {
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
    
    fetch(`/api/reviews/${movieId}`)
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
                showAlert("Error submitting review", "error");
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