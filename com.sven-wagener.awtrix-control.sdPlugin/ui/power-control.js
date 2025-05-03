document.addEventListener("DOMContentLoaded", function () {
    (async function () {
        const globalSettings = await SDPIComponents.streamDeckClient.getGlobalSettings();
        console.log("Global Settings in power control", globalSettings);
    })();
});

// Variable to track if a search is in progress and store the abort controller
let searchInProgress = false;
let searchAbortController = null;

/**
 * Wrapper function for scanning AWTRIX devices with progress display
 * @param {string[]} ips - Array of IP addresses
 * @param {function} progressCallback - Callback function for progress updates (0-100%)
 * @param {function} currentIpCallback - Callback function for updates of the currently scanned IP
 * @param {function} deviceFoundCallback - Callback function for found devices
 * @param {AbortController} abortController - AbortController for canceling the search
 * @returns {Promise<string[]>} - Array with found AWTRIX devices
 */
async function scanWithProgress(ips, progressCallback, currentIpCallback, deviceFoundCallback, abortController) {
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
            currentIpCallback(targetIp);
            
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
                            deviceFoundCallback(targetIp);
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
            const progress = Math.floor((scannedIps / totalIps) * 100);
            progressCallback(progress);
        }
    }

    return allDevices;
}

/**
 * Function to search for AWTRIX devices in the network
 * Uses the IP addresses from globalSettings.ipAddresses
 */
async function searchForDevices(event) {
    try {
        // Get the search button
        const searchButton = document.getElementById('searchDevicesBtn');
        
        // If a search is already in progress, cancel it
        if (searchInProgress && searchAbortController) {
            searchAbortController.abort();
            searchInProgress = false;
            
            // Re-enable the button and reset text
            if (searchButton) {
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
        
        // Set search in progress flag
        searchInProgress = true;
        
        // Create a new AbortController for this search
        searchAbortController = new AbortController();
        
        // Update button during search
        if (searchButton) {
            searchButton.disabled = false; // Keep enabled so it can be clicked to cancel
            searchButton.textContent = 'Cancel Search (0%)';
        }
        
        // Show scan status
        const scanStatus = document.getElementById('scanStatus');
        if (scanStatus) {
            scanStatus.style.display = 'block';
        }
        
        // Hide terminal output
        const terminalOutput = document.getElementById('terminalOutput');
        if (terminalOutput) {
            terminalOutput.style.display = 'none';
        }

        // Get the global settings to access the IP addresses
        const globalSettings = await SDPIComponents.streamDeckClient.getGlobalSettings();

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
            updateDeviceDropdown(ip);
        };
        
        // Function to update device dropdown
        const updateDeviceDropdown = (ip) => {
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

        // Use the wrapper function to show progress
        const foundDevices = await scanWithProgress(
            globalSettings.ipAddresses, 
            updateProgress, 
            updateCurrentIp, 
            deviceFound,
            searchAbortController
        );
        
        // Reset search in progress flag
        searchInProgress = false;
        
        console.log("Found AWTRIX devices:", foundDevices);

        // Re-enable the button
        if (searchButton) {
            searchButton.disabled = false;
            searchButton.textContent = 'Search for Devices';
        }

        // Hide scan status
        if (scanStatus) {
            scanStatus.style.display = 'none';
        }

        // If search was aborted, end function here
        if (searchAbortController.signal.aborted) {
            return;
        }

        // If no devices found, show alert and end function
        if (foundDevices.length === 0) {
            alert("No AWTRIX devices found.");
            return;
        }

        // Show confirm dialog with results
        const confirmMessage = `${foundDevices.length} AWTRIX device(s) found. Do you want to save these devices?`;
        const shouldSaveDevices = confirm(confirmMessage);
        
        // If user confirms, save devices
        if (shouldSaveDevices) {
            try {
                // Get current global settings to avoid overwriting other settings
                const currentSettings = await SDPIComponents.streamDeckClient.getGlobalSettings();
                
                // Update devices property
                const updatedSettings = {
                    ...currentSettings,
                    devices: foundDevices
                };
                
                // Save updated settings
                await SDPIComponents.streamDeckClient.setGlobalSettings(updatedSettings);
                console.log("Devices saved to globalSettings:", foundDevices);
                
                // Update device list in form with all found devices
                const deviceSelect = document.querySelector('sdpi-select[setting="device"]');
                if (deviceSelect && foundDevices.length > 0) {
                    // Clear current list, but keep the first option (if any)
                    while (deviceSelect.children.length > 1) {
                        deviceSelect.removeChild(deviceSelect.lastChild);
                    }
                    
                    // Add all found devices
                    foundDevices.forEach(ip => {
                        let optionExists = false;
                        
                        // Check if IP already exists as option
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
                    });
                    
                    // Select the first found device if none is selected
                    if (!deviceSelect.value && foundDevices.length > 0) {
                        deviceSelect.value = foundDevices[0];
                        deviceSelect.dispatchEvent(new Event('change'));
                    }
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
        
        // Update scan status with error message and hide it after 3 seconds
        const scanStatus = document.getElementById('scanStatus');
        if (scanStatus) {
            scanStatus.innerHTML = `<div class="found-device" style="color: #ff5555;">Error: ${error.message}</div>`;
            setTimeout(() => {
                scanStatus.style.display = 'none';
            }, 3000);
        }
    }
}