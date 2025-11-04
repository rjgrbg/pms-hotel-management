-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 26, 2025 at 03:53 PM
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
  `DamageItem` varchar(255) NOT NULL,
  `DateofStockIn` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `DateofStockOut` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `itemcategory`
--

CREATE TABLE `itemcategory` (
  `ItemCategoryID` int(11) NOT NULL,
  `ItemCategoryName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Table structure for table `parkingarea`
--

CREATE TABLE `parkingarea` (
  `ParkingAreaID` int(11) NOT NULL,
  `AreaName` varchar(255) NOT NULL,
  `TotalSlot` int(11) NOT NULL,
  `ReserveSlot` int(11) NOT NULL,
  `AvailableSlot` int(11) NOT NULL,
  `VehicleTypeID` int(11) NOT NULL,
  `CreateAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parkingslot`
--

CREATE TABLE `parkingslot` (
  `SlotID` int(11) NOT NULL,
  `ParkingAreasID` int(11) NOT NULL,
  `SlotName` varchar(50) NOT NULL,
  `IsReserved` tinyint(1) NOT NULL,
  `VehicleTypeID` int(11) NOT NULL,
  `CountofVehicle` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rate`
--

CREATE TABLE `rate` (
  `RateID` int(11) NOT NULL,
  `ParkingAreaID` int(11) NOT NULL,
  `VehicleCategoryID` int(11) NOT NULL,
  `VehicletypeID` int(11) NOT NULL,
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

--
-- Dumping data for table `room`
--

INSERT INTO `room` (`RoomID`, `UserID`, `RoomNumber`, `RoomType`, `GuestCapacity`, `Rate`, `RoomStatus`, `LastClean`, `LastMaintenance`, `FloorNumber`) VALUES
(2, 1, 202, 'Standard Room', '1–2 guests', 123.02, 'Needs Cleaning', NULL, NULL, 2),
(5, 1, 203, 'Deluxe Room', '2–3 guests', 120.00, 'Needs Cleaning', NULL, NULL, 2),
(6, 1, 402, 'Penthouse Suite', '4–6 guests', 230.00, 'available', NULL, NULL, 4),
(17, 1, 404, 'Deluxe Room', '2–3 guests', 66.00, 'maintenance', NULL, NULL, 4),
(19, 1, 223, 'Penthouse Suite', '4–6 guests', 2.00, 'available', NULL, NULL, 2),
(20, 1, 407, 'Standard Room', '1–2 guests', 2.00, 'occupied', NULL, NULL, 4),
(21, 1, 244, 'Deluxe Room', '2–3 guests', 2.00, 'maintenance', NULL, NULL, 2),
(24, 1, 501, 'Deluxe Room', '2–3 guests', 230.00, 'Reserved', NULL, NULL, 5);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `Fname` varchar(255) NOT NULL,
  `Lname` varchar(255) NOT NULL,
  `Mname` varchar(255) DEFAULT NULL,
  `Birthday` date NOT NULL,
  `AccountType` varchar(255) NOT NULL,
  `Username` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `EmailAddress` varchar(255) NOT NULL,
  `Shift` varchar(255) NOT NULL,
  `Address` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `Fname`, `Lname`, `Mname`, `Birthday`, `AccountType`, `Username`, `Password`, `EmailAddress`, `Shift`, `Address`) VALUES
(1, 'Wilms', 'Bags', 'Tite', '2005-09-08', 'admin', 'admin', '$2y$10$tFkFJ9ec3OrZTqAehu421OLSNA3cI8LM4FaX21ny3Q/5BoKBXfsu6', 'bagayan.johnwilmer.timaan@gmail.com', 'Night', 'asd'),
(6, 'asd', 'asd', 'qww', '2014-03-25', 'housekeeping_manager', 'housekeeping', '$2y$10$CJJ9MT3wuh.RB6gQWM5TN.CLt2sny7O1BeUmAf3yjZ11CD3S1f99K', 'dayvoice993@gmail.com', 'Morning', 'asdsd'),
(7, 'gg', 'gg', 'gg', '2016-04-25', 'maintenance_manager', 'maintenance', '$2y$10$Qr8n1qqwDN19Sy9qArIw1uaSljgUL5i.2FOt5JEjIBUsC9a7zEDWi', 'garabiag.arjay04@gmail.com', 'Afternoon', 'asd'),
(8, 'tt', 'tt', 'tt', '2019-03-25', 'parking_manager', 'parking', '$2y$10$QWZY.tx3h03AbVMnBeAUYusqSVa.UesM0g29tFn.qL/7M1ylZrgvO', 'farmersday96@gmail.com', 'Night', 'asd'),
(9, 'dd', 'dd', 'dd', '2020-03-25', 'housekeeping_staff', 'hstaff', '$2y$10$c1xhsoAmkquyE6hvTZvIMOzaxpDj5aLTcXKKNcsqvj/fo2OVUKaW6', 'da@gmail.com', 'Morning', 'asd'),
(10, 'asd', 'asd', 'asd', '2023-03-25', 'maintenance_staff', 'mstaff', '$2y$10$TDu.Jb0HEajidUsDTbuOvutInRB163Xb64A2xHkcG3SUNm7eWgoVS', 'sda@gmail.com', 'Afternoon', 'asd'),
(11, 'haha', 'hehe', 'huhu', '2025-10-11', 'admin', 'admin12', '$2y$10$a0R7zDlByaTpOw/EzYnHpOGUH3wisHehr.iwuWFQeqcYHd9hLZnni', 'johnwilmerbagayan@gmail.com', 'Morning', 'qwdefrsdtty6u7i'),
(12, 'gege', 'gaga', 'gogo', '2025-10-11', 'inventory_manager', 'admin123', '$2y$10$a0R7zDlByaTpOw/EzYnHpOGUH3wisHehr.iwuWFQeqcYHd9hLZnni', 'johnwilmerbagayan@gmail.com', 'Morning', 'qwdefrsdtty6u7i');

-- --------------------------------------------------------

--
-- Table structure for table `vehiclecategory`
--

CREATE TABLE `vehiclecategory` (
  `VehicleCategoryID` int(11) NOT NULL,
  `CategoryName` varchar(255) NOT NULL,
  `VehicletypeID` int(11) NOT NULL,
  `CreateAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicledata`
--

CREATE TABLE `vehicledata` (
  `VehicleID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `VehicleNumber` varchar(50) NOT NULL,
  `VehicleTypeID` int(11) NOT NULL,
  `ParkingAreaID` int(11) NOT NULL,
  `EntryTime` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ExitTime` timestamp NULL DEFAULT NULL,
  `FarePaid` decimal(15,2) NOT NULL,
  `VehicleStatus` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehiclereservation`
--

CREATE TABLE `vehiclereservation` (
  `VehicleResevationID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `VehicleID` int(11) NOT NULL,
  `ParkingAreaID` int(11) NOT NULL,
  `SlotNumber` varchar(50) DEFAULT NULL,
  `StartTime` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `EndTime` timestamp NULL DEFAULT NULL,
  `Status` varchar(50) NOT NULL,
  `VehicleStatus` varchar(50) NOT NULL,
  `CreateAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicletype`
--

CREATE TABLE `vehicletype` (
  `VehicletypeID` int(11) NOT NULL,
  `TypeName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Indexes for table `parkingarea`
--
ALTER TABLE `parkingarea`
  ADD PRIMARY KEY (`ParkingAreaID`),
  ADD UNIQUE KEY `VehicleTypeID` (`VehicleTypeID`);

--
-- Indexes for table `parkingslot`
--
ALTER TABLE `parkingslot`
  ADD PRIMARY KEY (`SlotID`),
  ADD KEY `ParkingAreasID` (`ParkingAreasID`),
  ADD KEY `VehicleTypeID` (`VehicleTypeID`);

--
-- Indexes for table `rate`
--
ALTER TABLE `rate`
  ADD PRIMARY KEY (`RateID`),
  ADD UNIQUE KEY `idx_rate_unique` (`ParkingAreaID`,`VehicleCategoryID`,`VehicletypeID`),
  ADD KEY `VehicleCategoryID` (`VehicleCategoryID`),
  ADD KEY `VehicletypeID` (`VehicletypeID`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`RoomID`),
  ADD UNIQUE KEY `RoomNumber` (`RoomNumber`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Username` (`Username`);

--
-- Indexes for table `vehiclecategory`
--
ALTER TABLE `vehiclecategory`
  ADD PRIMARY KEY (`VehicleCategoryID`),
  ADD UNIQUE KEY `VehicletypeID` (`VehicletypeID`);

--
-- Indexes for table `vehicledata`
--
ALTER TABLE `vehicledata`
  ADD PRIMARY KEY (`VehicleID`),
  ADD UNIQUE KEY `userID` (`userID`),
  ADD UNIQUE KEY `VehicleNumber` (`VehicleNumber`),
  ADD KEY `ParkingAreaID` (`ParkingAreaID`),
  ADD KEY `VehicleTypeID` (`VehicleTypeID`);

--
-- Indexes for table `vehiclereservation`
--
ALTER TABLE `vehiclereservation`
  ADD PRIMARY KEY (`VehicleResevationID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `VehicleID` (`VehicleID`),
  ADD KEY `ParkingAreaID` (`ParkingAreaID`);

--
-- Indexes for table `vehicletype`
--
ALTER TABLE `vehicletype`
  ADD PRIMARY KEY (`VehicletypeID`);

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
  MODIFY `ItemID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventorylog`
--
ALTER TABLE `inventorylog`
  MODIFY `InvLogID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `itemcategory`
--
ALTER TABLE `itemcategory`
  MODIFY `ItemCategoryID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenancelog`
--
ALTER TABLE `maintenancelog`
  MODIFY `MaintenanceLogID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parkingarea`
--
ALTER TABLE `parkingarea`
  MODIFY `ParkingAreaID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parkingslot`
--
ALTER TABLE `parkingslot`
  MODIFY `SlotID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rate`
--
ALTER TABLE `rate`
  MODIFY `RateID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `RoomID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `vehiclecategory`
--
ALTER TABLE `vehiclecategory`
  MODIFY `VehicleCategoryID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicledata`
--
ALTER TABLE `vehicledata`
  MODIFY `VehicleID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehiclereservation`
--
ALTER TABLE `vehiclereservation`
  MODIFY `VehicleResevationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicletype`
--
ALTER TABLE `vehicletype`
  MODIFY `VehicletypeID` int(11) NOT NULL AUTO_INCREMENT;

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
-- Constraints for table `parkingarea`
--
ALTER TABLE `parkingarea`
  ADD CONSTRAINT `parkingarea_ibfk_1` FOREIGN KEY (`VehicleTypeID`) REFERENCES `vehicletype` (`VehicletypeID`) ON UPDATE CASCADE;

--
-- Constraints for table `parkingslot`
--
ALTER TABLE `parkingslot`
  ADD CONSTRAINT `parkingslot_ibfk_1` FOREIGN KEY (`ParkingAreasID`) REFERENCES `parkingarea` (`ParkingAreaID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `parkingslot_ibfk_2` FOREIGN KEY (`VehicleTypeID`) REFERENCES `vehicletype` (`VehicletypeID`) ON UPDATE CASCADE;

--
-- Constraints for table `rate`
--
ALTER TABLE `rate`
  ADD CONSTRAINT `rate_ibfk_1` FOREIGN KEY (`ParkingAreaID`) REFERENCES `parkingarea` (`ParkingAreaID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `rate_ibfk_2` FOREIGN KEY (`VehicleCategoryID`) REFERENCES `vehiclecategory` (`VehicleCategoryID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `rate_ibfk_3` FOREIGN KEY (`VehicletypeID`) REFERENCES `vehicletype` (`VehicletypeID`) ON UPDATE CASCADE;

--
-- Constraints for table `room`
--
ALTER TABLE `room`
  ADD CONSTRAINT `room_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE;

--
-- Constraints for table `vehiclecategory`
--
ALTER TABLE `vehiclecategory`
  ADD CONSTRAINT `vehiclecategory_ibfk_1` FOREIGN KEY (`VehicletypeID`) REFERENCES `vehicletype` (`VehicletypeID`) ON UPDATE CASCADE;

--
-- Constraints for table `vehicledata`
--
ALTER TABLE `vehicledata`
  ADD CONSTRAINT `vehicledata_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicledata_ibfk_2` FOREIGN KEY (`ParkingAreaID`) REFERENCES `parkingarea` (`ParkingAreaID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicledata_ibfk_3` FOREIGN KEY (`VehicleTypeID`) REFERENCES `vehicletype` (`VehicletypeID`) ON UPDATE CASCADE;

--
-- Constraints for table `vehiclereservation`
--
ALTER TABLE `vehiclereservation`
  ADD CONSTRAINT `vehiclereservation_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `vehiclereservation_ibfk_2` FOREIGN KEY (`VehicleID`) REFERENCES `vehicledata` (`VehicleID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `vehiclereservation_ibfk_3` FOREIGN KEY (`ParkingAreaID`) REFERENCES `parkingarea` (`ParkingAreaID`) ON UPDATE CASCADE;

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
