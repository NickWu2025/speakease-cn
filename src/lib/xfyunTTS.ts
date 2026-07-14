interface XfyunTTSConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

export class XfyunTTS {
  private config: XfyunTTSConfig;
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private isStopped = false;

  constructor(config: XfyunTTSConfig) {
    this.config = config;
  }

  private static async hmacSha256(key: string, message: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw', encoder.encode(key),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  private async generateAuthUrl(): Promise<string> {
    const host = 'tts-api.xfyun.cn';
    const date = new Date().toUTCString();
    const requestLine = 'GET /v2/tts HTTP/1.1';
    const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`;
    const signature = await XfyunTTS.hmacSha256(this.config.apiSecret, signatureOrigin);
    const signatureBase64 = XfyunTTS.arrayBufferToBase64(signature);
    const authorizationOrigin = `api_key="${this.config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
    const authorization = btoa(authorizationOrigin);
    return `wss://tts-api.xfyun.cn/v2/tts?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
  }

  async speak(text: string): Promise<void> {
    this.isStopped = false;
    const url = await this.generateAuthUrl();

    return new Promise<void>((resolve, reject) => {
      const pcmChunks: Int16Array[] = [];

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        this.ws!.send(JSON.stringify({
          common: { app_id: this.config.appId },
          business: {
            aue: "raw",
            auf: "audio/L16;rate=16000",
            vcn: "x4_lingxiaoxuan_oral",
            speed: 50,
            volume: 50,
            pitch: 50,
            tte: "UTF8",
          },
          data: {
            status: 2,
            text: encoded,
          },
        }));
      };

      this.ws.onmessage = (event) => {
        if (this.isStopped) return;
        try {
          const data = JSON.parse(event.data);
          if (data.code !== 0) {
            console.error("[讯飞TTS] 错误:", data);
            reject(new Error(data.message));
            return;
          }
          if (data.data && data.data.audio) {
            const raw = atob(data.data.audio);
            const buf = new Int16Array(raw.length / 2);
            for (let i = 0; i < buf.length; i++) {
              const lo = raw.charCodeAt(i * 2);
              const hi = raw.charCodeAt(i * 2 + 1);
              buf[i] = (hi << 8) | lo;
            }
            pcmChunks.push(buf);
          }
          if (data.data && data.data.status === 2) {
            this.playPCM(pcmChunks).then(resolve).catch(resolve);
          }
        } catch {
          // ignore parse errors for empty frames
        }
      };

      this.ws.onerror = () => {
        reject(new Error("WebSocket 连接错误"));
      };

      this.ws.onclose = () => {
        resolve();
      };
    });
  }

  private async playPCM(chunks: Int16Array[]): Promise<void> {
    if (chunks.length === 0 || this.isStopped) return;
    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const merged = new Int16Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const buffer = this.audioContext.createBuffer(1, merged.length, 16000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < merged.length; i++) {
      channel[i] = merged[i] / 32768;
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.connect(this.audioContext.destination);

    return new Promise<void>((resolve) => {
      this.sourceNode!.onended = () => {
        this.cleanup();
        resolve();
      };
      this.sourceNode!.start();
    });
  }

  stop(): void {
    this.isStopped = true;
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch {}
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch {}
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export function newXfyunTTS(): XfyunTTS | null {
  const appId = import.meta.env.VITE_XFYUN_APP_ID;
  const apiKey = import.meta.env.VITE_XFYUN_API_KEY;
  const apiSecret = import.meta.env.VITE_XFYUN_API_SECRET;
  if (!appId || !apiKey || !apiSecret) return null;
  return new XfyunTTS({ appId, apiKey, apiSecret });
}
