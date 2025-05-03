import streamDeck, { action, WillAppearEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

@action({ UUID: "com.sven-wagener.awtrix-control.temperature" })
export class TemperatureSensor extends SingletonAction<TemperatureSensorSettings> {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_REFRESH_INTERVAL = 60000; // 1 Minute

  override async onWillAppear(ev: WillAppearEvent<TemperatureSensorSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    const refreshInterval = settings.refreshInterval || this.DEFAULT_REFRESH_INTERVAL;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      // Sofort den Temperaturwert abrufen und anzeigen
      await this.updateTemperature(device, ev.action);
      
      // Regelmäßiges Update einrichten
      this.refreshInterval = setInterval(async () => {
        await this.updateTemperature(device, ev.action);
      }, refreshInterval);
    } catch (error) {
      streamDeck.logger.error(`Error initializing temperature sensor for device ${device}: ${error}`);
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
      // Aktualisiere den Temperaturwert bei Tastendruck
      await this.updateTemperature(device, ev.action);
      streamDeck.logger.info(`Temperature updated on key press for device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error updating temperature on key press for device ${device}: ${error}`);
    }
  }

  /**
   * Aktualisiert den Temperaturwert und zeigt ihn auf dem Key an
   */
  private async updateTemperature(device: string, action: any): Promise<void> {
    try {
      const awtrix = new Awtrix3(device);
      const temperature = await awtrix.getTemperature();
      
      // Temperatur auf dem Key anzeigen mit drei Leerzeilen für mehr Abstand
      await action.setTitle(`\n\n\n${temperature}°C`, { target: 0, state: 0 });
      streamDeck.logger.info(`Updated temperature for device ${device}: ${temperature}°C`);
    } catch (error) {
      streamDeck.logger.error(`Error updating temperature for device ${device}: ${error}`);
    }
  }
}

export interface TemperatureSensorSettings extends JsonObject {
  device: string;
  refreshInterval?: number;
  [key: string]: JsonValue;
}
