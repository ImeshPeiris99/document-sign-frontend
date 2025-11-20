// 📄 PdfViewerPage.jsx - UPDATED FOR DOCTORS & PATIENTS
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { PDFDocument, rgb } from "pdf-lib";
import { isVoiceEnabled } from '../components/VoiceAssistant';
import voiceService from "../services/voiceService";

// ✅ Import React-PDF and configure local worker
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfViewerPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const pdfContainerRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.6);
  
  // 🆕 NEW STATE FOR TYPE2 PDFs
  const [pdfType, setPdfType] = useState(null);
  const [answers, setAnswers] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
    phone: ""
  });
  const [answeredPdfUrl, setAnsweredPdfUrl] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [originalPdfBytes, setOriginalPdfBytes] = useState(null);
  const [pdfUpdateCount, setPdfUpdateCount] = useState(0);
  const [signatureFields, setSignatureFields] = useState([]);
  const [aiScanning, setAiScanning] = useState(false);

  // 🎯 QUESTION COORDINATES FOR TYPE2 PDFs
  const questionCoordinates = {
    name: { x: 110, y: 478, page: 0 },
    address: { x: 120, y: 458, page: 0 },
    city: { x: 258, y: 442, page: 0 },
    state: { x: 360, y: 442, page: 0 },
    zipCode: { x: 530, y: 442, page: 0 },
    email: { x: 110, y: 421, page: 0 },
    phone: { x: 370, y: 421, page: 0 }
  };

  // 🎯 ADD VOICE FOR PDF VIEWER PAGE
  useEffect(() => {
    // Check if voice assistant is turned ON by user
    if (!isVoiceEnabled) return;
    voiceService.speak("Please review your document. When ready, click the sign button to proceed with your signature");
  }, []);

  // 🧠 Fetch PDF and detect type - UPDATED FOR DOCTORS & PATIENTS
  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const response = await api.get(`/Pdf/${uuid}`);

        if (response.status === 200 && response.data?.pdfBase64) {
          // ✅ Save the raw Base64 string locally
          localStorage.setItem("currentPdfBase64", response.data.pdfBase64);
          localStorage.setItem("pdfTypeName", response.data.pdfName);

          // 🆕 DETECT USER TYPE (DOCTOR OR PATIENT)
          const isDoctor = response.data.userType === 'doctor';
          const userType = isDoctor ? 'doctor' : 'patient';
          localStorage.setItem("userType", userType); // 🆕 Store user type

          // 🆕 DETECT PDF TYPE BASED ON USER TYPE
          if (isDoctor) {
            // Doctors get simple PDF view (no form filling)
            setPdfType('doctor');
            console.log("👨‍⚕️ Doctor PDF loaded");
          } else {
            // Patients can have Type1 or Type2 PDFs
            const isType2 = response.data.pdfName?.toLowerCase().includes('type2');
            setPdfType(isType2 ? 'type2' : 'type1');
            console.log(`👤 Patient PDF loaded: ${isType2 ? 'Type2' : 'Type1'}`);
          }

          // Convert Base64 to Blob → URL for preview
          const byteCharacters = atob(response.data.pdfBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          
          // 🆕 SAVE ORIGINAL PDF BYTES FOR CLEAN UPDATES
          setOriginalPdfBytes(byteArray);
          
          const blob = new Blob([byteArray], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          
          // 🆕 For type2 patients, also set answered PDF URL initially
          // Doctors and Type1 patients get simple PDF view
          if (pdfType === 'type2') {
            setAnsweredPdfUrl(url);
          } else if (isDoctor) {
            // Doctors always get simple PDF view (no forms)
            setAnsweredPdfUrl(url);
          }
        } else {
          setError("PDF not found for this user.");
        }
      } catch (err) {
        console.error("Error fetching PDF:", err);
        setError("Failed to load PDF. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    // 🧹 Cleanup blob URLs
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      if (answeredPdfUrl) URL.revokeObjectURL(answeredPdfUrl);
    };
  }, [uuid]);

  // 🆕 AUTO-SCROLL TO ANSWER POSITION
  const scrollToAnswerPosition = (field) => {
    if (!questionCoordinates[field] || !pdfContainerRef.current) return;
    
    const { y } = questionCoordinates[field];
    
    // Calculate scroll position
    const pdfHeight = 792;
    const scrollY = pdfHeight - y;
    
    // Apply scaling and adjust for your layout
    const scaledScrollY = (scrollY * scale) - 100;
    
    // Smooth scroll to the answer position
    setTimeout(() => {
      if (pdfContainerRef.current) {
        pdfContainerRef.current.scrollTo({
          top: Math.max(0, scaledScrollY),
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // 🆕 FIXED: UPDATE PDF WITH ANSWERS AND TRACK UPDATES
  const updatePdfWithAnswers = async (updatedAnswers) => {
    try {
      if (!originalPdfBytes) return;

      // 🆕 ALWAYS START WITH FRESH ORIGINAL PDF (No overlapping)
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const pages = pdfDoc.getPages();

      // Add answers to PDF at specified coordinates
      Object.entries(updatedAnswers).forEach(([field, answer]) => {
        if (answer && questionCoordinates[field]) {
          const { x, y, page } = questionCoordinates[field];
          if (pages[page]) {
            pages[page].drawText(answer, {
              x: x,
              y: y,
              size: 10,
              color: rgb(0, 0, 0),
            });
          }
        }
      });

      // Save and create new URL
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
      const newUrl = URL.createObjectURL(blob);
      
      // Update answered PDF URL
      if (answeredPdfUrl) URL.revokeObjectURL(answeredPdfUrl);
      setAnsweredPdfUrl(newUrl);
      
      // 🆕 INCREMENT UPDATE COUNT TO TRIGGER RE-SCROLL
      setPdfUpdateCount(prev => prev + 1);
      
      // Save for signature page
      const modifiedPdfBase64 = btoa(
        String.fromCharCode(...new Uint8Array(modifiedPdfBytes))
      );
      localStorage.setItem("currentPdfBase64", modifiedPdfBase64);

    } catch (err) {
      console.error("Error updating PDF with answers:", err);
    }
  };

  // 🆕 RE-SCROLL AFTER PDF UPDATES
  useEffect(() => {
    if (activeQuestion && pdfUpdateCount > 0) {
      // Wait a bit for the PDF to render, then re-scroll
      const timer = setTimeout(() => {
        scrollToAnswerPosition(activeQuestion);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [pdfUpdateCount, activeQuestion]);

  // 🆕 HANDLE ANSWER INPUT
  const handleAnswerChange = (field, value) => {
    const updatedAnswers = {
      ...answers,
      [field]: value
    };
    setAnswers(updatedAnswers);
    updatePdfWithAnswers(updatedAnswers);
  };

  // 🆕 HANDLE QUESTION FOCUS WITH AUTO-SCROLL
  const handleQuestionFocus = (field) => {
    setActiveQuestion(field);
    scrollToAnswerPosition(field);
  };

  // ✍️ Navigate to signature page - UPDATED FOR DOCTORS & PATIENTS
  const handleSignClick = () => {
    const userType = localStorage.getItem("userType") || "patient";
    
    // 🆕 Only patients with Type2 PDFs need to save answers
    if (pdfType === 'type2' && userType === 'patient') {
      localStorage.setItem("patientAnswers", JSON.stringify(answers));
    }
    
    // 🆕 For doctors, no form data to save
    if (userType === 'doctor') {
      console.log("👨‍⚕️ Doctor proceeding to signature");
    }
    
    navigate(`/sign/${uuid}`);
  };

  // 🔍 Zoom handlers
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6));

  // 🆕 RENDER QUESTIONS FORM (Right side for type2) - FIXED SCROLL
  const renderQuestionsForm = () => {
    const isMobile = window.innerWidth < 768;
    
    return (
      <div style={{
        flex: 1,
        padding: isMobile ? "15px" : "20px",
        backgroundColor: "#f8f9fa",
        overflowY: "auto",
        overflowX: "hidden",
        height: "100%",
        // 🆕 FIXED: Remove maxHeight to allow full scrolling
        WebkitOverflowScrolling: "touch",
      }}>
        <h3 style={{ 
          color: "#1C304A", 
          marginBottom: "20px",
          textAlign: "center",
          fontSize: isMobile ? "16px" : "18px"
        }}>
          Please fill in your information
        </h3>
        
        {[
          { key: 'name', label: 'Name' },
          { key: 'address', label: 'Address' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'zipCode', label: 'Zip Code' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' }
        ].map(({ key, label }) => (
          <div key={key} style={{ marginBottom: "12px" }}>
            <label style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
              color: "#1C304A",
              fontSize: isMobile ? "14px" : "16px"
            }}>
              {label}
            </label>
            <input
              type="text"
              value={answers[key]}
              onChange={(e) => handleAnswerChange(key, e.target.value)}
              onFocus={() => handleQuestionFocus(key)}
              style={{
                width: "100%",
                padding: isMobile ? "8px" : "10px",
                border: `2px solid ${activeQuestion === key ? '#007bff' : '#e0e0e0'}`,
                borderRadius: "6px",
                fontSize: isMobile ? "14px" : "16px",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              placeholder={`Enter your ${label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
    );
  };

  // 🆕 RENDER SPLIT SCREEN FOR TYPE2 - FIXED MOBILE
  const renderSplitScreen = () => {
    const isMobile = window.innerWidth < 768;
    
    return (
      <div style={{
        display: "flex",
        flex: 1,
        gap: "20px",
        minHeight: 0,
        flexDirection: isMobile ? "column" : "row"
      }}>
        {/* LEFT SIDE - PDF VIEWER */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          overflow: "hidden",
          minHeight: isMobile ? "50vh" : "auto" // 🆕 Better mobile height
        }}>
          <div style={{ 
            padding: "10px", 
            backgroundColor: "#1C304A", 
            color: "white",
            textAlign: "center",
            fontWeight: "600"
          }}>
            Document Preview {activeQuestion && `- Viewing: ${activeQuestion}`}
          </div>
          <div 
            ref={pdfContainerRef}
            style={{ 
              flex: 1, 
              overflow: "auto", // 🆕 Allow both vertical and horizontal scrolling
              padding: "10px",
              WebkitOverflowScrolling: "touch" // 🆕 Smooth scrolling on iOS
            }}
          >
            {answeredPdfUrl && (
              <div style={{ 
                display: "flex", 
                justifyContent: "center",
                minWidth: "min-content" // 🆕 Allow horizontal scrolling
              }}>
                <Document
                  file={answeredPdfUrl}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      scale={isMobile ? 1.0 : scale} // 🆕 Fixed mobile zoom
                    />
                  ))}
                </Document>
              </div>
            )}
          </div>
          
          {/* Zoom Controls - Hide on mobile or show smaller */}
          <div style={{ 
            textAlign: "center", 
            padding: "10px", 
            borderTop: "1px solid #e0e0e0",
            display: isMobile ? "none" : "block" // 🆕 Hide zoom on mobile
          }}>
            <button onClick={zoomOut} style={zoomButtonStyle}>➖ Zoom Out</button>
            <button onClick={zoomIn} style={zoomButtonStyle}>➕ Zoom In</button>
          </div>

          {/* 🆕 MOBILE ZOOM CONTROLS */}
          {isMobile && (
            <div style={{ 
              textAlign: "center", 
              padding: "8px", 
              borderTop: "1px solid #e0e0e0",
              backgroundColor: "#f8f9fa"
            }}>
              <span style={{ fontSize: "12px", color: "#666", marginRight: "10px" }}>
                Pinch to zoom • Drag to scroll
              </span>
              <button 
                onClick={() => setScale(1.0)} 
                style={{...zoomButtonStyle, padding: "4px 8px", fontSize: "12px"}}
              >
                Reset Zoom
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - QUESTIONS FORM */}
        <div style={{
          flex: 1,
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          overflow: "hidden",
          minHeight: isMobile ? "auto" : "auto", // 🆕 Better mobile height
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ 
            padding: "10px", 
            backgroundColor: "#1C304A", 
            color: "white",
            textAlign: "center",
            fontWeight: "600",
            flexShrink: 0 // 🆕 Prevent header from shrinking
          }}>
            Your Information
          </div>
          {renderQuestionsForm()}
        </div>
      </div>
    );
  };

  // 🎨 Zoom button style
  const zoomButtonStyle = {
    backgroundColor: "#1C304A",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    margin: "0 5px",
    cursor: "pointer",
    fontWeight: "600",
  };

  return (
    <div style={containerStyle}>
      {/* 🔹 Header - UPDATED FOR DOCTORS & PATIENTS */}
      <div style={headerStyle}>
        Document for signature 
        {pdfType === 'type2' && ' - Please fill in your information'}
        {pdfType === 'doctor' && ' - Doctor Review'} {/* 🆕 Doctor header */}
      </div>

      {/* 🔹 Main Container */}
      <div style={mainContainerStyle}>
        <div style={cardStyle}>
          {/* 🆕 UPDATED TITLE FOR DOCTORS & PATIENTS */}
          {pdfType === 'doctor' ? 'Medical Document Review' : 'Informed Financial Consent Form'}
          
          {/* 🆕 SHOW USER TYPE BADGE */}
          <div style={{
            fontSize: '14px',
            color: '#666',
            fontWeight: 'normal',
            marginTop: '5px'
          }}>
            {pdfType === 'doctor' ? '👨‍⚕️ Doctor Portal' : '👤 Patient Portal'}
          </div>

          {/* PDF Container - DIFFERENT FOR TYPE1 vs TYPE2 vs DOCTOR */}
          <div style={pdfContainerStyle}>
            {loading && <div style={loadingStyle}>Loading document...</div>}
            {error && !loading && <div style={errorStyle}>{error}</div>}
            
            {!loading && !error && (
              <>
                {pdfType === 'type2' ? (
                  // 🆕 SPLIT SCREEN FOR TYPE2 PATIENTS
                  renderSplitScreen()
                ) : (
                  // ✅ REGULAR PDF VIEWER FOR TYPE1 PATIENTS AND DOCTORS
                  <>
                    <div style={{ flex: 1, overflow: "auto" }}>
                      {pdfUrl && (
                        <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
                          <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                            {Array.from(new Array(numPages), (el, index) => (
                              <Page key={`page_${index + 1}`} pageNumber={index + 1} scale={scale} />
                            ))}
                          </Document>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "center", margin: "10px 0" }}>
                      <button onClick={zoomOut} style={zoomButtonStyle}>➖ Zoom Out</button>
                      <button onClick={zoomIn} style={zoomButtonStyle}>➕ Zoom In</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Bottom Sign Button */}
      <div style={footerStyle}>
        <button onClick={handleSignClick} style={signButtonStyle}>
          Sign
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        body { margin: 0; padding: 0; overflow: hidden; }
        
        /* 🆕 BETTER SCROLLBARS */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* 🆕 MOBILE OPTIMIZATIONS */
        @media (max-width: 768px) {
          .pdf-page {
            transform-origin: 0 0;
          }
        }
      `}</style>
    </div>
  );
};

// 🎨 STYLES
const containerStyle = {
  backgroundColor: "#f8f9fa",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  fontFamily: "inter",
  margin: 0,
  padding: 0,
  overflow: "hidden",
};

const headerStyle = {
  backgroundColor: "#1C304A",
  color: "#FFFFFF",
  padding: "15px 20px",
  fontWeight: "bold",
  fontSize: "18px",
  width: "100%",
  boxSizing: "border-box",
  margin: 0,
  flexShrink: 0,
};

const mainContainerStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "20px",
  gap: "10px",
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const cardStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  padding: "10px",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  fontSize: "18px",
  fontWeight: "600",
  color: "#1C304A",
  textAlign: "center",
  overflow: "hidden",
};

const pdfContainerStyle = {
  backgroundColor: "white",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  overflow: "hidden",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const loadingStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "#666",
  padding: "40px",
};

const errorStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "#dc3545",
  textAlign: "center",
  padding: "40px",
};

const footerStyle = {
  backgroundColor: "#C8D6E1",
  padding: "10px",
  width: "100%",
  boxSizing: "border-box",
  borderTop: "1px solid #e0e0e0",
  flexShrink: 0,
  textAlign: "center",
};

const signButtonStyle = {
  backgroundColor: "#1C304A",
  color: "#FFFFFF",
  padding: "16px 60px",
  border: "none",
  borderRadius: "8px",
  fontSize: "18px",
  fontWeight: "600",
  cursor: "pointer",
  width: "100%",
  maxWidth: "200px",
  boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
};

export default PdfViewerPage;