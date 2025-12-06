
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {

    // ======================================================
    // === 1. INJECT TOAST CSS STYLES
    // ======================================================
    const style = document.createElement('style');
    style.innerHTML = `
    .toast-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #28a745;
      color: white;
      padding: 12px 24px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
      z-index: 99999;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease-in-out;
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      pointer-events: none;
    }
    .toast-notification.show {
      opacity: 1;
      transform: translateY(0);
    }
    `;
    document.head.appendChild(style);

    // ======================================================
    // === 2. HELPER FUNCTIONS
    // ======================================================

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerText = message;

        if (type === 'error') {
            toast.style.backgroundColor = '#dc3545';
        } else {
            toast.style.backgroundColor = '#28a745';
        }

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    };

    const showModal = (modal) => modal.style.display = 'flex';
    const hideModal = (modal) => modal.style.display = 'none';

    // OLD Message Box (Kept as fallback)
    const messageBoxBackdrop = document.getElementById('messageBoxBackdrop');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxText = document.getElementById('messageBoxText');
    const messageBoxClose = document.getElementById('messageBoxClose');

    const showMessageBox = (title, text, isError = false) => {
        messageBoxTitle.textContent = title;
        messageBoxText.textContent = text;
        messageBoxTitle.style.color = isError ? '#dc3545' : '#480C1B';
        showModal(messageBoxBackdrop);
    };

    const handleFetchError = (message) => {
        console.error(message);
        showToast(message, 'error');
    };

    // --- NEW: Populate Filter Dropdown from Actual Data ---
    const populateFilterDropdown = (data, dropdown) => {
        if (!dropdown) return;
        
        const currentValue = dropdown.value;
        
        // Extract unique categories from the data items
        const categories = [...new Set(data.map(item => item.Category))].filter(c => c).sort();

        // Clear existing options (except the first "All Categories" option)
        while (dropdown.options.length > 1) {
            dropdown.remove(1);
        }

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            dropdown.appendChild(option);
        });
        
        // Restore selection if possible
        dropdown.value = currentValue;
    };

    // --- DOM Element References ---
    const profileBtn = document.getElementById('profileBtn');
    const profileSidebar = document.getElementById('profile-sidebar');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutBtn = document.getElementById('closeLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const accountDetailsLink = document.getElementById('account-details-link');

    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileSidebar.classList.add('active');
        });
    }
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', () => {
            profileSidebar.classList.remove('active');
        });
    }
    document.addEventListener('click', (e) => {
        if (profileSidebar && !profileSidebar.contains(e.target) && !profileBtn.contains(e.target)) {
            profileSidebar.classList.remove('active');
        }
    });
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(logoutModal) logoutModal.style.display = 'flex';
            profileSidebar.classList.remove('active');
        });
    }
    if (closeLogoutBtn) {
        closeLogoutBtn.addEventListener('click', () => {
            if(logoutModal) logoutModal.style.display = 'none';
        });
    }
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            if(logoutModal) logoutModal.style.display = 'none';
        });
    }
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            window.location.href = 'logout.php';
        });
    }
    if (accountDetailsLink) {
        accountDetailsLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert("Account details cannot be edited from this page.");
            profileSidebar.classList.remove('active');
        });
    }

    const inventoryTableBody = document.getElementById('inventoryTableBody');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const itemDetailsContent = document.getElementById('itemDetailsContent');
    const doneBtn = document.getElementById('doneBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    const confirmationModalBackdrop = document.getElementById('confirmationModalBackdrop');
    const confirmationModalBody = document.getElementById('confirmationModalBody');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const confirmBtn = document.getElementById('confirmBtn');

    // --- Application State ---
    let allInventory = [];
    let filteredInventory = [];
    let selectedItems = {}; 

    // --- Data Fetching ---

    const fetchCategories = async () => {
        try {
            const response = await fetch('inventory_actions.php?action=get_categories');
            if (!response.ok) throw new Error('Network response was not ok');
            // We fetch this to ensure categories exist, but we DO NOT populate the filter here anymore.
            await response.json();
        } catch (error) {
            handleFetchError(`Failed to load categories: ${error.message}`);
        }
    };

    const fetchInventory = async () => {
        try {
            const response = await fetch('inventory_actions.php?action=get_inventory');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            if (data.error) throw new Error(data.error);
            
            allInventory = data;
            
            // *** NEW: Populate Filter using only ACTIVE (non-archived) items ***
            const activeItems = allInventory.filter(item => item.is_archived != 1);
            populateFilterDropdown(activeItems, categoryFilter);

            applyFiltersAndRender();
        } catch (error) {
            handleFetchError(`Failed to load inventory: ${error.message}`);
        }
    };

    // --- Rendering ---

    const renderInventoryTable = () => {
        inventoryTableBody.innerHTML = '';
        
        if (filteredInventory.length === 0) {
            inventoryTableBody.innerHTML = '<tr><td colspan="5">No items found.</td></tr>';
            return;
        }

        filteredInventory.forEach(item => {
            // HIDE archived items from table
            if (item.is_archived == 1) return;

            const row = document.createElement('tr');
            
            if (selectedItems[item.ItemID]) {
                row.classList.add('selected');
            }

            let statusClass = '';
            if (item.ItemStatus === 'Out of Stock') {
                statusClass = 'status-out-of-stock';
            } else if (item.ItemStatus === 'Low Stock') {
                statusClass = 'status-low-stock';
            } else {
                statusClass = 'status-in-stock';
            }

            row.innerHTML = `
                <td>${escapeHtml(item.ItemName)}</td>
                <td>${escapeHtml(item.Category)}</td>
                <td>${escapeHtml(item.ItemQuantity)}</td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(item.ItemStatus)}</span></td>
                <td>
                    <button class="action-btn issue-btn" data-item-id="${item.ItemID}" ${item.ItemQuantity <= 0 ? 'disabled' : ''}>
                        Issue
                    </button>
                </td>
            `;

            const issueBtn = row.querySelector('.issue-btn');
            if (issueBtn) {
                issueBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleRowClick(item, row);
                });
            }

            inventoryTableBody.appendChild(row);
        });
    };

    const applyFiltersAndRender = () => {
        const category = categoryFilter.value;
        const search = searchInput.value.toLowerCase();

        filteredInventory = allInventory.filter(item => {
            const matchesCategory = !category || item.Category === category;
            const matchesSearch = !search || item.ItemName.toLowerCase().includes(search);
            const notArchived = item.is_archived != 1; 
            return matchesCategory && matchesSearch && notArchived;
        });

        renderInventoryTable();
    };

   const renderDetailsPanel = () => {
        if (Object.keys(selectedItems).length === 0) {
            itemDetailsContent.innerHTML = '<p class="placeholder-text">Select an item from the table to get started.</p>';
            doneBtn.disabled = true;
            return;
        }

        itemDetailsContent.innerHTML = '';
        doneBtn.disabled = false;

        for (const itemID in selectedItems) {
            const item = selectedItems[itemID];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'details-item';
            itemDiv.setAttribute('data-item-id', itemID);
            
            itemDiv.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    <span class="item-category">${escapeHtml(item.category)}</span>
                </div>
                <div class="item-controls">
                    <button class="control-btn remove-btn">&times;</button>
                    <button class="control-btn decrease-btn" ${item.issueQty <= 0 ? 'disabled' : ''}>-</button>
                    <input type="number" class="quantity-input" value="${escapeHtml(item.issueQty)}" min="0" max="${escapeHtml(item.stock)}">
                    <button class="control-btn increase-btn" ${item.issueQty >= item.stock ? 'disabled' : ''}>+</button>
                </div>
            `;

            itemDetailsContent.appendChild(itemDiv);
        }
    };

    // --- Event Handlers ---

    const handleRowClick = (item, row) => {
        const itemID = item.ItemID;
        
        if (item.ItemQuantity <= 0 && !selectedItems[itemID]) {
             showToast("This item is out of stock.", "error");
             return;
        }

        if (selectedItems[itemID]) {
            delete selectedItems[itemID];
            row.classList.remove('selected');
        } else {
            selectedItems[itemID] = {
                name: item.ItemName,
                category: item.Category,
                categoryId: item.ItemCategoryID,
                stock: item.ItemQuantity,
                issueQty: 0,
                status: item.ItemStatus,
                description: item.ItemDescription || ''
            };
            row.classList.add('selected');
        }
        
        renderDetailsPanel();
    };

    itemDetailsContent.addEventListener('click', (e) => {
        const target = e.target;
        const itemDiv = target.closest('.details-item');
        if (!itemDiv) return;
        
        const itemID = itemDiv.dataset.itemId;
        const item = selectedItems[itemID];
        const qtyInput = itemDiv.querySelector('.quantity-input');
        const decBtn = itemDiv.querySelector('.decrease-btn');
        const incBtn = itemDiv.querySelector('.increase-btn');

        if (target.classList.contains('decrease-btn')) {
            let qty = parseInt(qtyInput.value);
            if (qty > 0) {
                qty--;
                qtyInput.value = qty;
                item.issueQty = qty;
            }
        } 
        else if (target.classList.contains('increase-btn')) {
            let qty = parseInt(qtyInput.value);
            if (qty < item.stock) {
                qty++;
                qtyInput.value = qty;
                item.issueQty = qty;
            }
        } 
        else if (target.classList.contains('remove-btn')) {
            delete selectedItems[itemID];
            renderDetailsPanel();
            const tableRow = [...inventoryTableBody.querySelectorAll('tr')].find(
                row => row.querySelector('.issue-btn')?.dataset.itemId == itemID
            );
            if (tableRow) tableRow.classList.remove('selected');
        }

        if (item) {
            decBtn.disabled = item.issueQty <= 0;
            incBtn.disabled = item.issueQty >= item.stock;
        }
    });

    itemDetailsContent.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('quantity-input')) {
            const itemDiv = target.closest('.details-item');
            const itemID = itemDiv.dataset.itemId;
            const item = selectedItems[itemID];
            
            let qty = parseInt(target.value);
            
            if (isNaN(qty) || qty < 0) {
                qty = 0;
            } else if (qty > item.stock) {
                qty = item.stock;
            }
            
            target.value = qty;
            item.issueQty = qty;

            itemDiv.querySelector('.decrease-btn').disabled = qty <= 0;
            itemDiv.querySelector('.increase-btn').disabled = qty >= item.stock;
        }
    });

    categoryFilter.addEventListener('change', applyFiltersAndRender);
    searchInput.addEventListener('input', applyFiltersAndRender);

    cancelBtn.addEventListener('click', () => {
        resetIssueProcess();
    });

    doneBtn.addEventListener('click', () => {
        const itemsToIssue = Object.entries(selectedItems)
            .filter(([id, item]) => item.issueQty > 0)
            .map(([id, item]) => ({ id, ...item }));

        if (itemsToIssue.length === 0) {
            showToast("Please set a quantity for at least one item.", "error");
            return;
        }

        confirmationModalBody.innerHTML = '';
        itemsToIssue.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'confirm-item';
            itemEl.innerHTML = `
                <span class="confirm-name">${escapeHtml(item.name)}</span>
                <span class="confirm-qty">QTY: ${item.issueQty}</span>
            `;
            confirmationModalBody.appendChild(itemEl);
        });

        showModal(confirmationModalBackdrop);
    });

    // --- Main Issuing Logic ---

    const resetIssueProcess = () => {
        selectedItems = {};
        renderDetailsPanel();
        applyFiltersAndRender();
        hideModal(confirmationModalBackdrop);
    };

    confirmBtn.addEventListener('click', async () => {
        const itemsToIssue = Object.entries(selectedItems)
            .filter(([id, item]) => item.issueQty > 0)
            .map(([id, item]) => ({ 
                item_id: id,
                stock_adjustment: -item.issueQty,
                item_name: item.name,
                category_id: item.categoryId,
                description: item.description,
                status: item.status
            }));

        if (itemsToIssue.length === 0) {
            hideModal(confirmationModalBackdrop);
            return;
        }

        const updatePromises = itemsToIssue.map(item => {
            const formData = new FormData();
            formData.append('item_id', item.item_id);
            formData.append('name', item.item_name);
            formData.append('category_id', item.category_id);
            formData.append('description', item.description);
            formData.append('stock_adjustment', item.stock_adjustment);
            formData.append('status', item.status);

            return fetch('inventory_actions.php?action=issue_item', {
                method: 'POST',
                body: formData
            }).then(response => response.json());
        });

        try {
            const results = await Promise.all(updatePromises);
            
            const errors = results.filter(res => !res.success);
            const successes = itemsToIssue.filter((item, index) => results[index].success);

            if (errors.length > 0) {
                showToast("Some items failed to issue.", "error");
            } else if (successes.length > 0) {
                showToast("Items issued successfully!");
            }
            
            fetchInventory();

        } catch (error) {
            showToast("Critical error occurred while issuing items.", "error");
        }
        
        resetIssueProcess();
    });

    cancelConfirmBtn.addEventListener('click', () => {
        hideModal(confirmationModalBackdrop);
    });

    if (messageBoxClose) {
        messageBoxClose.addEventListener('click', () => {
            hideModal(messageBoxBackdrop);
        });
    }
    
    // --- Initial Load ---
    const initialize = async () => {
        await fetchCategories();
        await fetchInventory();
    };

    initialize();
});