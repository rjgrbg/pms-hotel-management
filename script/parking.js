document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // API & DATA MANAGEMENT
    // ========================================================
    const API_URL = 'parking_api.php';

    // Main App State
    let slotsData = [];       // For 'Slots' tab
    let vehiclesInData = [];  // For 'Vehicle In' tab
    let historyData = [];     // For 'History' tab
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
        vehicleIn: { column: 'EntryTime', direction: 'desc' },
        history: { column: 'ExitTime', direction: 'desc' }
    };

    // Global variable to track which vehicle/slot is being actioned
    let currentSlotID = null;
    let currentSlotName = null;
    let currentSessionID = null;

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
    // TOAST NOTIFICATION
    // ========================================================
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 400);
        }, 3000);
    }

    // ========================================================
    // UI (TABS, MODALS, SIDEBAR) (*** MODIFIED ***)
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
                
                // Re-fetch data for the new tab
                performFilterAndSearch();
            });
        });

        // --- Profile & Logout (Merged from inventory.js) ---
        const profileBtn = document.getElementById('profileBtn');
        const sidebar = document.getElementById('profile-sidebar');
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const closeLogoutBtn = document.getElementById('closeLogoutBtn');
        const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
        const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
        const accountDetailsLink = document.getElementById('account-details-link');

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
                window.location.href = 'logout.php'; // Standardized logout file
            });
        }
        if (logoutModal) {
            logoutModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                hideModal(logoutModal);
            }
            });
        }

        // --- Account Details (Logic from parking.js, placed correctly) ---
        if (accountDetailsLink) {
            accountDetailsLink.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Populate form fields from userData
                // *** MODIFIED: Use the correct keys from the userData object ***
                document.getElementById('firstName').value = userData.Fname || userData.Name || ''; // Use Fname first (from form), fallback to Name
                document.getElementById('middleName').value = userData.Mname || '';
                document.getElementById('lastName').value = userData.Lname || '';
                document.getElementById('emailAddress').value = userData.EmailAddress || '';
                document.getElementById('username').value = userData.Username || '';
                document.getElementById('password').value = ''; // Always clear password
                document.getElementById('birthday').value = userData.Birthday || '';
                document.getElementById('contact').value = userData.ContactNumber || '';
                document.getElementById('address').value = userData.Address || '';
                
                if(sidebar) sidebar.classList.remove('active');
                
                showModal(document.getElementById('accountModal'));
            });
        }

        // --- Generic Modal Close Buttons ---
        document.querySelectorAll('.modal-close-btn, .btn-okay, button[data-modal-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
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

    function renderDashboard(data) {
        // 1. Update Cards (data.cards is now RECALCULATED)
        const cards = document.querySelectorAll('.summary-cards .card .card-value');
        if (data.cards) {
            if (cards[0]) cards[0].textContent = data.cards.occupied || 0;
            if (cards[1]) cards[1].textContent = data.cards.available || 0;
            if (cards[2]) cards[2].textContent = data.cards.total || 0;
        }

        // 2. Update Table (data.table is the FILTERED/SORTED array)
        const tbody = document.getElementById('dashboardTableBody');
        if (!tbody) return;
        
        if (!data.table || data.table.length === 0) {
            renderEmptyState(tbody, 5, '📊', 'No Areas Found', 'Try adjusting your filter.');
            return; // No pagination for dashboard
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

        // 3. Update Headers
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
            return `
                <tr>
                    <td>${slot.AreaName}</td>
                    <td>${slot.SlotName}</td>
                    <td>${slot.AllowedVehicle}</td>
                    <td>
                        <span class="status-badge status-${slot.Status}">
                            ${slot.Status === 'available' ? 'Available' : 'Occupied'}
                        </span>
                    </td>
                    <td>
                        ${slot.Status === 'available' 
                            ? `<button class="btn-enter" data-slot-id="${slot.SlotID}" data-slot-name="${slot.SlotName}">Enter Vehicle</button>`
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
            return `
                <tr>
                    <td>${vehicle.SlotName}</td>
                    <td>${vehicle.PlateNumber}</td>
                    <td>${vehicle.RoomNumber}</td>
                    <td>${vehicle.GuestName}</td>
                    <td>${vehicle.VehicleType}</td>
                    <td>${vehicle.VehicleCategory}</td>
                    <td>${vehicle.EnterTime}</td>
                    <td>${vehicle.EnterDate}</td>
                    <td>
                        <button class="exit-btn" data-slot-id="${vehicle.SlotID}" data-session-id="${vehicle.SessionID}">
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
                    <td>${vehicle.SlotName}</td>
                    <td>${vehicle.PlateNumber}</td>
                    <td>${vehicle.RoomNumber}</td>
                    <td>${vehicle.GuestName}</td>
                    <td>${vehicle.VehicleType}</td>
                    <td>${vehicle.VehicleCategory}</td>
                    <td>${vehicle.ParkingTime}</td>
                    <td>${vehicle.EntryDateTime}</td>
                    <td>${vehicle.ExitDateTime}</td>
                </tr>
            `;
        }).join('');
        
        updateSortHeaders('history-tab', sortState.history);
    }

    // ========================================================
    // PAGINATION LOGIC (This is the correct, working version)
    // ========================================================
    function setupPagination(totalItems, containerId, currentPage) {
        const paginationContainer = document.getElementById(containerId);
        if (!paginationContainer) return;

        paginationContainer.innerHTML = ''; // Clear it
        const totalPages = Math.ceil(totalItems / rowsPerPage);

        // --- Part 1: Record Info (Always Show) ---
        const recordsInfo = document.createElement('span');
        recordsInfo.className = 'paginationInfo';
        
        let start, end;
        if (totalItems === 0) {
            start = 0;
            end = 0;
        } else {
            start = (currentPage - 1) * rowsPerPage + 1;
            end = Math.min(start + rowsPerPage - 1, totalItems);
        }
        
        // This text will now *always* appear, even for 0 items.
        recordsInfo.textContent = `Displaying ${start}-${end} of ${totalItems} Records`;
        paginationContainer.appendChild(recordsInfo);
        
        // --- Part 2: Page Buttons (Show if > 1 page) ---
        if (totalPages <= 1) {
            return; // We've shown the info, no buttons needed.
        }

        // --- Part 3: Render Buttons ---
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'paginationControls';

        // Prev Button
        const prevButton = document.createElement('button');
        prevButton.className = 'paginationBtn';
        prevButton.innerHTML = '&lt;';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (containerId.includes('slots')) currentPages.slots--;
            if (containerId.includes('vehicleIn')) currentPages.vehicleIn--;
            if (containerId.includes('history')) currentPages.history--;
            performFilterAndSearch(); // Re-run to render new page
        });
        controlsDiv.appendChild(prevButton);

        // Page Numbers...
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
                    performFilterAndSearch(); // Re-run to render new page
                });
                controlsDiv.appendChild(button);
            }
        });

        // Next Button
        const nextButton = document.createElement('button');
        nextButton.className = 'paginationBtn';
        nextButton.innerHTML = '&gt;';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (containerId.includes('slots')) currentPages.slots++;
            if (containerId.includes('vehicleIn')) currentPages.vehicleIn++;
            if (containerId.includes('history')) currentPages.history++;
            performFilterAndSearch(); // Re-run to render new page
        });
        controlsDiv.appendChild(nextButton);

        paginationContainer.appendChild(controlsDiv);
    }

    // ========================================================
    // SORTING & PARSING LOGIC (This is the correct, working version)
    // ========================================================
    
    // Helper for date parsing to avoid errors on null
    function parseDateWhen(dateStr, defaultVal) {
        if (!dateStr) return defaultVal;
        try {
            // Converts "YYYY-MM-DD / H:MM AM/PM" to a valid date object
            return new Date(dateStr.replace(' / ', ' ')).getTime();
        } catch (e) {
            return defaultVal;
        }
    }

    // Sorting Function
    function sortData(data, column, direction) {
        data.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            // Handle numbers that might be strings (for Dashboard)
            if (column === 'available' || column === 'occupied' || column === 'total') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            }

            // Handle different data types
            if (typeof valA === 'string') {
                // Check for full timestamps (YYYY-MM-DD HH:MM:SS)
                // This is used for 'EntryTime' in "Vehicle In" and 'ExitTime' in "History"
                if (valA && valA.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) { 
                    valA = new Date(valA).getTime();
                    valB = valB ? new Date(valB).getTime() : null; // Handle nulls
                } 
                // Check for API date-time with slashes (YYYY-MM-DD / H:MM AM/PM)
                else if (valA && valA.match(/^\d{4}-\d{2}-\d{2} \/ \d{1,2}:\d{2} [AP]M$/)) {
                    valA = parseDateWhen(valA, null); 
                    valB = parseDateWhen(valB, null);
                }
                // Normal string sort
                else {
                    valA = (valA || "").toLowerCase();
                    valB = (valB || "").toLowerCase();
                }
            }
            
            if (typeof valA === 'number') {
                valA = valA || 0;
                valB = valB || 0;
            }

            // Handle nulls for sorting
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

    // Update Header Visuals
    function updateSortHeaders(tabId, { column, direction }) {
        const tab = document.getElementById(tabId);
        if (!tab) return;

        // Remove old classes
        tab.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });

        // Add new class
        // Handle special case for EntryTime/EntryDate
        let selector = `th[data-sort="${column}"]`;
        if (column === 'EntryTime') {
             selector = `th[data-sort="EntryTime"]`; // Target both headers
        }
        // Handle special case for ExitTime/ExitDateTime
        else if (column === 'ExitTime' || column === 'ExitDateTime') {
             selector = `th[data-sort="ExitTime"], th[data-sort="ExitDateTime"]`;
        }
        // Handle special case for EntryTime/EntryDateTime in history
        else if (column === 'EntryTime' || column === 'EntryDateTime') {
            selector = `th[data-sort="EntryTime"], th[data-sort="EntryDateTime"]`;
        }


        tab.querySelectorAll(selector).forEach(th => {
             th.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
        });
    }


    // ========================================================
    // SEARCH, FILTER & DATA LOADING (This version is correct)
    // ========================================================
    async function performFilterAndSearch() {
        
        const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');

        if (activeTab === 'dashboard') {
            // 1. Fetch data if cache is empty
            if (dashboardTableData.length === 0) {
                const data = await fetchAPI('getDashboardData');
                if (!data || !data.table) {
                     renderDashboard({ cards: {}, table: [] });
                     return;
                }
                dashboardTableData = data.table; 
            }

            // 2. Filter (Area Dropdown)
            const filterArea = document.getElementById('areaFilterDashboard').value;
            let filteredData = dashboardTableData
                .filter(area => filterArea === "all" || area.AreaName === filterArea);
            
            // 3. Recalculate Card Totals based on filtered data
            const newCardTotals = filteredData.reduce((acc, area) => {
                acc.occupied += parseFloat(area.occupied) || 0;
                acc.available += parseFloat(area.available) || 0;
                acc.total += parseFloat(area.total) || 0;
                return acc;
            }, { occupied: 0, available: 0, total: 0 });

            // 4. Sort
            const { column, direction } = sortState.dashboard;
            sortData(filteredData, column, direction);

            // 5. Render
            renderDashboard({ cards: newCardTotals, table: filteredData });
        
        } else if (activeTab === 'slots') {
            // 1. Fetch
            if (slotsData.length === 0) { 
                 const data = await fetchAPI('getAllSlots');
                 if (!data) {
                    renderSlots([]); // Render empty state
                    return;
                 }
                 slotsData = data.slots;
            }
            
            // 2. Filter
            const filterArea = document.getElementById('areaFilterSlots').value;
            const filterStatus = document.getElementById('statusFilterSlots').value;
            const searchTerm = document.getElementById('searchSlots').value.toLowerCase();
            
            let filteredData = slotsData
                .filter(s => filterArea === "all" || s.AreaName.includes(filterArea))
                .filter(s => filterStatus === "all" || s.Status === filterStatus)
                .filter(s => !searchTerm || s.SlotName.toLowerCase().includes(searchTerm));
            
            // 3. Sort
            const { column, direction } = sortState.slots;
            sortData(filteredData, column, direction);
            
            // 4. Render (which includes pagination)
            renderSlots(filteredData);

        } else if (activeTab === 'vehicleIn') {
            // 1. Fetch
            const data = await fetchAPI('getVehiclesIn');
            if (!data) {
                renderVehicleIn([]); // Render empty state
                return;
            }
            vehiclesInData = data.vehicles;

            // 2. Filter
            const filterArea = document.getElementById('areaFilterVehicleIn').value;
            const searchTerm = document.getElementById('searchVehicleIn').value.toLowerCase();
            
            let filteredData = vehiclesInData
                .filter(s => filterArea === "all" || s.AreaName === filterArea) 
                .filter(s => !searchTerm || 
                    (s.GuestName && s.GuestName.toLowerCase().includes(searchTerm)) ||
                    (s.PlateNumber && s.PlateNumber.toLowerCase().includes(searchTerm)) ||
                    (s.RoomNumber && s.RoomNumber.toLowerCase().includes(searchTerm))
                );

            // 3. Sort
            const { column, direction } = sortState.vehicleIn;
            sortData(filteredData, column, direction);

            // 4. Render
            renderVehicleIn(filteredData);

        } else if (activeTab === 'history') {
            // 1. Fetch
            const data = await fetchAPI('getHistory');
            if (!data) {
                renderHistory([]); // Render empty state
                return;
            }
            historyData = data.history;

            // 2. Filter
            const filterArea = document.getElementById('areaFilterHistory').value;
            const searchTerm = document.getElementById('searchHistory').value.toLowerCase();

            let filteredData = historyData
                .filter(v => filterArea === "all" || v.AreaName === filterArea) 
                .filter(v => !searchTerm || 
                    (v.GuestName && v.GuestName.toLowerCase().includes(searchTerm)) ||
                    (v.PlateNumber && v.PlateNumber.toLowerCase().includes(searchTerm)) ||
                    (v.RoomNumber && v.RoomNumber.toLowerCase().includes(searchTerm))
                );
            
            // 3. Sort
            const { column, direction } = sortState.history;
            sortData(filteredData, column, direction);

            // 4. Render
            renderHistory(filteredData);
        }
    }

    // ========================================================
    // EVENT LISTENERS (SPECIFIC TO PARKING)
    // ========================================================

    async function loadEnterVehicleDropdowns() {
        const typeSelect = document.getElementById('vehicleType');
        const categorySelect = document.getElementById('categorySelect');
        typeSelect.innerHTML = '<option value="">Loading...</option>';
        categorySelect.innerHTML = '<option value="">Select vehicle type first...</option>';
        const data = await fetchAPI('getVehicleTypes');
        if (data && data.types) {
            typeSelect.innerHTML = '<option value="">Select</option>';
            data.types.forEach(type => {
                typeSelect.innerHTML += `<option value="${type.VehicleTypeID}">${type.TypeName}</option>`;
            });
        }
    }
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
                // Reset to page 1 and re-fetch/re-filter
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                
                slotsData = []; // Clear slot cache on filter change
                
                performFilterAndSearch();
            });
        });

        document.querySelectorAll('.searchInput').forEach(el => {
            el.addEventListener('input', () => {
                // This performs a client-side filter *without* re-fetching
                const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');
                
                // Reset page to 1 when typing
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                
                if (activeTab === 'dashboard') {
                   // Search removed
                }
                if (activeTab === 'slots') {
                    const filterArea = document.getElementById('areaFilterSlots').value;
                    const filterStatus = document.getElementById('statusFilterSlots').value;
                    const searchTerm = document.getElementById('searchSlots').value.toLowerCase();
                    let filtered = slotsData
                        .filter(s => filterArea === "all" || s.AreaName.includes(filterArea))
                        .filter(s => filterStatus === "all" || s.Status === filterStatus)
                        .filter(s => !searchTerm || s.SlotName.toLowerCase().includes(searchTerm));
                    sortData(filtered, sortState.slots.column, sortState.slots.direction);
                    renderSlots(filtered);
                }
                if (activeTab === 'vehicleIn') {
                    const filterArea = document.getElementById('areaFilterVehicleIn').value;
                    const searchTerm = document.getElementById('searchVehicleIn').value.toLowerCase();
                    let filtered = vehiclesInData
                        .filter(s => filterArea === "all" || s.AreaName === filterArea)
                        .filter(s => !searchTerm || 
                            (s.GuestName && s.GuestName.toLowerCase().includes(searchTerm)) ||
                            (s.PlateNumber && s.PlateNumber.toLowerCase().includes(searchTerm)) ||
                            (s.RoomNumber && s.RoomNumber.toLowerCase().includes(searchTerm))
                        );
                    sortData(filtered, sortState.vehicleIn.column, sortState.vehicleIn.direction);
                    renderVehicleIn(filtered);
                }
                 if (activeTab === 'history') {
                    const filterArea = document.getElementById('areaFilterHistory').value;
                    const searchTerm = document.getElementById('searchHistory').value.toLowerCase();
                    let filtered = historyData
                        .filter(v => filterArea === "all" || v.AreaName === filterArea) 
                        .filter(v => !searchTerm || 
                            (v.GuestName && v.GuestName.toLowerCase().includes(searchTerm)) ||
                            (v.PlateNumber && v.PlateNumber.toLowerCase().includes(searchTerm)) ||
                            (v.RoomNumber && v.RoomNumber.toLowerCase().includes(searchTerm))
                        );
                    sortData(filtered, sortState.history.column, sortState.history.direction);
                    renderHistory(filtered);
                 }
            });
        });
        
        // Refresh Buttons
        document.querySelectorAll('.refreshBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const controlsRow = btn.closest('.controlsRow');
                controlsRow.querySelectorAll('.filterDropdown').forEach(sel => sel.value = 'all');
                controlsRow.querySelectorAll('.searchInput').forEach(inp => inp.value = '');
                
                // Clear all caches
                slotsData = []; 
                dashboardTableData = []; 

                performFilterAndSearch(); // Re-fetch all
                showToast('Data refreshed!');
            });
        });

        // Download History Button
        const downloadBtn = document.getElementById('downloadBtnHistory');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                // 1. Get the current filter and search values
                const filterArea = document.getElementById('areaFilterHistory').value;
                const searchTerm = document.getElementById('searchHistory').value.toLowerCase();

                // 2. Apply the same filters as the render function
                let filteredData = historyData
                    .filter(v => filterArea === "all" || v.AreaName === filterArea) 
                    .filter(v => !searchTerm || 
                        (v.GuestName && v.GuestName.toLowerCase().includes(searchTerm)) ||
                        (v.PlateNumber && v.PlateNumber.toLowerCase().includes(searchTerm)) ||
                        (v.RoomNumber && v.RoomNumber.toLowerCase().includes(searchTerm))
                    );
                
                // 3. Apply the current sort
                const { column, direction } = sortState.history;
                sortData(filteredData, column, direction);

                // 4. Check if there's data
                if (filteredData.length === 0) {
                    showToast('No data to download.', 'error');
                    return;
                }

                // 5. Generate the PDF
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF(); // Default is portrait, A4

                    doc.setFontSize(18);
                    doc.text("Parking History Report", 14, 22);
                    doc.setFontSize(11);
                    doc.setTextColor(100);
                    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
                    
                    // Define columns for the table
                    const head = [[
                        'Slot', 
                        'Plate #', 
                        'Room', 
                        'Name', 
                        'Vehicle Type', 
                        'Category',
                        'Parking Time',
                        'Entry',
                        'Exit'
                    ]];

                    // Map the filtered data to the row format
                    const body = filteredData.map(v => [
                        v.SlotName,
                        v.PlateNumber,
                        v.RoomNumber,
                        v.GuestName,
                        v.VehicleType,
                        v.VehicleCategory,
                        v.ParkingTime,
                        v.EntryDateTime,
                        v.ExitDateTime
                    ]);

                    // Use autoTable to create the table
                    doc.autoTable({
                        head: head,
                        body: body,
                        startY: 35,
                        headStyles: { fillColor: [72, 12, 27] }, // #480c1b
                        styles: { fontSize: 8, cellPadding: 2 },
                        alternateRowStyles: { fillColor: [245, 245, 245] },
                        columnStyles: {
                            0: { cellWidth: 15 }, // Slot
                            1: { cellWidth: 20 }, // Plate
                            2: { cellWidth: 12 }, // Room
                            3: { cellWidth: 'auto' }, // Name
                            4: { cellWidth: 'auto' }, // Type
                            5: { cellWidth: 'auto' }, // Category
                            6: { cellWidth: 20 }, // Parking Time
                            7: { cellWidth: 30 }, // Entry
                            8: { cellWidth: 30 }  // Exit
                        }
                    });

                    // 6. Save the file
                    doc.save('Parking-History-Report.pdf');

                } catch (e) {
                    console.error("Error generating PDF:", e);
                    showToast('Error generating PDF. See console.', 'error');
                }
            });
        }

        // === Enter/Exit/Account Listeners... (no changes) ===
        
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

                const result = await fetchAPI('enterVehicle', {
                    method: 'POST',
                    body: formData
                });
                hideModal(document.getElementById('confirmModal'));
                if (result && result.success) {
                    showModal(document.getElementById('successModal'));
                    showToast(result.message || 'Vehicle parked successfully!');
                    slotsData = []; // Clear cache
                    dashboardTableData = []; // Clear cache
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
                    slotsData = []; // Clear cache
                    dashboardTableData = []; // Clear cache
                    performFilterAndSearch();
                }
                currentSlotID = null;
                currentSessionID = null;
            });
        }
        
        // --- This section is now part of setupUIListeners ---
        
        const accountForm = document.getElementById('account-details-form');
        if (accountForm) {
            accountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                hideModal(document.getElementById('accountModal'));
                showModal(document.getElementById('saveConfirmModal'));
            });
        }

        const btnConfirmSave = document.getElementById('btnConfirmSave');
        if (btnConfirmSave) {
            btnConfirmSave.addEventListener('click', async () => {
                const form = document.getElementById('account-details-form');
                const formData = new FormData(form);
                formData.append('action', 'updateUser');
                if (document.getElementById('password').value === '') {
                    formData.set('Password', '************');
                }
                const result = await fetchAPI('updateUser', {
                    method: 'POST',
                    body: formData
                });
                hideModal(document.getElementById('saveConfirmModal'));
                if (result && result.success) {
                    // *** MODIFIED: Use the correct keys to update local data and sidebar ***
                    // Update local user data
                    userData.Name = formData.get('Fname'); // Form has 'Fname', save to 'Name'
                    userData.Lname = formData.get('Lname');
                    userData.Mname = formData.get('Mname');
                    userData.EmailAddress = formData.get('EmailAddress');
                    userData.Username = formData.get('Username');
                    userData.Birthday = formData.get('Birthday');
                    userData.ContactNumber = formData.get('ContactNumber');
                    userData.Address = formData.get('Address');
                    
                    // Now, update the sidebar with the new name
                    const sidebarName = document.querySelector('.profile-header h3');
                    if (sidebarName) sidebarName.textContent = `${userData.Name}`; // Use the correct key
                    
                    showModal(document.getElementById('saveSuccessModal'));
                    showToast(result.message || 'Account details updated!');
                }
            });
        }
    }

    // ========================================================
    // SORTING EVENT LISTENERS (This version is correct)
    // ========================================================
    function setupSortListeners() {
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.sort;
                const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');
                
                if (!sortState[activeTab]) return; // Not a sortable tab

                const currentSort = sortState[activeTab];
                let direction = 'asc';

                if (currentSort.column === column) {
                    direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                }
                
                sortState[activeTab] = { column, direction };

                // Reset to page 1
                currentPages.slots = 1;
                currentPages.vehicleIn = 1;
                currentPages.history = 1;
                
                // *** This function now re-filters and re-sorts all data ***
                // It's faster than re-fetching from the API
                
                // Get the filtered data first, *then* sort it
                const filterAndSortData = (tab) => {
                    let filteredData = [];
                    let sortCol = sortState[tab].column;
                    let sortDir = sortState[tab].direction;

                    if (tab === 'dashboard') {
                        const filterArea = document.getElementById('areaFilterDashboard').value;
                        filteredData = dashboardTableData
                            .filter(area => filterArea === "all" || area.AreaName === filterArea);
                        
                        const newCardTotals = filteredData.reduce((acc, area) => {
                            acc.occupied += parseFloat(area.occupied) || 0;
                            acc.available += parseFloat(area.available) || 0;
                            acc.total += parseFloat(area.total) || 0;
                            return acc;
                        }, { occupied: 0, available: 0, total: 0 });
                        
                        sortData(filteredData, column, direction);
                        renderDashboard({ cards: newCardTotals, table: filteredData });

                    } else if (tab === 'slots') {
                        const filterArea = document.getElementById('areaFilterSlots').value;
                        const filterStatus = document.getElementById('statusFilterSlots').value;
                        const searchTerm = document.getElementById('searchSlots').value.toLowerCase();
                        filteredData = slotsData
                            .filter(s => filterArea === "all" || s.AreaName.includes(filterArea))
                            .filter(s => filterStatus === "all" || s.Status === filterStatus)
                            .filter(s => !searchTerm || s.SlotName.toLowerCase().includes(searchTerm));
                        sortData(filteredData, column, direction);
                        renderSlots(filteredData);

                    } else if (tab === 'vehicleIn') {
                        const filterArea = document.getElementById('areaFilterVehicleIn').value;
                        const searchTerm = document.getElementById('searchVehicleIn').value.toLowerCase();
                        filteredData = vehiclesInData
                            .filter(s => filterArea === "all" || s.AreaName === filterArea)
                            .filter(s => !searchTerm || 
                                (s.GuestName && s.GuestName.toLowerCase().includes(searchTerm)) ||
                                (s.PlateNumber && s.PlateNumber.toLowerCase().includes(searchTerm)) ||
                                (s.RoomNumber && s.RoomNumber.toLowerCase().includes(searchTerm))
                            );
                        sortData(filteredData, column, direction);
                        renderVehicleIn(filteredData);

                    } else if (tab === 'history') {
                        const filterArea = document.getElementById('areaFilterHistory').value;
                        const searchTerm = document.getElementById('searchHistory').value.toLowerCase();
                        filteredData = historyData
                            .filter(v => filterArea === "all" || v.AreaName === filterArea) 
                            .filter(v => !searchTerm || 
                                (v.GuestName && v.GuestName.toLowerCase().includes(searchTerm)) ||
                                (v.PlateNumber && v.PlateNumber.toLowerCase().includes(searchTerm)) ||
                                (v.RoomNumber && v.RoomNumber.toLowerCase().includes(searchTerm))
                            );
                        sortData(filteredData, column, direction);
                        renderHistory(filteredData);
                    }
                };

                filterAndSortData(activeTab);
            });
        });
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
        
        // *** MODIFIED: These lines are removed to prevent the "undefined" bug ***
        // const sidebarName = document.querySelector('.profile-header h3');
        // const sidebarRole = document.querySelector('.profile-header p');
        // if (sidebarName) sidebarName.textContent = `${userData.Name}`; // This is now done by PHP
        // if (sidebarRole) sidebarRole.textContent = `${userData.Accounttype}`; // This is now done by PHP

        loadFilterDropdowns();

        performFilterAndSearch();
    }
    
    initializeApp();
});