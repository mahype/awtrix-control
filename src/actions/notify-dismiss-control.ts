import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

@action({ UUID: "com.sven-wagener.awtrix-control.notify-dismiss" })
export class NotifyDismissControl extends SingletonAction<NotifyDismissControlSettings> {

  /**
   * Wird aufgerufen, wenn die Action angezeigt wird
   */
  override async onWillAppear(ev: WillAppearEvent<NotifyDismissControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    // Setze das Icon für die Action
    await ev.action.setImage("imgs/actions/awtrix-notify-dismiss/key");
    streamDeck.logger.info(`NotifyDismiss action initialized for device ${device}`);
  }

  override async onKeyUp(ev: KeyUpEvent<NotifyDismissControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      // Entferne die aktuelle Benachrichtigung
      const awtrix = new Awtrix3(device);
      await awtrix.dismissNotification();
      streamDeck.logger.info(`Dismissed notification on device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error dismissing notification on device ${device}: ${error}`);
    }
  }
}

interface NotifyDismissControlSettings extends JsonObject {
  device: string;
}
