export interface SSECallbacks {
  onEvent: (event: string, data: any) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export function createSSEStream(
  url: string,
  body: any,
  callbacks: SSECallbacks,
  signal?: AbortSignal,
): void {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              callbacks.onEvent(currentEvent, data);
            } catch {
              // ignore parse errors
            }
          } else if (line === '') {
            currentEvent = 'message';
          }
        }
      }

      callbacks.onClose?.();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError?.(err);
      }
      callbacks.onClose?.();
    });
}
