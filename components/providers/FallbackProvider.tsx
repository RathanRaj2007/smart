"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { FallbackPopup } from "../FallbackPopup";

interface FallbackContextType {
  fetchWithFallback: (url: string, options?: RequestInit) => Promise<Response>;
}

const FallbackContext = createContext<FallbackContextType | null>(null);

export function FallbackProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [failedProvider, setFailedProvider] = useState("");
  const [fallbackProvider, setFallbackProvider] = useState("");
  
  const [resolveFallback, setResolveFallback] = useState<((accepted: boolean) => void) | null>(null);

  const fetchWithFallback = async (url: string, options?: RequestInit): Promise<Response> => {
    // 1. Initial attempt
    const fetchOptions = { credentials: 'include' as RequestCredentials, ...options };
    const res = await fetch(url, fetchOptions);
    
    // 2. Check if we got a 503 fallback required
    if (res.status === 503) {
      const clone = res.clone();
      try {
        const body = await clone.json();
        if (body && body.fallbackAvailable) {
          // Show popup and wait for user decision
          setFailedProvider(body.failedProvider);
          setFallbackProvider(body.fallbackProvider);
          setIsOpen(true);
          
          const accepted = await new Promise<boolean>((resolve) => {
            setResolveFallback(() => resolve);
          });
          
          setIsOpen(false);
          setResolveFallback(null);
          
          if (accepted) {
            // Re-run the request with forceProvider
            const originalBody = options?.body ? JSON.parse(options.body as string) : {};
            const newBody = JSON.stringify({ ...originalBody, forceProvider: body.fallbackProvider });
            
            return fetch(url, { ...fetchOptions, body: newBody });
          } else {
            // User rejected fallback, just return original error response to let caller handle failure
            return res;
          }
        }
      } catch (_e) {
        // Not a JSON fallback body, just return original res
      }
    }
    
    return res;
  };

  return (
    <FallbackContext.Provider value={{ fetchWithFallback }}>
      {children}
      <FallbackPopup 
        isOpen={isOpen}
        failedProvider={failedProvider}
        fallbackProvider={fallbackProvider}
        onAccept={() => resolveFallback?.(true)}
        onReject={() => resolveFallback?.(false)}
        isLoading={false}
      />
    </FallbackContext.Provider>
  );
}

export function useFallbackFetch() {
  const ctx = useContext(FallbackContext);
  if (!ctx) throw new Error("useFallbackFetch must be used within FallbackProvider");
  return ctx.fetchWithFallback;
}
