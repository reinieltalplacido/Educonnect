import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged,  } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Your Firebase configuration (replace these with yours)
const firebaseConfig = {
  apiKey: "AIzaSyDMs8HtwRyimV3UFJAg633dBmOy6KrxT90",
  authDomain: "educonnect-f70d6.firebaseapp.com",
  projectId: "educonnect-f70d6",
  storageBucket: "educonnect-f70d6.appspot.com",
  messagingSenderId: "211587031768",
  appId: "1:211587031768:web:5b406b1647d4a9a9212dad"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Get references to the form inputs and the element where we'll display the user's full name
// Get references to the form inputs and the element where we'll display the user's full name
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const roleInput = document.getElementById("role");
const userNameElement = document.getElementById("userName"); // This is where the full name will be displayed

// Wait for the authentication state to change (when user signs in)

   
   
   
   document.addEventListener('DOMContentLoaded', function() {
        // Initialize required elements with error handling
        function initializeElements() {
            const requiredElements = {
                // Navigation elements
                hamburgerMenu: document.getElementById('hamburgerMenu'),
                sidebar: document.getElementById('sidebar'),
                mainContent: document.getElementById('mainContent'),
                
                // Profile elements
                profilePicture: document.getElementById('profilePicture'),
                profilePictureInput: document.getElementById('profilePictureInput'),
                uploadOverlay: document.getElementById('uploadOverlay'),
                
                // Form elements
                firstName: document.getElementById('firstName'),
                lastName: document.getElementById('lastName'),
                email: document.getElementById('email'),
                
                // Settings elements
                languageSelect: document.getElementById('languageSelect'),
                saveProfileBtn: document.getElementById('saveProfileBtn'),
                resetPasswordBtn: document.getElementById('resetPasswordBtn'),
                logoutBtn: document.getElementById('logoutBtn')
            };

            // Check for missing elements
            const missingElements = Object.entries(requiredElements)
                .filter(([key, element]) => !element)
                .map(([key]) => key);

            if (missingElements.length > 0) {
                console.warn('Missing elements:', missingElements);
                return null;
            }

            // Load saved profile picture if it exists
            const savedProfilePicture = localStorage.getItem('profilePicture');
            if (savedProfilePicture && requiredElements.profilePicture) {
                requiredElements.profilePicture.src = savedProfilePicture;
            }

            return requiredElements;
        }

        // Initialize elements
        const elements = initializeElements();
        if (!elements) {
            console.error('Failed to initialize required elements');
            return;
        }

        // Event Listeners
        elements.hamburgerMenu.addEventListener('click', function() {
            elements.sidebar.classList.toggle('active');
            elements.mainContent.classList.toggle('sidebar-active');
        });

        // Profile Picture Upload
        elements.uploadOverlay.addEventListener('click', function() {
            elements.profilePictureInput.click();
        });

        elements.profilePictureInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const imageData = e.target.result;
                    // Update the image display
                    elements.profilePicture.src = imageData;
                    // Save to localStorage
                    try {
                        localStorage.setItem('profilePicture', imageData);
                        showAlert('Profile picture saved successfully!', 'success');
                    } catch (error) {
                        if (error.name === 'QuotaExceededError') {
                            showAlert('Image is too large to store locally', 'error');
                        } else {
                            showAlert('Failed to save profile picture', 'error');
                        }
                        console.error('Storage error:', error);
                    }
                };

                reader.onerror = function(error) {
                    console.error('Error reading file:', error);
                    showAlert('Error reading image file', 'error');
                };

                reader.readAsDataURL(e.target.files[0]);
            }
        });

        // Save Profile Changes
        elements.saveProfileBtn.addEventListener('click', function() {
            // Add save functionality
            console.log('Saving profile changes...');
            showAlert('Profile updated successfully!', 'success');
        });

        // Language Change
        elements.languageSelect.addEventListener('change', function(e) {
            const selectedLang = e.target.value;
            updateLanguage(selectedLang);
        });

        // Logout Handler
        elements.logoutBtn.addEventListener('click', function() {
            // Add logout functionality
            console.log('Logging out...');
        });

        // Alert function
        function showAlert(message, type = 'success') {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `
                <div class="alert-content">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(alert);
            
            setTimeout(() => {
                alert.remove();
            }, 3000);
        }

        // Logout Modal
        const logoutModal = document.getElementById('logoutModal');
        const cancelLogout = document.getElementById('cancelLogout');

        // Show modal when logout button is clicked
        elements.logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutModal.classList.add('show');
        });

        // Hide modal when cancel is clicked
        cancelLogout.addEventListener('click', function() {
            logoutModal.classList.remove('show');
        });

        // Hide modal when clicking outside
        logoutModal.addEventListener('click', function(e) {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('show');
            }
        });

        // Add a function to clear profile picture data
        function clearProfilePicture() {
            localStorage.removeItem('profilePicture');
            elements.profilePicture.src = 'default-profile.png'; // Set to your default image
        }

        // Optional: Add a clear profile picture button
        if (elements.clearProfileBtn) {
            elements.clearProfileBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to remove your profile picture?')) {
                    clearProfilePicture();
                    showAlert('Profile picture removed', 'success');
                }
            });
        }
    });