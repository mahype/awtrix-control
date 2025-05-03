import streamDeck, { action, WillAppearEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

@action({ UUID: "com.sven-wagener.awtrix-control.wifi" })
export class WifiSensor extends SingletonAction<WifiSensorSettings> {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_REFRESH_INTERVAL = 60000; // 1 Minute

  override async onWillAppear(ev: WillAppearEvent<WifiSensorSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    const refreshInterval = settings.refreshInterval || this.DEFAULT_REFRESH_INTERVAL;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      // Sofort den WLAN-Signalwert abrufen und anzeigen
      await this.updateWifi(device, ev.action);
      
      // Regelmäßiges Update einrichten
      this.refreshInterval = setInterval(async () => {
        await this.updateWifi(device, ev.action);
      }, refreshInterval);
    } catch (error) {
      streamDeck.logger.error(`Error initializing WiFi sensor for device ${device}: ${error}`);
    }
  }

  override async onWillDisappear(): Promise<void> {
    // Interval löschen, wenn die Action verschwindet
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Wird aufgerufen, wenn der Benutzer die Taste drückt und loslässt
   */
  override async onKeyUp(ev: any): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      // Aktualisiere den WLAN-Signalwert bei Tastendruck
      await this.updateWifi(device, ev.action);
      streamDeck.logger.info(`WiFi signal updated on key press for device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error updating WiFi signal on key press for device ${device}: ${error}`);
    }
  }

  /**
   * Aktualisiert den WLAN-Signalwert und zeigt ihn auf dem Key an
   */
  private async updateWifi(device: string, action: any): Promise<void> {
    try {
      const awtrix = new Awtrix3(device);
      const wifi = await awtrix.getWifi();
      
      // WLAN-Signal auf dem Key anzeigen mit drei Leerzeilen für mehr Abstand
      await action.setTitle(`\n\n\n${wifi}%`, { target: 0, state: 0 });
      streamDeck.logger.info(`Updated wifi for device ${device}: ${wifi}%`);
    } catch (error) {
      streamDeck.logger.error(`Error updating wifi for device ${device}: ${error}`);
      // Fehlermeldung auf dem Key anzeigen
      await action.setTitle(`\n\n\nError`, { target: 0, state: 0 });
    }
  }
}

export interface WifiSensorSettings extends JsonObject {
  device: string;
  refreshInterval?: number;
  [key: string]: JsonValue;
}
