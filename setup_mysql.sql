CREATE DATABASE IF NOT EXISTS arianation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'arianation_user'@'localhost' IDENTIFIED BY 'AriaNation@2024';
GRANT ALL PRIVILEGES ON arianation_db.* TO 'arianation_user'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database dan User berhasil dibuat!' AS status;
