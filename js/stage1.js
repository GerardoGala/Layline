// Grab HTML UI Layout Elements
const startButton = document.getElementById("startButton");
const tackButton = document.getElementById("tackButton");

// 1. START SIMULATION ENGINE
if (startButton) {
  startButton.addEventListener("click", () => {
    startButton.classList.add("d-none");    // Hide Start Button
    tackButton.classList.remove("d-none"); // Show Tack Button
    
    // Hide feedback box if it was visible from a previous run
    const existingPanel = document.getElementById("spaFeedbackPanel");
    if (existingPanel) existingPanel.style.display = "none";

    window.launchSimulation(); // 🚀 Sets launched = true inside app.js
  });
}

// 2. TACK BUTTON: Freeze physics instantly and grade the student
if (tackButton) {
  tackButton.addEventListener("click", () => {
    window.stopSimulation(); // 🛑 Sets launched = false inside app.js (Freezes physics)
    tackButton.classList.add("d-none"); // Hide Tack Button

    calculateSpaExamScore(); // 📊 Run calculations and render results inline
  });
}

// 3. SPA CALCULATIONS & INLINE FEEDBACK PANEL
function calculateSpaExamScore() {
  // Read current telemetry directly from the global state tracking container
  const bLat = window.globalSimulationData.boatLat || (window.globalSimulationData.ILCA && window.globalSimulationData.ILCA.lat);
  const bLng = window.globalSimulationData.boatLng || (window.globalSimulationData.ILCA && window.globalSimulationData.ILCA.lng);
  const mLat = window.globalSimulationData.windwardMarkLat;
  const mLng = window.globalSimulationData.windwardMarkLon;
  
  const twd = window.globalSimulationData.trueWindDirection || window.globalSimulationData.windDirection || 0;
  const twa = window.globalSimulationData.targetWindAngle || 45;

  // --- A. Haversine Distance Formula: Get total distance to the windward mark ---
  const R = 6371000; // Earth's radius in meters
  const dLat = (mLat - bLat) * Math.PI / 180;
  const dLon = (mLng - bLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(bLat * Math.PI / 180) * Math.cos(mLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const distanceToMark = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

  // --- B. Bearing Geometry: Find angles relative to the downwind axis ---
  const y = Math.sin(dLon) * Math.cos(mLat * Math.PI / 180);
  const x = Math.cos(bLat * Math.PI / 180) * Math.sin(mLat * Math.PI / 180) - 
            Math.sin(bLat * Math.PI / 180) * Math.cos(mLat * Math.PI / 180) * Math.cos(dLon);
  const bearingToMark = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  
  const bearingFromMarkToBoat = (bearingToMark + 180) % 360;
  const downwindAxis = (twd + 180) % 360;
  
  let diff = Math.abs(bearingFromMarkToBoat - downwindAxis) % 360;
  const degreesOffCenter = diff > 180 ? 360 - diff : diff;

  // --- C. Cross-Track Distance: Calculate metric distance error from the layline ---
  const angularError = Math.abs(degreesOffCenter - twa);
  const distanceToLayline = distanceToMark * Math.sin(angularError * Math.PI / 180);

  // --- D. Resolve the Result Text Strings ---
  let titleText = "";
  let messageText = "";
  let alertClass = "";

  if (distanceToLayline <= 20.0) {
    titleText = "Congratulations! 🎉";
    messageText = `Excellent sailing execution! You hit the upwind layline accurately within ${distanceToLayline.toFixed(1)} meters.`;
    alertClass = "alert-success";
  } else if (degreesOffCenter < twa) {
    titleText = "Exam Failed ❌";
    messageText = `You tacked too early! You were short of the target layline track corridor by ${distanceToLayline.toFixed(1)} meters. Please try again.`;
    alertClass = "alert-danger";
  } else {
    titleText = "Exam Failed ❌";
    messageText = `You tacked too late! You overstood the layline by ${distanceToLayline.toFixed(1)} meters. Please try again.`;
    alertClass = "alert-danger";
  }

  // --- E. SPA Injector: Render or refresh the custom DIV panel directly onto the screen ---
  let feedbackDiv = document.getElementById("spaFeedbackPanel");
  if (!feedbackDiv) {
    feedbackDiv = document.createElement("div");
    feedbackDiv.id = "spaFeedbackPanel";
    // Appends right into your layout container next to the buttons
    const controlsParent = document.getElementById("divStart") || document.body;
    controlsParent.appendChild(feedbackDiv);
  }

  // Render the panel with layout matches to your original capsize panel layout
  feedbackDiv.style.display = "block";
  feedbackDiv.style.marginTop = "15px";
  feedbackDiv.style.width = "100%";
  
  feedbackDiv.innerHTML = `
    <div class="alert ${alertClass} p-4 rounded shadow-sm text-center" style="font-family: sans-serif;">
      <h3 class="fw-bold">${titleText}</h3>
      <p class="mb-3 fs-6">${messageText}</p>
      <hr>
      <div class="d-flex gap-2 justify-content-center mt-3">
        <button onclick="window.location.reload()" class="btn btn-dark btn-sm px-4">🔄 Try Again</button>
        <a href="index.html" class="btn btn-outline-secondary btn-sm px-4">🏡 Main Menu</a>
      </div>
    </div>
  `;
}
