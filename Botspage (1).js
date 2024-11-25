import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { FaCaretDown } from 'react-icons/fa';
// import { FaNetworkWired, FaCloud, FaServer, FaHdd, FaPlug, FaDatabase, FaUsers, FaEnvelope, FaFileAlt, FaCogs, FaFile, FaUser, FaFolder, FaExchangeAlt, FaFileExcel, FaFileCsv, FaCloudUploadAlt, FaFilePdf, FaFileCode, FaChartLine } from 'react-icons/fa';
import './botpage.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { token } from './token';

import networkIcon from "../assets/Bot Images/Simple Bots/Network.png";
import cloudIcon from '../assets/Bot Images/Simple Bots/cloud.png';
import vmwareIcon from '../assets/Bot Images/Simple Bots/VmWare.png';
import storageIcon from '../assets/Bot Images/Simple Bots/Storage.png';
import middlewareIcon from '../assets/Bot Images/Simple Bots/Middleware.png';
import databaseIcon from '../assets/Bot Images/Simple Bots/Database.png';
import adIcon from '../assets/Bot Images/Simple Bots/Active Directory.png';
import exchangeIcon from '../assets/Bot Images/Simple Bots/Exchange.png';
import o365Icon from '../assets/Bot Images/Simple Bots/o365.jpg';

import sharepointIcon from '../assets/Bot Images/Enterprise Application Bots/Sharepoint.png';
import sapIcon from '../assets/Bot Images/Enterprise Application Bots/SAP.png';
import sfdcIcon from '../assets/Bot Images/Enterprise Application Bots/SFDC.jpg';
import dataStageIcon from '../assets/Bot Images/Enterprise Application Bots/Data Stage.png';
import documentumIcon from '../assets/Bot Images/Enterprise Application Bots/Documentum.png';
import informaticaIcon from '../assets/Bot Images/Enterprise Application Bots/Informatica.png';
import salesforceIcon from '../assets/Bot Images/Enterprise Application Bots/Salesforce.png';

import fileOpsIcon from '../assets/Bot Images/Custom Applications Bots/File Operations.png';
import conversionUtilsIcon from '../assets/Bot Images/Custom Applications Bots/Conversion Utilities.png';
import excelOpsIcon from '../assets/Bot Images/Custom Applications Bots/Excel Operations.png';
import dbOpsIcon from '../assets/Bot Images/Custom Applications Bots/Database Operations.png';
import csvOpsIcon from '../assets/Bot Images/Custom Applications Bots/CSV Operations.png';
import ftpOpsIcon from '../assets/Bot Images/Custom Applications Bots/FTP Operations.png';
import pdfOpsIcon from '../assets/Bot Images/Custom Applications Bots/PDF Operations.png';
import xmlOpsIcon from '../assets/Bot Images/Custom Applications Bots/XML Operations.png';
import logAnalysisIcon from '../assets/Bot Images/Custom Applications Bots/Log Operations.png';

const Bots = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false); // Track which dropdown is open
  const navigate = useNavigate();

  const dropdownRef = useRef(null); // Reference for dropdown
  const popupRef = useRef(null);
  const showPopupRef = useRef(false);

  const name = localStorage.getItem('name') || '';
  const email = localStorage.getItem('email') || '';
  const department = localStorage.getItem('department') || '';

  // New state variables for chat functionality
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [chatStep, setChatStep] = useState('initial');
  const currentQueryTypeRef = useRef('');
  const [queries, setQueries] = useState([]);
  const [messageTimestamps, setMessageTimestamps] = useState([]);

  // Refs for the chatbot popup and messages container
  const chatBotRef = useRef(null);
  const messagesEndRef = useRef(null); // Reference to the messages container

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popupContent, setPopupContent] = useState({ title: '', files: [] });
  const [selectedFile, setSelectedFile] = useState(null);

  const closePopup = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
  };

  // Close dropdown and chatbot if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      // Close chatbot if clicked outside
      if (chatBotRef.current && !chatBotRef.current.contains(event.target)) {
        setShowChatbot(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      // Close popup if clicked outside
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        showPopupRef.current = false; // Update the ref value
        document.getElementById('popup').classList.remove('visible'); // Hide the popup
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Base URLs for each category
  // const baseURLs = {
  //   'Simple Bots': 'https://github.com/NCMPAutomation/Pulse_Bots/tree/Simple-Bots/',
  //   'Enterprise Application Bots': 'https://github.com/NCMPAutomation/Pulse_Bots/tree/Enterprise-Application-Bots/',
  //   'Custom Applications': 'https://github.com/NCMPAutomation/Pulse_Bots/tree/Custom-Applications-Bots/'
  // };

  const botOptions = {
    'Simple Bots': [
      { icon: <img src={networkIcon} alt="Network" className="bot-icon" />, label: 'Network' },
      { icon: <img src={cloudIcon} alt="Cloud" className="bot-icon" />, label: 'Cloud' },
      { icon: <img src={vmwareIcon} alt="VMware" className="bot-icon" />, label: 'VMware' },
      { icon: <img src={storageIcon} alt="Storage" className="bot-icon" />, label: 'Storage' },
      { icon: <img src={middlewareIcon} alt="Middleware" className="bot-icon" />, label: 'Middleware' },
      { icon: <img src={databaseIcon} alt="Database" className="bot-icon" />, label: 'Database' },
      { icon: <img src={adIcon} alt="Active Directory" className="bot-icon" />, label: 'Active directory' },
      { icon: <img src={exchangeIcon} alt="Exchange" className="bot-icon" />, label: 'Exchange' },
      { icon: <img src={o365Icon} alt="O365" className="bot-icon" />, label: 'O365' },
    ],
    'Enterprise Application Bots': [
      { icon: <img src={sharepointIcon} alt="SharePoint" className="bot-icon" />, label: 'Sharepoint' },
      { icon: <img src={sapIcon} alt="SAP" className="bot-icon" />, label: 'SAP' },
      { icon: <img src={sfdcIcon} alt="SFDC" className="bot-icon" />, label: 'SFDC' },
      { icon: <img src={dataStageIcon} alt="Data Stage" className="bot-icon" />, label: 'Datastage' },
      { icon: <img src={documentumIcon} alt="Documentum" className="bot-icon" />, label: 'Documentum' },
      { icon: <img src={informaticaIcon} alt="Informatica" className="bot-icon" />, label: 'Informatica' },
      { icon: <img src={salesforceIcon} alt="Salesforce" className="bot-icon" />, label: 'Salesforce' },
    ],

    'Custom Applications': [
      { icon: <img src={fileOpsIcon} alt="File Operations" className="bot-icon" />, label: 'File Operation' },
      { icon: <img src={conversionUtilsIcon} alt="Conversion Utilities" className="bot-icon" />, label: 'Conversion Utilities' },
      { icon: <img src={excelOpsIcon} alt="Excel Operations" className="bot-icon" />, label: 'Excel Operations' },
      { icon: <img src={dbOpsIcon} alt="Database Operations" className="bot-icon" />, label: 'Database operations' },
      { icon: <img src={csvOpsIcon} alt="CSV Operations" className="bot-icon" />, label: 'CSV operations' },
      { icon: <img src={ftpOpsIcon} alt="FTP Operations" className="bot-icon" />, label: 'FTP Operations' },
      { icon: <img src={pdfOpsIcon} alt="PDF Operations" className="bot-icon" />, label: 'PDF Operations' },
      { icon: <img src={xmlOpsIcon} alt="XML Operations" className="bot-icon" />, label: 'XML Operations' },
      { icon: <img src={logAnalysisIcon} alt="Log Analysis" className="bot-icon" />, label: 'Log Analysis' },
    ],
  };

  const toggleDropdown = (botType) => {
    setOpenDropdown(openDropdown === botType ? null : botType); // Prevent options from vanishing
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Chatbot functions
  const addMessage = (message) => {
    setChatMessages((prevMessages) => [...prevMessages, message]);
    setMessageTimestamps((prevTimestamps) => [...prevTimestamps, new Date()]);
  };

  const startChatbot = () => {
    setShowChatbot(true);
    setChatMessages([]); // Clear previous messages
    addMessage({ sender: 'bot', text: `Hi ${name}! How can I help you today?` });
    setChatStep('initial');
    setQueries([]);
  };

  const handleUserInput = () => {
    if (userInput.trim() === '') return;

    // Add the user's message to the chat with timestamp
    addMessage({ sender: 'user', text: userInput });

    processChatbotResponse(userInput.trim());
    setUserInput('');
  };

  const processChatbotResponse = (input) => {
    if (chatStep === 'entering_query') {
      // Save the query
      setQueries((prevQueries) => [...prevQueries, input]);
      // Acknowledge the issue
      addMessage({
        sender: 'bot',
        text: 'We have acknowledged your issue.',
      });
      // Ask if the user wants to add more queries
      addMessage({ sender: 'bot', text: 'Do you want to report another issue? Yes/No' });
      setChatStep('any_other_query');
    } else if (chatStep === 'any_other_query') {
      // Add user's response to the chat
      addMessage({ sender: 'user', text: input });

      if (input.toLowerCase() === 'yes') {
        // Go back to options
        addMessage({ sender: 'bot', text: 'How can I help you today?' });
        setChatStep('initial');
      } else if (input.toLowerCase() === 'no') {
        // Proceed to submit automatically
        addMessage({ sender: 'bot', text: 'Submitting your queries...' });
        setChatStep('submitting');
        handleSubmitQueries();
      } else {
        // Invalid input
        addMessage({ sender: 'bot', text: 'Please answer with "Yes" or "No".' });
      }
    }
  };

  //to fetch the files list from folder
  const fetchFileContent = async (branch, folderPath) => {
    const apiUrl = `https://api.github.com/repos/NCMPAutomation/Pulse_Bots/contents/${folderPath}?ref=${branch}`;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`, // Use token if repo is private
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch folder contents: ${response.statusText}`);
      }

      const files = await response.json();

      // Filter only .ps1 files
      const ps1Files = files.filter((file) => file.name.endsWith('.ps1'));

      return ps1Files; // Return only .ps1 files
    } catch (error) {
      console.error('Error fetching folder contents:', error);
      return [];
    }
  };

  //to fetch the content of each file
  const fetchFile = async (folderPath, branch, fileName) => {
    console.log('Fetching file with parameters:', { branch, folderPath, fileName });

    const apiUrl = `https://api.github.com/repos/NCMPAutomation/Pulse_Bots/contents/${folderPath}/${fileName}?ref=${branch}`;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const data = await response.json();
      const content = atob(data.content); // Decode base64 content
      // const sanitizedContent = content.replace(
      //   /[\uFEFF\u0080-\u009F\u200E\u200F\u2060\u2028\u2029\u00AD\u00A0\x7F\u202F\u2063\uD83C\uDF11\uDC00-\uDCFF]/g,
      //   ''
      // );
      return content;
    } catch (error) {
      console.error('Error fetching file:', error);
      return null;
    }
  };

  //to match git branch name with Bots-page bots
  const getBranchName = (category) => {
    const branchMapping = {
      'Simple Bots': 'Simple-Bots',
      'Enterprise Application Bots': 'Enterprise-Application-Bots',
      'Custom Applications': 'Custom-Applications-Bots',
    };
    return branchMapping[category] || null; // Return null if the category is invalid
  };

  // Calls fetchFile function and display the image
  const handleFileClick = async (fileData) => {
    const folder = fileData.download_url.split('/')[6]; // Extract folder name from URL
    const category = openDropdown; // Ensure openDropdown contains the category name
    const branch = getBranchName(category); // Get correct branch name based on category
    const fileName = fileData.name; // File name from the file object

    if (!branch || !folder || !fileName) {
      console.error('Invalid parameters:', { branch, folder, fileName });
      return;
    }

    // Construct the .jpg file name
    const jpgFileName = fileName.replace('.ps1', '.jpg');

    try {
      // Fetch the content of the .jpg file
      const jpgFileContent = await fetchFile(folder, branch, jpgFileName);

      if (!jpgFileContent) {
        alert(`Image file (${jpgFileName}) not found.`);
        return;
      }

      // Set the selected file with the image URL
      setSelectedFile({
        name: fileName,
        imageUrl: `https://raw.githubusercontent.com/NCMPAutomation/Pulse_Bots/${branch}/${folder}/${jpgFileName}`, // Construct direct image URL
        downloadUrl: fileData.download_url, // URL for the .ps1 file
      });
    } catch (error) {
      console.error('Error fetching image content:', error);
      alert('Failed to retrieve image file.');
    }
  };

  //for git hub
  const handleOptionsClick = async (label) => {
    // Correctly use the mapped branch name
    const category = openDropdown; // Ensure openDropdown contains the category name
    const branch = getBranchName(category); // Get correct branch name based on category
    const folderPath = label; // Use label as the folder path

    if (!branch) {
      console.error('Invalid branch name:', { category, branch });
      alert('Invalid branch selected.');
      return;
    }

    console.log('Fetching file with parameters:', { branch, folderPath });

    try {
      const files = await fetchFileContent(branch, folderPath); // Pass correct branch and folder

      if (files && files.length > 0) {
        setPopupContent({
          title: label,
          files: files.map((file) => ({
            name: file.name,
            download_url: file.download_url,
            html_url: file.html_url,
          })),
        });
        setIsModalOpen(true);
      } else {
        alert('No files found in the folder.');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      alert('Failed to retrieve files from GitHub.');
    }
  };

  const handleDownloadAsZip = async (scriptUrl, scriptFileName, imageUrl) => {
    try {
      const zip = new JSZip(); // Create a new ZIP instance

      // Fetch and add the .ps1 file to the ZIP
      const scriptResponse = await fetch(scriptUrl);
      if (!scriptResponse.ok) {
        throw new Error(`Failed to fetch script: ${scriptResponse.statusText}`);
      }
      const scriptBlob = await scriptResponse.blob();
      zip.file(scriptFileName, scriptBlob); // Add script to ZIP

      // Fetch and add the .jpg file to the ZIP (if available)
      if (imageUrl) {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        const imageBlob = await imageResponse.blob();
        const imageFileName = scriptFileName.replace('.ps1', '.jpg');
        zip.file(imageFileName, imageBlob); // Add image to ZIP
      }

      // Generate the ZIP file and trigger download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${scriptFileName.replace('.ps1', '')}.zip`); // Name the ZIP file
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('Failed to download files as ZIP.');
    }
  };

  const setCurrentQueryType = (queryType) => {
    currentQueryTypeRef.current = queryType; // Update the ref value
  };

  //for help button
  const handleOptionClick = (option) => {
    if (chatStep === 'initial') {
      // Add user's selection to the chat
      const userSelection =
        option === 'unable_to_access' ? 'Unable to access Pulse Portal' : 'Report other issue';
      addMessage({ sender: 'user', text: userSelection });

      if (option === 'unable_to_access') {
        setCurrentQueryType('unable_to_access_pulse');
        // Acknowledge the issue
        addMessage({
          sender: 'bot',
          text: 'We have acknowledged your issue.',
        });
        // Save the query
        setQueries((prevQueries) => [...prevQueries, 'Unable to access Pulse Portal']);
        // Ask if the user wants to add more queries
        addMessage({ sender: 'bot', text: 'Do you want to report another issue? Yes/No' });
        setChatStep('any_other_query');
      } else if (option === 'report_other') {
        addMessage({ sender: 'bot', text: 'Please enter your query here.' });
        setChatStep('entering_query');
        setCurrentQueryType('other');
      }
    }
  };

  const handleSubmitQueries = async () => {
    const uname = email;
    const query = queries.join('\n');

    try {
      const response = await fetch('https://pulse.netcon.in:5000/submit-help-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, uname }),
      });

      if (response.ok) {
        // Queries submitted successfully
        setQueries([]);
        // Show confirmation message
        addMessage({
          sender: 'bot',
          text: 'Your queries have been submitted successfully!',
        });
        // End chat
        setChatStep('finished');
      } else {
        // Error submitting queries
        addMessage({
          sender: 'bot',
          text: 'There was an issue submitting your queries. Please try again later.',
        });
      }
    } catch (error) {
      console.error('Error submitting the queries:', error);
      addMessage({
        sender: 'bot',
        text: 'Error submitting the queries. Please try again later.',
      });
    }
  };

  return (
    <div className="bot-page">
      <div className="banner1">

        <div className="left-section">
          <img src="netcon.png" alt="Netcon Logo" className="logo" />
          <button className="home-button" onClick={() => navigate('/homepage')}>
            {/* <FaHome /> */}
            <img src="Home.png" alt="User Icon" className="user-icon" />
          </button>
        </div>
        <h2 id="botpage">NETCON PULSE <span className="trademark">®</span><h4>Digital Operations Center</h4></h2>

        <button
          ref={dropdownRef}
          className="right-section"
          onClick={() => setShowDropdown(!showDropdown)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault(); // Prevent scroll on space
              setShowDropdown(!showDropdown);
            }
          }}
          aria-expanded={showDropdown}
          aria-haspopup="true"
          aria-label="Account menu"
        >
          <div className="account-button">
            <p className="name">{name}</p>
            <img src="Login.png" alt="User Icon" className="user-icon" />
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <p id="menu">{email}</p>
              <p id="menu">{department}</p>
              <button className="help" onClick={startChatbot}>
                Help
              </button>
              <button className="logout" onClick={handleLogout}>
                Logout <img src="Logout.png" alt="User Icon" className="user-icon1" />
              </button>
            </div>
          )}
        </button>
      </div>

      <div className="dropdown-buttons-container">
        <button
          onClick={() => toggleDropdown('Simple Bots')}
          className={`dropdown-button ${openDropdown === 'Simple Bots' ? 'active' : ''}`}
        >
          System and Network Bots <FaCaretDown />
        </button>
        <button
          onClick={() => toggleDropdown('Enterprise Application Bots')}
          className={`dropdown-button ${openDropdown === 'Enterprise Application Bots' ? 'active' : ''}`}
        >
          Enterprise Application Bots <FaCaretDown />
        </button>
        <button
          onClick={() => toggleDropdown('Custom Applications')}
          className={`dropdown-button ${openDropdown === 'Custom Applications' ? 'active' : ''}`}
        >
          Custom Applications<FaCaretDown />
        </button>
      </div>

      <div className="bot-options-container">
        {openDropdown === 'Simple Bots' && (
          <div className="bot-options">
            {botOptions['Simple Bots'].map((bot) => (
              <button key={bot.index} className="bot-option" onClick={() => handleOptionsClick(bot.label)}>
                {bot.icon} {bot.label}
              </button>
            ))}
          </div>
        )}

        {openDropdown === 'Enterprise Application Bots' && (
          <div className="bot-options">
            {botOptions['Enterprise Application Bots'].map((bot) => (
              <button key={bot.index} className="bot-option" onClick={() => handleOptionsClick(bot.label)}>
                {bot.icon} {bot.label}
              </button>
            ))}
          </div>
        )}

        {openDropdown === 'Custom Applications' && (
          <div className="bot-options">
            {botOptions['Custom Applications'].map((bot) => (
              <button key={bot.index} className="bot-option" onClick={() => handleOptionsClick(bot.label)}>
                {bot.icon} {bot.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="popup">
          <div className="popup-header">
            <button onClick={() => (selectedFile ? setSelectedFile(null) : closePopup())}>
              Back
            </button>
          </div>
          <div className="popup-content">
            {!selectedFile ? (
              <ul>
                {popupContent.files.map((file) => (
                  <li key={file.index}>
                    <button
                      className="right-section"
                      type="button"
                      onClick={() => handleFileClick(file)}
                    >
                      {file.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div>
                {selectedFile.imageUrl ? (
                  <div>
                    <img
                      src={selectedFile.imageUrl}
                      alt={selectedFile.name}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        margin: '10px 0',
                      }}
                    />
                    <button
                      className="accept-download-button"
                      onClick={() =>
                        handleDownloadAsZip(
                          selectedFile.downloadUrl,
                          selectedFile.name,
                          selectedFile.imageUrl
                        )
                      }
                    >
                      Download Script
                    </button>
                  </div>
                ) : (
                  <p>Image not available for this file.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Button */}
      <button className="help-button" onClick={startChatbot}>
        Help
      </button>
      {/* Chatbot Popup */}
      {showChatbot && (
        <div ref={chatBotRef} className="chatbot-popup">
          <div className="chatbot-header">
            <h4>Help Desk</h4>
            <button className="chatbot-close" onClick={() => setShowChatbot(false)}>
              ✕
            </button>
          </div>
          <div className="chatbot-messages" ref={messagesEndRef}>
            {chatMessages.map((message, index) => (
              <div key={message.index} className={`message ${message.sender}`}>
                {/* Display sender name */}
                <div className="message-sender">
                  {message.sender === 'bot' ? 'Pulse' : 'You'}
                </div>
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {messageTimestamps[index].toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
          {chatStep === 'initial' && (
            <div className="chatbot-options">
              <button onClick={() => handleOptionClick('unable_to_access')}>
                Unable to access Pulse Portal
              </button>
              <button onClick={() => handleOptionClick('report_other')}>
                Report other issue
              </button>
            </div>
          )}
          {chatStep === 'entering_query' && (
            <div className="chatbot-input">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUserInput();
                  }
                }}
                placeholder="Please enter your query here..."
              />
              <button onClick={handleUserInput}>Send</button>
            </div>
          )}
          {chatStep === 'any_other_query' && (
            <div className="chatbot-options">
              <button onClick={() => processChatbotResponse('yes')}>Yes</button>
              <button onClick={() => processChatbotResponse('no')}>No</button>
            </div>
          )}
          {chatStep === 'finished' && (
            <div className="chatbot-end-message">
              <p>Chat ended. Thank you!</p>
              <button className="start-new-chat-button" onClick={startChatbot}>
                Start a New Chat
              </button>
            </div>
          )}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Bots;
