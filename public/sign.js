let currentRole = null;
let currentStep = 'step-role';
let generatedEmail = '';

// Switch tabs between login/signup
function switchTab(tab) {
  const signupTab = document.getElementById('signup-tab');
  const loginTab = document.getElementById('login-tab');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  if (tab === 'signup') {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
  } else {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  }
}

function selectRole(role) {
  currentRole = role;

  const studentRole = document.getElementById('student-role');
  const teacherRole = document.getElementById('teacher-role');
  const continueBtn = document.getElementById('continue-btn');

  if (role === 'student') {
    studentRole.classList.add('selected');
    teacherRole.classList.remove('selected');
  } else {
    teacherRole.classList.add('selected');
    studentRole.classList.remove('selected');
  }

  continueBtn.disabled = false;
}

function showStep(stepId) {
  const allSteps = [
    'step-role',
    'step-student',
    'step-teacher',
    'step-student-details',
    'step-teacher-details',
    'step-complete'
  ];

  allSteps.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.remove('active');
    }
  });

  const stepToShow = document.getElementById(stepId);
  if (stepToShow) {
    stepToShow.classList.add('active');
  }

  currentStep = stepId;
}

// Validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

// Validate password strength
function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
}

// Show input error
function showInputError(inputElement, errorMessage) {
    // Remove any existing error messages first
    clearInputError(inputElement);
    
    // Add error class to input
    inputElement.classList.add('error');
    
    // Create error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = errorMessage;
    
    // Get the form group container
    const formGroup = inputElement.closest('.form-group');
    if (formGroup) {
        // If inside password container, append after the container
        const passwordContainer = formGroup.querySelector('.password-container');
        if (passwordContainer) {
            passwordContainer.insertAdjacentElement('afterend', errorElement);
        } else {
            // Otherwise append after the input
            inputElement.insertAdjacentElement('afterend', errorElement);
        }
    }
}

// Clear input error
function clearInputError(inputElement) {
    // Remove error class
    inputElement.classList.remove('error');
    
    // Find and remove error message
    const formGroup = inputElement.closest('.form-group');
    if (formGroup) {
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
  const passwordInput = document.getElementById(inputId);
  const toggleButton = passwordInput.parentElement.querySelector('.toggle-password');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleButton.textContent = 'Hide';
    toggleButton.classList.add('showing');
  } else {
    passwordInput.type = 'password';
    toggleButton.textContent = 'Show';
    toggleButton.classList.remove('showing');
  }
}

// Add show/hide buttons to password fields
function addPasswordToggles() {
  const passwordFields = [
    'student-password',
    'teacher-password',
    'login-password'
  ];
  
  passwordFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      // Create container for password field if it doesn't exist
      let container = field.parentElement;
      if (!container.classList.contains('password-container')) {
        const originalParent = field.parentElement;
        container = document.createElement('div');
        container.className = 'password-container';
        field.insertAdjacentElement('afterend', container);
        container.appendChild(field);
      }
      
      // Add toggle button if it doesn't exist
      if (!container.querySelector('.toggle-password')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'toggle-password';
        toggleBtn.textContent = 'Show';
        toggleBtn.onclick = () => togglePasswordVisibility(fieldId);
        field.insertAdjacentElement('afterend', toggleBtn);
        
        // Add some styling for the container
        container.style.position = 'relative';
        field.style.paddingRight = '55px';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.right = '5px';
        toggleBtn.style.top = '50%';
        toggleBtn.style.transform = 'translateY(-50%)';
        toggleBtn.style.border = 'none';
        toggleBtn.style.background = 'transparent';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.color = '#4a86e8';
      }
    }
  });
}

// Check if email already exists (using Firebase)
async function checkEmailExists(email) {
  try {
    if (typeof auth !== 'undefined' && typeof auth.fetchSignInMethodsForEmail === 'function') {
      const methods = await auth.fetchSignInMethodsForEmail(email);
      return methods.length > 0;
    }
    return false;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}

// Handle field validation in real time
function handleFieldValidation(field, fieldId, type) {
  const element = document.getElementById(fieldId);
  
  if (!element) return;
  
  element.addEventListener('blur', async () => {
    const value = element.value.trim();
    
    if (type === 'email') {
      if (!value) {
        showInputError(element, 'Email is required');
      } else if (!validateEmail(value)) {
        showInputError(element, 'Please enter a valid email address');
      } else {
        try {
          const exists = await checkEmailExists(value);
          if (exists) {
            showInputError(element, 'This email is already registered');
          } else {
            clearInputError(element);
          }
        } catch (error) {
          console.error("Error validating email:", error);
        }
      }
    } else if (type === 'password') {
      if (!value) {
        showInputError(element, 'Password is required');
      } else if (!validatePassword(value)) {
        showInputError(element, 'Password must be at least 8 characters with uppercase, lowercase, and number');
      } else {
        clearInputError(element);
      }
    }
  });
}

async function validateAndContinue(role) {
    // Get all required fields
    const requiredFields = [
        document.getElementById(`${role}-email`),
        document.getElementById(`${role}-password`),
        document.getElementById(`${role}-full-name`),
        document.getElementById(`${role}-school`)
    ];
    
    let isValid = true;

    // Remove any existing animations first
    requiredFields.forEach(field => {
        if (field) {
            field.classList.remove('shake');
        }
    });

    // Validate each field
    requiredFields.forEach(field => {
        if (field && !field.value.trim()) {
            isValid = false;
            
            // Add shake animation
            field.classList.add('shake');
            showInputError(field, `${field.placeholder} is required`);
            
            // Remove shake class after animation completes
            setTimeout(() => {
                field.classList.remove('shake');
            }, 500);
        }
    });

    // Check terms checkbox
    const termsCheckbox = document.getElementById('terms-agree');
    if (termsCheckbox && !termsCheckbox.checked) {
        isValid = false;
        termsCheckbox.closest('.terms-checkbox').classList.add('shake');
        setTimeout(() => {
            termsCheckbox.closest('.terms-checkbox').classList.remove('shake');
        }, 500);
    }

    // Rest of your existing validation code...
    // ...

    if (isValid) {
        // Your existing success logic
        showStep(`step-${role}-details`);
    }
}

// Handle file selection for COR/COE
function handleFileSelect(event) {
  const file = event.target.files[0];
  const fileType = (currentRole === 'student') ? 'COR' : 'COE';
  const fileInput = event.target;
  
  if (file) {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    // Validate file type
    if ((fileType === 'COR' && ['pdf', 'jpg', 'jpeg', 'png'].includes(fileExtension)) || 
        (fileType === 'COE' && ['pdf', 'doc', 'docx'].includes(fileExtension))) {
      console.log(`Selected ${fileType} file: ${fileName}`);
      clearInputError(fileInput);
      
      // Show file name for better UX
      const fileNameDisplay = document.createElement('div');
      fileNameDisplay.className = 'selected-file';
      fileNameDisplay.innerHTML = `Selected file: <strong>${fileName}</strong>`;
      
      // Remove any existing file name display
      const existingFileDisplay = fileInput.parentElement.querySelector('.selected-file');
      if (existingFileDisplay) {
        existingFileDisplay.remove();
      }
      
      fileInput.parentElement.appendChild(fileNameDisplay);
    } else {
      showAlert(`Please upload a valid ${fileType} file (PDF/Image for student, PDF/DOC for teacher).`, 'error');
      showInputError(fileInput, `Please upload a valid ${fileType} file.`);
      fileInput.value = ''; // Clear the file input
    }
  }
}

const goToDashboardBtn = document.getElementById("go-to-dashboard-btn");
if (goToDashboardBtn) {
    goToDashboardBtn.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user) return showError("User not logged in");

        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            const role = docSnap.data().role;
            if (role === "student") {
                window.location.href = "students.html";
            } else if (role === "teacher") {
                window.location.href = "teacher.html";
            } else {
                showError("Invalid role");
            }
        } else {
            showError("User data not found");
        }
    });
}


// Complete registration function
async function completeRegistration(role) {
  // Check if required file is uploaded
  const fileInput = (role === 'student') 
      ? document.getElementById('student-cor')
      : document.getElementById('teacher-coe');
  
  if (!fileInput || !fileInput.files.length) {
    if (fileInput) {
      showInputError(fileInput, `Please upload the required ${role === 'student' ? 'COR' : 'COE'} file before completing registration.`);
    }
    showAlert(`Please upload the required ${role === 'student' ? 'COR' : 'COE'} file before completing registration.`, 'error');
    return;
  }

  const completeBtn = document.getElementById(`${role}-complete-btn`);
  if (!completeBtn) return;
  
  const originalText = completeBtn.textContent;
  completeBtn.disabled = true;
  completeBtn.textContent = 'Creating account...';

  try {
    let userData = {};
    let password = '';
    let email = '';

    if (role === 'student') {
      // Handle first name/last name from either separate fields or full name
      const firstName = document.getElementById('student-first-name')?.value.trim() || '';
      const lastName = document.getElementById('student-last-name')?.value.trim() || '';
      // Try to get from full name if first/last name fields don't exist
      const fullName = document.getElementById('student-full-name')?.value.trim() || '';
      const nameParts = fullName.split(' ');
      
      email = document.getElementById('student-email')?.value.trim() || '';
      password = document.getElementById('student-password')?.value || '';
      
      userData = {
        firstName: firstName || (nameParts.length > 0 ? nameParts[0] : ''),
        lastName: lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
        fullName: fullName || `${firstName} ${lastName}`.trim(),
        email: email,
        school: document.getElementById('student-school')?.value.trim() || '',
        role: 'student',
        createdAt: new Date().toISOString()
      };
    } else {
      // Handle first name/last name from either separate fields or full name
      const firstName = document.getElementById('teacher-first-name')?.value.trim() || '';
      const lastName = document.getElementById('teacher-last-name')?.value.trim() || '';
      // Try to get from full name if first/last name fields don't exist
      const fullName = document.getElementById('teacher-full-name')?.value.trim() || '';
      const nameParts = fullName.split(' ');
      
      email = document.getElementById('teacher-email')?.value.trim() || '';
      password = document.getElementById('teacher-password')?.value || '';
      
      // Get department and years taught if they exist
      const department = document.getElementById('teacher-department')?.value || '';
      const yearsElement = document.getElementById('teacher-years');
      const years = yearsElement ? Array.from(yearsElement.selectedOptions).map(option => option.value) : [];
      
      userData = {
        firstName: firstName || (nameParts.length > 0 ? nameParts[0] : ''),
        lastName: lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
        fullName: fullName || `${firstName} ${lastName}`.trim(),
        email: email,
        school: document.getElementById('teacher-school')?.value.trim() || '',
        department,
        years,
        role: 'teacher',
        createdAt: new Date().toISOString()
      };
    }

    // Check if Firebase auth is available
    if (typeof window.auth === 'undefined' || 
        typeof window.createUserWithEmailAndPassword === 'undefined' || 
        typeof window.db === 'undefined') {
      console.error("Firebase authentication not initialized. Using mock registration.");
      
      // Mock success for testing without Firebase
      setTimeout(() => {
        document.getElementById('generated-email').textContent = email;
        showStep('step-complete');
      }, 1000);
    } else {
      // Create user with Firebase
      try {
        const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
        const user = userCredential.user;

        // Save user data to Firestore
        await window.setDoc(window.doc(window.db, 'users', user.uid), userData);
        
        // Send verification email
        await window.sendEmailVerification(user);

        // Show completion screen
        document.getElementById('generated-email').textContent = email;
        showStep('step-complete');
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          showAlert('This email address is already registered. Please use a different email or log in.');
        } else {
          showAlert(error.message);
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Setup error:", error);
    showAlert(`Registration error: ${error.message}`, 'error');
  } finally {
    completeBtn.disabled = false;
    completeBtn.textContent = originalText;
  }
}

// Show alert message
function showAlert(message, type = 'error') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-icon">
            ${type === 'error' ? '⚠️' : '✅'}
        </div>
        <p class="alert-message">${message}</p>
    `;

    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function showError(message) {
    showAlert(message);
}

// Show login error dialog
function showLoginError(error) {
    // Remove existing error dialog if any
    const existingDialog = document.querySelector('.error-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }

    // Create error dialog
    const dialog = document.createElement('div');
    dialog.className = 'error-dialog';

    // Get appropriate error message
    let title = 'Login Failed';
    let message = 'Please check your credentials and try again.';
    
    if (error.code === 'auth/invalid-login-credentials') {
        message = 'Invalid email or password. Please try again.';
    } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
    } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
    }

    dialog.innerHTML = `
        <div class="error-dialog-icon">⚠️</div>
        <div class="error-dialog-content">
            <h3 class="error-dialog-title">${title}</h3>
            <p class="error-dialog-message">${message}</p>
        </div>
        <button class="error-dialog-close">×</button>
    `;

    document.body.appendChild(dialog);

    // Add close button functionality
    const closeBtn = dialog.querySelector('.error-dialog-close');
    closeBtn.addEventListener('click', () => dialog.remove());

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(dialog)) {
            dialog.remove();
        }
    }, 5000);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const loginBtn = document.querySelector('.btn[type="submit"]') || document.getElementById('login-btn');
    const originalText = loginBtn.textContent;

    try {
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.classList.add('btn-loading');
        loginBtn.innerHTML = '<span class="spinner"></span>Logging in...';

        // Your existing login logic here
        await signInWithEmailAndPassword(auth, email, password);
        
        // Handle successful login
        // ...existing success code...

    } catch (error) {
        // Handle error
        showLoginError(error);
    } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.classList.remove('btn-loading');
        loginBtn.textContent = originalText;
    }
}

// Function to navigate to the next step
function nextStep() {
  if (currentRole === 'student') {
    showStep("step-student");
  } else if (currentRole === 'teacher') {
    showStep("step-teacher");
  } else {
    showAlert("Please select a role first", "error");
  }
}

// Update the auth state check
function checkAuthState() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe(); // Detach the listener
            resolve(user);
        }, (error) => {
            console.error("Auth state error:", error);
            resolve(null);
        });
    });
}

// Update where we check for current user
async function handleAuthAction() {
    try {
        const user = await checkAuthState();
        if (!user) {
            // Handle not authenticated state gracefully
            showAlert("Please log in to continue", "error");
            return false;
        }
        return true;
    } catch (error) {
        console.error("Auth check failed:", error);
        showAlert("Authentication error. Please try again.", "error");
        return false;
    }
}

// Initialize event listeners when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Add show/hide password toggles
  addPasswordToggles();

  // Role selection click events
  const studentRole = document.getElementById('student-role');
  const teacherRole = document.getElementById('teacher-role');
  
  if (studentRole) {
    studentRole.addEventListener('click', () => selectRole('student'));
  }
  
  if (teacherRole) {
    teacherRole.addEventListener('click', () => selectRole('teacher'));
  }

  // Continue button from role selection
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', nextStep);
  }

  // Student Complete Sign Up
  const studentCompleteBtn = document.getElementById('student-complete-btn');
  if (studentCompleteBtn) {
    studentCompleteBtn.addEventListener('click', () => completeRegistration('student'));
  }

  // Teacher Complete Sign Up
  const teacherCompleteBtn = document.getElementById('teacher-complete-btn');
  if (teacherCompleteBtn) {
    teacherCompleteBtn.addEventListener('click', () => completeRegistration('teacher'));
  }

  // Continue buttons for validation
  const studentContinueBtn = document.getElementById('student-continue-btn');
  if (studentContinueBtn) {
    studentContinueBtn.addEventListener('click', () => validateAndContinue('student'));
  }
  
  const teacherContinueBtn = document.getElementById('teacher-continue-btn');
  if (teacherContinueBtn) {
    teacherContinueBtn.addEventListener('click', () => validateAndContinue('teacher'));
  }

  // File upload for COR and COE
  const studentCor = document.getElementById('student-cor');
  if (studentCor) {
    studentCor.addEventListener('change', handleFileSelect);
  }

  const teacherCoe = document.getElementById('teacher-coe');
  if (teacherCoe) {
    teacherCoe.addEventListener('change', handleFileSelect);
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Back buttons
  const studentBackBtn = document.getElementById('student-back-btn');
  if (studentBackBtn) {
    studentBackBtn.addEventListener('click', () => showStep('step-role'));
  }
  
  const teacherBackBtn = document.getElementById('teacher-back-btn');
  if (teacherBackBtn) {
    teacherBackBtn.addEventListener('click', () => showStep('step-role'));
  }
  
  const studentDetailsBackBtn = document.getElementById('student-details-back-btn');
  if (studentDetailsBackBtn) {
    studentDetailsBackBtn.addEventListener('click', () => showStep('step-student'));
  }
  
  const teacherDetailsBackBtn = document.getElementById('teacher-details-back-btn');
  if (teacherDetailsBackBtn) {
    teacherDetailsBackBtn.addEventListener('click', () => showStep('step-teacher'));
  }
  
  // Tab switching
  const signupTab = document.getElementById('signup-tab');
  if (signupTab) {
    signupTab.addEventListener('click', () => switchTab('signup'));
  }
  
  const loginTab = document.getElementById('login-tab');
  if (loginTab) {
    loginTab.addEventListener('click', () => switchTab('login'));
  }

  // Set up field validation
  handleFieldValidation('student', 'student-email', 'email');
  handleFieldValidation('student', 'student-password', 'password');
  handleFieldValidation('teacher', 'teacher-email', 'email');
  handleFieldValidation('teacher', 'teacher-password', 'password');

  // Show initial step
  showStep('step-role');
});

// Add styles for error handling and password toggles
document.addEventListener('DOMContentLoaded', function() {
  // Create a style element
  const style = document.createElement('style');
  style.textContent = `
    .form-group {
        position: relative;
        margin-bottom: 1rem;
    }

    .password-container {
        position: relative;
        display: block;
    }

    .error-message {
        color: #ff3860;
        font-size: 0.8rem;
        margin-top: 0.25rem;
        display: block;
    }

    .error {
        border-color: #ff3860 !important;
    }

    input.error:focus {
        box-shadow: 0 0 0 0.125em rgba(255, 56, 96, 0.25);
    }
  `;
  
  // Append the style to the head
  document.head.appendChild(style);
});

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('terms-modal');
    const termsLink = document.querySelector('.terms-link');
    const privacyLink = document.querySelector('.privacy-link');
    const closeModal = document.querySelector('.close-modal');
    const acceptBtn = document.getElementById('accept-terms');
    const declineBtn = document.getElementById('decline-terms');
    const checkbox = document.getElementById('terms-agree');

    function showModal() {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showModal();
    });

    privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        showModal();
    });

    closeModal.addEventListener('click', hideModal);
    
    acceptBtn.addEventListener('click', () => {
        checkbox.checked = true;
        hideModal();
    });

    declineBtn.addEventListener('click', () => {
        checkbox.checked = false;
        hideModal();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });
});

// Find the send verification email event listener and update it:
const sendVerificationBtn = document.getElementById("send-verification");
if (sendVerificationBtn) {
    sendVerificationBtn.addEventListener("click", async () => {
        if (await handleAuthAction()) {
            try {
                const user = auth.currentUser;
                // Add a small delay to prevent rapid sending
                await new Promise(resolve => setTimeout(resolve, 500));
                await sendEmailVerification(user);
                showAlert("Verification email sent successfully!", "success");
                
                // Disable the button temporarily
                sendVerificationBtn.disabled = true;
                sendVerificationBtn.textContent = "Email Sent";
                setTimeout(() => {
                    sendVerificationBtn.disabled = false;
                    sendVerificationBtn.textContent = "Send Verification Email";
                }, 30000); // Re-enable after 30 seconds

            } catch (error) {
                showAlert("Failed to send verification email. Please try again.", "error");
            }
        }
    });
}

// Add this to handle Firebase errors
function initializeFirebaseErrorHandling() {
    // Override default error handling
    window.addEventListener('unhandledrejection', function(event) {
        // Prevent default Firebase error dialog
        if (event.reason && event.reason.code && event.reason.code.startsWith('auth/')) {
            event.preventDefault();
            handleFirebaseError(event.reason);
        }
    });
}

function handleFirebaseError(error) {
    const errorMessages = {
        'auth/invalid-login-credentials': 'Invalid email or password. Please try again.',
        'auth/user-not-found': 'No account exists with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'default': 'An error occurred. Please try again.'
    };

    const message = errorMessages[error.code] || errorMessages.default;
    
    showCustomError(message);
}

function showCustomError(message) {
    const errorDialog = document.createElement('div');
    errorDialog.className = 'custom-error-dialog';
    errorDialog.innerHTML = `
        <div class="error-content">
            <div class="error-icon">⚠️</div>
            <div class="error-message">${message}</div>
            <button class="error-close">✕</button>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .custom-error-dialog {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            border-left: 4px solid #ff3860;
            animation: slideIn 0.3s ease-out;
        }
        
        .error-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .error-icon {
            font-size: 20px;
        }

        .error-message {
            color: #333;
            font-size: 14px;
            margin-right: 16px;
        }

        .error-close {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 4px;
            font-size: 18px;
        }

        @keyframes slideIn {
            from {
                transform: translate(-50%, -100%);
                opacity: 0;
            }
            to {
                transform: translate(-50%, 0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Auto remove after 5 seconds
    setTimeout(() => errorDialog.remove(), 5000);

    // Close button handler
    const closeBtn = errorDialog.querySelector('.error-close');
    closeBtn.onclick = () => errorDialog.remove();

    document.body.appendChild(errorDialog);
}

// Initialize error handling when the page loads
document.addEventListener('DOMContentLoaded', initializeFirebaseErrorHandling);