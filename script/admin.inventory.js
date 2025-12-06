/**
 * INVENTORY MODULE JAVASCRIPT
 * Features: Dynamic Filters (Based on Table Data), Toast, Landscape PDF, Dashboard Updates
 */

// ==========================================
// 1. GLOBAL HELPERS (Toast & PDF)
// ==========================================

// --- INJECT TOAST CSS ---
const toastStyle = document.createElement("style");
toastStyle.textContent = `
    .toast-success {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #28a745; /* Green */
        color: white;
        padding: 12px 24px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        z-index: 99999;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
    }
    .toast-visible {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(toastStyle);

// --- TOAST FUNCTION ---
function showInventoryToast(message) {
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

// --- PDF EXPORT FUNCTION (DEPRECATED - Now using download-utils.js) ---
// This function is kept for backwards compatibility but downloads now use downloadData()
function downloadInventoryPDF(headers, data, title, filename) {
    // Redirect to new download utility
    if (typeof downloadData === 'function') {
        downloadData(headers, data, title, filename);
    } else {
        console.error('Download utility not loaded');
        alert('Download feature is not available. Please refresh the page.');
    }
}

// =============================================
// 2. DYNAMIC DROPDOWN POPULATION (FROM TABLE DATA)
// =============================================

// *** NEW: Populate Dropdown based on actual data arrays ***
function populateAdminFilterDropdown(data, dropdownId) {
    const select = document.getElementById(dropdownId);
    if (!select) return;

    // Save current selection
    const currentVal = select.value;
    
    // Extract unique categories, filter out empty/null, and sort alphabetically
    const categories = [...new Set(data.map(item => item.Category))].filter(c => c).sort();

    // Reset Dropdown (Keep first "Category" option)
    while (select.options.length > 1) {
        select.remove(1);
    }

    // Add Options
    categories.forEach(catName => {
        const option = document.createElement('option');
        option.value = catName; 
        option.textContent = catName;
        select.appendChild(option);
    });

    // Restore selection if it still exists in the new list
    // If the category was removed (e.g., all items in it were deleted), it defaults back to ""
    if (currentVal) {
        const optionExists = Array.from(select.options).some(opt => opt.value === currentVal);
        if (optionExists) {
            select.value = currentVal;
        } else {
            select.value = "";
        }
    }
}

// =============================================
// 3. DATA FETCHING FUNCTIONS
// =============================================

async function fetchAndRenderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading inventory items...</td></tr>';
    
    const result = await apiCall('get_inventory', {}, 'GET', 'inventory_actions.php');
    
    if (result && !result.error && Array.isArray(result) && result.length > 0) {
        inventoryDataList = result; 
        renderInventoryTable(inventoryDataList);

        // *** NEW: Update Filter Dropdown with Active Data ***
        populateAdminFilterDropdown(inventoryDataList, 'inventoryCategoryFilter');

        // Update Dashboard Stats
        try {
            // Count items (optionally filter out archived if your backend sends them but you don't show them)
            const activeItems = inventoryDataList.filter(item => item.is_archived != 1);
            
            const totalItems = activeItems.length;
            const lowStock = activeItems.filter(item => item.ItemStatus === 'Low Stock').length;
            const outOfStock = activeItems.filter(item => item.ItemStatus === 'Out of Stock').length;
            
            // Assumes updateStatCard function exists globally (from admin.ui.js or similar)
            if (typeof updateStatCard === 'function') {
                updateStatCard(3, totalItems); 
                updateStatCard(4, lowStock); 
                updateStatCard(5, outOfStock); 
            }
        } catch (e) { console.log("Stat update skipped"); }

    } else if (result && Array.isArray(result) && result.length === 0) {
        inventoryDataList = [];
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No inventory items found.</td></tr>';
        document.getElementById('inventoryRecordCount').textContent = 0;
        
        // Clear filter if no data
        populateAdminFilterDropdown([], 'inventoryCategoryFilter');
        
        renderPaginationControls('inv-items-tab', 0, 1, () => {});
    } else {
        inventoryDataList = [];
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #c33;">Failed to load data</td></tr>`;
    }
    
    // Initialize filter listeners
    initInventoryFilters();
}

async function fetchAndRenderInventoryHistory() {
    const tbody = document.getElementById('invHistTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading inventory history...</td></tr>';
    
    const result = await apiCall('get_history', {}, 'GET', 'inventory_actions.php');
    
    if (result && !result.error && Array.isArray(result) && result.length > 0) {
        inventoryHistoryDataList = result; 
        renderInventoryHistoryTable(inventoryHistoryDataList);
        
        // *** NEW: Update History Filter Dropdown with Active Data ***
        populateAdminFilterDropdown(inventoryHistoryDataList, 'invHistCategoryFilter');

    } else if (result && Array.isArray(result) && result.length === 0) {
        inventoryHistoryDataList = [];
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history records found.</td></tr>';
        document.getElementById('invHistRecordCount').textContent = 0;
        
        // Clear filter if no data
        populateAdminFilterDropdown([], 'invHistCategoryFilter');

        renderPaginationControls('inv-history-tab', 0, 1, () => {});
    } else {
        inventoryHistoryDataList = [];
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #c33;">Failed to load data</td></tr>`;
    }
    
    initInventoryHistoryFilters();
}

// =============================================
// 4. RENDER FUNCTIONS
// =============================================

// ===== RENDER FUNCTIONS (INVENTORY) =====

function renderInventoryTable(data = inventoryDataList) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    const state = paginationState.inventory;
    
    // Filter out archived items if necessary (Admin usually sees active items in main table)
    // If you want to show archived items, remove this filter.
    const activeData = data.filter(item => item.is_archived != 1); 

    const totalPages = getTotalPages(activeData.length, state.itemsPerPage);
    const paginatedData = paginateData(activeData, state.currentPage, state.itemsPerPage);

    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(row => {
            const statusText = row.ItemStatus === 'In Stock' ? 'In Stock' : 
                            row.ItemStatus === 'Low Stock' ? 'Low Stock' : 'Out of Stock';
            const statusClass = statusText.toLowerCase().replace(/ /g, '-');
            
            return `
                <tr>
                <td>${escapeHtml(row.ItemID)}</td>
                <td>${escapeHtml(row.ItemName)}</td>
                <td>${escapeHtml(row.Category)}</td>
                <td>${escapeHtml(row.ItemQuantity ?? '-')}</td>
                <td>${escapeHtml(row.ItemDescription || 'N/A')}</td>
                <td><span class="statusBadge ${statusClass}">${escapeHtml(statusText)}</span></td>
                <td>${escapeHtml(row.DateofStockIn)}</td>
                </tr>
            `;
        }).join('');
    }
    
    const countEl = document.getElementById('inventoryRecordCount');
    if(countEl) countEl.textContent = activeData.length;

    renderPaginationControls('inv-items-tab', totalPages, state.currentPage, (page) => {
        state.currentPage = page;
        renderInventoryTable(data);
    });
}

function renderInventoryHistoryTable(data = inventoryHistoryDataList) {
    const tbody = document.getElementById('invHistTableBody');
    if (!tbody) return;
    
    const state = paginationState.inventoryHistory;
    const totalPages = getTotalPages(data.length, state.itemsPerPage);
    const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(row => {
            let quantityChangeText = row.QuantityChange;
            let changeClass = '';
            const changeAmount = parseInt(row.QuantityChange, 10);
            
            if (changeAmount > 0) {
                quantityChangeText = `+${changeAmount}`;
                changeClass = 'text-success'; 
            } else if (changeAmount < 0) {
                quantityChangeText = `${changeAmount}`;
                changeClass = 'text-danger';
            } else {
                quantityChangeText = '0';
            }
            
            return `
                <tr>
                    <td>${escapeHtml(row.InvLogID)}</td>
                    <td>${escapeHtml(row.ItemName)}</td>
                    <td>${escapeHtml(row.Category)}</td>
                    <td>${escapeHtml(row.OldQuantity ?? 'N/A')}</td>
                    <td class="${changeClass}">${escapeHtml(quantityChangeText)}</td>
                    <td>${escapeHtml(row.NewQuantity ?? 'N/A')}</td>
                    <td>${escapeHtml(row.ItemStatus)}</td>
                    <td>${escapeHtml(row.DateofStockIn || 'N/A')}</td>
                    <td>${escapeHtml(row.PerformedBy)}</td>
                </tr>
            `;
        }).join('');
    }
    
    const countEl = document.getElementById('invHistRecordCount');
    if(countEl) countEl.textContent = data.length;

    renderPaginationControls('inv-history-tab', totalPages, state.currentPage, (page) => {
        state.currentPage = page;
        renderInventoryHistoryTable(data);
    });
}

// =============================================
// 5. FILTER INITIALIZATION
// =============================================

function initInventoryFilters() {
    // Note: Dropdowns are now populated inside fetchAndRenderInventory

    const searchInput = document.getElementById('inventorySearchInput');
    const categoryFilter = document.getElementById('inventoryCategoryFilter');
    const statusFilter = document.getElementById('inventoryStatusFilter');
    const refreshBtn = document.getElementById('inventoryRefreshBtn');
    const downloadBtn = document.getElementById('inventoryDownloadBtn');

    function applyInventoryFilters() {
        const search = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const statusRaw = statusFilter.value;
        
        const statusMap = { 'in-stock': 'In Stock', 'low-stock': 'Low Stock', 'out-of-stock': 'Out of Stock' };
        const status = statusMap[statusRaw] || statusRaw;
        
        // Filter logic: Search + Category + Status + Non-Archived
        const filtered = inventoryDataList.filter(row => {
            const isArchived = row.is_archived == 1;
            if (isArchived) return false; // Hide archived in main list

            return (
                (row.ItemName.toLowerCase().includes(search) ||
                row.Category.toLowerCase().includes(search) ||
                (row.ItemDescription && row.ItemDescription.toLowerCase().includes(search))) &&
                (category === "" || row.Category === category) &&
                (!status || row.ItemStatus === status)
            );
        });
        
        paginationState.inventory.currentPage = 1;
        // Pass the already filtered list (or pass full list if render function handles logic, 
        // but passing full list allows render to re-filter if needed. 
        // Here we pass filtered to avoid double logic, but render expects raw data to paginate.
        // Simplified: Let's pass the filtered list to a renderer that just paginates.)
        
        // NOTE: Our renderInventoryTable expects "data" and then slices it.
        // It ALSO filters for archived. To avoid double filtering issues,
        // we should adapt renderInventoryTable to just accept the final list to show.
        // BUT for consistency with the rest of your app, let's just re-render:
        
        // We need to modify renderInventoryTable slightly to handle pre-filtered data 
        // OR just handle the pagination manually here. 
        // For simplicity with your existing structure:
        
        // We will override the render function's internal filtering by passing the filtered list
        // AND telling the render function "Assume this data is already clean".
        
        // Actually, the easiest way is to let renderInventoryTable do pagination on whatever array we give it.
        // But renderInventoryTable currently filters `activeData`.
        // Let's rely on `renderInventoryTable` to filter archived, and we filter the rest here.
        
        // Wait, if we filter here, we pass a smaller array. 
        // `renderInventoryTable` takes that smaller array, filters active (which are already active), 
        // and paginates. This works fine.
        renderInventoryTable(filtered);
    }

    if (searchInput) searchInput.oninput = applyInventoryFilters;
    if (categoryFilter) categoryFilter.onchange = applyInventoryFilters;
    if (statusFilter) statusFilter.onchange = applyInventoryFilters;

    if (refreshBtn) {
        refreshBtn.onclick = () => {
            searchInput.value = '';
            categoryFilter.value = '';
            statusFilter.value = '';
            
            paginationState.inventory.currentPage = 1;
            fetchAndRenderInventory();
            showInventoryToast("Inventory refreshed successfully!");
        };
    }

    if (downloadBtn) {
        downloadBtn.onclick = () => {
            // Download only active items
            const activeData = inventoryDataList.filter(item => item.is_archived != 1);
            const headers = ['ID', 'Name', 'Category', 'Qty', 'Description', 'Status', 'Stock In Date'];
            const tableData = activeData.map(row => [
                row.ItemID, row.ItemName, row.Category, row.ItemQuantity, 
                row.ItemDescription || '', row.ItemStatus, row.DateofStockIn
            ]);
            downloadData(headers, tableData, "Inventory List", "inventory_list");
        };
    }
}

function initInventoryHistoryFilters() {
    const searchInput = document.getElementById('invHistSearchInput');
    const categoryFilter = document.getElementById('invHistCategoryFilter');
    const actionFilter = document.getElementById('invHistActionFilter');
    const refreshBtn = document.getElementById('invHistRefreshBtn');
    const downloadBtn = document.getElementById('invHistDownloadBtn');

    function applyInvHistFilters() {
        const search = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const action = actionFilter.value;
        
        const filtered = inventoryHistoryDataList.filter(row => 
            ((row.ItemName && row.ItemName.toLowerCase().includes(search)) ||
            (row.Category && row.Category.toLowerCase().includes(search)) ||
            (row.PerformedBy && row.PerformedBy.toLowerCase().includes(search))) &&
            (category === "" || row.Category === category) &&
            (action === "" || row.ActionType === action)
        );
        
        paginationState.inventoryHistory.currentPage = 1;
        renderInventoryHistoryTable(filtered);
    }

    if (searchInput) searchInput.oninput = applyInvHistFilters;
    if (categoryFilter) categoryFilter.onchange = applyInvHistFilters;
    if (actionFilter) actionFilter.onchange = applyInvHistFilters;

    if (refreshBtn) {
        refreshBtn.onclick = () => {
            searchInput.value = '';
            categoryFilter.value = '';
            actionFilter.value = '';
            
            paginationState.inventoryHistory.currentPage = 1;
            fetchAndRenderInventoryHistory();
            showInventoryToast("History refreshed successfully!");
        };
    }

    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const headers = ['Log ID', 'Name', 'Category', 'Old Qty', 'Change', 'New Qty', 'Status', 'Stock In', 'Performed By'];
            const tableData = inventoryHistoryDataList.map(row => [
                row.InvLogID, row.ItemName, row.Category, row.OldQuantity, 
                row.QuantityChange, row.NewQuantity, row.ItemStatus, 
                row.DateofStockIn || 'N/A', row.PerformedBy
            ]);
            downloadData(headers, tableData, "Inventory History Logs", "inventory_history");
        };
    }
}

// =============================================
// 6. INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on a page that actually has these elements
    // or if the script is loaded specifically for admin inventory.
    
    // In admin.php, this script is included at the bottom.
    // We can check if the tabs exist.
    if(document.getElementById('inventoryTableBody')) {
        // Fetch Table Data (Which also populates dropdowns now)
        fetchAndRenderInventory();
        fetchAndRenderInventoryHistory();
    }
});