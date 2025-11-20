// ===== USE SHARED DATA (Global Variables) =====
let hkData = typeof initialHkRequestsData !== 'undefined' ? [...initialHkRequestsData] : [];
let hkHistData = typeof initialHkHistoryData !== 'undefined' ? [...initialHkHistoryData] : [];
let mtRequestsData = typeof initialMtRequestsData !== 'undefined' ? [...initialMtRequestsData] : [];
let mtHistData = typeof initialMtHistoryData !== 'undefined' ? [...initialMtHistoryData] : [];

let roomData = [];
let parkingHistoryDataList = [];
let inventoryDataList = typeof inventoryData !== 'undefined' ? [...inventoryData] : [];
let inventoryHistoryDataList = typeof inventoryHistoryData !== 'undefined' ? [...inventoryHistoryData] : [];
let dashData = dashboardStats;

// --- USER DATA VARIABLES (Added) ---
let usersData = [];
let userLogsDataList = typeof userLogsData !== 'undefined' ? [...userLogsData] : [];

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

// --- User Management DOM Elements (Added) ---
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

// Form Message Elements (Room)
let formMessage = document.getElementById('roomFormMessage');
if (!formMessage && roomForm) {
  formMessage = document.createElement('div');
  formMessage.id = 'roomFormMessage';
  formMessage.className = 'formMessage';
  roomForm.insertBefore(formMessage, roomForm.firstChild);
}

// Form Message Elements (User - Added)
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
  
  // --- Initialize Dynamic Pages & Dashboard Data (via API) ---
  fetchAndRenderRooms();
  fetchAndRenderUsers(); // Added call
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
  
  // Initialize manage users page (Added)
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
    initHKHistoryFilters();
  }
  
  // Initialize maintenance page
  if(document.getElementById('maintenance-page')) {
    initMTRequestFilters();
    initMTHistoryFilters();
  }

  console.log('Data Loaded:', { roomData, inventoryDataList, usersData, userLogsDataList });
});