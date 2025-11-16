// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PdfViewerPage from "./pages/PdfViewerPage";
import SignaturePage from "./pages/SignaturePage";
import SubmitPage from "./pages/SubmitPage";
import VoiceAssistant from "./components/VoiceAssistant";
import AIChatAssistant from "./components/AIChatAssistant"; // 🎯 ADD THIS

function App() {
  return (
    <Router>
      {/* Both assistants available on all pages */}
      <VoiceAssistant />
      <AIChatAssistant /> {/* 🎯 ADD AI CHAT ASSISTANT */}
      
      <Routes>
        <Route path="/login/:uuid" element={<LoginPage />} />
        <Route path="/pdf/:uuid" element={<PdfViewerPage />} />
        <Route path="/sign/:uuid" element={<SignaturePage />} />
        <Route path="/submit/:uuid" element={<SubmitPage />} />
        <Route path="/" element={<div style={{padding:40}}>Open the emailed link to access the login page.</div>} />
      </Routes>
    </Router>
  );
}

export default App;