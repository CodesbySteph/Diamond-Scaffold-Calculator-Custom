// Function to add addon output
function addAddonOutput(materials, materialList, manhourRate) {
  // Calculate total pieces and weight
  let totalPieces = 0;
  let totalWeight = 0;

  materials.forEach(item => {
    totalPieces += item.qty;
    totalWeight += item.qty * item.weightPerUnit;
  });

  // Create addon output
  const addonDiv = document.createElement("div");
  addonDiv.id = "addon-output";
  addonDiv.style.marginTop = "20px";

  // Calculate estimated manhours
  const MANHOUR_RATE = 18 / 60; // 18 seconds per piece
  const manhours = (totalPieces * MANHOUR_RATE).toFixed(2);
  const manhourLine = document.createElement("p");
  manhourLine.innerHTML = `<strong>Estimated Manhours:</strong> ${manhours} hrs`;
  addonDiv.appendChild(manhourLine);

  // Calculate labor cost if manhour rate provided
  if (manhourRate > 0) {
    const laborCost = (manhours * manhourRate).toFixed(2);
    const laborCostLine = document.createElement("p");
    laborCostLine.innerHTML = `<strong>Estimated Labor Cost:</strong> $${laborCost} (at $${manhourRate}/hr)`;
    addonDiv.appendChild(laborCostLine);
  }

  // Add truckload warning if necessary
  if (totalWeight > 48000) {
    const warning = document.createElement("p");
    warning.className = "warning-message";
    warning.textContent = "⚠ Total exceeds typical truckload capacity (48,000 lbs)";
    addonDiv.appendChild(warning);
  }

  // Add print button
  const printButton = document.createElement("button");
  printButton.textContent = "Print / Save";
  printButton.className = "print-button";
  printButton.onclick = () => window.print();
  addonDiv.appendChild(printButton);

  materialList.appendChild(addonDiv);
}
