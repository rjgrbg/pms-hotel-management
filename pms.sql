-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2025 at 04:04 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pms`
--

-- --------------------------------------------------------

--
-- Table structure for table `auth_tokens`
--

CREATE TABLE `auth_tokens` (
  `id` int(11) NOT NULL,
  `selector` char(32) NOT NULL,
  `hashed_validator` char(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_tokens`
--

INSERT INTO `auth_tokens` (`id`, `selector`, `hashed_validator`, `user_id`, `expires`) VALUES
(1, 'b25c6de43f4148da96199c7fc499fd6c', '$2y$10$IVrlpHnNisvApBcsKWhOr.FRGIR4MIhIGO6.X6fGqrrLSDhFIa17u', 1, '2025-11-20 11:21:39'),
(2, 'e9cfdd1564ca84bc5f391c4dbaccd82a', '$2y$10$j4IgDtgzCMyRfPZ9hDHlouDodNN2Q6AOo7rr9KXAUbFFt.ahHYBEa', 1, '2025-11-20 11:22:15'),
(3, '951ba576d478816b4b089007770e9ad8', '$2y$10$2rRZq9ZjCWNlyk81OTIQveeH2ghmY5jGRI1l7VJVk/YwkZdUQ8W3K', 1, '2025-11-20 11:24:45'),
(4, '037a5269db024aba8d37f8b9b0c5d57d', '$2y$10$fgsmLl18bgL1.1hoSESePe.PtXydnScDzGbVCmuX.GQ3K/aoBhXCG', 1, '2025-11-20 11:28:11'),
(5, '737ccd17b442cd280a2e63bd9e0e5353', '$2y$10$zvg.s9kqZWHHKtC0mho3YuEp0FpAjfMfeeNFjNBZAeUvrG.pDmy1i', 1, '2025-11-20 11:30:29'),
(6, 'b3c83cf9348fba6bfbdc95bf62846e8b', '$2y$10$zb.7rGa9GSXC/qAm5lqlZuOH7.ntsRdrToYKsWda7aLamXDQP2oxq', 1, '2025-11-20 11:38:07'),
(7, '8010b32db512ef8df57a0b9ef31c14d8', '$2y$10$SiZR5tOKDuGGh6fAFm3rWuqhl676CxHtL3Z/UorGp58U9Ho6XPi.W', 1, '2025-11-20 11:50:32'),
(8, '980b6a14cb6b535f1de2cb1eef3ed89f', '$2y$10$HsXHr.wk33qFrX8nqmuvM.gotUPaQbK0ZYDkanGdz24sMpHqf/1R2', 1, '2025-11-20 14:28:08'),
(9, '680070b8cc1f43c09d4169348edc0ba6', '$2y$10$eiTcj0syJkdpkWuj7k3xp.QkZeIpFlmyuOSvm3ThDeEFE/d9vY/te', 1, '2025-11-20 14:33:52');

-- --------------------------------------------------------

--
-- Table structure for table `cleaninglog`
--

CREATE TABLE `cleaninglog` (
  `CleaningLogID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `CleaningID` int(11) NOT NULL,
  `TimeDateCleaned` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cleaningtask`
--

CREATE TABLE `cleaningtask` (
  `CleaningID` int(11) NOT NULL,
  `RoomID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `CleaningType` varchar(255) NOT NULL,
  `Status` varchar(255) NOT NULL,
  `DateTimeAssigned` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `DateTimeCompleted` timestamp NULL DEFAULT NULL,
  `CleaningRemarks` varchar(255) DEFAULT NULL,
  `StatusUpdateToken` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hvacmaintenance`
--

CREATE TABLE `hvacmaintenance` (
  `UnitID` int(11) NOT NULL,
  `UnitName` varchar(255) NOT NULL,
  `RoomID` int(11) NOT NULL,
  `UnitType` varchar(255) NOT NULL,
  `Manufacturer` varchar(255) NOT NULL,
  `ModelNumber` varchar(255) NOT NULL,
  `InstallDate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `UnitStatus` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `ItemID` int(11) NOT NULL,
  `ItemName` varchar(255) NOT NULL,
  `ItemCategoryID` int(11) NOT NULL,
  `ItemQuantity` decimal(15,2) NOT NULL,
  `ItemDescription` varchar(255) DEFAULT NULL,
  `ItemStatus` varchar(255) NOT NULL,
  `DateofStockIn` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`ItemID`, `ItemName`, `ItemCategoryID`, `ItemQuantity`, `ItemDescription`, `ItemStatus`, `DateofStockIn`) VALUES
(10, 'asd', 1, 5.00, 'qwe', 'Low Stock', '2025-11-11 00:24:36'),
(11, 'd', 2, 4.00, 'asd', 'Low Stock', '2025-10-31 16:00:00'),
(12, 'g', 3, 2.00, 's', 'Low Stock', '2025-10-09 16:00:00'),
(13, 'k', 4, 2.00, 's', 'Low Stock', '2025-10-03 16:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `inventorylog`
--

CREATE TABLE `inventorylog` (
  `InvLogID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `ItemID` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `InventoryLogReason` varchar(255) NOT NULL,
  `DateofRelease` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventorylog`
--

INSERT INTO `inventorylog` (`InvLogID`, `UserID`, `ItemID`, `Quantity`, `InventoryLogReason`, `DateofRelease`) VALUES
(58, 38, 10, 2, 'Initial Stock In', '2025-11-10 13:36:40'),
(59, 38, 11, 4, 'Initial Stock In', '2025-11-10 13:36:50'),
(60, 38, 12, 2, 'Initial Stock In', '2025-11-10 13:37:01'),
(61, 38, 13, 2, 'Initial Stock In', '2025-11-10 13:37:13'),
(62, 38, 10, 2, 'Stock Added', '2025-11-10 13:50:28'),
(63, 38, 10, 1, 'Stock Added', '2025-11-10 13:59:49'),
(64, 39, 10, -1, 'Item Issued', '2025-11-10 14:08:53'),
(65, 39, 10, -4, 'Item Issued', '2025-11-10 14:20:44'),
(66, 38, 10, 1, 'Stock Added', '2025-11-10 14:27:48'),
(67, 39, 10, -1, 'Item Issued', '2025-11-10 14:29:18'),
(68, 38, 10, 3, 'Stock Added', '2025-11-10 14:29:32'),
(69, 38, 10, 2, 'Stock Added', '2025-11-10 14:30:56'),
(70, 38, 10, 1, 'Stock Added', '2025-11-10 14:35:09'),
(71, 38, 10, 1, 'Stock Added', '2025-11-10 14:39:44'),
(72, 39, 10, -1, 'Item Issued', '2025-11-10 14:40:03'),
(73, 39, 10, -1, 'Item Issued', '2025-11-11 00:24:36');

-- --------------------------------------------------------

--
-- Table structure for table `itemcategory`
--

CREATE TABLE `itemcategory` (
  `ItemCategoryID` int(11) NOT NULL,
  `ItemCategoryName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `itemcategory`
--

INSERT INTO `itemcategory` (`ItemCategoryID`, `ItemCategoryName`) VALUES
(1, 'Cleaning Solution'),
(2, 'Electrical'),
(3, 'Furniture & Fixtures'),
(4, 'Room Amenities');

-- --------------------------------------------------------

--
-- Table structure for table `maintenancelog`
--

CREATE TABLE `maintenancelog` (
  `MaintenanceLogID` int(11) NOT NULL,
  `WorkOrderID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `PartReplace` varchar(255) DEFAULT NULL,
  `ResolutionRemarks` varchar(255) NOT NULL,
  `TimeDateMaintenance` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_requests`
--

CREATE TABLE `maintenance_requests` (
  `RequestID` int(11) NOT NULL,
  `RoomID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `IssueType` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `Status` varchar(50) NOT NULL DEFAULT 'Pending',
  `DateRequested` datetime NOT NULL,
  `DateCompleted` datetime DEFAULT NULL,
  `AssignedUserID` int(11) DEFAULT NULL,
  `Notes` text DEFAULT NULL,
  `Remarks` text DEFAULT NULL,
  `WorkType` varchar(100) DEFAULT NULL,
  `UnitType` varchar(100) DEFAULT NULL,
  `WorkDescription` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `maintenance_requests`
--

INSERT INTO `maintenance_requests` (`RequestID`, `RoomID`, `UserID`, `IssueType`, `Description`, `Status`, `DateRequested`, `DateCompleted`, `AssignedUserID`, `Notes`, `Remarks`, `WorkType`, `UnitType`, `WorkDescription`) VALUES
(12, 1, 35, 'Appliance', 'Appliance reported as \'Needs Repair\' or \'Out of Service\'.', 'Pending', '2025-11-11 10:57:27', NULL, 39, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `parkingarea`
--

CREATE TABLE `parkingarea` (
  `AreaID` int(11) NOT NULL,
  `AreaName` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parkingarea`
--

INSERT INTO `parkingarea` (`AreaID`, `AreaName`) VALUES
(1, 'Area A'),
(2, 'Area B'),
(3, 'Area C'),
(4, 'Area D'),
(5, 'Area E');

-- --------------------------------------------------------

--
-- Table structure for table `parkingslot`
--

CREATE TABLE `parkingslot` (
  `SlotID` int(11) NOT NULL,
  `AreaID` int(11) NOT NULL,
  `SlotName` varchar(20) NOT NULL,
  `AllowedVehicleTypeID` int(11) NOT NULL,
  `Status` enum('available','occupied','reserved','maintenance') NOT NULL DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parkingslot`
--

INSERT INTO `parkingslot` (`SlotID`, `AreaID`, `SlotName`, `AllowedVehicleTypeID`, `Status`) VALUES
(51, 1, 'A-01', 1, 'occupied'),
(52, 1, 'A-02', 1, 'available'),
(53, 1, 'A-03', 1, 'available'),
(54, 1, 'A-04', 1, 'available'),
(55, 1, 'A-05', 1, 'available'),
(56, 1, 'A-06', 1, 'available'),
(57, 1, 'A-07', 1, 'available'),
(58, 1, 'A-08', 1, 'available'),
(59, 1, 'A-09', 1, 'available'),
(60, 1, 'A-10', 1, 'available'),
(61, 2, 'B-01', 2, 'occupied'),
(62, 2, 'B-02', 2, 'available'),
(63, 2, 'B-03', 2, 'available'),
(64, 2, 'B-04', 2, 'available'),
(65, 2, 'B-05', 2, 'available'),
(66, 2, 'B-06', 2, 'available'),
(67, 2, 'B-07', 2, 'available'),
(68, 2, 'B-08', 2, 'available'),
(69, 2, 'B-09', 2, 'available'),
(70, 2, 'B-10', 2, 'available'),
(71, 3, 'C-01', 2, 'occupied'),
(72, 3, 'C-02', 2, 'available'),
(73, 3, 'C-03', 2, 'available'),
(74, 3, 'C-04', 2, 'available'),
(75, 3, 'C-05', 2, 'available'),
(76, 3, 'C-06', 2, 'available'),
(77, 3, 'C-07', 2, 'available'),
(78, 3, 'C-08', 2, 'available'),
(79, 3, 'C-09', 2, 'available'),
(80, 3, 'C-10', 2, 'available'),
(81, 4, 'D-01', 2, 'available'),
(82, 4, 'D-02', 2, 'occupied'),
(83, 4, 'D-03', 2, 'available'),
(84, 4, 'D-04', 2, 'available'),
(85, 4, 'D-05', 2, 'available'),
(86, 4, 'D-06', 2, 'available'),
(87, 4, 'D-07', 2, 'available'),
(88, 4, 'D-08', 2, 'available'),
(89, 4, 'D-09', 2, 'available'),
(90, 4, 'D-10', 2, 'available'),
(91, 5, 'E-01', 2, 'available'),
(92, 5, 'E-02', 2, 'available'),
(93, 5, 'E-03', 2, 'available'),
(94, 5, 'E-04', 2, 'available'),
(95, 5, 'E-05', 2, 'available'),
(96, 5, 'E-06', 2, 'available'),
(97, 5, 'E-07', 2, 'available'),
(98, 5, 'E-08', 2, 'available'),
(99, 5, 'E-09', 2, 'available'),
(100, 5, 'E-10', 2, 'available');

-- --------------------------------------------------------

--
-- Table structure for table `parking_sessions`
--

CREATE TABLE `parking_sessions` (
  `SessionID` int(11) NOT NULL,
  `SlotID` int(11) NOT NULL,
  `PlateNumber` varchar(20) NOT NULL,
  `GuestName` varchar(255) DEFAULT NULL,
  `RoomNumber` varchar(20) DEFAULT NULL,
  `VehicleTypeID` int(11) NOT NULL,
  `VehicleCategoryID` int(11) NOT NULL,
  `EntryTime` datetime NOT NULL,
  `ExitTime` datetime DEFAULT NULL,
  `TotalFee` decimal(10,2) DEFAULT NULL,
  `StaffID_Entry` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parking_sessions`
--

INSERT INTO `parking_sessions` (`SessionID`, `SlotID`, `PlateNumber`, `GuestName`, `RoomNumber`, `VehicleTypeID`, `VehicleCategoryID`, `EntryTime`, `ExitTime`, `TotalFee`, `StaffID_Entry`) VALUES
(1, 51, 'QW4E12', 'asd', 's', 2, 9, '2025-11-07 16:08:27', '2025-11-07 16:08:36', NULL, 40),
(2, 51, 'WQE', 'wqe', 's', 1, 11, '2025-11-07 16:08:59', '2025-11-07 16:11:48', NULL, 40),
(3, 51, 'QWE', 'wqe', 'qwe', 1, 11, '2025-11-07 16:12:35', NULL, NULL, 40),
(4, 61, 'WE', 'wea', 'e', 2, 9, '2025-11-07 16:12:45', NULL, NULL, 40),
(5, 71, 'SDA', 'ad', 'asdasd', 1, 11, '2025-11-07 16:12:55', NULL, NULL, 40),
(6, 82, 'AS', 'asd', 'd', 1, 11, '2025-11-07 16:13:02', NULL, NULL, 40),
(7, 91, 'S', 'd', 'asd', 1, 11, '2025-11-07 16:13:14', '2025-11-07 17:00:50', NULL, 40),
(8, 52, 'QW4E12E', 'w', 'q1', 1, 11, '2025-11-08 02:48:34', '2025-11-08 02:48:37', NULL, 40);

-- --------------------------------------------------------

--
-- Table structure for table `rate`
--

CREATE TABLE `rate` (
  `RateID` int(11) NOT NULL,
  `AreaID` int(11) NOT NULL,
  `VehicleCategoryID` int(11) NOT NULL,
  `VehicleTypeID` int(11) NOT NULL,
  `HourlyRate` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

CREATE TABLE `room` (
  `RoomID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `RoomNumber` int(11) NOT NULL,
  `RoomType` varchar(255) NOT NULL,
  `GuestCapacity` varchar(50) NOT NULL DEFAULT '1-2 guests',
  `Rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `RoomStatus` varchar(50) NOT NULL DEFAULT 'available',
  `LastClean` timestamp NULL DEFAULT NULL,
  `LastMaintenance` timestamp NULL DEFAULT NULL,
  `FloorNumber` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room_appliances`
--

CREATE TABLE `room_appliances` (
  `ApplianceID` int(11) NOT NULL,
  `RoomID` int(11) NOT NULL,
  `ApplianceType` varchar(100) NOT NULL,
  `ApplianceName` varchar(255) NOT NULL,
  `Manufacturer` varchar(255) DEFAULT NULL,
  `ModelNumber` varchar(255) DEFAULT NULL,
  `InstalledDate` date NOT NULL,
  `Status` varchar(50) NOT NULL DEFAULT 'Working',
  `Remarks` text DEFAULT NULL,
  `LastMaintainedDate` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_appliances`
--

INSERT INTO `room_appliances` (`ApplianceID`, `RoomID`, `ApplianceType`, `ApplianceName`, `Manufacturer`, `ModelNumber`, `InstalledDate`, `Status`, `Remarks`, `LastMaintainedDate`) VALUES
(5, 4, 'HVAC', 'sad', 'asda', 'dasd', '2025-11-01', 'Working', '', '2025-11-11'),
(9, 4, 'Electric', 'sad', 'wq', 'hghhjgg', '2025-11-01', 'Working', '', NULL),
(14, 1, 'Electric', 'sad', 'asd', 'asds', '2025-11-01', 'Needs Repair', '', '2025-11-11'),
(15, 4, 'Electric', 'asd', 'sadd', 'sddd', '2025-11-01', 'Working', '', '2025-11-11'),
(16, 5, 'Electric', 'asde', 's', 'bab', '2025-11-01', 'Working', '', NULL),
(17, 2, 'Electric', 'sad', 'sadas', 'asd', '2025-11-01', 'Working', '', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `room_status`
--

CREATE TABLE `room_status` (
  `StatusID` int(11) NOT NULL,
  `RoomNumber` varchar(20) NOT NULL,
  `RoomStatus` varchar(50) NOT NULL,
  `LastClean` timestamp NULL DEFAULT NULL,
  `LastMaintenance` timestamp NULL DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  `LastUpdated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_status`
--

INSERT INTO `room_status` (`StatusID`, `RoomNumber`, `RoomStatus`, `LastClean`, `LastMaintenance`, `UserID`, `LastUpdated`) VALUES
(1, '101', 'Maintenance', NULL, '2025-11-11 02:57:27', 35, '2025-11-11 02:57:27'),
(3, '102', 'Available', NULL, NULL, 35, '2025-11-11 01:25:44'),
(9, '103', 'Available', NULL, NULL, 1, '2025-11-10 23:54:25'),
(10, '201', 'Available', NULL, '2025-11-11 01:12:47', 1, '2025-11-11 01:17:29'),
(15, '202', 'Available', NULL, NULL, 1, '2025-11-10 23:54:33');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `EmployeeID` varchar(50) DEFAULT NULL,
  `Fname` varchar(255) NOT NULL,
  `Lname` varchar(255) NOT NULL,
  `Mname` varchar(255) DEFAULT NULL,
  `Birthday` date NOT NULL,
  `AccountType` varchar(255) NOT NULL,
  `AvailabilityStatus` varchar(20) NOT NULL DEFAULT 'Available',
  `Username` varchar(255) NOT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `EmailAddress` varchar(255) NOT NULL,
  `Shift` varchar(255) NOT NULL,
  `Address` varchar(255) NOT NULL,
  `ContactNumber` varchar(50) DEFAULT NULL,
  `ActivationToken` varchar(64) DEFAULT NULL,
  `TokenExpiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `EmployeeID`, `Fname`, `Lname`, `Mname`, `Birthday`, `AccountType`, `AvailabilityStatus`, `Username`, `Password`, `EmailAddress`, `Shift`, `Address`, `ContactNumber`, `ActivationToken`, `TokenExpiry`) VALUES
(1, NULL, 'vincew', 'vargas', 'gonzales', '2025-10-01', 'admin', 'Available', 'admin', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'vincevargas90@gmail.com', 'Night', 'asd', NULL, NULL, NULL),
(34, 'E1011', 'house', 'keeping', 'manager', '2015-11-10', 'housekeeping_manager', 'Available', 'housekeeping', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'asd@gmail.com', 'asd', 'asd', '324', NULL, NULL),
(35, 'E1012', 'maintain', 'nance', 'manager', '2015-11-02', 'maintenance_manager', 'Available', 'maintenance', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'asd@sf.com', 'ss', 'asd', 'asd', NULL, NULL),
(37, '1010', 'Testting', 'Admin', 'X', '1990-01-01', 'admin', 'Available', 'test.admins', '$2y$10$.yNgmWda3eza4nJtB9wz0.rGydS62.9ta4rvnAZskPauf2C3yN2la', 'dayvoice993@gmail.com', 'Morning', '123 Admin Street, Manila', '09000001010', '414a629dd94a755c3c936c40c46455766c205352ca0f09cf10769b83ea8fc51a', '2025-11-08 03:01:01'),
(38, '1009', 'Michael', 'Brown', 'F', '1992-09-18', 'parking_manager', 'Available', 'mmanager', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'michael.brown@example.com', 'Morning', '606 Parking Way, Taguig', '09220001009', '6543fd95970924b4af1da17b312e6fd145c34424ee1f999d858778fdbd2a65ee', '2025-11-08 03:25:04'),
(39, '1008', 'Emily', 'Chen', 'E', '2001-06-20', 'maintenance_staff', 'Assigned', 'mstaff', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'farmersday96@gmail.com', 'Morning', '505 Repair Ln, Makati', '09210001008', '8a9a372ed04b1ab93f4e1d7b4eb9ed67f56b3e8941812b5dfe4f26741226afb6', '2025-11-08 03:28:56'),
(40, '1023', 'sadas', 'ssss', 'nase', '2015-11-03', 'parking_manager', 'Available', 'pmanager', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'as', 'sd', 'asd', 'asd', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_logs`
--

CREATE TABLE `user_logs` (
  `LogID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `ActionType` varchar(255) NOT NULL,
  `Timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_logs`
--

INSERT INTO `user_logs` (`LogID`, `UserID`, `ActionType`, `Timestamp`) VALUES
(1, 1, 'Logged Out', '2025-11-10 10:43:28'),
(2, 1, 'Logged Out', '2025-11-10 10:43:46'),
(3, 34, 'Logged Out', '2025-11-10 10:43:53'),
(4, 1, 'Logged Out', '2025-11-10 10:44:39'),
(5, 1, 'Logged Out', '2025-11-10 10:45:12'),
(6, 1, 'Logged Out', '2025-11-10 10:45:54'),
(7, 34, 'Logged Out', '2025-11-10 10:46:00'),
(8, 1, 'Logged Out', '2025-11-10 10:46:41'),
(9, 1, 'Logged Out', '2025-11-10 10:46:54'),
(10, 34, 'Logged Out', '2025-11-10 10:46:59'),
(11, 1, 'Logged Out', '2025-11-10 10:50:09'),
(12, 1, 'Logged Out', '2025-11-10 10:50:26'),
(13, 39, 'Logged Out', '2025-11-10 10:50:37'),
(14, 1, 'Logged Out', '2025-11-10 10:54:52'),
(15, 1, 'Logged Out', '2025-11-10 10:55:29'),
(16, 38, 'Logged Out', '2025-11-10 10:55:50'),
(17, 1, 'Logged Out', '2025-11-10 10:57:37'),
(18, 1, 'Logged Out', '2025-11-10 10:57:55'),
(19, 1, 'Logged Out', '2025-11-10 10:58:16'),
(20, 1, 'Logged Out', '2025-11-10 10:59:35'),
(21, 1, 'Logged Out', '2025-11-10 11:01:43'),
(22, 1, 'Logged Out', '2025-11-10 11:02:44'),
(23, 1, 'Logged Out', '2025-11-10 11:04:56'),
(24, 1, 'Logged Out', '2025-11-10 11:06:27'),
(25, 1, 'Logged Out', '2025-11-10 11:11:59'),
(26, 1, 'Logged Out', '2025-11-10 11:12:20'),
(27, 1, 'Logged Out', '2025-11-10 11:15:36'),
(28, 1, 'Logged Out', '2025-11-10 11:17:57'),
(29, 1, 'Logged Out', '2025-11-10 11:28:05'),
(30, 1, 'Logged In', '2025-11-10 11:28:10'),
(31, 1, 'Logged Out', '2025-11-10 11:28:20'),
(32, 38, 'Logged In', '2025-11-10 11:28:24'),
(33, 38, 'Logged Out', '2025-11-10 11:28:28'),
(34, 34, 'Logged In', '2025-11-10 11:28:36'),
(35, 34, 'Logged Out', '2025-11-10 11:28:40'),
(36, 35, 'Logged In', '2025-11-10 11:28:51'),
(37, 35, 'Logged Out', '2025-11-10 11:28:54'),
(38, 40, 'Logged In', '2025-11-10 11:29:00'),
(39, 40, 'Logged Out', '2025-11-10 11:29:03'),
(40, 39, 'Logged In', '2025-11-10 11:29:15'),
(41, 39, 'Logged Out', '2025-11-10 11:29:18'),
(42, 1, 'Logged In', '2025-11-10 11:29:25'),
(43, 1, 'Logged Out', '2025-11-10 11:31:36'),
(44, 40, 'Logged In', '2025-11-10 11:31:41'),
(45, 40, 'Logged Out', '2025-11-10 11:31:57'),
(46, 1, 'Logged In', '2025-11-10 11:32:03'),
(47, 1, 'Logged Out', '2025-11-10 11:32:40'),
(48, 40, 'Logged In', '2025-11-10 11:32:44'),
(49, 40, 'Logged Out', '2025-11-10 11:32:50'),
(50, 1, 'Logged In', '2025-11-10 11:32:54'),
(51, 1, 'Logged Out', '2025-11-10 11:35:47'),
(52, 38, 'Logged In', '2025-11-10 11:35:53'),
(53, 38, 'Logged Out', '2025-11-10 13:38:11'),
(54, 39, 'Logged In', '2025-11-10 13:38:16'),
(55, 39, 'Logged Out', '2025-11-10 13:39:40'),
(56, 38, 'Logged In', '2025-11-10 13:39:45'),
(57, 38, 'Logged Out', '2025-11-10 14:00:03'),
(58, 34, 'Logged In', '2025-11-10 14:00:08'),
(59, 34, 'Logged Out', '2025-11-10 14:00:12'),
(60, 39, 'Logged In', '2025-11-10 14:00:17'),
(61, 39, 'Logged Out', '2025-11-10 14:00:31'),
(62, 38, 'Logged In', '2025-11-10 14:00:43'),
(63, 38, 'Logged Out', '2025-11-10 14:08:45'),
(64, 39, 'Logged In', '2025-11-10 14:08:49'),
(65, 39, 'Logged Out', '2025-11-10 14:08:59'),
(66, 38, 'Logged In', '2025-11-10 14:09:03'),
(67, 38, 'Logged Out', '2025-11-10 14:20:30'),
(68, 39, 'Logged In', '2025-11-10 14:20:34'),
(69, 39, 'Logged Out', '2025-11-10 14:20:47'),
(70, 38, 'Logged In', '2025-11-10 14:20:51'),
(71, 38, 'Logged Out', '2025-11-10 14:27:58'),
(72, 40, 'Logged In', '2025-11-10 14:28:09'),
(73, 40, 'Logged Out', '2025-11-10 14:28:25'),
(74, 40, 'Logged In', '2025-11-10 14:28:33'),
(75, 40, 'Logged Out', '2025-11-10 14:28:36'),
(76, 38, 'Logged In', '2025-11-10 14:28:41'),
(77, 38, 'Logged Out', '2025-11-10 14:28:49'),
(78, 39, 'Logged In', '2025-11-10 14:29:15'),
(79, 39, 'Logged Out', '2025-11-10 14:29:22'),
(80, 38, 'Logged In', '2025-11-10 14:29:26'),
(81, 38, 'Logged Out', '2025-11-10 14:39:50'),
(82, 39, 'Logged In', '2025-11-10 14:40:00'),
(83, 39, 'Logged Out', '2025-11-10 14:40:08'),
(84, 38, 'Logged In', '2025-11-10 14:40:14'),
(85, 38, 'Logged Out', '2025-11-10 14:40:19'),
(86, 38, 'Logged In', '2025-11-10 14:40:26'),
(87, 38, 'Logged Out', '2025-11-10 14:40:42'),
(88, 1, 'Logged In', '2025-11-10 14:41:00'),
(89, 1, 'Logged Out', '2025-11-10 16:04:26'),
(90, 1, 'Logged In', '2025-11-10 16:04:31'),
(91, 1, 'Logged Out', '2025-11-10 16:06:59'),
(92, 35, 'Logged In', '2025-11-10 16:07:05'),
(93, 38, 'Logged In', '2025-11-10 17:14:55'),
(94, 35, 'Logged Out', '2025-11-10 17:49:50'),
(95, 35, 'Logged In', '2025-11-10 17:49:59'),
(96, 35, 'Logged Out', '2025-11-10 18:22:49'),
(97, 38, 'Logged In', '2025-11-10 18:22:54'),
(98, 38, 'Logged Out', '2025-11-10 18:43:02'),
(99, 35, 'Logged In', '2025-11-10 18:43:08'),
(100, 35, 'Logged Out', '2025-11-10 19:49:28'),
(101, 1, 'Logged In', '2025-11-10 19:49:31'),
(102, 1, 'Logged Out', '2025-11-10 19:49:59'),
(103, 35, 'Logged In', '2025-11-10 19:50:07'),
(104, 35, 'Logged Out', '2025-11-10 20:11:50'),
(105, 1, 'Logged In', '2025-11-10 20:12:00'),
(106, 1, 'Logged Out', '2025-11-10 20:17:18'),
(107, 35, 'Logged In', '2025-11-10 20:17:22'),
(108, 35, 'Logged Out', '2025-11-10 20:32:33'),
(109, 1, 'Logged In', '2025-11-10 20:32:37'),
(110, 1, 'Logged Out', '2025-11-10 20:33:42'),
(111, 35, 'Logged In', '2025-11-10 20:33:46'),
(112, 1, 'Logged In', '2025-11-10 20:35:47'),
(113, 1, 'Logged Out', '2025-11-10 21:02:14'),
(114, 35, 'Logged In', '2025-11-10 21:02:18'),
(115, 35, 'Logged Out', '2025-11-10 21:23:59'),
(116, 35, 'Logged Out', '2025-11-10 21:39:09'),
(117, 35, 'Logged In', '2025-11-10 21:39:18'),
(118, 35, 'Logged In', '2025-11-10 21:57:05'),
(119, 1, 'Logged In', '2025-11-10 23:30:19'),
(120, 1, 'Logged Out', '2025-11-10 23:30:21'),
(121, 35, 'Logged In', '2025-11-10 23:30:26'),
(122, 35, 'Logged Out', '2025-11-10 23:31:16'),
(123, 1, 'Logged In', '2025-11-10 23:31:20'),
(124, 1, 'Logged Out', '2025-11-10 23:32:08'),
(125, 35, 'Logged In', '2025-11-10 23:32:16'),
(126, 35, 'Logged Out', '2025-11-10 23:35:11'),
(127, 1, 'Logged In', '2025-11-10 23:35:15'),
(128, 1, 'Logged Out', '2025-11-10 23:35:32'),
(129, 35, 'Logged In', '2025-11-10 23:35:37'),
(130, 35, 'Logged Out', '2025-11-10 23:49:04'),
(131, 1, 'Logged In', '2025-11-10 23:49:17'),
(132, 1, 'Logged Out', '2025-11-11 00:00:25'),
(133, 35, 'Logged In', '2025-11-11 00:00:29'),
(134, 39, 'Logged In', '2025-11-11 00:21:09'),
(135, 35, 'Logged Out', '2025-11-11 00:28:25'),
(136, 35, 'Logged In', '2025-11-11 00:28:35'),
(137, 35, 'Logged Out', '2025-11-11 00:29:06'),
(138, 1, 'Logged In', '2025-11-11 00:29:12'),
(139, 1, 'Logged Out', '2025-11-11 00:30:03'),
(140, 35, 'Logged In', '2025-11-11 00:30:09'),
(141, 39, 'Logged Out', '2025-11-11 00:35:43'),
(142, 39, 'Logged In', '2025-11-11 00:35:48'),
(143, 39, 'Logged Out', '2025-11-11 00:37:29'),
(144, 39, 'Logged In', '2025-11-11 00:37:35'),
(145, 35, 'Logged Out', '2025-11-11 01:04:44'),
(146, 1, 'Logged In', '2025-11-11 01:05:19'),
(147, 1, 'Logged Out', '2025-11-11 01:12:08'),
(148, 39, 'Logged In', '2025-11-11 01:12:15'),
(149, 39, 'Logged Out', '2025-11-11 01:12:21'),
(150, 35, 'Logged In', '2025-11-11 01:12:25'),
(151, 39, 'Logged Out', '2025-11-11 01:17:08'),
(152, 1, 'Logged In', '2025-11-11 01:17:12'),
(153, 1, 'Logged Out', '2025-11-11 01:42:55'),
(154, 1, 'Logged In', '2025-11-11 01:42:58'),
(155, 1, 'Logged Out', '2025-11-11 01:43:00'),
(156, 1, 'Logged In', '2025-11-11 01:43:10'),
(157, 1, 'Logged Out', '2025-11-11 01:43:11'),
(158, 1, 'Logged In', '2025-11-11 02:13:43'),
(159, 1, 'Logged Out', '2025-11-11 02:43:09'),
(160, 35, 'Logged In', '2025-11-11 02:43:19'),
(161, 35, 'Logged Out', '2025-11-11 02:57:05'),
(162, 1, 'Logged In', '2025-11-11 02:57:09');

-- --------------------------------------------------------

--
-- Table structure for table `vehiclecategory`
--

CREATE TABLE `vehiclecategory` (
  `VehicleCategoryID` int(11) NOT NULL,
  `VehicleTypeID` int(11) NOT NULL,
  `CategoryName` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehiclecategory`
--

INSERT INTO `vehiclecategory` (`VehicleCategoryID`, `VehicleTypeID`, `CategoryName`) VALUES
(7, 2, 'Sedan'),
(8, 2, 'SUV'),
(9, 2, 'Pickup'),
(10, 2, 'Van'),
(11, 1, 'Motorcycle'),
(12, 2, 'Truck');

-- --------------------------------------------------------

--
-- Table structure for table `vehicletype`
--

CREATE TABLE `vehicletype` (
  `VehicleTypeID` int(11) NOT NULL,
  `TypeName` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicletype`
--

INSERT INTO `vehicletype` (`VehicleTypeID`, `TypeName`) VALUES
(1, '2 Wheeled'),
(2, '4 Wheeled');

-- --------------------------------------------------------

--
-- Table structure for table `workorder`
--

CREATE TABLE `workorder` (
  `WorkOrderID` int(11) NOT NULL,
  `UnitID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `WorkOrderType` varchar(255) NOT NULL,
  `Status` varchar(255) NOT NULL,
  `TimeDateAssigned` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `TimeDateCompleted` timestamp NULL DEFAULT NULL,
  `MaintenanceRemark` varchar(255) DEFAULT NULL,
  `UpdateStatusToken` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `selector` (`selector`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_auth_tokens_selector` (`selector`),
  ADD KEY `idx_auth_tokens_expires` (`expires`);

--
-- Indexes for table `cleaninglog`
--
ALTER TABLE `cleaninglog`
  ADD PRIMARY KEY (`CleaningLogID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `CleaningID` (`CleaningID`);

--
-- Indexes for table `cleaningtask`
--
ALTER TABLE `cleaningtask`
  ADD PRIMARY KEY (`CleaningID`),
  ADD KEY `RoomID` (`RoomID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `hvacmaintenance`
--
ALTER TABLE `hvacmaintenance`
  ADD PRIMARY KEY (`UnitID`),
  ADD UNIQUE KEY `RoomID` (`RoomID`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`ItemID`),
  ADD KEY `ItemCategoryID` (`ItemCategoryID`);

--
-- Indexes for table `inventorylog`
--
ALTER TABLE `inventorylog`
  ADD PRIMARY KEY (`InvLogID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `ItemID` (`ItemID`);

--
-- Indexes for table `itemcategory`
--
ALTER TABLE `itemcategory`
  ADD PRIMARY KEY (`ItemCategoryID`);

--
-- Indexes for table `maintenancelog`
--
ALTER TABLE `maintenancelog`
  ADD PRIMARY KEY (`MaintenanceLogID`),
  ADD KEY `WorkOrderID` (`WorkOrderID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  ADD PRIMARY KEY (`RequestID`),
  ADD KEY `FK_MaintRequest_Room` (`RoomID`),
  ADD KEY `FK_MaintRequest_User` (`UserID`),
  ADD KEY `FK_MaintRequest_AssignedUser` (`AssignedUserID`);

--
-- Indexes for table `parkingarea`
--
ALTER TABLE `parkingarea`
  ADD PRIMARY KEY (`AreaID`);

--
-- Indexes for table `parkingslot`
--
ALTER TABLE `parkingslot`
  ADD PRIMARY KEY (`SlotID`),
  ADD UNIQUE KEY `UK_Area_SlotName` (`AreaID`,`SlotName`),
  ADD KEY `FK_Slot_Area` (`AreaID`),
  ADD KEY `FK_Slot_VehicleType` (`AllowedVehicleTypeID`);

--
-- Indexes for table `parking_sessions`
--
ALTER TABLE `parking_sessions`
  ADD PRIMARY KEY (`SessionID`),
  ADD KEY `FK_Session_Slot` (`SlotID`),
  ADD KEY `FK_Session_VehicleType` (`VehicleTypeID`),
  ADD KEY `FK_Session_VehicleCategory` (`VehicleCategoryID`),
  ADD KEY `FK_Session_Staff` (`StaffID_Entry`),
  ADD KEY `idx_plate_number` (`PlateNumber`);

--
-- Indexes for table `rate`
--
ALTER TABLE `rate`
  ADD PRIMARY KEY (`RateID`),
  ADD UNIQUE KEY `idx_rate_unique` (`AreaID`,`VehicleCategoryID`,`VehicleTypeID`),
  ADD KEY `VehicleCategoryID` (`VehicleCategoryID`),
  ADD KEY `VehicletypeID` (`VehicleTypeID`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`RoomID`),
  ADD UNIQUE KEY `RoomNumber` (`RoomNumber`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `room_appliances`
--
ALTER TABLE `room_appliances`
  ADD PRIMARY KEY (`ApplianceID`),
  ADD UNIQUE KEY `UK_ModelNumber` (`ModelNumber`),
  ADD KEY `FK_Appliance_Room` (`RoomID`);

--
-- Indexes for table `room_status`
--
ALTER TABLE `room_status`
  ADD PRIMARY KEY (`StatusID`),
  ADD UNIQUE KEY `RoomNumber` (`RoomNumber`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Username` (`Username`),
  ADD UNIQUE KEY `EmployeeID` (`EmployeeID`),
  ADD UNIQUE KEY `idx_activation_token` (`ActivationToken`),
  ADD KEY `idx_employee_id` (`EmployeeID`);

--
-- Indexes for table `user_logs`
--
ALTER TABLE `user_logs`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `idx_userid` (`UserID`),
  ADD KEY `idx_actiontype` (`ActionType`),
  ADD KEY `idx_timestamp` (`Timestamp`);

--
-- Indexes for table `vehiclecategory`
--
ALTER TABLE `vehiclecategory`
  ADD PRIMARY KEY (`VehicleCategoryID`),
  ADD KEY `FK_Category_VehicleType` (`VehicleTypeID`);

--
-- Indexes for table `vehicletype`
--
ALTER TABLE `vehicletype`
  ADD PRIMARY KEY (`VehicleTypeID`);

--
-- Indexes for table `workorder`
--
ALTER TABLE `workorder`
  ADD PRIMARY KEY (`WorkOrderID`),
  ADD KEY `UnitID` (`UnitID`),
  ADD KEY `UserID` (`UserID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `cleaninglog`
--
ALTER TABLE `cleaninglog`
  MODIFY `CleaningLogID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cleaningtask`
--
ALTER TABLE `cleaningtask`
  MODIFY `CleaningID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hvacmaintenance`
--
ALTER TABLE `hvacmaintenance`
  MODIFY `UnitID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `ItemID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `inventorylog`
--
ALTER TABLE `inventorylog`
  MODIFY `InvLogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT for table `itemcategory`
--
ALTER TABLE `itemcategory`
  MODIFY `ItemCategoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `maintenancelog`
--
ALTER TABLE `maintenancelog`
  MODIFY `MaintenanceLogID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  MODIFY `RequestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `parkingarea`
--
ALTER TABLE `parkingarea`
  MODIFY `AreaID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `parkingslot`
--
ALTER TABLE `parkingslot`
  MODIFY `SlotID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `parking_sessions`
--
ALTER TABLE `parking_sessions`
  MODIFY `SessionID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `rate`
--
ALTER TABLE `rate`
  MODIFY `RateID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `RoomID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room_appliances`
--
ALTER TABLE `room_appliances`
  MODIFY `ApplianceID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `room_status`
--
ALTER TABLE `room_status`
  MODIFY `StatusID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `user_logs`
--
ALTER TABLE `user_logs`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=163;

--
-- AUTO_INCREMENT for table `vehiclecategory`
--
ALTER TABLE `vehiclecategory`
  MODIFY `VehicleCategoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `vehicletype`
--
ALTER TABLE `vehicletype`
  MODIFY `VehicleTypeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `workorder`
--
ALTER TABLE `workorder`
  MODIFY `WorkOrderID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD CONSTRAINT `auth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `cleaninglog`
--
ALTER TABLE `cleaninglog`
  ADD CONSTRAINT `cleaninglog_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `cleaninglog_ibfk_2` FOREIGN KEY (`CleaningID`) REFERENCES `cleaningtask` (`CleaningID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `cleaningtask`
--
ALTER TABLE `cleaningtask`
  ADD CONSTRAINT `cleaningtask_ibfk_1` FOREIGN KEY (`RoomID`) REFERENCES `room` (`RoomID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cleaningtask_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE;

--
-- Constraints for table `hvacmaintenance`
--
ALTER TABLE `hvacmaintenance`
  ADD CONSTRAINT `hvacmaintenance_ibfk_1` FOREIGN KEY (`RoomID`) REFERENCES `room` (`RoomID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`ItemCategoryID`) REFERENCES `itemcategory` (`ItemCategoryID`) ON UPDATE CASCADE;

--
-- Constraints for table `inventorylog`
--
ALTER TABLE `inventorylog`
  ADD CONSTRAINT `inventorylog_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `inventorylog_ibfk_2` FOREIGN KEY (`ItemID`) REFERENCES `inventory` (`ItemID`) ON UPDATE CASCADE;

--
-- Constraints for table `maintenancelog`
--
ALTER TABLE `maintenancelog`
  ADD CONSTRAINT `maintenancelog_ibfk_1` FOREIGN KEY (`WorkOrderID`) REFERENCES `workorder` (`WorkOrderID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `maintenancelog_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE;

--
-- Constraints for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  ADD CONSTRAINT `FK_MaintRequest_AssignedUser` FOREIGN KEY (`AssignedUserID`) REFERENCES `users` (`UserID`),
  ADD CONSTRAINT `FK_MaintRequest_Room_crm` FOREIGN KEY (`RoomID`) REFERENCES `crm`.`rooms` (`RoomID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_MaintRequest_User` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `parkingslot`
--
ALTER TABLE `parkingslot`
  ADD CONSTRAINT `FK_Slot_Area` FOREIGN KEY (`AreaID`) REFERENCES `parkingarea` (`AreaID`),
  ADD CONSTRAINT `FK_Slot_VehicleType` FOREIGN KEY (`AllowedVehicleTypeID`) REFERENCES `vehicletype` (`VehicleTypeID`);

--
-- Constraints for table `parking_sessions`
--
ALTER TABLE `parking_sessions`
  ADD CONSTRAINT `FK_Session_Slot` FOREIGN KEY (`SlotID`) REFERENCES `parkingslot` (`SlotID`),
  ADD CONSTRAINT `FK_Session_Staff` FOREIGN KEY (`StaffID_Entry`) REFERENCES `users` (`UserID`),
  ADD CONSTRAINT `FK_Session_VehicleCategory` FOREIGN KEY (`VehicleCategoryID`) REFERENCES `vehiclecategory` (`VehicleCategoryID`),
  ADD CONSTRAINT `FK_Session_VehicleType` FOREIGN KEY (`VehicleTypeID`) REFERENCES `vehicletype` (`VehicleTypeID`);

--
-- Constraints for table `rate`
--
ALTER TABLE `rate`
  ADD CONSTRAINT `FK_Rate_Area` FOREIGN KEY (`AreaID`) REFERENCES `parkingarea` (`AreaID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_Rate_VehicleType` FOREIGN KEY (`VehicleTypeID`) REFERENCES `vehicletype` (`VehicleTypeID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `rate_ibfk_2` FOREIGN KEY (`VehicleCategoryID`) REFERENCES `vehiclecategory` (`VehicleCategoryID`) ON UPDATE CASCADE;

--
-- Constraints for table `room`
--
ALTER TABLE `room`
  ADD CONSTRAINT `room_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE;

--
-- Constraints for table `room_appliances`
--
ALTER TABLE `room_appliances`
  ADD CONSTRAINT `FK_Appliance_Room_crm` FOREIGN KEY (`RoomID`) REFERENCES `crm`.`rooms` (`RoomID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `room_status`
--
ALTER TABLE `room_status`
  ADD CONSTRAINT `room_status_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL;

--
-- Constraints for table `user_logs`
--
ALTER TABLE `user_logs`
  ADD CONSTRAINT `fk_userlogs_userid` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `vehiclecategory`
--
ALTER TABLE `vehiclecategory`
  ADD CONSTRAINT `FK_Category_VehicleType` FOREIGN KEY (`VehicleTypeID`) REFERENCES `vehicletype` (`VehicleTypeID`);

--
-- Constraints for table `workorder`
--
ALTER TABLE `workorder`
  ADD CONSTRAINT `workorder_ibfk_1` FOREIGN KEY (`UnitID`) REFERENCES `hvacmaintenance` (`UnitID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `workorder_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
