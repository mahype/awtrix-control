document.addEventListener("DOMContentLoaded", function () {
    (async function () {
        const globalSettings = await SDPIComponents.streamDeckClient.getGlobalSettings();
        console.log("Global Settings in power control", globalSettings);
    })();
});

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
    // Wir scannen das gesamte Subnetz (1-254), daher ist die Gesamtzahl ipArray.length * 254
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
                // Debug-Info: Zeige an, welche IP gerade geprüft wird
                console.log(`Prüfe IP: ${targetIp}`);
                
                // Versuche, die AWTRIX-API zu erreichen
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000); // 1000ms Timeout

                const response = await fetch(`http://${targetIp}/api/stats`, {
                    method: 'GET',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Debug-Info: Zeige den Status der Antwort an
                console.log(`Antwort von ${targetIp}: Status ${response.status}, OK: ${response.ok}`);
                
                if (response.ok) {
                    // Versuche, die Antwort als JSON zu parsen
                    try {
                        const data = await response.json();
                        
                        // Debug-Info: Zeige die Antwortdaten an
                        console.log(`Antwortdaten von ${targetIp}:`, data);
                        
                        // Überprüfe, ob es sich um ein AWTRIX-Gerät handelt
                        // AWTRIX-Geräte haben typischerweise bestimmte Eigenschaften in der Antwort
                        if (data && (data.AWTRIX !== undefined || data.version !== undefined || data.matrixType !== undefined)) {
                            // Debug-Info: Zeige an, dass ein Gerät gefunden wurde
                            console.log(`AWTRIX-Gerät gefunden: ${targetIp}`);
                            allDevices.push(targetIp);
                            // Benachrichtige über gefundenes Gerät
                            deviceFoundCallback(targetIp);
                        } else {
                            console.log(`Kein AWTRIX-Gerät unter ${targetIp} (ungültige Antwortdaten)`);
                        }
                    } catch (jsonError) {
                        console.log(`Fehler beim Parsen der JSON-Antwort von ${targetIp}: ${jsonError.message}`);
                    }
                }
            } catch (error) {
                // Debug-Info: Zeige den Fehler an
                console.log(`Fehler bei ${targetIp}: ${error.name} - ${error.message}`);
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
            // Wir müssen nur den Inhalt des ticker-content-Elements aktualisieren
            const tickerContent = scanStatus.querySelector('.ticker-content');
            if (tickerContent) {
                tickerContent.innerHTML = '<span style="color: #ff5252;">S</span><span style="color: #ffb142;">c</span><span style="color: #ffeb3b;">a</span><span style="color: #66bb6a;">n</span><span style="color: #29b6f6;">n</span><span style="color: #7e57c2;">i</span><span style="color: #ec407a;">n</span><span style="color: #42a5f5;">g</span>: <span id="currentIp">-</span>';
            }
        }
        
        // Verstecke den Terminal-Output, da wir ihn nicht mehr benötigen
        const terminalOutput = document.getElementById('terminalOutput');
        if (terminalOutput) {
            terminalOutput.style.display = 'none';
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
            
            // Aktualisiere den Scan-Status mit der gefundenen IP
            const scanStatus = document.getElementById('scanStatus');
            if (scanStatus) {
                // Füge das neueste Gerät hinzu
                const deviceEntry = document.createElement('div');
                deviceEntry.className = 'found-device';
                deviceEntry.textContent = ip;
                scanStatus.appendChild(deviceEntry);
            }
            
            // Aktualisiere das Device-Dropdown
            updateDeviceDropdown(ip);
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

        // Re-enable the button
        if (searchButton) {
            searchButton.disabled = false;
            searchButton.textContent = 'Search for Devices';
        }

        // Entferne den Scan-Status
        if (scanStatus) {
            scanStatus.style.display = 'none';
        }

        // Wenn keine Geräte gefunden wurden, zeige nur einen Alert an und beende die Funktion
        if (foundDevices.length === 0) {
            alert("Keine AWTRIX-Geräte gefunden.");
            return;
        }

        // Zeige einen Confirm-Dialog mit den Ergebnissen
        const confirmMessage = `${foundDevices.length} AWTRIX-Gerät(e) gefunden. Möchten Sie diese Geräte übernehmen?`;
        const shouldSaveDevices = confirm(confirmMessage);
        
        // Wenn der Benutzer den Dialog bestätigt, speichere die Geräte
        if (shouldSaveDevices) {
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
                
                // Aktualisiere die Device-Liste im Formular mit allen gefundenen Geräten
                const deviceSelect = document.querySelector('sdpi-select[setting="device"]');
                if (deviceSelect && foundDevices.length > 0) {
                    // Leere die aktuelle Liste, behalte aber die erste Option (falls vorhanden)
                    while (deviceSelect.children.length > 1) {
                        deviceSelect.removeChild(deviceSelect.lastChild);
                    }
                    
                    // Füge alle gefundenen Geräte hinzu
                    foundDevices.forEach(ip => {
                        let optionExists = false;
                        
                        // Prüfe, ob die IP bereits als Option existiert
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
                    });
                    
                    // Wähle das erste gefundene Gerät aus, wenn noch keines ausgewählt ist
                    if (!deviceSelect.value && foundDevices.length > 0) {
                        deviceSelect.value = foundDevices[0];
                        deviceSelect.dispatchEvent(new Event('change'));
                    }
                }
            } catch (error) {
                console.error("Error saving devices to globalSettings:", error);
                alert("Fehler beim Speichern der Geräte: " + error.message);
            }
        } else {
            console.log("User cancelled saving devices");
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
        
        // Aktualisiere den Scan-Status mit der Fehlermeldung und entferne ihn nach 3 Sekunden
        const scanStatus = document.getElementById('scanStatus');
        if (scanStatus) {
            scanStatus.innerHTML = `<div class="found-device" style="color: #ff5555;">Fehler: ${error.message}</div>`;
            setTimeout(() => {
                scanStatus.style.display = 'none';
            }, 3000);
        }
    }
}