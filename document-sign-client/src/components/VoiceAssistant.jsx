// VoiceAssistant.jsx - PERSISTENT VOICE STATE ACROSS ALL PAGES
import React, { useState, useEffect } from 'react';
import voiceService from '../services/voiceService';

// 🎯 GLOBAL VOICE STATE - Shared across all components
export let isVoiceEnabled = false;
export const setVoiceEnabled = (enabled) => {
  isVoiceEnabled = enabled;
  // 🎯 SAVE TO LOCALSTORAGE SO IT PERSISTS ACROSS PAGES
  localStorage.setItem('voiceAssistantEnabled', enabled.toString());
};

const VoiceAssistant = () => {
  // 🎯 LOAD VOICE STATE FROM LOCALSTORAGE ON COMPONENT MOUNT
  const [isVoiceOn, setIsVoiceOn] = useState(() => {
    const savedState = localStorage.getItem('voiceAssistantEnabled');
    return savedState === 'true'; // Convert string to boolean
  });

  // 🎯 SYNC LOCAL STATE WITH GLOBAL STATE ON MOUNT AND CHANGES
  useEffect(() => {
    // Set global state to match local state
    setVoiceEnabled(isVoiceOn);
    
    // If voice is ON, speak instruction for current page
    if (isVoiceOn) {
      speakPageInstruction();
    }
  }, [isVoiceOn]);

  // 🎯 TOGGLE VOICE ON/OFF
  const toggleVoice = () => {
    const newState = !isVoiceOn;
    setIsVoiceOn(newState);
    
    if (!newState) {
      // If turning OFF, stop any current speech
      voiceService.stop();
    }
    // If turning ON, the useEffect above will handle speaking
  };

  // 🎯 SPEAK INSTRUCTION FOR CURRENT PAGE
  const speakPageInstruction = () => {
    if (!isVoiceOn) return; // Safety check
    
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/signature')) {
      voiceService.speakSignatureGuide();
    } else if (currentPath.includes('/submit')) {
      voiceService.speak("Please review your signed document. You can download it or submit when ready.");
    } else if (currentPath.includes('/login')) {
      voiceService.speak("Welcome. Please enter your birthday to continue.");
    } else if (currentPath.includes('/pdf')) {
      voiceService.speak("Please review your document. When ready, click the sign button to proceed.");
    }
  };

  return (
    <button
      onClick={toggleVoice}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: isVoiceOn ? '#1C304A' : '#6c757d',
        color: 'white',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        zIndex: 1000,
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
      }}
      title={isVoiceOn ? "Turn off voice guidance" : "Turn on voice guidance"}
    >
      {isVoiceOn ? '🔊' : '🔈'}
    </button>
  );
};

export default VoiceAssistant;