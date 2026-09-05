import React from "react";
import { useNavigate } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="stars"></div>
      <div className="not-found-content">
        <h1 className="number-404">404</h1>
        
        <div className="ghost-wrapper">
          <div className="ghost">
            <div className="ghost-face">
              <div className="ghost-eyes">
                <div className="ghost-eye"></div>
                <div className="ghost-eye"></div>
              </div>
              <div className="ghost-mouth"></div>
            </div>
            <div className="ghost-bottom">
              <div className="ghost-wave"></div>
              <div className="ghost-wave"></div>
              <div className="ghost-wave"></div>
              <div className="ghost-wave"></div>
              <div className="ghost-wave"></div>
            </div>
          </div>
          <div className="ghost-shadow"></div>
        </div>

        <h2 className="not-found-heading">Oops! Page Not Found</h2>
        <p className="not-found-text">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <button className="home-button" onClick={() => navigate("/")}>
          Go to Homepage
        </button>
      </div>
    </div>
  );
}

export default NotFound;

