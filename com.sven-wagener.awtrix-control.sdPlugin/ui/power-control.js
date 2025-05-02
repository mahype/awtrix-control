document.addEventListener("DOMContentLoaded", function () {
    (async function () {
        const globalSettings = await SDPIComponents.streamDeckClient.getGlobalSettings();
        console.log("Global Settings in power control", globalSettings);
    })();
});

/**
 * Function to open the general settings window
 */
function openGeneralSettings(event) {
    // Implementation of openGeneralSettings
}

/**
 * Wrapper-Funktion für scanForAwtrixDevices mit Fortschrittsanzeige
 * @param {string[]} ips - Array von IP-Adressen
 * @param {function} progressCallback - Callback-Funktion für Fortschrittsupdates (0-100%)
 * @param {function} currentIpCallback - Callback-Funktion für Updates der aktuell gescannten IP
 * @param {function} deviceFoundCallback - Callback-Funktion für gefundene Geräte
 * @returns {Promise<string[]>} - Array mit gefundenen AWTRIX-Geräten
 */
async function scanWithProgress(ips, progressCallback, currentIpCallback, deviceFoundCallback) {
    // Stelle sicher, dass ips ein Array ist
    const ipArray = Array.isArray(ips) ? ips : [ips];
    const allDevices = [];
    
    // Berechne die Gesamtzahl der zu scannenden IPs
    const totalIps = ipArray.length * 254;
    let scannedIps = 0;
    
    // Für jede IP-Adresse
    for (const ip of ipArray) {
        // Extrahiere die ersten drei Oktette der IP-Adresse
        const ipParts = ip.split('.');
        if (ipParts.length !== 4) {
            continue; // Überspringe ungültige IP-Adressen
        }

        const subnet = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;

        // Durchsuche alle möglichen IP-Adressen im Subnetz (1-254)
        for (let i = 1; i <= 254; i++) {
            const targetIp = `${subnet}.${i}`;
            
            // Aktualisiere die aktuell gescannte IP
            currentIpCallback(targetIp);
            
            try {
                // Versuche, die AWTRIX-API zu erreichen
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms Timeout

                const response = await fetch(`http://${targetIp}/api/stats`, {
                    method: 'GET',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    allDevices.push(targetIp);
                    // Benachrichtige über gefundenes Gerät
                    deviceFoundCallback(targetIp);
                }
            } catch (error) {
                // Ignoriere Fehler - kein AWTRIX-Gerät unter dieser IP
            }
            
            // Aktualisiere den Fortschritt
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
        // Disable the button during search
        const searchButton = document.getElementById('searchDevicesBtn');
        if (searchButton) {
            searchButton.disabled = true;
            searchButton.textContent = 'Suche... 0%';
        }
        
        // Zeige den Scan-Status an
        const scanStatus = document.getElementById('scanStatus');
        if (scanStatus) {
            scanStatus.style.display = 'block';
        }
        
        // Zeige den Terminal-Output an und leere ihn
        const terminalOutput = document.getElementById('terminalOutput');
        if (terminalOutput) {
            terminalOutput.style.display = 'block';
            terminalOutput.innerHTML = '<div class="found-device">Suche...</div>';
        }

        // Get the global settings to access the IP addresses
        const globalSettings = await SDPIComponents.streamDeckClient.getGlobalSettings();

        // Definiere die Callback-Funktion für Fortschrittsupdates
        const updateProgress = (progress) => {
            if (searchButton) {
                searchButton.textContent = `Suche... ${progress}%`;
            }
        };
        
        // Definiere die Callback-Funktion für Updates der aktuell gescannten IP
        const updateCurrentIp = (ip) => {
            const currentIpElement = document.getElementById('currentIp');
            if (currentIpElement) {
                currentIpElement.textContent = ip;
            }
        };
        
        // Zähler für gefundene Geräte
        let deviceCount = 0;
        
        // Definiere die Callback-Funktion für gefundene Geräte
        const deviceFound = (ip) => {
            // Zähle die gefundenen Geräte
            deviceCount++;
            
            // Aktualisiere den Terminal-Output
            const terminalOutput = document.getElementById('terminalOutput');
            if (terminalOutput) {
                terminalOutput.innerHTML = `<div class="found-device">Gefunden: ${deviceCount}</div>`;
                
                // Füge das neueste Gerät hinzu
                const deviceEntry = document.createElement('div');
                deviceEntry.className = 'found-device';
                deviceEntry.textContent = ip;
                terminalOutput.appendChild(deviceEntry);
                
                // Aktualisiere das Device-Dropdown
                updateDeviceDropdown(ip);
            }
        };
        
        // Funktion zum Aktualisieren des Device-Dropdowns
        const updateDeviceDropdown = (ip) => {
            const deviceSelect = document.querySelector('sdpi-select[setting="device"]');
            if (deviceSelect) {
                // Prüfe, ob die IP bereits als Option existiert
                let optionExists = false;
                for (const option of deviceSelect.children) {
                    if (option.value === ip) {
                        optionExists = true;
                        break;
                    }
                }
                
                // Füge die IP als Option hinzu, wenn sie noch nicht existiert
                if (!optionExists) {
                    const option = document.createElement('option');
                    option.value = ip;
                    option.textContent = ip;
                    deviceSelect.appendChild(option);
                }
                
                // Wähle die IP aus
                deviceSelect.value = ip;
                deviceSelect.dispatchEvent(new Event('change'));
            }
        };

        // Verwende die Wrapper-Funktion, um den Fortschritt anzuzeigen
        const foundDevices = await scanWithProgress(
            globalSettings.ipAddresses, 
            updateProgress, 
            updateCurrentIp, 
            deviceFound
        );
        
        console.log("Found AWTRIX devices:", foundDevices);

        // Speichere die gefundenen Geräte in den globalSettings
        try {
            // Hole aktuelle globalSettings, um andere Einstellungen nicht zu überschreiben
            const currentSettings = await SDPIComponents.streamDeckClient.getGlobalSettings();
            
            // Aktualisiere die devices-Eigenschaft
            const updatedSettings = {
                ...currentSettings,
                devices: foundDevices
            };
            
            // Speichere die aktualisierten Einstellungen
            await SDPIComponents.streamDeckClient.setGlobalSettings(updatedSettings);
            console.log("Devices saved to globalSettings:", foundDevices);
        } catch (error) {
            console.error("Error saving devices to globalSettings:", error);
        }

        // Re-enable the button
        if (searchButton) {
            searchButton.disabled = false;
            searchButton.textContent = 'Search for Devices';
        }
        
        // Aktualisiere den Terminal-Output mit dem Endergebnis
        if (terminalOutput) {
            if (foundDevices.length > 0) {
                terminalOutput.innerHTML = `<div class="found-device">Fertig: ${foundDevices.length} gefunden</div>`;
                
                // Zeige alle gefundenen Geräte an
                foundDevices.forEach(ip => {
                    const deviceEntry = document.createElement('div');
                    deviceEntry.className = 'found-device';
                    deviceEntry.textContent = ip;
                    terminalOutput.appendChild(deviceEntry);
                });
            } else {
                terminalOutput.innerHTML = '<div class="found-device" style="color: #ff5555;">Keine Geräte gefunden</div>';
            }
        }
        
        // Verstecke den Scan-Status
        if (scanStatus) {
            scanStatus.style.display = 'none';
        }

        // Show a message with the results
        if (foundDevices.length > 0) {
            alert(`${foundDevices.length} AWTRIX-Gerät(e) gefunden.`);
        } else {
            alert("Keine AWTRIX-Geräte gefunden.");
        }
    } catch (error) {
        console.error("Error searching for devices:", error);
        alert("Fehler bei der Gerätesuche: " + error.message);
        
        // Re-enable the button
        const searchButton = document.getElementById('searchDevicesBtn');
        if (searchButton) {
            searchButton.disabled = false;
            searchButton.textContent = 'Search for Devices';
        }
        
        // Aktualisiere den Terminal-Output mit der Fehlermeldung
        const terminalOutput = document.getElementById('terminalOutput');
        if (terminalOutput) {
            terminalOutput.innerHTML = `<div class="found-device" style="color: #ff5555;">Fehler: ${error.message}</div>`;
        }
        
        // Verstecke den Scan-Status
        const scanStatus = document.getElementById('scanStatus');
        if (scanStatus) {
            scanStatus.style.display = 'none';
        }
    }
}