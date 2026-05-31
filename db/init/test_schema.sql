-- Minimal schema for running integration tests
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `user` (
  `id` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fullName` varchar(255) DEFAULT NULL,
  `role` varchar(64) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `productCategory` (
  `id` varchar(64) NOT NULL,
  `categoryName` varchar(255) NOT NULL,
  `businessType` varchar(128) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `product` (
  `id` varchar(64) NOT NULL,
  `categoryId` varchar(64) DEFAULT NULL,
  `productName` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0,
  `stockQuantity` int DEFAULT 0,
  `productType` varchar(64) DEFAULT NULL,
  `businessType` varchar(128) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order` (
  `id` varchar(64) NOT NULL,
  `orderNumber` varchar(255) DEFAULT NULL,
  `userId` varchar(64) DEFAULT NULL,
  `totalAmount` decimal(10,2) DEFAULT 0,
  `paymentMethod` varchar(64) DEFAULT NULL,
  `status` varchar(64) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orderItem` (
  `id` varchar(64) NOT NULL,
  `orderId` varchar(64) DEFAULT NULL,
  `productId` varchar(64) DEFAULT NULL,
  `quantity` int DEFAULT 1,
  `unitPrice` decimal(10,2) DEFAULT 0,
  `subtotal` decimal(10,2) DEFAULT 0,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payment` (
  `id` varchar(64) NOT NULL,
  `orderId` varchar(64) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT 0,
  `method` varchar(64) DEFAULT NULL,
  `status` varchar(64) DEFAULT NULL,
  `transactionId` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orderStatusHistory` (
  `id` varchar(64) NOT NULL,
  `orderId` varchar(64) DEFAULT NULL,
  `previousStatus` varchar(64) DEFAULT NULL,
  `newStatus` varchar(64) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `updatedBy` varchar(64) DEFAULT NULL,
  `notes` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orderNotification` (
  `id` varchar(64) NOT NULL,
  `orderId` varchar(64) DEFAULT NULL,
  `type` varchar(64) DEFAULT NULL,
  `payload` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
