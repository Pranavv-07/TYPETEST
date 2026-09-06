import { useState, useEffect } from 'react';
import { getServerTime } from '../services/supabaseService';

export function useServerTime() {
  const [offset, setOffset] = useState<number>(0);

  useEffect(() => {
    async function syncTime() {
      try {
        const serverTime = await getServerTime();
        const diff = serverTime.getTime() - Date.now();
        setOffset(diff);
      } catch (e) {
        console.error('Time sync failed', e);
      }
    }
    syncTime();
  }, []);

  return () => new Date(Date.now() + offset);
}
