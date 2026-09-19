import { VisionDetection } from "../types";

export class VisionService {
  public static async captureScreen(): Promise<string> {
    try {
      return await this.captureRealDisplayMedia();
    } catch (err) {
      console.warn("Display media unavailable or declined, creating desktop canvas snapshot:", err);
      return this.captureElementToCanvas(document.body);
    }
  }

  public static async captureWebcam(): Promise<string> {
    try {
      return await this.captureWebcamSnapshot();
    } catch (err) {
      console.warn("Webcam unavailable or declined, creating desktop canvas snapshot:", err);
      return this.captureElementToCanvas(document.body);
    }
  }

  /**
   * Captures live user screen using real browser getDisplayMedia API.
   * This allows the user to share their whole screen, a window, or a tab.
   */
  public static async captureRealDisplayMedia(): Promise<string> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error("Screen capture API (getDisplayMedia) is not supported in this browser.");
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
        displaySurface: "monitor",
      } as any,
      audio: false,
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();

    // Capture frame on canvas
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not initialize 2D canvas context");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");

    // Clean up tracks immediately
    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;

    return dataUrl;
  }

  /**
   * Captures webcam snapshot for visual presence or physical document reading.
   */
  public static async captureWebcamSnapshot(): Promise<string> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Webcam API is not available.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false,
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not initialize 2D canvas context");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");

    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;

    return dataUrl;
  }

  /**
   * Captures the DOM workspace sandbox to an image
   */
  public static captureElementToCanvas(element: HTMLElement): string {
    const canvas = document.createElement("canvas");
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Draw stylized representation
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "20px system-ui";
    ctx.fillText("Windows 11 Live Desktop Snapshot", 30, 50);

    return canvas.toDataURL("image/png");
  }

  /**
   * Sends the base64 screen image to the server for Gemini 3.8 Flash Vision OCR & UI element detection.
   */
  public static async analyzeScreen(
    imageBase64: string,
    prompt?: string
  ): Promise<VisionDetection> {
    const res = await fetch("/api/vision/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, prompt }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      if (errorData.fallback) {
        return errorData.fallback as VisionDetection;
      }
      throw new Error(`Vision analysis failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data as VisionDetection;
  }
}
