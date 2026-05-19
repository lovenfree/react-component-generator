import { useState, useCallback, useMemo } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../constants/storageKeys';

const MAX_STORED_COMPONENTS = 20;

interface StoredComponent extends Omit<GeneratedComponent, 'createdAt'> {
  createdAt: string;
}

function deserializeComponents(raw: StoredComponent[]): GeneratedComponent[] {
  return raw.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }));
}

function serializeComponent(c: GeneratedComponent): StoredComponent {
  return { ...c, createdAt: c.createdAt.toISOString() };
}

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [storedComponents, setStoredComponents] = useLocalStorage<StoredComponent[]>(
    STORAGE_KEYS.COMPONENTS,
    []
  );
  const components = useMemo(() => deserializeComponents(storedComponents), [storedComponents]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (prompt: string, apiKey: string | undefined, provider: Provider) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate component');
        }

        const newComponent: GeneratedComponent = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          prompt,
          code: data.code,
          createdAt: new Date(),
        };

        setStoredComponents((prev) =>
          [serializeComponent(newComponent), ...prev].slice(0, MAX_STORED_COMPONENTS)
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [setStoredComponents]
  );

  const removeComponent = useCallback(
    (id: string) => {
      setStoredComponents((prev) => prev.filter((c) => c.id !== id));
    },
    [setStoredComponents]
  );

  const clearAll = useCallback(() => {
    setStoredComponents([]);
  }, [setStoredComponents]);

  return { components, isLoading, error, generate, removeComponent, clearAll };
}
