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

      const dropdownMenu = `
        <div class="dropdown-menu">
          <button class="dropdown-item" onclick='handleViewRoomDetails(${JSON.stringify(row).replace(/'/g, "&apos;")}); closeAllDropdowns();'>
            <i class="fas fa-eye"></i> View Details
          </button>
          <div class="dropdown-item has-submenu" onmouseenter="showSubmenu(event)" onmouseleave="hideSubmenu(event)">
            <i class="fas fa-edit"></i> Edit
            <i class="fas fa-chevron-right submenu-arrow"></i>
            <div class="dropdown-submenu" onmouseenter="keepSubmenuOpen(event)" onmouseleave="closeSubmenu(event)">
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
          <td><span class="statusBadge ${statusClass}">${statusDisplay}</span></td>
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

function handleEditClick(event) {
    hideFormMessage();
    // Ensure we get the TR even if a child element is clicked
    const tr = event.currentTarget;
    const room = JSON.parse(tr.dataset.roomData);
    
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
            const headers = ['Floor', 'Room', 'Room Name', 'Type', 'No. Guests', 'Status'];
            const body = filteredData.map(row => [
                row.Floor,
                row.Room,
                row.Name || '-',
                row.Type,
                row.NoGuests,
                row.Status
            ]);

            downloadData(headers, body, 'Rooms Report', 'rooms_report');
        };
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('rooms-page')) {
        fetchAndRenderRooms();
    }
});

// ==========================================
// 7. DROPDOWN TOGGLE FUNCTION (Same as Manage Users)
// ==========================================

window.closeAllDropdowns = function() {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
    });
    // Also hide any visible submenus
    document.querySelectorAll('.dropdown-submenu.show').forEach(submenu => {
        submenu.classList.remove('show');
    });
}

window.toggleActionDropdown = function(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const dropdown = button.nextElementSibling;
    const isOpen = dropdown.classList.contains('show');
    
    // Close all other dropdowns
    closeAllDropdowns();
    
    // Toggle current dropdown
    if (!isOpen) {
        // Get button position
        const rect = button.getBoundingClientRect();
        const dropdownHeight = 120; // Approximate height of dropdown
        const spaceBelow = window.innerHeight - rect.bottom;
        
        // Position dropdown
        if (spaceBelow < dropdownHeight) {
            // Open upward
            dropdown.style.bottom = (window.innerHeight - rect.top) + 'px';
            dropdown.style.top = 'auto';
        } else {
            // Open downward
            dropdown.style.top = (rect.bottom + 4) + 'px';
            dropdown.style.bottom = 'auto';
        }
        dropdown.style.left = (rect.right - 180) + 'px'; // Align to right of button
        
        dropdown.classList.add('show');
    }
}

// Submenu handlers
window.showSubmenu = function(event) {
    event.stopPropagation();
    const parentItem = event.currentTarget;
    const submenu = parentItem.querySelector('.dropdown-submenu');
    const mainDropdown = parentItem.closest('.dropdown-menu');

    if (submenu && mainDropdown) {
        // Hide other submenus
        document.querySelectorAll('.dropdown-submenu.show').forEach(s => {
            if (s !== submenu) s.classList.remove('show');
        });
        
        // Add class to main dropdown to shift it left
        mainDropdown.classList.add('submenu-active');
        
        // Show submenu after a tiny delay to let main menu shift first
        setTimeout(() => {
            submenu.classList.add('show');
        }, 50);
    }
}

window.hideSubmenu = function(event) {
    event.stopPropagation();
    const submenu = event.currentTarget.querySelector('.dropdown-submenu');
    const mainDropdown = event.currentTarget.closest('.dropdown-menu');
    
    if (submenu) {
        setTimeout(() => {
            if (!submenu.matches(':hover')) {
                submenu.classList.remove('show');
                if (mainDropdown) {
                    mainDropdown.classList.remove('submenu-active');
                }
            }
        }, 100);
    }
}

window.keepSubmenuOpen = function(event) {
    event.stopPropagation();
}

window.closeSubmenu = function(event) {
    event.stopPropagation();
    const submenu = event.currentTarget;
    const mainDropdown = submenu.closest('.dropdown-menu');
    
    submenu.classList.remove('show');
    if (mainDropdown) {
        mainDropdown.classList.remove('submenu-active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.action-dropdown')) {
        closeAllDropdowns();
    }
});

// ==========================================
// 8. ACTION HANDLERS
// ==========================================

window.handleViewRoomDetails = async function(room) {
    console.log('View details for room:', room);
    
    // Show modal
    document.getElementById('roomDetailsModal').style.display = 'flex';
    document.getElementById('roomDetailsTitle').textContent = `Room ${room.Room} - ${room.Name || 'Details'}`;
    
    // Populate basic info
    document.getElementById('detailFloor').textContent = room.Floor;
    document.getElementById('detailRoom').textContent = room.Room;
    document.getElementById('detailType').textContent = room.Type;
    document.getElementById('detailGuests').textContent = room.NoGuests;
    
    // Update status badge
    const statusBadge = document.getElementById('currentStatusBadge');
    statusBadge.textContent = `Current Status: ${room.Status.toUpperCase()}`;
    
    // Apply status badge color
    statusBadge.className = 'currentStatusBadge';
    if (room.Status === 'Available') {
        statusBadge.style.background = '#d4edda';
        statusBadge.style.color = '#155724';
        statusBadge.style.borderColor = '#c3e6cb';
    } else if (room.Status === 'Needs Cleaning') {
        statusBadge.style.background = '#fff3cd';
        statusBadge.style.color = '#856404';
        statusBadge.style.borderColor = '#ffeaa7';
    } else if (room.Status === 'Needs Maintenance') {
        statusBadge.style.background = '#f8d7da';
        statusBadge.style.color = '#721c24';
        statusBadge.style.borderColor = '#f5c6cb';
    }
    
    // Load equipment, amenities, linens data
    await loadRoomDetails(room.RoomID);
}

async function loadRoomDetails(roomID) {
    try {
        // Fetch room details from backend
        const result = await apiCall('get_room_details', { roomID: roomID }, 'GET', 'room_actions.php');
        
        if (result.success) {
            const data = result.data;
            
            // Populate Equipment
            const equipmentList = document.getElementById('equipmentList');
            if (data.equipment && data.equipment.length > 0) {
                equipmentList.innerHTML = data.equipment.map(item => `
                    <div class="equipmentItem">
                        <i class="${item.icon || 'fas fa-tv'}"></i>
                        <span class="equipmentName">${item.name}</span>
                        <div class="equipmentDetails">
                            <small><strong>Installed:</strong> ${item.installed || 'N/A'}</small>
                            <small><strong>Last Maintenance:</strong> ${item.lastMaintenance || 'N/A'}</small>
                        </div>
                    </div>
                `).join('');
            } else {
                equipmentList.innerHTML = '<p class="loadingText">No equipment data available</p>';
            }
            
            // Populate Amenities
            const amenitiesList = document.getElementById('amenitiesList');
            if (data.amenities && data.amenities.length > 0) {
                amenitiesList.innerHTML = data.amenities.map(item => `
                    <div class="listItem">
                        <i class="fas fa-check-circle"></i>
                        <span>${item.name}</span>
                    </div>
                `).join('');
            } else {
                amenitiesList.innerHTML = '<p class="loadingText">No amenities data available</p>';
            }
            
            // Populate Linens
            const linensList = document.getElementById('linensList');
            if (data.linens && data.linens.length > 0) {
                linensList.innerHTML = data.linens.map(item => `
                    <div class="listItem">
                        <i class="fas fa-check-circle"></i>
                        <span>${item.name}</span>
                    </div>
                `).join('');
            } else {
                linensList.innerHTML = '<p class="loadingText">No linens data available</p>';
            }
            
        }
    } catch (error) {
        console.error('Error loading room details:', error);
    }
}

window.handleEditRoomHousekeeping = function(room) {
    console.log('Edit housekeeping for room:', room);
    showRoomToast(`Edit Housekeeping for Room ${room.Room} - Coming soon!`);
    // TODO: Implement edit housekeeping functionality
}

window.handleEditRoomMaintenance = function(room) {
    console.log('Edit maintenance for room:', room);
    showRoomToast(`Edit Maintenance for Room ${room.Room} - Coming soon!`);
    // TODO: Implement edit maintenance functionality
}

// Close modal handlers
document.addEventListener('DOMContentLoaded', () => {
    const closeButtons = ['closeRoomDetailsBtn', 'closeRoomDetailsBtn2'];
    closeButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = () => {
                document.getElementById('roomDetailsModal').style.display = 'none';
            };
        }
    });
    
    // Confirm button (just closes for now)
    const confirmBtn = document.getElementById('confirmRoomDetailsBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            document.getElementById('roomDetailsModal').style.display = 'none';
        };
    }
    
    // Mark Linen Changed button
    const markLinenBtn = document.getElementById('markLinenBtn');
    if (markLinenBtn) {
        markLinenBtn.onclick = () => {
            const today = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            document.getElementById('detailLinenChange').textContent = today;
            showRoomToast('Linen change recorded!');
            // TODO: Save to backend
        };
    }
});