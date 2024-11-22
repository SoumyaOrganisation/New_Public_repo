// src/components/Footer.js
// import React, { useState, useEffect, useRef } from 'react';
import './Footer.css'; // Optional: Create this CSS file if needed

const Footer = () => {

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
    </footer>
  );
};

export default Footer;
