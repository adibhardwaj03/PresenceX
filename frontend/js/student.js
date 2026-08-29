document.addEventListener("DOMContentLoaded", () => {

  const studentIdInput = document.getElementById("studentId");

  const sessionIdDisplay = document.getElementById("sessionIdDisplay");
  const sessionIdInput = document.getElementById("sessionId");
  const scanQrBtn = document.getElementById("scanQrBtn");

  const locationText = document.getElementById("locationText");
  const verifyLocationBtn = document.getElementById("verifyLocationBtn");
  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");
  const locationStatus = document.getElementById("locationStatus");

  const cameraPreview = document.getElementById("cameraPreview");
  const startCameraBtn = document.getElementById("startCameraBtn");
  const captureFaceBtn = document.getElementById("captureFaceBtn");
  const faceStatus = document.getElementById("faceStatus");

  const markAttendanceBtn =
    document.getElementById("markAttendanceBtn");

  const attendanceResult =
    document.getElementById("attendanceResult");

  const attendanceMessage =
    document.getElementById("attendanceMessage");

  const messageBox =
    document.getElementById("messageBox");


  let mediaStream = null;
  let videoElement = null;
  let faceImage = null;

  let locationVerified = false;
  let faceCaptured = false;


  function showMessage(message, type = "info") {
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.classList.remove("hidden");
  }


  function hideMessage() {
    if (!messageBox) return;

    messageBox.textContent = "";
    messageBox.classList.add("hidden");
  }


  function updateSessionDisplay() {
    const sessionId = sessionIdInput.value.trim();

    if (sessionIdDisplay) {
      sessionIdDisplay.textContent =
        sessionId || "No session selected";
    }
  }


  sessionIdInput?.addEventListener("input", () => {
    updateSessionDisplay();
    hideMessage();
  });


  scanQrBtn?.addEventListener("click", () => {
    showMessage(
      "QR scanner will be connected in the next step. You can enter the Session ID manually for now.",
      "info"
    );
  });


  function verifyLocation() {
    hideMessage();

    if (!navigator.geolocation) {
      locationStatus.textContent =
        "Geolocation is not supported by this browser.";

      locationStatus.className =
        "verification-status error";

      return;
    }

    verifyLocationBtn.disabled = true;
    verifyLocationBtn.textContent = "Checking...";

    locationStatus.textContent =
      "Getting your current location...";

    locationStatus.className =
      "verification-status warning";


    navigator.geolocation.getCurrentPosition(
      (position) => {

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        latitudeInput.value = latitude;
        longitudeInput.value = longitude;

        locationVerified = true;

        locationText.textContent =
          `Latitude: ${latitude.toFixed(6)}, ` +
          `Longitude: ${longitude.toFixed(6)}`;

        locationStatus.textContent =
          `Location detected (accuracy ±${accuracy}m)`;

        locationStatus.className =
          "verification-status success";

        verifyLocationBtn.disabled = false;
        verifyLocationBtn.textContent =
          "Re-verify Location";
      },

      (error) => {

        let message = "Unable to get your location.";

        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Location permission was denied. Please allow location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message =
            "Your current location is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message =
            "Location request timed out. Please try again.";
        }

        locationStatus.textContent = message;
        locationStatus.className =
          "verification-status error";

        locationVerified = false;

        verifyLocationBtn.disabled = false;
        verifyLocationBtn.textContent =
          "Retry Location";
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }


  verifyLocationBtn?.addEventListener(
    "click",
    verifyLocation
  );


  async function startCamera() {
    hideMessage();

    if (mediaStream) {
      stopCamera();
      return;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      faceStatus.textContent =
        "Camera access is not supported by this browser.";

      faceStatus.className =
        "verification-status error";

      return;
    }

    try {

      startCameraBtn.disabled = true;
      startCameraBtn.textContent = "Opening Camera...";

      mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });


      cameraPreview.innerHTML = "";

      videoElement =
        document.createElement("video");

      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;

      videoElement.srcObject = mediaStream;

      cameraPreview.appendChild(videoElement);


      startCameraBtn.disabled = false;
      startCameraBtn.textContent = "Stop Camera";

      captureFaceBtn.disabled = false;

      faceStatus.textContent =
        "Camera is ready. Position your face clearly and capture the photo.";

      faceStatus.className =
        "verification-status warning";

    } catch (error) {

      console.error("Camera error:", error);

      faceStatus.textContent =
        "Unable to access the camera. Please check your camera permission.";

      faceStatus.className =
        "verification-status error";

      startCameraBtn.disabled = false;
      startCameraBtn.textContent =
        "Start Camera";
    }
  }


  function captureFace() {

    if (!videoElement || !mediaStream) {
      showMessage(
        "Please start the camera first.",
        "error"
      );

      return;
    }

    const canvas =
      document.createElement("canvas");

    canvas.width =
      videoElement.videoWidth || 640;

    canvas.height =
      videoElement.videoHeight || 480;


    const context =
      canvas.getContext("2d");

    context.drawImage(
      videoElement,
      0,
      0,
      canvas.width,
      canvas.height
    );


    faceImage =
      canvas.toDataURL("image/jpeg", 0.85);

    faceCaptured = true;

    stopCamera();


    cameraPreview.innerHTML = "";

    const image =
      document.createElement("img");

    image.src = faceImage;
    image.alt = "Captured face";

    cameraPreview.appendChild(image);


    startCameraBtn.textContent =
      "Retake Photo";

    captureFaceBtn.disabled = true;

    faceStatus.textContent =
      "Face photo captured successfully.";

    faceStatus.className =
      "verification-status success";
  }


  function stopCamera() {

    if (mediaStream) {

      mediaStream
        .getTracks()
        .forEach((track) => track.stop());

      mediaStream = null;
    }

    videoElement = null;

    if (captureFaceBtn) {
      captureFaceBtn.disabled = true;
    }
  }


  startCameraBtn?.addEventListener(
    "click",
    startCamera
  );

  captureFaceBtn?.addEventListener(
    "click",
    captureFace
  );


  async function markAttendance() {

    hideMessage();

    const studentId =
      studentIdInput.value.trim();

    const sessionId =
      sessionIdInput.value.trim();

    const latitude =
      latitudeInput.value;

    const longitude =
      longitudeInput.value;


    if (!studentId) {
      showMessage(
        "Please enter your Student ID.",
        "error"
      );

      studentIdInput.focus();
      return;
    }


    if (!sessionId) {
      showMessage(
        "Please enter or scan the Session ID.",
        "error"
      );

      sessionIdInput.focus();
      return;
    }


    if (!locationVerified || !latitude || !longitude) {
      showMessage(
        "Please verify your location first.",
        "error"
      );

      verifyLocationBtn.focus();
      return;
    }


    if (!faceCaptured || !faceImage) {
      showMessage(
        "Please capture your face before marking attendance.",
        "error"
      );

      startCameraBtn.focus();
      return;
    }


    const attendanceData = {
      StudentID: studentId,
      SessionID: sessionId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      faceImage: faceImage
    };


    console.log(
      "Attendance request:",
      attendanceData
    );


    markAttendanceBtn.disabled = true;
    markAttendanceBtn.textContent =
      "Verifying...";


    try {

      /*
       * The API Gateway URL will be added here
       * when the attendance Lambda is ready.
       */

      /*
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(attendanceData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Attendance verification failed."
        );
      }

      attendanceResult.classList.remove("hidden");

      attendanceMessage.textContent =
        result.message || "Attendance recorded successfully.";
      */


      showMessage(
        "All verification details are ready. Backend attendance verification will be connected next.",
        "info"
      );

    } catch (error) {

      console.error(
        "Attendance error:",
        error
      );

      showMessage(
        error.message ||
        "Unable to process attendance.",
        "error"
      );

    } finally {

      markAttendanceBtn.disabled = false;
      markAttendanceBtn.textContent =
        "Mark Attendance";
    }
  }


  markAttendanceBtn?.addEventListener(
    "click",
    markAttendance
  );


  window.addEventListener(
    "beforeunload",
    stopCamera
  );

});