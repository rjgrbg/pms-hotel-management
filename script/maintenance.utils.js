// ===== API UTILITY =====
async function handleApiCall(action, data) {
    const payload = { ...data, action: action };
    
    const response = await fetch('api_maintenance.php', {
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
function updateRoomFilterOptions() {
     const floorFilter = document.getElementById('floorFilter');
     const roomFilter = document.getElementById('roomFilter');
     if (!roomFilter || !floorFilter) return;

     const selectedFloor = floorFilter.value;
     const currentRoomValue = roomFilter.value;

     roomFilter.innerHTML = '<option value="">Room</option>';

     const roomsToShow = selectedFloor
        ? allRooms.filter(r => r.floor && r.floor.toString() === selectedFloor)
        : allRooms;

     const roomNumbers = [...new Set(roomsToShow.map(r => r.room).filter(r => r))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

     roomNumbers.forEach(roomNum => {
         const option = document.createElement('option');
         option.value = roomNum;
         option.textContent = roomNum;
         roomFilter.appendChild(option);
     });

     if (roomNumbers.map(String).includes(String(currentRoomValue))) {
         roomFilter.value = currentRoomValue;
     } else if (roomFilter.options.length > 0) {
         roomFilter.value = "";
     }
}

function updateHistoryRoomFilterOptions() {
     const floorFilterHistory = document.getElementById('floorFilterHistory');
     const roomFilterHistory = document.getElementById('roomFilterHistory');
     if (!roomFilterHistory || !floorFilterHistory) return;

     const selectedFloor = floorFilterHistory.value;
     const currentRoomValue = roomFilterHistory.value;

     roomFilterHistory.innerHTML = '<option value="">Room</option>';

     const roomsToShow = selectedFloor
        ? currentHistoryData.filter(h => h.floor && h.floor.toString() === selectedFloor)
        : currentHistoryData;

     const roomNumbers = [...new Set(roomsToShow.map(h => h.room).filter(r => r))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

     roomNumbers.forEach(roomNum => {
         const option = document.createElement('option');
         option.value = roomNum;
         option.textContent = roomNum;
         roomFilterHistory.appendChild(option);
     });

      if (roomNumbers.map(String).includes(String(currentRoomValue))) {
         roomFilterHistory.value = currentRoomValue;
     } else if (roomFilterHistory.options.length > 0) {
         roomFilterHistory.value = "";
     }
}

function updateHotelAssetsRoomFilterOptions() { // Renamed
    const floorFilter = document.getElementById('floorFilterHotelAssets');
    const roomFilter = document.getElementById('roomFilterHotelAssets');
    if (!roomFilter || !floorFilter) return;

    const selectedFloor = floorFilter.value;
    const currentRoomValue = roomFilter.value;

    roomFilter.innerHTML = '<option value="">Room</option>';

    const roomsToShow = selectedFloor
        ? allRooms.filter(a => a.floor.toString() === selectedFloor)
        : allRooms;

    const roomNumbers = [...new Set(roomsToShow.map(a => a.room))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

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

// ===== GENERIC CSV DOWNLOAD =====
function downloadCSV(csvContent, filenamePrefix) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}