# Firestore Usage Guide

This guide demonstrates how to use Firestore in your application with the provided utilities and hooks.

## 📁 File Structure

```
src/
├── firebase.js                    # Firebase initialization with Firestore
├── services/
│   └── firestoreService.js       # Firestore utility functions
└── hooks/
    └── useFirestore.js           # React hooks for Firestore
```

## 🚀 Quick Start

### 1. Basic Firestore Service Usage

```javascript
import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments
} from './services/firestoreService';

// Create a document
const docId = await addDocument('notes', {
  title: 'My Note',
  content: 'Note content',
  userId: user.uid
});

// Read a document
const note = await getDocument('notes', docId);

// Update a document
await updateDocument('notes', docId, {
  title: 'Updated Title'
});

// Delete a document
await deleteDocument('notes', docId);

// Query documents
const userNotes = await queryDocuments('notes', 
  [{ field: 'userId', operator: '==', value: user.uid }],
  { orderByField: 'createdAt', orderDirection: 'desc' }
);
```

### 2. Using React Hooks

#### Fetch Single Document

```javascript
import { useDocument } from './hooks/useFirestore';

function NoteDetail({ noteId }) {
  const { data: note, loading, error, refetch } = useDocument('notes', noteId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!note) return <div>Note not found</div>;

  return (
    <div>
      <h2>{note.title}</h2>
      <p>{note.content}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

#### Fetch Collection

```javascript
import { useCollection } from './hooks/useFirestore';

function NotesList() {
  const { data: notes, loading, error } = useCollection('notes');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {notes.map(note => (
        <li key={note.id}>{note.title}</li>
      ))}
    </ul>
  );
}
```

#### Query with Filters

```javascript
import { useQuery } from './hooks/useFirestore';

function MyNotes({ userId }) {
  const { data: notes, loading, error } = useQuery(
    'notes',
    [{ field: 'userId', operator: '==', value: userId }],
    { orderByField: 'createdAt', orderDirection: 'desc', limitCount: 10 }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {notes.map(note => (
        <div key={note.id}>
          <h3>{note.title}</h3>
          <p>{note.content}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Real-time Updates

```javascript
import { useCollectionRealtime } from './hooks/useFirestore';

function LiveNotes({ userId }) {
  const { data: notes, loading, error } = useCollectionRealtime(
    'notes',
    [{ field: 'userId', operator: '==', value: userId }]
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Live Notes (Real-time)</h2>
      {notes.map(note => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  );
}
```

#### CRUD Operations Hook

```javascript
import { useFirestore } from './hooks/useFirestore';
import { useState } from 'react';

function NotesManager() {
  const { add, update, remove, loading, error } = useFirestore('notes');
  const [title, setTitle] = useState('');

  const handleAdd = async () => {
    try {
      const docId = await add({
        title,
        content: '',
        userId: 'user123'
      });
      console.log('Created document:', docId);
    } catch (err) {
      console.error('Failed to add:', err);
    }
  };

  const handleUpdate = async (noteId) => {
    try {
      await update(noteId, { title: 'Updated Title' });
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await remove(noteId);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div>
      <input 
        value={title} 
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
      />
      <button onClick={handleAdd} disabled={loading}>
        Add Note
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## 📊 Collection Structure Examples

### User Profile

```javascript
// Collection: 'users'
{
  id: 'user123',
  email: 'user@example.com',
  displayName: 'John Doe',
  photoURL: 'https://...',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Study Notes

```javascript
// Collection: 'notes'
{
  id: 'note123',
  userId: 'user123',
  title: 'Biology Chapter 1',
  content: 'DNA is...',
  subject: 'Biology',
  tags: ['dna', 'genetics'],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Flashcards

```javascript
// Collection: 'flashcards'
{
  id: 'card123',
  userId: 'user123',
  deckId: 'deck123',
  front: 'What is photosynthesis?',
  back: 'Process by which plants...',
  difficulty: 'medium',
  lastReviewed: Timestamp,
  nextReview: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Quizzes

```javascript
// Collection: 'quizzes'
{
  id: 'quiz123',
  userId: 'user123',
  title: 'Biology Quiz 1',
  questions: [
    {
      question: 'What is DNA?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0
    }
  ],
  score: 85,
  completedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Study Sessions

```javascript
// Collection: 'studySessions'
{
  id: 'session123',
  userId: 'user123',
  subject: 'Biology',
  duration: 3600, // seconds
  notesCreated: 5,
  flashcardsReviewed: 20,
  startTime: Timestamp,
  endTime: Timestamp,
  createdAt: Timestamp
}
```

## 🔐 Security Rules

Update your `firestore.rules` file:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own user document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read/write their own notes
    match /notes/{noteId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Similar rules for flashcards
    match /flashcards/{cardId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Similar rules for quizzes
    match /quizzes/{quizId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Study sessions
    match /studySessions/{sessionId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🎯 Advanced Usage

### Pagination

```javascript
import { query, collection, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from './firebase';

let lastVisible = null;

async function loadMore(collectionName, limitCount = 10) {
  let q = query(
    collection(db, collectionName),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  if (lastVisible) {
    q = query(q, startAfter(lastVisible));
  }

  const snapshot = await getDocs(q);
  lastVisible = snapshot.docs[snapshot.docs.length - 1];
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Subcollections

```javascript
// Add a comment to a note
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

async function addComment(noteId, commentText, userId) {
  const commentsRef = collection(db, 'notes', noteId, 'comments');
  await addDoc(commentsRef, {
    text: commentText,
    userId,
    createdAt: serverTimestamp()
  });
}
```

### Batch Operations

```javascript
import { writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';

async function batchUpdate(updates) {
  const batch = writeBatch(db);
  
  updates.forEach(({ collection, docId, data }) => {
    const ref = doc(db, collection, docId);
    batch.update(ref, data);
  });
  
  await batch.commit();
}
```

## 🛠️ Best Practices

1. **Always handle errors**: Wrap Firestore operations in try-catch blocks
2. **Use server timestamps**: For consistent timestamp across clients
3. **Optimize queries**: Use indexes for complex queries
4. **Unsubscribe listeners**: Clean up real-time listeners when components unmount
5. **Validate data**: Check data before writing to Firestore
6. **Use security rules**: Never trust client-side validation alone
7. **Limit real-time listeners**: Use them sparingly for frequently changing data
8. **Cache strategically**: Firestore has built-in offline persistence

## 📱 Testing Firestore

```javascript
// Test creating a document
import { addDocument } from './services/firestoreService';

async function testFirestore() {
  try {
    const docId = await addDocument('test', {
      message: 'Hello Firestore!',
      timestamp: new Date().toISOString()
    });
    console.log('Document created with ID:', docId);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 🔗 Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
