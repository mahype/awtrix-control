import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

@action({ UUID: "com.sven-wagener.awtrix-control.nextapp" })
export class NextAppControl extends SingletonAction<NextAppControlSettings> {

  /**
   * Wird aufgerufen, wenn die Action angezeigt wird
   */
  override async onWillAppear(ev: WillAppearEvent<NextAppControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    // Setze das Icon für die Action
    await ev.action.setImage("imgs/actions/awtrix-nextapp/key");
    streamDeck.logger.info(`NextApp action initialized for device ${device}`);
  }

  override async onKeyUp(ev: KeyUpEvent<NextAppControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      // Wechsle zur nächsten App
      const awtrix = new Awtrix3(device);
      await awtrix.nextApp();
      streamDeck.logger.info(`Switched to next app on device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error switching to next app on device ${device}: ${error}`);
    }
  }
}

interface NextAppControlSettings extends JsonObject {
  device: string;
}
