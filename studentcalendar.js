// Import Firebase modules at the top of your file
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider 
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { 
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    getDocs 
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// Latest Function

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded");
    
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyDMs8HtwRyimV3UFJAg633dBmOy6KrxT90",
      authDomain: "educonnect-f70d6.firebaseapp.com",
      projectId: "educonnect-f70d6",
      storageBucket: "educonnect-f70d6.appspot.com",
      messagingSenderId: "211587031768",
      appId: "1:211587031768:web:5b406b1647d4a9a9212dad"
    };
  
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const tasksRef = collection(db, 'calendarTasks');
    
    let currentUserId = null;
    const tasks = [];
  
    // Helper to get elements
    function getElement(id) {
      const el = document.getElementById(id);
      if (!el) console.error(`Element with ID '${id}' not found`);
      return el;
    }
  
    // DOM Elements
    const elements = {
      addTaskBtn: getElement('floatingAddBtn'),
      addTaskModal: getElement('addTaskModal'),
      closeTaskModal: getElement('closeTaskModal'),
      cancelTaskForm: getElement('cancelTaskForm'),
      addTaskForm: getElement('addTaskForm'),
      tasksList: getElement('tasksList'),
      prevMonthBtn: getElement('prevMonth'),
      nextMonthBtn: getElement('nextMonth'),
      todayBtn: document.querySelector('.today-button'),
      calendarTitle: getElement('calendarTitle'),
      calendarGrid: getElement('calendarGrid'),
      taskNameInput: getElement('taskName'),
      taskDateInput: getElement('taskDate'),
      taskTimeInput: getElement('taskTime'),
      taskTypeInput: getElement('taskType'),
      taskCourseInput: getElement('taskCourse'),
      taskDescriptionInput: getElement('taskDescription'),
      modalTitle: getElement('addTaskModal')?.querySelector('.modal-title'),
      submitButton: getElement('addTaskForm')?.querySelector('.btn-submit'),
      modalOverlay: getElement('modalOverlay'),
    };
  
    console.log("DOM Elements loaded:", Object.keys(elements).filter(key => !elements[key]).length === 0 ? "All elements found" : "Some elements missing");
  
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let editingTaskId = null;
  
    function initCalendar() {
      console.log("Initializing calendar");
      currentDate = new Date();
      currentMonth = currentDate.getMonth();
      currentYear = currentDate.getFullYear();
      
      setupEventListeners();
      renderCalendar(); // Add this line to render the calendar immediately
    }
  
    function setupEventListeners() {
      console.log("Setting up event listeners");
  
      // Navigation
      elements.prevMonthBtn?.addEventListener('click', () => navigateMonth(-1));
      elements.nextMonthBtn?.addEventListener('click', () => navigateMonth(1));
      elements.todayBtn?.addEventListener('click', goToToday);
  
      // Task modal
      elements.addTaskBtn?.addEventListener('click', () => {
        console.log("Add task button clicked");
        prepareAddTaskModal();
        openTaskModal();
      });
      elements.closeTaskModal?.addEventListener('click', closeTaskModal);
      elements.cancelTaskForm?.addEventListener('click', closeTaskModal);
  
      // Task form
      elements.addTaskForm?.addEventListener('submit', (e) => {
        console.log("Task form submitted");
        addNewTask(e);
      });
  
      // Task list (Edit and Delete buttons)
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
          toggleTaskCompletion(e.target);
        } else if (e.target.classList.contains('task-action-btn')) {
          const action = e.target.textContent;
          const taskId = e.target.closest('.task-item')?.dataset.id;
          if (action === 'Edit' && taskId) prepareEditTaskModal(taskId);
        }
      });

      // Update the event listener for delete buttons
      document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.id;
                if (taskId) {
                    await deleteTask(taskId);
                }
            }
        }
      });
    }
  
    // Add auth state observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("User authenticated:", user.email);
            loadTasks(); // Load tasks when user is authenticated
            loadStudentCourses(user.email); // Load student's courses
        } else {
            currentUserId = null;
            tasks.length = 0; // Clear tasks when user is not authenticated
            console.log("No user authenticated");
            // Clear course options when logged out
            const courseSelect = elements.taskCourseInput;
            courseSelect.innerHTML = '<option value="">Select a course</option>';
        }
        renderCalendar(); // Always render calendar
    });
  
    async function addNewTask(e) {
        e.preventDefault();
        
        // Get the date value and ensure it's handled in local timezone
        const selectedDate = new Date(elements.taskDateInput.value);
        // Adjust for timezone offset
        const offset = selectedDate.getTimezoneOffset();
        selectedDate.setMinutes(selectedDate.getMinutes() + offset);
        
        const task = {
            name: elements.taskNameInput.value.trim(),
            // Format date as YYYY-MM-DD in local timezone
            date: selectedDate.toISOString().split('T')[0],
            time: elements.taskTimeInput.value || "",
            type: elements.taskTypeInput.value,
            course: elements.taskCourseInput.value.trim(),
            description: elements.taskDescriptionInput.value.trim(),
            completed: false,
            userId: auth.currentUser.uid,
            createdAt: new Date().toISOString()
        };

        console.log("Task data:", task);

        // Validate inputs
        if (!task.name) {
            console.warn("Task name missing");
            alert("Task Name is required.");
            elements.taskNameInput.focus();
            return;
        }
        if (!task.date) {
            console.warn("Task date missing");
            alert("Date is required.");
            elements.taskDateInput.focus();
            return;
        }
        if (!task.type) {
            console.warn("Task type missing");
            alert("Task Type is required.");
            elements.taskTypeInput.focus();
            return;
        }
        if (!task.course) {
            console.warn("Task course missing");
            alert("Course is required.");
            elements.taskCourseInput.focus();
            return;
        }

        try {
            const docRef = await addDoc(tasksRef, task);
            console.log("Task added with ID:", docRef.id);
            closeTaskModal();
            
            // Show success notification
            showNotification(`Task "${task.name}" added successfully!`, 'success');
            
        } catch (error) {
            console.error("Error adding task:", error);
            showNotification(`Failed to add task: ${error.message}`, 'error');
        }
    }

    // Add this function to fetch student courses
async function loadStudentCourses(userEmail) {
    if (!userEmail) {
        console.warn('No user email provided for course loading');
        return;
    }

    console.log('Loading courses for:', userEmail);
    
    try {
        const courseRef = collection(db, 'courses');
        // Get all courses
        const querySnapshot = await getDocs(courseRef);
        const courseSelect = elements.taskCourseInput;
        
        if (!courseSelect) {
            console.error('Course select element not found');
            return;
        }

        // Clear existing options
        courseSelect.innerHTML = '<option value="">Select a course</option>';
        
        let coursesFound = 0;
        
        // Filter courses where student is enrolled
        querySnapshot.forEach((doc) => {
            const courseData = doc.data();
            
            // Check if student exists in the students array
            const isEnrolled = courseData.students?.some(student => 
                student.email === userEmail && student.role === 'student'
            );

            if (isEnrolled) {
                console.log('Found enrolled course:', courseData.title);
                
                const option = document.createElement('option');
                option.value = courseData.title;
                option.textContent = `${courseData.title} ${courseData.code || ''}`.trim();
                courseSelect.appendChild(option);
                coursesFound++;
            }
        });

        console.log(`Loaded ${coursesFound} enrolled courses`);

        if (coursesFound === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No courses available";
            option.disabled = true;
            courseSelect.appendChild(option);
        }

    } catch (error) {
        console.error("Error loading courses:", error);
        alert("Failed to load courses. Please try again.");
    }
}

    // Update prepareAddTaskModal to ensure course list is up to date
function prepareAddTaskModal() {
    console.log("Preparing add task modal");
    editingTaskId = null;
    
    elements.addTaskForm?.reset();
    
    const today = new Date().toISOString().split('T')[0];
    elements.taskDateInput.value = today;
    
    // Refresh course list if user is authenticated
    if (auth.currentUser) {
        loadStudentCourses(auth.currentUser.email);
    }
    
    if (elements.modalTitle) {
        elements.modalTitle.textContent = "Add New Task";
    }
    if (elements.submitButton) {
        elements.submitButton.textContent = "Add Task";
    }
}

// Update your setupEventListeners function to use this directly:
elements.addTaskBtn?.addEventListener('click', () => {
    console.log("Add task button clicked");
    prepareAddTaskModal();
    openTaskModal();
});
  
    async function editTask(e) {
      e.preventDefault();
      console.log("editTask called, taskId:", editingTaskId);
  
      if (!currentUserId) {
        console.warn("No authenticated user");
        alert("Please log in to edit a task.");
        return;
      }
  
      if (!editingTaskId) {
        console.error("No task ID for editing");
        alert("No task selected for editing.");
        return;
      }
  
      // Collect updated task data
      const updatedTask = {
        name: elements.taskNameInput.value.trim(),
        date: elements.taskDateInput.value,
        time: elements.taskTimeInput.value || "",
        type: elements.taskTypeInput.value,
        course: elements.taskCourseInput.value.trim(),
        description: elements.taskDescriptionInput.value.trim(),
        completed: tasks.find(t => t.id === editingTaskId).completed,
        userId: currentUserId,
        createdAt: tasks.find(t => t.id === editingTaskId).createdAt
      };
  
      console.log("Updated task data:", updatedTask);
  
      // Validate inputs
      if (!updatedTask.name) {
        console.warn("Task name missing");
        alert("Task Name is required.");
        elements.taskNameInput.focus();
        return;
      }
      if (!updatedTask.date) {
        console.warn("Task date missing");
        alert("Date is required.");
        elements.taskDateInput.focus();
        return;
      }
      if (!updatedTask.type) {
        console.warn("Task type missing");
        alert("Task Type is required.");
        elements.taskTypeInput.focus();
        return;
      }
      if (!updatedTask.course) {
        console.warn("Task course missing");
        alert("Course is required.");
        elements.taskCourseInput.focus();
        return;
      }
  
      try {
        console.log("Updating task in Firestore");
        await updateDoc(doc(db, 'calendarTasks', editingTaskId), updatedTask);
        console.log("Task updated with ID:", editingTaskId);
  
        // Update local tasks array
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
          tasks[taskIndex] = { id: editingTaskId, ...updatedTask };
        }
  
        // Close modal and reset form
        closeTaskModal();
  
        // Re-render tasks and calendar
        renderTasks();
        renderCalendar();
  
        console.log("Task updated successfully");
        showNotification('Task updated successfully!', 'success');
      } catch (error) {
        console.error("Error updating task:", error);
        showNotification(`Failed to update task: ${error.message}`, 'error');
      }
    }
  
    async function deleteTask(taskId) {
        try {
            // Show confirmation dialog
            const confirmDelete = confirm("Are you sure you want to delete this task?");
            if (!confirmDelete) return;

            console.log("Deleting task with ID:", taskId);

            // Delete from Firestore
            const taskRef = doc(db, 'calendarTasks', taskId);
            await deleteDoc(taskRef);

            // Remove from local tasks array
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                tasks.splice(taskIndex, 1);
            }

            // Update UI
            renderTasks();
            renderCalendar();

            // Show success notification
            showNotification('Task deleted successfully', 'success');

        } catch (error) {
            console.error("Error deleting task:", error);
            showNotification('Failed to delete task: ' + error.message, 'error');
        }
    }
  
    async function toggleTaskCompletion(checkbox) {
      const taskItem = checkbox.closest('.task-item');
      const taskId = taskItem?.dataset.id;
      const task = tasks.find(t => t.id === taskId);
  
      if (!task) return;
  
      try {
        await updateDoc(doc(db, 'calendarTasks', taskId), { completed: checkbox.checked });
        task.completed = checkbox.checked;
        renderTasks();
      } catch (error) {
        console.error("Error toggling:", error);
        alert("Failed to toggle: " + error.message);
        checkbox.checked = !checkbox.checked;
      }
    }
  
    function openTaskModal() {
        // Show both modal and overlay
        elements.addTaskModal.style.display = 'block';
        elements.modalOverlay.style.display = 'block';
    }
  
    function closeTaskModal() {
        // Hide both modal and overlay
        elements.addTaskModal.style.display = 'none';
        elements.modalOverlay.style.display = 'none';
        elements.addTaskForm?.reset();
    }
  
    function navigateMonth(direction) {
      currentMonth += direction;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    }
  
    function goToToday() {
      currentDate = new Date();
      currentMonth = currentDate.getMonth();
      currentYear = currentDate.getFullYear();
      renderCalendar();
    }
  
    function loadTasks() {
    if (!auth.currentUser) {
        console.warn("No user authenticated, skipping task load");
        return;
    }

    console.log("Loading tasks for user:", auth.currentUser.uid);
    const q = query(collection(db, 'calendarTasks'), where('userId', '==', auth.currentUser.uid));
    onSnapshot(q, (querySnapshot) => {
        tasks.length = 0;
        querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        console.log("Tasks loaded:", tasks.length);
        renderCalendar();  // Render calendar after loading tasks
        renderTasks();  // Optionally, render a task list as well
    }, (error) => {
        console.error("Error loading tasks:", error);
    });
}
  
    function renderTasks() {
      elements.tasksList.innerHTML = '';
      if (!tasks.length) {
        elements.tasksList.innerHTML = '<li>No tasks available</li>';
        return;
      }
  
      tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task.id;
  
        li.innerHTML = `
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
          <div class="task-content">
            <div class="task-name">${task.name}
              <span class="task-tag tag-${task.type || 'other'}">${capitalize(task.type || 'other')}</span>
            </div>
            <div class="task-details">
              📅 ${task.date} | 📚 ${task.course}
            </div>
          </div>
          <div class="task-actions">
            <button class="task-action-btn edit-btn">Edit</button>
            <button class="task-action-btn delete-btn">Delete</button>
          </div>
        `;
        elements.tasksList.appendChild(li);
      });
    }
  
    function renderCalendar() {
      const calendarTitle = document.getElementById('calendarTitle');
      const calendarGrid = document.getElementById('calendarGrid');
  
      if (!calendarTitle || !calendarGrid) {
          console.error('Calendar elements not found');
          return;
      }
  
      // Set the month and year in the header
      calendarTitle.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
      
      // Clear existing calendar days except headers
      calendarGrid.querySelectorAll('.calendar-day:not(.header)').forEach(el => el.remove());
  
      // Get first day of the month and last day
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const firstDayIndex = firstDayOfMonth.getDay();
      const totalDays = 42; // 6 rows * 7 days
  
      // Create calendar grid
      for (let i = 0; i < totalDays; i++) {
          const dayEl = document.createElement('div');
          dayEl.classList.add('calendar-day');
  
          let date;
          if (i < firstDayIndex) {
              // Previous month days
              date = new Date(currentYear, currentMonth, i - firstDayIndex + 1);
              dayEl.classList.add('other-month');
          } else if (i >= firstDayIndex + lastDayOfMonth.getDate()) {
              // Next month days
              date = new Date(currentYear, currentMonth + 1, i - firstDayIndex - lastDayOfMonth.getDate() + 1);
              dayEl.classList.add('other-month');
          } else {
              // Current month days
              date = new Date(currentYear, currentMonth, i - firstDayIndex + 1);
              if (date.toDateString() === new Date().toDateString()) {
                  dayEl.classList.add('today');
              }
          }
  
          // Add date number
          const dayNum = document.createElement('div');
          dayNum.classList.add('date-number');
          dayNum.textContent = date.getDate();
          dayEl.appendChild(dayNum);
  
          // Add tasks for this date
          const formattedDate = date.toISOString().split('T')[0];  // Format date as YYYY-MM-DD
          const dayTasks = tasks.filter(task => task.date === formattedDate);
  
          // Log task dates and compare
          console.log("Tasks for", formattedDate, dayTasks);
  
          dayTasks.forEach(task => {
              const eventEl = document.createElement('div');
              eventEl.className = `event ${task.type || 'other'}`;
              eventEl.textContent = task.name;
              dayEl.appendChild(eventEl);
          });
  
          calendarGrid.appendChild(dayEl);
      }
  }

    function capitalize(str) {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : 'Other';
    }

    function prepareEditTaskModal(taskId) {
        console.log("Preparing edit task modal for task:", taskId);
        
        // Set editing state
        editingTaskId = taskId;
        
        // Find the task to edit
        const taskToEdit = tasks.find(task => task.id === taskId);
        if (!taskToEdit) {
            console.error('Task not found:', taskId);
            return;
        }
        
        // Update modal title and button text
        if (elements.modalTitle) {
            elements.modalTitle.textContent = "Edit Task";
        }
        if (elements.submitButton) {
            elements.submitButton.textContent = "Save Changes";
        }
        
        // Fill form with task data
        elements.taskNameInput.value = taskToEdit.name || '';
        elements.taskDateInput.value = taskToEdit.date || '';
        elements.taskTimeInput.value = taskToEdit.time || '';
        elements.taskTypeInput.value = taskToEdit.type || 'other';
        elements.taskCourseInput.value = taskToEdit.course || '';
        elements.taskDescriptionInput.value = taskToEdit.description || '';
        
        // Open the modal
        openTaskModal();
    }

// Replace the existing showToast function with this new showNotification function
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
 
// Start the app
initCalendar();
});