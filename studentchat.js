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
const contactsList = document.querySelector(".contacts-list");
const searchInput = document.querySelector(".contacts-search input");
const hamburgerMenu = document.getElementById("hamburgerMenu");
const sidebar = document.querySelector(".sidebar");

// Default chat ID (will be changed when a course is selected)
let currentChatId = "general-chat";

// Function to toggle sidebar on mobile
if (hamburgerMenu) {
  hamburgerMenu.addEventListener("click", () => {
    sidebar.classList.toggle("show");
  });
}

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
      const welcomeDiv = document.createElement("div");
      welcomeDiv.classList.add("chat-welcome");
      welcomeDiv.innerHTML = `
        <h3>Welcome to the chat for ${courseData.title || 'this course'}</h3>
        <p>This is the beginning of the conversation. Start typing to send a message.</p>
      `;
      messagesContainer.appendChild(welcomeDiv);
    }

    // Scroll to the bottom of the messages container
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
    let sender = "";
    
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

        // Add sender prefix
        sender = lastMessage.senderName ? `${lastMessage.senderName}: ` : "";
      }
    }
    
    // Determine the course class based on subject if available
    let courseClass = "";
    if (courseData.subject) {
      const subject = courseData.subject.toLowerCase();
      if (subject.includes("math")) courseClass = "course-math";
      else if (subject.includes("program") || subject.includes("comput")) courseClass = "course-programming";
      else if (subject.includes("database")) courseClass = "course-database";
      else if (subject.includes("network")) courseClass = "course-networking";
    }
    
    courseItem.innerHTML = `
      <div class="contact-info">
        <h3 class="${courseClass}">${courseData.title || 'Untitled Course'}</h3>
        <p>${sender}${lastMessageText}</p>
        <small>${lastMessageTime || 'No activity'}</small>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching last message:", error);
    courseItem.innerHTML = `
      <div class="contact-info">
        <h3>${courseData.title || 'Untitled Course'}</h3>
        <p>Unable to load messages</p>
        <small>Error</small>
      </div>
    `;
  }
  
  // Add click event to switch to this course's chat
  courseItem.addEventListener("click", () => {
    document.querySelectorAll('.contact-item.active').forEach(item => {
      item.classList.remove('active');
    });
    courseItem.classList.add('active');
    
    chatTitle.textContent = courseData.title || 'Untitled Course';
    loadCourseChat(courseId, courseData);
  });
  
  contactsList.appendChild(courseItem);
  return courseItem;
}

// Function to fetch and display courses the student has access to
async function fetchStudentCourses(studentEmail) {
  try {
    // Clear previous courses
    contactsList.innerHTML = "";
    
    // Query Firestore for all courses
    const coursesCollection = collection(firestore, 'courses');
    const coursesSnapshot = await getDocs(coursesCollection);
    
    let hasAccessToCourses = false;
    let firstCourseItem = null;
    
    // Process courses from Firestore
    for (const doc of coursesSnapshot.docs) {
      const courseId = doc.id;
      const courseData = doc.data();
      
      // Check if the student has access to this course by checking the students array
      // Students are stored as objects with email, joinedAt, and role properties
      if (courseData.students && Array.isArray(courseData.students)) {
        // Find if current student email exists in the students array
        const hasAccess = courseData.students.some(student => {
          return student.email === studentEmail;
        });
        
        if (hasAccess) {
          // Create course item in sidebar
          const courseItem = await addCourseToSidebar(courseId, courseData);
          
          // Save the first course item to select it by default
          if (!firstCourseItem) {
            firstCourseItem = courseItem;
          }
          
          hasAccessToCourses = true;
        }
      }
    }
    
    if (!hasAccessToCourses) {
      // No courses found or no access to any courses
      displayNoCourseAccessMessage();
    } else if (firstCourseItem) {
      // Select the first course by default
      firstCourseItem.click();
    }
  } catch (error) {
    console.error("Error fetching courses from Firestore:", error);
    displayErrorMessage("Error loading courses", error.message);
  }
}

// Helper function to display no course access message
function displayNoCourseAccessMessage() {
  const noCourseDiv = document.createElement("div");
  noCourseDiv.classList.add("contact-item");
  noCourseDiv.innerHTML = `
    <div class="contact-info">
      <h3>No Course Access</h3>
      <p>You haven't been added to any courses yet.</p>
      <small>Contact your teacher for access</small>
    </div>
  `;
  contactsList.appendChild(noCourseDiv);
  
  // Also show a message in the chat area matching your design in Image 1
  chatTitle.textContent = "Mathematics 101"; // Default title
  
  messagesContainer.innerHTML = `
    <div class="chat-welcome">
      <h3>Welcome to EduConnect</h3>
      <p>You haven't been added to any courses yet. Please contact your teacher to get access to course chats.</p>
    </div>
  `;
}

// Helper function to display error message
function displayErrorMessage(title, message) {
  const errorDiv = document.createElement("div");
  errorDiv.classList.add("contact-item");
  errorDiv.innerHTML = `
    <div class="contact-info">
      <h3>${title}</h3>
      <p>${message}</p>
      <small>Error</small>
    </div>
  `;
  contactsList.appendChild(errorDiv);
}

// Implement search functionality
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const courseItems = contactsList.querySelectorAll(".contact-item");
    
    courseItems.forEach(item => {
      const courseTitle = item.querySelector("h3").textContent.toLowerCase();
      const lastMessage = item.querySelector("p").textContent.toLowerCase();
      
      if (courseTitle.includes(searchTerm) || lastMessage.includes(searchTerm)) {
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
    console.log("No user is signed in. Redirecting to login page...");
    alert("Please log in to use chat.");
    window.location.href = "index.html";
    return;
  }

  console.log("User logged in:", user.email);
  
  // Fetch and display student's courses
  fetchStudentCourses(user.email);

  // Sending messages - attach event listeners
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
      senderName: user.displayName || user.email || "Student",
      timestamp: Date.now()
    });

    messageInput.value = ""; // Clear the input after sending
  }
});

// Add CSS for chat welcome message if not already in your CSS
const style = document.createElement('style');
style.textContent = `
.chat-welcome {
  text-align: center;
  padding: 2rem;
  color: #666;
  margin: 2rem auto;
  max-width: 80%;
}

.chat-welcome h3 {
  margin-bottom: 1rem;
  color: #333;
}

.message-sender {
  font-size: 0.8rem;
  
  margin-bottom: 2px;
}

.sidebar.show {
  display: block;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 60px;
  height: calc(100% - 60px);
  width: 250px;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
`;
document.head.appendChild(style);