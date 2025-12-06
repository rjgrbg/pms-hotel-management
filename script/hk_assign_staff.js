// ===== HOUSEKEEPING TASK DETAILS PAGE SCRIPT =====

// --- GLOBALS ---
let CURRENT_TASK_ID = null;

// --- DOM ELEMENTS ---
const elements = {
    taskIdInput: document.getElementById('task-id'),
    roomNumber: document.getElementById('room-number'),
    dateRequested: document.getElementById('date-requested'),
    timeRequested: document.getElementById('time-requested'),
    taskType: document.getElementById('task-type'),
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
    taskContent: document.getElementById('task-content'),
    toast: document.getElementById('toast')
};

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Housekeeping Details page loaded');

  // 1. Get task_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('task_id');

  if (!taskId) {
    showErrorView('Task ID not provided in the URL.', elements);
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
    elements.taskType.textContent = data.TaskType || 'N/A';
    elements.currentStatus.textContent = data.Status || 'N/A';
    elements.remarksTextarea.value = data.Remarks || '';

    // Reset button visibility
    elements.inProgressBtn.style.display = ''; 
    elements.inProgressBtn.disabled = false;
    elements.doneBtn.disabled = false;
    elements.remarksTextarea.disabled = false;

    if (data.Status === 'In Progress') {
        // *** HIDE In Progress button if already In Progress ***
        elements.inProgressBtn.style.display = 'none';
        
    } else if (data.Status === 'Completed') {
        elements.inProgressBtn.disabled = true;
        elements.doneBtn.disabled = true;
        elements.remarksTextarea.disabled = true;
        elements.inProgressBtn.textContent = 'Task Completed';
        elements.inProgressBtn.style.display = ''; // Show disabled button
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

    // --- Success Modal OK Button (Legacy) ---
    if (elements.okaySuccessBtn) {
        elements.okaySuccessBtn.addEventListener('click', () => {
            elements.successModal.style.display = 'none';
        });
    }
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'success') {
    if (!elements.toast) return;

    elements.toast.textContent = message;
    elements.toast.className = `toast toast-${type} toast-visible`;

    setTimeout(() => {
        elements.toast.classList.remove('toast-visible');
    }, 3000);
}

/**
 * Send the status update to the backend
 */
async function updateTaskStatus(newStatus, elements) {
  const taskData = {
    task_id: CURRENT_TASK_ID, 
    status: newStatus,
    remarks: elements.remarksTextarea.value 
  };

  // Disable buttons while processing
  elements.inProgressBtn.disabled = true;
  elements.doneBtn.disabled = true;

  try {
    const response = await fetch('api_hk_task.php', { 
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
      elements.currentStatus.textContent = newStatus;
      
      if (newStatus === 'Completed') {
         elements.modalBackdrop.style.display = 'none';
         elements.remarksTextarea.disabled = true;
         
         setTimeout(() => {
             window.location.reload();
         }, 1500);

      } else if (newStatus === 'In Progress') {
         // *** HIDE In Progress button immediately ***
         elements.inProgressBtn.style.display = 'none'; 
         elements.doneBtn.disabled = false; // Re-enable done button
      }
    } else {
      showToast(`⚠️ Error: ${result.message}`, 'error');
      // Re-enable buttons if error
      elements.inProgressBtn.disabled = false;
      elements.doneBtn.disabled = false;
    }
  } catch (error) {
    console.error('Update task status error:', error);
    showToast('Error: Could not connect to server to update status.', 'error');
    // Re-enable buttons if error
    elements.inProgressBtn.disabled = false;
    elements.doneBtn.disabled = false;
  }
}

// ===== VIEW CONTROLS =====

function showLoadingView(elements) {
    if (elements.taskContent) elements.taskContent.style.display = 'none';
    if (elements.errorState) elements.errorState.style.display = 'none';
    if (elements.loadingState) elements.loadingState.style.display = 'block';
}

function showErrorView(message, elements) {
    if (elements.taskContent) elements.taskContent.style.display = 'none';
    if (elements.loadingState) elements.loadingState.style.display = 'none';
    if (elements.errorMessage) elements.errorMessage.textContent = message;
    if (elements.errorState) elements.errorState.style.display = 'block';
}

function showTaskView(elements) {
    if (elements.loadingState) elements.loadingState.style.display = 'none';
    if (elements.errorState) elements.errorState.style.display = 'none';
    if (elements.taskContent) elements.taskContent.style.display = 'block';
}