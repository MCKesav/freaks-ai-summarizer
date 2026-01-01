import { useState, useEffect } from 'react';
import {
  getDocument,
  getAllDocuments,
  queryDocuments,
  getUserDocuments,
  subscribeToDocument,
  subscribeToCollection,
  subscribeToUserDocuments,
  addDocument,
  updateDocument,
  deleteDocument
} from '../services/firestoreService';

/**
 * Hook to fetch a single document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {object} { data, loading, error, refetch }
 */
export const useDocument = (collectionName, docId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocument = async () => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const doc = await getDocument(collectionName, docId);
      setData(doc);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching document:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [collectionName, docId]);

  return { data, loading, error, refetch: fetchDocument };
};

/**
 * Hook to fetch all documents from a collection
 * @param {string} collectionName - Collection name
 * @returns {object} { data, loading, error, refetch }
 */
export const useCollection = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getAllDocuments(collectionName);
      setData(docs);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching collection:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collectionName) {
      fetchCollection();
    }
  }, [collectionName]);

  return { data, loading, error, refetch: fetchCollection };
};

/**
 * Hook to query documents with filters
 * @param {string} collectionName - Collection name
 * @param {Array} filters - Array of filter objects
 * @param {object} options - Query options
 * @returns {object} { data, loading, error, refetch }
 */
export const useQuery = (collectionName, filters = [], options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await queryDocuments(collectionName, filters, options);
      setData(docs);
    } catch (err) {
      setError(err.message);
      console.error('Error querying documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collectionName) {
      fetchQuery();
    }
  }, [collectionName, JSON.stringify(filters), JSON.stringify(options)]);

  return { data, loading, error, refetch: fetchQuery };
};

/**
 * Hook to get user's documents
 * @param {string} collectionName - Collection name
 * @param {string} userId - User ID
 * @returns {object} { data, loading, error, refetch }
 */
export const useUserDocuments = (collectionName, userId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserDocs = async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const docs = await getUserDocuments(collectionName, userId);
      setData(docs);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDocs();
  }, [collectionName, userId]);

  return { data, loading, error, refetch: fetchUserDocs };
};

/**
 * Hook to subscribe to real-time document updates
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {object} { data, loading, error }
 */
export const useDocumentRealtime = (collectionName, docId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = subscribeToDocument(
      collectionName,
      docId,
      (doc) => {
        setData(doc);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
};

/**
 * Hook to subscribe to real-time collection updates
 * @param {string} collectionName - Collection name
 * @param {Array} filters - Optional filters
 * @returns {object} { data, loading, error }
 */
export const useCollectionRealtime = (collectionName, filters = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectionName) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = subscribeToCollection(
      collectionName,
      (docs) => {
        setData(docs);
        setLoading(false);
        setError(null);
      },
      filters
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(filters)]);

  return { data, loading, error };
};

/**
 * Hook to subscribe to real-time user documents
 * @param {string} collectionName - Collection name
 * @param {string} userId - User ID
 * @returns {object} { data, loading, error }
 */
export const useUserDocumentsRealtime = (collectionName, userId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = subscribeToUserDocuments(
      collectionName,
      userId,
      (docs) => {
        setData(docs);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, [collectionName, userId]);

  return { data, loading, error };
};

/**
 * Hook for CRUD operations
 * @param {string} collectionName - Collection name
 * @returns {object} { add, update, remove, loading, error }
 */
export const useFirestore = (collectionName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const add = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const docId = await addDocument(collectionName, data);
      return docId;
    } catch (err) {
      setError(err.message);
      console.error('Error adding document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (docId, data) => {
    try {
      setLoading(true);
      setError(null);
      await updateDocument(collectionName, docId, data);
    } catch (err) {
      setError(err.message);
      console.error('Error updating document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (docId) => {
    try {
      setLoading(true);
      setError(null);
      await deleteDocument(collectionName, docId);
    } catch (err) {
      setError(err.message);
      console.error('Error deleting document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { add, update, remove, loading, error };
};

export default {
  useDocument,
  useCollection,
  useQuery,
  useUserDocuments,
  useDocumentRealtime,
  useCollectionRealtime,
  useUserDocumentsRealtime,
  useFirestore
};
