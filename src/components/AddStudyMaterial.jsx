/**
 * =============================================================================
 * ADD STUDY MATERIAL COMPONENT
 * =============================================================================
 * UI for uploading study materials (files or URLs)
 * Shows real-time processing status via Firestore listener
 * 
 * SUPPORTED INPUTS:
 * - PDF, DOCX, PPTX files
 * - Images (PNG, JPEG, WebP) - for OCR
 * - Audio (MP3, WAV, WebM) - for transcription
 * - Video (MP4, WebM) - for transcription
 * - URLs - for web content extraction
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useStudyMaterials, useProcessingStatus } from '../hooks/useStudyMaterials';
import { getCurrentUser } from '../firebase';
import './AddStudyMaterial.css';

// Supported file types
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'video/mp4',
  'video/webm',
].join(',');

function AddStudyMaterial({ onComplete }) {
  const { uploadFile, uploadUrl } = useStudyMaterials();
  
  const [mode, setMode] = useState('file'); // 'file' or 'url'
  const [currentFileId, setCurrentFileId] = useState(null);
  const [error, setError] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Real-time status tracking
  const status = useProcessingStatus(currentFileId);
  
  // Check authentication state
  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();
      setIsLoggedIn(!!user);
    };
    
    checkAuth();
    // Check every second for auth changes
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setError(null);
    setCurrentFileId(null);
    
    try {
      const result = await uploadFile(file);
      setCurrentFileId(result.file_id);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUrlSubmit = async (event) => {
    event.preventDefault();
    
    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    setError(null);
    setCurrentFileId(null);
    
    try {
      const result = await uploadUrl(urlInput, urlTitle || null);
      setCurrentFileId(result.file_id);
      setUrlInput('');
      setUrlTitle('');
    } catch (err) {
      setError(err.message);
    }
  };
  
  const isProcessing = currentFileId && !['complete', 'error'].includes(status.status);
  const isComplete = status.status === 'complete';
  const isError = status.status === 'error';
  
  return (
    <div className="add-study-material">
      <h2>Add Study Material</h2>
      
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={mode === 'file' ? 'active' : ''}
          onClick={() => setMode('file')}
          disabled={isProcessing || !isLoggedIn}
        >
          📄 Upload File
        </button>
        <button
          className={mode === 'url' ? 'active' : ''}
          onClick={() => setMode('url')}
          disabled={isProcessing || !isLoggedIn}
        >
          🔗 Add URL
        </button>
      </div>
      
      {/* File Upload */}
      {mode === 'file' && (
        <div className="upload-section">
          <label className="file-input-label">
            <input
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
              disabled={isProcessing || !isLoggedIn}
            />
            <span>{!isLoggedIn ? 'Log in to upload' : 'Choose File'}</span>
          </label>
          <p className="help-text">
            Supported: PDF, Word, PowerPoint, Images, Audio, Video
          </p>
        </div>
      )}
      
      {/* URL Input */}
      {mode === 'url' && (
        <form className="url-section" onSubmit={handleUrlSubmit}>
          <input
            type="url"
            placeholder={!isLoggedIn ? "Log in to add URLs" : "https://example.com/article"}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isProcessing || !isLoggedIn}
            required
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={urlTitle}
            onChange={(e) => setUrlTitle(e.target.value)}
            disabled={isProcessing || !isLoggedIn}
          />
          <button type="submit" disabled={isProcessing || !isLoggedIn}>
            {!isLoggedIn ? 'Log in to add' : 'Add URL'}
          </button>
        </form>
      )}
      
      {/* Authentication Warning */}
      {!isLoggedIn && (
        <div className="error-message" style={{ backgroundColor: '#fff3cd', borderColor: '#ffeaa7', color: '#856404' }}>
          🔒 Please log in to upload study materials
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
      
      {/* Processing Status */}
      {currentFileId && (
        <div className={`status-display ${status.status}`}>
          <div className="status-header">
            {isProcessing && <span className="spinner">⏳</span>}
            {isComplete && <span className="success">✅</span>}
            {isError && <span className="error-icon">❌</span>}
            <span className="status-text">
              {status.status === 'uploading' && 'Uploading file...'}
              {status.status === 'uploaded' && 'File uploaded'}
              {status.status === 'extracting' && 'Extracting text...'}
              {status.status === 'summarizing' && 'Generating AI summary...'}
              {status.status === 'complete' && 'Processing complete!'}
              {status.status === 'error' && 'Processing failed'}
            </span>
          </div>
          
          {/* Progress Bar */}
          {isProcessing && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          )}
          
          {/* Status Message */}
          {status.message && (
            <p className="status-message">{status.message}</p>
          )}
          
          {/* Complete Actions */}
          {isComplete && (
            <div className="complete-actions">
              <button onClick={() => onComplete?.(currentFileId)}>
                View Summary
              </button>
              <button onClick={() => setCurrentFileId(null)}>
                Add Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AddStudyMaterial;
