# 🏨 The Celestia Hotel - Quick Start Guide

## ✅ System Requirements (Already Met!)
- ✓ PHP 8.2.12 installed
- ✓ Composer dependencies installed
- ✓ Cloud database configured (Clever Cloud MySQL)

## 🚀 How to Run the System

### Option 1: PHP Built-in Server (Recommended)
```bash
php -S localhost:3000
```

Then open your browser to: **http://localhost:3000**

### Option 2: Using XAMPP (You already have it!)
1. Your project is already in: `C:\xampp\htdocs\pms`
2. Start XAMPP Control Panel
3. Start Apache
4. Open browser to: **http://localhost/pms**

## 🔐 Admin Login

After opening the system:
1. Click the **LOGIN** button
2. Enter your admin credentials:
   - Username: (your admin username)
   - Password: (your admin password)

## 📊 Admin Dashboard Features

Once logged in, you'll see:

### 1. Dashboard
- Overview of all hotel operations
- Real-time statistics for rooms, housekeeping, maintenance, parking, and inventory

### 2. Housekeeping
- **Requests**: Manage cleaning requests and assign staff
- **History**: View completed/cancelled cleaning tasks

### 3. Maintenance
- **Requests**: Monitor maintenance requests
- **History**: Review completed repairs

### 4. Parking
- View and manage parking slots
- Track occupied/vacant spaces

### 5. Inventory
- Track all inventory items
- Monitor low stock and out-of-stock items

### 6. Rooms
- View all hotel rooms
- Manage room information and status

### 7. Manage Users
- Add/edit/delete users
- Assign roles: Admin, Housekeeping Manager/Staff, Maintenance Manager/Staff, Parking Manager, Inventory Manager

## 🗄️ Database Connection

Your system automatically connects to:
- **Cloud Database**: Clever Cloud MySQL
- **Host**: bt3wljbwprykeblz7tvq-mysql.services.clever-cloud.com
- **Port**: 20351
- **Timezone**: Philippine Time (Asia/Manila)

No additional database setup needed!

## 🆘 Troubleshooting

### If you get "Connection refused" error:
```bash
# Make sure no other service is using port 3000
# Try a different port:
php -S localhost:8080
```

### If you see database connection errors:
- Check your internet connection (cloud database requires internet)
- Verify the database credentials in `db_connection.php`

### If pages don't load properly:
- Clear your browser cache (Ctrl + Shift + Delete)
- Try a different browser

## 📝 Quick Commands

Start the server:
```bash
php -S localhost:3000
```

Stop the server:
```
Press Ctrl + C in the terminal
```

## 🎯 Next Steps

1. Run the server using one of the methods above
2. Log in with your admin credentials
3. Explore the dashboard
4. Start managing your hotel operations!

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console (F12) for JavaScript errors
2. Check the PHP error log
3. Verify your database connection is working

---

**Ready to start?** Just run: `php -S localhost:3000`
