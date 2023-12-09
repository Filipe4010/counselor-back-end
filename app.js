const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// MySQL Connection
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'counselor',
    waitForConnections: true,
});

// API Routes

// Create User
app.post('/api/users', async (req, res) => {
    try {
        const { name, phone, email, cpf, username, password, address, companies } = req.body;

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create Connection from the Pool
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Create Address
            const [addressResult] = await connection.query('INSERT INTO address SET ?', [address]);
            const addressId = addressResult.insertId;

            // Create Companies
            const companyIds = await Promise.all(companies.map(async company => {
                const [companyResult] = await connection.query('INSERT INTO company SET ?', [company]);
                return companyResult.insertId;
            }));

            // Create User
            const [userResult] = await connection.query('INSERT INTO user SET ?', {
                name,
                phone,
                email,
                cpf,
                username,
                password_hash,
            });
            const userId = userResult.insertId;

            // Update Address and Companies with User ID
            await connection.query('UPDATE address SET user_id = ? WHERE address_id = ?', [userId, addressId]);
            await Promise.all(companyIds.map(companyId =>
                connection.query('UPDATE company SET user_id = ? WHERE company_id = ?', [userId, companyId])
            ));

            await connection.commit();

            res.status(201).json({ userId, addressId, companyIds });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Update User
app.put('/api/users/:userId', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const userId = req.params.userId;
        const { name, phone, email, cpf, address, companiesToAdd, companiesToRemove } = req.body;

        const cpfCheck = await connection.query('SELECT user_id FROM user WHERE cpf = ? AND user_id <> ?', [cpf, userId]);
        console.log("cpf:" + cpf)
        if (cpfCheck.userId != null) {
            await connection.rollback();
            return res.status(400).json({ error: 'CPF already in use' });
        }

        // Update User
        await connection.query('UPDATE user SET name = ?, phone = ?, email = ?, cpf = ? WHERE user_id = ?', [name, phone, email, cpf, userId]);

        // Update Address
        if (address) {
            await connection.query('UPDATE address SET street = ?, number = ?, cep = ?, additional_info = ? WHERE user_id = ?', [address.street, address.number, address.cep, address.additional_info, userId]);
        }

        // Add Companies
        if (companiesToAdd) {
            for (const company of companiesToAdd) {
                const cnpjCheck = await connection.query('SELECT company_id FROM company WHERE cnpj = ? AND user_id <> ?', [company.cnpj, userId]);
                if (cnpjCheck.company_id != null) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'CNPJ already in use' });
                } else {
                    // Adicionar nova empresa
                    await connection.query('INSERT INTO company (user_id, name, cnpj, industry, employees_count, revenue) VALUES (?, ?, ?, ?, ?, ?)',
                        [userId, company.name, company.cnpj, company.industry, company.employees_count, company.revenue]);
                }
            }
        }

        // Remove Companies
        if (companiesToRemove && companiesToRemove.length > 0) {
            for (const companyId of companiesToRemove) {
                await connection.query('DELETE FROM company WHERE company_id = ? AND user_id = ?', [companyId, userId]);
            }
        }

        await connection.commit();

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        connection.release();
    }
});





// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


// request
