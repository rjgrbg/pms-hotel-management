/**
 * USER MANAGEMENT MODULE
 * Fix: Removed duplicate 'usersData' declaration to prevent SyntaxError
 */

// ==========================================
// 1. GLOBAL HELPERS (Toast & PDF)
// ==========================================

// Only inject style if it doesn't exist yet
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

// NOTE: 'usersData' variable is already declared at the top of admin.js
// We do NOT declare it again here.

async function fetchAndRenderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading users...</td></tr>';
    
    try {
        const result = await apiCall('fetch_users', {}, 'GET', 'user_actions.php');
        
        if (result.success && result.data && result.data.length > 0) {
            usersData = result.data; // Update the global variable
            
            if (typeof updateDashboardFromUsers === 'function') {
                updateDashboardFromUsers(usersData);
            }
            
            paginationState.users.currentPage = 1;
            renderUsersTable(usersData);
            
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

            return `
                <tr>
                <td><span style="font-weight:bold; color:#555;">${row.EmployeeID || '-'}</span></td>
                    <td>${row.Username}</td>
                    <td>${fullName}</td>
                    <td><span class="statusBadge ${row.AccountType}">${roleName}</span></td>
                    <td>${row.EmailAddress}</td>
                    <td>${row.Shift}</td>
                    <td>
                        <div class="actionButtons">
                            <button class="actionBtn editUserBtn" onclick='handleEditUserClick(${JSON.stringify(row).replace(/'/g, "&apos;")})'>
                                <img src="assets/icons/edit-icon.png" alt="Edit" />
                            </button>
                            <button class="actionBtn deleteUserBtn" onclick="handleDeleteUserClick('${row.UserID}', '${row.Username}')">
                                <img src="assets/icons/delete-icon.png" alt="Delete" />
                            </button>
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

function handleAddUserClick() {
    if(typeof hideFormMessage === 'function') hideFormMessage(true);
    document.getElementById('userModalTitle').textContent = 'Add User from Employee';
    document.getElementById('employeeCodeForm').style.display = 'block';
    document.getElementById('userDetailsDisplay').style.display = 'none';
    document.getElementById('employeeCodeForm').reset();
    document.getElementById('userModal').style.display = 'flex';
}

async function handleEmployeeCodeSubmit(e) {
    e.preventDefault();
    if(typeof hideFormMessage === 'function') hideFormMessage(true);
    
    const employeeCode = document.getElementById('employeeCodeInput').value.trim();
    if (!employeeCode) return typeof showFormMessage === 'function' && showFormMessage('Enter Employee Code', 'error', true);
    
    const lookupBtn = document.getElementById('lookupEmployeeBtn');
    const originalText = lookupBtn.textContent;
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'ADDING...';
    
    try {
        const result = await apiCall('add_user_from_employee', { employeeCode: employeeCode }, 'POST', 'user_actions.php');
        if (result.success) {
            if(typeof showFormMessage === 'function') showFormMessage('User added!', 'success', true);
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

let userToDeleteID = null;
function handleDeleteUserClick(userId, username) {
    userToDeleteID = userId;
    document.getElementById('deleteUserText').textContent = `Delete user "${username}"?`;
    document.getElementById('deleteUserModal').style.display = 'flex';
}

async function confirmUserDelete() {
    if (!userToDeleteID) return;
    const btn = document.getElementById('confirmDeleteUserBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'DELETING...';
    
    try {
        const result = await apiCall('delete_user', { userID: userToDeleteID }, 'POST', 'user_actions.php');
        if (result.success) {
            document.getElementById('deleteUserModal').style.display = 'none';
            await fetchAndRenderUsers();
            showUserToast('User deleted successfully!');
        } else {
            alert(result.message || 'Failed.');
        }
    } catch (error) { alert('Error occurred.'); } 
    finally {
        btn.disabled = false;
        btn.textContent = originalText;
        userToDeleteID = null;
    }
}

// ==========================================
// 5. FILTERS & INITIALIZATION
// ==========================================

function initUserFilters() {
    const searchInput = document.getElementById('usersSearchInput');
    const roleFilter = document.getElementById('usersRoleFilter');
    const shiftFilter = document.getElementById('usersShiftFilter');
    const refreshBtn = document.getElementById('usersRefreshBtn');
    const downloadBtn = document.getElementById('usersDownloadBtn');

    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const role = roleFilter.value;
        const shift = shiftFilter.value;

        const filtered = usersData.filter(row => {
            const matchS = !search || [row.Username, row.Fname, row.Lname, row.EmailAddress].some(val => val?.toLowerCase().includes(search));
            const matchR = !role || row.AccountType === role;
            const matchSh = !shift || row.Shift === shift;
            return matchS && matchR && matchSh;
        });

        paginationState.users.currentPage = 1;
        renderUsersTable(filtered);
        return filtered;
    }

    if (searchInput) searchInput.oninput = applyFilters;
    if (roleFilter) roleFilter.onchange = applyFilters;
    if (shiftFilter) shiftFilter.onchange = applyFilters;

    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            searchInput.value = '';
            roleFilter.value = '';
            shiftFilter.value = '';
            await fetchAndRenderUsers();
            showUserToast("User list refreshed!");
        };
    }

    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const data = applyFilters();
            if (data.length === 0) return alert("No data.");
            
            // MODIFIED: Added 'Employee ID' as the first column
            const headers = ['Employee ID', 'Username', 'Name', 'Role', 'Email', 'Shift'];
            
            const rows = data.map(r => [
                r.EmployeeID || '-',  // Added this line
                r.Username, 
                `${r.Lname}, ${r.Fname}`, 
                r.AccountType, 
                r.EmailAddress, 
                r.Shift
            ]);
            
            downloadUsersPDF(headers, rows, 'User Management Report', 'users_report');
        };
    }

    // Bind Modal Events directly to prevent duplicates
    const addBtn = document.getElementById('addUserBtn');
    if(addBtn) addBtn.onclick = handleAddUserClick;

    const empForm = document.getElementById('employeeCodeForm');
    if(empForm) empForm.onsubmit = handleEmployeeCodeSubmit;

    const passForm = document.getElementById('passwordChangeForm');
    if(passForm) passForm.onsubmit = handlePasswordChangeSubmit;

    const delBtn = document.getElementById('confirmDeleteUserBtn');
    if(delBtn) delBtn.onclick = confirmUserDelete;

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