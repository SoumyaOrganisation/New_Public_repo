// src/components/Footer.js
// import React, { useState, useEffect, useRef } from 'react';
import './Footer.css'; // Optional: Create this CSS file if needed

const Footer = () => {

  // const [showPopup, setShowPopup] = useState(false);
  // // const popupRef = useRef(null);

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (popupRef.current && !popupRef.current.contains(event.target)) {
  //       setShowPopup(false);
  //     }
  //   };

  //   if (setShowPopup) {
  //     document.addEventListener('keydown', handleClickOutside);
  //   } else {
  //     document.removeEventListener('keydown', handleClickOutside);
  //   }

  //   // Cleanup the event listener on component unmount
  //   return () => document.removeEventListener('keydown', handleClickOutside);
  // }, [showPopup]);

  // const handlePopupSubmit = async () => {
  //   const query = document.getElementById('query').value;
  //   const uname = document.getElementById('uname').value;
  
  //   try {
  //     const response = await fetch('https://pulse.netcon.in:5000/submit-help-query', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ query, uname }),
  //     });
  
  //     if (response.ok) {
  //       alert('Your query has been submitted successfully!');
  //       setShowPopup(false);
  //     } else {
  //       alert('There was an issue submitting your query. Please try again.');
  //     }
  //   } catch (error) {
  //     console.error('Error submitting the query:', error);
  //     alert('Error submitting the query.');
  //   }
  // };

  return (
    <footer className="footer">
      <div className="footer-links">
        <a href="./privacy-policy">Privacy Policy</a>
        <a href="./cookies-policy">Cookies Policy</a>
        <a href="./anti-bribery-and-anti-corruption-policy">Anti-Bribery and Anti-Corruption Policy</a>
        <a href="./partner-code-of-conduct">Partner Code of Conduct</a>
        <a href="./employee-code-of-conduct">Employee Code of Conduct</a>
      </div>
      <p className='copyright'>© Copyright 2024 Netcon Technologies. All rights reserved. All logos and trademarks used belong to their respective owners.</p>
      {/* <div>
      <button className="help-button" onClick={() => setShowPopup(true)}>Help</button>
      <div className={`overlay ${showPopup ? 'show-overlay' : ''}`}></div>
      {showPopup && (
        <div ref={popupRef} className="popup">
          <h3>Help Desk....</h3>
          <h5>Enter Your Email-id</h5>
          <textarea id="uname"
          placeholder="xyz@netcon.in"
          maxLength = "150"/>
          <h5>Enter your query</h5>
          <textarea id="query"
            placeholder="Enter your query here..."
            maxLength="100"
          />
          <button onClick={handlePopupSubmit}>Submit</button>
          <button onClick={() => setShowPopup(false)}>Cancel</button>
        </div>
      )}
      </div> */}
    </footer>
  );
};

export default Footer;
