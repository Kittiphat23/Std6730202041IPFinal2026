-- Final Exam: Internet Programming (2026)
-- Database Table Creation for ip_std6730202041
-- Table Name: final_employees

CREATE DATABASE IF NOT EXISTS `ip_std6730202041` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ip_std6730202041`;

CREATE TABLE IF NOT EXISTS `final_employees` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `position` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `salary` DOUBLE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Mock Data (at least 5 employees as required by exam)
INSERT INTO `final_employees` (`id`, `name`, `position`, `status`, `salary`) VALUES
('1', 'John Doe', 'Software Engineer', 'Active', 45000),
('2', 'Jane Smith', 'Senior Developer', 'Active', 75000),
('3', 'Michael Scott', 'Regional Manager', 'On Leave', 95000),
('4', 'Pam Beesly', 'Office Administrator', 'Active', 22000),
('5', 'Jim Halpert', 'Sales Specialist', 'Active', 48000),
('6', 'Dwight Schrute', 'Assistant to Regional Manager', 'Active', 52000),
('7', 'Kevin Malone', 'Accountant', 'On Leave', 25000),
('8', 'Stanley Hudson', 'Senior Sales Executive', 'Active', 82000)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
