document.addEventListener("DOMContentLoaded", function () {
    (async function () {
        const settings = await SDPIComponents.streamDeckClient.getGlobalSettings();
        console.log("Power Control Settings", settings);
    })();
});