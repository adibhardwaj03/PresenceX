document.addEventListener("DOMContentLoaded", () => {
  const API_URL =
    "https://897qncdmh6.execute-api.ap-south-1.amazonaws.com/sessions";

  const form = document.getElementById("createSessionForm");

  const teacherIdInput = document.getElementById("teacherId");
  const subjectInput = document.getElementById("subject");
  const durationInput = document.getElementById("durationMinutes");
  const radiusInput = document.getElementById("radius");

  const getLocationBtn =
    document.getElementById("getLocationBtn");

  const locationStatus =
    document.getElementById("locationStatus");

  const coordinatesText =
    document.getElementById("coordinatesText");

  const latitudeInput =
    document.getElementById("latitude");

  const longitudeInput =
    document.getElementById("longitude");

  const createSessionBtn =
    document.getElementById("createSessionBtn");

  const messageBox =
    document.getElementById("messageBox");

  const sessionResult =
    document.getElementById("sessionResult");

  const sessionIdDisplay =
    document.getElementById("sessionId");

  const sessionSubjectDisplay =
    document.getElementById("sessionSubject");

  const sessionDurationDisplay =
    document.getElementById("sessionDuration");

  const sessionRadiusDisplay =
    document.getElementById("sessionRadius");

  const sessionExpiryDisplay =
    document.getElementById("sessionExpiry");

  const qrCodeContainer =
    document.getElementById("qrCode");

  let locationCaptured = false;


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


  function setLocationStatus(text, type) {
    if (!locationStatus) return;

    locationStatus.textContent = text;
    locationStatus.className =
      `location-status ${type}`;
  }


  function detectLocation() {
    hideMessage();

    if (!navigator.geolocation) {
      locationCaptured = false;

      setLocationStatus(
        "Location Unsupported",
        "error"
      );

      showMessage(
        "Your browser does not support location services.",
        "error"
      );

      return;
    }

    getLocationBtn.disabled = true;
    getLocationBtn.textContent = "Detecting...";
    setLocationStatus("Detecting...", "warning");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          Math.round(position.coords.accuracy);

        latitudeInput.value = latitude;
        longitudeInput.value = longitude;

        locationCaptured = true;

        coordinatesText.textContent =
          `Latitude: ${latitude.toFixed(6)}, ` +
          `Longitude: ${longitude.toFixed(6)} ` +
          `(±${accuracy}m)`;

        setLocationStatus(
          "Location Detected",
          "success"
        );

        getLocationBtn.disabled = false;
        getLocationBtn.textContent =
          "Update Location";
      },

      (error) => {
        locationCaptured = false;

        let message =
          "Unable to detect your location.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Location permission was denied. Please allow location access in your browser.";
        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Your location is currently unavailable. Please check GPS or location services.";
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          message =
            "Location detection timed out. Please try again.";
        }

        setLocationStatus(
          "Detection Failed",
          "error"
        );

        showMessage(
          message,
          "error"
        );

        getLocationBtn.disabled = false;
        getLocationBtn.textContent =
          "Detect Location";
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }


  function generateQRCode(sessionId) {
    if (!qrCodeContainer) return;

    qrCodeContainer.innerHTML = "";

    if (
      typeof QRCode === "undefined"
    ) {
      showMessage(
        "QR generator could not be loaded. Please refresh the page.",
        "error"
      );

      return;
    }

    new QRCode(qrCodeContainer, {
      text: sessionId,
      width: 220,
      height: 220,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel:
        QRCode.CorrectLevel.H
    });
  }


  async function createSession(event) {
    event.preventDefault();
    hideMessage();

    const teacherId =
      teacherIdInput.value.trim();

    const subject =
      subjectInput.value.trim();

    const duration =
      Number(durationInput.value);

    const radius =
      Number(radiusInput.value);

    const latitude =
      Number(latitudeInput.value);

    const longitude =
      Number(longitudeInput.value);


    if (!teacherId) {
      showMessage(
        "Please enter your Teacher ID.",
        "error"
      );

      teacherIdInput.focus();
      return;
    }


    if (!subject) {
      showMessage(
        "Please enter the subject name.",
        "error"
      );

      subjectInput.focus();
      return;
    }


    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 180
    ) {
      showMessage(
        "Session duration must be between 1 and 180 minutes.",
        "error"
      );

      durationInput.focus();
      return;
    }


    if (
      !Number.isFinite(radius) ||
      radius < 5 ||
      radius > 500
    ) {
      showMessage(
        "Attendance radius must be between 5 and 500 meters.",
        "error"
      );

      radiusInput.focus();
      return;
    }


    if (
      !locationCaptured ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      showMessage(
        "Please detect the classroom location before creating the session.",
        "warning"
      );

      getLocationBtn.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      return;
    }


    const requestData = {
      TeacherID: teacherId,
      subject: subject,
      durationMinutes: duration,
      latitude: latitude,
      longitude: longitude,
      radius: radius
    };


    createSessionBtn.disabled = true;

    createSessionBtn.textContent =
      "Creating Session...";


    try {
      const response =
        await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(requestData)
        });


      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }


      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Unable to create the attendance session."
        );
      }


      const session =
        data.session;


      sessionIdDisplay.textContent =
        session.SessionID;

      sessionSubjectDisplay.textContent =
        session.subject;

      sessionDurationDisplay.textContent =
        `${session.durationMinutes} minutes`;

      sessionRadiusDisplay.textContent =
        `${session.radius} meters`;


      const expiryTime =
        new Date(session.expiresAt);

      sessionExpiryDisplay.textContent =
        expiryTime.toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );


      generateQRCode(
        session.SessionID
      );


      sessionResult.classList.remove(
        "hidden"
      );


      showMessage(
        `Attendance session ${session.SessionID} created successfully.`,
        "success"
      );


      sessionResult.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    } catch (error) {
      console.error(
        "Session creation failed:",
        error
      );

      showMessage(
        error.message ||
        "Something went wrong while creating the session.",
        "error"
      );

    } finally {
      createSessionBtn.disabled = false;

      createSessionBtn.textContent =
        "Create Attendance Session";
    }
  }


  getLocationBtn?.addEventListener(
    "click",
    detectLocation
  );


  form?.addEventListener(
    "submit",
    createSession
  );
});