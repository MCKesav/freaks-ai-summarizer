import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserDocumentsRealtime, useFirestore } from '../hooks/useFirestore';
import './StudyNotes.css';

/**
 * Example component demonstrating Firestore usage
 * This component allows users to create, view, update, and delete study notes
 */
const StudyNotes = () => {
  const { currentUser } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    tags: ''
  });

  // Real-time subscription to user's notes
  const { 
    data: notes, 
    loading: notesLoading, 
    error: notesError 
  } = useUserDocumentsRealtime('notes', currentUser?.uid);

  // CRUD operations
  const { 
    add, 
    update, 
    remove, 
    loading: operationLoading, 
    error: operationError 
  } = useFirestore('notes');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const noteData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        userId: currentUser.uid
      };

      if (editingId) {
        // Update existing note
        await update(editingId, noteData);
        setEditingId(null);
      } else {
        // Create new note
        await add(noteData);
      }

      // Reset form
      setFormData({ title: '', content: '', subject: '', tags: '' });
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setFormData({
      title: note.title,
      content: note.content,
      subject: note.subject || '',
      tags: note.tags?.join(', ') || ''
    });
    setIsCreating(true);
  };

  const handleDelete = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await remove(noteId);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ title: '', content: '', subject: '', tags: '' });
  };

  if (!currentUser) {
    return (
      <div className="study-notes-container">
        <p>Please log in to view your notes.</p>
      </div>
    );
  }

  if (notesLoading) {
    return (
      <div className="study-notes-container">
        <div className="loading">Loading your notes...</div>
      </div>
    );
  }

  if (notesError) {
    return (
      <div className="study-notes-container">
        <div className="error">Error loading notes: {notesError}</div>
      </div>
    );
  }

  return (
    <div className="study-notes-container">
      <div className="notes-header">
        <h1>📚 Study Notes</h1>
        {!isCreating && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
          >
            ✏️ New Note
          </button>
        )}
      </div>

      {operationError && (
        <div className="error-message">
          Error: {operationError}
        </div>
      )}

      {isCreating && (
        <div className="note-form-container">
          <h2>{editingId ? 'Edit Note' : 'Create New Note'}</h2>
          <form onSubmit={handleSubmit} className="note-form">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter note title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g., Biology, Math, History"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Write your notes here..."
                rows="10"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., biology, cell, dna"
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={operationLoading}
              >
                {operationLoading ? 'Saving...' : (editingId ? 'Update Note' : 'Create Note')}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={operationLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="empty-state">
            <p>No notes yet. Create your first note to get started! 📝</p>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <h3>{note.title}</h3>
                  {note.subject && (
                    <span className="note-subject">{note.subject}</span>
                  )}
                </div>
                
                <div className="note-content">
                  {note.content.length > 150 
                    ? `${note.content.substring(0, 150)}...` 
                    : note.content
                  }
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="note-meta">
                  <small>
                    {note.createdAt?.toDate ? 
                      `Created: ${note.createdAt.toDate().toLocaleDateString()}` :
                      'Just now'
                    }
                  </small>
                </div>

                <div className="note-actions">
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(note)}
                    disabled={operationLoading}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(note.id)}
                    disabled={operationLoading}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="notes-stats">
        <p>Total Notes: {notes.length}</p>
        <p className="realtime-indicator">
          🟢 Real-time sync active
        </p>
      </div>
    </div>
  );
};

export default StudyNotes;
