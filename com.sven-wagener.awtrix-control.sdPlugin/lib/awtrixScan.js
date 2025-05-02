/**
 * Scannt ein Subnetz nach AWTRIX-Geräten
 * @param {string|string[]} ips - Eine oder mehrere IP-Adressen, deren Subnetze durchsucht werden sollen
 * @returns {Promise<Array>} - Ein Array mit gefundenen AWTRIX-Geräten
 */
async function scanForAwtrixDevices(ips) {
    // Stelle sicher, dass ips ein Array ist
    const ipArray = Array.isArray(ips) ? ips : [ips];
    const allDevices = [];

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
                }
            } catch (error) {
                // Ignoriere Fehler - kein AWTRIX-Gerät unter dieser IP
                continue;
            }
        }
    }

    return allDevices;
}
