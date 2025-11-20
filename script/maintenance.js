// ===== GLOBAL VARIABLES =====
let currentRequestsData = [];
let currentStaffData = [];
let currentHistoryData = [];
let allRooms = [];

let filteredRequests = [];
let filteredStaff = [];
let filteredHistory = [];

let selectedStaffId = null;
let currentRoomId = null;
let confirmCallback = null; 
let selectedIssueTypes = ''; 

// Pagination State
const paginationState = {
  requests: { currentPage: 1, itemsPerPage: 10 },
  history: { currentPage: 1, itemsPerPage: 10 }
};

// --- INJECT TOAST CSS ---
const maintToastStyle = document.createElement("style");
maintToastStyle.textContent = `
    .toast-success {
        position: fixed; top: 20px; right: 20px; background-color: #28a745; color: white;
        padding: 12px 24px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        z-index: 99999; font-family: 'Segoe UI', sans-serif; font-size: 14px;
        opacity: 0; transform: translateY(-20px); transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
    }
    .toast-visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(maintToastStyle);

// --- SHOW TOAST FUNCTION ---
function showMaintenanceToast(message) {
    const existingToast = document.querySelector('.toast-success');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerText = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Loaded - Initializing...');
  currentRequestsData = typeof initialRequestsData !== 'undefined' ? [...initialRequestsData] : [];
  currentStaffData = typeof availableStaffData !== 'undefined' ? [...availableStaffData] : [];
  currentHistoryData = typeof initialHistoryData !== 'undefined' ? [...initialHistoryData] : [];
  allRooms = typeof allRoomsData !== 'undefined' ? [...allRoomsData] : [];

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
    document.getElementById('downloadBtnRequests')?.addEventListener('click', downloadRequestsPDF);

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

    // --- Issue Type Modal ---
    document.getElementById('closeIssueTypeModalBtn')?.addEventListener('click', hideIssueTypeModal);
    document.getElementById('cancelIssueTypeBtn')?.addEventListener('click', hideIssueTypeModal);
    document.getElementById('issueTypeForm')?.addEventListener('submit', handleIssueTypeSubmit);

    // --- Select All Logic ---
    const selectAllCheckbox = document.getElementById('issue_select_all');
    const issueCheckboxes = document.getElementById('issueTypeForm')?.querySelectorAll('input[type="checkbox"][name="issueType[]"]');

    selectAllCheckbox?.addEventListener('change', () => {
        issueCheckboxes?.forEach(cb => { cb.checked = selectAllCheckbox.checked; });
    });

    issueCheckboxes?.forEach(cb => {
        cb.addEventListener('change', () => {
            if (!cb.checked) { selectAllCheckbox.checked = false; }
            else if (Array.from(issueCheckboxes).every(box => box.checked)) { selectAllCheckbox.checked = true; }
        });
    });

    // --- Staff Modal ---
    document.getElementById('closeStaffModalBtn')?.addEventListener('click', hideStaffModal);
    document.getElementById('cancelStaffBtn')?.addEventListener('click', hideStaffModal);
    document.getElementById('staffModalSearchInput')?.addEventListener('input', filterStaffInModal);
    document.getElementById('confirmStaffAssignBtn')?.addEventListener('click', handleStaffAssign);
    document.getElementById('staffModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) hideStaffModal();
    });

    // --- Edit Room Status Modal ---
    document.getElementById('closeEditRoomStatusBtn')?.addEventListener('click', hideEditRoomStatusModal);
    document.getElementById('cancelEditRoomStatusBtn')?.addEventListener('click', hideEditRoomStatusModal);
    document.getElementById('editRoomStatusForm')?.addEventListener('submit', handleEditRoomStatusSubmit);

    // --- Success Modal ---
    document.getElementById('closeSuccessBtn')?.addEventListener('click', hideSuccessModal);
    document.getElementById('okaySuccessBtn')?.addEventListener('click', hideSuccessModal);

    // --- Confirmation Modal ---
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const confirmModal = document.getElementById('confirmModal');

    confirmActionBtn?.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') confirmCallback();
        hideConfirmModal();
    });
    cancelConfirmBtn?.addEventListener('click', hideConfirmModal);
    confirmModal?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideConfirmModal();
    });
    
    // --- Profile & Logout ---
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
  selectedIssueTypes = values.join(', '); 
  
  hideIssueTypeModal();
  
  if (typeof showStaffModal === 'function') {
      showStaffModal(roomId); 
  } else {
      console.error('showStaffModal function not found. Cannot proceed to step 2.');
  }
}

// =======================================================
// ===== CONFIRMATION MODAL FUNCTIONS =====
// =======================================================

function showConfirmModal(title, text, onConfirm) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalText').textContent = text;
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
// ===== REQUESTS TAB FUNCTIONS =====
// =======================================================

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
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No rooms found.</td></tr>'; 
  } else {
    tbody.innerHTML = paginatedData.map(req => {
        const statusClass = req.status.toLowerCase().replace(/ /g, '-');
        let assignButton;
        
        if (req.staff !== 'Not Assigned') {
            assignButton = `<button class="assignBtn assigned" disabled>${req.staff}</button>`;
        } else if (['Needs Maintenance'].includes(req.status)) { 
            assignButton = `<button class="assignBtn assign-staff-btn" data-room-id="${req.id}" data-room-number="${req.room}">Assign Staff</button>`;
        } else {
            assignButton = `<button class="assignBtn" data-room-id="${req.id}" disabled>Not Required</button>`;
        }
        
        let cancelButton = ''; 
        if (req.status === 'Pending') {
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
            <td><span class="statusBadge ${statusClass}">${req.status}</span></td>
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

    tbody.removeEventListener('click', handleRequestsTableClick); 
    tbody.addEventListener('click', handleRequestsTableClick);
  }

  recordCountEl.textContent = filteredRequests.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRequestsTable();
  });
}

function handleRequestsTableClick(e) {
    // Assign Staff Button
    const assignBtn = e.target.closest('.assign-staff-btn');
    if (assignBtn && !assignBtn.disabled) {
        const row = assignBtn.closest('tr');
        currentRoomId = row.dataset.roomId; 
        const roomNumber = row.dataset.roomNumber; 
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
    
    // Cancel Request Button
    const cancelBtn = e.target.closest('.cancel-request-btn');
    if (cancelBtn) {
        const requestId = cancelBtn.dataset.requestId;
        showConfirmModal(
            'Cancel Maintenance Request?',
            'Are you sure you want to cancel this request? This action cannot be undone.',
            () => { handleCancelRequest(requestId); }
        );
        return;
    }
}

async function handleStaffAssign() {
    if (!selectedStaffId || !currentRoomId) {
        alert("Error: Staff or Room ID is missing.");
        return;
    }
    if (!selectedIssueTypes) {
        alert("Error: Maintenance issue type was not selected.");
        return;
    }

    const assignBtn = document.getElementById('confirmStaffAssignBtn');
    assignBtn.disabled = true;
    assignBtn.textContent = 'ASSIGNING...';

    try {
        const payload = {
            action: 'assign_task', 
            roomId: currentRoomId,
            staffId: selectedStaffId,
            issueTypes: selectedIssueTypes 
        };
        
        const result = await handleApiCall(payload.action, payload);

        if (result.status === 'success') { 
            const roomInRequests = currentRequestsData.find(room => room.id == currentRoomId);
            if (roomInRequests) {
                roomInRequests.status = 'Pending'; 
                roomInRequests.staff = result.staffName; 
            }
            
            hideStaffModal();
            showSuccessModal(result.message || 'Task Assigned Successfully!');
            
            setTimeout(() => { window.location.reload(); }, 1500); 
            
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

async function handleEditRoomStatusSubmit(e) {
    e.preventDefault();
    const roomId = document.getElementById('editRoomStatusRoomId').value;
    const newStatus = document.getElementById('editRoomStatusSelect').value;
    const roomNumber = document.getElementById('editRoomStatusRoomNumber').textContent;
    const submitBtn = document.getElementById('submitEditRoomStatusBtn');

    if (!roomId || !newStatus || !roomNumber) { alert("Error: Missing room data."); return; }
    submitBtn.disabled = true;

    try {
        const payload = { action: 'update_status', room_number: roomNumber, new_status: newStatus };
        const response = await fetch('room_actions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) { throw new Error(`Server error (HTTP ${response.status})`); }
        const result = await response.json();

        if (result.success) { 
            hideEditRoomStatusModal();
            showSuccessModal(result.message || 'Room status updated!');
            setTimeout(() => { window.location.reload(); }, 1500);
        } else {
            alert('Failed to update status: ' + result.message);
        }
    } catch (error) {
        alert('An error occurred: ' + error.message);
    } finally {
        submitBtn.disabled = false;
    }
}

async function handleCancelRequest(requestId) {
    if (!requestId) { alert('Error: Request ID is missing.'); return; }

    try {
        const payload = { action: 'cancel_task', requestId: requestId };
        const result = await handleApiCall(payload.action, payload);

        if (result.status === 'success') {
            hideConfirmModal();
            showSuccessModal(result.message || 'Request cancelled successfully!');
            setTimeout(() => { window.location.reload(); }, 1500); 
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

function saveRequestFiltersToSession() {
  sessionStorage.setItem('requests_floorFilter', document.getElementById('floorFilter')?.value || '');
  sessionStorage.setItem('requests_roomFilter', document.getElementById('roomFilter')?.value || '');
  sessionStorage.setItem('requests_searchInput', document.getElementById('searchInput')?.value || '');
}

function loadRequestFiltersFromSession() {
  const floor = sessionStorage.getItem('requests_floorFilter');
  const search = sessionStorage.getItem('requests_searchInput');
  if (floor) document.getElementById('floorFilter').value = floor;
  if (search) document.getElementById('searchInput').value = search;
}

function applyRequestFiltersAndRender() {
  const floor = document.getElementById('floorFilter')?.value || '';
  const room = document.getElementById('roomFilter')?.value || ''; 
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

  updateRoomFilterOptions(); 
  document.getElementById('roomFilter').value = room; // Restore value after repopulating

  filteredRequests = currentRequestsData.filter(req => {
    const matchFloor = !floor || (req.floor && req.floor.toString() === floor);
    const matchRoom = !room || (req.room && req.room.toString() === room); 
    const matchSearch = !search || (req.room && req.room.toString().includes(search));
    return matchFloor && matchRoom && matchSearch;
  });

  paginationState.requests.currentPage = 1;
  renderRequestsTable();
}

function resetRequestFilters() {
    document.getElementById('floorFilter').value = '';
    document.getElementById('roomFilter').value = '';
    document.getElementById('searchInput').value = '';

    sessionStorage.removeItem('requests_floorFilter');
    sessionStorage.removeItem('requests_roomFilter');
    sessionStorage.removeItem('requests_searchInput');

    updateRoomFilterOptions(); 
    applyRequestFiltersAndRender();
    showMaintenanceToast("Maintenance Requests Refreshed!");
}

function resetHistoryFilters() {
    document.getElementById('floorFilterHistory').value = '';
    document.getElementById('roomFilterHistory').value = '';
    document.getElementById('dateFilterHistory').value = '';
    document.getElementById('historySearchInput').value = '';
    
    updateHistoryRoomFilterOptions();
    applyHistoryFiltersAndRender();
    showMaintenanceToast("Maintenance History Refreshed!");
}

// ===== REQUESTS PDF DOWNLOAD =====
function downloadRequestsPDF() {
    if (filteredRequests.length === 0) {
        alert("No request data to export based on current filters.");
        return;
    }
    
    if (!window.jspdf) { alert("PDF Library not loaded."); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27); // #480c1b
    doc.text("Maintenance Requests Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    const headers = [['Floor', 'Room', 'Date', 'Request Time', 'Last Maintenance', 'Status', 'Staff In Charge']];
    const bodyData = filteredRequests.map(req => [
        req.floor ?? 'N/A', req.room ?? 'N/A', req.date ?? 'N/A',
        req.requestTime ?? 'N/A', req.lastMaintenance ?? 'N/A',
        req.status ?? 'N/A', req.staff ?? 'N/A'
    ]);

    doc.autoTable({
        startY: 35, head: headers, body: bodyData, theme: 'grid',
        headStyles: { fillColor: '#480c1b', textColor: '#ffffff', fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 4: { cellWidth: 35 }, 6: { cellWidth: 35 } }
    });

    doc.save('maintenance-requests.pdf');
}

// ===== HISTORY PDF DOWNLOAD (Added) =====
function downloadHistoryPDF() {
    if (filteredHistory.length === 0) {
        alert("No history data to export based on current filters.");
        return;
    }
    
    if (!window.jspdf) { alert("PDF Library not loaded."); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); 

    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27); 
    doc.text("Maintenance History Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    // Assuming filteredHistory has fields like: floor, room, issueType, date, requestedTime, completedTime, staff, status, remarks
    const headers = [['Floor', 'Room', 'Issue Type', 'Date', 'Req Time', 'Comp Time', 'Staff', 'Status', 'Remarks']];
    const bodyData = filteredHistory.map(hist => [
        hist.floor, hist.room, hist.issueType, hist.date,
        hist.requestedTime, hist.completedTime, hist.staff,
        hist.status, hist.remarks
    ]);

    doc.autoTable({
        startY: 35, head: headers, body: bodyData, theme: 'grid',
        headStyles: { fillColor: '#480c1b', textColor: '#ffffff', fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 8: { cellWidth: 50 } } // Remarks wider
    });

    doc.save('maintenance-history.pdf');
}
// =======================================================
// ===== HISTORY TAB RENDER LOGIC (The Missing Part) =====
// =======================================================

/**
 * Filters the history data based on dropdowns and search
 */
function applyHistoryFiltersAndRender() {
    const floor = document.getElementById('floorFilterHistory')?.value;
    const room = document.getElementById('roomFilterHistory')?.value;
    const date = document.getElementById('dateFilterHistory')?.value;
    const search = document.getElementById('historySearchInput')?.value.toLowerCase();

    // Convert Input Date (YYYY-MM-DD) to Data Format (MM.DD.YYYY) if needed
    let formattedDate = '';
    if (date) {
        const [y, m, d] = date.split('-');
        formattedDate = `${m}.${d}.${y}`;
    }

    filteredHistory = currentHistoryData.filter(h => {
        const matchFloor = !floor || h.floor.toString() === floor;
        const matchRoom = !room || h.room.toString() === room;
        const matchDate = !formattedDate || h.date === formattedDate;
        
        // Safe search handling (checks if fields exist before converting to lower case)
        const matchSearch = !search || 
            (h.room && h.room.toString().includes(search)) || 
            (h.staff && h.staff.toLowerCase().includes(search)) ||
            (h.issueType && h.issueType.toLowerCase().includes(search)) ||
            (h.status && h.status.toLowerCase().includes(search)) ||
            (h.remarks && h.remarks.toLowerCase().includes(search));

        return matchFloor && matchRoom && matchDate && matchSearch;
    });

    // Reset to page 1
    paginationState.history.currentPage = 1;
    
    // Call the render function
    renderHistoryTable();
}

/**
 * Draws the History Table HTML
 */
function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const recordCountEl = document.getElementById('historyRecordCount');
    const paginationControlsContainerId = 'historyPaginationControls';
    const state = paginationState.history;

    if (!tbody || !recordCountEl) return;

    // Calculate Pages
    const totalPages = getTotalPages(filteredHistory.length, state.itemsPerPage);
    
    // Safety Check: Ensure current page isn't too high
    if (state.currentPage > totalPages && totalPages > 0) {
        state.currentPage = totalPages;
    }

    // Get slice of data for current page
    const paginatedData = paginateData(filteredHistory, state.currentPage, state.itemsPerPage);

    // Render Rows
    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history records found.</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(h => {
            // 1. Prepare Status Class
            const statusClass = h.status ? h.status.toLowerCase().replace(/\s+/g, '-') : '';

            // 2. Prepare Safe Data (Escape HTML to prevent XSS/Layout breaks)
            // We use the escapeHtml() helper function on every field.
            const safeFloor = escapeHtml(h.floor ?? 'N/A');
            const safeRoom = escapeHtml(h.room ?? 'N/A');
            const safeType = escapeHtml(h.issueType ?? 'N/A');
            const safeDate = escapeHtml(h.date ?? 'N/A');
            const safeReqTime = escapeHtml(h.requestedTime ?? 'N/A');
            const safeCompTime = escapeHtml(h.completedTime ?? 'N/A');
            const safeStaff = escapeHtml(h.staff ?? 'N/A');
            const safeStatus = escapeHtml(h.status ?? 'N/A');

            // 3. Special Handling for Remarks (Truncate then Escape)
            const rawRemarks = h.remarks ?? '';
            const safeFullRemarks = escapeHtml(rawRemarks); // For tooltip
            
            // Truncate the RAW text first, then escape the result
            // This prevents cutting off an escape sequence like "&amp;" in the middle
            const truncatedRaw = rawRemarks.length > 30 ? rawRemarks.substring(0, 30) + '...' : rawRemarks;
            const safeDisplayRemarks = escapeHtml(truncatedRaw);

            return `
                <tr>
                    <td>${safeFloor}</td>
                    <td>${safeRoom}</td>
                    <td>${safeType}</td>
                    <td>${safeDate}</td>
                    <td>${safeReqTime}</td>
                    <td>${safeCompTime}</td>
                    <td>${safeStaff}</td>
                    <td><span class="statusBadge ${statusClass}">${safeStatus}</span></td>
                    <td title="${safeFullRemarks}">${safeDisplayRemarks}</td>
                </tr>
            `;
        }).join('');
    }

    // Update Count Text
    recordCountEl.textContent = filteredHistory.length;

    // Render Pagination Buttons
    renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
        state.currentPage = page;
        renderHistoryTable();
    });
}