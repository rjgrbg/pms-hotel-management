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
    
    // Fallback if PHP injection fails
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
        slots: { column: 'Status', direction: 'asc' }, // CHANGED: Default sort by Status to show Available first
        vehicleIn: { column: 'EntryTime', direction: 'desc' },
        history: { column: 'ExitDateTime', direction: 'desc' }
    };

    // Global variable to track which vehicle/slot is being actioned
    let currentSlotID = null;
    let currentSlotName = null;
    let currentSessionID = null;
    
    // === DOM Elements for Management Modals ===
    
    // Area Management Elements
    const btnManageAreas = document.getElementById('btnManageAreas');
    const manageAreasModal = document.getElementById('manageAreasModal');
    const areaListContainer = document.getElementById('areaListContainer');
    const btnSaveNewArea = document.getElementById('btnSaveNewArea');
    const editAreaModal = document.getElementById('editAreaModal');
    const editAreaForm = document.getElementById('editAreaForm');

    // Slot Management Elements
    const btnAddSlot = document.getElementById('btnAddSlot');
    const manageSlotModal = document.getElementById('manageSlotModal');
    const slotForm = document.getElementById('slotForm');

    // Existing Type/Category Management Elements
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

    function createFormData(obj) {
        const fd = new FormData();
        for(const key in obj) fd.append(key, obj[key]);
        return fd;
    }


    // ========================================================
    // UTILITY & HELPER FUNCTIONS
    // ========================================================
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
            toast.classList.add('show');
            toast.style.opacity = '1';
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            toast.style.opacity = '0';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
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
        let paste = (e.clipboardData || window.clipboardData).getData('text');
        let sanitized = paste.replace(/[^a-zA-Z0-9\s.,#-]/g, '');
        e.preventDefault();
        document.execCommand('insertText', false, sanitized);
    }

    // ========================================================
    // UI (TABS, MODALS, SIDEBAR)
    // ========================================================
    const showModal = (modal) => {
        if (modal) {
            if (modal.classList.contains('modal-overlay') || 
                modal.classList.contains('modal-overlay-confirm') || 
                modal.classList.contains('modal-overlay-success')) {
                modal.classList.add('show-modal');
            } else if (modal.classList.contains('modalBackdrop')) {
                modal.style.display = 'flex';
            }
        }
    };
    
    const hideModal = (modal) => {
        if (modal) {
            if (modal.classList.contains('modal-overlay') || 
                modal.classList.contains('modal-overlay-confirm') || 
                modal.classList.contains('modal-overlay-success')) {
                modal.classList.remove('show-modal');
            } else if (modal.classList.contains('modalBackdrop')) {
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
                if(e.target.id === 'edit-category-name-cancel-btn') {
                        e.preventDefault(); 
                }
                const modal = e.target.closest('.modal-overlay, .modal-overlay-confirm, .modal-overlay-success, .modalBackdrop');
                if (modal) hideModal(modal);
            });
        });
        
        document.querySelectorAll('.modal-overlay, .modal-overlay-confirm, .modal-overlay-success').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    hideModal(overlay);
                }
            });
        });
    }

    // ========================================================
    // RENDER FUNCTIONS
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
            const statusClass = isFull ? 'occupied' : 'available';
            const statusText = isFull ? 'Full' : 'Available';
            return `
                <tr class="${isFull ? 'full-row' : ''}">
                    <td>${escapeHTML(area.AreaName)}</td>
                    <td>${isFull ? '-' : area.available}</td>
                    <td>${area.occupied}</td>
                    <td>${area.total}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
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
            const safeArea = escapeHTML(slot.AreaName);
            const safeSlot = escapeHTML(slot.SlotName);
            const safeVehicle = escapeHTML(slot.AllowedVehicle);
            const safeId = escapeHTML(slot.SlotID);
            const safeStatusClass = escapeHTML(slot.Status);
            const isArchived = parseInt(slot.is_archived) === 1;
            const isOccupied = slot.Status.toLowerCase() === 'occupied';

            // Define Action Buttons based on Archive Status
            let dropdownMenu = '';

            if (isArchived) {
                // RESTORE OPTION
                dropdownMenu = `
                    <div class="dropdown-menu">
                        <button class="dropdown-item btn-restore-slot" data-id="${safeId}">
                            <i class="fas fa-trash-restore"></i> Restore
                        </button>
                    </div>
                `;
            } else {
                // ENTER, EDIT, and ARCHIVE OPTIONS
                const isAvailable = slot.Status === 'available';
                const enterDisabled = !isAvailable ? 'disabled' : '';
                const editDisabled = isOccupied ? 'disabled' : '';
                const archiveDisabled = isOccupied ? 'disabled' : '';
                
                dropdownMenu = `
                    <div class="dropdown-menu">
                        <button class="dropdown-item btn-enter" data-slot-id="${safeId}" data-slot-name="${safeSlot}" ${enterDisabled}>
                            <i class="fas fa-car-side"></i> Enter Vehicle
                        </button>
                        <button class="dropdown-item btn-edit-slot" data-id="${safeId}" ${editDisabled}>
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="dropdown-item delete btn-archive-slot" data-id="${safeId}" ${archiveDisabled}>
                            <i class="fas fa-archive"></i> Archive
                        </button>
                    </div>
                `;
            }

            const rowClass = isArchived ? 'archived-slot' : '';

            return `
                <tr class="${rowClass}">
                    <td>${safeArea}</td>
                    <td>${safeSlot}</td>
                    <td>${safeVehicle}</td>
                    <td>
                        <span class="status-badge status-${safeStatusClass}">
                            ${slot.Status === 'available' ? 'Available' : 'Occupied'}
                        </span>
                    </td>
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
            return `
                <tr>
                    <td>${escapeHTML(vehicle.SlotName)}</td>
                    <td>${escapeHTML(vehicle.PlateNumber)}</td>
                    <td>${escapeHTML(vehicle.RoomNumber)}</td>
                    <td>${escapeHTML(vehicle.GuestName)}</td>
                    <td>${escapeHTML(vehicle.VehicleType)}</td>
                    <td>${escapeHTML(vehicle.VehicleCategory)}</td>
                    <td>${escapeHTML(vehicle.EnterTime)}</td>
                    <td>${escapeHTML(vehicle.EnterDate)}</td>
                    <td>
                        <button class="exit-btn" data-slot-id="${escapeHTML(vehicle.SlotID)}" data-session-id="${escapeHTML(vehicle.SessionID)}">
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
            return `
                <tr>
                    <td>${escapeHTML(vehicle.SlotName)}</td>
                    <td>${escapeHTML(vehicle.PlateNumber)}</td>
                    <td>${escapeHTML(vehicle.RoomNumber)}</td>
                    <td>${escapeHTML(vehicle.GuestName)}</td>
                    <td>${escapeHTML(vehicle.VehicleType)}</td>
                    <td>${escapeHTML(vehicle.VehicleCategory)}</td>
                    <td>${escapeHTML(vehicle.ParkingTime)}</td>
                    <td>${escapeHTML(vehicle.EntryDateTime)}</td>
                    <td>${escapeHTML(vehicle.ExitDateTime)}</td>
                </tr>
            `;
        }).join('');
        
        updateSortHeaders('history-tab', sortState.history);
    }

    // ========================================================
    // PAGINATION
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

        // Simple Pagination Logic
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
    // SORTING & PARSING
    // ========================================================
    
    function parseDateWhen(dateStr, defaultVal) {
        if (!dateStr) return defaultVal;
        try {
            return new Date(dateStr.replace(' / ', ' ')).getTime();
        } catch (e) {
            return defaultVal;
        }
    }

    function parseVehicleInDate(dateStr, timeStr) {
        if (!dateStr || !timeStr) return null;
        try {
            return new Date(`${dateStr} ${timeStr}`).getTime();
        } catch (e) {
            return null;
        }
    }

    function sortData(data, column, direction) {
        data.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (column === 'EntryTime' && a.EnterDate) {
                valA = parseVehicleInDate(a.EnterDate, a.EntryTime);
                valB = parseVehicleInDate(b.EnterDate, b.EntryTime);
            } 
            else if (column === 'available' || column === 'occupied' || column === 'total') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            }

            if (typeof valA === 'string') {
                if (valA && valA.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) { 
                    valA = new Date(valA).getTime();
                    valB = valB ? new Date(valB).getTime() : null;
                } 
                else if (valA && valA.match(/^\d{4}-\d{2}-\d{2} \/ \d{1,2}:\d{2} [AP]M$/)) {
                    valA = parseDateWhen(valA, null); 
                    valB = parseDateWhen(valB, null);
                }
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
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;

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
        if (column === 'EntryTime' || column === 'EntryDate') {
            selector = 'th[data-sort="EntryTime"], th[data-sort="EntryDate"]';
        }

        tab.querySelectorAll(selector).forEach(th => {
            th.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
        });
    }

    // ========================================================
    // FILTER HELPERS
    // ========================================================

    function getFilteredDashboard() {
        const filterArea = document.getElementById('areaFilterDashboard').value;
        return dashboardTableData.filter(area => filterArea === "all" || area.AreaName === filterArea);
    }

    function getFilteredSlots() {
        const filterArea = document.getElementById('areaFilterSlots').value;
        const filterStatus = document.getElementById('statusFilterSlots').value;
        const searchTerm = document.getElementById('searchSlots').value.toLowerCase();
        
        return slotsData
            .filter(s => filterArea === "all" || s.AreaName.includes(filterArea))
            .filter(s => {
                const isArchived = parseInt(s.is_archived) === 1;
                if(filterStatus === 'archived') return isArchived;
                if(isArchived) return false;
                return filterStatus === "all" || s.Status === filterStatus;
            })
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
    // DATA LOADING & REFRESH
    // ========================================================
    async function performFilterAndSearch() {
        const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');

        if (activeTab === 'dashboard') {
            if (dashboardTableData.length === 0) {
                // Show Loading
                const tbody = document.getElementById('dashboardTableBody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading dashboard...</td></tr>';

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
            if (slotsData.length === 0) { 
                // Show Loading
                const tbody = document.getElementById('slotsTableBody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading slots...</td></tr>';

                const data = await fetchAPI('getAllSlots');
                if (!data) { renderSlots([]); return; }
                slotsData = data.slots;
            }
            let filteredData = getFilteredSlots();
            const { column, direction } = sortState.slots;
            sortData(filteredData, column, direction);
            renderSlots(filteredData);

        } else if (activeTab === 'vehicleIn') {
            if (vehiclesInData.length === 0) {
                // Show Loading
                const tbody = document.getElementById('vehicleInTableBody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading vehicles...</td></tr>';

                const data = await fetchAPI('getVehiclesIn');
                if (!data) { renderVehicleIn([]); return; }
                vehiclesInData = data.vehicles;
            }
            let filteredData = getFilteredVehiclesIn();
            const { column, direction } = sortState.vehicleIn;
            sortData(filteredData, column, direction);
            renderVehicleIn(filteredData);

        } else if (activeTab === 'history') {
            if (historyData.length === 0) {
                // Show Loading
                const tbody = document.getElementById('historyTableBody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading history...</td></tr>';

                const data = await fetchAPI('getHistory');
                if (!data) { renderHistory([]); return; }
                historyData = data.history;
            }
            let filteredData = getFilteredHistory();
            const { column, direction } = sortState.history;
            sortData(filteredData, column, direction);
            renderHistory(filteredData);
        }
    }

    // ========================================================
    // AREA MANAGEMENT LOGIC (NEW)
    // ========================================================
    
    if(btnManageAreas) {
        btnManageAreas.addEventListener('click', () => {
            showModal(manageAreasModal);
            loadAreaList();
        });
    }

    async function loadAreaList() {
        areaListContainer.innerHTML = '<div class="spinner"></div>';
        const data = await fetchAPI('getManageAreas'); // Using dashboard data which lists active areas
        if(data && data.areas) {
            if (data.areas.length === 0) {
                areaListContainer.innerHTML = '<p style="text-align:center;">No areas found.</p>';
            } else {
                areaListContainer.innerHTML = data.areas.map(area => {
                    const isArchived = parseInt(area.is_archived) === 1;
                    const dropdownMenu = !isArchived ? `
                        <div class="dropdown-menu">
                            <button class="dropdown-item btn-edit-area" data-id="${area.AreaID}" data-name="${escapeHTML(area.AreaName)}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="dropdown-item delete btn-archive-area" data-id="${area.AreaID}" data-name="${escapeHTML(area.AreaName)}">
                                <i class="fas fa-archive"></i> Archive
                            </button>
                        </div>
                    ` : `
                        <div class="dropdown-menu">
                            <button class="dropdown-item btn-restore-area" data-id="${area.AreaID}" data-name="${escapeHTML(area.AreaName)}">
                                <i class="fas fa-trash-restore"></i> Restore
                            </button>
                        </div>
                    `;
                    
                    return `
                    <div class="category-list-item" style="${isArchived ? 'opacity:0.6;' : ''}">
                        <span class="category-name" style="${isArchived ? 'text-decoration: line-through;' : ''}">${escapeHTML(area.AreaName)}</span>
                        <div class="action-dropdown">
                            <button class="action-dots-btn" onclick="toggleActionDropdown(event)">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            ${dropdownMenu}
                        </div>
                    </div>
                `}).join('');
            }
        }
    }

    if(btnSaveNewArea) {
        btnSaveNewArea.addEventListener('click', async () => {
            const name = document.getElementById('newAreaName').value.trim();
            if(!name) return showToast('Enter area name', 'error');
            const res = await fetchAPI('addArea', { method: 'POST', body: createFormData({AreaName: name}) });
            if(res && res.success) {
                showToast(res.message);
                document.getElementById('newAreaName').value = '';
                loadAreaList();
                loadFilterDropdowns(); // Refresh dropdowns
                dashboardTableData = []; // Clear cache
                performFilterAndSearch();
            }
        });
    }

    if(areaListContainer) {
        areaListContainer.addEventListener('click', async (e) => {
            const btnEdit = e.target.closest('.btn-edit-area');
            const btnArchive = e.target.closest('.btn-archive-area');
            const btnRestore = e.target.closest('.btn-restore-area');

            if(btnEdit) {
                document.getElementById('editAreaId').value = btnEdit.dataset.id;
                document.getElementById('editAreaName').value = btnEdit.dataset.name;
                showModal(editAreaModal);
            }

            if(btnArchive) {
                if(confirm(`Archive area "${btnArchive.dataset.name}"? This will also archive all slots in it.`)) {
                    const res = await fetchAPI('archiveArea', { method: 'POST', body: createFormData({AreaID: btnArchive.dataset.id}) });
                    if(res && res.success) {
                        showToast(res.message);
                        loadAreaList();
                        loadFilterDropdowns();
                        dashboardTableData = []; // Clear cache
                        slotsData = []; // Clear slots cache as they might be archived
                        performFilterAndSearch();
                    }
                }
            }

            if(btnRestore) {
                if(confirm(`Restore area "${btnRestore.dataset.name}"?`)) {
                    const res = await fetchAPI('restoreArea', { method: 'POST', body: createFormData({AreaID: btnRestore.dataset.id}) });
                    if(res && res.success) {
                        showToast(res.message);
                        loadAreaList();
                        loadFilterDropdowns();
                        dashboardTableData = [];
                        slotsData = [];
                        performFilterAndSearch();
                    }
                }
            }
        });
    }

    if(editAreaForm) {
        editAreaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editAreaId').value;
            const name = document.getElementById('editAreaName').value;
            const res = await fetchAPI('updateArea', { method: 'POST', body: createFormData({AreaID: id, AreaName: name}) });
            if(res && res.success) {
                showToast(res.message);
                hideModal(editAreaModal);
                loadAreaList();
                loadFilterDropdowns();
                dashboardTableData = []; 
                performFilterAndSearch();
            }
        });
    }

    // ========================================================
    // SLOT MANAGEMENT LOGIC (NEW)
    // ========================================================
    
    // Add Slot Button
    if(btnAddSlot) {
        btnAddSlot.addEventListener('click', async () => {
            document.getElementById('slotModalTitle').textContent = 'Add Slot';
            document.getElementById('slotIdInput').value = '';
            document.getElementById('slotNameInput').value = '';
            await loadSlotDropdowns();
            showModal(manageSlotModal);
        });
    }

    // Delegated Edit/Archive buttons in Slots Table
    const slotsTableBody = document.getElementById('slotsTableBody');
    if(slotsTableBody) {
        slotsTableBody.addEventListener('click', async (e) => {
            const btnEdit = e.target.closest('.btn-edit-slot');
            const btnArchive = e.target.closest('.btn-archive-slot');
            const btnRestore = e.target.closest('.btn-restore-slot');

            if(btnEdit) {
                const slot = slotsData.find(s => s.SlotID == btnEdit.dataset.id);
                if(slot) {
                    document.getElementById('slotModalTitle').textContent = 'Edit Slot';
                    document.getElementById('slotIdInput').value = slot.SlotID;
                    document.getElementById('slotNameInput').value = slot.SlotName;
                    await loadSlotDropdowns();
                    // Set selected values
                    document.getElementById('slotAreaSelect').value = slot.AreaID;
                    document.getElementById('slotTypeSelect').value = slot.AllowedVehicleTypeID;
                    showModal(manageSlotModal);
                }
            }

            if(btnArchive) {
                if(confirm('Archive this slot?')) {
                    const res = await fetchAPI('archiveSlot', { method: 'POST', body: createFormData({SlotID: btnArchive.dataset.id}) });
                    if(res && res.success) {
                        showToast(res.message);
                        slotsData = []; // Clear cache
                        performFilterAndSearch();
                    }
                }
            }

            if(btnRestore) {
                if(confirm('Restore this slot?')) {
                    const res = await fetchAPI('restoreSlot', { method: 'POST', body: createFormData({SlotID: btnRestore.dataset.id}) });
                    if(res && res.success) {
                        showToast(res.message);
                        slotsData = []; // Clear cache
                        performFilterAndSearch();
                    }
                }
            }
        });
    }

    async function loadSlotDropdowns() {
        const areaSelect = document.getElementById('slotAreaSelect');
        const typeSelect = document.getElementById('slotTypeSelect');
        
        areaSelect.innerHTML = '<option value="">Loading...</option>';
        typeSelect.innerHTML = '<option value="">Loading...</option>';

        // Load Areas
        const areasData = await fetchAPI('getParkingAreas');
        if (areasData && areasData.areas) {
            areaSelect.innerHTML = areasData.areas.map(a => `<option value="${a.AreaID}">${escapeHTML(a.AreaName)}</option>`).join('');
        }

        // Load Types
        const typesData = await fetchAPI('getVehicleTypes');
        if (typesData && typesData.types) {
            // Only show active types in dropdown
            const activeTypes = typesData.types.filter(t => t.is_archived == 0);
            typeSelect.innerHTML = activeTypes.map(t => `<option value="${t.VehicleTypeID}">${escapeHTML(t.TypeName)}</option>`).join('');
        }
    }

    if(slotForm) {
        slotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('slotIdInput').value;
            const action = id ? 'updateSlot' : 'addSlot';
            const formData = createFormData({
                SlotID: id,
                AreaID: document.getElementById('slotAreaSelect').value,
                SlotName: document.getElementById('slotNameInput').value,
                AllowedVehicleTypeID: document.getElementById('slotTypeSelect').value
            });

            const res = await fetchAPI(action, { method: 'POST', body: formData });
            if(res && res.success) {
                showToast(res.message);
                hideModal(manageSlotModal);
                slotsData = []; // Clear cache
                performFilterAndSearch();
            }
        });
    }

    // ========================================================
    // TYPES & CATEGORIES MANAGEMENT (Existing Logic)
    // ========================================================
    
    // Manage Types Modal
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
        typesListContainer.innerHTML = data.types.map(type => {
            const isArchived = type.is_archived == 1;
            const dropdownMenu = !isArchived ? `
                <div class="dropdown-menu">
                    <button class="dropdown-item btn-edit-category">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="dropdown-item delete btn-delete-category">
                        <i class="fas fa-archive"></i> Archive
                    </button>
                </div>
            ` : `
                <div class="dropdown-menu">
                    <button class="dropdown-item btn-restore-category">
                        <i class="fas fa-trash-restore"></i> Restore
                    </button>
                </div>
            `;
            
            return `
            <div class="category-list-item" data-id="${type.VehicleTypeID}" data-name="${type.TypeName}" style="${isArchived ? 'opacity:0.6;' : ''}">
                <span class="category-name" style="${isArchived ? 'text-decoration: line-through;' : ''}">${escapeHTML(type.TypeName)}</span>
                <div class="action-dropdown">
                    <button class="action-dots-btn" onclick="toggleActionDropdown(event)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    ${dropdownMenu}
                </div>
            </div>
        `}).join('');
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
            refreshAllParkingDropdowns();
        }
    });

    typesListContainer.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-category');
        const deleteBtn = e.target.closest('.btn-delete-category'); // Acts as Archive
        const restoreBtn = e.target.closest('.btn-restore-category');
        const item = e.target.closest('.category-list-item');
        if (!item) return;

        const id = item.dataset.id;
        const name = item.dataset.name;
        
        if (editBtn) {
            openEditNameModal('vehicleType', id, name);
        }
        
        if (deleteBtn) {
            if (!confirm(`Archive type "${name}"?\nThis cannot be undone.`)) {
                return;
            }
            const formData = new FormData();
            formData.append('TypeID', id);
            const result = await fetchAPI('archiveVehicleType', { method: 'POST', body: formData });
            if (result && result.success) {
                showToast(result.message);
                refreshAllParkingDropdowns();
            }
        }

        if (restoreBtn) {
            if (!confirm(`Restore type "${name}"?`)) {
                return;
            }
            const formData = new FormData();
            formData.append('TypeID', id);
            const result = await fetchAPI('restoreVehicleType', { method: 'POST', body: formData });
            if (result && result.success) {
                showToast(result.message);
                refreshAllParkingDropdowns();
            }
        }
    });

    // Manage Categories Modal
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
                categoryManagerTypeSelect.innerHTML += `<option value="${type.VehicleTypeID}">${type.TypeName} ${type.is_archived == 1 ? '(Archived)' : ''}</option>`;
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
        categoriesListContainer.innerHTML = data.categories.map(cat => {
            const isArchived = cat.is_archived == 1;
            const dropdownMenu = !isArchived ? `
                <div class="dropdown-menu">
                    <button class="dropdown-item btn-edit-category">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="dropdown-item delete btn-delete-category">
                        <i class="fas fa-archive"></i> Archive
                    </button>
                </div>
            ` : `
                <div class="dropdown-menu">
                    <button class="dropdown-item btn-restore-category">
                        <i class="fas fa-trash-restore"></i> Restore
                    </button>
                </div>
            `;
            
            return `
            <div class="category-list-item" data-id="${cat.VehicleCategoryID}" data-name="${cat.CategoryName}" style="${isArchived ? 'opacity:0.6;' : ''}">
                <span class="category-name" style="${isArchived ? 'text-decoration: line-through;' : ''}">${escapeHTML(cat.CategoryName)}</span>
                <div class="action-dropdown">
                    <button class="action-dots-btn" onclick="toggleActionDropdown(event)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    ${dropdownMenu}
                </div>
            </div>
        `}).join('');
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
            await loadVehicleCategoriesList(typeID);
            await refreshAllParkingDropdowns();
        }
    });

    categoriesListContainer.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-category');
        const deleteBtn = e.target.closest('.btn-delete-category');
        const restoreBtn = e.target.closest('.btn-restore-category');
        const item = e.target.closest('.category-list-item');
        if (!item) return;

        const id = item.dataset.id;
        const name = item.dataset.name;
        
        if (editBtn) {
            openEditNameModal('vehicleCategory', id, name);
        }
        
        if (deleteBtn) {
            if (!confirm(`Are you sure you want to archive "${name}"?\nThis cannot be undone.`)) {
                return;
            }
            const formData = new FormData();
            formData.append('CategoryID', id);
            const result = await fetchAPI('archiveVehicleCategory', { method: 'POST', body: formData });
            if (result && result.success) {
                showToast(result.message);
                const typeID = categoryManagerTypeSelect.value;
                await loadVehicleCategoriesList(typeID);
                await refreshAllParkingDropdowns();
            }
        }

        if (restoreBtn) {
            if (!confirm(`Restore category "${name}"?`)) {
                return;
            }
            const formData = new FormData();
            formData.append('CategoryID', id);
            const result = await fetchAPI('restoreVehicleCategory', { method: 'POST', body: formData });
            if (result && result.success) {
                showToast(result.message);
                const typeID = categoryManagerTypeSelect.value;
                await loadVehicleCategoriesList(typeID);
                await refreshAllParkingDropdowns();
            }
        }
    });

    // Generic Edit Name Modal
    function openEditNameModal(type, id, name) {
        editTypeInput.value = type;
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
        }

        const result = await fetchAPI(action, { method: 'POST', body: formData });
        if (result && result.success) {
            showToast(result.message);
            hideModal(editNameModal);
            refreshAllParkingDropdowns();
        }
    });

    // ========================================================
    // REFRESH & LOAD DROPDOWNS
    // ========================================================
    
    async function loadEnterVehicleDropdowns() {
        const typeSelect = document.getElementById('vehicleType');
        const categorySelect = document.getElementById('categorySelect');
        const currentType = typeSelect.value; 
        
        typeSelect.innerHTML = '<option value="">Loading...</option>';
        categorySelect.innerHTML = '<option value="">Select vehicle type first...</option>';
        
        const data = await fetchAPI('getVehicleTypes');
        if (data && data.types) {
            typeSelect.innerHTML = '<option value="">Select</option>';
            data.types.forEach(type => {
                // Only show active types
                if(type.is_archived == 0) {
                    typeSelect.innerHTML += `<option value="${type.VehicleTypeID}">${type.TypeName}</option>`;
                }
            });
            typeSelect.value = currentType;
        }
    }

    async function refreshAllParkingDropdowns() {
        await loadEnterVehicleDropdowns();
        await loadVehicleTypesList();
        await loadVehicleTypesDropdownForManager();
        categoriesListContainer.innerHTML = '<p style="text-align:center; color: #777;">Please select a vehicle type above.</p>';
    }

    // Listener for "Vehicle Type" dropdown in "Enter Vehicle" modal
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
                if(cat.is_archived == 0) {
                    categorySelect.innerHTML += `<option value="${cat.VehicleCategoryID}">${cat.CategoryName}</option>`;
                }
            });
        }
    });

    function setupParkingListeners() {
        document.querySelectorAll('.filterDropdown').forEach(el => {
            el.addEventListener('change', () => {
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                slotsData = [];
                vehiclesInData = [];
                historyData = [];
                dashboardTableData = [];
                performFilterAndSearch();
            });
        });

        document.querySelectorAll('.searchInput').forEach(el => {
            el.addEventListener('input', () => {
                const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                
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
            });
        });
        
        document.querySelectorAll('.refreshBtn').forEach(btn => {
            btn.addEventListener('click', async () => { // Make async
                const controlsRow = btn.closest('.controlsRow');
                
                // 1. Reset Filter UI values
                controlsRow.querySelectorAll('.filterDropdown').forEach(sel => sel.value = 'all');
                controlsRow.querySelectorAll('.searchInput').forEach(inp => inp.value = '');
                
                // 2. Clear Data Cache
                slotsData = []; 
                vehiclesInData = [];
                historyData = [];
                dashboardTableData = []; 

                // 3. Re-fetch Data
                // We reload filter options (in case areas changed) and then the table data
                await loadFilterDropdowns(); 
                await performFilterAndSearch();
                
                showToast('Data refreshed!');
            });
        });

        // Setup Sorting
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                let column = th.dataset.sort;
                const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');
                if (!sortState[activeTab]) return;

                if (column === 'EntryDate') column = 'EntryTime';
                
                const currentSort = sortState[activeTab];
                let direction = 'asc';
                if (currentSort.column === column) {
                    direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                }
                sortState[activeTab] = { column, direction };
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                
                performFilterAndSearch(); // This will trigger re-render with sort
            });
        });

        // Download Buttons
        const downloadBtn = document.getElementById('downloadBtnHistory');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
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
                    
                    const head = [[ 'Slot', 'Plate #', 'Room', 'Name', 'Type', 'Category', 'Duration', 'Entry', 'Exit' ]];
                    const body = filteredData.map(v => [ v.SlotName, v.PlateNumber, v.RoomNumber, v.GuestName, v.VehicleType, v.VehicleCategory, v.ParkingTime, v.EntryDateTime, v.ExitDateTime ]);

                    doc.autoTable({
                        head: head, body: body, startY: 35,
                        headStyles: { fillColor: [72, 12, 27] },
                        styles: { fontSize: 8, cellPadding: 2 },
                        alternateRowStyles: { fillColor: [245, 245, 245] }
                    });
                    doc.save('Parking-History-Report.pdf');
                } catch (e) {
                    console.error("Error generating PDF:", e);
                    showToast('Error generating PDF. See console.', 'error');
                }
            });
        }
        
        const downloadBtnActive = document.getElementById('downloadBtnActive');
        if (downloadBtnActive) {
            downloadBtnActive.addEventListener('click', () => {
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

                    const head = [[ 'Slot', 'Plate #', 'Room', 'Name', 'Type', 'Category', 'Enter Time', 'Enter Date' ]];
                    const body = filteredData.map(v => [ v.SlotName, v.PlateNumber, v.RoomNumber, v.GuestName, v.VehicleType, v.VehicleCategory, v.EnterTime, v.EnterDate ]);

                    doc.autoTable({
                        head: head, body: body, startY: 35,
                        headStyles: { fillColor: [72, 12, 27] },
                        styles: { fontSize: 8, cellPadding: 2 },
                        alternateRowStyles: { fillColor: [245, 245, 245] }
                    });
                    doc.save('Active-Parking-Report.pdf'); 
                } catch (e) {
                    console.error("Error generating PDF:", e);
                    showToast('Error generating PDF. See console.', 'error');
                }
            });
        }
        
        // Enter Vehicle (Global Listener)
        document.body.addEventListener('click', (e) => {
            const enterButton = e.target.closest('.btn-enter');
            if (enterButton) {
                currentSlotID = enterButton.dataset.slotId;
                currentSlotName = enterButton.dataset.slotName;
                document.getElementById('slotNumberTitle').textContent = currentSlotName;
                document.getElementById('enter-vehicle-form').reset();
                loadEnterVehicleDropdowns();
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

                const result = await fetchAPI('enterVehicle', { method: 'POST', body: formData });
                hideModal(document.getElementById('confirmModal'));
                if (result && result.success) {
                    showModal(document.getElementById('successModal'));
                    showToast(result.message || 'Vehicle parked successfully!');
                    slotsData = []; vehiclesInData = []; historyData = []; dashboardTableData = [];
                    performFilterAndSearch();
                }
                currentSlotID = null;
                currentSlotName = null;
            });
        }

        // Exit Vehicle (Global Listener)
        document.body.addEventListener('click', (e) => {
            const exitButton = e.target.closest('.exit-btn');
            if (exitButton) {
                currentSlotID = exitButton.dataset.slotId;
                currentSessionID = exitButton.dataset.sessionId;
                const vehicle = vehiclesInData.find(v => v.SessionID == currentSessionID); // Loose equality
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
                const result = await fetchAPI('exitVehicle', { method: 'POST', body: formData });
                hideModal(document.getElementById('exitModal'));
                if (result && result.success) {
                    showToast(result.message || 'Vehicle exited successfully!');
                    slotsData = []; vehiclesInData = []; historyData = []; dashboardTableData = [];
                    performFilterAndSearch();
                }
                currentSlotID = null;
                currentSessionID = null;
            });
        }
    }
    
    // ========================================================
    // INITIALIZE
    // ========================================================
    
    async function loadFilterDropdowns() {
        const data = await fetchAPI('getParkingAreas');
        if (data && data.areas) {
            const areaFilterOptions = data.areas.map(a => `<option value="${escapeHTML(a.AreaName)}">${escapeHTML(a.AreaName)}</option>`).join('');
            document.querySelectorAll('.filterDropdown[id^="areaFilter"]').forEach(select => {
                select.innerHTML = `<option value="all">All Areas</option>${areaFilterOptions}`;
            });
        }
    }
    
    async function loadGuestRoomsDropdown() {
        const roomSelect = document.getElementById('roomNumber');
        if (!roomSelect) return;

        roomSelect.innerHTML = '<option value="">Loading rooms...</option>';
        const data = await fetchAPI('getGuests'); 
        if (data && data.rooms && data.rooms.length > 0) {
            roomSelect.innerHTML = '<option value="">Select Room</option>';
            data.rooms.forEach(room => {
                roomSelect.innerHTML += `<option value="${escapeHTML(room.room_num)}">${escapeHTML(room.room_num)}</option>`;
            });
        } else {
            roomSelect.innerHTML = '<option value="">No rooms found</option>';
        }
        roomSelect.innerHTML += '<option value="WALK-IN">Walk-in / Other</option>';
    }
    
    function initializeApp() {
        setupUIListeners();
        setupParkingListeners(); // Filter/Search listeners
        // Note: setupSortListeners is called inside render functions implicitly via performFilterAndSearch logic if we wanted dynamic sort
        // but here we attach listeners once.
        // Let's attach sort listeners once here.
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                let column = th.dataset.sort;
                const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');
                if (!sortState[activeTab]) return;

                if (column === 'EntryDate') column = 'EntryTime';
                
                const currentSort = sortState[activeTab];
                let direction = 'asc';
                if (currentSort.column === column) {
                    direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                }
                sortState[activeTab] = { column, direction };
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                
                performFilterAndSearch();
            });
        });
        
        document.querySelectorAll('.sanitize-on-paste').forEach(input => {
            input.addEventListener('paste', sanitizeOnPaste);
        });

        loadFilterDropdowns();
        performFilterAndSearch();
        loadGuestRoomsDropdown();
    }
    
    initializeApp();
});

// ========================================================
// DROPDOWN MENU TOGGLE FUNCTION
// ========================================================
function toggleActionDropdown(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const dropdown = button.nextElementSibling;
    const isOpen = dropdown.classList.contains('show');
    
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
    });
    
    // Toggle current dropdown
    if (!isOpen) {
        // Get button position
        const rect = button.getBoundingClientRect();
        const dropdownHeight = 120; // Approximate height of dropdown
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
        dropdown.style.left = (rect.right - 160) + 'px'; // Align to right of button (160px = min-width)
        
        dropdown.classList.add('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.action-dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});