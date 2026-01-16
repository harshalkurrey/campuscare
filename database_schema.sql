-- CampusCare Database Schema
CREATE DATABASE IF NOT EXISTS campuscaredb;
USE campuscaredb;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL,
    erp VARCHAR(50),
    course VARCHAR(255),
    admin_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('complaint', 'suggestion') NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    urgent BOOLEAN DEFAULT FALSE,
    file_path VARCHAR(500),
    status ENUM('new', 'in_progress', 'resolved', 'closed') DEFAULT 'new',
    admin_response TEXT,
    rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT IGNORE INTO users (name, email, password, role, admin_points) VALUES
('Admin User', 'admin@campuscaredb.com', '$2b$10$8K3VzJcQX8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK', 'admin', 0);

-- Sample data for testing
INSERT IGNORE INTO users (name, email, password, role, erp, course) VALUES
('John Doe', 'john@student.com', '$2b$10$8K3VzJcQX8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK', 'student', 'ERP001', 'Computer Science'),
('Jane Smith', 'jane@student.com', '$2b$10$8K3VzJcQX8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK8dQK', 'student', 'ERP002', 'Mechanical Engineering');</content>
<parameter name="filePath">c:\Users\hp\OneDrive\Desktop\practice projects\My Sites\final project\database_schema.sql