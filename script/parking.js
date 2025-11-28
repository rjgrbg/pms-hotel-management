document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // API & DATA MANAGEMENT
    // ========================================================
    const API_URL = 'parking_api.php';

    // Main App State
    let slotsData = [];          // For 'Slots' tab
    let vehiclesInData = [];     // For 'Vehicle In' tab
    let historyData = [];        // For 'History' tab
    let dashboardTableData = []; // Cache for dashboard table
    
    let userData = window.INJECTED_USER_DATA || { Fname: "Guest" };

    // Pagination State
    let currentPages = {
        slots: 1,
        vehicleIn: 1,
        history: 1
    };
    const rowsPerPage = 10; 

    // Sorting State
    let sortState = {
        dashboard: { column: 'AreaName', direction: 'asc' }, 
        slots: { column: 'SlotName', direction: 'asc' },
        vehicleIn: { column: 'EntryTime', direction: 'desc' }, // This will now sort chronologically
        history: { column: 'ExitDateTime', direction: 'desc' } // Fixed from 'ExitTime'
    };

    // Global variable to track which vehicle/slot is being actioned
    let currentSlotID = null;
    let currentSlotName = null;
    let currentSessionID = null;
    
    // === NEW DOM Elements for Management Modals ===
    const manageTypesModal = document.getElementById('manage-types-modal');
    const openTypesModalBtn = document.getElementById('open-types-modal-btn');
    const addNewTypeBtn = document.getElementById('add-new-type-btn');
    const newTypeNameInput = document.getElementById('new-type-name');
    const typesListContainer = document.getElementById('types-list-container');

    const manageCategoriesModal = document.getElementById('manage-categories-modal');
    const openCategoriesModalBtn = document.getElementById('open-categories-modal-btn');
    const categoryManagerTypeSelect = document.getElementById('category-manager-type-select');
    const addNewCategoryBtn = document.getElementById('add-new-category-btn');
    const newCategoryNameInput = document.getElementById('new-category-name');
    const categoriesListContainer = document.getElementById('categories-list-container');
    
    const editNameModal = document.getElementById('edit-name-modal');
    const editNameForm = document.getElementById('edit-name-form');
    const editNameTitle = document.getElementById('edit-name-title');
    const editIdInput = document.getElementById('edit-id-input');
    const editTypeInput = document.getElementById('edit-type-input');
    const editNameInput = document.getElementById('edit-name-input');
    

    // ========================================================
    // API HELPER
    // ========================================================
    async function fetchAPI(action, options = {}, queryParams = "") {
        const url = `${API_URL}?action=${action}${queryParams ? '&' + queryParams : ''}`;
        
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) { /* Ignore if response is not JSON */ }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            
            if (data.success === false) {
                throw new Error(data.error || 'API returned an error');
            }
            
            return data;

        } catch (error) {
            console.error('Fetch Error:', error);
            showToast(error.message, 'error');
            return null; // Return null on failure
        }
    }


    // ========================================================
// UTILITY & HELPER FUNCTIONS
// ========================================================
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        // Create container if it doesn't exist (Self-contained)
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
    
    // Apply Styles (Matching Maintenance/HK)
    toast.style.backgroundColor = bgColor;
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '5px';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
    
    // --- FONT STYLE FIX ---
    toast.style.fontFamily = "'Segoe UI', sans-serif"; 
    toast.style.fontSize = '14px';
    // ----------------------
    
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show'); // Keep class for potential external overrides
        toast.style.opacity = '1';
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        toast.style.opacity = '0';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300); // Wait for transition
    }, 3000);
}

    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                '"': '&quot;', "'": '&#39;'
            }[m];
        });
    }

    function sanitizeOnPaste(e) {
        // Get pasted data
        let paste = (e.clipboardData || window.clipboardData).getData('text');
        // Strip invalid characters (allow letters, numbers, spaces, and basic punctuation)
        let sanitized = paste.replace(/[^a-zA-Z0-9\s.,#-]/g, '');
        
        // This is a bit of a hack to insert the sanitized text
        // We stop the default paste, then manually insert the sanitized text
        e.preventDefault();
        document.execCommand('insertText', false, sanitized);
    }

    // ========================================================
    // UI (TABS, MODALS, SIDEBAR)
    // ========================================================
    const showModal = (modal) => {
        if (modal) {
            // Special handling for the main modal types
            if (modal.classList.contains('modal-overlay') || 
                modal.classList.contains('modal-overlay-confirm') || 
                modal.classList.contains('modal-overlay-success')) {
                modal.classList.add('show-modal');
            } else if (modal.classList.contains('modalBackdrop')) {
                // Handle the logout modal
                modal.style.display = 'flex';
            }
        }
    };
    
    const hideModal = (modal) => {
        if (modal) {
            // Special handling for the main modal types
            if (modal.classList.contains('modal-overlay') || 
                modal.classList.contains('modal-overlay-confirm') || 
                modal.classList.contains('modal-overlay-success')) {
                modal.classList.remove('show-modal');
            } else if (modal.classList.contains('modalBackdrop')) {
                // Handle the logout modal
                modal.style.display = 'none';
            }
        }
    };
    

    function setupUIListeners() {
        // --- Tab Navigation ---
        const tabBtns = document.querySelectorAll('.tabBtn');
        const tabContents = document.querySelectorAll('.tabContent');
        tabBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                tabBtns.forEach((b) => b.classList.remove('active'));
                tabContents.forEach((content) => content.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.add('active');
                
                // Reset page number on tab switch
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                
                // Re-fetch data for the new tab (will use cache if available)
                performFilterAndSearch();
            });
        });

        // --- Profile & Logout ---
        const profileBtn = document.getElementById('profileBtn');
        const sidebar = document.getElementById('profile-sidebar');
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const closeLogoutBtn = document.getElementById('closeLogoutBtn');
        const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
        const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

        if (profileBtn && sidebar && sidebarCloseBtn) {
            profileBtn.addEventListener('click', () => sidebar.classList.add('active'));
            sidebarCloseBtn.addEventListener('click', () =>
            sidebar.classList.remove('active')
            );
        }

        if (logoutBtn)
            logoutBtn.addEventListener('click', () => showModal(logoutModal));
        if (closeLogoutBtn)
            closeLogoutBtn.addEventListener('click', () => hideModal(logoutModal));
        if (cancelLogoutBtn)
            cancelLogoutBtn.addEventListener('click', () => hideModal(logoutModal));
        
        if (confirmLogoutBtn) {
            confirmLogoutBtn.addEventListener('click', () => {
                window.location.href = 'logout.php';
            });
        }
        if (logoutModal) {
            logoutModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                hideModal(logoutModal);
            }
            });
        }
        
        // --- Generic Modal Close Buttons ---
        document.querySelectorAll('.modal-close-btn, .btn-okay, .btn-cancel, button[data-modal-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Check if it's a "cancel" button inside a specific form modal
                if(e.target.id === 'edit-category-name-cancel-btn') {
                        e.preventDefault(); // prevent form submission
                }
                const modal = e.target.closest('.modal-overlay, .modal-overlay-confirm, .modal-overlay-success, .modalBackdrop');
                if (modal) hideModal(modal);
            });
        });
        
        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay, .modal-overlay-confirm, .modal-overlay-success').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    hideModal(overlay);
                }
            });
        });
    }

    // ========================================================
    // RENDER FUNCTIONS (FOR <table>)
    // ========================================================
    function renderEmptyState(tbody, colSpan, icon, title, message) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" style="text-align: center; padding: 4rem 2rem;">
                    <div class="empty-state">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">${icon}</div>
                        <h3 style="font-family: 'Abril Fatface', serif; font-size: 1.5rem; color: #333; margin-bottom: 0.5rem;">${title}</h3>
                        <p style="color: #999;">${message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
    function renderDashboard(data) {
        const cards = document.querySelectorAll('.summary-cards .card .card-value');
        if (data.cards) {
            if (cards[0]) cards[0].textContent = data.cards.occupied || 0;
            if (cards[1]) cards[1].textContent = data.cards.available || 0;
            if (cards[2]) cards[2].textContent = data.cards.total || 0;
        }

        const tbody = document.getElementById('dashboardTableBody');
        if (!tbody) return;
        
        if (!data.table || data.table.length === 0) {
            renderEmptyState(tbody, 5, '📊', 'No Areas Found', 'Try adjusting your filter.');
            return;
        }

        tbody.innerHTML = data.table.map(area => {
            const isFull = area.status === 'Full';
            return `
                <tr class="${isFull ? 'full-row' : ''}">
                    <td class="${isFull ? 'text-red' : ''}">${area.AreaName}</td>
                    <td class="${isFull ? 'text-red' : ''}">${isFull ? '-' : area.available}</td>
                    <td class="${isFull ? 'text-red' : ''}">${area.occupied}</td>
                    <td class="${isFull ? 'text-red' : ''}">${area.total}</td>
                    <td class="${isFull ? 'text-red' : ''} text-right">${isFull ? 'Full' : ''}</td>
                </tr>
            `;
        }).join('');
        updateSortHeaders('dashboard-tab', sortState.dashboard);
    }

    function renderSlots(filteredData) {
    const tbody = document.getElementById('slotsTableBody');
    if (!tbody) return;
    
    const page = currentPages.slots;
    const totalItems = filteredData.length;
    setupPagination(totalItems, 'pagination-slots', page);

    if (totalItems === 0) {
        renderEmptyState(tbody, 5, '🅿️', 'No Slots Found', 'Try adjusting your search or filter.');
        return;
    }
    
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedData.map((slot) => {
        // --- SECURITY FIX: Escape HTML ---
        const safeArea = escapeHtml(slot.AreaName);
        const safeSlot = escapeHtml(slot.SlotName);
        const safeVehicle = escapeHtml(slot.AllowedVehicle);
        const safeId = escapeHtml(slot.SlotID);
        const safeStatusClass = escapeHtml(slot.Status);

        return `
            <tr>
                <td>${safeArea}</td>
                <td>${safeSlot}</td>
                <td>${safeVehicle}</td>
                <td>
                    <span class="status-badge status-${safeStatusClass}">
                        ${slot.Status === 'available' ? 'Available' : 'Occupied'}
                    </span>
                </td>
                <td>
                    ${slot.Status === 'available' 
                        ? `<button class="btn-enter" data-slot-id="${safeId}" data-slot-name="${safeSlot}">Enter Vehicle</button>`
                        : `<button class="btn-enter-gray" disabled>Enter Vehicle</button>`
                    }
                </td>
            </tr>
        `;
    }).join('');

    updateSortHeaders('slots-tab', sortState.slots);
}

    function renderVehicleIn(filteredData) {
    const tbody = document.getElementById('vehicleInTableBody');
    if (!tbody) return;

    const page = currentPages.vehicleIn;
    const totalItems = filteredData.length;
    setupPagination(totalItems, 'pagination-vehicleIn', page);

    if (totalItems === 0) {
        renderEmptyState(tbody, 9, '🚗', 'No Vehicles Parked', 'Available slots can be seen in the "Slots" tab.');
        return;
    }

    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedData.map((vehicle) => {
        // --- SECURITY FIX: Escape HTML on all fields ---
        return `
            <tr>
                <td>${escapeHtml(vehicle.SlotName)}</td>
                <td>${escapeHtml(vehicle.PlateNumber)}</td>
                <td>${escapeHtml(vehicle.RoomNumber)}</td>
                <td>${escapeHtml(vehicle.GuestName)}</td>
                <td>${escapeHtml(vehicle.VehicleType)}</td>
                <td>${escapeHtml(vehicle.VehicleCategory)}</td>
                <td>${escapeHtml(vehicle.EnterTime)}</td>
                <td>${escapeHtml(vehicle.EnterDate)}</td>
                <td>
                    <button class="exit-btn" data-slot-id="${escapeHtml(vehicle.SlotID)}" data-session-id="${escapeHtml(vehicle.SessionID)}">
                        <img src="assets/images/parking.png" alt="Exit Vehicle" style="width: 24px; height: 24px;">
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateSortHeaders('vehicleIn-tab', sortState.vehicleIn);
}

    function renderHistory(filteredData) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    const page = currentPages.history;
    const totalItems = filteredData.length;
    setupPagination(totalItems, 'pagination-history', page);

    if (totalItems === 0) {
        renderEmptyState(tbody, 9, '📜', 'No History Found', 'Vehicles that exit will appear here.');
        return;
    }

    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedData.map((vehicle) => {
        // --- SECURITY FIX: Escape all fields ---
        return `
            <tr>
                <td>${escapeHtml(vehicle.SlotName)}</td>
                <td>${escapeHtml(vehicle.PlateNumber)}</td>
                <td>${escapeHtml(vehicle.RoomNumber)}</td>
                <td>${escapeHtml(vehicle.GuestName)}</td>
                <td>${escapeHtml(vehicle.VehicleType)}</td>
                <td>${escapeHtml(vehicle.VehicleCategory)}</td>
                <td>${escapeHtml(vehicle.ParkingTime)}</td>
                <td>${escapeHtml(vehicle.EntryDateTime)}</td>
                <td>${escapeHtml(vehicle.ExitDateTime)}</td>
            </tr>
        `;
    }).join('');
    
    updateSortHeaders('history-tab', sortState.history);
}
    // ========================================================
    // PAGINATION LOGIC
    // ========================================================
    function setupPagination(totalItems, containerId, currentPage) {
        const paginationContainer = document.getElementById(containerId);
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / rowsPerPage);

        const recordsInfo = document.createElement('span');
        recordsInfo.className = 'paginationInfo';
        let start, end;
        if (totalItems === 0) {
            start = 0; end = 0;
        } else {
            start = (currentPage - 1) * rowsPerPage + 1;
            end = Math.min(start + rowsPerPage - 1, totalItems);
        }
        recordsInfo.textContent = `Displaying ${start}-${end} of ${totalItems} Records`;
        paginationContainer.appendChild(recordsInfo);
        
        if (totalPages <= 1) return;

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'paginationControls';

        const prevButton = document.createElement('button');
        prevButton.className = 'paginationBtn';
        prevButton.innerHTML = '&lt;';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (containerId.includes('slots')) currentPages.slots--;
            if (containerId.includes('vehicleIn')) currentPages.vehicleIn--;
            if (containerId.includes('history')) currentPages.history--;
            performFilterAndSearch();
        });
        controlsDiv.appendChild(prevButton);

        const pageNumbers = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
        } else {
            pageNumbers.push(1);
            if (currentPage > 3) pageNumbers.push('...');
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);
            if (currentPage <= 2) end = 3;
            if (currentPage >= totalPages - 1) start = totalPages - 2;
            for (let i = start; i <= end; i++) pageNumbers.push(i);
            if (currentPage < totalPages - 2) pageNumbers.push('...');
            pageNumbers.push(totalPages);
        }

        pageNumbers.forEach(num => {
            if (num === '...') {
                const span = document.createElement('span');
                span.className = 'paginationDots';
                span.textContent = '...';
                controlsDiv.appendChild(span);
            } else {
                const button = document.createElement('button');
                button.className = 'paginationBtn';
                button.textContent = num;
                if (num === currentPage) button.classList.add('active');
                button.addEventListener('click', () => {
                    if (containerId.includes('slots')) currentPages.slots = num;
                    if (containerId.includes('vehicleIn')) currentPages.vehicleIn = num;
                    if (containerId.includes('history')) currentPages.history = num;
                    performFilterAndSearch();
                });
                controlsDiv.appendChild(button);
            }
        });

        const nextButton = document.createElement('button');
        nextButton.className = 'paginationBtn';
        nextButton.innerHTML = '&gt;';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (containerId.includes('slots')) currentPages.slots++;
            if (containerId.includes('vehicleIn')) currentPages.vehicleIn++;
            if (containerId.includes('history')) currentPages.history++;
            performFilterAndSearch();
        });
        controlsDiv.appendChild(nextButton);
        paginationContainer.appendChild(controlsDiv);
    }

    // ========================================================
    // SORTING & PARSING LOGIC
    // ========================================================
    
    /**
     * Parses "YYYY-MM-DD / H:MM AM/PM" format
     */
    function parseDateWhen(dateStr, defaultVal) {
        if (!dateStr) return defaultVal;
        try {
            return new Date(dateStr.replace(' / ', ' ')).getTime();
        } catch (e) {
            return defaultVal;
        }
    }

    /**
     * Parses "YYYY-MM-DD" and "H:MM AM/PM" from vehicleIn table
     */
    function parseVehicleInDate(dateStr, timeStr) {
        if (!dateStr || !timeStr) return null;
        try {
            // Creates a date object from "2025-11-15 6:30 AM"
            return new Date(`${dateStr} ${timeStr}`).getTime();
        } catch (e) {
            return null;
        }
    }

    function sortData(data, column, direction) {
        data.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            // --- NEW: Handle combined EntryTime/EntryDate for vehicleIn ---
            if (column === 'EntryTime' && a.EnterDate) {
                valA = parseVehicleInDate(a.EnterDate, a.EntryTime);
                valB = parseVehicleInDate(b.EnterDate, b.EntryTime);
            } 
            // --- End New ---

            else if (column === 'available' || column === 'occupied' || column === 'total') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            }

            if (typeof valA === 'string') {
                // Check for 'YYYY-MM-DD HH:MM:SS' (from history Entry/ExitDateTime)
                if (valA && valA.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) { 
                    valA = new Date(valA).getTime();
                    valB = valB ? new Date(valB).getTime() : null;
                } 
                // Check for 'YYYY-MM-DD / H:MM AM/PM' (old format, fallback)
                else if (valA && valA.match(/^\d{4}-\d{2}-\d{2} \/ \d{1,2}:\d{2} [AP]M$/)) {
                    valA = parseDateWhen(valA, null); 
                    valB = parseDateWhen(valB, null);
                }
                // Default string sort
                else {
                    valA = (valA || "").toLowerCase();
                    valB = (valB || "").toLowerCase();
                }
            }
            
            if (typeof valA === 'number') {
                valA = valA || 0;
                valB = valB || 0;
            }

            if (valA === null || valA === undefined) valA = direction === 'asc' ? Infinity : -Infinity;
            if (valB === null || valB === undefined) valB = direction === 'asc' ? Infinity : -Infinity;

            let comparison = 0;
            if (valA > valB) {
                comparison = 1;
            } else if (valA < valB) {
                comparison = -1;
            }

            return direction === 'asc' ? comparison : -comparison;
        });
    }

    function updateSortHeaders(tabId, { column, direction }) {
        const tab = document.getElementById(tabId);
        if (!tab) return;
        
        tab.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        let selector = `th[data-sort="${column}"]`;

        // --- REVISED: Link EntryDate and EntryTime headers ---
        if (column === 'EntryTime' || column === 'EntryDate') {
            selector = 'th[data-sort="EntryTime"], th[data-sort="EntryDate"]';
        }
        // --- End Revised ---

        tab.querySelectorAll(selector).forEach(th => {
            th.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
        });
    }

    // ========================================================
    // FILTER & SORT GETTERS (NEW DRY SECTION)
    // ========================================================

    function getFilteredDashboard() {
        const filterArea = document.getElementById('areaFilterDashboard').value;
        return dashboardTableData
            .filter(area => filterArea === "all" || area.AreaName === filterArea);
    }

    function getFilteredSlots() {
        const filterArea = document.getElementById('areaFilterSlots').value;
        const filterStatus = document.getElementById('statusFilterSlots').value;
        const searchTerm = document.getElementById('searchSlots').value.toLowerCase();
        
        return slotsData
            .filter(s => filterArea === "all" || s.AreaName.includes(filterArea))
            .filter(s => filterStatus === "all" || s.Status === filterStatus)
            .filter(s => !searchTerm || s.SlotName.toLowerCase().includes(searchTerm));
    }

    function getFilteredVehiclesIn() {
        const filterArea = document.getElementById('areaFilterVehicleIn').value;
        const searchTerm = document.getElementById('searchVehicleIn').value.toLowerCase();
        
        return vehiclesInData
            .filter(s => filterArea === "all" || s.AreaName === filterArea) 
            .filter(s => !searchTerm || 
                (s.GuestName && s.GuestName.toLowerCase().includes(searchTerm)) ||
                (s.PlateNumber && s.PlateNumber.toLowerCase().includes(searchTerm)) ||
                (s.RoomNumber && s.RoomNumber.toLowerCase().includes(searchTerm))
            );
    }

    function getFilteredHistory() {
        const filterArea = document.getElementById('areaFilterHistory').value;
        const searchTerm = document.getElementById('searchHistory').value.toLowerCase();
        
        return historyData
            .filter(v => filterArea === "all" || v.AreaName === filterArea) 
            .filter(v => !searchTerm || 
                (v.GuestName && v.GuestName.toLowerCase().includes(searchTerm)) ||
                (v.PlateNumber && v.PlateNumber.toLowerCase().includes(searchTerm)) ||
                (v.RoomNumber && v.RoomNumber.toLowerCase().includes(searchTerm))
            );
    }

    // ========================================================
    // SEARCH, FILTER & DATA LOADING (REFACTORED)
    // ========================================================
    async function performFilterAndSearch() {
        
        const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');

        if (activeTab === 'dashboard') {
            // Use cache if available
            if (dashboardTableData.length === 0) {
                const data = await fetchAPI('getDashboardData');
                if (!data || !data.table) {
                    renderDashboard({ cards: {}, table: [] });
                    return;
                }
                dashboardTableData = data.table; 
            }
            
            let filteredData = getFilteredDashboard();
            const newCardTotals = filteredData.reduce((acc, area) => {
                acc.occupied += parseFloat(area.occupied) || 0;
                acc.available += parseFloat(area.available) || 0;
                acc.total += parseFloat(area.total) || 0;
                return acc;
            }, { occupied: 0, available: 0, total: 0 });
            
            const { column, direction } = sortState.dashboard;
            sortData(filteredData, column, direction);
            renderDashboard({ cards: newCardTotals, table: filteredData });
        
        } else if (activeTab === 'slots') {
            // Use cache if available
            if (slotsData.length === 0) { 
                const data = await fetchAPI('getAllSlots');
                if (!data) {
                    renderSlots([]);
                    return;
                }
                slotsData = data.slots;
            }
            
            let filteredData = getFilteredSlots();
            const { column, direction } = sortState.slots;
            sortData(filteredData, column, direction);
            renderSlots(filteredData);

        } else if (activeTab === 'vehicleIn') {
            // Use cache if available
            if (vehiclesInData.length === 0) {
                const data = await fetchAPI('getVehiclesIn');
                if (!data) {
                    renderVehicleIn([]);
                    return;
                }
                vehiclesInData = data.vehicles;
            }

            let filteredData = getFilteredVehiclesIn();
            const { column, direction } = sortState.vehicleIn;
            sortData(filteredData, column, direction);
            renderVehicleIn(filteredData);

        } else if (activeTab === 'history') {
            // Use cache if available
            if (historyData.length === 0) {
                const data = await fetchAPI('getHistory');
                if (!data) {
                    renderHistory([]);
                    return;
                }
                historyData = data.history;
            }
            
            let filteredData = getFilteredHistory();
            const { column, direction } = sortState.history;
            sortData(filteredData, column, direction);
            renderHistory(filteredData);
        }
    }

    // ========================================================
    // REFRESH & LOAD DROPDOWNS
    // ========================================================
    
    // This function loads the two dropdowns in the "Enter Vehicle" modal
    async function loadEnterVehicleDropdowns() {
        const typeSelect = document.getElementById('vehicleType');
        const categorySelect = document.getElementById('categorySelect');
        const currentType = typeSelect.value; // Store current selection
        
        typeSelect.innerHTML = '<option value="">Loading...</option>';
        categorySelect.innerHTML = '<option value="">Select vehicle type first...</option>';
        
        const data = await fetchAPI('getVehicleTypes');
        if (data && data.types) {
            typeSelect.innerHTML = '<option value="">Select</option>';
            data.types.forEach(type => {
                typeSelect.innerHTML += `<option value="${type.VehicleTypeID}">${type.TypeName}</option>`;
            });
            typeSelect.value = currentType; // Re-select old value if still valid
        }
    }

    // This function reloads ALL dropdowns and lists related to types/categories
    async function refreshAllParkingDropdowns() {
        // 1. Refresh "Enter Vehicle" modal dropdowns
        await loadEnterVehicleDropdowns();
        
        // 2. Refresh "Manage Types" modal list
        await loadVehicleTypesList();
        
        // 3. Refresh "Manage Categories" modal dropdown
        await loadVehicleTypesDropdownForManager();
        
        // 4. Clear the categories list (it will reload on type select)
        categoriesListContainer.innerHTML = '<p style="text-align:center; color: #777;">Please select a vehicle type above.</p>';
    }

    // ========================================================
    // EVENT LISTENERS (SPECIFIC TO PARKING)
    // ========================================================

    // Listener for the "Vehicle Type" dropdown in the "Enter Vehicle" modal
    document.getElementById('vehicleType').addEventListener('change', async (e) => {
        const vehicleTypeID = e.target.value;
        const categorySelect = document.getElementById('categorySelect');
        if (!vehicleTypeID) {
            categorySelect.innerHTML = '<option value="">Select vehicle type first...</option>';
            return;
        }
        categorySelect.innerHTML = '<option value="">Loading...</option>';
        const data = await fetchAPI('getVehicleCategories', {}, `vehicleTypeID=${vehicleTypeID}`);
        if (data && data.categories) {
            categorySelect.innerHTML = '<option value="">Select</option>';
            data.categories.forEach(cat => {
                categorySelect.innerHTML += `<option value="${cat.VehicleCategoryID}">${cat.CategoryName}</option>`;
            });
        }
    });


    function setupParkingListeners() {
        // Filter/Search Listeners
        document.querySelectorAll('.filterDropdown').forEach(el => {
            el.addEventListener('change', () => {
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                // --- FIXED: Clear all caches on filter change ---
                slotsData = [];
                vehiclesInData = [];
                historyData = [];
                dashboardTableData = [];
                // --- End Fixed ---
                performFilterAndSearch();
            });
        });

        document.querySelectorAll('.searchInput').forEach(el => {
            el.addEventListener('input', () => {
                const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                
                // --- REFACTORED: Use new getter functions ---
                if (activeTab === 'slots') {
                    let filtered = getFilteredSlots();
                    sortData(filtered, sortState.slots.column, sortState.slots.direction);
                    renderSlots(filtered);
                }
                if (activeTab === 'vehicleIn') {
                    let filtered = getFilteredVehiclesIn();
                    sortData(filtered, sortState.vehicleIn.column, sortState.vehicleIn.direction);
                    renderVehicleIn(filtered);
                }
                if (activeTab === 'history') {
                    let filtered = getFilteredHistory();
                    sortData(filtered, sortState.history.column, sortState.history.direction);
                    renderHistory(filtered);
                }
                // --- End Refactored ---
            });
        });
        
        // Refresh Buttons
        document.querySelectorAll('.refreshBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const controlsRow = btn.closest('.controlsRow');
                controlsRow.querySelectorAll('.filterDropdown').forEach(sel => sel.value = 'all');
                controlsRow.querySelectorAll('.searchInput').forEach(inp => inp.value = '');
                
                // --- FIXED: Clear all caches on refresh ---
                slotsData = []; 
                vehiclesInData = [];
                historyData = [];
                dashboardTableData = []; 
                // --- End Fixed ---

                performFilterAndSearch();
                showToast('Data refreshed!');
            });
        });

        // Download History Button
        const downloadBtn = document.getElementById('downloadBtnHistory');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                // Use getter to ensure filters are applied
                let filteredData = getFilteredHistory();
                
                const { column, direction } = sortState.history;
                sortData(filteredData, column, direction);

                if (filteredData.length === 0) {
                    showToast('No data to download.', 'error');
                    return;
                }

                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    doc.setFontSize(18);
                    doc.text("Parking History Report", 14, 22);
                    doc.setFontSize(11);
                    doc.setTextColor(100);
                    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
                    
                    const head = [[
                        'Slot', 'Plate #', 'Room', 'Name', 
                        'Vehicle Type', 'Category', 'Parking Time', 'Entry', 'Exit'
                    ]];
                    const body = filteredData.map(v => [
                        v.SlotName, v.PlateNumber, v.RoomNumber, v.GuestName,
                        v.VehicleType, v.VehicleCategory, v.ParkingTime,
                        v.EntryDateTime, v.ExitDateTime
                    ]);

                    doc.autoTable({
                        head: head, body: body, startY: 35,
                        headStyles: { fillColor: [72, 12, 27] }, // #480c1b
                        styles: { fontSize: 8, cellPadding: 2 },
                        alternateRowStyles: { fillColor: [245, 245, 245] },
                        // --- FIXED columnStyles ---
                        columnStyles: {
                            0: { cellWidth: 15 }, // Slot
                            1: { cellWidth: 20 }, // Plate #
                            2: { cellWidth: 12 }, // Room
                            3: { cellWidth: 20 }, // Name
                            4: { cellWidth: 25 }, // Vehicle Type
                            5: { cellWidth: 20 }, // Category
                            6: { cellWidth: 20 }, // Parking Time
                            7: { cellWidth: 30 }, // Entry
                            8: { cellWidth: 30 }  // Exit
                        }
                    });
                    doc.save('Parking-History-Report.pdf');
                } catch (e) {
                    console.error("Error generating PDF:", e);
                    showToast('Error generating PDF. See console.', 'error');
                }
            });
        }
        
        // Download Active (Vehicle In) Report Button
        const downloadBtnActive = document.getElementById('downloadBtnActive');
        if (downloadBtnActive) {
            downloadBtnActive.addEventListener('click', () => {
                // Use getter to ensure filters are applied
                let filteredData = getFilteredVehiclesIn();
                
                const { column, direction } = sortState.vehicleIn; 
                sortData(filteredData, column, direction);

                if (filteredData.length === 0) {
                    showToast('No data to download.', 'error');
                    return;
                }

                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    
                    doc.setFontSize(18);
                    doc.text("Active Parking Report", 14, 22); 
                    doc.setFontSize(11);
                    doc.setTextColor(100);
                    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

                    const head = [[
                        'Slot Number', 'Plate #', 'Room', 'Name',
                        'Vehicle Type', 'Category', 'Enter Time', 'Enter Date'
                    ]];
                    
                    const body = filteredData.map(v => [
                        v.SlotName, v.PlateNumber, v.RoomNumber, v.GuestName,
                        v.VehicleType, v.VehicleCategory, v.EnterTime, v.EnterDate 
                    ]);

                    doc.autoTable({
                        head: head, body: body, startY: 35,
                        headStyles: { fillColor: [72, 12, 27] }, // #480c1b
                        styles: { fontSize: 8, cellPadding: 2 },
                        alternateRowStyles: { fillColor: [245, 245, 245] },
                        // --- FIXED columnStyles ---
                        columnStyles: {
                            0: { cellWidth: 15 }, // Slot
                            1: { cellWidth: 20 }, // Plate #
                            2: { cellWidth: 12 }, // Room
                            3: { cellWidth: 33 }, // Name
                            4: { cellWidth: 25 }, // Vehicle Type
                            5: { cellWidth: 25 }, // Category
                            6: { cellWidth: 25 }, // Enter Time
                            7: { cellWidth: 25 }  // Enter Date
                        }
                    });
                    
                    doc.save('Active-Parking-Report.pdf'); 
                } catch (e) {
                    console.error("Error generating PDF:", e);
                    showToast('Error generating PDF. See console.', 'error');
                }
            });
        }
        
        // === Enter/Exit Vehicle Logic ===
        
        document.body.addEventListener('click', (e) => {
            const enterButton = e.target.closest('.btn-enter');
            if (enterButton) {
                currentSlotID = enterButton.dataset.slotId;
                currentSlotName = enterButton.dataset.slotName;
                document.getElementById('slotNumberTitle').textContent = currentSlotName;
                document.getElementById('enter-vehicle-form').reset();
                loadEnterVehicleDropdowns(); // Load dropdowns for this modal
                showModal(document.getElementById('enterVehicleModal'));
            }
        });
        
        const enterVehicleForm = document.getElementById('enter-vehicle-form');
        if (enterVehicleForm) {
            enterVehicleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!document.getElementById('guestName').value || !document.getElementById('plateNumber').value || !document.getElementById('vehicleType').value || !document.getElementById('categorySelect').value) {
                    showToast('Please fill out all required fields.', 'error');
                    return;
                }
                hideModal(document.getElementById('enterVehicleModal'));
                showModal(document.getElementById('confirmModal'));
            });
        }
        
        const btnConfirmEnter = document.getElementById('btnConfirmEnter');
        if (btnConfirmEnter) {
            btnConfirmEnter.addEventListener('click', async () => {
                
                const formData = new FormData();
                formData.append('action', 'enterVehicle');
                formData.append('slotID', currentSlotID);
                formData.append('plateNumber', document.getElementById('plateNumber').value.toUpperCase());
                formData.append('guestName', document.getElementById('guestName').value);
                formData.append('roomNumber', document.getElementById('roomNumber').value);
                formData.append('vehicleTypeID', document.getElementById('vehicleType').value);
                formData.append('vehicleCategoryID', document.getElementById('categorySelect').value);

                const result = await fetchAPI('enterVehicle', {
                    method: 'POST',
                    body: formData
                });
                hideModal(document.getElementById('confirmModal'));
                if (result && result.success) {
                    showModal(document.getElementById('successModal'));
                    showToast(result.message || 'Vehicle parked successfully!');
                    // --- FIXED: Clear all caches ---
                    slotsData = []; 
                    vehiclesInData = [];
                    historyData = [];
                    dashboardTableData = [];
                    performFilterAndSearch();
                }
                currentSlotID = null;
                currentSlotName = null;
            });
        }

        document.body.addEventListener('click', (e) => {
            const exitButton = e.target.closest('.exit-btn');
            if (exitButton) {
                currentSlotID = exitButton.dataset.slotId;
                currentSessionID = exitButton.dataset.sessionId;
                const vehicle = vehiclesInData.find(v => v.SessionID === currentSessionID);
                if (!vehicle) return; 
                document.getElementById('exitSlotNumber').textContent = vehicle.SlotName;
                document.getElementById('exitPlate').textContent = vehicle.PlateNumber;
                document.getElementById('exitVehicle').textContent = vehicle.VehicleCategory;
                document.getElementById('exitDateTime').textContent = vehicle.EnterDate + ' / ' + vehicle.EnterTime;
                showModal(document.getElementById('exitModal'));
            }
        });

        const btnConfirmExit = document.getElementById('btnConfirmExit');
        if (btnConfirmExit) {
            btnConfirmExit.addEventListener('click', async () => {
                if (!currentSlotID || !currentSessionID) return;
                const formData = new FormData();
                formData.append('action', 'exitVehicle');
                formData.append('sessionID', currentSessionID);
                formData.append('slotID', currentSlotID);
                const result = await fetchAPI('exitVehicle', {
                    method: 'POST',
                    body: formData
                });
                hideModal(document.getElementById('exitModal'));
                if (result && result.success) {
                    showToast(result.message || 'Vehicle exited successfully!');
                    // --- FIXED: Clear all caches ---
                    slotsData = [];
                    vehiclesInData = [];
                    historyData = [];
                    dashboardTableData = [];
                    performFilterAndSearch();
                }
                currentSlotID = null;
                currentSessionID = null;
            });
        }
    }
    
    // ========================================================
    // === NEW LISTENERS FOR MANAGEMENT MODALS ===
    // ========================================================
    
    // --- 1. Manage Types Modal ---
    openTypesModalBtn.addEventListener('click', () => {
        showModal(manageTypesModal);
        loadVehicleTypesList();
    });

    async function loadVehicleTypesList() {
        typesListContainer.innerHTML = '<div class="spinner"></div>';
        const data = await fetchAPI('getVehicleTypes');
        if (!data || !data.types) {
            typesListContainer.innerHTML = '<p>Error loading types.</p>';
            return;
        }
        if (data.types.length === 0) {
            typesListContainer.innerHTML = '<p style="text-align:center; color: #777;">No vehicle types found. Add one above.</p>';
            return;
        }
        typesListContainer.innerHTML = data.types.map(type => `
            <div class="category-list-item" data-id="${type.VehicleTypeID}" data-name="${type.TypeName}">
                <span class="category-name">${escapeHTML(type.TypeName)}</span>
                <div class="category-actions">
                    <button class="btn-icon btn-edit-category" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-icon btn-delete-category" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join('');
    }
    
    addNewTypeBtn.addEventListener('click', async () => {
        const name = newTypeNameInput.value.trim();
        if (!name) {
            showToast('Please enter a type name.', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('TypeName', name);
        
        const result = await fetchAPI('addVehicleType', { method: 'POST', body: formData });
        if (result && result.success) {
            showToast(result.message);
            newTypeNameInput.value = '';
            refreshAllParkingDropdowns(); // This will also reload the list
        }
    });

    typesListContainer.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-category');
        const deleteBtn = e.target.closest('.btn-delete-category');
        const item = e.target.closest('.category-list-item');
        if (!item) return;

        const id = item.dataset.id;
        const name = item.dataset.name;
        
        if (editBtn) {
            openEditNameModal('vehicleType', id, name);
        }
        
        if (deleteBtn) {
            if (!confirm(`Are you sure you want to delete "${name}"?\nThis cannot be undone.`)) {
                return;
            }
            const formData = new FormData();
            formData.append('TypeID', id);
            const result = await fetchAPI('deleteVehicleType', { method: 'POST', body: formData });
            if (result && result.success) {
                showToast(result.message);
                refreshAllParkingDropdowns();
            }
        }
    });

    // --- 2. Manage Categories Modal ---
    openCategoriesModalBtn.addEventListener('click', () => {
        showModal(manageCategoriesModal);
        loadVehicleTypesDropdownForManager();
        categoriesListContainer.innerHTML = '<p style="text-align:center; color: #777;">Please select a vehicle type above.</p>';
    });
    
    async function loadVehicleTypesDropdownForManager() {
        categoryManagerTypeSelect.innerHTML = '<option value="">Loading...</option>';
        const data = await fetchAPI('getVehicleTypes');
        if (data && data.types) {
            categoryManagerTypeSelect.innerHTML = '<option value="">Select a Vehicle Type</option>';
            data.types.forEach(type => {
                categoryManagerTypeSelect.innerHTML += `<option value="${type.VehicleTypeID}">${type.TypeName}</option>`;
            });
        }
    }
    
    categoryManagerTypeSelect.addEventListener('change', () => {
        const typeID = categoryManagerTypeSelect.value;
        if (!typeID) {
            categoriesListContainer.innerHTML = '<p style="text-align:center; color: #777;">Please select a vehicle type above.</p>';
            return;
        }
        loadVehicleCategoriesList(typeID);
    });

    async function loadVehicleCategoriesList(typeID) {
        categoriesListContainer.innerHTML = '<div class="spinner"></div>';
        const data = await fetchAPI('getVehicleCategories', {}, `vehicleTypeID=${typeID}`);
        if (!data || !data.categories) {
            categoriesListContainer.innerHTML = '<p>Error loading categories.</p>';
            return;
        }
        if (data.categories.length === 0) {
            categoriesListContainer.innerHTML = '<p style="text-align:center; color: #777;">No categories found for this type. Add one above.</p>';
            return;
        }
        categoriesListContainer.innerHTML = data.categories.map(cat => `
            <div class="category-list-item" data-id="${cat.VehicleCategoryID}" data-name="${cat.CategoryName}">
                <span class="category-name">${escapeHTML(cat.CategoryName)}</span>
                <div class="category-actions">
                    <button class="btn-icon btn-edit-category" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-icon btn-delete-category" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join('');
    }
    
    addNewCategoryBtn.addEventListener('click', async () => {
        const typeID = categoryManagerTypeSelect.value;
        const name = newCategoryNameInput.value.trim();
        if (!typeID) {
            showToast('Please select a vehicle type first.', 'error');
            return;
        }
        if (!name) {
            showToast('Please enter a category name.', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('VehicleTypeID', typeID);
        formData.append('CategoryName', name);
        
        const result = await fetchAPI('addVehicleCategory', { method: 'POST', body: formData });
        if (result && result.success) {
            showToast(result.message);
            newCategoryNameInput.value = '';
            await loadVehicleCategoriesList(typeID); // Reload just this list
            await refreshAllParkingDropdowns(); // Reload all other dropdowns
        }
    });

    categoriesListContainer.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-category');
        const deleteBtn = e.target.closest('.btn-delete-category');
        const item = e.target.closest('.category-list-item');
        if (!item) return;

        const id = item.dataset.id;
        const name = item.dataset.name;
        
        if (editBtn) {
            openEditNameModal('vehicleCategory', id, name);
        }
        
        if (deleteBtn) {
            if (!confirm(`Are you sure you want to delete "${name}"?\nThis cannot be undone.`)) {
                return;
            }
            const formData = new FormData();
            formData.append('CategoryID', id);
            const result = await fetchAPI('deleteVehicleCategory', { method: 'POST', body: formData });
            if (result && result.success) {
                showToast(result.message);
                const typeID = categoryManagerTypeSelect.value;
                await loadVehicleCategoriesList(typeID); // Reload just this list
                await refreshAllParkingDropdowns(); // Reload all other dropdowns
            }
        }
    });

    // --- 3. Generic Edit Name Modal ---
    function openEditNameModal(type, id, name) {
        editTypeInput.value = type; // 'vehicleType' or 'vehicleCategory'
        editIdInput.value = id;
        editNameInput.value = name;
        editNameTitle.textContent = `Edit ${type === 'vehicleType' ? 'Type' : 'Category'} Name`;
        showModal(editNameModal);
    }
    
    editNameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editIdInput.value;
        const type = editTypeInput.value;
        const name = editNameInput.value.trim();
        
        if (!name) {
            showToast('Name cannot be empty.', 'error');
            return;
        }

        let action = '';
        const formData = new FormData();
        
        if (type === 'vehicleType') {
            action = 'updateVehicleType';
            formData.append('TypeID', id);
            formData.append('TypeName', name);
        } else if (type === 'vehicleCategory') {
            action = 'updateVehicleCategory';
            formData.append('CategoryID', id);
            formData.append('CategoryName', name);
        } else {
            return; // Should not happen
        }

        const result = await fetchAPI(action, { method: 'POST', body: formData });
        if (result && result.success) {
            showToast(result.message);
            hideModal(editNameModal);
            refreshAllParkingDropdowns(); // Reload everything
        }
    });


    // ========================================================
    // SORTING EVENT LISTENERS (REFACTORED)
    // ========================================================
    function setupSortListeners() {
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                let column = th.dataset.sort;
                const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');
                if (!sortState[activeTab]) return;

                // --- NEW: Consolidate EntryDate/EntryTime clicks ---
                if (column === 'EntryDate') {
                    column = 'EntryTime'; // Consolidate to 'EntryTime' for sorting
                }
                // --- End New ---
                
                const currentSort = sortState[activeTab];
                let direction = 'asc';
                if (currentSort.column === column) {
                    direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                }
                sortState[activeTab] = { column, direction };
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                
                // --- REFACTORED: Simplified sorting ---
                const filterAndSortData = (tab) => {
                    let filteredData = [];
                    if (tab === 'dashboard') {
                        filteredData = getFilteredDashboard();
                        const newCardTotals = filteredData.reduce((acc, area) => {
                            acc.occupied += parseFloat(area.occupied) || 0;
                            acc.available += parseFloat(area.available) || 0;
                            acc.total += parseFloat(area.total) || 0;
                            return acc;
                        }, { occupied: 0, available: 0, total: 0 });
                        sortData(filteredData, column, direction);
                        renderDashboard({ cards: newCardTotals, table: filteredData });
                    
                    } else if (tab === 'slots') {
                        filteredData = getFilteredSlots();
                        sortData(filteredData, column, direction);
                        renderSlots(filteredData);
                    
                    } else if (tab === 'vehicleIn') {
                        filteredData = getFilteredVehiclesIn();
                        sortData(filteredData, column, direction);
                        renderVehicleIn(filteredData);
                    
                    } else if (tab === 'history') {
                        filteredData = getFilteredHistory();
                        sortData(filteredData, column, direction);
                        renderHistory(filteredData);
                    }
                };
                // --- End Refactored ---

                filterAndSortData(activeTab);
            });
        });
    }
    
    // ========================================================
    // Parking Selection for Rooms
    // ========================================================
async function loadGuestRoomsDropdown() {
    const roomSelect = document.getElementById('roomNumber');
    if (!roomSelect) return; // Safety check

    roomSelect.innerHTML = '<option value="">Loading rooms...</option>';
    
    // Calls the 'getGuests' endpoint (which now returns only room numbers)
    const data = await fetchAPI('getGuests'); 
    
    // Check for 'data.rooms'
    if (data && data.rooms && data.rooms.length > 0) {
        roomSelect.innerHTML = '<option value="">Select Room</option>';
        
        data.rooms.forEach(room => {
            const roomNumber = room.room_num; 
            
            if (roomNumber) {
                roomSelect.innerHTML += `<option value="${escapeHTML(roomNumber)}">
                    ${escapeHTML(roomNumber)}
                </option>`;
            }
        });
    } else {
        // Fallback if no rooms are found or API fails
        roomSelect.innerHTML = '<option value="">No rooms found</option>';
        roomSelect.innerHTML += '<option value="WALK-IN">Walk-in / Other</option>';
    }
}

    // ========================================================
    // INITIALIZE ON PAGE LOAD
    // ========================================================
    
    async function loadFilterDropdowns() {
        const data = await fetchAPI('getParkingAreas');
        if (data && data.areas) {
            const areaFilterOptions = data.areas.map(a => `<option value="${a.AreaName}">${a.AreaName}</option>`).join('');
            const allAreaFilters = document.querySelectorAll('.filterDropdown[id^="areaFilter"]');
            allAreaFilters.forEach(select => {
                select.innerHTML = `<option value="all">All Areas</option>${areaFilterOptions}`;
            });
        }
    }
    
    function initializeApp() {
        setupUIListeners();
        setupParkingListeners();
        setupSortListeners(); 
        
        // Attach sanitization listener to all relevant inputs
        document.querySelectorAll('.sanitize-on-paste').forEach(input => {
            input.addEventListener('paste', sanitizeOnPaste);
        });

        loadFilterDropdowns();
        performFilterAndSearch();
        loadGuestRoomsDropdown()
    }
    
    initializeApp();
});