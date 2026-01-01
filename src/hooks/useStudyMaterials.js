/**
 * =============================================================================
 * USE STUDY MATERIALS HOOK
 * =============================================================================
 * React hook for managing study materials (upload, status, summaries)
 * 
 * ARCHITECTURE:
 * - Files → Firebase Storage (via backend)
 * - Metadata → Supabase (via backend)
 * - Status → Firestore (real-time listener)
 * - Summaries → Supabase (via backend)
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getFirebaseIdToken } from '../firebase';

// Backend API URL - use environment variable in production
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Hook for study material operations
 */
export function useStudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get authorization header with Firebase token
   */
  const getAuthHeader = async () => {
    const token = await getFirebaseIdToken();
    return {
      'Authorization': `Bearer ${token}`,
    };
  };

  /**
   * Fetch all materials for the current user
   */
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/materials`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch materials');
      }
      
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload a file
   * @param {File} file - File to upload
   * @returns {Promise<{file_id: string, status: string}>}
   */
  const uploadFile = async (file) => {
    const headers = await getAuthHeader();
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        ...headers,
        // Don't set Content-Type - browser sets it with boundary for FormData
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }
    
    return response.json();
  };

  /**
   * Upload a URL
   * @param {string} url - URL to process
   * @param {string} title - Optional title
   * @returns {Promise<{file_id: string, status: string}>}
   */
  const uploadUrl = async (url, title = null) => {
    const headers = await getAuthHeader();
    
    const response = await fetch(`${API_URL}/api/upload/url`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, title }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'URL upload failed');
    }
    
    return response.json();
  };

  /**
   * Get summary for a file
   * @param {string} fileId 
   * @returns {Promise<{summary_text: string, summary_version: number}>}
   */
  const getSummary = async (fileId) => {
    const headers = await getAuthHeader();
    
    const response = await fetch(`${API_URL}/api/summary/${fileId}`, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Summary not ready yet
      }
      throw new Error('Failed to fetch summary');
    }
    
    return response.json();
  };

  return {
    materials,
    loading,
    error,
    fetchMaterials,
    uploadFile,
    uploadUrl,
    getSummary,
  };
}

/**
 * Hook for tracking processing status in real-time
 * Uses Firestore listener for instant updates
 * 
 * @param {string} fileId - File ID to track
 * @returns {{ status: string, progress: number, message: string, loading: boolean }}
 */
export function useProcessingStatus(fileId) {
  const [status, setStatus] = useState({
    status: 'unknown',
    progress: 0,
    message: null,
    loading: true,
  });

  useEffect(() => {
    if (!fileId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    // Set up Firestore real-time listener
    // WHY FIRESTORE: Real-time updates without polling
    const statusRef = doc(db, 'processing_status', fileId);
    
    const unsubscribe = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStatus({
          status: data.status || 'unknown',
          progress: data.progress || 0,
          message: data.message || null,
          loading: false,
        });
      } else {
        setStatus({
          status: 'not_found',
          progress: 0,
          message: 'Status not found',
          loading: false,
        });
      }
    }, (error) => {
      console.error('Status listener error:', error);
      setStatus({
        status: 'error',
        progress: 0,
        message: error.message,
        loading: false,
      });
    });

    return () => unsubscribe();
  }, [fileId]);

  return status;
}

/**
 * Example usage:
 * 
 * function StudyMaterialUploader() {
 *   const { uploadFile, uploadUrl, materials, fetchMaterials } = useStudyMaterials();
 *   const [currentFileId, setCurrentFileId] = useState(null);
 *   const status = useProcessingStatus(currentFileId);
 * 
 *   const handleFileUpload = async (event) => {
 *     const file = event.target.files[0];
 *     if (!file) return;
 *     
 *     const result = await uploadFile(file);
 *     setCurrentFileId(result.file_id);
 *   };
 * 
 *   return (
 *     <div>
 *       <input type="file" onChange={handleFileUpload} />
 *       {currentFileId && (
 *         <div>
 *           Status: {status.status} ({status.progress}%)
 *           {status.message && <p>{status.message}</p>}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 */
