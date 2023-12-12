const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
  jwtSecret: 'zxSA8Df5dQ3WE15&&',
  dbConfig: {
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'counselor',
    waitForConnections: true,
  },
};

// Pool de Conexão MySQL
const pool = mysql.createPool(config.dbConfig);

app.use(bodyParser.json());

// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  const tokenWithoutBearer = token.replace('Bearer ', '');

  jwt.verify(tokenWithoutBearer, config.jwtSecret, (err, user) => {
    if (err) {
      console.error('Error verifying token:', err.message);
      return res.status(403).json({ error: 'Token verification failed' });
    }

    req.user = user;
    next();
  });
};



// Login API to generate JWT token
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Replace with your actual authentication logic
    const [user] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);

    if (user.length > 0) {
      const isPasswordValid = await bcrypt.compare(password, user[0].password_hash);

      if (isPasswordValid) {
        const token = jwt.sign({ id: user[0].user_id }, 'zxSA8Df5dQ3WE15&&', {
          expiresIn: 86400 // expires in 24 hours
        });

        res.status(200).json({ auth: true, token: token });
      } else {
        res.status(401).json({ auth: false, message: 'Invalid credentials.' });
      }
    } else {
      res.status(401).json({ auth: false, message: 'Invalid credentials.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// exemplo

// # Dados de login
// $loginData = @{
//     username = "filipe.masini"
//     password = "filipe"
// }

// # Fazendo a requisição de login
// $response = Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method Post -Body ($loginData | ConvertTo-Json) -ContentType "application/json"

// # Exibindo a resposta
// $response



// Insert Member API
app.post('/api/members', async (req, res) => {
  try {
    const { name, phone, email, cpf, address, companies } = req.body;

    const [result] = await pool.query('INSERT INTO member (name, phone, email, cpf) VALUES (?, ?, ?, ?)', [name, phone, email, cpf]);
    const memberId = result.insertId;

    if (address) {
      await pool.query('INSERT INTO address (member_id, street, number, cep, additional_info) VALUES (?, ?, ?, ?, ?)',
        [memberId, address.street, address.number, address.cep, address.additional_info]);
    }

    if (companies && companies.length > 0) {
      for (const company of companies) {
        await pool.query('INSERT INTO company (member_id, name, cnpj, industry, employees_count, revenue) VALUES (?, ?, ?, ?, ?, ?)',
          [memberId, company.name, company.cnpj, company.industry, company.employees_count, company.revenue]);
      }
    }

    res.status(201).json({ memberId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// exemplo de requisição:

// # Definindo os dados do novo membro
// $body = @{
//   name = "Novo Membro"
//   phone = "987654321"
//   email = "novo.membro@example.com"
//   cpf = "123.456.789-00"
//   address = @{
//     street = "123 New Street"
//     number = 456
//     cep = "54321-098"
//     additional_info = "Apt 789"
//   }
//   companies = @(
//     @{
//       name = "Empresa 1"
//       cnpj = "11.222.333/0001-44"
//       industry = "Indústria 1"
//       employees_count = 50
//       revenue = 500000.00
//     },
//     @{
//       name = "Empresa 2"
//       cnpj = "22.333.444/0001-55"
//       industry = "Indústria 2"
//       employees_count = 75
//       revenue = 750000.00
//     },
//     @{
//       name = "Empresa 3"
//       cnpj = "33.444.555/0001-66"
//       industry = "Indústria 3"
//       employees_count = 100
//       revenue = 1000000.00
//     },
//     @{
//       name = "Empresa 4"
//       cnpj = "44.555.666/0001-77"
//       industry = "Indústria 4"
//       employees_count = 125
//       revenue = 1250000.00
//     },
//     @{
//       name = "Empresa 5"
//       cnpj = "55.666.777/0001-88"
//       industry = "Indústria 5"
//       employees_count = 150
//       revenue = 1500000.00
//     }
//   )
// }

// # Fazendo a requisição HTTP para adicionar o membro
// Invoke-RestMethod -Uri "http://localhost:3000/api/members" -Method Post -Body ($body | ConvertTo-Json) -ContentType "application/json"

// Update Member API
app.put('/api/members/:memberId',verifyToken, async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const { name, phone, email, cpf, address, companies } = req.body;

    await pool.query('UPDATE member SET name = ?, phone = ?, email = ?, cpf = ? WHERE member_id = ?', [name, phone, email, cpf, memberId]);

    if (address) {
      await pool.query('UPDATE address SET street = ?, number = ?, cep = ?, additional_info = ? WHERE member_id = ?',
        [address.street, address.number, address.cep, address.additional_info, memberId]);
    }

    // Delete existing companies for the member
    await pool.query('DELETE FROM company WHERE member_id = ?', [memberId]);

    // Insert updated companies
    if (companies && companies.length > 0) {
      for (const company of companies) {
        await pool.query('INSERT INTO company (member_id, name, cnpj, industry, employees_count, revenue) VALUES (?, ?, ?, ?, ?, ?)',
          [memberId, company.name, company.cnpj, company.industry, company.employees_count, company.revenue]);
      }
    }

    res.status(200).json({ message: 'Member updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// exemplo

// # Token JWT
// $token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzAyMzQ4NTM0LCJleHAiOjE3MDI0MzQ5MzR9.XGL_iWOvU_0Sx8W2QL_w4Em5VeBcIu_xRX-R3kl1u3Y"

// # Dados para a atualização
// $updateData = @{
//     name = "Novo Nome"
//     phone = "987654321"
//     email = "novo.email@example.com"
//     cpf = "987.654.321-09"
//     address = @{
//         street = "456 Nova Rua"
//         number = 789
//         cep = "54321-098"
//         additional_info = "Apto 987"
//     }
//     companies = @(
//         @{
//             name = "Nova Empresa"
//             cnpj = "11.222.333/0001-44"
//             industry = "Nova Indústria"
//             employees_count = 50
//             revenue = 500000.00
//         }
//     )
// }

// # Fazendo a requisição de atualização com token
// Invoke-RestMethod -Uri "http://localhost:3000/api/members/1" -Method Put -Headers @{ "Authorization" = "Bearer $token" } -Body ($updateData | ConvertTo-Json) -ContentType "application/json"


// Delete Member API
app.delete('/api/members/:memberId', verifyToken, async (req, res) => {
  try {
    const memberId = req.params.memberId;

    // Delete member's address
    await pool.query('DELETE FROM address WHERE member_id = ?', [memberId]);

    // Delete member's companies
    await pool.query('DELETE FROM company WHERE member_id = ?', [memberId]);

    // Delete member
    await pool.query('DELETE FROM member WHERE member_id = ?', [memberId]);

    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// exemplo

// Invoke-RestMethod -Uri "http://localhost:3000/api/members/1" -Method Delete -Headers @{ "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzAyMzQ4NTM0LCJleHAiOjE3MDI0MzQ5MzR9.XGL_iWOvU_0Sx8W2QL_w4Em5VeBcIu_xRX-R3kl1u3Y" } -ContentType "application/json"


// List Members API
app.get('/api/members', async (req, res) => {
  try {
    const [members] = await pool.query('SELECT * FROM member');
    res.status(200).json({ members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// exemplo de requisição

// Invoke-RestMethod -Uri "http://localhost:3000/api/members" -Method Get


// Member Details API
app.get('/api/members/:memberId', async (req, res) => {
  try {
    const memberId = req.params.memberId;

    const [member] = await pool.query('SELECT * FROM member WHERE member_id = ?', [memberId]);
    const [address] = await pool.query('SELECT * FROM address WHERE member_id = ?', [memberId]);
    const [companies] = await pool.query('SELECT * FROM company WHERE member_id = ?', [memberId]);

    res.status(200).json({ member, address, companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// exemplo de requisição

// Invoke-RestMethod -Uri "http://localhost:3000/api/members/1" -Method Get


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
