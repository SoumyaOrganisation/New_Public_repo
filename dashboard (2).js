// Dashboard.js

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import "./login.css";
// import { FaHome, FaUserCircle } from 'react-icons/fa';
import "./home.css";
import "./dashboard.css";
// import Modal from './Modal'; // Import the Modal component
import { token } from './token';
import "./Modal.css";

const Dashboard = () => {
  // State variables
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  // eslint-disable-next-line
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageArray, setImageArray] = useState([]);
  const navigate = useNavigate();

  const dropdownRef = useRef(null); // Reference for dropdown
  const popupRef = useRef(null);
  const [setShowPopup] = useState(false);

  const department = localStorage.getItem('department') || ""; // Retrieve the department from localStorage
  const email = localStorage.getItem('email') || ""; // Retrieve the email from localStorage
  const name = localStorage.getItem('name') || "";
  // const sessionId = localStorage.getItem('sessionId') || ""; // Retrieve the sessionId from localStorage

  // New state variables for chat functionality
  const [showChatbot, setShowChatbot] = useState(false);
  const currentQueryTypeRef = useRef(''); // Initialize ref with an empty string
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [chatStep, setChatStep] = useState('initial');
  const [queries, setQueries] = useState([]);
  const [messageTimestamps, setMessageTimestamps] = useState([]);

  // Refs for the chatbot popup and messages container
  const chatBotRef = useRef(null);
  const messagesEndRef = useRef(null); // Reference to the messages container

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

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      // Close popup if clicked outside
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowPopup]);

  const handleRoleClick = (role) => {
    setSelectedRole(selectedRole === role ? null : role); // Toggle role selection
  };

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('sessionId');

    if (!sessionId) {
      alert('Missing session ID.');
      return;
    }

    try {
      const response = await fetch('https://pulse.netcon.in:5000/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message); // "You have logged out successfully"

        // Clear localStorage and navigate to login
        localStorage.clear();
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Logout failed:', errorData.message);
        alert('Logout failed: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('An error occurred during logout.');
    }
  };

  const fetchImageFromGithub = async (imageName) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/NCMPAutomation/Reports/contents/${imageName}`,
        {
          headers: {
            Authorization: `token ${token}`, // Replace with your actual token
            Accept: 'application/vnd.github.v3.raw',
          },
        }
      );
      if (response.ok) {
        return response;
      } else {
        console.error('Failed to fetch image from GitHub:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  };

  const showModal = async (repo) => {
    const { link, links } = repo;
    let imageNames = [];

    if (links && Array.isArray(links)) {
      imageNames = links;
    } else if (link) {
      imageNames = [link];
    }

    setImageArray(imageNames);
    setCurrentImageIndex(0);

    const imageName = imageNames[0];

    const showModalWithImage = (imageObjectURL) => {
      setSelectedImage(imageObjectURL);
      setModalVisible(true);
    };

    try {
      const response = await fetchImageFromGithub(imageName);
      if (response) {
        const imageBlob = await response.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        showModalWithImage(imageObjectURL);
      }
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  const handleNextImage = useCallback(async () => {
    let newIndex = currentImageIndex + 1;
    if (newIndex >= imageArray.length) {
      newIndex = 0; // Loop back to the first image
    }
    setCurrentImageIndex(newIndex);
    const imageName = imageArray[newIndex];

    try {
      const response = await fetchImageFromGithub(imageName);
      if (response) {
        const imageBlob = await response.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        setSelectedImage(imageObjectURL);
      }
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  }, [currentImageIndex, imageArray]);

  // Memoized handlePreviousImage
  const handlePreviousImage = useCallback(async () => {
    let newIndex = currentImageIndex - 1;
    if (newIndex < 0) {
      newIndex = imageArray.length - 1; // Loop back to the last image
    }
    setCurrentImageIndex(newIndex);
    const imageName = imageArray[newIndex];

    try {
      const response = await fetchImageFromGithub(imageName);
      if (response) {
        const imageBlob = await response.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        setSelectedImage(imageObjectURL);
      }
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  }, [currentImageIndex, imageArray]);

  // Memoized closeModal
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedImage('');
    setImageArray([]);
    setCurrentImageIndex(0);
  }, []);

  // Updated githubLinks with additional images
  const githubLinks = {
    admin: [
      { title: 'Automation Dashboard', link: 'Automation Dashboard.png' },
      {
        title: 'Internal IT - Monthly Request Handled Report Sept 2024',
        links: [
          'Internal IT - Monthly Requests Handled Report 1 - Sept 2024.png',
          'Internal IT - Monthly Requests Handled Report 2 - Sept 2024.png',
        ]
      },
      {
        title: 'PAX WiFi Report',
        links: [
          'PAX WIFI-1.png',
          'PAX WIFI-2.png',
          'PAX WIFI-3.png',
          'PAX WIFI-4.png',
        ],
      },
      {
        title: 'IVRS Report',
        links: [
          'IVRS Report July 2024-1.png',
          'IVRS Report July 2024-2.png',
          'IVRS Report July 2024-3.png',
          'IVRS Report July 2024-4.png',
        ],
      },
    ],
    manager: [
      {
        title: 'DC IT Infra_Manager',
        links: [
          'DC IT Infra_Manager1.png',
          'DC IT Infra_Manager2.png'
        ]
      },
      { title: 'Automation Dashboard', link: 'Automation Dashboard.png' },
      {
        title: 'Internal IT - Monthly Request Handled Report Sept 2024',
        links: [
          'Internal IT - Monthly Requests Handled Report 1 - Sept 2024.png',
          'Internal IT - Monthly Requests Handled Report 2 - Sept 2024.png',
        ]
      },
    ],
    customer: [
      {
        title: 'DC IT Infra_Customer',
        links: [
          'DC IT Infra_Customer-1.png',
          'DC IT Infra_Customer-2.png',
          'DC IT Infra_Customer-3.png',
        ]
      },
      {
        title: 'Internal IT - Monthly Request Handled Report Sept 2024',
        links: [
          'Internal IT - Monthly Requests Handled Report 1 - Sept 2024.png',
          'Internal IT - Monthly Requests Handled Report 2 - Sept 2024.png',
        ]
      },
    ],
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

  const handleOptionClick = (option) => {
    if (chatStep === 'initial') {
      // Add user's selection to the chat
      const userSelection =
        option === 'unable_to_access' ? 'Unable to access Pulse Portal' : 'Report other issue';
      addMessage({ sender: 'user', text: userSelection });

      if (option === 'unable_to_access') {
        currentQueryTypeRef.current = 'unable_to_access_pulse';
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
        currentQueryTypeRef.current = 'other';
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

  const currentIndex = useMemo(() => {
    return imageArray.findIndex((image) => image === selectedImage);
  }, [imageArray, selectedImage]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowRight" && imageArray.length > 1) handleNextImage();
      if (event.key === "ArrowLeft" && imageArray.length > 1) handlePreviousImage();
    };

    if (modalVisible) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalVisible, imageArray, closeModal, handleNextImage, handlePreviousImage]);

  const handleKeyboardInteraction = useCallback(
    (e) => {
      switch (e.key) {
        case "ArrowLeft":
          if (imageArray.length > 1) handlePreviousImage();
          break;
        case "ArrowRight":
          if (imageArray.length > 1) handleNextImage();
          break;
        case "Escape":
          closeModal();
          break;
        default:
          break;
      }
    },
    [imageArray, handlePreviousImage, handleNextImage, closeModal]
  );

  return (
    <div className="App">
      <div className="banner1">
        <div className="left-section">
          <img src="netcon.png" alt="Netcon Logo" className="logo" />
          <button className="home-button" onClick={() => navigate('/homepage')}>
            {/* <FaHome /> */}
            <img src="Home.png" alt="User Icon" className="user-icon" />
          </button>
        </div>
        <h2 id="dash-name">
          NETCON PULSE <span className="trademark">®</span>
          <h4>Digital Operations Center</h4>
        </h2>

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
                Help  <img src="Help.png" alt="User Icon" className="user-icon1" />
              </button>
              <button className="logout" onClick={handleLogout}>
                Logout <img src="Logout.png" alt="User Icon" className="user-icon2" />
              </button>
            </div>
          )}
        </button>
      </div>

      <div className="dashboard-container">
        <div className="role-buttons">
          <button className="role-button" onClick={() => handleRoleClick('admin')}>Admin</button>
          <button className="role-button" onClick={() => handleRoleClick('manager')}>Manager</button>
          <button className="role-button" onClick={() => handleRoleClick('customer')}>Customer</button>
        </div>
        <div className="powerbi-button-container">
          <a href="https://app.powerbi.com/" target="_blank" rel="noopener noreferrer">
            <button className="powerbi-button">Power BI</button>
          </a>
        </div>
      </div>

      <div className="github-links-container">
        {selectedRole &&
          githubLinks[selectedRole].map((repo) => (
            <button
              key={`${selectedRole}-${repo.title}`}
              className="github-link-button"
              onClick={() => showModal(repo)}
            >
              {repo.title}
            </button>
          ))}
      </div>

      {modalVisible && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          aria-labelledby="modal-title"
          aria-describedby="modal-content"
        >
          <div
            className="modal-content"
            tabIndex={0}
            onKeyDown={(e) => handleKeyboardInteraction(e)}
            onClick={(e) => e.stopPropagation()} // Ensures clicks on the content don't close the modal
          >
            {imageArray.length > 1 && (
              <button
                className="modal-prev-button"
                onClick={handlePreviousImage}
                aria-label="Previous image"
              >
                ←
              </button>
            )}
            <img
              src={selectedImage}
              alt={`Popup img ${currentIndex + 1} of ${imageArray.length}`}
              className="modal-image"
            />
            {imageArray.length > 1 && (
              <button
                className="modal-next-button"
                onClick={handleNextImage}
                aria-label="Next image"
              >
                →
              </button>
            )}
            <button
              onClick={closeModal}
              className="modal-close-button"
              aria-label="Close modal"
            >
              X
            </button>
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

export default Dashboard;
