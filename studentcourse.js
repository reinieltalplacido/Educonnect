import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  addDoc, 
  doc, 
  onSnapshot, 
  limit, 
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMs8HtwRyimV3UFJAg633dBmOy6KrxT90",
  authDomain: "educonnect-f70d6.firebaseapp.com",
  projectId: "educonnect-f70d6",
  storageBucket: "educonnect-f70d6.appspot.com",
  messagingSenderId: "211587031768",
  appId: "1:211587031768:web:5b406b1647d4a9a9212dad"
};

// Initialize Firebase
initializeApp(firebaseConfig);

const storage = getStorage();
const auth = getAuth();
const db = getFirestore();
let lastLoadedCourseId = null;
let currentLoadingCourseId = null;
let quizTimeLeft = null;

// Wait for page to load
window.addEventListener("load", () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      addRefreshButton();
      await loadStudentCourses(user);
      // Set up real-time listener for courses
      setupCourseListener(user);
    } else {
      document.getElementById("studentCourseGrid").innerHTML = 
        '<div class="no-access">Please sign in to view your courses.</div>';
    }
  });
});

// Add a refresh button to the UI
function addRefreshButton() {
  const container = document.getElementById("studentCourseGrid");
  if (!container) return;
  
  // Check if button already exists
  const existingButton = document.getElementById("refreshCoursesBtn");
  if (existingButton) return;
  
  // Create the refresh button with styling matching the orange "Create Course" button
  const refreshButton = document.createElement("button");
  refreshButton.id = "refreshCoursesBtn";
  refreshButton.className = "refresh-courses-btn";
  refreshButton.textContent = "Refresh Courses";
  
  // Apply the same styling as the orange button in the image
  refreshButton.style.backgroundColor = "#FF7849"; // Orange color like in the image
  refreshButton.style.color = "white";
  refreshButton.style.border = "none";
  refreshButton.style.borderRadius = "4px";
  refreshButton.style.padding = "8px 16px";
  refreshButton.style.fontWeight = "500";
  refreshButton.style.fontSize = "14px";
  refreshButton.style.cursor = "pointer";
  refreshButton.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
  refreshButton.style.transition = "background-color 0.2s ease";
  
  // Add hover effect
  refreshButton.addEventListener("mouseover", () => {
    refreshButton.style.backgroundColor = "#E56C3E"; // Slightly darker orange on hover
  });
  
  refreshButton.addEventListener("mouseout", () => {
    refreshButton.style.backgroundColor = "#FF7849";
  });
  
  // Handle click event with loading state
  refreshButton.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (user) {
      // Update to loading state
      const originalText = refreshButton.textContent;
      refreshButton.textContent = "Loading...";
      refreshButton.disabled = true;
      refreshButton.style.cursor = "wait";
      refreshButton.style.backgroundColor = "#E56C3E";
      
      // Perform the refresh operation
      showLoadingSpinner(true);
      try {
        await loadStudentCourses(user);
      } catch (error) {
        console.error("Error refreshing courses:", error);
      }
      
      // Reset button after operation completes
      setTimeout(() => {
        refreshButton.textContent = originalText;
        refreshButton.disabled = false;
        refreshButton.style.cursor = "pointer";
        refreshButton.style.backgroundColor = "#FF7849";
        showLoadingSpinner(false);
      }, 500);
    }
  });
  
  // Place the button appropriately in the layout
  container.parentNode.insertBefore(refreshButton, container);
}

// Add CSS to ensure consistent styling
function addRefreshButtonStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .refresh-courses-btn {
      background-color: #FF7849;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: background-color 0.2s ease;
    }
    
    .refresh-courses-btn:hover {
      background-color: #E56C3E;
    }
    
    .refresh-courses-btn:disabled {
      opacity: 0.7;
      cursor: wait;
    }
  `;
  document.head.appendChild(style);
}

// Call this function to add both the button and its styles
function initializeRefreshButton() {
  addRefreshButtonStyles();
  addRefreshButton();
}

// Call the initialization function when appropriate (e.g., after DOM is loaded)
initializeRefreshButton();

// Set up real-time listener for course changes
function setupCourseListener(user) {
  const lowercaseEmail = user.email.toLowerCase();
  const q = query(collection(db, "courses"), where("students", "array-contains", lowercaseEmail));
  
  // This will trigger whenever courses are added/modified/deleted
  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (snapshot.docChanges().length > 0) {
      // Only reload if there are actual changes
      loadStudentCourses(user);
    }
  }, (error) => {
    // Silent error handling
  });
  
  // Store the unsubscribe function for cleanup
  window.courseUnsubscribe = unsubscribe;
}

async function loadStudentCourses(user) {
  const container = document.getElementById("studentCourseGrid");
  const courseGrid = document.getElementById("courseGrid");

  try {
    // Show loading spinner at the beginning
    showLoadingSpinner(true);
    
    // Hide course grid while loading
    if (courseGrid) courseGrid.style.display = 'none';

    const tokenResult = await user.getIdTokenResult(true);
    const userEmail = user.email;
    const lowercaseEmail = userEmail.toLowerCase();

    const processedCourseIds = new Set();
    const courses = [];

    // Query for lowercase email
    let q = query(collection(db, "courses"), where("students", "array-contains", lowercaseEmail));
    let snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      processedCourseIds.add(docSnap.id);
      await addCourseToResults(docSnap, courses);
    }

    // Query again for original case if different
    if (userEmail !== lowercaseEmail) {
      q = query(collection(db, "courses"), where("students", "array-contains", userEmail));
      snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        if (!processedCourseIds.has(docSnap.id)) {
          processedCourseIds.add(docSnap.id);
          await addCourseToResults(docSnap, courses);
        }
      }
    }

    // Scan all courses for object-based students
    const allCoursesQuery = query(collection(db, "courses"), limit(50));
    const allCoursesSnapshot = await getDocs(allCoursesQuery);
    for (const docSnap of allCoursesSnapshot.docs) {
      if (processedCourseIds.has(docSnap.id)) continue;
      const data = docSnap.data();
      if (Array.isArray(data.students)) {
        const match = data.students.some(s =>
          typeof s === 'object' && s?.email && (s.email === userEmail || s.email === lowercaseEmail)
        );
        if (match) {
          processedCourseIds.add(docSnap.id);
          await addCourseToResults(docSnap, courses);
        }
      }
    }

    // Prepare course data before hiding spinner
    await renderStudentCourses(courses);
  } catch (err) {
    if (container) {
      container.innerHTML = '<div class="error-message">Failed to load courses. Please try again later.</div>';
    }
  } finally {
    // Hide the spinner only after everything is ready
    showLoadingSpinner(false);
  }
}

// Fetch and display courses
async function renderStudentCourses(courses) {
  const courseGrid = document.getElementById("courseGrid");
  if (!courseGrid) return;

  // Just prepare the content without showing it yet
  courseGrid.innerHTML = ''; // Clear existing courses before rendering
  
  courses.forEach(course => {
    const card = document.createElement("div");
    card.className = "course-card";
    const section = course.meta || course.section || "❓ Unknown";

    card.innerHTML = `
      <div class="course-header" style="background-color: ${course.color || '#ccc'}; border-radius: 8px 8px 0 0;"></div>
      <div class="course-info">
        <div class="course-title">${course.title}</div>
        <div class="course-code"><strong>📋 Code:</strong> ${course.code}</div>
        <div class="course-section"><strong>📘 Section:</strong> ${section}</div>
        <div class="course-teacher"><span>👨‍🏫</span> ${course.teacherName || "Unknown Teacher"}</div>
      </div>
    `;

    // Add event listener to the card to view course details when clicked
    card.addEventListener("click", () => {
      showCourseDetails(course); // Show the course details when the card is clicked
    });

    courseGrid.appendChild(card); // Add the course card to the grid
  });
  
  // Grid will be shown by showLoadingSpinner(false) later
}

// Show course details when a card is clicked
function showCourseDetails(course) {
  // Get the required elements
  const courseGridDiv = document.getElementById("courseGrid");
  const courseDetailsDiv = document.getElementById("courseDetails");
  const searchFilterDiv = document.querySelector(".search-filter");
  const refreshCoursesBtn = document.getElementById("refreshCoursesBtn");
  const pageTitle = document.querySelector("h1");

  // Hide the refresh button when showing course details
  if (refreshCoursesBtn) {
    refreshCoursesBtn.style.display = "none";
  }

  // Change the page title to the course name
  if (pageTitle) {
    pageTitle.textContent = course.title;
  }

  // Hide the course grid and search/filter
  if (courseGridDiv) courseGridDiv.style.display = "none";
  if (searchFilterDiv) searchFilterDiv.style.display = "none";

  // Show the course details
  if (courseDetailsDiv) {
    courseDetailsDiv.style.display = "block";
    // Store course ID as a data attribute
    courseDetailsDiv.dataset.courseId = course.id;
  }

  // Default to the Announcements tab and highlight it
  showCourseTab('announcementsTab');
  
  // Highlight the Announcements tab button by adding an active class
  const tabButtons = document.querySelectorAll(".sidebar-menu button");
  tabButtons.forEach(button => {
    button.classList.remove("active");
    if (button.textContent === "Announcements") {
      button.classList.add("active");
    }
  });
  
  // Load the announcements for this course
  loadAnnouncements(course.id);
}

// Function to show the correct tab


function showCourseTab(tabId) {
  const allTabs = document.querySelectorAll(".course-tab");
  const tabButtons = document.querySelectorAll(".sidebar-menu-btn");
  const courseDetailsDiv = document.getElementById("courseDetails");

  // Hide all tabs
  allTabs.forEach(tab => tab.style.display = "none");

  // Remove 'active' class from all buttons
  tabButtons.forEach(button => button.classList.remove("active"));

  const selectedTab = document.getElementById(tabId);

  if (!selectedTab) {
    console.error(`Tab with ID '${tabId}' not found.`);
    return;
  }

  // Show the selected tab
  selectedTab.style.display = "block";

  // Activate the correct tab button using data-tab attribute
  tabButtons.forEach(button => {
    if (button.dataset.tab === tabId) {
      button.classList.add("active");
    }
  });

  // Load dynamic content based on tab
  if (courseDetailsDiv && courseDetailsDiv.dataset.courseId) {
    const courseId = courseDetailsDiv.dataset.courseId;

    switch (tabId) {
      case "announcementsTab":
        loadAnnouncements(courseId);
        break;
      case "quizTab":
        loadCourseQuizzes(courseId);
        break;
      case "lessonsTab":
        loadLessonsForStudent(courseId);
        break;
      case "assignmentsTab":
        loadAssignmentsForStudent(courseId);
        break;
      // Add more tabs as needed
      default:
        console.log(`No dynamic loader defined for tabId: ${tabId}`);
        break;
    }
  }
}





// Go back to the course list
function goBackToCourses() {
  const courseGridDiv = document.getElementById("courseGrid");
  const courseDetailsDiv = document.getElementById("courseDetails");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const refreshCoursesBtn = document.getElementById("refreshCoursesBtn");
  const pageTitle = document.querySelector("h1");
  const searchFilterDiv = document.querySelector(".search-filter");

  // Show refresh button again
  if (refreshCoursesBtn) {
    refreshCoursesBtn.style.display = "block";
  }

  // Reset page title to "My Courses"
  if (pageTitle) {
    pageTitle.textContent = "My Courses";
  }

  // Hide course details section
  if (courseDetailsDiv) {
    courseDetailsDiv.style.display = "none"; 
  }

  // Hide loading spinner if it exists
  if (loadingSpinner) {
    loadingSpinner.style.display = "none";
  }

  // Show search/filter again
  if (searchFilterDiv) {
    searchFilterDiv.style.display = "flex";
  }

  // Show course grid section immediately
  if (courseGridDiv) {
    courseGridDiv.style.display = "grid"; 
  }

  // Reset tab visibility to the default
  const allTabs = document.querySelectorAll(".course-tab");
  allTabs.forEach(tab => {
    tab.style.display = "none";
  });
}

// Example: dynamically load students into the "Students" tab
function loadStudents(courseId) {
  // Fetch students from Firebase or any database here
  const students = [
    { email: "student1@example.com" },
    { email: "student2@example.com" }
  ];

  const studentsListBody = document.getElementById("studentsListBody");
  studentsListBody.innerHTML = ""; // Clear existing students

  students.forEach(student => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.email}</td>
      <td><button onclick="removeStudent('${student.email}')">Remove</button></td>
    `;
    studentsListBody.appendChild(row);
  });

  // If no students, show the fallback message
  const noStudentsMsg = document.getElementById("noStudentsMsg");
  noStudentsMsg.style.display = students.length === 0 ? "block" : "none";
}

// Example function to handle student removal (this can be expanded with Firebase functionality)
function removeStudent(studentEmail) {
  alert(`Removing student: ${studentEmail}`);
  // You can add Firebase removal logic here
}

// Helper function to add a course to results after loading teacher data
async function addCourseToResults(docSnap, coursesArray) {
  const data = docSnap.data();
  
  try {
    // Add error handling for teacher lookup
    let teacherData = { fullName: "Unknown Teacher", gender: "male" };
    if (data.teacherId) {
      const teacherSnap = await getDoc(doc(db, "users", data.teacherId));
      if (teacherSnap.exists()) {
        teacherData = teacherSnap.data();
      }
    }

    // Format teacher name - use fullName if available, otherwise try other fields
    let teacherName = teacherData.fullName;
    
    // If fullName is an email or missing, try to use displayName or name
    if (!teacherName || teacherName.includes('@')) {
      teacherName = teacherData.displayName || teacherData.name || "Unknown Teacher";
    }

    coursesArray.push({
      id: docSnap.id,
      title: data.title || "Untitled Course",
      code: data.code || "No Code",
      section: data.section || "No Section",
      meta: data.meta, // Add meta field to preserve it for section display
      color: data.color || "#ccc",
      teacherName: teacherName,
      teacherGender: teacherData.gender || "male"
    });
  } catch (teacherErr) {
    // Still add the course with default teacher info
    coursesArray.push({
      id: docSnap.id,
      title: data.title || "Untitled Course",
      code: data.code || "No Code",
      section: data.section || "No Section",
      meta: data.meta, // Add meta field to preserve it for section display
      color: data.color || "#ccc",
      teacherName: "Unknown Teacher",
      teacherGender: "male"
    });
  }
}

function showLoadingSpinner(isLoading) {
  const container = document.getElementById("studentCourseGrid");
  const courseGrid = document.getElementById("courseGrid");
  
  if (!container) return;

  if (isLoading) {
    // Create and show spinner
    container.innerHTML = '';
    
    // Create clean modern spinner that matches the image
    const spinnerContainer = document.createElement("div");
    spinnerContainer.style.display = "flex";
    spinnerContainer.style.flexDirection = "column";
    spinnerContainer.style.alignItems = "center";
    spinnerContainer.style.justifyContent = "center";
    spinnerContainer.style.padding = "60px 0";
    
    // Create the spinner element with light gray border and blue top
    const spinner = document.createElement("div");
    spinner.style.width = "50px";
    spinner.style.height = "50px";
    spinner.style.border = "4px solid #e0e0e0";
    spinner.style.borderTop = "4px solid #2196f3";
    spinner.style.borderRadius = "50%";
    spinner.style.animation = "spin 1s linear infinite";
    
    // Add the loading text
    const loadingText = document.createElement("div");
    loadingText.textContent = "Loading courses...";
    loadingText.style.marginTop = "20px";
    loadingText.style.color = "#666";
    loadingText.style.fontWeight = "500";
    loadingText.style.fontSize = "16px";
    
    // Ensure the animation style is added
    if (!document.head.querySelector("style#spinner-style")) {
      const style = document.createElement("style");
      style.id = "spinner-style";
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Add styling for active tab buttons */
        .sidebar-menu button.active {
          background-color: #FF7849;
          color: white;
          font-weight: bold;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Append elements
    spinnerContainer.appendChild(spinner);
    spinnerContainer.appendChild(loadingText);
    container.appendChild(spinnerContainer);
    
    // Hide course grid while loading
    if (courseGrid) courseGrid.style.display = 'none';
  } else {
    // Clear the spinner
    container.innerHTML = '';
    
    // Show course grid after loading - with a slight delay to ensure smooth transition
    if (courseGrid) {
      // First set display to grid
      courseGrid.style.display = 'grid';
      
      // Optional: Add fade-in effect for smoother transition
      courseGrid.style.opacity = '0';
      courseGrid.style.transition = 'opacity 0.3s ease-in';
      
      // Use setTimeout to ensure the display:grid has taken effect before starting the fade-in
      setTimeout(() => {
        courseGrid.style.opacity = '1';
      }, 50);
    }
  }
}

// Auth state change listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loadStudentCourses(user);
  } else {
    window.location.href = "login.html";
  }
});

// Add CSS for active tab styling
function addTabStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .sidebar-menu button.active {
      background-color: #FF7849;
      color: white;
      position: relative;
      font-weight: 500;
    }
    
    .sidebar-menu button.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background-color: #E56C3E;
    }
    
    .sidebar-menu button {
      background-color: transparent;
      border: none;
      padding: 10px 15px;
      text-align: left;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
    }
    
    .sidebar-menu button:hover:not(.active) {
      background-color: #f5f5f5;
    }
  `;
  document.head.appendChild(style);
}

// Load announcements for the current course
async function loadAnnouncements(courseId) {
  if (!courseId) return;
  
  try {
    // Show loading indicator
    const announcementsTab = document.getElementById('announcementsTab');
    if (!announcementsTab) return;
    
    // Clear previous announcements except the header
    const header = announcementsTab.querySelector('h2');
    announcementsTab.innerHTML = '';
    if (header) {
      announcementsTab.appendChild(header);
    } else {
      const newHeader = document.createElement('h2');
      newHeader.textContent = 'Announcements';
      announcementsTab.appendChild(newHeader);
    }
    
    // Add loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'announcement-loading';
    loadingSpinner.innerHTML = `
      <div class="spinner"></div>
      <p>Loading announcements...</p>
    `;
    announcementsTab.appendChild(loadingSpinner);
    
    // Fetch the course data
    const courseRef = doc(db, "courses", courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (!courseSnap.exists()) {
      throw new Error("Course not found");
    }
    
    // Remove loading spinner
    loadingSpinner.remove();
    
    const courseData = courseSnap.data();
    const announcements = courseData.announcements || [];
    
    if (announcements.length === 0) {
      const noAnnouncementsMsg = document.createElement('p');
      noAnnouncementsMsg.className = 'no-announcements';
      noAnnouncementsMsg.textContent = 'No announcements yet.';
      announcementsTab.appendChild(noAnnouncementsMsg);
      return;
    }
    
    // Sort announcements: pinned first, then by date (newest to oldest)
    const sortedAnnouncements = [...announcements].sort((a, b) => {
      // Pinned announcements come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then sort by date (newest first)
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });
    
    const announcementsList = document.createElement('div');
    announcementsList.className = 'announcements-list';
    
    sortedAnnouncements.forEach((announcement) => {
      const announcementElement = document.createElement('div');
      announcementElement.className = `announcement-item ${announcement.isPinned ? 'announcement-pinned' : ''}`;
      
      const timestamp = announcement.createdAt?.toDate ? announcement.createdAt.toDate() : new Date(announcement.createdAt);
      const formattedDate = timestamp.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      let teacherName = announcement.createdByName || 'Teacher';
      if (teacherName.includes('@')) {
        teacherName = 'Teacher';
      }
      
      announcementElement.innerHTML = `
        <div class="announcement-header">
          <div class="announcement-title">
            ${announcement.title}
            ${announcement.isPinned ? '<span class="announcement-pinned-badge">Pinned</span>' : ''}
          </div>
          <div class="announcement-meta">Posted on ${formattedDate} by ${teacherName}</div>
        </div>
        <div class="announcement-content">
          ${announcement.content}
        </div>
      `;
      
      announcementsList.appendChild(announcementElement);
    });

    // Clear previous content and add the new announcements list
    announcementsTab.innerHTML = '<h2>Announcements</h2>';
    announcementsTab.appendChild(announcementsList);

    addAnnouncementStyles();
  } catch (error) {
    console.error("Error loading announcements:", error);
    
    // Show error message
    const announcementsTab = document.getElementById('announcementsTab');
    if (announcementsTab) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Failed to load announcements. Please try again later.';
      announcementsTab.appendChild(errorMsg);
    }
  }
}

// Add styles for announcements
function addAnnouncementStyles() {
  if (document.getElementById('announcement-styles')) return;

  const styleElement = document.createElement('style');
  styleElement.id = 'announcement-styles';
  styleElement.textContent = `
    .announcements-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      width: 1000px;
      margin: 0 auto;
    }

    .announcement-item {
      background-color: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border-left: 4px solid #FF7043;
      width: 900px;
      position: relative;
      margin: 0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .announcement-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    .announcement-title {
      font-size: 18px;
      font-weight: 500;
      color: #333;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .announcement-meta {
      color: #666;
      font-size: 14px;
    }

    .announcement-content {
      font-size: 14px;
      line-height: 1.6;
      color: #666;
    }

    .announcement-pinned {
      border-left-color: #4285f4;
      background-color: #f8f9fa;
    }

    .announcement-pinned-badge {
      background-color: #e8f0fe;
      color: #174ea6;
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 13px;
      font-weight: 500;
    }

    .no-announcements {
      text-align: center;
      padding: 40px;
      color: #666;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .announcement-loading {
      text-align: center;
      padding: 40px;
    }

    .announcement-loading .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #FF7043;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .announcements-list {
        width: 95%;
      }
      
      .announcement-item {
        width: 100%;
      }

      .announcement-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `;
  document.head.appendChild(styleElement);
}


async function loadLessonsForStudent(courseId) {
  if (!courseId) {
    console.log("No courseId provided");
    return;
  }

  try {
    console.log("Fetching lessons for course ID:", courseId);

    const lessonsTab = document.getElementById('lessonsTab');
    if (!lessonsTab) {
      console.log("Lessons tab not found");
      return;
    }

    lessonsTab.style.display = 'block';  // Ensure the tab is visible

    const header = lessonsTab.querySelector('h2');
    lessonsTab.innerHTML = '';
    if (header) {
      lessonsTab.appendChild(header);
    } else {
      const newHeader = document.createElement('h2');
      newHeader.textContent = 'Lessons';
      lessonsTab.appendChild(newHeader);
    }

    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'lesson-loading';
    loadingSpinner.innerHTML = `
      <div class="spinner"></div>
      <p>Loading lessons...</p>
    `;
    lessonsTab.appendChild(loadingSpinner);

    // Get the lessons subcollection
    const lessonsRef = collection(db, "courses", courseId, "lessons");
    const lessonsSnapshot = await getDocs(lessonsRef);

    console.log("Lessons snapshot fetched:", lessonsSnapshot.empty);

    if (lessonsSnapshot.empty) {
      console.log("No lessons found for course ID:", courseId);
      const noLessonsMsg = document.createElement('p');
      noLessonsMsg.className = 'no-lessons';
      noLessonsMsg.textContent = 'No lessons yet.';
      lessonsTab.appendChild(noLessonsMsg);
      return;
    }

    const lessons = [];
    lessonsSnapshot.forEach(doc => {
      lessons.push(doc.data());
    });

    console.log("Lessons found:", lessons);

    // Sort lessons by order
    const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
    console.log("Sorted lessons:", sortedLessons);

    sortedLessons.forEach((lesson) => {
      const lessonElement = document.createElement('div');
      lessonElement.className = 'lesson-card';
      lessonElement.innerHTML = `
        <div class="lesson-header">
          <h3 class="lesson-title">${lesson.title}</h3>
          <span class="lesson-order">Order: ${lesson.order || 'N/A'}</span>
        </div>
        <p class="lesson-description">${lesson.description || 'No description available'}</p>
        <p class="lesson-content">${lesson.content || 'No content available'}</p>
      `;
      lessonsTab.appendChild(lessonElement);
    });

    // Remove the loading spinner once lessons are added
    loadingSpinner.remove();

    addLessonStyles();

  } catch (error) {
    console.error("Error loading lessons:", error);

    const lessonsTab = document.getElementById('lessonsTab');
    if (lessonsTab) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Failed to load lessons. Please try again later.';
      lessonsTab.appendChild(errorMsg);
    }
  }
}


  
async function fetchLessons(courseId) {
  if (!courseId) {
    console.error("No courseId provided to fetchLessons");
    return;
  }

  const lessonsContainer = document.getElementById('lessonsTab');
  if (!lessonsContainer) {
    console.error("Could not find lessons container element");
    return;
  }

  currentCourseId = courseId;

  try {
    // Show loading state
    lessonsContainer.innerHTML = `
      <div class="loading-indicator">
        <div class="loading-spinner"></div>
        <span>Loading lessons...</span>
      </div>
    `;

    // Reference to the lessons subcollection
    const lessonsRef = collection(db, 'courses', courseId, 'lessons');
    // Optionally, order by 'order' field if it exists
    const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
    const lessonsSnap = await getDocs(lessonsQuery);

    // Clear loading state
    lessonsContainer.innerHTML = '';

    // Add heading
    const heading = document.createElement('h2');
    heading.textContent = 'Lessons';
    lessonsContainer.appendChild(heading);

    if (lessonsSnap.empty) {
      const noLessons = document.createElement('p');
      noLessons.className = 'no-content-message';
      noLessons.textContent = 'No lessons have been added yet.';
      lessonsContainer.appendChild(noLessons);
      console.log("No lessons found for course:", courseId);
    } else {
      // Create lessons list container
      const lessonsList = document.createElement('div');
      lessonsList.className = 'lessons-list';

      lessonsSnap.forEach(docSnap => {
        const lesson = docSnap.data();
        lesson.id = docSnap.id; // Attach the lesson id

        const lessonCard = document.createElement('div');
        lessonCard.className = 'lesson-card';

        // Build the HTML for the lesson card
        let lessonHTML = `
          <div class="lesson-header">
            <h3>${lesson.title || 'Untitled Lesson'}</h3>
            <div class="lesson-actions">
              <button onclick="deleteLesson('${lesson.id}')" class="btn-delete">Delete</button>
            </div>
          </div>
          <p class="lesson-description">${lesson.description || 'No description provided'}</p>
          <span class="lesson-order">Lesson ${lesson.order !== undefined ? lesson.order : '?'}</span>
        `;

        // Add file download link if a file exists
        if (lesson.fileURL) {
          lessonHTML += `
          <div class="lesson-file">
            <a href="${lesson.fileURL}" target="_blank" class="file-link">
              <span class="file-icon">📄</span>
              ${lesson.fileName || 'Download File'}
            </a>
          </div>
          `;
        }

        lessonCard.innerHTML = lessonHTML;
        lessonsList.appendChild(lessonCard);
      });

      lessonsContainer.appendChild(lessonsList);
      console.log("Successfully loaded lessons for course:", courseId);
    }
  } catch (error) {
    console.error("Error fetching lessons:", error);
    lessonsContainer.innerHTML = '<p class="error-message">Failed to load lessons. Please refresh the page and try again.</p>';
  }
}



// Example for student viewing a course

// Helper function to add custom styles (if needed)
function addLessonStyles() {
  if (document.querySelector('.lesson-styles')) return;

  const style = document.createElement('style');
  style.className = 'lesson-styles';
  style.textContent = `
    .lessons-list {
      display: flex;
      flex-direction: column;
      gap: 24px;  /* Increased gap between cards */
      padding: 40px 20px;  /* Added more vertical padding */
      width: 1200px;
      margin: 0 auto;
    }

    .lesson-card {
      background-color: #fff;
      border-radius: 8px;
      padding: 24px;  /* Increased padding inside cards */
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border-left: 4px solid #FF7043;
      width: 100%;
      margin-top: 20px;
      position: relative;
      width: 900px;
    }

    /* Rest of the existing styles remain the same */
    .lesson-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .lesson-title {
      font-size: 18px;
      font-weight: 500;
      color: #333;
      margin: 0;
    }

    .lesson-date {
      font-size: 14px;
      color: #666;
    }

    .lesson-description {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
      line-height: 1.5;  /* Added for better text readability */
    }

    .lesson-content {
      margin-top: 12px;
      color: #666;
      font-size: 14px;
    }

    .no-lessons {
      text-align: center;
      padding: 40px;
      color: #666;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .lesson-loading {
      text-align: center;
      padding: 40px;
    }

    .lesson-loading .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #FF7043;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .lessons-list {
        width: 95%;
      }
      
      .lesson-card {
        width: 100%;
      }

      .lesson-header {
        flex-direction: column;
        gap: 8px;
      }
    }
  `;
  document.head.appendChild(style);
}



// Example for student viewing a course
document.querySelectorAll('.course-card').forEach((card) => {
  card.addEventListener('click', () => {
    const courseId = card.dataset.courseId;  // Assuming courseId is stored as data attribute
    loadLessonsForStudent(courseId);
  });
});
async function loadCourseQuizzes(courseId) {
  // Add this to the loadCourseQuizzes function at the start
if (window.currentQuizTimer) {
  clearInterval(window.currentQuizTimer);
  window.currentQuizTimer = null;
}
  console.log("[loadCourseQuizzes] Triggered for course:", courseId);
  
  if (!courseId) return;

  const quizTab = document.getElementById("quizTab");
  if (!quizTab) return;

  // If already loading quizzes for this course, skip
  if (currentLoadingCourseId === courseId) {
    console.log("[loadCourseQuizzes] Already loading this course. Skipping duplicate call.");
    return;
  }

  // If it's the same course already loaded, optionally skip (or reload if needed)
  if (lastLoadedCourseId === courseId) {
    console.log("[loadCourseQuizzes] This course has already been loaded. Skipping reload.");
    return;
  }

  currentLoadingCourseId = courseId;

  try {
    showQuizLoadingSpinner(true);

    // Clear current quiz tab to prevent flashing
    quizTab.innerHTML = '';

    // Add placeholder while loading
    const header = document.createElement('h2');
    header.textContent = 'Quizzes';
    quizTab.appendChild(header);

    let quizzes = [];

    // 🔐 Get current user
    const user = auth.currentUser;
    console.log("[loadCourseQuizzes] Current user:", user ? user.email : "No user");

    // 🧾 First: Try embedded quizzes in the course document
    try {
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);

      if (courseSnap.exists()) {
        const courseData = courseSnap.data();
        console.log("[loadCourseQuizzes] Course data retrieved:", courseData);

        if (courseData.quizzes && Array.isArray(courseData.quizzes) && courseData.quizzes.length > 0) {
          console.log("[loadCourseQuizzes] Found embedded quizzes:", courseData.quizzes.length);

          quizzes = courseData.quizzes.map((quiz, index) => ({
            id: quiz.id || `embedded-quiz-${index}`,
            ...quiz,
            fromEmbedded: true,
            embeddedIndex: index
          }));

          console.log("[loadCourseQuizzes] Mapped embedded quizzes:", quizzes.length);
        }
      }
    } catch (err) {
      console.error("[loadCourseQuizzes] Error fetching course doc:", err);
    }

    // 🗂️ If embedded quizzes not found, try the subcollection
    if (quizzes.length === 0) {
      try {
        const quizzesRef = collection(db, "courses", courseId, "quizzes");
        const snapshot = await getDocs(quizzesRef);

        if (!snapshot.empty) {
          console.log("[loadCourseQuizzes] Found quizzes in subcollection:", snapshot.docs.length);
          quizzes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fromSubcollection: true
          }));
        }
      } catch (err) {
        console.error("[loadCourseQuizzes] Error fetching subcollection quizzes:", err);
      }
    }

    // 🎯 Final check before rendering
    if (currentLoadingCourseId !== courseId) {
      console.warn("[loadCourseQuizzes] Course switched mid-load. Aborting render.");
      return;
    }

    if (quizzes.length > 0) {
      renderQuizList(quizzes, courseId);
    } else {
      showNoQuizzesMessage(quizTab);
    }

    lastLoadedCourseId = courseId;

  } catch (error) {
    console.error("[loadCourseQuizzes] Fatal error:", error);

    quizTab.innerHTML = '';
    const errorContainer = document.createElement('div');
    errorContainer.className = 'quiz-list-container';
    errorContainer.innerHTML = `
      <div class="alert alert-danger">
        <h3>Quizzes</h3>
        <p>Failed to load quizzes: ${error.message}</p>
        <p>Please try again later.</p>
      </div>
    `;
    quizTab.appendChild(errorContainer);

  } finally {
    showQuizLoadingSpinner(false);
    currentLoadingCourseId = null;
  }
}

// Show no quizzes message
function showNoQuizzesMessage(quizTab) {
  // Ensure styles are added
  addQuizStyles();
  
  // Clear the tab content
  quizTab.innerHTML = '';
  
  // Add header
  const header = document.createElement('h2');
  header.textContent = 'Quizzes';
  quizTab.appendChild(header);
  
  // Create container with consistent styling
  const container = document.createElement('div');
  container.className = 'quiz-list-container';
  
  // Add message
  const messageDiv = document.createElement('div');
  messageDiv.className = 'no-quizzes-message';
  messageDiv.innerHTML = '<p>No quizzes available for this course yet.</p>';
  
  container.appendChild(messageDiv);
  quizTab.appendChild(container);
}

// Show access denied message
function showAccessDeniedMessage(quizTab) {
  quizTab.innerHTML = `
    <h2>Quiz</h2>
    <div class="error-message">
      <p>You don't have permission to view quizzes for this course.</p>
    </div>
  `;
}

// Render the list of available quizzes
function renderQuizList(quizzes, courseId) {
  const quizTab = document.getElementById("quizTab");
  
  console.log("Rendering quiz list with", quizzes.length, "quizzes");
  
  // Add CSS for quiz list if not already added
  addQuizStyles();
  
  // Clear existing content
  quizTab.innerHTML = '';
  
  // Create back button and header container
  const headerContainer = document.createElement('div');
  headerContainer.className = 'quiz-header-container';
  headerContainer.innerHTML = `
    
    <h2>Quizzes</h2>
  `;
  quizTab.appendChild(headerContainer);
  
  // Add styles for the header container and back button
  const style = document.createElement('style');
  style.textContent = `
    .quiz-header-container {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
    }

    .back-btn {
      background: #FF7043;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s ease;
      display: flex;
      align-items: center;
      font-weight: 500;
    }

    .back-btn:hover {
      background: #E56C3E;
    }
  `;
  document.head.appendChild(style);

  const quizListContainer = document.createElement('div');
  quizListContainer.className = 'quiz-list-container';
  
  if (quizzes.length === 0) {
    const noQuizzesMessage = document.createElement('div');
    noQuizzesMessage.className = 'no-quizzes-message';
    noQuizzesMessage.innerHTML = '<p>No quizzes available for this course yet.</p>';
    quizListContainer.appendChild(noQuizzesMessage);
  } else {
    // Create quiz list
    const quizList = document.createElement('div');
    quizList.className = 'quiz-list';
    
    quizzes.forEach(quiz => {
      console.log("Processing quiz for UI:", quiz.id, quiz.title);
      
      // Calculate status
      let statusClass = "upcoming";
      let statusText = "Upcoming";
      
      const userUid = auth.currentUser.uid;
      const hasAttempted = quiz.attempts && quiz.attempts[userUid];
      
      // Check due date
      let formattedDate = "No due date";
      let isDueDatePassed = false;
      
      if (quiz.dueDate) {
        try {
          let dueDate;
          if (typeof quiz.dueDate === 'string') {
            dueDate = new Date(quiz.dueDate);
          } else if (quiz.dueDate.seconds) {
            dueDate = new Date(quiz.dueDate.seconds * 1000);
          } else if (quiz.dueDate instanceof Date) {
            dueDate = quiz.dueDate;
          }
          
          if (dueDate && !isNaN(dueDate.getTime())) {
            formattedDate = dueDate.toLocaleDateString();
            isDueDatePassed = new Date() > dueDate;
          } else {
            formattedDate = "Invalid date";
          }
        } catch (e) {
          console.error("Error parsing due date:", e);
          formattedDate = "Error with date";
        }
      }
      
      // Determine status based on attempts and due date
      if (isDueDatePassed) {
        statusClass = "closed";
        statusText = "Closed";
      } else if (hasAttempted) {
        statusClass = "completed";
        statusText = "Completed";
      } else {
        statusClass = "open";
        statusText = "Open";
      }
      
      // Count questions
      const questionCount = quiz.questions && Array.isArray(quiz.questions) ? 
        quiz.questions.length : 0;
      
      // Calculate total points
      const totalPoints = quiz.questions && Array.isArray(quiz.questions) ?
        quiz.questions.reduce((total, q) => total + (q.points || 1), 0) : 0;
      
      // Create quiz item
      const quizItem = document.createElement('div');
      quizItem.className = 'quiz-item';
      
      quizItem.innerHTML = `
        <div class="quiz-details">
          <h4>${quiz.title || "Untitled Quiz"}</h4>
          <div class="quiz-meta">
            <span class="quiz-questions"><i class="fas fa-question-circle"></i> ${questionCount} Questions</span>
            <span class="quiz-points"><i class="fas fa-star"></i> ${totalPoints} Points</span>
            ${quiz.timeLimit ? `<span class="quiz-time"><i class="fas fa-clock"></i> ${quiz.timeLimit} Min</span>` : ''}
            <span class="quiz-due-date"><i class="fas fa-calendar"></i> ${formattedDate}</span>
          </div>
          ${quiz.description ? `<p class="quiz-description">${quiz.description}</p>` : ''}
        </div>
        <div class="quiz-actions">
          <div class="quiz-status ${statusClass}">${statusText}</div>
          <button class="start-quiz-btn" 
                  onclick="startQuiz('${courseId}', '${quiz.id}', ${quiz.fromEmbedded ? 'true' : 'false'}, ${quiz.embeddedIndex || 0})"
                  ${isDueDatePassed && !hasAttempted ? 'disabled' : ''}>
            ${hasAttempted ? "Review Quiz" : "Start Quiz"}
          </button>
        </div>
      `;
      
      quizList.appendChild(quizItem);
    });
    
    quizListContainer.appendChild(quizList);
  }
  
  quizTab.appendChild(quizListContainer);
}


async function submitQuiz(quiz, quizId, courseId, isEmbedded) {
  try {
    console.log(`Submitting quiz ${quizId} for course ${courseId}`);

    const quizForm = document.getElementById("quizForm");
    if (!quizForm) {
      throw new Error("Quiz form not found");
    }

    if (!auth.currentUser) {
      throw new Error("You must be logged in to submit a quiz");
    }

    const userAnswers = [];
    const detailedAnswers = [];
    let score = 0;

    quiz.questions.forEach((question, index) => {
      const selectedInput = quizForm.querySelector(`input[name="q${index}"]:checked`);
      const selectedValue = selectedInput ? selectedInput.value : null;

      let isCorrect = false;
      let correctAnswerText = '';
      let selectedAnswerText = selectedValue === null ? 'No answer' : '';

      if (question.type === 'true-false') {
        isCorrect = selectedValue === question.correctAnswer;
        correctAnswerText = question.correctAnswer;
        selectedAnswerText = selectedValue || 'No answer';
      } else if (question.type === 'multiple-choice') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption) {
          correctAnswerText = correctOption.text;
          if (selectedValue !== null) {
            const selectedOption = question.options[parseInt(selectedValue)];
            selectedAnswerText = selectedOption ? selectedOption.text : 'Invalid option';
            isCorrect = selectedOption?.isCorrect;
          }
        }
      }

      if (isCorrect) {
        score += question.points || 1;
      }

      userAnswers.push({
        questionIndex: index,
        selectedOption: selectedValue,
        isCorrect
      });

      detailedAnswers.push({
        question: question.text || `Question ${index + 1}`,
        selectedAnswer: selectedAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect
      });
    });

    const attemptData = {
      submittedAt: new Date(),
      score,
      totalPoints: quiz.questions.reduce((total, q) => total + (q.points || 1), 0),
      userId: auth.currentUser.uid,
      studentId: auth.currentUser.uid,
      studentName: auth.currentUser.displayName || "Unknown Student", // ✅ match your table
      studentEmail: auth.currentUser.email, // optional if not showing
      timeTaken: typeof quizTimeLeft === 'number' && typeof quizDurationInSeconds === 'number'
          ? quizDurationInSeconds - quizTimeLeft
          : null, // fallback if undefined
      isTimeUp: quizTimeLeft !== null && quizTimeLeft <= 0
  };
  

    console.log("Saving submission with data:", attemptData);

    try {
      if (isEmbedded) {
        // If you want to change this too, do so here
        const submissionRef = collection(db, `courses/${courseId}/embeddedQuizSubmissions`);
        await addDoc(submissionRef, attemptData);
        console.log("Successfully saved embedded quiz submission");
      } else {
        // ✅ Updated path here
        const submissionRef = collection(db, `courses/${courseId}/quizzes/${quizId}/submissions`);
        await addDoc(submissionRef, attemptData);
        console.log("Successfully saved quiz submission");
      }
    } catch (firestoreError) {
      console.error("Firestore error details:", firestoreError);
      if (firestoreError.code === 'permission-denied') {
        throw new Error("Permission denied when saving quiz submission. Contact your instructor if this persists.");
      } else {
        throw firestoreError;
      }
    }

    const quizTab = document.getElementById("quizTab");
    if (quizTab) {
      quizTab.innerHTML = `
        <div class="quiz-result">
            <div class="quiz-header">
                <h2>${quiz.title || "Untitled Quiz"}</h2>
                <div class="quiz-score-section">
                    <div class="score-label">Your Score</div>
                    <div class="score-value">${score}/${attemptData.totalPoints}</div>
                    <div class="submission-time">Submitted: ${new Date().toLocaleString()}</div>
                </div>
            </div>
            
            <h3 class="question-review-header">Question Review</h3>
            <div class="answers-review">
                ${detailedAnswers.map((ans, i) => `
                    <div class="answer-item ${ans.isCorrect ? 'correct' : 'incorrect'}">
                        <div class="question">
                            <strong>Question ${i + 1}:</strong> ${ans.question}
                        </div>
                        <div class="answer-details">
                            <div class="your-answer">
                                Your answer: ${ans.selectedAnswer}
                            </div>
                            <div class="correct-answer">
                                Correct answer: ${ans.correctAnswer}
                            </div>
                            <div class="result-indicator">
                                ${ans.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="quiz-return-btn" onclick="loadCourseQuizzes('${courseId}')">
                Return to Quizzes
            </button>
        </div>
      `;
    }

  } catch (error) {
    console.error("Error submitting quiz:", error);
    alert("Failed to submit quiz: " + error.message);
  }
}


// Call this function after successfully saving the attempt
async function updateQuizWithAttempt(courseId, quizId, score, totalPoints) {
  if (!auth.currentUser) {
      console.error("User not authenticated");
      return false;
  }

  try {
      // Get the current quiz document
      const quizDocRef = doc(db, `courses/${courseId}/quizzes/${quizId}`);
      const quizDoc = await getDoc(quizDocRef);
      
      if (!quizDoc.exists()) {
          console.error("Quiz document doesn't exist");
          return false;
      }
      
      // Create a new attempts object
      const currentData = quizDoc.data();
      const attempts = currentData.attempts || {};
      
      // Update only the current user's attempt
      attempts[auth.currentUser.uid] = {
          score,
          totalPoints,
          timestamp: serverTimestamp(),
          userDisplayName: auth.currentUser.displayName || "Unknown Student"
      };
      
      // Execute the update with just the attempts object
      await updateDoc(quizDocRef, { attempts });
      console.log("Successfully updated quiz document with attempt");
      return true;
  } catch (error) {
      console.error("Error updating quiz with attempt:", error);
      // Check if it's a permission error
      if (error.code === 'permission-denied') {
          console.log("User doesn't have permission to update quiz document");
      }
      return false;
  }
}

// Render the actual quiz content with questions
function renderQuizContent(quiz, quizId, courseId, isCompleted, isEmbedded) {
  const quizTab = document.getElementById("quizTab");
  
  // Check if quiz has questions
  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    quizTab.innerHTML = `
      <div class="quiz-header">
        <h2>${quiz.title || "Untitled Quiz"}</h2>
        <div class="alert alert-warning">
          <p>This quiz does not have any questions.</p>
        </div>
        <button class="quiz-cancel-btn" onclick="loadCourseQuizzes('${courseId}')">
          Back to Quizzes
        </button>
      </div>
    `;
    return;
  }
  
  // Format date nicely if available
  let formattedDate = "No due date";
  if (quiz.dueDate) {
    try {
      if (typeof quiz.dueDate === 'string') {
        formattedDate = new Date(quiz.dueDate).toLocaleDateString();
      } else if (quiz.dueDate.seconds) {
        formattedDate = new Date(quiz.dueDate.seconds * 1000).toLocaleDateString();
      } else if (quiz.dueDate instanceof Date) {
        formattedDate = quiz.dueDate.toLocaleDateString();
      }
    } catch (e) {
      formattedDate = "Invalid date format";
    }
  }
  
  // If quiz is already completed
  if (isCompleted) {
    const userAttempt = quiz.attempts[auth.currentUser.uid];
    const totalPoints = quiz.questions.reduce((total, q) => total + (q.points || 1), 0);
    
    quizTab.innerHTML = `
      <div class="quiz-header">
        <h2>${quiz.title || "Untitled Quiz"}</h2>
        <div class="quiz-meta-row">
          ${quiz.timeLimit ? `<div class="quiz-meta-item"><i class="fas fa-clock"></i> Time Limit: ${quiz.timeLimit} min</div>` : ''}
          <div class="quiz-meta-item"><i class="fas fa-question-circle"></i> Questions: ${quiz.questions.length}</div>
          <div class="quiz-meta-item"><i class="fas fa-star"></i> Total Points: ${totalPoints}</div>
          <div class="quiz-meta-item"><i class="fas fa-calendar"></i> Due: ${formattedDate}</div>
        </div>
      </div>
      <div class="alert alert-info">
        <h4><i class="fas fa-check-circle"></i> Quiz Completed</h4>
        <p>You have already completed this quiz.</p>
        <p>Your score: ${userAttempt.score || 0}/${totalPoints}</p>
        <p>Completed on: ${userAttempt.timestamp ? new Date(userAttempt.timestamp.seconds * 1000).toLocaleString() : 'Unknown'}</p>
      </div>
      <button class="quiz-cancel-btn" onclick="loadCourseQuizzes('${courseId}')">
        Back to Quizzes
      </button>
    `;
    return;
  }
  
  // Calculate total points
  const totalPoints = quiz.questions.reduce((total, q) => total + (q.points || 1), 0);
  
  // Create header part
  let quizHTML = `
    <div class="quiz-header">
      <h2>${quiz.title || "Untitled Quiz"}</h2>
      <div class="quiz-meta-row">
        ${quiz.timeLimit ? `<div class="quiz-meta-item"><i class="fas fa-clock"></i> Time Limit: ${quiz.timeLimit} min</div>` : ''}
        <div class="quiz-meta-item"><i class="fas fa-question-circle"></i> Questions: ${quiz.questions.length}</div>
        <div class="quiz-meta-item"><i class="fas fa-star"></i> Total Points: ${totalPoints}</div>
        <div class="quiz-meta-item"><i class="fas fa-calendar"></i> Due: ${formattedDate}</div>
      </div>
      ${quiz.description ? `<p class="mt-3">${quiz.description}</p>` : ''}
    </div>
    <form id="quizForm">
  `;
  
  // Prepare quiz questions
  quiz.questions.forEach((question, index) => {
    // Safely handle question structure
    if (!question || typeof question !== 'object') {
      console.error(`Invalid question at index ${index}:`, question);
      return; // Skip this question
    }
    
    const questionText = question.text || `Question ${index + 1}`;
    const questionPoints = question.points || 1;
    
    quizHTML += `
      <div class="quiz-question">
        <div class="quiz-question-header">
          <div class="quiz-question-title">Question ${index + 1}</div>
          <div class="quiz-question-points">${questionPoints} point${questionPoints !== 1 ? 's' : ''}</div>
        </div>
        <div class="quiz-question-text">${questionText}</div>
        <div class="quiz-options">
    `;
    
    // Handle different question types
    if (question.type === "true-false") {
      // True-False question
      quizHTML += `
        <div class="quiz-option">
          <input class="form-check-input" type="radio" name="q${index}" value="true" id="q${index}opt0" >
          <label for="q${index}opt0">True</label>
        </div>
        <div class="quiz-option">
          <input class="form-check-input" type="radio" name="q${index}" value="false" id="q${index}opt1" >
          <label for="q${index}opt1">False</label>
        </div>
      `;
    } else if (question.type === "multiple-choice" && question.options && Array.isArray(question.options)) {
      // Multiple choice question
      question.options.forEach((option, optIndex) => {
        // Handle both object format and string format for options
        const optionText = typeof option === 'object' ? option.text : option;
        
        quizHTML += `
          <div class="quiz-option">
            <input class="form-check-input" type="radio" name="q${index}" value="${optIndex}" id="q${index}opt${optIndex}" >
            <label for="q${index}opt${optIndex}">${optionText}</label>
          </div>
        `;
      });
    } else {
      // Unsupported question type
      quizHTML += `<p class="text-danger">Unsupported question type or missing options</p>`;
    }
    
    quizHTML += `
        </div>
      </div>
    `;
  });
  
  // Add action buttons
  quizHTML += `
      <div class="quiz-actions-container">
        <button type="button" class="quiz-cancel-btn" onclick="loadCourseQuizzes('${courseId}')">Cancel</button>
        <button type="submit" class="quiz-submit-btn">Submit Quiz</button>
      </div>
    </form>
  `;
  
  // Render the full quiz
  quizTab.innerHTML = quizHTML;
  
  // Get the form element after rendering
  const quizFormEl = document.getElementById("quizForm");
  
  // Add submit handler
  quizFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Clear timer if it exists
    if (window.currentQuizTimer) {
      clearInterval(window.currentQuizTimer);
    }
    
    // Submit quiz directly without validation
    await submitQuiz(quiz, quizId, courseId, isEmbedded);
  });
  
  if (quiz.timeLimit) {
    // Clear any existing timer
    if (window.currentQuizTimer) {
      clearInterval(window.currentQuizTimer);
    }
    
    // Start new timer
    startQuizTimer(quiz.timeLimit, quizId, courseId);
  }

  // Store quiz data globally
  window.currentQuiz = quiz;
}



// Show loading spinner for quiz operations
function showQuizLoadingSpinner(show) {
  let spinner = document.getElementById("quizLoadingSpinner");
  
  if (show) {
    // Remove existing spinner if present
    if (spinner) {
      spinner.remove();
    }
    
    // Get the quiz tab where we'll show the loading indicator
    const quizTab = document.getElementById("quizTab");
    if (!quizTab) return;
    
    // Clear the tab content except for the header
    const header = quizTab.querySelector('h2');
    const originalContent = quizTab.innerHTML;
    quizTab.innerHTML = '';
    
    if (header) {
      quizTab.appendChild(header);
    } else {
      const newHeader = document.createElement('h2');
      newHeader.textContent = 'Quizzes';
      quizTab.appendChild(newHeader);
    }
    
    // Create loading spinner matching the announcement style
    const loadingSpinner = document.createElement('div');
    loadingSpinner.id = "quizLoadingSpinner";
    loadingSpinner.className = 'announcement-loading';
    loadingSpinner.innerHTML = `
      <div class="spinner"></div>
      <p>Loading quizzes...</p>
    `;
    quizTab.appendChild(loadingSpinner);
    
  } else {
    // Remove the spinner when done loading
    spinner = document.getElementById("quizLoadingSpinner");
    if (spinner) {
      spinner.remove();
    }
  }
}

// Submit a quiz



// Modify showCourseDetails to store courseId for later quiz loading
const originalShowCourseDetails = showCourseDetails;
showCourseDetails = function(course) {
  originalShowCourseDetails(course);
  
  // Store course ID in the courseDetails element for later use
  const courseDetailsElement = document.getElementById("courseDetails");
  if (courseDetailsElement) {
    courseDetailsElement.setAttribute("data-course-id", course.id);
  }
  
  // Add event listener for Quiz tab button
  const tabButtons = document.querySelectorAll(".sidebar-menu button");
  tabButtons.forEach(button => {
    if (button.textContent === "Quiz") {
      button.addEventListener("click", () => {
        loadCourseQuizzes(course.id);
      });
    }
  });
};

// Modify showCourseTab to load quizzes when switching to quiz tab
const originalShowCourseTab = showCourseTab;
showCourseTab = function(tabId) {
  // Call the original function to switch tabs
  originalShowCourseTab(tabId);
  
  // If switching to the quiz tab, load quizzes for the current course
  if (tabId === "quizTab") {
    // Get the course details element to retrieve the courseId
    const courseDetails = document.getElementById("courseDetails");

    // Make sure the courseId is correctly stored in the data attribute
    const courseId = courseDetails.getAttribute("data-course-id");

    if (courseId) {
      // Call the loadCourseQuizzes function and pass the courseId
      loadCourseQuizzes(courseId);
    } else {
      console.error("Course ID not found in course details.");
    }
  }
};
// Initialize tab styles
addTabStyles();



// Add quiz-specific styles
  function addQuizStyles() {
    if (document.getElementById('quiz-styles')) return;

    const style = document.createElement('style');
    style.id = 'quiz-styles';
    style.textContent = `
      :root {
        --primary-color: #FF7849;
        --primary-hover: #E56C3E;
        --bg-light: #f8f9fa;
        --text-dark: #333;
        --text-muted: #666;
        --card-bg: #ffffff;
        --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        --max-content-width: 960px;
      }

      .quiz-list-container {
        margin: 40px auto;
        max-width: var(--max-content-width);
        padding: 0 20px;
        width: 1000PX;
      }

      .quiz-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .quiz-item {
        background-color: var(--card-bg);
        border-radius: 12px;
        box-shadow: var(--card-shadow);
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: transform 0.2s ease, box-shadow 0.3s ease;
      }

      .quiz-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }

      .quiz-details {
        flex: 1;
      }

      .quiz-details h4 {
        margin: 0 0 10px 0;
        font-size: 20px;
        color: var(--text-dark);
      }

      .quiz-meta {
        font-size: 14px;
        color: var(--text-muted);
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }

      .quiz-description {
        color: #555;
        font-size: 15px;
        margin-top: 5px;
      }

      .quiz-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
      }

      .quiz-status {
        padding: 6px 10px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
      }

      .quiz-status.open {
        background-color: #d1e7dd;
        color: #0f5132;
      }

      .quiz-status.completed {
        background-color: #cfe2ff;
        color: #084298;
      }

      .quiz-status.upcoming {
        background-color: #fff3cd;
        color: #664d03;
      }

      .quiz-status.closed {
        background-color: #f8d7da;
        color: #842029;
      }

      .start-quiz-btn {
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 10px 20px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .start-quiz-btn:hover:not(:disabled) {
        background-color: var(--primary-hover);
      }

      .start-quiz-btn:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      .no-quizzes-message {
        text-align: center;
        padding: 40px;
        background-color: var(--bg-light);
        border-radius: 12px;
        font-size: 16px;
        color: #888;
      }

      .quiz-header {
  background: linear-gradient(to right, #fff 50%, #fff5f0 100%);
  padding: 32px;
  margin-bottom: 30px;
  border-radius: 16px;
  max-width: var(--max-content-width);
  margin: 0 auto 30px auto;
  border-left: 6px solid var(--primary-color);
  animation: fadeInDown 0.4s ease-in-out;
}

.quiz-header h2 {
  margin: 0 0 15px;
  font-size: 32px;
  color: var(--text-dark);
}

.quiz-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  font-size: 15px;
  color: var(--text-muted);
}

.quiz-meta-item {
  display: flex;
  align-items: center;
}

.quiz-meta-item i {
  margin-right: 6px;
  color: var(--primary-color);
}

/* Question Box Enhancements */
.quiz-question {
  background-color: white;
  padding: 28px;
  margin-bottom: 30px;
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
  animation: fadeInUp 0.3s ease-in-out;
}

.quiz-question:hover {
  transform: scale(1.01);
}

.quiz-question-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
  padding-bottom: 10px;
}

.quiz-question-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
}

.quiz-question-points {
  font-size: 14px;
  background-color: #f8f9fa;
  padding: 6px 14px;
  border-radius: 30px;
  font-weight: 500;
  color: var(--text-muted);
}

.quiz-question-text {
  font-size: 17px;
  margin-bottom: 24px;
  color: #444;
}

/* Option Cards */
.quiz-options {
  display: grid;
  gap: 16px;
}

.quiz-option {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  padding: 14px 18px;
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
  background-color: #fafafa;
}

.quiz-option:hover {
  background-color: #fff3ec;
  border-color: var(--primary-color);
}

.quiz-option input[type="radio"] {
  margin-right: 14px;
  accent-color: var(--primary-color);
}

.quiz-option label {
  flex: 1;
  font-size: 16px;
  color: #333;
  cursor: pointer;
}

/* Button Section Styling */
.quiz-actions-container {
  display: flex;
  justify-content: space-between;
  margin-top: 50px;
  max-width: var(--max-content-width);
  margin-left: auto;
  margin-right: auto;
  gap: 20px;
}

.quiz-submit-btn,
.quiz-cancel-btn {
  padding: 14px 28px;
  font-size: 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quiz-submit-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(255, 120, 73, 0.3);
}

.quiz-submit-btn:hover {
  background-color: var(--primary-hover);
}

.quiz-cancel-btn {
  background-color: white;
  border: 1px solid #ccc;
  color: #555;
}

.quiz-cancel-btn:hover {
  background-color: #f3f3f3;
}

/* Alert Boxes Upgrade */
.alert {
  padding: 20px 32px;
  border-radius: 14px;
  margin-bottom: 32px;
  max-width: 1200px; /* Wider alert box */
  margin-left: auto;
  margin-right: auto;
  font-size: 17px;
  line-height: 1.6;
  border-left: 6px solid;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); /* Soft shadow */
  background-clip: padding-box;
}

.alert-success {
  background-color: #e6f7f0;
  color: #135c32;
  border-color: #45b881;
}

.alert-info {
  background-color: #e8f8fc;
  color: #075d74;
  border-color: #4dc4eb;
}

.alert-warning {
  background-color: #fff9e5;
  color: #856404;
  border-color: #f4c542;
}

.alert-danger {
  background-color: #fdeceb;
  color: #a94442;
  border-color: #ec7063;
}


/* Animation */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
  
    `;

    document.head.appendChild(style);
  }

  async function submitAssignment(courseId, assignmentId) {
    try {
      const submitBtn = document.querySelector('.submit-btn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
      // Get form elements
      const textSubmission = document.getElementById('submissionText')?.value;
      const fileInput = document.getElementById('submissionFiles');
      const files = fileInput?.files;
  
      // Create submission data
      const submissionData = {
        studentId: auth.currentUser.uid,
        studentEmail: auth.currentUser.email,
        studentName: auth.currentUser.displayName || 'Unknown Student',
        submittedAt: serverTimestamp(),
        textContent: textSubmission || '',
        files: [],
        status: 'submitted'
      };
  
      // Handle file uploads if any
      if (files && files.length > 0) {
        for (const file of files) {
          const storageRef = ref(storage, `submissions/${courseId}/${assignmentId}/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
  
          submissionData.files.push({
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size
          });
        }
      }
  
      // Save submission to Firestore
      const submissionRef = collection(db, 'courses', courseId, 'assignments', assignmentId, 'submissions');
      await addDoc(submissionRef, submissionData);
  
      // Show success message and redirect
      alert('Assignment submitted successfully!');
      loadAssignmentsForStudent(courseId);
  
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Failed to submit assignment: ' + error.message);
      
      // Reset button state
      const submitBtn = document.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Assignment';
      }
    }
  }
// Start a specific quiz
async function startQuiz(courseId, quizId, isEmbedded = false, embeddedIndex = 0) {
  const quizTab = document.getElementById("quizTab");
  
  try {
    showQuizLoadingSpinner(true);
    console.log("Starting quiz:", quizId, "for course:", courseId, "isEmbedded:", isEmbedded);
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error("Please log in to access quizzes");
    }
    
    let quiz = null;
    
    if (isEmbedded) {
      // Get quiz from embedded array in course document
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        throw new Error("Course not found");
      }
      
      const courseData = courseSnap.data();
      
      if (!courseData.quizzes || !Array.isArray(courseData.quizzes) || !courseData.quizzes[embeddedIndex]) {
        throw new Error("Embedded quiz not found");
      }
      
      quiz = courseData.quizzes[embeddedIndex];
      quiz.id = quizId;
      console.log("Retrieved embedded quiz:", quiz);
    } else {
      // Get quiz from subcollection
      const quizDocRef = doc(db, "courses", courseId, "quizzes", quizId);
      const quizSnap = await getDoc(quizDocRef);
      
      if (!quizSnap.exists()) {
        throw new Error("Quiz not found in collection");
      }
      
      quiz = quizSnap.data();
      quiz.id = quizId;
      console.log("Retrieved quiz from subcollection:", quiz);
    }
    
    // Validate and normalize quiz structure
    if (!quiz.questions) {
      quiz.questions = [];
      console.warn("Quiz has no questions, using empty array");
    }
    
    if (!Array.isArray(quiz.questions)) {
      console.warn("Quiz questions is not an array, initializing empty array");
    }
    
    // Check if quiz is already completed by this student
    const userUid = auth.currentUser.uid;
    const isCompleted = quiz.attempts && quiz.attempts[userUid];
    
    // Render quiz content
    renderQuizContent(quiz, quizId, courseId, isCompleted, isEmbedded);
    
  } catch (error) {
    console.error("Error starting quiz:", error);
    
    quizTab.innerHTML = `
      <div class="quiz-header">
        <h2>Quiz Error</h2>
      </div>
      <div class="alert alert-danger">
        <p>${error.message}</p>
        <p>Debug info: Course ID: ${courseId}, Quiz ID: ${quizId}</p>
      </div>
      <button class="quiz-cancel-btn" onclick="loadCourseQuizzes('${courseId}')">
        Back to Quizzes
      </button>
    `;
  } finally {
    showQuizLoadingSpinner(false);
  }
}

async function loadAssignmentsForStudent(courseId) {
  if (!courseId) return;

  const assignmentsTab = document.getElementById('assignmentsTab');
  if (!assignmentsTab) return;

  try {
    addAssignmentStyles();

    assignmentsTab.innerHTML = `
      <h2>Assignments</h2>
      <div class="assignment-loading">
        <div class="spinner"></div>
        <p>Loading assignments...</p>
      </div>
    `;

    const assignmentsRef = collection(db, "courses", courseId, "assignments");
    const assignmentsSnap = await getDocs(assignmentsRef);

    assignmentsTab.innerHTML = '<h2>Assignments</h2>';

    if (assignmentsSnap.empty) {
      assignmentsTab.innerHTML += `<p class="no-assignments">No assignments available yet.</p>`;
      return;
    }

    const list = document.createElement('div');
    list.className = 'assignments-list';

    // Convert snapshot to array and sort by due date (latest first)
    const assignments = [];
    assignmentsSnap.forEach(doc => {
      assignments.push({ id: doc.id, ...doc.data() });
    });

    // Sort assignments by due date (most recent first)
    assignments.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31'); // Far future date for no deadline
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
      
      // If both dates are in the past, show most recently due first
      const now = new Date();
      const bothPast = dateA < now && dateB < now;
      if (bothPast) {
        return dateB - dateA;
      }
      
      // If both dates are in the future or one is in the future,
      // show nearest deadline first
      return dateA - dateB;
    });

    assignments.forEach(assignment => {
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
      const isDeadlinePassed = dueDate ? new Date() > dueDate : false;
      const formattedDueDate = dueDate ? dueDate.toLocaleString() : 'No due date';
      
      const card = document.createElement('div');
      card.className = 'assignment-card';
      card.innerHTML = `
        <div class="assignment-header">
          <h3>${assignment.title || 'Untitled Assignment'}</h3>
          <div class="assignment-points">${assignment.points || 0} Points</div>
        </div>
        <div class="assignment-meta">
          <span><i class="fas fa-calendar"></i> Due: ${formattedDueDate}</span>
          <span><i class="fas fa-file-upload"></i> Type: ${assignment.submissionType}</span>
          ${isDeadlinePassed ? '<span class="deadline-passed"><i class="fas fa-clock"></i> Deadline Passed</span>' : ''}
        </div>
        <p class="assignment-description">${assignment.description || 'No description provided.'}</p>
        
        <div class="assignment-actions">
          <button 
            class="view-details-btn ${isDeadlinePassed ? 'disabled' : ''}" 
            onclick="viewAssignmentDetails('${courseId}', '${assignment.id}')"
            ${isDeadlinePassed ? 'disabled' : ''}
          >
            View Submission
          </button>
        </div>
      `;
      list.appendChild(card);
    });

    assignmentsTab.appendChild(list);

    // Add deadline passed styles
    const deadlineStyles = `
      .deadline-passed {
        color: #dc3545;
        font-weight: 500;
      }

      .view-details-btn.disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .view-details-btn.disabled:hover {
        background: #ccc;
      }
    `;

    if (!document.getElementById('deadline-styles')) {
      const style = document.createElement('style');
      style.id = 'deadline-styles';
      style.textContent = deadlineStyles;
      document.head.appendChild(style);
    }

  } catch (error) {
    console.error("Error loading assignments:", error);
    assignmentsTab.innerHTML = `
      <h2>Assignments</h2>
      <div class="error-message">Failed to load assignments. Please try again later.</div>
    `;
  }
}

// Add function to view assignment details
async function viewAssignmentDetails(courseId, assignmentId) {
  const assignmentsTab = document.getElementById('assignmentsTab');
  
  try {
    // Show loading state
    assignmentsTab.innerHTML = `
      <div class="assignment-loading">
        <div class="spinner"></div>
        <p>Loading assignment details...</p>
      </div>
    `;

    // Fetch assignment details
    const assignmentRef = doc(db, "courses", courseId, "assignments", assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);

    if (!assignmentSnap.exists()) {
      throw new Error("Assignment not found");
    }

    const assignment = assignmentSnap.data();
    console.log("Assignment data:", assignment); // Debug log

    const dueDate = assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No due date';

    // Render the assignment details with file section first
    assignmentsTab.innerHTML = `
      <div class="assignment-details">
        <button class="back-btn" onclick="loadAssignmentsForStudent('${courseId}')">
          <i class="fas fa-arrow-left"></i> Back to Assignments
        </button>
        
        <h2>${assignment.title}</h2>
        
        <div class="details-meta">
          <div class="meta-item">
            <i class="fas fa-calendar"></i>
            <span>Due: ${dueDate}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-star"></i>
            <span>Points: ${assignment.points}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-upload"></i>
            <span>Submission Type: ${assignment.submissionType}</span>
          </div>
        </div>

        <div class="details-section">
          <h3>Instructions</h3>
          <p>${assignment.description || 'No instructions provided.'}</p>
        </div>

        ${assignment.attachments && assignment.attachments.length > 0 ? `
          <div class="details-section">
            <h3>Teacher's Files</h3>
            <div class="attachment-list">
              ${assignment.attachments.map(file => `
                <div class="attachment-card">
                  <div class="attachment-icon">
                    <i class="fas ${getFileIcon(file.type)}"></i>
                  </div>
                  <div class="attachment-info">
                    <div class="attachment-name">${file.name}</div>
                    <div class="attachment-size">${formatFileSize(file.size)}</div>
                  </div>
                  <a href="${file.url}" target="_blank" class="download-btn">
                    <i class="fas fa-download"></i> Download
                  </a>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '<div class="details-section"><p>No files attached to this assignment</p></div>'}

        <div class="details-section">
          <h3>Submit Assignment</h3>
          ${assignment.submissionType === 'text' || assignment.submissionType === 'both' ? `
            <div class="text-submission">
              <textarea id="submissionText" placeholder="Enter your submission text here..." rows="6"></textarea>
            </div>
          ` : ''}
          
          ${assignment.submissionType === 'file' || assignment.submissionType === 'both' ? `
            <div class="file-submission">
              <div class="file-upload-area" id="dropZone">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag & drop files here or click to browse</p>
                <input type="file" id="submissionFiles" multiple class="file-input">
              </div>
              <div id="fileList" class="file-list"></div>
            </div>
          ` : ''}

          <button class="submit-btn" onclick="submitAssignment('${courseId}', '${assignmentId}')">
            Submit Assignment
          </button>
        </div>
      </div>
    `;

  } catch (error) {
    console.error("Error loading assignment details:", error);
    assignmentsTab.innerHTML = `
      <div class="error-message">
        <p>Failed to load assignment details. Please try again later.</p>
        <button class="back-btn" onclick="loadAssignmentsForStudent('${courseId}')">
          Back to Assignments
        </button>
      </div>
    `;
  }
}
function getFileIcon(fileType) {
  if (fileType.includes('pdf')) return 'fa-file-pdf';
  if (fileType.includes('word') || fileType.includes('doc')) return 'fa-file-word';
  if (fileType.includes('image')) return 'fa-file-image';
  return 'fa-file';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add or update the startQuizTimer function
function startQuizTimer(timeLimit, quizId, courseId) {
  // Store quiz data when starting timer
  const currentQuiz = window.currentQuiz;
  
  const timerContainer = document.createElement('div');
  timerContainer.className = 'quiz-timer';
  
  // Insert timer at the top of the quiz form
  const quizForm = document.getElementById('quizForm');
  if (!quizForm) return;
  
  quizForm.insertBefore(timerContainer, quizForm.firstChild);
  
  let timeLeft = timeLimit * 60; // Convert minutes to seconds

  // Add timer styles if not present
  if (!document.getElementById('timer-styles')) {
    const style = document.createElement('style');
    style.id = 'timer-styles';
    style.textContent = `
      .quiz-timer {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: linear-gradient(to right, #ff7043, #ff8a65);
        padding: 15px;
        text-align: center;
        border-radius: 8px;
        margin: 0 0 20px 0;
      }

      .timer-display {
        font-size: 24px;
        font-weight: 600;
        color: white;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
      }

      .timer-warning {
        animation: pulse 1s infinite;
        background: rgba(255, 0, 0, 0.2);
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  const timer = setInterval(async () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    timerContainer.innerHTML = `
      <div class="timer-display ${timeLeft <= 60 ? 'timer-warning' : ''}">
        <i class="fas fa-clock"></i>
        Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}
      </div>
    `;
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      
      // Show time's up message
      const timeUpMessage = document.createElement('div');
      timeUpMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px 40px;
        border-radius: 8px;
        font-size: 24px;
        z-index: 9999;
      `;
      timeUpMessage.textContent = "Time's Up! Submitting quiz...";
      document.body.appendChild(timeUpMessage);
      
      try {
        // Force submit the form
        const form = document.getElementById('quizForm');
        if (form) {
          const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true
          });
          form.dispatchEvent(submitEvent);
        }
      } catch (error) {
        console.error("Error auto-submitting quiz:", error);
        alert("Failed to submit quiz automatically. Please try submitting manually.");
      }
      
      // Remove the message after submission attempt
      setTimeout(() => {
        if (timeUpMessage.parentNode) {
          timeUpMessage.parentNode.removeChild(timeUpMessage);
        }
      }, 2000);
    }
    
    timeLeft--;
  }, 1000);

  // Store timer reference for cleanup
  window.currentQuizTimer = timer;
}

function addAssignmentStyles() {
  if (document.getElementById('assignment-styles')) return;

  const style = document.createElement('style');
  style.id = 'assignment-styles';
  style.textContent = `
  .assignment-details {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .details-header {
      margin-bottom: 30px;
    }

    .back-btn {
      background: #FF7043;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 20px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s ease;
    }

    .back-btn:hover {
      background: #f4511e;
    }

    .details-meta {
      display: flex;
      gap: 30px;
      margin-bottom: 30px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .details-section {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .details-section h3 {
      margin-top: 0;
      color: #333;
      font-size: 18px;
    }

    .attachment-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f8f9fa;
      border-radius: 6px;
      text-decoration: none;
      color: #333;
      transition: all 0.2s ease;
    }

    .attachment-item:hover {
      background: #ff7043;
      color: white;
    }

    .text-submission textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      margin-bottom: 20px;
      resize: vertical;
      min-height: 120px;
      font-family: inherit;
    }

    .file-upload-area {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      cursor: pointer;
      margin-bottom: 20px;
      transition: all 0.2s ease;
    }

    .file-upload-area:hover {
      border-color: #FF7043;
      background: #fff8f6;
    }

    .file-upload-area i {
      font-size: 32px;
      color: #FF7043;
      margin-bottom: 10px;
    }

    .submit-btn {
      background: #FF7043;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      width: 100%;
      transition: background 0.2s ease;
    }

    .submit-btn:hover {
      background: #f4511e;
    }

    /* Additional responsive styles */
    @media (max-width: 768px) {
      .details-meta {
        flex-direction: column;
        gap: 15px;
      }

      .attachment-list {
        flex-direction: column;
      }

      .submit-btn {
        padding: 15px;
      }
    }
   .assignments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  width: 1000px;
  margin: 0 auto;
}

.assignment-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border-left: 4px solid #FF7043;
  width: 100%;
  margin: 0;
  position: relative;
  width: 900px
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.assignment-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.assignment-points {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.assignment-meta {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.assignment-meta i {
  color: #FF7043;
  margin-right: 4px;
}

.assignment-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.view-details-btn {
  background: #FF7043;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.view-details-btn:hover {
  background: #f4511e;
}

.no-assignments {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

.assignment-loading {
  text-align: center;
  padding: 40px;
}

.assignment-loading .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #FF7043;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .assignment-card {
    padding: 16px;
  }
  
  .assignment-meta {
    flex-direction: column;
    gap: 8px;
  }
}
  `;

  document.head.appendChild(style);
}




window.goBackToCourses = goBackToCourses;
window.showCourseTab = showCourseTab;
window.loadCourseQuizzes = loadCourseQuizzes;
window.startQuiz = startQuiz;
window.submitQuiz = submitQuiz;
window.loadAnnouncements = loadAnnouncements;
window.loadLessonsForStudent = loadLessonsForStudent;
window.loadAssignmentsForStudent = loadAssignmentsForStudent;
window.viewAssignmentDetails = viewAssignmentDetails;
// Add this line where you expose other functions to window object
window.submitAssignment = submitAssignment;