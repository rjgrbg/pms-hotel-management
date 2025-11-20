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

  recordCountEl.textContent = filteredRequests.length;

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No rooms found.</td></tr>'; // Colspan is 8
  } else {
    tbody.innerHTML = paginatedData.map(req => {
        const statusClass = req.status.toLowerCase().replace(/ /g, '-');
        const statusDisplay = req.status;
        const status = req.status;

        // === ASSIGN BUTTON LOGIC ===
        let assignButton;
        if (req.staff !== 'Not Assigned') {
            assignButton = `<button class="assignBtn assigned" disabled>${req.staff}</button>`;
        } else if (['Needs Cleaning'].includes(status)) {
            assignButton = `<button class="assignBtn assign-staff-btn" data-room-id="${req.id}" data-room-number="${req.room}">ASSIGN</button>`;
        } else {
            assignButton = `<button class="assignBtn" disabled>ASSIGN</button>`;
        }

        // === ACTION BUTTON LOGIC (To match screenshot) ===
        
        // 1. Edit Button
        const canEdit = (status === 'Available' || status === 'Needs Cleaning');
        const editButton = `
          <button 
            class="actionBtn edit-status-btn" 
            data-room-id="${req.id}" 
            data-room-number="${req.room}" 
            data-current-status="${status}" 
            ${canEdit ? '' : 'disabled'}
          >
            <i class="fas fa-edit"></i>
          </button>`;

        // 2. Cancel Button
        const canCancel = (status === 'Pending');
        const cancelButton = `
          <button 
            class="actionBtn cancel-task-btn" 
            data-task-id="${req.taskId}" 
            ${canCancel ? '' : 'disabled'}
          >
            <i class="fas fa-times"></i>
          </button>`;

      // === TABLE ROW HTML ===
      return `
        <tr data-room-id="${req.id}">
          <td>${req.floor ?? 'N/A'}</td>
          <td>${req.room ?? 'N/A'}</td>
          <td>${req.date ?? 'N/A'}</td>
          <td>${req.requestTime ?? 'N/A'}</td>
          <td>${req.lastClean ?? 'N/A'}</td>
          <td><span class="statusBadge ${statusClass}">${statusDisplay}</span></td>
          <td>${assignButton}</td>
          <td>
            ${editButton}
            ${cancelButton}
          </td>
        </tr>
      `;
    }).join('');
  }

  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRequestsTable();
  });
}

// ===== ACTION HANDLERS (Requests) =====

function handleAssignStaffClick(button) {
  currentRoomId = parseInt(button.dataset.roomId);
  const roomNumber = button.dataset.roomNumber;
  
  // Reset staff modal
  selectedStaffId = null;
  document.getElementById('confirmStaffAssignBtn').disabled = true;
  document.getElementById('staffModalSearchInput').value = '';
  applyStaffFilterAndRender();
  
  // Reset and prep task type modal
  document.getElementById('taskTypeForm').reset();
  document.getElementById('taskTypeModalRoomNumber').textContent = roomNumber;
  document.getElementById('taskTypeRoomId').value = currentRoomId;
  
  showTaskTypeModal(); // MODIFIED
}

function handleEditStatusClick(button) {
  currentRoomId = parseInt(button.dataset.roomId);
  const roomNumber = button.dataset.roomNumber;
  const currentStatus = button.dataset.currentStatus;

  console.log(`Editing status for Room ${roomNumber} (ID: ${currentRoomId}), current: ${currentStatus}`);

  document.getElementById('editRoomStatusModalTitle').textContent = `Edit Room Status`;
  document.getElementById('editRoomStatusRoomNumber').textContent = roomNumber;
  document.getElementById('editRoomStatusRoomId').value = currentRoomId;
  document.getElementById('editRoomStatusSelect').value = currentStatus;
  
  showEditRoomStatusModal();
}

function handleCancelTaskClick(button) {
  const taskIdToCancel = parseInt(button.dataset.taskId); // MODIFIED
  if (!taskIdToCancel) return;

  console.log(`Attempting to cancel task: ${taskIdToCancel}`);
  
  showConfirmModal(
    'Cancel Task?',
    'Are you sure you want to cancel this pending task?',
    async () => {
      console.log(`Confirmed cancellation for task: ${taskIdToCancel}`);
      try {
        const result = await handleApiCall('cancel_task', { taskId: taskIdToCancel }); // MODIFIED
        if (result.status === 'success') {
          showSuccessModal(result.message || 'Task cancelled successfully.');
          // Refresh data
          const index = currentRequestsData.findIndex(r => r.taskId === taskIdToCancel);
          if (index > -1) {
            // Update local data to reflect cancellation
            currentRequestsData[index].status = 'Available'; // Or 'Needs Cleaning', depending on logic
            currentRequestsData[index].staff = 'Not Assigned';
            currentRequestsData[index].taskId = null;
            currentRequestsData[index].date = 'N/A';
            currentRequestsData[index].requestTime = 'N/A';
          }
          applyRequestFiltersAndRender();
        } else {
          showErrorModal(result.message || 'Failed to cancel task.');
        }
      } catch (error) {
        console.error('Error cancelling task:', error);
        showErrorModal('An error occurred while cancelling the task.');
      }
    }
  );
}

// ===== MODAL SUBMIT HANDLERS (Requests) =====

async function submitEditRoomStatus(e) {
  e.preventDefault();
  
  const roomNumberEl = document.getElementById('editRoomStatusRoomNumber');
  const roomNumber = roomNumberEl ? roomNumberEl.textContent : ''; 
  const newStatus = document.getElementById('editRoomStatusSelect').value;

  if (!roomNumber) {
      alert('Error: Could not find room number.');
      return;
  }

  console.log(`Submitting new status for Room Number ${roomNumber}: ${newStatus}`);
  
  try {
    const response = await fetch('room_actions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'update_status',
            room_number: roomNumber,
            new_status: newStatus
        }) 
    });
    
    const result = await response.json();

    if (result.success) {
      hideEditRoomStatusModal();
      showSuccessModal('Room status updated successfully.');
      
      const index = currentRequestsData.findIndex(r => r.room === roomNumber);
      if (index > -1) {
        currentRequestsData[index].status = newStatus;
        if (newStatus === 'Available') {
            currentRequestsData[index].staff = 'Not Assigned';
            currentRequestsData[index].taskId = null;
            currentRequestsData[index].date = 'N/A';
            currentRequestsData[index].requestTime = 'N/A';
        }
      }
      applyRequestFiltersAndRender();
      
    } else {
        document.getElementById('editRoomStatusErrorMessage').textContent = result.message || 'An error occurred.';
        showEditRoomStatusModal('error-view');
    }
  } catch (error) {
    console.error('Error updating room status:', error);
    document.getElementById('editRoomStatusErrorMessage').textContent = error.message;
    showEditRoomStatusModal('error-view');
  }
}

async function handleAssignStaff(e) {
  e.preventDefault();
  
  const formData = new FormData(document.getElementById('taskTypeForm'));
  selectedTaskTypes = formData.getAll('taskType[]').join(', ');

  if (!selectedTaskTypes) {
    alert('Please select at least one task type.');
    return;
  }
  
  console.log(`Task types selected for Room ID ${currentRoomId}: ${selectedTaskTypes}`);
  
  hideTaskTypeModal();
  showStaffModal();
}

async function handleConfirmStaffAssign() {
  if (!selectedStaffId || !currentRoomId || !selectedTaskTypes) {
    alert('Error: Missing staff, room, or task type information.');
    return;
  }
  
  console.log(`Assigning Staff ${selectedStaffId} to Room ${currentRoomId} for tasks: ${selectedTaskTypes}`);

  try {
    const data = {
      roomId: currentRoomId,
      staffId: selectedStaffId,
      taskTypes: selectedTaskTypes
    };
    
    const result = await handleApiCall('assign_task', data);

    if (result.status === 'success') {
      hideStaffModal();
      showSuccessModal(result.message || 'Task assigned successfully.');

      const index = currentRequestsData.findIndex(r => r.id === currentRoomId);
      if (index > -1) {
        currentRequestsData[index].status = 'Pending';
        currentRequestsData[index].staff = result.staffName || 'Assigned';
        // We need the new taskId from the API to make cancel work
        // Let's assume the API returns it
        if(result.newTaskId) {
            currentRequestsData[index].taskId = result.newTaskId;
        }
        // In a real app, we'd get date/time too
      }
      applyRequestFiltersAndRender();
      
      const staffIndex = currentStaffData.findIndex(s => s.id === selectedStaffId);
      if (staffIndex > -1) {
          currentStaffData[staffIndex].availability = 'Assigned';
      }

    } else {
      hideStaffModal();
      showErrorModal(result.message || 'Failed to assign task.');
    }
  } catch (error) {
    console.error('Error assigning task:', error);
    hideStaffModal();
    showErrorModal('An error occurred while assigning the task.');
  } finally {
    currentRoomId = null;
    selectedStaffId = null;
    selectedTaskTypes = '';
  }
}

// ===== FILTER & RENDER (REQUESTS) =====
function applyRequestFiltersAndRender() {
  const floor = document.getElementById('floorFilter').value;
  const room = document.getElementById('roomFilter').value;
  const search = document.getElementById('searchInput').value.toLowerCase();

  filteredRequests = currentRequestsData.filter(req => {
    const matchFloor = !floor || (req.floor && req.floor.toString() === floor);
    const matchRoom = !room || (req.room && req.room.toString() === room);
    const matchSearch = !search ||
      (req.room && req.room.toString().includes(search)) ||
      (req.staff && req.staff.toLowerCase().includes(search)) ||
      (req.status && req.status.toLowerCase().includes(search));
    return matchFloor && matchRoom && matchSearch;
  });

  // Sort: 'Needs Cleaning' and 'Pending' first, then by floor/room
  filteredRequests.sort((a, b) => {
    const statusA = a.status.toLowerCase();
    const statusB = b.status.toLowerCase();
    const priority = { 'needs cleaning': 1, 'pending': 2, 'in progress': 3 }; // MODIFIED

    const priorityA = priority[statusA] || 4;
    const priorityB = priority[statusB] || 4;

    if (priorityA !== priorityB) return priorityA - priorityB;
    if (a.floor !== b.floor) return (a.floor || 0) - (b.floor || 0);
    return (a.room || '').localeCompare(b.room || '', undefined, { numeric: true });
  });

  renderRequestsTable();
}

// ===== REFRESH & DOWNLOAD (REQUESTS) =====
function handleRefreshRequests() {
  console.log("Refreshing requests data...");
  document.getElementById('floorFilter').value = '';
  document.getElementById('roomFilter').value = '';
  document.getElementById('searchInput').value = '';

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
    ['Floor', 'Room', 'Date', 'Request Time', 'Last Clean', 'Status', 'Staff In Charge'] // MODIFIED
  ];

  const bodyData = filteredRequests.map(req => [
    req.floor ?? 'N/A',
    req.room ?? 'N/A',
    req.date ?? 'N/A',
    req.requestTime ?? 'N/A',
    req.lastClean ?? 'N/A', // MODIFIED
    req.status ?? 'N/A',
    req.staff ?? 'N/A'
  ]);

  doc.setFontSize(18);
  doc.text("Housekeeping Requests Report", 14, 22); // MODIFIED

  doc.autoTable({
    startY: 30,
    head: headers,
    body: bodyData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`housekeeping-requests-${new Date().toISOString().split('T')[0]}.pdf`); // MODIFIED
}