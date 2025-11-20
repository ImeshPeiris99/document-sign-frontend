// ✍️ SignaturePage.jsx - RESPONSIVE VERSION (WORKS ON ALL SCREENS)
import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { isVoiceEnabled } from '../components/VoiceAssistant';
import voiceService from "../services/voiceService";

const SignaturePage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const sigCanvas = useRef(null);
  const canvasContainerRef = useRef(null);
  const [penColor, setPenColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 300 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 1024);

  // 🎨 Available colors
  const colors = [
    "#000000", "#FF0000", "#0000FF", "#008000",
    "#800080", "#FFA500", "#FF69B4"
  ];

  // 🆕 ENHANCED RESPONSIVE LAYOUT HANDLER
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLargeScreen(width > 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 📏 ENHANCED Adjust canvas size to fit container - OPTIMIZED FOR ALL SCREENS
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const container = canvasContainerRef.current;
        const width = container.clientWidth * 0.95;
        
        // 🆕 IMPROVED HEIGHT CALCULATION FOR MOBILE LARGE SCREENS
        let height;
        if (isLargeScreen) {
          // For large screens (desktop/laptop)
          height = container.clientHeight * 0.95;
        } else if (isMobile) {
          // For mobile devices - use more vertical space on larger phones
          const screenHeight = window.innerHeight;
          if (screenHeight > 800) {
            // Large phones (iPhone 14 Pro Max, Samsung S22 Ultra, etc.)
            height = container.clientHeight * 0.85;
          } else if (screenHeight > 700) {
            // Medium phones
            height = container.clientHeight * 0.80;
          } else {
            // Small phones
            height = container.clientHeight * 0.75;
          }
        } else {
          // For tablets
          height = container.clientHeight * 0.90;
        }
        
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isMobile, isLargeScreen]);

  // 🆕 VOICE GUIDANCE EFFECT - ADD THIS NEW useEffect
  useEffect(() => {
    if (!isVoiceEnabled) return;
    // Speak instructions when patient arrives on signature page
    voiceService.speakSignatureGuide();
    
    // Cleanup - stop voice when leaving page
    return () => {
      voiceService.stop();
    };
  }, []);

  // 🧹 Clear signature
  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  // 🎨 Color picker handlers
  const toggleColorPicker = () => setShowColorPicker(!showColorPicker);
  const selectColor = (color) => {
    setPenColor(color);
    setShowColorPicker(false);
  };

  // 💾 Save signature with date & time (SILENT VERSION)
  const saveSignature = () => {
    if (sigCanvas.current && sigCanvas.current.isEmpty()) {
      voiceService.speak("Please provide your signature before saving.");
      alert("Please provide your signature before saving.");
      return;
    }

    try {
      // ✅ Get signature as Base64 PNG
      const signatureData = sigCanvas.current.getCanvas().toDataURL("image/png");

      // ✅ Generate formatted date & time
      const now = new Date();
      const date = now.toLocaleDateString("en-CA");
      const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const dateTimeText = `Date: ${date}\nTime: ${time}`;

      // 🧠 Save both to localStorage
      localStorage.setItem("patientSignature", signatureData);
      localStorage.setItem("signatureDateTime", dateTimeText);

      console.log("Signature + Date/Time saved locally ✅");

      // 🎯 SILENT NAVIGATION - No voice confirmation
      navigate(`/submit/${uuid}`);
      
    } catch (error) {
      console.error("Error saving signature:", error);
      voiceService.speak("Error saving signature. Please try again.");
      alert("Failed to save signature. Please try again.");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "inter",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* 🔹 Header */}
      <div
        style={{
          backgroundColor: "#1C304A",
          color: "#FFFFFF",
          padding: isMobile ? "12px 15px" : "12px 20px",
          fontWeight: "bold",
          fontSize: isMobile ? "16px" : "18px",
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: 0,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: isMobile ? "18px" : "20px",
            cursor: "pointer",
            padding: 0,
            margin: 0,
          }}
        >
          ←
        </button>
        Add Signature
      </div>

      {/* 🔹 Main Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: isMobile ? "8px" : "8px",
          gap: isMobile ? "8px" : "8px",
          width: "100%",
          marginBottom: "0.5%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Inner Container */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: isMobile ? "15px" : "15px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            position: "relative",
            minHeight: "0",
          }}
        >
          {/* 🖋 Signature Canvas - ENHANCED FOR LARGE MOBILE SCREENS */}
          <div
            ref={canvasContainerRef}
            style={{
              backgroundColor: "#F8F9FA",
              width: "100%",
              flex: 1,
              borderRadius: "8px",
              border: "2px dashed #D1D5DB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              marginBottom: isMobile ? "15px" : "15px",
              // 🆕 ENHANCED SCALING FOR LARGE MOBILE SCREENS
              minHeight: "250px",
              height: isLargeScreen ? "70vh" : (isMobile ? "55vh" : "65vh"),
              maxHeight: isLargeScreen ? "800px" : (isMobile ? "500px" : "700px"),
              position: "relative",
            }}
          >
            <SignatureCanvas
              ref={sigCanvas}
              penColor={penColor}
              canvasProps={{
                width: canvasSize.width,
                height: canvasSize.height,
                style: {
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  borderRadius: "6px",
                  cursor: "crosshair",
                },
              }}
              clearOnResize={false}
              throttle={0}
              minWidth={isMobile ? 2 : 2.5}
              maxWidth={isMobile ? 3 : 4}
              onBegin={() => console.log("Drawing started")}
              onEnd={() => console.log("Drawing ended")}
            />
          </div>

          {/* 🔹 Controls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: isMobile ? "12px" : "12px",
              width: "100%",
            }}
          >
            {/* Clear Signature Button */}
            <button
              onClick={clearSignature}
              style={{
                background: "none",
                border: "none",
                color: "#007bff",
                fontSize: isMobile ? "14px" : "15px",
                cursor: "pointer",
                textDecoration: "underline",
                padding: "5px 10px",
              }}
            >
              Clear signature
            </button>

            {/* Color Picker */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: isMobile ? "6px" : "6px",
                width: "100%",
                paddingLeft: isMobile ? "5px" : "10px",
              }}
            >
              <button
                onClick={toggleColorPicker}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Change color
              </button>

              <div
                style={{
                  width: isMobile ? "35px" : "35px",
                  height: isMobile ? "35px" : "35px",
                  borderRadius: "50%",
                  border: "2px solid #E5E7EB",
                  backgroundColor: penColor,
                  cursor: "pointer",
                }}
                onClick={toggleColorPicker}
              />

              {showColorPicker && (
                <div
                  style={{
                    position: "absolute",
                    bottom: isMobile ? "100px" : "140px",
                    left: isMobile ? "20px" : "25px",
                    display: "flex",
                    gap: isMobile ? "8px" : "8px",
                    backgroundColor: "white",
                    padding: isMobile ? "12px" : "12px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    animation: "fadeInUp 0.3s ease-out",
                    flexWrap: "wrap",
                    maxWidth: isMobile ? "200px" : "220px",
                  }}
                >
                  {colors.map((color, index) => (
                    <div
                      key={color}
                      onClick={() => selectColor(color)}
                      style={{
                        width: isMobile ? "30px" : "30px",
                        height: isMobile ? "30px" : "30px",
                        borderRadius: "50%",
                        backgroundColor: color,
                        border:
                          color === penColor
                            ? "3px solid #007bff"
                            : "2px solid #E5E7EB",
                        cursor: "pointer",
                        animation: `scaleIn 0.2s ease-out ${index * 0.05}s both`,
                        transform: "scale(0)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ✅ Save Signature Button */}
            <button
              onClick={saveSignature}
              style={{
                backgroundColor: "#1C304A",
                color: "#FFFFFF",
                padding: isMobile ? "14px 30px" : "14px 35px",
                border: "none",
                borderRadius: "8px",
                fontSize: isMobile ? "15px" : "15px",
                fontWeight: "600",
                cursor: "pointer",
                width: "100%",
                maxWidth: isMobile ? "180px" : "180px",
                boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
                marginTop: isMobile ? "5px" : "5px",
              }}
            >
              Save Signature
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 Global Styles */}
      <style>{`
        body {
          margin: 0;
          padding: 0;
          font-family: inter, sans-serif;
        }
        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100%;
        }

        .sigCanvas {
          touch-action: none;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* 🆕 REMOVE SCROLLBARS */
        ::-webkit-scrollbar {
          display: none;
        }
        
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default SignaturePage;