document.addEventListener("DOMContentLoaded", () => {

  const geoSupported = "geolocation" in navigator;

  const cameraSupported =
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";

  console.log("PresenceX browser support:", {
    geolocation: geoSupported,
    camera: cameraSupported
  });

});