import streamDeck, { action, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/streamdeck";

import getIpAddresses from "../lib/ip";

/**
 * Action to control the power statrte of an Awtrix device.
 */
@action({ UUID: "com.sven-wagener.awtrix-control.power" })
export class PowerControl extends SingletonAction<PowerControlSettings> {
  /**
   * Called when the action appears on the Stream Deck.
   *
   * @param ev The event.
   */
  override async onWillAppear(ev: WillAppearEvent<PowerControlSettings>): Promise<void> {
    // Log IP addresses when the action appears
    streamDeck.settings.getGlobalSettings().then((settings) => {
      const ipAddresses = settings.ipAddresses;
      streamDeck.logger.info("IP Addresses:", ipAddresses);
    });
  }

  /**
   * Called when the action's key is pressed.
   *
   * @param ev The event.
   */
  override async onKeyUp(ev: KeyUpEvent<PowerControlSettings>): Promise<void> {
    // Implementation will go here
  }
}

/**
 * Settings for the PowerControl action.
 */
export interface PowerControlSettings extends JsonObject {
  /**
   * The host of the Awtrix device.
   */
  host: string;

  /**
   * Index signature for JsonObject compatibility
   */
  [key: string]: JsonValue;
}