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

      // === MODIFICATION: REMOVED DELETE BUTTON ===
      return `
        <tr>
          <td>${row.Floor}</td>
          <td>${row.Room}</td>
          <td>${row.Type}</td>
          <td>${row.NoGuests}</td>
          <td>$${parseFloat(row.Rate).toFixed(2)}</td>
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

// ===== ROOM MODAL HANDLERS =====
function handleEditClick(event) {
    hideFormMessage();
    const room = JSON.parse(event.currentTarget.dataset.roomData);
    
    roomModalTitle.textContent = 'Edit Room ' + room.Room;
    document.getElementById('saveRoomBtn').textContent = 'SAVE STATUS';
    
   roomFloorInput.innerHTML = `<option value="${room.Floor}">${room.Floor}</option>`;
    roomFloorInput.value = room.Floor;
    
    roomNumberInput.value = room.Room;
    roomTypeInput.innerHTML = `<option value="${room.Type}">${room.Type}</option>`;
    roomTypeInput.value = room.Type;
    roomGuestsInput.value = room.NoGuests;
    roomRateInput.value = parseFloat(room.Rate).toFixed(2);
    
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

// ===== DELETE ROOM HANDLERS =====
// These functions are no longer called but are safe to leave.
// You can remove them if you want to clean up the file.
let roomToDeleteID = null;

function handleDeleteClick(event) {
    roomToDeleteID = event.currentTarget.dataset.roomId;
    const roomNumber = event.currentTarget.dataset.roomNumber;
    document.getElementById('deleteRoomText').textContent = `Are you sure you want to delete Room ${roomNumber}? This action cannot be undone.`;
    deleteRoomModal.style.display = 'flex';
}

async function confirmRoomDelete() {
    if (!roomToDeleteID) return;

    const data = { roomID: roomToDeleteID };
    const result = await apiCall('delete_room', data, 'POST', 'room_actions.php');

    if (result.success) {
        deleteRoomModal.style.display = 'none';
        await fetchAndRenderRooms();
    } else {
        alert(result.message);
    }
}

// ===== ROOMS FILTERS =====
function initRoomFilters() {
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
}