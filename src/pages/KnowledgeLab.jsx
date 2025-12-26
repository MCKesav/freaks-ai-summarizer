import React, { useState } from 'react';
import { Plus, Check, Flag, PenLine, Undo2, Info, X, FileText, Link, Type, Mic, ChevronDown, ChevronUp, Upload, Search } from 'lucide-react';

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
    { id: 'url', label: 'Web Link', icon: Link },
    { id: 'text', label: 'Text Note', icon: Type },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit - show processing
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsModalOpen(false);
        setCurrentStep(1);
      }, 2000);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setCurrentStep(1);
    setSelectedType('pdf');
    setShowAdvanced(false);
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

      {/* Search Popup Modal */}
      {isSearchPopupOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '10vh',
            zIndex: 100
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
        </div>
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
                  backgroundColor: 'var(--secondary-100)',
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
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '10vh',
            zIndex: 100
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
                /* Skeleton Loading State */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="skeleton" style={{ height: '20px', width: '60%', borderRadius: 'var(--radius-sm)' }} />
                  <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: 'var(--radius-md)' }} />
                  <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: 'var(--radius-md)' }} />
                  <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: 'var(--radius-md)' }} />
                  <div className="skeleton" style={{ height: '100px', width: '100%', borderRadius: 'var(--radius-md)' }} />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <div className="skeleton" style={{ height: '48px', width: '100px', borderRadius: 'var(--radius-md)' }} />
                    <div className="skeleton" style={{ height: '48px', flex: 1, borderRadius: 'var(--radius-md)' }} />
                  </div>
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
                            backgroundColor: selectedType === type.id ? 'var(--primary-50)' : 'var(--bg-secondary)',
                            border: selectedType === type.id ? '1px solid var(--primary-300)' : '1px solid transparent',
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
                            style={{ accentColor: 'var(--primary-600)' }}
                          />
                          <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-body)' }}>
                            {type.label}
                          </span>
                          {type.recommended && selectedType === type.id && (
                            <Check size={16} color="var(--primary-600)" style={{ marginLeft: 'auto' }} />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* File Upload */}
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
                    <div style={{
                      border: '2px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '2rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'border-color var(--transition-fast)'
                    }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-300)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                    >
                      <Upload size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                      <p>Drag and drop a file</p>
                    </div>
                  </div>

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
                <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1 }}>
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
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
