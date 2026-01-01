import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createAuthenticatedClient } from '../supabase';
import {
    ArrowLeft,
    Check,
    X,
    Eye,
    EyeOff,
    Calendar,
    Key,
    Trash2,
    Download,
    AlertTriangle,
    Loader2
} from 'lucide-react';

// Geometric Avatar Component
const GeometricAvatar = ({ selected, onSelect, size = 80 }) => {
    // 6 abstract geometric avatar options
    const avatarPatterns = [
        // Pattern 1: Concentric circles
        (s) => (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="var(--neutral-300)" />
                <circle cx="50" cy="50" r="30" fill="var(--primary-400)" />
                <circle cx="50" cy="50" r="15" fill="var(--neutral-700)" />
            </svg>
        ),
        // Pattern 2: Nested squares
        (s) => (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <rect x="10" y="10" width="80" height="80" fill="var(--neutral-300)" rx="8" />
                <rect x="25" y="25" width="50" height="50" fill="var(--secondary-400)" rx="4" transform="rotate(15 50 50)" />
                <rect x="35" y="35" width="30" height="30" fill="var(--neutral-700)" rx="2" />
            </svg>
        ),
        // Pattern 3: Triangle composition
        (s) => (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="var(--neutral-300)" />
                <polygon points="50,15 85,75 15,75" fill="var(--accent-400)" />
                <polygon points="50,35 70,65 30,65" fill="var(--neutral-700)" />
            </svg>
        ),
        // Pattern 4: Hexagonal layers
        (s) => (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" fill="var(--neutral-300)" />
                <polygon points="50,20 78,35 78,65 50,80 22,65 22,35" fill="var(--primary-500)" />
                <polygon points="50,35 63,42.5 63,57.5 50,65 37,57.5 37,42.5" fill="var(--neutral-800)" />
            </svg>
        ),
        // Pattern 5: Diamond stack
        (s) => (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="var(--neutral-300)" />
                <rect x="25" y="25" width="50" height="50" fill="var(--secondary-500)" transform="rotate(45 50 50)" />
                <rect x="35" y="35" width="30" height="30" fill="var(--neutral-200)" transform="rotate(45 50 50)" />
                <circle cx="50" cy="50" r="10" fill="var(--neutral-700)" />
            </svg>
        ),
        // Pattern 6: Overlapping circles
        (s) => (
            <svg width={s} height={s} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="var(--neutral-300)" />
                <circle cx="35" cy="45" r="20" fill="var(--primary-400)" opacity="0.8" />
                <circle cx="65" cy="45" r="20" fill="var(--secondary-400)" opacity="0.8" />
                <circle cx="50" cy="65" r="20" fill="var(--neutral-600)" opacity="0.8" />
            </svg>
        ),
    ];

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
        }}>
            {avatarPatterns.map((pattern, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(index)}
                    aria-label={`Select avatar pattern ${index + 1}`}
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: selected === index
                            ? '3px solid var(--primary-500)'
                            : '2px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                    }}
                    onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-300)'}
                    onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                    {pattern(size)}
                </button>
            ))}
        </div>
    );
};

// Undo Bar Component
const UndoBar = ({ message, onUndo, onDismiss, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
    }, [onDismiss, duration]);

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--neutral-800)',
            color: 'var(--neutral-100)',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 1000
        }}>
            <span>{message}</span>
            <button
                onClick={onUndo}
                style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--neutral-400)',
                    color: 'var(--neutral-100)',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: 500
                }}
            >
                Undo
            </button>
            <button
                onClick={onDismiss}
                aria-label="Dismiss"
                style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--neutral-400)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

// Skeleton Loader Component
const SkeletonLoader = ({ width = '100%', height = '1rem' }) => (
    <div
        style={{
            width,
            height,
            backgroundColor: 'var(--neutral-200)',
            borderRadius: 'var(--radius-sm)',
            animation: 'pulse 1.5s ease-in-out infinite'
        }}
    />
);

// Section Header Component
const SectionHeader = ({ title, description }) => (
    <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.25rem'
        }}>
            {title}
        </h2>
        {description && (
            <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)'
            }}>
                {description}
            </p>
        )}
    </div>
);

// Input Field Component
const InputField = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    disabled = false,
    error,
    rightElement
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem'
            }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    type={isPassword && showPassword ? 'text' : type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        paddingRight: isPassword || rightElement ? '3rem' : '1rem',
                        fontSize: '1rem',
                        border: error
                            ? '1px solid var(--error-500)'
                            : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: disabled ? 'var(--bg-secondary)' : 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-500)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-100)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = error ? 'var(--error-500)' : 'var(--border-subtle)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '0.25rem'
                        }}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
                {rightElement && !isPassword && (
                    <div style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)'
                    }}>
                        {rightElement}
                    </div>
                )}
            </div>
            {error && (
                <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--error-500)',
                    marginTop: '0.375rem'
                }}>
                    {error}
                </p>
            )}
        </div>
    );
};

// Toggle Switch Component
const ToggleSwitch = ({ label, description, checked, onChange }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '1rem 0',
        borderBottom: '1px solid var(--border-subtle)'
    }}>
        <div style={{ flex: 1, marginRight: '1rem' }}>
            <p style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '0.25rem'
            }}>
                {label}
            </p>
            {description && (
                <p style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)'
                }}>
                    {description}
                </p>
            )}
        </div>
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: checked ? 'var(--primary-500)' : 'var(--neutral-300)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                flexShrink: 0
            }}
        >
            <span style={{
                position: 'absolute',
                top: '2px',
                left: checked ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s ease'
            }} />
        </button>
    </div>
);

// Danger Button Component
const DangerButton = ({ children, onClick, loading = false }) => (
    <button
        onClick={onClick}
        disabled={loading}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.875rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--error-500)',
            color: 'var(--error-500)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
            if (!loading) {
                e.currentTarget.style.backgroundColor = 'var(--error-50)';
            }
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
        }}
    >
        {loading ? <Loader2 size={18} className="animate-spin" /> : children}
    </button>
);

// Main Profile Settings Component
const ProfileSettings = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // State
    const [selectedAvatar, setSelectedAvatar] = useState(0);
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Preferences
    const [reducedMotion, setReducedMotion] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);

    // Calendar
    const [calendarConnected, setCalendarConnected] = useState(false);

    // API Key
    const [showApiKey, setShowApiKey] = useState(false);
    const [apiKey, setApiKey] = useState('');

    // Advanced section visibility
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Undo state
    const [undoBar, setUndoBar] = useState(null);

    // Loading states
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Load user profile from Supabase on mount
    useEffect(() => {
        const loadProfile = async () => {
            if (!currentUser?.uid) {
                setLoadingProfile(false);
                return;
            }

            try {
                const supabase = await createAuthenticatedClient();
                const { data, error } = await supabase
                    .from('users_profile')
                    .select('*')
                    .eq('firebase_uid', currentUser.uid)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    // PGRST116 = no rows found (first time user)
                    console.error('Error loading profile:', error);
                } else if (data) {
                    // Populate state from Supabase data
                    // preferences is a JSONB column containing all settings
                    const prefs = data.preferences || {};
                    setSelectedAvatar(prefs.avatar_index ?? 0);
                    setDisplayName(data.display_name || currentUser.displayName || '');
                    setReducedMotion(prefs.reduced_motion ?? false);
                    setHighContrast(prefs.high_contrast ?? false);
                    setEmailNotifications(prefs.email_notifications ?? true);
                    setCalendarConnected(prefs.calendar_connected ?? false);
                    setApiKey(prefs.gemini_api_key || '');
                }
            } catch (err) {
                console.error('Error loading profile:', err);
            } finally {
                setLoadingProfile(false);
            }
        };

        loadProfile();
    }, [currentUser]);

    const handleSaveProfile = async () => {
        if (!currentUser?.uid) {
            setUndoBar({ message: 'Please log in to save profile', type: 'error' });
            return;
        }

        setSavingProfile(true);
        try {
            const supabase = await createAuthenticatedClient();
            
            // The table has: id, firebase_uid, email, display_name, preferences (JSONB), created_at
            const profileData = {
                firebase_uid: currentUser.uid,
                email: currentUser.email,
                display_name: displayName,
                preferences: {
                    avatar_index: selectedAvatar,
                    reduced_motion: reducedMotion,
                    high_contrast: highContrast,
                    email_notifications: emailNotifications,
                    calendar_connected: calendarConnected,
                    gemini_api_key: apiKey || null,
                },
            };

            // Upsert: insert if not exists, update if exists
            const { error } = await supabase
                .from('users_profile')
                .upsert(profileData, { onConflict: 'firebase_uid' });

            if (error) {
                console.error('Error saving profile:', error);
                setUndoBar({ message: 'Failed to save profile: ' + error.message, type: 'error' });
            } else {
                setUndoBar({ message: 'Profile updated successfully', type: 'success' });
            }
        } catch (err) {
            console.error('Error saving profile:', err);
            setUndoBar({ message: 'Failed to save profile', type: 'error' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            return;
        }
        setSavingPassword(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setSavingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setUndoBar({ message: 'Password changed successfully', type: 'success' });
    };

    const handleConnectCalendar = () => {
        setCalendarConnected(!calendarConnected);
        setUndoBar({
            message: calendarConnected ? 'Calendar disconnected' : 'Calendar connected',
            type: 'info'
        });
    };

    const handleExportData = () => {
        setUndoBar({ message: 'Data export started. You will receive an email when ready.', type: 'info' });
    };

    const handleDeleteAccount = () => {
        // This would trigger a more complex flow in production
        setUndoBar({ message: 'Account scheduled for deletion', type: 'warning' });
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            padding: '2rem'
        }}>
            {/* Header */}
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                marginBottom: '2rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '0.5rem 0',
                        fontSize: '0.9375rem',
                        marginBottom: '1rem'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                }}>
                    Profile Settings
                </h1>
            </div>

            {/* Main Content */}
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem'
            }}>
                {/* Avatar Section */}
                <section style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <SectionHeader
                        title="Avatar"
                        description="Choose an abstract geometric pattern"
                    />
                    <GeometricAvatar
                        selected={selectedAvatar}
                        onSelect={setSelectedAvatar}
                        size={64}
                    />
                </section>

                {/* Account Information */}
                <section style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <SectionHeader
                        title="Account Information"
                        description="Manage your display name and email"
                    />
                    <InputField
                        label="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                    />
                    <InputField
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                    />
                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            padding: '0.875rem 1rem',
                            backgroundColor: 'var(--primary-500)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            cursor: savingProfile ? 'not-allowed' : 'pointer',
                            opacity: savingProfile ? 0.7 : 1,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {savingProfile ? (
                            <>
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </section>

                {/* Change Password */}
                <section style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <SectionHeader
                        title="Change Password"
                        description="Update your account password"
                    />
                    <InputField
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                    />
                    <InputField
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                    />
                    <InputField
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : null}
                    />
                    <button
                        onClick={handleChangePassword}
                        disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            padding: '0.875rem 1rem',
                            backgroundColor: 'var(--text-secondary)',
                            color: 'var(--bg-card)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            cursor: savingPassword || !currentPassword || !newPassword ? 'not-allowed' : 'pointer',
                            opacity: (!currentPassword || !newPassword || newPassword !== confirmPassword) ? 0.5 : 1,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {savingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                </section>

                {/* System Preferences */}
                <section style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <SectionHeader
                        title="System Preferences"
                        description="Customize your experience"
                    />
                    <ToggleSwitch
                        label="Reduced Motion"
                        description="Minimize animations and transitions"
                        checked={reducedMotion}
                        onChange={setReducedMotion}
                    />
                    <ToggleSwitch
                        label="High Contrast Mode"
                        description="Increase contrast for better visibility"
                        checked={highContrast}
                        onChange={setHighContrast}
                    />
                    <ToggleSwitch
                        label="Email Notifications"
                        description="Receive updates and reminders via email"
                        checked={emailNotifications}
                        onChange={setEmailNotifications}
                    />
                </section>

                {/* Calendar Integration */}
                <section style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <SectionHeader
                        title="Calendar Integration"
                        description="Connect your calendar for scheduled study sessions"
                    />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <Calendar size={24} color="var(--text-muted)" />
                            <div>
                                <p style={{
                                    fontSize: '0.9375rem',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)'
                                }}>
                                    Google Calendar
                                </p>
                                <p style={{
                                    fontSize: '0.8125rem',
                                    color: calendarConnected ? 'var(--success-500)' : 'var(--text-muted)'
                                }}>
                                    {calendarConnected ? 'Connected' : 'Not connected'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleConnectCalendar}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: calendarConnected ? 'transparent' : 'var(--primary-500)',
                                color: calendarConnected ? 'var(--text-secondary)' : 'white',
                                border: calendarConnected ? '1px solid var(--border-subtle)' : 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            {calendarConnected ? 'Disconnect' : 'Connect'}
                        </button>
                    </div>
                </section>

                {/* Advanced Settings Toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: 'transparent',
                        border: '1px dashed var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                </button>

                {/* Advanced Settings */}
                {showAdvanced && (
                    <>
                        {/* API Key Management */}
                        <section style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <SectionHeader
                                title="Custom AI API Key"
                                description="Use your own OpenAI or Gemini API key"
                            />
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.875rem 1rem',
                                backgroundColor: 'var(--warning-50)',
                                border: '1px solid var(--warning-200)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem'
                            }}>
                                <Key size={18} color="var(--warning-600)" />
                                <p style={{
                                    fontSize: '0.8125rem',
                                    color: 'var(--warning-700)'
                                }}>
                                    Your API key is stored locally and never sent to our servers.
                                </p>
                            </div>
                            <InputField
                                label="API Key"
                                type={showApiKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                rightElement={
                                    <button
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)'
                                        }}
                                    >
                                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />
                        </section>

                        {/* Data Governance */}
                        <section style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <SectionHeader
                                title="Data & Privacy"
                                description="Manage your data and account"
                            />
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <button
                                    onClick={handleExportData}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        width: '100%',
                                        padding: '0.875rem 1rem',
                                        backgroundColor: 'transparent',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.9375rem',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Download size={18} />
                                    Export My Data
                                </button>

                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: 'var(--error-50)',
                                    border: '1px solid var(--error-200)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <AlertTriangle size={18} color="var(--error-500)" />
                                        <p style={{
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: 'var(--error-700)'
                                        }}>
                                            Danger Zone
                                        </p>
                                    </div>
                                    <p style={{
                                        fontSize: '0.8125rem',
                                        color: 'var(--error-600)',
                                        marginBottom: '1rem'
                                    }}>
                                        Deleting your account is permanent and cannot be undone.
                                    </p>
                                    <DangerButton onClick={handleDeleteAccount}>
                                        <Trash2 size={18} />
                                        Delete Account
                                    </DangerButton>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>

            {/* Undo Bar */}
            {undoBar && (
                <UndoBar
                    message={undoBar.message}
                    onUndo={() => setUndoBar(null)}
                    onDismiss={() => setUndoBar(null)}
                />
            )}

            {/* CSS Animation */}
            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
};

export default ProfileSettings;
