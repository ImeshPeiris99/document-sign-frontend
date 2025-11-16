import React, { useEffect, useState } from 'react';

const GuideArrow = ({ targetButtonId, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  const targetElement = document.getElementById(targetButtonId);
  if (!targetElement) return null;

  const rect = targetElement.getBoundingClientRect();

  return (
    <div
        style={{
            position: 'fixed',
            top: `${rect.top - 50}px`,
            left: `${rect.left + rect.width / 2 - 15}px`,
            fontSize: '40px',
            color: '#1C304A',
            zIndex: 1000,
            animation: 'bounce 1s infinite',
            pointerEvents: 'none' 
        }}
        >
        👇🏻 {/* This will now point downward after rotation */}
     </div>
  );
};

export default GuideArrow;