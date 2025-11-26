import { SessionManager } from './sessionManager';

// Utility function to reset the learning plan session
export const resetLearningSession = () => {
  try {
    localStorage.removeItem('mathTutorSessionId');
    sessionStorage.removeItem('mathTutorSessionId');
    // Clear URL hash
    window.location.hash = '';
    console.log('Learning session reset');
  } catch (error) {
    console.warn('Could not reset session:', error);
  }
};

// Utility function to get or create session ID
export const getOrCreateSessionId = () => {
  return SessionManager.getOrCreateSession();
};
