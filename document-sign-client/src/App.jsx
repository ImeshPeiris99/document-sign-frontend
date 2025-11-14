// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PdfViewerPage from "./pages/PdfViewerPage";
import SignaturePage from "./pages/SignaturePage";
import SubmitPage from "./pages/SubmitPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* login expects uuid in URL: example: /login/B6D25CB2-8113-4B2D-9DEC-4805418E80C5 */}
        <Route path="/login/:uuid" element={<LoginPage />} />
        <Route path="/pdf/:uuid" element={<PdfViewerPage />} />
        <Route path="/sign/:uuid" element={<SignaturePage />} />
        <Route path="/submit/:uuid" element={<SubmitPage />} />
        {/* optional root redirect to a landing or instruct user to open link */}
        <Route path="/" element={<div style={{padding:40}}>Open the emailed link to access the login page (URL ends with UUID).</div>} />
      </Routes>
    </Router>
  );
}

export default App;
