import { useEffect, useCallback } from 'react';

type HotkeyHandler = (e: KeyboardEvent) => void;

export function useHotkey(key: string, handler: HotkeyHandler, deps: unknown[] = [], enabled = true) {
  const stableHandler = useCallback(handler, deps);

  useEffect(() => {
    if (!enabled) return;
    const listener = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === key) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        stableHandler(e);
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [key, stableHandler, enabled]);
}
