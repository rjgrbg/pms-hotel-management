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

// ===== STAFF DATA =====
const staffMembers = [
  { id: 1, name: 'Anna Martinez', assigned: false },
  { id: 2, name: 'James Wilson', assigned: true },
  { id: 3, name: 'Sofia Rodriguez', assigned: false },
  { id: 4, name: 'Michael Brown', assigned: false },
  { id: 5, name: 'Emma Davis', assigned: true },
  { id: 6, name: 'Oliver Taylor', assigned: false },
];

// ===== MAINTENANCE DATA =====
const maintenanceHistory = [
  { floor: 1, room: 101, issue: 'Leaky Faucet', date: '10/25/25', requestedTime: '6:30 PM', completedTime: '8:00 PM', staff: 'Juan Dela Cruz', status: 'repaired', remarks: 'Replaced washer' },
  { floor: 1, room: 102, issue: 'AC Not Working', date: '10/25/25', requestedTime: '6:30 PM', completedTime: '8:00 PM', staff: 'Juan Dela Cruz', status: 'repaired', remarks: 'Replaced filter' },
  { floor: 2, room: 201, issue: 'Door Lock Broken', date: '10/25/25', requestedTime: '6:30 PM', completedTime: '8:00 PM', staff: 'Juan Dela Cruz', status: 'repaired', remarks: 'Fixed lock' },
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

// ===== INVENTORY DATA (Corrected) =====
// This is the new, correct inventory data
const inventoryData = [
    {
        id: 1,
        name: 'Liquid Detergent (1L)',
        category: 'Cleaning Solution',
        quantity: 120,
        description: 'All-Purpose Cleaner for laundry',
        itemsToIssue: 0
    },
    {
        id: 2,
        name: 'Electrical Tape (Roll)',
        category: 'Electrical',
        quantity: 30,
        description: 'Insulating tape for wiring',
        itemsToIssue: 0
    },
    {
        id: 3,
        name: 'LED Light Bulb (A19)',
        category: 'Electrical',
        quantity: 0,
        description: 'Standard 60W equivalent LED bulbs',
        itemsToIssue: 0
    },
    {
        id: 4,
        name: 'Screwdriver Set (10pc)',
        category: 'Tools',
        quantity: 8,
        description: 'Set of various screwdrivers',
        itemsToIssue: 0
    },
    {
        id: 5,
        name: 'Floor Cleaner (Gallon)',
        category: 'Cleaning Solution',
        quantity: 45,
        description: 'Concentrated floor cleaner',
        itemsToIssue: 0
    },
    {
        id: 6,
        name: 'Mop Heads (Cotton)',
        category: 'Supplies',
        quantity: 5,
        description: 'Replacement cotton mop heads',
        itemsToIssue: 0
    },
    {
        id: 7,
        name: 'Bath Towels (White)',
        category: 'Room Amenities',
        quantity: 250,
        description: 'Standard size bath towels',
        itemsToIssue: 0
    },
    {
        id: 8,
        name: 'Hand Soap (Pump)',
        category: 'Room Amenities',
        quantity: 300,
        description: 'Liquid hand soap dispenser',
        itemsToIssue: 0
    },
    {
        id: 9,
        name: 'Shampoo (Mini Bottle)',
        category: 'Room Amenities',
        quantity: 150,
        description: 'Guest amenity shampoo',
        itemsToIssue: 0
    },
    {
        id: 10,
        name: 'Glass Cleaner (Spray)',
        category: 'Cleaning Solution',
        quantity: 60,
        description: 'Streak-free glass cleaner',
        itemsToIssue: 0
    },
    {
        id: 11,
        name: 'Wrench (Adjustable)',
        category: 'Tools',
        quantity: 12,
        description: '8-inch adjustable wrench',
        itemsToIssue: 0
    },
    {
        id: 12,
        name: 'Batteries (AA 4-pack)',
        category: 'Electrical',
        quantity: 75,
        description: 'Alkaline batteries for remotes',
        itemsToIssue: 0
    }
];

// Inventory Categories for filters (Generated from the new data)
const inventoryCategories = [
    ...new Set(inventoryData.map(item => item.category))
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

// ===== DASHBOARD STATS DATA =====
const dashboardStats = {
  housekeepingMaintenance: {
    totalRooms: roomsData.length,
    occupied: roomsData.filter(r => r.status === 'occupied').length,
    needsCleaning: housekeepingRequests.length,
    maintenanceRequests: maintenanceHistory.length
  },
  inventory: {
    totalItems: inventoryData.length,
    // Note: The new inventoryData doesn't have 'status', so these are set to 0
    // To fix this, you would add a 'status' field to the inventoryData items
    lowStock: inventoryData.filter(i => i.quantity > 0 && i.quantity <= 10).length, // Example: low stock is 10 or less
    outOfStock: inventoryData.filter(i => i.quantity === 0).length
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
  staff: staffMembers,
  maintenance: maintenanceHistory,
  stats: dashboardStats,
  rooms: roomsData,
  parking: parkingData,
  inventory: inventoryData // Corrected to use the new inventoryData
};

// Make data globally accessible
window.roomsData = roomsData;
window.parkingData = parkingData;
window.inventoryData = inventoryData; // Corrected to use the new inventoryData

