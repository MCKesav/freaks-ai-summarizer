import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, RotateCcw } from 'lucide-react';

const StudyArena = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('quiz'); // 'flashcard' or 'quiz'
  const [currentCard, setCurrentCard] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [shake, setShake] = useState(false);
  const [cardGlow, setCardGlow] = useState(null); // 'green', 'red', 'yellow', 'orange' or null

  const flashcards = [
    {
      question: 'What is the primary function of the mitochondria?',
      answer: 'Energy production (ATP)',
      description: 'Known as the powerhouse of the cell, it converts nutrients into adenosine triphosphate.'
    },
    {
      question: 'What is the capital of France?',
      answer: 'Paris',
      description: 'Located on the Seine River in northern France.'
    },
    {
      question: 'What is the process by which green plants use sunlight to synthesize foods?',
      answer: 'Photosynthesis',
      description: 'It generally involves the green pigment chlorophyll and generates oxygen as a byproduct.'
    }
  ];

  const currentFlashcard = flashcards[currentCard];

  // Emotion-based colors from the wheel
  const ratingColors = {
    bad: { bg: '#FECACA', border: '#F87171', text: '#991B1B' },        // Red - remorse/sadness
    average: { bg: '#FEF3C7', border: '#FBBF24', text: '#92400E' },    // Yellow - pensiveness
    good: { bg: '#BBF7D0', border: '#4ADE80', text: '#166534' },       // Green - optimism/serenity
    excellent: { bg: '#DBEAFE', border: '#60A5FA', text: '#1E40AF' }   // Blue - joy/love
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleRating = (rating) => {
    if (rating === 'good' || rating === 'excellent') {
      setCardGlow('green');
    } else if (rating === 'bad') {
      setCardGlow('red');
    } else if (rating === 'average') {
      setCardGlow('yellow');
    }

    setTimeout(() => {
      if (currentCard < flashcards.length - 1) {
        setCurrentCard(currentCard + 1);
        setIsRevealed(false);
        setCardGlow(null);
      } else {
        setSessionComplete(true);
      }
    }, 400);
  };

  const handleSubmitQuiz = () => {
    if (!userAnswer.trim()) {
      setShake(true);
      setCardGlow('red');
      setTimeout(() => {
        setShake(false);
        setCardGlow(null);
      }, 300);
      return;
    }
    setIsSubmitted(true);
  };

  const handleNextQuiz = (rating) => {
    if (rating === 'good' || rating === 'excellent') {
      setCardGlow('green');
    } else if (rating === 'bad') {
      setCardGlow('red');
    } else if (rating === 'average') {
      setCardGlow('yellow');
    }

    setTimeout(() => {
      if (currentCard < flashcards.length - 1) {
        setCurrentCard(currentCard + 1);
        setIsSubmitted(false);
        setUserAnswer('');
        setShowHint(false);
        setCardGlow(null);
      } else {
        setSessionComplete(true);
      }
    }, 400);
  };

  const handleRestart = () => {
    setCurrentCard(0);
    setIsRevealed(false);
    setIsSubmitted(false);
    setUserAnswer('');
    setShowHint(false);
    setSessionComplete(false);
    setCardGlow(null);
  };

  // Get glow style based on cardGlow state
  const getGlowStyle = () => {
    switch (cardGlow) {
      case 'green':
        return {
          boxShadow: '0 0 0 4px rgba(74, 222, 128, 0.5), 0 4px 20px rgba(74, 222, 128, 0.3)',
          border: '2px solid #4ADE80'
        };
      case 'red':
        return {
          boxShadow: '0 0 0 4px rgba(248, 113, 113, 0.5), 0 4px 20px rgba(248, 113, 113, 0.3)',
          border: '2px solid #F87171'
        };
      case 'yellow':
        return {
          boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.5), 0 4px 20px rgba(251, 191, 36, 0.3)',
          border: '2px solid #FBBF24'
        };
      default:
        return {
          boxShadow: 'var(--shadow-soft)',
          border: '1px solid var(--border-subtle)'
        };
    }
  };

  if (sessionComplete) {
    return (
      <div className="animate-fade-in" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: 'var(--text-h1)', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Session Complete! 🎉
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          You reviewed {flashcards.length} cards
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Exit to Dashboard
          </button>
          <button className="btn btn-primary" onClick={handleRestart}>
            <RotateCcw size={18} />
            Restart Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Header - just X and progress */}
      <div style={{
        position: 'fixed',
        top: '1.5rem',
        left: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '1.5rem'
          }}
        >
          ×
        </button>

        <div style={{
          backgroundColor: 'var(--neutral-200)',
          padding: '0.4rem 0.8rem',
          borderRadius: '9999px',
          fontSize: 'var(--text-small)',
          color: 'var(--text-secondary)'
        }}>
          {currentCard + 1} of {flashcards.length}
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '500px',
        padding: '1.5rem',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        ...getGlowStyle()
      }}>
        {/* Card Header: Mode Toggle + X + Progress */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--neutral-200)',
            borderRadius: '9999px',
            padding: '3px'
          }}>
            <button
              onClick={() => { setMode('quiz'); setIsSubmitted(false); setIsRevealed(false); }}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-small)',
                fontWeight: 500,
                backgroundColor: mode === 'quiz' ? 'var(--neutral-800)' : 'transparent',
                color: mode === 'quiz' ? 'white' : 'var(--text-muted)'
              }}
            >
              Quiz
            </button>
            <button
              onClick={() => { setMode('flashcard'); setIsSubmitted(false); setIsRevealed(false); }}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-small)',
                fontWeight: 500,
                backgroundColor: mode === 'flashcard' ? 'var(--neutral-800)' : 'transparent',
                color: mode === 'flashcard' ? 'white' : 'var(--text-muted)'
              }}
            >
              Flashcards
            </button>
          </div>

          {/* Progress inside card */}
          <span style={{
            fontSize: 'var(--text-small)',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--neutral-100)',
            padding: '0.3rem 0.6rem',
            borderRadius: '9999px'
          }}>
            {currentCard + 1} of {flashcards.length}
          </span>

          {/* Close button inside card */}
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Question */}
        <h2 style={{
          fontSize: '1.35rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
          marginBottom: '1.5rem'
        }}>
          {currentFlashcard.question}
        </h2>

        {/* QUIZ MODE */}
        {mode === 'quiz' && (
          <>
            {!isSubmitted ? (
              <>
                <textarea
                  className={shake ? 'animate-shake' : ''}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.875rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-body)',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    outline: 'none',
                    backgroundColor: 'var(--bg-secondary)',
                    marginBottom: '1rem'
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-small)',
                      textDecoration: 'underline'
                    }}
                  >
                    Need a hint?
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitQuiz}
                  >
                    Submit
                  </button>
                </div>

                {showHint && (
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-small)',
                    fontStyle: 'italic',
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--secondary-50)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    💡 {currentFlashcard.description}
                  </p>
                )}
              </>
            ) : (
              <>
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '1.5rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    {currentFlashcard.answer}
                  </h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-small)',
                    marginBottom: '1.5rem'
                  }}>
                    {currentFlashcard.description}
                  </p>
                </div>

                {/* Rating Buttons with Emotion Colors */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['bad', 'average', 'good', 'excellent'].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleNextQuiz(rating)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        border: `1px solid ${ratingColors[rating].border}`,
                        backgroundColor: ratingColors[rating].bg,
                        color: ratingColors[rating].text,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: 'var(--text-small)',
                        fontWeight: 500,
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {rating === 'bad' && '😓'}
                      {rating === 'average' && '🤔'}
                      {rating === 'good' && '😊'}
                      {rating === 'excellent' && '🤩'}
                      {' '}{rating.charAt(0).toUpperCase() + rating.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* FLASHCARD MODE */}
        {mode === 'flashcard' && (
          <>
            {!isRevealed ? (
              <div style={{ textAlign: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleReveal}
                >
                  Reveal answer
                </button>
              </div>
            ) : (
              <>
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '1.5rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    {currentFlashcard.answer}
                  </h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-small)',
                    marginBottom: '1.5rem'
                  }}>
                    {currentFlashcard.description}
                  </p>
                </div>

                {/* Rating Buttons with Emotion Colors */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['bad', 'average', 'good', 'excellent'].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRating(rating)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        border: `1px solid ${ratingColors[rating].border}`,
                        backgroundColor: ratingColors[rating].bg,
                        color: ratingColors[rating].text,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: 'var(--text-small)',
                        fontWeight: 500,
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {rating === 'bad' && '😓'}
                      {rating === 'average' && '🤔'}
                      {rating === 'good' && '😊'}
                      {rating === 'excellent' && '🤩'}
                      {' '}{rating.charAt(0).toUpperCase() + rating.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudyArena;
