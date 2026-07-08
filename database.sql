CREATE DATABASE IF NOT EXISTS expense_tracker;
USE expense_tracker;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `account` varchar(255) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `toAccount` varchar(255) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `investments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sn` int(11) DEFAULT NULL,
  `inv` varchar(255) DEFAULT NULL,
  `plan` varchar(255) DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `start` varchar(100) DEFAULT NULL,
  `dop` varchar(100) DEFAULT NULL,
  `platform` varchar(255) DEFAULT NULL,
  `num` varchar(255) DEFAULT NULL,
  `app` varchar(255) DEFAULT NULL,
  `policy` varchar(255) DEFAULT NULL,
  `bank` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `emi_plans` (
  `id` BIGINT(20) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `totalAmount` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `emi_rows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_id` BIGINT(20) NOT NULL,
  `date` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Unpaid',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`plan_id`) REFERENCES `emi_plans`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
