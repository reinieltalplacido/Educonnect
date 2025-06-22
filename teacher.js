// ✅ Initialize Firebase First
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { 
    orderBy, 
    limit, 
  
    Timestamp 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 🔐 Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDMs8HtwRyimV3UFJAg633dBmOy6KrxT90",
  authDomain: "educonnect-f70d6.firebaseapp.com",
  projectId: "educonnect-f70d6",
  storageBucket: "educonnect-f70d6.appspot.com",
  messagingSenderId: "211587031768",
  appId: "1:211587031768:web:5b406b1647d4a9a9212dad"
};

// 🚀 Initialize App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 👨‍🏫 Auth State + Dashboard Setup
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }

      // Get all required DOM elements
      const welcomeSpinner = document.getElementById("welcomeSpinner");
      const welcomeNameElem = document.getElementById("welcomeName");
      const avatarInitials = document.getElementById("avatarInitials");
      const courseCountText = document.getElementById("courseCountText");
      const courseGrid = document.getElementById("courseGrid");

      // Check if all required elements exist
      if (!welcomeSpinner || !welcomeNameElem || !avatarInitials || !courseCountText || !courseGrid) {
        console.error("Required DOM elements not found");
        return;
      }

      // 🔍 Fetch teacher data from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const fullName = userData.fullName || "Teacher";

        // ✨ Update Welcome Text and show it, hide spinner
        welcomeNameElem.textContent = `Welcome back, ${fullName}`;
        welcomeSpinner.style.display = "none";
        welcomeNameElem.style.display = "inline";

        // 🧠 Initials from full name
        const initials = fullName
          .split(" ")
          .map(name => name.charAt(0).toUpperCase())
          .slice(0, 2)
          .join("");
        avatarInitials.textContent = initials;

        // 📚 Count active courses
        const courseQuery = query(collection(db, "courses"), where("teacherId", "==", user.uid));
        const querySnapshot = await getDocs(courseQuery);
        const courseCount = querySnapshot.size;

        // Render courses dynamically
        courseGrid.innerHTML = ""; // Clear the container first

        querySnapshot.forEach((doc) => {
          const courseData = doc.data();
          const courseCard = createCourseCard(courseData);
          courseGrid.appendChild(courseCard);
        });

      } else {
        // Show fallback with default text
        welcomeNameElem.textContent = "Welcome back";
        welcomeSpinner.style.display = "none";
        welcomeNameElem.style.display = "inline";
        console.log("No user document found in Firestore.");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      // Try to show fallback message if elements exist
      const welcomeSpinner = document.getElementById("welcomeSpinner");
      const welcomeNameElem = document.getElementById("welcomeName");
      
      if (welcomeSpinner && welcomeNameElem) {
        welcomeNameElem.textContent = "Welcome back";
        welcomeSpinner.style.display = "none";
        welcomeNameElem.style.display = "inline";
      }
    }
  }
});

// Function to create a course card

// Function to create a course card using the color property from Firestore
function createCourseCard(course) {
  const courseCard = document.createElement("div");
  courseCard.classList.add("course-card");

  // Use the saved color property, or fallback to a default
  const bannerColor = course.color || "#f0f0f0";
  const courseBanner = document.createElement("div");
  courseBanner.classList.add("course-banner");
  courseBanner.style.backgroundColor = bannerColor;

  const courseContent = document.createElement("div");
  courseContent.classList.add("course-content");

  const courseTitle = document.createElement("h3");
  courseTitle.classList.add("course-title");
  courseTitle.textContent = course.title;
  courseContent.appendChild(courseTitle);

  const courseCode = document.createElement("div");
  courseCode.classList.add("course-code");
  courseCode.textContent = course.code;
  courseContent.appendChild(courseCode);

  courseCard.appendChild(courseBanner);
  courseCard.appendChild(courseContent);

  return courseCard;
}

// 📆 Date, Time, Greeting
document.addEventListener('DOMContentLoaded', function () {
  const now = new Date();
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };

  document.querySelector('.date-time div:first-child').textContent = now.toLocaleDateString('en-US', dateOptions);
  document.querySelector('.date-time div:last-child').textContent = now.toLocaleTimeString('en-US', timeOptions);

  const hour = now.getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const welcomeMsg = document.querySelector('.welcome-message');
  welcomeMsg.textContent = `Happy ${days[now.getDay()]}! Ready to organize your week?`;
});

document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.querySelector('.sidebar');
  const content = document.querySelector('.content-area');
  const header = document.querySelector('.top-header');
  
  // Set sidebar height dynamically
  function setSidebarHeight() {
      const windowHeight = window.innerHeight;
      const headerHeight = header.offsetHeight;
      sidebar.style.height = `${windowHeight - headerHeight}px`;
      
      // Ensure content area starts at the right position
      content.style.paddingTop = '20px';
  }
  
  // Run on load and resize
  setSidebarHeight();
  window.addEventListener('resize', setSidebarHeight);
  
  // Fix course card colors
  const courseCards = document.querySelectorAll('.course-card');
  const courseColors = [
      '#5e35b1', // Purple
      '#039be5', // Blue
      '#43a047', // Green
      '#e53935', // Red
      '#fb8c00'  // Orange
  ];
  
  courseCards.forEach((card, index) => {
      const banner = card.querySelector('.course-banner');
      if (banner) {
          banner.style.backgroundColor = courseColors[index % courseColors.length];
      }
  });
  
  // Add color coding to upcoming event types
  const upcomingTypes = document.querySelectorAll('.upcoming-type');
  upcomingTypes.forEach(type => {
      const text = type.textContent.trim();
      type.classList.add(text); // Add the text as a class
  });
});

// Add this to your existing JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  menuToggle?.addEventListener('click', function() {
      sidebar.classList.toggle('active');
      this.classList.toggle('active');
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', function(e) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
          sidebar.classList.remove('active');
          menuToggle.classList.remove('active');
      }
  });
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

// Function to load upcoming activities
async function loadUpcomingActivities() {
    const upcomingList = document.getElementById('upcomingActivitiesList');
    const user = auth.currentUser;

    if (!user) {
        console.error("No authenticated user found");
        return;
    }
    
    try {
        // Show loading state
        upcomingList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <span>Loading activities...</span>
            </div>
        `;

        // Get current date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 14);
        endOfWeek.setHours(23, 59, 59, 999);

        // Query calendarTasks collection with user filter
        const activitiesRef = collection(db, "calendarTasks");
        const activitiesQuery = query(
            activitiesRef,
            where("userId", "==", user.uid), // Add filter for current user
            orderBy("date", "asc"),
            limit(10)
        );

        const snapshot = await getDocs(activitiesQuery);
        const activities = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            // Only add if it belongs to current user
            if (data.userId === user.uid) {
                let activityDate;
                if (data.date) {
                    if (typeof data.date === 'object' && data.date.seconds) {
                        activityDate = new Date(data.date.seconds * 1000);
                    } else if (data.date instanceof Date) {
                        activityDate = data.date;
                    } else {
                        activityDate = new Date(data.date);
                    }
                } else {
                    activityDate = new Date();
                }

                activities.push({
                    id: doc.id,
                    ...data,
                    date: activityDate
                });
            }
        });

        if (activities.length === 0) {
            upcomingList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <p>No upcoming activities this week</p>
                </div>
            `;
            return;
        }

        // Rest of your existing code for displaying activities...
        upcomingList.innerHTML = activities.map(activity => `
            <div class="upcoming-item ${activity.type?.toLowerCase()}" data-activity-id="${activity.id}">
                <div class="upcoming-date">
                    <div class="date-day">${activity.date.getDate()}</div>
                    <div class="date-month">${activity.date.toLocaleString('default', { month: 'short' })}</div>
                </div>
                <div class="upcoming-details">
                    <div class="upcoming-activity">${activity.type}: ${activity.name || 'Untitled'}</div>
                    <div class="upcoming-course">${activity.course || ''}</div>
                    <div class="upcoming-time">${formatTime(activity.date)}</div>
                </div>
                <div class="upcoming-type ${activity.type?.toLowerCase() || ''}">${activity.type || 'Event'}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error loading activities:", error);
        upcomingList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p>Could not load activities. ${error.message}</p>
                <button class="retry-btn" onclick="window.loadUpcomingActivities()">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Make function available globally
window.loadUpcomingActivities = loadUpcomingActivities;
// Helper function to format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Function to handle calendar navigation
function navigateToCalendar() {
    window.location.href = 'teachercalendar.html';
}

// Add event listeners
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUpcomingActivities();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Add click handler for calendar button
    const viewCalendarBtn = document.getElementById('viewCalendarBtn');
    if (viewCalendarBtn) {
        viewCalendarBtn.addEventListener('click', navigateToCalendar);
    }

    // Add click handlers for activity items
    document.getElementById('upcomingActivitiesList').addEventListener('click', (e) => {
        const activityItem = e.target.closest('.upcoming-item');
        if (activityItem) {
            const activityId = activityItem.dataset.activityId;
            window.location.href = `teachercalendar.html?activity=${activityId}`;
        }
    });
});

// Function to load notifications
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

        // Query all courses where the current user is the teacher
        const coursesQuery = query(
            collection(db, "courses"),
            where("teacherId", "==", currentUser.uid)
        );
        
        const coursesSnapshot = await getDocs(coursesQuery);
        let allNotifications = [];

        // Fetch notifications from each course
        for (const courseDoc of coursesSnapshot.docs) {
            const notificationsRef = collection(db, "courses", courseDoc.id, "notifications");
            const notificationsQuery = query(
                notificationsRef,
                orderBy("createdAt", "desc"),
                limit(5) // Limit per course
            );

            const notifSnapshot = await getDocs(notificationsQuery);
            
            notifSnapshot.forEach(doc => {
                const data = doc.data();
                const createdAtDate = data.createdAt?.toDate?.() || new Date(data.createdAt);
                
                allNotifications.push({
                    id: doc.id,
                    courseId: courseDoc.id,
                    courseName: courseDoc.data().title,
                    courseCode: courseDoc.data().code,
                    ...data,
                    createdAt: createdAtDate
                });
            });
        }

        // Sort all notifications by date, newest first
        allNotifications.sort((a, b) => b.createdAt - a.createdAt);

        if (allNotifications.length === 0) {
            notificationContainer.innerHTML = `
                <div class="notification-empty">
                    <div class="empty-icon">📌</div>
                    <p>No notifications from your courses</p>
                </div>
            `;
            return;
        }

        // Generate notifications HTML
        const notificationsHTML = `
            <div class="notifications-wrapper">
                ${allNotifications.map(notification => `
                    <div class="notification-item" data-id="${notification.id}" 
                         data-course-id="${notification.courseId}">
                        <div class="notification-header">
                            <span class="notification-course">${notification.courseCode}</span>
                            <span class="notification-time">
                                ${formatTimeAgo(notification.createdAt)}
                            </span>
                        </div>
                        <div class="notification-content">
                            <div class="notification-title">${notification.title}</div>
                            <div class="notification-message">${notification.message}</div>
                        </div>
                        <div class="notification-actions">
                            <button class="edit-notification" data-id="${notification.id}">
                                Edit
                            </button>
                            <button class="delete-notification" data-id="${notification.id}">
                                Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        notificationContainer.innerHTML = notificationsHTML;

        // Add animation and event listeners
        const notificationItems = notificationContainer.querySelectorAll('.notification-item');
        notificationItems.forEach((item, index) => {
            // Animation
            setTimeout(() => {
                item.style.transform = 'translateX(0)';
                item.style.opacity = '1';
            }, index * 100);

            // Edit button listener
            item.querySelector('.edit-notification').addEventListener('click', (e) => {
                e.stopPropagation();
                const notifId = e.target.dataset.id;
                editNotification(notifId);
            });

            // Delete button listener
            item.querySelector('.delete-notification').addEventListener('click', (e) => {
                e.stopPropagation();
                const notifId = e.target.dataset.id;
                deleteNotification(notifId);
            });
        });

        // Update header with count
        updateNotificationHeader(allNotifications.length);

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

async function updateActiveCourseCount() {
    const courseCountElement = document.getElementById('activeCourseCount');
    const courseCountText = document.getElementById('courseCountText');
    const user = auth.currentUser;

    if (!user) {
        console.error("No authenticated user found");
        return;
    }

    try {
        // Query courses collection for the current user
        const coursesRef = collection(db, "courses");
        const coursesQuery = query(
            coursesRef,
            where("teacherId", "==", user.uid)
            // Removed status filter since all courses should be counted
        );

        const snapshot = await getDocs(coursesQuery);
        const courses = [];
        
        snapshot.forEach(doc => {
            courses.push({
                id: doc.id,
                ...doc.data()
            });
        });

        const activeCount = courses.length; // Count all courses for this teacher

        // Update the count in the UI
        courseCountElement.innerHTML = activeCount.toString();

        // Update the welcome message
        if (courseCountText) {
            courseCountText.textContent = `You have ${activeCount} ${activeCount === 1 ? 'course' : 'courses'} this semester`;
        }

    } catch (error) {
        console.error("Error counting courses:", error);
        courseCountElement.innerHTML = "Error";
        courseCountText.textContent = "Could not load courses";
    }
}

// Make sure this function is called when the page loads
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await updateActiveCourseCount();
    }
});
// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// Make functions available globally
window.loadNotifications = loadNotifications;