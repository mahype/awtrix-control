# AWTRIX Stream Deck Plugin

![AWTRIX Stream Deck Plugin](com.sven-wagener.awtrix-control.sdPlugin/imgs/plugin/icon.svg)

A Stream Deck plugin for controlling and monitoring your AWTRIX 3 devices directly from your Elgato Stream Deck.

## Features

The AWTRIX Stream Deck Plugin offers the following functions:

### Control Functions
- **Power Control**: Turn your AWTRIX device on or off
- **Brightness Control**: Adjust brightness (also supports Stream Deck Encoder)
- **Next App**: Switch to the next app
- **Previous App**: Switch to the previous app
- **Transition Control**: Pause or resume transitions between apps
- **Dismiss Notification**: Close the current notification

### Sensor Data
- **Temperature Sensor**: Display temperature
- **Humidity Sensor**: Display humidity
- **Lux Sensor**: Display light intensity
- **Battery Sensor**: Display battery level
- **WiFi Signal Sensor**: Display WiFi signal strength

### Custom Content
- **Custom App**: Create and display a custom app
- **Notify**: Send a notification to your AWTRIX device
- **Overlay Effect**: Display an overlay effect on your AWTRIX device

### Additional Functions
- **LiveView**: Open the live view of your AWTRIX display
- **Settings**: Open the settings page of your AWTRIX device

## Installation

### Method 1: Installation via Plugin File (recommended)

1. Download the latest version of the plugin from the [GitHub Releases page](https://github.com/mahype/awtrix-control/releases)
2. Double-click the downloaded `.streamDeckPlugin` file
3. Follow the instructions in the Stream Deck installer
4. The plugin should now be available in your Stream Deck software

### Method 2: Manual Installation from Source Code

#### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)
- [Elgato Stream Deck Software](https://www.elgato.com/en/downloads)

#### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/mahype/awtrix-control.git
   cd awtrix-control
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. For development, you can use watch mode, which automatically rebuilds the plugin and restarts the Stream Deck when changes are made:
   ```bash
   npm run watch
   ```

#### Creating a Plugin File

To create a `.streamDeckPlugin` file for distribution, you can use the Elgato CLI tool:

1. Install the Elgato CLI tool globally (if not already installed):
   ```bash
   npm install -g @elgato/cli
   ```

2. Navigate to the project directory and run the following command:
   ```bash
   streamdeck plugin:build
   ```

3. The created `.streamDeckPlugin` file can be found in the project directory

## Usage

After installation, you can add the various AWTRIX actions to your Stream Deck:

1. Open the Stream Deck software
2. Drag one of the AWTRIX actions from the "AWTRIX Control" category to an empty slot on your Stream Deck
3. Configure the action in the Property Inspector by entering the IP address of your AWTRIX device
4. Save the settings and enjoy controlling your AWTRIX device

## Configuration

Each action can be individually configured. Most actions require at least the IP address of your AWTRIX device. The plugin offers an automatic network scan function to find AWTRIX devices on your network.

## Development

The plugin is developed with TypeScript and the official Elgato Stream Deck SDK. The project structure follows best practices for Stream Deck plugins:

- `src/`: TypeScript source code
- `com.sven-wagener.awtrix-control.sdPlugin/`: Plugin directory
  - `bin/`: Compiled JavaScript files
  - `imgs/`: Icons and images
  - `lib/`: Libraries
  - `ui/`: HTML files for Property Inspector
  - `manifest.json`: Plugin manifest

### Resources

For development, the following resources are helpful:

- AWTRIX 3 GitHub: [https://github.com/Blueforcer/awtrix3](https://github.com/Blueforcer/awtrix3)
- [Elgato Stream Deck SDK Documentation](https://developer.elgato.com/documentation/stream-deck/sdk/overview/)
- [Stream Deck SDK JavaScript API](https://developer.elgato.com/documentation/stream-deck/sdk/javascript-api/)
- [Stream Deck SDK Property Inspector](https://developer.elgato.com/documentation/stream-deck/sdk/property-inspector/)
- [Stream Deck SDK GitHub Repository](https://github.com/elgatosf/streamdeck-sdk)
- [SDPI Components Documentation](https://sdpi-components.dev/docs/getting-started/get-started)
- [SDPI Components GitHub Repository](https://github.com/elgatosf/streamdeck-sdpi-components)

## Acknowledgements

This plugin would not be possible without the excellent work of [Blueforcer](https://github.com/Blueforcer), the developer of the AWTRIX software. A big thank you for developing this fantastic LED matrix platform and providing a comprehensive API.

- AWTRIX 3 GitHub: [https://github.com/Blueforcer/awtrix3](https://github.com/Blueforcer/awtrix3)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for more information.

## Support

If you have questions or issues, you can create an [issue on GitHub](https://github.com/mahype/awtrix-control/issues).
