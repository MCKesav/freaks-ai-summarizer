import React, { useState } from 'react';
import { Users, Clock, Shield, Music, SkipBack, Play, Pause, SkipForward, Plus, X, ArrowRight, Mic, MicOff, Video, VideoOff, LogOut, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Commons = () => {
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [roomCode, setRoomCode] = useState('');

    // Room Mode State (Silent Presence)
    const [activeRoom, setActiveRoom] = useState(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [floatingVideoPosition, setFloatingVideoPosition] = useState({ x: null, y: null });

    // Mock participants for room mode
    const [participants] = useState([
        { id: 1, name: 'Jordan D.', initials: 'JD', color: '#3B82F6', isSpeaking: false, hasCamera: false },
        { id: 2, name: 'Kesav S.', initials: 'KS', color: '#10B981', isSpeaking: true, hasCamera: false },
        { id: 3, name: 'Mena R.', initials: 'MR', color: '#8B5CF6', isSpeaking: false, hasCamera: false },
        { id: 4, name: 'Blake L.', initials: 'BL', color: '#6B7280', isSpeaking: false, hasCamera: true },
        { id: 5, name: 'You', initials: 'You', color: '#F59E0B', isSpeaking: false, hasCamera: false, isMe: true },
    ]);
    // FR-43: Collaborative Study Rooms
    const studyRooms = [
        { id: 1, name: 'Quiet Study A', currentTask: 'Chapter 5', participants: 85 },
        { id: 2, name: 'Focus Group B', currentTask: 'Project Prep', participants: 42 },
        { id: 3, name: 'Reading Room C', currentTask: 'Article Review', participants: 67 },
        { id: 4, name: 'Discussion Hall D', currentTask: 'Topic Brainstorm', participants: 110 },
        { id: 5, name: 'Workshop E', currentTask: 'Coding Challenge', participants: 35 },
        { id: 6, name: 'Breakout Space F', currentTask: 'Casual Chat', participants: 28 },
    ];

    const handleJoinRoom = (room) => {
        // Enter room mode in-place (Silent Presence)
        setActiveRoom(room);
    };

    const handleJoinByCode = () => {
        if (roomCode.trim()) {
            setIsJoinModalOpen(false);
            const customRoom = { id: 'custom', name: `Room ${roomCode}`, currentTask: 'Study Session', participants: 1 };
            setRoomCode('');
            setActiveRoom(customRoom);
        }
    };

    const handleLeaveRoom = () => {
        setActiveRoom(null);
        setIsMuted(true);
        setIsCameraOn(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            padding: '2rem',
            position: 'relative'
        }}>
            {/* Header: Conditional based on room mode */}
            {activeRoom ? (
                /* Room Mode Header with Participant Avatars */
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    padding: '1rem 1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    {/* Room Name */}
                    <h1 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                    }}>
                        {activeRoom.name}
                    </h1>

                    {/* Participant Avatars Row */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        {participants.map((p) => (
                            <div
                                key={p.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    position: 'relative'
                                }}
                            >
                                {/* Avatar Circle */}
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: p.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        boxShadow: p.isSpeaking
                                            ? `0 0 0 3px var(--bg-card), 0 0 0 5px #10B981`
                                            : 'none',
                                        transition: 'box-shadow 0.2s ease',
                                        cursor: p.isMe ? 'pointer' : 'default'
                                    }}
                                    title={p.name}
                                >
                                    {p.initials}
                                </div>
                                {/* Name Label */}
                                <span style={{
                                    fontSize: '0.625rem',
                                    color: 'var(--text-muted)',
                                    maxWidth: '50px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {p.isMe ? 'You' : p.name.split(' ')[0]}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Leave Button */}
                    <button
                        onClick={handleLeaveRoom}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#EF4444',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                    >
                        Leave
                    </button>
                </div>
            ) : (
                /* Lobby Mode Header */
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                    }}>
                        The Commons
                    </h1>

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center'
                    }}>
                        {/* Join by Code Search Bar */}
                        <div
                            onClick={() => setIsJoinModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(8px)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.borderColor = 'var(--primary-500)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}
                        >
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Join:</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>[Code]</span>
                            <ArrowRight size={16} color="var(--text-muted)" />
                        </div>

                        {/* Create Study Room Button */}
                        <button
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#3B82F6',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                        >
                            <Plus size={18} />
                            Create Study Room
                        </button>
                    </div>
                </div>
            )}

            {/* Join Modal */}
            {isJoinModalOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsJoinModalOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 1000
                        }}
                    />

                    {/* Modal */}
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        width: '90%',
                        maxWidth: '400px',
                        zIndex: 1001,
                        boxShadow: 'var(--shadow-modal)',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        {/* Close Button */}
                        <button
                            onClick={() => setIsJoinModalOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '0.25rem'
                            }}
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Title */}
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            Join Study Room
                        </h2>

                        {/* Room Code Label */}
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem'
                        }}>
                            Room Code
                        </label>

                        {/* Room Code Input */}
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleJoinByCode()}
                            placeholder="ABC-123"
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                fontSize: '1rem',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.5rem',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                        />

                        {/* Join Room Button */}
                        <button
                            onClick={handleJoinByCode}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                backgroundColor: 'var(--primary-600)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-700)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-600)'}
                        >
                            Join Room
                        </button>
                    </div>
                </>
            )}

            {/* Main Content: Conditional Room Mode or Lobby */}
            {activeRoom ? (
                /* Room Mode: Shared Materials Area */
                <div style={{
                    flex: 1,
                    position: 'relative',
                    minHeight: '60vh'
                }}>
                    {/* Shared Materials Workspace */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '50vh',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-subtle)',
                        padding: '3rem'
                    }}>
                        <FileText size={64} color="var(--text-muted)" strokeWidth={1} />
                        <h2 style={{
                            marginTop: '1.5rem',
                            fontSize: '1.25rem',
                            fontWeight: 500,
                            color: 'var(--text-primary)'
                        }}>
                            Shared Materials Area
                        </h2>
                        <p style={{
                            marginTop: '0.5rem',
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                            maxWidth: '300px'
                        }}>
                            Drag and drop documents, flashcards, or notes to share with the room.
                        </p>
                        <button
                            className="btn btn-secondary"
                            style={{ marginTop: '1.5rem' }}
                        >
                            Browse Materials
                        </button>
                    </div>

                    {/* Floating Video Tile (for users with camera on) */}
                    {participants.some(p => p.hasCamera) && (
                        <div style={{
                            position: 'absolute',
                            bottom: '1rem',
                            right: '1rem',
                            width: '160px',
                            height: '100px',
                            backgroundColor: 'var(--neutral-800)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            overflow: 'hidden',
                            border: '2px solid var(--bg-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* Placeholder for video */}
                            <div style={{
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Video size={24} color="var(--text-muted)" />
                            </div>
                            {/* Close button */}
                            <button
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={12} color="#fff" />
                            </button>
                        </div>
                    )}

                    {/* Room Controls Bar (bottom center) */}
                    <div style={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        {/* Mic Toggle */}
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: isMuted ? 'var(--bg-secondary)' : '#10B981',
                                color: isMuted ? 'var(--text-secondary)' : '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>

                        {/* Camera Toggle */}
                        <button
                            onClick={() => setIsCameraOn(!isCameraOn)}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: isCameraOn ? '#3B82F6' : 'var(--bg-secondary)',
                                color: isCameraOn ? '#FFFFFF' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                        >
                            {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                        </button>
                    </div>
                </div>
            ) : (
                /* Lobby Mode: Room Grid + Sidebar */
                <div style={{
                    display: 'flex',
                    gap: '2rem',
                    position: 'relative'
                }}>
                    {/* Room Grid (Left) */}
                    <div style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        alignContent: 'start'
                    }}>
                        {studyRooms.map((room) => (
                            <div
                                key={room.id}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.5rem',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                }}
                            >
                                {/* Room Name */}
                                <h3 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    {room.name}
                                </h3>

                                {/* FR-44: Task Sync - Current Task */}
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--text-muted)',
                                    marginBottom: '1rem'
                                }}>
                                    Currently: {room.currentTask}
                                </p>

                                {/* Participants + Join Button */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.875rem'
                                    }}>
                                        <Users size={16} />
                                        <span>{room.participants} participants</span>
                                    </div>

                                    <button
                                        onClick={() => handleJoinRoom(room)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: 'var(--text-secondary)',
                                            color: 'var(--bg-card)',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--text-primary)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--text-secondary)'}
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Floating Sidebar (Right) */}
                    <div style={{
                        width: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {/* Community Stats Card */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: '1rem'
                            }}>
                                Community Stats
                            </h2>

                            {/* Collective Achievement (White Hat) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <Clock size={20} color="var(--text-muted)" />
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Together: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1,247 hours</span>
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <Users size={20} color="var(--text-muted)" />
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Active learners: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>234</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Your Path Card (FR-45, FR-46) */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: '1rem'
                            }}>
                                Your Path
                            </h2>

                            {/* FR-45: XP (Contribution-based, White Hat) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🌱</span>
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Contributions: <span style={{ fontWeight: 600, color: '#10B981' }}>125 points</span>
                                    </p>
                                </div>
                            </div>

                            {/* FR-45: League (Narrative, opt-in) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Guild: <span style={{ fontWeight: 600, color: '#3B82F6' }}>Explorers</span>
                                    </p>
                                </div>
                            </div>

                            {/* FR-46: Streak (Continuity framing, White Hat) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🔥</span>
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Streak: <span style={{ fontWeight: 600, color: '#F59E0B' }}>12 days</span>
                                    </p>
                                </div>
                            </div>

                            {/* FR-46: Streak Preservation (Care/support tone) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <Shield size={20} color="var(--text-muted)" />
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        Shield available
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FR-47: Shared Playlist Widget (Bottom-Right) - Only show in lobby mode */}
            {!activeRoom && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '280px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}>
                    {/* Album Art Placeholder */}
                    <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Music size={24} color="var(--text-muted)" />
                    </div>

                    <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                    }}>
                        Shared Playlist
                    </h3>

                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.75rem'
                    }}>
                        Earned by community
                    </p>

                    {/* Progress Bar */}
                    <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '2px',
                        marginBottom: '0.75rem',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: '45%',
                            height: '100%',
                            backgroundColor: 'var(--accent-primary)'
                        }} />
                    </div>

                    {/* Playback Controls */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem'
                    }}>
                        <button style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.25rem'
                        }}>
                            <SkipBack size={20} />
                        </button>

                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                padding: '0.25rem'
                            }}
                        >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>

                        <button style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.25rem'
                        }}>
                            <SkipForward size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Commons;
