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

        if (req.staff !== 'Not Assigned') {
            assignButton = `<button class="assignBtn assigned" disabled>${req.staff}</button>`;
        } else if (['Needs Maintenance'].includes(status)) { 
            assignButton = `<button class="assignBtn assign-staff-btn" data-room-id="${req.id}" data-room-number="${req.room}">Assign Staff</button>`;
        } else {
            assignButton = `<button class="assignBtn" data-room-id="${req.id}" disabled>Not Required</button>`;
        }
        
        let cancelButton = ''; 
        if (req.status === 'Pending') {
            cancelButton = `<button class="actionIconBtn cancel-request-btn" title="Cancel Request" data-request-id="${req.requestId}">
                                <i class="fas fa-times"></i>
                            </button>`;
        }

        return `
          <tr data-room-id="${req.id}" data-request-id="${req.requestId}" data-room-number="${req.room}" data-status="${req.status}">
            <td>${req.floor ?? 'N/A'}</td>
            <td>${req.room ?? 'N/A'}</td>
            <td>${req.date ?? 'N/A'}</td>
            <td>${req.requestTime ?? 'N/A'}</td>
            <td>${req.lastMaintenance ?? 'N/A'}</td>
            <td><span class="statusBadge ${statusClass}">${statusDisplay}</span></td>
            <td>${assignButton}</td>
            <td class="action-cell">
                <button class="actionIconBtn edit-room-status-btn" title="Edit Room Status">
                    <i class="fas fa-edit"></i>
                </button>
                ${cancelButton} 
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

// --- Event handler for ALL clicks on Requests table body ---
function handleRequestsTableClick(e) {
    // Assign Staff Button
    const assignBtn = e.target.closest('.assign-staff-btn');
    if (assignBtn && !assignBtn.disabled) {
        const row = assignBtn.closest('tr');
        currentRoomId = row.dataset.roomId; // Set global ID
        const roomNumber = row.dataset.roomNumber; // Get room number
        
        document.getElementById('issueTypeForm').reset();
        selectedIssueTypes = '';
        
        showIssueTypeModal(currentRoomId, roomNumber);
        return;
    }

    // Edit Room Status Button
    const editBtn = e.target.closest('.edit-room-status-btn');
    
    if (editBtn) {
        const row = editBtn.closest('tr');
        const currentStatus = row.dataset.status;
        const roomNumber = row.dataset.roomNumber;
        const roomId = row.dataset.roomId;
        
        // Only block editing if status is Pending or In Progress
        if (currentStatus === 'Pending' || currentStatus === 'In Progress') {
            // Show alert and don't open modal
            alert(`Cannot edit status for Room ${roomNumber} while a maintenance task is ${currentStatus}.`);
            return;
        }
        
        // Normal edit - open modal (including for "Needs Maintenance")
        currentRoomId = roomId;
        document.getElementById('editRoomStatusRoomNumber').textContent = roomNumber;
        document.getElementById('editRoomStatusRoomId').value = roomId;
        document.getElementById('editRoomStatusSelect').value = currentStatus;
        
        showEditRoomStatusModal();
        return;
    }
    // --- MODIFICATION END ---
    
    
    // Cancel Request Button logic
    const cancelBtn = e.target.closest('.cancel-request-btn');
    if (cancelBtn) {
        const requestId = cancelBtn.dataset.requestId;
        showConfirmModal(
            'Cancel Maintenance Request?',
            'Are you sure you want to cancel this request? This action cannot be undone.',
            () => {
                handleCancelRequest(requestId);
            }
        );
        return;
    }
}

// --- Handle Final Staff Assignment ---
async function handleStaffAssign() {
    if (!selectedStaffId || !currentRoomId) {
        alert("Error: Staff or Room ID is missing.");
        return;
    }
    if (!selectedIssueTypes) {
        alert("Error: Maintenance issue type was not selected. Please restart the assignment.");
        return;
    }

    const assignBtn = document.getElementById('confirmStaffAssignBtn');
    assignBtn.disabled = true;
    assignBtn.textContent = 'ASSIGNING...';

    try {
        const payload = {
            action: 'assign_task', // Matches 'assign_task' case
            roomId: currentRoomId,
            staffId: selectedStaffId,
            issueTypes: selectedIssueTypes // Matches 'issueTypes' key (plural)
        };
        
        const result = await handleApiCall(payload.action, payload);

        if (result.status === 'success') { 
            const roomInRequests = currentRequestsData.find(room => room.id == currentRoomId);
            if (roomInRequests) {
                roomInRequests.status = 'Pending'; // Set status to pending
                roomInRequests.staff = result.staffName; // Get staff name from response
            }
            
            const staffInList = currentStaffData.find(staff => staff.id == selectedStaffId);
            if (staffInList) {
                staffInList.availability = 'Assigned';
            }
            
            hideStaffModal();
            showSuccessModal(result.message || 'Task Assigned Successfully!');
            
            setTimeout(() => {
                 window.location.reload();
            }, 1500); 
            
        } else {
            alert("Failed to assign task: " + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error assigning staff:', error);
        alert("An error occurred. Please try again.");
    } finally {
        assignBtn.disabled = false;
        assignBtn.textContent = 'ASSIGN STAFF';
        selectedIssueTypes = '';
        currentRoomId = null;
    }
}

// --- Handle Edit Room Status Submission ---
async function handleEditRoomStatusSubmit(e) {
    e.preventDefault();
    const roomId = document.getElementById('editRoomStatusRoomId').value;
    const newStatus = document.getElementById('editRoomStatusSelect').value;
    
    // --- MODIFICATION: Safer way to get room number ---
    const roomNumberEl = document.getElementById('editRoomStatusRoomNumber');
    const roomNumber = roomNumberEl ? roomNumberEl.textContent : '';
    // --- END MODIFICATION ---

    const submitBtn = document.getElementById('submitEditRoomStatusBtn');
    
    // --- MODIFICATION: Get error message element ---
    const errorP = document.getElementById('editRoomStatusErrorMessage');
    if (errorP) {
        errorP.textContent = ''; // Clear previous error
    }
    // --- END MODIFICATION ---

    if (!roomId || !newStatus || !roomNumber) {
        // --- MODIFICATION: Show error in modal, NOT alert ---
        if(errorP) {
            errorP.textContent = "Error: Missing room data.";
        }
        // --- END MODIFICATION ---
        return;
    }
    submitBtn.disabled = true;

    try {
        const payload = {
            action: 'update_status',
            room_number: roomNumber,
            new_status: newStatus
        };

        const response = await fetch('room_actions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // This error is for network issues
            const errorText = await response.text();
            throw new Error(`Server error (HTTP ${response.status}): ${errorText}`);
        }

        const result = await response.json();

        if (result.success) { 
            hideEditRoomStatusModal();
            showSuccessModal(result.message || 'Room status updated!');
            
            // Update local data
            const roomInRequests = currentRequestsData.find(room => room.id == roomId);
            if (roomInRequests) {
                roomInRequests.status = newStatus;
                if (newStatus === 'Available') {
                    roomInRequests.staff = 'Not Assigned';
                    roomInRequests.date = 'N/A';
                    roomInRequests.requestTime = 'N/A';
                }
            }
            applyRequestFiltersAndRender(); // Re-render table
        } else {
            // --- MODIFICATION: Show API error (like the one in your screenshot) in modal ---
            if (errorP) {
                errorP.innerHTML = result.message; // Use innerHTML for <strong> tags
            }
            // --- END MODIFICATION ---
        }

    } catch (error) {
        console.error('Error updating room status:', error);
        // --- MODIFICATION: Show fetch/network error in modal ---
        if (errorP) {
            errorP.textContent = 'An error occurred: ' + error.message;
        }
        // --- END MODIFICATION ---
    } finally {
        submitBtn.disabled = false;
    }
}

// --- handleCancelRequest function ---
async function handleCancelRequest(requestId) {
    if (!requestId) {
        alert('Error: Request ID is missing.');
        return;
    }

    try {
        const payload = {
            action: 'cancel_task',
            requestId: requestId
        };

        const result = await handleApiCall(payload.action, payload);

        if (result.status === 'success') {
            hideConfirmModal();
            showSuccessModal(result.message || 'Request cancelled successfully!');
            
            setTimeout(() => {
                 window.location.reload();
            }, 1500); 

        } else {
            hideConfirmModal();
            alert('Failed to cancel request: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error cancelling request:', error);
        alert('An error occurred. Please try again.');
    }
}


// ===== REQUESTS FILTERING LOGIC =====

// --- Functions to save/load filters to session storage ---
function saveRequestFiltersToSession() {
  const floor = document.getElementById('floorFilter')?.value || '';
  const room = document.getElementById('roomFilter')?.value || '';
  const search = document.getElementById('searchInput')?.value || '';
  
  sessionStorage.setItem('requests_floorFilter', floor);
  sessionStorage.setItem('requests_roomFilter', room);
  sessionStorage.setItem('requests_searchInput', search);
}

function loadRequestFiltersFromSession() {
  const floor = sessionStorage.getItem('requests_floorFilter');
  const search = sessionStorage.getItem('requests_searchInput');

  if (floor) {
    document.getElementById('floorFilter').value = floor;
  }
  if (search) {
    document.getElementById('searchInput').value = search;
  }
}

// --- applyRequestFiltersAndRender ---
function applyRequestFiltersAndRender() {
  // 1. Get filter values *before* updating room options
  const floor = document.getElementById('floorFilter')?.value || '';
  
  const room = document.getElementById('roomFilter')?.value || ''; 
  
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

  // 2. Populate rooms.
  updateRoomFilterOptions(); 
  document.getElementById('roomFilter').value = room;

  // 3. Filter data
  filteredRequests = currentRequestsData.filter(req => {
    const matchFloor = !floor || (req.floor && req.floor.toString() === floor);
    const matchRoom = !room || (req.room && req.room.toString() === room); 
    const matchSearch = !search || (req.room && req.room.toString().includes(search));
    return matchFloor && matchRoom && matchSearch;
  });

  // 4. Render
  paginationState.requests.currentPage = 1;
  renderRequestsTable();
}

// --- resetRequestFilters ---
function resetRequestFilters() {
    document.getElementById('floorFilter').value = '';
    document.getElementById('roomFilter').value = '';
    document.getElementById('searchInput').value = '';

    sessionStorage.removeItem('requests_floorFilter');
    sessionStorage.removeItem('requests_roomFilter');
    sessionStorage.removeItem('requests_searchInput');

    updateRoomFilterOptions(); 
    applyRequestFiltersAndRender();
}

// ===== REQUESTS PDF DOWNLOAD =====
function downloadRequestsPDF() {
    if (filteredRequests.length === 0) {
        alert("No request data to export based on current filters.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const headers = [
        ['Floor', 'Room', 'Date', 'Request Time', 'Last Maintenance', 'Status', 'Staff In Charge']
    ];

    const bodyData = filteredRequests.map(req => [
        req.floor ?? 'N/A',
        req.room ?? 'N/A',
        req.date ?? 'N/A',
        req.requestTime ?? 'N/A',
        req.lastMaintenance ?? 'N/A',
        req.status ?? 'N/A',
        req.staff ?? 'N/A'
    ]);

    doc.setFontSize(18);
    doc.text("Maintenance Requests Report", 14, 22);

    doc.autoTable({
        startY: 30,
        head: headers,
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }, 
        styles: { fontSize: 8 },
        columnStyles: {
            4: { cellWidth: 30 }, 
            6: { cellWidth: 30 }
        }
    });

    doc.save('maintenance-requests.pdf');
}