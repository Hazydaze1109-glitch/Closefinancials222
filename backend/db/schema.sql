-- Create database
CREATE DATABASE IF NOT EXISTS close_finance;
USE close_finance;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  location VARCHAR(255) NOT NULL,
  hasActiveApplication INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Loan applications table
CREATE TABLE IF NOT EXISTS loan_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  loanType ENUM('business', 'personal') NOT NULL,
  status ENUM('Processing', 'Accepted', 'Final Steps', 'Completed') DEFAULT 'Processing',
  fullName VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(320) NOT NULL,
  
  -- Business loan fields
  businessName VARCHAR(255),
  businessAddress VARCHAR(255),
  cityState VARCHAR(255),
  country VARCHAR(255),
  timeInBusiness VARCHAR(50),
  industry VARCHAR(100),
  loanPurpose VARCHAR(100),
  loanAmount VARCHAR(50),
  loanTerm VARCHAR(50),
  annualRevenue VARCHAR(50),
  existingDebt DECIMAL(12,2),
  
  -- Personal loan fields
  loanAmountPersonal VARCHAR(50),
  loanPurposePersonal VARCHAR(255),
  loanTermPersonal VARCHAR(50),
  addressHistory TEXT,
  employmentHistory TEXT,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_loan_applications_userId ON loan_applications(userId);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_admin_users_email ON admin_users(email);
