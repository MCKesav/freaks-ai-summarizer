import React, { useState } from 'react';
import { Users, Plus, X, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Commons = () => {
    const navigate = useNavigate();
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [notification, setNotification] = useState(null);
    const [isJoining, setIsJoining] = useState(false);
    const [joinSuccess, setJoinSuccess] = useState(false);

    const studyRooms = [
        { id: 1, name: 'Deep Focus - Physics', participants: 3, max: 5 },
        { id: 2, name: 'Late Night Lofi', participants: 3, max: 5 },
        { id: 3, name: 'Group Project | History', participants: 3, max: 5 },
        { id: 4, name: 'Deep Focus - Physics', participants: 3, max: 5 },
        { id: 5, name: 'Group Project', participants: 3, max: 5 },
        { id: 6, name: 'Group Project | History', participants: 3, max: 5 },
    ];

    const handleJoinByCode = () => {
        if (!roomCode.trim()) {
            setJoinError('Enter a room code to join');
            return;
        }
        if (roomCode.toUpperCase() !== 'ABC-123') {
            setJoinError("Hmm, that code doesn't match any room.");
            return;
        }
        // Success - show loading then success
        setIsJoining(true);
        setTimeout(() => {
            setIsJoining(false);
            setJoinSuccess(true);
            setTimeout(() => {
                setIsJoinModalOpen(false);
                setRoomCode('');
                setJoinError('');
                setJoinSuccess(false);
                showNotification('You joined the room');
                navigate('/study-arena');
            }, 600);
        }, 800);
    };

    const handleJoinRoom = (roomName) => {
        showNotification(`Alex joined ${roomName}`);
        setTimeout(() => navigate('/study-arena'), 800);
    };

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '1.5rem',
                    right: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-modal)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    zIndex: 200,
                    border: '1px solid var(--border-subtle)'
                }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-body)' }}>{notification}</span>
                    <Check size={16} color="var(--success-600)" />
                </div>
            )}

            {/* Header */}
            <header style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <h1 style={{ fontSize: 'var(--text-h2)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Commons
                </h1>

                {/* Inline Join Trigger */}
                <div
                    onClick={() => setIsJoinModalOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        transition: 'box-shadow var(--transition-fast)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}>Join:</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>[Code]</span>
                    <ArrowRight size={16} color="var(--text-muted)" />
                </div>

                {/* Primary CTA */}
                <button className="btn btn-primary" onClick={() => navigate('/study-arena')}>
                    <Plus size={18} />
                    Create Study Room
                </button>
            </header>

            {/* Study Rooms Grid */}
            <section>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1rem'
                }}>
                    {studyRooms.map((room) => (
                        <div
                            key={room.id}
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1.25rem',
                                border: '1px solid var(--border-subtle)',
                                transition: 'box-shadow var(--transition-base)'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <h3 style={{
                                fontSize: 'var(--text-body)',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: '0.5rem'
                            }}>
                                {room.name}
                            </h3>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '1rem'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {/* Avatar Stack */}
                                    <div style={{ display: 'flex', marginRight: '0.25rem' }}>
                                        {[...Array(Math.min(room.participants, 3))].map((_, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    backgroundColor: `hsl(${i * 60 + 200}, 60%, 70%)`,
                                                    border: '2px solid var(--bg-card)',
                                                    marginLeft: i > 0 ? '-8px' : '0'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>
                                        {room.participants}/{room.max}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleJoinRoom(room.name)}
                                    style={{
                                        background: 'none',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.35rem 0.75rem',
                                        color: 'var(--text-secondary)',
                                        fontSize: 'var(--text-small)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                                        e.currentTarget.style.borderColor = 'var(--primary-300)';
                                        e.currentTarget.style.color = 'var(--primary-700)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                >
                                    Join
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Join Room Modal */}
            {isJoinModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100
                    }}
                    onClick={() => {
                        setIsJoinModalOpen(false);
                        setRoomCode('');
                        setJoinError('');
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-modal)',
                            width: '100%',
                            maxWidth: '400px',
                            padding: '2rem',
                            position: 'relative'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setIsJoinModalOpen(false);
                                setRoomCode('');
                                setJoinError('');
                            }}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <h2 style={{
                            fontSize: 'var(--text-h3)',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            Join Study Room
                        </h2>

                        {/* Room Code Input */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: 'var(--text-small)',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                marginBottom: '0.5rem'
                            }}>
                                Room Code
                            </label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => {
                                    setRoomCode(e.target.value);
                                    setJoinError('');
                                }}
                                placeholder="ABC-123"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    fontSize: 'var(--text-body)',
                                    border: joinError ? '2px solid var(--error-400)' : '2px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    outline: 'none',
                                    backgroundColor: joinError ? 'var(--error-50)' : 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    transition: 'border-color var(--transition-fast)'
                                }}
                                onFocus={(e) => {
                                    if (!joinError) e.target.style.borderColor = 'var(--primary-400)';
                                }}
                                onBlur={(e) => {
                                    if (!joinError) e.target.style.borderColor = 'var(--border-subtle)';
                                }}
                                autoFocus
                            />
                            {joinError && (
                                <p style={{
                                    color: 'var(--error-600)',
                                    fontSize: 'var(--text-small)',
                                    marginTop: '0.5rem'
                                }}>
                                    {joinError}
                                </p>
                            )}
                        </div>

                        {/* Join Button */}
                        <button
                            className={`btn btn-primary ${isJoining ? 'btn-loading' : ''} ${joinSuccess ? 'btn-success' : ''}`}
                            onClick={handleJoinByCode}
                            style={{ width: '100%', marginTop: '0.5rem' }}
                            disabled={isJoining || joinSuccess}
                        >
                            {joinSuccess ? 'Joined' : 'Join Room'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Commons;
