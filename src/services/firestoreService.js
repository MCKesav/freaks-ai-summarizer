import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Firestore Service - Utility functions for Firestore operations
 */

// ============================================
// CREATE Operations
// ============================================

/**
 * Add a new document with auto-generated ID
 * @param {string} collectionName - Name of the collection
 * @param {object} data - Document data
 * @returns {Promise<string>} Document ID
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};

/**
 * Create a document with custom ID
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {object} data - Document data
 * @returns {Promise<void>}
 */
export const createDocument = async (collectionName, docId, data) => {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
};

// ============================================
// READ Operations
// ============================================

/**
 * Get a single document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<object|null>} Document data or null if not found
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Array>} Array of documents
 */
export const getAllDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting documents:", error);
    throw error;
  }
};

/**
 * Query documents with filters
 * @param {string} collectionName - Name of the collection
 * @param {Array} filters - Array of filter objects [{field, operator, value}]
 * @param {object} options - Query options {orderByField, orderDirection, limitCount}
 * @returns {Promise<Array>} Array of documents
 */
export const queryDocuments = async (collectionName, filters = [], options = {}) => {
  try {
    let q = collection(db, collectionName);
    
    // Apply filters
    const constraints = [];
    filters.forEach(filter => {
      constraints.push(where(filter.field, filter.operator, filter.value));
    });
    
    // Apply ordering
    if (options.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }
    
    // Apply limit
    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error querying documents:", error);
    throw error;
  }
};

/**
 * Get documents by user ID
 * @param {string} collectionName - Name of the collection
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's documents
 */
export const getUserDocuments = async (collectionName, userId) => {
  try {
    return await queryDocuments(collectionName, [
      { field: 'userId', operator: '==', value: userId }
    ], { orderByField: 'createdAt', orderDirection: 'desc' });
  } catch (error) {
    console.error("Error getting user documents:", error);
    throw error;
  }
};

// ============================================
// UPDATE Operations
// ============================================

/**
 * Update a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {object} data - Data to update
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

/**
 * Set or merge document data
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {object} data - Document data
 * @param {boolean} merge - Whether to merge with existing data
 * @returns {Promise<void>}
 */
export const setDocument = async (collectionName, docId, data, merge = true) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge });
  } catch (error) {
    console.error("Error setting document:", error);
    throw error;
  }
};

// ============================================
// DELETE Operations
// ============================================

/**
 * Delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// ============================================
// REAL-TIME Listeners
// ============================================

/**
 * Subscribe to a single document's changes
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {function} callback - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToDocument = (collectionName, docId, callback) => {
  const docRef = doc(db, collectionName, docId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error in document subscription:", error);
  });
};

/**
 * Subscribe to collection changes
 * @param {string} collectionName - Name of the collection
 * @param {function} callback - Callback function to handle updates
 * @param {Array} filters - Optional filters
 * @returns {function} Unsubscribe function
 */
export const subscribeToCollection = (collectionName, callback, filters = []) => {
  let q = collection(db, collectionName);
  
  if (filters.length > 0) {
    const constraints = filters.map(filter => 
      where(filter.field, filter.operator, filter.value)
    );
    q = query(q, ...constraints);
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(documents);
  }, (error) => {
    console.error("Error in collection subscription:", error);
  });
};

/**
 * Subscribe to user's documents
 * @param {string} collectionName - Name of the collection
 * @param {string} userId - User ID
 * @param {function} callback - Callback function
 * @returns {function} Unsubscribe function
 */
export const subscribeToUserDocuments = (collectionName, userId, callback) => {
  return subscribeToCollection(collectionName, callback, [
    { field: 'userId', operator: '==', value: userId }
  ]);
};

// ============================================
// BATCH Operations
// ============================================

/**
 * Batch create multiple documents
 * @param {string} collectionName - Name of the collection
 * @param {Array} documents - Array of document data
 * @returns {Promise<Array>} Array of document IDs
 */
export const batchAddDocuments = async (collectionName, documents) => {
  try {
    const promises = documents.map(data => addDocument(collectionName, data));
    return await Promise.all(promises);
  } catch (error) {
    console.error("Error batch adding documents:", error);
    throw error;
  }
};

// ============================================
// UTILITY Functions
// ============================================

/**
 * Get server timestamp
 * @returns {object} Firestore server timestamp
 */
export const getServerTimestamp = () => serverTimestamp();

/**
 * Create a Firestore Timestamp from Date
 * @param {Date} date - JavaScript Date object
 * @returns {object} Firestore Timestamp
 */
export const createTimestamp = (date) => Timestamp.fromDate(date);

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param {object} timestamp - Firestore Timestamp
 * @returns {Date} JavaScript Date object
 */
export const timestampToDate = (timestamp) => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return null;
};

/**
 * Check if document exists
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} True if document exists
 */
export const documentExists = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking document existence:", error);
    throw error;
  }
};

export default {
  addDocument,
  createDocument,
  getDocument,
  getAllDocuments,
  queryDocuments,
  getUserDocuments,
  updateDocument,
  setDocument,
  deleteDocument,
  subscribeToDocument,
  subscribeToCollection,
  subscribeToUserDocuments,
  batchAddDocuments,
  getServerTimestamp,
  createTimestamp,
  timestampToDate,
  documentExists
};
