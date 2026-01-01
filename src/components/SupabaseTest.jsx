import React, { useState } from 'react';
import { getSupabaseClient } from '../supabase';

const SupabaseTest = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testGetJWT = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase.rpc("get_jwt");

      if (error) {
        setError(error.message);
        console.error('Supabase RPC error:', error);
      } else {
        setResult(data);
        console.log('JWT data:', data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error calling get_jwt:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Supabase JWT Test</h2>
      
      <button 
        onClick={testGetJWT}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem'
        }}
      >
        {loading ? 'Loading...' : 'Test get_jwt RPC'}
      </button>

      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '4px',
          color: '#dc2626'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '4px',
          color: '#0369a1'
        }}>
          <strong>Result:</strong>
          <pre style={{
            marginTop: '0.5rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SupabaseTest;