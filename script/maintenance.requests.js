// ===== RENDER REQUESTS TABLE =====
function renderRequestsTable() {
  const tbody = document.getElementById('requestsTableBody');
  const recordCountEl = document.getElementById('requestsRecordCount');
  const paginationControlsContainerId = 'requestsPaginationControls';
  const state = paginationState.requests;

  if (!tbody || !recordCountEl) return;

  const totalPages = getTotalPages(filteredRequests.length, state.itemsPerPage);
  if (state.currentPage > totalPages) {
    state.currentPage = Math.max(1, totalPages);
  }
  const paginatedData = paginateData(filteredRequests, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No rooms found.</td></tr>'; // Colspan is 8
  } else {
    tbody.innerHTML = paginatedData.map(req => {
        const statusClass = req.status.toLowerCase().replace(/ /g, '-');
        const statusDisplay = req.status;

        let assignButton;
        const status = req.status;

        // Use 'Not Assigned' check from my previous (working) logic
        if (req.staff !== 'Not Assigned') {
            assignButton = `<button class="assignBtn assigned" disabled>${req.staff}</button>`;
        } else if (['Needs Maintenance', 'Pending'].includes(status)) {
            // *** MODIFICATION: Added data-room-number to the button for easier access ***
            assignButton = `<button class="assignBtn assign-staff-btn" data-room-id="${req.id}" data-room-number="${req.room}">Assign Staff</button>`;
        } else {
            assignButton = `<button class="assignBtn" data-room-id="${req.id}" disabled>Not Required</button>`;
        }

        return `
          <tr data-room-id="${req.id}" data-room-number="${req.room}" data-status="${req.status}">
            <td>${req.floor ?? 'N/A'}</td>
            <td>${req.room ?? 'N/A'}</td>
            <td>${req.date ?? 'N/A'}</td>
            <td>${req.requestTime ?? 'N/A'}</td>
            <td>${req.lastMaintenance ?? 'N/A'}</td>
            <td><span class="statusBadge ${statusClass}">${statusDisplay}</span></td>
            <td>${assignButton}</td>
            <td>
                <button class="actionIconBtn edit-room-status-btn" title="Edit Room Status">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
          </tr>
        `;
    }).join('');

    // Use event delegation for the buttons
    tbody.removeEventListener('click', handleRequestsTableClick); // Prevent duplicate listeners
    tbody.addEventListener('click', handleRequestsTableClick);
  }

  recordCountEl.textContent = filteredRequests.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRequestsTable();
  });
}

// --- MODIFIED: Event handler for ALL clicks on Requests table body ---
function handleRequestsTableClick(e) {
    const assignBtn = e.target.closest('.assign-staff-btn');
    if (assignBtn && !assignBtn.disabled) {
        // *** MODIFICATION: Get row, roomId, and roomNumber to pass to modal ***
        const row = assignBtn.closest('tr');
        currentRoomId = row.dataset.roomId; // Set global ID
        const roomNumber = row.dataset.roomNumber; // Get room number
        
        document.getElementById('issueTypeForm').reset();
        selectedIssueTypes = '';
        
        // *** MODIFICATION: Call modal with correct arguments ***
        showIssueTypeModal(currentRoomId, roomNumber);
        return;
    }

    const editBtn = e.target.closest('.edit-room-status-btn');
    if (editBtn) {
        const row = editBtn.closest('tr');
        currentRoomId = row.dataset.roomId;
        const roomNumber = row.dataset.roomNumber;
        const status = row.dataset.status;
        
        document.getElementById('editRoomStatusRoomNumber').textContent = roomNumber;
        document.getElementById('editRoomStatusRoomId').value = currentRoomId;
        document.getElementById('editRoomStatusSelect').value = status;
        
        showEditRoomStatusModal();
        return;
    }
}

// ===== HANDLE STAFF ASSIGNMENT (NEW WORKFLOW) =====

// --- Step 1 - Handle Issue Type Submission (This was already correct) ---
function handleIssueTypeSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('issueTypeForm');
    const checkedBoxes = form.querySelectorAll('input[name="issueType[]"]:checked'); // Match 'name' from HTML
    
    if (checkedBoxes.length === 0) {
        alert("Please select at least one issue type.");
        return;
    }

    // Get types and store them
    selectedIssueTypes = Array.from(checkedBoxes).map(cb => cb.value).join(', ');
    
    hideIssueTypeModal();
    // We assume showStaffModal() exists (e.g., in maintenance.ui.js) and uses currentRoomId
    showStaffModal(currentRoomId); 
}

// --- MODIFIED: Step 2 - Handle Final Staff Assignment ---
async function handleStaffAssign() {
    if (!selectedStaffId || !currentRoomId) {
        alert("Error: Staff or Room ID is missing.");
        return;
    }
    if (!selectedIssueTypes) {
        // This check is a fallback, should be caught by the new workflow
        alert("Error: Maintenance issue type was not selected. Please restart the assignment.");
        return;
    }

    const assignBtn = document.getElementById('confirmStaffAssignBtn');
    assignBtn.disabled = true;
    assignBtn.textContent = 'ASSIGNING...';

    try {
        // *** MODIFICATION: Payload matches api_maintenance.php ***
        const payload = {
            action: 'assign_task', // Matches 'assign_task' case
            roomId: currentRoomId,
            staffId: selectedStaffId,
            issueTypes: selectedIssueTypes // Matches 'issueTypes' key (plural)
        };
        
        // We assume handleApiCall is a wrapper that fetches from api_maintenance.php
        const result = await handleApiCall(payload.action, payload);

        // *** MODIFICATION: Check for 'status' (string) from api_maintenance.php ***
        if (result.status === 'success') { 
            const roomInRequests = currentRequestsData.find(room => room.id == currentRoomId);
            if (roomInRequests) {
                roomInRequests.status = 'Pending';
                roomInRequests.staff = result.staffName; // Get staff name from response
            }
            applyRequestFiltersAndRender();
            
            const staffInList = currentStaffData.find(staff => staff.id == selectedStaffId);
            if (staffInList) {
                staffInList.availability = 'Assigned';
            }
            
            hideStaffModal();
            showSuccessModal(result.message || 'Task Assigned Successfully!');
        } else {
            alert("Failed to assign task: " + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error assigning staff:', error);
        alert("An error occurred. Please try again.");
    } finally {
        assignBtn.disabled = false;
        assignBtn.textContent = 'ASSIGN STAFF';
        // Clear temp state variables
        selectedIssueTypes = '';
        currentRoomId = null;
    }
}

// --- Handle Edit Room Status Submission (Unchanged, talks to a different API) ---
async function handleEditRoomStatusSubmit(e) {
    e.preventDefault();
    const roomId = document.getElementById('editRoomStatusRoomId').value;
    const newStatus = document.getElementById('editRoomStatusSelect').value;
    const roomNumber = document.getElementById('editRoomStatusRoomNumber').textContent;
    const submitBtn = document.getElementById('submitEditRoomStatusBtn');

    if (!roomId || !newStatus || !roomNumber) {
        alert("Error: Missing room data.");
        return;
    }
    submitBtn.disabled = true;

    try {
        const payload = {
            action: 'update_status',
            room_number: roomNumber,
            new_status: newStatus
        };

        // This API call goes to 'room_actions.php'
        const response = await fetch('room_actions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (HTTP ${response.status}): ${errorText}`);
        }

        const result = await response.json();

        if (result.success) { // This API (room_actions.php) might correctly return 'success'
            hideEditRoomStatusModal();
            showSuccessModal(result.message || 'Room status updated!');
            
            // Update local data
            const roomInRequests = currentRequestsData.find(room => room.id == roomId);
            if (roomInRequests) {
                roomInRequests.status = newStatus;
                // If status is set to Available, reset the request fields
                if (newStatus === 'Available') {
                    roomInRequests.staff = 'Not Assigned';
                    roomInRequests.date = 'N/A';
                    roomInRequests.requestTime = 'N/A';
                }
            }
            applyRequestFiltersAndRender(); // Re-render table
        } else {
            alert('Failed to update status: ' + result.message);
        }

    } catch (error) {
        console.error('Error updating room status:', error);
        alert('An error occurred: ' + error.message);
    } finally {
        submitBtn.disabled = false;
    }
}


// ===== REQUESTS FILTERING LOGIC =====
function applyRequestFiltersAndRender() {
  const floor = document.getElementById('floorFilter')?.value || '';
  const room = document.getElementById('roomFilter')?.value || '';
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

  filteredRequests = currentRequestsData.filter(req => {
    const matchFloor = !floor || (req.floor && req.floor.toString() === floor);
    const matchRoom = !room || (req.room && req.room.toString() === room);
    const matchSearch = !search || (req.room && req.room.toString().includes(search));
    return matchFloor && matchRoom && matchSearch;
  });

  paginationState.requests.currentPage = 1;
  renderRequestsTable();
  updateRoomFilterOptions(); // Keep this from user's code
}

function resetRequestFilters() {
    document.getElementById('floorFilter').value = '';
    document.getElementById('roomFilter').value = '';
    document.getElementById('searchInput').value = '';
    applyRequestFiltersAndRender();
}

// ===== REQUESTS CSV DOWNLOAD =====
function downloadRequestsCSV() {
    if (filteredRequests.length === 0) {
        alert("No request data to export based on current filters.");
        return;
    }
    const headers = ['Floor', 'Room', 'Date', 'Request Time', 'Last Maintenance', 'Status', 'Staff In Charge'];
    const csvContent = [
        headers.join(','),
        ...filteredRequests.map(req =>
            [
                req.floor ?? 'N/A',
                req.room ?? 'N/A',
                req.date ?? 'N/A',
                req.requestTime ?? 'N/A',
                req.lastMaintenance ?? 'N/A',
                req.status ?? 'N/A',
                req.staff ?? 'N/A'
             ].join(',')
        )
    ].join('\n');
    downloadCSV(csvContent, 'maintenance-requests');
}

// --- We assume handleApiCall is defined elsewhere (e.g., maintenance.utils.js) ---
// async function handleApiCall(action, payload) {
//    // Example implementation:
//    try {
//        const response = await fetch('api_maintenance.php', {
//            method: 'POST',
//            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
//            body: JSON.stringify(payload)
//        });
//        if (!response.ok) {
//            throw new Error('Network response was not ok');
//        }
//        return await response.json();
//    } catch (error) {
//        console.error('API Call Error:', error);
//        return { status: 'error', message: error.message }; // Match error structure
//    }
// }