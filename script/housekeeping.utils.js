// ===== API UTILITY =====
async function handleApiCall(action, data) {
    const payload = { ...data, action: action };
    
    const response = await fetch('api_housekeeping.php', { // MODIFIED
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network error (HTTP ${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    if (!result) {
        throw new Error("Received an empty response from the server.");
    }
    
    return result;
}

// ===== DATE FORMATTING UTILITIES =====
function convertDisplayDateToISO(dateString) {
  if (!dateString || dateString === 'N/A') return '';
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (dateString.includes('-')) { // Check if already ISO
    return dateString;
  }
  return '';
}

// ===== DYNAMIC FILTER DROPDOWN UTILITIES =====

// --- For Requests Tab ---
function updateRoomFilterOptions() {
    const floorFilter = document.getElementById('floorFilter');
    const roomFilter = document.getElementById('roomFilter');
    if (!roomFilter || !floorFilter) return;

    const selectedFloor = floorFilter.value;
    const currentRoomValue = roomFilter.value;

    roomFilter.innerHTML = '<option value="">Room</option>';

    // Use allRooms data, which contains {id, floor, room}
    const roomsToShow = selectedFloor
        ? allRooms.filter(r => r.floor.toString() === selectedFloor)
        : allRooms;

    const roomNumbers = [...new Set(roomsToShow.map(r => r.room))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    roomNumbers.forEach(roomNum => {
        const option = document.createElement('option');
        option.value = roomNum; // Value is the room number
        option.textContent = roomNum;
        roomFilter.appendChild(option);
    });

    // Re-select previous value if it still exists
    if (roomNumbers.map(String).includes(String(currentRoomValue))) {
        roomFilter.value = currentRoomValue;
    }
}

function populateFloorFilterOptions() {
    const floorFilter = document.getElementById('floorFilter');
    if (!floorFilter) return;

    const floors = [...new Set(allRooms.map(r => r.floor))].sort((a, b) => a - b);
    
    floors.forEach(floor => {
        const option = document.createElement('option');
        option.value = floor;
        option.textContent = floor;
        floorFilter.appendChild(option);
    });
}

// --- For History Tab ---
function updateHistoryRoomFilterOptions() {
    const floorFilter = document.getElementById('floorFilterHistory');
    const roomFilter = document.getElementById('roomFilterHistory');
    if (!roomFilter || !floorFilter) return;

    const selectedFloor = floorFilter.value;
    const currentRoomValue = roomFilter.value;

    roomFilter.innerHTML = '<option value="">Room</option>';

    const roomsToShow = selectedFloor
        ? allRooms.filter(r => r.floor.toString() === selectedFloor)
        : allRooms;

    const roomNumbers = [...new Set(roomsToShow.map(r => r.room))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    roomNumbers.forEach(roomNum => {
        const option = document.createElement('option');
        option.value = roomNum; // Value is the room number
        option.textContent = roomNum;
        roomFilter.appendChild(option);
    });
    
    if (roomNumbers.map(String).includes(String(currentRoomValue))) {
        roomFilter.value = currentRoomValue;
    }
}

function populateHistoryFloorFilterOptions() {
    const floorFilter = document.getElementById('floorFilterHistory');
    if (!floorFilter) return;

    const floors = [...new Set(allRooms.map(r => r.floor))].sort((a, b) => a - b);
    
    floors.forEach(floor => {
        const option = document.createElement('option');
        option.value = floor;
        option.textContent = floor;
        floorFilter.appendChild(option);
    });
}