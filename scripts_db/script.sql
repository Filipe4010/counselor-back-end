-- Create a Schema
CREATE SCHEMA counselor;

-- Member Table
CREATE TABLE counselor.member (
    member_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL
);

-- Address Table
CREATE TABLE counselor.address (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    street VARCHAR(255) NOT NULL,
    number INT,
    cep VARCHAR(10),
    additional_info VARCHAR(255),
    FOREIGN KEY (member_id) REFERENCES counselor.member(member_id)
);

-- Company Table
CREATE TABLE counselor.company (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    industry VARCHAR(255),
    employees_count INT,
    revenue DECIMAL(15,2),
    FOREIGN KEY (member_id) REFERENCES counselor.member(member_id)
);

-- Member-Company Relationship Table (many-to-many)
CREATE TABLE counselor.member_company (
    member_id INT,
    company_id INT,
    PRIMARY KEY (member_id, company_id),
    FOREIGN KEY (member_id) REFERENCES counselor.member(member_id),
    FOREIGN KEY (company_id) REFERENCES counselor.company(company_id)
);
