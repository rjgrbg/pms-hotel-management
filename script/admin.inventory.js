/**
 * INVENTORY MODULE JAVASCRIPT
 * Features: DB Filters (Categories), Toast, Landscape PDF, Dashboard Updates
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

// --- PDF EXPORT FUNCTION ---
function downloadInventoryPDF(headers, data, title, filename) {
    if (!window.jspdf) {
        alert("PDF Library not loaded.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

    // Header
    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27); // #480c1b
    doc.text(title, 14, 20);
    
    // Date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    // Table
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak', textColor: 50 },
        headStyles: { fillColor: '#480c1b', textColor: '#ffffff', fontStyle: 'bold', halign: 'center' },
        columnStyles: { 4: { cellWidth: 60 } }
    });

    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// =============================================
// 2. DYNAMIC DROPDOWN POPULATION (DATABASE CONNECTION)
// =============================================

async function fetchInventoryDropdowns() {
    console.log("Fetching dropdown categories..."); // Debug log

    try {
        const response = await fetch('fetch_filters.php'); 
        const data = await response.json();

        console.log("Filter Data Received:", data); // Debug log

        if (data.categories) {
            // Populate "Items" Tab Filter
            populateCategorySelect('inventoryCategoryFilter', data.categories);
            
            // Populate "History" Tab Filter
            populateCategorySelect('invHistCategoryFilter', data.categories);
        }
    } catch (error) {
        console.error('Error loading inventory categories:', error);
    }
}

function populateCategorySelect(elementId, categories) {
    const select = document.getElementById(elementId);
    if (!select) return;

    // Save current selection
    const currentVal = select.value;
    
    // Keep the first "Category" option, wipe the rest
    select.innerHTML = `<option value="">Category</option>`;

    categories.forEach(catName => {
        const option = document.createElement('option');
        option.value = catName; 
        option.textContent = catName;
        select.appendChild(option);
    });

    // Restore selection if it still exists in the new list
    if (currentVal) select.value = currentVal;
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

        // Update Dashboard Stats
        try {
            const totalItems = inventoryDataList.length;
            const lowStock = inventoryDataList.filter(item => item.ItemStatus === 'Low Stock').length;
            const outOfStock = inventoryDataList.filter(item => item.ItemStatus === 'Out of Stock').length;
            
            // Assumes updateStatCard function exists globally
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
        renderPaginationControls('inv-items-tab', 0, 1, () => {});
    } else {
        inventoryDataList = [];
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #c33;">Failed to load data</td></tr>`;
    }
    
    // Initialize filters AFTER data is loaded
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
    } else if (result && Array.isArray(result) && result.length === 0) {
        inventoryHistoryDataList = [];
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history records found.</td></tr>';
        document.getElementById('invHistRecordCount').textContent = 0;
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
    const totalPages = getTotalPages(data.length, state.itemsPerPage);
    const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(row => {
            const statusText = row.ItemStatus === 'In Stock' ? 'In Stock' : 
                            row.ItemStatus === 'Low Stock' ? 'Low Stock' : 'Out of Stock';
            const statusClass = statusText.toLowerCase().replace(/ /g, '-');
            
            // --- FIX: Escape HTML ---
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
    if(countEl) countEl.textContent = data.length;

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
            
            // --- FIX: Escape HTML ---
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
    // Call this here to ensure dropdowns are filled
    fetchInventoryDropdowns();

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
        
        const filtered = inventoryDataList.filter(row => 
            (row.ItemName.toLowerCase().includes(search) ||
            row.Category.toLowerCase().includes(search) ||
            (row.ItemDescription && row.ItemDescription.toLowerCase().includes(search))) &&
            (category === "" || row.Category === category) &&
            (!status || row.ItemStatus === status)
        );
        
        paginationState.inventory.currentPage = 1;
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
            
            // Re-fetch dropdowns too
            fetchInventoryDropdowns();
            
            paginationState.inventory.currentPage = 1;
            fetchAndRenderInventory();
            showInventoryToast("Inventory refreshed successfully!");
        };
    }

    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const headers = ['ID', 'Name', 'Category', 'Qty', 'Description', 'Status', 'Stock In Date'];
            const tableData = inventoryDataList.map(row => [
                row.ItemID, row.ItemName, row.Category, row.ItemQuantity, 
                row.ItemDescription || '', row.ItemStatus, row.DateofStockIn
            ]);
            downloadInventoryPDF(headers, tableData, "Inventory List", "inventory_list");
        };
    }
}

function initInventoryHistoryFilters() {
    // Categories fetched by previous init function share the same data source
    
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
            downloadInventoryPDF(headers, tableData, "Inventory History Logs", "inventory_history");
        };
    }
}

// =============================================
// 6. INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('inventory-page')) {
        // 1. Fetch Dropdowns First
        fetchInventoryDropdowns();
        
        // 2. Fetch Table Data
        fetchAndRenderInventory();
        fetchAndRenderInventoryHistory();
    }
});