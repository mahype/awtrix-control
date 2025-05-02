/**
 * Awtrix3 class to interact with the Awtrix3 HTTP API.
 *
 * @see https://blueforcer.github.io/awtrix3/#/api
 */
class Awtrix3 {
  /**
   * Constructor of the Awtrix3 class.
   *
   * @param {*} host
   */
  constructor(host) {
    this.host = host;
  }

  /**
   * Get data from the Awtrix3 API.
   *
   * @param {*} url
   *
   * @returns A promise with the response.
   */
  async get(url) {
    const endpoint = "http://" + this.host + url;

    return fetch(endpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Post data to the Awtrix3 API.
   *
   * @param {*} url
   * @param {*} data
   *
   * @returns A promise with the response.
   */
  async post(url, data) {
    const endpoint = "http://" + this.host + url;

    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  /**
   * Get the stats from the Awtrix3 API.
   * @returns
   */
  async getStats() {
    const response = await this.get("/api/stats");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Checks if the device is reachable.
   * 
   * @returns 
   */
  async isReachable() {
    try {
      const stats = await this.getStats();
      return stats !== null;
    } catch (error) {
      return false;
    }
  }
}
