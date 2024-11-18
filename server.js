const express = require('express');
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

// SSL Certificate
const privateKey = fs.readFileSync('C:\\Users\\Adminuser\\Desktop\\STAR_netcon_in_2024\\netcon.in_2024-private.key', 'utf8');
const certificate = fs.readFileSync('C:\\Users\\Adminuser\\Desktop\\STAR_netcon_in_2024\\STAR_netcon_in.crt', 'utf8');
const ca = fs.readFileSync('C:\\Users\\Adminuser\\Desktop\\STAR_netcon_in_2024\\USERTrustRSAAAACA.crt', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

// CORS configurationcd 
const allowedOrigins = ['https://netconpulse.netcon.in', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: 'Content-Type',
  credentials: true,  // If you need to send credentials (like cookies)
}));

// Explicitly handle OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', allowedOrigins.join(', ')); // Set allowed origins
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200); // Respond with 200 for preflight checks
});

// Parse JSON request bodies
app.use(bodyParser.json());

app.post('/login', (req, res) => {
  const { email, mobile, surname } = req.body;

  // Escape any special characters in the user inputs
  const escapedEmail = email.replace(/"/g, '\\"');
  const escapedMobile = mobile.replace(/"/g, '\\"');
  const escapedSurname = surname.replace(/"/g, '\\"');

  // Call the PowerShell script
  const command = `powershell.exe -File "./scripts/NCMP_user_valiadtion.ps1" -user "${escapedEmail}" -user_mobile "${escapedMobile}" -user_surname "${escapedSurname}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send('Internal Server Error');
    }

    // Process stdout to determine the response
    const lines = stdout.trim().split('\n');
    const lastLine = lines[lines.length - 1].trim();
    const lastWord = lastLine.split(' ').pop().toLowerCase();

    if (lastWord === 'true') {
      const nameLine = lines[lines.length - 3].trim(); // Get the name
      const name = nameLine.split(':').pop().trim();
      const departmentLine = lines[lines.length - 2].trim(); // Get the department
      const department = departmentLine.split(':').pop().trim();
      res.status(200).json({ message: 'Login successful', department, name });
    } else if (stdout.includes('Username details are incorrect')) {
      res.status(401).send('Invalid credentials');
    } else if (stdout.startsWith('User') && stdout.includes('is not available')) {
      res.status(404).send('User not found');
    } else {
      res.status(500).send('Unknown error occurred');
    }
  });
});

// Start the HTTPS server
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, '0.0.0.0', () => {
  console.log(`HTTPS Server running on https://0.0.0.0:${port}`);
});