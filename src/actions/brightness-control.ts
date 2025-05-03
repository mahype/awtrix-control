import streamDeck, { action, DialRotateEvent, SingletonAction, WillAppearEvent, KeyUpEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

interface DialAction {
  setFeedback: (feedback: {
    value: number,
    indicator: {
      value: number;
    };
  }) => Promise<void>;
  
  setFeedbackLayout: (values: Record<string, any>) => Promise<void>;
}

@action({ UUID: "com.sven-wagener.awtrix-control.brightness" })
export class BrightnessControl extends SingletonAction<BrightnessControlSettings> {

  /**
   * Called when the action is displayed
   */
  override async onWillAppear(ev: WillAppearEvent<BrightnessControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    const brightness = settings.brightness || 128; // Default to 50% brightness
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    // Set the icon for the action
    await ev.action.setImage("imgs/actions/awtrix-brightness/key");
    
    try {
      // Get current brightness from device
      const awtrix = new Awtrix3(device);
      const brightness = await awtrix.getBrightness();
      
      // Update settings with current brightness
      await ev.action.setSettings({
        ...settings,
        brightness: brightness
      });
      
      // Set title to show current brightness percentage
      const brightnessPercentage = Math.round((brightness / 255) * 100);
      
      // Only set feedback if this is a dial action
      if ('setFeedback' in ev.action) {
        const dialAction = ev.action as unknown as DialAction;
        await dialAction.setFeedback({
          value: brightnessPercentage,
          indicator: {
            value: brightnessPercentage
          }
        });
      }
      
      streamDeck.logger.info(`Brightness action initialized for device ${device} with brightness ${brightness}`);
    } catch (error) {
      streamDeck.logger.error(`Error initializing brightness for device ${device}: ${error}`);
    }
  }

  /**
   * Called when the dial is rotated
   */
  override async onDialRotate(ev: DialRotateEvent<BrightnessControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    let brightness = settings.brightness !== undefined ? settings.brightness : 128; // Default to 50% brightness
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }
    
    // Calculate new brightness based on dial rotation
    // Ensure brightness stays between 0 and 255
    let newBrightness = brightness + ev.payload.ticks * (settings.tickSize || 5);
    
    // Strict boundary check
    if (newBrightness <= 0) {
      newBrightness = 0;
    } else if (newBrightness >= 255) {
      newBrightness = 255;
    }
    
    // Only update if brightness has changed
    if (brightness !== newBrightness) {
      brightness = newBrightness;
      
      streamDeck.logger.info(`Dial rotated to ${brightness} for device ${device}`);
      
      try {
        // Set new brightness on the device
        const awtrix = new Awtrix3(device);
        await awtrix.setBrightness(brightness);
        
        // Update settings with new brightness
        await ev.action.setSettings({
          ...settings,
          brightness: brightness
        });
        
        // Set title to show current brightness percentage
        const brightnessPercentage = Math.round((brightness / 255) * 100);
        
        // Set feedback for the dial
        if ('setFeedback' in ev.action) {
          const dialAction = ev.action as unknown as DialAction;
          await dialAction.setFeedback({
            value: brightnessPercentage,
            indicator: {
              value: brightnessPercentage
            }
          });
        }
        
        streamDeck.logger.info(`Set brightness to ${brightness} (${brightnessPercentage}%) for device ${device}`);
      } catch (error) {
        streamDeck.logger.error(`Error setting brightness for device ${device}: ${error}`);
      }
    } else {
      streamDeck.logger.info(`Brightness already at ${brightness === 0 ? 'minimum' : 'maximum'} for device ${device}`);
    }
  }
  
  /**
   * Called when the key is pressed
   */
  override async onKeyUp(ev: KeyUpEvent<BrightnessControlSettings>): Promise<void> {
    const settings = ev.payload.settings;
    const device = settings.device;
    let brightness = settings.brightness || 128; // Default to 50% brightness
    
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }
    
    // Toggle between 0% and 100% brightness
    brightness = brightness > 0 ? 0 : 255;
    
    try {
      // Set new brightness on the device
      const awtrix = new Awtrix3(device);
      await awtrix.setBrightness(brightness);
      
      // Update settings with new brightness
      await ev.action.setSettings({
        ...settings,
        brightness: brightness
      });
      
      // Set title to show current brightness percentage
      const brightnessPercentage = Math.round((brightness / 255) * 100);
      
      // Set feedback for the dial if this is a dial action
      if ('setFeedback' in ev.action) {
        const dialAction = ev.action as unknown as DialAction;
        await dialAction.setFeedback({
          value: brightnessPercentage,
          indicator: {
            value: brightnessPercentage
          }
        });
      }
      
      streamDeck.logger.info(`Toggled brightness to ${brightness} (${brightnessPercentage}%) for device ${device}`);
    } catch (error) {
      streamDeck.logger.error(`Error toggling brightness for device ${device}: ${error}`);
    }
  }
}

export interface BrightnessControlSettings extends JsonObject {
  device: string;
  brightness: number;
  tickSize: number;
  [key: string]: JsonValue;
}
