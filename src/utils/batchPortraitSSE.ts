// Utility for batch portrait generation using SSE

import { PortraitSelection } from '@/types/portrait';

export interface PortraitConfig {
  name: string;
  config: PortraitSelection;
  thumbnail: string;
  fullSizeImage: string;
}

export interface BatchPortraitResult {
  name: string;
  config: PortraitConfig;
  thumbnail: string;
  fullSizeImage: string;
}

export async function generateBatchPortraitsSSE(
  configs: PortraitSelection[],
  onPortrait: (result: { name: string; config: PortraitSelection; thumbnail: string; fullSizeImage: string }) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const controller = new AbortController();
    const signal = controller.signal;
    const url = '/api/portraits/batch-composite';
    const eventSource = new EventSourcePolyfill(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configs),
      signal,
    });
    eventSource.onmessage = (event: { data: string }) => {
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          onPortrait(data);
        } catch (error) {
          console.error('Error parsing portrait data:', error);
        }
      }
    };
    eventSource.onerror = (err: Error) => {
      console.error('EventSource error:', err);
      eventSource.close();
      reject(err);
    };
    eventSource.onclose = () => {
      eventSource.close();
      resolve();
    };
    signal.addEventListener('abort', () => {
      eventSource.close();
      resolve();
    });
  });
}

// Polyfill for EventSource with POST support
interface EventSourcePolyfillOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

class EventSourcePolyfill {
  url: string;
  options: EventSourcePolyfillOptions;
  controller: AbortController;
  onmessage?: (event: { data: string }) => void;
  onerror?: (err: Error) => void;
  onclose?: () => void;
  constructor(url: string, options: EventSourcePolyfillOptions) {
    this.url = url;
    this.options = options;
    this.controller = new AbortController();
    this.init();
  }
  init() {
    fetch(this.url, {
      method: this.options.method || 'GET',
      headers: this.options.headers,
      body: this.options.body,
      signal: this.controller.signal,
    }).then(async (res) => {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (this.onmessage) {
              this.onmessage({ data });
            }
          }
        }
      }

      if (this.onclose) {
        this.onclose();
      }
    }).catch((err) => {
      if (this.onerror) {
        this.onerror(err);
      }
    });
  }
  close() {
    this.controller.abort();
  }
} 