// ===== DASHBOARD UPDATE FUNCTIONS =====
function updateStatCard(index, value) {
  const statCards = document.querySelectorAll('.statValue');
  if (statCards[index]) {
    statCards[index].textContent = value || '0';
  }
}

function updateDashboardFromRooms(rooms) {
  const totalRooms = rooms.length;
  const needsCleaning = rooms.filter(r => r.Status === 'Needs Cleaning').length;
  const maintenance = rooms.filter(r => r.Status === 'Needs Maintenance' || r.Status === 'Maintenance').length;

  updateStatCard(0, totalRooms);
  updateStatCard(1, needsCleaning); 
  updateStatCard(2, maintenance); 
}

function updateDashboardFromUsers(users) {
  const totalEmployees = users.length;
  // --- ADDED ADMIN COUNT ---
  const admin = users.filter(u => u.AccountType === 'admin').length;
  
  const housekeeping = users.filter(u => 
    u.AccountType === 'housekeeping_manager' || u.AccountType === 'housekeeping_staff'
  ).length;
  
  const maintenanceUsers = users.filter(u => 
    u.AccountType === 'maintenance_manager' || u.AccountType === 'maintenance_staff'
  ).length;
  
  const parking = users.filter(u => u.AccountType === 'parking_manager').length;

  // --- ADDED INVENTORY COUNT ---
  const inventory = users.filter(u => u.AccountType === 'inventory_manager').length;

  // --- CORRECTED INDEXES FOR 6 CARDS ---
  updateStatCard(9, totalEmployees); // Card 1: Total
  updateStatCard(10, admin);          // Card 2: Admin
  updateStatCard(11, housekeeping);   // Card 3: Housekeeping
  updateStatCard(12, maintenanceUsers); // Card 4: Maintenance
  updateStatCard(13, parking);          // Card 5: Parking
  updateStatCard(14, inventory);        // Card 6: Inventory
}

function updateDashboardStats(data) {
  const hkm = data.housekeepingMaintenance || dashboardStats.housekeepingMaintenance;
  updateStatCard(0, hkm.totalRooms);
  updateStatCard(1, hkm.needsCleaning);
  updateStatCard(2, hkm.maintenanceRequests);

  const inventory = data.inventory || dashboardStats.inventory;
  updateStatCard(3, inventory.totalItems);
  updateStatCard(4, inventory.lowStock);
  updateStatCard(5, inventory.outOfStock);

  const parking = data.parking || dashboardStats.parking;
  updateStatCard(6, parking.totalSlots);
  updateStatCard(7, parking.occupied);
  updateStatCard(8, parking.vacant);

  const users = data.users || dashboardStats.users;
  // --- CORRECTED INDEXES FOR 6 CARDS (STATIC) ---
  updateStatCard(9, users.totalEmployees);
  updateStatCard(10, users.admin || 0);          // Added admin, default to 0
  updateStatCard(11, users.housekeeping);
  updateStatCard(12, users.maintenance);
  updateStatCard(13, users.parking);
  updateStatCard(14, users.inventory || 0);      // Added inventory, default to 0
}