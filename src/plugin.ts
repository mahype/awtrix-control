import streamDeck, { LogLevel } from "@elgato/streamdeck"; 
 
import { PowerControl } from "./actions/power-control"; 
import { TemperatureSensor } from "./actions/temperature-sensor";
import { HumiditySensor } from "./actions/humidity-sensor";
import { LuxSensor } from "./actions/lux-sensor";
import { BatterySensor } from "./actions/battery-sensor";
import { WifiSensor } from "./actions/wifi-sensor";
import { NextAppControl } from "./actions/nextapp-control";
import { PreviousAppControl } from "./actions/previousapp-control";
import { NotifyDismissControl } from "./actions/notify-dismiss-control";
import { OverlayEffectControl } from "./actions/overlay-effect-control";
import { LiveViewControl } from "./actions/liveview-control";
import { SettingsControl } from "./actions/settings-control";
import { TransitionControl } from "./actions/transition-control";
import getIpAddresses from "./lib/ip"; 
import { BrightnessControl } from "./actions/brightness-control";
import { CustomAppControl } from "./actions/custom-app-control";
import { NotifyControl } from "./actions/notify-control";
 
// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information 
streamDeck.logger.setLevel(LogLevel.TRACE); 

const ipAddresses = getIpAddresses();

streamDeck.logger.info("Found IP Addresses from machine:", ipAddresses);

streamDeck.settings.getGlobalSettings().then((settings) => {
  streamDeck.settings.setGlobalSettings({ 
    ipAddresses: ipAddresses,
    devices: settings.devices,
  });
}); 
 
// Register all actions
streamDeck.actions.registerAction(new PowerControl()); 
streamDeck.actions.registerAction(new TemperatureSensor());
streamDeck.actions.registerAction(new HumiditySensor());
streamDeck.actions.registerAction(new LuxSensor());
streamDeck.actions.registerAction(new BatterySensor());
streamDeck.actions.registerAction(new WifiSensor());
streamDeck.actions.registerAction(new NextAppControl());
streamDeck.actions.registerAction(new PreviousAppControl());
streamDeck.actions.registerAction(new NotifyDismissControl());
streamDeck.actions.registerAction(new OverlayEffectControl());
streamDeck.actions.registerAction(new BrightnessControl());
streamDeck.actions.registerAction(new LiveViewControl());
streamDeck.actions.registerAction(new SettingsControl());
streamDeck.actions.registerAction(new TransitionControl());
streamDeck.actions.registerAction(new CustomAppControl());
streamDeck.actions.registerAction(new NotifyControl());
 
streamDeck.connect();