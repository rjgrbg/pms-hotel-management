// ===== GLOBAL VARIABLES =====
let currentRequestsData = []; // Holds the full list of requests from PHP
let currentStaffData = [];    // Holds the full list of staff from PHP
let currentHistoryData = []; // Holds history data (if implemented)

let filteredRequests = [];    // Holds currently displayed requests
let filteredStaff = [];       // Holds staff filtered in the modal
let filteredHistory = [];     // Holds filtered history

let selectedStaffId = null;
let currentRequestId = null;  // Store RoomID instead of index for assigning

// Pagination State
const paginationState = {
  requests: { currentPage: 1, itemsPerPage: 10 },
  history: { currentPage: 1, itemsPerPage: 10 }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Load data passed from PHP
  currentRequestsData = typeof initialRequestsData !== 'undefined' ? initialRequestsData : []; //
  currentStaffData = typeof availableStaffData !== 'undefined' ? availableStaffData : []; //
  // Load history if passed, e.g., currentHistoryData = typeof initialHistoryData !== 'undefined' ? initialHistoryData : [];

  // Initial render
  applyRequestFiltersAndRender(); // Render requests initially
  // applyHistoryFiltersAndRender(); // Render history initially if data is available

  // Setup event listeners
  setupEventListeners();
  populateStaticFilters(); // Populate floor/room filters based on initial data
});


// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Tab Navigation
    const tabBtns = document.querySelectorAll('.tabBtn'); //
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab'); //
        document.querySelectorAll('.tabBtn').forEach(b => b.classList.remove('active')); //
        document.querySelectorAll('.tabContent').forEach(content => content.classList.remove('active')); //
        btn.classList.add('active'); //
        const activeTab = document.getElementById(`${tabName}-tab`); //
        if (activeTab) activeTab.classList.add('active'); //
      });
    });

    // Request Filters
    document.getElementById('floorFilter')?.addEventListener('change', applyRequestFiltersAndRender); //
    document.getElementById('roomFilter')?.addEventListener('change', applyRequestFiltersAndRender); //
    document.getElementById('searchInput')?.addEventListener('input', applyRequestFiltersAndRender); //
    document.getElementById('refreshBtn')?.addEventListener('click', resetRequestFilters); //
    document.getElementById('downloadBtnRequests')?.addEventListener('click', downloadRequestsCSV); //

    // History Filters (Add if history tab is implemented)
    document.getElementById('floorFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender); //
    document.getElementById('roomFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender); //
    document.getElementById('dateFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender); // Needs date picker //
    document.getElementById('historySearchInput')?.addEventListener('input', applyHistoryFiltersAndRender); //
    document.getElementById('historyRefreshBtn')?.addEventListener('click', resetHistoryFilters); //
    document.getElementById('historyDownloadBtn')?.addEventListener('click', downloadHistoryCSV); //


    // Staff Modal
    document.getElementById('closeStaffModalBtn')?.addEventListener('click', hideStaffModal); //
    document.getElementById('cancelStaffBtn')?.addEventListener('click', hideStaffModal); // This button now acts as the primary close //
    // *** REMOVED listener for confirmStaffBtn ***
    document.getElementById('staffModalSearchInput')?.addEventListener('input', filterStaffInModal); //
    document.getElementById('staffModal')?.addEventListener('click', (e) => { //
      if (e.target === e.currentTarget) hideStaffModal(); //
    });

    // *** REMOVED listeners for Assign Confirmation Modal ***
    // *** REMOVED listeners for Success Modal ***


    // Profile Sidebar & Logout
    const profileBtn = document.getElementById('profileBtn'); //
    const sidebar = document.getElementById('profile-sidebar'); //
    const closeSidebarBtn = document.getElementById('sidebar-close-btn'); //
    profileBtn?.addEventListener('click', () => sidebar?.classList.add('active')); //
    closeSidebarBtn?.addEventListener('click', () => sidebar?.classList.remove('active')); //

    const logoutBtn = document.getElementById('logoutBtn'); //
    const logoutModal = document.getElementById('logoutModal'); //
    const closeLogoutBtn = document.getElementById('closeLogoutBtn'); //
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn'); //
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn'); //

    logoutBtn?.addEventListener('click', (e) => { e.preventDefault(); if(logoutModal) logoutModal.style.display = 'flex'; }); //
    closeLogoutBtn?.addEventListener('click', () => { if(logoutModal) logoutModal.style.display = 'none'; }); //
    cancelLogoutBtn?.addEventListener('click', () => { if(logoutModal) logoutModal.style.display = 'none'; }); //
    confirmLogoutBtn?.addEventListener('click', () => { window.location.href = 'logout.php'; }); //
    logoutModal?.addEventListener('click', (e) => { if (e.target === e.currentTarget) logoutModal.style.display = 'none'; }); //
}


// ===== PAGINATION UTILITIES =====
function paginateData(data, page, itemsPerPage) { //
  const startIndex = (page - 1) * itemsPerPage; //
  const endIndex = startIndex + itemsPerPage; //
  return data.slice(startIndex, endIndex); //
}

function getTotalPages(dataLength, itemsPerPage) { //
  return Math.ceil(dataLength / itemsPerPage); //
}

function renderPaginationControls(containerId, totalPages, currentPage, onPageChange) { //
  const container = document.getElementById(containerId); //
  if (!container) return; //
  container.innerHTML = ''; // Clear previous controls //
  if (totalPages <= 1) return; // Don't render if only one page or less //

  // Previous Button
  const prevBtn = document.createElement('button'); //
  prevBtn.className = 'paginationBtn'; //
  prevBtn.textContent = '←'; //
  prevBtn.disabled = currentPage === 1; //
  prevBtn.onclick = () => onPageChange(currentPage - 1); //
  container.appendChild(prevBtn); //

  // Page Number Logic (simplified for brevity, can enhance later)
   const maxVisiblePages = 5; //
   let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2)); //
   let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1); //
   if (endPage - startPage + 1 < maxVisiblePages) { //
       startPage = Math.max(1, endPage - maxVisiblePages + 1); //
   }

    if (startPage > 1) { //
        const firstPageBtn = document.createElement('button'); //
        firstPageBtn.className = 'paginationBtn'; firstPageBtn.textContent = '1'; //
        firstPageBtn.onclick = () => onPageChange(1); container.appendChild(firstPageBtn); //
        if (startPage > 2) { const dots = document.createElement('span'); dots.textContent = '...'; dots.className = 'paginationDots'; container.appendChild(dots); } //
    }
    for (let i = startPage; i <= endPage; i++) { //
        const pageBtn = document.createElement('button'); //
        pageBtn.className = `paginationBtn ${i === currentPage ? 'active' : ''}`; //
        pageBtn.textContent = i; pageBtn.onclick = () => onPageChange(i); container.appendChild(pageBtn); //
    }
    if (endPage < totalPages) { //
        if (endPage < totalPages - 1) { const dots = document.createElement('span'); dots.textContent = '...'; dots.className = 'paginationDots'; container.appendChild(dots); } //
        const lastPageBtn = document.createElement('button'); lastPageBtn.className = 'paginationBtn'; lastPageBtn.textContent = totalPages; //
        lastPageBtn.onclick = () => onPageChange(totalPages); container.appendChild(lastPageBtn); //
    }


  // Next Button
  const nextBtn = document.createElement('button'); //
  nextBtn.className = 'paginationBtn'; //
  nextBtn.textContent = '→'; //
  nextBtn.disabled = currentPage === totalPages; //
  nextBtn.onclick = () => onPageChange(currentPage + 1); //
  container.appendChild(nextBtn); //
}


// ===== RENDER REQUESTS TABLE =====
function renderRequestsTable() {
    const tbody = document.getElementById('requestsTableBody'); //
    const recordCountEl = document.getElementById('requestsRecordCount'); //
    const paginationControlsContainerId = 'requestsPaginationControls'; //
    const state = paginationState.requests; //

    if (!tbody || !recordCountEl) return;

    const totalPages = getTotalPages(filteredRequests.length, state.itemsPerPage); //
    // Adjust current page if it's invalid (e.g., after filtering/deletion)
    if (state.currentPage > totalPages) { //
        state.currentPage = Math.max(1, totalPages); //
    }

    const paginatedData = paginateData(filteredRequests, state.currentPage, state.itemsPerPage); //

    if (paginatedData.length === 0 && state.currentPage === 1) { //
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No rooms need cleaning or match filters.</td></tr>'; //
    } else if (paginatedData.length === 0 && state.currentPage > 1) { //
        // If current page is empty but not the first, go back one page
        state.currentPage--; //
        renderRequestsTable(); // Re-render the previous page
        return; // Stop current rendering //
    } else {
        tbody.innerHTML = paginatedData.map(req => `
      <tr>
        <td>${req.floor ?? 'N/A'}</td> 
        <td>${req.room ?? 'N/A'}</td>
        <td>${req.date ?? 'N/A'}</td>       
        <td>${req.requestTime ?? 'N/A'}</td> 
        <td>${req.lastCleaned ?? 'N/A'}</td>
        <td><span class="statusBadge needs-cleaning">Needs Cleaning</span></td> 
        <td>
          <button class="assignBtn" data-room-id="${req.id}">Assign Staff</button> 
        </td>
      </tr>
    `).join(''); //

        // Add event listeners AFTER updating innerHTML
        tbody.querySelectorAll('.assignBtn').forEach(btn => { //
            btn.addEventListener('click', (e) => {
                currentRequestId = parseInt(e.target.getAttribute('data-room-id')); // Store RoomID just in case, though not used for assignment now //
                showStaffModal(); // Directly show the staff list modal
            });
        });
    }

    recordCountEl.textContent = filteredRequests.length; // Update total count based on filtered data //
    renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => { //
        state.currentPage = page; // Update current page in state //
        renderRequestsTable(); // Re-render the table for the new page //
    });
}

// ===== RENDER STAFF LIST MODAL =====
function renderStaffList(staffToRender = filteredStaff) { // Use filteredStaff by default
    const staffList = document.getElementById('staffList'); //
    if (!staffList) return;

    if (staffToRender.length === 0) { //
        staffList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No available staff found.</div>'; //
        return;
    }

    // Only show staff from currentStaffData (which contains only housekeeping_staff)
    staffList.innerHTML = staffToRender.map(staff => `
      <div class="staffListItem ${staff.assigned ? 'assigned' : ''}" data-staff-id="${staff.id}"> 
        <div class="staffListName">${staff.name}</div> 
        <span class="staffListStatus ${staff.assigned ? 'assigned' : 'available'}">${staff.assigned ? 'Assigned' : 'Available'}</span> 
      </div>
    `).join(''); //

    // *** REMOVED: Click listeners for selecting staff ***
}


// ===== RENDER HISTORY TABLE (Placeholder/Example) =====
function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody'); //
    const recordCountEl = document.getElementById('historyRecordCount'); //
    const paginationControlsContainerId = 'historyPaginationControls'; //
    const state = paginationState.history; //

    if (!tbody || !recordCountEl) return;

    // --- Replace with actual history data fetching and filtering ---
    filteredHistory = []; // Placeholder - Fetch/filter real data here
    // --- ---------------------------------------------------- ---

    const totalPages = getTotalPages(filteredHistory.length, state.itemsPerPage); //
    if (state.currentPage > totalPages) { //
        state.currentPage = Math.max(1, totalPages); //
    }
    const paginatedData = paginateData(filteredHistory, state.currentPage, state.itemsPerPage); //

    if (paginatedData.length === 0) { //
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history records found matching criteria.</td></tr>'; //
    } else {
        // Populate with actual history data structure
        tbody.innerHTML = paginatedData.map(hist => `
      <tr>
        <td>${hist.floor ?? 'N/A'}</td>
        <td>${hist.room ?? 'N/A'}</td>
        <td>${hist.guest ?? 'N/A'}</td> 
        <td>${hist.date ?? 'N/A'}</td>
        <td>${hist.requestedTime ?? 'N/A'}</td>
        <td>${hist.completedTime ?? 'N/A'}</td>
        <td>${hist.staff ?? 'N/A'}</td>
        <td><span class="statusBadge cleaned">Cleaned</span></td> 
        <td>${hist.remarks ?? ''}</td>
      </tr>
    `).join(''); //
    }

    recordCountEl.textContent = filteredHistory.length; //
    renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => { //
        state.currentPage = page; //
        renderHistoryTable(); //
    });
}


// ===== FILTERING LOGIC =====
function applyRequestFiltersAndRender() {
    const floor = document.getElementById('floorFilter')?.value || ''; //
    const room = document.getElementById('roomFilter')?.value || ''; //
    const search = document.getElementById('searchInput')?.value.toLowerCase() || ''; //

    filteredRequests = currentRequestsData.filter(req => { //
        const matchFloor = !floor || req.floor.toString() === floor; //
        const matchRoom = !room || req.room.toString() === room; //
        const matchSearch = !search || req.room.toString().includes(search); // Search only by room number //

        return matchFloor && matchRoom && matchSearch; //
    });

    paginationState.requests.currentPage = 1; // Reset page on filter change //
    renderRequestsTable();
    updateRoomFilterOptions(); // Update room dropdown based on selected floor
}

function filterStaffInModal() {
    const search = document.getElementById('staffModalSearchInput')?.value.toLowerCase() || ''; //
    filteredStaff = currentStaffData.filter(staff => //
        staff.name.toLowerCase().includes(search) //
    );
    renderStaffList(); // Render the filtered list in the modal
}

function applyHistoryFiltersAndRender() {
    // Implement history filtering based on floor, room, date, search
    // Update filteredHistory array
    paginationState.history.currentPage = 1; //
    renderHistoryTable();
}


// ===== FILTER UTILITIES =====
function populateStaticFilters() {
    // Populate Floor filter
    const floorFilter = document.getElementById('floorFilter'); //
    const floors = [...new Set(currentRequestsData.map(r => r.floor))].sort((a, b) => a - b); //
    if (floorFilter) { //
        // Keep the "Floor" default option
        floors.forEach(f => { //
            const option = document.createElement('option'); //
            option.value = f; option.textContent = f; //
            floorFilter.appendChild(option); //
        });
    }
    // Initially populate Room filter with all rooms
    updateRoomFilterOptions();
    // Populate History filters similarly if needed
}

function updateRoomFilterOptions() {
    const floorFilter = document.getElementById('floorFilter'); //
    const roomFilter = document.getElementById('roomFilter'); //
    if (!roomFilter) return; //

    const selectedFloor = floorFilter?.value; //
    const currentRoomValue = roomFilter.value; // Save current selection //

    // Clear existing room options (except the default "Room")
    roomFilter.innerHTML = '<option value="">Room</option>'; //

    const roomsToShow = selectedFloor //
        ? currentRequestsData.filter(r => r.floor.toString() === selectedFloor) //
        : currentRequestsData; // Show all if no floor selected //

    const roomNumbers = [...new Set(roomsToShow.map(r => r.room))].sort((a, b) => a - b); //

    roomNumbers.forEach(roomNum => { //
        const option = document.createElement('option'); //
        option.value = roomNum; option.textContent = roomNum; //
        roomFilter.appendChild(option); //
    });

    // Try to restore previous selection if it's still valid
    if (roomNumbers.includes(parseInt(currentRoomValue))) { //
        roomFilter.value = currentRoomValue; //
    }
}

function resetRequestFilters() {
    document.getElementById('floorFilter').value = ''; //
    document.getElementById('roomFilter').value = ''; //
    document.getElementById('searchInput').value = ''; //
    applyRequestFiltersAndRender();
}

function resetHistoryFilters() {
    // Reset history filters and re-render
    document.getElementById('floorFilterHistory').value = ''; //
    document.getElementById('roomFilterHistory').value = ''; //
    document.getElementById('dateFilterHistory').value = ''; // Reset date picker if implemented //
    document.getElementById('historySearchInput').value = ''; //
    applyHistoryFiltersAndRender();
}


// ===== MODAL VISIBILITY =====
function showStaffModal() {
    selectedStaffId = null; // Reset just in case
    // *** REMOVED: Disabling confirmBtn as it doesn't exist ***
    document.getElementById('staffModalSearchInput').value = ''; // Clear search //
    filteredStaff = [...currentStaffData]; // Reset staff filter //
    renderStaffList(); // Render the full list of available staff
    document.getElementById('staffModal').style.display = 'flex'; //
}

function hideStaffModal() { document.getElementById('staffModal').style.display = 'none'; } //

// *** REMOVED: showAssignModal, hideAssignModal, showSuccessModal, hideSuccessModal functions ***
// *** These modals are no longer shown in this simplified flow ***


// ===== ACTIONS =====
// *** REMOVED: handleConfirmAssignment function entirely ***
// *** No assignment logic is needed on the frontend now ***


// ===== CSV DOWNLOAD =====
function downloadRequestsCSV() { //
    if (filteredRequests.length === 0) { //
        alert("No request data to export based on current filters."); //
        return; //
    }
    const headers = ['Floor', 'Room', 'Date', 'Request Time', 'Last Cleaned', 'Status', 'Staff In Charge']; //
    const csvContent = [ //
        headers.join(','), //
        ...filteredRequests.map(req => //
            [ //
                req.floor, //
                req.room, //
                req.date, //
                req.requestTime, //
                req.lastCleaned, //
                'Needs Cleaning', // Status is always this for requests //
                req.staff // This will be 'Not Assigned' initially //
             ].join(',') //
        ) //
    ].join('\n'); //
    downloadCSV(csvContent, 'housekeeping-requests'); //
}

function downloadHistoryCSV() { //
    if (filteredHistory.length === 0) { //
        alert("No history data to export based on current filters."); //
        return; //
    }
    // Adjust headers/data mapping based on your actual history data structure
    const headers = ['Floor', 'Room', 'Guest', 'Date', 'Requested Time', 'Completed Time', 'Staff In Charge', 'Status', 'Remarks']; //
    const csvContent = [ //
        headers.join(','), //
        ...filteredHistory.map(hist => //
            [ //
                hist.floor, hist.room, hist.guest, hist.date, hist.requestedTime, //
                hist.completedTime, hist.staff, 'Cleaned', //
                `"${(hist.remarks || '').replace(/"/g, '""')}"` // Escape quotes in remarks //
             ].join(',') //
        ) //
    ].join('\n'); //
    downloadCSV(csvContent, 'housekeeping-history'); //
}

function downloadCSV(csvContent, filenamePrefix) { //
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); //
    const url = URL.createObjectURL(blob); //
    const link = document.createElement('a'); //
    link.setAttribute('href', url); //
    link.setAttribute('download', `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`); //
    link.style.visibility = 'hidden'; //
    document.body.appendChild(link); //
    link.click(); //
    document.body.removeChild(link); //
    URL.revokeObjectURL(url); //
}

// ===== API Call Utility (Optional - useful if making AJAX calls) =====
/*
async function apiCall(endpoint, action, data = {}, method = 'GET') {
    // Implementation similar to admin.js apiCall function
    // Needed for handleConfirmAssignment when using a real backend
}
*/