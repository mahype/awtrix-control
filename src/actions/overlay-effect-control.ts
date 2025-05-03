import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

@action({ UUID: "com.sven-wagener.awtrix-control.overlay-effect" })
export class OverlayEffectControl extends SingletonAction<OverlayEffectControlSettings> {

  /**
   * Wird aufgerufen, wenn die Action angezeigt wird
   */
  override async onWillAppear(ev: WillAppearEvent<OverlayEffectControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    // Setze das Icon für die Action
    await ev.action.setImage("imgs/actions/awtrix-overlay-effect/key");
    
    streamDeck.logger.info(`OverlayEffect action initialized for device ${device}`);
  }

  override async onKeyUp(ev: KeyUpEvent<OverlayEffectControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    const effect = settings.effect || "clear"; // Default to clear if not specified
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      const awtrix = new Awtrix3(device);
      
      // Setze den Overlay-Effekt
      await awtrix.setOverlayEffect(effect);
      streamDeck.logger.info(`Set overlay effect to ${effect} for device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error setting overlay effect for device ${device}: ${error}`);
    }
  }
}

export interface OverlayEffectControlSettings extends JsonObject {
  device: string;
  effect: "clear" | "snow" | "rain" | "drizzle" | "storm" | "thunder" | "frost";
  [key: string]: JsonValue;
}
