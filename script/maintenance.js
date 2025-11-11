// ===== GLOBAL VARIABLES =====
let currentRequestsData = [];
let currentStaffData = [];
let currentHistoryData = [];
let currentAppliancesData = [];
let allRooms = [];
let appliancesTypes = [];

let filteredRequests = [];
let filteredStaff = [];
let filteredHistory = [];
let filteredAppliances = [];

let selectedStaffId = null;
let currentRequestId = null;
let currentApplianceId = null;

// Pagination State
const paginationState = {
  requests: { currentPage: 1, itemsPerPage: 10 },
  history: { currentPage: 1, itemsPerPage: 10 },
  appliances: { currentPage: 1, itemsPerPage: 10 }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Loaded - Initializing...');
  currentRequestsData = typeof initialRequestsData !== 'undefined' ? initialRequestsData : [];
  currentStaffData = typeof availableStaffData !== 'undefined' ? availableStaffData : [];
  currentAppliancesData = typeof initialAppliancesData !== 'undefined' ? initialAppliancesData : [];
  currentHistoryData = typeof initialHistoryData !== 'undefined' ? initialHistoryData : [];
  allRooms = typeof allRoomsData !== 'undefined' ? allRoomsData : [];
  appliancesTypes = typeof appliancesTypesData !== 'undefined' ? appliancesTypesData : [];

  console.log('Initial Data:', {
    requests: currentRequestsData.length,
    staff: currentStaffData.length,
    appliances: currentAppliancesData.length,
    rooms: allRooms.length,
    types: appliancesTypes
  });

  applyRequestFiltersAndRender();
  applyHistoryFiltersAndRender();
  applyAppliancesFiltersAndRender();

  setupEventListeners();
  populateStaticFilters();
  populateAppliancesFilters();
  populateHistoryFilters();
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

    // Request Filters
    document.getElementById('floorFilter')?.addEventListener('change', applyRequestFiltersAndRender);
    document.getElementById('roomFilter')?.addEventListener('change', applyRequestFiltersAndRender);
    document.getElementById('searchInput')?.addEventListener('input', applyRequestFiltersAndRender);
    document.getElementById('refreshBtn')?.addEventListener('click', resetRequestFilters);
    document.getElementById('downloadBtnRequests')?.addEventListener('click', downloadRequestsCSV);

    // History Filters
    document.getElementById('floorFilterHistory')?.addEventListener('change', () => {
        updateHistoryRoomFilterOptions();
        applyHistoryFiltersAndRender();
    });
    document.getElementById('roomFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
    document.getElementById('dateFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
    document.getElementById('historySearchInput')?.addEventListener('input', applyHistoryFiltersAndRender);
    document.getElementById('historyRefreshBtn')?.addEventListener('click', resetHistoryFilters);
    document.getElementById('historyDownloadBtn')?.addEventListener('click', downloadHistoryCSV);

    // Appliances Filters
    document.getElementById('floorFilterAppliances')?.addEventListener('change', () => {
        updateAppliancesRoomFilterOptions();
        applyAppliancesFiltersAndRender();
    });
    document.getElementById('roomFilterAppliances')?.addEventListener('change', applyAppliancesFiltersAndRender);
    document.getElementById('typeFilterAppliances')?.addEventListener('change', applyAppliancesFiltersAndRender);
    document.getElementById('appliancesSearchInput')?.addEventListener('input', applyAppliancesFiltersAndRender);
    document.getElementById('appliancesRefreshBtn')?.addEventListener('click', resetAppliancesFilters);
    document.getElementById('appliancesDownloadBtn')?.addEventListener('click', downloadAppliancesCSV);

    // Add Appliance Button
    const addBtn = document.getElementById('addApplianceBtn');
    console.log('Add Appliance Button:', addBtn);
    addBtn?.addEventListener('click', () => {
        console.log('Add Appliance button clicked');
        showAddApplianceModal(false, null);
    });

    // Add/Edit Appliance Modal
    document.getElementById('closeAddApplianceBtn')?.addEventListener('click', hideAddApplianceModal);
    document.getElementById('cancelAddApplianceBtn')?.addEventListener('click', hideAddApplianceModal);
    
    const addForm = document.getElementById('addApplianceForm');
    console.log('Add Appliance Form:', addForm);
    addForm?.addEventListener('submit', handleAddApplianceSubmit); 
    
    document.getElementById('applianceFloor')?.addEventListener('change', updateApplianceRoomDropdown);

    // Success Modal
    document.getElementById('closeSuccessBtn')?.addEventListener('click', hideSuccessModal);
    document.getElementById('okaySuccessBtn')?.addEventListener('click', hideSuccessModal);

    // Delete Modal
    document.getElementById('closeDeleteBtn')?.addEventListener('click', hideDeleteModal);
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', hideDeleteModal);
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', handleConfirmDelete); 

    // Staff Modal
    document.getElementById('closeStaffModalBtn')?.addEventListener('click', hideStaffModal);
    document.getElementById('cancelStaffBtn')?.addEventListener('click', hideStaffModal);
    document.getElementById('staffModalSearchInput')?.addEventListener('input', filterStaffInModal);
    document.getElementById('staffModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) hideStaffModal();
    });
    // Connect the "ASSIGN STAFF" button in the modal
    document.getElementById('confirmStaffAssignBtn')?.addEventListener('click', handleStaffAssign);

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

function renderPaginationControls(controlsContainerId, totalPages, currentPage, onPageChange) {
    const container = document.getElementById(controlsContainerId);
    if (!container) return;

    container.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'paginationBtn';
    prevBtn.textContent = '←';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageChange(currentPage - 1);
    container.appendChild(prevBtn);

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.className = 'paginationBtn';
        firstPageBtn.textContent = '1';
        firstPageBtn.onclick = () => onPageChange(1);
        container.appendChild(firstPageBtn);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'paginationDots';
            container.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `paginationBtn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => onPageChange(i);
        container.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'paginationDots';
            container.appendChild(dots);
        }
        const lastPageBtn = document.createElement('button');
        lastPageBtn.className = 'paginationBtn';
        lastPageBtn.textContent = totalPages;
        lastPageBtn.onclick = () => onPageChange(totalPages);
        container.appendChild(lastPageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'paginationBtn';
    nextBtn.textContent = '→';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => onPageChange(currentPage + 1);
    container.appendChild(nextBtn);
}

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

  if (paginatedData.length === 0 && state.currentPage === 1) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No rooms found.</td></tr>';
  } else if (paginatedData.length === 0 && state.currentPage > 1) {
      state.currentPage--;
      renderRequestsTable();
      return;
  } else {
    tbody.innerHTML = paginatedData.map(req => {
        
        const statusClass = req.status.toLowerCase().replace(/ /g, '-');
        const statusDisplay = req.status;

        // Logic for Assign Staff button visibility and state
        let assignButton;
        const status = req.status;

        if (status === 'Needs Maintenance' || status === 'Pending') {
            // Clickable button
            assignButton = `<button class="assignBtn" data-room-id="${req.id}">Assign Staff</button>`;
        } else if (status === 'Available' || status === 'Needs Cleaning') {
            // Visible but disabled (unclickable) button
            assignButton = `<button class="assignBtn" data-room-id="${req.id}" disabled>Assign Staff</button>`;
        } else {
            // N/A for all other statuses (Occupied, Cleaned, In Progress etc.)
            assignButton = 'N/A';
        }
        
        // If status is 'Pending' or 'In Progress', show the staff name instead of button
        if (status === 'Pending' || status === 'In Progress') {
             assignButton = req.staff || 'Pending...';
        }

        return `
          <tr>
            <td>${req.floor ?? 'N/A'}</td>
            <td>${req.room ?? 'N/A'}</td>
            <td>${req.date ?? 'N/A'}</td>
            <td>${req.requestTime ?? 'N/A'}</td>
            <td>${req.lastMaintenance ?? 'N/A'}</td>
            <td><span class="statusBadge ${statusClass}">${statusDisplay}</span></td>
            <td>${assignButton}</td>
          </tr>
        `;
    }).join('');

    // Event listener will only work on non-disabled buttons
    tbody.querySelectorAll('.assignBtn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentRequestId = parseInt(e.target.getAttribute('data-room-id'));
        showStaffModal();
      });
    });
  }

  recordCountEl.textContent = filteredRequests.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRequestsTable();
  });
}

// ===== RENDER HISTORY TABLE =====
function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  const recordCountEl = document.getElementById('historyRecordCount');
  const paginationControlsContainerId = 'historyPaginationControls';
  const state = paginationState.history;

  if (!tbody || !recordCountEl) return;

  const totalPages = getTotalPages(filteredHistory.length, state.itemsPerPage);
  if (state.currentPage > totalPages) {
      state.currentPage = Math.max(1, totalPages);
  }
  const paginatedData = paginateData(filteredHistory, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0 && state.currentPage === 1) {
     tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history records found matching criteria.</td></tr>';
  } else if (paginatedData.length === 0 && state.currentPage > 1) {
      state.currentPage--;
      renderHistoryTable();
      return;
  } else {
    tbody.innerHTML = paginatedData.map(hist => `
      <tr>
        <td>${hist.floor ?? 'N/A'}</td>
        <td>${hist.room ?? 'N/A'}</td>
        <td>${hist.issueType ?? 'N/A'}</td>
        <td>${hist.date ?? 'N/A'}</td>
        <td>${hist.requestedTime ?? 'N/A'}</td>
        <td>${hist.completedTime ?? 'N/A'}</td>
        <td>${hist.staff ?? 'N/A'}</td>
        <td><span class="statusBadge ${hist.status === 'Completed' ? 'repaired' : 'maintenance'}">${hist.status ?? 'N/A'}</span></td>
        <td>${hist.remarks ?? ''}</td>
      </tr>
    `).join('');
  }

  recordCountEl.textContent = filteredHistory.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHistoryTable();
  });
}

// ===== RENDER APPLIANCES TABLE =====
function renderAppliancesTable() {
  const tbody = document.getElementById('appliancesTableBody');
  const recordCountEl = document.getElementById('appliancesRecordCount');
  const paginationControlsContainerId = 'appliancesPaginationControls';
  const state = paginationState.appliances;

  if (!tbody || !recordCountEl) return;

  const totalPages = getTotalPages(filteredAppliances.length, state.itemsPerPage);
  if (state.currentPage > totalPages) {
    state.currentPage = Math.max(1, totalPages);
  }
  const paginatedData = paginateData(filteredAppliances, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0 && state.currentPage === 1) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No appliances found matching filters.</td></tr>';
  } else if (paginatedData.length === 0 && state.currentPage > 1) {
      state.currentPage--;
      renderAppliancesTable();
      return;
  } else {
    tbody.innerHTML = paginatedData.map(app => `
      <tr>
        <td>${app.floor ?? 'N/A'}</td>
        <td>${app.room ?? 'N/A'}</td>
        <td>${app.installedDate ?? 'N/A'}</td>
        <td>${app.type ?? 'N/A'}</td>
        <td>${app.item ?? 'N/A'}</td>
        <td>${app.lastMaintained ?? 'Never'}</td>
        <td><span class="statusBadge ${app.status === 'Working' ? 'repaired' : (app.status === 'Needs Repair' || app.status === 'Out of Service') ? 'urgent' : 'maintenance'}">${app.status ?? 'Unknown'}</span></td>
        <td>${app.remarks ?? ''}</td>
        <td>
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <button class="actionIconBtn editBtn" data-appliance-id="${app.id}" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="actionIconBtn deleteBtn" data-appliance-id="${app.id}" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.editBtn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const applianceId = parseInt(this.getAttribute('data-appliance-id'));
        console.log('Edit button clicked for appliance:', applianceId);
        handleEditAppliance(applianceId);
      });
    });

    tbody.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const applianceId = parseInt(this.getAttribute('data-appliance-id'));
        console.log('Delete button clicked for appliance:', applianceId);
        handleDeleteAppliance(applianceId);
      });
    });
  }

  recordCountEl.textContent = filteredAppliances.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderAppliancesTable();
  });
}

// ===== RENDER STAFF LIST =====
function renderStaffList(staffToRender = filteredStaff) {
  const staffList = document.getElementById('staffList');
  const assignBtn = document.getElementById('confirmStaffAssignBtn');
  if (!staffList) return;

  // Clear selection and disable button
  selectedStaffId = null;
  if (assignBtn) assignBtn.disabled = true;

  if (staffToRender.length === 0) {
    staffList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No maintenance staff found.</div>';
    return;
  }

  staffList.innerHTML = staffToRender.map(staff => {
    // This now reads 'Available', 'Assigned', or 'Offline' from the DB
    const statusClass = staff.availability.toLowerCase().replace(/ /g, '-'); 
    
    // Only 'Available' staff are clickable
    const isClickable = staff.availability === 'Available' ? 'clickable' : 'offline';
    
    return `
      <div class="staffListItem ${isClickable}" data-staff-id="${staff.id}" data-availability="${staff.availability}">
        <div class="staffListName">${staff.name}</div>
        <span class="staffListStatus ${statusClass}">${staff.availability}</span>
      </div>
    `;
  }).join('');

  // Add click listeners ONLY to clickable (Available) staff
  staffList.querySelectorAll('.staffListItem.clickable').forEach(item => {
    item.addEventListener('click', () => {
        staffList.querySelectorAll('.staffListItem').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedStaffId = parseInt(item.dataset.staffId);
        if (assignBtn) assignBtn.disabled = false;
    });
  });
}

// ===== HANDLE STAFF ASSIGNMENT (LIVE) =====
async function handleStaffAssign() {
    if (!selectedStaffId || !currentRequestId) {
        alert("Error: Staff or Room ID is missing.");
        return;
    }

    const assignBtn = document.getElementById('confirmStaffAssignBtn');
    assignBtn.disabled = true;
    assignBtn.textContent = 'ASSIGNING...';

    // This is now a REAL API call
    try {
        const response = await fetch('api_maintenance.php', { // Use the main API file
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'assign_task',
                roomId: currentRequestId,
                staffId: selectedStaffId
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Email sent and status set to 'Pending' in DB
            
            // 1. Update the "Requests" tab UI
            const roomInRequests = currentRequestsData.find(room => room.id == currentRequestId);
            if (roomInRequests) {
                roomInRequests.status = 'Pending';
                roomInRequests.staff = result.staffName; // Get the staff name from the API
            }
            applyRequestFiltersAndRender();
            
            // 2. Update the Staff's availability in the *local* data
            const staffInList = currentStaffData.find(staff => staff.id == selectedStaffId);
            if (staffInList) {
                staffInList.availability = 'Assigned';
            }
            
            hideStaffModal();
            showSuccessModal('Task Assigned Successfully!');
        } else {
            // Show the error from the PHP file (e.g., "No pending request...")
            alert("Failed to assign task: " + result.message);
        }

    } catch (error) {
        console.error('Error assigning staff:', error);
        // This will catch the "Unexpected token '<'" error if it still happens
        alert("An error occurred. The server response was not valid JSON.");
    } finally {
        assignBtn.disabled = false;
        assignBtn.textContent = 'ASSIGN STAFF';
    }
}

// ===== FILTERING LOGIC =====
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

function applyHistoryFiltersAndRender() {
  const floor = document.getElementById('floorFilterHistory')?.value || '';
  const room = document.getElementById('roomFilterHistory')?.value || '';
  const date = document.getElementById('dateFilterHistory')?.value || '';
  const search = document.getElementById('historySearchInput')?.value.toLowerCase() || '';

  filteredHistory = currentHistoryData.filter(hist => {
    const matchFloor = !floor || (hist.floor && hist.floor.toString() === floor);
    const matchRoom = !room || (hist.room && hist.room.toString() === room);
    
    const histDateISO = convertDisplayDateToISO(hist.date);
    const matchDate = !date || (histDateISO && histDateISO === date);

    const matchSearch = !search || 
      (hist.room && hist.room.toString().includes(search)) ||
      (hist.staff && hist.staff.toLowerCase().includes(search)) ||
      (hist.issueType && hist.issueType.toLowerCase().includes(search));

    return matchFloor && matchRoom && matchDate && matchSearch;
  });

  paginationState.history.currentPage = 1;
  renderHistoryTable();
}

function applyAppliancesFiltersAndRender() {
  const floor = document.getElementById('floorFilterAppliances')?.value || '';
  const room = document.getElementById('roomFilterAppliances')?.value || '';
  const type = document.getElementById('typeFilterAppliances')?.value || '';
  const search = document.getElementById('appliancesSearchInput')?.value.toLowerCase() || '';
  
  filteredAppliances = currentAppliancesData.filter(app => {
    const matchFloor = !floor || app.floor.toString() === floor;
    const matchRoom = !room || app.room.toString() === room; 
    const matchType = !type || app.type === type;
    const matchSearch = !search || 
        app.item.toLowerCase().includes(search) || 
        app.type.toLowerCase().includes(search) ||
        (app.modelNumber && app.modelNumber.toLowerCase().includes(search));

    return matchFloor && matchRoom && matchType && matchSearch;
  });

  paginationState.appliances.currentPage = 1;
  renderAppliancesTable();
}


function filterStaffInModal() {
  const search = document.getElementById('staffModalSearchInput')?.value.toLowerCase() || '';
  
  filteredStaff = currentStaffData.filter(staff => {
    // Check if the name includes the search term
    const nameMatch = staff.name.toLowerCase().includes(search);
    
    // Check if the ID (employee no) includes the search term
    const idMatch = staff.id.toString().toLowerCase().includes(search);
    
    // Return true if EITHER the name or the ID matches
    return nameMatch || idMatch;
  });
  
  renderStaffList();
}

// ===== FILTER UTILITIES =====
function populateStaticFilters() {
    const floorFilter = document.getElementById('floorFilter');
    // Use allRooms (master list) for floor filter
    const floors = [...new Set(allRooms.map(r => r.floor).filter(f => f))].sort((a, b) => a - b);
    if (floorFilter) {
        while (floorFilter.options.length > 1) floorFilter.remove(1);
        floors.forEach(f => {
             const option = document.createElement('option');
             option.value = f;
             option.textContent = f;
             floorFilter.appendChild(option);
        });
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

function populateAppliancesFilters() {
    const floorFilter = document.getElementById('floorFilterAppliances');
    const floors = [...new Set(allRooms.map(a => a.floor))].sort((a, b) => a - b);
    if (floorFilter) {
        while (floorFilter.options.length > 1) floorFilter.remove(1);
        floors.forEach(f => {
            const option = document.createElement('option');
            option.value = f;
            option.textContent = f;
            floorFilter.appendChild(option);
        });
    }

    const typeFilter = document.getElementById('typeFilterAppliances');
    if (typeFilter) {
        while (typeFilter.options.length > 1) typeFilter.remove(1);
        appliancesTypes.forEach(t => {
            const option = document.createElement('option');
            option.value = t;
            option.textContent = t;
            typeFilter.appendChild(option);
        });
    }

    updateAppliancesRoomFilterOptions();
}


function updateRoomFilterOptions() {
     const floorFilter = document.getElementById('floorFilter');
     const roomFilter = document.getElementById('roomFilter');
     if (!roomFilter || !floorFilter) return;

     const selectedFloor = floorFilter.value;
     const currentRoomValue = roomFilter.value;

     roomFilter.innerHTML = '<option value="">Room</option>';

     // Use allRooms (master list)
     const roomsToShow = selectedFloor
        ? allRooms.filter(r => r.floor && r.floor.toString() === selectedFloor)
        : allRooms;

     const roomNumbers = [...new Set(roomsToShow.map(r => r.room).filter(r => r))].sort((a, b) => a - b);

     roomNumbers.forEach(roomNum => {
         const option = document.createElement('option');
         option.value = roomNum;
         option.textContent = roomNum;
         roomFilter.appendChild(option);
     });

     if (roomNumbers.map(String).includes(String(currentRoomValue))) {
         roomFilter.value = currentRoomValue;
     } else if (roomFilter.options.length > 0) {
         roomFilter.value = "";
     }
}

function updateHistoryRoomFilterOptions() {
     const floorFilterHistory = document.getElementById('floorFilterHistory');
     const roomFilterHistory = document.getElementById('roomFilterHistory');
     if (!roomFilterHistory || !floorFilterHistory) return;

     const selectedFloor = floorFilterHistory.value;
     const currentRoomValue = roomFilterHistory.value;

     roomFilterHistory.innerHTML = '<option value="">Room</option>';

     const roomsToShow = selectedFloor
        ? currentHistoryData.filter(h => h.floor && h.floor.toString() === selectedFloor)
        : currentHistoryData;

     const roomNumbers = [...new Set(roomsToShow.map(h => h.room).filter(r => r))].sort((a, b) => a - b);

     roomNumbers.forEach(roomNum => {
         const option = document.createElement('option');
         option.value = roomNum;
         option.textContent = roomNum;
         roomFilterHistory.appendChild(option);
     });

      if (roomNumbers.map(String).includes(String(currentRoomValue))) {
         roomFilterHistory.value = currentRoomValue;
     } else if (roomFilterHistory.options.length > 0) {
         roomFilterHistory.value = "";
     }
}

function updateAppliancesRoomFilterOptions() {
    const floorFilter = document.getElementById('floorFilterAppliances');
    const roomFilter = document.getElementById('roomFilterAppliances');
    if (!roomFilter || !floorFilter) return;

    const selectedFloor = floorFilter.value;
    const currentRoomValue = roomFilter.value;

    roomFilter.innerHTML = '<option value="">Room</option>';

    const roomsToShow = selectedFloor
        ? allRooms.filter(a => a.floor.toString() === selectedFloor)
        : allRooms;

    const roomNumbers = [...new Set(roomsToShow.map(a => a.room))].sort((a, b) => a - b);

    roomNumbers.forEach(roomNum => {
        const option = document.createElement('option');
        option.value = roomNum; // Value is the room number (string)
        option.textContent = roomNum;
        roomFilter.appendChild(option);
    });

    if (roomNumbers.map(String).includes(String(currentRoomValue))) {
        roomFilter.value = currentRoomValue;
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

function resetAppliancesFilters() {
    document.getElementById('floorFilterAppliances').value = '';
    document.getElementById('roomFilterAppliances').value = '';
    document.getElementById('typeFilterAppliances').value = '';
    document.getElementById('appliancesSearchInput').value = '';
    applyAppliancesFiltersAndRender();
}

// ===== MODAL VISIBILITY =====
function showStaffModal() {
    selectedStaffId = null;
    document.getElementById('staffModalSearchInput').value = '';
    filteredStaff = [...currentStaffData];
    renderStaffList();
    document.getElementById('staffModal').style.display = 'flex';
}

function hideStaffModal() {
    document.getElementById('staffModal').style.display = 'none';
}

function showAddApplianceModal(isEdit = false, applianceData = null) {
  console.log('showAddApplianceModal called', { isEdit, applianceData });
  
  const modal = document.getElementById('addApplianceModal');
  const modalTitle = document.getElementById('addApplianceModalTitle');
  const modalSubtext = document.getElementById('addApplianceModalSubtext');
  const submitBtn = document.getElementById('submitApplianceBtn');
  
  modalSubtext.classList.remove('modal-error-message');
  modalSubtext.style.color = ''; 
  
  const inputs = {
    floor: document.getElementById('applianceFloor'),
    room: document.getElementById('applianceRoom'),
    name: document.getElementById('applianceName'),
    type: document.getElementById('applianceType'),
    manufacturer: document.getElementById('applianceManufacturer'),
    modelNumber: document.getElementById('applianceModelNumber'),
    installedDate: document.getElementById('applianceInstalledDate'),
    status: document.getElementById('applianceStatus'),
    remarks: document.getElementById('applianceRemarks')
  };

  const statusGroup = document.getElementById('formGroup-status');
  const remarksGroup = document.getElementById('formGroup-remarks');

  if (isEdit && applianceData) {
    console.log('Setting up EDIT mode');
    modalTitle.textContent = 'Edit Appliance Status';
    modalSubtext.textContent = 'Update the status and remarks for this appliance. All other details are read-only.';
    submitBtn.textContent = 'UPDATE STATUS';
    
    document.getElementById('applianceId').value = applianceData.id;
    
    populateApplianceFloorDropdown();
    inputs.floor.value = applianceData.floor;
    inputs.floor.disabled = true;
    
    updateApplianceRoomDropdown(); 
    inputs.room.value = applianceData.roomId; 
    inputs.room.disabled = true;
    
    inputs.name.value = applianceData.item;
    inputs.name.disabled = true;
    
    populateApplianceTypeDropdown();
    inputs.type.value = applianceData.type;
    inputs.type.disabled = true;
    
    inputs.manufacturer.value = applianceData.manufacturer || '';
    inputs.manufacturer.disabled = true;
    inputs.modelNumber.value = applianceData.modelNumber || '';
    inputs.modelNumber.disabled = true;
    inputs.installedDate.value = convertDisplayDateToISO(applianceData.installedDate);
    inputs.installedDate.disabled = true;

    statusGroup.style.display = 'flex';
    inputs.status.value = applianceData.status || 'Working';
    inputs.status.disabled = false;
    inputs.status.required = true;
    
    remarksGroup.style.display = 'flex';
    inputs.remarks.value = applianceData.remarks || '';
    inputs.remarks.disabled = false;
    
  } else {
    console.log('Setting up ADD mode');
    modalTitle.textContent = 'Add Appliance';
    modalSubtext.textContent = 'Please fill out the appliance details carefully before submitting.';
    submitBtn.textContent = 'ADD APPLIANCE';
    
    document.getElementById('applianceId').value = '';
    document.getElementById('addApplianceForm').reset();
    
    Object.values(inputs).forEach(input => {
        if (input.id !== 'applianceStatus' && input.id !== 'applianceRemarks') {
            input.disabled = false;
        }
    });

    statusGroup.style.display = 'none';
    inputs.status.disabled = true;
    inputs.status.required = false;
    remarksGroup.style.display = 'none';
    inputs.remarks.disabled = true;

    populateApplianceFloorDropdown();
    updateApplianceRoomDropdown();
    populateApplianceTypeDropdown();
  }
  
  console.log('Opening modal...');
  modal.style.display = 'flex';
}


function hideAddApplianceModal() {
  console.log('hideAddApplianceModal called');
  document.getElementById('addApplianceModal').style.display = 'none';
  document.getElementById('addApplianceForm').reset();
  
  const inputs = document.querySelectorAll('#addApplianceForm .formInput');
  inputs.forEach(input => input.disabled = false);
  
  const modalSubtext = document.getElementById('addApplianceModalSubtext');
  modalSubtext.textContent = 'Please fill out the appliance details carefully before submitting.';
  modalSubtext.classList.remove('modal-error-message');
  modalSubtext.style.color = '';
  
  document.getElementById('formGroup-status').style.display = 'none';
  document.getElementById('formGroup-remarks').style.display = 'none';
}

function showSuccessModal(message) {
  console.log('showSuccessModal called:', message);
  document.getElementById('successModalMessage').textContent = message;
  document.getElementById('successModal').style.display = 'flex';
}

function hideSuccessModal() {
  console.log('hideSuccessModal called');
  document.getElementById('successModal').style.display = 'none';
}

function showDeleteModal() {
  console.log('showDeleteModal called');
  document.getElementById('deleteModal').style.display = 'flex';
}

function hideDeleteModal() {
  console.log('hideDeleteModal called');
  document.getElementById('deleteModal').style.display = 'none';
  currentApplianceId = null;
}

// ===== FORM HANDLING =====
function populateApplianceFloorDropdown() {
  console.log('populateApplianceFloorDropdown called');
  const floorSelect = document.getElementById('applianceFloor');
  floorSelect.innerHTML = '<option value="">Select Floor</option>';
  
  const floors = [...new Set(allRooms.map(r => r.floor))].sort((a, b) => a - b);
  console.log('Available floors:', floors);
  
  floors.forEach(floor => {
    const option = document.createElement('option');
    option.value = floor;
    option.textContent = floor;
    floorSelect.appendChild(option);
  });
}

function updateApplianceRoomDropdown() {
  console.log('updateApplianceRoomDropdown called');
  const floorSelect = document.getElementById('applianceFloor');
  const roomSelect = document.getElementById('applianceRoom');
  const selectedFloor = floorSelect.value;
  
  console.log('Selected floor:', selectedFloor);
  
  roomSelect.innerHTML = '<option value="">Select Room</option>';
  
  if (!selectedFloor) return;
  
  const rooms = allRooms.filter(r => r.floor.toString() === selectedFloor);
  console.log('Rooms for floor:', rooms);
  
  rooms.forEach(room => {
    const option = document.createElement('option');
    option.value = room.id; // The value is the crm.rooms.RoomID
    option.textContent = room.room; // The text is the RoomNumber
    roomSelect.appendChild(option);
  });
}

function populateApplianceTypeDropdown() {
    const typeSelect = document.getElementById('applianceType');
    while (typeSelect.options.length > 1) {
        typeSelect.remove(1);
    }
    
    appliancesTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
}

async function handleAddApplianceSubmit(e) {
  e.preventDefault();
  console.log('handleAddApplianceSubmit called');
  
  const applianceId = document.getElementById('applianceId').value;
  const isEdit = applianceId !== '';
  const modalSubtext = document.getElementById('addApplianceModalSubtext');
  const submitBtn = document.getElementById('submitApplianceBtn');
  
  modalSubtext.textContent = 'Processing...';
  modalSubtext.classList.remove('modal-error-message');
  modalSubtext.style.color = '';
  submitBtn.disabled = true;

  console.log('Form mode:', isEdit ? 'EDIT' : 'ADD');
  
  let action, body;
  
  if (isEdit) {
    action = 'edit_appliance_status';
    body = {
      action: action,
      id: parseInt(applianceId),
      status: document.getElementById('applianceStatus').value,
      remarks: document.getElementById('applianceRemarks').value,
    };
  } else {
    action = 'add_appliance';
    body = {
      action: action,
      roomId: document.getElementById('applianceRoom').value,
      item: document.getElementById('applianceName').value,
      type: document.getElementById('applianceType').value,
      manufacturer: document.getElementById('applianceManufacturer').value,
      modelNumber: document.getElementById('applianceModelNumber').value,
      installedDate: document.getElementById('applianceInstalledDate').value,
      remarks: ""
    };
  }
  
  console.log('Calling API with action:', action, 'and body:', body);

  try {
    const result = await handleApiCall(action, body);
    
    console.log('API Result:', result);

    if (result.status === 'success') {
      hideAddApplianceModal();
      
      const updatedAppliance = result.data;
      
      if (isEdit) {
        const index = currentAppliancesData.findIndex(app => app.id == updatedAppliance.id);
        if (index !== -1) {
          currentAppliancesData[index] = updatedAppliance;
          console.log('Updated appliance in array at index:', index);
        }
      } else {
        currentAppliancesData.push(updatedAppliance);
        console.log('Added new appliance to array');
      }

      // Update the Requests tab data visually
      const affectedRoomId = updatedAppliance.roomId;
      const roomInRequests = currentRequestsData.find(room => room.id == affectedRoomId);

      if (roomInRequests) {
        const applianceStatus = updatedAppliance.status;

        if (applianceStatus === 'Needs Repair' || applianceStatus === 'Out of Service') {
            roomInRequests.status = 'Needs Maintenance';
            
            const now = new Date();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const year = now.getFullYear();
            
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            
            roomInRequests.date = `${month}.${day}.${year}`;
            roomInRequests.requestTime = `${hours}:${minutes} ${ampm}`;
            
            console.log('Visually updated Requests tab to Needs Maintenance');

        } else if (applianceStatus === 'Working') {
            const otherBroken = currentAppliancesData.some(app => 
                app.roomId == affectedRoomId && 
                app.id != updatedAppliance.id && 
                (app.status === 'Needs Repair' || app.status === 'Out of Service')
            );

            if (!otherBroken && roomInRequests.status === 'Needs Maintenance') {
                roomInRequests.status = 'Available';
                roomInRequests.date = 'N/A';
                roomInRequests.requestTime = 'N/A';
                console.log('Visually updated Requests tab to Available');
            }
        }
      }
      
      applyAppliancesFiltersAndRender();
      applyRequestFiltersAndRender(); 
      
      showSuccessModal(isEdit ? 'Appliance Updated Successfully' : 'Appliance Added Successfully');
      
    } else {
      console.error('API Error:', result.message);
      modalSubtext.textContent = result.message; 
      modalSubtext.classList.add('modal-error-message');
      modalSubtext.style.color = 'red';
    }
  } catch (error) {
    console.error('API Call Failed:', error);
    modalSubtext.textContent = error.message; 
    modalSubtext.classList.add('modal-error-message');
    modalSubtext.style.color = 'red';
  } finally {
    submitBtn.disabled = false;
  }
}


async function handleApiCall(action, data) {
    console.log('handleApiCall called', { action, data });
    
    const payload = { action, ...data };
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('api_maintenance.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
        throw new Error(`Network response was not ok (HTTP ${response.status})`);
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    
    return result;
}


function handleEditAppliance(applianceId) {
  console.log('handleEditAppliance called with ID:', applianceId);
  
  // FIX: Use == to compare string from data and number
  const appliance = currentAppliancesData.find(a => a.id == applianceId); 
  
  if (!appliance) {
      console.error('Appliance not found:', applianceId);
      return;
  }
  
  console.log('Found appliance:', appliance);
  currentApplianceId = applianceId;
  showAddApplianceModal(true, appliance);
}

function handleDeleteAppliance(applianceId) {
  console.log('handleDeleteAppliance called with ID:', applianceId);
  currentApplianceId = applianceId;
  showDeleteModal();
}

async function handleConfirmDelete() {
  console.log('handleConfirmDelete called for ID:', currentApplianceId);
  
  if (!currentApplianceId) {
      console.error('No appliance ID set!');
      return;
  }
  
  const applianceToDelId = currentApplianceId;
  currentApplianceId = null;
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  
  confirmBtn.disabled = true;
  
  try {
    console.log('Calling API: delete_appliance');
    const result = await handleApiCall('delete_appliance', { id: applianceToDelId });

    hideDeleteModal();

    if (result && result.status === 'success') {
      console.log('Delete successful');
      
      const index = currentAppliancesData.findIndex(app => app.id === applianceToDelId);
      if (index !== -1) {
        currentAppliancesData.splice(index, 1);
        console.log('Removed appliance from array at index:', index);
      }
      
      showSuccessModal('Appliance Deleted Successfully');
      applyAppliancesFiltersAndRender();
      
    } else {
        alert(`Error deleting appliance: ${result.message}`);
    }
  } catch (error) {
    console.error('Error in handleConfirmDelete:', error);
    hideDeleteModal();
    alert(`An error occurred: ${error.message}`);
  } finally {
      confirmBtn.disabled = false;
  }
}

// ===== HANDLE STAFF ASSIGNMENT (LIVE) =====
async function handleStaffAssign() {
    if (!selectedStaffId || !currentRequestId) {
        alert("Error: Staff or Room ID is missing.");
        return;
    }

    const assignBtn = document.getElementById('confirmStaffAssignBtn');
    assignBtn.disabled = true;
    assignBtn.textContent = 'ASSIGNING...';

    // This is now a REAL API call
    try {
        const response = await fetch('api_maintenance.php', { // Use the main API file
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'assign_task',
                roomId: currentRequestId,
                staffId: selectedStaffId
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Email sent and status set to 'Pending' in DB
            // Now, update the UI
            const roomInRequests = currentRequestsData.find(room => room.id == currentRequestId);
            if (roomInRequests) {
                roomInRequests.status = 'Pending';
                roomInRequests.staff = result.staffName; // Get the staff name from the API
            }
            applyRequestFiltersAndRender();
            
            hideStaffModal();
            showSuccessModal('Task Assigned Successfully!');
        } else {
            // Show the error from the PHP file (e.g., "No pending request...")
            alert("Failed to assign task: " + result.message);
        }

    } catch (error) {
        console.error('Error assigning staff:', error);
        alert("An error occurred. Please try again.");
    } finally {
        assignBtn.disabled = false;
        assignBtn.textContent = 'ASSIGN STAFF';
    }
}

// ===== DATE FORMATTING UTILITIES =====
function convertDisplayDateToISO(dateString) {
  if (!dateString || dateString === 'N/A') return '';
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (dateString.includes('-')) {
    return dateString;
  }
  return '';
}


// ===== CSV DOWNLOAD =====
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
                req.status ?? 'N/A',
                req.staff ?? 'N/A'
             ].join(',')
        )
    ].join('\n');
    downloadCSV(csvContent, 'maintenance-requests');
}

function downloadHistoryCSV() {
     if (filteredHistory.length === 0) {
        alert("No history data to export based on current filters.");
        return;
    }
    const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Staff In Charge', 'Status', 'Remarks'];
    const csvContent = [
        headers.join(','),
        ...filteredHistory.map(hist =>
            [
                hist.floor ?? 'N/A',
                hist.room ?? 'N/A',
                hist.issueType ?? 'N/A',
                hist.date ?? 'N/A',
                hist.requestedTime ?? 'N/A',
                hist.completedTime ?? 'N/A',
                hist.staff ?? 'N/A',
                hist.status ?? 'N/A',
                `"${(hist.remarks || '').replace(/"/g, '""')}"`
             ].join(',')
        )
    ].join('\n');
    downloadCSV(csvContent, 'maintenance-history');
}

function downloadAppliancesCSV() {
    if (filteredAppliances.length === 0) {
        alert("No appliances data to export based on current filters.");
        return;
    }
    const headers = ['Floor', 'Room', 'Installed Date', 'Types', 'Items', 'Last Maintained', 'Status', 'Remarks'];
    const csvContent = [
        headers.join(','),
        ...filteredAppliances.map(app =>
            [
                app.floor,
                app.room,
                app.installedDate,
                app.type,
                `"${app.item.replace(/"/g, '""')}"`,
                app.lastMaintained,
                app.status,
                `"${(app.remarks || '').replace(/"/g, '""')}"`
             ].join(',')
        )
    ].join('\n');
    downloadCSV(csvContent, 'maintenance-appliances');
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