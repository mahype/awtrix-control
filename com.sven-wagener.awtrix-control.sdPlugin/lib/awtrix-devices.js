/**
 * AwtrixDevices class for managing AWTRIX devices in the Stream Deck plugin.
 * This class provides functionality for scanning, storing, and retrieving AWTRIX devices.
 */
class AwtrixDevices {
    constructor() {
        this.searchInProgress = false;
        this.searchAbortController = null;
    }

    /**
     * Initialize the device manager with the Stream Deck client
     * @param {Object} streamDeckClient - The Stream Deck client instance
     */
    initialize(streamDeckClient) {
        this.streamDeckClient = streamDeckClient;
    }

    /**
     * Get all saved devices from global settings
     * @returns {Promise<string[]>} Array of device IP addresses
     */
    async getDevices() {
        try {
            const globalSettings = await this.streamDeckClient.getGlobalSettings();
            return globalSettings.devices || [];
        } catch (error) {
            console.error("Error getting devices from global settings:", error);
            return [];
        }
    }

    /**
     * Save devices to global settings
     * @param {string[]} devices - Array of device IP addresses
     * @returns {Promise<boolean>} Success status
     */
    async saveDevices(devices) {
        try {
            // Get current global settings to avoid overwriting other settings
            const currentSettings = await this.streamDeckClient.getGlobalSettings();
            
            // Update devices property
            const updatedSettings = {
                ...currentSettings,
                devices: devices
            };
            
            // Save updated settings
            await this.streamDeckClient.setGlobalSettings(updatedSettings);
            console.log("Devices saved to globalSettings:", devices);
            return true;
        } catch (error) {
            console.error("Error saving devices to globalSettings:", error);
            return false;
        }
    }

    /**
     * Add a device to global settings
     * @param {string} deviceIp - Device IP address
     * @returns {Promise<boolean>} Success status
     */
    async addDevice(deviceIp) {
        try {
            const devices = await this.getDevices();
            
            // Check if device already exists
            if (!devices.includes(deviceIp)) {
                devices.push(deviceIp);
                return await this.saveDevices(devices);
            }
            
            return true; // Device already exists, no need to save
        } catch (error) {
            console.error("Error adding device:", error);
            return false;
        }
    }

    /**
     * Remove a device from global settings
     * @param {string} deviceIp - Device IP address
     * @returns {Promise<boolean>} Success status
     */
    async removeDevice(deviceIp) {
        try {
            const devices = await this.getDevices();
            const updatedDevices = devices.filter(ip => ip !== deviceIp);
            
            return await this.saveDevices(updatedDevices);
        } catch (error) {
            console.error("Error removing device:", error);
            return false;
        }
    }

    /**
     * Check if a device exists in global settings
     * @param {string} deviceIp - Device IP address
     * @returns {Promise<boolean>} True if device exists
     */
    async deviceExists(deviceIp) {
        const devices = await this.getDevices();
        return devices.includes(deviceIp);
    }

    /**
     * Get IP ranges to scan from global settings
     * @returns {Promise<string[]>} Array of IP addresses to scan
     */
    async getIpRangesToScan() {
        try {
            const globalSettings = await this.streamDeckClient.getGlobalSettings();
            console.log("Global settings for IP ranges:", globalSettings);
            
            // Fallback: If no IP addresses are configured, use the local network interfaces
            if (!globalSettings.ipAddresses || globalSettings.ipAddresses.length === 0) {
                console.log("No IP addresses configured, using fallback");
                // Return a default IP range as fallback (common home network)
                return ["192.168.1.1", "192.168.0.1", "10.0.0.1"];
            }
            
            return globalSettings.ipAddresses || [];
        } catch (error) {
            console.error("Error getting IP ranges from global settings:", error);
            // Return a default IP range as fallback
            return ["192.168.1.1", "192.168.0.1", "10.0.0.1"];
        }
    }

    /**
     * Wrapper function for scanning AWTRIX devices with progress display
     * @param {string[]} ips - Array of IP addresses
     * @param {function} progressCallback - Callback function for progress updates (0-100%)
     * @param {function} currentIpCallback - Callback function for updates of the currently scanned IP
     * @param {function} deviceFoundCallback - Callback function for found devices
     * @param {AbortController} abortController - AbortController for canceling the search
     * @returns {Promise<string[]>} - Array with found AWTRIX devices
     */
    async scanWithProgress(ips, progressCallback, currentIpCallback, deviceFoundCallback, abortController) {
        // Ensure ips is an array
        const ipArray = Array.isArray(ips) ? ips : [ips];
        const allDevices = [];
        
        // Calculate the total number of IPs to scan
        // We scan the entire subnet (1-254), so the total number is ipArray.length * 254
        const totalIps = ipArray.length * 254;
        let scannedIps = 0;
        
        // For each IP address
        for (const ip of ipArray) {
            // Extract the first three octets of the IP address
            const ipParts = ip.split('.');
            if (ipParts.length !== 4) {
                continue; // Skip invalid IP addresses
            }

            const subnet = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;

            // Scan all possible IP addresses in the subnet (1-254)
            for (let i = 1; i <= 254; i++) {
                // Check if the search was canceled
                if (abortController.signal.aborted) {
                    console.log("Search was canceled");
                    return allDevices;
                }
                
                const targetIp = `${subnet}.${i}`;
                
                // Update the currently scanned IP
                if (currentIpCallback) {
                    currentIpCallback(targetIp);
                }
                
                try {
                    // Debug info: Show which IP is being checked
                    console.log(`Checking IP: ${targetIp}`);
                    
                    // Try to reach the AWTRIX API
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1000ms timeout

                    // Link the local controller with the parent AbortController
                    abortController.signal.addEventListener('abort', () => controller.abort());

                    const response = await fetch(`http://${targetIp}/api/stats`, {
                        method: 'GET',
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    // Debug info: Show the response status
                    console.log(`Response from ${targetIp}: Status ${response.status}, OK: ${response.ok}`);
                    
                    if (response.ok) {
                        // Try to parse the response as JSON
                        try {
                            const data = await response.json();
                            
                            // Debug info: Show the response data
                            console.log(`Response data from ${targetIp}:`, data);
                            
                            // Check if it's an AWTRIX device
                            // AWTRIX devices typically have certain properties in the response
                            if (data && (data.AWTRIX !== undefined || data.version !== undefined || data.matrixType !== undefined)) {
                                // Debug info: Show that a device was found
                                console.log(`AWTRIX device found: ${targetIp}`);
                                allDevices.push(targetIp);
                                // Notify about found device
                                if (deviceFoundCallback) {
                                    deviceFoundCallback(targetIp);
                                }
                            } else {
                                console.log(`No AWTRIX device under ${targetIp} (invalid response data)`);
                            }
                        } catch (jsonError) {
                            console.log(`Error parsing JSON response from ${targetIp}: ${jsonError.message}`);
                        }
                    }
                } catch (error) {
                    // Debug info: Show the error
                    console.log(`Error at ${targetIp}: ${error.name} - ${error.message}`);
                    // Ignore errors - no AWTRIX device under this IP
                }
                
                // Update progress
                scannedIps++;
                if (progressCallback) {
                    const progress = Math.floor((scannedIps / totalIps) * 100);
                    progressCallback(progress);
                }
            }
        }

        return allDevices;
    }

    /**
     * Start scanning for AWTRIX devices
     * @param {Object} options - Scan options
     * @param {function} options.progressCallback - Progress update callback (0-100%)
     * @param {function} options.currentIpCallback - Current IP update callback
     * @param {function} options.deviceFoundCallback - Device found callback
     * @returns {Promise<{success: boolean, devices: string[], message: string}>} Scan result
     */
    async startScan(options = {}) {
        // If a search is already in progress, return error
        if (this.searchInProgress) {
            return {
                success: false,
                devices: [],
                message: "A scan is already in progress"
            };
        }
        
        // Set search in progress flag
        this.searchInProgress = true;
        
        // Create a new AbortController for this search
        this.searchAbortController = new AbortController();
        
        try {
            // Get IP ranges to scan
            const ipRanges = await this.getIpRangesToScan();
            
            if (!ipRanges || ipRanges.length === 0) {
                this.searchInProgress = false;
                return {
                    success: false,
                    devices: [],
                    message: "No IP ranges configured for scanning"
                };
            }
            
            // Start the scan
            const foundDevices = await this.scanWithProgress(
                ipRanges,
                options.progressCallback,
                options.currentIpCallback,
                options.deviceFoundCallback,
                this.searchAbortController
            );
            
            // Reset search in progress flag
            this.searchInProgress = false;
            
            // If search was aborted, return appropriate message
            if (this.searchAbortController.signal.aborted) {
                return {
                    success: false,
                    devices: foundDevices,
                    message: "Scan was cancelled"
                };
            }
            
            return {
                success: true,
                devices: foundDevices,
                message: `${foundDevices.length} AWTRIX device(s) found`
            };
        } catch (error) {
            console.error("Error scanning for devices:", error);
            this.searchInProgress = false;
            
            return {
                success: false,
                devices: [],
                message: `Error scanning for devices: ${error.message}`
            };
        }
    }

    /**
     * Cancel the current scan
     * @returns {boolean} True if scan was cancelled
     */
    cancelScan() {
        if (this.searchInProgress && this.searchAbortController) {
            this.searchAbortController.abort();
            this.searchInProgress = false;
            return true;
        }
        return false;
    }

    /**
     * Check if a scan is in progress
     * @returns {boolean} True if scan is in progress
     */
    isScanInProgress() {
        return this.searchInProgress;
    }

    /**
     * Populate a device select dropdown with saved devices
     * @param {HTMLElement} selectElement - The select element to populate
     * @param {string} [selectedDevice] - Optional device to select
     * @returns {Promise<void>}
     */
    async populateDeviceSelect(selectElement, selectedDevice = null) {
        try {
            const devices = await this.getDevices();
            
            // Clear current options, but keep the first option if it exists
            while (selectElement.children.length > 1) {
                selectElement.removeChild(selectElement.lastChild);
            }
            
            // Add devices as options
            devices.forEach(device => {
                // Check if device already exists as option
                let optionExists = false;
                for (const option of selectElement.children) {
                    if (option.value === device) {
                        optionExists = true;
                        break;
                    }
                }
                
                // Add device as option if it doesn't exist
                if (!optionExists) {
                    const option = document.createElement('option');
                    option.value = device;
                    option.textContent = device;
                    selectElement.appendChild(option);
                }
            });
            
            // Select the specified device or the first device if none is selected
            if (selectedDevice) {
                selectElement.value = selectedDevice;
            } else if (!selectElement.value && devices.length > 0) {
                selectElement.value = devices[0];
            }
            
            // Trigger change event
            selectElement.dispatchEvent(new Event('change'));
        } catch (error) {
            console.error("Error populating device select:", error);
        }
    }
}

// Create a singleton instance
const awtrixDevices = new AwtrixDevices();

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = awtrixDevices;
} else {
    window.awtrixDevices = awtrixDevices;
}
