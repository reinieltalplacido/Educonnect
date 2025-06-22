import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    arrayUnion, 
    getDoc, 
    arrayRemove, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
    getStorage, 
    ref, 
    uploadBytesResumable,
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDMs8HtwRyimV3UFJAg633dBmOy6KrxT90",
    authDomain: "educonnect-f70d6.firebaseapp.com",
    projectId: "educonnect-f70d6",
    storageBucket: "educonnect-f70d6.appspot.com",
    messagingSenderId: "211587031768",
    appId: "1:211587031768:web:5b406b1647d4a9a9212dad"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // Make sure `app` is your initialized Firebase app



console.log("teachercourses.js loaded!");

let courses = [];
let editingCourseId = null;
let saving = false;
let selectedCourseId = null;
let activeCourseId = null;
let activeCourseTitle = "";
let quizzes = []; // Add this line
let quizzesArray = []; // Add this if you need it

function getRandomColor() {
    const colors = [
        // Blues
        "#1976D2", "#2196F3", "#64B5F6", "#90CAF9", "#1A237E",
        // Greens
        "#388E3C", "#4CAF50", "#81C784", "#2E7D32", "#1B5E20",
        // Reds
        "#D32F2F", "#E53935", "#EF5350", "#B71C1C", "#C62828",
        // Purples
        "#7B1FA2", "#9C27B0", "#BA68C8", "#4A148C", "#6A1B9A",
        // Oranges
        "#F57C00", "#FF9800", "#FFB74D", "#E65100", "#EF6C00",
        // Teals
        "#00796B", "#009688", "#4DB6AC", "#004D40", "#00695C",
        // Pinks
        "#C2185B", "#E91E63", "#F06292", "#880E4F", "#AD1457",
        // Deep Oranges
        "#E64A19", "#FF5722", "#FF8A65", "#BF360C", "#D84315",
        // Indigos
        "#303F9F", "#3F51B5", "#7986CB", "#1A237E", "#283593",
        // Light Blues
        "#0288D1", "#03A9F4", "#4FC3F7", "#01579B", "#0277BD",
        // Cyans
        "#0097A7", "#00BCD4", "#4DD0E1", "#006064", "#00838F",
        // Light Greens
        "#689F38", "#8BC34A", "#AED581", "#33691E", "#558B2F",
        // Limes
        "#AFB42B", "#CDDC39", "#DCE775", "#827717", "#9E9D24",
        // Ambers
        "#FFA000", "#FFC107", "#FFD54F", "#FF6F00", "#FF8F00",
        // Browns
        "#5D4037", "#795548", "#8D6E63", "#3E2723", "#4E342E"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function showTab(tabId) {
    
    const tabs = {
        'courses': document.getElementById('courses'),
        'manageCourses': document.getElementById('manageCourses'),
        'courseDetails': document.getElementById('courseDetails')
    };

    Object.values(tabs).forEach(tab => {
        if (tab) tab.style.display = 'none';
    });

    if (tabs[tabId]) tabs[tabId].style.display = 'block';

    
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));

    if (tabId === 'courses') {
        tabButtons[0].classList.add('active'); 
    } else if (tabId === 'manageCourses') {
        tabButtons[1].classList.add('active'); 
    }

    
    updateMainActionButton(tabId);
}

const openAddCourseModal = (course = null) => {
    document.getElementById("modalTitle").innerText = course ? "Edit Course" : "Create New Course";
    document.getElementById("courseTitle").value = course?.title || "";
    document.getElementById("courseCode").value = course?.code || "";
    document.getElementById("courseDescription").value = course?.description || "";
    document.getElementById("courseMeta").value = course?.meta || "";
    editingCourseId = course?.id || null;
    document.getElementById("addCourseModal").style.display = "flex";
};

const closeAddCourseModal = () => {
    document.getElementById("addCourseModal").style.display = "none";
    editingCourseId = null;
};

async function saveCourse(event) {
    event?.preventDefault();
    const saveButton = document.querySelector('.btn-primary'); // Update selector to match your button
    
    try {
        if (!saveButton) {
            console.warn('Save button not found');
            return;
        }

        setButtonLoading(saveButton, true, 'Saving');
        const title = document.getElementById("courseTitle").value.trim();
        const code = document.getElementById("courseCode").value.trim();
        const description = document.getElementById("courseDescription").value.trim();
        const meta = document.getElementById("courseMeta").value.trim();

        if (!title || !code || !description || !meta) {
            alert("Please fill in all fields.");
            setButtonLoading(saveButton, false, 'Save');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert("Not signed in");
            setButtonLoading(saveButton, false, 'Save');
            return;
        }

        try {
            if (editingCourseId) {
                await updateDoc(doc(db, "courses", editingCourseId), { title, code, description, meta });
            } else {
                await addDoc(collection(db, "courses"), {
                    title,
                    code,
                    description,
                    meta,
                    teacherId: user.uid,
                    timestamp: new Date(),
                    color: getRandomColor()
                });
            }
            alert("Course saved!");
            closeAddCourseModal();
            await loadCoursesFromFirebase();
        } catch (err) {
            console.error("Error saving course:", err);
            alert("Error saving course: " + err.message);
        }
    } catch (error) {
        console.error('Error saving course:', error);
        alert("Error: " + error.message);
    } finally {
        if (saveButton) {
            setButtonLoading(saveButton, false, 'Save');
        }
    }
}

onAuthStateChanged(auth, (user) => {
    user ? loadCoursesFromFirebase() : console.log("Not signed in");
});

async function loadCoursesFromFirebase() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const q = query(collection(db, "courses"), where("teacherId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        courses = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        renderCourses();
        renderManageCourses();
    } catch (error) {
        console.error("Error loading courses: ", error);
    }
}

const renderCourses = () => {
    const container = document.querySelector(".courses-grid");
    if (!container) return;
    container.innerHTML = "";

    courses.forEach(course => {
        const card = document.createElement("div");
        card.className = "course-card";
        card.innerHTML = `
            <div class="course-card-header" style="background-color: ${course.color || '#ccc'};"></div>
            <div class="course-card-body">
                <h3>${course.title}</h3>
                <p>${course.code}</p>
                <p>${course.meta}</p>
            </div>`;
        card.onclick = () => {
            selectedCourseId = course.id;
            showCourseDetails(course);
            document.getElementById('newCourseBtn').style.display = 'inline-block';
            document.getElementById('newCourseBtn').textContent = 'New Announcement';
            document.getElementById('newCourseBtn').onclick = () => alert('Open Announcement Modal');
            showCourseTab('announcementsTab');
        };
        container.appendChild(card);
    });
};

const renderManageCourses = () => {
    const list = document.querySelector(".manage-courses-list");
    if (!list) return;
    list.innerHTML = "";

    courses.forEach(course => {
        const item = document.createElement("div");
        item.className = "course-item";
        item.innerHTML = `
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-meta">${course.code} - ${course.meta}</p>
            </div>
            <div class="course-actions">
                <button class="btn-edit" onclick="editCourse('${course.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteCourse('${course.id}')">Delete</button>
            </div>`;
        list.appendChild(item);
    });
};

const editCourse = (id) => {
    const course = courses.find(c => c.id === id);
    if (course) openAddCourseModal(course);
};

const deleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
        await deleteDoc(doc(db, "courses", id));
        courses = courses.filter(c => c.id !== id);
        renderCourses();
        renderManageCourses();
    } catch (err) {
        console.error("Error deleting course:", err);
    }
};

function goBackToCourses() {
    const cTab = document.getElementById('courses');
    const dTab = document.getElementById('courseDetails');
    const mTab = document.getElementById('manageCourses');
    const btn = document.getElementById('newCourseBtn');

    if (cTab && dTab && btn && mTab) {
        dTab.style.display = 'none';
        mTab.style.display = 'none';
        cTab.style.display = 'block';
        btn.style.display = 'inline-block';
        btn.textContent = "Create Course";
        btn.onclick = () => openAddCourseModal();

        document.getElementById('pageTitle').textContent = "Courses Management";
    }
}

function showCourseDetails(course) {
    
    document.getElementById('courses').style.display = 'none';
    document.getElementById('manageCourses').style.display = 'none';
    document.getElementById('courseDetails').style.display = 'block';

    
    selectedCourseId = course.id;
    activeCourseId = course.id;
    activeCourseTitle = course.title;

    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = course.title;
    }

    
    document.getElementById('courseTitleDetail').textContent = course.title;
    document.getElementById('courseCodeDetail').textContent = course.code;
    document.getElementById('courseDescriptionDetail').textContent = course.description;
    document.getElementById('courseMetaDetail').textContent = course.meta || "";
}

const originalShowCourseTab = window.showCourseTab;

function showCourseTab(tabId) {
    // Hide all course tabs
    document.querySelectorAll('.course-tab').forEach(tab => {
        tab.style.display = 'none';
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Update sidebar active state
    document.querySelectorAll('.sidebar-menu button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(tabId)) {
            btn.classList.add('active');
        }
    });

    // Load content based on tab
    if (tabId === 'announcementsTab' && selectedCourseId) {
        loadAnnouncements(selectedCourseId);
    } else if (tabId === 'studentsTab' && selectedCourseId) {
        loadStudentsForCourse(selectedCourseId);
    } else if (tabId === 'quizTab' && selectedCourseId) {
        loadQuizzes(selectedCourseId);
    } else if (tabId === 'lessonsTab' && selectedCourseId) {
        fetchLessons(selectedCourseId);
    } else if (tabId === 'assignmentsTab' && selectedCourseId) {
        loadAssignments(selectedCourseId);
    }

    // Update main action button
    updateMainActionButton(tabId);
}


window.updateMainActionButton = function(tabId) {
    const tabActions = {
        'courses': { text: 'Create Course', action: () => openAddCourseModal() },
       'lessonsTab': { text: 'Add Lesson', action: showAddLessonModal }, // Fixed: no parentheses
       'assignmentsTab': { text: 'Add Assignment', action: showAssignmentModal }, 
        'filesTab': { text: 'Upload File', action: () => alert('Open File Upload Dialog') },
        'announcementsTab': { text: 'New Announcement', action: showAnnouncementModal },
        'studentsTab': { text: 'Invite Student', action: showInviteStudentModal },
        'quizTab': { text: 'Create Quiz', action: showQuizModal }
    };

    const btn = document.getElementById('newCourseBtn');
    const config = tabActions[tabId];

    if (config) {
        btn.style.display = 'inline-block';
        btn.textContent = config.text;
        btn.onclick = config.action;
    } else {
        btn.style.display = 'none';
    }
};

async function loadStudentsForCourse(courseId) {
    if (!courseId) return;
    
    try {
        
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        
        if (courseDoc.exists()) {
            const courseData = courseDoc.data();
            const students = courseData.students || [];
            
            
            const studentsTable = document.getElementById("studentsTable");
            const studentsListBody = document.getElementById("studentsListBody");
            const noStudentsMsg = document.getElementById("noStudentsMsg");
            
            
            if (studentsListBody) studentsListBody.innerHTML = "";
            
            if (students.length > 0) {
                
                if (studentsTable) studentsTable.style.display = "table";
                if (noStudentsMsg) noStudentsMsg.style.display = "none";
                
                
                students.forEach(student => {
                    const row = document.createElement("tr");
                    
                    
                    const permissionBadges = `
                        <div class="permission-badges">
                            ${student.canView ? '<span class="badge badge-success">Can View</span>' : '<span class="badge badge-danger">No View</span>'}
                            ${student.canSubmit ? '<span class="badge badge-success">Can Submit</span>' : '<span class="badge badge-danger">No Submit</span>'}
                            <span class="badge badge-info">Role: ${student.role || 'Student'}</span>
                        </div>
                    `;
                    
                    row.innerHTML = `
                        <td>
                            <div class="student-email">${student.email}</div>
                            ${permissionBadges}
                        </td>
                        <td class="action-column">
                            <button class="btn-edit-student" onclick="editStudentPermissions('${student.email}')">
                                <span class="edit-icon">✏️</span> Edit
                            </button>
                            <button class="btn-remove-student" onclick="removeStudentFromCourse('${student.email}')">
                                <span class="remove-icon">❌</span> Remove
                            </button>
                        </td>
                    `;
                    studentsListBody.appendChild(row);
                });
                
                
                addStudentListStyles();
                
            } else {
                
                if (studentsTable) studentsTable.style.display = "none";
                if (noStudentsMsg) noStudentsMsg.style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error loading students:", error);
    }
}


function addStudentListStyles() {
    if (document.getElementById('student-list-styles')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'student-list-styles';
    styleElement.textContent = `
        .students-table-container {
            overflow-x: auto;
            margin-top: 20px;
            border-radius: 8px;
            background-color: #fff;
            padding: 10px;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
        }

        .students-table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 0.95rem;
            border-radius: 8px;
            background-color: white;
        }

        .students-table thead {
            background-color: #FF7043;
            color: white;
            position: sticky;
            top: 0;
            z-index: 5;
        }

        .students-table th, .students-table td {
            padding: 14px 18px;
            text-align: left;
            border-bottom: 1px solid #eee;
            transition: background-color 0.3s ease;
            min-width: 100px;
        }

        .students-table th.resizable {
            position: relative;
        }

        .students-table th.resizable::after {
            content: "";
            position: absolute;
            right: 0;
            top: 0;
            width: 5px;
            height: 100%;
            cursor: col-resize;
        }

        .students-table tbody tr:nth-child(odd) {
            background-color: #fafafa;
        }

        .students-table tbody tr:hover {
            background-color: #f1f1f1;
        }

        .students-table tbody tr.selected {
            background-color: #fff8e1;
        }

        .students-table td:focus {
            outline: 2px solid #4285f4;
            outline-offset: 2px;
        }

        .permission-badges {
            display: flex;
            gap: 8px;
            margin-top: 6px;
            flex-wrap: wrap;
        }

        .badge {
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
            white-space: nowrap;
        }

        .badge-success {
            background-color: #e6f4ea;
            color: #0d652d;
            border: 1px solid #34a853;
        }

        .badge-danger {
            background-color: #fce8e6;
            color: #c5221f;
            border: 1px solid #ea4335;
        }

        .badge-info {
            background-color: #e8f0fe;
            color: #174ea6;
            border: 1px solid #4285f4;
        }

        .student-email {
            font-weight: 600;
            color: #333;
        }

        .action-column {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        }

        .btn-remove-student, .btn-edit-student {
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: background-color 0.2s ease, color 0.2s ease;
            border: none;
            user-select: none;
        }

        .btn-remove-student {
            background-color: #fce8e6;
            color: #c5221f;
            border: 1px solid #ea4335;
        }

        .btn-remove-student:hover:not(:disabled) {
            background-color: #ea4335;
            color: white;
        }

        .btn-edit-student {
            background-color: #e8f0fe;
            color: #174ea6;
            border: 1px solid #4285f4;
        }

        .btn-edit-student:hover:not(:disabled) {
            background-color: #4285f4;
            color: white;
        }

        .btn-remove-student:disabled,
        .btn-edit-student:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            color: #999;
            padding: 40px;
            font-style: italic;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }

        /* Loading shimmer */
        .shimmer-row {
            background: linear-gradient(90deg, #f0f0f0 25%, #f6f6f6 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 48px;
        }

        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }

        /* Tooltip */
        .tooltip {
            position: relative;
            display: inline-block;
        }

        .tooltip .tooltiptext {
            visibility: hidden;
            background-color: #333;
            color: #fff;
            text-align: center;
            padding: 5px 8px;
            border-radius: 4px;
            position: absolute;
            z-index: 10;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 0.75rem;
        }

        .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
        }

        /* Accessibility: focus ring */
        .btn-remove-student:focus, .btn-edit-student:focus {
            outline: 2px dashed #666;
            outline-offset: 3px;
        }

        /* Print styles */
        @media print {
            .students-table {
                box-shadow: none;
            }

            .btn-remove-student,
            .btn-edit-student,
            .action-column {
                display: none !important;
            }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .students-table th, .students-table td {
                padding: 10px 12px;
                font-size: 0.85rem;
            }

            .badge {
                font-size: 0.75em;
            }

            .btn-remove-student, .btn-edit-student {
                padding: 5px 10px;
                font-size: 0.85em;
            }
        }
    `;
    document.head.appendChild(styleElement);
}




window.editStudentPermissions = function(studentEmail) {
    
    getDoc(doc(db, "courses", selectedCourseId)).then(courseSnap => {
        if (courseSnap.exists()) {
            const courseData = courseSnap.data();
            const students = courseData.students || [];
            const student = students.find(s => s.email === studentEmail);
            
            if (!student) {
                alert("Student not found");
                return;
            }
            
            
            const modalHTML = `
                <div id="editPermissionsModal" class="modal-backdrop">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Edit Student Permissions</h3>
                            <span class="modal-close" onclick="closeEditPermissionsModal()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <p><strong>Student:</strong> ${studentEmail}</p>
                            
                            <div class="form-group">
                                <label>Role</label>
                                <select id="studentRole" class="form-control">
                                    <option value="student" ${student.role === 'student' ? 'selected' : ''}>Student</option>
                                    <option value="assistant" ${student.role === 'assistant' ? 'selected' : ''}>Teaching Assistant</option>
                                    <option value="auditor" ${student.role === 'auditor' ? 'selected' : ''}>Auditor</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Permissions</label>
                                <div class="checkbox-group">
                                    <input type="checkbox" id="canView" ${student.canView ? 'checked' : ''}>
                                    <label for="canView">Can view course content</label>
                                </div>
                                <div class="checkbox-group">
                                    <input type="checkbox" id="canSubmit" ${student.canSubmit ? 'checked' : ''}>
                                    <label for="canSubmit">Can submit assignments</label>
                                </div>
                            </div>
                            
                            <div class="modal-actions">
                                <button class="btn btn-secondary" onclick="closeEditPermissionsModal()">Cancel</button>
                                <button class="btn btn-primary" onclick="saveStudentPermissions('${studentEmail}')">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
            
            
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .checkbox-group {
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                }
                
                .checkbox-group input[type="checkbox"] {
                    margin-right: 10px;
                }
            `;
            document.head.appendChild(styleElement);
        }
    }).catch(error => {
        console.error("Error getting course data:", error);
    });
};


window.closeEditPermissionsModal = function() {
    const modal = document.getElementById('editPermissionsModal');
    if (modal) {
        modal.parentNode.removeChild(modal);
    }
};


window.saveStudentPermissions = async function(studentEmail) {
    const role = document.getElementById('studentRole').value;
    const canView = document.getElementById('canView').checked;
    const canSubmit = document.getElementById('canSubmit').checked;
    
    try {
        
        const courseRef = doc(db, "courses", selectedCourseId);
        const courseSnap = await getDoc(courseRef);
        
        if (courseSnap.exists()) {
            const courseData = courseSnap.data();
            const students = courseData.students || [];
            
            
            const updatedStudents = students.map(student => {
                if (student.email === studentEmail) {
                    return {
                        ...student,
                        role,
                        canView,
                        canSubmit
                    };
                }
                return student;
            });
            
            
            await updateDoc(courseRef, { students: updatedStudents });
            
            alert("Student permissions updated!");
            closeEditPermissionsModal();
            
            
            loadStudentsForCourse(selectedCourseId);
        }
    } catch (error) {
        console.error("Error updating student permissions:", error);
        alert("Failed to update permissions. Please try again.");
    }
};
window.showInviteStudentModal = function() {
    if (!selectedCourseId) {
        alert("❌ No course selected. Please select a course before inviting students.");
        return;
    }
    document.getElementById("inviteStudentModal").style.display = "block";
};

window.closeInviteStudentModal = function() {
    document.getElementById("inviteStudentModal").style.display = "none";
};

async function sendInvitation(event) {
    event?.preventDefault();
    const inviteButton = document.querySelector('.send-invitation');
    
    try {
        setButtonLoading(inviteButton, true, 'Sending Invitation');
        const emailInput = document.getElementById("studentEmailInput");
        const email = emailInput.value.trim().toLowerCase();

        if (!email) {
            alert("⚠️ Please enter a valid email.");
            setButtonLoading(inviteButton, false, 'Send Invitation');
            return;
        }

        if (!selectedCourseId) {
            alert("❌ No course selected. Please select a course before inviting students.");
            setButtonLoading(inviteButton, false, 'Send Invitation');
            return;
        }

        const studentData = {
            email: email,
            role: 'student',
            canView: true,
            canSubmit: true,
            joinedAt: new Date()
        };

        await updateDoc(doc(db, "courses", selectedCourseId), {
            students: arrayUnion(studentData)
        });

        alert(`✅ Permissions assigned and invitation sent to ${email}`);
        emailInput.value = "";
        closeInviteStudentModal();

        
        loadStudentsForCourse(selectedCourseId);

    } catch (err) {
        console.error("Error inviting student:", err);
        alert("⚠️ Something went wrong while inviting.");
    } finally {
        setButtonLoading(inviteButton, false, 'Send Invitation');
    }
}

async function removeStudentFromCourse(studentEmail) {
    if (!selectedCourseId) {
        alert("No course selected.");
        return;
    }

    if (!confirm(`Are you sure you want to remove ${studentEmail} from this course?`)) {
        return;
    }

    try {
        
        const courseRef = doc(db, "courses", selectedCourseId);
        const courseSnap = await getDoc(courseRef);
        
        if (courseSnap.exists()) {
            const courseData = courseSnap.data();
            const students = courseData.students || [];
            
            
            const updatedStudents = students.filter(student => student.email !== studentEmail);
            
            
            await updateDoc(courseRef, {
                students: updatedStudents
            });
            
            alert(`Student ${studentEmail} has been removed from the course.`);
            
            
            loadStudentsForCourse(selectedCourseId);
        }
    } catch (error) {
        console.error("Error removing student:", error);
        alert("Failed to remove student. Please try again.");
    }
}


function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
}





function createAnnouncementModal() {
    
    if (document.getElementById('announcementModal')) return;
    
    const modalHTML = `
        <div id="announcementModal" class="modal-backdrop" style="display: none;">
            <div class="modal">
                <div class="modal-header">
                    <h3>Create New Announcement</h3>
                    <span class="modal-close" onclick="closeAnnouncementModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="announcementTitle">Title</label>
                        <input type="text" id="announcementTitle" class="form-control" placeholder="Announcement Title">
                    </div>
                    
                    <div class="form-group">
                        <label for="announcementContent">Content</label>
                        <textarea id="announcementContent" class="form-control" rows="5" placeholder="Write your announcement here..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Options</label>
                        <div class="checkbox-group">
                            <input type="checkbox" id="isPinned" />
                            <label for="isPinned">Pin this announcement</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="sendEmail" />
                            <label for="sendEmail">Send email notification to students</label>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="closeAnnouncementModal()">Cancel</button>
                        <button class="btn btn-primary post-announcement" onclick="postAnnouncement()">Post Announcement</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    
}


window.showAnnouncementModal = function() {
    if (!selectedCourseId) {
        alert("Please select a course first.");
        return;
    }
    
    createAnnouncementModal();
    document.getElementById('announcementModal').style.display = 'flex';
};

window.closeAnnouncementModal = function() {
    document.getElementById('announcementModal').style.display = 'none';
};
    

async function postAnnouncement(event) {
    event?.preventDefault();
    const postButton = document.querySelector('.post-announcement');
    
    try {
        setButtonLoading(postButton, true, 'Posting');
        if (!selectedCourseId) {
            alert("No course selected.");
            setButtonLoading(postButton, false, 'Post Announcement');
            return;
        }
        
        const title = document.getElementById('announcementTitle').value.trim();
        const content = document.getElementById('announcementContent').value.trim();
        const isPinned = document.getElementById('isPinned').checked;
        const sendEmail = document.getElementById('sendEmail').checked;
        
        if (!title || !content) {
            alert("Please fill in both title and content.");
            setButtonLoading(postButton, false, 'Post Announcement');
            return;
        }
        
        const user = auth.currentUser;
        if (!user) {
            alert("You need to be signed in to post announcements.");
            setButtonLoading(postButton, false, 'Post Announcement');
            return;
        }
        
        try {
            const courseRef = doc(db, "courses", selectedCourseId);
            const courseSnap = await getDoc(courseRef);
            
            if (!courseSnap.exists()) {
                alert("Course not found.");
                setButtonLoading(postButton, false, 'Post Announcement');
                return;
            }
            
            // Create announcement data
            const announcementData = {
                title,
                content,
                isPinned,
                createdAt: new Date(),
                createdBy: user.uid,
                createdByName: user.displayName || user.email,
                updatedAt: null
            };
            
            // Save announcement
            await updateDoc(courseRef, {
                announcements: arrayUnion(announcementData)
            });

            // Create notification for the announcement
            const notificationData = {
                type: 'announcement',
                title: 'New Announcement',
                message: `A New Annnouncement for "${title}" has been added to your course.`,
                createdAt: serverTimestamp(),
                courseId: selectedCourseId,
                from: user.uid,
                fromName: user.displayName || user.email,
                read: false,
                isPinned: isPinned
            };

            // Save notification to the course's notifications subcollection
            const notificationsRef = collection(db, 'courses', selectedCourseId, 'notifications');
            await addDoc(notificationsRef, notificationData);
            
            if (sendEmail) {
                console.log("Email notification would be sent here");
            }
            
            alert("Announcement posted successfully!");
            closeAnnouncementModal();
            
            // Refresh announcements list
            loadAnnouncements(selectedCourseId);
            
        } catch (error) {
            console.error("Error posting announcement:", error);
            alert("Failed to post announcement. Please try again.");
        }
    } catch (error) {
        console.error('Error posting announcement:', error);
    } finally {
        setButtonLoading(postButton, false, 'Post Announcement');
    }
}


async function loadAnnouncements(courseId) {
    if (!courseId) return;
    
    try {
        const courseSnap = await getDoc(doc(db, "courses", courseId));
        
        if (!courseSnap.exists()) {
            console.error("Course not found");
            return;
        }
        
        const courseData = courseSnap.data();
        const announcements = courseData.announcements || [];
        
        const announcementsContainer = document.getElementById('announcementsTab');
        const header = announcementsContainer.querySelector('h2');
        announcementsContainer.innerHTML = '';
        if (header) announcementsContainer.appendChild(header);
        
        if (announcements.length === 0) {
            const noAnnouncementsMsg = document.createElement('p');
            noAnnouncementsMsg.innerHTML = 'No announcements yet.';
            announcementsContainer.appendChild(noAnnouncementsMsg);
            return;
        }
        
        const sortedAnnouncements = [...announcements].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        
        sortedAnnouncements.forEach((announcement, index) => {
            const announcementElement = document.createElement('div');
            announcementElement.className = `announcement-item ${announcement.isPinned ? 'announcement-pinned' : ''}`;
            
            const timestamp = announcement.createdAt?.toDate ? announcement.createdAt.toDate() : new Date(announcement.createdAt);
            const formattedDate = timestamp.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            announcementElement.innerHTML = `
                <div class="announcement-header">
                    <div class="announcement-title-wrapper">
                        <h3 class="announcement-title">
                            ${announcement.title}
                            ${announcement.isPinned ? '<span class="announcement-pinned-badge">📌 Pinned</span>' : ''}
                        </h3>
                    </div>
                    <div class="announcement-actions">
                        <span class="announcement-meta">Posted on ${formattedDate}</span>
                        <button class="delete-announcement-btn" onclick="deleteAnnouncement(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="announcement-content">
                    ${announcement.content}
                </div>
            `;
            
            announcementsContainer.appendChild(announcementElement);
        });

        // Add styles for the delete button
        const styles = `
            <style>
                .announcement-actions {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .delete-announcement-btn {
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 5px 10px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                
                .delete-announcement-btn:hover {
                    background: #cc0000;
                }
                
                .announcement-header {
                    justify-content: space-between;
                }
                
                .announcement-title-wrapper {
                    flex: 1;
                }
            </style>
        `;
        
        // Add styles to document if not already present
        if (!document.getElementById('announcement-delete-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'announcement-delete-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
        
    } catch (error) {
        console.error("Error loading announcements:", error);
    }
}

window.editAnnouncement = async function(index) {
    if (!selectedCourseId) return;
    
    try {
        
        const courseSnap = await getDoc(doc(db, "courses", selectedCourseId));
        
        if (!courseSnap.exists()) return;
        
        const courseData = courseSnap.data();
        const announcements = courseData.announcements || [];
        
        if (index < 0 || index >= announcements.length) {
            console.error("Invalid announcement index");
            return;
        }
        
        const announcement = announcements[index];
        
        
        createAnnouncementModal();
        
        
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementContent').value = announcement.content;
        document.getElementById('isPinned').checked = announcement.isPinned;
        
        
        document.querySelector('#announcementModal .modal-header h3').textContent = 'Edit Announcement';
        document.querySelector('#announcementModal .btn-primary').textContent = 'Update Announcement';
        
        
        document.querySelector('#announcementModal .btn-primary').onclick = function() {
            updateAnnouncement(index);
        };
        
        
        document.getElementById('announcementModal').style.display = 'flex';
        
    } catch (error) {
        console.error("Error preparing to edit announcement:", error);
    }
};


window.updateAnnouncement = async function(index) {
    if (!selectedCourseId) return;
    
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();
    const isPinned = document.getElementById('isPinned').checked;
    
    if (!title || !content) {
        alert("Please fill in both title and content.");
        return;
    }
    
    try {
        
        const courseRef = doc(db, "courses", selectedCourseId);
        const courseSnap = await getDoc(courseRef);
        
        if (!courseSnap.exists()) return;
        
        const courseData = courseSnap.data();
        const announcements = courseData.announcements || [];
        
        if (index < 0 || index >= announcements.length) {
            console.error("Invalid announcement index");
            return;
        }
        
        
        announcements[index] = {
            ...announcements[index],
            title,
            content,
            isPinned,
            updatedAt: new Date()
        };
        
        
        await updateDoc(courseRef, { announcements });
        
        alert("Announcement updated successfully!");
        closeAnnouncementModal();
        
        
        document.querySelector('#announcementModal .btn-primary').textContent = 'Post Announcement';
        document.querySelector('#announcementModal .btn-primary').onclick = postAnnouncement;
        
        
        loadAnnouncements(selectedCourseId);
        
    } catch (error) {
        console.error("Error updating announcement:", error);
        alert("Failed to update announcement. Please try again.");
    }
};


async function deleteAnnouncement(index) {
    if (!confirm('Are you sure you want to delete this announcement?')) {
        return;
    }

    try {
        const courseRef = doc(db, "courses", selectedCourseId);
        const courseSnap = await getDoc(courseRef);
        
        if (!courseSnap.exists()) {
            throw new Error("Course not found");
        }

        const courseData = courseSnap.data();
        const announcements = courseData.announcements || [];

        if (index < 0 || index >= announcements.length) {
            throw new Error("Invalid announcement index");
        }

        // Remove the announcement at the specified index
        announcements.splice(index, 1);

        // Update the course document with the modified announcements array
        await updateDoc(courseRef, {
            announcements: announcements
        });

        // Show success message
        alert("Announcement deleted successfully!");

        // Refresh the announcements list
        loadAnnouncements(selectedCourseId);

    } catch (error) {
        console.error("Error deleting announcement:", error);
        alert("Failed to delete announcement: " + error.message);
    }
}




function createQuizModal() {
  const lessonModal = document.getElementById('addLessonModalBackdrop');
    if (lessonModal) {
        lessonModal.style.display = 'none'; // or add class `hidden`
    }
  if (document.getElementById('quizModal')) return;

  const modalHTML = `
      <div id="quizModal" class="modal-backdrop" style="display: none;">
          <div class="modal" style="width: 700px; max-width: 90%; max-height: 90vh;">
              <form id="quizForm">
                  <div class="modal-header">
                      <h3>Create New Quiz</h3>
                      <span class="modal-close" onclick="closeQuizModal()">&times;</span>
                  </div>
                  <div class="modal-body" style="max-height: calc(90vh - 130px); overflow-y: auto; padding-right: 15px;">
                      <div class="form-group">
                          <label for="quizTitle">Quiz Title</label>
                          <input type="text" id="quizTitle" class="form-control" placeholder="Enter quiz title">
                      </div>
                      <div class="form-group">
                          <label for="quizDescription">Description</label>
                          <textarea id="quizDescription" class="form-control" rows="2" placeholder="Enter quiz description"></textarea>
                      </div>
                      <div class="form-row">
                          <div class="form-group" style="flex: 1; margin-right: 10px;">
                              <label for="quizDueDate">Due Date</label>
                              <input type="date" id="quizDueDate" class="form-control">
                          </div>
                          <div class="form-group" style="flex: 1; margin-right: 10px;">
                              <label for="quizTimeLimit">Time Limit (minutes)</label>
                              <input type="number" id="quizTimeLimit" class="form-control" min="0" placeholder="No limit">
                          </div>
                          <div class="form-group" style="flex: 1;">
                              <label for="quizMaxAttempts">Max Attempts</label>
                              <input type="number" id="quizMaxAttempts" class="form-control" min="1" value="1">
                          </div>
                      </div>
                      <div class="form-group">
                          <label>Quiz Options</label>
                          <div class="checkbox-group">
                              <input type="checkbox" id="shuffleQuestions">
                              <label for="shuffleQuestions">Shuffle questions</label>
                          </div>
                          <div class="checkbox-group">
                              <input type="checkbox" id="showResults">
                              <label for="showResults">Show results immediately after submission</label>
                          </div>
                      </div>
                      <div class="form-group">
                          <label for="questionCount">Number of Questions</label>
                          <input type="number" id="questionCount" class="form-control" min="1" value="1" max="50" onchange="updateQuestionCount(this.value)">
                          <small class="form-text">Set how many questions you want in this quiz (max 50)</small>
                      </div>
                      <hr>
                      <div class="questions-header">
                          <h4>Questions</h4>
                          <div class="question-progress">
                              <span id="currentQuestionCount">0</span>/<span id="totalQuestionCount">0</span> questions added
                          </div>
                      </div>
                      <div id="questionsList">
                          <!-- Questions will be added here dynamically -->
                      </div>
                      <div class="form-group" style="margin-top: 15px;">
                          <button class="btn btn-outline" type="button" onclick="addQuestion()">+ Add Question</button>
                      </div>
                  </div>
                  <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" onclick="closeQuizModal()">Cancel</button>
                      <button type="submit" class="btn btn-primary save-quiz">Save Quiz</button>
                  </div>
              </form>
          </div>
      </div>
  `;

  // Inject modal into DOM
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  // Attach submit listener safely after it's in the DOM
  const quizForm = document.getElementById('quizForm');
  if (quizForm) {
      quizForm.addEventListener('submit', function (e) {
          e.preventDefault();
          saveQuiz(e);
      });
  }

  // Apply styles
  addQuizStyles();

  // Add first question by default
  setTimeout(() => {
      addQuestion();
      updateQuestionCounter();
  }, 0);

  // Show the modal
  document.getElementById('quizModal').style.display = 'flex';
}


window.updateQuestionCount = function(count) {
    const desiredCount = parseInt(count) || 1;
    const currentCount = document.querySelectorAll('.question-item').length;
    
    // Update total in the counter
    document.getElementById('totalQuestionCount').textContent = desiredCount;
    
    // Add or remove questions as needed
    if (currentCount < desiredCount) {
        // Add more questions
        for (let i = currentCount; i < desiredCount; i++) {
            addQuestion();
        }
    } else if (currentCount > desiredCount) {
        // Remove excess questions
        const questions = document.querySelectorAll('.question-item');
        for (let i = desiredCount; i < currentCount; i++) {
            questions[i].remove();
        }
    }
    
    updateQuestionCounter();
};

window.updateQuestionCounter = function() {
    const currentCount = document.querySelectorAll('.question-item').length;
    document.getElementById('currentQuestionCount').textContent = currentCount;
    
    // Also update the question number labels
    document.querySelectorAll('.question-item').forEach((item, index) => {
        const questionLabel = item.querySelector('.question-number');
        if (questionLabel) {
            questionLabel.textContent = `Question ${index + 1}`;
        }
    });
};


function showQuizModal() {
    // First, create the modal if it doesn't exist yet
    createQuizModal();
    
    // Then show it
    const modal = document.getElementById('quizModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error("Quiz modal element not found");
    }
}


window.closeQuizModal = function() {
    const modal = document.getElementById('quizModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

let questionCounter = 0;


window.addQuestion = function() {
    const questionsList = document.getElementById('questionsList');
    const questionId = `question-${questionCounter++}`;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.id = questionId;
    
    questionDiv.innerHTML = `
        <div class="question-header">
            <div class="question-number">Question ${document.querySelectorAll('.question-item').length + 1}</div>
            <div class="form-group" style="flex-grow: 1; margin: 0 10px;">
                <input type="text" class="form-control question-text" placeholder="Enter your question">
            </div>
            <div class="form-group" style="width: 150px; margin: 0;">
                <select class="form-control question-type" onchange="updateQuestionType('${questionId}', this.value)">
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="short-answer">Short Answer</option>
                </select>
            </div>
            <button class="btn-icon remove-question" onclick="removeQuestion('${questionId}')">×</button>
        </div>
        <div class="question-body">
            <div class="options-container">
                <!-- Options will be added here based on question type -->
            </div>
            <div class="form-group points-row">
                <label>Points:</label>
                <input type="number" class="form-control question-points" min="0" value="1" style="width: 80px;">
            </div>
        </div>
    `;
    
    questionsList.appendChild(questionDiv);
    
    updateQuestionType(questionId, 'multiple-choice');
    updateQuestionCounter();
    
    // Scroll to the newly added question
    setTimeout(() => {
        questionDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
};

async function saveQuiz(event) {
    event?.preventDefault();
    const saveButton = document.querySelector('.save-quiz');
    
    try {
        setButtonLoading(saveButton, true, 'Creating Quiz');
        const title = document.getElementById('quizTitle').value.trim();
        const description = document.getElementById('quizDescription').value.trim();
        const dueDate = document.getElementById('quizDueDate').value;
        const timeLimit = document.getElementById('quizTimeLimit').value;
        const maxAttempts = document.getElementById('quizMaxAttempts').value;

        if (!title) {
            alert("Please enter a quiz title.");
            setButtonLoading(saveButton, false, 'Save Quiz');
            return;
        }

        // Collect questions
        const questions = [];
        const questionElements = document.querySelectorAll('.question-item');
        
        questionElements.forEach((questionEl, index) => {
            const questionText = questionEl.querySelector('.question-text').value.trim();
            const questionType = questionEl.querySelector('.question-type').value;
            const points = parseInt(questionEl.querySelector('.question-points').value) || 1;

            if (!questionText) return;

            let questionData = {
                text: questionText,
                type: questionType,
                points: points
            };

            // Handle different question types
            if (questionType === 'multiple-choice') {
                const options = [];
                let hasCorrectAnswer = false;

                questionEl.querySelectorAll('.option-item').forEach((optionEl) => {
                    const optionText = optionEl.querySelector('input[type="text"]').value.trim();
                    const isCorrect = optionEl.querySelector('input[type="radio"]').checked;

                    if (optionText) {
                        options.push({
                            text: optionText,
                            isCorrect: isCorrect
                        });
                        if (isCorrect) hasCorrectAnswer = true;
                    }
                });

                if (!hasCorrectAnswer) {
                    throw new Error(`Question ${index + 1} must have a correct answer selected.`);
                }

                questionData.options = options;
            } 
            else if (questionType === 'true-false') {
                const trueOption = questionEl.querySelector('input[type="radio"]:first-of-type').checked;
                questionData.correctAnswer = trueOption ? "true" : "false";
                questionData.options = [
                    { text: "True", isCorrect: trueOption },
                    { text: "False", isCorrect: !trueOption }
                ];
            }
            else if (questionType === 'short-answer') {
                const sampleAnswer = questionEl.querySelector('.sample-answer')?.value?.trim();
                questionData.sampleAnswer = sampleAnswer || '';
            }

            questions.push(questionData);
        });

        if (questions.length === 0) {
            throw new Error("Please add at least one question with content.");
        }

        // Create quiz data
        const quizData = {
            title,
            description,
            dueDate,
            timeLimit: timeLimit ? parseInt(timeLimit) : null,
            maxAttempts: maxAttempts ? parseInt(maxAttempts) : null,
            shuffleQuestions: document.getElementById('shuffleQuestions').checked,
            showResults: document.getElementById('showResults').checked,
            questions: questions,
            createdBy: auth.currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Save quiz to Firestore
        const quizzesRef = collection(db, 'courses', selectedCourseId, 'quizzes');
        const newQuizRef = await addDoc(quizzesRef, quizData);

        const notificationData = {
            type: 'quiz',
            title: 'New Quiz Added',
            message: `A new quiz "${title}" has been added to your course.`,
            createdAt: serverTimestamp(),
            courseId: selectedCourseId,
            from: auth.currentUser.uid,
            fromName: auth.currentUser.displayName || auth.currentUser.email,
            quizId: newQuizRef.id,
            read: false
        };

        // Save notification to the course's notifications subcollection
        const notificationsRef = collection(db, 'courses', selectedCourseId, 'notifications');
        await addDoc(notificationsRef, notificationData);

        console.log("Quiz added successfully!");
        
        closeQuizModal();
        
        // Refresh quiz list
        loadQuizzes(selectedCourseId);

    } catch (error) {
        console.error("Error creating quiz:", error);
        alert("Failed to create quiz: " + error.message);
    } finally {
        setButtonLoading(saveButton, false, 'Save Quiz');
    }
}










window.updateQuestionType = function(questionId, type) {
    const optionsContainer = document.querySelector(`#${questionId} .options-container`);
    optionsContainer.innerHTML = '';
    
    switch(type) {
        case 'multiple-choice':
            optionsContainer.innerHTML = `
                <div class="option-item">
                    <input type="radio" name="${questionId}-option" checked>
                    <input type="text" class="form-control option-text" placeholder="Option 1">
                    <button class="btn-icon remove-option">×</button>
                </div>
                <div class="option-item">
                    <input type="radio" name="${questionId}-option">
                    <input type="text" class="form-control option-text" placeholder="Option 2">
                    <button class="btn-icon remove-option">×</button>
                </div>
                <button class="btn btn-sm btn-outline add-option">+ Add Option</button>
            `;
            
            
            const addOptionBtn = optionsContainer.querySelector('.add-option');
            addOptionBtn.addEventListener('click', () => addOption(questionId));
            
            const removeOptionBtns = optionsContainer.querySelectorAll('.remove-option');
            removeOptionBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const optionsCount = optionsContainer.querySelectorAll('.option-item').length;
                    if (optionsCount > 2) {
                        e.target.closest('.option-item').remove();
                    } else {
                        alert("Multiple choice questions must have at least 2 options.");
                    }
                });
            });
            break;
            
        case 'true-false':
            optionsContainer.innerHTML = `
                <div class="option-item">
                    <input type="radio" name="${questionId}-option" checked>
                    <label>True</label>
                </div>
                <div class="option-item">
                    <input type="radio" name="${questionId}-option">
                    <label>False</label>
                </div>
            `;
            break;
            
        case 'short-answer':
            optionsContainer.innerHTML = `
                <div class="form-group">
                    <label>Sample Answer (optional):</label>
                    <textarea class="form-control sample-answer" placeholder="Enter a sample correct answer"></textarea>
                </div>
            `;
            break;
    }
};


window.addOption = function(questionId) {
    const optionsContainer = document.querySelector(`#${questionId} .options-container`);
    const optionsCount = optionsContainer.querySelectorAll('.option-item').length;
    
    const optionItem = document.createElement('div');
    optionItem.className = 'option-item';
    optionItem.innerHTML = `
        <input type="radio" name="${questionId}-option">
        <input type="text" class="form-control option-text" placeholder="Option ${optionsCount + 1}">
        <button class="btn-icon remove-option">×</button>
    `;
    
    
    optionsContainer.insertBefore(optionItem, optionsContainer.querySelector('.add-option'));
    
    
    optionItem.querySelector('.remove-option').addEventListener('click', (e) => {
        const currentOptionsCount = optionsContainer.querySelectorAll('.option-item').length;
        if (currentOptionsCount > 2) {
            e.target.closest('.option-item').remove();
        } else {
            alert("Multiple choice questions must have at least 2 options.");
        }
    });
};


window.removeQuestion = function(questionId) {
    const questionsList = document.getElementById('questionsList');
    const questionsCount = questionsList.querySelectorAll('.question-item').length;
    
    if (questionsCount > 1) {
        document.getElementById(questionId).remove();
        
        // Update the question count input
        document.getElementById('questionCount').value = questionsCount - 1;
        
        // Update the counter
        updateQuestionCounter();
    } else {
        alert("Quiz must have at least one question.");
    }
};





// Add to window exports at the bottom of the file



async function loadQuizzes(courseId) {
    if (!courseId) return;
  
    try {
        const quizzesContainer = document.getElementById('quizTab');
        
        // Add header and search UI
        const headerHTML = `
            <h2>Quiz</h2>
            <div class="quiz-search-bar">
                
                
            </div>
            <div class="quizzes-list"></div>
        `;
        
        quizzesContainer.innerHTML = headerHTML;

        // Fetch quizzes from subcollection
        const quizzesRef = collection(db, "courses", courseId, "quizzes");
        const quizzesSnap = await getDocs(quizzesRef);
        const quizzesList = quizzesContainer.querySelector('.quizzes-list');

        if (quizzesSnap.empty) {
            quizzesList.innerHTML = '<p class="no-quizzes">No quizzes available yet.</p>';
            return;
        }

        // Display quizzes
        quizzesSnap.forEach(doc => {
            const quiz = doc.data();
            const dueDate = quiz.dueDate ? new Date(quiz.dueDate) : null;
            const now = new Date();
            
            const status = dueDate && dueDate < now ? 'ENDED' : 'ACTIVE';

            const quizCard = document.createElement('div');
            quizCard.className = 'quiz-item';
            
            quizCard.innerHTML = `
                <div class="quiz-header">
                    <h3>${quiz.title}</h3>
                    <span class="quiz-status ${status.toLowerCase()}">${status}</span>
                </div>
                <div class="quiz-description">${quiz.description || quiz.title}</div>
                <div class="quiz-meta">
                    <span><i class="fas fa-question-circle"></i> ${quiz.questions?.length || 1} Question</span>
                    <span><i class="fas fa-clock"></i> ${quiz.timeLimit ? quiz.timeLimit + ' min' : 'No time limit'}</span>
                    <span><i class="fas fa-calendar"></i> ${dueDate ? formatDate(dueDate) : 'No due date'}</span>
                </div>
                <div class="quiz-actions">
                    <button class="action-btn" onclick="viewQuizResults('${courseId}', '${doc.id}')">View Results</button>
                    <button class="edit-btn" onclick="editQuiz('${courseId}', '${doc.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteQuiz('${courseId}', '${doc.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            quizzesList.appendChild(quizCard);
        });

        // Add CSS styles
        addQuizListStyles();

    } catch (error) {
        console.error("Error loading quizzes:", error);
        quizzesContainer.innerHTML = `
            <h2>Quiz</h2>
            <p class="error-message">Error loading quizzes: ${error.message}</p>
        `;
    }
}

function addQuizListStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .quiz-search-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 20px 0;
        }

        .quiz-search {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 300px;
        }

        .create-quiz-btn {
            background: #FF7043;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }

        .quiz-item {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #FF7043;
        }

        .quiz-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .quiz-header h3 {
            margin: 0;
            color: #333;
        }

        .quiz-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }

        .quiz-status.active {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .quiz-status.ended {
            background: #ffebee;
            color: #c62828;
        }

        .quiz-description {
            color: #666;
            margin-bottom: 15px;
        }

        .quiz-meta {
            display: flex;
            gap: 20px;
            color: #666;
            font-size: 14px;
            margin-bottom: 15px;
        }

        .quiz-meta span {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .quiz-actions {
            display: flex;
            gap: 10px;
        }

        .action-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
        }

        .edit-btn, .delete-btn {
            width: 32px;
            height: 32px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .edit-btn {
            background: #2196F3;
            color: white;
        }

        .delete-btn {
            background: #f44336;
            color: white;
        }

        .no-quizzes {
            text-align: center;
            color: #666;
            padding: 40px;
        }
    `;
    document.head.appendChild(style);
}

function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${date.toLocaleTimeString()}`;
}


window.editQuiz = function(index) {
    
    
    alert("Edit quiz functionality will be implemented here");
};


window.deleteQuiz = async function(courseId, quizId) {
    if (!confirm("Are you sure you want to delete this quiz?")) {
        return;
    }

    try {
        // Reference to the specific quiz document in the quizzes subcollection
        const quizRef = doc(db, "courses", courseId, "quizzes", quizId);
        
        // Delete the quiz document
        await deleteDoc(quizRef);
        
        // Show success notification
        showNotification('Quiz deleted successfully!', 'success');
        
        // Refresh the quizzes list
        loadQuizzes(courseId);
        
    } catch (error) {
        console.error("Error deleting quiz:", error);
        showNotification(`Failed to delete quiz: ${error.message}`, 'error');
    }
};



function ensureFirebaseImports() {
    if (typeof getDoc === 'undefined' || typeof doc === 'undefined' || typeof updateDoc === 'undefined') {
        console.error("Firebase functions not properly imported. Make sure to import these at the top of your file:");
        console.error("import { doc, getDoc, updateDoc } from 'firebase/firestore';");
        return false;
    }
    return true;
}

// Make sure the modal close function works
window.closeQuizModal = function() {
    const modal = document.getElementById('quizModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

async function viewQuizResults(courseId, quizId) {
    try {
        // Get the quiz document
        const quizRef = doc(db, "courses", courseId, "quizzes", quizId);
        const quizDoc = await getDoc(quizRef);

        if (!quizDoc.exists()) {
            throw new Error("Quiz not found");
        }

        const quiz = quizDoc.data();

        // Get quiz submissions
        const submissionsRef = collection(db, "courses", courseId, "quizzes", quizId, "submissions");
        const submissionsSnap = await getDocs(submissionsRef);

        const resultsHtml = `
            <div class="quiz-results-modal modal-backdrop" style="display: block;">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Quiz Results: ${quiz.title}</h3>
                        <span class="modal-close" onclick="document.querySelector('.quiz-results-modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Score</th>
                                    <th>Submission Time</th>
                                   
                                </tr>
                            </thead>
                            <tbody>
                                ${submissionsSnap.empty ? `
                                    <tr>
                                        <td colspan="4" style="text-align: center;">No submissions yet</td>
                                    </tr>
                                ` : submissionsSnap.docs.map(doc => {
                                    const submission = doc.data();
                                    return `
                                        <tr>
                                            <td>${submission.studentName || 'Unknown'}</td>
<td>${submission.score || 0}/${submission.totalPoints || 0}</td>
<td>${submission.submittedAt?.toDate().toLocaleString() || 'N/A'}</td>


                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.querySelector('.quiz-results-modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = resultsHtml;
        document.body.appendChild(modalContainer);

    } catch (error) {
        console.error("Error viewing quiz results:", error);
        alert("Failed to load quiz results: " + error.message);
    }
}

// Helper function to calculate average score
function calculateAverageScore(submissionsSnap) {
    if (submissionsSnap.empty) return 0;
    
    let totalScore = 0;
    submissionsSnap.forEach(doc => {
        totalScore += doc.data().score || 0;
    });
    
    return Math.round(totalScore / submissionsSnap.size);
}

// Function to close quiz results
window.closeQuizResults = function() {
    const container = document.getElementById('quizResultsContainer');
    if (container) {
        container.style.display = 'none';
    }
};

// Helper function to format date


function addQuizStyles() {
    if (document.getElementById('quiz-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'quiz-styles';
    styleElement.textContent = `
       
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
}

.modal {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 800px;
    margin: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    position: relative;
}

.modal-header {
    padding: 24px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    color: #FF7043;
    font-size: 24px;
    font-weight: 600;
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #666;
    cursor: pointer;
    padding: 4px;
}

.modal-body {
    padding: 24px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
}

.form-group {
    margin-bottom: 24px;
}

.modal-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            position: sticky;
            bottom: 0;
            background: white;
            border-radius: 0 0 12px 12px;
        }

        .modal-footer .btn {
            padding: 10px 24px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .question-item {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #eee;
        }

        .question-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }

        /* Fix Multiple Choice dropdown */
        .question-type {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            width: 150px;
        }

        /* Option styling */
        .option-item {
            background: white;
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
        }

        .option-item input[type="text"] {
            flex: 1;
            border: 1px solid #ddd;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
        }

        .btn-secondary {
            background: #f1f3f4;
            color: #444;
        }

        .btn-primary {
            background: #FF7043;
            color: white;
        }

        .btn-secondary:hover {
            background: #e4e6e7;
        }

        .btn-primary:hover {
            background: #f4511e;
        }

.form-group label {
    display: block;
    font-weight: 500;
    margin-bottom: 8px;
    color: #444;
}

.form-control {
    width: 100%;
    padding: 12px;
    border: 2px solid #eee;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.2s;
}

.form-control:focus {
    border-color: #FF7043;
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 112, 67, 0.1);
}

.question-item {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #eee;
}

.question-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
}

.question-number {
    background: #FF7043;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;
}

.option-item {
    background: white;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.option-item input[type="radio"] {
    width: 20px;
    height: 20px;
}

.option-item input[type="text"] {
    flex: 1;
    border: none;
    padding: 8px;
    font-size: 15px;
}

.btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: #FF7043;
    color: white;
    border: none;
}

.btn-primary:hover {
    background: #f4511e;
}

.btn-secondary {
    background: #f1f3f4;
    color: #444;
    border: none;
}

.btn-secondary:hover {
    background: #e4e6e7;
}

.modal-footer {
    padding: 24px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* Quiz specific styles */
.quiz-options {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
}

.quiz-options > div {
    flex: 1;
}

.points-row {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.points-row input {
    width: 80px;
    text-align: center;
}
    `;
    document.head.appendChild(styleElement);
}



function addAnnouncementStyles() {
    if (document.getElementById('announcement-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'announcement-styles';
    styleElement.textContent = `
        .announcement-item {
    background-color: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
    width: 980px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border-left: 4px solid #FF7043;
    transition: transform 0.2s ease;
}

.announcement-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.announcement-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
}

.announcement-title {
    font-size: 18px;
    font-weight: 500;
    color: #333;
    margin: 0;
}

.announcement-meta {
    font-size: 14px;
    color: #666;
}

.announcement-content {
    color: #444;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
}

.announcement-pinned {
    background-color: #fff8f6;
    border-left-color: #4285f4;
}

.announcement-pinned-badge {
    background-color: #e8f0fe;
    color: #174ea6;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

@media (max-width: 1024px) {
    .announcement-item {
        width: 100%;
        margin: 10px auto;
    }
}
    `;
    document.head.appendChild(styleElement);
}



// Global variable to store current course ID
let currentCourseId = null;

// Show Add Lesson Modal
function showAddLessonModal() {
  document.getElementById('addLessonModalBackdrop').style.display = 'flex';
}



// Add this code to also handle sidebar navigation
document.addEventListener('DOMContentLoaded', function() {
    // Find the Lessons link in the sidebar
    const sidebarLinks = document.querySelectorAll('a, div, span');
    let lessonsLink = null;
    
    // Find the link that contains "Lessons" text
    for (let link of sidebarLinks) {
        if (link.textContent.trim() === 'Lessons') {
            lessonsLink = link;
            break;
        }
    }
    
    if (lessonsLink) {
        lessonsLink.addEventListener('click', function() {
            console.log("Sidebar Lessons link clicked");
            // Get the courseId
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('courseId') || urlParams.get('id');
            
            // Allow time for any navigation/tab switching to complete
            setTimeout(() => {
                if (typeof fetchLessons === 'function') {
                    fetchLessons(courseId);
                } else if (typeof window.fetchLessons === 'function') {
                    window.fetchLessons(courseId);
                }
            }, 200);
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    // Get the courseId from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId') || urlParams.get('id');
    
    // Check if we're on the lessons page by looking for the lessonsTab element
    const lessonsTab = document.getElementById('lessonsTab');
    if (lessonsTab) {
        // Load lessons with the courseId
        window.loadLessons(courseId);
        
        // Also handle tab switching to ensure lessons load when switching to the lessons tab
        const lessonTabLink = document.querySelector('a[href="#lessonsTab"]');
        if (lessonTabLink) {
            lessonTabLink.addEventListener('click', function() {
                window.loadLessons(courseId);
            });
        }
    }
});

// Complete loadLessons function with loading indicator
window.loadLessons = async function(courseId) {
    if (!courseId) return;
    
    try {
        const lessonsContainer = document.getElementById('lessonsTab');
        // Preserve the header
        const header = lessonsContainer.querySelector('h2');
        lessonsContainer.innerHTML = '';
        if (header) {
            lessonsContainer.appendChild(header);
        }
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading lessons...</p>
        `;
        lessonsContainer.appendChild(loadingIndicator);
        
        const courseSnap = await getDoc(doc(db, "courses", courseId));
        
        if (!courseSnap.exists()) {
            console.error("Course not found");
            lessonsContainer.innerHTML += '<p class="error-message">Course not found</p>';
            return;
        }
        
        const courseData = courseSnap.data();
        const lessons = courseData.lessons || [];
        
        // Remove loading indicator before proceeding
        loadingIndicator.remove();
        
        if (lessons.length === 0) {
            lessonsContainer.innerHTML += '<p>No lessons available for this course yet.</p>';
            return;
        }
        
        // Create lessons list
        const lessonsList = document.createElement('div');
        lessonsList.className = 'lessons-list';
        
        lessons.forEach((lesson, index) => {
            const lessonCard = document.createElement('div');
            lessonCard.className = 'lesson-card';
            lessonCard.innerHTML = `
                <h3>${lesson.title || 'Untitled Lesson'}</h3>
                <p>${lesson.description || 'No description available'}</p>
                <div class="lesson-meta">
                    <span>Lesson ${index + 1}</span>
                    <span>${lesson.duration || '-- min'}</span>
                </div>
                <button class="view-lesson-btn" data-lesson-id="${lesson.id || index}">View Lesson</button>
            `;
            lessonsList.appendChild(lessonCard);
            
            // Add event listener to the view lesson button
            const viewBtn = lessonCard.querySelector('.view-lesson-btn');
            viewBtn.addEventListener('click', function() {
                const lessonId = this.getAttribute('data-lesson-id');
                window.location.href = `lesson.html?courseId=${courseId}&lessonId=${lessonId}`;
            });
        });
        
        lessonsContainer.appendChild(lessonsList);
        
    } catch (error) {
        console.error("Error loading lessons:", error);
        const lessonsContainer = document.getElementById('lessonsTab');
        const loadingIndicator = lessonsContainer.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        lessonsContainer.innerHTML += `<p class="error-message">Error loading lessons: ${error.message}</p>`;
    }
};

// Add this CSS for the loading spinner
document.head.insertAdjacentHTML('beforeend', `
<style>
.loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
}

.loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #ff6347;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
`);


// Close Add Lesson Modal
function closeAddLessonModal() {
    // Hide the modal backdrop
    const modalBackdrop = document.getElementById('addLessonModalBackdrop');
    if (modalBackdrop) {
      modalBackdrop.style.display = 'none';
    }
  
    // Reset form fields only if they exist
    const titleInput = document.getElementById('lessonTitle');
    if (titleInput) titleInput.value = '';
  
    const descriptionInput = document.getElementById('lessonDescription');
    if (descriptionInput) descriptionInput.value = '';
  
    const contentInput = document.getElementById('lessonContent');
    if (contentInput) contentInput.value = '';
  
    const orderInput = document.getElementById('lessonOrder');
    if (orderInput) orderInput.value = '1';  // default value
  
    const fileInput = document.getElementById('lessonFile');
    if (fileInput) fileInput.value = '';
  
    const selectedFileName = document.getElementById('selectedFileName');
    if (selectedFileName) selectedFileName.textContent = '';
  }
  

// File upload handling
const lessonDropZone = document.getElementById('lessonDropZone');
const lessonFileInput = document.getElementById('lessonFile');
const lessonFileList = document.getElementById('lessonFileList');

lessonDropZone.addEventListener('click', () => {
  lessonFileInput.click();
});

lessonDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  lessonDropZone.style.borderColor = '#000';
});

lessonDropZone.addEventListener('dragleave', () => {
  lessonDropZone.style.borderColor = '#ccc';
});

lessonDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  lessonDropZone.style.borderColor = '#ccc';
  lessonFileInput.files = e.dataTransfer.files;
  updateFileList();
});

lessonFileInput.addEventListener('change', updateFileList);

function updateFileList() {
  lessonFileList.innerHTML = '';
  const files = lessonFileInput.files;
  for (let file of files) {
    lessonFileList.innerHTML += `<div>${file.name}</div>`;
  }
}

// Save Lesson to Firebase with file upload
async function saveLesson(event) {
    event?.preventDefault();
    const saveButton = document.querySelector('.save-lesson-btn'); // Updated selector
    
    try {
        if (!saveButton) {
            console.warn('Save lesson button not found');
            return;
        }

        setButtonLoading(saveButton, true, 'Saving');
        console.log("saveLesson triggered");

        const title = document.getElementById('lessonTitle').value.trim();
        const content = document.getElementById('lessonContent').value.trim();
        const file = document.getElementById('lessonFile').files[0];

        if (!title) {
            alert('Please enter a lesson title');
            setButtonLoading(saveButton, false, 'Save Lesson');
            return;
        }

        if (!selectedCourseId) {
            alert('No course selected');
            setButtonLoading(saveButton, false, 'Save Lesson');
            return;
        }

        let fileUrl = null;
        let fileName = null;
        let fileType = null;

        try {
            // Handle file upload if present
            if (file) {
                console.log("Uploading file with progress...");
                const storageRef = ref(storage, `lessons/${Date.now()}_${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log(`Upload is ${progress.toFixed(2)}% done`);
                            
                            // Update progress bar if it exists
                            const progressBar = document.getElementById('lessonUploadProgress');
                            if (progressBar) {
                                progressBar.value = progress;
                            }
                        },
                        (error) => {
                            console.error("Upload error:", error);
                            reject(error);
                        },
                        async () => {
                            fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            fileName = file.name;
                            fileType = file.type;
                            console.log("File uploaded! URL:", fileUrl);
                            resolve();
                        }
                    );
                });
            }

            // Save lesson data
            const lessonData = {
                title,
                content,
                fileUrl,
                fileName,
                fileType,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const lessonRef = collection(db, 'courses', selectedCourseId, 'lessons');
            const newLessonDoc = await addDoc(lessonRef, lessonData);

            // Create notification for the new lesson
            const notificationData = {
                type: 'lesson',
                title: 'New Lesson Added',
                message: `A new lesson "${title}" has been added to your course.`,
                createdAt: serverTimestamp(),
                courseId: selectedCourseId,
                from: auth.currentUser.uid,
                fromName: auth.currentUser.displayName || auth.currentUser.email,
                lessonId: newLessonDoc.id,
                read: false
            };

            // Save notification
            const notificationsRef = collection(db, 'courses', selectedCourseId, 'notifications');
            await addDoc(notificationsRef, notificationData);

            console.log("Lesson and notification added successfully!");
            alert('Lesson saved successfully!');
            closeAddLessonModal();
            await fetchLessons(selectedCourseId);

        } catch (error) {
            console.error("Error saving lesson:", error);
            alert("Error saving lesson: " + error.message);
        }
    } catch (error) {
        console.error('Error saving lesson:', error);
        alert("Error: " + error.message);
    } finally {
        if (saveButton) {
            setButtonLoading(saveButton, false, 'Save Lesson');
        }
    }
}




// Fetch lessons for a course
async function fetchLessons(courseId) {
    if (!courseId) {
        console.error("No courseId provided to fetchLessons");
        return;
    }
    
    const lessonsContainer = document.getElementById('lessonsTab');
    if (!lessonsContainer) return;
    
    try {
        // Show loading state
        lessonsContainer.innerHTML = '<p class="loading">Loading lessons...</p>';
        
        // Get lessons from Firestore, ordered by createdAt timestamp in descending order
        const lessonsRef = collection(db, 'courses', courseId, 'lessons');
        const q = query(lessonsRef, orderBy('createdAt', 'desc'));
        const lessonsSnapshot = await getDocs(q);
        
        // Clear loading state
        lessonsContainer.innerHTML = '<h2>Lessons</h2>';
        
        if (lessonsSnapshot.empty) {
            lessonsContainer.innerHTML += '<p class="no-content-message">No lessons have been added yet.</p>';
            return;
        }

        const lessonsList = document.createElement('div');
        lessonsList.className = 'lessons-list';
        
        lessonsSnapshot.forEach(doc => {
            const lesson = doc.data();
            const lessonCard = document.createElement('div');
            lessonCard.className = 'lesson-card';
            
            lessonCard.innerHTML = `
                <div class="lesson-header">
                    <h3>${lesson.title}</h3>
                    <div class="lesson-actions">
                        <button onclick="deleteLesson('${doc.id}')" class="btn-delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="lesson-content">${lesson.content || 'No content provided'}</p>
                ${lesson.fileUrl ? `
                    <div class="lesson-file">
                        <a href="${lesson.fileUrl}" target="_blank" class="file-link">
                            <i class="fas ${getFileIcon(lesson.fileType)}"></i>
                            ${lesson.fileName}
                        </a>
                    </div>
                ` : ''}
                <div class="lesson-meta">
                    <span>Added ${formatTimestamp(lesson.createdAt)}</span>
                </div>
            `;
            
            lessonsList.appendChild(lessonCard);
        });
        
        lessonsContainer.appendChild(lessonsList);
        
    } catch (error) {
        console.error("Error fetching lessons:", error);
        lessonsContainer.innerHTML = '<p class="error-message">Failed to load lessons. Please try again.</p>';
    }
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Helper function to get file icon based on file type
function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('word')) return 'fa-file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fa-file-excel';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fa-file-powerpoint';
    if (fileType.includes('image')) return 'fa-file-image';
    if (fileType.includes('video')) return 'fa-file-video';
    if (fileType.includes('audio')) return 'fa-file-audio';
    return 'fa-file';
}

// Edit Lesson
function editLesson(lessonId) {
  // Implementation for editing a lesson
  // This would fetch the lesson data and populate the modal
  alert("Edit lesson functionality to be implemented");
}

// Delete Lesson

async function deleteLesson(lessonId) {
    if (!selectedCourseId) {
        showNotification('No course selected', 'error');
        return;
    }

    if (!confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
        return;
    }

    try {
        // Reference to the lesson document
        const lessonRef = doc(db, 'courses', selectedCourseId, 'lessons', lessonId);
        const lessonSnap = await getDoc(lessonRef);

        if (!lessonSnap.exists()) {
            throw new Error("Lesson not found");
        }

        const lessonData = lessonSnap.data();

        // If there's a file, delete it from storage first
        if (lessonData.fileURL) {
            try {
                const fileRef = ref(storage, lessonData.fileURL);
                await deleteObject(fileRef);
            } catch (fileError) {
                console.warn("Error deleting file:", fileError);
                // Continue with lesson deletion even if file deletion fails
            }
        }

        // Delete the lesson document
        await deleteDoc(lessonRef);

        // Show success message
        showNotification('Lesson deleted successfully!', 'success');

        // Refresh the lessons list
        await fetchLessons(selectedCourseId);

    } catch (error) {
        console.error("Error deleting lesson:", error);
        showNotification('Failed to delete lesson: ' + error.message, 'error');
    }
}

// Notification helper function
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

// Update the existing updateMainActionButton function to include the new add lesson action


// Make sure to set currentCourseId when a course is selected
function displayCourseDetails(courseId, courseData) {
  // Set the current course ID
  currentCourseId = courseId;
  
  // Display the course details page
  document.getElementById('coursesList').style.display = 'none';
  document.getElementById('courseDetails').style.display = 'block';
  
  // Show initial tab (you may want to modify this based on your preference)
  showCourseTab('announcementsTab');
  
  // Fetch course-specific data
  fetchLessons(courseId);
  // Add other fetch functions for announcements, assignments, etc.
}

function showAssignmentModal() {
    document.getElementById('assignmentModal').style.display = 'block';
    
    // Set up event listeners if not already set
    setupAssignmentModalEventListeners();
  }
  
  // Set up event listeners for the modal
  function setupAssignmentModalEventListeners() {
    const modal = document.getElementById('assignmentModal');
    const closeBtn = modal.querySelector('.assignment-close');
    const cancelBtn = document.getElementById('cancelAssignment');
    const form = document.getElementById('assignmentForm');
    
    // Close button
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
    
    // Cancel button
    cancelBtn.onclick = () => {
      modal.style.display = 'none';
      form.reset();
    };
    
    // Add this line here - Form submission event listener
    document.getElementById('assignmentForm').addEventListener('submit', saveAssignment);
    
    // Close modal when clicking outside
    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };
}
  
async function saveAssignment(event) {
    event?.preventDefault();

    const saveButton = document.querySelector('.save-btn'); // Update selector to match HTML
    if (!saveButton) return;

    try {
        setButtonLoading(saveButton, true, 'Saving Assignment');

        // Get form data
        const title = document.getElementById('assignmentTitle').value.trim();
        const description = document.getElementById('assignmentDescription').value.trim();
        const dueDate = document.getElementById('assignmentDueDate').value;
        const points = parseInt(document.getElementById('assignmentPoints').value) || 0;
        const submissionType = document.querySelector('input[name="submissionType"]:checked')?.value;

        // Validation
        if (!title || !dueDate || !submissionType) {
            throw new Error("Please fill in all required fields");
        }

        // Create assignment data
        const assignmentData = {
            title,
            description,
            dueDate: new Date(dueDate).toISOString(),
            points,
            submissionType,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser.uid,
            courseId: selectedCourseId
        };

        // Save to Firestore
        const assignmentRef = await addDoc(
            collection(db, 'courses', selectedCourseId, 'assignments'),
            assignmentData
        );

        // Show success message and close modal
        showNotification('Assignment created successfully!', 'success');
        closeAssignmentModal();
        
        // Refresh assignments list
        await loadAssignments(selectedCourseId);

    } catch (error) {
        console.error('Error saving assignment:', error);
        showNotification(error.message, 'error');
    } finally {
        setButtonLoading(saveButton, false, 'Save Assignment');
    }
}

const loadingStyles = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .fa-spinner {
        animation: spin 1s linear infinite;
        margin-right: 8px;
    }

    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        background: #ccc !important;
    }

    /* Modal button states */
    .save,
    .send-invitation,
    .save-quiz,
    .post-announcement,
    .save-lesson {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 16px;
        background: #FF7043;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
`;

// Add styles to document
if (!document.getElementById('loading-button-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'loading-button-styles';
    styleSheet.textContent = loadingStyles;
    document.head.appendChild(styleSheet);
}

// Add CSS for button states
const buttonStyles = `
    .save-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 16px;
        background: #FF7043;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .save-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        background: #ccc;
    }

    .fa-spinner {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

// Add styles to document
if (!document.getElementById('assignment-button-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'assignment-button-styles';
    styleSheet.textContent = buttonStyles;
    document.head.appendChild(styleSheet);
}

// Add loading state helper
function showLoadingState(show) {
    const saveBtn = document.getElementById('saveAssignmentBtn');
    if (saveBtn) {
        saveBtn.disabled = show;
        saveBtn.innerHTML = show ? '<i class="fas fa-spinner fa-spin"></i> Saving...' : 'Save Assignment';
    }
}

// Add close modal helper
function closeAssignmentModal() {
    const modal = document.getElementById('assignmentModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Reset form
    document.getElementById('assignmentForm').reset();
    document.getElementById('fileList').innerHTML = '';
}
  
  // Function to load and display assignments
  async function loadAssignments(courseId) {
    try {
        const assignmentsContainer = document.getElementById('assignmentsTab');
        if (!assignmentsContainer) return;

        // Fetch assignments
        const assignmentsRef = collection(db, "courses", courseId, "assignments");
        const assignmentsSnap = await getDocs(query(assignmentsRef, orderBy('createdAt', 'desc')));

        let html = `
            <h2>Assignments</h2>
            <div class="assignments-list">
        `;

        if (assignmentsSnap.empty) {
            html += `<p class="no-content">No assignments available yet.</p>`;
        } else {
            assignmentsSnap.forEach((doc) => {
                const assignment = doc.data();
                const dueDate = assignment.dueDate ? 
                    new Date(assignment.dueDate).toLocaleDateString() : "No due date";

                html += `
                    <div class="assignment-card">
                        <div class="assignment-header">
                            <h3>${assignment.title}</h3>
                            <span class="assignment-points">${assignment.points} Points</span>
                        </div>
                        <div class="assignment-content">
                            ${assignment.description || 'No description provided.'}
                        </div>
                        <div class="assignment-meta">
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>Due: ${dueDate}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-file-upload"></i>
                                <span>Type: ${assignment.submissionType}</span>
                            </div>
                        </div>
                        ${assignment.attachments && assignment.attachments.length > 0 ? `
                            <div class="assignment-attachments">
                                <h4>Attachments:</h4>
                                <div class="attachments-list">
                                    ${assignment.attachments.map(file => `
                                        <a href="${file.url}" target="_blank" class="attachment-link">
                                            <i class="fas fa-paperclip"></i>
                                            ${file.name}
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        <div class="assignment-actions">
                            <button class="view-btn" onclick="viewAssignment('${courseId}', '${doc.id}')">
                                View Details
                            </button>
                            <button class="edit-btn" onclick="editAssignment('${courseId}', '${doc.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" onclick="deleteAssignment('${courseId}', '${doc.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        assignmentsContainer.innerHTML = html;

    } catch (error) {
        console.error("Error loading assignments:", error);
        showNotification('Error loading assignments: ' + error.message, 'error');
    }
}
  
  
  // Get the current course ID
  function getCurrentCourseId() {
    // First try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const courseIdFromUrl = urlParams.get('courseId');
    
    // If found in URL, use that
    if (courseIdFromUrl) {
      return courseIdFromUrl;
    }
    
    // Otherwise try to get from active course element
    const activeCourse = document.querySelector('.course-item.active');
    if (activeCourse && activeCourse.dataset.courseId) {
      return activeCourse.dataset.courseId;
    }
    
    // If there's a stored current course ID in session or local storage
    const storedCourseId = sessionStorage.getItem('currentCourseId') || 
                           localStorage.getItem('currentCourseId');
    if (storedCourseId) {
      return storedCourseId;
    }
    
    // No course ID found
    return null;
  }
  
  // View assignment details
  async function viewAssignment(courseId, assignmentId) {
    try {
        const assignmentRef = doc(db, "courses", courseId, "assignments", assignmentId);
        const assignmentSnap = await getDoc(assignmentRef);

        if (!assignmentSnap.exists()) {
            throw new Error("Assignment not found");
        }

        const assignment = assignmentSnap.data();
        const submissionsRef = collection(db, "courses", courseId, "assignments", assignmentId, "submissions");
        const submissionsSnap = await getDocs(submissionsRef);

        const modalHTML = `
            <div id="viewAssignmentModal" class="submission-modal-backdrop">
                <div class="submission-modal">
                    <div class="submission-modal-header">
                        <h3>${assignment.title} - Submissions</h3>
                        <span class="submission-modal-close" onclick="closeViewAssignmentModal()">&times;</span>
                    </div>
                    <div class="submission-modal-body">
                        <div class="student-submissions-list">
                            ${submissionsSnap.empty ? 
                                '<p class="no-student-submissions">No submissions yet</p>' :
                                submissionsSnap.docs.map(doc => {
                                    const submission = doc.data();
                                    return `
                                        <div class="student-submission-card">
                                            <div class="student-submission-header">
                                                <h4>${submission.studentName || 'Unknown Student'}</h4>

                                                <span>Submitted: ${submission.submittedAt?.toDate().toLocaleString()}</span>
                                            </div>
                                            ${submission.textContent ? `
                                                <div class="student-submission-text">
                                                    <p>${submission.textContent}</p>
                                                </div>
                                            ` : ''}
                                            ${submission.files?.length ? `
                                                <div class="student-submission-files">
                                                    ${submission.files.map(file => `
                                                        <a href="${file.url}" target="_blank" class="student-file-link">
                                                            <i class="fas ${getFileIcon(file.type)}"></i>
                                                            ${file.name}
                                                        </a>
                                                    `).join('')}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        // Update the styles section in viewAssignment function
const styles = `
<style>
    .submission-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1050;
    }

    .submission-modal {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .submission-modal-header {
        padding: 16px 20px;
        background: white;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .submission-modal-header h3 {
        margin: 0;
        font-size: 18px;
        color: #333;
        font-weight: 500;
    }

    .submission-modal-close {
        color: #666;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        background: none;
        border: none;
    }

    .submission-modal-body {
        padding: 20px;
    }

    .student-submissions-list {
        width: 100%;
        border-collapse: collapse;
    }

    .student-submission-card {
        padding: 16px;
        border-bottom: 1px solid #eee;
    }

    .student-submission-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .student-submission-header h4 {
        margin: 0;
        font-size: 14px;
        color: #333;
    }

    .student-submission-header span {
        font-size: 13px;
        color: #666;
    }

    .student-submission-text {
        font-size: 14px;
        color: #444;
        margin-bottom: 12px;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
    }

    .student-submission-files {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .student-file-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: #f1f3f4;
        border-radius: 4px;
        font-size: 13px;
        color: #333;
        text-decoration: none;
        transition: all 0.2s;
    }

    .student-file-link:hover {
        background: #e4e6e7;
    }

    .no-student-submissions {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        font-size: 14px;
    }

    .modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
    }

    .btn-close {
        padding: 8px 16px;
        background: #f1f3f4;
        border: none;
        border-radius: 4px;
        color: #333;
        font-size: 14px;
        cursor: pointer;
    }

    .btn-close:hover {
        background: #e4e6e7;
    }
</style>
`;

        // Add modal and styles to document
        document.body.insertAdjacentHTML('beforeend', modalHTML + styles);
        
        // Show modal
        document.getElementById('viewAssignmentModal').style.display = 'flex';

    } catch (error) {
        console.error("Error viewing assignment:", error);
        showNotification('Error viewing assignment details: ' + error.message, 'error');
    }
}
  
  // Close the view assignment modal
  function closeViewAssignmentModal() {
    const modal = document.getElementById('viewAssignmentModal');
    if (modal) {
      modal.style.display = 'none';
      // Remove the modal from the DOM
      modal.remove();
    }
  }
  
  // Get assignment from course
  async function getCourseAssignment(courseId, index) {
    try {
      const courseRef = doc(db, "courses", courseId);
      const courseDoc = await getDoc(courseRef);
      
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        const assignments = courseData.assignments || [];
        
        if (index >= 0 && index < assignments.length) {
          return assignments[index];
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting assignment: ", error);
      return null;
    }
  }
  
  // Edit assignment
  async function editAssignment(courseId, index) {
    try {
      const assignment = await getCourseAssignment(courseId, index);
      
      if (assignment) {
        // Populate the form with assignment data
        document.getElementById('assignmentTitle').value = assignment.title;
        document.getElementById('assignmentDescription').value = assignment.description || '';
        
        // Format the date-time for the input field (YYYY-MM-DDThh:mm)
        const dueDate = new Date(assignment.dueDate);
        const formattedDate = dueDate.toISOString().slice(0, 16);
        document.getElementById('assignmentDueDate').value = formattedDate;
        
        document.getElementById('assignmentPoints').value = assignment.points;
        
        // Show the modal
        document.getElementById('assignmentModal').style.display = 'block';
        
        // Modify the form submission handler to update instead of create
        const form = document.getElementById('assignmentForm');
        
        // Store the original event handler
        const originalSubmitHandler = form.onsubmit;
        
        // Override the submit handler
        form.onsubmit = async (e) => {
          e.preventDefault();
          
          try {
            // Get updated values
            const updatedAssignment = {
              ...assignment,
              title: document.getElementById('assignmentTitle').value,
              description: document.getElementById('assignmentDescription').value,
              dueDate: document.getElementById('assignmentDueDate').value,
              points: parseInt(document.getElementById('assignmentPoints').value) || 0
            };
            
            // Reference to the course document
            const courseRef = doc(db, "courses", courseId);
            
            // Remove the old assignment and add the updated one
            await updateDoc(courseRef, {
              assignments: arrayRemove(assignment)
            });
            
            await updateDoc(courseRef, {
              assignments: arrayUnion(updatedAssignment)
            });
            
            // Close modal and refresh
            document.getElementById('assignmentModal').style.display = 'none';
            document.getElementById('assignmentForm').reset();
            
            // Restore the original submit handler
            form.onsubmit = originalSubmitHandler;
            
            // Refresh the assignments display
            loadAssignments(courseId);
            
            alert('Assignment updated successfully!');
          } catch (error) {
            console.error("Error updating assignment: ", error);
            alert('Error updating assignment: ' + error.message);
          }
        };
      }
    } catch (error) {
      console.error("Error editing assignment: ", error);
      alert('Error editing assignment: ' + error.message);
    }
  }
  
  // Delete assignment
  async function deleteAssignment(courseId, assignmentId) {
    if (!confirm('Are you sure you want to delete this assignment?')) {
        return;
    }

    try {
        // Reference to the specific assignment document
        const assignmentRef = doc(db, "courses", courseId, "assignments", assignmentId);
        
        // Delete the assignment document
        await deleteDoc(assignmentRef);
        
        // Show success notification
        showNotification('Assignment deleted successfully!', 'success');
        
        // Refresh the assignments list
        await loadAssignments(courseId);
        
    } catch (error) {
        console.error("Error deleting assignment:", error);
        showNotification('Error deleting assignment: ' + error.message, 'error');
    }
}

// Add to teachercourses.js
function setupFileUpload() {
    const dropZone = document.querySelector('.file-upload-area');
    const fileInput = document.getElementById('assignmentFiles');
    const fileList = document.querySelector('.file-list');

    if (!dropZone || !fileInput || !fileList) return;

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.background = '#fff1ec';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.background = '#fff8f6';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.background = '#fff8f6';
        handleFiles(e.dataTransfer.files);
    });

    // Handle click upload
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            // Check file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png'
            ];
            
            if (!allowedTypes.includes(file.type)) {
                showNotification('Invalid file type. Please upload PDF, DOC, DOCX, or images.', 'error');
                return;
            }

            const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
            if (fileSize > 10) { // 10MB limit
                showNotification('File size should not exceed 10MB', 'error');
                return;
            }

            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas ${getFileIcon(file.type)} file-icon"></i>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${fileSize} MB</div>
                    </div>
                </div>
                <button type="button" class="remove-file">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);

            // Add remove functionality
            fileItem.querySelector('.remove-file').addEventListener('click', () => {
                fileItem.remove();
            });
        });
    }

    function getFileIcon(fileType) {
        if (fileType.includes('pdf')) return 'fa-file-pdf';
        if (fileType.includes('word')) return 'fa-file-word';
        if (fileType.includes('image')) return 'fa-file-image';
        return 'fa-file';
    }
}

// Call this when opening the assignment modal
document.addEventListener('DOMContentLoaded', setupFileUpload);

const assignmentCardStyles = `
/* Assignment Card Styles */
.assignments-list {
    display: flex;
    flex-direction: column;
    
    max-width: 1400px;
    margin: 0 auto;
}

.assignment-card {
    width: 980px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-left: 4px solid #FF7043;
}

.assignment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.assignment-header h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
}

.assignment-points {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    background: #e8f5e9;
    color: #2e7d32;
}

.assignment-content {
    color: #666;
    margin-bottom: 15px;
    font-size: 14px;
}

.assignment-meta {
    display: flex;
    gap: 20px;
    color: #666;
    font-size: 14px;
    margin-bottom: 15px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.meta-item i {
    color: #FF7043;
}

.assignment-actions {
    display: flex;
    gap: 10px;
}

.view-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
}

.edit-btn, .delete-btn {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.edit-btn {
    background: #2196F3;
    color: white;

.delete-btn {
    background: #f44336;
    color: white;
}

/* Search Bar Styles */
.search-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;
}

.search-input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 300px;
}

.no-content {
    text-align: center;
    color: #666;
    padding: 40px;
}



/* Responsive Design */
@media (max-width: 900px) {
    .assignment-meta {
        flex-direction: column;
        gap: 10px;
    }

    .assignment-actions {
        flex-wrap: wrap;
        gap: 8px;
    }
}
`;

document.addEventListener('DOMContentLoaded', () => {
const styleEl = document.createElement('style');
styleEl.textContent = assignmentCardStyles;
document.head.appendChild(styleEl);
});

  

  



document.addEventListener("DOMContentLoaded", function() {

    addAnnouncementStyles();
});

document.getElementById("closeModal")?.addEventListener("click", closeAddCourseModal);
document.addEventListener("DOMContentLoaded", () => showTab("courses"));


window.saveCourse = saveCourse;
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.openAddCourseModal = openAddCourseModal;
window.closeAddCourseModal = closeAddCourseModal;
window.showTab = showTab;
window.goBackToCourses = goBackToCourses;
window.showCourseTab = showCourseTab;
window.showInviteStudentModal = showInviteStudentModal;
window.closeInviteStudentModal = closeInviteStudentModal;
window.sendInvitation = sendInvitation;
window.removeStudentFromCourse = removeStudentFromCourse;
window.loadStudentsForCourse = loadStudentsForCourse;
window.loadAnnouncements = loadAnnouncements;
window.showAnnouncementModal = showAnnouncementModal;
window.closeAnnouncementModal = closeAnnouncementModal;
window.postAnnouncement = postAnnouncement;
window.updateAnnouncement = updateAnnouncement;
window.deleteAnnouncement = deleteAnnouncement;
window.createQuizModal = createQuizModal;
window.showQuizModal = showQuizModal;
window.closeQuizModal = closeQuizModal;
window.addQuestion = addQuestion;
window.updateQuestionType = updateQuestionType;
window.addOption = addOption;
window.removeQuestion = removeQuestion;
window.saveQuiz = saveQuiz;
window.loadQuizzes = loadQuizzes;
window.editQuiz = editQuiz;
window.deleteQuiz = deleteQuiz;
window.viewQuizResults = viewQuizResults;
window.showAddLessonModal = showAddLessonModal;
window.closeAddLessonModal = closeAddLessonModal;
window.saveLesson = saveLesson;

window.editLesson = editLesson;
window.deleteLesson = deleteLesson;

// Assignment functions
window.showAssignmentModal = showAssignmentModal;
window.saveAssignment = saveAssignment;
window.loadAssignments = loadAssignments;
window.viewAssignment = viewAssignment;
window.closeViewAssignmentModal = closeViewAssignmentModal;
window.editAssignment = editAssignment;
window.deleteAssignment = deleteAssignment;
window.setupAssignmentModalEventListeners = setupAssignmentModalEventListeners;
window.quizzes = quizzes;
window.quizzesArray = quizzesArray;

// Helper function for button loading states
function setButtonLoading(button, isLoading, originalText) {
    if (!button) {
        console.warn('Button not found for loading state');
        return;
    }

    try {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${originalText}...`;
        } else {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    } catch (error) {
        console.warn('Error setting button state:', error);
    }
}
