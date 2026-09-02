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
// --- Inside calculateSpaExamScore() in stage1.js ---

function calculateSpaExamScore() {
  // Ensure the global data object exists before running math to prevent breaking the script
  if (!window.globalSimulationData || !window.globalSimulationData.ILCA) {
    console.error("Simulation data object or ILCA object not found on window.");
    return;
  }

  // Read current telemetry using your exact verified keys
  const bLat = window.globalSimulationData.ILCA.lat;
  const bLng = window.globalSimulationData.ILCA.lon;
  const mLat = window.globalSimulationData.targetLat;
  const mLng = window.globalSimulationData.targetLon;
  
  if (bLat == null || bLng == null || mLat == null || mLng == null) {
    console.error("Telemetry error: Missing coordinates for boat or target mark.", { bLat, bLng, mLat, mLng });
    alert("Error reading simulation telemetry coordinates. Please restart.");
    return;
  }

  const rawDtl = window.globalSimulationData.distanceToLayLine;
  const dtl = rawDtl != null ? rawDtl : 0;

  const twd = window.globalSimulationData.trueWindDirection || window.globalSimulationData.windDirection || 0;
  const twa = window.globalSimulationData.targetWindAngle || 45;

  const bearingToBoat = (Math.atan2(bLng - mLng, bLat - mLat) * 180 / Math.PI + 360) % 360;
  let degreesOffCenter = Math.abs(bearingToBoat - twd) % 360;
  if (degreesOffCenter > 180) degreesOffCenter = 360 - degreesOffCenter;

  // --- Resolve the Result Text Strings ---
  let titleText = "";
  let messageText = "";
  let alertClass = "";
  let buttonLayoutHtml = ""; // Variable to hold our dynamic buttons

  // 1. DETERMINE CURRENT PAGE ENVIRONMENT
  const isStage2 = window.location.pathname.includes("stage2.html");

  // 2. CHECK SCORE VALIDATION WINDOW (20 meters corridor)
  if (dtl <= 20.0) {
    titleText = "Congratulations! 🎉";
    messageText = `Excellent sailing execution! You hit the upwind layline accurately within ${dtl.toFixed(1)} meters.`;
    alertClass = "alert-success";

    // DYNAMIC SUCCESS BUTTONS BASED ON THE STAGE
    if (!isStage2) {
      // Student is on Stage 1 -> Show "Next Stage" button pointing to Stage 2
      buttonLayoutHtml = `
        <a href="stage2.html" class="btn btn-dark btn-sm px-4 fw-bold">Next Stage ➡️</a>
        <a href="index.html" class="btn btn-outline-secondary btn-sm px-4">🏡 Main Menu</a>
      `;
    } else {
      // Student is on Stage 2 -> They finished the simulation! Show main menu celebration button
      titleText = "Simulation Completed! 🏆";
      messageText = `Fantastic job! You successfully mastered the unassisted practice layout within ${dtl.toFixed(1)} meters.`;
      buttonLayoutHtml = `
        <a href="index.html" class="btn btn-dark btn-sm px-4 fw-bold">🏡 Return to Main Menu</a>
        <button onclick="window.location.reload()" class="btn btn-outline-secondary btn-sm px-4">🔄 Sail Again</button>
      `;
    }

  } else {
    // FAILURE CONDITIONS (Keep "Try Again" setup active so they can retry the layout)
    alertClass = "alert-danger";
    buttonLayoutHtml = `
      <button onclick="window.location.reload()" class="btn btn-dark btn-sm px-4">🔄 Try Again</button>
      <a href="index.html" class="btn btn-outline-secondary btn-sm px-4">🏡 Main Menu</a>
    `;

    if (degreesOffCenter < twa) {
      titleText = "Exam Failed ❌";
      messageText = `You tacked too early! You were short of the target layline track corridor by ${dtl.toFixed(1)} meters. Please try again.`;
    } else {
      titleText = "Exam Failed ❌";
      messageText = `You tacked too late! You overstood the layline by ${dtl.toFixed(1)} meters. Please try again.`;
    }
  }

  // --- SPA Injector: Render or refresh the custom DIV panel directly onto the screen ---
  let feedbackDiv = document.getElementById("spaFeedbackPanel");
  if (!feedbackDiv) {
    feedbackDiv = document.createElement("div");
    feedbackDiv.id = "spaFeedbackPanel";
    const controlsParent = document.getElementById("divStart") || document.body;
    controlsParent.appendChild(feedbackDiv);
  }

  feedbackDiv.style.display = "block";
  feedbackDiv.style.marginTop = "15px";
  feedbackDiv.style.width = "100%";
  
  // Injecting the dynamic buttonLayoutHtml variable below
  feedbackDiv.innerHTML = `
    <div class="alert ${alertClass} p-4 rounded shadow-sm text-center" style="font-family: sans-serif;">
      <h3 class="fw-bold">${titleText}</h3>
      <p class="mb-3 fs-6">${messageText}</p>
      <hr>
      <div class="d-flex gap-2 justify-content-center mt-3">
        ${buttonLayoutHtml}
      </div>
    </div>
  `;
}
