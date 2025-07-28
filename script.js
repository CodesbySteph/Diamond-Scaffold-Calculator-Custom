// Material configuration (weights only, with base lengths for scaling)
const MATERIALS = {
  base: [
    { name: "Screw Jacks", weightPerUnit: 14 },
    { name: "Starter Collars", weightPerUnit: 4.18 },
    { name: "Vertical 9'9\"", weightPerUnit: 33.73 },
    { name: "Horizontal", weightPerUnit: 19.3, baseLength: 7 }, // Base for 7ft
    { name: "Horizontal", weightPerUnit: 10.1, baseLength: 5.167 }, // Base for 5'2" (5.167ft)
    { name: "Diagonal Braces", weightPerUnit: 12 },
    { name: "Steel Decks", weightPerUnit: 49.5, baseLength: 7 }, // Base for 7ft
    { name: "Top Guardrails", weightPerUnit: 14.2 },
    { name: "Toe Boards", weightPerUnit: 5.5 },
  ],
  stair: [
    { name: "Stair Stringer 7′", weightPerUnit: 42 },
    { name: "Stair Tread", weightPerUnit: 10 },
    { name: "Stair Guardrail", weightPerUnit: 14 },
    { name: "Stair Standard", weightPerUnit: 24 },
    { name: "Stair Ledger", weightPerUnit: 16 },
    { name: "Stair Diagonal Brace", weightPerUnit: 12 },
    { name: "Stair Base Plate", weightPerUnit: 6 },
  ],
};

window.onload = function () {
  console.log("Script loaded");

  const form = document.getElementById("scaffold-form");
  const materialList = document.getElementById("material-list");
  const canvas = document.getElementById("scaffoldPreview");
  const ctx = canvas.getContext("2d");

  // Handle form submission
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    console.log("Form submitted");

    // Get input values with defaults
    const width = parseFloat(document.getElementById("width").value);
    const length = parseFloat(document.getElementById("length").value);
    const height = parseFloat(document.getElementById("height").value);
    const bayLength = parseFloat(document.getElementById("bayLength").value) || 7;
    const bayWidth = parseFloat(document.getElementById("bayWidth").value) || 7;
    const manhourRate = parseFloat(document.getElementById("manhourRate").value) || 0;
    const loadType = document.getElementById("loadType").value;
    const includeStair = document.getElementById("stairTower").checked;

    // Validate inputs
    if (isNaN(width) || isNaN(length) || isNaN(height) || width <= 0 || length <= 0 || height <= 0) {
      showError("Please enter valid positive numbers for width, length, and height.");
      return;
    }
    if (isNaN(bayLength) || isNaN(bayWidth) || bayLength <= 0 || bayWidth <= 0) {
      showError("Please enter valid positive numbers for bay length and width.");
      return;
    }
    if (!isNaN(manhourRate) && manhourRate < 0) {
      showError("Manhour rate cannot be negative.");
      return;
    }

    // Clear previous errors
    clearErrors();

    // Calculate scaffold dimensions
    const liftsHigh = Math.ceil(height / 6.5);
    const baysWide = Math.ceil(width / bayWidth);
    const baysLong = Math.ceil(length / bayLength);
    const totalBays = baysWide * baysLong;

    // Initialize materials array
    let materials = [];

    // Add base materials with dynamic weights
    materials.push({ name: "Screw Jacks", qty: (baysWide + 1) * (baysLong + 1), weightPerUnit: MATERIALS.base[0].weightPerUnit });
    materials.push({ name: "Starter Collars", qty: (baysWide + 1) * (baysLong + 1), weightPerUnit: MATERIALS.base[1].weightPerUnit });
    materials.push({ name: "Vertical 9'9\"", qty: (baysWide + 1) * (baysLong + 1) * liftsHigh, weightPerUnit: MATERIALS.base[2].weightPerUnit });
    materials.push({ name: `Horizontal ${bayLength.toFixed(1)}′`, qty: baysWide * (baysLong + 1) * liftsHigh, weightPerUnit: MATERIALS.base[3].weightPerUnit * (bayLength / MATERIALS.base[3].baseLength) });
    materials.push({ name: `Horizontal ${bayWidth.toFixed(1)}′`, qty: baysLong * (baysWide + 1) * liftsHigh, weightPerUnit: MATERIALS.base[4].weightPerUnit * (bayWidth / MATERIALS.base[4].baseLength) });
    materials.push({ name: "Diagonal Braces", qty: totalBays * liftsHigh, weightPerUnit: MATERIALS.base[5].weightPerUnit });
    materials.push({ name: `Steel Decks ${bayLength.toFixed(1)}′`, qty: totalBays, weightPerUnit: MATERIALS.base[6].weightPerUnit * (bayLength / MATERIALS.base[6].baseLength) });
    materials.push({ name: "Top Guardrails", qty: baysWide * 2 + baysLong * 2, weightPerUnit: MATERIALS.base[7].weightPerUnit });
    materials.push({ name: "Toe Boards", qty: baysWide * 2 + baysLong * 2, weightPerUnit: MATERIALS.base[8].weightPerUnit });

    // Add stair materials if included
    if (includeStair) {
      const stairLifts = Math.ceil(height / 6.5);
      const stairTowers = 1;
      const stringersPerLift = 2;
      const treadsPerLift = 5;
      const legsPerLift = 4;
      const barsPerLift = 4;
      const diagonalsPerLift = 2;
      const basePlatesPerTower = 4;

      materials.push({ name: "Stair Stringer 7′", qty: stairTowers * stringersPerLift * stairLifts, weightPerUnit: MATERIALS.stair[0].weightPerUnit });
      materials.push({ name: "Stair Tread", qty: stairTowers * treadsPerLift * stairLifts, weightPerUnit: MATERIALS.stair[1].weightPerUnit });
      materials.push({ name: "Stair Guardrail", qty: stairTowers * barsPerLift * stairLifts, weightPerUnit: MATERIALS.stair[2].weightPerUnit });
      materials.push({ name: "Stair Standard", qty: stairTowers * legsPerLift * stairLifts, weightPerUnit: MATERIALS.stair[3].weightPerUnit });
      materials.push({ name: "Stair Ledger", qty: stairTowers * barsPerLift * stairLifts, weightPerUnit: MATERIALS.stair[4].weightPerUnit });
      materials.push({ name: "Stair Diagonal Brace", qty: stairTowers * diagonalsPerLift * stairLifts, weightPerUnit: MATERIALS.stair[5].weightPerUnit });
      materials.push({ name: "Stair Base Plate", qty: stairTowers * basePlatesPerTower, weightPerUnit: MATERIALS.stair[6].weightPerUnit });
    }

    // Calculate total weight and check load capacity
    let totalWeight = 0;
    materials.forEach(item => {
      totalWeight += item.qty * item.weightPerUnit;
    });

    const loadRatings = { light: 120, medium: 240, heavy: 450 }; // kg/m²
    const platformArea = (width * length) / 10.764; // Convert ft² to m²
    const safetyFactor = 4; // OSHA standard
    const swl = (loadRatings[loadType] * platformArea) / safetyFactor; // kg
    const swlLbs = swl * 2.20462; // Convert kg to lbs

    // Render material list as a table
    materialList.innerHTML = `
      <h3>Material List</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Weight per Unit (lbs)</th>
            <th>Total Weight (lbs)</th>
          </tr>
        </thead>
        <tbody>
          ${materials
            .map(item => {
              const itemWeight = (item.qty * item.weightPerUnit).toFixed(2);
              return `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.qty} pcs</td>
                  <td>${item.weightPerUnit.toFixed(1)}</td>
                  <td>${itemWeight}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
      <h3>Total Scaffold Weight: ${totalWeight.toFixed(2)} lbs</h3>
      <p><strong>Safe Working Load (SWL):</strong> ${swlLbs.toFixed(2)} lbs (${loadType} duty) - ${totalWeight <= swlLbs ? "Pass" : "Fail: Exceeds SWL"}</p>
    `;

    // Draw 2D preview (top-down view)
    draw2DPreview(ctx, baysWide, baysLong, bayWidth, bayLength, includeStair);

    // Add addon output
    addAddonOutput(materials, materialList, manhourRate);

    // Save calculation
    saveCalculation(materials, width, length, height, includeStair, manhourRate, loadType, bayLength, bayWidth);
  });

  // Add reset button
  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset";
  document.getElementById("calculate").insertAdjacentElement("afterend", resetButton);
  resetButton.addEventListener("click", () => {
    form.reset();
    materialList.innerHTML = "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearErrors();
  });

  // Add save button
  const saveButton = document.createElement("button");
  saveButton.textContent = "Save Calculation";
  resetButton.insertAdjacentElement("afterend", saveButton);
  saveButton.addEventListener("click", () => saveCalculation(materials, document.getElementById("width").value, document.getElementById("length").value, document.getElementById("height").value, document.getElementById("stairTower").checked, document.getElementById("manhourRate").value, document.getElementById("loadType").value, document.getElementById("bayLength").value, document.getElementById("bayWidth").value));

  // Add load button
  const loadButton = document.createElement("button");
  loadButton.textContent = "Load Last Calculation";
  saveButton.insertAdjacentElement("afterend", loadButton);
  loadButton.addEventListener("click", loadCalculation);

  // Error handling functions
  function showError(message) {
    clearErrors();
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    form.appendChild(errorDiv);
  }

  function clearErrors() {
    const errorDiv = document.querySelector(".error-message");
    if (errorDiv) errorDiv.remove();
  }

  // Draw 2D preview (top-down view)
  function draw2DPreview(ctx, baysWide, baysLong, bayWidth, bayLength, includeStair) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.font = "12px Roboto";

    // Calculate scaling to fit canvas
    const canvasWidth = canvas.width - 40; // Margin
    const canvasHeight = canvas.height - 40;
    const totalWidth = baysWide * bayWidth;
    const totalLength = baysLong * bayLength;
    const scaleX = canvasWidth / totalWidth;
    const scaleY = canvasHeight / totalLength;
    const scale = Math.min(scaleX, scaleY, 1); // Cap at 1:1

    // Draw bays (grid)
    for (let i = 0; i <= baysWide; i++) {
      for (let j = 0; j <= baysLong; j++) {
        const x = 20 + i * bayWidth * scale;
        const y = 20 + j * bayLength * scale;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI); // Standards as dots
        ctx.fill();
        if (i < baysWide) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + bayWidth * scale, y);
          ctx.stroke(); // Horizontal ledgers
        }
        if (j < baysLong) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + bayLength * scale);
          ctx.stroke(); // Vertical ledgers
        }
      }
    }

    // Label dimensions
    ctx.fillText(`${(baysWide * bayWidth).toFixed(1)} ft`, 20, 15);
    ctx.fillText(`${(baysLong * bayLength).toFixed(1)} ft`, 10, 30 + baysLong * bayLength * scale);

    // Mark stair tower if included
    if (includeStair) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
      ctx.fillRect(20, 20, bayWidth * scale, bayLength * scale); // Top-left bay as stair tower
      ctx.fillStyle = "#000";
      ctx.fillText("Stair", 25, 35);
    }
  }

  // Save calculation to localStorage
  function saveCalculation(materials, width, length, height, includeStair, manhourRate, loadType, bayLength, bayWidth) {
    const calculation = { materials, width, length, height, includeStair, manhourRate, loadType, bayLength, bayWidth, timestamp: new Date().toISOString() };
    localStorage.setItem("lastCalculation", JSON.stringify(calculation));
  }

  // Load calculation from localStorage
  function loadCalculation() {
    const saved = localStorage.getItem("lastCalculation");
    if (saved) {
      const { materials, width, length, height, includeStair, manhourRate, loadType, bayLength, bayWidth } = JSON.parse(saved);
      document.getElementById("width").value = width;
      document.getElementById("length").value = length;
      document.getElementById("height").value = height;
      document.getElementById("stairTower").checked = includeStair;
      document.getElementById("manhourRate").value = manhourRate || "";
      document.getElementById("loadType").value = loadType || "light";
      document.getElementById("bayLength").value = bayLength || 7; // Default to 7 if undefined
      document.getElementById("bayWidth").value = bayWidth || 7; // Default to 7 if undefined

      let totalWeight = 0;
      materials.forEach(item => {
        totalWeight += item.qty * item.weightPerUnit;
      });

      const loadRatings = { light: 120, medium: 240, heavy: 450 }; // kg/m²
      const platformArea = (width * length) / 10.764; // Convert ft² to m²
      const safetyFactor = 4;
      const swl = (loadRatings[loadType] * platformArea) / safetyFactor; // kg
      const swlLbs = swl * 2.20462; // Convert kg to lbs

      materialList.innerHTML = `
        <h3>Material List (Loaded)</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Weight per Unit (lbs)</th>
              <th>Total Weight (lbs)</th>
            </tr>
          </thead>
          <tbody>
            ${materials
              .map(item => {
                const itemWeight = (item.qty * item.weightPerUnit).toFixed(2);
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.qty} pcs</td>
                    <td>${item.weightPerUnit.toFixed(1)}</td>
                    <td>${itemWeight}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
        <h3>Total Scaffold Weight: ${totalWeight.toFixed(2)} lbs</h3>
        <p><strong>Safe Working Load (SWL):</strong> ${swlLbs.toFixed(2)} lbs (${loadType} duty) - ${totalWeight <= swlLbs ? "Pass" : "Fail: Exceeds SWL"}</p>
      `;

      // Draw 2D preview
      draw2DPreview(ctx, Math.ceil(width / (bayWidth || 7)), Math.ceil(length / (bayLength || 7)), bayWidth || 7, bayLength || 7, includeStair);

      addAddonOutput(materials, materialList, manhourRate);
    } else {
      showError("No saved calculation found.");
    }
  }
};
