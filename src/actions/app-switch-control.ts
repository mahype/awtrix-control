import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent, SendToPluginEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

@action({ UUID: "com.sven-wagener.awtrix-control.app-switch" })
export class AppSwitchControl extends SingletonAction<AppSwitchControlSettings> {
  /**
   * Wird aufgerufen, wenn die Action angezeigt wird
   */
  override async onWillAppear(ev: WillAppearEvent<AppSwitchControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    // Setze das Icon für die Action
    await ev.action.setImage("imgs/actions/awtrix-app-switch/key");
    
    try {
      // Hole die Apps vom Gerät und sende sie an die Property Inspector
      const awtrix = new Awtrix3(device);
      const apps = await awtrix.getLoop();
      
      // Sende die Apps an die Property Inspector
      const payload = {
        event: "getApps",
        apps: apps
      };
      
      // Verwende die setSettings-Methode, um die Apps zu speichern
      // Die Property Inspector kann diese dann über getSettings abrufen
      await ev.action.setSettings({
        ...settings,
        availableApps: apps
      });

      streamDeck.ui.current?.sendToPropertyInspector(payload);
      
      streamDeck.logger.info(`AppSwitch action initialized for device ${device} with ${apps.length} apps`);
    } catch (error) {
      streamDeck.logger.error(`Error getting apps from device ${device}: ${error}`);
    }
  }

  /**
   * Wird aufgerufen, wenn eine Nachricht von der Property Inspector empfangen wird
   */
  override async onSendToPlugin(ev: SendToPluginEvent<JsonObject, AppSwitchControlSettings>): Promise<void> {
    streamDeck.logger.info(`Received sendToPlugin event`);

    // Wenn die Property Inspector nach Apps fragt
    if (ev.payload?.event === "getApps") {
      streamDeck.logger.info(`Received getApps request`);

      const settings = await ev.action.getSettings();
      const device = settings.device;
      
      if (!device) {
        streamDeck.logger.error("No device selected for getApps request");
        return;
      }
      
      try {
        // Hole die Apps vom Gerät und sende sie an die Property Inspector
        const awtrix = new Awtrix3(device);
        const apps = await awtrix.getLoop();
        
        const payload = {
          event: "appsReceived",
          apps: apps
        };

        streamDeck.logger.info(`Test ${JSON.stringify(streamDeck.ui)}`);

        streamDeck.logger.info(`Sending apps to Property Inspector for device ${device}: ${JSON.stringify(payload)}`);
        
        //await ev.action.sendToPropertyInspector(payload);
        
        streamDeck.logger.info(`Sent ${apps.length} apps to Property Inspector for device ${device}`);
      } catch (error) {
        streamDeck.logger.error(`Error getting apps from device ${device}: ${error}`);
      }
    }
  }

  override async onKeyUp(ev: KeyUpEvent<AppSwitchControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    const appName = settings.appName;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }
    
    if (!appName) {
      streamDeck.logger.error("No app selected");
      return;
    }

    try {
      // Wechsle zur ausgewählten App
      const awtrix = new Awtrix3(device);
      await awtrix.switchApp(appName);
      streamDeck.logger.info(`Switched to app ${appName} on device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error switching to app ${appName} on device ${device}: ${error}`);
    }
  }
}

interface AppSwitchControlSettings extends JsonObject {
  device: string;
  appName: string;
  availableApps?: any[];
}
