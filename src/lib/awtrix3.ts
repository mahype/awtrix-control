/**
 * Awtrix3 class to interact with the Awtrix3 HTTP API.
 *
 * @see https://blueforcer.github.io/awtrix3/#/api
 */
export class Awtrix3 {
  private host: string;

  /**
   * Constructor of the Awtrix3 class.
   *
   * @param host IP address or hostname of the Awtrix3 device
   */
  constructor(host: string) {
    this.host = host;
  }

  /**
   * Get data from the Awtrix3 API.
   *
   * @param url API endpoint
   * @returns A promise with the response
   */
  async get<T>(url: string): Promise<T> {
    const endpoint = `http://${this.host}${url}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as T;
  }

  /**
   * Post data to the Awtrix3 API.
   *
   * @param url API endpoint
   * @param data Data to send
   * @returns A promise with the response
   */
  async post<T>(url: string, data?: any): Promise<T> {
    const endpoint = `http://${this.host}${url}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Prüfe, ob die Antwort ein einfacher Text ist (wie "OK")
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/plain")) {
      const text = await response.text();
      // Gib ein Objekt zurück, das den Text enthält
      return { success: true, message: text } as unknown as T;
    }

    try {
      return await response.json() as T;
    } catch (error) {
      // Wenn das JSON-Parsing fehlschlägt, versuche den Text zu lesen
      const text = await response.text();
      // Wenn der Text "OK" ist, gib ein Erfolgsobjekt zurück
      if (text === "OK") {
        return { success: true, message: "OK" } as unknown as T;
      }
      // Ansonsten wirf den ursprünglichen Fehler
      throw error;
    }
  }

  /**
   * Get effects.
   *
   * List of all effects.
   *
   * @returns Array of effects
   */
  async getEffects(): Promise<string[]> {
    return await this.get<string[]>("/api/effects");
  }

  /**
   * Get Transitions.
   *
   * List of all transition effects.
   *
   * @returns Array of transitions
   */
  async getTransitions(): Promise<string[]> {
    return await this.get<string[]>("/api/transitions");
  }

  /**
   * Get Loop.
   *
   * List of all apps in the loop.
   *
   * @returns Array of apps
   */
  async getLoop(): Promise<any[]> {
    return await this.get<any[]>("/api/loop");
  }

  /**
   * Get the stats from the Awtrix3 API.
   * @returns Stats object
   */
  async getStats(): Promise<AwtrixStats> {
    return await this.get<AwtrixStats>("/api/stats");
  }

  /**
   * Get the UID of the Awtrix3 device.
   * @returns UID
   */
  async getUID(): Promise<number> {
    const stats = await this.getStats();
    return stats.uid;
  }

  /**
   * Get battery level of the Awtrix3 device.
   * @returns Battery level
   */
  async getBattery(): Promise<number> {
    try {
      const stats = await this.getStats();
      // Stellen wir sicher, dass wir eine gültige Zahl haben
      if (stats && typeof stats.bat === 'number') {
        return stats.bat;
      }
      // Fallback, wenn der Wert nicht vorhanden ist
      return 0;
    } catch (error) {
      console.error(`Error getting battery level: ${error}`);
      return 0;
    }
  }

  /**
   * Get the current brightness of the display.
   * @returns Brightness value (0-255)
   */
  async getBrightness(): Promise<number> {
    const stats = await this.getStats();
    return stats.bri;
  }

  /**
   * Set the brightness of the display.
   *
   * @param brightness A number between 0 and 255
   * @returns Response
   */
  async setBrightness(brightness: number): Promise<any> {
    return await this.post("/settings", { BRI: brightness });
  }

  /**
   * Get lux value from the Awtrix3 device sensor.
   *
   * @returns Lux value
   */
  async getLux(): Promise<number> {
    const stats = await this.getStats();
    return stats.lux;
  }

  /**
   * Get the temperature from the Awtrix3 device sensor.
   *
   * @returns Temperature value
   */
  async getTemperature(): Promise<number> {
    const stats = await this.getStats();
    return stats.temp;
  }

  /**
   * Get the humidity from the Awtrix3 device sensor.
   *
   * @returns Humidity value
   */
  async getHumidity(): Promise<number> {
    const stats = await this.getStats();
    return stats.hum;
  }

  /**
   * Get uptime from the Awtrix3 device in seconds.
   *
   * @returns Uptime in seconds
   */
  async getUptime(): Promise<number> {
    const stats = await this.getStats();
    return stats.uptime;
  }

  /**
   * Get the current WiFi signal strength.
   *
   * @returns Signal strength in dBm
   */
  async getWifi(): Promise<number> {
    try {
      const stats = await this.getStats();
      // Stellen wir sicher, dass wir eine gültige Zahl haben
      if (stats && typeof stats.wifi === 'number') {
        return stats.wifi;
      }
      // Fallback, wenn der Wert nicht vorhanden ist
      return 0;
    } catch (error) {
      console.error(`Error getting WiFi signal strength: ${error}`);
      return 0;
    }
  }

  /**
   * Get the IP address of the Awtrix3 device.
   *
   * @returns IP address
   */
  async getIp(): Promise<string> {
    const stats = await this.getStats();
    return stats.ip;
  }

  /**
   * Get the version of the Awtrix3 device.
   *
   * @returns Version
   */
  async getVersion(): Promise<string> {
    const stats = await this.getStats();
    return stats.version;
  }

  /**
   * Get screen url of the Awtrix3 device.
   *
   * @returns URL
   */
  getScreenUrl(): string {
    return `http://${this.host}/screen`;
  }

  /**
   * Get fullscreen url of the Awtrix3 device.
   *
   * @returns URL
   */
  getFullscreenUrl(): string {
    return `http://${this.host}/fullscreen`;
  }

  /**
   * Get the app that is currently running on the Awtrix3 device.
   *
   * @returns App name
   */
  async getApp(): Promise<string> {
    const stats = await this.getStats();
    return stats.app;
  }

  /**
   * Set an app on the Awtrix3 device.
   *
   * @param name App name
   * @param properties App properties
   * @returns Response
   * @see https://blueforcer.github.io/awtrix3/#/api?id=custom-apps-and-notifications
   */
  async setApp(name: string, properties: Record<string, any> = {}): Promise<any> {
    return await this.post(`/api/custom?name=${name}`, properties);
  }

  /**
   * Set multiple apps on the Awtrix3 device.
   *
   * @param name Name of the app (will be suffixed with a number)
   * @param propertiesArray Array of app properties
   * @returns Response
   * @see https://blueforcer.github.io/awtrix3/#/api?id=sending-multiple-custom-apps-simultaneously
   */
  async setApps(name: string, propertiesArray: Record<string, any>[] = []): Promise<any> {
    return await this.post(`/api/custom?name=${name}`, propertiesArray);
  }

  /**
   * Delete an app on the Awtrix3 device.
   *
   * @param name App name
   * @returns Response
   */
  async deleteApp(name: string): Promise<any> {
    return await this.post(`/api/custom?name=${name}`);
  }

  /**
   * Switch to next app on the Awtrix3 device.
   *
   * @returns Response
   */
  async nextApp(): Promise<any> {
    return await this.post("/api/nextapp");
  }

  /**
   * Switch to previous app on the Awtrix3 device.
   *
   * @returns Response
   */
  async previousApp(): Promise<any> {
    return await this.post("/api/previousapp");
  }

  /**
   * Switch to a specific app on the Awtrix3 device.
   *
   * @param name App name
   * @returns Response
   */
  async switchApp(name: string): Promise<any> {
    return await this.post("/api/switch", { name });
  }

  /**
   * Set a notification on the Awtrix3 device.
   *
   * @param properties Notification properties
   * @returns Response
   * @see https://blueforcer.github.io/awtrix3/#/api?id=custom-apps-and-notifications
   */
  async setNotification(properties: Record<string, any> = {}): Promise<any> {
    return await this.post("/api/notify", properties);
  }

  /**
   * Dismiss notification on the Awtrix3 device.
   *
   * @returns Response
   */
  async dismissNotification(): Promise<any> {
    return await this.post("/api/notify/dismiss");
  }

  /**
   * Set indicator on the Awtrix3 device.
   *
   * @param number Number of the indicator (1, 2 or 3)
   * @param color Color of the indicator as array [r,g,b] e.g. [255,0,0] for red
   * @param blink Blink time in ms
   * @param fade Fade time in ms (only set if blink is 0)
   * @returns Response
   */
  async setIndicator(number: number, color: [number, number, number], blink = 0, fade = 0): Promise<any> {
    if (blink > 0) {
      return await this.post(`/api/indicator${number}`, {
        color,
        blink,
      });
    }

    if (fade > 0) {
      return await this.post(`/api/indicator${number}`, {
        color,
        fade,
      });
    }

    return await this.post(`/api/indicator${number}`, { color });
  }

  /**
   * Dismiss indicator on the Awtrix3 device.
   *
   * @param number Number of the indicator (1, 2 or 3)
   * @returns Response
   */
  async dismissIndicator(number: number): Promise<any> {
    return await this.post(`/api/indicator${number}`);
  }

  /**
   * Power control for the Awtrix3 device.
   * 
   * @param state true to turn on, false to turn off
   * @returns Response from the API
   */
  async setPower(state: boolean): Promise<any> {
    return await this.post("/api/power", { power: state });
  }

  /**
   * Turn on the Awtrix3 device.
   * 
   * @returns Response from the API
   */
  async powerOn(): Promise<any> {
    return await this.setPower(true);
  }

  /**
   * Turn off the Awtrix3 device.
   * 
   * @returns Response from the API
   */
  async powerOff(): Promise<any> {
    return await this.setPower(false);
  }

  /**
   * Toggle the power state of the Awtrix3 device.
   * First checks the current state, then toggles it.
   * 
   * @returns Response from the API
   */
  async togglePower(): Promise<any> {
    try {
      const isPoweredOn = await this.getPowerState();
      return await this.setPower(!isPoweredOn);
    } catch (error) {
      // Wenn die Zustandsabfrage fehlschlägt, verwenden wir den Toggle-Befehl
      return await this.post("/api/power", { power: "toggle" });
    }
  }

  /**
   * Get the power state of the Awtrix3 device.
   * 
   * @returns True if the device is powered on, false otherwise
   */
  async getPowerState(): Promise<boolean> {
    try {
      // Versuche, die Stats abzurufen
      const stats = await this.getStats();
      
      // Verwende die matrix-Eigenschaft als Indikator für den Power-Zustand
      return stats.matrix === true;
    } catch (error) {
      // Wenn die Stats-Abfrage fehlschlägt, ist das Gerät wahrscheinlich ausgeschaltet oder nicht erreichbar
      return false;
    }
  }

  /**
   * Get the current screen content as a base64 encoded image.
   * 
   * @returns Base64 encoded image of the current screen
   */
  async getScreen(): Promise<string> {
    return await this.get<string>("/api/screen");
  }

  /**
   * Get the current app that is displayed on the device.
   * 
   * @returns The name of the current app
   */
  async getCurrentApp(): Promise<string> {
    const stats = await this.getStats();
    return stats.app;
  }

  /**
   * Set the color of the AWTRIX device's indicator LED.
   * 
   * @param r Red component (0-255)
   * @param g Green component (0-255)
   * @param b Blue component (0-255)
   * @returns Response from the API
   */
  async setIndicatorColor(r: number, g: number, b: number): Promise<any> {
    return await this.post("/settings", { ILED_COLOR: [r, g, b] });
  }

  /**
   * Set the color of the AWTRIX device's matrix.
   * 
   * @param r Red component (0-255)
   * @param g Green component (0-255)
   * @param b Blue component (0-255)
   * @returns Response from the API
   */
  async setMatrixColor(r: number, g: number, b: number): Promise<any> {
    return await this.post("/settings", { MAT_COLOR: [r, g, b] });
  }

  /**
   * Reboot the AWTRIX device.
   * 
   * @returns Response from the API
   */
  async reboot(): Promise<any> {
    return await this.post("/api/reboot");
  }

  /**
   * Get a list of all installed apps.
   * 
   * @returns Array of app objects
   */
  async getApps(): Promise<any[]> {
    return await this.get<any[]>("/api/apps");
  }

  /**
   * Checks if the device is reachable.
   * 
   * @returns True if reachable, false otherwise
   */
  async isReachable(): Promise<boolean> {
    try {
      const stats = await this.getStats();
      return stats !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the host of the Awtrix device.
   * 
   * @returns The host.
   */
  getHost(): string {
    return this.host;
  }

  /**
   * Display text on the Awtrix device.
   * 
   * @param options The text options.
   * @returns A promise that resolves when the text has been displayed.
   */
  async displayText(options: {
    text: string;
    color?: number[];
    duration?: number;
  }): Promise<void> {
    // Use setApp to display text
    await this.setApp("streamdeck", {
      text: options.text,
      color: options.color || [255, 255, 255],
      duration: options.duration || 10
    });
  }
}

/**
 * Interface for Awtrix stats.
 */
export interface AwtrixStats {
  uid: number;
  bat: number;
  bri: number;
  lux: number;
  temp: number;
  hum: number;
  uptime: number;
  wifi: number;
  ip: string;
  version: string;
  app: string;
  [key: string]: any;
}
