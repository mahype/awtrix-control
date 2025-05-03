import streamDeck, { action, WillAppearEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

@action({ UUID: "com.sven-wagener.awtrix-control.humidity" })
export class HumiditySensor extends SingletonAction<HumiditySensorSettings> {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_REFRESH_INTERVAL = 60000; // 1 Minute

  override async onWillAppear(ev: WillAppearEvent<HumiditySensorSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    const refreshInterval = settings.refreshInterval || this.DEFAULT_REFRESH_INTERVAL;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      // Sofort den Luftfeuchtigkeitswert abrufen und anzeigen
      await this.updateHumidity(device, ev.action);
      
      // Regelmäßiges Update einrichten
      this.refreshInterval = setInterval(async () => {
        await this.updateHumidity(device, ev.action);
      }, refreshInterval);
    } catch (error) {
      streamDeck.logger.error(`Error initializing humidity sensor for device ${device}: ${error}`);
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
      // Aktualisiere den Luftfeuchtigkeitswert bei Tastendruck
      await this.updateHumidity(device, ev.action);
      streamDeck.logger.info(`Humidity updated on key press for device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error updating humidity on key press for device ${device}: ${error}`);
    }
  }

  /**
   * Aktualisiert den Luftfeuchtigkeitswert und zeigt ihn auf dem Key an
   */
  private async updateHumidity(device: string, action: any): Promise<void> {
    try {
      const awtrix = new Awtrix3(device);
      const humidity = await awtrix.getHumidity();
      
      // Luftfeuchtigkeit auf dem Key anzeigen mit drei Leerzeilen für mehr Abstand
      await action.setTitle(`\n\n\n${humidity}%`, { target: 0, state: 0 });
      streamDeck.logger.info(`Updated humidity for device ${device}: ${humidity}%`);
    } catch (error) {
      streamDeck.logger.error(`Error updating humidity for device ${device}: ${error}`);
    }
  }
}

export interface HumiditySensorSettings extends JsonObject {
  device: string;
  refreshInterval?: number;
  [key: string]: JsonValue;
}
