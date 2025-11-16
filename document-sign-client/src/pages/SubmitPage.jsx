// 📄 SubmitPage.jsx - RESPONSIVE VERSION WITH VOICE GUIDANCE & ARROWS
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { Download, Share, CheckCircle } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import api from "../services/api";
import { isVoiceEnabled } from '../components/VoiceAssistant';
import voiceService from "../services/voiceService"; // 🆕 Voice guidance service
import GuideArrow from "../components/GuideArrow"; // 🆕 Arrow component for visual guidance

// ✅ React-PDF worker
import workerSrc from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const SubmitPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.6);
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentStep, setCurrentStep] = useState(1); // 🆕 1=review, 2=download, 3=submit

  // 🆕 RESPONSIVE LAYOUT HANDLER
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🆕 VOICE GUIDANCE SEQUENCE - GUIDES USER THROUGH THE PROCESS
  useEffect(() => {
    // Check if voice assistant is turned ON by user
    if (!isVoiceEnabled) return;
    // Wait for PDF to load before starting guidance
    if (!loading && !error) {
      const guideUser = async () => {
        // Step 1: Review document (wait 1 second for PDF to render properly)
        await new Promise(resolve => setTimeout(resolve, 1000));
        voiceService.speak("Please review your signed document");
        setCurrentStep(1);
        await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds

        // Step 2: Download guidance
        voiceService.speak("If you need to download, click the download button");
        setCurrentStep(2);
        await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds

        // Step 3: Submit guidance
        voiceService.speak("When you are ready, click submit to complete the process");
        setCurrentStep(3);
      };

      guideUser();
    }
  }, [loading, error]); // Run when loading/error state changes

  // ✅ ORIGINAL PDF PROCESSING LOGIC (UNCHANGED)
  useEffect(() => {
    const mergeSignatureWithPdf = async () => {
      try {
        const basePdf = localStorage.getItem("currentPdfBase64");
        const signatureData = localStorage.getItem("patientSignature");
        const dateTimeText = localStorage.getItem("signatureDateTime");

        if (!basePdf || !signatureData) {
          setError("Missing document or signature. Please sign again.");
          setLoading(false);
          return;
        }

        // 🔹 Load PDF
        const pdfBytes = Uint8Array.from(atob(basePdf), (c) => c.charCodeAt(0));
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // 🔹 Embed signature image
        const signatureImageBytes = await fetch(signatureData).then((res) =>
          res.arrayBuffer()
        );
        const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];

        // ✍️ Draw signature (ORIGINAL COORDINATES - NO CHANGES)
        const sigWidth = 175;
        const sigHeight = 100;
        const sigX = 350;
        const sigY = 150;

        lastPage.drawImage(signatureImage, {
          x: sigX,
          y: sigY,
          width: sigWidth,
          height: sigHeight,
        });

        // 🕒 Draw date & time near signature (ORIGINAL)
        if (dateTimeText) {
          lastPage.drawText(dateTimeText, {
            x: sigX,
            y: 150,
            size: 10,
            color: rgb(0, 0, 0),
            lineHeight: 12,
          });
        }

        // 🔹 Save updated PDF
        const modifiedPdfBytes = await pdfDoc.save();
        const modifiedPdfBase64 = btoa(
          String.fromCharCode(...new Uint8Array(modifiedPdfBytes))
        );

        localStorage.setItem("signedPdfBase64", modifiedPdfBase64);

        const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error("Error merging signature:", err);
        setError("Failed to merge signature into PDF.");
      } finally {
        setLoading(false);
      }
    };

    mergeSignatureWithPdf();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [uuid]);

  // 🔍 Zoom handlers (UNCHANGED)
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6));

  // 📥 Download handler (UNCHANGED)
  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `signed-document-${uuid}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 🔗 Share handler (UNCHANGED)
  const handleShare = () => {
    alert("Share functionality will be implemented later.");
  };

  // 📤 Submit handler (UNCHANGED)
  const handleSubmit = async () => {
    try {
      setShowPopup(true);

      const rawPdf = localStorage.getItem("signedPdfBase64");
      const signedDateTime = localStorage.getItem("signatureDateTime"); 
      const loginDateTime = localStorage.getItem("userLoginDateTime"); 
      const patientName = localStorage.getItem("patientName");
      const pdfName = localStorage.getItem("pdfTypeName");

      if (!rawPdf) {
        console.log("❌ ERROR: signedPdfBase64 is missing!");
        alert("Missing signed PDF. Please sign again.");
        setShowPopup(false);
        return;
      }

      const cleanedPdf = rawPdf.includes(",") ? rawPdf.split(",")[1] : rawPdf;

      const response = await api.post(`/Pdf/UploadSignedPdf/${uuid}`, {
        Base64Pdf: cleanedPdf
      });

      if (response.status === 200) {
        console.log("File Upload Success:", response.data);

        localStorage.removeItem("currentPdfBase64");
        localStorage.removeItem("patientSignature");
        localStorage.removeItem("signedPdfBase64");
        localStorage.removeItem("signatureDateTime");

        setTimeout(() => {
          setShowPopup(false);
        }, 2500);
      } else {
        alert("Failed to upload PDF.");
        setShowPopup(false);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
      setShowPopup(false);
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
          padding: isMobile ? "12px 15px" : "15px 20px",
          fontWeight: "bold",
          fontSize: isMobile ? "16px" : "18px",
          width: "100%",
          boxSizing: "border-box",
          margin: 0,
          flexShrink: 0,
        }}
      >
        Signed Document
      </div>

      {/* 🔹 Main Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: isMobile ? "10px" : "20px",
          gap: isMobile ? "8px" : "10px",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Inner Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: isMobile ? "8px" : "10px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? "15px" : "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            fontSize: isMobile ? "16px" : "18px",
            fontWeight: "600",
            color: "#1C304A",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          Informed Financial Consent Form

          {/* PDF Container - FIXED FOR MOBILE SCROLLING */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              overflow: "hidden",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {/* PDF Viewer Area - ALLOWS HORIZONTAL SCROLLING */}
            <div style={{ 
              flex: 1, 
              overflow: "auto",
              WebkitOverflowScrolling: "touch" // Smooth mobile scrolling
            }}>
              {loading && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#666",
                    padding: isMobile ? "20px" : "40px",
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? "40px" : "50px",
                      height: isMobile ? "40px" : "50px",
                      border: "4px solid #f3f3f3",
                      borderTop: "4px solid #007bff",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      marginBottom: isMobile ? "15px" : "20px",
                    }}
                  />
                  <div style={{ fontSize: isMobile ? "14px" : "16px" }}>
                    Loading signed document...
                  </div>
                </div>
              )}

              {error && !loading && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#dc3545",
                    textAlign: "center",
                    padding: isMobile ? "20px" : "40px",
                  }}
                >
                  <div style={{ 
                    fontSize: isMobile ? "36px" : "48px", 
                    marginBottom: isMobile ? "10px" : "15px" 
                  }}>
                    ⚠️
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? "14px" : "16px", 
                    fontWeight: "500" 
                  }}>
                    {error}
                  </div>
                </div>
              )}

              {/* ✅ PDF Display - ALLOWS HORIZONTAL SCROLLING */}
              {!loading && !error && pdfUrl && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: isMobile ? "5px" : "10px",
                    backgroundColor: "#fff",
                    minWidth: "min-content", // Allows horizontal scrolling
                  }}
                >
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    onLoadError={(err) => {
                      console.error("PDF load error:", err);
                      setError("Failed to display PDF properly.");
                    }}
                  >
                    {Array.from(new Array(numPages), (el, index) => (
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        scale={isMobile ? 1.0 : scale} // Fixed zoom on mobile
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    ))}
                  </Document>
                </div>
              )}
            </div>

            {/* 🔍 Zoom Controls - VISIBLE ON ALL SCREENS */}
            <div style={{ textAlign: "center", margin: "10px 0" }}>
              <button
                onClick={zoomOut}
                style={{
                  backgroundColor: "#1C304A",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  marginRight: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                ➖ Zoom Out
              </button>
              <button
                onClick={zoomIn}
                style={{
                  backgroundColor: "#1C304A",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                ➕ Zoom In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Bottom Action Buttons - STACKED ON MOBILE ONLY */}
      <div
        style={{
          backgroundColor: "#C8D6E1",
          padding: isMobile ? "15px" : "20px",
          width: "100%",
          boxSizing: "border-box",
          borderTop: "1px solid #e0e0e0",
          flexShrink: 0,
        }}
      >
        <div style={{ 
          textAlign: "center", 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "center", 
          gap: isMobile ? "10px" : "15px",
          alignItems: "center",
        }}>
          {/* 🆕 DOWNLOAD BUTTON WITH ID FOR ARROW TARGET */}
          <button
            id="download-button" // 🆕 ID for arrow targeting
            onClick={handleDownload}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#1C304A",
              padding: isMobile ? "10px 20px" : "12px 25px",
              border: "2px solid #1C304A",
              borderRadius: "8px",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: isMobile ? "100%" : "140px",
            }}
          >
            <Download size={isMobile ? 18 : 20} />
            Download
          </button>

          <button
            onClick={handleShare}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#1C304A",
              padding: isMobile ? "10px 20px" : "12px 25px",
              border: "2px solid #1C304A",
              borderRadius: "8px",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: isMobile ? "100%" : "140px",
            }}
          >
            <Share size={isMobile ? 18 : 20} />
            Share
          </button>

          {/* 🆕 SUBMIT BUTTON WITH ID FOR ARROW TARGET */}
          <button
            id="submit-button" // 🆕 ID for arrow targeting
            onClick={handleSubmit}
            style={{
              backgroundColor: "#1C304A",
              color: "#FFFFFF",
              padding: isMobile ? "10px 20px" : "12px 25px",
              border: "none",
              borderRadius: "8px",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: isMobile ? "100%" : "140px",
              boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
            }}
          >
            <CheckCircle size={isMobile ? 18 : 20} />
            Submit
          </button>
        </div>
      </div>

      {/* 🆕 GUIDANCE ARROWS - SHOW BASED ON CURRENT STEP */}
      {currentStep === 2 && <GuideArrow targetButtonId="download-button" duration={6000} />}
      {currentStep === 3 && <GuideArrow targetButtonId="submit-button" duration={6000} />}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>

      {/* ✅ Popup Overlay */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: isMobile ? "15px 25px" : "20px 35px",
              borderRadius: "10px",
              fontSize: isMobile ? "14px" : "15px",
              fontWeight: "600",
              color: "#1C304A",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              textAlign: "center",
              margin: isMobile ? "20px" : "0",
            }}
          >
            Signed form submitted, Thank You!
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitPage;