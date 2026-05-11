/**
 * Room Items Management Module
 * Handles room item operations for admin and staff
 */

const RoomItemsManager = (function() {
    'use strict';

    // ====================================================================
    // GET ROOM ITEMS
    // ====================================================================
    async function getRoomItems(roomId) {
        try {
            const response = await fetch(`room_items_api.php?action=get_room_items&room_id=${roomId}`);
            if (!response.ok) throw new Error('Network response error');
            return await response.json();
        } catch (error) {
            console.error('Error fetching room items:', error);
            return { success: false, data: [] };
        }
    }

    // ====================================================================
    // ADD ITEM TO ROOM
    // ====================================================================
    async function addRoomItem(roomId, itemId, quantity) {
        try {
            const response = await fetch('room_items_api.php?action=add_room_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: roomId,
                    item_id: itemId,
                    quantity: quantity
                })
            });
            if (!response.ok) throw new Error('Network response error');
            return await response.json();
        } catch (error) {
            console.error('Error adding room item:', error);
            return { success: false, message: error.message };
        }
    }

    // ====================================================================
    // REMOVE ITEM FROM ROOM
    // ====================================================================
    async function removeRoomItem(roomItemId, itemId, quantity, roomId) {
        try {
            const response = await fetch('room_items_api.php?action=remove_room_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_item_id: roomItemId,
                    item_id: itemId,
                    quantity: quantity,
                    room_id: roomId
                })
            });
            if (!response.ok) throw new Error('Network response error');
            return await response.json();
        } catch (error) {
            console.error('Error removing room item:', error);
            return { success: false, message: error.message };
        }
    }

    // ====================================================================
    // GET AVAILABLE INVENTORY ITEMS
    // ====================================================================
    async function getAvailableItems(categoryId = 0) {
        try {
            let url = 'room_items_api.php?action=get_available_items';
            if (categoryId > 0) url += `&category_id=${categoryId}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response error');
            return await response.json();
        } catch (error) {
            console.error('Error fetching available items:', error);
            return { success: false, data: [] };
        }
    }

    // ====================================================================
    // RENDER ROOM ITEMS LIST
    // ====================================================================
    function renderRoomItemsList(items, container, options = {}) {
        const { 
            editable = false, 
            onRemove = null 
        } = options;

        if (!container) return;

        container.innerHTML = '';

        if (!items || items.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No items assigned to this room</p>';
            return;
        }

        const listHTML = items.map((item, index) => `
            <div class="room-item" data-room-item-id="${item.room_item_id}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #e0e0e0; background: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #333;">${item.name}</div>
                    <div style="font-size: 12px; color: #666;">
                        Category: ${item.category} | Type: ${item.type} | Qty: ${item.quantity}
                    </div>
                    <div style="font-size: 11px; color: #999; margin-top: 4px;">
                        Assigned: ${new Date(item.date_assigned).toLocaleDateString()} by ${item.assigned_by}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${editable ? `
                        <button class="remove-item-btn" data-room-item-id="${item.room_item_id}" data-item-id="${item.item_id}" data-quantity="${item.quantity}" data-type="${item.type}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Remove
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = listHTML;

        // Attach event listeners if editable
        if (editable) {
            container.querySelectorAll('.remove-item-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const roomItemId = btn.getAttribute('data-room-item-id');
                    const itemId = btn.getAttribute('data-item-id');
                    const maxQuantity = parseInt(btn.getAttribute('data-quantity'));
                    const itemType = btn.getAttribute('data-type');
                    
                    let qtyToRemove = prompt(`How many do you want to remove? (Max: ${maxQuantity})`, maxQuantity);
                    if (qtyToRemove === null) return; 
                    
                    qtyToRemove = parseInt(qtyToRemove);
                    
                    if (isNaN(qtyToRemove) || qtyToRemove <= 0 || qtyToRemove > maxQuantity) {
                        alert(`Please enter a valid quantity between 1 and ${maxQuantity}.`);
                        return;
                    }

                    if (confirm(`Are you sure you want to remove ${qtyToRemove} unit(s) of this item?`)) {
                        if (onRemove) {
                            await onRemove(roomItemId, itemId, qtyToRemove, itemType);
                        }
                    }
                });
            });
        }
    }

    // ====================================================================
    // CREATE ADD ITEMS FORM
    // ====================================================================
    function createAddItemsForm(container, roomId, onItemAdded = null) {
        if (!container) return;

        const form = document.createElement('form');
        form.className = 'add-items-form';
        form.style.cssText = 'padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;';
        
        form.innerHTML = `
            <label style="display: block; font-weight: 600; margin-bottom: 10px;">Add Items to Room</label>
            
            <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; align-items: center;">
                <select class="type-filter" style="width: 130px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Types</option>
                </select>
                <select class="category-filter" style="width: 140px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Categories</option>
                </select>
                <input type="text" class="item-search" placeholder="Search items..." style="flex: 1; min-width: 150px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                
                <button type="button" class="refresh-form-btn" style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; color: #480c1b; display: flex; align-items: center; justify-content: center;" title="Refresh Items & Filters">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                <select class="item-select" style="flex: 1; min-width: 200px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Select item...</option>
                </select>
                <input type="number" class="item-qty" value="1" min="1" style="width: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <button type="submit" class="add-btn" style="padding: 8px 20px; background: #480c1b; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Add Item</button>
            </div>
        `;

        container.appendChild(form);

        const typeFilter = form.querySelector('.type-filter');
        const catFilter = form.querySelector('.category-filter');
        const itemSearch = form.querySelector('.item-search');
        const itemSelect = form.querySelector('.item-select');
        const refreshBtn = form.querySelector('.refresh-form-btn');
        const submitBtn = form.querySelector('.add-btn');

        let currentItems = [];
        let typeCatMap = {};
        let catTypeMap = {};

        // Helper to render main item dropdown
        const renderItemSelect = () => {
            const searchTerm = itemSearch.value.toLowerCase();
            const selectedType = typeFilter.value;
            const selectedCat = catFilter.value;

            const filtered = currentItems.filter(item => {
                const matchSearch = item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm);
                const matchType = !selectedType || item.type === selectedType;
                const matchCat = !selectedCat || item.category === selectedCat;
                return matchSearch && matchType && matchCat;
            });

            itemSelect.innerHTML = '<option value="">Select item...</option>';
            filtered.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} (Qty: ${item.quantity})`;
                itemSelect.appendChild(option);
            });
        };

        // Helper to render Category dropdown dynamically
        const renderCategorySelect = () => {
            const selectedType = typeFilter.value;
            const currentSelectedCat = catFilter.value;

            catFilter.innerHTML = '<option value="">Categories</option>';
            
            let allowedCategories = [];
            if (selectedType && typeCatMap[selectedType]) {
                allowedCategories = [...typeCatMap[selectedType]].sort();
            } else {
                allowedCategories = Object.keys(catTypeMap).sort();
            }

            allowedCategories.forEach(cat => {
                // Ensure no empty categories slip through
                if (cat && cat.trim() !== '') {
                    const opt = document.createElement('option');
                    opt.value = cat;
                    opt.textContent = cat;
                    catFilter.appendChild(opt);
                }
            });

            if (allowedCategories.includes(currentSelectedCat)) {
                catFilter.value = currentSelectedCat;
            } else {
                catFilter.value = '';
            }
        };

        // Fetch Data and Initialize
        const loadData = async () => {
            itemSelect.innerHTML = '<option value="">Loading...</option>';
            const result = await getAvailableItems();
            currentItems = result.data || [];

            typeCatMap = {};
            catTypeMap = {};
            const types = new Set();

            currentItems.forEach(item => {
                const t = item.type;
                const c = item.category;
                
                // FIX: Check if string exists and is not just empty spaces
                if (t && t.trim() !== '') {
                    types.add(t);
                    if (!typeCatMap[t]) typeCatMap[t] = new Set();
                    if (c && c.trim() !== '') {
                        typeCatMap[t].add(c);
                        catTypeMap[c] = t;
                    }
                }
            });

            const currentSelectedType = typeFilter.value;
            typeFilter.innerHTML = '<option value="">Types</option>';
            
            [...types].sort().forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                typeFilter.appendChild(opt);
            });

            if ([...types].includes(currentSelectedType)) {
                typeFilter.value = currentSelectedType;
            } else {
                typeFilter.value = '';
            }

            renderCategorySelect();
            renderItemSelect();
        };

        // Event Listeners for Filters
        itemSearch.addEventListener('input', renderItemSelect);
        
        typeFilter.addEventListener('change', () => {
            renderCategorySelect();
            renderItemSelect();
        });
        
        catFilter.addEventListener('change', () => {
            const selectedCat = catFilter.value;
            if (selectedCat && catTypeMap[selectedCat]) {
                typeFilter.value = catTypeMap[selectedCat];
            }
            renderItemSelect();
        });

        // NEW: Refresh Button Logic
        refreshBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Show brief spinning visual feedback
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');

            // Reset all filter inputs manually
            typeFilter.value = '';
            catFilter.value = '';
            itemSearch.value = '';
            form.querySelector('.item-qty').value = 1;
            
            // Re-fetch database data and rebuild UI
            await loadData();
            
            setTimeout(() => icon.classList.remove('fa-spin'), 500);
        });

        // Handle Form Submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const itemId = parseInt(itemSelect.value);
            const quantity = parseInt(form.querySelector('.item-qty').value);

            if (!itemId || quantity <= 0) {
                alert('Please select an item and quantity');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding...';

            const result = await addRoomItem(roomId, itemId, quantity);
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Item';

            if (result.success) {
                if (onItemAdded) await onItemAdded();
                
                // Clear inputs quietly
                form.querySelector('.item-qty').value = 1;
                itemSearch.value = '';
                
                // Refresh data to grab the newly deducted quantity numbers behind the scenes
                await loadData();
                
                alert('Item added successfully!');
            } else {
                alert('Error: ' + (result.message || 'Unknown error'));
            }
        });

        // Initialize the first load
        loadData();
    }

    // ====================================================================
    // PUBLIC API
    // ====================================================================
    return {
        getRoomItems,
        addRoomItem,
        removeRoomItem,
        getAvailableItems,
        renderRoomItemsList,
        createAddItemsForm
    };
})();