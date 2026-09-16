'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import Cookies from 'js-cookie'
import { AppState, Candidate } from '@/types'
import { candidatesData, recentSessionsData } from '@/data/mockData'

interface InterviewStateContextType {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  activeCandidate: Candidate
}

const InterviewStateContext = createContext<InterviewStateContextType | undefined>(undefined)

export const InterviewStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    activeScreen: 'dashboard',
    currentInterviewer: 'System Admin',
    selectedLLM: 'gemini', // Default, will be updated by useEffect
    difficulty: 'intermediate',
    isVoiceActive: false,
    isRecording: false,
    timerSeconds: 0,
    candidates: candidatesData,
    activeCandidateKey: 'candidate1',
    allGeneratedFollowUps: [],
    recentSessions: recentSessionsData
  })

  // Keep cookie in sync with state changes
  useEffect(() => {
    if (state.selectedLLM) {
      Cookies.set('selectedLLM', state.selectedLLM, { expires: 365, path: '/' });
    }
  }, [state.selectedLLM]);

  // Synchronize initial state with cookies
  useEffect(() => {
    const savedLLM = Cookies.get('selectedLLM');
    if (savedLLM === 'groq' || savedLLM === 'gemini') {
      setState(prev => ({ ...prev, selectedLLM: savedLLM }));
    } else {
      // Initialize cookie if missing
      Cookies.set('selectedLLM', 'gemini', { expires: 365, path: '/' });
    }
  }, []);

  const activeCandidate = state.candidates[state.activeCandidateKey]

  return (
    <InterviewStateContext.Provider value={{ state, setState, activeCandidate }}>
      {children}
    </InterviewStateContext.Provider>
  )
}

export const useInterviewState = () => {
  const context = useContext(InterviewStateContext)
  if (context === undefined) {
    throw new Error('useInterviewState must be used within an InterviewStateProvider')
  }
  return context
}
