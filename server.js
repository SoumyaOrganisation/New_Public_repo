// server.js

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cors = require('cors');
const nodemailer = require('nodemailer');
const logger = require('./logger'); // Custom logger module for logging
const multer = require('multer');

const app = express();
const port = 5000;

// SSL Certificate configuration
const privateKey = fs.readFileSync('C:\\Users\\Adminuser\\Desktop\\STAR_netcon_in_2024\\netcon.in_2024-private.key', 'utf8');
const certificate = fs.readFileSync('C:\\Users\\Adminuser\\Desktop\\STAR_netcon_in_2024\\STAR_netcon_in.crt', 'utf8');
const ca = fs.readFileSync('C:\\Users\\Adminuser\\Desktop\\STAR_netcon_in_2024\\SectigoRSADomainValidationSecureServerCA.crt', 'utf8');

// Credentials for HTTPS server
const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

// CORS configuration with allowed origins
const allowedOrigins = ['https://pulse.netcon.in', 'http://localhost:3000', 'http://10.0.2.2:5000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: Origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: 'Content-Type',
  credentials: true,
  maxAge: 86400
}));

// Pre-flight OPTIONS request handling
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', allowedOrigins.join(', '));
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Middleware to parse incoming JSON requests
app.use(express.json());

let otpCache = {};  // Temporary store for OTPs
let sessionData = {}; // Store session data including login times

// Set the path to your logs folder
const logsFolderPath = path.join(__dirname, 'logs');

// Function to get the log file path with the current date in IST timezone
function getLogFilePath() {
  const dateInIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(dateInIST);
  const year = istDate.getFullYear();
  const month = ('0' + (istDate.getMonth() + 1)).slice(-2);
  const day = ('0' + istDate.getDate()).slice(-2);
  const dateString = `${year}-${month}-${day}`;  // Format as YYYY-MM-DD
  return path.join(logsFolderPath, `logs_${dateString}.csv`); // Filename: logs_<date>.csv
}

// Function to generate a six-digit random session ID
function generateSessionId() {
  return Math.floor(100000 + Math.random() * 900000);  // Generates a random 6-digit number
}

// Function to get the current date and time in IST timezone
function getCurrentISTDateTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

// Function to log data to both the log file (.log) and CSV file
function logToBoth({ date, sessionId, email, loginStatus, failureReason = '', servicesOpted = '', activeSessionTime = '', serverStatus = 'Active', additionalFields = [] }) {
  // Log message in the .log file
  const logMessage = `Date: ${date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}, Session ID: ${sessionId}, Email: ${email}, Status: ${loginStatus}, Failure Reason: ${failureReason}, Server Status: ${serverStatus}`;
  logger.info(logMessage); // Logs to .log file

  // Log structured data to CSV file
  logToCSV({ date, sessionId, email, loginStatus, failureReason, servicesOpted, activeSessionTime, serverStatus, additionalFields });
}

// Function to append structured data into the daily CSV file
function logToCSV({ date, sessionId, email, loginStatus, failureReason = '', servicesOpted = '', activeSessionTime = '', serverStatus = 'Active', additionalFields = [] }) {
  // Date in IST timezone
  const dateString = date.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

  // Data to log, including session info, services, and additional fields
  const logData = {
    Date: dateString,
    'Unique_Session_ID': sessionId,
    'mail_ID': email,
    'Login_Status': loginStatus,
    'Failure_Reason': failureReason,
    'Services_Opted': servicesOpted,
    'Active_Session_Time': activeSessionTime,
    'Server_Status': serverStatus
  };

  // Add the 15 additional fields to logData
  for (let i = 0; i < 15; i++) {
    logData[`Additional${i + 1}`] = additionalFields[i] || ''; // Empty string for missing fields
  }

  const logFilePath = getLogFilePath(); // Get today's log file path

  // If log file doesn't exist, create it with headers
  if (!fs.existsSync(logFilePath)) {
    const header = [
      'Date', 'Unique_Session_ID', 'mail_ID', 'Login_Status', 'Failure_Reason',
      'Services_Opted', 'Active_Session_Time', 'Server_Status',
      'Additional1', 'Additional2', 'Additional3', 'Additional4', 'Additional5',
      'Additional6', 'Additional7', 'Additional8', 'Additional9', 'Additional10',
      'Additional11', 'Additional12', 'Additional13', 'Additional14', 'Additional15'
    ];

    const headerRow = header.join(',') + '\n';
    fs.writeFileSync(logFilePath, headerRow, 'utf8');  // Create file and write header
  }

  // Convert log data into a CSV row format and escape any commas in values
  const rowValues = [
    logData.Date, logData['Unique_Session_ID'], logData['mail_ID'],
    logData['Login_Status'], logData['Failure_Reason'], logData['Services_Opted'],
    logData['Active_Session_Time'], logData['Server_Status']
  ];

  // Add additional fields to row values
  for (let i = 1; i <= 15; i++) {
    rowValues.push(logData[`Additional${i}`]);
  }

  // Escape commas in values
  const escapedValues = rowValues.map(value => `"${value}"`);
  const row = escapedValues.join(',') + '\n';

  // Append the log data to the CSV file
  fs.appendFileSync(logFilePath, row, 'utf8');
}

// Session timeout duration (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Service logging endpoint - logs user services during a session
app.post('/log-service', (req, res) => {
  const { serviceName, sessionId } = req.body;
  const logFilePath = getLogFilePath();

  try {
    const csvContent = fs.readFileSync(logFilePath, 'utf8');
    const lines = csvContent.split('\n');
    const sessionIndex = findSessionIndex(lines, sessionId);

    if (sessionIndex !== -1) {
      const row = updateServiceRow(lines[sessionIndex], serviceName);
      if (row) {
        lines[sessionIndex] = row;
        fs.writeFileSync(logFilePath, lines.join('\n'), 'utf8');
        return res.status(200).send('Service logged successfully');
      } else {
        return res.status(400).send('No available fields to log the service');
      }
    } else {
      return res.status(404).send('Session not found');
    }
  } catch (error) {
    logger.error(`Error logging service: ${error.message}`);
    return res.status(500).send('Internal Server Error');
  }
});

function findSessionIndex(lines, sessionId) {
  return lines.findIndex(line => line.includes(`"${sessionId}"`));
}

function updateServiceRow(line, serviceName) {
  const servicesOptedIndex = 5;
  const additionalFieldsStartIndex = 8;
  let row = line.split(',').map(cell => cell.replace(/(^"|"$)/g, ''));
  const existingServices = getExistingServices(row, servicesOptedIndex, additionalFieldsStartIndex);

  if (existingServices.map(s => s.toLowerCase()).includes(serviceName.toLowerCase())) {
    return null; // Service already logged
  }

  if (!row[servicesOptedIndex] || row[servicesOptedIndex].trim() === '') {
    row[servicesOptedIndex] = serviceName;
  } else {
    for (let i = additionalFieldsStartIndex; i <= additionalFieldsStartIndex + 14; i++) {
      if (!row[i] || row[i].trim() === '') {
        row[i] = serviceName;
        break;
      }
    }
  }

  return row.map(value => `"${value}"`).join(',');
}

function getExistingServices(row, servicesOptedIndex, additionalFieldsStartIndex) {
  const existingServices = [];
  if (row[servicesOptedIndex] && row[servicesOptedIndex] !== 'N/A') {
    existingServices.push(row[servicesOptedIndex]);
  }
  for (let i = additionalFieldsStartIndex; i <= additionalFieldsStartIndex + 14; i++) {
    if (row[i] && row[i] !== 'N/A' && row[i].trim() !== '') {
      existingServices.push(row[i]);
    }
  }
  return existingServices;
}

// Function to check and expire sessions after 30 minutes
function checkAndExpireSessions() {
  const currentTime = Date.now();

  for (const sessionId in sessionData) {
    const session = sessionData[sessionId];
    const sessionDuration = currentTime - session.loginTime;

    if (sessionDuration >= SESSION_TIMEOUT) {
      // Expire session after timeout
      expireSession(sessionId);
    }
  }
}

// Function to expire a session and update logs
function expireSession(sessionId) {
  const session = sessionData[sessionId];
  if (session) {
    //const loginTime = session.loginTime;
    // const logoutTime = loginTime + SESSION_TIMEOUT; // 30 minutes after login

    const sessionDurationMs = SESSION_TIMEOUT;
    const sessionDurationSec = Math.floor(sessionDurationMs / 1000);

    const hours = Math.floor(sessionDurationSec / 3600);
    const minutes = Math.floor((sessionDurationSec % 3600) / 60);
    const seconds = sessionDurationSec % 60;

    const activeSessionTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update CSV log for expired session
    const logFilePath = getLogFilePath();

    let csvContent = fs.readFileSync(logFilePath, 'utf8');
    let lines = csvContent.split('\n');

    const headers = lines[0].split(',').map((h) => h.replace(/(^"|"$)/g, ''));
    const activeSessionTimeIndex = headers.indexOf('Active_Session_Time');

    let sessionIndex = lines.findIndex((line) => line.includes(`"${sessionId}"`));

    if (sessionIndex !== -1) {
      let row = lines[sessionIndex].split(',');

      // Remove quotes for processing
      row = row.map((cell) => cell.replace(/(^"|"$)/g, ''));

      // Update 'Active_Session_Time'
      row[activeSessionTimeIndex] = activeSessionTime;

      // Escape commas and wrap values in quotes
      row = row.map((value) => `"${value}"`);

      // Update the row in the CSV file
      lines[sessionIndex] = row.join(',');

      // Write the updated content back to the CSV file
      fs.writeFileSync(logFilePath, lines.join('\n'), 'utf8');
    } else {
      // Session not found in CSV
      logger.warn(`Session ID not found in CSV during expiration: ${sessionId}`);
    }

    // Remove session data
    delete sessionData[sessionId];

    // Log session expiration event
    logger.info(`Session expired after 30 minutes: Session ID: ${sessionId}, Session Duration: ${activeSessionTime}`);
  }
}

// Set an interval to check sessions every minute
setInterval(checkAndExpireSessions, 60 * 1000); // Check every 1 minute

// Function to delete log files older than 7 days
function deleteOldLogs() {
  const now = Date.now();
  const cutoffTime = now - 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  // Read logs directory and delete old log files
  const readLogsDirectory = (logsFolderPath) => {
    fs.readdir(logsFolderPath, (err, files) => {
      if (err) {
        logger.error(`Error reading logs directory: ${err.message}`);
        return;
      }
      processLogFiles(files, logsFolderPath);
    });
  };
  
  const processLogFiles = (files, logsFolderPath) => {
    files.forEach((file) => {
      if (file.endsWith('.csv')) {
        const filePath = path.join(logsFolderPath, file);
        checkFileStats(filePath);
      }
    });
  };
  
  const checkFileStats = (filePath) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        logger.error(`Error stating file ${filePath}: ${err.message}`);
        return;
      }
      deleteOldFile(filePath, stats.mtime.getTime());
    });
  };
  
  const deleteOldFile = (filePath, fileTime) => {
    if (fileTime < cutoffTime) {
      fs.unlink(filePath, (err) => handleUnlinkResult(err, filePath));
    }
  };
  
  // Call the main function
  readLogsDirectory(logsFolderPath);
  
}

function handleUnlinkResult(err, filePath) {
  if (err) {
    logger.error(`Error deleting file ${filePath}: ${err.message}`);
  } else {
    logger.info(`Deleted old log file: ${filePath}`);
  }
}

// Run the deleteOldLogs function at server start
deleteOldLogs();

// Schedule the deleteOldLogs function to run every 24 hours
setInterval(deleteOldLogs, 24 * 60 * 60 * 1000); // Every 24 hours

const combinedLogFilePath = path.join(logsFolderPath, 'combined.log');

// Function to delete log entries older than 7 days from the combined.log file
function deleteOldLogEntries() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // Set cutoff date to 7 days ago

  // Read the content of the log file
  fs.readFile(combinedLogFilePath, 'utf8', (err, data) => {
    if (err) {
      logger.error(`Error reading log file: ${err.message}`);
      return;
    }

    // Split the log file by lines
    const logLines = data.split('\n');

    // Filter out the lines that are older than 7 days
    const filteredLines = logLines.filter(line => {
      // Extract the timestamp from the line (assuming it's in a parseable format at the start of each line)
      const match = line.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/); // Matches 'YYYY-MM-DD HH:MM:SS'
      if (match) {
        const logDate = new Date(match[0]);
        return logDate >= cutoffDate;
      }
      return true; // Keep lines that don't match the date format (e.g., blank lines or corrupted entries)
    });

    // Write the filtered lines back to the log file
    fs.writeFile(combinedLogFilePath, filteredLines.join('\n'), 'utf8', (err) => {
      if (err) {
        logger.error(`Error writing log file: ${err.message}`);
      } else {
        logger.info('Old log entries deleted from combined.log');
      }
    });
  });
}

// Run the deleteOldLogEntries function at server start
deleteOldLogEntries();

// Schedule the deleteOldLogEntries function to run every 24 hours
setInterval(deleteOldLogEntries, 24 * 60 * 60 * 1000); // Every 24 hours

// Function to update Server_Status to 'Active' when the server starts
function updateServerStatusToActive() {
  const logFilePath = getLogFilePath();

  if (fs.existsSync(logFilePath)) {
    let csvContent = fs.readFileSync(logFilePath, 'utf8');
    let lines = csvContent.split('\n');

    const headers = lines[0].split(',').map((h) => h.replace(/(^"|"$)/g, ''));
    const serverStatusIndex = headers.indexOf('Server_Status');

    // Update Server_Status to 'Active' for all entries
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue; // Skip empty lines
      let row = lines[i].split(',');
      row = row.map((cell) => cell.replace(/(^"|"$)/g, '')); // Remove quotes

      row[serverStatusIndex] = 'Active';

      // Escape commas and wrap values in quotes
      row = row.map((value) => `"${value}"`);
      lines[i] = row.join(',');
    }

    // Write the updated content back to the CSV file
    fs.writeFileSync(logFilePath, lines.join('\n'), 'utf8');
    logger.info('Server_Status updated to Active in CSV logs.');
  }
}

// Run the updateServerStatusToActive function at server startup
updateServerStatusToActive();

// Login endpoint - handle login request and execute PowerShell script for user validation
app.post('/login', (req, res) => {
  const { email, mobile, employeeid } = req.body;

  // Check for missing fields
  if (!email || !mobile || !employeeid) {
    return res.status(400).send({ message: 'Missing required fields.' });
  }

  // Escape input values to prevent script injection
  const escapedEmail = email.replace(/"/g, '\\"');
  const escapedMobile = mobile.replace(/"/g, '\\"');
  const escapedEmployeeId = employeeid.replace(/"/g, '\\"');

  // PowerShell command for user validation
  const scriptPath = path.join(__dirname, 'scripts', 'NCMP_user_valiadtion.ps1');
  const args = [
    '-File',
    scriptPath,
    '-user',
    escapedEmail,
    '-user_mobile',
    escapedMobile,
    '-employeeid',
    escapedEmployeeId,
  ];

  const loginProcess = spawn('powershell.exe', args);

  let stdout = '';
  let stderr = '';

  loginProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  loginProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  loginProcess.on('close', (code) => {
    if (code !== 0) {
      // Log server error during login
      logger.error(`Login failed due to internal error for email: ${escapedEmail}, Error: ${stderr}`);
      logToBoth({
        date: getCurrentISTDateTime(),
        sessionId: 'N/A',
        email: escapedEmail,
        loginStatus: 'Failed',
        failureReason: 'Server error',
        servicesOpted: '',
        activeSessionTime: '',
        serverStatus: 'Active',
        additionalFields: []
      });
      return res.status(500).send({ message: 'Internal Server Error' });
    }

    const lines = stdout.trim().replace(/\r/g, '').split('\n');
    const lastWord = lines[lines.length - 1].trim().split(' ').pop().toLowerCase();

    if (lastWord === 'true') {
      // Login successful, proceed with sending OTP
      logger.info(`Login successful for email: ${escapedEmail}`);

      const otpScriptPath = path.join(__dirname, 'scripts', 'Sending_OTP.ps1');
      const otpArgs = ['-File', otpScriptPath, '-user', escapedEmail];

      const otpProcess = spawn('powershell.exe', otpArgs);

      let otpStdout = '';
      let otpStderr = '';

      otpProcess.stdout.on('data', (data) => {
        otpStdout += data.toString();
      });

      otpProcess.stderr.on('data', (data) => {
        otpStderr += data.toString();
      });

      otpProcess.on('close', (otpCode) => {
        if (otpCode !== 0) {
          // Log error if OTP fails
          logger.error(`Failed to send OTP for email: ${escapedEmail}, Error: ${otpStderr}`);
          logToBoth({
            date: getCurrentISTDateTime(),
            sessionId: 'N/A',
            email: escapedEmail,
            loginStatus: 'Failed',
            failureReason: 'Server error',
            servicesOpted: '',
            activeSessionTime: '',
            serverStatus: 'Active',
            additionalFields: []
          });
          return res.status(500).send({ message: 'Failed to send OTP' });
        }

        // OTP successfully sent, store OTP in cache with expiration of 1 minute
        const otpGenerated = otpStdout.trim().replace(/\r/g, '');
        otpCache[email] = otpGenerated;
        setTimeout(() => delete otpCache[email], 60000);  // 1 minute

        // Respond to client with user details and OTP status
        res.status(200).json({
          message: 'OTP sent',
          department: lines[lines.length - 2],
          name: lines[lines.length - 3],
          email: escapedEmail
        });
      });
    } else {
      // Login failed, log the failure reason and respond with appropriate message
      const failureReason = lines[lines.length - 1].trim();
      logger.warn(`Login failed for email: ${escapedEmail}, Reason: ${failureReason}`);
      res.status(401).send({ message: failureReason });

      logToBoth({
        date: getCurrentISTDateTime(),
        sessionId: 'N/A',
        email: escapedEmail,
        loginStatus: 'Failed',
        failureReason,
        servicesOpted: '',
        activeSessionTime: '',
        serverStatus: 'Active', // Server is active
        additionalFields: []
      });
    }
  });
});

// OTP validation endpoint - after OTP is validated, a session ID is generated
app.post('/validate-otp', (req, res) => {
  const { otpFromUser, email } = req.body;
  const otpStored = otpCache[email];

  if (!otpStored) {
    // OTP expired or not found
    logger.warn(`OTP validation failed: OTP expired or not found for email: ${email}`);
    res.status(400).send({ message: 'OTP not found or expired' });

    logToBoth({
      date: getCurrentISTDateTime(),
      sessionId: 'N/A',
      email,
      loginStatus: 'Failed',
      failureReason: 'Invalid OTP',
      servicesOpted: '',
      activeSessionTime: '',
      serverStatus: 'Active', // Server is active
      additionalFields: []
    });

    return;
  }

  const validateOtpCommand = spawn('powershell.exe', [
    '-File', './scripts/Validating_OTP.ps1',
    '-otp_from_user', otpFromUser,
    '-otp', otpStored,
  ]);

  let outputData = '';
  let errorData = '';

  // Collect stdout data
  validateOtpCommand.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  // Collect stderr data
  validateOtpCommand.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  // Handle process close
  validateOtpCommand.on('close', (code) => {
    if (code !== 0) {
      // Log server error during OTP validation
      logger.error(`OTP validation failed for email: ${email}, Error: ${errorData}`);
      logToBoth({
        date: getCurrentISTDateTime(),
        sessionId: 'N/A',
        email,
        loginStatus: 'Failed',
        failureReason: 'Server error',
        servicesOpted: '',
        activeSessionTime: '',
        serverStatus: 'Active',
        additionalFields: [],
      });
      return res.status(500).send({ message: 'OTP validation failed' });
    }

    if (outputData.trim().toLowerCase() === 'true') {
      // OTP validated successfully, generate session ID
      delete otpCache[email];
      const sessionId = generateSessionId();

      // Log successful OTP validation
      logger.info(`OTP verified successfully for email: ${email}, Session ID: ${sessionId}`);
      sessionData[sessionId] = { email, loginTime: Date.now() };

      logToBoth({
        date: getCurrentISTDateTime(),
        sessionId,
        email,
        loginStatus: 'Success',
        servicesOpted: 'N/A',
        activeSessionTime: 'N/A',
        serverStatus: 'Active',
        additionalFields: [],
      });

      // Send session ID to the client
      res.status(200).json({ message: 'OTP verified', sessionId });
    } else {
      // OTP validation failed
      logger.warn(`Invalid OTP for email: ${email}`);
      res.status(401).json({ message: 'Invalid OTP' });

      logToBoth({
        date: getCurrentISTDateTime(),
        sessionId: 'N/A',
        email,
        loginStatus: 'Failed',
        failureReason: 'Invalid OTP',
        servicesOpted: '',
        activeSessionTime: '',
        serverStatus: 'Active',
        additionalFields: [],
      });
    }
  });

});

// Help query submission endpoint - sends an email to support team and user
app.post('/submit-help-query', async (req, res) => {
  const { query, uname } = req.body;

  // Check for empty query
  if (!query) {
    logger.warn(`Empty help query submitted by user: ${uname}`);
    return res.status(400).json({ message: 'Query cannot be empty' });
  }

  try {
    // Configure transporter for sending emails using Office365 SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: 'netconncmp@netcon.in',
        pass: 'Pulse_2024',
      },
    });

    // Email options for sending query to the official email
    const mailOptionsOfficial = {
      from: 'netconncmp@netcon.in',
      to: 'platform@netcon.in',
      subject: `Help Query from: ${uname}`,
      text: `Hello Team,

You have received a new help query from ${uname}.

Query:
${query}

Best regards,
Platform Team
`,
    };

    // Email options for sending a copy to the user
    const mailOptionsUser = {
      from: 'netconncmp@netcon.in', // Sender address
      to: uname, // User's email address
      subject: 'Confirmation of Your Help Query Submission',
      text: `Dear ${uname},

Thank you for reaching out to us. We have received your query and will get back to you shortly. Here is a copy of your submission:

Query:
${query}

If you have any further questions, please don't hesitate to contact us.

Best regards,
Platform Team
`,
    };

    // Send email to the official email address
    await transporter.sendMail(mailOptionsOfficial, (error, info) => {
      if (error) {
        logger.error(`Email send error for user: ${uname}, Error: ${error.message}`);
        return res.status(500).json({ message: 'Failed to send email to the official account' });
      }
      logger.info(`Help query successfully submitted by user: ${uname} to official email`);
    });

    // Send a copy of the query to the user
    await transporter.sendMail(mailOptionsUser, (error, info) => {
      if (error) {
        logger.error(`Email send error to user: ${uname}, Error: ${error.message}`);
        return res.status(500).json({ message: 'Failed to send email to the user' });
      }
      logger.info(`Help query copy successfully sent to user: ${uname}`);
    });

    // Respond with success message
    res.status(200).json({ message: 'Query submitted successfully and email sent to both user and official account' });
  } catch (error) {
    logger.error(`Help query submission error for user: ${uname}, Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to submit query' });
  }
});

// Logout endpoint - logs out the user by updating session data
app.post('/logout', (req, res) => {
  const { sessionId } = req.body;

  // Check if sessionId is provided
  if (!sessionId) {
    logger.warn(`Logout attempt with missing sessionId. Session ID: 'N/A'`);
    return res.status(400).json({ message: 'Session ID is required for logout.' });
  }

  const session = sessionData[sessionId];
  if (!session) {
    // Session not found
    logger.warn(`Logout attempt with invalid sessionId: ${sessionId}`);
    return res.status(400).json({ message: 'Invalid session ID.' });
  }

  // Calculate session duration
  const loginTime = session.loginTime;
  const logoutTime = Date.now();
  const sessionDurationMs = logoutTime - loginTime;
  const sessionDurationSec = Math.floor(sessionDurationMs / 1000);

  const hours = Math.floor(sessionDurationSec / 3600);
  const minutes = Math.floor((sessionDurationSec % 3600) / 60);
  const seconds = sessionDurationSec % 60;

  const activeSessionTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Update CSV log with session duration
  const logFilePath = getLogFilePath();

  let csvContent = fs.readFileSync(logFilePath, 'utf8');
  let lines = csvContent.split('\n');

  const headers = lines[0].split(',').map((h) => h.replace(/(^"|"$)/g, ''));
  const activeSessionTimeIndex = headers.indexOf('Active_Session_Time');

  let sessionIndex = lines.findIndex((line) => line.includes(`"${sessionId}"`));

  if (sessionIndex !== -1) {
    let row = lines[sessionIndex].split(',');

    // Remove quotes from CSV values for processing
    row = row.map((cell) => cell.replace(/(^"|"$)/g, ''));

    // Update 'Active_Session_Time'
    row[activeSessionTimeIndex] = activeSessionTime;

    // Escape commas and wrap values in quotes
    row = row.map((value) => `"${value}"`);

    // Update the row in the CSV file
    lines[sessionIndex] = row.join(',');

    // Write the updated content back to the CSV file
    fs.writeFileSync(logFilePath, lines.join('\n'), 'utf8');
  } else {
    // Session not found in CSV
    logger.warn(`Logout attempt with sessionId not found in CSV: ${sessionId}`);
    return res.status(400).json({ message: 'Session ID not found.' });
  }

  // Remove session data
  delete sessionData[sessionId];

  // Log logout event with session duration
  logger.info(`User logged out: Session ID: ${sessionId}, Session Duration: ${activeSessionTime}`);

  // Respond to the client
  res.status(200).json({ message: 'You have logged out successfully' });
});

// First, ensure the uploads directory exists when the server starts
const uploadDir = path.join(__dirname, 'uploads\\profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// First, configure multer to handle the file upload
// Configure multer to handle the file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'temp_' + Date.now()); // Temporarily save the file with a unique name
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('profileImage');

app.post('/upload-profile-image', (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      logger.error(`Upload error: ${err.message}`);
      return res.status(500).json({ message: 'Error uploading file' });
    }

    try {
      console.log('Form data received:', req.body);

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      if (!req.body.email) {
        return res.status(400).json({ message: 'No email provided' });
      }

      // Get the sanitized email
      const userEmail = req.body.email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      // Get the file extension
      const fileExtension = path.extname(req.file.originalname) || '.jpg';

      // Rename the temp file to include the email and correct extension
      const tempPath = req.file.path;
      const targetPath = path.join(uploadDir, `${userEmail}${fileExtension}`);

      fs.renameSync(tempPath, targetPath);

      logger.info(`Profile image uploaded successfully for user: ${userEmail}`);

      res.status(200).json({
        message: 'Profile image uploaded successfully',
        fileName: `${userEmail}${fileExtension}`
      });
    } catch (error) {
      logger.error(`Error processing upload: ${error.message}`);
      res.status(500).json({ message: 'Error processing upload' });
    }
  });
});


// Serve static files from uploads directory with error handling
app.use('/uploads', (req, res, next) => {
  express.static(path.join(__dirname, 'uploads'))(req, res, (err) => {
    if (err) {
      logger.error(`Static file serve error: ${err.message}`);
      return res.status(500).json({ message: 'Error serving file' });
    }
    next();
  });
});

// Start the HTTPS server
const httpsServer = https.createServer(credentials, app);

// Server listening on the specified port
httpsServer.listen(port, '0.0.0.0', () => {
  logger.info(`HTTPS Server running on https://0.0.0.0:${port}`);
  console.log(`HTTPS Server running on https://0.0.0.0:${port}`);
});

// Handle graceful shutdown to update Server_Status to 'Inactive'
function handleShutdown() {
  logger.info('Server is shutting down, updating Server_Status to Inactive in logs.');

  // Update Server_Status to 'Inactive' in the CSV logs
  const logFilePath = getLogFilePath();

  if (fs.existsSync(logFilePath)) {
    let csvContent = fs.readFileSync(logFilePath, 'utf8');
    let lines = csvContent.split('\n');

    const headers = lines[0].split(',').map((h) => h.replace(/(^"|"$)/g, ''));
    const serverStatusIndex = headers.indexOf('Server_Status');

    // Update Server_Status to 'Inactive' for all entries
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue; // Skip empty lines
      let row = lines[i].split(',');
      row = row.map((cell) => cell.replace(/(^"|"$)/g, '')); // Remove quotes

      row[serverStatusIndex] = 'Inactive';

      // Escape commas and wrap values in quotes
      row = row.map((value) => `"${value}"`);
      lines[i] = row.join(',');
    }

    // Write the updated content back to the CSV file
    fs.writeFileSync(logFilePath, lines.join('\n'), 'utf8');
    logger.info('Server_Status updated to Inactive in CSV logs.');
  }

  process.exit(0);
}

// Listen for termination signals to handle graceful shutdown
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Add this new endpoint to get profile image
app.get('/get-profile-image/:email', (req, res) => {
  try {
    const userEmail = req.params.email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const imageDir = path.join(__dirname, 'uploads', 'profile-images');

    // Find the image file with the user's email as the prefix
    const files = fs.readdirSync(imageDir);
    const imageFile = files.find(file => file.startsWith(userEmail));

    if (imageFile) {
      const imagePath = path.join(imageDir, imageFile);
      res.sendFile(imagePath, (err) => {
        if (err) {
          logger.error(`Error sending file: ${err.message}`);
          res.status(500).send('Error sending file');
        }
      });
    } else {
      logger.info(`No profile image found for ${userEmail}`);
      res.status(404).send('No profile image found');
    }
  } catch (error) {
    logger.error(`Error in get-profile-image: ${error.message}`);
    res.status(500).send('Server error');
  }
});