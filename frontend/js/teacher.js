document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("createSessionForm");

  const teacherIdInput = document.getElementById("teacherId");
  const subjectInput = document.getElementById("subject");
  const durationInput = document.getElementById("durationMinutes");
  const radiusInput = document.getElementById("radius");

  const getLocationBtn = document.getElementById("getLocationBtn");
  const locationStatus = document.getElementById("locationStatus");
  const coordinatesText = document.getElementById("coordinatesText");

  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");

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


  let locationCaptured = false;

  const API_URL = "YOUR_API_GATEWAY_URL";


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


  function detectLocation() {
    hideMessage();

    if (!navigator.geolocation) {
      locationCaptured = false;

      locationStatus.textContent =
        "Geolocation not supported";

      locationStatus.className =
        "location-status error";

      showMessage(
        "Your browser does not support location services.",
        "error"
      );

      return;
    }


    getLocationBtn.disabled = true;
    getLocationBtn.textContent = "Detecting...";

    locationStatus.textContent = "Detecting location...";
    locationStatus.className = "location-status warning";


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


        locationStatus.textContent =
          "Location Detected";

        locationStatus.className =
          "location-status success";


        getLocationBtn.disabled = false;
        getLocationBtn.textContent =
          "Update Location";
      },


      (error) => {

        locationCaptured = false;

        let message =
          "Unable to detect your location.";

        if (error.code === 1) {
          message =
            "Location permission was denied. Please allow location access.";
        } else if (error.code === 2) {
          message =
            "Your current location is unavailable.";
        } else if (error.code === 3) {
          message =
            "Location request timed out. Please try again.";
        }


        locationStatus.textContent =
          "Detection Failed";

        locationStatus.className =
          "location-status error";


        showMessage(message, "error");


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
      duration <= 0 ||
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
      radius <= 0 ||
      radius > 500
    ) {
      showMessage(
        "Attendance radius must be between 1 and 500 meters.",
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
        "Please detect your location before creating the session.",
        "warning"
      );

      getLocationBtn.focus();
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

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });


      const data = await response.json();


      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Unable to create attendance session."
        );
      }


      const session = data.session;


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
        expiryTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });


      sessionResult.classList.remove("hidden");

      sessionResult.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });


      showMessage(
        "Attendance session created successfully.",
        "success"
      );

    } catch (error) {

      console.error(
        "Create session error:",
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