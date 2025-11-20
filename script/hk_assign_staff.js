// ===== HOUSEKEEPING TASK DETAILS PAGE SCRIPT =====

// --- GLOBALS ---
let CURRENT_TASK_ID = null; // MODIFIED

// --- DOM ELEMENTS ---
// Assumes hk_assign_staff.html uses the same IDs as mt_assign_staff.html
const roomValue = document.getElementById('room-value');
const roomTypeValue = document.getElementById('room-type-value');
const dateValue = document.getElementById('date-value');
const requestTimeValue = document.getElementById('request-time-value');
const statusValue = document.getElementById('status-value');
const issueTypeValue = document.getElementById('issue-type-value'); // This ID should be in your HTML, e.g., "task-type-value"

const remarksTextarea = document.querySelector('.remarks-textarea');

const inProgressBtn = document.getElementById('inProgressBtn');
const doneBtn = document.getElementById('doneBtn');

const modalBackdrop = document.getElementById('modalBackdrop');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');

// --- NEW: Get all elements from your new HTML structure ---
const elements = {
    taskIdInput: document.getElementById('task-id'),
    roomNumber: document.getElementById('room-number'),
    dateRequested: document.getElementById('date-requested'),
    timeRequested: document.getElementById('time-requested'),
    taskType: document.getElementById('task-type'), // MODIFIED
    currentStatus: document.getElementById('current-status'),
    remarksTextarea: document.getElementById('remarks-textarea'),
    inProgressBtn: document.getElementById('inProgressBtn'),
    doneBtn: document.getElementById('doneBtn'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    modalCancel: document.getElementById('modalCancel'),
    modalSave: document.getElementById('modalSave'),
    successModal: document.getElementById('successModal'),
    okaySuccessBtn: document.getElementById('okaySuccessBtn'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    taskContent: document.getElementById('task-content')
};

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Housekeeping Details page loaded');

  // 1. Get task_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('task_id'); // MODIFIED

  if (!taskId) {
    showErrorView('Task ID not provided in the URL.', elements); // MODIFIED
    return;
  }

  CURRENT_TASK_ID = taskId;
  elements.taskIdInput.value = taskId;
  
  // 2. Fetch task details from API
  fetchTaskDetails(CURRENT_TASK_ID, elements);
  
  // 3. Add Event Listeners
  addEventListeners(elements);
});

/**
 * Fetch task details from the new housekeeping API
 */
async function fetchTaskDetails(taskId, elements) {
    showLoadingView(elements);
    try {
        // MODIFIED: API path and parameter
        const response = await fetch(`api_hk_task.php?action=get_task_details&task_id=${taskId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();

        if (result.status === 'success') {
            populateTaskDetails(result.data, elements);
            showTaskView(elements);
        } else {
            showErrorView(result.message || 'Could not load task details.', elements);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showErrorView('An error occurred while fetching task details.', elements);
    }
}

/**
 * Populate the HTML with data from the API
 */
function populateTaskDetails(data, elements) {
    elements.roomNumber.textContent = data.RoomNumber || 'N/A';
    elements.dateRequested.textContent = data.DateRequested || 'N/A';
    elements.timeRequested.textContent = data.TimeRequested || 'N/A';
    elements.taskType.textContent = data.TaskType || 'N/A'; // MODIFIED
    elements.currentStatus.textContent = data.Status || 'N/A';
    elements.remarksTextarea.value = data.Remarks || '';

    if (data.Status === 'In Progress') {
        elements.inProgressBtn.disabled = true;
        elements.inProgressBtn.textContent = 'In Progress';
    } else if (data.Status === 'Completed') {
        elements.inProgressBtn.disabled = true;
        elements.doneBtn.disabled = true;
        elements.remarksTextarea.disabled = true;
    }
}

/**
 * Add listeners for all buttons and modals
 */
function addEventListeners(elements) {
    // --- In Progress Button ---
    elements.inProgressBtn.addEventListener('click', () => {
        console.log('Setting status to In Progress...');
        updateTaskStatus('In Progress', elements);
    });

    // --- Done Button (opens modal) ---
    elements.doneBtn.addEventListener('click', () => {
        elements.modalBackdrop.style.display = 'flex';
    });

    // --- Modal Cancel Button ---
    elements.modalCancel.addEventListener('click', () => {
        elements.modalBackdrop.style.display = 'none';
    });

    // --- Modal Save Button (marks as Done) ---
    elements.modalSave.addEventListener('click', () => {
        console.log('Setting status to Completed...');
        updateTaskStatus('Completed', elements);
    });

    // --- Modal Backdrop (closes modal) ---
    elements.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.modalBackdrop) {
            elements.modalBackdrop.style.display = 'none';
        }
    });

    // --- Success Modal OK Button ---
    elements.okaySuccessBtn.addEventListener('click', () => {
        elements.successModal.style.display = 'none';
        if (elements.currentStatus.textContent === 'Completed') {
            // Optional: Close window or redirect
            // window.close();
        }
    });
}


/**
 * Send the status update to the backend
 */
async function updateTaskStatus(newStatus, elements) {
  const taskData = {
    task_id: CURRENT_TASK_ID, // MODIFIED
    status: newStatus,
    remarks: elements.remarksTextarea.value 
  };

  // Disable buttons
  elements.inProgressBtn.disabled = true;
  elements.doneBtn.disabled = true;

  try {
    const response = await fetch('api_hk_task.php', { // MODIFIED
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
      elements.successModal.style.display = 'flex';
      elements.currentStatus.textContent = newStatus;
      
      if (newStatus === 'Completed') {
         elements.modalBackdrop.style.display = 'none';
         elements.remarksTextarea.disabled = true;
      } else if (newStatus === 'In Progress') {
         elements.inProgressBtn.textContent = 'In Progress';
         elements.doneBtn.disabled = false; // Re-enable done button
      }
    } else {
      alert(`Error: ${result.message}`);
      // Re-enable buttons if error
      elements.inProgressBtn.disabled = (newStatus === 'In Progress');
      elements.doneBtn.disabled = false;
    }
  } catch (error) {
    console.error('Update task status error:', error);
    alert('An error occurred while updating the status.');
    // Re-enable buttons if error
    elements.inProgressBtn.disabled = (newStatus === 'In Progress');
    elements.doneBtn.disabled = false;
  }
}

// ===== VIEW CONTROLS =====

function showLoadingView(elements) {
    elements.taskContent.style.display = 'none';
    elements.errorState.style.display = 'none';
    elements.loadingState.style.display = 'block';
}

function showErrorView(message, elements) {
    elements.taskContent.style.display = 'none';
    elements.loadingState.style.display = 'none';
    elements.errorMessage.textContent = message;
    elements.errorState.style.display = 'block';
}

function showTaskView(elements) {
    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'none';
    elements.taskContent.style.display = 'block';
}