// admin.js

// ===== USE SHARED DATA & NEW USER DATA =====
let hkData = [...housekeepingRequests];
let hkHistData = [...housekeepingHistory];
let mtData = [...maintenanceHistory];
let roomData = typeof roomsData !== 'undefined' ? [...roomsData] : [];
let parkingDataList = typeof parkingData !== 'undefined' ? [...parkingData] : [];
let inventoryDataList = typeof inventoryData !== 'undefined' ? [...inventoryData] : [];
let usersDataList = typeof usersData !== 'undefined' ? [...usersData] : []; 

let dashData = dashboardStats;

console.log('Data Loaded:', { roomData, parkingDataList, inventoryDataList, usersDataList });

// Helper to map AccountType display string to internal role identifier
const roleMap = {
    "Administrator": "admin",
    "Housekeeping Manager": "housekeeping",
    "Maintenance Manager": "maintenance",
    "Inventory Manager": "inventory",
    "Parking Manager": "parking",
    "Housekeeping Staff": "housekeeping", 
    "Maintenance Staff": "maintenance"
};

const errorDisplay = document.getElementById('userFormError');

// ======================================================
// ===== VALIDATION FUNCTIONS =====
// ======================================================

/**
 * Displays a validation error message in the modal footer.
 * @param {string} message - The error message.
 * @param {string} fieldId - Optional ID of the field to focus/highlight.
 */
function showModalError(message, fieldId) {
    if (errorDisplay) {
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
        
        if (fieldId) {
            const input = document.getElementById(fieldId);
            if (input) {
                input.focus();
                input.style.border = '2px solid red'; // Highlight error
                setTimeout(() => { input.style.border = ''; }, 3000);
            }
        }
    }
}

/**
 * Hides any validation error message.
 */
function hideModalError() {
    if (errorDisplay) {
        errorDisplay.style.display = 'none';
        errorDisplay.textContent = '';
    }
}

/**
 * Validates the contact number: must start with '09' and be exactly 11 digits long.
 * @param {string} contact - The contact number string.
 * @returns {boolean} True if validation passes.
 */
function validateContact(contact) {
    // Regex: starts with '09', followed by exactly 9 more digits (total 11)
    const regex = /^09\d{9}$/;
    return regex.test(contact);
}

/**
 * Validates a name field: must contain only letters, spaces, apostrophes, and hyphens.
 * @param {string} name - The name string.
 * @returns {boolean} True if validation passes.
 */
function validateNameCharacters(name) {
    // Regex: allows letters (a-z, A-Z), spaces, hyphens (-), and apostrophes (').
    const regex = /^[a-zA-Z\s'-]+$/;
    return regex.test(name);
}

/**
 * Validates all required fields for non-empty string content and prevents whitespace only input.
 * Also checks name fields for invalid characters and contact field for format.
 * @returns {boolean} True if all validations pass.
 */
function validateFormFields() {
    hideModalError();

    const fields = [
        { id: 'userFirstName', name: 'First Name', type: 'name', required: true },
        { id: 'userLastName', name: 'Last Name', type: 'name', required: true },
        { id: 'userMiddleName', name: 'Middle Name', type: 'name', required: false }, // Optional
        { id: 'userEmail', name: 'Email Address', required: true },
        { id: 'userUsername', name: 'Username', required: true },
        { id: 'userBirthday', name: 'Birthday', required: true },
        { id: 'userAddress', name: 'Address', required: true },
        { id: 'userAccountType', name: 'Account Type', required: true },
    ];
    
    // Check required fields for emptiness and whitespace, and character validation for names
    for (const field of fields) {
        const input = document.getElementById(field.id);
        const rawValue = input.value;
        const value = rawValue.trim();
        
        // 1. Check required fields for emptiness/whitespace
        if (field.required && (value === '' || rawValue === '')) {
            showModalError(`${field.name} is required and cannot be empty.`, field.id);
            return false;
        }

        // 2. Check Name Character Validation (only if field has content)
        if (field.type === 'name' && value !== '') {
            if (!validateNameCharacters(value)) {
                showModalError(`${field.name} can only contain letters, spaces, hyphens, or apostrophes.`, field.id);
                return false;
            }
        }
    }

    // 3. Special Contact Validation
    const contact = document.getElementById('userContact').value.trim();
    if (!validateContact(contact)) {
        showModalError("Contact must start with '09' and be exactly 11 digits long.", 'userContact');
        return false;
    }
    
    // 4. Check password field specifically for new users
    const passwordInput = document.getElementById('userPassword');
    if (!editingUserId && passwordInput.value.trim() === '') {
        showModalError("Password is required for new users.", 'userPassword');
        return false;
    }

    return true;
}

// ===== UPDATE DASHBOARD FUNCTIONS (No Change) =====
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

function updateStatCard(index, value) {
    const statCards = document.querySelectorAll('.statValue');
    if (statCards[index]) {
        statCards[index].textContent = value || '0';
    }
}

// ===== RENDER FUNCTIONS =====
function renderHKTable(data = hkData) {
    const tbody = document.getElementById('hkTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(row => `
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
    
    document.getElementById('hkRecordCount').textContent = data.length;
}

function renderHKHistTable(data = hkHistData) {
    const tbody = document.getElementById('hkHistTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(row => `
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
    
    document.getElementById('hkHistRecordCount').textContent = data.length;
}

function renderMTTable(data = mtData) {
    const tbody = document.getElementById('mtTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(row => `
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
    
    document.getElementById('mtRecordCount').textContent = data.length;
}

function renderRoomsTable(data = roomData) {
    const tbody = document.getElementById('roomsTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map((row, index) => `
        <tr>
            <td>${row.floor}</td>
            <td>${row.room}</td>
            <td>${row.type}</td>
            <td>${row.guests}</td>
            <td>${row.rate}</td>
            <td><span class="statusBadge ${row.status}">${row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span></td>
            <td>
                <div class="actionButtons">
                    <button class="actionBtn editBtn" onclick="editRoom(${index})">
                        <img src="assets/icons/edit-icon.png" alt="Edit" />
                    </button>
                    <button class="actionBtn deleteBtn" onclick="deleteRoom(${index})">
                        <img src="assets/icons/delete-icon.png" alt="Delete" />
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('roomsRecordCount').textContent = data.length;
}

function renderParkingTable(data = parkingDataList) {
    const tbody = document.getElementById('parkingTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(row => `
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
    
    document.getElementById('parkingRecordCount').textContent = data.length;
}

function renderInventoryTable(data = inventoryDataList) {
    const tbody = document.getElementById('inventoryTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(row => {
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
    
    document.getElementById('inventoryRecordCount').textContent = data.length;
}

/**
 * Renders the users table with the provided data.
 * @param {Array} data - The array of user objects to render.
 */
function renderUsersTable(data = usersDataList) {
    const tbody = document.getElementById('userTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No users found</td></tr>';
        document.getElementById('userRecordCount').textContent = 0;
        return;
    }

    tbody.innerHTML = data.map((user) => `
        <tr>
            <td>${user.id}</td>
            <td>${user.firstName} ${user.lastName}</td> 
            <td>${user.email}</td>
            <td><span class="statusBadge ${user.role}">${user.accountType}</span></td> 
            <td><span class="statusBadge ${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
            <td>
                <div class="actionButtons">
                    <button class="actionBtn editBtn" onclick="editUser('${user.id}')">
                        <img src="assets/icons/edit-icon.png" alt="Edit" />
                    </button>
                    <button class="actionBtn deleteBtn" onclick="deleteUser('${user.id}', '${user.firstName} ${user.lastName}')">
                        <img src="assets/icons/delete-icon.png" alt="Delete" />
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('userRecordCount').textContent = data.length;
}

// ===== PAGE NAVIGATION (No Change) =====
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
            // Initial render for the newly activated page
            if (pageName === 'manage-users') {
                renderUsersTable(usersDataList);
            }
        }
    });
});

// ===== HOUSEKEEPING TAB NAVIGATION (Keep existing implementation) =====
const hkTabBtns = document.querySelectorAll('[data-admin-tab]');

hkTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-admin-tab');
        
        hkTabBtns.forEach(b => b.classList.remove('active'));
        
        const hkReqTab = document.getElementById('hk-requests-tab');
        const hkHistTab = document.getElementById('hk-history-tab');
        if (hkReqTab) hkReqTab.classList.remove('active');
        if (hkHistTab) hkHistTab.classList.remove('active');

        btn.classList.add('active');
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) selectedTab.classList.add('active');
    });
});

// ===== HOUSEKEEPING FILTERS (Keep existing implementation) =====
document.getElementById('hkSearchInput')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = hkData.filter(row => 
        row.guest.toLowerCase().includes(search) ||
        row.staff.toLowerCase().includes(search) ||
        row.room.toString().includes(search)
    );
    renderHKTable(filtered);
});

document.getElementById('floorFilter')?.addEventListener('change', (e) => {
    const floor = e.target.value;
    const filtered = floor ? hkData.filter(row => row.floor.toString() === floor) : hkData;
    renderHKTable(filtered);
});

document.getElementById('roomFilter')?.addEventListener('change', (e) => {
    const room = e.target.value;
    const filtered = room ? hkData.filter(row => row.room.toString() === room) : hkData;
    renderHKTable(filtered);
});

document.getElementById('statusFilter')?.addEventListener('change', (e) => {
    const status = e.target.value;
    const filtered = status ? hkData.filter(row => row.status === status) : hkData;
    renderHKTable(filtered);
});

document.getElementById('hkRefreshBtn')?.addEventListener('click', () => {
    document.getElementById('hkSearchInput').value = '';
    document.getElementById('floorFilter').value = '';
    document.getElementById('roomFilter').value = '';
    document.getElementById('statusFilter').value = '';
    hkData = [...housekeepingRequests];
    renderHKTable(hkData);
    alert('Housekeeping requests refreshed!');
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

// ===== HOUSEKEEPING HISTORY FILTERS (Keep existing implementation) =====
document.getElementById('hkHistSearchInput')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = hkHistData.filter(row => 
        row.guest.toLowerCase().includes(search) ||
        row.staff.toLowerCase().includes(search) ||
        row.room.toString().includes(search)
    );
    renderHKHistTable(filtered);
});

document.getElementById('floorFilterHkHist')?.addEventListener('change', (e) => {
    const floor = e.target.value;
    const filtered = floor ? hkHistData.filter(row => row.floor.toString() === floor) : hkHistData;
    renderHKHistTable(filtered);
});

document.getElementById('roomFilterHkHist')?.addEventListener('change', (e) => {
    const room = e.target.value;
    const filtered = room ? hkHistData.filter(row => row.room.toString() === room) : hkHistData;
    renderHKHistTable(filtered);
});

document.getElementById('hkHistRefreshBtn')?.addEventListener('click', () => {
    document.getElementById('hkHistSearchInput').value = '';
    document.getElementById('floorFilterHkHist').value = '';
    document.getElementById('roomFilterHkHist').value = '';
    hkHistData = [...housekeepingHistory];
    renderHKHistTable(hkHistData);
    alert('Housekeeping history refreshed!');
});

document.getElementById('hkHistDownloadBtn')?.addEventListener('click', () => {
    const headers = ['Floor', 'Room', 'Guest', 'Date', 'Requested Time', 'Completed Time', 'Staff In Charge', 'Status', 'Remarks'];
    const csvContent = [
        headers.join(','),
        ...hkHistData.map(row => [row.floor, row.room, row.guest, row.date, row.requestedTime, row.completedTime, row.staff, row.status, row.remarks].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `housekeeping-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
});

// ===== MAINTENANCE FILTERS (Keep existing implementation) =====
document.getElementById('mtSearchInput')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = mtData.filter(row => 
        row.issue.toLowerCase().includes(search) ||
        row.staff.toLowerCase().includes(search) ||
        row.room.toString().includes(search)
    );
    renderMTTable(filtered);
});

document.getElementById('mtFloorFilter')?.addEventListener('change', (e) => {
    const floor = e.target.value;
    const filtered = floor ? mtData.filter(row => row.floor.toString() === floor) : mtData;
    renderMTTable(filtered);
});

document.getElementById('mtRoomFilter')?.addEventListener('change', (e) => {
    const room = e.target.value;
    const filtered = room ? mtData.filter(row => row.room.toString() === room) : mtData;
    renderMTTable(filtered);
});

document.getElementById('mtStatusFilter')?.addEventListener('change', (e) => {
    const status = e.target.value;
    const filtered = status ? mtData.filter(row => row.status === status) : mtData;
    renderMTTable(filtered);
});

document.getElementById('mtRefreshBtn')?.addEventListener('click', () => {
    document.getElementById('mtSearchInput').value = '';
    document.getElementById('mtFloorFilter').value = '';
    document.getElementById('mtRoomFilter').value = '';
    document.getElementById('mtStatusFilter').value = '';
    mtData = [...maintenanceHistory];
    renderMTTable(mtData);
    alert('Maintenance data refreshed!');
});

document.getElementById('mtDownloadBtn')?.addEventListener('click', () => {
    const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Status', 'Staff In Charge', 'Remarks'];
    const csvContent = [
        headers.join(','),
        ...mtData.map(row => [row.floor, row.room, row.issue, row.date, row.requestedTime, row.completedTime, row.status, row.staff, row.remarks].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
});

// ===== PARKING FILTERS (Keep existing implementation) =====
document.getElementById('parkingSearchInput')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = parkingDataList.filter(row => 
        row.plateNumber.toLowerCase().includes(search) ||
        row.guestName.toLowerCase().includes(search) ||
        row.vehicleType.toLowerCase().includes(search) ||
        row.slotNumber.toLowerCase().includes(search)
    );
    renderParkingTable(filtered);
});

document.getElementById('parkingLevelFilter')?.addEventListener('change', (e) => {
    const level = e.target.value;
    const filtered = level ? parkingDataList.filter(row => row.level.toString() === level) : parkingDataList;
    renderParkingTable(filtered);
});

document.getElementById('parkingBlockFilter')?.addEventListener('change', (e) => {
    const block = e.target.value;
    const filtered = block ? parkingDataList.filter(row => row.block === block) : parkingDataList;
    renderParkingTable(filtered);
});

document.getElementById('parkingStatusFilter')?.addEventListener('change', (e) => {
    const status = e.target.value;
    const filtered = status ? parkingDataList.filter(row => row.status === status) : parkingDataList;
    renderParkingTable(filtered);
});

document.getElementById('parkingRefreshBtn')?.addEventListener('click', () => {
    document.getElementById('parkingSearchInput').value = '';
    document.getElementById('parkingLevelFilter').value = '';
    document.getElementById('parkingBlockFilter').value = '';
    document.getElementById('parkingStatusFilter').value = '';
    parkingDataList = [...parkingData];
    renderParkingTable(parkingDataList);
    alert('Parking data refreshed!');
});

document.getElementById('parkingDownloadBtn')?.addEventListener('click', () => {
    const headers = ['Plate Number', 'Room', 'Guest Name', 'Vehicle Type', 'Entry Time', 'Exit Time', 'Slot Number', 'Status'];
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

// ===== INVENTORY FILTERS (Keep existing implementation) =====
document.getElementById('inventorySearchInput')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = inventoryDataList.filter(row => 
        row.name.toLowerCase().includes(search) ||
        row.category.toLowerCase().includes(search) ||
        row.description.toLowerCase().includes(search)
    );
    renderInventoryTable(filtered);
});

document.getElementById('inventoryCategoryFilter')?.addEventListener('change', (e) => {
    const category = e.target.value;
    const filtered = category ? inventoryDataList.filter(row => row.category === category) : inventoryDataList;
    renderInventoryTable(filtered);
});

document.getElementById('inventoryStatusFilter')?.addEventListener('change', (e) => {
    const status = e.target.value;
    const filtered = status ? inventoryDataList.filter(row => row.status === status) : inventoryDataList;
    renderInventoryTable(filtered);
});

document.getElementById('inventoryRefreshBtn')?.addEventListener('click', () => {
    document.getElementById('inventorySearchInput').value = '';
    document.getElementById('inventoryCategoryFilter').value = '';
    document.getElementById('inventoryStatusFilter').value = '';
    inventoryDataList = [...inventoryData];
    renderInventoryTable(inventoryDataList);
    alert('Inventory data refreshed!');
});

document.getElementById('inventoryDownloadBtn')?.addEventListener('click', () => {
    const headers = ['ID', 'Name', 'Category', 'Quantity', 'Description', 'Status', 'Damage', 'Stock In Date', 'Stock Out Date'];
    const csvContent = [
        headers.join(','),
        ...inventoryDataList.map(row => {
            const statusText = row.status === 'in-stock' ? 'In Stock' : 
                                row.status === 'low-stock' ? 'Low Stock' : 'Out of Stock';
            return [row.id, row.name, row.category, row.quantity, row.description, statusText, row.damage, row.stockInDate, row.stockOutDate].join(',');
        })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
});

// ===== ROOMS FILTERS (Keep existing implementation) =====
document.getElementById('roomsSearchInput')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = roomData.filter(row => 
        row.type.toLowerCase().includes(search) ||
        row.room.toString().includes(search) ||
        row.status.toLowerCase().includes(search)
    );
    renderRoomsTable(filtered);
});

document.getElementById('roomsFloorFilter')?.addEventListener('change', (e) => {
    const floor = e.target.value;
    const filtered = floor ? roomData.filter(row => row.floor.toString() === floor) : roomData;
    renderRoomsTable(filtered);
});

document.getElementById('roomsRoomFilter')?.addEventListener('change', (e) => {
    const room = e.target.value;
    const filtered = room ? roomData.filter(row => row.room.toString() === room) : roomData;
    renderRoomsTable(filtered);
});

document.getElementById('roomsTypeFilter')?.addEventListener('change', (e) => {
    const type = e.target.value;
    const filtered = type ? roomData.filter(row => row.type === type) : roomData;
    renderRoomsTable(filtered);
});

document.getElementById('roomsStatusFilter')?.addEventListener('change', (e) => {
    const status = e.target.value;
    const filtered = status ? roomData.filter(row => row.status === status) : roomData;
    renderRoomsTable(filtered);
});

document.getElementById('roomsRefreshBtn')?.addEventListener('click', () => {
    document.getElementById('roomsSearchInput').value = '';
    document.getElementById('roomsFloorFilter').value = '';
    document.getElementById('roomsRoomFilter').value = '';
    document.getElementById('roomsTypeFilter').value = '';
    document.getElementById('roomsStatusFilter').value = '';
    roomData = [...roomsData];
    renderRoomsTable(roomData);
    alert('Rooms data refreshed!');
});

document.getElementById('roomsDownloadBtn')?.addEventListener('click', () => {
    const headers = ['Floor', 'Room', 'Type', 'No. Guests', 'Rate', 'Status'];
    const csvContent = [
        headers.join(','),
        ...roomData.map(row => [row.floor, row.room, row.type, row.guests, row.rate, row.status].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rooms-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
});

// ===== LOGOUT FUNCTIONALITY (Keep existing implementation) =====
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const closeLogoutBtn = document.getElementById('closeLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        logoutModal.style.display = 'flex';
    });
}

if (closeLogoutBtn) {
    closeLogoutBtn.addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });
}

if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });
}

if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
        console.log('Logout confirmed - redirecting to login page');
        window.location.href = '/logout.php'; // adjusted to logout.php
    });
}

if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            logoutModal.style.display = 'none';
        }
    });
}

// ===== ROOM MANAGEMENT FUNCTIONS (Keep existing implementation) =====
let editingRoomIndex = -1;

// Add Room Button
document.getElementById('addRoomBtn')?.addEventListener('click', () => {
    editingRoomIndex = -1;
    document.getElementById('roomModalTitle').textContent = 'Add New Room';
    document.getElementById('roomForm').reset();
    document.getElementById('roomModal').style.display = 'flex';
});

// Edit Room Function (called from table)
window.editRoom = function(index) {
    editingRoomIndex = index;
    const room = roomData[index];
    
    document.getElementById('roomModalTitle').textContent = 'Edit Room';
    document.getElementById('roomFloor').value = room.floor;
    document.getElementById('roomNumber').value = room.room;
    document.getElementById('roomType').value = room.type;
    document.getElementById('roomGuests').value = room.guests;
    document.getElementById('roomRate').value = room.rate;
    document.getElementById('roomStatus').value = room.status;
    
    document.getElementById('roomModal').style.display = 'flex';
};

// Delete Room Function (called from table)
window.deleteRoom = function(index) {
    editingRoomIndex = index;
    const room = roomData[index];
    document.getElementById('deleteRoomText').textContent = 
        `Are you sure you want to delete Room ${room.room} (${room.type})? This action cannot be undone.`;
    document.getElementById('deleteRoomModal').style.display = 'flex';
};

// Save Room Form
document.getElementById('roomForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const roomObj = {
        floor: parseInt(document.getElementById('roomFloor').value),
        room: parseInt(document.getElementById('roomNumber').value),
        type: document.getElementById('roomType').value,
        guests: document.getElementById('roomGuests').value,
        rate: document.getElementById('roomRate').value,
        status: document.getElementById('roomStatus').value
    };
    
    if (editingRoomIndex >= 0) {
        // Update existing room
        roomData[editingRoomIndex] = roomObj;
        alert('Room updated successfully!');
    } else {
        // Add new room
        roomData.push(roomObj);
        alert('Room added successfully!');
    }
    
    // Update global data
    if (window.appData) {
        window.appData.rooms = roomData;
    }
    
    renderRoomsTable(roomData);
    document.getElementById('roomModal').style.display = 'none';
    document.getElementById('roomForm').reset();
});

// Confirm Delete Room
document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
    if (editingRoomIndex >= 0) {
        const deletedRoom = roomData[editingRoomIndex];
        roomData.splice(editingRoomIndex, 1);
        
        // Update global data
        if (window.appData) {
            window.appData.rooms = roomData;
        }
        
        alert(`Room ${deletedRoom.room} deleted successfully!`);
        renderRoomsTable(roomData);
    }
    document.getElementById('deleteRoomModal').style.display = 'none';
});

// Close Room Modal
document.getElementById('closeRoomModalBtn')?.addEventListener('click', () => {
    document.getElementById('roomModal').style.display = 'none';
});

document.getElementById('cancelRoomBtn')?.addEventListener('click', () => {
    document.getElementById('roomModal').style.display = 'none';
});

// Close Delete Modal
document.getElementById('closeDeleteModalBtn')?.addEventListener('click', () => {
    document.getElementById('deleteRoomModal').style.display = 'none';
});

document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
    document.getElementById('deleteRoomModal').style.display = 'none';
});

// Close modals on backdrop click
document.getElementById('roomModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('roomModal').style.display = 'none';
    }
});

document.getElementById('deleteRoomModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('deleteRoomModal').style.display = 'none';
    }
});


// ======================================================
// ===== MANAGE USERS FUNCTIONS (UPDATED) =====
// ======================================================

let editingUserId = null;

// Add User Button
document.getElementById('addUserBtn')?.addEventListener('click', () => {
    editingUserId = null;
    hideModalError(); 
    document.getElementById('employeeNameDisplay').textContent = 'New Employee';
    document.getElementById('employeeIDDisplay').textContent = 'ID: TBD';

    document.getElementById('userForm').reset();
    document.getElementById('userIdHidden').value = '';
    
    // Clear all fields
    document.getElementById('userFirstName').value = '';
    document.getElementById('userMiddleName').value = '';
    document.getElementById('userLastName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userUsername').value = '';
    document.getElementById('userBirthday').value = '';
    document.getElementById('userContact').value = '';
    document.getElementById('userAddress').value = '';
    
    // Set defaults matching the image/initial state
    const defaultAccountType = 'Administrator';
    document.getElementById('userAccountType').value = defaultAccountType; 
    document.getElementById('userShift').value = 'Day'; 
    document.getElementById('userRoleDisplay').value = defaultAccountType; 
    
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('userPassword').placeholder = 'Required for new user';

    document.getElementById('userStatus').value = 'active'; 
    document.getElementById('userRole').value = roleMap[defaultAccountType]; 

    document.getElementById('saveUserBtn').textContent = 'ADD USER'; 
    document.getElementById('userModal').style.display = 'flex';
});

// Edit User Function
window.editUser = function(id) {
    editingUserId = id;
    hideModalError(); // Clear previous errors
    const user = usersDataList.find(u => u.id === id);
    if (!user) return;
    
    document.getElementById('employeeNameDisplay').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('employeeIDDisplay').textContent = `ID: ${user.id}`;

    document.getElementById('userIdHidden').value = user.id;
    document.getElementById('userFirstName').value = user.firstName || '';
    document.getElementById('userMiddleName').value = user.middleName || '';
    document.getElementById('userLastName').value = user.lastName || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userUsername').value = user.username || '';
    document.getElementById('userBirthday').value = user.birthday || '';
    document.getElementById('userContact').value = user.contact || '';
    document.getElementById('userAddress').value = user.address || '';
    
    document.getElementById('userAccountType').value = user.accountType || ''; 
    document.getElementById('userShift').value = user.shift || 'Day';

    document.getElementById('userRoleDisplay').value = user.accountType || '';
    document.getElementById('userRole').value = user.role || '';
    
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = false; 
    document.getElementById('userPassword').placeholder = 'Leave blank to keep current password';

    document.getElementById('userStatus').value = user.status || 'active';
    
    document.getElementById('saveUserBtn').textContent = 'SAVE CHANGES'; 
    document.getElementById('userModal').style.display = 'flex';
};

// --- New Event Listener for Account Type Dropdown Sync ---
document.getElementById('userAccountType')?.addEventListener('change', (e) => {
    const selectedAccountType = e.target.value;
    const internalRole = roleMap[selectedAccountType] || 'staff';
    
    document.getElementById('userRoleDisplay').value = selectedAccountType;
    document.getElementById('userRole').value = internalRole;
});

// Delete User Function
window.deleteUser = function(id, name) {
    editingUserId = id;
    document.getElementById('deleteUserText').textContent = 
        `Are you sure you want to delete user "${name}" (ID: ${id})? This action cannot be undone.`;
    document.getElementById('deleteUserModal').style.display = 'flex';
};

// Save User Form (UPDATED with full validation)
document.getElementById('userForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // --- 1. RUN VALIDATION ---
    if (!validateFormFields()) {
        return; 
    }
    hideModalError(); // Clear error if validation passes

    // --- 2. GATHER DATA (trimming whitespace) ---
    const firstName = document.getElementById('userFirstName').value.trim();
    const middleName = document.getElementById('userMiddleName').value.trim();
    const lastName = document.getElementById('userLastName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const username = document.getElementById('userUsername').value.trim();
    const birthday = document.getElementById('userBirthday').value.trim();
    const contact = document.getElementById('userContact').value.trim();
    const address = document.getElementById('userAddress').value.trim();
    const accountType = document.getElementById('userAccountType').value.trim();
    const shift = document.getElementById('userShift').value.trim();
    const password = document.getElementById('userPassword').value.trim();
    
    const role = document.getElementById('userRole').value.trim();
    const status = document.getElementById('userStatus').value.trim();

    // --- 3. CREATE/UPDATE OBJECT ---
    const userObj = {
        firstName,
        middleName,
        lastName,
        name: `${firstName} ${lastName}`, 
        email,
        username,
        birthday,
        contact,
        address,
        accountType, 
        role, 
        status,
        shift,
        passwordHash: password ? `newhashedpassword${Math.random()}` : undefined 
    };
    
    if (editingUserId) {
        const index = usersDataList.findIndex(u => u.id === editingUserId);
        if (index > -1) {
            usersDataList[index] = { ...usersDataList[index], ...userObj };
            if (!password) {
                delete usersDataList[index].passwordHash;
            }
            document.getElementById('employeeNameDisplay').textContent = `${firstName} ${lastName}`;
            document.getElementById('employeeIDDisplay').textContent = `ID: ${editingUserId} (Updated!)`;
            console.log('User updated successfully!');
        }
    } else {
        const newIdNum = usersDataList.length > 0 ? Math.max(...usersDataList.map(u => parseInt(u.id.replace('EID', '')))) + 1 : 1;
        const newId = `EID${String(newIdNum).padStart(3, '0')}`;

        usersDataList.push({ id: newId, ...userObj, passwordHash: userObj.passwordHash || 'defaultnewhash' });
        document.getElementById('employeeNameDisplay').textContent = `${firstName} ${lastName}`;
        document.getElementById('employeeIDDisplay').textContent = `ID: ${newId} (Added!)`;
        console.log('User added successfully!');
    }

    // --- 4. FINISH AND RENDER ---
    window.usersData = usersDataList;
    window.appData.users = usersDataList; 

    renderUsersTable(usersDataList);
    updateDashboardStats(dashboardStats); 
    
    // Auto-close modal after a short delay to show successful changes
    setTimeout(() => {
        document.getElementById('userModal').style.display = 'none';
        document.getElementById('userForm').reset();
    }, 1000); 
});

// Confirm Delete User (No Change)
document.getElementById('confirmDeleteUserBtn')?.addEventListener('click', () => {
    if (editingUserId) {
        const initialLength = usersDataList.length;
        usersDataList = usersDataList.filter(u => u.id !== editingUserId);
        
        if (usersDataList.length < initialLength) {
            window.usersData = usersDataList;
            window.appData.users = usersDataList;
            console.log(`User (ID: ${editingUserId}) deleted successfully!`);
            renderUsersTable(usersDataList);
            updateDashboardStats(dashboardStats); 
        }
    }
    document.getElementById('deleteUserModal').style.display = 'none';
    editingUserId = null;
});


// --- Modal Close Handlers (No Change) ---
document.getElementById('closeUserModalBtn')?.addEventListener('click', () => {
    document.getElementById('userModal').style.display = 'none';
});

document.getElementById('closeDeleteUserModalBtn')?.addEventListener('click', () => {
    document.getElementById('deleteUserModal').style.display = 'none';
});

document.getElementById('userModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('userModal').style.display = 'none';
    }
});

document.getElementById('deleteUserModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('deleteUserModal').style.display = 'none';
    }
});


// --- Filtering and Refresh (No Change) ---
/**
 * Filters the users data based on search input, role, and status.
 */
function filterUsers() {
    const search = document.getElementById('userSearchInput').value.toLowerCase();
    const roleFilter = document.getElementById('userRoleFilter').value; 
    const status = document.getElementById('userStatusFilter').value;

    let filtered = usersDataList.filter(user => 
        (user.firstName.toLowerCase().includes(search) || 
         user.lastName.toLowerCase().includes(search) ||  
         user.id.toLowerCase().includes(search) ||        
         user.username.toLowerCase().includes(search) ||   
         user.email.toLowerCase().includes(search)) &&     
        (!roleFilter || user.role === roleFilter) && 
        (!status || user.status === status)
    );
    renderUsersTable(filtered);
}

document.getElementById('userSearchInput')?.addEventListener('input', filterUsers);
document.getElementById('userRoleFilter')?.addEventListener('change', filterUsers);
document.getElementById('userStatusFilter')?.addEventListener('change', filterUsers);

document.getElementById('userRefreshBtn')?.addEventListener('click', () => {
    document.getElementById('userSearchInput').value = '';
    document.getElementById('userRoleFilter').value = '';
    document.getElementById('userStatusFilter').value = '';
    usersDataList = [...window.usersData]; 
    renderUsersTable(usersDataList);
    console.log('User list refreshed!');
});

// ===== INITIALIZATION (No Change) =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin page loaded - initializing with shared data');
    console.log('Users Data:', usersDataList);
    
    const dashboardLink = document.querySelector('[data-page="dashboard"]');
    if (dashboardLink) {
        dashboardLink.classList.add('active');
    }
    const dashboardPage = document.getElementById('dashboard-page');
    if (dashboardPage) {
        dashboardPage.classList.add('active');
    }

    updateDashboardStats(dashData);
    renderHKTable(hkData);
    renderHKHistTable(hkHistData);
    renderMTTable(mtData);
    renderRoomsTable(roomData);
    renderParkingTable(parkingDataList);
    renderInventoryTable(inventoryDataList);

    // Initial sync for the default 'Add New User' state
    const defaultAccountType = document.getElementById('userAccountType').value;
    if (document.getElementById('userRoleDisplay')) {
        document.getElementById('userRoleDisplay').value = defaultAccountType;
    }
    if (document.getElementById('userRole')) {
         document.getElementById('userRole').value = roleMap[defaultAccountType] || 'admin';
    }
});