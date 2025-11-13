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

  // 3. *** ADDED: Setup event listeners for buttons ***
  setupEventListeners();
});

/**
 * Fetch task details from the backend
 */
async function fetchTaskDetails(requestId) {
  try {
    const response = await fetch(`api_staff_task.php?action=get_task_details&request_id=${requestId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();

    if (result.status === 'success') {
      // 3. Populate the page with data
      initializePageData(result.data);
    } else {
      // --- MODIFICATION START ---
      // Show a user-friendly error card instead of just text
      const container = document.querySelector('.container');
      if (container) {
          container.innerHTML = `
              <div class="header">
                  <img src="assets/images/celestia-logo.png" alt="Logo" class="headerLogo" style="height: 50px; width: 50px;">
                  <div class="hotel-name">The Celestia Hotel</div>
              </div>
              <div class="content" style="padding: 30px;">
                  <div class="task-error-card" style="display: block;">
                      <h2 style="font-size: 1.5rem; color: #d9534f; margin-bottom: 15px;">Task Not Available</h2>
                      <p style="font-size: 1rem; color: #555; margin-bottom: 25px; line-height: 1.5;">
                          ${result.message || 'This task is completed, cancelled, or no longer exists.'}
                      </p>
                  </div>
              </div>
          `;
      } else {
          // Fallback if the .container element isn't found
          document.body.innerHTML = `<h1>Error: ${result.message}</h1>`;
      }
      // --- MODIFICATION END ---
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
  roomValue.textContent = data.RoomNumber || 'N/A';
  roomTypeValue.textContent = data.RoomType || 'N/A';
  dateValue.textContent = data.DateRequested || 'N/A';
  requestTimeValue.textContent = data.TimeRequested || 'N/A';
  statusValue.textContent = data.Status || 'N/A';
  issueTypeValue.textContent = data.IssueType || 'N/A'; 
  
  remarksTextarea.value = data.Remarks || '';
  
  // Set button states based on status
  if (data.Status === 'In Progress') {
    inProgressBtn.disabled = true;
    inProgressBtn.textContent = 'In Progress';
    remarksTextarea.disabled = false; // Make sure remarks can be edited
  } else if (data.Status === 'Completed') {
    inProgressBtn.disabled = true;
    doneBtn.disabled = true;
    inProgressBtn.textContent = 'Task Completed';
    doneBtn.textContent = 'Task Completed';
    remarksTextarea.disabled = true; // Disable remarks if completed
  } else {
    // Pending status
    inProgressBtn.disabled = false;
    remarksTextarea.disabled = false;
  }
}

// ===== *** NEW: EVENT LISTENER SETUP *** =====
function setupEventListeners() {
    // --- "In Progress" Button ---
    inProgressBtn.addEventListener('click', () => {
        console.log('Setting status to In Progress...');
        updateTaskStatus('In Progress');
    });

    // --- "Done" Button (opens modal) ---
    doneBtn.addEventListener('click', () => {
        modalBackdrop.style.display = 'flex'; // Use display flex to show
    });

    // --- Modal "Cancel" Button ---
    modalCancel.addEventListener('click', () => {
        modalBackdrop.style.display = 'none'; // Use display none to hide
    });

    // --- *** FIXED: Modal "Save" Button (completes task) *** ---
    modalSave.addEventListener('click', () => {
        console.log('Setting status to Completed...');
        updateTaskStatus('Completed');
    });

    // --- Modal Backdrop (closes modal) ---
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            modalBackdrop.style.display = 'none'; // Use display none to hide
        }
    });
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
      alert(`✅ Task status updated to ${newStatus}`);
      if (newStatus === 'Completed') {
         modalBackdrop.style.display = 'none'; // Use display none to hide
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