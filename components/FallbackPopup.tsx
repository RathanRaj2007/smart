"use client";

import React from "react";

interface FallbackPopupProps {
  isOpen: boolean;
  failedProvider: string;
  fallbackProvider: string;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function FallbackPopup({ isOpen, failedProvider, fallbackProvider, onAccept, onReject, isLoading }: FallbackPopupProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'var(--color-card-bg)',
        border: '1px solid var(--color-card-border)',
        borderRadius: 'var(--border-radius-md)',
        padding: '2rem',
        maxWidth: '450px',
        width: '90%',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--color-amber)', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </span>
          <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>AI Provider Unavailable</h3>
        </div>
        
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
          <strong style={{textTransform: 'capitalize'}}>{failedProvider}</strong> is currently unavailable.
        </p>
        
        <p style={{ color: 'var(--color-text-primary)', marginBottom: '2rem', fontWeight: 500 }}>
          Would you like to continue using <span style={{textTransform: 'capitalize', color: 'var(--color-indigo)'}}>{fallbackProvider}</span>?
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={onReject}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'transparent',
              border: '1px solid var(--color-card-border)',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--border-radius-sm)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              opacity: isLoading ? 0.7 : 1
            }}
          >
            No, Retry {failedProvider.charAt(0).toUpperCase() + failedProvider.slice(1)}
          </button>
          
          <button 
            onClick={onAccept}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'var(--color-indigo)',
              border: 'none',
              color: 'white',
              borderRadius: 'var(--border-radius-sm)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              boxShadow: 'var(--shadow-glow)',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Processing...' : `Yes, Use ${fallbackProvider.charAt(0).toUpperCase() + fallbackProvider.slice(1)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
