// ===== SHARED DATA FILE =====
// This file contains all data shared between housekeeping.html and admin.html
// Include this file in both HTML files before their respective JS files

// ===== HOUSEKEEPING REQUESTS DATA =====
const housekeepingRequests = [
  { floor: 1, room: 101, guest: 'John Smith', date: '2025-10-19', requestTime: '10:30 AM', lastCleaned: '2025-10-18 3:00 PM', status: 'dirty', staff: 'Not Assigned' },
  { floor: 1, room: 102, guest: 'Maria Garcia', date: '2025-10-19', requestTime: '11:15 AM', lastCleaned: '2025-10-18 4:30 PM', status: 'request', staff: 'Not Assigned' },
  { floor: 2, room: 201, guest: 'David Lee', date: '2025-10-19', requestTime: '09:45 AM', lastCleaned: '2025-10-18 2:00 PM', status: 'request', staff: 'Anna Martinez' },
  { floor: 2, room: 202, guest: 'Sarah Johnson', date: '2025-10-19', requestTime: '12:00 PM', lastCleaned: '2025-10-19 8:00 AM', status: 'dirty', staff: 'Not Assigned' },
];

// ===== HOUSEKEEPING HISTORY DATA =====
const housekeepingHistory = [
  { floor: 1, room: 101, guest: 'John Smith', date: '2025-10-18', requestedTime: '2:00 PM', completedTime: '3:00 PM', staff: 'Anna Martinez', status: 'cleaned', remarks: 'Completed' },
  { floor: 1, room: 102, guest: 'Maria Garcia', date: '2025-10-18', requestedTime: '3:15 PM', completedTime: '4:30 PM', staff: 'James Wilson', status: 'cleaned', remarks: 'Completed' },
  { floor: 2, room: 201, guest: 'David Lee', date: '2025-10-18', requestedTime: '1:00 PM', completedTime: '2:00 PM', staff: 'Sofia Rodriguez', status: 'cleaned', remarks: 'Completed' },
  { floor: 2, room: 202, guest: 'Sarah Johnson', date: '2025-10-17', requestedTime: '10:00 AM', completedTime: '11:15 AM', staff: 'Michael Brown', status: 'cleaned', remarks: 'Completed' },
  { floor: 1, room: 103, guest: 'Robert Chen', date: '2025-10-17', requestedTime: '4:00 PM', completedTime: '5:00 PM', staff: 'Emma Davis', status: 'cleaned', remarks: 'Completed' },
];

// ===== HOUSEKEEPING LINENS DATA =====
const housekeepingLinens = [
  { LinenID: 1, floor: 1, room: 101, types: 'Guest Room Linens', items: 'Bed Linen', timeDate: '3:30PM/10.25.2025', status: 'cleaned', remarks: 'Fresh linens provided' },
  { LinenID: 2, floor: 1, room: 101, types: 'Guest Room Linens', items: 'Bath Towels', timeDate: '3:30PM/10.25.2025', status: 'cleaned', remarks: 'All towels replaced' },
  { LinenID: 3, floor: 2, room: 201, types: 'Guest Room Linens', items: 'Bed Linen', timeDate: '2:15PM/10.25.2025', status: 'pending', remarks: 'Awaiting replacement' },
  { LinenID: 4, floor: 2, room: 202, types: 'Guest Room Linens', items: 'Pillowcases', timeDate: '4:00PM/10.25.2025', status: 'cleaned', remarks: 'Completed' },
];

// ===== HOUSEKEEPING AMENITIES DATA =====
const housekeepingAmenities = [
  { AmenityID: 1, floor: 1, room: 101, types: 'Guest Room Amenities', items: 'Toiletries', timeDate: '3:30PM/10.25.2025', status: 'stocked', remarks: 'Fully restocked' },
  { AmenityID: 2, floor: 1, room: 102, types: 'Guest Room Amenities', items: 'Mini Bar', timeDate: '2:45PM/10.25.2025', status: 'pending', remarks: 'Needs refill' },
  { AmenityID: 3, floor: 2, room: 201, types: 'Guest Room Amenities', items: 'Coffee Maker', timeDate: '1:30PM/10.25.2025', status: 'stocked', remarks: 'Coffee pods refilled' },
  { AmenityID: 4, floor: 2, room: 202, types: 'Guest Room Amenities', items: 'Toiletries', timeDate: '4:15PM/10.25.2025', status: 'stocked', remarks: 'Completed' },
];

// ===== STAFF DATA =====
const staffMembers = [
  { id: 1, name: 'Anna Martinez', assigned: false },
  { id: 2, name: 'James Wilson', assigned: true },
  { id: 3, name: 'Sofia Rodriguez', assigned: false },
  { id: 4, name: 'Michael Brown', assigned: false },
  { id: 5, name: 'Emma Davis', assigned: true },
  { id: 6, name: 'Oliver Taylor', assigned: false },
];

// ===== MAINTENANCE REQUESTS DATA =====
const maintenanceRequests = [
  { floor: 1, room: 101, issue: 'Leaky Faucet', date: '10/25/25', requestedTime: '6:30 PM', completedTime: '-', staff: 'Not Assigned', status: 'pending', remarks: 'Urgent repair needed' },
  { floor: 1, room: 102, issue: 'AC Not Working', date: '10/25/25', requestedTime: '7:00 PM', completedTime: '-', staff: 'Juan Dela Cruz', status: 'in-progress', remarks: 'Technician on site' },
  { floor: 2, room: 201, issue: 'Door Lock Broken', date: '10/25/25', requestedTime: '5:30 PM', completedTime: '-', staff: 'Not Assigned', status: 'pending', remarks: 'Waiting for parts' },
];

// ===== MAINTENANCE HISTORY DATA =====
const maintenanceHistory = [
  { floor: 1, room: 101, issue: 'Leaky Faucet', date: '10/25/25', requestedTime: '6:30 PM', completedTime: '8:00 PM', staff: 'Juan Dela Cruz', status: 'repaired', remarks: 'Replaced washer' },
  { floor: 1, room: 102, issue: 'AC Not Working', date: '10/25/25', requestedTime: '6:30 PM', completedTime: '8:00 PM', staff: 'Juan Dela Cruz', status: 'repaired', remarks: 'Replaced filter' },
  { floor: 2, room: 201, issue: 'Door Lock Broken', date: '10/25/25', requestedTime: '6:30 PM', completedTime: '8:00 PM', staff: 'Juan Dela Cruz', status: 'repaired', remarks: 'Fixed lock' },
  { floor: 2, room: 202, issue: 'Light Bulb Out', date: '10/24/25', requestedTime: '3:00 PM', completedTime: '3:30 PM', staff: 'Juan Dela Cruz', status: 'repaired', remarks: 'Replaced bulb' },
];

// ===== MAINTENANCE APPLIANCES DATA =====
const maintenanceAppliances = [
  { ApplianceID: 1, floor: 1, room: 101, installedDate: '10.25.2025', types: 'Electric', items: 'TV (Brand)', lastMaintained: '3:30PM/10.25.2025', remarks: 'Working properly' },
  { ApplianceID: 2, floor: 1, room: 101, installedDate: '10.25.2025', types: 'Water System', items: 'Heater (Brand)', lastMaintained: '3:30PM/10.25.2025', remarks: 'Serviced' },
  { ApplianceID: 3, floor: 2, room: 201, installedDate: '10.20.2025', types: 'Electric', items: 'Refrigerator', lastMaintained: '2:00PM/10.24.2025', remarks: 'Needs check' },
  { ApplianceID: 4, floor: 2, room: 202, installedDate: '10.22.2025', types: 'HVAC', items: 'Air Conditioner', lastMaintained: '4:00PM/10.25.2025', remarks: 'Filter replaced' },
];

// ===== PARKING DATA =====
const parkingData = [
  { plateNumber: 'AB123C', room: 101, guestName: 'Juan Dela Cruz', vehicleType: 'Sedan', level: 1, block: 'A', slotNumber: '1L-A6', entryTime: '2025-10-25 6:30 PM', exitTime: '2025-10-25 8:30 PM', status: 'occupied' },
  { plateNumber: 'XY789Z', room: 102, guestName: 'Maria Santos', vehicleType: 'SUV', level: 1, block: 'A', slotNumber: '1L-A7', entryTime: '2025-10-25 7:00 PM', exitTime: '-', status: 'occupied' },
  { plateNumber: 'CD456E', room: 201, guestName: 'Robert Chen', vehicleType: 'Van', level: 1, block: 'B', slotNumber: '1L-B3', entryTime: '2025-10-25 5:45 PM', exitTime: '-', status: 'occupied' },
  { plateNumber: 'FG321H', room: 202, guestName: 'Sarah Johnson', vehicleType: 'Sedan', level: 2, block: 'A', slotNumber: '2L-A1', entryTime: '2025-10-25 8:15 PM', exitTime: '2025-10-25 9:00 PM', status: 'reserved' },
  { plateNumber: 'IJ654K', room: 103, guestName: 'David Lee', vehicleType: 'Motorcycle', level: 2, block: 'B', slotNumber: '2L-B5', entryTime: '2025-10-25 6:00 PM', exitTime: '-', status: 'occupied' },
  { plateNumber: 'LM987N', room: 104, guestName: 'Anna Martinez', vehicleType: 'Sedan', level: 1, block: 'A', slotNumber: '1L-A2', entryTime: '2025-10-25 7:30 PM', exitTime: '-', status: 'vacant' },
];

// Parking Levels and Blocks for filters
const parkingLevels = ['1', '2', '3'];
const parkingBlocks = ['A', 'B', 'C', 'D'];

// ===== INVENTORY DATA =====
const inventoryData = [
  { id: 101, name: 'Liquid Detergent', category: 'Cleaning solution', quantity: 100, description: 'All-Purpose Cleaning Solution', status: 'in-stock', damage: 'No Damage', stockInDate: '10/10/25 14:30', stockOutDate: '-' },
  { id: 102, name: 'Electrical Tape', category: 'Electrical', quantity: 1, description: 'Insulating tape for electrical wiring', status: 'low-stock', damage: 'No Damage', stockInDate: '09/10/25 14:30', stockOutDate: '-' },
  { id: 103, name: 'Light Bulb', category: 'Electrical', quantity: 0, description: 'LED bulb 60W equivalent', status: 'out-of-stock', damage: 'Burnt Out', stockInDate: '09/10/25 14:30', stockOutDate: '10/10/25 14:30' },
  { id: 104, name: 'Toilet Paper', category: 'Bathroom Supplies', quantity: 250, description: '2-ply soft toilet tissue', status: 'in-stock', damage: 'No Damage', stockInDate: '10/15/25 10:00', stockOutDate: '-' },
  { id: 105, name: 'Hand Soap', category: 'Bathroom Supplies', quantity: 45, description: 'Antibacterial liquid soap', status: 'in-stock', damage: 'No Damage', stockInDate: '10/12/25 09:30', stockOutDate: '-' },
  { id: 106, name: 'Towels (Bath)', category: 'Linens', quantity: 8, description: 'White cotton bath towels', status: 'low-stock', damage: 'Minor Stains', stockInDate: '09/20/25 11:00', stockOutDate: '-' },
  { id: 107, name: 'Bed Sheets', category: 'Linens', quantity: 120, description: 'Queen size white cotton sheets', status: 'in-stock', damage: 'No Damage', stockInDate: '10/05/25 08:00', stockOutDate: '-' },
  { id: 108, name: 'Vacuum Cleaner Bags', category: 'Cleaning Equipment', quantity: 0, description: 'Replacement bags for vacuum', status: 'out-of-stock', damage: 'No Damage', stockInDate: '08/15/25 13:00', stockOutDate: '10/01/25 16:00' },
];

// ===== INVENTORY HISTORY DATA =====
const inventoryHistory = [
  { id: 101, name: 'Liquid Detergent', category: 'Cleaning solution', quantity: 50, action: 'Stock In', transactionDate: '10/10/25 14:30', performedBy: 'Anna Martinez', remarks: 'Regular restock' },
  { id: 102, name: 'Electrical Tape', category: 'Electrical', quantity: 5, action: 'Stock Out', transactionDate: '10/15/25 09:00', performedBy: 'James Wilson', remarks: 'Used for room repairs' },
  { id: 103, name: 'Light Bulb', category: 'Electrical', quantity: 10, action: 'Stock Out', transactionDate: '10/10/25 14:30', performedBy: 'Michael Brown', remarks: 'Replaced burnt bulbs' },
  { id: 104, name: 'Toilet Paper', category: 'Bathroom Supplies', quantity: 250, action: 'Stock In', transactionDate: '10/15/25 10:00', performedBy: 'Sofia Rodriguez', remarks: 'Bulk purchase' },
  { id: 105, name: 'Hand Soap', category: 'Bathroom Supplies', quantity: 30, action: 'Stock In', transactionDate: '10/12/25 09:30', performedBy: 'Emma Davis', remarks: 'Monthly supply' },
  { id: 106, name: 'Towels (Bath)', category: 'Linens', quantity: 12, action: 'Stock Out', transactionDate: '10/18/25 11:30', performedBy: 'Anna Martinez', remarks: 'Replaced damaged towels' },
  { id: 107, name: 'Bed Sheets', category: 'Linens', quantity: 120, action: 'Stock In', transactionDate: '10/05/25 08:00', performedBy: 'James Wilson', remarks: 'New inventory' },
  { id: 108, name: 'Vacuum Cleaner Bags', category: 'Cleaning Equipment', quantity: 20, action: 'Stock Out', transactionDate: '10/01/25 16:00', performedBy: 'Michael Brown', remarks: 'All used' },
];

// Inventory Categories for filters
const inventoryCategories = [
  'Cleaning solution',
  'Electrical',
  'Bathroom Supplies',
  'Linens',
  'Cleaning Equipment'
];

// ===== ROOMS DATA (MOCK - for frontend display only) =====
const roomsData = [
  { floor: 1, room: 101, type: 'Standard Room', guests: '1-2 guests', rate: '$120', status: 'available' },
  { floor: 1, room: 102, type: 'Deluxe Room', guests: '2-3 guests', rate: '$180', status: 'occupied' },
  { floor: 1, room: 103, type: 'Suite', guests: '2-4 guests', rate: '$250', status: 'maintenance' },
  { floor: 1, room: 104, type: 'Penthouse Suite', guests: '2-3 guests', rate: '$350', status: 'available' },
  { floor: 2, room: 201, type: 'Standard Room', guests: '1-2 guests', rate: '$120', status: 'occupied' },
  { floor: 2, room: 202, type: 'Deluxe Room', guests: '2-3 guests', rate: '$180', status: 'available' },
  { floor: 2, room: 203, type: 'Suite', guests: '2-4 guests', rate: '$250', status: 'reserved' },
  { floor: 2, room: 204, type: 'Standard Room', guests: '1-2 guests', rate: '$120', status: 'maintenance' },
];

// Room Types for dropdown
const roomTypes = [
  'Standard Room',
  'Deluxe Room',
  'Suite',
  'Penthouse Suite'
];

// ===== USER LOGS DATA (Mock Data for Frontend) =====
const userLogsData = [
  {
    LogID: 1,
    UserID: '019284726475',
    Lname: 'Bagayan',
    Fname: 'Juan',
    Mname: 'Constant',
    AccountType: 'admin',
    Role: 'Manager',
    Shift: 'Day',
    Username: 'Juana',
    EmailAddress: 'Juan@gmail.com',
    ActionType: 'Logged In',
    Timestamp: '2025-10-21 07:55 AM'
  },
  {
    LogID: 2,
    UserID: '019284726475',
    Lname: 'Bagayan',
    Fname: 'Juan',
    Mname: 'Constant',
    AccountType: 'admin',
    Role: 'Manager',
    Shift: 'Day',
    Username: 'Juana',
    EmailAddress: 'Juan@gmail.com',
    ActionType: 'Logged Out',
    Timestamp: '2025-10-21 05:30 PM'
  },
  {
    LogID: 3,
    UserID: '109093287678',
    Lname: 'Dela Cruz',
    Fname: 'Juan',
    Mname: 'Santos',
    AccountType: 'housekeeping_manager',
    Role: 'Manager',
    Shift: 'Morning',
    Username: 'juandc',
    EmailAddress: 'juandc@hotel.com',
    ActionType: 'Logged In',
    Timestamp: '2025-10-22 08:00 AM'
  },
  {
    LogID: 4,
    UserID: '109093287678',
    Lname: 'Dela Cruz',
    Fname: 'Juan',
    Mname: 'Santos',
    AccountType: 'housekeeping_manager',
    Role: 'Manager',
    Shift: 'Morning',
    Username: 'juandc',
    EmailAddress: 'juandc@hotel.com',
    ActionType: 'Logged Out',
    Timestamp: '2025-10-22 04:00 PM'
  }
];

// ===== DASHBOARD STATS DATA =====
const dashboardStats = {
  housekeepingMaintenance: {
    totalRooms: roomsData.length,
    occupied: roomsData.filter(r => r.status === 'occupied').length,
    needsCleaning: housekeepingRequests.length,
    maintenanceRequests: maintenanceRequests.length
  },
  inventory: {
    totalItems: inventoryData.length,
    lowStock: inventoryData.filter(i => i.status === 'low-stock').length,
    outOfStock: inventoryData.filter(i => i.status === 'out-of-stock').length
  },
  parking: {
    totalSlots: 40,
    occupied: parkingData.filter(p => p.status === 'occupied').length,
    vacant: parkingData.filter(p => p.status === 'vacant').length,
    reserved: parkingData.filter(p => p.status === 'reserved').length
  },
  users: {
    totalEmployees: staffMembers.length,
    housekeeping: 10,
    maintenance: 8,
    parking: 5
  },
  rooms: {
    total: roomsData.length,
    available: roomsData.filter(r => r.status === 'available').length,
    occupied: roomsData.filter(r => r.status === 'occupied').length,
    maintenance: roomsData.filter(r => r.status === 'maintenance').length,
    reserved: roomsData.filter(r => r.status === 'reserved').length
  }
};

// ===== GLOBAL DATA CACHE =====
// This allows real-time sync between pages
window.appData = {
  requests: housekeepingRequests,
  history: housekeepingHistory,
  linens: housekeepingLinens,
  amenities: housekeepingAmenities,
  staff: staffMembers,
  maintenanceRequests: maintenanceRequests,
  maintenanceHistory: maintenanceHistory,
  maintenanceAppliances: maintenanceAppliances,
  stats: dashboardStats,
  rooms: roomsData,
  parking: parkingData,
  inventory: inventoryData,
  inventoryHistory: inventoryHistory,
  userLogs: userLogsData
};

// Make data globally accessible
window.roomsData = roomsData;
window.parkingData = parkingData;
window.inventoryData = inventoryData;
window.inventoryHistory = inventoryHistory;
window.housekeepingLinens = housekeepingLinens;
window.housekeepingAmenities = housekeepingAmenities;
window.maintenanceRequests = maintenanceRequests;
window.maintenanceAppliances = maintenanceAppliances;
window.userLogsData = userLogsData;