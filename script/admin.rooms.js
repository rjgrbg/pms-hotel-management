/**
 * ROOMS MODULE JAVASCRIPT
 * Features: Fetching, Dynamic Filters, Modal Logic, Toast, Landscape PDF
 * Fix: Uses .onclick/.onchange to prevent multiple PDF downloads
 */

// ==========================================
// 1. GLOBAL HELPERS (Toast & PDF)
// ==========================================

// --- INJECT TOAST CSS ---
const roomToastStyle = document.createElement("style");
roomToastStyle.textContent = `
    .toast-success {
        position: fixed; top: 20px; right: 20px; background-color: #28a745; color: white;
        padding: 12px 24px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        z-index: 99999; font-family: 'Segoe UI', sans-serif; font-size: 14px;
        opacity: 0; transform: translateY(-20px); transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
    }
    .toast-visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(roomToastStyle);

// --- SHOW TOAST FUNCTION ---
function showRoomToast(message) {
    const existingToast = document.querySelector('.toast-success');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerText = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- LANDSCAPE PDF GENERATOR (DEPRECATED - Now using download-utils.js) ---
// This function is kept for backwards compatibility but downloads now use downloadData()
function downloadRoomsPDF(headers, data, title, filename) {
    if (typeof downloadData === 'function') {
        downloadData(headers, data, title, filename);
    } else {
        console.error('Download utility not loaded');
        alert('Download feature is not available. Please refresh the page.');
    }
}

// ==========================================
// 2. DATA FETCHING & POPULATION
// ==========================================

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
         document.getElementById('roomsRecordCount').textContent = 0;
         populateDynamicFilters([]); 
         updateDashboardFromRooms([]); 
         renderPaginationControls('rooms-page', 0, 1, () => {});
    } else {
         roomsTableBody.innerHTML = `<tr><td colspan="7">Failed to load data: ${result.message}</td></tr>`;
         document.getElementById('roomsRecordCount').textContent = 0;
         updateDashboardFromRooms([]);
         renderPaginationControls('rooms-page', 0, 1, () => {});
    }
    
    // Re-init filters to attach events to new data
    initRoomFilters();
}

function populateDynamicFilters(data) {
    // Get the room type filter element
    const roomsTypeFilter = document.getElementById('roomsTypeFilter');

    // Update the safety check to include the new element
    if (!roomsFloorFilter || !roomsRoomFilter || !roomsTypeFilter) return;

    // Save current selection to restore if possible
    const currentFloor = roomsFloorFilter.value;
    const currentType = roomsTypeFilter.value; // Store current type selection

    const floors = [...new Set(data.map(room => room.Floor))].sort((a, b) => a - b);
    
    roomsFloorFilter.innerHTML = '<option value="">Floor</option>';
    floors.forEach(floor => {
        const option = document.createElement('option');
        option.value = floor;
        option.textContent = floor;
        roomsFloorFilter.appendChild(option);
    });

    if (floors.includes(parseInt(currentFloor))) {
        roomsFloorFilter.value = currentFloor;
    }
    
    // NEW LOGIC: Populate Room Type Filter dynamically from room data
    // It assumes the room type is in the 'Type' field of the room object.
    const roomTypes = [...new Set(data.map(room => room.Type))].filter(Boolean).sort();

    roomsTypeFilter.innerHTML = '<option value="">Room Type</option>';
    roomTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        roomsTypeFilter.appendChild(option);
    });
    
    if (roomTypes.includes(currentType)) {
        roomsTypeFilter.value = currentType;
    }


    updateRoomFilterOptions(data, roomsFloorFilter.value);
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

// ==========================================
// 3. FORM HELPERS
// ==========================================

function updateGuestCapacity() {
    const selectedType = roomTypeInput.value;
    roomGuestsInput.value = ROOM_CAPACITY_MAP[selectedType] || '';
}

function enforceFloorPrefix() {
    const floor = roomFloorInput.value;
    let room = roomNumberInput.value;

    if (!floor) {
        if (room.length > 0) roomNumberInput.value = '';
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

// ==========================================
// 4. RENDER TABLE
// ==========================================

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
      // 1. Formatting for Cleaning/Maintenance Status
      let statusClass;
      let statusDisplay;

      if (row.Status === 'Maintenance' || row.Status === 'Needs Maintenance') {
        statusClass = 'needs-maintenance';
        statusDisplay = 'Needs Maintenance';
      } else {
        statusClass = row.Status.toLowerCase().replace(/ /g, '-');
        statusDisplay = row.Status.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }

      // 2. Formatting for Occupancy Status 
      let occupancyText = row.Occupancy ? row.Occupancy : 'Available'; 
      let occupancyClass = occupancyText.toLowerCase().replace(/ /g, '-');

      // 3. Your Nested Dropdown Menu (Now includes "Edit Room Info")
      const dropdownMenu = `
        <div class="dropdown-menu">
          <button class="dropdown-item" onclick='handleViewRoomDetails(${JSON.stringify(row).replace(/'/g, "&apos;")}); closeAllDropdowns();'>
            <i class="fas fa-eye"></i> View Details
          </button>
          <div class="dropdown-item has-submenu" onmouseenter="showSubmenu(event)" onmouseleave="hideSubmenu(event)">
            <i class="fas fa-edit"></i> Edit
            <div class="dropdown-submenu" onmouseenter="keepSubmenuOpen(event)" onmouseleave="closeSubmenu(event)">
              <button class="dropdown-item" onclick='openEditRoomModal(${JSON.stringify(row).replace(/'/g, "&apos;")}); closeAllDropdowns();'>
                <i class="fas fa-door-open"></i> Edit Room Info
              </button>
              <button class="dropdown-item" onclick='handleEditRoomHousekeeping(${JSON.stringify(row).replace(/'/g, "&apos;")}); closeAllDropdowns();'>
                <i class="fas fa-broom"></i> Edit Housekeeping
              </button>
              <button class="dropdown-item" onclick='handleEditRoomMaintenance(${JSON.stringify(row).replace(/'/g, "&apos;")}); closeAllDropdowns();'>
                <i class="fas fa-tools"></i> Edit Maintenance
              </button>
            </div>
          </div>
        </div>
      `;

      return `
        <tr data-room-data='${JSON.stringify(row)}'>
          <td>${row.Floor}</td>
          <td>${row.Room}</td>
          <td>${row.Name || '-'}</td>
          <td>${row.Type}</td>
          <td>${row.NoGuests}</td>
          <td>
            <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                <span class="statusBadge ${occupancyClass}">${occupancyText}</span>
                <span style="color: #bbb; font-weight: bold;">/</span>
                <span class="statusBadge ${statusClass}">${statusDisplay}</span>
            </div>
          </td>
          <td>
            <div class="action-dropdown">
              <button class="action-dots-btn" onclick="toggleActionDropdown(event)">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              ${dropdownMenu}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('roomsRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('rooms-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRoomsTable(data);
  });
}

// ==========================================
// 5. MODAL HANDLERS
// ==========================================

window.openEditRoomModal = function(room) {
    hideFormMessage();
    
    roomModalTitle.textContent = 'Edit Room ' + room.Room;
    document.getElementById('saveRoomBtn').textContent = 'SAVE STATUS';
    
    // Populate form
    roomFloorInput.innerHTML = `<option value="${room.Floor}">${room.Floor}</option>`;
    roomFloorInput.value = room.Floor;
    
    roomNumberInput.value = room.Room;
    roomTypeInput.innerHTML = `<option value="${room.Type}">${room.Type}</option>`;
    roomTypeInput.value = room.Type;
    roomGuestsInput.value = room.NoGuests;
    roomRateInput.value = parseFloat(room.Rate || 0).toFixed(2);
    
    // Status Logic
    const currentStatus = room.Status;
    const settableStatuses = ["Available", "Needs Cleaning", "Needs Maintenance"];

    const dynamicOptions = roomStatusInput.querySelectorAll('option[data-dynamic="true"]');
    dynamicOptions.forEach(opt => opt.remove());

    roomStatusInput.value = ""; 

    if (settableStatuses.includes(currentStatus)) {
        roomStatusInput.value = currentStatus;
    } else {
        const currentStatusOption = document.createElement('option');
        currentStatusOption.value = currentStatus;
        currentStatusOption.textContent = currentStatus;
        currentStatusOption.selected = true;
        currentStatusOption.disabled = true;
        currentStatusOption.setAttribute('data-dynamic', 'true');
        roomStatusInput.insertBefore(currentStatusOption, roomStatusInput.children[1]);
    }
    
    hiddenRoomIdInput.value = room.RoomID; 
    roomModal.style.display = 'flex';
}

async function handleRoomFormSubmit(e) {
    e.preventDefault();
    hideFormMessage();
    
    const floor = roomFloorInput.value;
    const roomNum = roomNumberInput.value;
    if (!roomNum.startsWith(floor)) {
        showFormMessage(`Room Number (${roomNum}) must start with the selected Floor Number (${floor}).`, 'error');
        return;
    }

    const roomID = hiddenRoomIdInput.value;
    const action = 'edit_room';
    
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
}

// ==========================================
// 6. FILTERS & EVENTS (FIXED: Uses onclick/onchange)
// ==========================================

function initRoomFilters() {
    const searchInput = document.getElementById('roomsSearchInput');
    const floorFilter = document.getElementById('roomsFloorFilter');
    const roomFilter = document.getElementById('roomsRoomFilter');
    const typeFilter = document.getElementById('roomsTypeFilter');
    const statusFilter = document.getElementById('roomsStatusFilter');
    const refreshBtn = document.getElementById('roomsRefreshBtn');
    const downloadBtn = document.getElementById('roomsDownloadBtn');

    // --- Central Filter Function ---
    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const floor = floorFilter.value;
        const room = roomFilter.value;
        const type = typeFilter.value;
        const status = statusFilter.value;

        const filtered = roomData.filter(row => {
            const searchMatch = !search || 
                row.Type.toLowerCase().includes(search) || 
                row.Room.toString().includes(search) || 
                (row.Name && row.Name.toLowerCase().includes(search)) ||
                row.Status.toLowerCase().includes(search);

            const floorMatch = !floor || row.Floor.toString() === floor;
            const roomMatch = !room || row.Room.toString() === room;
            const typeMatch = !type || row.Type === type;
            const statusMatch = !status || row.Status === status;
            return searchMatch && floorMatch && roomMatch && typeMatch && statusMatch;
        });

        paginationState.rooms.currentPage = 1;
        renderRoomsTable(filtered);
        return filtered; // Return for PDF
    }

    // --- Use .onchange/.oninput to prevent duplicate listeners ---
    if (searchInput) searchInput.oninput = applyFilters;
    
    if (floorFilter) {
        floorFilter.onchange = (e) => {
            // Update room dropdown based on floor selection
            updateRoomFilterOptions(roomData, e.target.value);
            applyFilters();
        };
    }
    
    if (roomFilter) roomFilter.onchange = applyFilters;
    if (typeFilter) typeFilter.onchange = applyFilters;
    if (statusFilter) statusFilter.onchange = applyFilters;

    // --- Refresh Button ---
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            if(searchInput) searchInput.value = '';
            if(floorFilter) floorFilter.value = '';
            if(roomFilter) roomFilter.value = '';
            if(typeFilter) typeFilter.value = '';
            if(statusFilter) statusFilter.value = '';
            
            fetchAndRenderRooms();
            showRoomToast("Rooms refreshed successfully!");
        };
    }

    // --- Download Button (Landscape PDF) ---
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            // Get current filtered data
            const filteredData = applyFilters();
            
            if (filteredData.length === 0) {
                alert("No data to download");
                return;
            }

            // UPDATED: Removed 'Rate' from Headers and Body
            // UPDATED: Combined Occupancy and Status into one string
            const headers = ['Floor', 'Room', 'Room Name', 'Type', 'No. Guests', 'Occupancy / Status'];
            const body = filteredData.map(row => {
                let occText = row.Occupancy ? row.Occupancy : 'Available';
                return [
                    row.Floor,
                    row.Room,
                    row.Name || '-',
                    row.Type,
                    row.NoGuests,
                    `${occText} / ${row.Status}` // Merged for the PDF!
                ];
            });

            downloadData(headers, body, 'Rooms Report', 'rooms_report');
        };
    }
}
// ==========================================
// 7. NESTED MENU & VIEW DETAILS HANDLERS
// ==========================================

// --- DROPDOWN & SUBMENU HOVER LOGIC ---
window.toggleActionDropdown = function(event) {
    event.stopPropagation();
    closeAllDropdowns();
    const dropdownMenu = event.currentTarget.nextElementSibling;
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('show');
    }
};

window.closeAllDropdowns = function() {
    document.querySelectorAll('.dropdown-menu.show, .dropdown-submenu.show').forEach(menu => {
        menu.classList.remove('show');
    });
};

window.showSubmenu = function(event) {
    const submenu = event.currentTarget.querySelector('.dropdown-submenu');
    if (submenu) submenu.classList.add('show');
};

window.hideSubmenu = function(event) {
    const submenu = event.currentTarget.querySelector('.dropdown-submenu');
    if (submenu) submenu.classList.remove('show');
};

window.keepSubmenuOpen = function(event) {
    event.currentTarget.classList.add('show');
};

window.closeSubmenu = function(event) {
    event.currentTarget.classList.remove('show');
};

// Close dropdowns if clicking anywhere else on the screen
document.addEventListener('click', () => {
    closeAllDropdowns();
});

// --- VIEW DETAILS MODAL LOGIC ---
window.handleViewRoomDetails = function(room) {
    // 1. Set the Title (Room Name)
    const title = document.getElementById('roomDetailsTitle');
    if (title) {
        title.textContent = room.Name || 'Room';
    }

    // 2. Set the Room Number (not bold)
    const roomNumber = document.getElementById('roomNumber');
    if (roomNumber) {
        roomNumber.textContent = `Room ${room.Room}`;
    }

    // 3. Set the Status Badge & Colors dynamically
    const statusBadge = document.getElementById('currentStatusBadge');
    if (statusBadge) {
        statusBadge.textContent = room.Status.toUpperCase();
        statusBadge.className = 'statusBadge'; // Reset default classes
        let statusClass = room.Status.toLowerCase().replace(/ /g, '-');
        statusBadge.classList.add(statusClass);
    }

    // 4. Set the 4 Core Room Stats
    if (document.getElementById('detailFloor')) document.getElementById('detailFloor').textContent = room.Floor;
    if (document.getElementById('detailType')) document.getElementById('detailType').textContent = room.Type;
    if (document.getElementById('detailGuests')) document.getElementById('detailGuests').textContent = room.NoGuests;
    if (document.getElementById('detailRoom')) document.getElementById('detailRoom').textContent = room.Room;

    // 4. Set Sample Data for Equipment, Amenities, and Linens (exactly matching image)
    if (document.getElementById('equipmentList')) {
        document.getElementById('equipmentList').innerHTML = `
            <div class="equipmentItem">
                <i class="fas fa-tv"></i>
                <span class="equipmentName">Television</span>
                <div class="equipmentDetails">
                    <small><strong>Installed:</strong> Apr 27, 2024</small>
                    <small><strong>Last Maintenance:</strong> Jan 27, 2026</small>
                </div>
            </div>
            <div class="equipmentItem">
                <i class="fas fa-snowflake"></i>
                <span class="equipmentName">Air Conditioner</span>
                <div class="equipmentDetails">
                    <small><strong>Installed:</strong> Apr 27, 2025</small>
                    <small><strong>Last Maintenance:</strong> Mar 27, 2026</small>
                </div>
            </div>
            <div class="equipmentItem">
                <i class="fas fa-temperature-low"></i>
                <span class="equipmentName">Mini Fridge</span>
                <div class="equipmentDetails">
                    <small><strong>Installed:</strong> Oct 27, 2024</small>
                    <small><strong>Last Maintenance:</strong> Feb 27, 2026</small>
                </div>
            </div>
            <div class="equipmentItem">
                <i class="fas fa-coffee"></i>
                <span class="equipmentName">Coffee Maker</span>
                <div class="equipmentDetails">
                    <small><strong>Installed:</strong> Aug 27, 2025</small>
                    <small><strong>Last Maintenance:</strong> Apr 20, 2026</small>
                </div>
            </div>
            <div class="equipmentItem">
                <i class="fas fa-wind"></i>
                <span class="equipmentName">Hair Dryer</span>
                <div class="equipmentDetails">
                    <small><strong>Installed:</strong> Apr 27, 2025</small>
                    <small><strong>Last Maintenance:</strong> Apr 13, 2026</small>
                </div>
            </div>
            <div class="equipmentItem">
                <i class="fas fa-lock"></i>
                <span class="equipmentName">Safe Box</span>
                <div class="equipmentDetails">
                    <small><strong>Installed:</strong> Apr 27, 2024</small>
                    <small><strong>Last Maintenance:</strong> Oct 27, 2025</small>
                </div>
            </div>
        `;
    }
    
    if (document.getElementById('amenitiesList')) {
        document.getElementById('amenitiesList').innerHTML = `
            <div class="listItem"><i class="fas fa-circle"></i> Complimentary WiFi</div>
            <div class="listItem"><i class="fas fa-circle"></i> Room Service</div>
            <div class="listItem"><i class="fas fa-circle"></i> Daily Housekeeping</div>
            <div class="listItem"><i class="fas fa-circle"></i> Toiletries</div>
        `;
    }
    
    if (document.getElementById('linensList')) {
        document.getElementById('linensList').innerHTML = `
            <div class="listItem"><i class="fas fa-circle"></i> Bed Sheets (2 sets)</div>
            <div class="listItem"><i class="fas fa-circle"></i> Pillowcases (4 pcs)</div>
            <div class="listItem"><i class="fas fa-circle"></i> Bath Towels (4 pcs)</div>
            <div class="listItem"><i class="fas fa-circle"></i> Hand Towels (4 pcs)</div>
        `;
    }

    // 5. Open the Modal!
    const modal = document.getElementById('roomDetailsModal');
    if (modal) modal.style.display = 'flex';
};

// --- PLACEHOLDER HANDLERS FOR THE SUBMENU ---
window.handleEditRoomHousekeeping = function(room) {
    showRoomToast(`Housekeeping tools for Room ${room.Room} coming soon!`);
};

window.handleEditRoomMaintenance = function(room) {
    showRoomToast(`Maintenance tools for Room ${room.Room} coming soon!`);
};

// --- CLOSE MODAL HANDLERS ---
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn1 = document.getElementById('closeRoomDetailsBtn');
    const closeBtn2 = document.getElementById('closeRoomDetailsBtn2');
    const modal = document.getElementById('roomDetailsModal');

    if (closeBtn1) closeBtn1.onclick = () => modal.style.display = 'none';
    if (closeBtn2) closeBtn2.onclick = () => modal.style.display = 'none';
});
// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('rooms-page')) {
        fetchAndRenderRooms();
    }
});