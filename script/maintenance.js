// ===== GLOBAL VARIABLES =====
let currentRequestsData = [];
let currentStaffData = [];
let currentHistoryData = [];
let allRooms = [];
// REMOVED Hotel Asset variables

let filteredRequests = [];
let filteredStaff = [];
let filteredHistory = []; // This will be used by maintenance.history.js
// REMOVED filteredHotelAssets

let selectedStaffId = null;
let currentRoomId = null; // Used for both assigning and editing room status
// *** ADDED: For confirmation modal ***
let confirmCallback = null; 
let selectedIssueTypes = ''; // For the new assign staff workflow

// Pagination State
const paginationState = {
  requests: { currentPage: 1, itemsPerPage: 10 },
  history: { currentPage: 1, itemsPerPage: 10 } // Set to 10 per page
  // REMOVED hotelAssets
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Loaded - Initializing...');
  // Use the new variable names passed from PHP
  currentRequestsData = typeof initialRequestsData !== 'undefined' ? [...initialRequestsData] : [];
  currentStaffData = typeof availableStaffData !== 'undefined' ? [...availableStaffData] : [];
  currentHistoryData = typeof initialHistoryData !== 'undefined' ? [...initialHistoryData] : [];
  allRooms = typeof allRoomsData !== 'undefined' ? [...allRoomsData] : [];
  // REMOVED Hotel Asset data loading

  console.log('Initial Data:', {
    requests: currentRequestsData.length,
    staff: currentStaffData.length,
    history: currentHistoryData.length, 
    rooms: allRooms.length
  });

  loadRequestFiltersFromSession(); 

  populateStaticFilters();
  populateHistoryFilters();
  
  applyRequestFiltersAndRender();
  applyHistoryFiltersAndRender(); 
  
  setupEventListeners();
});

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    const tabBtns = document.querySelectorAll('.tabBtn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        document.querySelectorAll('.tabBtn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tabContent').forEach(content => content.classList.remove('active'));
        btn.classList.add('active');
        const activeTab = document.getElementById(`${tabName}-tab`);
        if (activeTab) activeTab.classList.add('active');
      });
    });

    // --- Request Filters & Actions ---
    document.getElementById('floorFilter')?.addEventListener('change', () => {
        document.getElementById('roomFilter').value = ''; 
        sessionStorage.removeItem('requests_roomFilter'); 
        applyRequestFiltersAndRender();
        saveRequestFiltersToSession(); 
    });
    document.getElementById('roomFilter')?.addEventListener('change', () => {
        applyRequestFiltersAndRender();
        saveRequestFiltersToSession(); 
    });
    document.getElementById('searchInput')?.addEventListener('input', () => {
        applyRequestFiltersAndRender();
        saveRequestFiltersToSession(); 
    });
    document.getElementById('refreshBtn')?.addEventListener('click', resetRequestFilters);
    document.getElementById('downloadBtnRequests')?.addEventListener('click', downloadRequestsPDF); // Now downloads PDF

    // --- History Filters & Actions ---
    document.getElementById('floorFilterHistory')?.addEventListener('change', () => {
        updateHistoryRoomFilterOptions();
        applyHistoryFiltersAndRender(); 
    });
    document.getElementById('roomFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender); 
    document.getElementById('dateFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender); 
    document.getElementById('historySearchInput')?.addEventListener('input', applyHistoryFiltersAndRender); 
    document.getElementById('historyRefreshBtn')?.addEventListener('click', resetHistoryFilters); 
    document.getElementById('historyDownloadBtn')?.addEventListener('click', downloadHistoryPDF); 

    // --- REMOVED Hotel Assets Filters & Actions ---
    
    // --- REMOVED Add/Edit Hotel Asset Modal ---

    // --- MODIFIED: Issue Type Modal (Assign Staff Step 1) ---
    document.getElementById('closeIssueTypeModalBtn')?.addEventListener('click', hideIssueTypeModal);
    document.getElementById('cancelIssueTypeBtn')?.addEventListener('click', hideIssueTypeModal);
    document.getElementById('issueTypeForm')?.addEventListener('submit', handleIssueTypeSubmit);

    // --- NEW: "Select All" logic for Issue Type Modal ---
    const selectAllCheckbox = document.getElementById('issue_select_all');
    const issueTypeForm = document.getElementById('issueTypeForm');
    const issueCheckboxes = issueTypeForm?.querySelectorAll('input[type="checkbox"][name="issueType[]"]');

    selectAllCheckbox?.addEventListener('change', () => {
        issueCheckboxes?.forEach(cb => {
            cb.checked = selectAllCheckbox.checked;
        });
    });

    issueCheckboxes?.forEach(cb => {
        cb.addEventListener('change', () => {
            // If any box is unchecked, uncheck "Select All"
            if (!cb.checked) {
                selectAllCheckbox.checked = false;
            }
            // Check if all boxes are checked
            else if (Array.from(issueCheckboxes).every(box => box.checked)) {
                selectAllCheckbox.checked = true;
            }
        });
    });
    // --- END of "Select All" logic ---

    // --- Staff Modal (Assign Staff Step 2) ---
    document.getElementById('closeStaffModalBtn')?.addEventListener('click', hideStaffModal);
    document.getElementById('cancelStaffBtn')?.addEventListener('click', hideStaffModal);
    document.getElementById('staffModalSearchInput')?.addEventListener('input', filterStaffInModal);
    document.getElementById('confirmStaffAssignBtn')?.addEventListener('click', handleStaffAssign);
    document.getElementById('staffModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) hideStaffModal();
    });

    // --- NEW: Edit Room Status Modal ---
    document.getElementById('closeEditRoomStatusBtn')?.addEventListener('click', hideEditRoomStatusModal);
    document.getElementById('cancelEditRoomStatusBtn')?.addEventListener('click', hideEditRoomStatusModal);
    document.getElementById('editRoomStatusForm')?.addEventListener('submit', handleEditRoomStatusSubmit);

    // --- Success Modal ---
    document.getElementById('closeSuccessBtn')?.addEventListener('click', hideSuccessModal);
    document.getElementById('okaySuccessBtn')?.addEventListener('click', hideSuccessModal);

    // --- *** ADDED: Confirmation Modal listeners (for Cancel button) *** ---
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const confirmModal = document.getElementById('confirmModal');

    confirmActionBtn?.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        hideConfirmModal();
    });
    cancelConfirmBtn?.addEventListener('click', hideConfirmModal);
    confirmModal?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideConfirmModal();
    });
    // --- END: Confirmation Modal listeners ---
    
    // --- REMOVED Delete Modal (for Hotel Assets) ---

    // --- Profile Sidebar & Logout ---
    const profileBtn = document.getElementById('profileBtn');
    const sidebar = document.getElementById('profile-sidebar');
    const closeSidebarBtn = document.getElementById('sidebar-close-btn');
    profileBtn?.addEventListener('click', () => sidebar?.classList.add('active'));
    closeSidebarBtn?.addEventListener('click', () => sidebar?.classList.remove('active'));

    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutBtn = document.getElementById('closeLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    logoutBtn?.addEventListener('click', (e) => { e.preventDefault(); if(logoutModal) logoutModal.style.display = 'flex'; });
    closeLogoutBtn?.addEventListener('click', () => { if(logoutModal) logoutModal.style.display = 'none'; });
    cancelLogoutBtn?.addEventListener('click', () => { if(logoutModal) logoutModal.style.display = 'none'; });
    confirmLogoutBtn?.addEventListener('click', () => { window.location.href = 'logout.php'; });
    logoutModal?.addEventListener('click', (e) => { if (e.target === e.currentTarget) logoutModal.style.display = 'none'; });
}

// ===== FILTER UTILITIES =====
function populateStaticFilters() {
    const floorFilter = document.getElementById('floorFilter');
    const floors = [...new Set(allRooms.map(r => r.floor).filter(f => f))].sort((a, b) => a - b);
    if (floorFilter) {
        const currentValue = floorFilter.value; 
        while (floorFilter.options.length > 1) floorFilter.remove(1);
        floors.forEach(f => {
             const option = document.createElement('option');
             option.value = f;
             option.textContent = f;
             floorFilter.appendChild(option);
        });
        floorFilter.value = currentValue; 
    }
    updateRoomFilterOptions();
}

function populateHistoryFilters() {
    const floorFilterHistory = document.getElementById('floorFilterHistory');
    const floors = [...new Set(currentHistoryData.map(h => h.floor).filter(f => f))].sort((a, b) => a - b);
    if (floorFilterHistory) {
        while (floorFilterHistory.options.length > 1) floorFilterHistory.remove(1);
        floors.forEach(f => {
             const option = document.createElement('option');
             option.value = f;
             option.textContent = f;
             floorFilterHistory.appendChild(option);
        });
    }
    updateHistoryRoomFilterOptions();
}

// REMOVED populateHotelAssetsFilters()

function updateRoomFilterOptions() {
    const floor = document.getElementById('floorFilter')?.value;
    const roomFilter = document.getElementById('roomFilter');
    if (!roomFilter) return;

    const savedRoom = sessionStorage.getItem('requests_roomFilter');

    while (roomFilter.options.length > 1) roomFilter.remove(1);

    const rooms = [...new Set(allRooms
        .filter(r => !floor || r.floor.toString() === floor)
        .map(r => r.room)
    )].sort((a, b) => a - b);

    rooms.forEach(r => {
        const option = document.createElement('option');
        option.value = r;
        option.textContent = r;
        roomFilter.appendChild(option);
    });
    
    if (savedRoom) {
        roomFilter.value = savedRoom;
    }
}

function updateHistoryRoomFilterOptions() {
    const floor = document.getElementById('floorFilterHistory')?.value;
    const roomFilter = document.getElementById('roomFilterHistory');
    if (!roomFilter) return;

    const currentRoom = roomFilter.value;
    while (roomFilter.options.length > 1) roomFilter.remove(1);

    const rooms = [...new Set(currentHistoryData
        .filter(r => !floor || r.floor.toString() === floor)
        .map(r => r.room)
    )].sort((a, b) => a - b);

    rooms.forEach(r => {
        const option = document.createElement('option');
        option.value = r;
        option.textContent = r;
        roomFilter.appendChild(option);
    });
    roomFilter.value = currentRoom;
}


// =============================================
// ===== ISSUE TYPE MODAL FUNCTIONS ====
// =============================================

function showIssueTypeModal(roomId, roomNumber) {
  const modal = document.getElementById('issueTypeModal');
  if (!modal) return;

  document.getElementById('issueTypeRoomId').value = roomId;
  document.getElementById('issueTypeModalRoomNumber').textContent = roomNumber || '---';

  const form = document.getElementById('issueTypeForm');
  form.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  selectedIssueTypes = '';
  modal.style.display = 'flex';
}

function hideIssueTypeModal() {
  const modal = document.getElementById('issueTypeModal');
  if (modal) modal.style.display = 'none';
  document.getElementById('issueTypeRoomId').value = '';
}

function handleIssueTypeSubmit(e) {
  e.preventDefault(); 
  
  const form = document.getElementById('issueTypeForm');
  const selectedCheckboxes = form.querySelectorAll('input[type="checkbox"][name="issueType[]"]:checked');
  const roomId = document.getElementById('issueTypeRoomId').value;
  
  if (selectedCheckboxes.length === 0) {
    alert('Please select at least one issue type.');
    return;
  }
  
  const values = Array.from(selectedCheckboxes).map(cb => cb.value);
  selectedIssueTypes = values.join(', '); // Store in the global variable
  
  hideIssueTypeModal();
  
  if (typeof showStaffModal === 'function') {
      showStaffModal(roomId); 
  } else {
      console.error('showStaffModal function not found. Cannot proceed to step 2.');
  }
}

// =======================================================
// ===== CONFIRMATION MODAL FUNCTIONS (FOR CANCEL) =====
// =======================================================

function showConfirmModal(title, text, onConfirm) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalText').textContent = text;
    
    // Store the confirm callback globally (as defined in listener setup)
    confirmCallback = onConfirm; 
    
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'flex';
}

function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
    confirmCallback = null;
}


// =======================================================
// ===== REQUESTS TAB FUNCTIONS (MOVED FROM requests.js) =====
// =======================================================

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

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No rooms found.</td></tr>'; // Colspan is 8
  } else {
    tbody.innerHTML = paginatedData.map(req => {
        const statusClass = req.status.toLowerCase().replace(/ /g, '-');
        const statusDisplay = req.status;

        let assignButton;
        const status = req.status;

        if (req.staff !== 'Not Assigned') {
            assignButton = `<button class="assignBtn assigned" disabled>${req.staff}</button>`;
        } else if (['Needs Maintenance'].includes(status)) { 
            assignButton = `<button class="assignBtn assign-staff-btn" data-room-id="${req.id}" data-room-number="${req.room}">Assign Staff</button>`;
        } else {
            assignButton = `<button class="assignBtn" data-room-id="${req.id}" disabled>Not Required</button>`;
        }
        
        // *** MODIFIED: Add Cancel button logic ***
        let cancelButton = ''; 
        if (req.status === 'Pending') {
            // Use the RequestID for cancellation
            cancelButton = `<button class="actionIconBtn cancel-request-btn" title="Cancel Request" data-request-id="${req.requestId}">
                                <i class="fas fa-times"></i>
                            </button>`;
        }

        return `
          <tr data-room-id="${req.id}" data-request-id="${req.requestId}" data-room-number="${req.room}" data-status="${req.status}">
            <td>${req.floor ?? 'N/A'}</td>
            <td>${req.room ?? 'N/A'}</td>
            <td>${req.date ?? 'N/A'}</td>
            <td>${req.requestTime ?? 'N/A'}</td>
            <td>${req.lastMaintenance ?? 'N/A'}</td>
            <td><span class="statusBadge ${statusClass}">${statusDisplay}</span></td>
            <td>${assignButton}</td>
            <td class="action-cell">
                <button class="actionIconBtn edit-room-status-btn" title="Edit Room Status">
                    <i class="fas fa-edit"></i>
                </button>
                ${cancelButton} 
            </td>
          </tr>
        `;
    }).join('');

    // Use event delegation for the buttons
    tbody.removeEventListener('click', handleRequestsTableClick); // Prevent duplicate listeners
    tbody.addEventListener('click', handleRequestsTableClick);
  }

  recordCountEl.textContent = filteredRequests.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRequestsTable();
  });
}

// --- Event handler for ALL clicks on Requests table body ---
function handleRequestsTableClick(e) {
    // Assign Staff Button
    const assignBtn = e.target.closest('.assign-staff-btn');
    if (assignBtn && !assignBtn.disabled) {
        const row = assignBtn.closest('tr');
        currentRoomId = row.dataset.roomId; // Set global ID
        const roomNumber = row.dataset.roomNumber; // Get room number
        
        document.getElementById('issueTypeForm').reset();
        selectedIssueTypes = '';
        
        showIssueTypeModal(currentRoomId, roomNumber);
        return;
    }

    // Edit Room Status Button
    const editBtn = e.target.closest('.edit-room-status-btn');
    if (editBtn) {
        const row = editBtn.closest('tr');
        currentRoomId = row.dataset.roomId;
        const roomNumber = row.dataset.roomNumber;
        const status = row.dataset.status;
        
        document.getElementById('editRoomStatusRoomNumber').textContent = roomNumber;
        document.getElementById('editRoomStatusRoomId').value = currentRoomId;
        
        const statusSelect = document.getElementById('editRoomStatusSelect');
        if (status === 'Needs Maintenance') {
            statusSelect.value = 'Needs Maintenance';
        } else {
            statusSelect.value = 'Available';
        }
        
        showEditRoomStatusModal();
        return;
    }
    
    // *** ADDED: Cancel Request Button logic ***
    const cancelBtn = e.target.closest('.cancel-request-btn');
    if (cancelBtn) {
        const requestId = cancelBtn.dataset.requestId;
        // Use the new confirmation modal
        showConfirmModal(
            'Cancel Maintenance Request?',
            'Are you sure you want to cancel this request? This action cannot be undone.',
            () => {
                // This callback function is executed when user clicks "YES, CONFIRM"
                handleCancelRequest(requestId);
            }
        );
        return;
    }
}

// --- Handle Final Staff Assignment ---
async function handleStaffAssign() {
    if (!selectedStaffId || !currentRoomId) {
        alert("Error: Staff or Room ID is missing.");
        return;
    }
    if (!selectedIssueTypes) {
        alert("Error: Maintenance issue type was not selected. Please restart the assignment.");
        return;
    }

    const assignBtn = document.getElementById('confirmStaffAssignBtn');
    assignBtn.disabled = true;
    assignBtn.textContent = 'ASSIGNING...';

    try {
        const payload = {
            action: 'assign_task', // Matches 'assign_task' case
            roomId: currentRoomId,
            staffId: selectedStaffId,
            issueTypes: selectedIssueTypes // Matches 'issueTypes' key (plural)
        };
        
        // This assumes handleApiCall is defined in maintenance.utils.js
        const result = await handleApiCall(payload.action, payload);

        if (result.status === 'success') { 
            const roomInRequests = currentRequestsData.find(room => room.id == currentRoomId);
            if (roomInRequests) {
                roomInRequests.status = 'Pending'; // Set status to pending
                roomInRequests.staff = result.staffName; // Get staff name from response
            }
            
            const staffInList = currentStaffData.find(staff => staff.id == selectedStaffId);
            if (staffInList) {
                staffInList.availability = 'Assigned';
            }
            
            hideStaffModal();
            // *** SYNTAX ERROR FIXED: Changed .message to result.message ***
            showSuccessModal(result.message || 'Task Assigned Successfully!');
            
            // Reload data from server to get all new info (like new RequestID)
            setTimeout(() => {
                 window.location.reload();
            }, 1500); // Reload after 1.5s
            
        } else {
            alert("Failed to assign task: " + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error assigning staff:', error);
        alert("An error occurred. Please try again.");
    } finally {
        assignBtn.disabled = false;
        assignBtn.textContent = 'ASSIGN STAFF';
        selectedIssueTypes = '';
        currentRoomId = null;
    }
}

// --- Handle Edit Room Status Submission ---
async function handleEditRoomStatusSubmit(e) {
    e.preventDefault();
    const roomId = document.getElementById('editRoomStatusRoomId').value;
    const newStatus = document.getElementById('editRoomStatusSelect').value;
    const roomNumber = document.getElementById('editRoomStatusRoomNumber').textContent;
    const submitBtn = document.getElementById('submitEditRoomStatusBtn');

    if (!roomId || !newStatus || !roomNumber) {
        alert("Error: Missing room data.");
        return;
    }
    submitBtn.disabled = true;

    try {
        const payload = {
            action: 'update_status',
            room_number: roomNumber,
            new_status: newStatus
        };

        // This API call goes to 'room_actions.php'
        const response = await fetch('room_actions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (HTTP ${response.status}): ${text}`);
        }

        const result = await response.json();

        if (result.success) { 
            hideEditRoomStatusModal();
            showSuccessModal(result.message || 'Room status updated!');
            
            // Update local data
            const roomInRequests = currentRequestsData.find(room => room.id == roomId);
            if (roomInRequests) {
                roomInRequests.status = newStatus;
                if (newStatus === 'Available') {
                    roomInRequests.staff = 'Not Assigned';
                    roomInRequests.date = 'N/A';
                    roomInRequests.requestTime = 'N/A';
                }
            }
            applyRequestFiltersAndRender(); // Re-render table
        } else {
            alert('Failed to update status: ' + result.message);
        }

    } catch (error) {
        console.error('Error updating room status:', error);
        alert('An error occurred: ' + error.message);
    } finally {
        submitBtn.disabled = false;
    }
}

// *** ADDED: handleCancelRequest function ***
async function handleCancelRequest(requestId) {
    if (!requestId) {
        alert('Error: Request ID is missing.');
        return;
    }

    try {
        const payload = {
            action: 'cancel_task',
            requestId: requestId
        };

        // Assumes handleApiCall is defined in maintenance.utils.js and points to api_maintenance.php
        const result = await handleApiCall(payload.action, payload);

        if (result.status === 'success') {
            hideConfirmModal();
            showSuccessModal(result.message || 'Request cancelled successfully!');
            
            // Reload data from server to reflect all changes (staff status, room status, etc.)
            setTimeout(() => {
                 window.location.reload();
            }, 1500); // Reload after 1.5s

        } else {
            hideConfirmModal();
            alert('Failed to cancel request: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error cancelling request:', error);
        alert('An error occurred. Please try again.');
    }
}


// ===== REQUESTS FILTERING LOGIC =====

// --- Functions to save/load filters to session storage ---
function saveRequestFiltersToSession() {
  const floor = document.getElementById('floorFilter')?.value || '';
  const room = document.getElementById('roomFilter')?.value || '';
  const search = document.getElementById('searchInput')?.value || '';
  
  sessionStorage.setItem('requests_floorFilter', floor);
  sessionStorage.setItem('requests_roomFilter', room);
  sessionStorage.setItem('requests_searchInput', search);
}

function loadRequestFiltersFromSession() {
  const floor = sessionStorage.getItem('requests_floorFilter');
  const search = sessionStorage.getItem('requests_searchInput');

  if (floor) {
    document.getElementById('floorFilter').value = floor;
  }
  if (search) {
    document.getElementById('searchInput').value = search;
  }
}

// --- applyRequestFiltersAndRender ---
function applyRequestFiltersAndRender() {
  // 1. Get filter values *before* updating room options
  const floor = document.getElementById('floorFilter')?.value || '';
  
  // *** FIX: Get the room from the dropdown's *current value*, not session storage ***
  const room = document.getElementById('roomFilter')?.value || ''; 
  
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

  // 2. Populate rooms. This will also set the value from session storage *if* it's the initial load.
  // On change, this will just repopulate the list based on the floor.
  updateRoomFilterOptions(); 
  // After repopulating, we must re-set the room value we just captured
  document.getElementById('roomFilter').value = room;

  // 3. Filter data
  filteredRequests = currentRequestsData.filter(req => {
    const matchFloor = !floor || (req.floor && req.floor.toString() === floor);
    // *** Use the 'room' variable which now holds the correct current value ***
    const matchRoom = !room || (req.room && req.room.toString() === room); 
    const matchSearch = !search || (req.room && req.room.toString().includes(search));
    return matchFloor && matchRoom && matchSearch;
  });

  // 4. Render
  paginationState.requests.currentPage = 1;
  renderRequestsTable();
}

// --- resetRequestFilters ---
function resetRequestFilters() {
    document.getElementById('floorFilter').value = '';
    document.getElementById('roomFilter').value = '';
    document.getElementById('searchInput').value = '';

    sessionStorage.removeItem('requests_floorFilter');
    sessionStorage.removeItem('requests_roomFilter');
    sessionStorage.removeItem('requests_searchInput');

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
        ['Floor', 'Room', 'Date', 'Request Time', 'Last Maintenance', 'Status', 'Staff In Charge']
    ];

    // Map the filtered data
    const bodyData = filteredRequests.map(req => [
        req.floor ?? 'N/A',
        req.room ?? 'N/A',
        req.date ?? 'N/A',
        req.requestTime ?? 'N/A',
        req.lastMaintenance ?? 'N/A',
        req.status ?? 'N/A',
        req.staff ?? 'N/A'
    ]);

    // Add a title
    doc.setFontSize(18);
    doc.text("Maintenance Requests Report", 14, 22);

    // Add the table
    doc.autoTable({
        startY: 30,
        head: headers,
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }, // Blue header
        styles: { fontSize: 8 },
        columnStyles: {
            4: { cellWidth: 30 }, // Last Maintenance
            6: { cellWidth: 30 }  // Staff In Charge
        }
    });

    // Save the PDF
    doc.save('maintenance-requests.pdf');
}