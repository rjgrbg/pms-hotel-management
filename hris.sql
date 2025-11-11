-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2025 at 04:05 AM
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
-- Database: `hris`
--

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `EmployeeID` varchar(50) NOT NULL,
  `Fname` varchar(255) NOT NULL,
  `Lname` varchar(255) NOT NULL,
  `Mname` varchar(255) DEFAULT NULL,
  `Birthday` date NOT NULL,
  `EmailAddress` varchar(255) NOT NULL,
  `Address` varchar(255) NOT NULL,
  `ContactNumber` varchar(50) DEFAULT NULL,
  `Position` varchar(100) DEFAULT 'Staff',
  `DateHired` date DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`EmployeeID`, `Fname`, `Lname`, `Mname`, `Birthday`, `EmailAddress`, `Address`, `ContactNumber`, `Position`, `DateHired`) VALUES
('1004', 'Alice', 'Smith', 'A', '1990-01-01', 'farmerday26@gmail.com', '101 Admin Ave, Manila', '09170001004', 'Housekeeping Manager', '2023-01-10'),
('1005', 'Robert', 'Johnson', 'B', '1985-03-15', 'robert.johnson@example.com', '202 Housekeeping Rd, Quezon City', '09180001005', 'Housekeeping Manager', '2023-02-11'),
('1006', 'Maria', 'Garcia', 'C', '1999-07-30', 'maria.garcia@example.com', '303 Clean St, Pasig', '09190001006', 'Housekeeper', '2023-03-12'),
('1007', 'David', 'Lee', 'D', '1988-12-05', 'david.lee@example.com', '404 Maintenance Blvd, Caloocan', '09200001007', 'Senior Maintenance', '2023-04-13'),
('1008', 'Emily', 'Chen', 'E', '2001-06-20', 'farmersday96@gmail.com', '505 Repair Ln, Makati', '09210001008', 'Maintenance', '2023-05-14'),
('1009', 'Michael', 'Brown', 'F', '1992-09-18', 'michael.brown@example.com', '606 Parking Way, Taguig', '09220001009', 'Parking Attendant', '2023-06-15'),
('1010', 'Testting', 'Admin', 'X', '1990-01-01', 'dayvoice993@gmail.com', '123 Admin Street, Manila', '09000001010', 'Admin', '2025-11-05');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`EmployeeID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
