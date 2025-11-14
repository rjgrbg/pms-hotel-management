// ===== USE SHARED DATA (Global Variables) =====
// MODIFIED: Use the data from admin.php (initialHkRequestsData) instead of old static data
let hkData = typeof initialHkRequestsData !== 'undefined' ? [...initialHkRequestsData] : [];
let hkHistData = typeof initialHkHistoryData !== 'undefined' ? [...initialHkHistoryData] : [];
let hkLinensAmenitiesData = []; // No longer used
let mtRequestsData = typeof initialMtRequestsData !== 'undefined' ? [...initialMtRequestsData] : [];
let mtHistData = typeof initialMtHistoryData !== 'undefined' ? [...initialMtHistoryData] : [];
let mtAppliancesData = []; // No longer used

let roomData = [];
let parkingHistoryDataList = [];
let inventoryDataList = typeof inventoryData !== 'undefined' ? [...inventoryData] : [];
let inventoryHistoryDataList = typeof inventoryHistoryData !== 'undefined' ? [...inventoryHistoryData] : [];
let usersData = [];
let userLogsDataList = typeof userLogsData !== 'undefined' ? [...userLogsData] : [];
let dashData = dashboardStats;

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
const employeeCodeForm = document.getElementById('employeeCodeForm');
const userDetailsDisplay = document.getElementById('userDetailsDisplay');
const passwordChangeForm = document.getElementById('passwordChangeForm');
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
if (!userFormMessage && userModal) {
  userFormMessage = document.createElement('div');
  userFormMessage.id = 'userFormMessage';
  userFormMessage.className = 'formMessage';
  userFormMessage.style.display = 'none';
  const modalContent = userModal.querySelector('.addUserModal');
  if (modalContent) {
    modalContent.insertBefore(userFormMessage, modalContent.children[2]);
  }
}

// ===== INITIALIZATION ===== //
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin page loaded - initializing');
  
  // --- Initialize UI & Navigation ---
  initPageNavigation();
  initTabNavigation('[data-user-tab]', 'user');
  initTabNavigation('[data-hk-tab]', 'hk');
  initTabNavigation('[data-mt-tab]', 'mt');
  initTabNavigation('[data-inv-tab]', 'inv');
  initLogout();
  initModalBackdropClicks();

  // Set default active page
  const dashboardLink = document.querySelector('[data-page="dashboard"]');
  if (dashboardLink) dashboardLink.classList.add('active');
  const dashboardPage = document.getElementById('dashboard-page');
  if (dashboardPage) dashboardPage.classList.add('active');

  // --- Initialize Dashboard ---
  updateDashboardStats(dashData);
  
  // --- Initialize Tables with data from PHP ---
  renderHKTable(hkData);
  renderHKHistTable(hkHistData);
  renderMTRequestsTable(mtRequestsData);
  renderMTHistTable(mtHistData);
  // REMOVED: renderHKLinensAmenitiesTable();
  // REMOVED: renderMTAppliancesTable();
  
  // --- Initialize Dynamic Pages & Dashboard Data (via API) ---
  fetchAndRenderRooms();
  fetchAndRenderUsers();
  fetchAndRenderInventory();
  fetchAndRenderInventoryHistory();
  fetchAndRenderParkingDashboard(); 
  
  // Initialize parking page
  if(document.getElementById('parking-page')) {
      loadParkingAreaFilters();
      fetchAndRenderParkingHistory();
      initParkingFilters();
  }
  
  // Initialize inventory page
  if(document.getElementById('inventory-page')) {
    initInventoryFilters();
    initInventoryHistoryFilters();
  }
  
  // Initialize rooms page
  if(document.getElementById('rooms-page')) {
      initRoomFilters();
      roomTypeInput?.addEventListener('change', updateGuestCapacity);
      roomFloorInput?.addEventListener('change', enforceFloorPrefix);
      roomNumberInput?.addEventListener('input', enforceFloorPrefix);
      roomForm?.addEventListener('submit', handleRoomFormSubmit);
      closeRoomModalBtn?.addEventListener('click', () => { roomModal.style.display = 'none'; hideFormMessage(); });
      cancelRoomBtn?.addEventListener('click', () => { roomModal.style.display = 'none'; hideFormMessage(); });
      closeDeleteModalBtn?.addEventListener('click', () => deleteRoomModal.style.display = 'none');
      cancelDeleteBtn?.addEventListener('click', () => deleteRoomModal.style.display = 'none');
      confirmDeleteBtn?.addEventListener('click', confirmRoomDelete);
  }
  
  // Initialize manage users page
  if(document.getElementById('manage-users-page')) {
      initUserFilters();
      initUserLogsFilters();
      
      // User Modal Listeners
      document.getElementById('addUserBtn')?.addEventListener('click', handleAddUserClick);
      closeUserModalBtn?.addEventListener('click', () => { 
        userModal.style.display = 'none'; 
        hideFormMessage(true); 
      });
      document.getElementById('cancelEmployeeCodeBtn')?.addEventListener('click', () => { 
        userModal.style.display = 'none'; 
        hideFormMessage(true); 
      });
      document.getElementById('cancelPasswordChangeBtn')?.addEventListener('click', () => { 
        userModal.style.display = 'none'; 
        hideFormMessage(true); 
      });
      employeeCodeForm?.addEventListener('submit', handleEmployeeCodeSubmit);
      passwordChangeForm?.addEventListener('submit', handlePasswordChangeSubmit);
      closeDeleteUserModalBtn?.addEventListener('click', () => deleteUserModal.style.display = 'none');
      cancelDeleteUserBtn?.addEventListener('click', () => deleteUserModal.style.display = 'none');
      confirmDeleteUserBtn?.addEventListener('click', confirmUserDelete);
  }

  // Initialize housekeeping page
  if(document.getElementById('housekeeping-page')) {
    initHKRequestFilters();
    initHKHistoryFilters(); // Added this
    // REMOVED: initHKLinensAmenitiesFilters();
  }
  
  // Initialize maintenance page
  if(document.getElementById('maintenance-page')) {
    initMTRequestFilters();
    initMTHistoryFilters();
    // REMOVED: initMTAppliancesFilters();
  }

  console.log('Data Loaded:', { roomData, inventoryDataList, usersData, userLogsDataList });
});

// ===== USER MANAGEMENT FUNCTIONS (Employee Code Lookup) =====

async function fetchAndRenderUsers() {
    const usersTableBody = document.getElementById('usersTableBody');
    if (!usersTableBody) return;
        
    console.log('Fetching users...');
    usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading users...</td></tr>';
        
    try {
        const result = await apiCall('fetch_users', {}, 'GET', 'user_actions.php');
        console.log('User fetch result:', result);
                
        if (result.success && result.data && result.data.length > 0) {
            usersData = result.data;
            console.log('Users data loaded:', usersData);
            updateDashboardFromUsers(usersData);
                        
            paginationState.users.currentPage = 1;
            renderUsersTable(usersData);
            const recordCount = document.getElementById('usersRecordCount');
            if (recordCount) recordCount.textContent = usersData.length;
        } else if (result.success && (!result.data || result.data.length === 0)) {
            usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No users found.</td></tr>';
            const recordCount = document.getElementById('usersRecordCount');
            if (recordCount) recordCount.textContent = 0;
            updateDashboardFromUsers([]); 
            renderPaginationControls('user-management-tab', 0, 1, () => {});
        } else {
            usersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #c33;">Failed to load users: ${result.message || 'Unknown error'}</td></tr>`;
            const recordCount = document.getElementById('usersRecordCount');
            if (recordCount) recordCount.textContent = 0;
            updateDashboardFromUsers([]);
            renderPaginationControls('user-management-tab', 0, 1, () => {});
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #c33;">Network error. Please refresh the page.</td></tr>';
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
          <td><span class="statusBadge ${row.AccountType}">${roleName}</span></td>
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

// ===== USER MODAL HANDLERS =====
function handleAddUserClick() {
    hideFormMessage(true);
    userModalTitle.textContent = 'Add User from Employee';
    
    // Show employee code form, hide details
    employeeCodeForm.style.display = 'block';
    userDetailsDisplay.style.display = 'none';
    
    // Reset form
    employeeCodeForm.reset();
    
    userModal.style.display = 'flex';
}

async function handleEmployeeCodeSubmit(e) {
    e.preventDefault();
    hideFormMessage(true);
    
    const employeeCode = document.getElementById('employeeCodeInput').value.trim();
    
    if (!employeeCode) {
        showFormMessage('Please enter an Employee Code.', 'error', true);
        return;
    }
    
    console.log('Looking up employee:', employeeCode);
    
    const lookupBtn = document.getElementById('lookupEmployeeBtn');
    const originalText = lookupBtn.textContent;
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'ADDING...';
    
    try {
        const result = await apiCall('add_user_from_employee', { employeeCode: employeeCode }, 'POST', 'user_actions.php');
        console.log('Add user result:', result);
        
        if (result.success) {
            showFormMessage(result.message || 'User added successfully!', 'success', true);
            employeeCodeForm.reset();
            await fetchAndRenderUsers();
            
            setTimeout(() => {
                document.getElementById('userModal').style.display = 'none';
                hideFormMessage(true);
            }, 2000);
        } else {
            showFormMessage(result.message || 'Failed to add user.', 'error', true);
        }
    } catch (error) {
        console.error('Error adding user:', error);
        showFormMessage('An unexpected error occurred. Please try again.', 'error', true);
    } finally {
        lookupBtn.disabled = false;
        lookupBtn.textContent = originalText;
    }
}

function handleEditUserClick(event) {
    hideFormMessage(true);
    const user = JSON.parse(event.currentTarget.dataset.userData);
    
    userModalTitle.textContent = 'Change Password: ' + user.Username;
    
    // Hide employee code form, show details
    employeeCodeForm.style.display = 'none';
    userDetailsDisplay.style.display = 'block';
    
    // Fill in user data (read-only display)
    document.getElementById('displayEmployeeCode').textContent = user.EmployeeID || 'N/A';
    document.getElementById('displayFullName').textContent = `${user.Lname}, ${user.Fname}${user.Mname ? ' ' + user.Mname.charAt(0) + '.' : ''}`;
    document.getElementById('displayEmail').textContent = user.EmailAddress;
    document.getElementById('displayAccountType').textContent = ACCOUNT_TYPE_MAP[user.AccountType] || user.AccountType;
    document.getElementById('displayShift').textContent = user.Shift;
    document.getElementById('displayUsername').textContent = user.Username;
    
    // Set hidden user ID
    document.getElementById('editUserId').value = user.UserID;
    
    // Clear password field
    document.getElementById('newPassword').value = '';
    
    userModal.style.display = 'flex';
}

async function handlePasswordChangeSubmit(e) {
    e.preventDefault();
    hideFormMessage(true);
    
    const userID = document.getElementById('editUserId').value;
    const password = document.getElementById('newPassword').value.trim();
    
    if (!password) {
        showFormMessage('Please enter a new password.', 'error', true);
        return;
    }
    
    console.log('Updating password for user:', userID);
    
    const saveBtn = document.getElementById('savePasswordBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'UPDATING...';
    
    try {
        const result = await apiCall('edit_user', { 
            userID: userID, 
            password: password 
        }, 'POST', 'user_actions.php');
        
        console.log('Password update result:', result);
        
        if (result.success) {
            showFormMessage('Password updated successfully!', 'success', true);
            await fetchAndRenderUsers();
            
            setTimeout(() => {
                document.getElementById('userModal').style.display = 'none';
                hideFormMessage(true);
            }, 2000);
        } else {
            showFormMessage(result.message || 'Failed to update password.', 'error', true);
        }
    } catch (error) {
        console.error('Error updating password:', error);
        showFormMessage('An unexpected error occurred. Please try again.', 'error', true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// ===== DELETE USER HANDLERS =====
window.userToDeleteID = null;

function handleDeleteUserClick(event) {
    window.userToDeleteID = event.currentTarget.dataset.userId;
    const username = event.currentTarget.dataset.username;
    document.getElementById('deleteUserText').textContent = `Are you sure you want to delete user "${username}"? This action cannot be undone.`;
    document.getElementById('deleteUserModal').style.display = 'flex';
}

async function confirmUserDelete() {
    const userToDeleteID = window.userToDeleteID;
    if (!userToDeleteID) return;
    
    const confirmBtn = document.getElementById('confirmDeleteUserBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'DELETING...';
    
    try {
        const data = { userID: userToDeleteID };
        const result = await apiCall('delete_user', data, 'POST', 'user_actions.php');
        
        if (result.success) {
            document.getElementById('deleteUserModal').style.display = 'none';
            await fetchAndRenderUsers();
            alert('User deleted successfully!');
        } else {
            alert(result.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('An unexpected error occurred. Please try again.');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        window.userToDeleteID = null;
    }
}

// ===== USER FILTERS =====
function initUserFilters() {
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

    document.getElementById('usersRefreshBtn')?.addEventListener('click', async () => {
      document.getElementById('usersSearchInput').value = '';
      document.getElementById('usersRoleFilter').value = '';
      document.getElementById('usersShiftFilter').value = '';
      
      await fetchAndRenderUsers();
    });

    document.getElementById('usersDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Username', 'Full Name', 'Role', 'Email', 'Shift', 'Employee Code'];
      const csvContent = [
        headers.join(','),
        ...usersData.map(row => {
          const fullName = `${row.Lname} ${row.Fname}${row.Mname ? ' ' + row.Mname : ''}`;
          const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;
          return [row.Username, fullName, roleName, row.EmailAddress, row.Shift, row.EmployeeID].join(',');
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
}