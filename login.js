// Login.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importing eye icons
import Footer from './Footer';
import "./login.css";

const Login = () => {
  // Existing state variables
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [employeeid, setEmployeeid] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false); // State for OTP
  const [isMobileVisible, setIsMobileVisible] = useState(false); // State for visibility toggle
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // State for loading
  const [otpTimeout, setOtpTimeout] = useState(60); // State for OTP timeout
  const [timerActive, setTimerActive] = useState(false); // State to check if timer is active
  const [showResendButton, setShowResendButton] = useState(false); // State to show resend button

  // New state variables for chat functionality
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [chatStep, setChatStep] = useState('greeting');
  const [currentQueryType, setCurrentQueryType] = useState('');
  const [queries, setQueries] = useState([]);
  const [userEmailForChat, setUserEmailForChat] = useState('');
  const [messageTimestamps, setMessageTimestamps] = useState([]);

  // Refs for the chatbot popup and messages container
  const chatBotRef = useRef(null);
  const messagesEndRef = useRef(null); // Reference to the messages container

  useEffect(() => {
    let timer;
    if (timerActive && otpTimeout > 0) {
      timer = setInterval(() => {
        setOtpTimeout((prev) => prev - 1);
      }, 1000);
    }
    if (otpTimeout === 0) {
      setShowResendButton(true); // Show the resend button after timeout
      setTimerActive(false); // Stop the timer
    }
    return () => clearInterval(timer);
  }, [timerActive, otpTimeout]);

  // UseEffect to handle clicks outside the chatbot
  useEffect(() => {
    // Function to handle clicks outside the chatbot
    const handleClickOutside = (event) => {
      if (chatBotRef.current && !chatBotRef.current.contains(event.target)) {
        setShowChatbot(false);
      }
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      // Unbind the event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [chatBotRef]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Chatbot functions
  const addMessage = (message) => {
    setChatMessages((prevMessages) => [...prevMessages, message]);
    setMessageTimestamps((prevTimestamps) => [...prevTimestamps, new Date()]);
  };

  const startChatbot = () => {
    setShowChatbot(true);
    setChatMessages([]); // Clear previous messages
    addMessage({ sender: 'bot', text: 'Hi! Please enter your email id.' });
    setChatStep('email');
    setUserEmailForChat('');
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
    if (chatStep === 'email') {
      // Save the email
      setUserEmailForChat(input);
      // Proceed to the next step
      addMessage({ sender: 'bot', text: 'How can I help you today?' });
      setChatStep('initial');
    } else if (chatStep === 'entering_query') {
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
        setCurrentQueryType('unable_to_access_pulse');
        // Acknowledge the issue
        addMessage({
          sender: 'bot',
          text: 'We have acknowledged your issue.',
        });
        // Save the query
        setQueries((prevQueries) => [
          ...prevQueries,
          'Unable to access Pulse Portal',
        ]);
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
    const uname = userEmailForChat || localStorage.getItem('email');
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

  // Existing functions remain the same
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous error message

    try {
      const response = await axios.post('https://pulse.netcon.in:5000/login', {
        email,
        mobile,
        employeeid,
      });

      if (response.status === 200 && response.data.message === 'OTP sent') {
        // Store name and department from the login response in localStorage
        const { name, department } = response.data;
        localStorage.setItem('name', name);
        localStorage.setItem('department', department);
        localStorage.setItem('email', email);

        setOtpSent(true); // OTP was sent, show OTP input
        setOtpTimeout(60); // Reset OTP timeout
        setTimerActive(true); // Start the timer
        setShowResendButton(false); // Hide resend button on successful OTP send
      } else {
        setError(response.data.message || 'Invalid Credentials');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpValidation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous error message

    try {
      const response = await axios.post('https://pulse.netcon.in:5000/validate-otp', {
        otpFromUser: otp,
        email,
      });

      if (response.status === 200 && response.data.message === 'OTP verified') {
        // Store the sessionId in localStorage
        const { sessionId } = response.data;
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('loggedIn', 'true');

        // Navigate to homepage after successful OTP verification
        navigate('/homepage');
      } else {
        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('OTP validation failed:', err);
      setError(err.response?.data?.message || 'OTP validation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtpTimeout(60); // Reset the OTP timeout
    setShowResendButton(false); // Hide the resend button
    await handleLogin(); // Call handleLogin to send the OTP again
  };

  return (
    <div className="App">
      <div className="banner">
      <img src="netcon.png?v=1" alt="Netcon Technologies Logo" className="logo" />
        <h2>
          NETCON PULSE <span className="trademark">®</span>
          <h4>Digital Operations Center</h4>
        </h2>
      </div>
      <main className="login-container">
        <div className="unique-feature">
          <img src="login image.png" alt="Unique Feature" className="unique-feature-image" />
        </div>
        <div className="login-form">
          <div className="login-form-container">
            {!otpSent ? (
              <form onSubmit={handleLogin}>
                <h3 id="Login">Login</h3>
                <br />
                <label>
                  Email <i>*</i>
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label>
                  Mobile Number <i>*</i>
                </label>
                <div className="mobile-input-container">
                  <input
                    type={isMobileVisible ? 'tel' : 'password'}
                    placeholder="Enter your registered Mobile Number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                  <span
                    className="toggle-visibility-icon"
                    onClick={() => setIsMobileVisible(!isMobileVisible)}
                  >
                    {isMobileVisible ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <label>
                  Emp ID/Client ID <i>*</i>
                </label>
                <input
                  type="text"
                  placeholder="Enter your Emp ID/Client ID"
                  value={employeeid}
                  onChange={(e) => setEmployeeid(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? <div className="loader"></div> : 'Login'}
                </button>
                {error && <p className="error-message">{error}</p>}
              </form>
            ) : (
              <form onSubmit={handleOtpValidation}>
                <h3 id="OTP">Enter OTP</h3>
                <input
                  type="number"
                  placeholder="Enter the OTP"
                  value={otp}
                  onChange={(e) => {
                    if (e.target.value.length <= 6) {
                      setOtp(e.target.value);
                    }
                  }}
                  maxLength={6}
                  inputMode="numeric" // Optional: makes mobile keyboards show the numeric pad
                  required
                />
                <p>Time remaining: {otpTimeout} seconds</p>
                {otpTimeout > 0 && (
                  <button type="submit" disabled={loading}>
                    {loading ? <div className="loader"></div> : 'Verify OTP'}
                  </button>
                )}
                {showResendButton && (
                  <button type="button" onClick={handleResendOtp}>
                    Resend OTP
                  </button>
                )}
                {error && <p className="error-message">{error}</p>}
              </form>
            )}
          </div>
        </div>
        <div>
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
              {chatStep === 'email' && (
                <div className="chatbot-input">
                  <input
                    type="email"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUserInput();
                      }
                    }}
                    placeholder="Enter your email id..."
                  />
                  <button onClick={handleUserInput}>Send</button>
                </div>
              )}
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
