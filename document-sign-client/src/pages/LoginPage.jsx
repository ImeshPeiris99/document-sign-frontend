import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { ShieldCheck, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const LoginPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  const [birthday, setBirthday] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 🆕 RESPONSIVE LAYOUT HANDLER
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setShowSuccessMessage(false);

    if (!birthday) {
      setError("Your Date of Birth is Incorrect");
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthday)) {
      setError("Your Date of Birth is Incorrect");
      return;
    }

    const [day, month, year] = birthday.split('/').map(Number);
    
    if (day < 1 || day > 31) {
      setError("Your Date of Birth is Incorrect");
      return;
    }
    
    if (month < 1 || month > 12) {
      setError("Your Date of Birth is Incorrect");
      return;
    }

    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1 || date.getDate() !== day) {
      setError("Your Date of Birth is Incorrect");
      return;
    }

    const formattedBirthday = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    setLoading(true);
    try {
      const response = await api.post("/login", {
        uuid: uuid,
        birthday: formattedBirthday,
      });

      if (response.status === 200) {
        setSuccess(true);
        localStorage.setItem("patientUuid", uuid);
        
        setTimeout(() => {
          navigate(`/pdf/${uuid}`);
        }, 2000);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Your Date of Birth is Incorrect");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 2) {
      const day = parseInt(value);
      if (value.length === 2 && (day < 1 || day > 31)) {
        return;
      }
      setBirthday(value);
    } 
    else if (value.length <= 4) {
      const day = parseInt(value.substring(0, 2));
      const month = parseInt(value.substring(2));
      
      if (value.length === 4) {
        if (month < 1 || month > 12) {
          return;
        }
        const maxDays = getDaysInMonth(month, new Date().getFullYear());
        if (day > maxDays) {
          const correctedDay = maxDays.toString().padStart(2, '0');
          setBirthday(`${correctedDay}/${month.toString().padStart(2, '0')}`);
          return;
        }
      }
      setBirthday(value.substring(0, 2) + '/' + value.substring(2));
    } 
    else if (value.length <= 8) {
      const day = parseInt(value.substring(0, 2));
      const month = parseInt(value.substring(2, 4));
      
      if (value.length >= 4) {
        if (month < 1 || month > 12) {
          return;
        }
        
        const maxDays = getDaysInMonth(month, new Date().getFullYear());
        let correctedDay = day;
        
        if (day > maxDays) {
          correctedDay = maxDays;
        }
        
        const formattedDay = correctedDay.toString().padStart(2, '0');
        const formattedMonth = month.toString().padStart(2, '0');
        const yearPart = value.substring(4, 8);
        
        setBirthday(`${formattedDay}/${formattedMonth}/${yearPart}`);
      } else {
        setBirthday(value.substring(0, 2) + '/' + value.substring(2, 4) + '/' + value.substring(4, 8));
      }
    } else {
      setBirthday(value);
    }
  };

  const handleInputBlur = () => {
    if (birthday.length === 10) {
      const [day, month, year] = birthday.split('/').map(Number);
      
      if (month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
        const maxDays = getDaysInMonth(month, year);
        if (day > maxDays) {
          const correctedDay = maxDays.toString().padStart(2, '0');
          const formattedMonth = month.toString().padStart(2, '0');
          setBirthday(`${correctedDay}/${formattedMonth}/${year}`);
        }
      }
    }
  };

  const handleCalendarClick = () => {
    setShowCalendar(!showCalendar);
  };

  const handleDateSelect = (date) => {
    if (date) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      setBirthday(`${day}/${month}/${year}`);
    }
    setShowCalendar(false);
  };

  const isButtonEnabled = /^\d{2}\/\d{2}\/\d{4}$/.test(birthday);

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
        overflow: "hidden", // 🆕 Prevent scrolling
      }}
    >
      {/* 🔹 MAIN CONTAINER WITH CARD STYLING - SMALLER ON DESKTOP */}
      <div
        style={{
          backgroundColor: "#C8D6E126",
          borderRadius: "12px",
          padding: isMobile ? "25px 20px" : "30px 25px", // 🆕 Reduced desktop padding
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: isMobile ? "100%" : "350px", // 🆕 Smaller container on desktop
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* 🔹 LOGO - SMALLER ON DESKTOP */}
        <div style={{ 
          marginBottom: isMobile ? "20px" : "25px", // 🆕 Reduced margin
          textAlign: "center"
        }}>
          <ShieldCheck 
            size={isMobile ? 80 : 70} // 🆕 Smaller logo on desktop
            color={error ? "#dc3545" : "#007bff"}
            strokeWidth={0.5}
            style={{ margin: "0 auto 8px auto" }} // 🆕 Reduced margin
          />
        </div>

        {/* 🔹 MAIN HEADER - SMALLER ON DESKTOP */}
        <h1
          style={{
            fontSize: isMobile ? "20px" : "18px", // 🆕 Smaller font on desktop
            fontWeight: "bold",
            color: "#046B99",
            marginBottom: "6px", // 🆕 Reduced margin
            textAlign: "center",
          }}
        >
          Verify your Login
        </h1>

        {/* 🔹 SUBHEADER INSTRUCTION - SMALLER ON DESKTOP */}
        <p
          style={{
            fontSize: isMobile ? "13px" : "12px", // 🆕 Smaller font on desktop
            color: "#666666",
            marginBottom: isMobile ? "30px" : "25px", // 🆕 Reduced margin
            textAlign: "center",
            lineHeight: "1.4",
          }}
        >
          Enter your Date of Birth to verify login
        </p>

        {/* 🔹 DATE INPUT SECTION */}
        <div style={{ 
          position: "relative", 
          marginBottom: error ? "10px" : isMobile ? "25px" : "20px", // 🆕 Reduced margin
          width: "100%",
          display: "flex",
          alignItems: "flex-end",
        }}>
          <input
            type="text"
            placeholder="DD/MM/YYYY"
            value={birthday}
            onChange={handleDateChange}
            onBlur={handleInputBlur}
            maxLength={10}
            style={{
              flex: "1",
              padding: isMobile ? "10px 30px 10px 0px" : "10px 30px 10px 0px", // 🆕 Reduced padding
              fontSize: isMobile ? "15px" : "14px", // 🆕 Smaller font on desktop
              border: "none",
              borderBottom: error ? "2px solid #dc3545" : "2px solid #e0e0e0",
              backgroundColor: "transparent",
              textAlign: "left",
              outline: "none",
              color: error ? "#dc3545" : "#000000",
            }}
            disabled={success || loading}
          />
          
          <Calendar
            size={isMobile ? 20 : 18} // 🆕 Smaller icon on desktop
            color={error ? "#dc3545" : "#666666"}
            style={{
              position: "absolute",
              right: "0px",
              bottom: isMobile ? "10px" : "10px", // 🆕 Adjusted position
              cursor: success || loading ? "not-allowed" : "pointer"
            }}
            onClick={handleCalendarClick}
          />
        </div>

        {/* 🔹 ERROR MESSAGE */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc3545",
              fontSize: isMobile ? "13px" : "12px", // 🆕 Smaller font on desktop
              textAlign: "center",
              marginBottom: "15px", // 🆕 Reduced margin
              fontWeight: "500",
              gap: "6px",
            }}
          >
            <AlertCircle size={isMobile ? 14 : 12} color="#dc3545" /> {/* 🆕 Smaller icon */}
            {error}
          </div>
        )}

        {/* 🔹 CONFIRM BUTTON - SMALLER ON DESKTOP */}
        <button
          onClick={handleLogin}
          disabled={!isButtonEnabled || loading || success}
          style={{
            width: "100%",
            padding: isMobile ? "12px" : "10px", // 🆕 Reduced padding
            fontSize: isMobile ? "15px" : "14px", // 🆕 Smaller font
            fontWeight: "600",
            border: "none",
            borderRadius: "8px",
            cursor: isButtonEnabled && !loading && !success ? "pointer" : "not-allowed",
            backgroundColor: success ? "#28a745" : (isButtonEnabled ? "#007bff" : "#cccccc"),
            color: "white",
            transition: "all 0.2s ease",
            marginBottom: "15px", // 🆕 Reduced margin
          }}
        >
          {loading ? "Verifying..." : success ? "Verified!" : "Confirm"}
        </button>

        {/* 🔹 CALENDAR POPUP - COMPACT ON DESKTOP */}
        {showCalendar && (
          <div 
            ref={calendarRef}
            style={{
              width: "100%",
              marginTop: "8px", // 🆕 Reduced margin
              zIndex: 1000,
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              border: "1px solid #e0e0e0",
              maxHeight: isMobile ? "auto" : "300px", // 🆕 Limit height on desktop
            }}
          >
            <ReactCalendar
              onChange={handleDateSelect}
              value={birthday ? new Date(birthday.split('/').reverse().join('-')) : new Date()}
              maxDate={new Date()}
              className={`custom-calendar ${isMobile ? '' : 'compact-calendar'}`} // 🆕 Compact class for desktop
            />
          </div>
        )}

        {/* 🔹 SUCCESS MESSAGE - COMPACT ON DESKTOP */}
        {showSuccessMessage && (
          <div
            style={{
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              color: "#155724",
              padding: isMobile ? "15px" : "12px", // 🆕 Reduced padding
              borderRadius: "8px",
              marginTop: "15px", // 🆕 Reduced margin
              textAlign: "center",
              animation: "slideUp 0.3s ease-out",
              transform: "translateY(0)",
              opacity: 1,
            }}
          >
            {/* 🔹 CHECKMARK ICON CONTAINER */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: isMobile ? "8px" : "6px", // 🆕 Reduced margin
            }}>
              <CheckCircle 
                size={isMobile ? 28 : 24} // 🆕 Smaller icon on desktop
                color="#28a745" 
                fill="#d4edda"
                strokeWidth={1.5}
              />
            </div>
            
            {/* 🔹 SUCCESS TEXT */}
            <div style={{ 
              fontWeight: "bold", 
              fontSize: isMobile ? "16px" : "14px", // 🆕 Smaller font
              marginBottom: "4px", // 🆕 Reduced margin
              color: "#155724",
            }}>
              Verified!
            </div>
            <div style={{ 
              fontSize: isMobile ? "13px" : "12px", // 🆕 Smaller font
              color: "#155724",
              lineHeight: "1.4",
            }}>
              You have successfully verified.
            </div>
          </div>
        )}
      </div>

      {/* 🔹 CUSTOM STYLES FOR ANIMATION AND CALENDAR */}
      <style>{`
        .custom-calendar {
          width: 100% !important;
          border: none !important;
          font-family: Arial, sans-serif !important;
        }
        
        /* 🆕 COMPACT CALENDAR FOR DESKTOP */
        .compact-calendar .react-calendar__navigation {
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          margin-bottom: 0;
          padding: 8px 4px !important;
        }
        
        .compact-calendar .react-calendar__navigation button {
          font-size: 12px !important;
          padding: 6px 8px !important;
        }
        
        .compact-calendar .react-calendar__tile {
          padding: 8px 4px !important;
          font-size: 12px !important;
        }
        
        .compact-calendar .react-calendar__month-view__weekdays {
          font-size: 11px !important;
        }
        
        .custom-calendar .react-calendar__tile--active {
          background: #007bff !important;
          color: white !important;
        }
        
        .custom-calendar .react-calendar__tile:enabled:hover,
        .custom-calendar .react-calendar__tile:enabled:focus {
          background: #e9ecef;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* 🆕 MOBILE OPTIMIZATIONS */
        @media (max-width: 480px) {
          .custom-calendar .react-calendar__navigation button {
            padding: 8px 4px;
            font-size: 12px;
          }
          
          .custom-calendar .react-calendar__tile {
            padding: 8px 4px;
            font-size: 12px;
          }
        }

        /* 🆕 REMOVE SCROLLBARS */
        ::-webkit-scrollbar {
          display: none;
        }
        
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .custom-calendar {
          width: 100% !important;
          border: none !important;
          font-family: Arial, sans-serif !important;
        }
        
        /* 🆕 COMPACT CALENDAR FOR DESKTOP */
        .compact-calendar .react-calendar__navigation {
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          margin-bottom: 0;
          padding: 8px 4px !important;
        }

      `}</style>
    </div>
  );
};

export default LoginPage;