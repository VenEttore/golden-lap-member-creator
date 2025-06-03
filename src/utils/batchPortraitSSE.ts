// Utility for batch portrait generation using SSE

export interface BatchPortraitResult {
  name: string;
  config: any;
  thumbnail: string;
  fullSizeImage: string;
}

export async function generateBatchPortraitsSSE(
  configs: any[],
  onPortrait: (result: BatchPortraitResult) => void
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
    (eventSource as any).onmessage = (event: { data: string }) => {
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          onPortrait(data);
        } catch {}
      }
    };
    (eventSource as any).onerror = (_err: any) => {
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
  onerror?: (err?: any) => void;
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
      signal: this.options.signal || this.controller.signal,
    }).then(async (res) => {
      const reader = res.body!.getReader();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (chunk.startsWith('data: ')) {
            this.onmessage && this.onmessage({ data: chunk.slice(6) });
          }
        }
      }
      this.onerror && this.onerror();
    }).catch((err) => {
      this.onerror && this.onerror(err);
    });
  }
  close() {
    this.controller.abort();
  }
} 