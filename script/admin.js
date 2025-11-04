// ===== PAGINATION STATE =====
const paginationState = {
  rooms: { currentPage: 1, itemsPerPage: 10 },
  housekeeping: { currentPage: 1, itemsPerPage: 10 },
  housekeepingHistory: { currentPage: 1, itemsPerPage: 10 },
  housekeepingLinens: { currentPage: 1, itemsPerPage: 10 },
  housekeepingAmenities: { currentPage: 1, itemsPerPage: 10 },
  maintenance: { currentPage: 1, itemsPerPage: 10 },
  maintenanceHistory: { currentPage: 1, itemsPerPage: 10 },
  maintenanceAppliances: { currentPage: 1, itemsPerPage: 10 },
  parking: { currentPage: 1, itemsPerPage: 10 },
  inventory: { currentPage: 1, itemsPerPage: 10 },
  users: { currentPage: 1, itemsPerPage: 10 },
  userLogs: { currentPage: 1, itemsPerPage: 10 }
};

// ===== ACCOUNT TYPE MAPPING =====
const ACCOUNT_TYPE_MAP = {
  'admin': 'Admin',
  'housekeeping_manager': 'Housekeeping Manager',
  'maintenance_manager': 'Maintenance Manager',
  'inventory_manager': 'Inventory Manager',
  'parking_manager': 'Parking Manager',
  'housekeeping_staff': 'Housekeeping Staff',
  'maintenance_staff': 'Maintenance Staff'
};

// ===== USE SHARED DATA =====
let hkData = [...housekeepingRequests];
let hkHistData = [...housekeepingHistory];
let hkLinensData = [...housekeepingLinens];
let hkAmenitiesData = [...housekeepingAmenities];
let mtRequestsData = [...maintenanceRequests];
let mtHistData = [...maintenanceHistory];
let mtAppliancesData = [...maintenanceAppliances];
let roomData = [];
let parkingDataList = typeof parkingData !== 'undefined' ? [...parkingData] : [];
let inventoryDataList = typeof inventoryData !== 'undefined' ? [...inventoryData] : [];
let usersData = [];
let userLogsDataList = typeof userLogsData !== 'undefined' ? [...userLogsData] : [];
let dashData = dashboardStats;

console.log('Data Loaded:', { roomData, parkingDataList, inventoryDataList, usersData, userLogsDataList });

// --- Room Management DOM Elements ---
const roomsTableBody = document.getElementById('roomsTableBody');
const roomModal = document.getElementById('roomModal');
const closeRoomModalBtn = document.getElementById('closeRoomModalBtn');
const cancelRoomBtn = document.getElementById('cancelRoomBtn');
const roomForm = document.getElementById('roomForm');
const roomModalTitle = document.getElementById('roomModalTitle');
const deleteRoomModal = document.getElementById('deleteRoomModal');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// --- User Management DOM Elements ---
const usersTableBody = document.getElementById('usersTableBody');
const userModal = document.getElementById('userModal');
const closeUserModalBtn = document.getElementById('closeUserModalBtn');
const employeeIdForm = document.getElementById('employeeIdForm');
const userEditForm = document.getElementById('userEditForm');
const userModalTitle = document.getElementById('userModalTitle');
const deleteUserModal = document.getElementById('deleteUserModal');
const closeDeleteUserModalBtn = document.getElementById('closeDeleteUserModalBtn');
const cancelDeleteUserBtn = document.getElementById('cancelDeleteUserBtn');
const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');

// User Logs DOM Elements
const logsTableBody = document.getElementById('logsTableBody');

// Form Inputs - Room
const roomFloorInput = document.getElementById('roomFloor');
const roomNumberInput = document.getElementById('roomNumber');
const roomTypeInput = document.getElementById('roomType');
const roomGuestsInput = document.getElementById('roomGuests');
const roomRateInput = document.getElementById('roomRate');
const roomStatusInput = document.getElementById('roomStatus');

// Form Inputs - User (Edit Form)
const editUserIdInput = document.getElementById('editUserId');
const userFnameInput = document.getElementById('userFname');
const userLnameInput = document.getElementById('userLname');
const userMnameInput = document.getElementById('userMname');
const userBirthdayInput = document.getElementById('userBirthday');
const userAccountTypeInput = document.getElementById('userAccountType');
const userUsernameInput = document.getElementById('userUsername');
const userEmailInput = document.getElementById('userEmail');
const userShiftInput = document.getElementById('userShift');
const userAddressInput = document.getElementById('userAddress');
const userContactInput = document.getElementById('userContact');

// Employee ID Input
const employeeIdInput = document.getElementById('employeeId');

// Filter Elements
const roomsFloorFilter = document.getElementById('roomsFloorFilter');
const roomsRoomFilter = document.getElementById('roomsRoomFilter');

// Hidden field for Room ID
const hiddenRoomIdInput = document.createElement('input');
hiddenRoomIdInput.type = 'hidden';
hiddenRoomIdInput.id = 'editRoomId';
hiddenRoomIdInput.name = 'roomID';
if (roomForm) roomForm.appendChild(hiddenRoomIdInput);

// Form Message Elements
let formMessage = document.getElementById('roomFormMessage');
if (!formMessage && roomForm) {
  formMessage = document.createElement('div');
  formMessage.id = 'roomFormMessage';
  formMessage.className = 'formMessage';
  roomForm.insertBefore(formMessage, roomForm.firstChild);
}

let userFormMessage = document.getElementById('userFormMessage');
if (!userFormMessage && employeeIdForm) {
  userFormMessage = document.createElement('div');
  userFormMessage.id = 'userFormMessage';
  userFormMessage.className = 'formMessage';
  userFormMessage.style.display = 'none';
  userModal.insertBefore(userFormMessage, employeeIdForm);
}

// ===== UTILITY FUNCTIONS FOR FORM MESSAGES =====
function showFormMessage(message, type = 'error', isUserForm = false) {
  const msgElement = isUserForm ? userFormMessage : formMessage;
  if (!msgElement) return;
  msgElement.textContent = message;
  msgElement.className = `formMessage ${type}`;
  msgElement.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      hideFormMessage(isUserForm);
    }, 3000);
  }
}

function hideFormMessage(isUserForm = false) {
  const msgElement = isUserForm ? userFormMessage : formMessage;
  if (!msgElement) return;
  msgElement.style.display = 'none';
  msgElement.textContent = '';
  msgElement.className = 'formMessage';
}

// ===== PAGINATION UTILITY FUNCTIONS =====
function paginateData(data, page, itemsPerPage) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}

function getTotalPages(dataLength, itemsPerPage) {
  return Math.ceil(dataLength / itemsPerPage);
}

function renderPaginationControls(containerId, totalPages, currentPage, onPageChange) {
  const container = document.querySelector(`#${containerId} .paginationControls`);
  if (!container) return;
  
  container.innerHTML = '';
  
  const prevBtn = document.createElement('button');
  prevBtn.className = 'paginationBtn';
  prevBtn.textContent = '←';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => onPageChange(currentPage - 1);
  container.appendChild(prevBtn);
  
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  if (startPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.className = 'paginationBtn';
    firstBtn.textContent = '1';
    firstBtn.onclick = () => onPageChange(1);
    container.appendChild(firstBtn);
    
    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.className = 'paginationDots';
      dots.textContent = '...';
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
      dots.className = 'paginationDots';
      dots.textContent = '...';
      container.appendChild(dots);
    }
    
    const lastBtn = document.createElement('button');
    lastBtn.className = 'paginationBtn';
    lastBtn.textContent = totalPages;
    lastBtn.onclick = () => onPageChange(totalPages);
    container.appendChild(lastBtn);
  }
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'paginationBtn';
  nextBtn.textContent = '→';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => onPageChange(currentPage + 1);
  container.appendChild(nextBtn);
}

// ===== API CALL FUNCTIONS =====
async function apiCall(action, data = {}, method = 'GET', endpoint = 'room_actions.php') {
    const url = endpoint + (method === 'GET' ? `?action=${action}` : '');
    const options = { method: method };

    if (method === 'POST') {
        const formData = new FormData();
        formData.append('action', action);
        for (const key in data) {
            formData.append(key, data[key]);
        }
        options.body = formData;
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Call Failed:', error);
        return { success: false, message: 'Request failed. Please try again.' };
    }
}

// ===== DASHBOARD UPDATE FUNCTIONS =====
function updateDashboardFromRooms(rooms) {
  const totalRooms = rooms.length;
  const occupied = rooms.filter(r => r.Status.toLowerCase() === 'occupied').length;
  const needsCleaning = rooms.filter(r => r.Status === 'Needs Cleaning').length;
  const maintenance = rooms.filter(r => r.Status.toLowerCase() === 'maintenance').length;

  updateStatCard(0, totalRooms);
  updateStatCard(1, occupied);
  updateStatCard(2, needsCleaning);
  updateStatCard(3, maintenance);
}

function updateDashboardFromUsers(users) {
  const totalEmployees = users.length;
  const housekeeping = users.filter(u => 
    u.AccountType === 'housekeeping_manager' || u.AccountType === 'housekeeping_staff'
  ).length;
  const maintenanceUsers = users.filter(u => 
    u.AccountType === 'maintenance_manager' || u.AccountType === 'maintenance_staff'
  ).length;
  const parking = users.filter(u => u.AccountType === 'parking_manager').length;

  updateStatCard(11, totalEmployees);
  updateStatCard(12, housekeeping);
  updateStatCard(13, maintenanceUsers);
  updateStatCard(14, parking);
}

function updateStatCard(index, value) {
  const statCards = document.querySelectorAll('.statValue');
  if (statCards[index]) {
    statCards[index].textContent = value || '0';
  }
}

// ===== ROOM FUNCTIONS =====
async function fetchAndRenderRooms() {
    if (!roomsTableBody) return;
    roomsTableBody.innerHTML = '<tr><td colspan="7">Loading rooms...</td></tr>';
    
    const result = await apiCall('fetch_rooms', {}, 'GET', 'room_actions.php');
    roomsTableBody.innerHTML = ''; 

    if (result.success && result.data.length > 0) {
        roomData = result.data; 
        updateDashboardFromRooms(roomData);
        populateDynamicFilters(roomData); 
        
        paginationState.rooms.currentPage = 1;
        renderRoomsTable(roomData);
        const recordCount = document.getElementById('roomsRecordCount');
        if (recordCount) recordCount.textContent = roomData.length;

    } else if (result.success && result.data.length === 0) {
         roomsTableBody.innerHTML = '<tr><td colspan="7">No rooms found.</td></tr>';
         const recordCount = document.getElementById('roomsRecordCount');
         if (recordCount) recordCount.textContent = 0;
         populateDynamicFilters([]); 
         updateDashboardFromRooms([]); 
         renderPaginationControls('rooms-page', 0, 1, () => {});
    } else {
         roomsTableBody.innerHTML = `<tr><td colspan="7">Failed to load data: ${result.message}</td></tr>`;
         const recordCount = document.getElementById('roomsRecordCount');
         if (recordCount) recordCount.textContent = 0;
         updateDashboardFromRooms([]);
         renderPaginationControls('rooms-page', 0, 1, () => {});
    }
}

function populateDynamicFilters(data) {
    if (!roomsFloorFilter || !roomsRoomFilter) return;

    const floors = [...new Set(data.map(room => room.Floor))].sort((a, b) => a - b);
    
    roomsFloorFilter.innerHTML = '<option value="">Floor</option>';
    floors.forEach(floor => {
        const option = document.createElement('option');
        option.value = floor;
        option.textContent = floor;
        roomsFloorFilter.appendChild(option);
    });

    updateRoomFilterOptions(data);
}

function updateRoomFilterOptions(data, selectedFloor = '') {
    if (!roomsRoomFilter) return;

    let roomsOnFloor;
    if (selectedFloor) {
        roomsOnFloor = data.filter(room => room.Floor.toString() === selectedFloor);
    } else {
        roomsOnFloor = data; 
    }

    const roomNumbers = [...new Set(roomsOnFloor.map(room => room.Room))].sort((a, b) => a - b);
    
    const currentRoomValue = roomsRoomFilter.value;
    roomsRoomFilter.innerHTML = '<option value="">Room</option>';
    
    roomNumbers.forEach(roomNum => {
        const option = document.createElement('option');
        option.value = roomNum;
        option.textContent = roomNum;
        roomsRoomFilter.appendChild(option);
    });

    if (roomNumbers.includes(parseInt(currentRoomValue))) {
        roomsRoomFilter.value = currentRoomValue;
    }
}

const ROOM_CAPACITY_MAP = {
    'Standard Room': '1–2 guests',
    'Deluxe Room': '2–3 guests',
    'Suite': '2–4 guests',
    'Penthouse Suite': '4–6 guests',
};

function updateGuestCapacity() {
    const selectedType = roomTypeInput.value;
    roomGuestsInput.value = ROOM_CAPACITY_MAP[selectedType] || '';
}

function enforceFloorPrefix() {
    const floor = roomFloorInput.value;
    let room = roomNumberInput.value;

    if (!floor) {
        if (room.length > 0) {
             roomNumberInput.value = '';
        }
        return;
    }

    const floorPrefix = floor.toString();
    
    if (room.length > 0 && !room.startsWith(floorPrefix)) {
        roomNumberInput.value = floorPrefix;
    } else if (room.length === 0) {
        roomNumberInput.value = floorPrefix;
    }

    if (roomNumberInput.value.length > 3) {
        roomNumberInput.value = roomNumberInput.value.substring(0, 3);
    }
}

function renderRoomsTable(data) {
  if (!roomsTableBody) return;
  const tbody = roomsTableBody;
  const state = paginationState.rooms;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = row.Status.toLowerCase().replace(/ /g, '-');
      const statusDisplay = row.Status.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      return `
        <tr>
          <td>${row.Floor}</td>
          <td>${row.Room}</td>
          <td>${row.Type}</td>
          <td>${row.NoGuests}</td>
          <td>$${parseFloat(row.Rate).toFixed(2)}</td>
          <td><span class="statusBadge ${statusClass}">${statusDisplay}</span></td>
          <td>
            <div class="actionButtons">
              <button class="actionBtn editBtn" data-room-data='${JSON.stringify(row)}'>
                <img src="assets/icons/edit-icon.png" alt="Edit" />
              </button>
              <button class="actionBtn deleteBtn" data-room-id="${row.RoomID}" data-room-number="${row.Room}">
                <img src="assets/icons/delete-icon.png" alt="Delete" />
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.editBtn').forEach(btn => {
        btn.addEventListener('click', handleEditClick);
    });
    tbody.querySelectorAll('.deleteBtn').forEach(btn => {
        btn.addEventListener('click', handleDeleteClick);
    });
  }
  
  const recordCount = document.getElementById('roomsRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('rooms-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRoomsTable(data);
  });
}

// ===== USER MANAGEMENT FUNCTIONS =====
async function fetchAndRenderUsers() {
    if (!usersTableBody) return;
    console.log('Fetching users...');
    usersTableBody.innerHTML = '<tr><td colspan="6">Loading users...</td></tr>';
    
    const result = await apiCall('fetch_users', {}, 'GET', 'user_actions.php');
    console.log('User fetch result:', result);
    usersTableBody.innerHTML = ''; 

    if (result.success && result.data && result.data.length > 0) {
        usersData = result.data; 
        console.log('Users data loaded:', usersData);
        updateDashboardFromUsers(usersData);
        
        paginationState.users.currentPage = 1;
        renderUsersTable(usersData);
        const recordCount = document.getElementById('usersRecordCount');
        if (recordCount) recordCount.textContent = usersData.length;

    } else if (result.success && (!result.data || result.data.length === 0)) {
         usersTableBody.innerHTML = '<tr><td colspan="6">No users found.</td></tr>';
         const recordCount = document.getElementById('usersRecordCount');
         if (recordCount) recordCount.textContent = 0;
         updateDashboardFromUsers([]); 
         renderPaginationControls('user-management-tab', 0, 1, () => {});
    } else {
         usersTableBody.innerHTML = `<tr><td colspan="6">Failed to load data: ${result.message}</td></tr>`;
         const recordCount = document.getElementById('usersRecordCount');
         if (recordCount) recordCount.textContent = 0;
         updateDashboardFromUsers([]);
         renderPaginationControls('user-management-tab', 0, 1, () => {});
    }
}

function renderUsersTable(data) {
  if (!usersTableBody) return;
  console.log('Rendering users table with data:', data);
  const tbody = usersTableBody;
  const state = paginationState.users;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const fullName = `${row.Lname}, ${row.Fname}${row.Mname ? ' ' + row.Mname.charAt(0) + '.' : ''}`;
      const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;

      return `
        <tr>
          <td>${row.Username}</td>
          <td>${fullName}</td>
          <td><span class="statusBadge ${row.AccountType}">${roleName}</td>
          <td>${row.EmailAddress}</td>
          <td>${row.Shift}</td>
          <td>
            <div class="actionButtons">
              <button class="actionBtn editUserBtn" data-user-data='${JSON.stringify(row).replace(/'/g, "&apos;")}'>
                <img src="assets/icons/edit-icon.png" alt="Edit" />
              </button>
              <button class="actionBtn deleteUserBtn" data-user-id="${row.UserID}" data-username="${row.Username}">
                <img src="assets/icons/delete-icon.png" alt="Delete" />
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.editUserBtn').forEach(btn => {
        btn.addEventListener('click', handleEditUserClick);
    });
    tbody.querySelectorAll('.deleteUserBtn').forEach(btn => {
        btn.addEventListener('click', handleDeleteUserClick);
    });
  }
  
  const recordCount = document.getElementById('usersRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('user-management-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderUsersTable(data);
  });
}

// ===== USER LOGS FUNCTIONS =====
async function fetchAndRenderUserLogs() {
    if (!logsTableBody) return;
    console.log('Fetching user logs...');
    logsTableBody.innerHTML = '<tr><td colspan="12">Loading user logs...</td></tr>';
    
    // For frontend, use mock data
    setTimeout(() => {
        userLogsDataList = [...userLogsData];
        console.log('User logs data loaded:', userLogsDataList);
        
        paginationState.userLogs.currentPage = 1;
        renderUserLogsTable(userLogsDataList);
        const recordCount = document.getElementById('logsRecordCount');
        if (recordCount) recordCount.textContent = userLogsDataList.length;
    }, 300);
}

function renderUserLogsTable(data) {
  if (!logsTableBody) return;
  console.log('Rendering user logs table with data:', data);
  const tbody = logsTableBody;
  const state = paginationState.userLogs;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 40px; color: #999;">No logs found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;
      const actionClass = row.ActionType.toLowerCase().replace(/ /g, '-');

      return `
        <tr>
          <td>${row.LogID}</td>
          <td>${row.UserID}</td>
          <td>${row.Lname}</td>
          <td>${row.Fname}</td>
          <td>${row.Mname}</td>
          <td>${row.AccountType}</td>
          <td>${roleName}</td>
          <td>${row.Shift}</td>
          <td>${row.Username}</td>
          <td>${row.EmailAddress}</td>
          <td><span class="actionBadge ${actionClass}">${row.ActionType}</span></td>
          <td>${row.Timestamp}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('logsRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('user-logs-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderUserLogsTable(data);
  });
}

// ===== HOUSEKEEPING RENDER FUNCTIONS =====
function renderHKTable(data = hkData) {
  const tbody = document.getElementById('hkTableBody');
  if (!tbody) return;
  const state = paginationState.housekeeping;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.guest}</td>
        <td>${row.date}</td>
        <td>${row.requestTime}</td>
        <td>${row.lastCleaned}</td>
        <td><span class="statusBadge ${row.status}">${row.status === 'dirty' ? 'Dirty / Unoccupied' : 'Request Clean / Occupied'}</span></td>
        <td>${row.staff}</td>
      </tr>
    `).join('');
  }
  
  const recordCount = document.getElementById('hkRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('hk-requests-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKTable(data);
  });
}

function renderHKHistTable(data = hkHistData) {
  const tbody = document.getElementById('hkHistTableBody');
  if (!tbody) return;
  const state = paginationState.housekeepingHistory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.guest}</td>
        <td>${row.date}</td>
        <td>${row.requestedTime}</td>
        <td>${row.completedTime}</td>
        <td>${row.staff}</td>
        <td><span class="statusBadge cleaned">${row.status === 'cleaned' ? 'Cleaned' : row.status}</span></td>
        <td>${row.remarks}</td>
      </tr>
    `).join('');
  }
  
  const recordCount = document.getElementById('hkHistRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('hk-history-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKHistTable(data);
  });
}

function renderHKLinensTable(data = hkLinensData) {
  const tbody = document.getElementById('hkLinensTableBody');
  if (!tbody) return;
  const state = paginationState.housekeepingLinens;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = row.status === 'cleaned' ? 'cleaned' : row.status === 'pending' ? 'pending' : row.status;
      return `
        <tr>
          <td>${row.floor}</td>
          <td>${row.room}</td>
          <td>${row.types}</td>
          <td>${row.items}</td>
          <td>${row.timeDate}</td>
          <td><span class="statusBadge ${statusClass}">${row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span></td>
          <td>${row.remarks}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('hkLinensRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('hk-linens-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKLinensTable(data);
  });
}

function renderHKAmenitiesTable(data = hkAmenitiesData) {
  const tbody = document.getElementById('hkAmenitiesTableBody');
  if (!tbody) return;
  const state = paginationState.housekeepingAmenities;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = row.status === 'stocked' ? 'cleaned' : row.status === 'pending' ? 'pending' : row.status;
      return `
        <tr>
          <td>${row.floor}</td>
          <td>${row.room}</td>
          <td>${row.types}</td>
          <td>${row.items}</td>
          <td>${row.timeDate}</td>
          <td><span class="statusBadge ${statusClass}">${row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span></td>
          <td>${row.remarks}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('hkAmenitiesRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('hk-amenities-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKAmenitiesTable(data);
  });
}

// ===== MAINTENANCE RENDER FUNCTIONS =====
function renderMTRequestsTable(data = mtRequestsData) {
  const tbody = document.getElementById('mtRequestsTableBody');
  if (!tbody) return;
  const state = paginationState.maintenance;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = row.status === 'pending' ? 'pending' : row.status === 'in-progress' ? 'request' : row.status;
      const statusText = row.status === 'in-progress' ? 'In Progress' : row.status.charAt(0).toUpperCase() + row.status.slice(1);
      return `
        <tr>
          <td>${row.floor}</td>
          <td>${row.room}</td>
          <td>${row.issue}</td>
          <td>${row.date}</td>
          <td>${row.requestedTime}</td>
          <td>${row.completedTime}</td>
          <td><span class="statusBadge ${statusClass}">${statusText}</span></td>
          <td>${row.staff}</td>
          <td>${row.remarks}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('mtRequestsRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('mt-requests-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderMTRequestsTable(data);
  });
}

function renderMTHistTable(data = mtHistData) {
  const tbody = document.getElementById('mtHistTableBody');
  if (!tbody) return;
  const state = paginationState.maintenanceHistory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.issue}</td>
        <td>${row.date}</td>
        <td>${row.requestedTime}</td>
        <td>${row.completedTime}</td>
        <td><span class="statusBadge repaired">${row.status === 'repaired' ? 'Repaired' : row.status}</span></td>
        <td>${row.staff}</td>
        <td>${row.remarks}</td>
      </tr>
    `).join('');
  }
  
  const recordCount = document.getElementById('mtHistRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('mt-history-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderMTHistTable(data);
  });
}

function renderMTAppliancesTable(data = mtAppliancesData) {
  const tbody = document.getElementById('mtAppliancesTableBody');
  if (!tbody) return;
  const state = paginationState.maintenanceAppliances;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.installedDate}</td>
        <td>${row.types}</td>
        <td>${row.items}</td>
        <td>${row.lastMaintained}</td>
        <td>${row.remarks}</td>
      </tr>
    `).join('');
  }
  
  const recordCount = document.getElementById('mtAppliancesRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('mt-appliances-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderMTAppliancesTable(data);
  });
}

function renderParkingTable(data = parkingDataList) {
  const tbody = document.getElementById('parkingTableBody');
  if (!tbody) return;
  const state = paginationState.parking;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.plateNumber}</td>
        <td>${row.room}</td>
        <td>${row.guestName}</td>
        <td>${row.vehicleType}</td>
        <td>${row.entryTime}</td>
        <td>${row.exitTime}</td>
        <td>${row.slotNumber}</td>
        <td><span class="statusBadge ${row.status}">${row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span></td>
      </tr>
    `).join('');
  }
  
  const recordCount = document.getElementById('parkingRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('parking-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderParkingTable(data);
  });
}

function renderInventoryTable(data = inventoryDataList) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;
  const state = paginationState.inventory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusText = row.status === 'in-stock' ? 'In Stock' : 
                           row.status === 'low-stock' ? 'Low Stock' : 'Out of Stock';
      return `
        <tr>
          <td>${row.id}</td>
          <td>${row.name}</td>
          <td>${row.category}</td>
          <td>${row.quantity !== undefined && row.quantity !== null ? row.quantity : '-'}</td>
          <td>${row.description}</td>
          <td><span class="statusBadge ${row.status}">${statusText}</span></td>
          <td>${row.damage}</td>
          <td>${row.stockInDate}</td>
          <td>${row.stockOutDate}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('inventoryRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('inventory-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderInventoryTable(data);
  });
}

// ===== USER MODAL HANDLERS =====
document.getElementById('addUserBtn')?.addEventListener('click', () => {
    hideFormMessage(true);
    userModalTitle.textContent = 'Add New User';
    
    employeeIdForm.style.display = 'block';
    userEditForm.style.display = 'none';
    
    employeeIdForm.reset();
    
    userModal.style.display = 'flex';
});

closeUserModalBtn?.addEventListener('click', () => {
    userModal.style.display = 'none';
    hideFormMessage(true);
});

document.getElementById('cancelEmployeeIdBtn')?.addEventListener('click', () => {
    userModal.style.display = 'none';
    hideFormMessage(true);
});

document.getElementById('cancelUserEditBtn')?.addEventListener('click', () => {
    userModal.style.display = 'none';
    hideFormMessage(true);
});

employeeIdForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFormMessage(true);
    
    const employeeId = employeeIdInput.value.trim();
    
    if (!employeeId) {
        showFormMessage('Please enter an Employee ID.', 'error', true);
        return;
    }

    console.log('Looking up employee:', employeeId);
    
    const result = await apiCall('add_employee_by_id', { employeeId: employeeId }, 'POST', 'user_actions.php');
    console.log('Add employee result:', result);

    if (result.success) {
        showFormMessage(result.message || 'Employee added successfully!', 'success', true);
        employeeIdForm.reset();
        await fetchAndRenderUsers();
        
        setTimeout(() => {
            userModal.style.display = 'none';
            hideFormMessage(true);
        }, 1500);
    } else {
        showFormMessage(result.message || 'Failed to add employee.', 'error', true);
    }
});

function handleEditUserClick(event) {
    hideFormMessage(true);
    const user = JSON.parse(event.currentTarget.dataset.userData);
    
    userModalTitle.textContent = 'Edit User: ' + user.Username;
    
    employeeIdForm.style.display = 'none';
    userEditForm.style.display = 'block';
    
    document.getElementById('editUserFullName').textContent = `${user.Lname}, ${user.Fname}${user.Mname ? ' ' + user.Mname.charAt(0) + '.' : ''}`;
    document.getElementById('editUserEmployeeId').textContent = `Employee ID: ${user.UserID}`;
    
    editUserIdInput.value = user.UserID;
    userFnameInput.value = user.Fname;
    userLnameInput.value = user.Lname;
    userMnameInput.value = user.Mname || '';
    userBirthdayInput.value = user.Birthday;
    userAccountTypeInput.value = user.AccountType;
    userUsernameInput.value = user.Username;
    userEmailInput.value = user.EmailAddress;
    userShiftInput.value = user.Shift;
    userAddressInput.value = user.Address;
    userContactInput.value = user.Contact || '';

    userModal.style.display = 'flex';
}

userEditForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFormMessage(true);

    const userID = editUserIdInput.value;
    
    const data = {
        userID: userID,
        fname: userFnameInput.value,
        lname: userLnameInput.value,
        mname: userMnameInput.value,
        birthday: userBirthdayInput.value,
        accountType: userAccountTypeInput.value,
        username: userUsernameInput.value,
        email: userEmailInput.value,
        shift: userShiftInput.value,
        address: userAddressInput.value,
        contact: userContactInput.value
    };

    console.log('Updating user data:', data);
    const result = await apiCall('edit_user', data, 'POST', 'user_actions.php');
    console.log('User update result:', result);

    if (result.success) {
        showFormMessage(result.message || 'User updated successfully!', 'success', true);
        await fetchAndRenderUsers();
        
        setTimeout(() => {
            userModal.style.display = 'none';
            hideFormMessage(true);
        }, 1500);
    } else {
        showFormMessage(result.message || 'Failed to update user.', 'error', true);
    }
});

// ===== DELETE USER HANDLERS =====
let userToDeleteID = null;

function handleDeleteUserClick(event) {
    userToDeleteID = event.currentTarget.dataset.userId;
    const username = event.currentTarget.dataset.username;
    document.getElementById('deleteUserText').textContent = `Are you sure you want to delete user "${username}"? This action cannot be undone.`;
    deleteUserModal.style.display = 'flex';
}

closeDeleteUserModalBtn?.addEventListener('click', () => deleteUserModal.style.display = 'none');
cancelDeleteUserBtn?.addEventListener('click', () => deleteUserModal.style.display = 'none');

confirmDeleteUserBtn?.addEventListener('click', async () => {
    if (!userToDeleteID) return;

    const data = { userID: userToDeleteID };
    const result = await apiCall('delete_user', data, 'POST', 'user_actions.php');

    if (result.success) {
        deleteUserModal.style.display = 'none';
        await fetchAndRenderUsers();
    } else {
        alert(result.message);
    }
});

// ===== ROOM MODAL HANDLERS =====
document.getElementById('addRoomBtn')?.addEventListener('click', () => {
    hideFormMessage();
    roomModalTitle.textContent = 'Add New Room';
    roomForm.reset();
    hiddenRoomIdInput.value = '';
    document.getElementById('saveRoomBtn').textContent = 'SAVE ROOM';
    roomModal.style.display = 'flex';
});

closeRoomModalBtn?.addEventListener('click', () => {
    roomModal.style.display = 'none';
    hideFormMessage();
});

cancelRoomBtn?.addEventListener('click', () => {
    roomModal.style.display = 'none';
    hideFormMessage();
});

function handleEditClick(event) {
    hideFormMessage();
    const room = JSON.parse(event.currentTarget.dataset.roomData);
    
    roomModalTitle.textContent = 'Edit Room ' + room.Room;
    document.getElementById('saveRoomBtn').textContent = 'UPDATE ROOM';
    
    hiddenRoomIdInput.value = room.RoomID;
    roomFloorInput.value = room.Floor;
    roomNumberInput.value = room.Room;
    roomTypeInput.value = room.Type;
    roomGuestsInput.value = room.NoGuests;
    roomRateInput.value = room.Rate;
    roomStatusInput.value = room.Status;

    roomModal.style.display = 'flex';
}

roomForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFormMessage();
    
    const floor = roomFloorInput.value;
    const roomNum = roomNumberInput.value;
    if (!roomNum.startsWith(floor)) {
        showFormMessage(`Room Number (${roomNum}) must start with the selected Floor Number (${floor}).`, 'error');
        return;
    }

    const roomID = hiddenRoomIdInput.value;
    const action = roomID ? 'edit_room' : 'add_room';
    
    const data = {
        roomID: roomID,
        roomFloor: roomFloorInput.value,
        roomNumber: roomNumberInput.value,
        roomType: roomTypeInput.value,
        roomGuests: roomGuestsInput.value,
        roomRate: roomRateInput.value,
        roomStatus: roomStatusInput.value,
    };

    const result = await apiCall(action, data, 'POST', 'room_actions.php');

    if (result.success) {
        showFormMessage(result.message, 'success');
        roomForm.reset();
        await fetchAndRenderRooms();
        
        setTimeout(() => {
            roomModal.style.display = 'none';
            hideFormMessage();
        }, 1500);
    } else {
        showFormMessage(result.message, 'error');
    }
});

// ===== DELETE ROOM HANDLERS =====
let roomToDeleteID = null;

function handleDeleteClick(event) {
    roomToDeleteID = event.currentTarget.dataset.roomId;
    const roomNumber = event.currentTarget.dataset.roomNumber;
    document.getElementById('deleteRoomText').textContent = `Are you sure you want to delete Room ${roomNumber}? This action cannot be undone.`;
    deleteRoomModal.style.display = 'flex';
}

closeDeleteModalBtn?.addEventListener('click', () => deleteRoomModal.style.display = 'none');
cancelDeleteBtn?.addEventListener('click', () => deleteRoomModal.style.display = 'none');

confirmDeleteBtn?.addEventListener('click', async () => {
    if (!roomToDeleteID) return;

    const data = { roomID: roomToDeleteID };
    const result = await apiCall('delete_room', data, 'POST', 'room_actions.php');

    if (result.success) {
        deleteRoomModal.style.display = 'none';
        await fetchAndRenderRooms();
    } else {
        alert(result.message);
    }
});

// ===== TAB NAVIGATION =====
const userTabBtns = document.querySelectorAll('[data-user-tab]');

userTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-user-tab');
    
    userTabBtns.forEach(b => b.classList.remove('active'));
    
    const userMgmtTab = document.getElementById('user-management-tab');
    const userLogsTab = document.getElementById('user-logs-tab');
    if (userMgmtTab) userMgmtTab.classList.remove('active');
    if (userLogsTab) userLogsTab.classList.remove('active');

    btn.classList.add('active');
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
      selectedTab.classList.add('active');
      
      if (tabName === 'user-logs') {
        fetchAndRenderUserLogs();
      }
    }
  });
});

// ===== HOUSEKEEPING TAB NAVIGATION =====
const hkTabBtns = document.querySelectorAll('[data-hk-tab]');

hkTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-hk-tab');
    
    hkTabBtns.forEach(b => b.classList.remove('active'));
    
    document.querySelectorAll('[id^="hk-"][id$="-tab"]').forEach(tab => {
      tab.classList.remove('active');
    });

    btn.classList.add('active');
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
  });
});

// ===== MAINTENANCE TAB NAVIGATION =====
const mtTabBtns = document.querySelectorAll('[data-mt-tab]');

mtTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-mt-tab');
    
    mtTabBtns.forEach(b => b.classList.remove('active'));
    
    document.querySelectorAll('[id^="mt-"][id$="-tab"]').forEach(tab => {
      tab.classList.remove('active');
    });

    btn.classList.add('active');
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
  });
});

// ===== PAGE NAVIGATION =====
const navLinks = document.querySelectorAll('.navLink');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    
    navLinks.forEach(l => l.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    
    link.classList.add('active');
    
    const pageName = link.getAttribute('data-page');
    const page = document.getElementById(`${pageName}-page`);
    
    if (page) {
      page.classList.add('active');
    }
  });
});

// ===== HOUSEKEEPING FILTERS =====
document.getElementById('hkSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = hkData.filter(row => 
    row.guest.toLowerCase().includes(search) ||
    row.staff.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(filtered);
});

document.getElementById('floorFilter')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? hkData.filter(row => row.floor.toString() === floor) : hkData;
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(filtered);
});

document.getElementById('roomFilter')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? hkData.filter(row => row.room.toString() === room) : hkData;
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(filtered);
});

document.getElementById('statusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? hkData.filter(row => row.status === status) : hkData;
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(filtered);
});

document.getElementById('hkRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('hkSearchInput').value = '';
  document.getElementById('floorFilter').value = '';
  document.getElementById('roomFilter').value = '';
  document.getElementById('statusFilter').value = '';
  
  hkData = [...housekeepingRequests];
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(hkData);
});

document.getElementById('hkDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Guest', 'Date', 'Request Time', 'Last Cleaned', 'Status', 'Staff In Charge'];
  const csvContent = [
    headers.join(','),
    ...hkData.map(row => [row.floor, row.room, row.guest, row.date, row.requestTime, row.lastCleaned, row.status === 'dirty' ? 'Dirty / Unoccupied' : 'Request Clean / Occupied', row.staff].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `housekeeping-requests-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== MAINTENANCE FILTERS =====
document.getElementById('mtSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = mtRequestsData.filter(row => 
    row.issue.toLowerCase().includes(search) ||
    row.staff.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  paginationState.maintenance.currentPage = 1;
  renderMTRequestsTable(filtered);
});

document.getElementById('mtFloorFilter')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? mtRequestsData.filter(row => row.floor.toString() === floor) : mtRequestsData;
  paginationState.maintenance.currentPage = 1;
  renderMTRequestsTable(filtered);
});

document.getElementById('mtRoomFilter')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? mtRequestsData.filter(row => row.room.toString() === room) : mtRequestsData;
  paginationState.maintenance.currentPage = 1;
  renderMTRequestsTable(filtered);
});

document.getElementById('mtStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? mtRequestsData.filter(row => row.status === status) : mtRequestsData;
  paginationState.maintenance.currentPage = 1;
  renderMTRequestsTable(filtered);
});

document.getElementById('mtRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('mtSearchInput').value = '';
  document.getElementById('mtFloorFilter').value = '';
  document.getElementById('mtRoomFilter').value = '';
  document.getElementById('mtStatusFilter').value = '';
  
  mtRequestsData = [...maintenanceRequests];
  paginationState.maintenance.currentPage = 1;
  renderMTRequestsTable(mtRequestsData);
});

document.getElementById('mtDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Status', 'Staff In Charge', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...mtRequestsData.map(row => [row.floor, row.room, row.issue, row.date, row.requestedTime, row.completedTime, row.status, row.staff, row.remarks].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maintenance-requests-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== ROOMS FILTERS =====
document.getElementById('roomsSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = roomData.filter(row => 
    row.Type.toLowerCase().includes(search) ||
    row.Room.toString().includes(search) ||
    row.Status.toLowerCase().includes(search)
  );
  paginationState.rooms.currentPage = 1;
  renderRoomsTable(filtered);
});

roomsFloorFilter?.addEventListener('change', (e) => {
    const floor = e.target.value;
    updateRoomFilterOptions(roomData, floor);
    const filtered = floor ? roomData.filter(row => row.Floor.toString() === floor) : roomData;
    paginationState.rooms.currentPage = 1;
    renderRoomsTable(filtered);
});

roomsRoomFilter?.addEventListener('change', (e) => {
  const room = e.target.value;
  const floor = roomsFloorFilter.value;
  let dataToFilter = floor ? roomData.filter(row => row.Floor.toString() === floor) : roomData;
  const filtered = room ? dataToFilter.filter(row => row.Room.toString() === room) : dataToFilter;
  paginationState.rooms.currentPage = 1;
  renderRoomsTable(filtered);
});

document.getElementById('roomsTypeFilter')?.addEventListener('change', (e) => {
  const type = e.target.value;
  const filtered = type ? roomData.filter(row => row.Type === type) : roomData;
  paginationState.rooms.currentPage = 1;
  renderRoomsTable(filtered);
});

document.getElementById('roomsStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? roomData.filter(row => row.Status === status) : roomData;
  paginationState.rooms.currentPage = 1;
  renderRoomsTable(filtered);
});

document.getElementById('roomsRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('roomsSearchInput').value = '';
  document.getElementById('roomsFloorFilter').value = '';
  document.getElementById('roomsRoomFilter').value = '';
  document.getElementById('roomsTypeFilter').value = '';
  document.getElementById('roomsStatusFilter').value = '';
  
  fetchAndRenderRooms();
});

document.getElementById('roomsDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Type', 'No. Guests', 'Rate', 'Status'];
  const csvContent = [
    headers.join(','),
    ...roomData.map(row => [row.Floor, row.Room, row.Type, row.NoGuests, row.Rate, row.Status].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rooms-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== USER FILTERS =====
document.getElementById('usersSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = usersData.filter(row => 
    row.Username.toLowerCase().includes(search) ||
    row.Fname.toLowerCase().includes(search) ||
    row.Lname.toLowerCase().includes(search) ||
    row.EmailAddress.toLowerCase().includes(search)
  );
  paginationState.users.currentPage = 1;
  renderUsersTable(filtered);
});

document.getElementById('usersRoleFilter')?.addEventListener('change', (e) => {
  const role = e.target.value;
  const filtered = role ? usersData.filter(row => row.AccountType === role) : usersData;
  paginationState.users.currentPage = 1;
  renderUsersTable(filtered);
});

document.getElementById('usersShiftFilter')?.addEventListener('change', (e) => {
  const shift = e.target.value;
  const filtered = shift ? usersData.filter(row => row.Shift === shift) : usersData;
  paginationState.users.currentPage = 1;
  renderUsersTable(filtered);
});

document.getElementById('usersRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('usersSearchInput').value = '';
  document.getElementById('usersRoleFilter').value = '';
  document.getElementById('usersShiftFilter').value = '';
  
  fetchAndRenderUsers();
});

document.getElementById('usersDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Username', 'Full Name', 'Role', 'Email', 'Shift', 'Birthday', 'Address'];
  const csvContent = [
    headers.join(','),
    ...usersData.map(row => {
      const fullName = `${row.Lname} ${row.Fname}${row.Mname ? ' ' + row.Mname : ''}`;
      const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;
      return [row.Username, fullName, roleName, row.EmailAddress, row.Shift, row.Birthday, row.Address].join(',');
    })
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== USER LOGS FILTERS =====
document.getElementById('logsSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = userLogsDataList.filter(row => 
    row.Username.toLowerCase().includes(search) ||
    row.Fname.toLowerCase().includes(search) ||
    row.Lname.toLowerCase().includes(search) ||
    row.EmailAddress.toLowerCase().includes(search) ||
    row.UserID.toString().includes(search)
  );
  paginationState.userLogs.currentPage = 1;
  renderUserLogsTable(filtered);
});

document.getElementById('logsRoleFilter')?.addEventListener('change', (e) => {
  const role = e.target.value;
  const filtered = role ? userLogsDataList.filter(row => row.AccountType === role) : userLogsDataList;
  paginationState.userLogs.currentPage = 1;
  renderUserLogsTable(filtered);
});

document.getElementById('logsShiftFilter')?.addEventListener('change', (e) => {
  const shift = e.target.value;
  const filtered = shift ? userLogsDataList.filter(row => row.Shift === shift) : userLogsDataList;
  paginationState.userLogs.currentPage = 1;
  renderUserLogsTable(filtered);
});

document.getElementById('logsRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('logsSearchInput').value = '';
  document.getElementById('logsRoleFilter').value = '';
  document.getElementById('logsShiftFilter').value = '';
  
  fetchAndRenderUserLogs();
});

document.getElementById('logsDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Log ID', 'User ID', 'Last Name', 'First Name', 'Middle Name', 'Account Type', 'Role', 'Shift', 'Username', 'Email Address', 'Action Type', 'Timestamp'];
  const csvContent = [
    headers.join(','),
    ...userLogsDataList.map(row => {
      const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;
      return [row.LogID, row.UserID, row.Lname, row.Fname, row.Mname, row.AccountType, roleName, row.Shift, row.Username, row.EmailAddress, row.ActionType, row.Timestamp].join(',');
    })
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `user-logs-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== LOGOUT FUNCTIONALITY =====
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const closeLogoutBtn = document.getElementById('closeLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (logoutModal) logoutModal.style.display = 'flex'; 
  });
}

if (closeLogoutBtn) {
  closeLogoutBtn.addEventListener('click', () => {
    if (logoutModal) logoutModal.style.display = 'none'; 
  });
}

if (cancelLogoutBtn) {
  cancelLogoutBtn.addEventListener('click', () => {
    if (logoutModal) logoutModal.style.display = 'none'; 
  });
}

if (confirmLogoutBtn) {
  confirmLogoutBtn.addEventListener('click', () => {
    console.log('Logout confirmed - redirecting to logout script');
    window.location.href = 'logout.php'; 
  });
}

if (logoutModal) {
  logoutModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      logoutModal.style.display = 'none';
    }
  });
}

// Close modals on backdrop click
roomModal?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    roomModal.style.display = 'none';
    hideFormMessage();
  }
});

deleteRoomModal?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    deleteRoomModal.style.display = 'none';
  }
});

userModal?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    userModal.style.display = 'none';
    hideFormMessage(true);
  }
});

deleteUserModal?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    deleteUserModal.style.display = 'none';
  }
});

// ===== DASHBOARD STATS UPDATE =====
function updateDashboardStats(data) {
  const hkm = data.housekeepingMaintenance || dashboardStats.housekeepingMaintenance;
  updateStatCard(0, hkm.totalRooms);
  updateStatCard(1, hkm.occupied);
  updateStatCard(2, hkm.needsCleaning);
  updateStatCard(3, hkm.maintenanceRequests);

  const inventory = data.inventory || dashboardStats.inventory;
  updateStatCard(4, inventory.totalItems);
  updateStatCard(5, inventory.lowStock);
  updateStatCard(6, inventory.outOfStock);

  const parking = data.parking || dashboardStats.parking;
  updateStatCard(7, parking.totalSlots);
  updateStatCard(8, parking.occupied);
  updateStatCard(9, parking.vacant);
  updateStatCard(10, parking.reserved);

  const users = data.users || dashboardStats.users;
  updateStatCard(11, users.totalEmployees);
  updateStatCard(12, users.housekeeping);
  updateStatCard(13, users.maintenance);
  updateStatCard(14, users.parking);
}

// ===== INITIALIZATION ===== //
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin page loaded - initializing');
  
  roomTypeInput?.addEventListener('change', updateGuestCapacity);
  roomFloorInput?.addEventListener('change', enforceFloorPrefix);
  roomNumberInput?.addEventListener('input', enforceFloorPrefix);
  
  const dashboardLink = document.querySelector('[data-page="dashboard"]');
  if (dashboardLink) {
    dashboardLink.classList.add('active');
  }
  const dashboardPage = document.getElementById('dashboard-page');
  if (dashboardPage) {
    dashboardPage.classList.add('active');
  }

  updateDashboardStats(dashData);
  
  // Render all tables
  renderHKTable(hkData);
  renderHKHistTable(hkHistData);
  renderHKLinensAmenitiesTable(hkLinensAmenitiesData); // COMBINED TABLE
  renderMTRequestsTable(mtRequestsData);
  renderMTHistTable(mtHistData);
  renderMTAppliancesTable(mtAppliancesData);
  renderParkingTable(parkingDataList);
  renderInventoryTable(inventoryDataList);
  
  if(document.getElementById('rooms-page')) {
      fetchAndRenderRooms();
  }
  
  if(document.getElementById('manage-users-page')) {
      console.log('User management page detected, fetching users...');
      fetchAndRenderUsers();
  }
});


// ===== HOUSEKEEPING LINENS FILTERS =====
document.getElementById('linensSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = hkLinensData.filter(row => 
    row.items.toLowerCase().includes(search) ||
    row.types.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  paginationState.housekeepingLinens.currentPage = 1;
  renderHKLinensTable(filtered);
});

document.getElementById('floorFilterLinens')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? hkLinensData.filter(row => row.floor.toString() === floor) : hkLinensData;
  paginationState.housekeepingLinens.currentPage = 1;
  renderHKLinensTable(filtered);
});

document.getElementById('roomFilterLinens')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? hkLinensData.filter(row => row.room.toString() === room) : hkLinensData;
  paginationState.housekeepingLinens.currentPage = 1;
  renderHKLinensTable(filtered);
});

document.getElementById('statusFilterLinens')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? hkLinensData.filter(row => row.status === status) : hkLinensData;
  paginationState.housekeepingLinens.currentPage = 1;
  renderHKLinensTable(filtered);
});

document.getElementById('linensRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('linensSearchInput').value = '';
  document.getElementById('floorFilterLinens').value = '';
  document.getElementById('roomFilterLinens').value = '';
  document.getElementById('statusFilterLinens').value = '';
  
  hkLinensData = [...housekeepingLinens];
  paginationState.housekeepingLinens.currentPage = 1;
  renderHKLinensTable(hkLinensData);
});

document.getElementById('linensDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Types', 'Items', 'Time/Date', 'Status', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...hkLinensData.map(row => [row.floor, row.room, row.types, row.items, row.timeDate, row.status, row.remarks].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `housekeeping-linens-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== HOUSEKEEPING AMENITIES FILTERS =====
document.getElementById('amenitiesSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = hkAmenitiesData.filter(row => 
    row.items.toLowerCase().includes(search) ||
    row.types.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  paginationState.housekeepingAmenities.currentPage = 1;
  renderHKAmenitiesTable(filtered);
});

document.getElementById('floorFilterAmenities')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? hkAmenitiesData.filter(row => row.floor.toString() === floor) : hkAmenitiesData;
  paginationState.housekeepingAmenities.currentPage = 1;
  renderHKAmenitiesTable(filtered);
});

document.getElementById('roomFilterAmenities')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? hkAmenitiesData.filter(row => row.room.toString() === room) : hkAmenitiesData;
  paginationState.housekeepingAmenities.currentPage = 1;
  renderHKAmenitiesTable(filtered);
});

document.getElementById('statusFilterAmenities')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? hkAmenitiesData.filter(row => row.status === status) : hkAmenitiesData;
  paginationState.housekeepingAmenities.currentPage = 1;
  renderHKAmenitiesTable(filtered);
});

document.getElementById('amenitiesRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('amenitiesSearchInput').value = '';
  document.getElementById('floorFilterAmenities').value = '';
  document.getElementById('roomFilterAmenities').value = '';
  document.getElementById('statusFilterAmenities').value = '';
  
  hkAmenitiesData = [...housekeepingAmenities];
  paginationState.housekeepingAmenities.currentPage = 1;
  renderHKAmenitiesTable(hkAmenitiesData);
});

document.getElementById('amenitiesDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Types', 'Items', 'Time/Date', 'Status', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...hkAmenitiesData.map(row => [row.floor, row.room, row.types, row.items, row.timeDate, row.status, row.remarks].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `housekeeping-amenities-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== MAINTENANCE HISTORY FILTERS =====
document.getElementById('mtHistSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = mtHistData.filter(row => 
    row.issue.toLowerCase().includes(search) ||
    row.staff.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  paginationState.maintenanceHistory.currentPage = 1;
  renderMTHistTable(filtered);
});

document.getElementById('mtFloorFilterHist')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? mtHistData.filter(row => row.floor.toString() === floor) : mtHistData;
  paginationState.maintenanceHistory.currentPage = 1;
  renderMTHistTable(filtered);
});

document.getElementById('mtRoomFilterHist')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? mtHistData.filter(row => row.room.toString() === room) : mtHistData;
  paginationState.maintenanceHistory.currentPage = 1;
  renderMTHistTable(filtered);
});

document.getElementById('mtHistRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('mtHistSearchInput').value = '';
  document.getElementById('mtFloorFilterHist').value = '';
  document.getElementById('mtRoomFilterHist').value = '';
  
  mtHistData = [...maintenanceHistory];
  paginationState.maintenanceHistory.currentPage = 1;
  renderMTHistTable(mtHistData);
});

document.getElementById('mtHistDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Status', 'Staff In Charge', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...mtHistData.map(row => [row.floor, row.room, row.issue, row.date, row.requestedTime, row.completedTime, row.status, row.staff, row.remarks].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maintenance-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== MAINTENANCE APPLIANCES FILTERS =====
document.getElementById('appliancesSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = mtAppliancesData.filter(row => 
    row.items.toLowerCase().includes(search) ||
    row.types.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  paginationState.maintenanceAppliances.currentPage = 1;
  renderMTAppliancesTable(filtered);
});

document.getElementById('appFloorFilter')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? mtAppliancesData.filter(row => row.floor.toString() === floor) : mtAppliancesData;
  paginationState.maintenanceAppliances.currentPage = 1;
  renderMTAppliancesTable(filtered);
});

document.getElementById('appRoomFilter')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? mtAppliancesData.filter(row => row.room.toString() === room) : mtAppliancesData;
  paginationState.maintenanceAppliances.currentPage = 1;
  renderMTAppliancesTable(filtered);
});

document.getElementById('appTypeFilter')?.addEventListener('change', (e) => {
  const type = e.target.value;
  const filtered = type ? mtAppliancesData.filter(row => row.types === type) : mtAppliancesData;
  paginationState.maintenanceAppliances.currentPage = 1;
  renderMTAppliancesTable(filtered);
});

document.getElementById('appliancesRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('appliancesSearchInput').value = '';
  document.getElementById('appFloorFilter').value = '';
  document.getElementById('appRoomFilter').value = '';
  document.getElementById('appTypeFilter').value = '';
  
  mtAppliancesData = [...maintenanceAppliances];
  paginationState.maintenanceAppliances.currentPage = 1;
  renderMTAppliancesTable(mtAppliancesData);
});

document.getElementById('appliancesDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Installed Date', 'Types', 'Items', 'Last Maintained', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...mtAppliancesData.map(row => [row.floor, row.room, row.installedDate, row.types, row.items, row.lastMaintained, row.remarks].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maintenance-appliances-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== PARKING FILTERS =====
document.getElementById('parkingSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = parkingDataList.filter(row => 
    row.plateNumber.toLowerCase().includes(search) ||
    row.guestName.toLowerCase().includes(search) ||
    row.slotNumber.toLowerCase().includes(search)
  );
  paginationState.parking.currentPage = 1;
  renderParkingTable(filtered);
});

document.getElementById('parkingLevelFilter')?.addEventListener('change', (e) => {
  const level = e.target.value;
  const filtered = level ? parkingDataList.filter(row => row.level.toString() === level) : parkingDataList;
  paginationState.parking.currentPage = 1;
  renderParkingTable(filtered);
});

document.getElementById('parkingBlockFilter')?.addEventListener('change', (e) => {
  const block = e.target.value;
  const filtered = block ? parkingDataList.filter(row => row.block === block) : parkingDataList;
  paginationState.parking.currentPage = 1;
  renderParkingTable(filtered);
});

document.getElementById('parkingStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? parkingDataList.filter(row => row.status === status) : parkingDataList;
  paginationState.parking.currentPage = 1;
  renderParkingTable(filtered);
});

document.getElementById('parkingRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('parkingSearchInput').value = '';
  document.getElementById('parkingLevelFilter').value = '';
  document.getElementById('parkingBlockFilter').value = '';
  document.getElementById('parkingStatusFilter').value = '';
  
  parkingDataList = [...parkingData];
  paginationState.parking.currentPage = 1;
  renderParkingTable(parkingDataList);
});

document.getElementById('parkingDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Plate #', 'Room', 'Name', 'Vehicle Type', 'Entry Time', 'Exit Time', 'Slot Number', 'Status'];
  const csvContent = [
    headers.join(','),
    ...parkingDataList.map(row => [row.plateNumber, row.room, row.guestName, row.vehicleType, row.entryTime, row.exitTime, row.slotNumber, row.status].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `parking-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== INVENTORY FILTERS =====
document.getElementById('inventorySearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = inventoryDataList.filter(row => 
    row.name.toLowerCase().includes(search) ||
    row.category.toLowerCase().includes(search) ||
    row.description.toLowerCase().includes(search)
  );
  paginationState.inventory.currentPage = 1;
  renderInventoryTable(filtered);
});

document.getElementById('inventoryCategoryFilter')?.addEventListener('change', (e) => {
  const category = e.target.value;
  const filtered = category ? inventoryDataList.filter(row => row.category === category) : inventoryDataList;
  paginationState.inventory.currentPage = 1;
  renderInventoryTable(filtered);
});

document.getElementById('inventoryStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? inventoryDataList.filter(row => row.status === status) : inventoryDataList;
  paginationState.inventory.currentPage = 1;
  renderInventoryTable(filtered);
});

document.getElementById('inventoryRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('inventorySearchInput').value = '';
  document.getElementById('inventoryCategoryFilter').value = '';
  document.getElementById('inventoryStatusFilter').value = '';
  
  inventoryDataList = [...inventoryData];
  paginationState.inventory.currentPage = 1;
  renderInventoryTable(inventoryDataList);
});

document.getElementById('inventoryDownloadBtn')?.addEventListener('click', () => {
  const headers = ['ID', 'Name', 'Category', 'Quantity', 'Description', 'Status', 'Damage', 'Stock In Date', 'Stock Out Date'];
  const csvContent = [
    headers.join(','),
    ...inventoryDataList.map(row => [row.id, row.name, row.category, row.quantity, row.description, row.status, row.damage, row.stockInDate, row.stockOutDate].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});



// ===== COMBINED LINENS & AMENITIES DATA AND RENDER FUNCTION =====
// Combine linens and amenities data into one array
let hkLinensAmenitiesData = [...housekeepingLinens, ...housekeepingAmenities];

// Add pagination state for combined data
paginationState.housekeepingLinensAmenities = { currentPage: 1, itemsPerPage: 10 };

// Render function for combined Linens & Amenities table
function renderHKLinensAmenitiesTable(data = hkLinensAmenitiesData) {
  const tbody = document.getElementById('hkLinensAmenitiesTableBody');
  if (!tbody) return;
  const state = paginationState.housekeepingLinensAmenities;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = row.status === 'cleaned' ? 'cleaned' : 
                          row.status === 'stocked' ? 'cleaned' : 
                          row.status === 'pending' ? 'pending' : row.status;
      const statusText = row.status === 'cleaned' ? 'Cleaned' :
                         row.status === 'stocked' ? 'Stocked' :
                         row.status === 'pending' ? 'Pending' : row.status;
      return `
        <tr>
          <td>${row.floor}</td>
          <td>${row.room}</td>
          <td>${row.types}</td>
          <td>${row.items}</td>
          <td>${row.timeDate}</td>
          <td><span class="statusBadge ${statusClass}">${statusText}</span></td>
          <td>${row.remarks}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('hkLinensAmenitiesRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('hk-linens-amenities-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKLinensAmenitiesTable(data);
  });
}

// ===== COMBINED LINENS & AMENITIES FILTERS =====
document.getElementById('linensAmenitiesSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = hkLinensAmenitiesData.filter(row => 
    row.items.toLowerCase().includes(search) ||
    row.types.toLowerCase().includes(search) ||
    row.room.toString().includes(search) ||
    row.remarks.toLowerCase().includes(search)
  );
  paginationState.housekeepingLinensAmenities.currentPage = 1;
  renderHKLinensAmenitiesTable(filtered);
});

document.getElementById('floorFilterLinensAmenities')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? hkLinensAmenitiesData.filter(row => row.floor.toString() === floor) : hkLinensAmenitiesData;
  paginationState.housekeepingLinensAmenities.currentPage = 1;
  renderHKLinensAmenitiesTable(filtered);
});

document.getElementById('roomFilterLinensAmenities')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? hkLinensAmenitiesData.filter(row => row.room.toString() === room) : hkLinensAmenitiesData;
  paginationState.housekeepingLinensAmenities.currentPage = 1;
  renderHKLinensAmenitiesTable(filtered);
});

document.getElementById('typeFilterLinensAmenities')?.addEventListener('change', (e) => {
  const type = e.target.value;
  const filtered = type ? hkLinensAmenitiesData.filter(row => row.types === type) : hkLinensAmenitiesData;
  paginationState.housekeepingLinensAmenities.currentPage = 1;
  renderHKLinensAmenitiesTable(filtered);
});

document.getElementById('statusFilterLinensAmenities')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? hkLinensAmenitiesData.filter(row => row.status === status) : hkLinensAmenitiesData;
  paginationState.housekeepingLinensAmenities.currentPage = 1;
  renderHKLinensAmenitiesTable(filtered);
});

document.getElementById('linensAmenitiesRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('linensAmenitiesSearchInput').value = '';
  document.getElementById('floorFilterLinensAmenities').value = '';
  document.getElementById('roomFilterLinensAmenities').value = '';
  document.getElementById('typeFilterLinensAmenities').value = '';
  document.getElementById('statusFilterLinensAmenities').value = '';
  
  hkLinensAmenitiesData = [...housekeepingLinens, ...housekeepingAmenities];
  paginationState.housekeepingLinensAmenities.currentPage = 1;
  renderHKLinensAmenitiesTable(hkLinensAmenitiesData);
});

document.getElementById('linensAmenitiesDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Types', 'Items', 'Time/Date', 'Status', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...hkLinensAmenitiesData.map(row => [row.floor, row.room, row.types, row.items, row.timeDate, row.status, row.remarks].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `housekeeping-linens-amenities-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== UPDATE INITIALIZATION TO INCLUDE COMBINED TABLE =====
// In the DOMContentLoaded section, add:
// renderHKLinensAmenitiesTable(hkLinensAmenitiesData);