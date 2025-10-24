// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const inventoryTableBody = document.getElementById('inventoryTableBody');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const itemDetailsContent = document.getElementById('itemDetailsContent');
    const doneBtn = document.getElementById('doneBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const logoutIcon = document.querySelector('.logout-icon');

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

    // Logout Modal
    const logoutModalBackdrop = document.getElementById('logoutModalBackdrop');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    // --- State Variables ---
    let itemsToIssue = {}; // Stores { itemId: quantity }
    let currentFilteredData = []; // Stores the data currently being shown in the main table

    // --- Helper Functions ---

    /**
     * Shows a modal backdrop by setting its display to 'flex'.
     * @param {HTMLElement} backdropElement - The backdrop element to show.
     */
    function showModal(backdropElement) {
        if (backdropElement) {
            backdropElement.style.display = 'flex';
        }
    }

    /**
     * Hides a modal backdrop by setting its display to 'none'.
     * @param {HTMLElement} backdropElement - The backdrop element to hide.
     */
    function hideModal(backdropElement) {
        if (backdropElement) {
            backdropElement.style.display = 'none';
        }
    }

    /**
     * Shows a custom message box with a title and text.
     * @param {string} title - The title for the message box.
     * @param {string} text - The text content for the message box.
     */
    function showMessageBox(title, text) {
        messageBoxTitle.textContent = title;
        messageBoxText.textContent = text; // Using textContent preserves line breaks with <pre>
        showModal(messageBoxBackdrop);
    }

    // --- Initialization ---

    /**
     * Populates the category filter dropdown from the data.
     */
    function populateCategories() {
        // Use inventoryData from shared-data.js
        const categories = [...new Set(inventoryData.map(item => item.category))];
        categories.sort();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    /**
     * Renders the main inventory table based on the provided data.
     * @param {Array} data - The array of inventory items to render.
     */
    function renderInventoryTable(data) {
        inventoryTableBody.innerHTML = ''; // Clear existing rows
        if (data.length === 0) {
            inventoryTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No items found.</td></tr>';
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.itemId = item.id;
            const issueQty = itemsToIssue[item.id] || 0;

            let itemsToIssueHtml;
            if (item.quantity === 0) {
                itemsToIssueHtml = '<span class="out-of-stock-label">Out of stock</span>';
            } else {
                itemsToIssueHtml = `
                    <div class="quantity-controls">
                        <button class="qty-btn subtract" data-item-id="${item.id}" aria-label="Decrease quantity">-</button>
                        <span class="current-qty" data-item-id="${item.id}">${issueQty}</span>
                        <button class="qty-btn add" data-item-id="${item.id}" aria-label="Increase quantity">+</button>
                    </div>
                `;
            }

            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity > 0 ? item.quantity : '-'}</td>
                <td>${item.description}</td>
                <td>${itemsToIssueHtml}</td>
            `;

            // Add click listener to the whole row
            row.addEventListener('click', () => {
                // Find the item in the original inventoryData
                const selectedItem = inventoryData.find(i => i.id === item.id);
                if (selectedItem) {
                    // Highlight the row
                    document.querySelectorAll('.inventory-table tbody tr').forEach(r => r.classList.remove('selected-row'));
                    row.classList.add('selected-row');
                }
            });

            inventoryTableBody.appendChild(row);
        });
    }

    /**
     * Renders the "Item Details" list based on the itemsToIssue state.
     */
    function renderItemDetailsList() {
        itemDetailsContent.innerHTML = ''; // Clear the list

        const items = Object.keys(itemsToIssue).map(id => {
            const item = inventoryData.find(i => i.id == id);
            return { ...item, issueQty: itemsToIssue[id] };
        }).filter(item => item.issueQty > 0); // Only show items with quantity > 0

        if (items.length === 0) {
            itemDetailsContent.innerHTML = '<p class="empty-details">No items selected to issue.</p>';
            return;
        }

        // Create a table for the details
        const table = document.createElement('table');
        table.className = 'details-list-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Items to Issue</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.category}</td>
                        <td>${item.issueQty}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        itemDetailsContent.appendChild(table);
    }

    /**
     * Renders the confirmation modal list.
     */
    function renderConfirmationList() {
        confirmationModalBody.innerHTML = ''; // Clear previous list

        const items = Object.keys(itemsToIssue).map(id => {
            const item = inventoryData.find(i => i.id == id);
            return { ...item, issueQty: itemsToIssue[id] };
        }).filter(item => item.issueQty > 0);

        if (items.length === 0) {
            // This should not happen if "Done" is clicked with items, but as a fallback
            confirmationModalBody.innerHTML = '<p style="padding: 20px;">No items selected.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'details-list-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Items to Issue</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.category}</td>
                        <td>${item.issueQty}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        confirmationModalBody.appendChild(table);
    }


    /**
     * Handles the "Add" or "Subtract" button clicks in the table.
     * @param {Event} e - The click event.
     */
    function handleQuantityClick(e) {
        const target = e.target;
        if (!target.classList.contains('qty-btn')) return;
        
        const itemId = target.dataset.itemId;
        if (!itemId) return;

        const item = inventoryData.find(i => i.id == itemId);
        if (!item || item.quantity === 0) return; // Ignore clicks for out-of-stock items

        let currentIssueQty = itemsToIssue[itemId] || 0;

        if (target.classList.contains('add')) {
            if (currentIssueQty < item.quantity) {
                currentIssueQty++;
            } else {
                // Optional: Show a message that stock limit is reached
                // showMessageBox("Stock Limit", `Cannot issue more than the available ${item.quantity} units of ${item.name}.`);
            }
        } else if (target.classList.contains('subtract')) {
            if (currentIssueQty > 0) {
                currentIssueQty--;
            }
        }

        // Update the state
        itemsToIssue[itemId] = currentIssueQty;

        // Update the quantity in the table
        const qtySpan = inventoryTableBody.querySelector(`.current-qty[data-item-id="${itemId}"]`);
        if (qtySpan) {
            qtySpan.textContent = currentIssueQty;
        }

        // Re-render the "Item Details" list
        renderItemDetailsList();
    }

    /**
     * Filters the inventory table based on category and search term.
     */
    function filterAndRenderTable() {
        const category = categoryFilter.value.toLowerCase();
        const searchTerm = searchInput.value.toLowerCase();

        currentFilteredData = inventoryData.filter(item => {
            const matchesCategory = !category || item.category.toLowerCase() === category;
            const matchesSearch = !searchTerm ||
                                item.name.toLowerCase().includes(searchTerm) ||
                                item.description.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        renderInventoryTable(currentFilteredData);
    }

    /**
     * Resets the entire issuing process.
     */
    function resetIssueProcess() {
        itemsToIssue = {};
        filterAndRenderTable();
        renderItemDetailsList();
        document.querySelectorAll('.inventory-table tbody tr').forEach(r => r.classList.remove('selected-row'));
    }

    // --- Event Listeners ---

    // Table quantity button clicks
    inventoryTableBody.addEventListener('click', handleQuantityClick);

    // Filters
    categoryFilter.addEventListener('change', filterAndRenderTable);
    searchInput.addEventListener('input', filterAndRenderTable);

    // "Done" button (Show Confirmation Modal)
    doneBtn.addEventListener('click', () => {
        const items = Object.values(itemsToIssue).filter(qty => qty > 0);
        if (items.length === 0) {
            showMessageBox("No Items Selected", "Please select a quantity for at least one item to issue.");
            return;
        }
        renderConfirmationList();
        showModal(confirmationModalBackdrop);
    });

    // "Cancel" button (Clear selections)
    cancelBtn.addEventListener('click', ()=> {
        resetIssueProcess();
    });

    // Confirmation Modal: "Confirm"
    confirmBtn.addEventListener('click', ()=> {
        let issuedItemsList = [];
        let errorList = [];

        // Process the items
        for (const itemId in itemsToIssue) {
            const quantityToIssue = itemsToIssue[itemId];
            if (quantityToIssue > 0) {
                const item = inventoryData.find(i => i.id == itemId);
                if (item) {
                    if (item.quantity >= quantityToIssue) {
                        // Subtract the quantity
                        item.quantity -= quantityToIssue;
                        issuedItemsList.push(`- ${quantityToIssue} x ${item.name}`);
                    } else {
                        // This case should be prevented by the UI, but as a safeguard
                        errorList.push(`- Not enough stock for ${item.name}`);
                    }
                }
            }
        }

        // Close confirmation modal
        hideModal(confirmationModalBackdrop);

        // Reset the state
        resetIssueProcess();

        // Show success message
        if (issuedItemsList.length > 0) {
            const successTitle = "Items Issued Successfully";
            const successText = "The following items have been deducted from inventory:\n\n" + issuedItemsList.join('\n');
            showMessageBox(successTitle, successText);
        }
    });

    // Confirmation Modal: "Cancel"
    cancelConfirmBtn.addEventListener('click', () => {
        hideModal(confirmationModalBackdrop);
    });

    // Message Box: "OK"
    messageBoxClose.addEventListener('click', () => {
        hideModal(messageBoxBackdrop);
    });

    // Logout Icon
    logoutIcon.addEventListener('click', () => {
        showModal(logoutModalBackdrop);
    });

    // Logout Modal: "Cancel"
    cancelLogoutBtn.addEventListener('click', () => {
        hideModal(logoutModalBackdrop);
    });

    // Logout Modal: "Confirm"
    confirmLogoutBtn.addEventListener('click', () => {
        hideModal(logoutModalBackdrop);
        window.location.href = 'inventory_log_logout.php';
    });
    
    // --- Initial Load ---
    populateCategories();
    filterAndRenderTable();
    renderItemDetailsList();

});