document.addEventListener("DOMContentLoaded", function () {
    (async function () {
        // Initialize awtrixDevices with the streamDeckClient
        awtrixDevices.initialize(SDPIComponents.streamDeckClient);
        
        const globalSettings = await SDPIComponents.streamDeckClient.getGlobalSettings();
        console.log("Global Settings in power control", globalSettings);
        
        // Populate device select with saved devices
        const deviceSelect = document.querySelector('sdpi-select[setting="device"]');
        if (deviceSelect) {
            await awtrixDevices.populateDeviceSelect(deviceSelect);
        }
    })();
});

/**
 * Function to search for AWTRIX devices in the network
 * This function is called from the HTML via the onclick event
 */
async function searchForDevices(event) {
    try {
        // Get UI elements
        const searchButton = document.getElementById('searchDevicesBtn');
        const scanStatus = document.getElementById('scanStatus');
        const terminalOutput = document.getElementById('terminalOutput');
        const ipRangesElement = document.getElementById('ipRanges');
        
        // If a scan is already in progress, cancel it
        if (awtrixDevices.isScanInProgress()) {
            const cancelled = awtrixDevices.cancelScan();
            
            if (cancelled && searchButton) {
                searchButton.disabled = false;
                searchButton.textContent = 'Search for Devices';
            }
            
            // Hide the scan status
            const scanStatus = document.getElementById('scanStatus');
            if (scanStatus) {
                scanStatus.style.display = 'none';
            }
            
            console.log("Search cancelled by user");
            return;
        }
        
        // Update button during search
        if (searchButton) {
            searchButton.disabled = false; // Keep enabled so it can be clicked to cancel
            searchButton.textContent = 'Cancel Search (0%)';
        }
        
        // Show scan status
        const scanStatus = document.getElementById('scanStatus');
        if (scanStatus) {
            scanStatus.style.display = 'block';
            
            // Clear previous found devices
            const foundDevices = scanStatus.querySelectorAll('.found-device');
            foundDevices.forEach(device => device.remove());
        }
        
        // Hide terminal output
        const terminalOutput = document.getElementById('terminalOutput');
        if (terminalOutput) {
            terminalOutput.style.display = 'none';
        }

        // Get the global settings to access the IP addresses
        const globalSettings = await SDPIComponents.streamDeckClient.getGlobalSettings();

        // Display IP ranges that will be scanned
        const ipRangesElement = document.getElementById('ipRanges');
        if (ipRangesElement && globalSettings.ipAddresses && globalSettings.ipAddresses.length > 0) {
            const subnets = globalSettings.ipAddresses.map(ip => {
                const parts = ip.split('.');
                return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.*` : ip;
            });
            ipRangesElement.textContent = `IP range: ${subnets.join(', ')}`;
            ipRangesElement.style.marginBottom = '8px';
        }

        // Progress update callback
        const updateProgress = (progress) => {
            if (searchButton) {
                searchButton.textContent = `Cancel Search (${progress}%)`;
            }
        };
        
        // Current IP update callback
        const updateCurrentIp = (ip) => {
            const currentIpElement = document.getElementById('currentIp');
            if (currentIpElement) {
                currentIpElement.textContent = ip;
            }
        };
        
        // Counter for found devices
        let deviceCount = 0;
        
        // Device found callback
        const deviceFound = (ip) => {
            // Count found devices
            deviceCount++;
            
            // Update scan status with found IP
            const scanStatus = document.getElementById('scanStatus');
            if (scanStatus) {
                // Add the new device
                const deviceEntry = document.createElement('div');
                deviceEntry.className = 'found-device';
                deviceEntry.textContent = ip;
                scanStatus.appendChild(deviceEntry);
            }
            
            // Update device dropdown
            const deviceSelect = document.querySelector('sdpi-select[setting="device"]');
            if (deviceSelect) {
                // Check if IP already exists as option
                let optionExists = false;
                for (const option of deviceSelect.children) {
                    if (option.value === ip) {
                        optionExists = true;
                        break;
                    }
                }
                
                // Add IP as option if it doesn't exist
                if (!optionExists) {
                    const option = document.createElement('option');
                    option.value = ip;
                    option.textContent = ip;
                    deviceSelect.appendChild(option);
                }
                
                // Select the IP
                deviceSelect.value = ip;
                deviceSelect.dispatchEvent(new Event('change'));
            }
        };

        // Start the scan with our callbacks
        const result = await awtrixDevices.startScan({
            progressCallback: updateProgress,
            currentIpCallback: updateCurrentIp,
            deviceFoundCallback: deviceFound
        });
        
        // Re-enable the button
        if (searchButton) {
            searchButton.disabled = false;
            searchButton.textContent = 'Search for Devices';
        }

        // Hide scan status
        if (scanStatus) {
            scanStatus.style.display = 'none';
        }

        // If scan was not successful, show alert and end function
        if (!result.success) {
            if (result.message !== "Scan was cancelled") {
                alert(result.message);
            }
            return;
        }

        // If no devices found, show alert and end function
        if (result.devices.length === 0) {
            alert("No AWTRIX devices found.");
            return;
        }

        // Show confirm dialog with results
        const confirmMessage = `${result.devices.length} AWTRIX device(s) found. Do you want to save these devices?`;
        const shouldSaveDevices = confirm(confirmMessage);
        
        // If user confirms, save devices
        if (shouldSaveDevices) {
            try {
                // Save devices
                const saved = await awtrixDevices.saveDevices(result.devices);
                
                if (saved) {
                    console.log("Devices saved to globalSettings:", result.devices);
                    
                    // Update device list in form with all found devices
                    const deviceSelect = document.querySelector('sdpi-select[setting="device"]');
                    if (deviceSelect) {
                        await awtrixDevices.populateDeviceSelect(deviceSelect, result.devices[0]);
                    }
                } else {
                    throw new Error("Failed to save devices");
                }
            } catch (error) {
                console.error("Error saving devices to globalSettings:", error);
                alert("Error saving devices: " + error.message);
            }
        } else {
            console.log("User cancelled saving devices");
        }
    } catch (error) {
        console.error("Error searching for devices:", error);
        alert("Error searching for devices: " + error.message);
        
        // Re-enable the button
        const searchButton = document.getElementById('searchDevicesBtn');
        if (searchButton) {
            searchButton.disabled = false;
            searchButton.textContent = 'Search for Devices';
        }
    }
}