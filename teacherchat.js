// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  get,
  orderByChild,
  limitToLast,
  query as rtdbQuery
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDMs8HtwRyimV3UFJAg633dBmOy6KrxT90",
  authDomain: "educonnect-f70d6.firebaseapp.com",
  projectId: "educonnect-f70d6",
  storageBucket: "educonnect-f70d6.appspot.com",
  messagingSenderId: "211587031768",
  appId: "1:211587031768:web:5b406b1647d4a9a9212dad",
  measurementId: "G-WL4FBT24W3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const firestore = getFirestore(app);

// UI Elements
const messagesContainer = document.querySelector(".messages-container");
const sendBtn = document.querySelector(".send-button");
const messageInput = document.querySelector(".compose-input");
const chatTitle = document.querySelector(".chat-title");
const coursesList = document.getElementById("courses-list");
const searchInput = document.getElementById("search-courses");
const newChatButton = document.getElementById("new-chat-button");

// Default chat ID (will be changed when a course is selected)
let currentChatId = "teacher-chat";

// Function to load and display a specific course chat
function loadCourseChat(courseId, courseData) {
  // Update current chat ID
  currentChatId = `course-chat-${courseId}`;
  
  // Clear previous messages
  messagesContainer.innerHTML = "";
  
  // Get reference to this course's chat messages
  const messagesRef = ref(db, 'chats/' + currentChatId + '/messages');
  
  // Remove any existing listeners
  if (window.currentMessagesListener) {
    window.currentMessagesListener();
  }
  
  // Create new listener for this chat
  window.currentMessagesListener = onValue(messagesRef, snapshot => {
    messagesContainer.innerHTML = ""; // Clear messages
    
    let hasMessages = false;
    snapshot.forEach(childSnapshot => {
      const messageData = childSnapshot.val();
      renderMessage(messageData, auth.currentUser.uid);
      hasMessages = true;
    });
    
    // Show welcome message if this is a new chat
    if (!hasMessages) {
      const spinnerDiv = document.createElement("div");
      spinnerDiv.classList.add("messages-loading");
      spinnerDiv.innerHTML = `
          <div class="loading-spinner-container">
              <div class="loading-spinner"></div>
              <p>Loading messages...</p>
          </div>
      `;
      messagesContainer.appendChild(spinnerDiv);
  }
  });
}

// Function to render a message
function renderMessage(data, currentUserId) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.classList.add(data.senderId === currentUserId ? "outgoing" : "incoming");

  // Add sender name if available (for group chats)
  const senderInfo = data.senderName ? `<div class="message-sender">${data.senderName}</div>` : '';
  
  messageDiv.innerHTML = `
    ${senderInfo}
    <div class="message-content">${data.text}</div>
    <span class="message-time">${new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to add a course to the sidebar with last message
async function addCourseToSidebar(courseId, courseData) {
  const courseItem = document.createElement("div");
  courseItem.classList.add("contact-item");
  
  // Get the last message for this course
  const chatId = `course-chat-${courseId}`;
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  const lastMessageQuery = rtdbQuery(messagesRef, orderByChild('timestamp'), limitToLast(1));
  
  try {
    const snapshot = await get(lastMessageQuery);
    let lastMessageText = "No messages yet";
    let lastMessageTime = "";
    
    if (snapshot.exists()) {
      const lastMessage = Object.values(snapshot.val())[0];
      if (lastMessage && lastMessage.text) {
        lastMessageText = lastMessage.text.length > 30 
          ? lastMessage.text.substring(0, 30) + "..."
          : lastMessage.text;
        
        lastMessageTime = new Date(lastMessage.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    
    courseItem.innerHTML = `
      <div class="contact-info">
        <h3>${courseData.title || 'Untitled Course'}</h3>
        <div class="course-code">${courseData.courseCode || ''}</div>
        <p class="last-message">${lastMessageText}</p>
        <small class="message-time">${lastMessageTime}</small>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching last message:", error);
    courseItem.innerHTML = `
      <div class="contact-info">
        <h3>${courseData.title || 'Untitled Course'}</h3>
        <div class="course-code">${courseData.courseCode || ''}</div>
        <p class="last-message">Unable to load messages</p>
      </div>
    `;
  }
  
  // Add click event to switch to this course's chat
  courseItem.addEventListener("click", () => {
    document.querySelectorAll('.contact-item.active').forEach(item => {
      item.classList.remove('active');
    });
    courseItem.classList.add('active');
    
    chatTitle.textContent = `${courseData.name || courseData.title || 'Untitled Course'}`;
    loadCourseChat(courseId, courseData);
  });
  
  coursesList.appendChild(courseItem);
  return courseItem; // Return the created element
}

// Function to fetch and display courses created by the teacher
async function fetchTeacherCourses(teacherId) {
  try {
    // Clear previous courses and show loading spinner
    coursesList.innerHTML = `
      <div class="loading-spinner-container">
        <div class="loading-spinner"></div>
        <p>Loading courses...</p>
      </div>
    `;
    
    if (!teacherId) {
      console.error("No teacher ID provided");
      displayNoCoursesMessage();
      return;
    }

    // Query Firestore for courses
    const coursesCollection = collection(firestore, 'courses');
    const teacherCoursesQuery = query(coursesCollection, where('teacherId', '==', teacherId));
    
    const querySnapshot = await getDocs(teacherCoursesQuery);
    
    // Clear the loading spinner
    coursesList.innerHTML = "";
    
    if (!querySnapshot.empty) {
      let firstCourse = null;
      let firstCourseElement = null;

      for (const doc of querySnapshot.docs) {
        const courseData = doc.data();
        
        // Ensure courseData has required properties
        if (!courseData) continue;
        
        const courseId = doc.id;
        courseData.id = courseId; // Add ID to courseData
        
        try {
          const courseElement = await addCourseToSidebar(courseId, courseData);
          
          // Store first course info
          if (!firstCourse) {
            firstCourse = { id: courseId, data: courseData };
            firstCourseElement = courseElement;
          }
        } catch (error) {
          console.error(`Error adding course ${courseId} to sidebar:`, error);
        }
      }

      // Auto-select first course if available
      if (firstCourse && firstCourseElement) {
        firstCourseElement.classList.add('active');
        chatTitle.textContent = firstCourse.data.title || 'Untitled Course';
        loadCourseChat(firstCourse.id, firstCourse.data);
      } else {
        displayNoCoursesMessage();
      }
    } else {
      displayNoCoursesMessage();
    }
  } catch (error) {
    coursesList.innerHTML = ""; // Clear loading spinner
    console.error("Error fetching courses:", error);
    const errorMessage = error.message || "Unknown error occurred";
    displayPermissionErrorMessage(errorMessage);
  }
}

// Helper function to display no courses message
function displayNoCoursesMessage() {
  const noCoursesDiv = document.createElement("div");
  noCoursesDiv.classList.add("contact-item");
  noCoursesDiv.innerHTML = `
    <div class="contact-info">
      <h3>No courses found</h3>
      <p>You haven't created any courses yet.</p>
    </div>
  `;
  coursesList.appendChild(noCoursesDiv);
}

// Helper function to display permission error message
function displayPermissionErrorMessage(errorMessage) {
  const errorDiv = document.createElement("div");
  errorDiv.classList.add("contact-item");
  errorDiv.innerHTML = `
    <div class="contact-info">
      <h3>Permission Error</h3>
      <p>${errorMessage}</p>
      <p><strong>For developers:</strong> Update Firebase security rules to allow course access.</p>
    </div>
  `;
  coursesList.appendChild(errorDiv);
}

// Implement search functionality
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const courseItems = coursesList.querySelectorAll(".contact-item");
    
    courseItems.forEach(item => {
      const courseTitle = item.querySelector("h3").textContent.toLowerCase();
      const courseCode = item.querySelector("p").textContent.toLowerCase();
      
      if (courseTitle.includes(searchTerm) || courseCode.includes(searchTerm)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  });
}



// Auth and listener logic
onAuthStateChanged(auth, user => {
  if (!user) {
    alert("Please log in to use chat.");
    window.location.href = "index.html";
    return;
  }

  chatTitle.textContent = "Teacher Dashboard";
  
  // Fetch and display teacher's courses
  fetchTeacherCourses(user.uid);

  // Load the general teacher chat initially
  const initialChatData = {
    name: "General Teacher Chat",
    description: "Default communication channel"
  };
  loadCourseChat("general", initialChatData);

  // Sending messages - attach event listeners once
  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  function sendMessage() {
    const text = messageInput.value.trim();
    if (text === "") return;

    // Use the current active chat ID
    const messagesRef = ref(db, 'chats/' + currentChatId + '/messages');
    const newMessageRef = push(messagesRef);
    
    set(newMessageRef, {
      text: text,
      senderId: user.uid,
      senderName: user.displayName || user.email || "Teacher",
      timestamp: Date.now()
    });

    messageInput.value = ""; // Clear the input after sending
  }
});