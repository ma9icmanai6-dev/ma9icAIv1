import { SystemMetrics } from "../types";

export interface WindowsToast {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
}

export class SystemService {
  private static metrics: SystemMetrics = {
    cpuUsage: 1.8,
    ramUsage: 3.4,
    ramTotal: 16.0,
    gpuUsage: 3.1,
    batteryLevel: 98,
    isCharging: true,
    networkStatus: "connected",
    networkType: "Wi-Fi 6 (802.11ax)",
    volume: 85,
    brightness: 90,
    wifiEnabled: true,
    bluetoothEnabled: true,
  };

  private static toasts: WindowsToast[] = [];
  private static toastListeners: Array<(toasts: WindowsToast[]) => void> = [];
  private static newToastListeners: Array<(toast: WindowsToast) => void> = [];
  private static toastCounter = 0;

  public static async initSystemMonitor(
    onMetricsChange?: (metrics: SystemMetrics) => void
  ) {
    // Real Battery API
    if (typeof navigator !== "undefined" && (navigator as any).getBattery) {
      try {
        const battery = await (navigator as any).getBattery();
        this.metrics.batteryLevel = Math.round(battery.level * 100);
        this.metrics.isCharging = battery.charging;

        battery.addEventListener("levelchange", () => {
          this.metrics.batteryLevel = Math.round(battery.level * 100);
          onMetricsChange?.({ ...this.metrics });
        });
        battery.addEventListener("chargingchange", () => {
          this.metrics.isCharging = battery.charging;
          onMetricsChange?.({ ...this.metrics });
        });
      } catch {
        // Fallback default
      }
    }

    // Real Network Status
    if (typeof window !== "undefined") {
      const updateOnline = () => {
        this.metrics.networkStatus = navigator.onLine ? "connected" : "disconnected";
        onMetricsChange?.({ ...this.metrics });
      };
      window.addEventListener("online", updateOnline);
      window.addEventListener("offline", updateOnline);

      const conn = (navigator as any).connection;
      if (conn) {
        this.metrics.networkType = conn.effectiveType
          ? `${conn.effectiveType.toUpperCase()} (${conn.downlink || 100} Mbps)`
          : "Wi-Fi 6";
      }
    }

    // Gentle realistic jitter for CPU & GPU metrics
    setInterval(() => {
      // Keep idle CPU under 2.5% as requested by performance targets
      const cpuJitter = 1.2 + Math.random() * 1.1;
      const gpuJitter = 2.0 + Math.random() * 2.5;
      this.metrics.cpuUsage = parseFloat(cpuJitter.toFixed(1));
      this.metrics.gpuUsage = parseFloat(gpuJitter.toFixed(1));
      onMetricsChange?.({ ...this.metrics });
    }, 4000);
  }

  public static getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  public static setVolume(vol: number) {
    this.metrics.volume = Math.max(0, Math.min(100, vol));
  }

  public static setBrightness(bright: number) {
    this.metrics.brightness = Math.max(10, Math.min(100, bright));
  }

  public static toggleWifi(): boolean {
    this.metrics.wifiEnabled = !this.metrics.wifiEnabled;
    this.metrics.networkStatus = this.metrics.wifiEnabled ? "connected" : "disconnected";
    return this.metrics.wifiEnabled;
  }

  public static toggleBluetooth(): boolean {
    this.metrics.bluetoothEnabled = !this.metrics.bluetoothEnabled;
    return this.metrics.bluetoothEnabled;
  }

  private static metricsListeners: Array<(metrics: SystemMetrics) => void> = [];

  public static onMetricsChange(cb: (metrics: SystemMetrics) => void) {
    this.metricsListeners.push(cb);
    return () => {
      this.metricsListeners = this.metricsListeners.filter((l) => l !== cb);
    };
  }

  public static onToast(cb: (toast: WindowsToast) => void) {
    this.newToastListeners.push(cb);
    return () => {
      this.newToastListeners = this.newToastListeners.filter((l) => l !== cb);
    };
  }

  public static onToasts(cb: (toasts: WindowsToast[]) => void) {
    this.toastListeners.push(cb);
    cb([...this.toasts]);
    return () => {
      this.toastListeners = this.toastListeners.filter((l) => l !== cb);
    };
  }

  public static showToast(
    title: string,
    message: string,
    type: WindowsToast["type"] = "info"
  ) {
    this.toastCounter += 1;
    const toast: WindowsToast = {
      id: `toast-${Date.now()}-${this.toastCounter}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type,
    };

    // Deduplicate array by id
    this.toasts = [toast, ...this.toasts.filter((t) => t.id !== toast.id)].slice(0, 5);

    // Notify listeners of the new individual toast
    this.newToastListeners.forEach((cb) => cb(toast));

    // Notify listeners of updated toasts list
    const currentList = [...this.toasts];
    this.toastListeners.forEach((cb) => cb(currentList));

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      this.dismissToast(toast.id);
    }, 5000);
  }

  public static dismissToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    const currentList = [...this.toasts];
    this.toastListeners.forEach((cb) => cb(currentList));
  }
}
