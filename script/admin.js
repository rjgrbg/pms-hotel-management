// ===== USE SHARED DATA (Global Variables) =====
let hkData = [...housekeepingRequests];
let hkHistData = [...housekeepingHistory];
let hkLinensAmenitiesData = [...housekeepingLinens, ...housekeepingAmenities];
let mtRequestsData = [...maintenanceRequests];
let mtHistData = [...maintenanceHistory];
let mtAppliancesData = [...maintenanceAppliances];
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
  userModal.querySelector('.addUserModal').insertBefore(userFormMessage, employeeIdForm);
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
  initSyncAnimations();

  // Set default active page
  const dashboardLink = document.querySelector('[data-page="dashboard"]');
  if (dashboardLink) dashboardLink.classList.add('active');
  const dashboardPage = document.getElementById('dashboard-page');
  if (dashboardPage) dashboardPage.classList.add('active');

  // --- Initialize Dashboard ---
  updateDashboardStats(dashData); // Load static/default data
  
  // --- Initialize Static Tables (from shared-data.js) ---
  renderHKTable(hkData);
  renderHKHistTable(hkHistData);
  renderHKLinensAmenitiesTable(hkLinensAmenitiesData);
  renderMTRequestsTable(mtRequestsData);
  renderMTHistTable(mtHistData);
  renderMTAppliancesTable(mtAppliancesData);
  
  // --- Initialize Dynamic Pages & Dashboard Data (via API) ---
  
  // These functions fetch data AND update their respective dashboard cards
  fetchAndRenderRooms();
  fetchAndRenderUsers();
  fetchAndRenderInventory();
  fetchAndRenderParkingDashboard(); 
  
  // === MODIFICATION: Added the missing function call ===
  fetchAndRenderInventoryHistory();

  // These functions set up listeners for pages that are not active on load
  if(document.getElementById('parking-page')) {
      loadParkingAreaFilters();
      fetchAndRenderParkingHistory();
      initParkingFilters();
  }
  
  if(document.getElementById('inventory-page')) {
    // These are already called by the fetch functions,
    // but we keep the check for safety.
    initInventoryFilters();
    initInventoryHistoryFilters();
  }
  
  if(document.getElementById('rooms-page')) {
      initRoomFilters();
      // Room Modal Listeners
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
  
  if(document.getElementById('manage-users-page')) {
      initUserFilters();
      initUserLogsFilters();
      // User Modal Listeners
      document.getElementById('addUserBtn')?.addEventListener('click', handleAddUserClick);
      closeUserModalBtn?.addEventListener('click', () => { userModal.style.display = 'none'; hideFormMessage(true); });
      document.getElementById('cancelEmployeeIdBtn')?.addEventListener('click', () => { userModal.style.display = 'none'; hideFormMessage(true); });
      document.getElementById('cancelUserEditBtn')?.addEventListener('click', () => { userModal.style.display = 'none'; hideFormMessage(true); });
      employeeIdForm?.addEventListener('submit', handleEmployeeIdFormSubmit);
      userEditForm?.addEventListener('submit', handleUserEditFormSubmit);
      closeDeleteUserModalBtn?.addEventListener('click', () => deleteUserModal.style.display = 'none');
      cancelDeleteUserBtn?.addEventListener('click', () => deleteUserModal.style.display = 'none');
      confirmDeleteUserBtn?.addEventListener('click', confirmUserDelete);
  }

  if(document.getElementById('housekeeping-page')) {
    initHKRequestFilters();
    initHKLinensAmenitiesFilters();
  }
  
  if(document.getElementById('maintenance-page')) {
    initMTRequestFilters();
    initMTHistoryFilters();
    initMTAppliancesFilters();
  }

  console.log('Data Loaded:', { roomData, inventoryDataList, usersData, userLogsDataList });
});