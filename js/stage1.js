/**
 * stage1.js - San Juan Academy Sailing Simulator
 * Core logic for Managing Simulation States, Leaflet Layline Renders,
 * and Student Performance Evaluations.
 */

// UI DOM Element Selections
const startButton = document.getElementById("startButton");
const tackButton = document.getElementById("tackButton");
const stopButton = document.getElementById("stopButton");

// Local variable state container for the animation frame reference
let animationFrameId = null;

/**
 * ============================================================================
 * 1. UI STATE CONTROLLERS
 * ============================================================================
 * Safely cycles visibility states using Bootstrap's display utilities.
 */

function setUItoRunningState() {
    // Hide Start
    startButton.classList.add("d-none");
    // Show Tack and Stop
    tackButton.classList.remove("d-none");
    stopButton.classList.remove("d-none");
}

function setUItoStoppedState() {
    // Show Start
    startButton.classList.remove("d-none");
    // Hide Tack and Stop
    tackButton.classList.add("d-none");
    stopButton.classList.add("d-none");
}

/**
 * ============================================================================
 * 2. CORE SIMULATION LIFECYCLE MANAGEMENT
 * ============================================================================
 */

function handleStartSimulation() {
    if (window.globalSimulationData.isRunning) return;

    window.globalSimulationData.isRunning = true;
    setUItoRunningState();

    // Reset boat vectors back to the starting line layout
    if (typeof resetBoatToStart === "function") {
        resetBoatToStart();
    }

    // Fire the core physics/engine trigger inside map layers
    if (typeof launchSimulation === "function") {
        launchSimulation();
    }

    // Initialize animation ticker loop
    animationFrameId = requestAnimationFrame(simulationLoop);
}

function handleStopAndJudgeSimulation() {
    if (!window.globalSimulationData.isRunning) return;

    window.globalSimulationData.isRunning = false;
    setUItoStoppedState();

    // Kill active render frame sequences smoothly
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Evaluate student performance boundaries
    const evaluationResult = evaluateStudentPerformance();

    // Commit metrics to local storage for feedback.html processing
    localStorage.setItem("simulationResult", evaluationResult.status); // "passed", "early", "late", "overstood"
    localStorage.setItem("simulationMessage", evaluationResult.message);
    localStorage.setItem("currentStage", window.globalSimulationData.stage || "1");

    // Route student straight to feedback matrix dashboard
    window.location.href = "feedback.html";
}

function handleTackAction() {
    // Check if simulation is active before consuming events
    if (!window.globalSimulationData.isRunning) return;
    
    console.log("Tack executed by user.");
    // Insert your code here to toggle boat sailing angles relative to the wind vectors
    if (typeof executeBoatTack === "function") {
        executeBoatTack();
    }
}

/**
 * Main game/simulation step function tracking frame ticks.
 */
function simulationLoop() {
    if (!window.globalSimulationData.isRunning) return;

    // Execute standard physics tracking frames
    if (typeof gameLoop === "function") {
        gameLoop();
    }

    // Dynamic layline updates if true wind changes positions
    if (typeof updateLaylines === "function") {
        updateLaylines();
    }

    animationFrameId = requestAnimationFrame(simulationLoop);
}

/**
 * ============================================================================
 * 3. SAILING LAYLINE MATH EVALUATION LOGIC
 * ============================================================================
 * Calculates cross-track errors and angle corridors to judge if the
 * student tacked precisely on the boundaries or missed the window.
 */
function evaluateStudentPerformance() {
    // Fallbacks if data properties are empty
    const currentLat = window.globalSimulationData.boatLat || 13.670464;
    const currentLng = window.globalSimulationData.boatLng || 121.401286;
    
    const windwardLat = window.globalSimulationData.windwardMarkLat || 13.671812;
    const windwardLng = window.globalSimulationData.windwardMarkLon || 121.401286;
    
    const twd = window.globalSimulationData.trueWindDirection || 0;
    const twa = window.globalSimulationData.targetWindAngle || 45;

    // Compute standard geographic bearing from boat location straight to the Windward Mark
    const dLng = (windwardLng - currentLng) * Math.PI / 180;
    const lat1 = currentLat * Math.PI / 180;
    const lat2 = windwardLat * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    // Bearing values normalized safely to standard 0-360 tracking dimensions
    let bearingToMark = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    // Calculate structural layline target bearings extending out from the mark downwind
    const idealStarboardLayline = (twd + 180 - twa + 360) % 360;
    const idealPortLayline = (twd + 180 + twa) % 360;

    // Allowable cushion tolerance zone window in degrees
    const toleranceDegrees = 3.5; 

    // Compute delta variations
    const diffStarboard = Math.abs(bearingToMark - idealStarboardLayline);
    const diffPort = Math.abs(bearingToMark - idealPortLayline);

    // JUDGMENT DEVIATION TREE
    if (diffStarboard <= toleranceDegrees || diffPort <= toleranceDegrees) {
        return {
            status: "passed",
            message: "Perfect tack! You hit the layline window exactly."
        };
    } else if (bearingToMark > idealStarboardLayline && bearingToMark < idealPortLayline) {
        return {
            status: "early",
            message: "Tack failed: You tacked too early and are sailing under the layline corridor."
        };
    } else {
        return {
            status: "late",
            message: "Tack failed: You overstood the layline, sailing extra distance unnecessarily."
        };
    }
}

/**
 * ============================================================================
 * 4. EVENT LISTENER REGISTER INITIALIZATION
 * ============================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    if (startButton) startButton.addEventListener("click", handleStartSimulation);
    if (stopButton) stopButton.addEventListener("click", handleStopAndJudgeSimulation);
    if (tackButton) tackButton.addEventListener("click", handleTackAction);
});
