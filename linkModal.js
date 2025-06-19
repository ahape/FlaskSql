import { tableSchemas, tableNames } from "./tables.js";
import { tableLabel, fieldLabel, handleStateChange, getAvailableJoinTargets, configuredFields, joins } from "./app.js";

// Close the link modal
function closeLinkModal() {
  const modal = document.getElementById("linkModal");
  modal.classList.remove("active");
}

export function showLinkModal(sourceFieldName, sourceTableName, availableTargets) {
  const modal = document.getElementById("linkModal");
  const sourceFieldInfo = document.getElementById("sourceFieldInfo");
  const sourceFieldNameEl = document.getElementById("sourceFieldName");
  const sourceFieldDetailsEl = document.getElementById("sourceFieldDetails");
  const targetFieldsList = document.getElementById("targetFieldsList");

  // Set source field info
  const sourceField = configuredFields.find(f => f.field === sourceFieldName && f.table === sourceTableName);
  sourceFieldNameEl.textContent = fieldLabel(sourceFieldName, sourceTableName);
  sourceFieldDetailsEl.textContent = `${tableLabel(sourceTableName)} (${sourceField.group})`;

  // Clear and populate target fields
  targetFieldsList.innerHTML = "";

  if (availableTargets.length === 0) {
    targetFieldsList.innerHTML = `<div class="no-targets">No fields available for joining.<br>All available tables are already represented.</div>`;
  } else {
    availableTargets.filter(x => x.group !== "metric").forEach(target => {
      const targetItem = document.createElement("div");
      targetItem.className = "target-field-item";
      targetItem.onclick = () => {
        executeJoin(sourceFieldName, sourceTableName, target.field, target.table);
        closeLinkModal();
      };

      const targetInfo = document.createElement("div");
      targetInfo.className = "target-field-info";

      const targetName = document.createElement("div");
      targetName.className = "target-field-name";
      targetName.textContent = fieldLabel(target.field, target.table);

      const targetDetails = document.createElement("div");
      targetDetails.className = "target-field-details";
      targetDetails.textContent = `${tableLabel(target.table)} (${target.group})`;

      targetInfo.appendChild(targetName);
      targetInfo.appendChild(targetDetails);

      const arrow = document.createElement("div");
      arrow.className = "target-field-arrow";
      arrow.textContent = "→";

      targetItem.appendChild(targetInfo);
      targetItem.appendChild(arrow);
      targetFieldsList.appendChild(targetItem);
    });
  }

  // Show modal
  modal.classList.add("active");
}

document.body.querySelector(".modal-close").onclick = closeLinkModal;

// Close modal when clicking outside
document.addEventListener("click", (e) => {
  const modal = document.getElementById("linkModal");
  if (e.target === modal) {
    closeLinkModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLinkModal();
  }
});

// Execute the join
function executeJoin(leftField, leftTable, rightField, rightTable) {
  const joinKey = `${leftTable}.${leftField}-${rightTable}.${rightField}`;
  const existingJoin = joins.find(j => j.key === joinKey);

  if (existingJoin) {
    alert("This join already exists");
    return;
  }

  const join = {
    key: joinKey,
    leftTable: leftTable,
    leftField: leftField,
    rightTable: rightTable,
    rightField: rightField
  };
  joins.push(join);
  handleStateChange();
}
