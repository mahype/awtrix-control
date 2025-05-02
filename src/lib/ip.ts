import os from 'os';

/**
 * Gets all IP addresses of the computer.
 * @returns An array of all IPv4 addresses.
 */
// Passe die Funktion an, um nur die IP-Adressen in einem Array zurückzugeben
// Aktualisiere die Funktion, um TypeScript-Typen zu verwenden
function getIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const ipAddresses: string[] = [];

  for (const netInterface of Object.values(interfaces)) {
    if (netInterface) {
      netInterface
        .filter(iface => iface && !iface.internal && iface.family === 'IPv4') // Filtere nur IPv4-Adressen
        .forEach(iface => ipAddresses.push(iface.address));
    }
  }

  return ipAddresses;
}

export default getIpAddresses;