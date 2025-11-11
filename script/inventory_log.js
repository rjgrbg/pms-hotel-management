// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- START: Header/Sidebar/Logout Logic ---
    const profileBtn = document.getElementById('profileBtn');
    const profileSidebar = document.getElementById('profile-sidebar');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutBtn = document.getElementById('closeLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const accountDetailsLink = document.getElementById('account-details-link');

    // Show profile sidebar
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileSidebar.classList.add('active');
        });
    }

    // Hide profile sidebar
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', () => {
            profileSidebar.classList.remove('active');
        });
    }

    // Hide profile sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (profileSidebar && !profileSidebar.contains(e.target) && !profileBtn.contains(e.target)) {
            profileSidebar.classList.remove('active');
        }
    });

    // Show logout modal
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(logoutModal) logoutModal.style.display = 'flex';
            profileSidebar.classList.remove('active');
        });
    }

    // Hide logout modal (Close button)
    if (closeLogoutBtn) {
        closeLogoutBtn.addEventListener('click', () => {
            if(logoutModal) logoutModal.style.display = 'none';
        });
    }

    // Hide logout modal (Cancel button)
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            if(logoutModal) logoutModal.style.display = 'none';
        });
    }

    // Confirm logout
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            window.location.href = 'logout.php';
        });
    }

    // Handle Account Details link click
    if (accountDetailsLink) {
        accountDetailsLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert("Account details cannot be edited from this page.");
            profileSidebar.classList.remove('active');
        });
    }
    // --- END: Header/Sidebar/Logout Logic ---

    // --- DOM Element References ---
    const inventoryTableBody = document.getElementById('inventoryTableBody');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const itemDetailsContent = document.getElementById('itemDetailsContent');
    const doneBtn = document.getElementById('doneBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // Message Box (Success)
    const messageBoxBackdrop = document.getElementById('messageBoxBackdrop');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxText = document.getElementById('messageBoxText');
    const messageBoxClose = document.getElementById('messageBoxClose');
    
    // Confirmation Modal
    const confirmationModalBackdrop = document.getElementById('confirmationModalBackdrop');
    const confirmationModalBody = document.getElementById('confirmationModalBody');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const confirmBtn = document.getElementById('confirmBtn');

    // --- Application State ---
    let allInventory = [];
    let filteredInventory = [];
    let selectedItems = {}; 

    // --- Utility Functions ---

    // Show/Hide Modals
    const showModal = (modal) => modal.style.display = 'flex';
    const hideModal = (modal) => modal.style.display = 'none';

    // Show Message Box
    const showMessageBox = (title, text, isError = false) => {
        messageBoxTitle.textContent = title;
        messageBoxText.textContent = text;
        messageBoxTitle.style.color = isError ? '#dc3545' : '#480C1B';
        showModal(messageBoxBackdrop);
    };

    // Handle API Errors
    const handleFetchError = (message) => {
        console.error(message);
        showMessageBox("Error", message, true);
    };

    // --- Data Fetching ---

    // Fetch Categories
    const fetchCategories = async () => {
        try {
            const response = await fetch('inventory_actions.php?action=get_categories');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            // Populate category filter
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            data.forEach(category => {
                const option = document.createElement('option');
                option.value = category.ItemCategoryName;
                option.textContent = category.ItemCategoryName;
                categoryFilter.appendChild(option);
            });
        } catch (error) {
            handleFetchError(`Failed to load categories: ${error.message}`);
        }
    };

    // Fetch Inventory
    const fetchInventory = async () => {
        try {
            const response = await fetch('inventory_actions.php?action=get_inventory');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            if (data.error) throw new Error(data.error);
            
            allInventory = data;
            applyFiltersAndRender();
        } catch (error) {
            handleFetchError(`Failed to load inventory: ${error.message}`);
        }
    };

    // --- Rendering ---

    // Render Table
    const renderInventoryTable = () => {
        inventoryTableBody.innerHTML = '';
        
        if (filteredInventory.length === 0) {
            inventoryTableBody.innerHTML = '<tr><td colspan="5">No items found.</td></tr>';
            return;
        }

        filteredInventory.forEach(item => {
            const row = document.createElement('tr');
            
            if (selectedItems[item.ItemID]) {
                row.classList.add('selected');
            }

            // Apply status class based on stock
            let statusClass = '';
            if (item.ItemStatus === 'Out of Stock') {
                statusClass = 'status-out-of-stock';
            } else if (item.ItemStatus === 'Low Stock') {
                statusClass = 'status-low-stock';
            } else {
                statusClass = 'status-in-stock';
            }

            row.innerHTML = `
                <td>${item.ItemName}</td>
                <td>${item.Category}</td>
                <td>${item.ItemQuantity}</td>
                <td><span class="status-badge ${statusClass}">${item.ItemStatus}</span></td>
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

    // Apply Filters and Re-render
    const applyFiltersAndRender = () => {
        const category = categoryFilter.value;
        const search = searchInput.value.toLowerCase();

        filteredInventory = allInventory.filter(item => {
            const matchesCategory = !category || item.Category === category;
            const matchesSearch = !search || item.ItemName.toLowerCase().includes(search);
            return matchesCategory && matchesSearch;
        });

        renderInventoryTable();
    };

    // Render Right-Side Details Panel
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
                    <span class="item-name">${item.name}</span>
                    <span class="item-category">${item.category}</span>
                </div>
                <div class="item-controls">
                    <button class="control-btn remove-btn">&times;</button>
                    <button class="control-btn decrease-btn" ${item.issueQty <= 0 ? 'disabled' : ''}>-</button>
                    <input type="number" class="quantity-input" value="${item.issueQty}" min="0" max="${item.stock}">
                    <button class="control-btn increase-btn" ${item.issueQty >= item.stock ? 'disabled' : ''}>+</button>
                </div>
            `;

            itemDetailsContent.appendChild(itemDiv);
        }
    };

    // --- Event Handlers ---

    // Table Row Click (triggered by the 'Issue' button)
    const handleRowClick = (item, row) => {
        const itemID = item.ItemID;
        
        if (item.ItemQuantity <= 0 && !selectedItems[itemID]) {
             showMessageBox("Out of Stock", "This item is out of stock and cannot be issued.", true);
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

    // Details Panel Controls (Event Delegation)
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

    // Handle manual input in quantity field
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

    // Filter/Search Listeners
    categoryFilter.addEventListener('change', applyFiltersAndRender);
    searchInput.addEventListener('input', applyFiltersAndRender);

    // "Cancel" Button
    cancelBtn.addEventListener('click', () => {
        resetIssueProcess();
    });

    // "Done" Button
    doneBtn.addEventListener('click', () => {
        const itemsToIssue = Object.entries(selectedItems)
            .filter(([id, item]) => item.issueQty > 0)
            .map(([id, item]) => ({ id, ...item }));

        if (itemsToIssue.length === 0) {
            showMessageBox("No Items", "You have not set a quantity for any item.", true);
            return;
        }

        confirmationModalBody.innerHTML = '';
        itemsToIssue.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'confirm-item';
            itemEl.innerHTML = `
                <span class="confirm-name">${item.name}</span>
                <span class="confirm-qty">QTY: ${item.issueQty}</span>
            `;
            confirmationModalBody.appendChild(itemEl);
        });

        showModal(confirmationModalBackdrop);
    });

    // --- Main Issuing Logic ---

    // Reset Process
    const resetIssueProcess = () => {
        selectedItems = {};
        renderDetailsPanel();
        applyFiltersAndRender();
        hideModal(confirmationModalBackdrop);
    };

    // Confirmation Modal: "Confirm"
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

            let title = "Process Complete";
            let message = "";

            if (successes.length > 0) {
                message += "Successfully issued:\n" + successes.map(item => `- ${item.item_name} (Qty: ${-item.stock_adjustment})`).join('\n');
            }

            if (errors.length > 0) {
                message += "\n\nFailed to issue:\n" + errors.map(err => `- ${err.error || 'Unknown error'}`).join('\n');
                title = "Error During Issue";
            }

            showMessageBox(title, message, errors.length > 0);
            
            fetchInventory();

        } catch (error) {
            showMessageBox("API Error", `A critical error occurred: ${error.message}`, true);
        }
        
        resetIssueProcess();
    });

    // Confirmation Modal: "Cancel"
    cancelConfirmBtn.addEventListener('click', () => {
        hideModal(confirmationModalBackdrop);
    });

    // Message Box: "OK"
    messageBoxClose.addEventListener('click', () => {
        hideModal(messageBoxBackdrop);
    });
    
    // --- Initial Load ---
    const initialize = async () => {
        await fetchCategories();
        await fetchInventory();
    };

    initialize();
});