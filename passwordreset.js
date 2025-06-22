// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
}

// Real-time email validation
function validateEmailInput() {
    const emailInput = document.getElementById('reset-email');
    const emailError = document.getElementById('email-error');
    const sendBtn = document.getElementById('send-btn');
    const email = emailInput.value.trim();

    if (!email) {
        showInputError(emailInput, 'Email is required');
        sendBtn.disabled = true;
        return false;
    } else if (!validateEmail(email)) {
        showInputError(emailInput, 'Please enter a valid email address');
        sendBtn.disabled = true;
        return false;
    } else {
        clearInputError(emailInput);
        sendBtn.disabled = false;
        return true;
    }
}

// Show form step with animation
function showStep(stepId) {
    const steps = document.querySelectorAll('.form-step');
    const currentStep = document.querySelector('.form-step.active');
    const nextStep = document.getElementById(stepId);
    const stepDescription = document.getElementById('step-description');

    // Update step description
    const descriptions = {
        'step-email': 'Enter your email to receive a reset link',
        'step-confirmation': 'Reset link sent to your email'
    };
    stepDescription.textContent = descriptions[stepId];

    if (currentStep) {
        currentStep.style.opacity = '0';
        currentStep.style.transform = 'translateY(20px)';

        setTimeout(() => {
            currentStep.classList.remove('active');
            nextStep.classList.add('active');
            nextStep.style.opacity = '1';
            nextStep.style.transform = 'translateY(0)';
        }, 300);
    } else {
        nextStep.classList.add('active');
        nextStep.style.opacity = '1';
        nextStep.style.transform = 'translateY(0)';
    }
}

// Send password reset email
async function sendResetLink() {
    const emailInput = document.getElementById('reset-email');
    const emailError = document.getElementById('email-error');
    const button = document.getElementById('send-btn');
    const email = emailInput.value.trim();

    // Validate email
    if (!validateEmail(email)) {
        showInputError(emailInput, 'Please enter a valid email address');
        emailInput.classList.add('invalid');
        setTimeout(() => emailInput.classList.remove('invalid'), 500);
        return;
    }

    // Show loading state
    const originalText = button.textContent;
    button.innerHTML = '<span class="spinner"></span> Sending...';
    button.disabled = true;

    try {
        // Check if Firebase auth is available
        if (typeof window.auth === 'undefined' || typeof window.sendPasswordResetEmail === 'undefined') {
            throw new Error('Firebase authentication not initialized');
        }

        // Send password reset email
        await window.sendPasswordResetEmail(window.auth, email);
        console.log('Password reset email sent successfully to:', email);

        // Update UI
        document.getElementById('user-email-display').textContent = email;
        showStep('step-confirmation');
        document.querySelector('#step-confirmation .completion-container').classList.add('pulse');

        // Show success alert
        showAlert('Password reset email sent successfully! Check your inbox.', 'success');
    } catch (error) {
        console.error('Password reset error:', error);

        let errorMessage = 'Failed to send reset link. Please try again.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many attempts. Please try again later.';
                break;
            case 'auth/missing-continue-uri':
                errorMessage = 'System configuration error. Please contact support.';
                break;
            default:
                errorMessage = error.message;
        }

        showInputError(emailInput, errorMessage);
        emailInput.classList.add('invalid');
        setTimeout(() => emailInput.classList.remove('invalid'), 500);
        showAlert(errorMessage, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Show input error
function showInputError(inputElement, message) {
    inputElement.classList.add('error');
    const errorElement = document.getElementById('email-error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

// Clear input error
function clearInputError(inputElement) {
    inputElement.classList.remove('error');
    const errorElement = document.getElementById('email-error');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
}

// Show alert message (similar to sign.js)
function showAlert(message, type) {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert ${type}`;
    alertContainer.textContent = message;

    document.body.appendChild(alertContainer);

    setTimeout(() => {
        alertContainer.remove();
    }, 3000);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('reset-email');
    if (emailInput) {
        emailInput.addEventListener('input', validateEmailInput);
    }

    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendResetLink);
    }

    // Add alert styles (same as sign.js)
    const style = document.createElement('style');
    style.textContent = `
        .error {
            border: 1px solid #ff3860 !important;
            background-color: #fff5f7;
        }
        .alert {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 4px;
            color: white;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        }
        .alert.error {
            background-color: #ff3860;
        }
        .alert.success {
            background-color: #23d160;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
});

// Debug Firebase initialization
console.log('Testing Firebase connection...');
console.log('Auth object:', window.auth);