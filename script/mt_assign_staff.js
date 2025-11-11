// ===== MAINTENANCE TASK DETAILS PAGE SCRIPT =====

// --- GLOBALS ---
let CURRENT_REQUEST_ID = null;

// --- DOM ELEMENTS ---
const roomValue = document.getElementById('room-value');
const roomTypeValue = document.getElementById('room-type-value');
const dateValue = document.getElementById('date-value');
const requestTimeValue = document.getElementById('request-time-value');
const statusValue = document.getElementById('status-value');

const remarksTextarea = document.querySelector('.remarks-textarea');
const workTypeSelect = document.getElementById('workType');
const unitTypeSelect = document.getElementById('unitType');
const issueTextarea = document.querySelector('.issue-textarea');

const inProgressBtn = document.getElementById('inProgressBtn');
const doneBtn = document.getElementById('doneBtn');

const modalBackdrop = document.getElementById('modalBackdrop');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Maintenance Details page loaded');

  // 1. Get request_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get('request_id');

  if (!requestId) {
    document.body.innerHTML = '<h1>Error: No Request ID provided.</h1>';
    return;
  }

  CURRENT_REQUEST_ID = requestId;
  
  // 2. Fetch task details from API
  fetchTaskDetails(CURRENT_REQUEST_ID);
});

/**
 * Fetch task details from the backend
 */
async function fetchTaskDetails(requestId) {
  try {
    // ===== CHANGED THIS LINE =====
    const response = await fetch(`http://localhost:8000/api_staff_task.php?action=get_task_details&request_id=${requestId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();

    if (result.status === 'success') {
      // 3. Populate the page with data
      initializePageData(result.data);
    } else {
      document.body.innerHTML = `<h1>Error: ${result.message}</h1>`;
    }
  } catch (error) {
    console.error('Error fetching task details:', error);
    document.body.innerHTML = '<h1>Error: Could not load task details.</h1>';
  }
}

/**
 * Fill the HTML fields with data from the API
 */
function initializePageData(data) {
  // --- THESE ARE THE CORRECTED LINES ---
  roomValue.textContent = data.RoomNumber || 'N/A';
  roomTypeValue.textContent = data.RoomType || 'N/A';
  dateValue.textContent = data.DateRequested || 'N/A';
  requestTimeValue.textContent = data.TimeRequested || 'N/A';
  statusValue.textContent = data.Status || 'N/A';
  
  // Set button states based on status
  if (data.Status === 'In Progress') {
    inProgressBtn.disabled = true;
    inProgressBtn.textContent = 'In Progress';
  } else if (data.Status === 'Completed') {
    inProgressBtn.disabled = true;
    doneBtn.disabled = true;
    inProgressBtn.textContent = 'Task Completed';
    doneBtn.textContent = 'Task Completed';
  }
}

// ===== ACTION BUTTONS & MODAL =====

// --- "In Progress" Button ---
inProgressBtn.addEventListener('click', () => {
  console.log('Setting status to In Progress...');
  updateTaskStatus('In Progress');
});

// --- "Done" Button (opens modal) ---
doneBtn.addEventListener('click', () => {
  modalBackdrop.classList.add('active');
});

// --- Modal "Cancel" Button ---
modalCancel.addEventListener('click', () => {
  modalBackdrop.classList.remove('active');
});

// --- Modal "Save" Button (completes task) ---
modalSave.addEventListener('click', () => {
  console.log('Setting status to Completed...');
  
  // Validate that work details are filled
  if (!workTypeSelect.value || !unitTypeSelect.value || !issueTextarea.value) {
    alert('⚠️ Please fill in Work Type, Unit Type, and Issue Description before completing the task.');
    return;
  }
  
  updateTaskStatus('Completed');
});

// --- Modal Backdrop (closes modal) ---
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) {
    modalBackdrop.classList.remove('active');
  }
});

/**
 * Send the status update to the backend
 */
async function updateTaskStatus(newStatus) {
  const taskData = {
    request_id: CURRENT_REQUEST_ID,
    status: newStatus,
    remarks: remarksTextarea.value,
    workType: '',
    unitType: '',
    workDescription: ''
  };

  // If completing, add the extra details
  if (newStatus === 'Completed') {
    taskData.workType = workTypeSelect.value;
    taskData.unitType = unitTypeSelect.value;
    taskData.workDescription = issueTextarea.value;
  }

  try {
    // ===== CHANGED THIS LINE =====
    const response = await fetch('http://localhost:8000/api_staff_task.php', {
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
      alert(`✅ Task status updated to ${newStatus}`);
      if (newStatus === 'Completed') {
         modalBackdrop.classList.remove('active');
      }
      // Reload details to show new status
      fetchTaskDetails(CURRENT_REQUEST_ID); 
    } else {
      alert(`⚠️ Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    alert('Error: Could not connect to server to update status.');
  }
}

// ===== MAINTENANCE CHECKBOX TOGGLE =====
const maintenanceCheck = document.getElementById('maintenanceCheck');
const maintenanceDropdowns = document.getElementById('maintenanceDropdowns');
const issueSection = document.getElementById('issueSection');

maintenanceCheck.addEventListener('change', function() {
  if (this.checked) {
    maintenanceDropdowns.classList.add('active');
    issueSection.classList.add('active');
  } else {
    maintenanceDropdowns.classList.remove('active');
    issueSection.classList.remove('active');
  }
});