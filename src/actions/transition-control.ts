import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";
import { Awtrix3 } from "../lib/awtrix3";

interface TransitionControlSettings extends JsonObject {
  device?: string;
  action?: string;
}

@action({ UUID: "com.sven-wagener.awtrix-control.transition-control" })
export class TransitionControl extends SingletonAction<TransitionControlSettings> {
  /**
   * Called when the action is started up.
   */
  override async onWillAppear(event: WillAppearEvent<TransitionControlSettings>): Promise<void> {
    streamDeck.logger.info("TransitionControl will appear:", event);
    
    // Get settings
    const settings = event.payload.settings;
    const device = settings.device || "";
    
    // Check if device is set
    if (!device) {
      return;
    }
    
    try {
      // Create Awtrix3 instance
      const awtrix = new Awtrix3(device);
      
      // Get current transition state
      const currentSettings = await awtrix.get<{ATRANS?: boolean}>("/api/settings");
      const isTransitionEnabled = currentSettings.ATRANS === true;
      
      // Set the appropriate icon based on the current state
      // If transitions are enabled, show the pause button (to pause them)
      // If transitions are disabled, show the play button (to resume them)
      await event.action.setImage(isTransitionEnabled ? "imgs/actions/awtrix-transition/key-pause" : "imgs/actions/awtrix-transition/key-play");
      
      streamDeck.logger.info(`Initial transition state for device ${device}: ${isTransitionEnabled ? "ENABLED" : "DISABLED"}`);
    } catch (error) {
      streamDeck.logger.error(`Error getting initial transition state for device ${device}: ${error}`);
    }
  }

  /**
   * Called when a key is pressed.
   */
  override async onKeyUp(event: KeyUpEvent<TransitionControlSettings>): Promise<void> {
    streamDeck.logger.info("TransitionControl key up:", event);

    // Get settings
    const settings = event.payload.settings;
    const device = settings.device || "";
    const action = settings.action || "toggle";

    // Check if device is set
    if (!device) {
      streamDeck.logger.error("No device selected");
      return;
    }

    try {
      // Create Awtrix3 instance
      const awtrix = new Awtrix3(device);
      
      // Get current transition state
      const currentSettings = await awtrix.get<{ATRANS?: boolean}>("/api/settings");
      const isTransitionEnabled = currentSettings.ATRANS === true;
      
      // Determine the new state based on the action
      let newState = isTransitionEnabled;
      
      if (action === "pause") {
        // Pause transitions by setting ATRANS to false
        newState = false;
      } else if (action === "resume") {
        // Resume transitions by setting ATRANS to true
        newState = true;
      } else if (action === "toggle") {
        // Toggle the ATRANS setting
        newState = !isTransitionEnabled;
      }
      
      // Apply the new state
      await awtrix.post("/api/settings", { ATRANS: newState });
      
      // Update the icon based on the new state
      // If transitions are now enabled, show the pause button (to pause them)
      // If transitions are now disabled, show the play button (to resume them)
      await event.action.setImage(newState ? "imgs/actions/awtrix-transition/key-pause" : "imgs/actions/awtrix-transition/key-play");
      
      streamDeck.logger.info(`Transitions ${newState ? "resumed" : "paused"} on ${device}`);
    } catch (error) {
      streamDeck.logger.error("Error controlling transitions:", error);
    }
  }
}
