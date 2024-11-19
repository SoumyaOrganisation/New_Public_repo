// HomePage.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { FaUserCircle } from 'react-icons/fa';
import "./home.css"; // Ensure this file includes the necessary styles
import monitoring1 from "../images/monitoring_logo.png";
import asset1 from "../images/asset_logo.png";
import cloud1 from "../images/cloud_management_logo.png";
import soc1 from "../images/soc_logo.png";
import finops1 from "../images/finops_logo.png";
import reporting1 from "../images/reporting_logo.png";
import itsm1 from "../images/itsm_logo.jpg";
import noc1 from "../images/noc_monitoring_logo.png";
import automation1 from "../images/automation_logo.png";
import bot from "../images/bot-icon.png";

const services = [
  {
    title: 'Observability',
    icon: monitoring1,
    link: 'https://172.19.2.22:8061/',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['IT', 'Delivery', 'Service Delivery', 'Emerging Technologies']
  },
  {
    title: 'Service Management',
    icon: itsm1,
    link: 'https://support.netcon.in:8448/',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['IT', 'Delivery', 'Service Delivery', 'Emerging Technologies']
  },
  {
    title: 'Hybrid Cloud FinOps',
    icon: finops1,
    link: 'https://netconzone.surpaascompaas.com/surpaas/#',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['Delivery', 'Service Delivery', 'Emerging Technologies']
  },
  {
    title: 'Public Cloud Operation',
    icon: cloud1,
    link: 'https://portal.azure.com/',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['Delivery', 'Service Delivery', 'Emerging Technologies']
  },
  {
    title: 'Data Center & NOC',
    icon: noc1,
    link: 'https://support.netcon.in:8448/WorkOrder.do?woMode=newWO&reqTemplate=901&requestServiceId=-1',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['Delivery', 'Service Delivery', 'Emerging Technologies']
  },
  {
    title: 'Security',
    icon: soc1,
    link: 'https://netcon.ariksa.io/',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['Delivery', 'Service Delivery', 'Emerging Technologies']
  },
  {
    title: 'Automation & Bots - I',
    icon: automation1,
    link: 'https://automation.netcon.in',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['Delivery', 'Service Delivery', 'Emerging Technologies']
  },
  {
    title: 'Automation & Bots - II',
    icon: bot,
    link: '/botpage',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['Delivery', 'Service Delivery', 'Emerging Technologies']
  },
  {
    title: 'Asset Management',
    icon: asset1,
    link: 'https://pulse.netcon.in/up',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['Delivery', 'Service Delivery', 'Emerging Technologies']
  },
  {
    title: 'Dashboard',
    icon: reporting1,
    link: '/dashboard',
    backgroundColor: '#f1f1f1',
    allowedDepartments: ['Management', 'Delivery', 'Service Delivery', 'Emerging Technologies']
  }
];

const HomePage = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null); // Reference for dropdown
  const navigate = useNavigate();

  const department = localStorage.getItem('department') || "";
  const email = localStorage.getItem('email') || "";
  const name = localStorage.getItem('name') || "";
  const sessionId = localStorage.getItem('sessionId') || "";

  // New state variables for chat functionality
  const [showChatbot, setShowChatbot] = useState(false);
  const [, setCurrentQueryType] = useState('');
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

  const handleLogout = async () => {
    const logoutTime = Date.now(); // Capture the logout time
    try {
      // Send a POST request to the logout endpoint with sessionId and logoutTime
      const response = await fetch('https://pulse.netcon.in:5000/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, logoutTime }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Logged out successfully:', data);
      } else {
        console.error('Logout failed.');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      // Clear local storage and navigate to the login page
      localStorage.clear();
      navigate('/login');
    }
  };

  const logServiceOpted = async (serviceName) => {
    try {
      const response = await fetch('https://pulse.netcon.in:5000/log-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceName, sessionId }),
      });

      if (!response.ok) {
        console.error('Failed to log service opted.');
      }
    } catch (error) {
      console.error('Error logging service opted:', error);
    }
  };

  const handleServiceClick = (service) => {
    logServiceOpted(service.title); // Log the service name

    if (service.title === 'Dashboard' || service.title === 'Automation & Bots - II') {
      // Navigate within the app for these specific services
      navigate(service.link);
    } else {
      // Open other links in a new tab
      window.open(service.link, '_blank');
    }
  };

  const filteredServices = services.filter(service =>
    service.allowedDepartments.includes(department)
  );

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
        const setCurrentQueryType = (queryType) => {
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
        }
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
    <div className="App">
      <div className="banner1">
        <div className="left-section">
          <img src="netcon.png" alt="Netcon Logo" className="logo" />
        </div>
        <h2 id="home-name">
          NETCON PULSE <span className="trademark">®</span>
          <h4>Digital Operations Center</h4>
        </h2>
        <div
          ref={dropdownRef}
          className="right-section"
          role="button"
          tabIndex="0"
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
          <button className="account-button">
            <p className="name">{name}</p>
            <FaUserCircle />
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <p id="menu">{email}</p>
              <p id="menu">{department}</p>
              <button className="help" onClick={startChatbot}>
                Help
              </button>
              <button className="logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="services-container">
        <div className="services-grid">
          {filteredServices.length > 0 ? (
            filteredServices.map((service, index) => (
              <button
                className="service-card"
                key={`${service.title}-${service.backgroundColor}`.toLowerCase().replace(/\s+/g, '-')}
                style={{ backgroundColor: service.backgroundColor }}
                onClick={() => handleServiceClick(service)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleServiceClick(service);
                  }
                }}
                role="button"
                aria-label={`Select ${service.name} service`} // Assuming service has a name property
                tabIndex={0}
              >
                <img src={service.icon} alt={service.title} className="service-icon" />
                <h2 className="service-title">{service.title}</h2>
              </button>
            ))
          ) : (
            <p>No services available for your department.</p>
          )}
        </div>
      </div>
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
              <div key={index} className={`message ${message.sender}`}>
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

export default HomePage;
