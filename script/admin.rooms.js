/**
 * ROOMS MODULE JAVASCRIPT
 * Features: Fetching, Dynamic Filters, Modal Logic, Toast, Landscape PDF
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

// --- LANDSCAPE PDF GENERATOR ---
function downloadRoomsPDF(headers, data, title, filename) {
    if (!window.jspdf) {
        alert("PDF Library not loaded. Please check your script tags.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

    // Header Title
    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27); // Custom Color #480c1b
    doc.text(title, 14, 20);
    
    // Date
    doc.setFontSize(11);
    doc.setTextColor(100); 
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    // Table Generation
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        styles: { 
            fontSize: 10, 
            cellPadding: 3, 
            overflow: 'linebreak', 
            textColor: 50 
        },
        headStyles: { 
            fillColor: '#480c1b', // Custom Header Background
            textColor: '#ffffff', // White Text
            fontStyle: 'bold', 
            halign: 'center' 
        },
        // Status column bold
        columnStyles: {
            5: { fontStyle: 'bold' }
        }
    });

    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
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
    if (!roomsFloorFilter || !roomsRoomFilter) return;

    // Save current selection to restore if possible
    const currentFloor = roomsFloorFilter.value;

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

      // Note: Edit Button logic assumed to be handled via event delegation or inline onclick if needed.
      // Added generic 'edit-btn' class for potential listeners.
      return `
        <tr data-room-data='${JSON.stringify(row)}' onclick="handleEditClick(event)" style="cursor: pointer;">
          <td>${row.Floor}</td>
          <td>${row.Room}</td>
          <td>${row.Type}</td>
          <td>${row.NoGuests}</td>
          <td><span class="statusBadge ${statusClass}">${statusDisplay}</span></td>
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
    roomRateInput.value = parseFloat(room.Rate).toFixed(2);
    
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
// 6. FILTERS & EVENTS (FIXED)
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
            const searchMatch = !search || row.Type.toLowerCase().includes(search) || row.Room.toString().includes(search) || row.Status.toLowerCase().includes(search);
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

            const headers = ['Floor', 'Room', 'Type', 'No. Guests', 'Rate', 'Status'];
            const body = filteredData.map(row => [
                row.Floor,
                row.Room,
                row.Type,
                row.NoGuests,
                `$${parseFloat(row.Rate).toFixed(2)}`,
                row.Status
            ]);

            downloadRoomsPDF(headers, body, 'Rooms Report', 'rooms_report');
        };
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('rooms-page')) {
        fetchAndRenderRooms();
    }
});