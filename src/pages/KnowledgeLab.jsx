import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, Flag, PenLine, Undo2, Info, X, FileText, Link, Type, Mic, ChevronDown, ChevronUp, Upload, Search, Loader2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, getFirebaseIdToken, getCurrentUser } from '../firebase';

// Backend API URL
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const KnowledgeLab = () => {
  const [hasContent, setHasContent] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState('pdf');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [currentFileId, setCurrentFileId] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef(null);

  // Real-time status listener
  useEffect(() => {
    if (!currentFileId) return;
    
    const statusRef = doc(db, 'processing_status', currentFileId);
    const unsubscribe = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUploadStatus(data.status || 'unknown');
        setUploadProgress(data.progress || 0);
        setUploadMessage(data.message || '');
        
        // If complete or error, stop processing state after delay
        if (data.status === 'complete' || data.status === 'error') {
          setTimeout(() => {
            if (data.status === 'complete') {
              setIsProcessing(false);
              setIsModalOpen(false);
              resetForm();
            }
          }, 1500);
        }
      }
    });
    
    return () => unsubscribe();
  }, [currentFileId]);

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedType('pdf');
    setSelectedFile(null);
    setUrlInput('');
    setTextInput('');
    setShowAdvanced(false);
    setUploadProgress(0);
    setUploadStatus('');
    setUploadMessage('');
    setCurrentFileId(null);
    setUploadError(null);
  };

  // File upload handler
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setUploadError(null);
    setIsProcessing(true);
    setUploadStatus('uploading');
    setUploadProgress(10);
    setUploadMessage('Uploading file...');
    
    try {
      // Check if user is authenticated
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('Please log in to upload files');
      }
      
      const token = await getFirebaseIdToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
      
      const result = await response.json();
      setCurrentFileId(result.file_id);
      // Real-time updates will come from Firestore listener
      
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message);
      setIsProcessing(false);
      setUploadStatus('error');
    }
  };

  // URL upload handler
  const handleUrlUpload = async () => {
    if (!urlInput.trim()) {
      setUploadError('Please enter a URL');
      return;
    }
    
    setUploadError(null);
    setIsProcessing(true);
    setUploadStatus('uploading');
    setUploadProgress(10);
    setUploadMessage('Processing URL...');
    
    try {
      // Check if user is authenticated
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('Please log in to process URLs');
      }
      
      const token = await getFirebaseIdToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      
      const response = await fetch(`${API_URL}/api/upload/url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'URL processing failed');
      }
      
      const result = await response.json();
      setCurrentFileId(result.file_id);
      
    } catch (err) {
      console.error('URL upload error:', err);
      setUploadError(err.message);
      setIsProcessing(false);
      setUploadStatus('error');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const studyMaterials = [
    { title: 'PDF Notes', source: 'envoroma • Soupse', description: 'Questionns this https://woon...', type: 'pdf' },
    { title: 'Web Link', source: 'encoroma • Soupse', description: 'Questionns this https://leon...', type: 'link' },
  ];

  const steps = [
    { id: 1, label: 'Select Type' },
    { id: 2, label: 'Upload' },
    { id: 3, label: 'Review' },
    { id: 4, label: 'Advanced' },
  ];

  const inputTypes = [
    { id: 'pdf', label: 'PDF (recommended)', icon: FileText, recommended: true },
    { id: 'url', label: 'YouTube Link', icon: Link },
    { id: 'text', label: 'Text Note', icon: Type },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit - start processing
      if (selectedType === 'pdf' && selectedFile) {
        handleFileUpload(selectedFile);
      } else if (selectedType === 'url' && urlInput) {
        handleUrlUpload();
      } else {
        setUploadError('Please select a file or enter a URL');
      }
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Get button text based on current step and selection
  const getNextButtonText = () => {
    if (currentStep === 4) {
      return 'Process';
    }
    if (currentStep === 1) {
      if (selectedType === 'pdf' && !selectedFile) return 'Select File';
      if (selectedType === 'url' && !urlInput) return 'Enter URL';
    }
    return 'Next';
  };

  // Check if can proceed to next step
  const canProceed = () => {
    if (currentStep === 1) {
      if (selectedType === 'pdf') return !!selectedFile;
      if (selectedType === 'url') return !!urlInput.trim();
      if (selectedType === 'text') return !!textInput.trim();
    }
    return true;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem', paddingBottom: '6rem' }}>

      {/* Header with Primary CTA */}
      <header style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-h2)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Knowledge Lab
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: 'var(--text-small)' }}>
            Manage your study materials
          </p>
        </div>

        {/* Search Box Trigger */}
        <div
          onClick={() => setIsSearchPopupOpen(true)}
          style={{
            flex: 1,
            maxWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '9999px',
            cursor: 'pointer',
            transition: 'box-shadow var(--transition-fast)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; }}
          onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Search size={16} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>Search materials...</span>
        </div>

        {/* Primary CTA - Single entry point */}
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add Study Material
        </button>
      </header>

      {/* Search Popup Modal - Portal to body for full-screen blur */}
      {isSearchPopupOpen && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '10vh',
            zIndex: 9999
          }}
          onClick={() => setIsSearchPopupOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-modal)',
              width: '100%',
              maxWidth: '500px',
              overflow: 'hidden'
            }}
          >
            {/* Popup Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <h2 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }}>Study Materials</h2>
              <button
                onClick={() => setIsSearchPopupOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: 'var(--text-body)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Materials List */}
            <div style={{ padding: '0.5rem 0' }}>
              {studyMaterials.map((material, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: index < studyMaterials.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{material.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: 'var(--text-small)', marginBottom: '0.25rem' }}>
                    <Link size={12} />
                    <span>{material.source}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)', marginBottom: '0.5rem' }}>{material.description}</div>
                  <span style={{ color: 'var(--primary-600)', fontSize: 'var(--text-small)', fontWeight: 500 }}>Learn more</span>
                </div>
              ))}
            </div>
          </div>
        </div>, document.body
      )}

      {/* Document View */}
      {hasContent && (
        <article style={{
          backgroundColor: 'var(--bg-card)',
          padding: '3rem 4rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-soft)',
          border: '1px solid var(--border-subtle)',
          minHeight: '400px',
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          lineHeight: '1.8'
        }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-caption)',
            color: 'var(--text-muted)',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            AI-Generated Summary
          </div>

          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '2rem',
            lineHeight: '1.3',
            fontFamily: 'var(--font-sans)'
          }}>
            Document: Global Economics - Chapter 4 Summary
          </h2>

          {/* AI Summary Box */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem',
            position: 'relative'
          }}>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
              <strong>AI-Generated Summary:</strong> This chapter provides an overview of international
              trade theories, focusing on comparative advantage and the impact of tariffs.
              Key concepts include the models of{' '}
              <span style={{ textDecoration: 'underline', color: 'var(--primary-600)' }}>Ricardo</span> and{' '}
              <span style={{ textDecoration: 'underline', color: 'var(--primary-600)' }}>Heckscher-Ohlin</span>,
              highlighting how{' '}
              <span
                style={{
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--text-primary)',
                  padding: '0.1rem 0.25rem',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                resource endowments
                {showTooltip && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    boxShadow: 'var(--shadow-modal)',
                    width: '200px',
                    fontSize: 'var(--text-small)',
                    fontFamily: 'var(--font-sans)',
                    zIndex: 10,
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-600)', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <Info size={14} />
                      Why this changed
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Updated based on your recent study session notes.
                    </p>
                  </div>
                )}
              </span>{' '}
              influence trade patterns.
            </p>
          </div>

          {/* Section 1: Introduction */}
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '1rem',
            fontFamily: 'var(--font-sans)'
          }}>
            1. Introduction to Global Trade:
          </h3>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2rem' }}>
            International trade allows countries to specialize in producing goods where they
            have a <span style={{ textDecoration: 'underline', color: 'var(--primary-600)' }}>comparative advantage</span>.
            This principle, established by David Ricardo,
            demonstrates how trade can benefit all participating nations even when one
            country is more efficient at producing everything.
          </p>

          {/* Section 2: Recommendation */}
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '1rem',
            fontFamily: 'var(--font-sans)'
          }}>
            2. Recommendation to Global Trade
          </h3>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>
            Countries should focus on industries where they have natural advantages, whether
            through labor costs, natural resources, or technological capabilities. This leads to
            more efficient global production and lower consumer prices.
          </p>
        </article>
      )}

      {/* Floating Action Bar */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '280px',
        right: '0',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 50
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '0.75rem 1.5rem',
          borderRadius: '9999px',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          border: '1px solid var(--border-subtle)',
          pointerEvents: 'auto'
        }}>
          <button className="btn btn-tertiary" style={{ padding: '0.5rem 1rem' }}>
            <Undo2 size={16} />
            Undo
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary">
              <Check size={16} />
              Accept changes
            </button>
            <button className="btn btn-secondary">
              <Flag size={16} />
              Flag issue
            </button>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)' }} />

          <button className="btn btn-tertiary" style={{ padding: '0.5rem 1rem' }}>
            <PenLine size={16} />
            Edit summary
          </button>
        </div>
      </div>

      {/* Add Study Material Modal */}
      {isModalOpen && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '10vh',
            zIndex: 9999
          }}
          onClick={handleCancel}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-modal)',
              width: '100%',
              maxWidth: '500px',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              textAlign: 'center',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Add Study Material
              </h2>

              {/* Step Progress */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                {steps.map((step) => (
                  <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: currentStep >= step.id ? 'var(--primary-600)' : 'var(--neutral-300)'
                    }} />
                    <span style={{
                      fontSize: 'var(--text-caption)',
                      color: currentStep >= step.id ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}>
                      {step.id}. {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem' }}>
              {isProcessing ? (
                /* Processing Status Display */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '2rem 0' }}>
                  {/* Animated Spinner */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '3px solid var(--border-subtle)',
                    borderTopColor: 'var(--primary-600)',
                    animation: 'spin 1s linear infinite'
                  }} />
                  
                  {/* Status Text */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      fontSize: 'var(--text-body)', 
                      fontWeight: 500, 
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      {uploadStatus === 'uploading' && 'Uploading file...'}
                      {uploadStatus === 'uploaded' && 'File uploaded!'}
                      {uploadStatus === 'extracting' && 'Extracting text...'}
                      {uploadStatus === 'summarizing' && 'Generating AI summary...'}
                      {uploadStatus === 'complete' && '✅ Processing complete!'}
                      {uploadStatus === 'error' && '❌ Processing failed'}
                    </p>
                    {uploadMessage && (
                      <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }}>
                        {uploadMessage}
                      </p>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ width: '100%', maxWidth: '300px' }}>
                    <div style={{
                      height: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${uploadProgress}%`,
                        backgroundColor: uploadStatus === 'error' ? 'var(--error-500)' : 'var(--primary-600)',
                        transition: 'width 0.3s ease',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <p style={{ 
                      textAlign: 'center', 
                      fontSize: 'var(--text-caption)', 
                      color: 'var(--text-muted)',
                      marginTop: '0.5rem'
                    }}>
                      {uploadProgress}%
                    </p>
                  </div>
                  
                  {/* Cancel Button during processing */}
                  {uploadStatus !== 'complete' && uploadStatus !== 'error' && (
                    <button 
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      style={{ marginTop: '1rem' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Select Input Type */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: 'var(--text-small)',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem'
                    }}>
                      Select Input Type
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {inputTypes.map((type) => (
                        <label
                          key={type.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 1rem',
                            backgroundColor: selectedType === type.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                            border: selectedType === type.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <input
                            type="radio"
                            name="inputType"
                            value={type.id}
                            checked={selectedType === type.id}
                            onChange={(e) => setSelectedType(e.target.value)}
                            style={{ accentColor: 'var(--accent-primary)' }}
                          />
                          <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-body)' }}>
                            {type.label}
                          </span>
                          {type.recommended && selectedType === type.id && (
                            <Check size={16} color="var(--accent-primary)" style={{ marginLeft: 'auto' }} />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* File Upload - for PDF type */}
                  {selectedType === 'pdf' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--text-small)',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.75rem'
                      }}>
                        File Upload
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.mp3,.wav,.webm,.mp4"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                          border: `2px dashed ${isDragOver ? 'var(--primary-500)' : selectedFile ? 'var(--success-500)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '2rem',
                          textAlign: 'center',
                          color: selectedFile ? 'var(--text-primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          backgroundColor: isDragOver ? 'var(--primary-50)' : selectedFile ? 'var(--success-50)' : 'transparent'
                        }}
                      >
                        {selectedFile ? (
                          <>
                            <FileText size={24} style={{ marginBottom: '0.5rem', color: 'var(--success-600)' }} />
                            <p style={{ fontWeight: 500 }}>{selectedFile.name}</p>
                            <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                            <p>Drag and drop a file or click to browse</p>
                            <p style={{ fontSize: 'var(--text-caption)', marginTop: '0.5rem' }}>
                              PDF, Word, PowerPoint, Images, Audio, Video
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* URL Input - for Web Link type */}
                  {selectedType === 'url' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--text-small)',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.75rem'
                      }}>
                        Web URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/article"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-body)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  )}

                  {/* Text Input - for Text Note type */}
                  {selectedType === 'text' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--text-small)',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.75rem'
                      }}>
                        Text Note
                      </label>
                      <textarea
                        placeholder="Paste your text content here..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={6}
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-body)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  )}

                  {/* Error Display */}
                  {uploadError && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--error-50)',
                      border: '1px solid var(--error-200)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--error-700)',
                      fontSize: 'var(--text-small)',
                      marginBottom: '1rem'
                    }}>
                      ❌ {uploadError}
                    </div>
                  )}

                  {/* Advanced Options */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.75rem 0',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      fontSize: 'var(--text-body)'
                    }}
                  >
                    Advanced
                    {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {showAdvanced && (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem'
                    }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>
                        Advanced options will appear here...
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!isProcessing && (
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleNext} 
                  style={{ flex: 1, opacity: canProceed() ? 1 : 0.5 }}
                  disabled={!canProceed()}
                >
                  {getNextButtonText()}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const MaterialItem = ({ title, source, link }) => (
  <div style={{
    padding: '1rem 1.5rem',
    borderBottom: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)'
  }}
    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
      {title}
    </h3>
    <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
      🔗 {source}
    </p>
    <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }}>
      Questionns this {link}
    </p>
    <a href="#" style={{ fontSize: 'var(--text-small)', color: 'var(--secondary-600)', textDecoration: 'none' }}>
      Learn more
    </a>
  </div>
);

export default KnowledgeLab;
