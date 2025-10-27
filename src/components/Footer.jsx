import React from "react";
import "./Footer.css";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Column 1 */}
        <div>
          <h2>DigiStav | Validorix</h2>
          <p>
            Building AI-powered compliance and digital construction management
            tools for the next generation of builders and innovators.
          </p>
          <div className="footer-icons">
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaLinkedinIn /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaGithub /></a>
          </div>
        </div>

        {/* Column 2 */}
        <div>
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/careers">Careers</a></li>
            <li><a href="/pricing">Pricing</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3>Resources</h3>
          <ul>
            <li><a href="/docs">Documentation</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/security">Security</a></li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>
          <h3>Stay Updated</h3>
          <p>Subscribe to receive updates on product releases and company news.</p>
          <form className="footer-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} DigiStav | Validorix. All rights reserved.</p>
        <p>
          Designed & built with love by{" "}
          <a href="https://oudenx.com" target="_blank" rel="noreferrer">
            OudenX
          </a>.
        </p>
      </div>
    </footer>
  );
}
