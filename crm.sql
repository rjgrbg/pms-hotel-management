-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2025 at 10:14 PM
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
-- Database: `crm`
--

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `RoomID` int(11) NOT NULL,
  `RoomNumber` varchar(20) NOT NULL,
  `FloorNumber` int(11) NOT NULL,
  `RoomType` varchar(100) NOT NULL,
  `GuestCapacity` varchar(50) NOT NULL,
  `Rate` decimal(10,2) NOT NULL,
  `DateAdded` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`RoomID`, `RoomNumber`, `FloorNumber`, `RoomType`, `GuestCapacity`, `Rate`, `DateAdded`) VALUES
(1, '101', 1, 'Standard Room', '1–2 guests', 120.00, '2025-11-07 03:11:50'),
(2, '102', 1, 'Standard Room', '1–2 guests', 120.00, '2025-11-07 03:11:50'),
(3, '103', 1, 'Deluxe Room', '2–3 guests', 150.00, '2025-11-07 03:11:50'),
(4, '201', 2, 'Deluxe Room', '2–3 guests', 150.00, '2025-11-07 03:11:50'),
(5, '202', 2, 'Suite', '2–4 guests', 210.00, '2025-11-07 03:11:50'),
(6, '301', 3, 'Suite', '2–4 guests', 210.00, '2025-11-07 03:11:50'),
(7, '302', 3, 'Penthouse Suite', '4–6 guests', 350.00, '2025-11-07 03:11:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`RoomID`),
  ADD UNIQUE KEY `RoomNumber` (`RoomNumber`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `RoomID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
