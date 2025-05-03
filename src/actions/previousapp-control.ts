import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

@action({ UUID: "com.sven-wagener.awtrix-control.previousapp" })
export class PreviousAppControl extends SingletonAction<PreviousAppControlSettings> {

  /**
   * Wird aufgerufen, wenn die Action angezeigt wird
   */
  override async onWillAppear(ev: WillAppearEvent<PreviousAppControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    // Setze das Icon für die Action
    await ev.action.setImage("imgs/actions/awtrix-previousapp/key");
    streamDeck.logger.info(`PreviousApp action initialized for device ${device}`);
  }

  override async onKeyUp(ev: KeyUpEvent<PreviousAppControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      // Wechsle zur vorherigen App
      const awtrix = new Awtrix3(device);
      await awtrix.previousApp();
      streamDeck.logger.info(`Switched to previous app on device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error switching to previous app on device ${device}: ${error}`);
    }
  }
}

interface PreviousAppControlSettings extends JsonObject {
  device: string;
}
