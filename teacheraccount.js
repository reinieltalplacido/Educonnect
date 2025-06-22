document.addEventListener('DOMContentLoaded', function() {
    // Import Firebase modules
    let auth, db;
    let currentUser = null;

    // Initialize Firebase when script loads
    async function initializeFirebase() {
        try {
            // These imports will work because they're already in your HTML
            const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js");
            const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");
            
            // Get the Firebase instances from the window after they're initialized in the HTML
            auth = getAuth();
            db = getFirestore();

            // Check authentication state
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    currentUser = user;
                    console.log("User is signed in:", user.uid);
                    
                    // Verify user role before proceeding
                    try {
                        const userDocRef = doc(db, "users", user.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        
                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data();
                            
                            // Check if user is a teacher
                            if (userData.role !== 'teacher') {
                                console.log("User is not a teacher, redirecting to appropriate page");
                                // Redirect based on role
                                if (userData.role === 'student') {
                                    window.location.href = 'studentaccount.html';
                                } else {
                                    // If role is neither student nor teacher, redirect to sign in
                                    window.location.href = 'sign.html';
                                }
                                return;
                            }
                            
                            // Load profile data since role is verified
                            loadProfileDataFromFirebase();
                        } else {
                            console.log("User document does not exist");
                            window.location.href = 'sign.html';
                        }
                    } catch (error) {
                        console.error("Error verifying user role:", error);
                        // Handle error appropriately
                    }
                } else {
                    console.log("No user is signed in, redirecting to sign in page");
                    window.location.href = "sign.html";
                }
            });
        } catch (error) {
            console.error("Error initializing Firebase:", error);
        }
    }

    // Call the initialize function
    initializeFirebase();

    // Mobile sidebar toggle
        
    // Translation dictionary
    const translations = {
        en: {
            accountSection: "Account Section - Teacher",
            profileInformation: "Profile Information",
            firstName: "First Name",
            lastName: "Last Name",
            email: "Email Address",
            teacherId: "Teacher ID",
            role: "Role",
            saveChanges: "Save Changes",
            changePhoto: "Change",
            accountSettings: "Account Settings",
            languagePreferences: "Language Preferences",
            notificationSettings: "Notification Settings",
            emailNotifications: "Email Notifications",
            deadlineReminders: "Assignment Deadline Reminders",
            gradeNotifications: "Grade Notifications",
            studentQuestions: "Student Questions",
            privacySecurity: "Privacy & Security",
            changePassword: "Change Password",
            myFiles: "My Files",
            uploadedFiles: "Uploaded Files",
            download: "Download",
            delete: "Delete",
            logoutConfirmation: "Ready to leave? Make sure all your work is saved before logging out.",
            dashboard: "Dashboard",
            courses: "Courses",
            calendar: "Calendar",
            grades: "Grades",
            messages: "Messages",
            account: "Account",
            help: "Help",
            logout: "Logout"
        },
        es: {
            accountSection: "Sección de Cuenta - Profesor",
            profileInformation: "Información del Perfil",
            firstName: "Nombre",
            lastName: "Apellido",
            email: "Correo Electrónico",
            teacherId: "ID de Profesor",
            role: "Rol",
            saveChanges: "Guardar Cambios",
            changePhoto: "Cambiar",
            accountSettings: "Configuración de Cuenta",
            languagePreferences: "Preferencias de Idioma",
            notificationSettings: "Configuración de Notificaciones",
            emailNotifications: "Notificaciones de Correo",
            deadlineReminders: "Recordatorios de Plazo",
            gradeNotifications: "Notificaciones de Calificaciones",
            studentQuestions: "Preguntas de Estudiantes",
            privacySecurity: "Privacidad y Seguridad",
            changePassword: "Cambiar Contraseña",
            myFiles: "Mis Archivos",
            uploadedFiles: "Archivos Subidos",
            download: "Descargar",
            delete: "Eliminar",
            logoutConfirmation: "¿Listo para salir? Asegúrate de guardar tu trabajo antes de salir.",
            dashboard: "Panel",
            courses: "Cursos",
            calendar: "Calendario",
            grades: "Calificaciones",
            messages: "Mensajes",
            account: "Cuenta",
            help: "Ayuda",
            logout: "Cerrar Sesión"
        },
        fr: {
            accountSection: "Section Compte - Enseignant",
            profileInformation: "Informations du Profil",
            firstName: "Prénom",
            lastName: "Nom",
            email: "Adresse Email",
            teacherId: "ID Enseignant",
            role: "Rôle",
            saveChanges: "Enregistrer les Modifications",
            changePhoto: "Changer",
            accountSettings: "Paramètres du Compte",
            languagePreferences: "Préférences de Langue",
            notificationSettings: "Paramètres de Notification",
            emailNotifications: "Notifications par Email",
            deadlineReminders: "Rappels d'Échéance",
            gradeNotifications: "Notifications de Notes",
            studentQuestions: "Questions des Étudiants",
            privacySecurity: "Confidentialité et Sécurité",
            changePassword: "Changer le Mot de Passe",
            myFiles: "Mes Fichiers",
            uploadedFiles: "Fichiers Téléchargés",
            download: "Télécharger",
            delete: "Supprimer",
            logoutConfirmation: "Prêt à partir? Assurez-vous que tout votre travail est enregistré avant de vous déconnecter.",
            dashboard: "Tableau de Bord",
            courses: "Cours",
            calendar: "Calendrier",
            grades: "Notes",
            messages: "Messages",
            account: "Compte",
            help: "Aide",
            logout: "Déconnexion"
        },
        de: {
            accountSection: "Kontobereich - Lehrer",
            profileInformation: "Profilinformationen",
            firstName: "Vorname",
            lastName: "Nachname",
            email: "E-Mail-Adresse",
            teacherId: "Lehrer-ID",
            role: "Rolle",
            saveChanges: "Änderungen speichern",
            changePhoto: "Ändern",
            accountSettings: "Kontoeinstellungen",
            languagePreferences: "Spracheinstellungen",
            notificationSettings: "Benachrichtigungseinstellungen",
            emailNotifications: "E-Mail-Benachrichtigungen",
            deadlineReminders: "Fristen-Erinnerungen",
            gradeNotifications: "Benotungsbenachrichtigungen",
            studentQuestions: "Studentenfragen",
            privacySecurity: "Datenschutz & Sicherheit",
            changePassword: "Passwort ändern",
            myFiles: "Meine Dateien",
            uploadedFiles: "Hochgeladene Dateien",
            download: "Herunterladen",
            delete: "Löschen",
            logoutConfirmation: "Bereit zum Verlassen? Stellen Sie sicher, dass alle Ihre Arbeiten gespeichert sind, bevor Sie sich abmelden.",
            dashboard: "Dashboard",
            courses: "Kurse",
            calendar: "Kalender",
            grades: "Noten",
            messages: "Nachrichten",
            account: "Konto",
            help: "Hilfe",
            logout: "Abmelden"
        },
        zh: {
            accountSection: "账户部分 - 教师",
            profileInformation: "个人信息",
            firstName: "名字",
            lastName: "姓氏",
            email: "电子邮件地址",
            teacherId: "教师ID",
            role: "角色",
            saveChanges: "保存更改",
            changePhoto: "更改",
            accountSettings: "账户设置",
            languagePreferences: "语言偏好",
            notificationSettings: "通知设置",
            emailNotifications: "电子邮件通知",
            deadlineReminders: "作业截止提醒",
            gradeNotifications: "成绩通知",
            studentQuestions: "学生问题",
            privacySecurity: "隐私与安全",
            changePassword: "更改密码",
            myFiles: "我的文件",
            uploadedFiles: "已上传文件",
            download: "下载",
            delete: "删除",
            logoutConfirmation: "准备离开？请确保在注销前保存所有工作。",
            dashboard: "仪表板",
            courses: "课程",
            calendar: "日历",
            grades: "成绩",
            messages: "消息",
            account: "账户",
            help: "帮助",
            logout: "注销"
        }
    };

    // Apply translations to all elements including navigation
    function applyTranslations(lang) {
        const t = translations[lang];
        if (!t) return;

        // Translate regular elements
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            if (t[key]) {
                if (element.tagName === 'INPUT' && element.type !== 'submit') {
                    element.placeholder = t[key];
                } else {
                    element.textContent = t[key];
                }
            }
        });

        // Translate sidebar navigation items
        const navItems = [
            { selector: '.sidebar-menu li:nth-child(1) .sidebar-text', key: 'dashboard' },
            { selector: '.sidebar-menu li:nth-child(2) .sidebar-text', key: 'courses' },
            { selector: '.sidebar-menu li:nth-child(3) .sidebar-text', key: 'grades' },
            { selector: '.sidebar-menu li:nth-child(4) .sidebar-text', key: 'calendar' },
            { selector: '.sidebar-menu li:nth-child(5) .sidebar-text', key: 'messages' },
            { selector: '.sidebar-menu li:nth-child(6) .sidebar-text', key: 'help' },
            { selector: '.sidebar-menu li:nth-child(7) .sidebar-text', key: 'account' },
            { selector: '.sidebar-menu li:nth-child(8) .sidebar-text', key: 'logout' }
        ];

        navItems.forEach(item => {
            const element = document.querySelector(item.selector);
            if (element && t[item.key]) {
                element.textContent = t[item.key];
            }
        });
    }

    // Function to load language preference from Firebase
    async function loadLanguagePreference() {
        if (!currentUser) return;
        
        try {
            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const savedLanguage = userData.languagePreference || 'en';
                languageSelect.value = savedLanguage;
                applyTranslations(savedLanguage);
            } else {
                // Default to English if no preference is found
                languageSelect.value = 'en';
                applyTranslations('en');
            }
        } catch (error) {
            console.error("Error loading language preference:", error);
            // Fallback to English
            languageSelect.value = 'en';
            applyTranslations('en');
        }
    }

    // Function to save language preference to Firebase
    async function saveLanguagePreference(lang) {
        if (!currentUser) return;
        
        try {
            const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, {
                languagePreference: lang,
                lastUpdated: new Date()
            });
            console.log("Language preference saved to Firebase");
        } catch (error) {
            console.error("Error saving language preference:", error);
        }
    }

    // Load profile data from Firebase
    async function loadProfileDataFromFirebase() {
        if (!currentUser) {
            console.log("No user logged in to load profile data");
            return;
        }

        try {
            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");
            
            // Get the user document from Firestore
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                
                // Double-check role for security
                if (userData.role !== "teacher") {
                    console.error("Attempted to load non-teacher data in teacher page");
                    return;
                }
                
                // Update form fields with data from Firebase
                if (userData.firstName) document.getElementById('firstName').value = userData.firstName;
                if (userData.lastName) document.getElementById('lastName').value = userData.lastName;
                if (userData.email) document.getElementById('email').value = userData.email;
                if (userData.role) document.getElementById('role').value = userData.role;
                
                // If user has a profile picture, display it
                if (userData.profilePicture) {
                    document.getElementById('profilePicture').src = userData.profilePicture;
                }
                
                console.log("Profile data loaded from Firebase");
                
                // Now load language preferences
                loadLanguagePreference();
            } else {
                console.log("No profile data found in Firebase");
                // If no data exists yet, we might want to initialize some default values
                initializeUserProfile();
            }
        } catch (error) {
            console.error("Error loading profile data from Firebase:", error);
        }
    }

    // Function to initialize a new user profile
    async function initializeUserProfile() {
        if (!currentUser) return;
        
        try {
            const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");
            
            const defaultData = {
                firstName: "",
                lastName: "",
                email: currentUser.email,
                role: "teacher", // Ensure role is set to teacher
                languagePreference: "en",
                createdAt: new Date(),
                lastUpdated: new Date()
            };
            
            // Create the user document in Firestore
            const userDocRef = doc(db, "users", currentUser.uid);
            await setDoc(userDocRef, defaultData);
            
            console.log("Initialized new user profile");
            
            // Update the form fields with the default data
            document.getElementById('email').value = currentUser.email;
            document.getElementById('role').value = "teacher";
            
            // Set language to default
            languageSelect.value = "en";
            applyTranslations("en");
        } catch (error) {
            console.error("Error initializing user profile:", error);
        }
    }

    // Save profile data to Firebase
    async function saveProfileToFirebase() {
        if (!currentUser) {
            showToast('You must be logged in to save changes', 'error');
            return false;
        }

        try {
            // Import updateDoc from Firebase
            const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");
            
            // Get values from inputs
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const profilePictureSrc = document.getElementById('profilePicture').src;
            
            // Validate inputs
            if (!firstName || !lastName) {
                showToast('First name and last name cannot be empty', 'error');
                return false;
            }
            
            // Create user document reference
            const userDocRef = doc(db, "users", currentUser.uid);
            
            // Prepare the update data
            const updateData = {
                firstName: firstName,
                lastName: lastName,
                role: "teacher", // Always ensure the correct role is saved
                lastUpdated: new Date()
            };
            
            // Only add profile picture if it's not a placeholder
            if (profilePictureSrc && !profilePictureSrc.includes('placeholder.com')) {
                updateData.profilePicture = profilePictureSrc;
            }
            
            // Update the document with new values
            await updateDoc(userDocRef, updateData);
            
            showToast('Profile updated successfully!', 'success');
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast('Error updating profile: ' + error.message, 'error');
            return false;
        }
    }

    // Language selection
    const languageSelect = document.getElementById('languageSelect');
    
    // Initialize with saved language - this will be handled by loadLanguagePreference now
    // which is called after profile data is loaded from Firebase
    
    languageSelect.addEventListener('change', function() {
        const lang = this.value;
        applyTranslations(lang);
        saveLanguagePreference(lang);
        showToast(`Language changed to ${this.options[this.selectedIndex].text}`);
    });

    // Enhanced toast notification function with types (success, error, warning)
    function showToast(message, type = 'info') {
        let toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Set color based on type
        let bgColor = '#FF7043'; // Default orange
        switch(type) {
            case 'success':
                bgColor = '#4CAF50'; // Green
                break;
            case 'error':
                bgColor = '#F44336'; // Red
                break;
            case 'warning':
                bgColor = '#FFC107'; // Yellow
                break;
        }

        // Position and style the toast
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.backgroundColor = bgColor;
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        toast.style.zIndex = '1000';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';

        // Fade in
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);

        // Fade out and remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Profile picture upload
    const profilePicture = document.getElementById('profilePicture');
    const profilePictureContainer = document.querySelector('.profile-picture-container');
    const profilePictureInput = document.getElementById('profilePictureInput');

    profilePictureContainer.addEventListener('click', () => {
        profilePictureInput.click();
    });

    profilePictureInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            
            if (!file.type.match('image.*')) {
                showToast('Please select an image file (JPEG, PNG, etc.)', 'error');
                return;
            }

            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                showToast('Image size should be less than 2MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                profilePicture.src = e.target.result;
                
                // Save to Firebase
                if (currentUser) {
                    try {
                        const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");
                        
                        const userDocRef = doc(db, "users", currentUser.uid);
                        await updateDoc(userDocRef, {
                            profilePicture: e.target.result,
                            lastUpdated: new Date()
                        });
                        
                        showToast('Profile picture updated successfully!', 'success');
                    } catch (error) {
                        console.error("Error updating profile picture:", error);
                        showToast('Error updating profile picture: ' + error.message, 'error');
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Profile data saving with Firebase integration
    document.getElementById('saveProfileBtn').addEventListener('click', async function() {
        const saveButton = this;
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        
        try {
            // Call the Firebase save function
            const success = await saveProfileToFirebase();
            
            // Update button text based on selected language
            const selectedLang = languageSelect.value;
            const t = translations[selectedLang];
            
            if (!success) {
                // If saving to Firebase fails, restore button state
                saveButton.textContent = t?.saveChanges || 'Save Changes';
            } else {
                saveButton.textContent = t?.saveChanges || 'Save Changes';
            }
        } catch (error) {
            console.error("Error in save process:", error);
            showToast('An unexpected error occurred', 'error');
        } finally {
            // Re-enable the button regardless of outcome
            saveButton.disabled = false;
            const selectedLang = languageSelect.value;
            const t = translations[selectedLang];
            saveButton.textContent = t?.saveChanges || 'Save Changes';
        }
    });

    // Password reset
    document.getElementById('resetPasswordBtn').addEventListener('click', async function() {
        if (!currentUser) {
            showToast('You must be logged in to reset password', 'error');
            return;
        }

        try {
            const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js");
            await sendPasswordResetEmail(auth, currentUser.email);
            showToast('Password reset link sent to your email', 'success');
        } catch (error) {
            console.error("Error sending password reset:", error);
            showToast('Error sending password reset: ' + error.message, 'error');
        }
    });

    // File actions
    document.querySelectorAll('.file-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const fileItem = this.closest('.file-item');
            const fileName = fileItem.querySelector('.file-name').textContent;
            
            if (this.querySelector('.fa-trash')) {
                if (confirm(`Delete ${fileName}?`)) {
                    fileItem.remove();
                    showToast('File deleted', 'success');
                    
                    // TODO: Add Firebase storage deletion here
                    // This would require additional Firebase Storage code
                }
            } else if (this.querySelector('.fa-download')) {
                showToast(`Downloading ${fileName}...`, 'info');
                
                // TODO: Add Firebase storage download functionality
                // This would require additional Firebase Storage code
            }
        });
    });

    // Remove all existing logout-related code and replace with this
    document.addEventListener('DOMContentLoaded', function() {
        // Get modal elements immediately after DOM loads
        const logoutModal = document.getElementById('logoutModal');
        const logoutBtn = document.getElementById('logoutBtn');
        const cancelLogout = document.getElementById('cancelLogout');
        const confirmLogoutBtn = document.querySelector('.confirm-btn');

        // Show modal when logout button is clicked
        logoutBtn?.addEventListener('click', function(e) {
            e.preventDefault();
            logoutModal.style.display = 'flex';
        });

        // Hide modal when cancel is clicked
        cancelLogout?.addEventListener('click', function() {
            logoutModal.style.display = 'none';
        });

        // Hide modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === logoutModal) {
                logoutModal.style.display = 'none';
            }
        });

        // Handle logout confirmation
        confirmLogoutBtn?.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                const { signOut } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js");
                const auth = getAuth();
                await signOut(auth);
                logoutModal.style.display = 'none';
                window.location.href = 'sign.html';
            } catch (error) {
                console.error("Error signing out:", error);
                showToast('Error signing out: ' + error.message, 'error');
            }
        });

        // Remove any duplicate event listeners
        // ...existing code...
    });
});