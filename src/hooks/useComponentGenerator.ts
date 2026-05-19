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

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:jsx|tsx|javascript|typescript)?\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();
}

function ensureRenderCall(code: string): string {
  if (/\brender\s*\(/.test(code)) return code;
  const match = code.match(/(?:const|function)\s+([A-Z]\w+)/);
  if (match) return `${code}\n\nrender(<${match[1]} />);`;
  return code;
}

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  streamingCode: string | null;
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
  const [streamingCode, setStreamingCode] = useState<string | null>(null);

  const generate = useCallback(
    async (prompt: string, apiKey: string | undefined, provider: Provider) => {
      setIsLoading(true);
      setError(null);
      setStreamingCode('');

      const componentId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      let fullCode = '';

      try {
        const res = await fetch('/api/generate-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error || 'Failed to generate component');
        }

        if (!res.body) throw new Error('Response body is not available');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let isDone = false;

        try {
          while (!isDone) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                isDone = true;
                break;
              }

              try {
                const parsed = JSON.parse(data) as { chunk?: string; error?: string };
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.chunk) {
                  fullCode += parsed.chunk;
                  setStreamingCode(fullCode);
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        } finally {
          reader.cancel();
        }

        const finalCode = ensureRenderCall(stripCodeFences(fullCode));

        const newComponent: GeneratedComponent = {
          id: componentId,
          prompt,
          code: finalCode,
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
        setStreamingCode(null);
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

  return { components, isLoading, error, streamingCode, generate, removeComponent, clearAll };
}
