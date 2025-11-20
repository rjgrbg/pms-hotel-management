// ===== GLOBAL VARIABLES =====
let currentRequestsData = [];
let currentStaffData = [];
let currentHistoryData = [];
let allRooms = [];

let filteredRequests = [];
let filteredStaff = [];
let filteredHistory = []; // This will be used by housekeeping.history.js

let selectedStaffId = null;
let currentRoomId = null; // Used for both assigning and editing room status
let confirmCallback = null; 
let selectedTaskTypes = ''; // For the new assign staff workflow

// Pagination State
const paginationState = {
  requests: { currentPage: 1, itemsPerPage: 10 },
  history: { currentPage: 1, itemsPerPage: 10 }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Loaded - Initializing Housekeeping...');
  // Use the new variable names passed from PHP
  currentRequestsData = typeof initialRequestsData !== 'undefined' ? [...initialRequestsData] : [];
  currentStaffData = typeof availableStaffData !== 'undefined' ? [...availableStaffData] : [];
  currentHistoryData = typeof initialHistoryData !== 'undefined' ? [...initialHistoryData] : [];
  allRooms = typeof allRoomsData !== 'undefined' ? [...allRoomsData] : [];

  console.log('Initial Data:', {
    requests: currentRequestsData.length,
    staff: currentStaffData.length,
    history: currentHistoryData.length,
    rooms: allRooms.length
  });

  // Populate filter dropdowns
  populateFloorFilterOptions();
  populateHistoryFloorFilterOptions();
  updateRoomFilterOptions();
  updateHistoryRoomFilterOptions();

  // Initial render
  applyRequestFiltersAndRender();
  applyHistoryFiltersAndRender();
  
  // ----- TAB NAVIGATION -----
  document.querySelectorAll('.tabBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tabBtn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tabContent').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      // Store the active tab
      sessionStorage.setItem('housekeeping_activeTab', tabId);
    });
  });

  // Restore active tab
  const activeTab = sessionStorage.getItem('housekeeping_activeTab') || 'requests';
  document.querySelector(`.tabBtn[data-tab="${activeTab}"]`).click();

  // ----- SHARED MODAL/PROFILE LISTENERS -----
  setupCommonUIListeners();

  // ----- REQUESTS TAB LISTENERS -----
  setupRequestsTabListeners();

  // ----- HISTORY TAB LISTENERS -----
  setupHistoryTabListeners();
  
  // ----- MODAL-SPECIFIC LISTENERS -----
  
  // Staff Modal
  document.getElementById('staffModalSearchInput')?.addEventListener('input', applyStaffFilterAndRender);
  document.getElementById('closeStaffModalBtn')?.addEventListener('click', hideStaffModal);
  document.getElementById('cancelStaffBtn')?.addEventListener('click', hideStaffModal);
  document.getElementById('confirmStaffAssignBtn')?.addEventListener('click', handleConfirmStaffAssign);

  // Task Type Modal
  document.getElementById('taskTypeForm')?.addEventListener('submit', handleAssignStaff);
  document.getElementById('confirmTaskTypeBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('taskTypeForm').dispatchEvent(new Event('submit'));
  });
  document.getElementById('cancelTaskTypeBtn')?.addEventListener('click', hideTaskTypeModal);
  document.getElementById('closeTaskTypeModalBtn')?.addEventListener('click', hideTaskTypeModal);
  document.getElementById('task_select_all')?.addEventListener('change', (e) => {
      document.querySelectorAll('#taskTypeCheckboxContainer input[type="checkbox"]').forEach(cb => {
          cb.checked = e.target.checked;
      });
  });

  // Edit Room Status Modal
  document.getElementById('editRoomStatusForm')?.addEventListener('submit', submitEditRoomStatus);
  document.getElementById('closeEditRoomStatusBtn')?.addEventListener('click', hideEditRoomStatusModal);
  document.getElementById('cancelEditRoomStatusBtn')?.addEventListener('click', hideEditRoomStatusModal);

  // Confirmation Modal
  document.getElementById('cancelConfirmBtn')?.addEventListener('click', hideConfirmModal);
  document.getElementById('confirmActionBtn')?.addEventListener('click', () => {
    if (typeof confirmCallback === 'function') {
      confirmCallback();
    }
    hideConfirmModal();
  });
  
  // Success Modal
  document.getElementById('closeSuccessBtn')?.addEventListener('click', hideSuccessModal);
  document.getElementById('okaySuccessBtn')?.addEventListener('click', hideSuccessModal);
  
  console.log('Housekeeping Initialization Complete.');
});

// ===== SHARED UI LISTENERS =====
function setupCommonUIListeners() {
  const profileBtn = document.getElementById('profileBtn');
  const sidebar = document.getElementById('profile-sidebar');
  const closeSidebarBtn = document.getElementById('sidebar-close-btn');
  const logoutBtn = document.getElementById('logoutBtn');
  const closeLogoutBtn = document.getElementById('closeLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

  profileBtn?.addEventListener('click', () => sidebar.classList.toggle('active'));
  closeSidebarBtn?.addEventListener('click', () => sidebar.classList.remove('active'));
  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('logoutModal').style.display = 'flex';
  });
  closeLogoutBtn?.addEventListener('click', () => document.getElementById('logoutModal').style.display = 'none');
  cancelLogoutBtn?.addEventListener('click', () => document.getElementById('logoutModal').style.display = 'none');
  confirmLogoutBtn?.addEventListener('click', () => window.location.href = 'logout.php');
  
  // Close sidebar if clicking outside
  document.addEventListener('click', (event) => {
    if (sidebar && !sidebar.contains(event.target) && profileBtn && !profileBtn.contains(event.target)) {
      sidebar.classList.remove('active');
    }
  });
}

// ===== REQUESTS TAB LISTENERS =====
function setupRequestsTabListeners() {
  document.getElementById('floorFilter')?.addEventListener('change', () => {
    updateRoomFilterOptions();
    applyRequestFiltersAndRender();
  });
  document.getElementById('roomFilter')?.addEventListener('change', applyRequestFiltersAndRender);
  document.getElementById('searchInput')?.addEventListener('input', applyRequestFiltersAndRender);
  document.getElementById('refreshBtn')?.addEventListener('click', handleRefreshRequests);
  document.getElementById('downloadBtnRequests')?.addEventListener('click', downloadRequestsPDF);

  // Event delegation for action buttons
  document.getElementById('requestsTableBody')?.addEventListener('click', (e) => {
    if (e.target.closest('.assign-staff-btn')) {
      handleAssignStaffClick(e.target.closest('.assign-staff-btn'));
    }
    if (e.target.closest('.edit-status-btn')) {
      handleEditStatusClick(e.target.closest('.edit-status-btn'));
    }
    if (e.target.closest('.cancel-task-btn')) {
      handleCancelTaskClick(e.target.closest('.cancel-task-btn'));
    }
  });
}

// ===== HISTORY TAB LISTENERS =====
function setupHistoryTabListeners() {
  document.getElementById('floorFilterHistory')?.addEventListener('change', () => {
    updateHistoryRoomFilterOptions();
    applyHistoryFiltersAndRender();
  });
  document.getElementById('roomFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
  document.getElementById('dateFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
  document.getElementById('historySearchInput')?.addEventListener('input', applyHistoryFiltersAndRender);
  document.getElementById('historyRefreshBtn')?.addEventListener('click', handleRefreshHistory);
  document.getElementById('historyDownloadBtn')?.addEventListener('click', downloadHistoryPDF);
}

// ===================================
// ===== REQUESTS TAB FUNCTIONS ======
// ===================================

// ===== RENDER REQUESTS TABLE =====
function renderRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    const recordCountEl = document.getElementById('requestsRecordCount');
    const paginationControlsContainerId = 'requestsPaginationControls';
    const state = paginationState.requests;

    if (!tbody || !recordCountEl) return;

    const totalPages = getTotalPages(filteredRequests.length, state.itemsPerPage);
    if (state.currentPage > totalPages) {
        state.currentPage = Math.max(1, totalPages);
    }
    const paginatedData = paginateData(filteredRequests, state.currentPage, state.itemsPerPage);

    recordCountEl.textContent = filteredRequests.length;

    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No rooms found.</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(req => {
            // 1. Prepare Variables
            const statusClass = req.status.toLowerCase().replace(/\s+/g, '-');
            const status = req.status;

            // 2. Secure Data (Escape HTML)
            const safeFloor = escapeHtml(req.floor ?? 'N/A');
            const safeRoom = escapeHtml(req.room ?? 'N/A');
            const safeDate = escapeHtml(req.date ?? 'N/A');
            const safeTime = escapeHtml(req.requestTime ?? 'N/A');
            const safeLastClean = escapeHtml(req.lastClean ?? 'N/A');
            const safeStatusDisplay = escapeHtml(status);
            const safeStaff = escapeHtml(req.staff); // For display in button

            // 3. Logic for Assign Button
            let assignButton;
            if (req.staff !== 'Not Assigned') {
                assignButton = `<button class="assignBtn assigned" disabled>${safeStaff}</button>`;
            } else if (['Needs Cleaning'].includes(status)) {
                assignButton = `<button class="assignBtn assign-staff-btn" data-room-id="${escapeHtml(req.id)}" data-room-number="${safeRoom}">ASSIGN</button>`;
            } else {
                assignButton = `<button class="assignBtn" disabled>ASSIGN</button>`;
            }

            // 4. Logic for Action Button
            let actionButton;
            if (status === 'Pending') {
                actionButton = `<button class="actionBtn cancel-task-btn" data-task-id="${escapeHtml(req.taskId)}"><i class="fas fa-times"></i></button>`;
            } else if (status === 'Available' || status === 'Needs Cleaning') {
                actionButton = `<button class="actionBtn edit-status-btn" data-room-id="${escapeHtml(req.id)}" data-room-number="${safeRoom}" data-current-status="${escapeHtml(status)}"><i class="fas fa-edit"></i></button>`;
            } else {
                actionButton = `<button class="actionBtn" disabled><i class="fas fa-edit"></i></button>`;
            }

            // 5. Render Row
            return `
                <tr data-room-id="${escapeHtml(req.id)}">
                    <td>${safeFloor}</td>
                    <td>${safeRoom}</td>
                    <td>${safeDate}</td>
                    <td>${safeTime}</td>
                    <td>${safeLastClean}</td>
                    <td><span class="statusBadge ${statusClass}">${safeStatusDisplay}</span></td>
                    <td>${assignButton}</td>
                    <td>${actionButton}</td>
                </tr>
            `;
        }).join('');
    }

    renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
        state.currentPage = page;
        renderRequestsTable();
    });
}
// ===== ACTION HANDLERS (Requests) =====

function handleAssignStaffClick(button) {
  currentRoomId = parseInt(button.dataset.roomId);
  const roomNumber = button.dataset.roomNumber;
  
  // Reset staff modal
  selectedStaffId = null;
  document.getElementById('confirmStaffAssignBtn').disabled = true;
  document.getElementById('staffModalSearchInput').value = '';
  applyStaffFilterAndRender();
  
  // Reset and prep task type modal
  document.getElementById('taskTypeForm').reset();
  document.getElementById('taskTypeModalRoomNumber').textContent = roomNumber;
  document.getElementById('taskTypeRoomId').value = currentRoomId;
  
  showTaskTypeModal(); // Show task type modal first
}

function handleEditStatusClick(button) {
  currentRoomId = parseInt(button.dataset.roomId);
  const roomNumber = button.dataset.roomNumber;
  const currentStatus = button.dataset.currentStatus;

  console.log(`Editing status for Room ${roomNumber} (ID: ${currentRoomId}), current: ${currentStatus}`);

  document.getElementById('editRoomStatusModalTitle').textContent = `Edit Room Status`;
  document.getElementById('editRoomStatusRoomNumber').textContent = roomNumber;
  document.getElementById('editRoomStatusRoomId').value = currentRoomId;
  document.getElementById('editRoomStatusSelect').value = currentStatus;
  
  showEditRoomStatusModal();
}

function handleCancelTaskClick(button) {
  const taskIdToCancel = parseInt(button.dataset.taskId); // MODIFIED
  if (!taskIdToCancel) return;

  console.log(`Attempting to cancel task: ${taskIdToCancel}`);
  
  showConfirmModal(
    'Cancel Task?',
    'Are you sure you want to cancel this pending task?',
    async () => {
      console.log(`Confirmed cancellation for task: ${taskIdToCancel}`);
      try {
        const result = await handleApiCall('cancel_task', { taskId: taskIdToCancel }); // MODIFIED
        if (result.status === 'success') {
          showSuccessModal(result.message || 'Task cancelled successfully.');
          // Refresh data
          const index = currentRequestsData.findIndex(r => r.taskId === taskIdToCancel);
          if (index > -1) {
            // Update local data to reflect cancellation
            currentRequestsData[index].status = 'Available'; // Or 'Needs Cleaning', depending on logic
            currentRequestsData[index].staff = 'Not Assigned';
            currentRequestsData[index].taskId = null;
            currentRequestsData[index].date = 'N/A';
            currentRequestsData[index].requestTime = 'N/A';
          }
          applyRequestFiltersAndRender();
        } else {
          showErrorModal(result.message || 'Failed to cancel task.');
        }
      } catch (error) {
        console.error('Error cancelling task:', error);
        showErrorModal('An error occurred while cancelling the task.');
      }
    }
  );
}

// ===== MODAL SUBMIT HANDLERS (Requests) =====

//
// THIS IS THE CORRECTED FUNCTION
//
async function submitEditRoomStatus(e) {
  e.preventDefault();
  
  // 1. Get the room number from the modal's text element
  const roomNumberEl = document.getElementById('editRoomStatusRoomNumber');
  const roomNumber = roomNumberEl ? roomNumberEl.textContent : ''; 
  
  const newStatus = document.getElementById('editRoomStatusSelect').value;

  if (!roomNumber) {
      alert('Error: Could not find room number.');
      return;
  }

  console.log(`Submitting new status for Room Number ${roomNumber}: ${newStatus}`);
  
  try {
    const response = await fetch('room_actions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 2. Match the backend's 'update_status' handler
        body: JSON.stringify({ 
            action: 'update_status',         // <-- FIX: Match backend action
            room_number: roomNumber,         // <-- FIX: Send room_number
            new_status: newStatus            // <-- FIX: Send new_status
        }) 
    });
    
    const result = await response.json();

    // 3. Check for 'success' boolean, not 'status' string
    if (result.success) {
      hideEditRoomStatusModal();
      showSuccessModal('Room status updated successfully.');
      
      // Update local data
      const index = currentRequestsData.findIndex(r => r.room === roomNumber); // Find by room number
      if (index > -1) {
        currentRequestsData[index].status = newStatus;
        if (newStatus === 'Available') {
            // Clear task-related data if set back to Available
            currentRequestsData[index].staff = 'Not Assigned';
            currentRequestsData[index].taskId = null; // Use 'taskId' for housekeeping
            currentRequestsData[index].date = 'N/A';
            currentRequestsData[index].requestTime = 'N/A';
        }
      }
      applyRequestFiltersAndRender();
      
    } else {
        document.getElementById('editRoomStatusErrorMessage').textContent = result.message || 'An error occurred.';
        showEditRoomStatusModal('error-view');
    }
  } catch (error) {
    console.error('Error updating room status:', error);
    document.getElementById('editRoomStatusErrorMessage').textContent = error.message;
    showEditRoomStatusModal('error-view');
  }
}

async function handleAssignStaff(e) {
  e.preventDefault();
  
  const formData = new FormData(document.getElementById('taskTypeForm'));
  selectedTaskTypes = formData.getAll('taskType[]').join(', '); // MODIFIED

  if (!selectedTaskTypes) {
    alert('Please select at least one task type.');
    return;
  }
  
  console.log(`Task types selected for Room ID ${currentRoomId}: ${selectedTaskTypes}`);
  
  // Hide task modal, show staff modal
  hideTaskTypeModal();
  showStaffModal();
}

// This is called when "ASSIGN STAFF" is clicked in the staff modal
async function handleConfirmStaffAssign() {
  if (!selectedStaffId || !currentRoomId || !selectedTaskTypes) {
    alert('Error: Missing staff, room, or task type information.');
    return;
  }
  
  console.log(`Assigning Staff ${selectedStaffId} to Room ${currentRoomId} for tasks: ${selectedTaskTypes}`);

  try {
    const data = {
      roomId: currentRoomId,
      staffId: selectedStaffId,
      taskTypes: selectedTaskTypes // MODIFIED
    };
    
    const result = await handleApiCall('assign_task', data);

    if (result.status === 'success') {
      hideStaffModal();
      showSuccessModal(result.message || 'Task assigned successfully.');

      // Update local data
      const index = currentRequestsData.findIndex(r => r.id === currentRoomId);
      if (index > -1) {
        currentRequestsData[index].status = 'Pending';
        currentRequestsData[index].staff = result.staffName || 'Assigned'; // Get name from API response
        // In a real app, we'd get the new taskId, date, etc.
        // For now, we'll just reload or refresh filters
      }
      applyRequestFiltersAndRender();
      
      // Also update the staff member's status in the local staff data
      const staffIndex = currentStaffData.findIndex(s => s.id === selectedStaffId);
      if (staffIndex > -1) {
          currentStaffData[staffIndex].availability = 'Assigned';
      }

    } else {
      hideStaffModal();
      showErrorModal(result.message || 'Failed to assign task.');
    }
  } catch (error) {
    console.error('Error assigning task:', error);
    hideStaffModal();
    showErrorModal('An error occurred while assigning the task.');
  } finally {
    // Clear selections
    currentRoomId = null;
    selectedStaffId = null;
    selectedTaskTypes = '';
  }
}

// ===== FILTER & RENDER (REQUESTS) =====
function applyRequestFiltersAndRender() {
  const floor = document.getElementById('floorFilter').value;
  const room = document.getElementById('roomFilter').value;
  const search = document.getElementById('searchInput').value.toLowerCase();

  filteredRequests = currentRequestsData.filter(req => {
    const matchFloor = !floor || (req.floor && req.floor.toString() === floor);
    const matchRoom = !room || (req.room && req.room.toString() === room);
    const matchSearch = !search ||
      (req.room && req.room.toString().includes(search)) ||
      (req.staff && req.staff.toLowerCase().includes(search)) ||
      (req.status && req.status.toLowerCase().includes(search));
    return matchFloor && matchRoom && matchSearch;
  });

  // Sort: 'Needs Cleaning' and 'Pending' first, then by floor/room
  filteredRequests.sort((a, b) => {
    const statusA = a.status.toLowerCase();
    const statusB = b.status.toLowerCase();
    const priority = { 'needs cleaning': 1, 'pending': 2, 'in progress': 3 };

    const priorityA = priority[statusA] || 4;
    const priorityB = priority[statusB] || 4;

    if (priorityA !== priorityB) return priorityA - priorityB;
    if (a.floor !== b.floor) return (a.floor || 0) - (b.floor || 0);
    return (a.room || '').localeCompare(b.room || '', undefined, { numeric: true });
  });

  renderRequestsTable();
}

// ===== REFRESH & DOWNLOAD (REQUESTS) =====
function handleRefreshRequests() {
  // In a real app, this would fetch from the server.
  // For now, we just reset filters and re-render.
  console.log("Refreshing requests data...");
  document.getElementById('floorFilter').value = '';
  document.getElementById('roomFilter').value = '';
  document.getElementById('searchInput').value = '';

  updateRoomFilterOptions(); // Must update rooms after clearing filters
  applyRequestFiltersAndRender();
}

// ===== REQUESTS PDF DOWNLOAD =====
function downloadRequestsPDF() {
  if (filteredRequests.length === 0) {
    alert("No request data to export based on current filters.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Define the headers
  const headers = [
    ['Floor', 'Room', 'Date', 'Request Time', 'Last Clean', 'Status', 'Staff In Charge']
  ];

  // Map the filtered data
  const bodyData = filteredRequests.map(req => [
    req.floor ?? 'N/A',
    req.room ?? 'N/A',
    req.date ?? 'N/A',
    req.requestTime ?? 'N/A',
    req.lastClean ?? 'N/A', // Changed
    req.status ?? 'N/A',
    req.staff ?? 'N/A'
  ]);

  // Add a title
  doc.setFontSize(18);
  doc.text("Housekeeping Requests Report", 14, 22); // Changed

  // Add the table
  doc.autoTable({
    startY: 30,
    head: headers,
    body: bodyData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] }, // Example color
  });

  doc.save(`housekeeping-requests-${new Date().toISOString().split('T')[0]}.pdf`); // Changed
}