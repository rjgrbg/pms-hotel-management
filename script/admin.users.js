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

function showUserToast(message) {
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

function downloadUsersPDF(headers, data, title, filename) {
    if (!window.jspdf) {
        alert("PDF Library not loaded.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100); 
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3, textColor: 50 },
        headStyles: { fillColor: '#480c1b', textColor: '#ffffff', fontStyle: 'bold', halign: 'center' }
    });
    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
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
            
            let actionBtn = '';
            if (isArchived) {
                actionBtn = `
                    <button class="actionBtn restoreUserBtn" title="Restore User" onclick="handleRestoreUserClick('${row.UserID}', '${escapeHtml(row.Username)}')">
                        <i class="fas fa-trash-restore" style="color: #28a745;"></i> 
                    </button>
                `;
            } else {
                // Changed to FontAwesome Icon
                actionBtn = `
                    <button class="actionBtn deleteUserBtn" title="Archive User" onclick="handleArchiveUserClick('${row.UserID}', '${escapeHtml(row.Username)}')">
                        <i class="fas fa-archive"></i>
                    </button>
                `;
            }

            return `
                <tr class="${rowClass}">
                <td><span style="font-weight:bold; color:#555;">${row.EmployeeID || '-'}</span></td>
                    <td>${escapeHtml(row.Username)}</td>
                    <td>${escapeHtml(fullName)}</td>
                    <td><span class="statusBadge ${row.AccountType}">${escapeHtml(roleName)}</span></td>
                    <td>${escapeHtml(row.EmailAddress)}</td>
                    <td>${escapeHtml(row.Shift)}</td>
                    <td>
                        <div class="actionButtons">
                            <button class="actionBtn editUserBtn" onclick='handleEditUserClick(${JSON.stringify(row).replace(/'/g, "&apos;")})' ${isArchived ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                <img src="assets/icons/edit-icon.png" alt="Edit" />
                            </button>
                            ${actionBtn}
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

// --- ADD USER: Fetch List and Show Modal ---
async function handleAddUserClick() {
    if(typeof hideFormMessage === 'function') hideFormMessage(true);
    document.getElementById('userModalTitle').textContent = 'Add User from Employee';
    document.getElementById('employeeCodeForm').style.display = 'block';
    document.getElementById('userDetailsDisplay').style.display = 'none';
    document.getElementById('employeeCodeForm').reset();
    
    // Get the datalist element
    const datalist = document.getElementById('employeeList');
    const input = document.getElementById('employeeCodeInput');
    
    if (datalist && input) { 
        datalist.innerHTML = ''; // Clear previous options
        input.placeholder = "Loading suggestions...";
        
        try {
            const result = await apiCall('fetch_available_employees', {}, 'GET', 'user_actions.php');
            
            input.placeholder = "Type or select Employee Code (e.g., EMP-001)";
            
            if (result.success && result.data && result.data.length > 0) {
                result.data.forEach(emp => {
                    const option = document.createElement('option');
                    // Value is what gets put into the input box
                    option.value = emp.employee_code; 
                    // Label helps the user identify the code
                    option.textContent = `${emp.last_name}, ${emp.first_name} (${emp.position_name})`; 
                    datalist.appendChild(option);
                });
            }
        } catch (e) {
            console.error(e);
            input.placeholder = "Error loading list. Type manually.";
        }
    }

    document.getElementById('userModal').style.display = 'flex';
}

async function handleEmployeeCodeSubmit(e) {
    e.preventDefault();
    if(typeof hideFormMessage === 'function') hideFormMessage(true);
    
    const employeeCode = document.getElementById('employeeCodeInput').value.trim();
    if (!employeeCode) return typeof showFormMessage === 'function' && showFormMessage('Please enter or select an Employee Code', 'error', true);
    
    const lookupBtn = document.getElementById('lookupEmployeeBtn');
    const originalText = lookupBtn.textContent;
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'ADDING...';
    
    try {
        const result = await apiCall('add_user_from_employee', { employeeCode: employeeCode }, 'POST', 'user_actions.php');
        if (result.success) {
            if(typeof showFormMessage === 'function') showFormMessage('User added successfully!', 'success', true);
            document.getElementById('employeeCodeForm').reset();
            await fetchAndRenderUsers();
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
        confirmBtn.style.backgroundColor = '#dc3545'; // Red
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
            alert(result.message || 'Failed to archive user.');
        }
    } catch (error) { alert('Error occurred.'); } 
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
        confirmBtn.style.backgroundColor = '#28a745'; // Green
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
            alert(result.message || 'Failed to restore user.');
        }
    } catch (error) { alert('Error occurred.'); } 
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
            
            downloadUsersPDF(headers, rows, 'User Management Report', 'users_report');
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

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('manage-users-page')) {
        fetchAndRenderUsers();
        initUserFilters();
    }
});