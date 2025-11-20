// ===== PAGINATION STATE =====
const paginationState = {
  rooms: { currentPage: 1, itemsPerPage: 10 },
  housekeeping: { currentPage: 1, itemsPerPage: 10 },
  housekeepingHistory: { currentPage: 1, itemsPerPage: 10 },
  housekeepingLinensAmenities: { currentPage: 1, itemsPerPage: 10 }, // Combined
  maintenance: { currentPage: 1, itemsPerPage: 10 },
  maintenanceHistory: { currentPage: 1, itemsPerPage: 10 },
  maintenanceAppliances: { currentPage: 1, itemsPerPage: 10 },
  parkingHistory: { currentPage: 1, itemsPerPage: 10 },
  inventory: { currentPage: 1, itemsPerPage: 10 },
  inventoryHistory: { currentPage: 1, itemsPerPage: 10 }, // <-- This was added
  users: { currentPage: 1, itemsPerPage: 10 },
  userLogs: { currentPage: 1, itemsPerPage: 10 }
};

// ===== ACCOUNT TYPE MAPPING =====
const ACCOUNT_TYPE_MAP = {
  'admin': 'Admin',
  'housekeeping_manager': 'Housekeeping Manager',
  'maintenance_manager': 'Maintenance Manager',
  'inventory_manager': 'Inventory Manager',
  'parking_manager': 'Parking Manager',
  'housekeeping_staff': 'Housekeeping Staff',
  'maintenance_staff': 'Maintenance Staff'
};

// ===== ROOM CAPACITY MAPPING =====
const ROOM_CAPACITY_MAP = {
    'Standard Room': '1–2 guests',
    'Deluxe Room': '2–3 guests',
    'Suite': '2–4 guests',
    'Penthouse Suite': '4–6 guests',
};