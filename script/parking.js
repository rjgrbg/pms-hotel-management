/*
 * ========================================================
 * DEFAULT DATA (SOURCE OF TRUTH)
 * ========================================================
 */
const PARKING_DATA_KEY = 'celestiaParkingData';

// Default data if localStorage is empty
const defaultData = {
    slots: [
        // Area 1 (Mixed)
        { slotNumber: '1A01', area: 1, allowedVehicle: '2-Wheel, 4-Wheel', status: 'occupied', parkedVehicle: { plate: 'AB123C', room: '101', name: 'Juan Dela Cruz', vehicleType: '4 wheeled', category: 'Sedan', enterTime: '6:30 PM', enterDate: '2025.10.25' } },
        ...Array.from({ length: 22 }, (v, i) => ({
            slotNumber: `1B${(i + 1).toString().padStart(2, '0')}`, area: 1, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `RND${i}PLT`, room: '102', name: 'Random Guest', vehicleType: '4 wheeled', category: 'SUV', enterTime: '7:00 PM', enterDate: '2025.10.25' }
        })),
        // Area 1 (Available)
        ...Array.from({ length: 17 }, (v, i) => ({
            slotNumber: `1C${(i + 1).toString().padStart(2, '0')}`, area: 1, allowedVehicle: '2-Wheel', status: 'available', parkedVehicle: null
        })),
        // Area 2
        { slotNumber: '2A01', area: 2, allowedVehicle: '2-Wheel, 4-Wheel', status: 'occupied', parkedVehicle: { plate: 'CD456E', room: '102', name: 'Maria Clara', vehicleType: '2 wheeled', category: 'Motorcycle', enterTime: '7:00 PM', enterDate: '2025.10.25' } },
        ...Array.from({ length: 22 }, (v, i) => ({
            slotNumber: `2B${(i + 1).toString().padStart(2, '0')}`, area: 2, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `RND${i + 22}PLT`, room: '103', name: 'Another Guest', vehicleType: '4 wheeled', category: 'Sedan', enterTime: '8:00 PM', enterDate: '2025.10.25' }
        })),
        ...Array.from({ length: 17 }, (v, i) => ({
            slotNumber: `2C${(i + 1).toString().padStart(2, '0')}`, area: 2, allowedVehicle: '2-Wheel', status: 'available', parkedVehicle: null
        })),
        // Area 3 (Full)
        ...Array.from({ length: 40 }, (v, i) => ({
            slotNumber: `3A${(i + 1).toString().padStart(2, '0')}`, area: 3, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `FULL${i}PLT`, room: '201', name: 'Full Guest', vehicleType: '4 wheeled', category: 'Van', enterTime: '9:00 PM', enterDate: '2025.10.25' }
        })),
        // Area 4
        ...Array.from({ length: 23 }, (v, i) => ({
            slotNumber: `4A${(i + 1).toString().padStart(2, '0')}`, area: 4, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `RND${i + 44}PLT`, room: '202', name: 'Guest Four', vehicleType: '4 wheeled', category: 'Pickup', enterTime: '10:00 PM', enterDate: '2025.10.25' }
        })),
        ...Array.from({ length: 17 }, (v, i) => ({
            slotNumber: `4B${(i + 1).toString().padStart(2, '0')}`, area: 4, allowedVehicle: '4-Wheel', status: 'available', parkedVehicle: null
        })),
        // Area 5
        ...Array.from({ length: 23 }, (v, i) => ({
            slotNumber: `5A${(i + 1).toString().padStart(2, '0')}`, area: 5, allowedVehicle: '4-Wheel', status: 'occupied', parkedVehicle: { plate: `RND${i + 66}PLT`, room: '203', name: 'Guest Five', vehicleType: '4 wheeled', category: 'Sedan', enterTime: '11:00 PM', enterDate: '2025.10.25' }
        })),
        ...Array.from({ length: 17 }, (v, i) => ({
            slotNumber: `5B${(i + 1).toString().padStart(2, '0')}`, area: 5, allowedVehicle: '4-Wheel', status: 'available', parkedVehicle: null
        }))
    ],
    history: [],
    user: {
        id: "019284738475",
        firstName: "Juan",
        middleName: "Constant",
        lastName: "Bagayan",
        emailAddress: "Juan@housekeeper.com",
        username: "Juana",
        password: "123", // Simplified for testing
        birthday: "2004-10-25",
        contact: "09222222222",
        shift: "Day",
        address: "Block 1 Lot 2, Quezon City",
        role: "Parking Management Head"
    },
    damage: [
        { type: 'Burnt', date: '10/25/25', count: 2 }
    ],
    vehicleTypes: [
        { name: '2 Wheeled' },
        { name: '4 Wheeled' }
    ],
    vehicleCategories: [
        { name: 'Sedan' },
        { name: 'SUV' },
        { name: 'Pickup' },
        { name: 'Van' },
        { name: 'Motorcycle' },
        { name: 'Truck' }
    ]
};

/*
 * ========================================================
 * MAIN APPLICATION OBJECT
 * Encapsulates all state and methods
 * ========================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    
    const App = {
        
        // ========================================================
        // I. STATE & CONSTANTS
        // All application data lives here
        // ========================================================

        state: {
            slots: [],
            history: [],
            user: {},
            damage: [],
            vehicleTypes: [],
            vehicleCategories: [],
            currentPages: {
                slots: 1,
                vehicleIn: 1,
                history: 1
            },
            activeSlotToExit: null,
            activeTab: 'dashboard'
        },

        CONSTANTS: {
            ROWS_PER_PAGE: 10
        },

        // ========================================================
        // II. DOM ELEMENTS
        // Cached elements for performance
        // ========================================================
        
        elements: {},

        /**
         * Caches all frequently used DOM elements
         */
        cacheElements() {
            this.elements.toastContainer = document.getElementById('toast-container');
            this.elements.tabs = document.querySelectorAll('.tab');
            this.elements.contentAreas = document.querySelectorAll('.content');
            this.elements.areaSelect = document.getElementById('areaSelect');
            this.elements.searchInput = document.querySelector('.search-box input');
            this.elements.downloadIcon = document.getElementById('downloadIcon');
            
            // Enter Vehicle Modal
            this.elements.enterVehicleForm = {
                guestName: document.getElementById('guestName'),
                plateNumber: document.getElementById('plateNumber'),
                roomNumber: document.getElementById('roomNumber'),
                vehicleType: document.getElementById('vehicleType'),
                categorySelect: document.getElementById('categorySelect'),
                slotNumberTitle: document.getElementById('slotNumberTitle'),
                slotSelect: document.getElementById('slotSelect')
            };

            // Exit Vehicle Modal
            this.elements.exitModalInfo = {
                slotNumber: document.getElementById('exitSlotNumber'),
                plate: document.getElementById('exitPlate'),
                vehicle: document.getElementById('exitVehicle'),
                dateTime: document.getElementById('exitDateTime')
            };
            
            // Edit Category Modal
            this.elements.editCategory = {
                title: document.getElementById('editCategoryTitle'),
                list: document.getElementById('editCategoryList'),
                input: document.getElementById('newCategoryName'),
                addButton: document.getElementById('btnAddCategoryItem')
            };

            // Damage Modal
            this.elements.damageForm = {
                type: document.getElementById('damageType'),
                count: document.getElementById('damageCount')
            };
            this.elements.damagesListBody = document.getElementById('damagesListBody');

            // Render Containers
            this.elements.dashboardCards = document.querySelectorAll('.summary-cards .card .card-value');
            this.elements.dashboardTableBody = document.querySelector('#dashboardContent table tbody');
            this.elements.slotsTable = document.getElementById('slotsTable');
            this.elements.vehicleInTable = document.getElementById('vehicleInTable');
            this.elements.historyTable = document.getElementById('historyTable');

            // Pagination Containers
            this.elements.pagination = {
                slots: document.getElementById('pagination-slots'),
                vehicleIn: document.getElementById('pagination-vehicleIn'),
                history: document.getElementById('pagination-history')
            };
        },

        // ========================================================
        // III. INITIALIZATION
        // ========================================================

        /**
         * Initializes the application
         */
        init() {
            this.cacheElements();
            this.loadData();
            this.setupEventListeners();
            this.switchTab('dashboard'); // Start on dashboard
        },
        
        // ========================================================
        // IV. DATA PERSISTENCE (localStorage)
        // ========================================================

        /**
         * Saves the current application state to localStorage
         */
        saveData() {
            const dataToSave = {
                slots: this.state.slots,
                history: this.state.history,
                user: this.state.user,
                damage: this.state.damage,
                vehicleTypes: this.state.vehicleTypes,
                vehicleCategories: this.state.vehicleCategories
            };
            localStorage.setItem(PARKING_DATA_KEY, JSON.stringify(dataToSave));
        },

        /**
         * Loads state from localStorage or uses default data
         */
        loadData() {
            const dataString = localStorage.getItem(PARKING_DATA_KEY);
            const loadedData = dataString ? JSON.parse(dataString) : defaultData;

            // Merge loaded data with defaults to ensure all keys exist
            this.state.slots = loadedData.slots || defaultData.slots;
            this.state.history = loadedData.history || defaultData.history;
            this.state.user = loadedData.user || defaultData.user;
            this.state.damage = loadedData.damage || defaultData.damage;
            this.state.vehicleTypes = loadedData.vehicleTypes || defaultData.vehicleTypes;
            this.state.vehicleCategories = loadedData.vehicleCategories || defaultData.vehicleCategories;
        },

        // ========================================================
        // V. EVENT LISTENERS SETUP
        // ========================================================

        /**
         * Attaches all event listeners for the application
         */
        setupEventListeners() {
            // Tabs
            this.elements.tabs.forEach(tab => {
                tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
            });
            
            // Search and Filter
            document.querySelector('.search-btn')?.addEventListener('click', () => this.render());
            this.elements.searchInput?.addEventListener('keyup', () => this.render());
            this.elements.areaSelect?.addEventListener('change', () => {
                // Reset pagination on filter change
                this.state.currentPages = { slots: 1, vehicleIn: 1, history: 1 };
                this.render();
            });

            // Download
            this.elements.downloadIcon?.addEventListener('click', () => this.openModal('downloadModal'));
            document.getElementById('btnConfirmDownload')?.addEventListener('click', () => this.downloadFile());

            // Modals and Forms
            this.setupFormListeners();
            this.setupModalListeners();
            this.setupDynamicListeners(); // For buttons inside tables
        },

        /**
         * Sets up listeners for forms
         */
        setupFormListeners() {
            // Enter Vehicle
            document.getElementById('btnSaveVehicle')?.addEventListener('click', () => this.showConfirmModal());
            document.getElementById('btnConfirmEnter')?.addEventListener('click', () => this.confirmEnterVehicle());
            
            // Edit Category/Vehicle
            document.getElementById('btnEditVehicleType')?.addEventListener('click', () => this.openEditCategory('vehicle'));
            document.getElementById('btnEditCategoryIcon')?.addEventListener('click', () => this.openEditCategory('category'));
            this.elements.editCategory.addButton?.addEventListener('click', () => this.addNewCategoryItem());

            // Exit Vehicle
            document.getElementById('btnConfirmExit')?.addEventListener('click', () => this.confirmExit());

            // Damage Modal
            document.getElementById('btnAddDamage')?.addEventListener('click', () => this.addDamageItem());
        },

        /**
         * Sets up listeners for closing modals
         */
        setupModalListeners() {
            // Close buttons (X) and explicit close buttons (e.g., "Cancel")
            document.querySelectorAll('.modal-close, button[data-modal-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const modalId = e.target.dataset.modalId || e.target.closest('.modal-overlay')?.id;
                    if (modalId) this.closeModal(modalId);
                });
            });

            // Close modal when clicking overlay
            document.querySelectorAll('.modal-overlay').forEach(overlay => {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) this.closeModal(overlay.id);
                });
            });
        },

        /**
         * Sets up listeners for dynamically created elements (using event delegation)
         */
        setupDynamicListeners() {
            document.body.addEventListener('click', e => {
                // Enter Vehicle Button
                const enterButton = e.target.closest('.btn-enter');
                if (enterButton) {
                    this.openEnterVehicleModal(enterButton.dataset.slotId);
                    return;
                }

                // Exit Vehicle Button
                const exitButton = e.target.closest('.exit-btn');
                if (exitButton) {
                    this.openExitModal(exitButton.dataset.slotId);
                    return;
                }
                
                // Edit/Delete Category Icons
                const iconButton = e.target.closest('.list-icon');
                if (iconButton) {
                    const mode = this.elements.editCategory.addButton.dataset.mode;
                    const name = iconButton.dataset.name;

                    if (iconButton.alt === 'Delete') {
                        if (confirm(`Are you sure you want to delete "${name}"?`)) {
                            this.deleteCategoryItem(name, mode);
                        }
                    }
                    
                    if (iconButton.alt === 'Edit') {
                        this.elements.editCategory.input.value = name;
                        this.elements.editCategory.input.focus();
                        this.showToast(`Now editing "${name}". Change the name and click "ADD" to save.`, 'info');
                    }
                }
            });
        },

        // ========================================================
        // VI. UI (TABS, MODALS, TOASTS)
        // ========================================================

        /**
         * Shows a toast notification
         * @param {string} message The message to display
         * @param {'success' | 'error' | 'info'} type The type of toast
         */
        showToast(message, type = 'success') {
            const container = this.elements.toastContainer;
            if (!container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            container.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 10);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        },

        /**
         * Switches the active tab and triggers a re-render
         * @param {string} tabId The ID of the tab to switch to
         */
        switchTab(tabId) {
            this.state.activeTab = tabId;

            // Update tab UI
            this.elements.tabs.forEach(t => t.classList.remove('active'));
            document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
            
            // Update content UI
            this.elements.contentAreas.forEach(c => c.classList.add('hidden'));
            document.getElementById(tabId + 'Content')?.classList.remove('hidden');

            // Clear search and reset pagination
            this.elements.searchInput.value = '';
            this.state.currentPages = { slots: 1, vehicleIn: 1, history: 1 };
            
            // Trigger a full re-render for the new tab
            this.render();
        },

        openModal(id) {
            document.getElementById(id)?.classList.add('active');
        },

        closeModal(id) {
            document.getElementById(id)?.classList.remove('active');
        },

        // ========================================================
        // VII. BUSINESS LOGIC
        // ========================================================

        /**
         * Populates vehicle dropdowns in the "Enter Vehicle" modal
         */
        populateVehicleDropdowns() {
            const { vehicleType, categorySelect } = this.elements.enterVehicleForm;
            if (vehicleType) {
                vehicleType.innerHTML = '<option value="">Select</option>' + 
                    this.state.vehicleTypes.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
            }
            if (categorySelect) {
                categorySelect.innerHTML = this.state.vehicleCategories.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
            }
        },

        openEnterVehicleModal(slotNumber) {
            const slot = this.state.slots.find(s => s.slotNumber === slotNumber);
            if (!slot) return;
            
            const form = this.elements.enterVehicleForm;
            
            // Reset form
            form.guestName.value = '';
            form.plateNumber.value = '';
            form.roomNumber.value = '';
            
            this.populateVehicleDropdowns();
            
            // Set slot info
            form.slotNumberTitle.textContent = slot.slotNumber;
            form.slotSelect.innerHTML = `<option>${slot.slotNumber}</option>`;
            
            this.openModal('enterVehicleModal');
        },
        
        showConfirmModal() {
            const { guestName, plateNumber, vehicleType } = this.elements.enterVehicleForm;
            if (!guestName.value || !plateNumber.value || !vehicleType.value) {
                this.showToast('Please fill out Name, Plate #, and Vehicle.', 'error');
                return;
            }
            this.closeModal('enterVehicleModal');
            this.openModal('confirmModal');
        },

        /**
         * Parks a new vehicle
         */
        confirmEnterVehicle() {
            const form = this.elements.enterVehicleForm;
            const slotNumber = form.slotNumberTitle.textContent;
            
            const newVehicle = {
                name: form.guestName.value,
                plate: form.plateNumber.value.toUpperCase(),
                room: form.roomNumber.value,
                vehicleType: form.vehicleType.value,
                category: form.categorySelect.value,
                enterTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                enterDate: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
            };

            const slot = this.state.slots.find(s => s.slotNumber === slotNumber);
            if (slot) {
                slot.status = 'occupied';
                slot.parkedVehicle = newVehicle;
            }

            this.saveData();
            
            this.closeModal('confirmModal');
            this.openModal('successModal');
            this.showToast('Vehicle parked successfully!');

            this.render(); // Re-render the UI
        },
        
        openExitModal(slotNumber) {
            const slot = this.state.slots.find(s => s.slotNumber === slotNumber);
            if (!slot || !slot.parkedVehicle) return;

            const vehicle = slot.parkedVehicle;
            const info = this.elements.exitModalInfo;
            
            info.slotNumber.textContent = slot.slotNumber;
            info.plate.textContent = vehicle.plate;
            info.vehicle.textContent = vehicle.category;
            info.dateTime.textContent = vehicle.enterDate + ' / ' + vehicle.enterTime;
            
            this.state.activeSlotToExit = slot.slotNumber;
            
            this.openModal('exitModal');
        },

        /**
         * Exits a vehicle and moves it to history
         */
        confirmExit() {
            const slotNumber = this.state.activeSlotToExit;
            if (!slotNumber) return;

            const slot = this.state.slots.find(s => s.slotNumber === slotNumber);
            if (!slot || !slot.parkedVehicle) return;

            const vehicleToLog = slot.parkedVehicle;
            
            // Calculate parking duration
            let enterDateTime;
            try {
                // Fix for dates with dots (e.g., 2025.10.25)
                const cleanDate = vehicleToLog.enterDate.replace(/\./g, '-');
                enterDateTime = new Date(`${cleanDate} ${vehicleToLog.enterTime}`);
                if (isNaN(enterDateTime.getTime())) {
                    enterDateTime = new Date(cleanDate); // Fallback to date only
                }
            } catch (e) {
                enterDateTime = new Date(); // Fallback to now
            }

            const exitDateTime = new Date();
            const durationMs = exitDateTime - (isNaN(enterDateTime.getTime()) ? exitDateTime : enterDateTime);
            const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(1);

            const historyLog = {
                ...vehicleToLog,
                slotNumber: slot.slotNumber,
                exitTime: exitDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                exitDate: exitDateTime.toLocaleDateString('en-CA'),
                parkingTime: `${durationHours} hrs`
            };

            this.state.history.unshift(historyLog); 

            // Free up the slot
            slot.status = 'available';
            slot.parkedVehicle = null;
            this.state.activeSlotToExit = null;

            this.saveData();
            this.closeModal('exitModal');
            this.showToast('Vehicle exited successfully!');
            this.render(); // Re-render the UI
        },
        
        /**
         * Opens the modal to edit vehicle types or categories
         * @param {'vehicle' | 'category'} mode
         */
        openEditCategory(mode) {
            const { title, list, input, addButton } = this.elements.editCategory;
            if (!title || !list || !input) return;

            let dataList = (mode === 'vehicle') ? this.state.vehicleTypes : this.state.vehicleCategories;
            
            title.textContent = (mode === 'vehicle') ? 'Edit Vehicle' : 'Edit Category';
            input.placeholder = (mode === 'vehicle') ? 'Enter new vehicle type' : 'Enter new category';
            
            list.innerHTML = ''; // Clear list
            dataList.forEach(item => {
                list.innerHTML += `
                    <div class="category-list-item">
                        <span>${item.name}</span>
                        <div class="category-item-actions">
                            <svg class="list-icon" data-name='${item.name}' alt="Edit" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#FFA237" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                            </svg>
                            <svg class="list-icon" data-name='${item.name}' alt="Delete" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#FFA237" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
                            </svg>
                        </div>
                    </div>
                `;
            });
            
            // Store the mode on the button
            if(addButton) addButton.dataset.mode = mode;
            
            this.openModal('editCategoryModal');
        },

        addNewCategoryItem() {
            const { input, addButton } = this.elements.editCategory;
            if (!addButton || !input) return;

            const mode = addButton.dataset.mode;
            const newName = input.value.trim();

            if (!newName) {
                this.showToast('Please enter a name.', 'error');
                return;
            }

            let dataList = (mode === 'vehicle') ? this.state.vehicleTypes : this.state.vehicleCategories;
            let listName = (mode === 'vehicle') ? "Vehicle type" : "Category";

            if (dataList.some(item => item.name.toLowerCase() === newName.toLowerCase())) {
                this.showToast(`${newName} already exists.`, 'error');
                return;
            }
            
            dataList.push({ name: newName });
            this.saveData();
            
            this.showToast(`${listName} "${newName}" added!`, 'success');
            input.value = '';
            
            this.openEditCategory(mode); // Refresh modal list
            this.populateVehicleDropdowns(); // Refresh enter vehicle modal
        },
        
        deleteCategoryItem(nameToDelete, mode) {
            let dataList = (mode === 'vehicle') ? this.state.vehicleTypes : this.state.vehicleCategories;
            let listName = (mode === 'vehicle') ? "Vehicle type" : "Category";

            const index = dataList.findIndex(item => item.name === nameToDelete);
            if (index === -1) {
                this.showToast('Item not found.', 'error');
                return;
            }

            dataList.splice(index, 1);
            this.saveData();
            this.showToast(`${listName} "${nameToDelete}" deleted!`, 'success');
            
            this.openEditCategory(mode); // Refresh modal list
            this.populateVehicleDropdowns(); // Refresh enter vehicle modal
        },

        addDamageItem() {
            const { type, count } = this.elements.damageForm;
            if (!type.value) {
                this.showToast('Please enter damage type.', 'error');
                return;
            }
            
            const newDamage = {
                type: type.value,
                date: new Date().toLocaleDateString(),
                count: parseInt(count.value) || 1
            };
            
            this.state.damage.push(newDamage);
            this.saveData();
            
            this.renderDamages(); // Update damage list
            
            type.value = '';
            count.value = '1';
            this.showToast('Damage item added!', 'success');
        },

        downloadFile() {
            let csvContent = "Slot Number,Plate #,Room,Name,Vehicle Type,Category,Parking Time,Enter Time,Enter Date,Exit Time,Exit Date\n";
            
            this.state.history.forEach(vehicle => {
                csvContent += `"${vehicle.slotNumber}","${vehicle.plate}","${vehicle.room}","${vehicle.name}","${vehicle.vehicleType}","${vehicle.category}","${vehicle.parkingTime}","${vehicle.enterTime}","${vehicle.enterDate}","${vehicle.exitTime}","${vehicle.exitDate}"\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `parking_history_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.closeModal('downloadModal');
            this.showToast('History downloaded successfully!');
        },

        // ========================================================
        // VIII. RENDER FUNCTIONS
        // ========================================================
        
        /**
         * Main render function. Called on tab switch and after data changes.
         */
        render() {
            const searchTerm = this.elements.searchInput.value.toLowerCase();
            const filterValue = this.elements.areaSelect.value;
            
            this.updateAreaSelectOptions();
            this.elements.downloadIcon.style.display = this.state.activeTab === 'history' ? 'block' : 'none';
            if (this.elements.searchInput) {
                this.elements.searchInput.placeholder = (this.state.activeTab === 'dashboard') ? "Search..." : "Search Slot, Plate#, Name...";
            }

            switch(this.state.activeTab) {
                case 'dashboard':
                    this.renderDashboard(filterValue);
                    break;
                case 'slots':
                    this.renderSlots(filterValue, searchTerm);
                    break;
                case 'vehicleIn':
                    this.renderVehicleIn(filterValue, searchTerm);
                    break;
                case 'history':
                    this.renderHistory(filterValue, searchTerm);
                    break;
                case 'damages':
                    this.renderDamages();
                    break;
            }
        },

        /**
         * Updates the Area/Slot filter dropdown based on the active tab
         */
        updateAreaSelectOptions() {
            const areaSelect = this.elements.areaSelect;
            if (!areaSelect) return;

            const tab = this.state.activeTab;
            
            if (tab === 'vehicleIn' || tab === 'history' || tab === 'slots') {
                const uniqueSlotNumbers = [...new Set(this.state.slots.map(s => s.slotNumber))].sort();
                let slotOptions = uniqueSlotNumbers.map(s => `<option value="${s}">${s}</option>`).join('');
                areaSelect.innerHTML = `<option value="all">Slot Number</option>${slotOptions}`;
            } else {
                const uniqueAreas = [...new Set(this.state.slots.map(s => s.area))].sort((a,b) => a - b);
                let areaOptions = uniqueAreas.map(a => `<option value="${a}">${a}</option>`).join('');
                areaSelect.innerHTML = `<option value="all">Area</option>${areaOptions}`;
            }
        },
        
        renderEmptyState(container, icon, title, message) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${icon}</div>
                    <h3>${title}</h3>
                    <p>${message}</p>
                </div>
            `;
        },

        renderDashboard(filterValue) {
            let filteredData = this.state.slots;
            if (filterValue !== "all") {
                filteredData = this.state.slots.filter(s => s.area == filterValue);
            }
            
            // Render Summary Cards
            const occupiedCount = filteredData.filter(s => s.status === 'occupied').length;
            const availableCount = filteredData.filter(s => s.status === 'available').length;
            const totalCount = filteredData.length;

            const cards = this.elements.dashboardCards;
            if (cards[0]) cards[0].textContent = occupiedCount;
            if (cards[1]) cards[1].textContent = availableCount;
            if (cards[2]) cards[2].textContent = totalCount;

            // Render Table
            const tbody = this.elements.dashboardTableBody;
            if (!tbody) return;
            tbody.innerHTML = '';
            
            const areaStats = {};
            filteredData.forEach(slot => {
                if (!areaStats[slot.area]) {
                    areaStats[slot.area] = { area: slot.area, available: 0, occupied: 0, total: 0 };
                }
                areaStats[slot.area].total++;
                if (slot.status === 'available') areaStats[slot.area].available++;
                else areaStats[slot.area].occupied++;
            });

            Object.keys(areaStats).sort((a, b) => a - b).forEach(areaKey => {
                const area = areaStats[areaKey];
                const isFull = area.available === 0;
                const row = document.createElement('tr');
                if (isFull) row.classList.add('full-row'); 
                
                row.innerHTML = `
                    <td class="${isFull ? 'text-red' : ''}">${area.area}</td>
                    <td class="${isFull ? 'text-red' : ''}">${isFull ? '-' : area.available}</td>
                    <td class="${isFull ? 'text-red' : ''}">${area.occupied}</td>
                    <td class="${isFull ? 'text-red' : ''}">${area.total}</td>
                    <td class="${isFull ? 'text-red' : ''} text-right">${isFull ? 'Full' : ''}</td>
                `;
                tbody.appendChild(row);
            });
        },

        renderSlots(filterValue, searchTerm) {
            const container = this.elements.slotsTable;
            if (!container) return;
            
            let filteredData = this.state.slots;
            if (filterValue !== "all") filteredData = filteredData.filter(s => s.slotNumber === filterValue);
            if (searchTerm) {
                filteredData = filteredData.filter(s => 
                    s.slotNumber.toLowerCase().includes(searchTerm) ||
                    (s.parkedVehicle && s.parkedVehicle.name.toLowerCase().includes(searchTerm)) ||
                    (s.parkedVehicle && s.parkedVehicle.plate.toLowerCase().includes(searchTerm))
                );
            }

            container.innerHTML = '';
            if (filteredData.length === 0) {
                this.renderEmptyState(container, '🅿️', 'No Slots Found', 'Try adjusting your search or filter.');
                this.setupPagination(0, this.elements.pagination.slots, 1);
                return;
            }
            
            const page = this.state.currentPages.slots;
            const paginatedData = this.paginate(filteredData, page);
            
            paginatedData.forEach((slot) => {
                container.innerHTML += `
                    <div class="table-row grid-5">
                        <div>${slot.area}</div>
                        <div>${slot.slotNumber}</div>
                        <div>${slot.allowedVehicle}</div>
                        <div><span class="status-badge status-${slot.status}">${slot.status}</span></div>
                        <div>
                            ${slot.status === 'available' 
                                ? `<button class="btn-enter" data-slot-id="${slot.slotNumber}">Enter Vehicle 🚗</button>`
                                : `<button class="btn-enter-gray" disabled>Enter Vehicle 🚗</button>`
                            }
                        </div>
                    </div>
                `;
            });

            this.setupPagination(filteredData.length, this.elements.pagination.slots, page, 'slots');
        },

        renderVehicleIn(filterValue, searchTerm) {
            const container = this.elements.vehicleInTable;
            if (!container) return;

            let filteredData = this.state.slots.filter(slot => slot.status === 'occupied');
            if (filterValue !== "all") filteredData = filteredData.filter(s => s.slotNumber === filterValue);
            if (searchTerm) {
                filteredData = filteredData.filter(s => 
                    s.slotNumber.toLowerCase().includes(searchTerm) ||
                    (s.parkedVehicle && s.parkedVehicle.name.toLowerCase().includes(searchTerm)) ||
                    (s.parkedVehicle && s.parkedVehicle.plate.toLowerCase().includes(searchTerm)) ||
                    (s.parkedVehicle && s.parkedVehicle.room.toLowerCase().includes(searchTerm))
                );
            }
            
            container.innerHTML = '';
            if (filteredData.length === 0) {
                this.renderEmptyState(container, '🚗', 'No Vehicles Parked', 'Available slots can be seen in the "Slots" tab.');
                this.setupPagination(0, this.elements.pagination.vehicleIn, 1);
                return;
            }

            const page = this.state.currentPages.vehicleIn;
            const paginatedData = this.paginate(filteredData, page);

            paginatedData.forEach((slot) => {
                const vehicle = slot.parkedVehicle;
                container.innerHTML += `
                    <div class="table-row grid-8">
                        <div>${slot.slotNumber}</div>
                        <div>${vehicle.plate}</div>
                        <div>${vehicle.room}</div>
                        <div>${vehicle.name}</div>
                        <div>${vehicle.vehicleType}</div>
                        <div>${vehicle.category}</div>
                        <div>${vehicle.enterTime}</div>
                        <div>${vehicle.enterDate}</div>
                        <div>
                            <button class="exit-btn" data-slot-id="${slot.slotNumber}">
                                <img src="assets/icons/exit.png" alt="Exit Vehicle">
                            </button>
                        </div>
                    </div>
                `;
            });

            this.setupPagination(filteredData.length, this.elements.pagination.vehicleIn, page, 'vehicleIn');
        },

        renderHistory(filterValue, searchTerm) {
            const container = this.elements.historyTable;
            if (!container) return;
            
            let filteredData = this.state.history;
            if (filterValue !== "all") filteredData = filteredData.filter(v => v.slotNumber === filterValue);
            if (searchTerm) {
                filteredData = filteredData.filter(v => 
                    v.slotNumber.toLowerCase().includes(searchTerm) ||
                    v.name.toLowerCase().includes(searchTerm) ||
                    v.plate.toLowerCase().includes(searchTerm) ||
                    v.room.toLowerCase().includes(searchTerm)
                );
            }

            container.innerHTML = '';
            if (filteredData.length === 0) {
                this.renderEmptyState(container, '📜', 'No History Found', 'Vehicles that exit will appear here.');
                this.setupPagination(0, this.elements.pagination.history, 1);
                return;
            }
            
            const page = this.state.currentPages.history;
            const paginatedData = this.paginate(filteredData, page);

            paginatedData.forEach((vehicle) => {
                container.innerHTML += `
                    <div class="table-row grid-9">
                        <div>${vehicle.slotNumber}</div>
                        <div>${vehicle.plate}</div>
                        <div>${vehicle.room}</div>
                        <div>${vehicle.name}</div>
                        <div>${vehicle.vehicleType}</div>
                        <div>${vehicle.category}</div>
                        <div>${vehicle.parkingTime}</div>
                        <div>${vehicle.enterTime} / ${vehicle.exitTime}</div>
                        <div>${vehicle.enterDate} / ${vehicle.exitDate}</div>
                    </div>
                `;
            });
            
            this.setupPagination(filteredData.length, this.elements.pagination.history, page, 'history');
        },

        renderDamages() {
            const tbody = this.elements.damagesListBody;
            if (!tbody) return;
            
            tbody.innerHTML = this.state.damage.map(damage => `
                <tr>
                    <td>${damage.type}</td>
                    <td>${damage.date}</td>
                    <td>${damage.count}</td>
                </tr>
            `).join('');
        },

        // ========================================================
        // IX. PAGINATION
        // ========================================================

        /**
         * Slices an array for the current page
         * @param {Array} items The full array
         * @param {number} page The current page number
         * @returns {Array} The items for the current page
         */
        paginate(items, page) {
            const startIndex = (page - 1) * this.CONSTANTS.ROWS_PER_PAGE;
            const endIndex = startIndex + this.CONSTANTS.ROWS_PER_PAGE;
            return items.slice(startIndex, endIndex);
        },

        /**
         * Renders pagination controls
         * @param {number} totalItems Total number of items
         * @param {HTMLElement} container The container element for pagination
         * @param {number} currentPage The active page
         * @param {'slots' | 'vehicleIn' | 'history'} pageKey The key in `state.currentPages`
         */
        setupPagination(totalItems, container, currentPage, pageKey) {
            if (!container) return;
            container.innerHTML = '';
            const totalPages = Math.ceil(totalItems / this.CONSTANTS.ROWS_PER_PAGE);
            
            if (totalPages <= 1) return;

            const start = (currentPage - 1) * this.CONSTANTS.ROWS_PER_PAGE + 1;
            const end = Math.min(start + this.CONSTANTS.ROWS_PER_PAGE - 1, totalItems);
            
            let html = `<span>Displaying ${start}-${end} of ${totalItems} Records</span>`;
            html += `<div class="pagination-controls">`;

            // Previous Button
            html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">&lt;</button>`;

            // Page Numbers
            const pageNumbers = this.getPaginationNumbers(currentPage, totalPages);
            pageNumbers.forEach(num => {
                if (num === '...') {
                    html += `<span>...</span>`;
                } else {
                    html += `<button class="${num === currentPage ? 'active' : ''}" data-page="${num}">${num}</button>`;
                }
            });

            // Next Button
            html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">&gt;</button>`;
            html += `</div>`;
            container.innerHTML = html;

            // Add event listeners to the new buttons
            container.querySelectorAll('.pagination-controls button').forEach(button => {
                button.addEventListener('click', (e) => {
                    this.state.currentPages[pageKey] = parseInt(e.currentTarget.dataset.page);
                    this.render();
                });
            });
        },
        
        /**
         * Helper to generate smart pagination numbers (e.g., 1 ... 4 5 6 ... 10)
         */
        getPaginationNumbers(currentPage, totalPages) {
            if (totalPages <= 7) {
                return Array.from({ length: totalPages }, (_, i) => i + 1);
            }
            if (currentPage <= 3) {
                return [1, 2, 3, 4, '...', totalPages];
            }
            if (currentPage >= totalPages - 2) {
                return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            }
            return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
        }
    };

    // Start the application
    App.init();

    // Make App global for debugging (optional)
    // window.App = App;
});

// ===== PROFILE & LOGOUT =====
// This part of your code was already well-structured and is CORRECT.
const profileBtn = document.getElementById('profileBtn');
const sidebar = document.getElementById('profile-sidebar');
const closeBtn = document.getElementById('sidebar-close-btn');

if(profileBtn && sidebar && closeBtn) {
    profileBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeBtn.addEventListener('click', () => sidebar.classList.remove('active'));
}

const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const closeLogoutBtn = document.getElementById('closeLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => logoutModal.style.display = 'flex');
}
if (closeLogoutBtn) {
    closeLogoutBtn.addEventListener('click', () => logoutModal.style.display = 'none');
}
if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', () => logoutModal.style.display = 'none');
}
if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
        window.location.href = 'logout.php';
    });
}
if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            logoutModal.style.display = 'none';
        }
    });
}