 // Enhanced response options
 const responses = {
    grades: "📊 If you can't access your grades, try these steps:<br><br>1. Make sure you're fully logged in<br>2. Clear your browser cache and cookies<br>3. Check if the grading period has ended<br>4. Verify you're enrolled in the course<br><br>If you still can't see your grades, contact your instructor or our support team at <a href='mailto:support@educonnect.com'>support@educonnect.com</a>.",
    password: "🔐 To reset your password:<br><br>1. Click the 'Forgot Password' link on the login page<br>2. Enter the email address associated with your account<br>3. Check your email for a password reset link (check spam folder too)<br>4. Follow the link to create a new password<br><br>The reset link expires after 24 hours. If you don't receive an email within 15 minutes, contact support.",
    enroll: "📚 Here's how to enroll in a course:<br><br>1. Go to the 'Courses' section in the sidebar<br>2. Click the 'Browse Courses' button<br>3. Find the course you want and click 'Enroll'<br>4. Confirm your enrollment<br>5. If the course requires an enrollment key, enter it when prompted<br><br>The course will appear in your dashboard once enrollment is complete.",
    contact: "👩‍🏫 You have several ways to contact your instructor:<br><br>1. Through the course page: Go to 'Courses' → Select your course → Click 'Instructor Info' → Use the 'Message' button<br>2. Via Chat: Go to 'Chat' → 'New Message' → Search for instructor's name<br>3. During virtual office hours (check your course syllabus for schedule)<br><br>Most instructors respond within 24-48 hours during weekdays.",
    bug: "🐞 Found a bug? Here's how to report it effectively:<br><br>1. Take a screenshot showing the error<br>2. Note what you were doing when the error occurred<br>3. Record any error messages you see<br>4. Note your device, operating system, and browser<br><br>Email these details to <a href='mailto:support@educonnect.com'>support@educonnect.com</a> with 'BUG REPORT' in the subject line.",
    assignments: "📝 To submit assignments properly:<br><br>1. Navigate to your course page<br>2. Go to the 'Assignments' tab<br>3. Find the assignment and click 'Submit'<br>4. Upload your files (check allowed formats and size limits)<br>5. Add any comments for your instructor (optional)<br>6. Click 'Submit Assignment'<br><br>Always check for a confirmation message and save your submission receipt.",
    notifications: "🔔 To manage your notification settings:<br><br>1. Go to 'Account' in the sidebar<br>2. Select 'Notification Settings'<br>3. Choose which notifications you want to receive<br>4. Select your preferred delivery methods (email, mobile, browser)<br>5. Set quiet hours if needed<br>6. Save your changes<br><br>You can create custom notification rules for high-priority courses."
};

// Enhanced sidebar toggle for mobile
document.addEventListener('DOMContentLoaded', function() {
    // Chat option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-reply');
            const reply = responses[key];
            const container = document.getElementById('chat-response');
            container.innerHTML = `<div class='user-question'>👉 ${btn.textContent}</div><div class='bot-message'>${reply}</div>`;
        });
    });

    // Custom question button
    document.getElementById('sendCustom').addEventListener('click', () => {
        const input = document.getElementById('customInput');
        const text = input.value.trim();
        const container = document.getElementById('chat-response');
        if (text !== "") {
            container.innerHTML = `<div class='user-question'>👉 ${text}</div><div class='bot-message'>🤖 Thanks for your question! We'll get back to you soon via email. In the meantime, you might find an answer in our FAQ section below.</div>`;
            input.value = "";
        }
    });

    // FAQ accordion functionality
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            // Toggle active class
            button.classList.toggle('active');
            
            // Toggle answer visibility
            const answer = button.nextElementSibling;
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
        });
    });

    // FAQ tabs functionality
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all FAQ containers
            document.querySelectorAll('.faq-container').forEach(container => {
                container.classList.add('hidden');
            });
            
            // Show the selected container
            const categoryId = tab.getAttribute('data-category');
            document.getElementById(categoryId).classList.remove('hidden');
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Submit feedback button (placeholder functionality)
    const feedbackBtn = document.querySelector('.submit-btn');
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', () => {
            alert('Thank you for your feedback! We appreciate your input.');
            document.getElementById('feedback-message').value = '';
        });
    }
});