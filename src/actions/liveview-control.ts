import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";
import { exec } from "child_process";

@action({ UUID: "com.sven-wagener.awtrix-control.liveview" })
export class LiveViewControl extends SingletonAction<LiveViewControlSettings> {

  /**
   * Wird aufgerufen, wenn die Action angezeigt wird
   */
  override async onWillAppear(ev: WillAppearEvent<LiveViewControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    // Setze das Icon für die Action
    await ev.action.setImage("imgs/actions/awtrix-liveview/key");
    
    streamDeck.logger.info(`LiveView action initialized for device ${device}`);
  }

  override async onKeyUp(ev: KeyUpEvent<LiveViewControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    const viewMode = settings.viewMode || "normal"; // Default to normal view if not specified
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      const awtrix = new Awtrix3(device);
      
      // Bestimme die URL basierend auf dem ausgewählten Ansichtsmodus
      const url = viewMode === "fullscreen" 
        ? awtrix.getFullscreenUrl() 
        : awtrix.getScreenUrl();
      
      // Öffne die URL im Standard-Browser des Betriebssystems
      this.openUrlInBrowser(url);
      streamDeck.logger.info(`Opened ${viewMode} LiveView for device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error opening LiveView for device ${device}: ${error}`);
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

export interface LiveViewControlSettings extends JsonObject {
  device: string;
  viewMode: "normal" | "fullscreen";
  [key: string]: JsonValue;
}
