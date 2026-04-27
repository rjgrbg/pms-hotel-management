/**
 * USER MANAGEMENT MODULE (Complete)
 * Features: Add (Dropdown), Edit, Archive/Restore, Filters, PDF
 */

// ==========================================
// 1. GLOBAL HELPERS (Toast & CSS Injection)
// ==========================================

if (!document.getElementById('user-toast-style')) {
    const userStyle = document.createElement("style");
    userStyle.id = 'user-toast-style';
    userStyle.textContent = `
        .toast-success {
            position: fixed; top: 20px; right: 20px; background-color: #28a745; color: white;
            padding: 12px 24px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.15);
            z-index: 99999; font-family: 'Segoe UI', sans-serif; font-size: 14px;
            opacity: 0; transform: translateY(-20px); transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
        }
        .toast-visible { opacity: 1; transform: translateY(0); }
        
        /* Archived Row Style */
        tr.user-archived {
            background-color: #f9f9f9;
            color: #999;
        }
        tr.user-archived td {
            color: #999;
        }
        tr.user-archived .statusBadge {
            background-color: #ddd !important;
            color: #777 !important;
        }
        
        /* Icons */
        .restoreUserBtn i { font-size: 16px; }
        .deleteUserBtn i { font-size: 16px; color: #dc3545; }
        .deleteUserBtn:hover i { color: #c82333; }
    `;
    document.head.appendChild(userStyle);
}

function showUserToast(message, isError = false) {
    const existingToast = document.querySelector('.toast-success');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-success';
    
    // Make it RED if it's an error message
    if (isError) {
        toast.style.backgroundColor = '#dc3545'; 
    }
    
    toast.innerText = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    
    // Keep errors on screen slightly longer (4.5s) so they can read it
    const displayTime = isError ? 4500 : 3000; 
    
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, displayTime);
}
// DEPRECATED - Now using download-utils.js
// This function is kept for backwards compatibility but downloads now use downloadData()
function downloadUsersPDF(headers, data, title, filename) {
    if (typeof downloadData === 'function') {
        downloadData(headers, data, title, filename);
    } else {
        console.error('Download utility not loaded');
        alert('Download feature is not available. Please refresh the page.');
    }
}

// ==========================================
// 2. DATA FETCHING & RENDER
// ==========================================

async function fetchAndRenderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading users...</td></tr>';
    
    try {
        const result = await apiCall('fetch_users', {}, 'GET', 'user_actions.php');
        
        if (result.success && result.data && result.data.length > 0) {
            usersData = result.data; 
            
            if (typeof updateDashboardFromUsers === 'function') {
                updateDashboardFromUsers(usersData);
            }
            
            // Use internal filter function if initialized, else simple render
            if (typeof applyUserFiltersInternal === 'function') {
                applyUserFiltersInternal(); 
            } else {
                paginationState.users.currentPage = 1;
                renderUsersTable(usersData);
            }
            
            const count = document.getElementById('usersRecordCount');
            if (count) count.textContent = usersData.length;

        } else {
            usersData = [];
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No users found.</td></tr>';
            const count = document.getElementById('usersRecordCount');
            if (count) count.textContent = 0;
            if (typeof updateDashboardFromUsers === 'function') updateDashboardFromUsers([]);
            renderPaginationControls('user-management-tab', 0, 1, () => {});
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #c33;">Network error.</td></tr>';
    }
}

function renderUsersTable(data) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const state = paginationState.users;
    const totalPages = getTotalPages(data.length, state.itemsPerPage);
    const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(row => {
            const fullName = `${row.Lname}, ${row.Fname}`;
            const roleName = (typeof ACCOUNT_TYPE_MAP !== 'undefined' ? ACCOUNT_TYPE_MAP[row.AccountType] : row.AccountType) || row.AccountType;
            const isArchived = row.is_archived == 1;
            const rowClass = isArchived ? 'user-archived' : '';
            let dropdownMenu = '';
            if (isArchived) {
                dropdownMenu = `
                    <div class="dropdown-menu">
                        <button class="dropdown-item" onclick="handleRestoreUserClick('${row.UserID}', '${escapeHtml(row.Username)}'); closeAllDropdowns();">
                            <i class="fas fa-trash-restore"></i> Restore
                        </button>
                    </div>
                `;
            } else {
                dropdownMenu = `
                    <div class="dropdown-menu">
                        <button class="dropdown-item" onclick='handleEditUserClick(${JSON.stringify(row).replace(/'/g, "&apos;")}); closeAllDropdowns();'>
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="dropdown-item delete" onclick="handleArchiveUserClick('${row.UserID}', '${escapeHtml(row.Username)}'); closeAllDropdowns();">
                            <i class="fas fa-archive"></i> Archive
                        </button>
                    </div>
                `;
            }
            // Read the shift directly from the synced database value
            const shiftDisplay = row.Shift || '-';
            return `
                <tr class="${rowClass}">
                <td><span style="font-weight:bold; color:#555;">${row.EmployeeID || '-'}</span></td>
                    <td>${escapeHtml(row.Username)}</td>
                    <td>${escapeHtml(fullName)}</td>
                    <td><span class="statusBadge ${row.AccountType}">${escapeHtml(roleName)}</span></td>
                    <td>${escapeHtml(row.EmailAddress)}</td>
                    <td>${shiftDisplay}</td>
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
    
    const count = document.getElementById('usersRecordCount');
    if (count) count.textContent = data.length;
    
    renderPaginationControls('user-management-tab', totalPages, state.currentPage, (page) => {
        state.currentPage = page;
        renderUsersTable(data);
    });
}

// ==========================================
// 3. MODAL HANDLERS
// ==========================================

// --- ADD USER: Show Modal & Auto-load ALL Suggestions ---
async function handleAddUserClick() {
    if(typeof hideFormMessage === 'function') hideFormMessage(true);
    
    document.getElementById('userModal').style.display = 'flex';
    document.getElementById('userModalTitle').textContent = 'Add Users from Employees';
    document.getElementById('employeeCodeForm').style.display = 'block';
    document.getElementById('userDetailsDisplay').style.display = 'none';
    document.getElementById('employeeCodeForm').reset();
    
    const container = document.getElementById('employeeCheckboxContainer');
    const input = document.getElementById('employeeCodeInput');
    
    if (container && input) { 
        // 145px perfectly fits 4 items. If it clips on your screen, change to 150px.
        container.style.maxHeight = '145px';
        container.style.overflowY = 'auto';
        
        container.innerHTML = '<p style="text-align:center; color:#999; margin:15px 0;">Loading all employees...</p>'; 
        container.style.display = 'block';
        input.placeholder = "Search loaded employees..."; 
        
        try {
            // Request ALL employees immediately
            const result = await apiCall('fetch_available_employees', { limit: 'all' }, 'GET', 'user_actions.php');
            container.innerHTML = ''; 
            
            if (result.success && result.data && result.data.length > 0) {
                result.data.forEach(emp => {
                    const div = document.createElement('div');
                    div.style.marginBottom = '8px';
                    div.style.paddingBottom = '8px';
                    div.style.borderBottom = '1px solid #f0f0f0';
                    div.innerHTML = `
                        <label style="display: flex; align-items: center; cursor: pointer; color: #333; margin: 0; font-size: 14px;">
                            <input type="checkbox" name="selectedEmployees[]" value="${emp.employee_code}" style="margin-right: 12px; width: 18px; height: 18px;">
                            <strong>${emp.last_name}, ${emp.first_name}</strong> &nbsp; <span style="color: #777;">(${emp.position_name})</span>
                        </label>
                    `;
                    container.appendChild(div);
                });
            } else {
                container.innerHTML = '<p style="color:#999; text-align:center; margin:15px 0;">No new employees available to add.</p>';
            }
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            container.innerHTML = '<p style="color:red; text-align:center; margin:15px 0;">Error loading suggestions.</p>';
        }
    }
}

// --- DEBOUNCED SEARCH: Render Checkboxes ---
let debounceTimeout;
document.getElementById('employeeCodeInput')?.addEventListener('input', function(e) {
    const searchQuery = e.target.value.trim();
    const container = document.getElementById('employeeCheckboxContainer');
    
    clearTimeout(debounceTimeout);
    
    // If the user clears the search bar, reload the full list automatically
    if (searchQuery.length === 0) {
        handleAddUserClick();
        return;
    }

    if (searchQuery.length < 2) {
        return; // Wait for at least 2 characters before searching
    }

    container.innerHTML = '<p style="text-align:center; color:#999; margin:15px 0;">Searching...</p>';

    debounceTimeout = setTimeout(async () => {
        try {
            const result = await apiCall('fetch_available_employees', { search: searchQuery, limit: 'all' }, 'GET', 'user_actions.php');
            container.innerHTML = '';
            
            if (result.success && result.data && result.data.length > 0) {
                container.style.display = 'block';
                result.data.forEach(emp => {
                    const div = document.createElement('div');
                    div.style.marginBottom = '8px';
                    div.style.paddingBottom = '8px';
                    div.style.borderBottom = '1px solid #f0f0f0';
                    div.innerHTML = `
                        <label style="display: flex; align-items: center; cursor: pointer; color: #333; margin: 0; font-size: 14px;">
                            <input type="checkbox" name="selectedEmployees[]" value="${emp.employee_code}" style="margin-right: 12px; width: 18px; height: 18px;">
                            <strong>${emp.last_name}, ${emp.first_name}</strong> &nbsp; <span style="color: #777;">(${emp.position_name})</span>
                        </label>
                    `;
                    container.appendChild(div);
                });
            } else {
                container.style.display = 'block';
                container.innerHTML = '<p style="color:#999; text-align:center; margin:15px 0;">No matching employees found.</p>';
            }
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        }
    }, 300);
});

// --- SUBMIT: Add Multiple Users ---
async function handleEmployeeCodeSubmit(e) {
    e.preventDefault();
    if(typeof hideFormMessage === 'function') hideFormMessage(true);
    
    // Gather all checked boxes and JOIN them into a single comma-separated string
    const checkedBoxes = document.querySelectorAll('input[name="selectedEmployees[]"]:checked');
    const selectedCodes = Array.from(checkedBoxes).map(cb => cb.value).join(',');
    
    if (!selectedCodes || selectedCodes.length === 0) {
        return typeof showFormMessage === 'function' && showFormMessage('Please check at least one employee from the list.', 'error', true);
    }
    
    const lookupBtn = document.getElementById('lookupEmployeeBtn');
    const originalText = lookupBtn.textContent;
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'ADDING...';
    
    try {
        // Send the comma-separated string to the backend
        const result = await apiCall('add_user_from_employee', { employeeCodes: selectedCodes }, 'POST', 'user_actions.php');
        
        if (result.success) {
            if(typeof showFormMessage === 'function') showFormMessage(result.message, 'success', true);
            document.getElementById('employeeCodeForm').reset();
            document.getElementById('employeeCheckboxContainer').innerHTML = '';
            document.getElementById('employeeCheckboxContainer').style.display = 'none';
            
            await fetchAndRenderUsers();
            
            setTimeout(() => {
                document.getElementById('userModal').style.display = 'none';
                if(typeof hideFormMessage === 'function') hideFormMessage(true);
            }, 2500);
        } else {
            if(typeof showFormMessage === 'function') showFormMessage(result.message || 'Failed.', 'error', true);
        }
    } catch (error) {
        if(typeof showFormMessage === 'function') showFormMessage('Error occurred.', 'error', true);
    } finally {
        lookupBtn.disabled = false;
        lookupBtn.textContent = originalText;
    }
}
// --- EDIT USER ---
function handleEditUserClick(user) {
    if(typeof hideFormMessage === 'function') hideFormMessage(true);
    document.getElementById('userModalTitle').textContent = 'Change Password: ' + user.Username;
    document.getElementById('employeeCodeForm').style.display = 'none';
    document.getElementById('userDetailsDisplay').style.display = 'block';
    
    document.getElementById('displayEmployeeCode').textContent = user.EmployeeID || 'N/A';
    document.getElementById('displayFullName').textContent = `${user.Lname}, ${user.Fname}`;
    document.getElementById('displayEmail').textContent = user.EmailAddress;
    document.getElementById('displayAccountType').textContent = user.AccountType;
    document.getElementById('displayShift').textContent = user.Shift;
    document.getElementById('displayUsername').textContent = user.Username;
    
    document.getElementById('editUserId').value = user.UserID;
    document.getElementById('newPassword').value = '';
    document.getElementById('userModal').style.display = 'flex';
}

async function handlePasswordChangeSubmit(e) {
    e.preventDefault();
    if(typeof hideFormMessage === 'function') hideFormMessage(true);
    
    const userID = document.getElementById('editUserId').value;
    const password = document.getElementById('newPassword').value.trim();
    
    if (!password) return typeof showFormMessage === 'function' && showFormMessage('Enter new password', 'error', true);
    
    const saveBtn = document.getElementById('savePasswordBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'UPDATING...';
    
    try {
        const result = await apiCall('edit_user', { userID: userID, password: password }, 'POST', 'user_actions.php');
        if (result.success) {
            if(typeof showFormMessage === 'function') showFormMessage('Password updated!', 'success', true);
            setTimeout(() => {
                document.getElementById('userModal').style.display = 'none';
                if(typeof hideFormMessage === 'function') hideFormMessage(true);
            }, 1500);
        } else {
            if(typeof showFormMessage === 'function') showFormMessage(result.message || 'Failed.', 'error', true);
        }
    } catch (error) {
        if(typeof showFormMessage === 'function') showFormMessage('Error occurred.', 'error', true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// --- ARCHIVE USER ---
let userToArchiveID = null;

function handleArchiveUserClick(userId, username) {
    userToArchiveID = userId;
    const modalText = document.getElementById('deleteUserText');
    if(modalText) modalText.textContent = `Are you sure you want to archive user "${username}"? They will no longer be able to log in.`;
    
    const modalTitle = document.querySelector('#deleteUserModal h2');
    if(modalTitle) modalTitle.textContent = "Archive User";
    
    // Change icon to archive box
    const iconContainer = document.querySelector('#deleteUserModal .modalIcon');
    if(iconContainer) iconContainer.innerHTML = '<i class="fas fa-archive" style="font-size: 40px; color: #dc3545;"></i>';

    const confirmBtn = document.getElementById('confirmDeleteUserBtn');
    if(confirmBtn) {
        confirmBtn.textContent = "ARCHIVE";
        confirmBtn.onclick = confirmUserArchive;
    }

    document.getElementById('deleteUserModal').style.display = 'flex';
}

async function confirmUserArchive() {
    if (!userToArchiveID) return;
    const btn = document.getElementById('confirmDeleteUserBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'ARCHIVING...';
    
    try {
        const result = await apiCall('archive_user', { userID: userToArchiveID }, 'POST', 'user_actions.php');
        
        if (result.success) {
            document.getElementById('deleteUserModal').style.display = 'none';
            await fetchAndRenderUsers();
            showUserToast('User archived successfully!');
        } else {
            document.getElementById('deleteUserModal').style.display = 'none';
            showUserToast(result.message || 'Failed to archive user.', true); // true = isError
        }
    } catch (error) { 
        document.getElementById('deleteUserModal').style.display = 'none';
        showUserToast('Error occurred.', true); 
    } 
    finally {
        btn.disabled = false;
        btn.textContent = originalText;
        userToArchiveID = null;
    }
}

// --- RESTORE USER ---
let userToRestoreID = null;

function handleRestoreUserClick(userId, username) {
    userToRestoreID = userId;
    const modalText = document.getElementById('deleteUserText');
    if(modalText) modalText.textContent = `Are you sure you want to restore user "${username}"? They will be able to log in again.`;
    
    const modalTitle = document.querySelector('#deleteUserModal h2');
    if(modalTitle) modalTitle.textContent = "Restore User";
    
    // Change icon to refresh/undo
    const iconContainer = document.querySelector('#deleteUserModal .modalIcon');
    if(iconContainer) iconContainer.innerHTML = '<i class="fas fa-trash-restore" style="font-size: 40px; color: #28a745;"></i>';

    const confirmBtn = document.getElementById('confirmDeleteUserBtn');
    if(confirmBtn) {
        confirmBtn.textContent = "RESTORE";
        confirmBtn.onclick = confirmUserRestore; 
    }

    document.getElementById('deleteUserModal').style.display = 'flex';
}

async function confirmUserRestore() {
    if (!userToRestoreID) return;
    const btn = document.getElementById('confirmDeleteUserBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'RESTORING...';
    
    try {
        const result = await apiCall('restore_user', { userID: userToRestoreID }, 'POST', 'user_actions.php');
        
        if (result.success) {
            document.getElementById('deleteUserModal').style.display = 'none';
            await fetchAndRenderUsers();
            showUserToast('User restored successfully!');
        } else {
            document.getElementById('deleteUserModal').style.display = 'none';
            showUserToast(result.message || 'Failed to restore user.', true); // true = isError
        }
    } catch (error) { 
        document.getElementById('deleteUserModal').style.display = 'none';
        showUserToast('Error occurred.', true); 
    } 
    finally {
        btn.disabled = false;
        btn.textContent = originalText;
        userToRestoreID = null;
    }
}

// ==========================================
// 5. FILTERS & INITIALIZATION
// ==========================================

// Global var to hold the filter logic so fetchAndRenderUsers can call it
let applyUserFiltersInternal;

function initUserFilters() {
    const searchInput = document.getElementById('usersSearchInput');
    const roleFilter = document.getElementById('usersRoleFilter');
    const shiftFilter = document.getElementById('usersShiftFilter');
    const statusFilter = document.getElementById('usersStatusFilter'); // NEW
    
    const refreshBtn = document.getElementById('usersRefreshBtn');
    const downloadBtn = document.getElementById('usersDownloadBtn');

    applyUserFiltersInternal = function() {
        const search = searchInput.value.toLowerCase();
        const role = roleFilter.value;
        const shift = shiftFilter.value;
        const status = statusFilter ? statusFilter.value : '';

        const filtered = usersData.filter(row => {
            const matchS = !search || [row.Username, row.Fname, row.Lname, row.EmailAddress].some(val => val?.toLowerCase().includes(search));
            const matchR = !role || row.AccountType === role;
            
            // Read the shift directly for filtering
            const matchSh = !shift || row.Shift === shift;
            
            const isArchived = row.is_archived == 1;
            const rowStatus = isArchived ? 'Archived' : 'Active';
            const matchSt = !status || rowStatus === status;
            
            return matchS && matchR && matchSh && matchSt;
        });

        paginationState.users.currentPage = 1;
        renderUsersTable(filtered);
        return filtered;
    };

    if (searchInput) searchInput.oninput = applyUserFiltersInternal;
    if (roleFilter) roleFilter.onchange = applyUserFiltersInternal;
    if (shiftFilter) shiftFilter.onchange = applyUserFiltersInternal;
    if (statusFilter) statusFilter.onchange = applyUserFiltersInternal;

    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            searchInput.value = '';
            roleFilter.value = '';
            shiftFilter.value = '';
            if(statusFilter) statusFilter.value = '';
            
            await fetchAndRenderUsers();
            showUserToast("User list refreshed!");
        };
    }

    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const data = applyUserFiltersInternal();
            if (data.length === 0) return alert("No data.");
            
            const headers = ['Employee ID', 'Username', 'Name', 'Role', 'Email', 'Shift', 'Status'];
            
            const rows = data.map(r => [
                r.EmployeeID || '-', 
                r.Username, 
                `${r.Lname}, ${r.Fname}`, 
                r.AccountType, 
                r.EmailAddress, 
                r.Shift,
                r.is_archived == 1 ? 'Archived' : 'Active'
            ]);
            
            downloadData(headers, rows, 'User Management Report', 'users_report');
        };
    }

    // Modal Bindings
    const addBtn = document.getElementById('addUserBtn');
    if(addBtn) addBtn.onclick = handleAddUserClick;

    const empForm = document.getElementById('employeeCodeForm');
    if(empForm) empForm.onsubmit = handleEmployeeCodeSubmit;

    const passForm = document.getElementById('passwordChangeForm');
    if(passForm) passForm.onsubmit = handlePasswordChangeSubmit;

    // Close Buttons
    ['closeUserModalBtn', 'cancelEmployeeCodeBtn', 'cancelPasswordChangeBtn'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.onclick = () => document.getElementById('userModal').style.display = 'none';
    });
    
    ['closeDeleteUserModalBtn', 'cancelDeleteUserBtn'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.onclick = () => document.getElementById('deleteUserModal').style.display = 'none';
    });
}

// ==========================================
// 6. DROPDOWN TOGGLE FUNCTION
// ==========================================

window.closeAllDropdowns = function() {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
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
        const dropdownHeight = 100; // Approximate height of dropdown
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
        dropdown.style.left = (rect.right - 140) + 'px'; // Align to right of button (140px = min-width)
        
        dropdown.classList.add('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.action-dropdown')) {
        closeAllDropdowns();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('manage-users-page')) {
        fetchAndRenderUsers();
        initUserFilters();
    }
});