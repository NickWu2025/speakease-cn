interface XfyunConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

interface XfyunCallbacks {
  onResult: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: (finalText: string) => void;
}

export class XfyunRecognizer {
  private config: XfyunConfig;
  private callbacks: XfyunCallbacks;
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;
  private isConnected = false;

  // 用于动态修正（dwa=wpgs）
  private resultSnList: number[] = [];
  private currentText = '';

  constructor(config: XfyunConfig, callbacks: XfyunCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  async start(): Promise<void> {
    try {
      this.currentText = '';
      this.resultSnList = [];
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      const sampleRate = this.audioContext.sampleRate;
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.scriptNode = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.scriptNode.onaudioprocess = (e) => {
        if (!this.isRecording || !this.ws || !this.isConnected) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const resampled = this.resample(inputData, sampleRate, 16000);
        const pcm = this.floatTo16BitPCM(resampled);
        const base64 = this.arrayBufferToBase64(pcm);
        this.sendAudioFrame(base64);
      };

      this.sourceNode.connect(this.scriptNode);
      this.scriptNode.connect(this.audioContext.destination);

      const url = await this.generateAuthUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.sendFirstFrame();
        this.isRecording = true;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onerror = () => {
        this.callbacks.onError('WebSocket 连接错误');
        this.cleanup();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
      };
    } catch (err) {
      this.callbacks.onError(String(err));
      this.cleanup();
    }
  }

  stop(): void {
    this.isRecording = false;
    if (this.ws && this.isConnected) {
      this.sendEndFrame();
    }
    setTimeout(() => {
      this.callbacks.onEnd(this.currentText);
      this.cleanup();
    }, 500);
  }

  private cleanup(): void {
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isRecording = false;
  }

  private async generateAuthUrl(): Promise<string> {
    const host = 'iat-api.xfyun.cn';
    const date = new Date().toUTCString();
    const requestLine = 'GET /v2/iat HTTP/1.1';
    const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`;

    const signature = await this.hmacSha256(this.config.apiSecret, signatureOrigin);
    const signatureBase64 = this.arrayBufferToBase64(signature);

    const authorizationOrigin = `api_key="${this.config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
    const authorization = btoa(authorizationOrigin);

    return `wss://iat-api.xfyun.cn/v2/iat?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
  }

  private async hmacSha256(key: string, message: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private sendFirstFrame(): void {
    if (!this.ws) return;
    console.log('[讯飞ASR] 发送首帧, app_id:', this.config.appId);
    this.ws.send(JSON.stringify({
      common: { app_id: this.config.appId },
      business: {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        ptt: 1,
      },
      data: {
        status: 0,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: '',
      },
    }));
  }

  private sendAudioFrame(audioBase64: string): void {
    if (!this.ws || !this.isConnected || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      data: {
        status: 1,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: audioBase64,
      },
    }));
  }

  private sendEndFrame(): void {
    if (!this.ws || !this.isConnected || this.ws.readyState !== WebSocket.OPEN) {
      this.callbacks.onEnd(this.currentText);
      this.cleanup();
      return;
    }
    this.ws.send(JSON.stringify({
      data: {
        status: 2,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: '',
      },
    }));
  }

  private handleMessage(data: any): void {
    if (data.code !== 0) {
      console.error('[讯飞ASR] 服务端错误:', data);
      this.callbacks.onError(data.message || `识别错误: ${data.code}`);
      return;
    }
    if (data.data && data.data.result) {
      const result = data.data.result;
      const sn = result.sn;
      const pgs = result.pgs;
      const rg = result.rg;
      const isEnd = data.data.status === 2;

      // 解析当前帧的文本
      const text = this.parseResult(result);
      if (!text) return;

      if (pgs === 'rpl' && rg && rg.length === 2) {
        // 动态修正替换：rg = [from_sn, to_sn]
        // 替换 resultSnList 中 from_sn 到 to_sn 之间的结果
        this.resultSnList = this.resultSnList.slice(0, rg[0]);
        this.currentText = this.resultSnList.join('');
      }

      // 追加当前结果
      this.resultSnList.push(text);
      this.currentText += text;

      this.callbacks.onResult(this.currentText, isEnd);
    }
  }

  private parseResult(result: any): string {
    if (!result.ws) return '';
    let text = '';
    for (const ws of result.ws) {
      for (const cw of ws.cw) {
        text += cw.w;
      }
    }
    return text;
  }

  private resample(input: Float32Array, inputRate: number, outputRate: number): Float32Array {
    const ratio = inputRate / outputRate;
    const outputLength = Math.floor(input.length / ratio);
    const output = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
      const pos = i * ratio;
      const index = Math.floor(pos);
      const frac = pos - index;
      const a = input[index] ?? 0;
      const b = input[index + 1] ?? 0;
      output[i] = a + (b - a) * frac;
    }
    return output;
  }

  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  }
}

export function hasXfyunConfig(): boolean {
  const appId = import.meta.env.VITE_XFYUN_APP_ID;
  const apiKey = import.meta.env.VITE_XFYUN_API_KEY;
  const apiSecret = import.meta.env.VITE_XFYUN_API_SECRET;
  return !!(appId && apiKey && apiSecret);
}

export function getXfyunConfig(): XfyunConfig {
  return {
    appId: import.meta.env.VITE_XFYUN_APP_ID || '',
    apiKey: import.meta.env.VITE_XFYUN_API_KEY || '',
    apiSecret: import.meta.env.VITE_XFYUN_API_SECRET || '',
  };
}
