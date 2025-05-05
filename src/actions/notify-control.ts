import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";

/**
 * Notify Control for AWTRIX
 * 
 * This action allows sending notifications to AWTRIX devices
 * using the Notify API.
 */
@action({ UUID: "com.sven-wagener.awtrix-control.notify" })
export class NotifyControl extends SingletonAction<NotifySettings> {

  /**
   * Called when key is pressed
   */
  override async onKeyUp(e: KeyUpEvent<NotifySettings>): Promise<void> {
    try {
      // Get settings
      const settings = e.payload.settings;

      // Check if device is set
      if (!settings.device) {
        await e.action.showAlert();
        streamDeck.logger.error("No device selected");
        return;
      }

      // Prepare payload for notification
      const payload: any = {
        text: settings.text || "",
        color: settings.color || "#FFFFFF" // Default to white if not set
      };

      // Add duration as number
      if (settings.duration) {
        payload.duration = parseInt(settings.duration.toString());
      } else {
        payload.duration = 0;
      }

      // Add icon if provided (either base64 or iconId)
      if (settings.icon) {
        payload.icon = settings.icon;
      } else if (settings.iconId) {
        payload.icon = settings.iconId;
      }

      // Add optional parameters if they are set
      if (settings.stickIcon !== undefined) payload.pushIcon = settings.stickIcon ? 0 : 1;
      
      // Always set center parameter explicitly
      payload.center = settings.centerText === true;
      
      if (settings.blinkText) {
        const blinkValue = parseInt(settings.blinkText.toString());
        if (blinkValue > 0) {
          payload.blinkText = blinkValue;
        }
      }
      if (settings.fadeText) {
        const fadeValue = parseInt(settings.fadeText.toString());
        if (fadeValue > 0) {
          payload.fadeText = fadeValue;
        }
      }
      if (settings.noScroll !== undefined) payload.noScroll = settings.noScroll;
      if (settings.backgroundColor) payload.background = settings.backgroundColor;
      if (settings.rainbow !== undefined) payload.rainbow = settings.rainbow;

      // Handle repeat count
      if (settings.repeatCount !== undefined) {
        const repeatCount = parseInt(settings.repeatCount.toString());
        // Only set repeat if repeatCount is not 0
        if (repeatCount !== 0) {
          payload.repeat = true;
          // Only set repeatCount if it's not -1 (infinite)
          if (repeatCount !== -1) {
            payload.repeatCount = repeatCount;
          }
        }
      }

      // Add hold parameter (specific to notifications)
      if (settings.hold !== undefined) payload.hold = settings.hold;

      streamDeck.logger.info(`Sending notification to device ${settings.device}:`, payload);

      // Send notification to AWTRIX device
      const response = await fetch(`http://${settings.device}/api/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        streamDeck.logger.error(`Error sending notification: ${response.status} ${response.statusText}`, errorText);
        await e.action.showAlert();
        return;
      }

      // Show success
      await e.action.showOk();
      streamDeck.logger.info(`Successfully sent notification to device ${settings.device}`);
    } catch (error) {
      streamDeck.logger.error("Error in NotifyControl:", error);
      await e.action.showAlert();
    }
  }

  /**
   * Called when action appears
   */
  override async onWillAppear(e: WillAppearEvent<NotifySettings>): Promise<void> {
    // Initialization code if needed
  }
}

export interface NotifySettings extends JsonObject {
  device: string;
  text: string;
  icon?: string;
  iconId?: string;
  stickIcon?: boolean;
  color?: string;
  centerText?: boolean;
  blinkText?: number;
  fadeText?: number;
  noScroll?: boolean;
  backgroundColor?: string;
  repeatCount?: number;
  duration?: number;
  rainbow?: boolean;
  hold?: boolean; // Specific to notifications
  [key: string]: JsonValue;
}
