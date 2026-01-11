import React, { useRef, useState } from "react";

export default function CameraModal({ onClose, onAnalyze }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    await onAnalyze(capturedImage, "Analyze my exercise form and provide detailed feedback");
    setIsAnalyzing(false);
  };

  return (
    <div className="camera-modal" onClick={() => !isAnalyzing && onClose()}>
      <div className="camera-content" onClick={(e) => e.stopPropagation()}>
        <div className="camera-header">
          <h2>Analyze Exercise Form</h2>
          <button className="close-btn" onClick={onClose} disabled={isAnalyzing}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {isAnalyzing ? (
          <div className="analyzing">
            <div className="analyzing-spinner"></div>
            <p>Analyzing your form...</p>
          </div>
        ) : (
          <>
            <div className="camera-preview">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured" />
              ) : (
                <p style={{ color: "#8e929a" }}>No image selected</p>
              )}
            </div>

            <div className="camera-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="file-input"
              />
              <button
                className="camera-btn secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M20 5h-3.2l-1.6-2H8.8L7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-8 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
                </svg>
                Take/Upload Photo
              </button>
              <button
                className="camera-btn primary"
                onClick={handleAnalyze}
                disabled={!capturedImage}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Analyze Form
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
