import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Users, Flame, CheckCircle2, Clock, Search, FileText, Layers, Zap, X } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const quickActions = [
        { icon: FileText, label: 'Go to: Biology Notes', type: 'go' },
        { icon: Layers, label: 'Create: New Flashcard Deck', type: 'create' },
        { icon: Zap, label: 'Action: Start Focus Session', type: 'action' },
    ];

    const upNextTasks = [
        { title: 'Advanced Algorithms: Graph Theory', subject: 'Computer Science', due: 'Today', isActive: true },
        { title: 'Cognitive Psychology Notes', subject: 'Psychology 101', due: 'Tomorrow', isActive: false },
        { title: 'System Design Interview Prep', subject: 'Career', due: 'Fri', isActive: false },
    ];

    return (
        <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '2rem' }}>

            {/* Hero Section - Greeting + Primary CTA */}
            <section style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                marginBottom: '1rem'
            }}>
                {/* Greeting */}
                <h1 style={{
                    fontSize: 'var(--text-h1)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '2.5rem',
                    letterSpacing: '-0.02em'
                }}>
                    Welcome back, Alex
                </h1>

                {/* Primary CTA */}
                <button
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate('/study-arena')}
                    style={{
                        fontSize: '1.25rem',
                        padding: '1.25rem 3rem',
                        marginBottom: '1.5rem'
                    }}
                >
                    <Play fill="currentColor" size={20} />
                    Start Study Session
                </button>

                {/* Secondary CTAs */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/knowledge-lab')}>
                        <Plus size={18} />
                        Add Study Material
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/commons')}>
                        <Users size={18} />
                        Join Study Room
                    </button>
                </div>

                {/* Search Bar Trigger */}
                <div
                    onClick={() => setIsSearchOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        maxWidth: '400px',
                        margin: '0 auto',
                        padding: '0.875rem 1.25rem',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: '9999px',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-soft)',
                        cursor: 'pointer',
                        transition: 'box-shadow var(--transition-base)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; }}
                >
                    <Search size={18} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
                        Search notes, topics...
                    </span>
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: 'var(--text-caption)',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        ⌘K
                    </span>
                </div>
            </section>

            {/* Metric Cards Row */}
            <section style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                {/* Today's Goal Card */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}>Today's Goal</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Circular Progress Ring */}
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle
                                cx="18" cy="18" r="15"
                                fill="none"
                                stroke="var(--neutral-200)"
                                strokeWidth="3"
                            />
                            <circle
                                cx="18" cy="18" r="15"
                                fill="none"
                                stroke="var(--primary-600)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${75 * 0.94} 100`}
                                transform="rotate(-90 18 18)"
                            />
                        </svg>
                        <div>
                            <span style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>75%</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)', marginLeft: '0.5rem' }}>3/4 tasks done</span>
                        </div>
                    </div>
                </div>

                {/* Streak Card */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}>Streak</span>
                        <Flame size={18} color="var(--secondary-500)" />
                    </div>
                    <div>
                        <span style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>12</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)', marginLeft: '0.5rem' }}>Days</span>
                    </div>
                </div>

                {/* Focus Time Card */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}>Focus Time</span>
                        <Clock size={18} color="var(--primary-600)" />
                    </div>
                    <div>
                        <span style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>1.5h</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)', marginLeft: '0.5rem' }}>Today</span>
                    </div>
                </div>
            </section>

            {/* Up Next Task List */}
            <section style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border-subtle)'
                }}>
                    <h2 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }}>Up next</h2>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>•••</button>
                </div>

                {upNextTasks.map((task, index) => (
                    <div
                        key={index}
                        onClick={() => navigate('/study-arena')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 1.5rem',
                            backgroundColor: task.isActive ? 'var(--bg-secondary)' : 'transparent',
                            cursor: 'pointer',
                            borderBottom: index < upNextTasks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                            transition: 'background-color var(--transition-fast)'
                        }}
                        onMouseOver={(e) => { if (!task.isActive) e.currentTarget.style.backgroundColor = 'var(--neutral-100)'; }}
                        onMouseOut={(e) => { if (!task.isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: '2px solid var(--border-subtle)',
                                backgroundColor: 'transparent'
                            }} />
                            <div>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{task.title}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>{task.subject}</div>
                            </div>
                        </div>
                        <span style={{
                            color: task.due === 'Today' ? 'var(--primary-600)' : 'var(--text-muted)',
                            fontSize: 'var(--text-small)',
                            fontWeight: task.due === 'Today' ? 500 : 400
                        }}>
                            {task.due}
                        </span>
                    </div>
                ))}
            </section>

            {/* Command Palette Modal */}
            {isSearchOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '15vh',
                        zIndex: 100
                    }}
                    onClick={() => setIsSearchOpen(false)}
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
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--border-subtle)'
                        }}>
                            <Search size={20} color="var(--text-muted)" />
                            <input
                                type="text"
                                placeholder="Type to search or enter command..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: 'var(--text-body)',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '0.5rem 0' }}>
                            {quickActions.map((action, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1.25rem',
                                        cursor: 'pointer',
                                        transition: 'background-color var(--transition-fast)'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        if (action.type === 'action') navigate('/study-arena');
                                        if (action.type === 'create') navigate('/knowledge-lab');
                                    }}
                                >
                                    <action.icon size={18} color="var(--text-muted)" />
                                    <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-body)' }}>
                                        {action.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
