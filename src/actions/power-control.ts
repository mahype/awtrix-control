import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

@action({ UUID: "com.sven-wagener.awtrix-control.power" })
export class PowerControl extends SingletonAction<PowerControlSettings> {

  /**
   * Wird aufgerufen, wenn die Action angezeigt wird
   */
  override async onWillAppear(ev: WillAppearEvent<PowerControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      // Aktuellen Power-Zustand ermitteln und entsprechenden State setzen
      const awtrix = new Awtrix3(device);
      const isPoweredOn = await awtrix.getPowerState();
      
      // State 0 = Aus, State 1 = An
      await ev.action.setImage(isPoweredOn ? "imgs/actions/awtrix-power/key-on" : "imgs/actions/awtrix-power/key-off");
      streamDeck.logger.info(`Initial power state for device ${device}: ${isPoweredOn ? "ON" : "OFF"}`);
    } catch (error) {
      streamDeck.logger.error(`Error getting initial power state for device ${device}: ${error}`);
    }
  }

  override async onKeyUp(ev: KeyUpEvent<PowerControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    const action = settings.action || "toggle"; // Default to toggle if not specified
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      const awtrix = new Awtrix3(device);
      
      // Aktuellen Power-Zustand ermitteln und loggen
      let isPoweredOn = false;
      try {
        isPoweredOn = await awtrix.getPowerState();
        streamDeck.logger.info(`Current power state for device ${device}: ${isPoweredOn ? "ON" : "OFF"}`);
      } catch (error) {
        streamDeck.logger.error(`Error getting power state: ${error}`);
      }
      
      if (action === "toggle") {
        streamDeck.logger.info(`Toggling power for device: ${device}`);
        await awtrix.togglePower();
        // Neuen Power-Zustand nach dem Toggle ermitteln und loggen
        try {
          const newPowerState = await awtrix.getPowerState();
          // Bild je nach Zustand setzen
          await ev.action.setImage(newPowerState ? "imgs/actions/awtrix-power/key-on" : "imgs/actions/awtrix-power/key-off");
          streamDeck.logger.info(`New power state for device ${device}: ${newPowerState ? "ON" : "OFF"}`);
        } catch (error) {
          streamDeck.logger.error(`Error getting new power state: ${error}`);
        }
      } else if (action === "on") {
        await awtrix.powerOn();
        await ev.action.setImage("imgs/actions/awtrix-power/key-on");
        streamDeck.logger.info(`Turned on device: ${device}`);
      } else if (action === "off") {
        await awtrix.powerOff();
        await ev.action.setImage("imgs/actions/awtrix-power/key-off");
        streamDeck.logger.info(`Turned off device: ${device}`);
      } else {
        streamDeck.logger.error(`Unknown action: ${action}`);
      }
    } catch (error) {
      streamDeck.logger.error(`Error controlling power for device ${device}: ${error}`);
    }
  }
}

export interface PowerControlSettings extends JsonObject {
  device: string;
  action: "toggle" | "on" | "off";
  [key: string]: JsonValue;
}