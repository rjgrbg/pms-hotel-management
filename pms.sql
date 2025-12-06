-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 14, 2025 at 11:14 AM
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
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(255) DEFAULT NULL,
  `module` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`log_id`, `user_id`, `action`, `module`, `description`, `created_at`, `created_by`) VALUES
(1, 1, 'CREATE', 'employees', 'Created employee record EMP-0013', '2024-09-01 10:00:00', 1),
(2, 2, 'UPDATE', 'employees', 'Updated employee record EMP-0008', '2024-09-15 11:30:00', 2),
(3, 3, 'CREATE', 'tickets', 'Created ticket TIC-0001', '2024-10-01 08:35:00', 3),
(4, 3, 'UPDATE', 'tickets', 'Resolved ticket TIC-0001', '2024-10-01 14:00:00', 3),
(5, 5, 'APPROVE', 'leaves', 'Approved leave request LEV-0001', '2024-09-29 09:00:00', 5),
(6, 6, 'APPROVE', 'leaves', 'Approved leave request LEV-0004', '2024-10-21 10:00:00', 6),
(7, 7, 'REJECT', 'leaves', 'Rejected leave request LEV-0008', '2024-10-30 14:00:00', 7),
(8, 1, 'CREATE', 'attendance', 'Clock in recorded for employee ID 1 (ATT-0001)', '2024-10-01 08:00:00', 1),
(9, 2, 'UPDATE', 'positions', 'Updated position POS-0002 salary', '2024-09-20 13:00:00', 2),
(10, 3, 'CREATE', 'departments', 'Created new department', '2024-08-15 09:00:00', 1),
(11, 8, 'CREATE', 'tickets', 'Created ticket TIC-0001', '2024-10-01 08:30:00', 8),
(12, 10, 'UPDATE', 'attendance', 'Clock out recorded for employee ID 10 (ATT-0010)', '2024-10-01 21:00:00', 10),
(13, 12, 'CREATE', 'leaves', 'Created leave request LEV-0002', '2024-10-07 18:30:00', 12),
(14, 1, 'LOGIN', 'auth', 'User logged in successfully', '2024-10-09 07:55:00', 1),
(15, 2, 'LOGIN', 'auth', 'User logged in successfully', '2024-10-09 08:00:00', 2);

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `attendance_code` varchar(10) DEFAULT NULL,
  `employee_id` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `time_in` datetime DEFAULT NULL,
  `time_out` datetime DEFAULT NULL,
  `status` enum('present','absent','late','on_leave') DEFAULT 'present',
  `overtime_hours` decimal(5,2) DEFAULT 0.00,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `attendance_code`, `employee_id`, `date`, `time_in`, `time_out`, `status`, `overtime_hours`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 'ATT-0001', 1, '2024-10-01', '2024-10-01 08:00:00', '2024-10-01 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(2, 'ATT-0002', 2, '2024-10-01', '2024-10-01 08:15:00', '2024-10-01 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(3, 'ATT-0003', 3, '2024-10-01', '2024-10-01 08:00:00', '2024-10-01 19:30:00', 'present', 2.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(4, 'ATT-0004', 4, '2024-10-01', '2024-10-01 08:00:00', '2024-10-01 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(5, 'ATT-0005', 5, '2024-10-01', '2024-10-01 08:30:00', '2024-10-01 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(6, 'ATT-0006', 6, '2024-10-01', '2024-10-01 08:00:00', '2024-10-01 20:00:00', 'present', 3.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(7, 'ATT-0007', 7, '2024-10-01', '2024-10-01 08:00:00', '2024-10-01 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(8, 'ATT-0008', 8, '2024-10-01', '2024-10-01 08:00:00', '2024-10-01 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(9, 'ATT-0009', 9, '2024-10-01', '2024-10-01 08:00:00', '2024-10-01 18:30:00', 'present', 1.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(10, 'ATT-0010', 10, '2024-10-01', '2024-10-01 08:00:00', '2024-10-01 21:00:00', 'present', 4.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(11, 'ATT-0011', 11, '2024-10-01', '2024-10-01 20:00:00', '2024-10-02 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(12, 'ATT-0012', 12, '2024-10-01', '2024-10-01 08:00:00', '2024-10-01 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(13, 'ATT-0013', 13, '2024-10-01', '2024-10-01 20:00:00', '2024-10-02 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(14, 'ATT-0014', 1, '2024-10-02', '2024-10-02 08:00:00', '2024-10-02 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(15, 'ATT-0015', 2, '2024-10-02', '2024-10-02 08:00:00', '2024-10-02 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(16, 'ATT-0016', 3, '2024-10-02', '2024-10-02 08:00:00', '2024-10-02 18:00:00', 'present', 1.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(17, 'ATT-0017', 4, '2024-10-02', '2024-10-02 08:20:00', '2024-10-02 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(18, 'ATT-0018', 5, '2024-10-02', '2024-10-02 08:00:00', '2024-10-02 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(19, 'ATT-0019', 6, '2024-10-02', '2024-10-02 08:00:00', '2024-10-02 19:00:00', 'present', 2.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(20, 'ATT-0020', 7, '2024-10-02', '2024-10-02 08:10:00', '2024-10-02 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(21, 'ATT-0021', 8, '2024-10-02', '2024-10-02 08:00:00', '2024-10-02 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(22, 'ATT-0022', 10, '2024-10-02', '2024-10-02 08:00:00', '2024-10-02 20:30:00', 'present', 3.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(23, 'ATT-0023', 11, '2024-10-02', '2024-10-02 20:00:00', '2024-10-03 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(24, 'ATT-0024', 12, '2024-10-02', '2024-10-02 08:00:00', '2024-10-02 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(25, 'ATT-0025', 13, '2024-10-02', '2024-10-02 20:00:00', '2024-10-03 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(26, 'ATT-0026', 1, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 19:00:00', 'present', 2.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(27, 'ATT-0027', 2, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(28, 'ATT-0028', 3, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 22:00:00', 'present', 5.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(29, 'ATT-0029', 4, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(30, 'ATT-0030', 5, '2024-10-03', '2024-10-03 08:25:00', '2024-10-03 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(31, 'ATT-0031', 6, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 18:30:00', 'present', 1.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(32, 'ATT-0032', 7, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(33, 'ATT-0033', 8, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(34, 'ATT-0034', 9, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(35, 'ATT-0035', 10, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 19:30:00', 'present', 2.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(36, 'ATT-0036', 11, '2024-10-03', '2024-10-03 20:00:00', '2024-10-04 05:00:00', 'present', 1.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(37, 'ATT-0037', 12, '2024-10-03', '2024-10-03 08:00:00', '2024-10-03 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(38, 'ATT-0038', 13, '2024-10-03', '2024-10-03 20:00:00', '2024-10-04 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(39, 'ATT-0039', 1, '2024-10-04', '2024-10-04 08:00:00', '2024-10-04 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(40, 'ATT-0040', 2, '2024-10-04', '2024-10-04 08:00:00', '2024-10-04 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(41, 'ATT-0041', 3, '2024-10-04', '2024-10-04 08:00:00', '2024-10-04 20:00:00', 'present', 3.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(42, 'ATT-0042', 4, '2024-10-04', '2024-10-04 08:00:00', '2024-10-04 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(43, 'ATT-0043', 5, '2024-10-04', '2024-10-04 08:00:00', '2024-10-04 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(44, 'ATT-0044', 6, '2024-10-04', '2024-10-04 08:00:00', '2024-10-04 19:30:00', 'present', 2.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(45, 'ATT-0045', 7, '2024-10-04', '2024-10-04 08:00:00', '2024-10-04 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(46, 'ATT-0046', 8, '2024-10-04', '2024-10-04 08:35:00', '2024-10-04 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(47, 'ATT-0047', 9, '2024-10-04', NULL, NULL, 'on_leave', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(48, 'ATT-0048', 10, '2024-10-04', '2024-10-04 08:00:00', '2024-10-04 18:00:00', 'present', 1.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(49, 'ATT-0049', 11, '2024-10-04', '2024-10-04 20:00:00', '2024-10-05 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(50, 'ATT-0050', 12, '2024-10-04', '2024-10-04 08:00:00', '2024-10-04 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(51, 'ATT-0051', 13, '2024-10-04', '2024-10-04 20:00:00', '2024-10-05 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(52, 'ATT-0052', 1, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(53, 'ATT-0053', 2, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(54, 'ATT-0054', 3, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 21:00:00', 'present', 4.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(55, 'ATT-0055', 4, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(56, 'ATT-0056', 5, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(57, 'ATT-0057', 6, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 18:00:00', 'present', 1.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(58, 'ATT-0058', 7, '2024-10-07', '2024-10-07 08:20:00', '2024-10-07 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(59, 'ATT-0059', 8, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(60, 'ATT-0060', 9, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(61, 'ATT-0061', 10, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 22:00:00', 'present', 5.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(62, 'ATT-0062', 11, '2024-10-07', '2024-10-07 20:00:00', '2024-10-08 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(63, 'ATT-0063', 12, '2024-10-07', '2024-10-07 08:00:00', '2024-10-07 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(64, 'ATT-0064', 13, '2024-10-07', '2024-10-07 20:00:00', '2024-10-08 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(65, 'ATT-0065', 1, '2024-10-08', '2024-10-08 08:00:00', '2024-10-08 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(66, 'ATT-0066', 2, '2024-10-08', '2024-10-08 08:00:00', '2024-10-08 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(67, 'ATT-0067', 3, '2024-10-08', '2024-10-08 08:00:00', '2024-10-08 19:00:00', 'present', 2.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(68, 'ATT-0068', 4, '2024-10-08', '2024-10-08 08:15:00', '2024-10-08 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(69, 'ATT-0069', 5, '2024-10-08', '2024-10-08 08:00:00', '2024-10-08 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(70, 'ATT-0070', 6, '2024-10-08', '2024-10-08 08:00:00', '2024-10-08 20:00:00', 'present', 3.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(71, 'ATT-0071', 7, '2024-10-08', '2024-10-08 08:00:00', '2024-10-08 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(72, 'ATT-0072', 8, '2024-10-08', '2024-10-08 08:00:00', '2024-10-08 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(73, 'ATT-0073', 9, '2024-10-08', '2024-10-08 08:00:00', '2024-10-08 18:30:00', 'present', 1.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(74, 'ATT-0074', 10, '2024-10-08', '2024-10-08 08:00:00', '2024-10-08 19:00:00', 'present', 2.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(75, 'ATT-0075', 11, '2024-10-08', '2024-10-08 20:00:00', '2024-10-09 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(76, 'ATT-0076', 12, '2024-10-08', NULL, NULL, 'absent', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(77, 'ATT-0077', 13, '2024-10-08', '2024-10-08 20:00:00', '2024-10-09 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(78, 'ATT-0078', 1, '2024-10-09', '2024-10-09 08:00:00', '2024-10-09 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(79, 'ATT-0079', 2, '2024-10-09', '2024-10-09 08:30:00', '2024-10-09 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(80, 'ATT-0080', 3, '2024-10-09', '2024-10-09 08:00:00', '2024-10-09 18:30:00', 'present', 1.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(81, 'ATT-0081', 4, '2024-10-09', '2024-10-09 08:45:00', '2024-10-09 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(82, 'ATT-0082', 5, '2024-10-09', '2024-10-09 08:20:00', '2024-10-09 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(83, 'ATT-0083', 6, '2024-10-09', '2024-10-09 08:00:00', '2024-10-09 19:30:00', 'present', 2.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(84, 'ATT-0084', 7, '2024-10-09', '2024-10-09 08:15:00', '2024-10-09 17:00:00', 'late', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(85, 'ATT-0085', 8, '2024-10-09', '2024-10-09 08:00:00', '2024-10-09 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(86, 'ATT-0086', 9, '2024-10-09', '2024-10-09 08:00:00', '2024-10-09 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(87, 'ATT-0087', 10, '2024-10-09', '2024-10-09 08:00:00', '2024-10-09 21:30:00', 'present', 4.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(88, 'ATT-0088', 11, '2024-10-09', '2024-10-09 20:00:00', '2024-10-10 05:30:00', 'present', 1.50, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(89, 'ATT-0089', 12, '2024-10-09', '2024-10-09 08:00:00', '2024-10-09 17:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(90, 'ATT-0090', 13, '2024-10-09', '2024-10-09 20:00:00', '2024-10-10 04:00:00', 'present', 0.00, '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `department_code` varchar(10) DEFAULT NULL,
  `department_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `supervisor_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `department_code`, `department_name`, `description`, `supervisor_id`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 'DEP-0001', 'Human Resources', 'Handles employee records, recruitment, and payroll', 5, '2025-11-14 13:19:32', '2025-11-14 13:19:33', 1, NULL),
(2, 'DEP-0002', 'IT', 'Maintains company systems and databases', 6, '2025-11-14 13:19:32', '2025-11-14 13:19:33', 1, NULL),
(3, 'DEP-0003', 'Front Desk', 'Handles reception, visitor management, and front office operations', 7, '2025-11-14 13:19:32', '2025-11-14 13:19:33', 1, NULL),
(4, 'DEP-0004', 'Front of House (FOH)', 'Responsible for the customer-facing activities of a business, primarily in the hospitality industry, that directly interact with guests.', NULL, '2025-11-11 09:01:01', '2025-11-11 09:02:59', 1, 1),
(5, 'DEP-0005', 'Kitchen Operations', 'refer to the comprehensive management of a kitchen, which includes organizing staff, ensuring safety and sanitation, managing inventory, and streamlining workflow to improve efficiency and profitability.', NULL, '2025-11-11 09:05:11', '2025-11-11 09:05:35', 1, 1),
(6, 'DEP-0006', 'Hotel Service', ' primarily the Front Office or Guest Services department, which acts as the central point of contact for guests, handling check-in/check-out, reservations, and guest requests. It also includes specialized roles like concierges, who help with travel and local recommendations, and porters/bellhops, who assist with luggage and room escorts', NULL, '2025-11-11 09:07:41', '2025-11-11 09:07:41', 1, NULL),
(7, 'DEP-0007', 'Procurement and inventory department', 'Responsible for acquiring goods and services for a business and managing the stock levels of those items.', NULL, '2025-11-11 09:08:53', '2025-11-11 09:08:53', 1, NULL),
(8, 'DEP-0008', 'Finance & Control System', ' a core organizational function responsible for managing an entity\'s monetary resources, ensuring financial integrity, mitigating risks, and providing strategic financial insights to guide decision-making.', NULL, '2025-11-11 09:12:03', '2025-11-11 09:12:03', 1, NULL),
(9, 'DEP-0009', 'Hotel maintenance ', 's responsible for ensuring the property\'s physical assets including building systems, equipment, and grounds—are in good working order.', NULL, '2025-11-11 09:16:56', '2025-11-11 09:16:56', 1, NULL),
(10, 'DEP-0010', 'Parking Management', 'Managed by the front office (for valet services) and the security/maintenance department (for overall traffic, safety, and lot management).', NULL, '2025-11-11 09:20:39', '2025-11-11 09:20:39', 1, NULL),
(11, 'DEP-0011', 'House keeping', ' responsible for a hotel\'s cleanliness, maintenance, and aesthetic appeal, ensuring both guest rooms and public areas are clean, hygienic, and comfortable.', NULL, '2025-11-11 09:22:06', '2025-11-11 09:22:06', 1, NULL),
(12, 'DEP-0012', 'Accounting', 'Responsible for managing the hotel\'s financial operations, including preparing financial statements, managing budgets, and processing payroll.', NULL, '2025-11-11 11:15:43', '2025-11-11 11:15:43', 1, NULL),
(13, 'DEP-0013', 'Customer Service', NULL, NULL, '2025-11-11 14:52:46', '2025-11-14 07:02:17', 1, 3);

-- --------------------------------------------------------

--
-- Table structure for table `dependants`
--

CREATE TABLE `dependants` (
  `dependant_id` int(11) NOT NULL,
  `dependant_code` varchar(10) DEFAULT NULL,
  `employee_id` int(11) NOT NULL,
  `firstname` varchar(100) DEFAULT NULL,
  `lastname` varchar(100) DEFAULT NULL,
  `relationship` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ;

--
-- Dumping data for table `dependants`
--

INSERT INTO `dependants` (`dependant_id`, `dependant_code`, `employee_id`, `firstname`, `lastname`, `relationship`, `birth_date`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 'DEP-0001', 2, 'Miguel', 'Santos', 'Spouse', '1989-05-20', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(2, 'DEP-0002', 2, 'Sofia', 'Santos', 'Child', '2015-08-12', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(3, 'DEP-0003', 5, 'Carmen', 'Ramos', 'Spouse', '1990-02-14', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(4, 'DEP-0004', 5, 'Luis', 'Ramos', 'Child', '2018-06-22', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(5, 'DEP-0005', 6, 'Isabella', 'Mendoza', 'Spouse', '1988-11-30', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(6, 'DEP-0006', 6, 'Diego', 'Mendoza', 'Child', '2016-03-15', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(7, 'DEP-0007', 6, 'Elena', 'Mendoza', 'Child', '2019-09-08', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(8, 'DEP-0008', 1, 'Roberto', 'Admin', 'Parent', '1960-04-10', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(9, 'DEP-0009', 3, 'Teresa', 'Dela Cruz', 'Mother', '1965-07-25', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(10, 'DEP-0010', 10, 'Patricia', 'Lim', 'Spouse', '1994-01-18', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dependant_address`
--

CREATE TABLE `dependant_address` (
  `dependant_address_id` int(11) NOT NULL,
  `dependant_id` int(11) DEFAULT NULL,
  `region_name` varchar(100) DEFAULT NULL,
  `province_name` varchar(50) DEFAULT NULL,
  `city_name` varchar(50) DEFAULT NULL,
  `home_address` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dependant_address`
--

INSERT INTO `dependant_address` (`dependant_address_id`, `dependant_id`, `region_name`, `province_name`, `city_name`, `home_address`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 1, 'NCR', 'Metro Manila', 'Makati City', '456 HR Ave, Brgy. Poblacion', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(2, 3, 'NCR', 'Metro Manila', 'Quezon City', '654 Supervisor Ln, Brgy. Diliman', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(3, 5, 'NCR', 'Metro Manila', 'Makati City', '789 IT Supervisor St, Brgy. Salcedo', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(4, 8, 'NCR', 'Metro Manila', 'Quezon City', '123 Admin St, Brgy. Central', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(5, 10, 'NCR', 'Metro Manila', 'Makati City', '741 Dev Center, Brgy. Bel-Air', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dependant_contact`
--

CREATE TABLE `dependant_contact` (
  `dependant_contact_id` int(11) NOT NULL,
  `dependant_id` int(11) DEFAULT NULL,
  `contact_no` varchar(25) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dependant_contact`
--

INSERT INTO `dependant_contact` (`dependant_contact_id`, `dependant_id`, `contact_no`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 1, '+63 917 555 1234', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(2, 2, '+63 918 555 2345', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(3, 3, '+63 919 555 3456', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(4, 5, '+63 920 555 4567', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(5, 8, '+63 921 555 5678', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(6, 10, '+63 922 555 6789', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dependant_email`
--

CREATE TABLE `dependant_email` (
  `dependant_email_id` int(11) NOT NULL,
  `dependant_id` int(11) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dependant_email`
--

INSERT INTO `dependant_email` (`dependant_email_id`, `dependant_id`, `email`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 1, 'miguel.santos@email.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(2, 3, 'carmen.ramos@email.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(3, 5, 'isabella.mendoza@email.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(4, 8, 'roberto.admin@email.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(5, 10, 'patricia.lim@email.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `employee_id` int(11) NOT NULL,
  `employee_code` varchar(10) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `fingerprint_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `extension_name` varchar(10) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `gender` enum('male','female','others') NOT NULL DEFAULT 'others',
  `civil_status` enum('single','married','divorced','widowed') DEFAULT 'single',
  `home_address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `position_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `shift` enum('morning','night') DEFAULT 'morning',
  `salary` decimal(10,2) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `leave_credit` int(11) DEFAULT 15,
  `supervisor_id` int(11) DEFAULT NULL,
  `status` enum('active','resigned','terminated','on-leave') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`employee_id`, `employee_code`, `user_id`, `fingerprint_id`, `first_name`, `last_name`, `middle_name`, `extension_name`, `birthdate`, `gender`, `civil_status`, `home_address`, `city`, `region`, `province`, `position_id`, `department_id`, `shift`, `salary`, `hire_date`, `leave_credit`, `supervisor_id`, `status`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 'EMP-0001', 1, NULL, 'Super', 'Admin', 'System', NULL, '1985-01-01', 'male', 'single', '123 Admin St', 'Quezon City', 'NCR', 'Metro Manila', 1, 1, 'morning', 80000.00, '2020-01-01', 15, NULL, 'active', '2025-11-11 05:40:40', '2025-11-11 05:40:40', 1, NULL),
(2, 'EMP-0002', 2, NULL, 'Maria', 'Santos', 'Cruz', NULL, '1990-03-15', 'female', 'married', '456 HR Ave', 'Makati City', 'NCR', 'Metro Manila', 1, 1, 'morning', 45000.00, '2021-02-01', 15, NULL, 'active', '2025-11-11 05:40:43', '2025-11-11 05:40:43', 1, NULL),
(3, 'EMP-0003', 3, NULL, 'Juan', 'Dela Cruz', 'Reyes', NULL, '1988-07-20', 'male', 'single', '789 Tech Blvd', 'Pasig City', 'NCR', 'Metro Manila', 5, 2, 'morning', 55000.00, '2021-03-01', 15, NULL, 'active', '2025-11-11 05:40:49', '2025-11-11 05:40:49', 1, NULL),
(4, 'EMP-0004', 4, NULL, 'Ana', 'Garcia', 'Lopez', NULL, '1992-05-10', 'female', 'single', '321 Front St', 'Manila', 'NCR', 'Metro Manila', 9, 3, 'morning', 35000.00, '2021-04-01', 15, NULL, 'active', '2025-11-11 05:40:55', '2025-11-11 05:40:55', 1, NULL),
(5, 'EMP-0005', 5, NULL, 'Pedro', 'Ramos', 'Silva', NULL, '1987-11-25', 'male', 'married', '654 Supervisor Ln', 'Quezon City', 'NCR', 'Metro Manila', 2, 1, 'morning', 40000.00, '2021-05-01', 15, 2, 'active', '2025-11-11 05:41:02', '2025-11-11 05:41:02', 1, NULL),
(6, 'EMP-0006', 6, NULL, 'Carlos', 'Mendoza', 'Torres', NULL, '1986-09-18', 'male', 'married', '789 IT Supervisor St', 'Makati City', 'NCR', 'Metro Manila', 5, 2, 'morning', 50000.00, '2021-05-15', 15, 3, 'active', '2025-11-11 05:41:08', '2025-11-11 05:41:08', 1, NULL),
(7, 'EMP-0007', 7, NULL, 'Rosa', 'Martinez', 'Fernandez', NULL, '1989-04-12', 'female', 'single', '321 Front Desk Supervisor Ave', 'Manila', 'NCR', 'Metro Manila', 9, 3, 'morning', 38000.00, '2021-06-01', 15, 4, 'active', '2025-11-11 05:41:14', '2025-11-11 05:41:14', 1, NULL),
(8, 'EMP-0008', 8, NULL, 'Lisa', 'Tan', 'Wong', NULL, '1995-06-22', 'female', 'single', '258 HR Plaza', 'Mandaluyong', 'NCR', 'Metro Manila', 4, 1, 'morning', 28000.00, '2022-01-15', 15, 5, 'active', '2025-11-11 05:41:20', '2025-11-11 05:41:20', 1, NULL),
(9, 'EMP-0009', 9, NULL, 'Mark', 'Villanueva', 'Castro', NULL, '1994-08-30', 'male', 'single', '369 Recruitment St', 'Quezon City', 'NCR', 'Metro Manila', 3, 1, 'morning', 32000.00, '2022-02-01', 15, 5, 'active', '2025-11-11 05:41:24', '2025-11-11 05:41:24', 1, NULL),
(10, 'EMP-0010', 10, NULL, 'Jamesa', 'Lim', 'Chen', NULL, '1993-12-05', 'female', 'single', '741 Dev Center', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 6, 2, 'morning', 45000.00, '2022-03-01', 15, 6, 'active', '2025-11-11 05:41:28', '2025-11-11 14:40:47', 1, 10),
(12, 'EMP-0012', 12, NULL, 'Jenny', 'Cruz', 'Bautista', NULL, '1997-10-08', 'female', 'single', '963 Lobby Ave', 'Manila', 'NCR', 'Metro Manila', 10, 3, 'morning', 25000.00, '2022-05-01', 15, 7, 'active', '2025-11-11 05:41:36', '2025-11-11 05:41:36', 1, NULL),
(13, 'EMP-0013', 13, NULL, 'Michael', 'Reyes', 'Santos', NULL, '1998-03-27', 'male', 'single', '159 Front Office', 'Arakan', 'Region XII (SOCCSKSARGEN)', 'Cotabato', 19, 7, 'morning', 23000.00, '2022-06-01', 15, 7, 'active', '2025-11-11 05:41:40', '2025-11-12 15:22:00', 1, 1),
(18, 'EMP-0018', 18, NULL, 'Nicole', 'Mayo', NULL, NULL, '1995-03-01', 'female', 'single', 'Unit 10, 2/F Molvina Commercial Complex, Marcos Highway', 'City of Antipolo ', 'Region IV-A (CALABARZON)', 'Rizal', 13, 4, 'morning', 1000.00, '2025-11-05', 15, NULL, 'active', '2025-11-11 15:03:38', '2025-11-11 15:05:36', 1, 1),
(19, 'EMP-0019', 19, NULL, 'Vincent', 'Torio', NULL, NULL, '1990-02-09', 'male', 'married', ' 533 Commonwealth Avenue 1121', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 14, 5, 'morning', 1000.00, '2025-11-03', 15, NULL, 'active', '2025-11-11 15:31:18', '2025-11-12 15:19:46', 1, 1),
(20, 'EMP-0020', 20, NULL, 'John Wilmer', 'Tima-an', NULL, NULL, '2000-02-01', 'male', 'single', 'House Of Precast, 1850 E. Rodriguez Sr. Blvd, Cubao', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 7, 2, 'morning', 10000.00, '2025-10-30', 15, NULL, 'active', '2025-11-11 15:57:41', '2025-11-12 15:12:40', 1, 1),
(21, 'EMP-0021', 21, NULL, 'Gabriel Aaron', 'Chavez', NULL, NULL, '2001-12-03', 'others', 'single', ' 700 Shaw Boulevard', 'Pasig City', 'National Capital Region (NCR)', 'NCR', 27, 4, 'morning', 1023.00, '2025-10-30', 15, 7, 'active', '2025-11-11 17:25:45', '2025-11-12 14:06:13', 1, 1),
(22, 'EMP-0022', 22, NULL, 'Lawrence', 'Savariz', NULL, NULL, '0004-10-02', 'male', 'single', 'Pasilio 2 Central Market 1000', 'Manila', 'National Capital Region (NCR)', 'NCR', 1, 1, 'morning', 1000.00, '2025-10-29', 15, NULL, 'active', '2025-11-11 17:57:10', '2025-11-11 18:16:53', 1, 1),
(23, 'EMP-0023', 23, NULL, 'Emmanuel', 'Frias', NULL, NULL, '1991-11-11', 'male', 'single', '  2 San Bartolome St., Capitol 6,', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 28, 13, 'morning', 20052.00, '2025-11-06', 15, NULL, 'active', '2025-11-12 15:32:06', '2025-11-12 15:32:06', 1, NULL),
(27, 'EMP-0027', 27, NULL, 'Shawn', 'Cordero', NULL, NULL, '2005-02-09', 'male', 'single', ' PDCP Bank Center', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 22, 9, 'morning', 2000.00, '2025-11-06', 15, NULL, 'active', '2025-11-12 17:33:24', '2025-11-12 17:33:24', 1, NULL),
(29, 'EMP-0029', 29, NULL, 'Ethan', 'Atienza', NULL, NULL, '2001-12-29', 'male', 'single', ' 8741 Paseo De Roxas', 'Makati City', 'National Capital Region (NCR)', 'NCR', 19, 7, 'night', 10000.00, '2025-11-03', 15, NULL, 'active', '2025-11-13 02:47:36', '2025-11-13 02:47:37', 1, NULL),
(32, 'EMP-0032', 32, 2, 'Christian', 'Ancog', 'Ihao', NULL, '2003-12-01', 'male', 'single', '13 Oregano st. Palanas A Barangay Vasra', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 8, 2, 'night', 20000.00, '2025-10-31', 15, 6, 'active', '2025-11-13 03:11:18', '2025-11-14 04:16:43', 1, 1),
(33, 'EMP-0033', 33, 3, 'Matt Henry', 'Buenaventura', NULL, NULL, '2003-01-27', 'male', 'single', '13 Oregano st. Palanas A Barangay Vasra', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 6, 2, 'morning', 30000.00, '2025-10-29', 15, 6, 'active', '2025-11-13 03:17:16', '2025-11-13 03:17:47', 1, 33),
(34, 'EMP-0034', 34, 4, 'Imma', 'Esrada', NULL, NULL, '2003-12-09', 'female', 'single', '13 Oregano st. Palanas A Barangay Vasra', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 26, 12, 'morning', 10000.00, '2025-11-05', 15, NULL, 'active', '2025-11-13 05:10:06', '2025-11-13 05:10:34', 1, 34),
(36, 'EMP-0036', 36, 5, 'Meryl', 'Alcantra', NULL, NULL, '2005-05-09', 'female', 'single', 'Holy Spirit', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 7, 2, 'morning', 2000.00, '2025-10-29', 15, 6, 'active', '2025-11-13 11:57:23', '2025-11-13 11:57:42', 1, 36),
(37, 'EMP-0037', 37, 6, 'Chong', 'Huazai', NULL, NULL, '2005-02-01', 'others', 'single', '13 Oregano st. Palanas A Barangay Vasra', 'Quezon City', 'National Capital Region (NCR)', 'NCR', 25, 8, 'night', 20000.00, '2025-10-28', 15, NULL, 'active', '2025-11-13 12:17:39', '2025-11-13 12:17:57', 1, 37);

-- --------------------------------------------------------

--
-- Table structure for table `employee_addresses`
--

CREATE TABLE `employee_addresses` (
  `address_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `region_name` varchar(100) DEFAULT NULL,
  `province_name` varchar(50) DEFAULT NULL,
  `city_name` varchar(50) DEFAULT NULL,
  `home_address` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_addresses`
--

INSERT INTO `employee_addresses` (`address_id`, `employee_id`, `region_name`, `province_name`, `city_name`, `home_address`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 1, 'NCR', 'Metro Manila', 'Quezon City', '123 Admin St, Brgy. Central', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(2, 2, 'NCR', 'Metro Manila', 'Makati City', '456 HR Ave, Brgy. Poblacion', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(3, 3, 'NCR', 'Metro Manila', 'Pasig City', '789 Tech Blvd, Brgy. Kapitolyo', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(4, 4, 'NCR', 'Metro Manila', 'Manila', '321 Front St, Brgy. Ermita', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(5, 5, 'NCR', 'Metro Manila', 'Quezon City', '654 Supervisor Ln, Brgy. Diliman', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(6, 6, 'NCR', 'Metro Manila', 'Makati City', '789 IT Supervisor St, Brgy. Salcedo', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(7, 7, 'NCR', 'Metro Manila', 'Manila', '321 Front Desk Supervisor Ave, Brgy. Malate', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(8, 8, 'NCR', 'Metro Manila', 'Mandaluyong', '258 HR Plaza, Brgy. Highway Hills', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(9, 9, 'NCR', 'Metro Manila', 'Quezon City', '369 Recruitment St, Brgy. Cubao', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(10, 10, 'NCR', 'Metro Manila', 'Makati City', '741 Dev Center, Brgy. Bel-Air', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(11, 11, 'NCR', 'Metro Manila', 'Pasig City', '852 Support Hub, Brgy. Ortigas', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(12, 12, 'NCR', 'Metro Manila', 'Manila', '963 Lobby Ave, Brgy. Intramuros', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(13, 13, 'NCR', 'Metro Manila', 'Pasay City', '159 Front Office, Brgy. Baclaran', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_contact_numbers`
--

CREATE TABLE `employee_contact_numbers` (
  `contact_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_contact_numbers`
--

INSERT INTO `employee_contact_numbers` (`contact_id`, `employee_id`, `contact_number`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 1, '+63 917 123 4567', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(2, 2, '+63 918 234 5678', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(3, 3, '+63 919 345 6789', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(4, 4, '+63 920 456 7890', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(5, 5, '+63 921 567 8901', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(6, 6, '+63 922 678 9012', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(7, 7, '+63 923 789 0123', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(8, 8, '+63 924 890 1234', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(9, 9, '+63 925 901 2345', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(10, 10, '+63 926 012 3456', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(11, 11, '+63 927 123 4567', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(12, 12, '+63 928 234 5678', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(13, 13, '+63 929 345 6789', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_emails`
--

CREATE TABLE `employee_emails` (
  `email_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_emails`
--

INSERT INTO `employee_emails` (`email_id`, `employee_id`, `email`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 1, 'superadmin@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(2, 2, 'maria.santos@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(3, 3, 'juan.delacruz@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(4, 4, 'ana.garcia@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(5, 5, 'pedro.ramos@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(6, 6, 'carlos.mendoza@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(7, 7, 'rosa.martinez@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(8, 8, 'lisa.tan@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(9, 9, 'mark.villanueva@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(10, 10, 'james.lim@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(11, 11, 'sarah.gomez@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(12, 12, 'jenny.cruz@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL),
(13, 13, 'michael.reyes@gmail.com', '2025-11-14 13:19:33', '2025-11-14 13:19:33', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job_positions`
--

CREATE TABLE `job_positions` (
  `position_id` int(11) NOT NULL,
  `position_name` varchar(100) NOT NULL,
  `position_code` varchar(10) DEFAULT NULL,
  `position_desc` varchar(255) DEFAULT NULL,
  `department_id` int(11) NOT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `availability` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ;

--
-- Dumping data for table `job_positions`
--

INSERT INTO `job_positions` (`position_id`, `position_name`, `position_code`, `position_desc`, `department_id`, `salary`, `availability`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 'HR Manager', 'POS-0001', 'Oversees HR operations and employee management', 1, 45000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(2, 'HR Specialist', 'POS-0002', 'Handles recruitment and employee relations', 1, 35000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(3, 'Recruiter', 'POS-0003', 'Sources and screens job candidates', 1, 32000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(4, 'HR Assistant', 'POS-0004', 'Provides administrative support to HR department', 1, 28000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(5, 'IT Manager', 'POS-0005', 'Oversees IT infrastructure and projects', 2, 55000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(6, 'Software Developer', 'POS-0006', 'Develops and maintains software applications', 2, 45000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(7, 'IT Support Specialist', 'POS-0007', 'Maintains hardware and software systems', 2, 38000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(8, 'System Administrator', 'POS-0008', 'Manages servers and network infrastructure', 2, 42000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(9, 'Front Desk Manager', 'POS-0009', 'Oversees front desk operations and staff', 3, 35000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(10, 'Receptionist', 'POS-0010', 'Greets visitors and handles front desk duties', 3, 25000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(11, 'Front Desk Associate', 'POS-0011', 'Assists with reception and administrative tasks', 3, 23000.00, 1, '2025-11-14 13:19:32', '2025-11-14 13:19:32', 1, NULL),
(12, 'Cashier', 'POS-0012', NULL, 4, NULL, 5, '2025-11-11 10:21:17', '2025-11-11 10:21:17', 1, NULL),
(13, 'Server', 'POS-0013', NULL, 4, NULL, 3, '2025-11-11 10:23:15', '2025-11-11 10:23:15', 1, NULL),
(14, 'Kitchen Staffs', 'POS-0014', NULL, 5, NULL, 1, '2025-11-11 10:25:12', '2025-11-11 10:25:12', 1, NULL),
(15, 'F&B Manager', 'POS-0015', NULL, 8, NULL, 1, '2025-11-11 10:39:19', '2025-11-11 10:44:31', 1, 1),
(16, 'Administrator ', 'POS-0016', NULL, 6, NULL, 1, '2025-11-11 10:41:59', '2025-11-11 10:43:20', 1, 1),
(17, 'Housekeeping Manager', 'POS-0017', NULL, 11, NULL, 1, '2025-11-11 10:44:20', '2025-11-11 10:44:20', 1, NULL),
(18, 'Maintenance Manager', 'POS-0018', NULL, 9, NULL, 1, '2025-11-11 10:54:28', '2025-11-11 10:54:28', 1, NULL),
(19, 'Inventory Manager', 'POS-0019', NULL, 7, NULL, 1, '2025-11-11 10:58:35', '2025-11-11 10:58:35', 1, NULL),
(20, 'Parking Manager', 'POS-0020', NULL, 10, NULL, 1, '2025-11-11 11:07:48', '2025-11-11 11:07:48', 1, NULL),
(21, 'House Keeping Staff', 'POS-0021', NULL, 11, NULL, 1, '2025-11-11 11:08:48', '2025-11-11 11:08:54', 1, 1),
(22, 'Maintenance Staff', 'POS-0022', NULL, 9, NULL, 3, '2025-11-11 11:09:12', '2025-11-11 11:09:12', 1, NULL),
(23, 'Hotel Reservation Manager', 'POS-0023', NULL, 6, NULL, 1, '2025-11-11 11:10:24', '2025-11-11 11:10:24', 1, NULL),
(24, 'Hotel Manager', 'POS-0024', NULL, 6, NULL, 1, '2025-11-11 11:11:42', '2025-11-11 11:11:42', 1, NULL),
(25, 'Financial Manager', 'POS-0025', NULL, 8, NULL, 1, '2025-11-11 11:14:44', '2025-11-11 11:14:44', 1, NULL),
(26, 'Accountant', 'POS-0026', NULL, 12, NULL, 5, '2025-11-11 11:16:10', '2025-11-11 11:16:11', 1, NULL),
(27, 'Concierge', 'POS-0027', NULL, 4, NULL, 7, '2025-11-11 11:17:53', '2025-11-11 11:17:53', 1, NULL),
(28, 'CRM Manager', 'POS-0028', NULL, 13, NULL, 1, '2025-11-11 14:50:25', '2025-11-11 14:53:14', 1, 1),
(29, 'Waiter', 'POS-0029', NULL, 4, NULL, 5, '2025-11-14 01:30:40', '2025-11-14 06:30:19', 1, 3);

-- --------------------------------------------------------

--
-- Table structure for table `leaves`
--

CREATE TABLE `leaves` (
  `leave_id` int(11) NOT NULL,
  `leave_code` varchar(10) DEFAULT NULL,
  `employee_id` int(11) NOT NULL,
  `leave_type` enum('vacation','sick','emergency','others') DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `remarks` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ;

--
-- Dumping data for table `leaves`
--

INSERT INTO `leaves` (`leave_id`, `leave_code`, `employee_id`, `leave_type`, `start_date`, `end_date`, `status`, `remarks`, `approved_by`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 'LEV-0001', 9, 'vacation', '2024-10-04', '2024-10-04', 'approved', 'Family event', 5, '2024-09-28 10:00:00', '2025-11-14 13:19:33', 9, NULL),
(2, 'LEV-0002', 12, 'sick', '2024-10-08', '2024-10-08', 'approved', 'Flu symptoms', 7, '2024-10-07 18:30:00', '2025-11-14 13:19:33', 12, NULL),
(3, 'LEV-0003', 8, 'vacation', '2024-10-15', '2024-10-16', 'approved', 'Personal matters', 5, '2024-10-01 09:00:00', '2025-11-14 13:19:33', 8, NULL),
(4, 'LEV-0004', 11, 'sick', '2024-10-22', '2024-10-23', 'approved', 'Medical checkup', 6, '2024-10-20 14:00:00', '2025-11-14 13:19:33', 11, NULL),
(5, 'LEV-0005', 4, 'emergency', '2024-10-25', '2024-10-25', 'approved', 'Family emergency', 7, '2024-10-24 08:00:00', '2025-11-14 13:19:33', 4, NULL),
(6, 'LEV-0006', 10, 'vacation', '2024-11-05', '2024-11-07', 'pending', 'Planned vacation', NULL, '2024-10-28 11:00:00', '2025-11-14 13:19:33', 10, NULL),
(7, 'LEV-0007', 2, 'sick', '2024-11-12', '2024-11-13', 'pending', 'Scheduled medical procedure', NULL, '2024-10-30 15:00:00', '2025-11-14 13:19:33', 2, NULL),
(8, 'LEV-0008', 13, 'vacation', '2024-11-20', '2024-11-22', 'rejected', 'Insufficient leave credits', 7, '2024-10-29 10:30:00', '2025-11-14 13:19:33', 13, NULL),
(9, 'LEV-0009', 5, 'others', '2024-09-15', '2024-09-15', 'approved', 'Training seminar', 2, '2024-09-10 09:00:00', '2025-11-14 13:19:33', 5, NULL),
(10, 'LEV-0010', 7, 'vacation', '2024-12-23', '2024-12-27', 'pending', 'Christmas holiday', NULL, '2024-11-01 08:00:00', '2025-11-14 13:19:33', 7, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pms_housekeeping_logs`
--

CREATE TABLE `pms_housekeeping_logs` (
  `LogID` int(11) NOT NULL,
  `TaskID` int(11) DEFAULT NULL,
  `RoomID` int(11) DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL COMMENT 'User who performed the action',
  `Action` varchar(50) NOT NULL,
  `Details` text DEFAULT NULL,
  `Timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_housekeeping_logs`
--

INSERT INTO `pms_housekeeping_logs` (`LogID`, `TaskID`, `RoomID`, `UserID`, `Action`, `Details`, `Timestamp`) VALUES
(1, 1, 2, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: Bed and Linen Care', '2025-11-13 07:48:09'),
(2, 1, 2, 34, 'CANCELLED', 'Task cancelled by manager (ID: 34).', '2025-11-13 07:48:43'),
(3, 2, 2, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: General Cleaning, Bed and Linen Care, Bathroom Cleaning, Restocking Supplies, Trash Removal, Window & Curtains Care', '2025-11-13 08:11:36'),
(4, 2, 2, 34, 'CANCELLED', 'Task cancelled by manager (ID: 34).', '2025-11-13 08:12:39'),
(5, 3, 2, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: Bed and Linen Care', '2025-11-13 08:14:47'),
(6, 3, 2, 34, 'CANCELLED', 'Task cancelled by manager (ID: 34).', '2025-11-13 08:24:00'),
(7, 4, 2, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: Bed and Linen Care', '2025-11-13 08:24:33'),
(8, 4, 2, 34, 'CANCELLED', 'Task cancelled by manager (ID: 34).', '2025-11-13 08:26:11'),
(9, 5, 2, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: General Cleaning, Bed and Linen Care, Bathroom Cleaning, Restocking Supplies, Trash Removal, Window & Curtains Care', '2025-11-13 08:26:22'),
(10, 5, 2, 34, 'CANCELLED', 'Task cancelled by manager (ID: 34).', '2025-11-13 08:27:42'),
(11, 6, 2, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: Bed and Linen Care, Restocking Supplies', '2025-11-13 08:27:52'),
(12, 6, 2, 41, 'IN PROGRESS', 'Status set to \'In Progress\' by staff (ID: 41). Remarks: s', '2025-11-13 08:28:03'),
(13, 6, 2, 41, 'COMPLETED', 'Task completed by staff (ID: 41). Remarks: s', '2025-11-13 08:28:14'),
(14, 7, 4, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: General Cleaning', '2025-11-14 14:28:06'),
(15, 7, 4, 34, 'CANCELLED', 'Task cancelled by manager (ID: 34).', '2025-11-14 14:28:22'),
(16, 8, 1, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: Window & Curtains Care', '2025-11-14 14:36:25'),
(17, 8, 1, 34, 'CANCELLED', 'Task cancelled by manager (ID: 34).', '2025-11-14 14:53:44'),
(18, 9, 1, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: General Cleaning', '2025-11-14 17:05:11'),
(19, 9, 1, 34, 'CANCELLED', 'Task cancelled by manager (ID: 34).', '2025-11-14 17:09:51'),
(20, 10, 1, 34, 'ASSIGNED', 'Task assigned to staff s s (ID: 41) by manager (ID: 34). Tasks: General Cleaning, Bathroom Cleaning', '2025-11-14 17:38:02'),
(21, 10, 1, 41, 'IN PROGRESS', 'Status set to \'In Progress\' by staff (ID: 41). Remarks: asd', '2025-11-14 17:38:09'),
(22, 10, 1, 41, 'COMPLETED', 'Task completed by staff (ID: 41). Remarks: asd', '2025-11-14 17:38:18');

-- --------------------------------------------------------

--
-- Table structure for table `pms_housekeeping_tasks`
--

CREATE TABLE `pms_housekeeping_tasks` (
  `TaskID` int(11) NOT NULL,
  `RoomID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL COMMENT 'Manager who created the task',
  `AssignedUserID` int(11) DEFAULT NULL COMMENT 'Staff member assigned to the task',
  `TaskType` varchar(255) DEFAULT 'Not Specified',
  `Status` varchar(50) NOT NULL DEFAULT 'Pending',
  `DateRequested` datetime NOT NULL DEFAULT current_timestamp(),
  `DateCompleted` datetime DEFAULT NULL,
  `Remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_housekeeping_tasks`
--

INSERT INTO `pms_housekeeping_tasks` (`TaskID`, `RoomID`, `UserID`, `AssignedUserID`, `TaskType`, `Status`, `DateRequested`, `DateCompleted`, `Remarks`) VALUES
(1, 2, 34, 41, 'Bed and Linen Care', 'Cancelled', '2025-11-13 07:48:05', NULL, 'Cancelled by Manager'),
(2, 2, 34, 41, 'General Cleaning, Bed and Linen Care, Bathroom Cleaning, Restocking Supplies, Trash Removal, Window & Curtains Care', 'Cancelled', '2025-11-13 08:11:33', NULL, 'Cancelled by Manager'),
(3, 2, 34, 41, 'Bed and Linen Care', 'Cancelled', '2025-11-13 08:14:45', NULL, 'Cancelled by Manager'),
(4, 2, 34, 41, 'Bed and Linen Care', 'Cancelled', '2025-11-13 08:24:30', NULL, 'Cancelled by Manager'),
(5, 2, 34, 41, 'General Cleaning, Bed and Linen Care, Bathroom Cleaning, Restocking Supplies, Trash Removal, Window & Curtains Care', 'Cancelled', '2025-11-13 08:26:19', NULL, 'Cancelled by Manager'),
(6, 2, 34, 41, 'Bed and Linen Care, Restocking Supplies', 'Completed', '2025-11-13 08:27:49', '2025-11-13 08:28:14', 's'),
(7, 4, 34, 41, 'General Cleaning', 'Cancelled', '2025-11-14 14:28:00', NULL, 'Cancelled by Manager'),
(8, 1, 34, 41, 'Window & Curtains Care', 'Cancelled', '2025-11-14 14:36:22', NULL, 'Cancelled by Manager'),
(9, 1, 34, 41, 'General Cleaning', 'Cancelled', '2025-11-14 17:05:08', NULL, 'Cancelled by Manager'),
(10, 1, 34, 41, 'General Cleaning, Bathroom Cleaning', 'Completed', '2025-11-14 17:37:59', '2025-11-14 17:38:18', 'asd');

-- --------------------------------------------------------

--
-- Table structure for table `pms_inventory`
--

CREATE TABLE `pms_inventory` (
  `ItemID` int(11) NOT NULL,
  `ItemName` varchar(255) NOT NULL,
  `ItemCategoryID` int(11) NOT NULL,
  `ItemQuantity` decimal(15,2) NOT NULL,
  `ItemDescription` varchar(255) DEFAULT NULL,
  `ItemStatus` varchar(255) NOT NULL,
  `DateofStockIn` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_inventory`
--

INSERT INTO `pms_inventory` (`ItemID`, `ItemName`, `ItemCategoryID`, `ItemQuantity`, `ItemDescription`, `ItemStatus`, `DateofStockIn`) VALUES
(10, 'asd', 1, 700.00, 'qwe', 'In Stock', '2025-11-14 09:47:06'),
(11, 'd', 2, 4.00, 'asd', 'Low Stock', '2025-10-31 16:00:00'),
(12, 'g', 3, 0.00, 's', 'Out of Stock', '2025-11-14 09:48:15');

-- --------------------------------------------------------

--
-- Table structure for table `pms_inventorylog`
--

CREATE TABLE `pms_inventorylog` (
  `InvLogID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `ItemID` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `InventoryLogReason` varchar(255) NOT NULL,
  `DateofRelease` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_inventorylog`
--

INSERT INTO `pms_inventorylog` (`InvLogID`, `UserID`, `ItemID`, `Quantity`, `InventoryLogReason`, `DateofRelease`) VALUES
(58, 38, 10, 2, 'Initial Stock In', '2025-11-10 13:36:40'),
(59, 38, 11, 4, 'Initial Stock In', '2025-11-10 13:36:50'),
(60, 38, 12, 2, 'Initial Stock In', '2025-11-10 13:37:01'),
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
(73, 39, 10, -1, 'Item Issued', '2025-11-11 00:24:36'),
(74, 38, 10, 4, 'Stock Added', '2025-11-14 05:03:08'),
(75, 38, 10, 6, 'Stock Added', '2025-11-14 05:03:15'),
(76, 39, 10, -2, 'Item Issued', '2025-11-14 05:03:46'),
(77, 38, 10, 2, 'Stock Added', '2025-11-14 09:39:16'),
(78, 39, 10, -15, 'Item Issued', '2025-11-14 09:39:37'),
(79, 38, 10, 700, 'Stock Added', '2025-11-14 09:47:06'),
(80, 39, 12, -2, 'Item Issued', '2025-11-14 09:48:15');

-- --------------------------------------------------------

--
-- Table structure for table `pms_itemcategory`
--

CREATE TABLE `pms_itemcategory` (
  `ItemCategoryID` int(11) NOT NULL,
  `ItemCategoryName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_itemcategory`
--

INSERT INTO `pms_itemcategory` (`ItemCategoryID`, `ItemCategoryName`) VALUES
(1, 'Cleaning Solution'),
(2, 'Electrical'),
(3, 'Furniture & Fixtures'),
(4, 'Room Amenities');

-- --------------------------------------------------------

--
-- Table structure for table `pms_maintenance_logs`
--

CREATE TABLE `pms_maintenance_logs` (
  `LogID` int(11) NOT NULL,
  `RequestID` int(11) DEFAULT NULL,
  `RoomID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL COMMENT 'User who performed the action (e.g., manager, staff)',
  `Timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `Action` varchar(255) NOT NULL COMMENT 'e.g., CREATED, ASSIGNED, STATUS_CHANGED, COMPLETED, CANCELLED',
  `Details` text DEFAULT NULL COMMENT 'e.g., Status changed to In Progress by StaffID 5. Assigned to StaffID 5.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_maintenance_logs`
--

INSERT INTO `pms_maintenance_logs` (`LogID`, `RequestID`, `RoomID`, `UserID`, `Timestamp`, `Action`, `Details`) VALUES
(1, 1, 1, 35, '2025-11-14 14:23:00', 'ASSIGNED', 'Task assigned to staff Emily Chen (ID: 39) by manager (ID: 35). Issues: HVAC'),
(2, 1, 1, 39, '2025-11-14 14:26:04', 'IN PROGRESS', 'Status set to \'In Progress\' by staff (ID: 39). Remarks: sdf'),
(3, 1, 1, 39, '2025-11-14 14:26:07', 'COMPLETED', 'Task completed by staff (ID: 39). Remarks: sdf'),
(4, 2, 5, 35, '2025-11-14 14:26:32', 'ASSIGNED', 'Task assigned to staff Emily Chen (ID: 39) by manager (ID: 35). Issues: Doors & Windows'),
(5, 2, 5, 35, '2025-11-14 14:26:37', 'CANCELLED', 'Request cancelled by manager (ID: 35).'),
(6, 3, 5, 35, '2025-11-14 17:09:28', 'ASSIGNED', 'Task assigned to staff Emily Chen (ID: 39) by manager (ID: 35). Issues: Furniture & Fixtures, HVAC, Doors & Windows'),
(7, 3, 5, 35, '2025-11-14 17:09:41', 'CANCELLED', 'Request cancelled by manager (ID: 35).'),
(8, 4, 5, 35, '2025-11-14 17:37:03', 'ASSIGNED', 'Task assigned to staff Emily Chen (ID: 39) by manager (ID: 35). Issues: Plumbing'),
(9, 4, 5, 39, '2025-11-14 17:37:21', 'IN PROGRESS', 'Status set to \'In Progress\' by staff (ID: 39). Remarks: sdf'),
(10, 4, 5, 39, '2025-11-14 17:37:33', 'COMPLETED', 'Task completed by staff (ID: 39). Remarks: sdf');

-- --------------------------------------------------------

--
-- Table structure for table `pms_maintenance_requests`
--

CREATE TABLE `pms_maintenance_requests` (
  `RequestID` int(11) NOT NULL,
  `RoomID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `IssueType` varchar(200) NOT NULL,
  `Status` varchar(50) NOT NULL DEFAULT 'Pending',
  `Remarks` text DEFAULT NULL,
  `DateRequested` datetime NOT NULL,
  `DateCompleted` datetime DEFAULT NULL,
  `AssignedUserID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_maintenance_requests`
--

INSERT INTO `pms_maintenance_requests` (`RequestID`, `RoomID`, `UserID`, `IssueType`, `Status`, `Remarks`, `DateRequested`, `DateCompleted`, `AssignedUserID`) VALUES
(1, 1, 35, 'HVAC', 'Completed', 'sdf', '2025-11-14 14:22:51', '2025-11-14 14:26:07', 39),
(2, 5, 35, 'Doors & Windows', 'Cancelled', 'Cancelled by Manager', '2025-11-14 14:26:23', NULL, 39),
(3, 5, 35, 'Furniture & Fixtures, HVAC, Doors & Windows', 'Cancelled', 'Cancelled by Manager', '2025-11-14 17:09:25', NULL, 39),
(4, 5, 35, 'Plumbing', 'Completed', 'sdf', '2025-11-14 17:37:00', '2025-11-14 17:37:33', 39);

-- --------------------------------------------------------

--
-- Table structure for table `pms_parkingarea`
--

CREATE TABLE `pms_parkingarea` (
  `AreaID` int(11) NOT NULL,
  `AreaName` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_parkingarea`
--

INSERT INTO `pms_parkingarea` (`AreaID`, `AreaName`) VALUES
(1, 'Area A'),
(2, 'Area B'),
(3, 'Area C'),
(4, 'Area D'),
(5, 'Area E');

-- --------------------------------------------------------

--
-- Table structure for table `pms_parkingslot`
--

CREATE TABLE `pms_parkingslot` (
  `SlotID` int(11) NOT NULL,
  `AreaID` int(11) NOT NULL,
  `SlotName` varchar(20) NOT NULL,
  `AllowedVehicleTypeID` int(11) NOT NULL,
  `Status` enum('available','occupied','reserved','maintenance') NOT NULL DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_parkingslot`
--

INSERT INTO `pms_parkingslot` (`SlotID`, `AreaID`, `SlotName`, `AllowedVehicleTypeID`, `Status`) VALUES
(51, 1, 'A-01', 1, 'available'),
(52, 1, 'A-02', 1, 'available'),
(53, 1, 'A-03', 1, 'available'),
(54, 1, 'A-04', 1, 'available'),
(55, 1, 'A-05', 1, 'available'),
(56, 1, 'A-06', 1, 'available'),
(57, 1, 'A-07', 1, 'available'),
(58, 1, 'A-08', 1, 'available'),
(59, 1, 'A-09', 1, 'available'),
(60, 1, 'A-10', 1, 'available'),
(61, 2, 'B-01', 2, 'available'),
(62, 2, 'B-02', 2, 'available'),
(63, 2, 'B-03', 2, 'available'),
(64, 2, 'B-04', 2, 'available'),
(65, 2, 'B-05', 2, 'available'),
(66, 2, 'B-06', 2, 'available'),
(67, 2, 'B-07', 2, 'available'),
(68, 2, 'B-08', 2, 'available'),
(69, 2, 'B-09', 2, 'available'),
(70, 2, 'B-10', 2, 'available'),
(71, 3, 'C-01', 2, 'available'),
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
(82, 4, 'D-02', 2, 'available'),
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
-- Table structure for table `pms_parking_sessions`
--

CREATE TABLE `pms_parking_sessions` (
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
-- Dumping data for table `pms_parking_sessions`
--

INSERT INTO `pms_parking_sessions` (`SessionID`, `SlotID`, `PlateNumber`, `GuestName`, `RoomNumber`, `VehicleTypeID`, `VehicleCategoryID`, `EntryTime`, `ExitTime`, `TotalFee`, `StaffID_Entry`) VALUES
(1, 51, 'QW4E12', 'asd', 's', 2, 9, '2025-11-07 16:08:27', '2025-11-07 16:08:36', NULL, 40),
(2, 51, 'WQE', 'wqe', 's', 1, 11, '2025-11-07 16:08:59', '2025-11-07 16:11:48', NULL, 40),
(3, 51, 'QWE', 'wqe', 'qwe', 1, 11, '2025-11-07 16:12:35', '2025-11-14 13:01:59', NULL, 40),
(4, 61, 'WE', 'wea', 'e', 2, 9, '2025-11-07 16:12:45', '2025-11-14 13:01:58', NULL, 40),
(5, 71, 'SDA', 'ad', 'asdasd', 1, 11, '2025-11-07 16:12:55', '2025-11-14 13:01:56', NULL, 40),
(6, 82, 'AS', 'asd', 'd', 1, 11, '2025-11-07 16:13:02', '2025-11-14 13:01:54', NULL, 40),
(7, 91, 'S', 'd', 'asd', 1, 11, '2025-11-07 16:13:14', '2025-11-07 17:00:50', NULL, 40),
(8, 52, 'QW4E12E', 'w', 'q1', 1, 11, '2025-11-08 02:48:34', '2025-11-08 02:48:37', NULL, 40),
(9, 52, 'D', 's', 'd', 1, 11, '2025-11-14 12:51:42', '2025-11-14 12:51:46', NULL, 40),
(10, 51, 'QWW', 'e', 'wqw', 1, 11, '2025-11-14 17:38:57', '2025-11-14 17:39:01', NULL, 40);

-- --------------------------------------------------------

--
-- Table structure for table `pms_rooms`
--

CREATE TABLE `pms_rooms` (
  `room_id` int(11) NOT NULL,
  `room_num` int(11) NOT NULL,
  `floor_num` int(11) DEFAULT NULL,
  `room_name` varchar(225) NOT NULL,
  `room_type` varchar(50) DEFAULT NULL,
  `capacity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` varchar(800) DEFAULT '',
  `status` enum('Available','Occupied','Reserved','Unavailable') DEFAULT 'Available',
  `image_url` longtext DEFAULT NULL,
  `is_archived` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_rooms`
--

INSERT INTO `pms_rooms` (`room_id`, `room_num`, `floor_num`, `room_name`, `room_type`, `capacity`, `price`, `description`, `status`, `image_url`, `is_archived`, `created_at`, `created_by`, `updated_at`, `updated_by`) VALUES
(1, 101, 1, 'Standard Room 101', 'Standard Room', 2, 2500.00, 'A comfortable and affordable room with essential amenities.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(2, 102, 1, 'Standard Room 102', 'Standard Room', 2, 2500.00, 'A comfortable and affordable room with essential amenities.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(3, 103, 1, 'Standard Room 103', 'Standard Room', 2, 2500.00, 'A comfortable and affordable room with essential amenities.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(4, 104, 1, 'Standard Room 104', 'Standard Room', 2, 2500.00, 'A comfortable and affordable room with essential amenities.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(5, 105, 1, 'Standard Room 105', 'Standard Room', 2, 2500.00, 'A comfortable and affordable room with essential amenities.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(6, 201, 2, 'Deluxe Room 201', 'Deluxe Room', 3, 4000.00, 'A spacious room with premium furnishings and a city view.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(7, 202, 2, 'Deluxe Room 202', 'Deluxe Room', 3, 4000.00, 'A spacious room with premium furnishings and a city view.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(8, 203, 2, 'Deluxe Room 203', 'Deluxe Room', 3, 4000.00, 'A spacious room with premium furnishings and a city view.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(9, 204, 2, 'Deluxe Room 204', 'Deluxe Room', 3, 4000.00, 'A spacious room with premium furnishings and a city view.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(10, 205, 2, 'Deluxe Room 205', 'Deluxe Room', 3, 4000.00, 'A spacious room with premium furnishings and a city view.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(11, 301, 3, 'Junior Suite 301', 'Suite', 4, 7500.00, 'A large suite featuring a separate living area and bedroom.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(12, 302, 3, 'Junior Suite 302', 'Suite', 4, 7500.00, 'A large suite featuring a separate living area and bedroom.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(13, 303, 3, 'Junior Suite 303', 'Suite', 4, 7500.00, 'A large suite featuring a separate living area and bedroom.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(14, 304, 3, 'Executive Suite 304', 'Suite', 4, 8000.00, 'An executive suite with a workspace and complimentary mini-bar.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(15, 305, 3, 'Executive Suite 305', 'Suite', 4, 8000.00, 'An executive suite with a workspace and complimentary mini-bar.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(16, 401, 4, 'The Royal Penthouse', 'Penthouse Suite', 6, 20000.00, 'The ultimate luxury experience with panoramic views and private butler service.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(17, 402, 4, 'The Imperial Penthouse', 'Penthouse Suite', 6, 20000.00, 'The ultimate luxury experience with panoramic views and private butler service.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(18, 403, 4, 'The Presidential Penthouse', 'Penthouse Suite', 6, 25000.00, 'Our finest suite, offering unparalleled luxury, space, and amenities.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(19, 404, 4, 'Penthouse 404', 'Penthouse Suite', 5, 18000.00, 'A multi-level penthouse with a private terrace.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL),
(20, 405, 4, 'Penthouse 405', 'Penthouse Suite', 5, 18000.00, 'A multi-level penthouse with a private terrace.', 'Available', NULL, 0, '2025-11-14 04:16:57', NULL, '2025-11-14 04:16:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pms_room_status`
--

CREATE TABLE `pms_room_status` (
  `StatusID` int(11) NOT NULL,
  `RoomNumber` varchar(20) NOT NULL,
  `RoomStatus` varchar(50) NOT NULL,
  `LastClean` timestamp NULL DEFAULT NULL,
  `LastMaintenance` timestamp NULL DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  `LastUpdated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_room_status`
--

INSERT INTO `pms_room_status` (`StatusID`, `RoomNumber`, `RoomStatus`, `LastClean`, `LastMaintenance`, `UserID`, `LastUpdated`) VALUES
(1, '101', 'Available', '2025-11-14 09:38:18', '2025-11-14 06:26:07', 34, '2025-11-14 09:38:18'),
(2, '102', 'Available', NULL, NULL, 35, '2025-11-14 06:05:39'),
(3, '103', 'Available', NULL, NULL, 35, '2025-11-14 06:05:40'),
(4, '104', 'Available', NULL, NULL, 1, '2025-11-14 06:28:13'),
(5, '105', 'Available', NULL, '2025-11-14 09:37:33', 35, '2025-11-14 09:37:33'),
(6, '201', 'Available', NULL, NULL, 1, '2025-11-14 06:27:19'),
(7, '202', 'Available', NULL, NULL, 35, '2025-11-14 06:05:49'),
(8, '203', 'Available', NULL, NULL, 35, '2025-11-14 06:05:51'),
(9, '204', 'Available', NULL, NULL, 35, '2025-11-14 06:05:52'),
(10, '205', 'Available', NULL, NULL, 35, '2025-11-14 06:05:54'),
(11, '301', 'Available', NULL, NULL, 35, '2025-11-14 06:05:57'),
(22, '302', 'Available', NULL, NULL, 35, '2025-11-14 06:06:26'),
(23, '303', 'Available', NULL, NULL, 35, '2025-11-14 06:06:29'),
(24, '405', 'Available', NULL, NULL, 35, '2025-11-14 06:06:31'),
(25, '404', 'Available', NULL, NULL, 35, '2025-11-14 06:06:34'),
(26, '403', 'Available', NULL, NULL, 35, '2025-11-14 06:06:36'),
(27, '402', 'Available', NULL, NULL, 35, '2025-11-14 06:06:40'),
(28, '401', 'Available', NULL, NULL, 35, '2025-11-14 06:06:42'),
(29, '305', 'Available', NULL, NULL, 35, '2025-11-14 06:06:45'),
(30, '304', 'Available', NULL, NULL, 35, '2025-11-14 06:06:47');

-- --------------------------------------------------------

--
-- Table structure for table `pms_users`
--

CREATE TABLE `pms_users` (
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
-- Dumping data for table `pms_users`
--

INSERT INTO `pms_users` (`UserID`, `EmployeeID`, `Fname`, `Lname`, `Mname`, `Birthday`, `AccountType`, `AvailabilityStatus`, `Username`, `Password`, `EmailAddress`, `Shift`, `Address`, `ContactNumber`, `ActivationToken`, `TokenExpiry`) VALUES
(1, NULL, 'vincew', 'vargas', 'gonzales', '2025-10-01', 'admin', 'Available', 'admin', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'vincevargas90@gmail.com', 'Night', 'asd', NULL, NULL, NULL),
(34, 'E1011', 'house', 'keeping', 'manager', '2015-11-10', 'housekeeping_manager', 'Available', 'housekeeping', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'asd@gmail.com', 'asd', 'asd', '324', NULL, NULL),
(35, 'E1012', 'maintain', 'nance', 'manager', '2015-11-02', 'maintenance_manager', 'Available', 'maintenance', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'asd@sf.com', 'ss', 'asd', 'asd', NULL, NULL),
(38, '1009', 'Michael', 'Brown', 'F', '1992-09-18', 'inventory_manager', 'Available', 'mmanager', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'michael.brown@example.com', 'Morning', '606 Parking Way, Taguig', '09220001009', '6543fd95970924b4af1da17b312e6fd145c34424ee1f999d858778fdbd2a65ee', '2025-11-08 03:25:04'),
(39, '1008', 'Emily', 'Chen', 'E', '2001-06-20', 'maintenance_staff', 'Available', 'mstaff', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'farmersday96@gmail.com', 'Morning', '505 Repair Ln, Makati', '09210001008', '8a9a372ed04b1ab93f4e1d7b4eb9ed67f56b3e8941812b5dfe4f26741226afb6', '2025-11-08 03:28:56'),
(40, '1023', 'sadas', 'ssss', 'nase', '2015-11-03', 'parking_manager', 'Available', 'pmanager', '$2y$10$iZ6eUM/sMo1dmZGvFE5AGuYB8yLQidcRds9tk9zcXzx.2ySanAUUC', 'as', 'Morning', 'asd', 'asd', NULL, NULL),
(41, '1011', 's', 's', 's', '2025-11-01', 'housekeeping_staff', 'Available', 's.1011', '$2y$10$616gfHtMdprxzuO3.7nUjOlX3oU.6tB7PoY8n/LXFZK0aOMVJ.xrC', 'farmday26@gmail.com', 'Morning', 'ss', 'sdsd', '83706a98a81c800faf0d8d1bab418e146b9a9b8be04568079a88d9673798b6ad', '2025-11-14 00:47:36');

-- --------------------------------------------------------

--
-- Table structure for table `pms_user_logs`
--

CREATE TABLE `pms_user_logs` (
  `LogID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `ActionType` varchar(255) NOT NULL,
  `Timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_user_logs`
--

INSERT INTO `pms_user_logs` (`LogID`, `UserID`, `ActionType`, `Timestamp`) VALUES
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
(162, 1, 'Logged In', '2025-11-11 02:57:09'),
(163, 1, 'Logged In', '2025-11-11 15:07:21'),
(164, 1, 'Logged Out', '2025-11-11 15:07:31'),
(165, 35, 'Logged In', '2025-11-11 15:07:35'),
(166, 35, 'Logged Out', '2025-11-11 15:36:07'),
(167, 38, 'Logged In', '2025-11-11 15:36:12'),
(168, 38, 'Logged Out', '2025-11-11 15:36:28'),
(169, 39, 'Logged In', '2025-11-11 15:36:39'),
(170, 39, 'Logged Out', '2025-11-11 15:36:43'),
(171, 34, 'Logged In', '2025-11-11 15:36:48'),
(172, 34, 'Logged Out', '2025-11-11 15:39:25'),
(173, 35, 'Logged In', '2025-11-11 15:39:29'),
(174, 1, 'Logged In', '2025-11-11 15:58:34'),
(175, 1, 'Logged Out', '2025-11-11 16:03:02'),
(176, 35, 'Logged In', '2025-11-11 16:03:09'),
(177, 34, 'Logged In', '2025-11-11 16:14:58'),
(178, 34, 'Logged Out', '2025-11-11 16:15:06'),
(179, 35, 'Logged In', '2025-11-11 16:15:22'),
(180, 35, 'Logged Out', '2025-11-11 17:21:11'),
(181, 1, 'Logged In', '2025-11-11 17:21:14'),
(182, 1, 'Logged Out', '2025-11-11 17:21:31'),
(183, 35, 'Logged In', '2025-11-11 17:21:35'),
(184, 35, 'Logged Out', '2025-11-11 19:50:24'),
(185, 1, 'Logged In', '2025-11-11 19:50:37'),
(186, 1, 'Logged Out', '2025-11-11 19:50:45'),
(187, 1, 'Logged In', '2025-11-11 19:50:48'),
(188, 1, 'Logged Out', '2025-11-11 19:52:10'),
(189, 35, 'Logged In', '2025-11-11 19:52:15'),
(190, 35, 'Logged Out', '2025-11-11 20:06:09'),
(191, 35, 'Logged In', '2025-11-11 20:06:14'),
(192, 35, 'Logged Out', '2025-11-11 20:56:33'),
(193, 1, 'Logged In', '2025-11-11 20:56:37'),
(194, 1, 'Logged Out', '2025-11-11 20:59:09'),
(195, 35, 'Logged In', '2025-11-11 20:59:15'),
(196, 1, 'Logged In', '2025-11-11 21:01:50'),
(197, 35, 'Logged Out', '2025-11-11 21:05:09'),
(198, 35, 'Logged In', '2025-11-11 21:05:15'),
(199, 35, 'Logged In', '2025-11-11 21:13:41'),
(200, 35, 'Logged Out', '2025-11-11 21:13:51'),
(201, 35, 'Logged In', '2025-11-11 21:16:20'),
(202, 35, 'Logged Out', '2025-11-11 21:36:06'),
(203, 35, 'Logged In', '2025-11-12 17:45:06'),
(204, 35, 'Logged Out', '2025-11-12 18:50:32'),
(205, 35, 'Logged In', '2025-11-12 18:50:36'),
(206, 35, 'Logged In', '2025-11-12 18:51:30'),
(207, 35, 'Logged Out', '2025-11-12 18:55:08'),
(208, 35, 'Logged In', '2025-11-12 18:55:16'),
(209, 35, 'Logged In', '2025-11-12 20:39:19'),
(210, 35, 'Logged Out', '2025-11-12 20:47:06'),
(211, 35, 'Logged In', '2025-11-12 20:47:19'),
(212, 35, 'Logged In', '2025-11-12 20:54:49'),
(213, 35, 'Logged Out', '2025-11-12 22:53:28'),
(214, 34, 'Logged In', '2025-11-12 22:53:32'),
(215, 34, 'Logged Out', '2025-11-12 23:17:01'),
(216, 35, 'Logged In', '2025-11-12 23:17:09'),
(217, 35, 'Logged Out', '2025-11-12 23:19:14'),
(218, 34, 'Logged In', '2025-11-12 23:19:20'),
(219, 34, 'Logged Out', '2025-11-12 23:23:03'),
(220, 35, 'Logged In', '2025-11-12 23:23:07'),
(221, 35, 'Logged Out', '2025-11-12 23:24:43'),
(222, 34, 'Logged In', '2025-11-12 23:24:46'),
(223, 34, 'Logged Out', '2025-11-12 23:24:57'),
(224, 35, 'Logged In', '2025-11-12 23:25:01'),
(225, 35, 'Logged Out', '2025-11-12 23:27:02'),
(226, 34, 'Logged In', '2025-11-12 23:27:05'),
(227, 34, 'Logged Out', '2025-11-12 23:47:16'),
(228, 1, 'Logged In', '2025-11-12 23:47:21'),
(229, 1, 'Logged Out', '2025-11-12 23:47:46'),
(230, 34, 'Logged In', '2025-11-12 23:47:49'),
(231, 35, 'Logged In', '2025-11-12 23:51:40'),
(232, 34, 'Logged Out', '2025-11-13 00:24:06'),
(233, 1, 'Logged In', '2025-11-13 00:24:09'),
(234, 1, 'Logged Out', '2025-11-13 00:24:19'),
(235, 34, 'Logged In', '2025-11-13 00:24:23'),
(236, 34, 'Logged Out', '2025-11-13 00:27:15'),
(237, 1, 'Logged In', '2025-11-13 00:27:20'),
(238, 1, 'Logged Out', '2025-11-13 00:27:34'),
(239, 34, 'Logged In', '2025-11-13 00:27:39'),
(240, 34, 'Logged Out', '2025-11-13 00:29:28'),
(241, 1, 'Logged In', '2025-11-13 00:29:32'),
(242, 35, 'Logged In', '2025-11-13 00:48:45'),
(243, 35, 'Logged Out', '2025-11-13 00:58:51'),
(244, 1, 'Logged In', '2025-11-13 00:58:54'),
(245, 1, 'Logged In', '2025-11-14 04:15:12');

-- --------------------------------------------------------

--
-- Table structure for table `pms_vehiclecategory`
--

CREATE TABLE `pms_vehiclecategory` (
  `VehicleCategoryID` int(11) NOT NULL,
  `VehicleTypeID` int(11) NOT NULL,
  `CategoryName` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_vehiclecategory`
--

INSERT INTO `pms_vehiclecategory` (`VehicleCategoryID`, `VehicleTypeID`, `CategoryName`) VALUES
(7, 2, 'Sedan'),
(8, 2, 'SUV'),
(9, 2, 'Pickup'),
(10, 2, 'Van'),
(11, 1, 'Motorcycle'),
(12, 2, 'Truck');

-- --------------------------------------------------------

--
-- Table structure for table `pms_vehicletype`
--

CREATE TABLE `pms_vehicletype` (
  `VehicleTypeID` int(11) NOT NULL,
  `TypeName` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pms_vehicletype`
--

INSERT INTO `pms_vehicletype` (`VehicleTypeID`, `TypeName`) VALUES
(1, '2 Wheeled'),
(2, '4 Wheeled');

-- --------------------------------------------------------

--
-- Table structure for table `public_ticket_emails`
--

CREATE TABLE `public_ticket_emails` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `ticket_id` int(11) NOT NULL,
  `ticket_code` varchar(10) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `fixed_by` int(11) DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL
) ;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`ticket_id`, `ticket_code`, `user_id`, `fixed_by`, `title`, `description`, `status`, `created_at`, `created_by`, `updated_at`, `updated_by`) VALUES
(1, 'TIC-0001', 8, 3, 'Computer not starting', 'My workstation won\'t boot up this morning', 'resolved', '2024-10-01 08:30:00', 8, '2025-11-14 13:19:33', NULL),
(2, 'TIC-0002', 12, 3, 'Email access issue', 'Cannot access company email account', 'resolved', '2024-10-02 09:15:00', 12, '2025-11-14 13:19:33', NULL),
(3, 'TIC-0003', 9, NULL, 'Printer not working', 'Office printer shows error message', 'in_progress', '2024-10-07 10:00:00', 9, '2025-11-14 13:19:33', NULL),
(4, 'TIC-0004', 4, 3, 'Password reset request', 'Forgot my system password', 'resolved', '2024-10-03 14:20:00', 4, '2025-11-14 13:19:33', NULL),
(5, 'TIC-0005', 13, NULL, 'Network connectivity', 'Slow internet connection at front desk', 'open', '2024-10-09 11:30:00', 13, '2025-11-14 13:19:33', NULL),
(6, 'TIC-0006', 10, 3, 'Software installation', 'Need development tools installed', 'resolved', '2024-10-04 13:00:00', 10, '2025-11-14 13:19:33', NULL),
(7, 'TIC-0007', 7, NULL, 'Phone system issue', 'Extension not receiving calls', 'open', '2024-10-08 15:45:00', 7, '2025-11-14 13:19:33', NULL),
(8, 'TIC-0008', 11, 3, 'VPN access', 'Cannot connect to VPN for remote work', 'resolved', '2024-10-05 16:00:00', 11, '2025-11-14 13:19:33', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `attendance_code` (`attendance_code`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD UNIQUE KEY `department_name` (`department_name`),
  ADD UNIQUE KEY `department_code` (`department_code`),
  ADD KEY `fk_dept_supervisor` (`supervisor_id`);

--
-- Indexes for table `dependants`
--
ALTER TABLE `dependants`
  ADD PRIMARY KEY (`dependant_id`),
  ADD UNIQUE KEY `dependant_code` (`dependant_code`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `dependant_address`
--
ALTER TABLE `dependant_address`
  ADD PRIMARY KEY (`dependant_address_id`),
  ADD UNIQUE KEY `dependant_id` (`dependant_id`);

--
-- Indexes for table `dependant_contact`
--
ALTER TABLE `dependant_contact`
  ADD PRIMARY KEY (`dependant_contact_id`),
  ADD UNIQUE KEY `dependant_id` (`dependant_id`);

--
-- Indexes for table `dependant_email`
--
ALTER TABLE `dependant_email`
  ADD PRIMARY KEY (`dependant_email_id`),
  ADD UNIQUE KEY `dependant_id` (`dependant_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `employee_code` (`employee_code`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `fingerprint_id` (`fingerprint_id`),
  ADD KEY `position_id` (`position_id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `supervisor_id` (`supervisor_id`);

--
-- Indexes for table `employee_addresses`
--
ALTER TABLE `employee_addresses`
  ADD PRIMARY KEY (`address_id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`);

--
-- Indexes for table `employee_contact_numbers`
--
ALTER TABLE `employee_contact_numbers`
  ADD PRIMARY KEY (`contact_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `employee_emails`
--
ALTER TABLE `employee_emails`
  ADD PRIMARY KEY (`email_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `job_positions`
--
ALTER TABLE `job_positions`
  ADD PRIMARY KEY (`position_id`),
  ADD UNIQUE KEY `position_code` (`position_code`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `leaves`
--
ALTER TABLE `leaves`
  ADD PRIMARY KEY (`leave_id`),
  ADD UNIQUE KEY `leave_code` (`leave_code`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `pms_housekeeping_logs`
--
ALTER TABLE `pms_housekeeping_logs`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `TaskID` (`TaskID`),
  ADD KEY `RoomID` (`RoomID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `pms_housekeeping_tasks`
--
ALTER TABLE `pms_housekeeping_tasks`
  ADD PRIMARY KEY (`TaskID`),
  ADD KEY `RoomID` (`RoomID`),
  ADD KEY `AssignedUserID` (`AssignedUserID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `pms_inventory`
--
ALTER TABLE `pms_inventory`
  ADD PRIMARY KEY (`ItemID`),
  ADD KEY `ItemCategoryID` (`ItemCategoryID`);

--
-- Indexes for table `pms_inventorylog`
--
ALTER TABLE `pms_inventorylog`
  ADD PRIMARY KEY (`InvLogID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `ItemID` (`ItemID`);

--
-- Indexes for table `pms_itemcategory`
--
ALTER TABLE `pms_itemcategory`
  ADD PRIMARY KEY (`ItemCategoryID`);

--
-- Indexes for table `pms_maintenance_logs`
--
ALTER TABLE `pms_maintenance_logs`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `idx_request_id` (`RequestID`),
  ADD KEY `idx_room_id` (`RoomID`),
  ADD KEY `idx_user_id` (`UserID`);

--
-- Indexes for table `pms_maintenance_requests`
--
ALTER TABLE `pms_maintenance_requests`
  ADD PRIMARY KEY (`RequestID`),
  ADD KEY `FK_MaintRequest_Room` (`RoomID`),
  ADD KEY `FK_MaintRequest_User` (`UserID`),
  ADD KEY `FK_MaintRequest_AssignedUser` (`AssignedUserID`);

--
-- Indexes for table `pms_parkingarea`
--
ALTER TABLE `pms_parkingarea`
  ADD PRIMARY KEY (`AreaID`);

--
-- Indexes for table `pms_parkingslot`
--
ALTER TABLE `pms_parkingslot`
  ADD PRIMARY KEY (`SlotID`),
  ADD UNIQUE KEY `UK_Area_SlotName` (`AreaID`,`SlotName`),
  ADD KEY `FK_Slot_Area` (`AreaID`),
  ADD KEY `FK_Slot_VehicleType` (`AllowedVehicleTypeID`);

--
-- Indexes for table `pms_parking_sessions`
--
ALTER TABLE `pms_parking_sessions`
  ADD PRIMARY KEY (`SessionID`),
  ADD KEY `FK_Session_Slot` (`SlotID`),
  ADD KEY `FK_Session_VehicleType` (`VehicleTypeID`),
  ADD KEY `FK_Session_VehicleCategory` (`VehicleCategoryID`),
  ADD KEY `FK_Session_Staff` (`StaffID_Entry`),
  ADD KEY `idx_plate_number` (`PlateNumber`);

--
-- Indexes for table `pms_rooms`
--
ALTER TABLE `pms_rooms`
  ADD PRIMARY KEY (`room_id`);

--
-- Indexes for table `pms_room_status`
--
ALTER TABLE `pms_room_status`
  ADD PRIMARY KEY (`StatusID`),
  ADD UNIQUE KEY `RoomNumber` (`RoomNumber`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `pms_users`
--
ALTER TABLE `pms_users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Username` (`Username`),
  ADD UNIQUE KEY `EmployeeID` (`EmployeeID`),
  ADD UNIQUE KEY `idx_activation_token` (`ActivationToken`),
  ADD KEY `idx_employee_id` (`EmployeeID`);

--
-- Indexes for table `pms_user_logs`
--
ALTER TABLE `pms_user_logs`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `idx_userid` (`UserID`),
  ADD KEY `idx_actiontype` (`ActionType`),
  ADD KEY `idx_timestamp` (`Timestamp`);

--
-- Indexes for table `pms_vehiclecategory`
--
ALTER TABLE `pms_vehiclecategory`
  ADD PRIMARY KEY (`VehicleCategoryID`),
  ADD KEY `FK_Category_VehicleType` (`VehicleTypeID`);

--
-- Indexes for table `pms_vehicletype`
--
ALTER TABLE `pms_vehicletype`
  ADD PRIMARY KEY (`VehicleTypeID`);

--
-- Indexes for table `public_ticket_emails`
--
ALTER TABLE `public_ticket_emails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`ticket_id`),
  ADD UNIQUE KEY `ticket_code` (`ticket_code`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fixed_by` (`fixed_by`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dependants`
--
ALTER TABLE `dependants`
  MODIFY `dependant_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dependant_address`
--
ALTER TABLE `dependant_address`
  MODIFY `dependant_address_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `dependant_contact`
--
ALTER TABLE `dependant_contact`
  MODIFY `dependant_contact_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `dependant_email`
--
ALTER TABLE `dependant_email`
  MODIFY `dependant_email_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `employee_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_addresses`
--
ALTER TABLE `employee_addresses`
  MODIFY `address_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `employee_contact_numbers`
--
ALTER TABLE `employee_contact_numbers`
  MODIFY `contact_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `employee_emails`
--
ALTER TABLE `employee_emails`
  MODIFY `email_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `job_positions`
--
ALTER TABLE `job_positions`
  MODIFY `position_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leaves`
--
ALTER TABLE `leaves`
  MODIFY `leave_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pms_housekeeping_logs`
--
ALTER TABLE `pms_housekeeping_logs`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `pms_housekeeping_tasks`
--
ALTER TABLE `pms_housekeeping_tasks`
  MODIFY `TaskID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `pms_inventory`
--
ALTER TABLE `pms_inventory`
  MODIFY `ItemID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `pms_inventorylog`
--
ALTER TABLE `pms_inventorylog`
  MODIFY `InvLogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `pms_itemcategory`
--
ALTER TABLE `pms_itemcategory`
  MODIFY `ItemCategoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pms_maintenance_logs`
--
ALTER TABLE `pms_maintenance_logs`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `pms_maintenance_requests`
--
ALTER TABLE `pms_maintenance_requests`
  MODIFY `RequestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pms_parkingarea`
--
ALTER TABLE `pms_parkingarea`
  MODIFY `AreaID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `pms_parkingslot`
--
ALTER TABLE `pms_parkingslot`
  MODIFY `SlotID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `pms_parking_sessions`
--
ALTER TABLE `pms_parking_sessions`
  MODIFY `SessionID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `pms_rooms`
--
ALTER TABLE `pms_rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `pms_room_status`
--
ALTER TABLE `pms_room_status`
  MODIFY `StatusID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `pms_users`
--
ALTER TABLE `pms_users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `pms_user_logs`
--
ALTER TABLE `pms_user_logs`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=246;

--
-- AUTO_INCREMENT for table `pms_vehiclecategory`
--
ALTER TABLE `pms_vehiclecategory`
  MODIFY `VehicleCategoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `pms_vehicletype`
--
ALTER TABLE `pms_vehicletype`
  MODIFY `VehicleTypeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `public_ticket_emails`
--
ALTER TABLE `public_ticket_emails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `ticket_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_dept_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `dependants`
--
ALTER TABLE `dependants`
  ADD CONSTRAINT `dependants_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `dependant_address`
--
ALTER TABLE `dependant_address`
  ADD CONSTRAINT `dependant_address_ibfk_1` FOREIGN KEY (`dependant_id`) REFERENCES `dependants` (`dependant_id`) ON DELETE CASCADE;

--
-- Constraints for table `dependant_contact`
--
ALTER TABLE `dependant_contact`
  ADD CONSTRAINT `dependant_contact_ibfk_1` FOREIGN KEY (`dependant_id`) REFERENCES `dependants` (`dependant_id`) ON DELETE CASCADE;

--
-- Constraints for table `dependant_email`
--
ALTER TABLE `dependant_email`
  ADD CONSTRAINT `dependant_email_ibfk_1` FOREIGN KEY (`dependant_id`) REFERENCES `dependants` (`dependant_id`) ON DELETE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`position_id`) REFERENCES `job_positions` (`position_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employees_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employees_ibfk_4` FOREIGN KEY (`supervisor_id`) REFERENCES `employees` (`employee_id`) ON DELETE SET NULL;

--
-- Constraints for table `employee_addresses`
--
ALTER TABLE `employee_addresses`
  ADD CONSTRAINT `employee_addresses_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_contact_numbers`
--
ALTER TABLE `employee_contact_numbers`
  ADD CONSTRAINT `employee_contact_numbers_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_emails`
--
ALTER TABLE `employee_emails`
  ADD CONSTRAINT `employee_emails_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `job_positions`
--
ALTER TABLE `job_positions`
  ADD CONSTRAINT `job_positions_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE CASCADE;

--
-- Constraints for table `leaves`
--
ALTER TABLE `leaves`
  ADD CONSTRAINT `leaves_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leaves_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `pms_housekeeping_tasks`
--
ALTER TABLE `pms_housekeeping_tasks`
  ADD CONSTRAINT `fk_hk_tasks_assigned_user` FOREIGN KEY (`AssignedUserID`) REFERENCES `pms_users` (`UserID`),
  ADD CONSTRAINT `fk_hk_tasks_room` FOREIGN KEY (`RoomID`) REFERENCES `pms_rooms` (`room_id`),
  ADD CONSTRAINT `fk_hk_tasks_user` FOREIGN KEY (`UserID`) REFERENCES `pms_users` (`UserID`);

--
-- Constraints for table `pms_inventory`
--
ALTER TABLE `pms_inventory`
  ADD CONSTRAINT `fk_inventory_category` FOREIGN KEY (`ItemCategoryID`) REFERENCES `pms_itemcategory` (`ItemCategoryID`);

--
-- Constraints for table `pms_inventorylog`
--
ALTER TABLE `pms_inventorylog`
  ADD CONSTRAINT `fk_invlog_item` FOREIGN KEY (`ItemID`) REFERENCES `pms_inventory` (`ItemID`),
  ADD CONSTRAINT `fk_invlog_user` FOREIGN KEY (`UserID`) REFERENCES `pms_users` (`UserID`);

--
-- Constraints for table `pms_maintenance_requests`
--
ALTER TABLE `pms_maintenance_requests`
  ADD CONSTRAINT `fk_maint_req_assigned_user` FOREIGN KEY (`AssignedUserID`) REFERENCES `pms_users` (`UserID`),
  ADD CONSTRAINT `fk_maint_req_room` FOREIGN KEY (`RoomID`) REFERENCES `pms_rooms` (`room_id`),
  ADD CONSTRAINT `fk_maint_req_user` FOREIGN KEY (`UserID`) REFERENCES `pms_users` (`UserID`);

--
-- Constraints for table `pms_parkingslot`
--
ALTER TABLE `pms_parkingslot`
  ADD CONSTRAINT `fk_slot_area` FOREIGN KEY (`AreaID`) REFERENCES `pms_parkingarea` (`AreaID`),
  ADD CONSTRAINT `fk_slot_vehicletype` FOREIGN KEY (`AllowedVehicleTypeID`) REFERENCES `pms_vehicletype` (`VehicleTypeID`);

--
-- Constraints for table `pms_parking_sessions`
--
ALTER TABLE `pms_parking_sessions`
  ADD CONSTRAINT `fk_session_slot` FOREIGN KEY (`SlotID`) REFERENCES `pms_parkingslot` (`SlotID`),
  ADD CONSTRAINT `fk_session_staff` FOREIGN KEY (`StaffID_Entry`) REFERENCES `pms_users` (`UserID`),
  ADD CONSTRAINT `fk_session_vehiclecategory` FOREIGN KEY (`VehicleCategoryID`) REFERENCES `pms_vehiclecategory` (`VehicleCategoryID`),
  ADD CONSTRAINT `fk_session_vehicletype` FOREIGN KEY (`VehicleTypeID`) REFERENCES `pms_vehicletype` (`VehicleTypeID`);

--
-- Constraints for table `pms_room_status`
--
ALTER TABLE `pms_room_status`
  ADD CONSTRAINT `fk_room_status_user` FOREIGN KEY (`UserID`) REFERENCES `pms_users` (`UserID`) ON DELETE SET NULL;

--
-- Constraints for table `public_ticket_emails`
--
ALTER TABLE `public_ticket_emails`
  ADD CONSTRAINT `public_ticket_emails_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`ticket_id`) ON DELETE CASCADE;

--
-- Constraints for table `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`fixed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tickets_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
