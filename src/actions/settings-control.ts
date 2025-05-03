import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";
import { exec } from "child_process";

@action({ UUID: "com.sven-wagener.awtrix-control.settings" })
export class SettingsControl extends SingletonAction<SettingsControlSettings> {

  /**
   * Wird aufgerufen, wenn die Action angezeigt wird
   */
  override async onWillAppear(ev: WillAppearEvent<SettingsControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    // Setze das Icon für die Action
    await ev.action.setImage("imgs/actions/awtrix-settings/key");
    
    streamDeck.logger.info(`Settings action initialized for device ${device}`);
  }

  override async onKeyUp(ev: KeyUpEvent<SettingsControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      const awtrix = new Awtrix3(device);
      
      // Öffne die Einstellungsseite der AWTRIX im Browser
      // Die Einstellungsseite ist direkt unter der IP-Adresse erreichbar
      const url = `http://${device}`;
      
      // Öffne die URL im Standard-Browser des Betriebssystems
      this.openUrlInBrowser(url);
      streamDeck.logger.info(`Opened Settings page for device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error opening Settings page for device ${device}: ${error}`);
    }
  }

  /**
   * Öffnet eine URL im Standard-Browser des Betriebssystems
   * 
   * @param url Die zu öffnende URL
   */
  private openUrlInBrowser(url: string): void {
    // Verwende child_process.exec, um den Standard-Browser zu öffnen
    const command = process.platform === 'win32' 
      ? `start ${url}` 
      : process.platform === 'darwin' 
        ? `open ${url}` 
        : `xdg-open ${url}`;
    
    exec(command, (error) => {
      if (error) {
        streamDeck.logger.error(`Error opening URL in browser: ${error}`);
      }
    });
  }
}

export interface SettingsControlSettings extends JsonObject {
  device: string;
  [key: string]: JsonValue;
}
