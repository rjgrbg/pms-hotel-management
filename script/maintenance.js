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
let pendingAction = null;

// Pagination State
const paginationState = {
  requests: { currentPage: 1, itemsPerPage: 10 },
  history: { currentPage: 1, itemsPerPage: 10 },
  appliances: { currentPage: 1, itemsPerPage: 10 }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  currentRequestsData = typeof initialRequestsData !== 'undefined' ? initialRequestsData : [];
  currentStaffData = typeof availableStaffData !== 'undefined' ? availableStaffData : [];
  currentAppliancesData = typeof initialAppliancesData !== 'undefined' ? initialAppliancesData : [];
  currentHistoryData = typeof initialHistoryData !== 'undefined' ? initialHistoryData : [];
  allRooms = typeof allRoomsData !== 'undefined' ? allRoomsData : [];
  appliancesTypes = typeof appliancesTypesData !== 'undefined' ? appliancesTypesData : [];

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
    document.getElementById('addApplianceBtn')?.addEventListener('click', showAddApplianceModal);

    // Add/Edit Appliance Modal
    document.getElementById('closeAddApplianceBtn')?.addEventListener('click', hideAddApplianceModal);
    document.getElementById('cancelAddApplianceBtn')?.addEventListener('click', hideAddApplianceModal);
    document.getElementById('addApplianceForm')?.addEventListener('submit', handleAddApplianceSubmit);
    document.getElementById('applianceFloor')?.addEventListener('change', updateApplianceRoomDropdown);

    // Confirmation Modal
    document.getElementById('cancelConfirmBtn')?.addEventListener('click', hideConfirmModal);
    document.getElementById('confirmActionBtn')?.addEventListener('click', handleConfirmAction);

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
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No rooms require maintenance or match filters.</td></tr>';
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
        <td><span class="statusBadge pending">Maintenance</span></td>
        <td>
          <button class="assignBtn" data-room-id="${req.id}">Assign Staff</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.assignBtn').forEach(btn => {
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
        <td><span class="statusBadge repaired">${hist.status ?? 'N/A'}</span></td>
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
        <td><span class="statusBadge ${app.status === 'Working' ? 'repaired' : app.status === 'Needs Repair' ? 'urgent' : 'maintenance'}">${app.status ?? 'Unknown'}</span></td>
        <td>${app.remarks ?? ''}</td>
        <td>
          <button class="actionIconBtn editBtn" data-appliance-id="${app.id}" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="actionIconBtn deleteBtn" data-appliance-id="${app.id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.editBtn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const applianceId = parseInt(this.getAttribute('data-appliance-id'));
        handleEditAppliance(applianceId);
      });
    });

    tbody.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const applianceId = parseInt(this.getAttribute('data-appliance-id'));
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
  if (!staffList) return;

  if (staffToRender.length === 0) {
    staffList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No available maintenance staff found.</div>';
    return;
  }

  staffList.innerHTML = staffToRender.map(staff => `
      <div class="staffListItem ${staff.assigned ? 'assigned' : ''}" data-staff-id="${staff.id}">
        <div class="staffListName">${staff.name}</div>
        <span class="staffListStatus ${staff.assigned ? 'assigned' : 'available'}">${staff.assigned ? 'Assigned' : 'Available'}</span>
      </div>
    `).join('');
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
    const matchDate = !date || (hist.date && hist.date.includes(date));
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
    const matchSearch = !search || app.item.toLowerCase().includes(search) || app.type.toLowerCase().includes(search);

    return matchFloor && matchRoom && matchType && matchSearch;
  });

  paginationState.appliances.currentPage = 1;
  renderAppliancesTable();
}

function filterStaffInModal() {
  const search = document.getElementById('staffModalSearchInput')?.value.toLowerCase() || '';
  filteredStaff = currentStaffData.filter(staff =>
    staff.name.toLowerCase().includes(search)
  );
  renderStaffList();
}

// ===== FILTER UTILITIES =====
function populateStaticFilters() {
    const floorFilter = document.getElementById('floorFilter');
    const floors = [...new Set(currentRequestsData.map(r => r.floor).filter(f => f))].sort((a, b) => a - b);
    if (floorFilter) {
        while (floorFilter.options.length > 1) {
            floorFilter.remove(1);
        }
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
        while (floorFilterHistory.options.length > 1) {
            floorFilterHistory.remove(1);
        }
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
    const floors = [...new Set(currentAppliancesData.map(a => a.floor))].sort((a, b) => a - b);
    if (floorFilter) {
        while (floorFilter.options.length > 1) {
            floorFilter.remove(1);
        }
        floors.forEach(f => {
            const option = document.createElement('option');
            option.value = f;
            option.textContent = f;
            floorFilter.appendChild(option);
        });
    }

    const typeFilter = document.getElementById('typeFilterAppliances');
    const types = [...new Set(currentAppliancesData.map(a => a.type))].sort();
    if (typeFilter) {
        while (typeFilter.options.length > 1) {
            typeFilter.remove(1);
        }
        types.forEach(t => {
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

     const roomsToShow = selectedFloor
        ? currentRequestsData.filter(r => r.floor && r.floor.toString() === selectedFloor)
        : currentRequestsData;

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
        ? currentAppliancesData.filter(a => a.floor.toString() === selectedFloor)
        : currentAppliancesData;

    const roomNumbers = [...new Set(roomsToShow.map(a => a.room))].sort((a, b) => a - b);

    roomNumbers.forEach(roomNum => {
        const option = document.createElement('option');
        option.value = roomNum;
        option.textContent = roomNum;
        roomFilter.appendChild(option);
    });

    if (roomNumbers.includes(parseInt(currentRoomValue))) {
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
  const modal = document.getElementById('addApplianceModal');
  const modalTitle = document.getElementById('addApplianceModalTitle');
  const submitBtn = document.getElementById('submitApplianceBtn');
  
  if (isEdit && applianceData) {
    modalTitle.textContent = 'Edit Appliance';
    submitBtn.textContent = 'UPDATE APPLIANCE';
    
    document.getElementById('applianceId').value = applianceData.id;
    populateApplianceFloorDropdown();
    document.getElementById('applianceFloor').value = applianceData.floor;
    
    updateApplianceRoomDropdown();
    setTimeout(() => {
      const roomSelect = document.getElementById('applianceRoom');
      const roomOption = Array.from(roomSelect.options).find(opt => opt.textContent == applianceData.room);
      if (roomOption) {
        roomSelect.value = roomOption.value;
      }
    }, 50);
    
    document.getElementById('applianceName').value = applianceData.item;
    document.getElementById('applianceType').value = applianceData.type;
    document.getElementById('applianceStatus').value = applianceData.status || '';
    document.getElementById('applianceRemarks').value = applianceData.remarks || '';
    
    if (applianceData.installedDate && applianceData.installedDate !== 'N/A') {
      const dateParts = applianceData.installedDate.split('.');
      if (dateParts.length === 3) {
        const dateStr = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
        document.getElementById('applianceInstalledDate').value = dateStr;
      }
    }
    
    if (applianceData.lastMaintained && applianceData.lastMaintained !== 'Never') {
      const parts = applianceData.lastMaintained.split('/');
      if (parts.length === 2) {
        const dateParts = parts[1].split('.');
        if (dateParts.length === 3) {
          const dateStr = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
          document.getElementById('applianceLastMaintained').value = dateStr;
        }
      }
    }
  } else {
    modalTitle.textContent = 'Add Appliance';
    submitBtn.textContent = 'ADD APPLIANCE';
    document.getElementById('applianceId').value = '';
    document.getElementById('addApplianceForm').reset();
    populateApplianceFloorDropdown();
  }
  
  modal.style.display = 'flex';
}

function hideAddApplianceModal() {
  document.getElementById('addApplianceModal').style.display = 'none';
  document.getElementById('addApplianceForm').reset();
}

function showConfirmModal(title, text, actionText) {
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalText').textContent = text;
  document.getElementById('confirmActionBtn').textContent = actionText;
  document.getElementById('confirmModal').style.display = 'flex';
}

function hideConfirmModal() {
  document.getElementById('confirmModal').style.display = 'none';
  pendingAction = null;
}

function showSuccessModal(message) {
  document.getElementById('successModalMessage').textContent = message;
  document.getElementById('successModal').style.display = 'flex';
}

function hideSuccessModal() {
  document.getElementById('successModal').style.display = 'none';
}

function showDeleteModal() {
  document.getElementById('deleteModal').style.display = 'flex';
}

function hideDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  currentApplianceId = null;
}

// ===== FORM HANDLING =====
function populateApplianceFloorDropdown() {
  const floorSelect = document.getElementById('applianceFloor');
  floorSelect.innerHTML = '<option value="">Select Floor</option>';
  
  const floors = [...new Set(allRooms.map(r => r.floor))].sort((a, b) => a - b);
  floors.forEach(floor => {
    const option = document.createElement('option');
    option.value = floor;
    option.textContent = floor;
    floorSelect.appendChild(option);
  });
}

function updateApplianceRoomDropdown() {
  const floorSelect = document.getElementById('applianceFloor');
  const roomSelect = document.getElementById('applianceRoom');
  const selectedFloor = floorSelect.value;
  
  roomSelect.innerHTML = '<option value="">Select Room</option>';
  
  if (!selectedFloor) return;
  
  const rooms = allRooms.filter(r => r.floor.toString() === selectedFloor);
  rooms.forEach(room => {
    const option = document.createElement('option');
    option.value = room.id;
    option.textContent = room.room;
    roomSelect.appendChild(option);
  });
}

function handleAddApplianceSubmit(e) {
  e.preventDefault();
  
  const applianceId = document.getElementById('applianceId').value;
  const isEdit = applianceId !== '';
  
  const formData = {
    id: applianceId,
    roomId: document.getElementById('applianceRoom').value,
    item: document.getElementById('applianceName').value,
    type: document.getElementById('applianceType').value,
    status: document.getElementById('applianceStatus').value,
    remarks: document.getElementById('applianceRemarks').value,
    installedDate: document.getElementById('applianceInstalledDate').value,
    lastMaintained: document.getElementById('applianceLastMaintained').value
  };
  
  const room = allRooms.find(r => r.id.toString() === formData.roomId);
  if (!room) {
    alert('Please select a valid room');
    return;
  }
  
  formData.floor = room.floor;
  formData.room = room.room;
  
  pendingAction = {
    type: isEdit ? 'edit' : 'add',
    data: formData
  };
  
  hideAddApplianceModal();
  
  if (isEdit) {
    showConfirmModal(
      'Are you sure you want to update this appliance?',
      'Please review the details before confirming. Once updated, the changes will be reflected in the maintenance records.',
      'YES, UPDATE APPLIANCE'
    );
  } else {
    showConfirmModal(
      'Are you sure you want to add this appliance?',
      'Please review the details before confirming. Once added, the appliance will be recorded and visible in the maintenance records.',
      'YES, ADD APPLIANCE'
    );
  }
}

function handleConfirmAction() {
  if (!pendingAction) return;
  
  if (pendingAction.type === 'add') {
    const newAppliance = {
      id: Date.now(),
      roomId: parseInt(pendingAction.data.roomId),
      floor: pendingAction.data.floor,
      room: pendingAction.data.room,
      type: pendingAction.data.type,
      item: pendingAction.data.item,
      status: pendingAction.data.status,
      installedDate: pendingAction.data.installedDate ? formatDateToDisplay(pendingAction.data.installedDate) : 'N/A',
      lastMaintained: pendingAction.data.lastMaintained ? formatDateTimeToDisplay(pendingAction.data.lastMaintained) : 'Never',
      remarks: pendingAction.data.remarks || ''
    };
    
    currentAppliancesData.push(newAppliance);
    
    hideConfirmModal();
    showSuccessModal('Appliance Added Successfully');
    applyAppliancesFiltersAndRender();
    
  } else if (pendingAction.type === 'edit') {
    const applianceIndex = currentAppliancesData.findIndex(app => app.id.toString() === pendingAction.data.id);
    if (applianceIndex !== -1) {
      currentAppliancesData[applianceIndex] = {
        ...currentAppliancesData[applianceIndex],
        roomId: parseInt(pendingAction.data.roomId),
        floor: pendingAction.data.floor,
        room: pendingAction.data.room,
        type: pendingAction.data.type,
        item: pendingAction.data.item,
        status: pendingAction.data.status,
        remarks: pendingAction.data.remarks || '',
        installedDate: pendingAction.data.installedDate ? formatDateToDisplay(pendingAction.data.installedDate) : currentAppliancesData[applianceIndex].installedDate,
        lastMaintained: pendingAction.data.lastMaintained ? formatDateTimeToDisplay(pendingAction.data.lastMaintained) : currentAppliancesData[applianceIndex].lastMaintained
      };
      
      hideConfirmModal();
      showSuccessModal('Appliance Updated Successfully');
      applyAppliancesFiltersAndRender();
    }
  }
  
  pendingAction = null;
}

function handleEditAppliance(applianceId) {
  const appliance = currentAppliancesData.find(a => a.id === applianceId);
  if (!appliance) return;
  
  currentApplianceId = applianceId;
  showAddApplianceModal(true, appliance);
}

function handleDeleteAppliance(applianceId) {
  currentApplianceId = applianceId;
  showDeleteModal();
}

function handleConfirmDelete() {
  if (!currentApplianceId) return;
  
  const applianceIndex = currentAppliancesData.findIndex(app => app.id === currentApplianceId);
  if (applianceIndex !== -1) {
    currentAppliancesData.splice(applianceIndex, 1);
    hideDeleteModal();
    showSuccessModal('Appliance Deleted Successfully');
    applyAppliancesFiltersAndRender();
  }
}

// ===== DATE FORMATTING UTILITIES =====
function formatDateToDisplay(dateString) {
  // Convert YYYY-MM-DD to MM.DD.YYYY
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}.${day}.${year}`;
}

function formatDateTimeToDisplay(dateString) {
  // Convert YYYY-MM-DD to h:mmAM/MM.DD.YYYY
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes}${ampm}/${month}.${day}.${year}`;
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
                'Maintenance',
                req.staff
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