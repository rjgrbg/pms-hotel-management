// ========================================================
// DATA MANAGEMENT (SOURCE OF TRUTH)
// ========================================================
const PARKING_DATA_KEY = 'celestiaParkingData';

// Default data kung walang laman ang localStorage
const defaultData = {
    slots: [
        // Area 1 (Mixed)
        { slotNumber: '1A01', area: 1, allowedVehicle: '2-Wheel, 4-Wheel', status: 'occupied', parkedVehicle: { plate: 'AB123C', room: '101', name: 'Juan Dela Cruz', vehicleType: '4 wheeled', category: 'Sedan', enterTime: '6:30 PM', enterDate: '2025.10.25' } },
        ...Array.from({ length: 22 }, (v, i) => ({
            slotNumber: `1B${(i + 1).toString().padStart(2, '0')}`, area: 1, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `RND${i}PLT`, room: '102', name: 'Random Guest', vehicleType: '4 wheeled', category: 'SUV', enterTime: '7:00 PM', enterDate: '2025.10.25' }
        })),
        // Area 1 (Available)
        ...Array.from({ length: 17 }, (v, i) => ({
            slotNumber: `1C${(i + 1).toString().padStart(2, '0')}`, area: 1, allowedVehicle: '2-Wheel', status: 'available', parkedVehicle: null
        })),

        // Area 2
        { slotNumber: '2A01', area: 2, allowedVehicle: '2-Wheel, 4-Wheel', status: 'occupied', parkedVehicle: { plate: 'CD456E', room: '102', name: 'Maria Clara', vehicleType: '2 wheeled', category: 'Motorcycle', enterTime: '7:00 PM', enterDate: '2025.10.25' } },
        ...Array.from({ length: 22 }, (v, i) => ({
            slotNumber: `2B${(i + 1).toString().padStart(2, '0')}`, area: 2, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `RND${i + 22}PLT`, room: '103', name: 'Another Guest', vehicleType: '4 wheeled', category: 'Sedan', enterTime: '8:00 PM', enterDate: '2025.10.25' }
        })),
        ...Array.from({ length: 17 }, (v, i) => ({
            slotNumber: `2C${(i + 1).toString().padStart(2, '0')}`, area: 2, allowedVehicle: '2-Wheel', status: 'available', parkedVehicle: null
        })),

        // Area 3 (Full)
        ...Array.from({ length: 40 }, (v, i) => ({
            slotNumber: `3A${(i + 1).toString().padStart(2, '0')}`, area: 3, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `FULL${i}PLT`, room: '201', name: 'Full Guest', vehicleType: '4 wheeled', category: 'Van', enterTime: '9:00 PM', enterDate: '2025.10.25' }
        })),

        // Area 4
        ...Array.from({ length: 23 }, (v, i) => ({
            slotNumber: `4A${(i + 1).toString().padStart(2, '0')}`, area: 4, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `RND${i + 44}PLT`, room: '202', name: 'Guest Four', vehicleType: '4 wheeled', category: 'Pickup', enterTime: '10:00 PM', enterDate: '2025.10.25' }
        })),
        ...Array.from({ length: 17 }, (v, i) => ({
            slotNumber: `4B${(i + 1).toString().padStart(2, '0')}`, area: 4, allowedVehicle: '4-Wheel', status: 'available', parkedVehicle: null
        })),

        // Area 5
        ...Array.from({ length: 23 }, (v, i) => ({
            slotNumber: `5A${(i + 1).toString().padStart(2, '0')}`, area: 5, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `RND${i + 66}PLT`, room: '203', name: 'Guest Five', vehicleType: '4 wheeled', category: 'Sedan', enterTime: '11:00 PM', enterDate: '2025.10.25' }
        })),
        ...Array.from({ length: 17 }, (v, i) => ({
            slotNumber: `5B${(i + 1).toString().padStart(2, '0')}`, area: 5, allowedVehicle: '4-Wheel', status: 'available', parkedVehicle: null
        }))
    ],
    history: [],
    user: {
        id: "019284738475",
        firstName: "Juan",
        middleName: "Constant",
        lastName: "Bagayan",
        emailAddress: "Juan@housekeeper.com",
        username: "Juana",
        password: "************",
        birthday: "2004-10-25",
        contact: "09222222222",
        shift: "Day",
        address: "Block 1 Lot 2, Quezon City",
        role: "Parking Management Head"
    },
    damage: [
        { type: 'Burnt', date: '10/25/25', count: 2 }
    ]
};

// Main App State
let slotsData = [];
let historyData = [];
let userData = {};
let damageItems = [];

// Pagination State
let currentPages = {
    slots: 1,
    vehicleIn: 1,
    history: 1
};
const rowsPerPage = 10;

// Global variable to track which vehicle/slot is being exited
let slotToExit = null;

// ========================================================
// DATA PERSISTENCE (localStorage)
// ========================================================

function saveDataToLocal() {
    const data = {
        slots: slotsData,
        history: historyData,
        user: userData,
        damage: damageItems
    };
    localStorage.setItem(PARKING_DATA_KEY, JSON.stringify(data));
}

function loadDataFromLocal() {
    const dataString = localStorage.getItem(PARKING_DATA_KEY);
    if (dataString) {
        const data = JSON.parse(dataString);
        slotsData = data.slots || [];
        historyData = data.history || [];
        userData = data.user || defaultData.user;
        damageItems = data.damage || [];
    } else {
        // Kung walang data, gamitin 'yung default
        slotsData = defaultData.slots;
        historyData = defaultData.history;
        userData = defaultData.user;
        damageItems = defaultData.damage;
    }
}

// ========================================================
// TOAST NOTIFICATION
// ========================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Force reflow to trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Remove from DOM after animation finishes
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 400);
    }, 3000);
}

// ========================================================
// UI (TABS, MODALS)
// ========================================================

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    const contentToHide = document.querySelectorAll('.content');
    contentToHide.forEach(c => c.classList.add('hidden'));
    
    // Activate new tab and content
    const newActiveTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (newActiveTab) newActiveTab.classList.add('active');
    
    const newActiveContent = document.getElementById(tabId + 'Content');
    if (newActiveContent) newActiveContent.classList.remove('hidden');

    const areaSelect = document.getElementById('areaSelect');
    const searchInput = document.querySelector('.search-box input');
    const downloadIcon = document.getElementById('downloadIcon');
    
    if (searchInput) searchInput.value = ''; // Clear search on tab switch

    // Update area select options based on current tab
    if (areaSelect) {
        if (tabId === 'vehicleIn' || tabId === 'history' || tabId === 'slots') {
            const uniqueSlotNumbers = [...new Set(slotsData.map(s => s.slotNumber))].sort();
            let slotOptions = uniqueSlotNumbers.map(s => `<option value="${s}">${s}</option>`).join('');
            areaSelect.innerHTML = `<option value="all">Slot Number</option>${slotOptions}`;
            if (searchInput) searchInput.placeholder = "Search Slot, Plate#, Name...";
        } else {
            const uniqueAreas = [...new Set(slotsData.map(s => s.area))].sort((a,b) => a - b);
            let areaOptions = uniqueAreas.map(a => `<option value="${a}">${a}</option>`).join('');
            areaSelect.innerHTML = `<option value="all">Area</option>${areaOptions}`;
            if (searchInput) searchInput.placeholder = "Search...";
        }
    }

    if (downloadIcon) {
        downloadIcon.style.display = tabId === 'history' ? 'block' : 'none';
    }

    // Reset pagination
    currentPages.slots = 1;
    currentPages.vehicleIn = 1;
    currentPages.history = 1;
    
    performFilterAndSearch();
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function showAccountDetails() {
    toggleUserMenu();
    
    // Populate form fields
    document.getElementById('firstName').value = userData.firstName || '';
    document.getElementById('middleName').value = userData.middleName || '';
    document.getElementById('lastName').value = userData.lastName || '';
    document.getElementById('emailAddress').value = userData.emailAddress || '';
    document.getElementById('username').value = userData.username || '';
    document.getElementById('password').value = userData.password || '';
    document.getElementById('birthday').value = userData.birthday || '';
    document.getElementById('contact').value = userData.contact || '';
    document.getElementById('shift').value = userData.shift || 'Day';
    document.getElementById('address').value = userData.address || '';
    
    // Update header info
    const accountHeader = document.querySelector('#accountModal .account-info h2');
    if (accountHeader) accountHeader.textContent = `${userData.firstName} ${userData.lastName}`;
    
    const idElement = document.querySelector('#accountModal .account-info p:nth-child(2)');
    if (idElement) idElement.textContent = `ID: ${userData.id}`;
    
    const roleElement = document.querySelector('#accountModal .account-info p:nth-child(3)');
    if (roleElement) roleElement.textContent = userData.role;

    openModal('accountModal');
}

function showSaveConfirm() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('emailAddress').value;

    if (!firstName || !lastName || !username || !email) {
        showToast('Please fill out all required fields.', 'error');
        return;
    }

    closeModal('accountModal');
    openModal('saveConfirmModal');
}

function confirmSaveChanges() {
    // Update user data from form
    userData.firstName = document.getElementById('firstName').value;
    userData.middleName = document.getElementById('middleName').value;
    userData.lastName = document.getElementById('lastName').value;
    userData.emailAddress = document.getElementById('emailAddress').value;
    userData.username = document.getElementById('username').value;
    userData.password = document.getElementById('password').value;
    userData.birthday = document.getElementById('birthday').value;
    userData.contact = document.getElementById('contact').value;
    userData.shift = document.getElementById('shift').value;
    userData.address = document.getElementById('address').value;

    // Update user menu display
    const userInfoH3 = document.querySelector('.user-menu-header .user-info h3');
    if (userInfoH3) userInfoH3.textContent = `${userData.firstName} ${userData.lastName}`;
    
    saveDataToLocal();
    
    closeModal('saveConfirmModal');
    openModal('saveSuccessModal');
    showToast('Account details updated successfully!');
}

function showLogoutModal() {
    toggleUserMenu();
    openModal('logoutModal');
}

function logout() {
    closeModal('logoutModal');
    showToast('Logged out successfully!');
    // Redirect logic can be added here
    // window.location.href = '/login.html';
}

// ========================================================
// ENTER VEHICLE LOGIC
// ========================================================

function openEnterVehicleModal(slotNumber) {
    const slot = slotsData.find(s => s.slotNumber === slotNumber);
    if (!slot) return;

    // Reset form
    document.getElementById('guestName').value = '';
    document.getElementById('plateNumber').value = '';
    document.getElementById('roomNumber').value = '';
    document.getElementById('vehicleType').value = '';
    document.getElementById('categorySelect').value = 'Sedan';

    // Set slot info
    document.getElementById('slotNumberTitle').textContent = slot.slotNumber;
    document.getElementById('slotSelect').innerHTML = `<option>${slot.slotNumber}</option>`;
    
    openModal('enterVehicleModal');
}

function showConfirmModal() {
    const name = document.getElementById('guestName').value;
    const plate = document.getElementById('plateNumber').value;
    const vehicleType = document.getElementById('vehicleType').value;

    if (!name || !plate || !vehicleType) {
        showToast('Please fill out Name, Plate #, and Vehicle.', 'error');
        return;
    }

    closeModal('enterVehicleModal');
    openModal('confirmModal');
}

function confirmEnterVehicle() {
    const slotNumber = document.getElementById('slotNumberTitle').textContent;
    const newVehicle = {
        name: document.getElementById('guestName').value,
        plate: document.getElementById('plateNumber').value.toUpperCase(),
        room: document.getElementById('roomNumber').value,
        vehicleType: document.getElementById('vehicleType').value,
        category: document.getElementById('categorySelect').value,
        enterTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        enterDate: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
    };

    const slot = slotsData.find(s => s.slotNumber === slotNumber);
    if (slot) {
        slot.status = 'occupied';
        slot.parkedVehicle = newVehicle;
    }

    saveDataToLocal();
    
    closeModal('confirmModal');
    openModal('successModal');
    showToast('Vehicle parked successfully!');

    performFilterAndSearch();
}

// ========================================================
// EXIT VEHICLE LOGIC
// ========================================================

function openExitModal(slotNumber) {
    const slot = slotsData.find(s => s.slotNumber === slotNumber);
    if (!slot || !slot.parkedVehicle) return;

    const vehicle = slot.parkedVehicle;
    
    document.getElementById('exitSlotNumber').textContent = slot.slotNumber;
    document.getElementById('exitPlate').textContent = vehicle.plate;
    document.getElementById('exitVehicle').textContent = vehicle.category;
    document.getElementById('exitDateTime').textContent = vehicle.enterDate + ' / ' + vehicle.enterTime;
    
    slotToExit = slot.slotNumber;
    
    openModal('exitModal');
}

function confirmExit() {
    if (!slotToExit) return;

    const slot = slotsData.find(s => s.slotNumber === slotToExit);
    if (!slot || !slot.parkedVehicle) return;

    const vehicleToLog = slot.parkedVehicle;
    
    // Calculate parking duration
    let enterDateTime;
    try {
        enterDateTime = new Date(`${vehicleToLog.enterDate} ${vehicleToLog.enterTime}`);
        if (isNaN(enterDateTime.getTime())) {
            enterDateTime = new Date(vehicleToLog.enterDate);
        }
    } catch (e) {
        enterDateTime = new Date(vehicleToLog.enterDate);
    }

    const exitDateTime = new Date();
    const durationMs = exitDateTime - enterDateTime;
    const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(1);

    const historyLog = {
        ...vehicleToLog,
        slotNumber: slot.slotNumber,
        exitTime: exitDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        exitDate: exitDateTime.toLocaleDateString('en-CA'),
        parkingTime: `${durationHours} hrs`
    };

    historyData.unshift(historyLog); 

    // Free up the slot
    slot.status = 'available';
    slot.parkedVehicle = null;
    slotToExit = null;

    saveDataToLocal();

    closeModal('exitModal');
    showToast('Vehicle exited successfully!');

    performFilterAndSearch();
}

// ========================================================
// EDIT CATEGORY FUNCTIONALITY
// ========================================================

function openEditCategory() {
    // Populate category list
    const categoryList = document.querySelector('.category-list');
    if (categoryList) {
        const categories = ['Sedan', 'SUV', 'Pickup', 'Van', 'Motorcycle', 'Truck'];
        categoryList.innerHTML = categories.map(cat => `
            <div class="category-item">
                <span>${cat}</span>
                <div class="category-actions">
                    <button class="edit-cat-btn" data-category="${cat}">✏️</button>
                    <button class="delete-cat-btn" data-category="${cat}">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    openModal('editCategoryModal');
}

function addNewCategory() {
    const input = document.querySelector('#editCategoryModal input[type="text"]');
    const newCategory = input.value.trim();
    
    if (!newCategory) {
        showToast('Please enter a category name.', 'error');
        return;
    }
    
    showToast(`Category "${newCategory}" added!`, 'success');
    input.value = '';
    
    // Refresh category list
    openEditCategory();
}

// ========================================================
// DAMAGE MANAGEMENT
// ========================================================

function addDamageItem() {
    const damageType = document.getElementById('damageType').value;
    const damageCount = document.getElementById('damageCount').value;
    
    if (!damageType) {
        showToast('Please enter damage type.', 'error');
        return;
    }
    
    const newDamage = {
        type: damageType,
        date: new Date().toLocaleDateString(),
        count: parseInt(damageCount) || 1
    };
    
    damageItems.push(newDamage);
    saveDataToLocal();
    
    // Update damage list
    updateDamageList();
    
    // Clear form
    document.getElementById('damageType').value = '';
    document.getElementById('damageCount').value = '1';
    
    showToast('Damage item added!', 'success');
}

function updateDamageList() {
    const damagesListBody = document.getElementById('damagesListBody');
    if (!damagesListBody) return;
    
    damagesListBody.innerHTML = damageItems.map(damage => `
        <tr>
            <td>${damage.type}</td>
            <td>${damage.date}</td>
            <td>${damage.count}</td>
        </tr>
    `).join('');
}

// ========================================================
// DOWNLOAD FUNCTIONALITY
// ========================================================

function downloadFile() {
    // Create CSV content from history data
    let csvContent = "Slot Number,Plate #,Room,Name,Vehicle Type,Category,Parking Time,Enter Time,Enter Date,Exit Time,Exit Date\n";
    
    historyData.forEach(vehicle => {
        csvContent += `"${vehicle.slotNumber}","${vehicle.plate}","${vehicle.room}","${vehicle.name}","${vehicle.vehicleType}","${vehicle.category}","${vehicle.parkingTime}","${vehicle.enterTime}","${vehicle.enterDate}","${vehicle.exitTime}","${vehicle.exitDate}"\n`;
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking_history_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    closeModal('downloadModal');
    showToast('History downloaded successfully!');
}

// ========================================================
// RENDER FUNCTIONS
// ========================================================

function renderEmptyState(container, icon, title, message) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">${icon}</div>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}

function renderDashboardSummary(filteredData) {
    const occupiedCount = filteredData.filter(s => s.status === 'occupied').length;
    const availableCount = filteredData.filter(s => s.status === 'available').length;
    const totalCount = filteredData.length;

    const cards = document.querySelectorAll('.summary-cards .card .card-value');
    if (cards[0]) cards[0].textContent = occupiedCount;
    if (cards[1]) cards[1].textContent = availableCount;
    if (cards[2]) cards[2].textContent = totalCount;
}

function renderDashboardTable(filteredData) {
    const tbody = document.querySelector('#dashboardContent table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = ''; 
    
    const areaStats = {};
    // Count data from filteredData
    filteredData.forEach(slot => {
        if (!areaStats[slot.area]) {
            areaStats[slot.area] = { area: slot.area, available: 0, occupied: 0, total: 0 };
        }
        
        areaStats[slot.area].total++;
        if (slot.status === 'available') {
            areaStats[slot.area].available++;
        } else {
            areaStats[slot.area].occupied++;
        }
    });

    Object.keys(areaStats).sort((a, b) => a - b).forEach(areaKey => {
        const area = areaStats[areaKey];
        const isFull = area.available === 0;
        const row = document.createElement('tr');
        
        if (isFull) row.classList.add('full-row'); 
        
        row.innerHTML = `
            <td class="${isFull ? 'text-red' : ''}">${area.area}</td>
            <td class="${isFull ? 'text-red' : ''}">${isFull ? '-' : area.available}</td>
            <td class="${isFull ? 'text-red' : ''}">${area.occupied}</td>
            <td class="${isFull ? 'text-red' : ''}">${area.total}</td>
            <td class="${isFull ? 'text-red' : ''} text-right">${isFull ? 'Full' : ''}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function renderSlots(filteredData) {
    const container = document.getElementById('slotsTable');
    if (!container) return; 
    container.innerHTML = '';
    
    if (filteredData.length === 0) {
        renderEmptyState(container, '🅿️', 'No Slots Found', 'Try adjusting your search or filter.');
        setupPagination(0, 'pagination-slots', 1);
        return;
    }
    
    // Pagination Logic
    const page = currentPages.slots;
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    paginatedData.forEach((slot) => {
        const row = document.createElement('div');
        row.className = 'table-row grid-5';
        
        row.innerHTML = `
            <div>${slot.area}</div>
            <div>${slot.slotNumber}</div>
            <div>${slot.allowedVehicle}</div>
            <div>
                <span class="status-badge status-${slot.status}">
                    ${slot.status === 'available' ? 'Available' : 'Occupied'}
                </span>
            </div>
            <div>
                ${slot.status === 'available' 
                    ? `<button class="btn-enter" data-slot-id="${slot.slotNumber}">Enter Vehicle 🚗</button>`
                    : `<button class="btn-enter-gray" disabled>Enter Vehicle 🚗</button>`
                }
            </div>
        `;
        container.appendChild(row);
    });

    setupPagination(filteredData.length, 'pagination-slots', page);
}

function renderVehicleIn(filteredData) {
    const container = document.getElementById('vehicleInTable');
    if (!container) return;
    container.innerHTML = '';

    if (filteredData.length === 0) {
        renderEmptyState(container, '🚗', 'No Vehicles Parked', 'Available slots can be seen in the "Slots" tab.');
        setupPagination(0, 'pagination-vehicleIn', 1);
        return;
    }

    // Pagination Logic
    const page = currentPages.vehicleIn;
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    paginatedData.forEach((slot) => {
        const vehicle = slot.parkedVehicle;
        const row = document.createElement('div');
        row.className = 'table-row grid-8';
        row.innerHTML = `
            <div>${slot.slotNumber}</div>
            <div>${vehicle.plate}</div>
            <div>${vehicle.room}</div>
            <div>${vehicle.name}</div>
            <div>${vehicle.vehicleType}</div>
            <div>${vehicle.category}</div>
            <div>${vehicle.enterTime}</div>
            <div>${vehicle.enterDate}</div>
            <div>
                <button class="exit-btn" data-slot-id="${slot.slotNumber}">
         <img src="exit.png" alt="Exit Vehicle">
            </button>
            </div>
        `;
        container.appendChild(row);
    });

    setupPagination(filteredData.length, 'pagination-vehicleIn', page);
}

function renderHistory(filteredData) {
    const container = document.getElementById('historyTable');
    if (!container) return;
    container.innerHTML = '';
    
    if (filteredData.length === 0) {
        renderEmptyState(container, '📜', 'No History Found', 'Vehicles that exit will appear here.');
        setupPagination(0, 'pagination-history', 1);
        return;
    }

    // Pagination Logic
    const page = currentPages.history;
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    paginatedData.forEach((vehicle) => {
        const row = document.createElement('div');
        row.className = 'table-row grid-9';
        row.innerHTML = `
            <div>${vehicle.slotNumber}</div>
            <div>${vehicle.plate}</div>
            <div>${vehicle.room}</div>
            <div>${vehicle.name}</div>
            <div>${vehicle.vehicleType}</div>
            <div>${vehicle.category}</div>
            <div>${vehicle.parkingTime}</div>
            <div>${vehicle.enterTime} / ${vehicle.exitTime}</div>
            <div>${vehicle.enterDate} / ${vehicle.exitDate}</div>
        `;
        container.appendChild(row);
    });
    
    setupPagination(filteredData.length, 'pagination-history', page);
}

// ========================================================
// PAGINATION LOGIC
// ========================================================
function setupPagination(totalItems, containerId, currentPage) {
    const paginationContainer = document.getElementById(containerId);
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    
    if (totalPages <= 1) return;

    // Records info
    const recordsInfo = document.createElement('span');
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(start + rowsPerPage - 1, totalItems);
    recordsInfo.textContent = `Displaying ${start}-${end} of ${totalItems} Records`;
    paginationContainer.appendChild(recordsInfo);

    // Button controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'pagination-controls';

    // Previous Button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&lt;';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (containerId === 'pagination-slots') currentPages.slots--;
        if (containerId === 'pagination-vehicleIn') currentPages.vehicleIn--;
        if (containerId === 'pagination-history') currentPages.history--;
        performFilterAndSearch();
    });
    controlsDiv.appendChild(prevButton);

    // Page Numbers
    const pageNumbers = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        pageNumbers.push(1);
        if (currentPage > 3) pageNumbers.push('...');
        
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 2) end = 3;
        if (currentPage >= totalPages - 1) start = totalPages - 2;

        for (let i = start; i <= end; i++) {
            pageNumbers.push(i);
        }
        
        if (currentPage < totalPages - 2) pageNumbers.push('...');
        pageNumbers.push(totalPages);
    }

    pageNumbers.forEach(num => {
        if (num === '...') {
            const span = document.createElement('span');
            span.textContent = '...';
            controlsDiv.appendChild(span);
        } else {
            const button = document.createElement('button');
            button.textContent = num;
            button.className = (num === currentPage) ? 'active' : '';
            button.addEventListener('click', () => {
                if (containerId === 'pagination-slots') currentPages.slots = num;
                if (containerId === 'pagination-vehicleIn') currentPages.vehicleIn = num;
                if (containerId === 'pagination-history') currentPages.history = num;
                performFilterAndSearch();
            });
            controlsDiv.appendChild(button);
        }
    });

    // Next Button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&gt;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (containerId === 'pagination-slots') currentPages.slots++;
        if (containerId === 'pagination-vehicleIn') currentPages.vehicleIn++;
        if (containerId === 'pagination-history') currentPages.history++;
        performFilterAndSearch();
    });
    controlsDiv.appendChild(nextButton);

    paginationContainer.appendChild(controlsDiv);
}

// ========================================================
// SEARCH & FILTER FUNCTION (MAIN)
// ========================================================

function performFilterAndSearch() {
    const searchInput = document.querySelector('.search-box input');
    const areaSelect = document.getElementById('areaSelect');
    
    if (!searchInput || !areaSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = areaSelect.value;
    
    // Check which tab is active and call the appropriate render function
    if (!document.getElementById('dashboardContent').classList.contains('hidden')) {
        let filteredData = slotsData;
        if (filterValue !== "all") {
            filteredData = slotsData.filter(s => s.area == filterValue);
        }
        renderDashboardSummary(filteredData);
        renderDashboardTable(filteredData);

    } else if (!document.getElementById('slotsContent').classList.contains('hidden')) {
        let filteredData = slotsData;
        if (filterValue !== "all") filteredData = filteredData.filter(s => s.slotNumber === filterValue);
        if (searchTerm) {
            filteredData = filteredData.filter(s => 
                s.slotNumber.toLowerCase().includes(searchTerm) ||
                (s.parkedVehicle && s.parkedVehicle.name.toLowerCase().includes(searchTerm)) ||
                (s.parkedVehicle && s.parkedVehicle.plate.toLowerCase().includes(searchTerm))
            );
        }
        renderSlots(filteredData);

    } else if (!document.getElementById('vehicleInContent').classList.contains('hidden')) {
        let filteredData = slotsData.filter(slot => slot.status === 'occupied');
        if (filterValue !== "all") filteredData = filteredData.filter(s => s.slotNumber === filterValue);
        if (searchTerm) {
            filteredData = filteredData.filter(s => 
                s.slotNumber.toLowerCase().includes(searchTerm) ||
                (s.parkedVehicle && s.parkedVehicle.name.toLowerCase().includes(searchTerm)) ||
                (s.parkedVehicle && s.parkedVehicle.plate.toLowerCase().includes(searchTerm)) ||
                (s.parkedVehicle && s.parkedVehicle.room.toLowerCase().includes(searchTerm))
            );
        }
        renderVehicleIn(filteredData);

    } else if (!document.getElementById('historyContent').classList.contains('hidden')) {
        let filteredData = historyData;
        if (filterValue !== "all") filteredData = filteredData.filter(v => v.slotNumber === filterValue);
        if (searchTerm) {
            filteredData = filteredData.filter(v => 
                v.slotNumber.toLowerCase().includes(searchTerm) ||
                v.name.toLowerCase().includes(searchTerm) ||
                v.plate.toLowerCase().includes(searchTerm) ||
                v.room.toLowerCase().includes(searchTerm)
            );
        }
        renderHistory(filteredData);
    }
}

// ========================================================
// SETUP EVENT LISTENERS
// ========================================================
function setupEventListeners() {
    // User icon
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) userIcon.addEventListener('click', toggleUserMenu);
    
    const btnAccountDetails = document.getElementById('btnAccountDetails');
    if (btnAccountDetails) btnAccountDetails.addEventListener('click', showAccountDetails);
    
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', () => {
    console.log('Logout confirmed - redirecting to logout script');
    window.location.href = 'logout.php'; 
  });
    
    const btnConfirmLogout = document.getElementById('btnConfirmLogout');
    if (btnConfirmLogout) btnConfirmLogout.addEventListener('click', logout);

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
    
    // Search and Filter
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) searchBtn.addEventListener('click', performFilterAndSearch);
    
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) searchInput.addEventListener('keyup', performFilterAndSearch);
    
    const areaSelect = document.getElementById('areaSelect');
    if (areaSelect) areaSelect.addEventListener('change', performFilterAndSearch);

    // Download
    const downloadIcon = document.getElementById('downloadIcon');
    if (downloadIcon) downloadIcon.addEventListener('click', () => openModal('downloadModal'));
    
    const btnConfirmDownload = document.getElementById('btnConfirmDownload');
    if (btnConfirmDownload) btnConfirmDownload.addEventListener('click', downloadFile);

    // Enter Vehicle Flow
    const btnSaveVehicle = document.getElementById('btnSaveVehicle');
    if (btnSaveVehicle) btnSaveVehicle.addEventListener('click', showConfirmModal);
    
    const btnConfirmEnter = document.getElementById('btnConfirmEnter');
    if (btnConfirmEnter) btnConfirmEnter.addEventListener('click', confirmEnterVehicle);
    
    const btnEditCategory = document.getElementById('btnEditCategory');
    if (btnEditCategory) btnEditCategory.addEventListener('click', openEditCategory);

// Exit Vehicle Flow (Event delegation for dynamic buttons)
    document.body.addEventListener('click', e => {
        // Inayos para sa Exit Vehicle Button (na may <img> sa loob)
        const exitButton = e.target.closest('.exit-btn');
        if (exitButton) {
            openExitModal(exitButton.dataset.slotId);
            return; // Para 'di mag-conflict
        }

        // Inayos para sa Enter Vehicle Button (para iwas-bug din)
        const enterButton = e.target.closest('.btn-enter');
        if (enterButton) {
            openEnterVehicleModal(enterButton.dataset.slotId);
            return;
        }
    });
    const btnConfirmExit = document.getElementById('btnConfirmExit');
    if (btnConfirmExit) btnConfirmExit.addEventListener('click', confirmExit);

    // Save Account Flow
    const btnSaveChanges = document.getElementById('btnSaveChanges');
    if (btnSaveChanges) btnSaveChanges.addEventListener('click', showSaveConfirm);
    
    const btnConfirmSave = document.getElementById('btnConfirmSave');
    if (btnConfirmSave) btnConfirmSave.addEventListener('click', confirmSaveChanges);
    
    // Change Password
    const changePasswordSpan = document.querySelector('.change-password');
    if (changePasswordSpan) {
        changePasswordSpan.addEventListener('click', () => {
            showToast('Change password feature is not yet implemented.', 'error');
        });
    }

    // Damage Modal
    const btnAddDamage = document.getElementById('btnAddDamage');
    if (btnAddDamage) btnAddDamage.addEventListener('click', addDamageItem);

    // Close Modals
    document.querySelectorAll('.modal-close, button[data-modal-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId || (e.target.closest('.modal-overlay') ? e.target.closest('.modal-overlay').id : null);
            if (modalId) {
                closeModal(modalId);
            }
        });
    });

    // Close modal when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    // Close user menu when clicking outside
    document.addEventListener('click', function(e) {
        const userMenu = document.getElementById('userMenu');
        const userIcon = document.querySelector('.user-icon');
        if (!userIcon || !userMenu) return; 
        if (!userIcon.contains(e.target) && !userMenu.contains(e.target) && userMenu.classList.contains('active')) {
            userMenu.classList.remove('active');
        }
    });
}

// ========================================================
// INITIALIZE ON PAGE LOAD
// ========================================================
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromLocal();      // 1. Load data
    setupEventListeners();    // 2. Setup all buttons
    
    // 3. Populate user info
    const userInfoH3 = document.querySelector('.user-menu-header .user-info h3');
    if (userInfoH3) userInfoH3.textContent = `${userData.firstName} ${userData.lastName}`;
    
    const userRoleDiv = document.querySelector('.user-menu-header .user-info .user-role');
    if (userRoleDiv) userRoleDiv.textContent = userData.role;

    // 4. Initialize damage list
    updateDamageList();

    // 5. Trigger initial render
    switchTab('dashboard'); // Start with dashboard
});