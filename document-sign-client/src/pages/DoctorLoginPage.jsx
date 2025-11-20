import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";

const DoctorLoginPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const pinInputRefs = useRef([]);

  const [pin, setPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // 🎯 RESPONSIVE LAYOUT HANDLER
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🎯 FOCUS FIRST INPUT ON MOUNT - FOR MOBILE NUMBER PAD
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pinInputRefs.current[0]) {
        pinInputRefs.current[0].focus();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // 🎯 SUCCESS MESSAGE ANIMATION
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  // 🎯 HANDLE PIN INPUT
  const handlePinChange = (index, value) => {
    // Only allow numbers
    if (!/^\d?$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(""); // Clear error when user types

    // Auto-focus next input
    if (value && index < 3) {
      setFocusedIndex(index + 1);
      setTimeout(() => {
        if (pinInputRefs.current[index + 1]) {
          pinInputRefs.current[index + 1].focus();
        }
      }, 10);
    }
  };

  // 🎯 HANDLE BACKSPACE
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // Move to previous input on backspace
      setFocusedIndex(index - 1);
      setTimeout(() => {
        if (pinInputRefs.current[index - 1]) {
          pinInputRefs.current[index - 1].focus();
        }
      }, 10);
    }
  };

  // 🎯 HANDLE PASTE
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numbers = pastedData.replace(/\D/g, '').slice(0, 4).split('');
    
    const newPin = [...pin];
    numbers.forEach((num, index) => {
      if (index < 4) {
        newPin[index] = num;
      }
    });
    
    setPin(newPin);
    
    // Focus last filled input or last input
    const lastFilledIndex = Math.min(numbers.length - 1, 3);
    setFocusedIndex(lastFilledIndex);
    setTimeout(() => {
      if (pinInputRefs.current[lastFilledIndex]) {
        pinInputRefs.current[lastFilledIndex].focus();
      }
    }, 10);
  };

  // 🎯 HANDLE TOUCH/FOCUS FOR MOBILE NUMBER PAD
  const handleInputFocus = (index) => {
    setFocusedIndex(index);
    
    // 🆕 FORCE MOBILE NUMBER PAD ON TOUCH
    if (isMobile) {
      const input = pinInputRefs.current[index];
      if (input) {
        // Blur and focus to trigger mobile keyboard
        input.blur();
        setTimeout(() => {
          input.focus();
        }, 50);
      }
    }
  };

  // 🆕 HELPER FUNCTION TO FIND LAST FILLED INPUT
  const findLastFilledIndex = () => {
    for (let i = 3; i >= 0; i--) {
      if (pin[i]) {
        return i; // Return the index of the last filled input
      }
    }
    return 0; // If all empty, return first input
  };

  // 🎯 HANDLE DOCTOR LOGIN - FIXED CURSOR POSITION
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setShowSuccessMessage(false);

    const pinString = pin.join('');
    
    // 🎯 PIN VALIDATION
    if (pinString.length !== 4) {
      setError("Invalid pin");
      // � FIND THE LAST FILLED INPUT AND FOCUS THERE
      const lastFilledIndex = findLastFilledIndex();
      setFocusedIndex(lastFilledIndex);
      setTimeout(() => {
        if (pinInputRefs.current[lastFilledIndex]) {
          pinInputRefs.current[lastFilledIndex].focus();
        }
      }, 10);
      return;
    }

    if (!/^\d{4}$/.test(pinString)) {
      setError("Invalid pin");
      // 🆕 FIND THE LAST FILLED INPUT AND FOCUS THERE
      const lastFilledIndex = findLastFilledIndex();
      setFocusedIndex(lastFilledIndex);
      setTimeout(() => {
        if (pinInputRefs.current[lastFilledIndex]) {
          pinInputRefs.current[lastFilledIndex].focus();
        }
      }, 10);
      return;
    }

    setLoading(true);
    try {
      // 🎯 CALL DOCTOR LOGIN API
      const response = await api.post("/doctorlogin", {
        uuid: uuid,
        pin: pinString,
      });

      if (response.status === 200) {
        setSuccess(true);
        localStorage.setItem("doctorUuid", uuid);
        localStorage.setItem("userType", "doctor");
        
        // 🎯 REDIRECT TO PDF PAGE AFTER SUCCESS
        setTimeout(() => {
          navigate(`/pdf/${uuid}`);
        }, 2000);
      }
    } catch (err) {
      console.error("Doctor login failed:", err);
      setError("Invalid pin");
      // 🆕 FIND THE LAST FILLED INPUT AND FOCUS THERE
      const lastFilledIndex = findLastFilledIndex();
      setFocusedIndex(lastFilledIndex);
      setTimeout(() => {
        if (pinInputRefs.current[lastFilledIndex]) {
          pinInputRefs.current[lastFilledIndex].focus();
        }
      }, 10);
    } finally {
      setLoading(false);
    }    
  };

  const isButtonEnabled = pin.join('').length === 4;

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: isMobile ? "15px" : "15px",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 🔹 MAIN CONTAINER */}
      <div
        style={{
          backgroundColor: "#C8D6E126",
          borderRadius: "12px",
          padding: isMobile ? "25px 20px" : "30px 25px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: isMobile ? "100%" : "350px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* 🔹 LOGO */}
        <div style={{ 
          marginBottom: isMobile ? "20px" : "25px",
          textAlign: "center"
        }}>
          <ShieldCheck 
            size={isMobile ? 80 : 70}
            color={error ? "#dc3545" : "#007bff"}
            strokeWidth={0.5}
            style={{ margin: "0 auto 8px auto" }}
          />
        </div>

        {/* 🔹 MAIN HEADER */}
        <h1
          style={{
            fontSize: isMobile ? "20px" : "18px",
            fontWeight: "bold",
            color: "#046B99",
            marginBottom: "6px",
            textAlign: "center",
          }}
        >
          Verify Login
        </h1>

        {/* 🔹 SUBHEADER INSTRUCTION */}
        <p
          style={{
            fontSize: isMobile ? "13px" : "12px",
            color: "#666666",
            marginBottom: isMobile ? "30px" : "25px",
            textAlign: "center",
            lineHeight: "1.4",
          }}
        >
          Enter pin to verify your login
        </p>

        {/* 🔹 4-SQUARE PIN INPUT - MOBILE OPTIMIZED */}
        <div style={{ 
          marginBottom: error ? "10px" : isMobile ? "25px" : "20px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: isMobile ? "8px" : "12px",
        }}>
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              ref={el => pinInputRefs.current[index] = el}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="1"
              value={pin[index]}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleInputFocus(index)}
              onTouchStart={() => handleInputFocus(index)}
              style={{
                width: isMobile ? "55px" : "60px",
                height: isMobile ? "55px" : "60px",
                fontSize: isMobile ? "22px" : "24px",
                fontWeight: "bold",
                textAlign: "center",
                border: `2px solid ${
                  error ? "#dc3545" : 
                  focusedIndex === index ? "#007bff" : "#e0e0e0"
                }`,
                borderRadius: "8px",
                backgroundColor: "white",
                outline: "none",
                transition: "all 0.2s ease",
                color: error ? "#dc3545" : "#000000",
                boxShadow: focusedIndex === index ? "0 0 0 2px rgba(0, 123, 255, 0.25)" : "none",
                WebkitAppearance: "none",
                MozAppearance: "textfield",
              }}
              disabled={success || loading}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* 🔹 ERROR MESSAGE */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc3545",
              fontSize: isMobile ? "13px" : "12px",
              textAlign: "center",
              marginBottom: "15px",
              fontWeight: "500",
              gap: "6px",
              animation: "shake 0.5s ease-in-out",
            }}
          >
            <AlertCircle size={isMobile ? 14 : 12} color="#dc3545" />
            {error}
          </div>
        )}

        {/* 🔹 CONFIRM BUTTON */}
        <button
          onClick={handleLogin}
          disabled={!isButtonEnabled || loading || success}
          style={{
            width: "100%",
            padding: isMobile ? "14px" : "12px",
            fontSize: isMobile ? "16px" : "14px",
            fontWeight: "600",
            border: "none",
            borderRadius: "8px",
            cursor: isButtonEnabled && !loading && !success ? "pointer" : "not-allowed",
            backgroundColor: success ? "#28a745" : (isButtonEnabled ? "#007bff" : "#cccccc"),
            color: "white",
            transition: "all 0.2s ease",
            marginBottom: "15px",
            minHeight: "44px",
          }}
        >
          {loading ? "Verifying..." : success ? "Verified!" : "Confirm"}
        </button>

        {/* 🔹 SUCCESS MESSAGE */}
        {showSuccessMessage && (
          <div
            style={{
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              color: "#155724",
              padding: isMobile ? "15px" : "12px",
              borderRadius: "8px",
              marginTop: "15px",
              textAlign: "center",
              animation: "slideUp 0.3s ease-out",
              transform: "translateY(0)",
              opacity: 1,
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: isMobile ? "8px" : "6px",
            }}>
              <CheckCircle 
                size={isMobile ? 28 : 24}
                color="#28a745" 
                fill="#d4edda"
                strokeWidth={1.5}
              />
            </div>
            <div style={{ 
              fontWeight: "bold", 
              fontSize: isMobile ? "16px" : "14px",
              marginBottom: "4px",
              color: "#155724",
            }}>
              Verified!
            </div>
            <div style={{ 
              fontSize: isMobile ? "13px" : "12px",
              color: "#155724",
              lineHeight: "1.4",
            }}>
              You have successfully verified.
            </div>
          </div>
        )}
      </div>

      {/* 🔹 CUSTOM STYLES */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="tel"] { -webkit-appearance: none; -moz-appearance: textfield; }
        input[type="tel"]::-webkit-outer-spin-button,
        input[type="tel"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};

export default DoctorLoginPage;