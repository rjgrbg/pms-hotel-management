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

// ===== DASHBOARD STATS DATA =====
const dashboardStats = {
  housekeepingMaintenance: {
    totalRooms: 40,
    occupied: 15,
    needsCleaning: housekeepingRequests.length,
    maintenanceRequests: maintenanceHistory.length
  },
  inventory: {
    totalItems: 40,
    lowStock: 15,
    outOfStock: 15
  },
  parking: {
    totalSlots: 40,
    occupied: 15,
    vacant: 15,
    reserved: 15
  },
  users: {
    totalEmployees: staffMembers.length,
    housekeeping: 10,
    maintenance: 8,
    parking: 5
  }
};

// ===== GLOBAL DATA CACHE =====
// This allows real-time sync between pages
window.appData = {
  requests: housekeepingRequests,
  history: housekeepingHistory,
  staff: staffMembers,
  maintenance: maintenanceHistory,
  stats: dashboardStats
};