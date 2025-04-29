// lib/hooks/use-media-query.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Default to false for SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Set the initial value
      setMatches(media.matches);

      // Create an event listener
      const listener = () => setMatches(media.matches);
      
      // Add the listener to media query
      media.addEventListener('change', listener);
      
      // Cleanup function
      return () => {
        media.removeEventListener('change', listener);
      };
    }
  }, [query]); // Re-run effect if query changes

  return matches;
}