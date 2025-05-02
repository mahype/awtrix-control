import streamDeck, { LogLevel } from "@elgato/streamdeck"; 
 
import { PowerControl } from "./actions/power-control"; 
import getIpAddresses from "./lib/ip"; 
 
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
 
// Register the increment action. 
streamDeck.actions.registerAction(new PowerControl()); 
 
streamDeck.connect();