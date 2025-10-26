// ===== GLOBAL VARIABLES =====
let currentRequestsData = []; // Holds rooms needing maintenance from PHP
let currentStaffData = [];    // Holds maintenance staff from PHP
let currentHistoryData = [];

let filteredRequests = [];
let filteredStaff = [];
let filteredHistory = [];

let selectedStaffId = null;
let currentRequestId = null;  // Store RoomID

// Pagination State
const paginationState = {
  requests: { currentPage: 1, itemsPerPage: 10 },
  history: { currentPage: 1, itemsPerPage: 10 }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Load data passed from PHP
  currentRequestsData = typeof initialRequestsData !== 'undefined' ? initialRequestsData : [];
  currentStaffData = typeof availableStaffData !== 'undefined' ? availableStaffData : [];

  // Initial render
  applyRequestFiltersAndRender();
  applyHistoryFiltersAndRender(); // Also render history placeholder initially

  setupEventListeners();
  populateStaticFilters();
});

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Tab Navigation
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

    // Request Filters
    document.getElementById('floorFilter')?.addEventListener('change', applyRequestFiltersAndRender);
    document.getElementById('roomFilter')?.addEventListener('change', applyRequestFiltersAndRender);
    document.getElementById('searchInput')?.addEventListener('input', applyRequestFiltersAndRender);
    document.getElementById('refreshBtn')?.addEventListener('click', resetRequestFilters);
    document.getElementById('downloadBtnRequests')?.addEventListener('click', downloadRequestsCSV);

    // History Filters
    document.getElementById('floorFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
    document.getElementById('roomFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
    document.getElementById('dateFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
    document.getElementById('historySearchInput')?.addEventListener('input', applyHistoryFiltersAndRender);
    document.getElementById('historyRefreshBtn')?.addEventListener('click', resetHistoryFilters);
    document.getElementById('historyDownloadBtn')?.addEventListener('click', downloadHistoryCSV);

    // Staff Modal
    document.getElementById('closeStaffModalBtn')?.addEventListener('click', hideStaffModal);
    document.getElementById('cancelStaffBtn')?.addEventListener('click', hideStaffModal); // Acts as close now
    document.getElementById('staffModalSearchInput')?.addEventListener('input', filterStaffInModal);
    document.getElementById('staffModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) hideStaffModal();
    });

    // Profile Sidebar & Logout
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

// ===== PAGINATION UTILITIES =====
function paginateData(data, page, itemsPerPage) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}

function getTotalPages(dataLength, itemsPerPage) {
  return Math.ceil(dataLength / itemsPerPage);
}

// *** FIXED: Target the specific controls container ID passed ***
function renderPaginationControls(controlsContainerId, totalPages, currentPage, onPageChange) {
    const container = document.getElementById(controlsContainerId); // Target the specific container ID passed
    if (!container) {
         // console.error(`Pagination controls container #${controlsContainerId} not found.`); // Keep console log commented out unless debugging
         return;
    }

    container.innerHTML = ''; // Clear previous controls
    if (totalPages <= 1) return; // Don't render if only one page or less

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'paginationBtn';
    prevBtn.textContent = '←';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageChange(currentPage - 1);
    container.appendChild(prevBtn);

    // Page Number Logic
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.className = 'paginationBtn'; firstPageBtn.textContent = '1';
        firstPageBtn.onclick = () => onPageChange(1); container.appendChild(firstPageBtn);
        if (startPage > 2) { const dots = document.createElement('span'); dots.textContent = '...'; dots.className = 'paginationDots'; container.appendChild(dots); }
    }
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `paginationBtn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i; pageBtn.onclick = () => onPageChange(i); container.appendChild(pageBtn);
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) { const dots = document.createElement('span'); dots.textContent = '...'; dots.className = 'paginationDots'; container.appendChild(dots); }
        const lastPageBtn = document.createElement('button'); lastPageBtn.className = 'paginationBtn'; lastPageBtn.textContent = totalPages;
        lastPageBtn.onclick = () => onPageChange(totalPages); container.appendChild(lastPageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'paginationBtn';
    nextBtn.textContent = '→';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => onPageChange(currentPage + 1);
    container.appendChild(nextBtn);
}
// *** END FIXED SECTION ***


// ===== RENDER REQUESTS TABLE (Updated Columns) =====
function renderRequestsTable() {
  const tbody = document.getElementById('requestsTableBody');
  const recordCountEl = document.getElementById('requestsRecordCount');
  const paginationControlsContainerId = 'requestsPaginationControls'; // Correct ID for controls div
  const state = paginationState.requests;

  if (!tbody || !recordCountEl) return;

  const totalPages = getTotalPages(filteredRequests.length, state.itemsPerPage);
  if (state.currentPage > totalPages) {
    state.currentPage = Math.max(1, totalPages);
  }
  const paginatedData = paginateData(filteredRequests, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0 && state.currentPage === 1) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No rooms require maintenance or match filters.</td></tr>'; // Colspan = 7
  } else if (paginatedData.length === 0 && state.currentPage > 1) {
      state.currentPage--;
      renderRequestsTable();
      return;
  } else {
    tbody.innerHTML = paginatedData.map(req => `
      <tr>
        <td>${req.floor ?? 'N/A'}</td>
        <td>${req.room ?? 'N/A'}</td>
        <td>${req.date ?? 'N/A'}</td>
        <td>${req.requestTime ?? 'N/A'}</td>
        <td>${req.lastMaintenance ?? 'N/A'}</td>
        <td><span class="statusBadge maintenance">Maintenance</span></td>
        <td>
          <button class="assignBtn" data-room-id="${req.id}">Assign Staff</button>
        </td>
      </tr>
    `).join('');

    // Add event listeners AFTER updating innerHTML
    tbody.querySelectorAll('.assignBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentRequestId = parseInt(e.target.getAttribute('data-room-id')); // Store Room ID
        showStaffModal(); // Directly show the staff list modal
      });
    });
  }

  recordCountEl.textContent = filteredRequests.length;
   // Pass the ID of the DIV containing the controls
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRequestsTable();
  });
}

// ===== RENDER STAFF LIST MODAL (Updated Text) =====
function renderStaffList(staffToRender = filteredStaff) {
  const staffList = document.getElementById('staffList');
  if (!staffList) return;

  if (staffToRender.length === 0) {
    staffList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No available maintenance staff found.</div>'; // Updated text
    return;
  }

  staffList.innerHTML = staffToRender.map(staff => `
      <div class="staffListItem ${staff.assigned ? 'assigned' : ''}" data-staff-id="${staff.id}">
        <div class="staffListName">${staff.name}</div>
        <span class="staffListStatus ${staff.assigned ? 'assigned' : 'available'}">${staff.assigned ? 'Assigned' : 'Available'}</span>
      </div>
    `).join('');
}

// ===== RENDER HISTORY TABLE (Keep placeholder) =====
function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  const recordCountEl = document.getElementById('historyRecordCount');
  const paginationControlsContainerId = 'historyPaginationControls'; // Correct ID
  const state = paginationState.history;

  if (!tbody || !recordCountEl) return;

  filteredHistory = []; // Placeholder

  const totalPages = getTotalPages(filteredHistory.length, state.itemsPerPage);
   if (state.currentPage > totalPages) {
       state.currentPage = Math.max(1, totalPages);
   }
  const paginatedData = paginateData(filteredHistory, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
     tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history records found matching criteria.</td></tr>';
  } else {
     // Populate with actual history data structure later
     tbody.innerHTML = paginatedData.map(hist => `
      <tr>
        <td>${hist.floor ?? 'N/A'}</td>
        <td>${hist.room ?? 'N/A'}</td>
        <td>${hist.issue ?? 'N/A'}</td>
        <td>${hist.date ?? 'N/A'}</td>
        <td>${hist.requestedTime ?? 'N/A'}</td>
        <td>${hist.completedTime ?? 'N/A'}</td>
        <td>${hist.staff ?? 'N/A'}</td>
        <td><span class="statusBadge repaired">${hist.status ?? 'Repaired'}</span></td>
        <td>${hist.remarks ?? ''}</td>
      </tr>
    `).join('');
  }

  recordCountEl.textContent = filteredHistory.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => { // Pass correct ID
    state.currentPage = page;
    renderHistoryTable();
  });
}

// ===== FILTERING LOGIC (Simplified) =====
function applyRequestFiltersAndRender() {
  const floor = document.getElementById('floorFilter')?.value || '';
  const room = document.getElementById('roomFilter')?.value || '';
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

  filteredRequests = currentRequestsData.filter(req => {
    const matchFloor = !floor || (req.floor && req.floor.toString() === floor);
    const matchRoom = !room || (req.room && req.room.toString() === room);
    const matchSearch = !search || (req.room && req.room.toString().includes(search));

    return matchFloor && matchRoom && matchSearch;
  });

  paginationState.requests.currentPage = 1;
  renderRequestsTable();
  updateRoomFilterOptions();
}

function filterStaffInModal() {
  const search = document.getElementById('staffModalSearchInput')?.value.toLowerCase() || '';
  filteredStaff = currentStaffData.filter(staff =>
    staff.name.toLowerCase().includes(search)
  );
  renderStaffList();
}

function applyHistoryFiltersAndRender() {
     paginationState.history.currentPage = 1;
     renderHistoryTable();
}

// ===== FILTER UTILITIES =====
function populateStaticFilters() {
    const floorFilter = document.getElementById('floorFilter');
    const floors = [...new Set(currentRequestsData.map(r => r.floor).filter(f => f))].sort((a, b) => a - b);
    if (floorFilter) {
        // Clear existing options except the first one
        while (floorFilter.options.length > 1) {
            floorFilter.remove(1);
        }
        floors.forEach(f => {
             const option = document.createElement('option');
             option.value = f; option.textContent = f;
             floorFilter.appendChild(option);
        });
    }
    updateRoomFilterOptions(); // Populate rooms initially

    // Populate history filters similarly if needed
    const floorFilterHistory = document.getElementById('floorFilterHistory');
     if (floorFilterHistory) {
         while (floorFilterHistory.options.length > 1) { floorFilterHistory.remove(1); }
         // Use same floors or fetch history-specific floors
         floors.forEach(f => {
              const option = document.createElement('option');
              option.value = f; option.textContent = f;
              floorFilterHistory.appendChild(option);
         });
     }
     // Update history room filter too if needed
     updateHistoryRoomFilterOptions();
}

function updateRoomFilterOptions() {
     const floorFilter = document.getElementById('floorFilter');
     const roomFilter = document.getElementById('roomFilter');
     if (!roomFilter || !floorFilter) return;

     const selectedFloor = floorFilter.value;
     const currentRoomValue = roomFilter.value;

     roomFilter.innerHTML = '<option value="">Room</option>';

     const roomsToShow = selectedFloor
        ? currentRequestsData.filter(r => r.floor && r.floor.toString() === selectedFloor)
        : currentRequestsData;

     const roomNumbers = [...new Set(roomsToShow.map(r => r.room).filter(r => r))].sort((a, b) => a - b);

     roomNumbers.forEach(roomNum => {
         const option = document.createElement('option');
         option.value = roomNum; option.textContent = roomNum;
         roomFilter.appendChild(option);
     });

     // Check if currentRoomValue exists in the new list before setting it
     if (roomNumbers.map(String).includes(String(currentRoomValue))) {
         roomFilter.value = currentRoomValue;
     } else if (roomFilter.options.length > 0) {
         roomFilter.value = ""; // Default to "Room" if previous selection invalid
     }
}

// Added function to update history room filter
function updateHistoryRoomFilterOptions() {
     const floorFilterHistory = document.getElementById('floorFilterHistory');
     const roomFilterHistory = document.getElementById('roomFilterHistory');
     if (!roomFilterHistory || !floorFilterHistory) return;

     const selectedFloor = floorFilterHistory.value;
     const currentRoomValue = roomFilterHistory.value;

     roomFilterHistory.innerHTML = '<option value="">Room</option>';

     // **** IMPORTANT: Use history data (currentHistoryData) if available,
     // otherwise, use request data as a fallback for available rooms ****
     const dataToUse = currentHistoryData.length > 0 ? currentHistoryData : currentRequestsData;

     const roomsToShow = selectedFloor
        ? dataToUse.filter(r => r.floor && r.floor.toString() === selectedFloor)
        : dataToUse;

     const roomNumbers = [...new Set(roomsToShow.map(r => r.room).filter(r => r))].sort((a, b) => a - b);

     roomNumbers.forEach(roomNum => {
         const option = document.createElement('option');
         option.value = roomNum; option.textContent = roomNum;
         roomFilterHistory.appendChild(option);
     });

      if (roomNumbers.map(String).includes(String(currentRoomValue))) {
         roomFilterHistory.value = currentRoomValue;
     } else if (roomFilterHistory.options.length > 0) {
         roomFilterHistory.value = "";
     }
}


function resetRequestFilters() {
    document.getElementById('floorFilter').value = '';
    document.getElementById('roomFilter').value = '';
    document.getElementById('searchInput').value = '';
    applyRequestFiltersAndRender();
}
function resetHistoryFilters() {
     document.getElementById('floorFilterHistory').value = '';
     document.getElementById('roomFilterHistory').value = '';
     document.getElementById('dateFilterHistory').value = '';
     document.getElementById('historySearchInput').value = '';
     applyHistoryFiltersAndRender();
}

// ===== MODAL VISIBILITY (Simplified) =====
function showStaffModal() {
    selectedStaffId = null;
    document.getElementById('staffModalSearchInput').value = '';
    filteredStaff = [...currentStaffData];
    renderStaffList();
    document.getElementById('staffModal').style.display = 'flex';
}

function hideStaffModal() { document.getElementById('staffModal').style.display = 'none'; }

// ===== ACTIONS (Removed handleConfirmAssignment) =====

// ===== CSV DOWNLOAD (Updated Columns) =====
function downloadRequestsCSV() {
    if (filteredRequests.length === 0) {
        alert("No request data to export based on current filters.");
        return;
    }
    const headers = ['Floor', 'Room', 'Date', 'Request Time', 'Last Maintenance', 'Status', 'Staff In Charge'];
    const csvContent = [
        headers.join(','),
        ...filteredRequests.map(req =>
            [
                req.floor ?? 'N/A',
                req.room ?? 'N/A',
                req.date ?? 'N/A',
                req.requestTime ?? 'N/A',
                req.lastMaintenance ?? 'N/A',
                'Maintenance',
                req.staff
             ].join(',')
        )
    ].join('\n');
    downloadCSV(csvContent, 'maintenance-rooms');
}

function downloadHistoryCSV() {
     if (filteredHistory.length === 0) {
        alert("No history data to export based on current filters.");
        return;
    }
    // Adjust headers/data mapping for actual history data
    const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Staff In Charge', 'Status', 'Remarks'];
    const csvContent = [
        headers.join(','),
        ...filteredHistory.map(hist =>
            [ /* Map history data here */ ].join(',')
        )
    ].join('\n');
    downloadCSV(csvContent, 'maintenance-history');
}

function downloadCSV(csvContent, filenamePrefix) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}