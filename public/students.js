import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 🔥 Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDMs8HtwRyimV3UFJAg633dBmOy6KrxT90",
    authDomain: "educonnect-f70d6.firebaseapp.com",
    projectId: "educonnect-f70d6",
    storageBucket: "educonnect-f70d6.appspot.com",
    messagingSenderId: "211587031768",
    appId: "1:211587031768:web:5b406b1647d4a9a9212dad"
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    if (menuToggle && sidebar && sidebarOverlay) {
        // Menu toggle click handler
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        // Overlay click handler
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    } else {
        console.warn('Some menu elements are missing:', {
            menuToggle: !!menuToggle,
            sidebar: !!sidebar,
            overlay: !!sidebarOverlay
        });
    }
});


function formatDateLabel(date, isToday = false, isTomorrow = false) {
  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric' 
  });
}

// Update the schedule display with assignments
function updateSchedule(tasks = []) {
    const scheduleContainer = document.getElementById('scheduleContainer');
    const currentDateEl = document.getElementById('currentDate');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    currentDateEl.textContent = today.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
    });

    // Create array for next 3 days
    const nextThreeDays = [
        { date: today, label: 'Today' },
        { date: new Date(today.getTime() + 86400000), label: 'Tomorrow' },
        { date: new Date(today.getTime() + 2 * 86400000), label: null }
    ];

    const scheduleHTML = nextThreeDays.map(({ date, label }) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayTasks = tasks.filter(task => task.date === dateStr);

        const dateLabel = label || date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="schedule-section">
                <h3 class="schedule-date">${dateLabel}</h3>
                ${dayTasks.length ? `
                    <div class="task-list">
                        ${dayTasks.map(task => `
                            <div class="task-item ${task.type || 'other'}">
                                <div class="task-icon">${getTaskIcon(task.type)}</div>
                                <div class="task-details">
                                    <div class="task-title">${task.name}</div>
                                    <div class="task-info">
                                        <span class="course-code">${task.course}</span>
                                        <span class="due-time">Due: ${task.time || '11:59 PM'}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-day">Nothing planned for ${label ? label.toLowerCase() : 'this day'}</div>
                `}
            </div>
        `;
    }).join('');

    scheduleContainer.innerHTML = scheduleHTML;
}

// Helper function to get task icons
function getTaskIcon(type) {
  const icons = {
    'assignment': '📘',
    'quiz': '📝',
    'exam': '📚',
    'meeting': '📅',
    'project': '💡',
    'event': '🎉',
    'other': '❓'
  };
  return icons[type] || icons.other;
}

// Fetch assignments for the user
async function fetchAssignments(userEmail) {
  try {
      console.log(`🔍 Fetching calendar tasks for user`);
      const tasks = [];
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
          console.warn("⚠️ No authenticated user found");
          return tasks;
      }
      
      // Get calendar tasks from calendarTasks collection
      const calendarTasksRef = collection(db, "calendarTasks");
      
      // Query tasks for current user only
      const tasksQuery = query(calendarTasksRef, 
          where("userId", "==", currentUser.uid)
      );
      
      const taskSnapshot = await getDocs(tasksQuery);
      console.log(`Found ${taskSnapshot.size} tasks for user ${currentUser.uid}`);
      
      // Get current date for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      taskSnapshot.forEach(doc => {
          const taskData = doc.data();
          // Only add tasks that belong to current user
          if (taskData.userId === currentUser.uid) {
              tasks.push({
                  id: doc.id,
                  name: taskData.name || 'Untitled Task',
                  course: taskData.course || 'General',
                  date: taskData.date || new Date().toISOString().split('T')[0],
                  time: taskData.time || '11:59 PM',
                  type: taskData.type || 'other',
                  description: taskData.description || '',
                  points: taskData.points,
                  createdAt: taskData.createdAt?.toDate ? taskData.createdAt.toDate() : new Date(),
                  userId: taskData.userId
              });
          }
      });

      console.log(`Filtered ${tasks.length} tasks for current user`);

      // Sort tasks by date and time
      tasks.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA - dateB === 0) {
              return (a.time || '').localeCompare(b.time || '');
          }
          return dateA - dateB;
      });

      return tasks;

  } catch (error) {
      console.error("❌ Error fetching calendar tasks:", error);
      throw error;
  }
}

// Load schedule for authenticated user
async function loadSchedule(userEmail) {
  try {
      const scheduleContainer = document.getElementById('scheduleContainer');
      scheduleContainer.innerHTML = `
          <div class="loading-state">
              <div class="spinner"></div>
              <span>Loading schedule...</span>
          </div>
      `;
      
      console.log("Starting to load schedule for:", userEmail);
      
      // Check if user is authenticated
      if (!auth.currentUser) {
          console.warn("No authenticated user found when loading schedule");
          scheduleContainer.innerHTML = `
              <div class="empty-schedule">
                  <div class="empty-icon">🔒</div>
                  <div class="empty-message">Please log in to view your schedule</div>
              </div>
          `;
          return;
      }
      
      const assignments = await fetchAssignments(userEmail);
      
      // Debug: Print out all assignment dates
      console.log("Assignment dates:");
      assignments.forEach(assignment => {
          console.log(`${assignment.name}: ${assignment.date} (type: ${typeof assignment.date})`);
      });
      
      if (assignments.length === 0) {
          console.log("No assignments found after filtering");
          scheduleContainer.innerHTML = `
              <div class="empty-schedule">
                  <div class="empty-icon">📅</div>
                  <div class="empty-message">No upcoming tasks or assignments</div>
              </div>
          `;
          return;
      }
      
      console.log(`Loading schedule with ${assignments.length} assignments`);
      updateSchedule(assignments);
  } catch (error) {
      console.error("Error loading schedule:", error);
      const scheduleContainer = document.getElementById('scheduleContainer');
      scheduleContainer.innerHTML = `
          <div class="error-state">
              <div class="error-icon">⚠️</div>
              <div class="error-message">Could not load schedule: ${error.message}</div>
              <div class="error-details">${error.stack}</div>
          </div>
      `;
  }
}

// Update UI with course data
// Remove or modify this function to not override notification titles
function updateUIWithCourse(course = null) {
  // Use provided course or default to sample data
  const courseCode = course ? (course.code || "ITMS-02") : "ITMS-02";
  const courseTitle = course ? (course.title || "Programming") : "Seatwork 6 & 7";
  
  // Remove this part that's overriding notifications
  /* 
  const notificationTitle = document.querySelector('.notification-title');
  if (notificationTitle) {
    notificationTitle.textContent = `New Course material uploaded: ${courseCode}`;
  }
  */

  // Load schedule with real or sample data
  if (course && auth.currentUser) {
    loadSchedule(auth.currentUser.email);
  } else {
    // Sample data for testing
    const sampleAssignments = [{
      title: "Seatwork 6 & 7",
      courseCode: "ITMS-02",
      dueDate: new Date(),
      dueTime: "11:59 PM",
      points: 100
    }];
    updateSchedule(sampleAssignments);
  }
}

// 👀 Wait for DOM
document.addEventListener("DOMContentLoaded", () => {

 
  
  // Refresh notifications every 5 minutes
  setInterval(loadNotifications, 300000);
  // Initialize UI elements
  const welcomeNameEl = document.getElementById("welcomeName");
  const activeCourseCountEl = document.getElementById("activeCourseCount");
  const currentDateEl = document.getElementById("currentDate");
  
  // Set current date if element exists
  if (currentDateEl) {
    const today = new Date();
    currentDateEl.textContent = today.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  // Show loading state for schedule
  const scheduleContainer = document.getElementById('scheduleContainer');
  if (scheduleContainer) {
    scheduleContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Loading schedule...</span>
      </div>
    `;

    loadNotifications();
  }
  
  // Listen for authentication state changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("✅ Authenticated user:", user.email);
  
      try {
        // 🔥 Fetch user data from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          console.log("📄 User doc data:", userData);
  
          // Display name logic
          let nameToDisplay =
            userData.displayName ||
            userData.fullName ||
            userData.firstName ||
            (userData.firstName && userData.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : null) ||
            "Student";
  
          const firstNameOnly = nameToDisplay.split(" ")[0];
          if (welcomeNameEl) welcomeNameEl.textContent = firstNameOnly;
  
          // 🔍 Get all courses from Firestore
          const coursesRef = collection(db, "courses");
          const allCoursesSnap = await getDocs(coursesRef);
  
          const currentEmail = user.email;
          console.log(`🔍 Checking for courses with ${currentEmail}`);
  
          let matchingCourses = [];
  
          allCoursesSnap.forEach((docSnap) => {
            const courseData = docSnap.data();
  
            if (courseData.students && Array.isArray(courseData.students)) {
              const hasMatch = courseData.students.some((student) =>
                typeof student === "object" && student.email === currentEmail
              );
  
              if (hasMatch) {
                matchingCourses.push({
                  id: docSnap.id,
                  ...courseData
                });
              }
            }
          });
  
          console.log(`📚 Found ${matchingCourses.length} matching courses:`, matchingCourses);
  
          // Update UI with course count
          if (activeCourseCountEl) {
            activeCourseCountEl.textContent = matchingCourses.length > 0 ? matchingCourses.length : "0";
          }
  
          // Update UI with course data or show empty/default
          if (matchingCourses.length > 0) {
            updateUIWithCourse(matchingCourses[0]); // Just show the first course for now
          } else {
            updateUIWithCourse(); // Show sample/empty
          }
  
        } else {
          console.warn("⚠️ No user document found.");
          if (welcomeNameEl) welcomeNameEl.textContent = "Student";
          if (activeCourseCountEl) activeCourseCountEl.textContent = "0";
          updateUIWithCourse();
        }
  
      } catch (err) {
        console.error("🔥 Error loading user data:", err);
        if (welcomeNameEl) welcomeNameEl.textContent = "Student";
        if (activeCourseCountEl) activeCourseCountEl.textContent = "0";
        updateSchedule([]);
      }
  
    } else {
      console.warn("🚫 No user signed in.");
      if (welcomeNameEl) welcomeNameEl.textContent = "Student";
      if (activeCourseCountEl) activeCourseCountEl.textContent = "0";
      updateSchedule([]);
    }
  });
  

  // Add to your auth state change listener
  onAuthStateChanged(auth, (user) => {
    if (!user) {
        cleanupNotificationListener();
    }
  });
  
  // 🎨 Progress bar animation (optional)
  const progressBars = document.querySelectorAll('.progress-bar');
  setTimeout(() => {
    progressBars.forEach(bar => {
      const targetWidth = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => {
        bar.style.width = targetWidth;
      }, 200);
    });
  }, 500);

  // ✨ Sidebar animation (optional)
  const sidebarItems = document.querySelectorAll('.sidebar-menu li');
  sidebarItems.forEach(item => {
    item.addEventListener('mouseenter', function () {
      if (!this.classList.contains('active')) {
        this.style.transform = 'translateX(5px)';
      }
    });
    item.addEventListener('mouseleave', function () {
      if (!this.classList.contains('active')) {
        this.style.transform = 'translateX(0)';
      }
    });
  });
});

// Add the styles to document
document.addEventListener('DOMContentLoaded', () => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
    
    // Initial load of notifications
    loadNotifications();
});

function updateDateTime() {
  const timeElement = document.getElementById('currentTime');
  const dateElement = document.getElementById('currentDate');
  const now = new Date();

  // Update time
  const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
  });
  
  if (timeElement.textContent !== timeString) {
      timeElement.textContent = timeString;
      timeElement.classList.add('time-update');
      setTimeout(() => timeElement.classList.remove('time-update'), 300);
  }

  // Update date
  const dateString = now.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
  });
  dateElement.textContent = dateString;
}

// Update time every second
setInterval(updateDateTime, 1000);
updateDateTime(); // Initial call



// Update the notification styles to ensure visibility
const notificationStyles = `
    .notifications-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        max-height: calc(100vh - 200px); /* Increased height */
        overflow-y: auto;
        padding-right: 8px;
        padding: 30px;
    }

    .notification-item {
        display: flex;
        padding: 12px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 8px;
        opacity: 1;
        transform: translateX(0);
        transition: all 0.3s ease;
    }

    .notification-icon {
        font-size: 20px;
        margin-right: 12px;
        display: flex;
        align-items: center;
    }

    .notification-content {
        flex: 1;
    }

    .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 4px;
    }

    .notification-title {
        font-weight: 600;
        color: #2c3e50;
    }

    .notification-time {
        font-size: 0.8em;
        color: #7f8c8d;
    }

    .notification-message {
        color: #34495e;
        font-size: 0.9em;
    }

    .new-notification {
        background-color: #fff3e0;
    }

    .new-badge {
        background: #ff7043;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7em;
        margin-right: 6px;
    }

    @keyframes slideIn {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .clear-all-btn {
        background-color: #ff7043;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9em;
        transition: background-color 0.3s ease;
    }

    .clear-all-btn:hover {
        background-color: #f4511e;
    }

    .clear-icon {
        font-size: 1.1em;
    }

    .card-header- {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
    }
`;

// Add the styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Update the createNotificationElement function to ensure proper rendering
function createNotificationElement(notification) {
    let icon, title, subtitle;
    const courseCode = notification.courseCode || 'ITHCI01';
    const createdAt = notification.createdAt instanceof Date ? notification.createdAt : new Date();
    
    const timeAgo = formatTimeAgo(createdAt);
    const isNew = createdAt > (new Date(Date.now() - 5 * 60 * 1000));
    
    switch(notification.type) {
        case 'lesson':
            icon = '📖';
            title = `New Lesson Upload for ${courseCode}`;
            subtitle = notification.title;
            break;
        case 'quiz':
            icon = '📝';
            title = `New Quiz Upload for ${courseCode}`;
            subtitle = notification.title;
            break;
        case 'assignment':
            icon = '📚';
            title = `New Assignment Upload for ${courseCode}`;
            subtitle = notification.title;
            break;
        case 'announcement':
            icon = notification.isPinned ? '📌' : '📢';
            title = `New Announcement for ${courseCode}`;
            subtitle = notification.title;
            break;
        default:
            icon = '📢';
            title = notification.title || 'New Notification';
            subtitle = '';
    }

    return `
        <div class="notification-item ${notification.type} ${isNew ? 'new-notification' : ''} ${notification.isPinned ? 'pinned' : ''}" 
             data-notification-id="${notification.id}">
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-titles">
                        <span class="notification-title">${title}</span>
                        ${subtitle ? `<span class="notification-subtitle">${subtitle}</span>` : ''}
                    </div>
                    <span class="notification-time">
                        ${isNew ? '<span class="new-badge">New</span>' : ''}
                        ${notification.isPinned ? '<span class="pinned-badge">📌 Pinned</span>' : ''}
                        ${timeAgo}
                    </span>
                </div>
                <div class="notification-message">
                    ${notification.message || notification.content || ''}
                </div>
                ${notification.dueDate ? `
                <div class="notification-footer">
                    <span class="due-date">Due: ${new Date(notification.dueDate).toLocaleDateString()}</span>
                </div>` : ''}
            </div>
        </div>
    `;
}

// Update the setupNotificationListener function
function setupNotificationListener(courseId) {
    cleanupNotificationListener();

    if (!auth.currentUser) {
        console.warn("User must be logged in to listen for notifications");
        return;
    }

    const notificationsRef = collection(db, "courses", courseId, "notifications");
    const notificationsQuery = query(
        notificationsRef,
        orderBy("createdAt", "desc"),
        limit(10)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationContainer = document.querySelector('.notifications-wrapper');
        if (!notificationContainer) return;

        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" && !change.doc.metadata.hasPendingWrites) {
                const data = change.doc.data();
                const existingNotification = document.querySelector(`[data-notification-id="${change.doc.id}"]`);
                
                if (!existingNotification) {
                    const notificationElement = createNotificationElement({
                        id: change.doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date()
                    });

                    // Insert at the beginning of the container
                    notificationContainer.insertAdjacentHTML('afterbegin', notificationElement);
                    
                    // Animate the new notification
                    requestAnimationFrame(() => {
                        const newNotif = notificationContainer.firstElementChild;
                        newNotif.classList.add('show');
                    });
                    
                    if (!change.doc.metadata.fromCache) {
                        showNotification(`New ${data.type || 'notification'} received`, 'info');
                    }
                }
            }
        });
    });

    window.notificationUnsubscribe = unsubscribe;
}

// Update the loadNotifications function to handle undefined course codes
async function loadNotifications() {
    const notificationContainer = document.getElementById('notificationContainer');

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            notificationContainer.innerHTML = `
                <div class="notification-empty">
                    <div class="empty-icon">🔒</div>
                    <p>Please sign in to view notifications</p>
                </div>
            `;
            return;
        }

        // Show loading state
        notificationContainer.innerHTML = `
            <div class="notification-loading">
                <div class="spinner"></div>
                <p>Loading notifications...</p>
            </div>
        `;

        const userEmail = currentUser.email;
        const coursesRef = collection(db, "courses");
        const coursesSnapshot = await getDocs(coursesRef);

        const enrolledCourses = [];

        coursesSnapshot.forEach(doc => {
            const data = doc.data();
            const students = data.students;

            if (Array.isArray(students)) {
                if (students.includes(userEmail)) {
                    enrolledCourses.push(doc.id);
                } else {
                    // Check if students is an array of objects with email property
                    const emails = students.map(s => typeof s === 'object' && s.email ? s.email : s).filter(Boolean);
                    if (emails.includes(userEmail)) {
                        enrolledCourses.push(doc.id);
                    }
                }
            }
        });

        if (enrolledCourses.length === 0) {
            notificationContainer.innerHTML = `
                <div class="notification-empty">
                    <div class="empty-icon">📌</div>
                    <p>No enrolled courses, so no notifications yet</p>
                </div>
            `;
            return;
        }

        let notifications = [];

        // Load notifications from each enrolled course
        for (const courseId of enrolledCourses) {
            const notificationsRef = collection(db, "courses", courseId, "notifications");
            const notificationsQuery = query(
                notificationsRef,
                orderBy("createdAt", "desc"),
                limit(10)
            );

            const notifSnapshot = await getDocs(notificationsQuery);

            notifSnapshot.forEach(doc => {
                const data = doc.data();
                const createdAtDate = data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date();

                notifications.push({
                    id: doc.id,
                    ...data,
                    createdAt: createdAtDate
                });
            });

            // Optional: set up real-time listener per course if you want live updates
            setupNotificationListener(courseId);
        }

        // Sort all notifications together
        notifications.sort((a, b) => b.createdAt - a.createdAt);

        if (notifications.length === 0) {
            notificationContainer.innerHTML = `
                <div class="notification-empty">
                    <div class="empty-icon">📌</div>
                    <p>No notifications available</p>
                </div>
            `;
            return;
        }

        // Generate HTML
        const notificationsHTML = `
            <div class="notifications-wrapper">
                ${notifications.map(notification => createNotificationElement(notification)).join('')}
            </div>
        `;

        notificationContainer.innerHTML = notificationsHTML;

        // Animate
        const notificationItems = notificationContainer.querySelectorAll('.notification-item');
        notificationItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transform = 'translateX(0)';
                item.style.opacity = '1';
            }, index * 100);
        });

        updateNotificationHeader(notifications.length);

    } catch (error) {
        console.error("Error loading notifications:", error);
        notificationContainer.innerHTML = `
            <div class="notification-error">
                <div class="error-icon">⚠️</div>
                <p>Could not load notifications: ${error.message}</p>
                <button onclick="loadNotifications()" class="retry-button">Retry</button>
            </div>
        `;
    }
}



// Helper function to update notification header
function updateNotificationHeader(count) {
    const headerElement = document.querySelector('.card-header-');
    if (headerElement) {
        headerElement.innerHTML = `
            <div class="card-title">
                <div class="card-title-icon">🔔</div>
                <span>Notifications</span>
                ${count > 0 ? `<span class="notification-count">(${count})</span>` : ''}
            </div>
            ${count > 0 ? `
                <button id="clearAllNotifs" class="clear-all-btn">
                    <span class="clear-icon">🗑️</span> Clear All
                </button>
            ` : ''}
        `;

        // Add click handler for the clear button
        const clearBtn = headerElement.querySelector('#clearAllNotifs');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllNotifications);
        }
    }
}

// Clean up listener when needed (e.g., on sign out)
function cleanupNotificationListener() {
    if (window.notificationUnsubscribe) {
        window.notificationUnsubscribe();
    }
}

// Make function available globally
window.loadNotifications = loadNotifications;

// Call loadNotifications when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadNotifications();
});

// Add this code to check authentication status
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in:', user.email);
        loadNotifications();
    } else {
        console.log('No user is signed in');
    }
});

// Make sure function is available globally


// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
      return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// Function to manually add an assignment notification (for testing)
async function addAssignmentNotification(courseId, title, message, dueDate, points) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('User must be logged in to add assignments');
      return;
    }
    
    const notificationData = {
      type: 'assignment',
      title: title,
      message: message,
      createdAt: serverTimestamp(),
      from: currentUser.displayName || currentUser.email,
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
      points: points || null
    };
    
    const notificationsRef = collection(db, "courses", courseId, "notifications");
    await addDoc(notificationsRef, notificationData);
    
    // Reload notifications to show the new assignment
    await loadNotifications();
    
    console.log('Assignment added successfully');
  } catch (error) {
    console.error('Error adding assignment:', error);
  }
}

async function addQuizNotification(courseId, title, description, dueDate) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('User must be logged in to add quiz notifications');
      return;
    }
    
    // Get course document to get the course code
    const courseRef = doc(db, "courses", courseId);
    const courseSnap = await getDoc(courseRef);
    const courseCode = courseSnap.exists() ? courseSnap.data().code || 'PATHFIT' : 'PATHFIT';
    
    const notificationData = {
      type: 'quiz',
      title: title,
      message: `New Quiz Upload for ${courseCode}: ${title}`,
      description: description,
      createdAt: serverTimestamp(),
      from: currentUser.displayName || currentUser.email,
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
      courseCode: courseCode
    };
    
    const notificationsRef = collection(db, "courses", courseId, "notifications");
    await addDoc(notificationsRef, notificationData);
    
    // Reload notifications to show the new quiz
    await loadNotifications();
    
    console.log('Quiz notification added successfully');
  } catch (error) {
    console.error('Error adding quiz notification:', error);
  }
}
async function addLessonNotification(courseId, title, description) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('User must be logged in to add lesson notifications');
      return;
    }
    
    // Get course document to get the course code
    const courseRef = doc(db, "courses", courseId);
    const courseSnap = await getDoc(courseRef);
    const courseCode = courseSnap.exists() ? courseSnap.data().code || 'PATHFIT' : 'PATHFIT';
    
    const notificationData = {
      type: 'lesson',
      title: title,
      message: `New Lesson Upload for ${courseCode}: ${title}`,
      description: description,
      createdAt: serverTimestamp(),
      from: currentUser.displayName || currentUser.email,
      courseCode: courseCode,
      courseId: courseId,
      // Add additional fields to match quiz notifications
      icon: '📚',
      status: 'active',
      read: false,
      priority: 'normal',
      updatedAt: serverTimestamp()
    };
    
    const notificationsRef = collection(db, "courses", courseId, "notifications");
    await addDoc(notificationsRef, notificationData);
    
    // Reload notifications to show the new lesson
    await loadNotifications();
    
    // Add success notification
    showNotification('Lesson notification added successfully', 'success');
    
    console.log('Lesson notification added successfully');
  } catch (error) {
    console.error('Error adding lesson notification:', error);
    showNotification('Error adding lesson notification', 'error');
  }
}

// Make the function available globally
window.addLessonNotification = addLessonNotification;

// Make the function available globally
window.addQuizNotification = addQuizNotification;

async function clearAllNotifications() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.warn("Must be logged in to clear notifications");
            return;
        }

        const coursesRef = collection(db, "courses");
        const coursesSnapshot = await getDocs(coursesRef);
        const enrolledCourses = [];

        // Collect courses the user is enrolled in
        coursesSnapshot.forEach(doc => {
            const data = doc.data();
            const students = data.students || [];

            // Support both array of strings and array of objects
            const isEnrolled = students.some(student => {
                if (typeof student === "string") return student === currentUser.email;
                if (typeof student === "object" && student.email) return student.email === currentUser.email;
                return false;
            });

            if (isEnrolled) enrolledCourses.push(doc.id);
        });

        const deleteInBatches = async (documents) => {
            while (documents.length > 0) {
                const chunk = documents.splice(0, 500); // Firestore allows max 500 ops per batch
                const batch = writeBatch(db);
                chunk.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
        };

        const allNotifsToDelete = [];

        for (const courseId of enrolledCourses) {
            const notificationsRef = collection(db, "courses", courseId, "notifications");
            const notifSnapshot = await getDocs(notificationsRef);
            notifSnapshot.forEach(doc => allNotifsToDelete.push(doc));
        }

        if (allNotifsToDelete.length === 0) {
            alert("No notifications to delete.");
            return;
        }

        await deleteInBatches(allNotifsToDelete);

        // UI Update
        const notificationContainer = document.getElementById('notificationContainer');
        if (notificationContainer) {
            notificationContainer.innerHTML = `
                <div class="notification-empty">
                    <div class="empty-icon">📌</div>
                    <p>No notifications available</p>
                </div>
            `;
        }

        updateNotificationHeader(0);
        alert("All notifications cleared successfully");

    } catch (error) {
        console.error("Error clearing notifications:", error);
        alert("Failed to clear notifications: " + error.message);
    }
}


// Add this CSS for the animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        0% {
            transform: translateX(0);
            opacity: 1;
        }
        100% {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .clear-notifications-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
      <div class="toast-content">
          <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
          <span>${message}</span>
      </div>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add event listener for clear button
document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clearNotifications');
  if (clearBtn) {
      clearBtn.addEventListener('click', clearAllNotifications);
  }
});

// Add menu toggle functionality


window.addAssignmentNotification = addAssignmentNotification;