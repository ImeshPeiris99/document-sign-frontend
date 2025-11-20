// VoiceAssistant.jsx - FIXED TO ONLY SPEAK WHEN CLICKED
import React, { useState, useEffect } from 'react';
import voiceService from '../services/voiceService';

// 🎯 GLOBAL VOICE STATE - Shared across all components
export let isVoiceEnabled = false;
export const setVoiceEnabled = (enabled) => {
  isVoiceEnabled = enabled;
  // 🎯 SAVE TO LOCALSTORAGE SO IT PERSISTS ACROSS PAGES
  localStorage.setItem('voiceAssistantEnabled', enabled.toString());
  console.log("🔊 Voice state saved to localStorage:", enabled);
};

const VoiceAssistant = () => {
  // 🎯 LOAD VOICE STATE FROM LOCALSTORAGE ON COMPONENT MOUNT
  const [isVoiceOn, setIsVoiceOn] = useState(() => {
    const savedState = localStorage.getItem('voiceAssistantEnabled');
    const initialState = savedState === 'true';
    console.log("🔊 Initial voice state from localStorage:", initialState);
    return initialState;
  });

  // 🎯 SYNC LOCAL STATE WITH GLOBAL STATE ON MOUNT AND CHANGES
  useEffect(() => {
    console.log("🔊 Syncing global voice state to:", isVoiceOn);
    // Set global state to match local state
    setVoiceEnabled(isVoiceOn);
  }, [isVoiceOn]);

  // 🎯 TOGGLE VOICE ON/OFF - ONLY SPEAK WHEN USER CLICKS TO TURN ON
  const toggleVoice = () => {
    const newState = !isVoiceOn;
    console.log("🔊 Toggling voice to:", newState);
    setIsVoiceOn(newState);
    
    // 🎯 ONLY SPEAK WHEN USER TURNS VOICE ON (not when turning off)
    if (newState) {
      console.log("🔊 Voice turned ON - speaking page instruction");
      speakPageInstruction();
    } else {
      console.log("🔊 Voice turned OFF - stopping any speech");
      voiceService.stop();
    }
  };

  // 🎯 SPEAK INSTRUCTION FOR CURRENT PAGE
  const speakPageInstruction = () => {
    const currentPath = window.location.pathname;
    console.log("🔊 Speaking instruction for path:", currentPath);
    
    if (currentPath.includes('/signature') || currentPath.includes('/sign/')) {
      voiceService.speakSignatureGuide();
    } else if (currentPath.includes('/submit')) {
      voiceService.speak("Please review your signed document. You can download it or submit when ready.");
    } else if (currentPath.includes('/login')) {
      voiceService.speak("Welcome. Please enter your birthday to continue.");
    } else if (currentPath.includes('/doctor-login')) {
      voiceService.speak("Please enter your PIN to continue."); // 🆕 ADDED DOCTOR LOGIN
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