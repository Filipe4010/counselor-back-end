-- Create a Schema
CREATE SCHEMA counselor;

-- User Table
CREATE TABLE counselor.user (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Address Table
CREATE TABLE counselor.address (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    street VARCHAR(255) NOT NULL,
    number INT,
    cep VARCHAR(10),
    additional_info VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES counselor.user(user_id)
);

-- Company Table
CREATE TABLE counselor.company (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    industry VARCHAR(255),
    employees_count INT,
    revenue DECIMAL(15,2),
    FOREIGN KEY (user_id) REFERENCES counselor.user(user_id)
);
