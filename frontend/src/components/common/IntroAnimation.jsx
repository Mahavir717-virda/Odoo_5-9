import React, { useState, useEffect } from "react";
import logoImg from "../../assets/logo.png";
import "./IntroAnimation.css";

/**
 * PeoplePay360 — Intro Loader Animation
 * Shows when someone opens the website for the first time.
 */
export default function IntroAnimation() {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Lock scrolling while intro is active
    document.body.classList.add("locked");

    const finishIntro = () => {
      setIsLeaving(true);
      document.body.classList.remove("locked");
      setTimeout(() => {
        setIsDone(true);
      }, 620);
    };

    // Reduced motion check
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishIntro();
      return;
    }

    // Auto-reveal after 3.1s
    const AUTO_MS = 3100;
    const timer = setTimeout(finishIntro, AUTO_MS);

    return () => {
      clearTimeout(timer);
      document.body.classList.remove("locked");
    };
  }, []);

  const handleClick = () => {
    if (!isLeaving && !isDone) {
      setIsLeaving(true);
      document.body.classList.remove("locked");
      setTimeout(() => {
        setIsDone(true);
      }, 620);
    }
  };

  if (isDone) return null;

  return (
    <div
      id="intro"
      className={`${isLeaving ? "leaving" : ""} ${isDone ? "done" : ""}`}
      onClick={handleClick}
      role="banner"
      aria-label="Welcome to PeoplePay360"
    >
      <div className="intro-stage">
        {/* Logo Wrap with Wipe & Sweep Effects */}
        <div className="logo-wrap">
          <img src={logoImg} alt="PeoplePay360" />
          <div className="sweep" />

          {/* Particle Sparks */}
          <div className="spark s1">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"
                fill="#8fd3f4"
              />
            </svg>
          </div>
          <div className="spark s2">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"
                fill="#c9c9c9"
              />
            </svg>
          </div>
          <div className="spark s3">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"
                fill="#8fd3f4"
              />
            </svg>
          </div>
        </div>

        {/* Loading Progress Rail & Tagline */}
        <div className="rail" />
        <div className="tagline">PAYROLL, SIMPLIFIED</div>
      </div>

      <div className="intro-hint">tap anywhere to skip</div>
    </div>
  );
}
