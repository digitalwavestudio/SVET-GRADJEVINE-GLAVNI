import { useState, useEffect } from 'react';

const COOLDOWN_SECONDS = 60;
const LAST_POST_KEY = 'svet_gradjevine_last_post_time';

export function useAdDraft(editId?: string | null) {
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!editId) {
      const draft = localStorage.getItem('postAdDraft');
      if (draft) {
        try {
          setShowDraftPrompt(true);
        } catch {
          localStorage.removeItem('postAdDraft');
        }
      }
    }
  }, [editId]);

  useEffect(() => {
    const lastPost = localStorage.getItem(LAST_POST_KEY);
    if (lastPost) {
      const elapsed = Math.floor((Date.now() - parseInt(lastPost)) / 1000);
      if (elapsed < COOLDOWN_SECONDS) {
        setCooldown(COOLDOWN_SECONDS - elapsed);
        const timer = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      }
    }
    return undefined;
  }, []);

  const saveDraft = (data: any) => {
    try {
      localStorage.setItem('postAdDraft', JSON.stringify(data));
    } catch {
      localStorage.removeItem('postAdDraft');
    }
  };

  const restoreDraft = () => {
    try {
      const draft = localStorage.getItem('postAdDraft');
      return draft ? JSON.parse(draft) : null;
    } catch {
      localStorage.removeItem('postAdDraft');
      return null;
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('postAdDraft');
  };

  return { showDraftPrompt, setShowDraftPrompt, cooldown, setCooldown, saveDraft, restoreDraft, clearDraft };
}
