// 📄 SubmitPage.jsx - COMPLETE VERSION WITH SHARE FUNCTIONALITY
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { Download, Share, CheckCircle } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import api from "../services/api";
import { isVoiceEnabled } from '../components/VoiceAssistant';
import voiceService from "../services/voiceService";
import GuideArrow from "../components/GuideArrow";

// ✅ React-PDF worker configuration for PDF rendering
import workerSrc from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const SubmitPage = () => {
  const { uuid } = useParams(); // 🆔 Get patient UUID from URL parameters
  const navigate = useNavigate();
  
  // 🎯 STATE MANAGEMENT - Track different aspects of our component
  const [pdfUrl, setPdfUrl] = useState(null); // 📄 URL for displaying PDF
  const [loading, setLoading] = useState(true); // ⏳ Track PDF loading status
  const [error, setError] = useState(""); // ❌ Store any error messages
  const [numPages, setNumPages] = useState(null); // 🔢 Total pages in PDF
  const [scale, setScale] = useState(1.6); // 🔍 Zoom level for PDF
  const [showPopup, setShowPopup] = useState(false); // 🎪 Show success popup
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // 📱 Mobile detection
  const [currentStep, setCurrentStep] = useState(1); // 🚶‍♂️ Current step in voice guidance (1=review, 2=download, 3=submit)

  // 🎯 RESPONSIVE LAYOUT HANDLER - Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🎯 VOICE GUIDANCE SEQUENCE - ONLY PLAYS IF VOICE IS ENABLED
  useEffect(() => {
    // 🚫 Check if voice assistant is turned OFF by user
    const voiceState = localStorage.getItem('voiceAssistantEnabled');
    const isVoiceReallyEnabled = voiceState === 'true';
    
    if (!isVoiceReallyEnabled || !isVoiceEnabled) {
      console.log("🔊 Voice is DISABLED - skipping guidance in SubmitPage");
      return;
    }

    console.log("🔊 Voice is ENABLED - starting guidance in SubmitPage");
    
    // ⏳ Wait for PDF to load before starting guidance
    if (!loading && !error) {
      const guideUser = async () => {
        // Step 1: Review document guidance
        await new Promise(resolve => setTimeout(resolve, 1000));
        voiceService.speak("Please review your signed document");
        setCurrentStep(1);
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Step 2: Download guidance
        voiceService.speak("If you need to download, click the download button");
        setCurrentStep(2);
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Step 3: Submit guidance
        voiceService.speak("When you are ready, click submit to complete the process");
        setCurrentStep(3);
      };

      guideUser();
    }
  }, [loading, error, isVoiceEnabled]);

  // 🎯 PDF PROCESSING & SIGNATURE MERGING - Core functionality
  useEffect(() => {
    const mergeSignatureWithPdf = async () => {
      try {
        // 📥 Get original PDF and signature from browser storage
        const basePdf = localStorage.getItem("currentPdfBase64");
        const signatureData = localStorage.getItem("patientSignature");
        const dateTimeText = localStorage.getItem("signatureDateTime");

        // 🚫 Validation - ensure we have required data
        if (!basePdf || !signatureData) {
          setError("Missing document or signature. Please sign again.");
          setLoading(false);
          return;
        }

        // 🔄 STEP 1: Load original PDF document
        const pdfBytes = Uint8Array.from(atob(basePdf), (c) => c.charCodeAt(0));
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // 🔄 STEP 2: Convert signature image to PDF format
        const signatureImageBytes = await fetch(signatureData).then((res) =>
          res.arrayBuffer()
        );
        const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

        // 📑 Get all pages and target the last page for signature
        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];

        // ✍️ STEP 3: Draw signature on PDF at precise coordinates
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

        // 🕒 STEP 4: Add date & time stamp near signature
        if (dateTimeText) {
          lastPage.drawText(dateTimeText, {
            x: sigX,
            y: 150,
            size: 10,
            color: rgb(0, 0, 0),
            lineHeight: 12,
          });
        }

        // 💾 STEP 5: Save the modified PDF with signature
        const modifiedPdfBytes = await pdfDoc.save();
        const modifiedPdfBase64 = btoa(
          String.fromCharCode(...new Uint8Array(modifiedPdfBytes))
        );

        // 💿 Store merged PDF for later use
        localStorage.setItem("signedPdfBase64", modifiedPdfBase64);

        // 🌐 Create URL for displaying PDF in browser
        const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error("Error merging signature:", err);
        setError("Failed to merge signature into PDF.");
      } finally {
        setLoading(false); // ✅ Mark loading as complete
      }
    };

    mergeSignatureWithPdf();

    // 🧹 Cleanup: Release object URL when component unmounts
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [uuid]);

  // 🔍 ZOOM CONTROLS - Adjust PDF view magnification
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3)); // ➕ Zoom in (max 3x)
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6)); // ➖ Zoom out (min 0.6x)

  // 📥 DOWNLOAD HANDLER - Save PDF to user's device
  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `signed-document-${uuid}.pdf`; // 📁 File name with UUID
      document.body.appendChild(link);
      link.click(); // 🖱️ Programmatically click download link
      document.body.removeChild(link);
    }
  };

  // 📤 SHARE HANDLER - Advanced sharing with multiple options
  const handleShare = async () => {
    try {
      // 📥 Get the signed PDF from browser storage
      const signedPdfBase64 = localStorage.getItem("signedPdfBase64");
      
      // 🚫 Validate we have a PDF to share
      if (!signedPdfBase64) {
        alert("No signed PDF available to share. Please sign the document first.");
        return;
      }

      // 🔄 Convert base64 string to PDF file
      const pdfBytes = Uint8Array.from(atob(signedPdfBase64), c => c.charCodeAt(0));
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfFile = new File([pdfBlob], `signed-document-${uuid}.pdf`, { 
        type: "application/pdf" 
      });

      // 📱 Check if device supports native sharing (mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          // 🎯 Use native share dialog (WhatsApp, Messages, Email, etc.)
          await navigator.share({
            title: 'Signed Document',
            text: 'Here is my signed document',
            files: [pdfFile]
          });
          console.log("✅ Share successful via native dialog");
        } catch (shareError) {
          console.log("❌ Native share cancelled or failed, using fallback");
          showCustomShareDialog(pdfFile); // 🖥️ Fallback for desktop
        }
      } else {
        // 🖥️ Desktop browsers - show custom share options
        showCustomShareDialog(pdfFile);
      }
    } catch (error) {
      console.error("❌ Share error:", error);
      alert("Unable to share the document. Please try downloading instead.");
    }
  };

  // 🎯 CUSTOM SHARE DIALOG - Beautiful modal with multiple share options
  const showCustomShareDialog = (pdfFile) => {
    // 🎪 Create modal overlay
    const shareDialog = document.createElement('div');
    shareDialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;

    // 🎨 Share dialog content
    shareDialog.innerHTML = `
      <div style="
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 400px;
        width: 90%;
      ">
        <h3 style="color: #1C304A; margin-bottom: 20px;">Share Document</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
          <!-- 📱 WhatsApp Button -->
          <button onclick="shareViaWhatsApp()" style="
            background: #25D366;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <span style="font-size: 24px;">📱</span>
            WhatsApp
          </button>

          <!-- ✉️ Email Button -->
          <button onclick="shareViaEmail()" style="
            background: #EA4335;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <span style="font-size: 24px;">✉️</span>
            Email
          </button>

          <!-- 💾 Download Button -->
          <button onclick="downloadForSharing()" style="
            background: #1C304A;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <span style="font-size: 24px;">💾</span>
            Download
          </button>

          <!-- 🔗 Copy Link Button -->
          <button onclick="copyShareLink()" style="
            background: #4285F4;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <span style="font-size: 24px;">🔗</span>
            Copy Link
          </button>
        </div>

        <!-- ❌ Cancel Button -->
        <button onclick="closeShareDialog()" style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
        ">
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(shareDialog);

    // 🎯 SHARE VIA WHATSAPP - Open WhatsApp with download link
    window.shareViaWhatsApp = () => {
      const pdfBlob = pdfFile.slice();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const message = "Here is my signed document. Please download it from: " + pdfUrl;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank'); // 🌐 Open WhatsApp in new tab
      
      closeShareDialog();
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000); // 🧹 Cleanup after 10 seconds
    };

    // 🎯 SHARE VIA EMAIL - Open email client with download link
    window.shareViaEmail = () => {
      const pdfBlob = pdfFile.slice();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const subject = "Signed Document";
      const body = "Please find my signed document attached.\n\nYou can download it from: " + pdfUrl;
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl; // 📧 Redirect to email client
      
      closeShareDialog();
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
    };

    // 🎯 DOWNLOAD FOR SHARING - Use existing download function
    window.downloadForSharing = () => {
      handleDownload(); // 📥 Reuse our download functionality
      closeShareDialog();
    };

    // 🎯 COPY SHARE LINK - Copy download link to clipboard
    window.copyShareLink = async () => {
      const pdfBlob = pdfFile.slice();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      try {
        await navigator.clipboard.writeText(pdfUrl); // 📋 Copy to clipboard
        alert("Document link copied to clipboard! You can now share it anywhere.");
      } catch (err) {
        alert("Failed to copy link. Please try downloading instead.");
      }
      
      closeShareDialog();
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
    };

    // 🎯 CLOSE SHARE DIALOG - Cleanup and remove dialog
    window.closeShareDialog = () => {
      document.body.removeChild(shareDialog);
      // 🧹 Clean up global functions to prevent memory leaks
      delete window.shareViaWhatsApp;
      delete window.shareViaEmail;
      delete window.downloadForSharing;
      delete window.copyShareLink;
      delete window.closeShareDialog;
    };
  };

  // 📤 SUBMIT HANDLER - Send signed PDF to backend for permanent storage
  const handleSubmit = async () => {
    try {
      setShowPopup(true); // 🎪 Show success popup

      // 📥 Get the merged PDF from storage
      const rawPdf = localStorage.getItem("signedPdfBase64");
      const signedDateTime = localStorage.getItem("signatureDateTime"); 
      const loginDateTime = localStorage.getItem("userLoginDateTime"); 
      const patientName = localStorage.getItem("patientName");
      const pdfName = localStorage.getItem("pdfTypeName");

      // 🚫 Validate we have a PDF to submit
      if (!rawPdf) {
        console.log("❌ ERROR: signedPdfBase64 is missing!");
        alert("Missing signed PDF. Please sign again.");
        setShowPopup(false);
        return;
      }

      // 🔄 Clean base64 string (remove data URL prefix if present)
      const cleanedPdf = rawPdf.includes(",") ? rawPdf.split(",")[1] : rawPdf;

      // 🌐 Send PDF to backend API for permanent storage
      const response = await api.post(`/Pdf/UploadSignedPdf/${uuid}`, {
        Base64Pdf: cleanedPdf
      });

      // ✅ Success handling
      if (response.status === 200) {
        console.log("✅ File Upload Success:", response.data);

        // 🧹 Clean up temporary storage
        localStorage.removeItem("currentPdfBase64");
        localStorage.removeItem("patientSignature");
        localStorage.removeItem("signedPdfBase64");
        localStorage.removeItem("signatureDateTime");

        // ⏳ Hide popup after 2.5 seconds
        setTimeout(() => {
          setShowPopup(false);
        }, 2500);
      } else {
        alert("Failed to upload PDF.");
        setShowPopup(false);
      }
    } catch (err) {
      console.error("❌ Submit error:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
      setShowPopup(false);
    }
  };

  // 🎨 COMPONENT RENDERING - The actual UI users see
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
      {/* 🔹 HEADER - Page title and branding */}
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

      {/* 🔹 MAIN CONTAINER - PDF display area */}
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
        {/* 📄 INNER CARD - Document information */}
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

          {/* 📑 PDF CONTAINER - PDF viewing area with controls */}
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
            {/* 📜 PDF VIEWER AREA - Scrollable PDF display */}
            <div style={{ 
              flex: 1, 
              overflow: "auto",
              WebkitOverflowScrolling: "touch" // 📱 Smooth mobile scrolling
            }}>
              {/* ⏳ LOADING STATE - Show spinner while PDF loads */}
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

              {/* ❌ ERROR STATE - Show error message if PDF fails */}
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

              {/* ✅ PDF DISPLAY - Show the actual PDF when ready */}
              {!loading && !error && pdfUrl && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: isMobile ? "5px" : "10px",
                    backgroundColor: "#fff",
                    minWidth: "min-content", // ↔️ Allows horizontal scrolling
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
                    {/* 📄 Render all PDF pages */}
                    {Array.from(new Array(numPages), (el, index) => (
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        scale={isMobile ? 1.0 : scale} // 📱 Fixed zoom on mobile
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    ))}
                  </Document>
                </div>
              )}
            </div>

            {/* 🔍 ZOOM CONTROLS - PDF magnification buttons */}
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

      {/* 🔹 BOTTOM ACTION BUTTONS - Download, Share, Submit */}
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
          {/* 📥 DOWNLOAD BUTTON */}
          <button
            id="download-button" // 🎯 ID for GuideArrow targeting
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

          {/* 📤 SHARE BUTTON */}
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

          {/* ✅ SUBMIT BUTTON */}
          <button
            id="submit-button" // 🎯 ID for GuideArrow targeting
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

      {/* 🎯 GUIDANCE ARROWS - Visual indicators for user guidance */}
      {currentStep === 2 && <GuideArrow targetButtonId="download-button" duration={6000} />}
      {currentStep === 3 && <GuideArrow targetButtonId="submit-button" duration={6000} />}

      {/* 🎨 STYLES - CSS animations and global styles */}
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

      {/* ✅ SUCCESS POPUP OVERLAY - Show when PDF is submitted */}
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