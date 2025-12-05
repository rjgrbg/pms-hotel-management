// ===== GLOBAL VARIABLES =====
let currentRequestsData = [];
let currentStaffData = [];
let currentHistoryData = [];
let allRooms = [];

let filteredRequests = [];
let filteredStaff = [];
let filteredHistory = []; 

let selectedStaffId = null;
let currentRoomId = null; 
let confirmCallback = null; 
let selectedTaskTypes = ''; 

// Pagination State
const paginationState = {
  requests: { currentPage: 1, itemsPerPage: 10 },
  history: { currentPage: 1, itemsPerPage: 10 }
};

// ===== TOAST NOTIFICATION SYSTEM (UPDATED FONT) =====
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '99999';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.textContent = message;
    
    // Colors based on type
    const bgColor = type === 'success' ? '#28a745' : (type === 'error' ? '#dc3545' : '#17a2b8');
    
    toast.style.backgroundColor = bgColor;
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.marginBottom = '10px';
    
    toast.style.borderRadius = '5px'; 
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)'; 
    toast.style.fontFamily = "'Segoe UI', sans-serif"; 
    toast.style.fontSize = '14px'; 

    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Loaded - Initializing Housekeeping...');
  
  // Use the new variable names passed from PHP
  currentRequestsData = typeof initialRequestsData !== 'undefined' ? [...initialRequestsData] : [];
  currentStaffData = typeof availableStaffData !== 'undefined' ? [...availableStaffData] : [];
  currentHistoryData = typeof initialHistoryData !== 'undefined' ? [...initialHistoryData] : [];
  allRooms = typeof allRoomsData !== 'undefined' ? [...allRoomsData] : [];

  // Populate filter dropdowns
  if (typeof populateFloorFilterOptions === 'function') populateFloorFilterOptions();
  if (typeof populateHistoryFloorFilterOptions === 'function') populateHistoryFloorFilterOptions();
  if (typeof updateRoomFilterOptions === 'function') updateRoomFilterOptions();
  if (typeof updateHistoryRoomFilterOptions === 'function') updateHistoryRoomFilterOptions();

  // Initial render
  if (typeof applyRequestFiltersAndRender === 'function') applyRequestFiltersAndRender();
  if (typeof applyHistoryFiltersAndRender === 'function') applyHistoryFiltersAndRender();
  
  // ----- TAB NAVIGATION -----
  document.querySelectorAll('.tabBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tabBtn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tabContent').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
      sessionStorage.setItem('housekeeping_activeTab', tabId);
    });
  });

  // Restore active tab
  const activeTab = sessionStorage.getItem('housekeeping_activeTab') || 'requests';
  const activeBtn = document.querySelector(`.tabBtn[data-tab="${activeTab}"]`);
  if(activeBtn) activeBtn.click();

  // Setup Listeners
  setupCommonUIListeners();
  setupRequestsTabListeners();
  setupHistoryTabListeners();
  
  // ----- MODAL LISTENERS -----
  setupModalListeners();
  
  console.log('Housekeeping Initialization Complete.');
});

function setupModalListeners() {
    // Staff Modal
    document.getElementById('staffModalSearchInput')?.addEventListener('input', applyStaffFilterAndRender);
    document.getElementById('closeStaffModalBtn')?.addEventListener('click', hideStaffModal);
    document.getElementById('cancelStaffBtn')?.addEventListener('click', hideStaffModal);
    document.getElementById('confirmStaffAssignBtn')?.addEventListener('click', handleConfirmStaffAssign);

    // Task Type Modal
    document.getElementById('taskTypeForm')?.addEventListener('submit', handleAssignStaff);
    document.getElementById('confirmTaskTypeBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('taskTypeForm').dispatchEvent(new Event('submit'));
    });
    document.getElementById('cancelTaskTypeBtn')?.addEventListener('click', hideTaskTypeModal);
    document.getElementById('closeTaskTypeModalBtn')?.addEventListener('click', hideTaskTypeModal);
    document.getElementById('task_select_all')?.addEventListener('change', (e) => {
        document.querySelectorAll('#taskTypeCheckboxContainer input[type="checkbox"]').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Edit Room Status Modal
    document.getElementById('editRoomStatusForm')?.addEventListener('submit', submitEditRoomStatus);
    document.getElementById('closeEditRoomStatusBtn')?.addEventListener('click', hideEditRoomStatusModal);
    document.getElementById('cancelEditRoomStatusBtn')?.addEventListener('click', hideEditRoomStatusModal);

    // Confirmation Modal
    document.getElementById('cancelConfirmBtn')?.addEventListener('click', hideConfirmModal);
    document.getElementById('confirmActionBtn')?.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
        confirmCallback();
        }
        hideConfirmModal();
    });
    
    // Success Modal
    document.getElementById('closeSuccessBtn')?.addEventListener('click', hideSuccessModal);
    document.getElementById('okaySuccessBtn')?.addEventListener('click', hideSuccessModal);
}

// ===== SHARED UI LISTENERS =====
function setupCommonUIListeners() {
  const profileBtn = document.getElementById('profileBtn');
  const sidebar = document.getElementById('profile-sidebar');
  const closeSidebarBtn = document.getElementById('sidebar-close-btn');
  const logoutBtn = document.getElementById('logoutBtn');
  const closeLogoutBtn = document.getElementById('closeLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

  profileBtn?.addEventListener('click', () => sidebar.classList.toggle('active'));
  closeSidebarBtn?.addEventListener('click', () => sidebar.classList.remove('active'));
  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('logoutModal').style.display = 'flex';
  });
  
  const logoutModal = document.getElementById('logoutModal');
  if(logoutModal) {
      closeLogoutBtn?.addEventListener('click', () => logoutModal.style.display = 'none');
      cancelLogoutBtn?.addEventListener('click', () => logoutModal.style.display = 'none');
      confirmLogoutBtn?.addEventListener('click', () => window.location.href = 'logout.php');
  }
}

// ===== REQUESTS TAB LISTENERS =====
function setupRequestsTabListeners() {
  document.getElementById('floorFilter')?.addEventListener('change', () => {
    updateRoomFilterOptions();
    applyRequestFiltersAndRender();
  });
  document.getElementById('roomFilter')?.addEventListener('change', applyRequestFiltersAndRender);
  document.getElementById('searchInput')?.addEventListener('input', applyRequestFiltersAndRender);
  document.getElementById('refreshBtn')?.addEventListener('click', handleRefreshRequests);
  document.getElementById('downloadBtnRequests')?.addEventListener('click', downloadRequestsPDF);

  document.getElementById('requestsTableBody')?.addEventListener('click', (e) => {
    if (e.target.closest('.assign-staff-btn')) {
      handleAssignStaffClick(e.target.closest('.assign-staff-btn'));
    }
    if (e.target.closest('.edit-status-btn')) {
      handleEditStatusClick(e.target.closest('.edit-status-btn'));
    }
    if (e.target.closest('.cancel-task-btn')) {
      handleCancelTaskClick(e.target.closest('.cancel-task-btn'));
    }
  });
}

// ===== HISTORY TAB LISTENERS (FIXED) =====
function setupHistoryTabListeners() {
  document.getElementById('floorFilterHistory')?.addEventListener('change', () => {
    updateHistoryRoomFilterOptions();
    applyHistoryFiltersAndRender();
  });
  document.getElementById('roomFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
  
  // --- START FIX: Listen to BOTH new date inputs ---
  document.getElementById('startDateFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
  document.getElementById('endDateFilterHistory')?.addEventListener('change', applyHistoryFiltersAndRender);
  // ------------------------------------------------
  
  document.getElementById('historySearchInput')?.addEventListener('input', applyHistoryFiltersAndRender);
  document.getElementById('historyRefreshBtn')?.addEventListener('click', handleRefreshHistory);
  document.getElementById('historyDownloadBtn')?.addEventListener('click', downloadHistoryPDF);
}

// ===================================
// ===== REQUESTS TAB FUNCTIONS ======
// ===================================

function renderRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    const recordCountEl = document.getElementById('requestsRecordCount');
    const state = paginationState.requests;

    if (!tbody || !recordCountEl) return;

    const totalPages = getTotalPages(filteredRequests.length, state.itemsPerPage);
    if (state.currentPage > totalPages) {
        state.currentPage = Math.max(1, totalPages);
    }
    const paginatedData = paginateData(filteredRequests, state.currentPage, state.itemsPerPage);

    recordCountEl.textContent = filteredRequests.length;

    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No rooms found.</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(req => {
            const statusClass = req.status.toLowerCase().replace(/\s+/g, '-');
            const status = req.status;
            const safeFloor = escapeHtml(req.floor ?? 'N/A');
            const safeRoom = escapeHtml(req.room ?? 'N/A');
            const safeDate = escapeHtml(req.date ?? 'N/A');
            const safeTime = escapeHtml(req.requestTime ?? 'N/A');
            const safeLastClean = escapeHtml(req.lastClean ?? 'N/A');
            const safeStatusDisplay = escapeHtml(status);
            const safeStaff = escapeHtml(req.staff);

            // Assign Button Logic
            let assignButton;
            if (req.staff !== 'Not Assigned') {
                assignButton = `<button class="assignBtn assigned" disabled>${safeStaff}</button>`;
            } else if (['Needs Cleaning'].includes(status)) {
                assignButton = `<button class="assignBtn assign-staff-btn" data-room-id="${escapeHtml(req.id)}" data-room-number="${safeRoom}">Assign Staff</button>`;
            } else {
                assignButton = `<button class="assignBtn" disabled>Not Required</button>`;
            }

            const editButton = `<button class="actionIconBtn editBtn edit-status-btn" title="Edit Status" 
                                data-room-id="${escapeHtml(req.id)}" 
                                data-room-number="${safeRoom}" 
                                data-current-status="${escapeHtml(status)}">
                                <i class="fas fa-edit"></i>
                                </button>`;

            let cancelButton = '';
            if (status === 'Pending') {
                cancelButton = `<button class="actionIconBtn deleteBtn cancel-task-btn" title="Cancel Task" 
                                data-task-id="${escapeHtml(req.taskId)}">
                                <i class="fas fa-times"></i>
                                </button>`;
            }

            return `
                <tr data-room-id="${escapeHtml(req.id)}">
                    <td>${safeFloor}</td>
                    <td>${safeRoom}</td>
                    <td>${safeDate}</td>
                    <td>${safeTime}</td>
                    <td>${safeLastClean}</td>
                    <td><span class="statusBadge ${statusClass}">${safeStatusDisplay}</span></td>
                    <td>${assignButton}</td>
                    <td class="action-cell" style="white-space: nowrap;">
                        ${editButton}
                        ${cancelButton}
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPaginationControls('requestsPaginationControls', totalPages, state.currentPage, (page) => {
        state.currentPage = page;
        renderRequestsTable();
    });
}

// ===== ACTION HANDLERS =====

function handleAssignStaffClick(button) {
  currentRoomId = parseInt(button.dataset.roomId);
  const roomNumber = button.dataset.roomNumber;
  
  selectedStaffId = null;
  document.getElementById('confirmStaffAssignBtn').disabled = true;
  document.getElementById('staffModalSearchInput').value = '';
  applyStaffFilterAndRender();
  
  document.getElementById('taskTypeForm').reset();
  document.getElementById('taskTypeModalRoomNumber').textContent = roomNumber;
  document.getElementById('taskTypeRoomId').value = currentRoomId;
  
  showTaskTypeModal();
}

function handleEditStatusClick(button) {
  currentRoomId = parseInt(button.dataset.roomId);
  const roomNumber = button.dataset.roomNumber;
  const currentStatus = button.dataset.currentStatus;

  if (currentStatus === 'Pending' || currentStatus === 'In Progress') {
      showToast(`Cannot edit status for Room ${roomNumber} while a task is ${currentStatus}. Please cancel the task first.`, 'error');
      return;
  }

  if (currentStatus === 'Needs Maintenance') {
      showToast(`Cannot edit status. Room ${roomNumber} is currently marked for Maintenance.`, 'error');
      return;
  }

  document.getElementById('editRoomStatusModalTitle').textContent = `Edit Room Status`;
  document.getElementById('editRoomStatusRoomNumber').textContent = roomNumber;
  document.getElementById('editRoomStatusRoomId').value = currentRoomId;
  document.getElementById('editRoomStatusSelect').value = currentStatus;
  
  showEditRoomStatusModal();
}

function handleCancelTaskClick(button) {
  const taskIdToCancel = parseInt(button.dataset.taskId);
  if (!taskIdToCancel) return;

  showConfirmModal(
    'Cancel Task?',
    'Are you sure you want to cancel this pending task?',
    async () => {
      try {
        const result = await handleApiCall('cancel_task', { taskId: taskIdToCancel });
        if (result.status === 'success') {
          showSuccessModal(result.message || 'Task cancelled successfully.');
          
          setTimeout(() => {
             window.location.reload();
          }, 1500);

          const index = currentRequestsData.findIndex(r => r.taskId === taskIdToCancel);
          if (index > -1) {
            currentRequestsData[index].status = 'Needs Cleaning'; // Reset status
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

async function submitEditRoomStatus(e) {
  e.preventDefault();
  
  const roomNumberEl = document.getElementById('editRoomStatusRoomNumber');
  const roomNumber = roomNumberEl ? roomNumberEl.textContent : ''; 
  const newStatus = document.getElementById('editRoomStatusSelect').value;

  if (!roomNumber) {
      showToast('Error: Could not find room number.', 'error');
      return;
  }
  
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
      
      const index = currentRequestsData.findIndex(r => r.room == roomNumber);
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
    showToast('Please select at least one task type.', 'error');
    return;
  }
  
  hideTaskTypeModal();
  showStaffModal();
}

async function handleConfirmStaffAssign() {
  if (!selectedStaffId || !currentRoomId || !selectedTaskTypes) {
    showToast('Error: Missing staff, room, or task type information.', 'error');
    return;
  }
  
  const assignBtn = document.getElementById('confirmStaffAssignBtn');
  const originalText = assignBtn.textContent; 
  assignBtn.disabled = true;
  assignBtn.textContent = 'ASSIGNING...';
  
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

      setTimeout(() => {
           window.location.reload();
      }, 1500);

      const index = currentRequestsData.findIndex(r => r.id === currentRoomId);
      if (index > -1) {
        currentRequestsData[index].status = 'Pending';
        currentRequestsData[index].staff = result.staffName || 'Assigned';
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
    if (assignBtn) {
        assignBtn.disabled = false;
        assignBtn.textContent = originalText; 
    }
    currentRoomId = null;
    selectedStaffId = null;
    selectedTaskTypes = '';
  }
}

// ===== FILTER & RENDER =====
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

  filteredRequests.sort((a, b) => {
    const statusA = a.status.toLowerCase();
    const statusB = b.status.toLowerCase();
    const priority = { 'needs cleaning': 1, 'pending': 2, 'in progress': 3 };
    const priorityA = priority[statusA] || 4;
    const priorityB = priority[statusB] || 4;

    if (priorityA !== priorityB) return priorityA - priorityB;
    if (a.floor !== b.floor) return (a.floor || 0) - (b.floor || 0);
    return (a.room || '').localeCompare(b.room || '', undefined, { numeric: true });
  });

  renderRequestsTable();
}

// ===== REFRESH FUNCTIONS WITH TOAST (FIXED) =====
async function handleRefreshRequests() {
  console.log("Refreshing requests data...");
  const refreshBtn = document.getElementById('refreshBtn');
  const originalText = refreshBtn.innerHTML;
  
  document.getElementById('floorFilter').value = '';
  document.getElementById('roomFilter').value = '';
  document.getElementById('searchInput').value = '';

  if (typeof updateRoomFilterOptions === 'function') updateRoomFilterOptions();

  try {
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      
      const result = await handleApiCall('get_all_tasks', {});
      
      if (result.status === 'success') {
          currentRequestsData = result.data;
          applyRequestFiltersAndRender();
          showToast('Requests data updated!', 'success');
      } else {
          showToast('Failed to refresh data.', 'error');
      }
  } catch (error) {
      console.error("Refresh error:", error);
      showToast('Error connecting to server.', 'error');
  } finally {
      refreshBtn.innerHTML = originalText;
  }
}

async function handleRefreshHistory() {
  console.log("Refreshing history data...");
  const refreshBtn = document.getElementById('historyRefreshBtn');
  const originalText = refreshBtn.innerHTML;

  document.getElementById('floorFilterHistory').value = '';
  document.getElementById('roomFilterHistory').value = '';
  
  // --- START FIX: Clear new date inputs, avoid crash ---
  if(document.getElementById('startDateFilterHistory')) document.getElementById('startDateFilterHistory').value = '';
  if(document.getElementById('endDateFilterHistory')) document.getElementById('endDateFilterHistory').value = '';
  // ----------------------------------------------------
  
  document.getElementById('historySearchInput').value = '';
  
  if (typeof updateHistoryRoomFilterOptions === 'function') updateHistoryRoomFilterOptions();
  
  try {
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      
      const result = await handleApiCall('get_all_history', {});
      
      if (result.status === 'success') {
          currentHistoryData = result.data; 
          if (typeof applyHistoryFiltersAndRender === 'function') {
              applyHistoryFiltersAndRender();
          }
          showToast('History updated!', 'success');
      } else {
          showToast('Failed to refresh history.', 'error');
      }
  } catch (error) {
      console.error("Refresh error:", error);
      showToast('Error connecting to server.', 'error');
  } finally {
      refreshBtn.innerHTML = originalText;
  }
}

// ===== PDF DOWNLOAD FUNCTIONS =====
function downloadRequestsPDF() {
    if (filteredRequests.length === 0) {
        showToast("No request data to export based on current filters.", 'error');
        return;
    }

    if (!window.jspdf) { 
        showToast("PDF Library not loaded.", 'error'); 
        return; 
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); 

    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27);
    doc.text("Housekeeping Requests Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    const headers = [['Floor', 'Room', 'Date', 'Request Time', 'Last Clean', 'Status', 'Staff In Charge']];
    
    const bodyData = filteredRequests.map(req => [
        req.floor ?? 'N/A',
        req.room ?? 'N/A',
        req.date ?? 'N/A',
        req.requestTime ?? 'N/A',
        req.lastClean ?? 'N/A',
        req.status ?? 'N/A',
        req.staff ?? 'N/A'
    ]);

    doc.autoTable({
        startY: 35, 
        head: headers, 
        body: bodyData, 
        theme: 'grid',
        headStyles: { 
            fillColor: '#480c1b',
            textColor: '#ffffff', 
            fontStyle: 'bold', 
            halign: 'center' 
        },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 
            4: { cellWidth: 35 },
            6: { cellWidth: 40 }
        }
    });

    doc.save(`housekeeping-requests-${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('PDF downloaded successfully!', 'success');
}

function downloadHistoryPDF() {
    if (filteredHistory.length === 0) {
        showToast("No history data to export based on current filters.", 'error');
        return;
    }
    
    if (!window.jspdf) { 
        showToast("PDF Library not loaded.", 'error'); 
        return; 
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); 

    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27);
    doc.text("Housekeeping History Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    const headers = [['Room', 'Task', 'Staff', 'Date', 'Completed Time', 'Status']];
    
    const bodyData = filteredHistory.map(hist => [
        hist.room ?? 'N/A',
        hist.taskType ?? 'Cleaning',
        hist.staffName ?? 'N/A',
        hist.date ?? 'N/A',
        hist.completedTime ?? 'N/A',
        hist.status ?? 'Completed'
    ]);

    doc.autoTable({
        startY: 35, 
        head: headers, 
        body: bodyData, 
        theme: 'grid',
        headStyles: { 
            fillColor: '#480c1b',
            textColor: '#ffffff', 
            fontStyle: 'bold', 
            halign: 'center' 
        },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 
            1: { cellWidth: 40 },
            2: { cellWidth: 40 }
        } 
    });

    doc.save(`housekeeping-history-${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('History PDF downloaded successfully!', 'success');
}

// ===== HELPER FUNCTIONS =====
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTotalPages(totalItems, itemsPerPage) {
    return Math.ceil(totalItems / itemsPerPage) || 1;
}

function paginateData(data, currentPage, itemsPerPage) {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
}