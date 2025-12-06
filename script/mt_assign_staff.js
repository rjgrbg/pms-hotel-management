// ===== MAINTENANCE TASK DETAILS PAGE SCRIPT =====

// --- GLOBALS ---
let CURRENT_REQUEST_ID = null;

// --- DOM ELEMENTS ---
const roomValue = document.getElementById('room-value');
const roomTypeValue = document.getElementById('room-type-value');
const dateValue = document.getElementById('date-value');
const requestTimeValue = document.getElementById('request-time-value');
const statusValue = document.getElementById('status-value');
const issueTypeValue = document.getElementById('issue-type-value'); 

const remarksTextarea = document.querySelector('.remarks-textarea');

const inProgressBtn = document.getElementById('inProgressBtn');
const doneBtn = document.getElementById('doneBtn');

const modalBackdrop = document.getElementById('modalBackdrop');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');

const toast = document.getElementById('toast');

// View Containers
const taskContent = document.getElementById('task-content');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Maintenance Details page loaded');

  // 1. Get request_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get('request_id');

  if (!requestId) {
    showErrorView('No Request ID provided in the URL.');
    return;
  }

  CURRENT_REQUEST_ID = requestId;
  
  // 2. Fetch task details from API
  fetchTaskDetails(CURRENT_REQUEST_ID);

  // 3. Setup event listeners
  setupEventListeners();
});

/**
 * Fetch task details from the backend
 */
async function fetchTaskDetails(requestId) {
  showLoadingView();
  try {
    const response = await fetch(`api_staff_task.php?action=get_task_details&request_id=${requestId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();

    if (result.status === 'success') {
      initializePageData(result.data);
      showTaskView();
    } else {
      showErrorView(result.message || 'This task is completed, cancelled, or no longer exists.');
    }
  } catch (error) {
    console.error('Error fetching task details:', error);
    showErrorView('Could not load task details. Please check your connection.');
  }
}

/**
 * Fill the HTML fields with data from the API
 */
function initializePageData(data) {
  roomValue.textContent = data.RoomNumber || 'N/A';
  roomTypeValue.textContent = data.RoomType || 'N/A';
  dateValue.textContent = data.DateRequested || 'N/A';
  requestTimeValue.textContent = data.TimeRequested || 'N/A';
  statusValue.textContent = data.Status || 'N/A';
  issueTypeValue.textContent = data.IssueType || 'N/A'; 
  
  remarksTextarea.value = data.Remarks || '';
  
  // Reset Visibility
  inProgressBtn.style.display = '';
  inProgressBtn.disabled = false;
  doneBtn.disabled = false;
  remarksTextarea.disabled = false;

  // Set button states based on status
  if (data.Status === 'In Progress') {
    // *** HIDE In Progress button if already In Progress ***
    inProgressBtn.style.display = 'none'; 
    
  } else if (data.Status === 'Completed') {
    inProgressBtn.disabled = true;
    doneBtn.disabled = true;
    inProgressBtn.textContent = 'Task Completed';
    doneBtn.textContent = 'Task Completed';
    remarksTextarea.disabled = true; 
    inProgressBtn.style.display = ''; // Show (disabled)
  }
}

// ===== EVENT LISTENER SETUP =====
function setupEventListeners() {
    // --- "In Progress" Button ---
    inProgressBtn.addEventListener('click', () => {
        console.log('Setting status to In Progress...');
        updateTaskStatus('In Progress');
    });

    // --- "Done" Button (opens modal) ---
    doneBtn.addEventListener('click', () => {
        modalBackdrop.style.display = 'flex';
    });

    // --- Modal "Cancel" Button ---
    modalCancel.addEventListener('click', () => {
        modalBackdrop.style.display = 'none';
    });

    // --- Modal "Save" Button (completes task) ---
    modalSave.addEventListener('click', () => {
        console.log('Setting status to Completed...');
        updateTaskStatus('Completed');
    });

    // --- Modal Backdrop (closes modal) ---
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            modalBackdrop.style.display = 'none';
        }
    });
}


/**
 * Show Toast Notification
 */
function showToast(message, type = 'success') {
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast toast-${type} toast-visible`;

    setTimeout(() => {
        toast.classList.remove('toast-visible');
    }, 3000);
}

/**
 * Send the status update to the backend
 */
async function updateTaskStatus(newStatus) {
  const taskData = {
    request_id: CURRENT_REQUEST_ID,
    status: newStatus,
    remarks: remarksTextarea.value 
  };

  try {
    const response = await fetch('api_staff_task.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_task_status',
        data: taskData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 'success') {
      showToast(`✅ Task status updated to ${newStatus}`, 'success');
      
      if (newStatus === 'Completed') {
         modalBackdrop.style.display = 'none';
         setTimeout(() => {
             window.location.reload();
         }, 1500);
      } else {
         // Reload details (which will trigger the hiding logic in initializePageData)
         fetchTaskDetails(CURRENT_REQUEST_ID);
      }
    } else {
      showToast(`⚠️ Error: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    showToast('Error: Could not connect to server to update status.', 'error');
  }
}

// ===== VIEW CONTROLS =====

function showLoadingView() {
    if (taskContent) taskContent.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'block';
}

function showErrorView(message) {
    if (taskContent) taskContent.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';
    if (errorMessage) errorMessage.textContent = message;
    if (errorState) errorState.style.display = 'block';
}

function showTaskView() {
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    if (taskContent) taskContent.style.display = 'block';
}