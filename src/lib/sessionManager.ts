// Generate UUID compatible with older browsers
const generateUUID = (): string => {
  // Try crypto.randomUUID first (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (error) {
      console.warn('crypto.randomUUID failed:', error);
    }
  }

  // Fallback: Generate UUID manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to handle session persistence across different access methods
export const SessionManager = {
  // Store session in multiple places for redundancy
  setSession: (sessionId: string) => {
    try {
      localStorage.setItem('mathTutorSessionId', sessionId);
      // Also store in sessionStorage as backup
      sessionStorage.setItem('mathTutorSessionId', sessionId);
      // Store in URL hash as another backup
      const url = new URL(window.location.href);
      url.hash = `session=${sessionId}`;
      console.log('Session stored:', sessionId.substring(0, 8) + '...');
    } catch (error) {
      console.warn('Could not store session:', error);
    }
  },

  // Retrieve session from any available source
  getSession: (): string | null => {
    try {
      // Try localStorage first
      let sessionId = localStorage.getItem('mathTutorSessionId');
      if (sessionId) {
        console.log('Session found in localStorage:', sessionId.substring(0, 8) + '...');
        return sessionId;
      }

      // Try sessionStorage
      sessionId = sessionStorage.getItem('mathTutorSessionId');
      if (sessionId) {
        console.log('Session found in sessionStorage:', sessionId.substring(0, 8) + '...');
        // Store back in localStorage for future use
        localStorage.setItem('mathTutorSessionId', sessionId);
        return sessionId;
      }

      // Try URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      sessionId = urlParams.get('session');
      if (sessionId) {
        console.log('Session found in URL params:', sessionId.substring(0, 8) + '...');
        // Store in localStorage for future use
        localStorage.setItem('mathTutorSessionId', sessionId);
        return sessionId;
      }

      // Try URL hash
      const hash = window.location.hash;
      if (hash.includes('session=')) {
        sessionId = hash.split('session=')[1].split('&')[0];
        if (sessionId) {
          console.log('Session found in URL hash:', sessionId.substring(0, 8) + '...');
          // Store in localStorage for future use
          localStorage.setItem('mathTutorSessionId', sessionId);
          return sessionId;
        }
      }

      console.log('No session found in any storage');
      return null;
    } catch (error) {
      console.warn('Error retrieving session:', error);
      return null;
    }
  },

  // Create new session
  createSession: (): string => {
    const sessionId = generateUUID();
    SessionManager.setSession(sessionId);
    return sessionId;
  },

  // Get existing or create new session
  getOrCreateSession: (): string => {
    let sessionId = SessionManager.getSession();
    if (!sessionId) {
      sessionId = SessionManager.createSession();
    }
    return sessionId;
  }
};
