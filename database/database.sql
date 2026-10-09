CREATE DATABASE IF NOT EXISTS dashboard_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dashboard_demo;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(30) NOT NULL DEFAULT 'user',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    widget VARCHAR(100) NOT NULL,
    position_x INT NOT NULL DEFAULT 0,
    position_y INT NOT NULL DEFAULT 0,
    width INT NOT NULL DEFAULT 4,
    height INT NOT NULL DEFAULT 3,
    visible TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_dashboard_user_widget (user_id, widget),
    CONSTRAINT fk_dashboard_widgets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS capteur_data (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_capteur VARCHAR(50) NOT NULL,
    value DOUBLE NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sensor_time (name_capteur, recorded_at)
);

INSERT INTO users (id, username, role) VALUES (1, 'maxime', 'admin'), (2, 'utilisateur', 'user')
ON DUPLICATE KEY UPDATE username = VALUES(username), role = VALUES(role);

INSERT INTO dashboard_widgets (user_id, widget, position_x, position_y, width, height, visible) VALUES
(1, 'distance', 0, 0, 4, 3, 1),
(1, 'temperature', 4, 0, 5, 3, 1),
(1, 'camera', 9, 0, 3, 3, 1),
(1, 'buzzer', 0, 3, 6, 3, 1)
ON DUPLICATE KEY UPDATE position_x=VALUES(position_x), position_y=VALUES(position_y), width=VALUES(width), height=VALUES(height), visible=VALUES(visible);