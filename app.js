/*
 vim:ts=2 sw=2
*/
const T1 = "Unique";
const T2 = "Enumerable";
const T3 = "Subject";
const T4 = "Group";
const T5 = "Metric";
const tableSchemas = {
  zendesk_tickets: [
    { name: "date", type: T1 },
    { name: "customer", type: T3 },
    { name: "assignee", type: T3 },
    { name: "organization", type: T4 },
    { name: "avg_resolution_time", type: T5 },
    { name: "avg_nps_score", type: T5 },
  ],
  conversation_data: [
    { name: "datetime", type: T1 },
    { name: "agent", type: T3 },
    { name: "queue", type: T4 },
    { name: "avg_handle_time", type: T5 }
  ],
  queue_data: [
    { name: "datetime", type: T1 },
    { name: "next_party", type: T3 },
    { name: "queue", type: T4 },
    { name: "avg_wait_time", type: T5 }
  ],
};
const tableLabels = {
  "zendesk_tickets": "Zendesk Tickets",
  "conversation_data": "Conversation Data",
  "queue_data": "Queue Data",
}
const tableNames = Object.keys(tableSchemas);

let configuredFields = [];
let joins = [];
let draggedElement = null;

// Initialize the app
function init() {
  const dataSourceSelect = document.getElementById("dataSourceSelect");
  dataSourceSelect.addEventListener("change", updateAvailableFields);

  tableNames.forEach((tableName) => {
    const option = document.createElement("OPTION");
    option.textContent = tableLabels[tableName];
    option.value = tableName;
    dataSourceSelect.appendChild(option);
  });
  
  setupDragAndDrop();
  updateAvailableFields();
}

// Update available fields based on selected data source
function updateAvailableFields() {
  const selectedTable = document.getElementById("dataSourceSelect").value;
  const availableList = document.getElementById("availableList");
  const fields = tableSchemas[selectedTable];
  
  availableList.innerHTML = "";
  
  fields.forEach(field => {
    const fieldElement = createFieldElement(field.name, selectedTable, field.type);
    availableList.appendChild(fieldElement);
  });
}

// Create a field element
function createFieldElement(fieldName, tableName, fieldType, showActions = false) {
  const fieldDiv = document.createElement("div");
  fieldDiv.className = "field-item";
  fieldDiv.draggable = true;
  fieldDiv.dataset.field = fieldName;
  fieldDiv.dataset.table = tableName;
  fieldDiv.dataset.type = fieldType;
  
  const fieldInfo = document.createElement("div");
  fieldInfo.className = "field-info";
  
  const nameSpan = document.createElement("div");
  nameSpan.className = "field-name";
  nameSpan.textContent = fieldName;
  
  const sourceSpan = document.createElement("div");
  sourceSpan.className = "field-source";
  sourceSpan.textContent = `${tableName} (${fieldType})`;
  
  fieldInfo.appendChild(nameSpan);
  fieldInfo.appendChild(sourceSpan);
  fieldDiv.appendChild(fieldInfo);
  
  if (showActions) {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "field-actions";
    
    if (fieldType !== T5) {
      const linkBtn = document.createElement("button");
      linkBtn.className = "link-btn";
      linkBtn.textContent = "Link";
      linkBtn.onclick = (e) => {
        e.stopPropagation();
        createJoin(fieldName, tableName);
      };
      actionsDiv.appendChild(linkBtn);
    }
    
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = "×";
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeConfiguredField(fieldName, tableName);
    };
    
    actionsDiv.appendChild(removeBtn);
    fieldDiv.appendChild(actionsDiv);
  }
  
  return fieldDiv;
}

// Setup drag and drop functionality
function setupDragAndDrop() {
  const availableList = document.getElementById("availableList");
  const configuredList = document.getElementById("configuredList");
  
  // Add event listeners for drag and drop
  [availableList, configuredList].forEach(list => {
    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("drop", handleDrop);
    list.addEventListener("dragenter", handleDragEnter);
    list.addEventListener("dragleave", handleDragLeave);
  });
  
  // Delegate drag start events
  document.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("field-item")) {
      draggedElement = e.target;
      e.target.classList.add("dragging");
    }
  });
  
  document.addEventListener("dragend", (e) => {
    if (e.target.classList.contains("field-item")) {
      e.target.classList.remove("dragging");
      draggedElement = null;
    }
  });
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDragEnter(e) {
  if (e.target.classList.contains("field-list")) {
    e.target.classList.add("drag-over");
  }
}

function handleDragLeave(e) {
  if (e.target.classList.contains("field-list") && !e.target.contains(e.relatedTarget)) {
    e.target.classList.remove("drag-over");
  }
}

function handleDrop(e) {
  e.preventDefault();
  const targetList = e.target.closest(".field-list");
  targetList.classList.remove("drag-over");
  
  if (!draggedElement) return;
  
  const fieldName = draggedElement.dataset.field;
  const tableName = draggedElement.dataset.table;
  const fieldType = draggedElement.dataset.type;
  
  if (targetList.id === "configuredList") {
    addToConfigured(fieldName, tableName, fieldType);
  } else if (targetList.id === "availableList") {
    removeFromConfigured(fieldName, tableName);
  }
}

// Add field to configured list
function addToConfigured(fieldName, tableName, fieldType) {
  const exists = configuredFields.some(f => f.field === fieldName && f.table === tableName);
  if (exists) return;
  
  configuredFields.push({ field: fieldName, table: tableName, type: fieldType });
  updateConfiguredList();
}

// Remove field from configured list
function removeFromConfigured(fieldName, tableName) {
  const toRemove = configuredFields.find(f => f.field === fieldName && f.table === tableName);
  configuredFields.splice(configuredFields.indexOf(toRemove), 1);
  const existingJoin = joins.find(j => joinIncludesField(j, fieldName, tableName));
  if (existingJoin) {
    removeJoin(existingJoin.key);
  }
  updateConfiguredList();
}

// Remove configured field via button
function removeConfiguredField(fieldName, tableName) {
  removeFromConfigured(fieldName, tableName);
}

// Update the configured fields display
function updateConfiguredList() {
  const configuredList = document.getElementById("configuredList");
  
  if (configuredFields.length === 0) {
    configuredList.innerHTML = `<div class="empty-state">Drag fields here to configure your query</div>`;
    return;
  }
  
  configuredList.innerHTML = "";
  configuredFields.forEach(field => {
    const fieldElement = createFieldElement(field.field, field.table, field.type, true);
    configuredList.appendChild(fieldElement);
  });
  stylizeJoinedElements();
}

function runReport() {
  const fields = configuredFields.slice();
  const joins2 = joins.slice();
  const query = "SELECT";
  fields.forEach(f => {
    query += ""
  });
}

// Create a join between fields
function createJoin(fieldName, tableName) {
  const sourceField = tableSchemas[tableName].find(f => f.name === fieldName);
  const availableTargets = getAvailableJoinTargets(sourceField, tableName);
  
  if (availableTargets.length === 0) {
    alert("Add fields from other tables to create joins");
    return;
  }
  
  showLinkModal(fieldName, tableName, availableTargets);
}

// Get available fields that can be joined with the selected field
function getAvailableJoinTargets(sourceField, sourceTableName) {
  const targets = [];
  
  // Get all fields from all other data sources (tables)
  tableNames.forEach(tableName => {
    if (tableName !== sourceTableName &&
        configuredFields.some(f => f.table === tableName))
    {
      tableSchemas[tableName].forEach(field => {
        targets.push({
          field: field.name,
          table: tableName,
          type: field.type,
        });
      });
    }
  });
  targets.sort((a, b) => a.field.localeCompare(b.field));
  targets.sort((a, b) => a.table.localeCompare(b.table));
  targets.sort((a, b) => a.type === sourceField.type ? -1 : 0);
  return targets;
}



// Show the link modal
function showLinkModal(sourceFieldName, sourceTableName, availableTargets) {
  const modal = document.getElementById("linkModal");
  const sourceFieldInfo = document.getElementById("sourceFieldInfo");
  const sourceFieldNameEl = document.getElementById("sourceFieldName");
  const sourceFieldDetailsEl = document.getElementById("sourceFieldDetails");
  const targetFieldsList = document.getElementById("targetFieldsList");
  
  // Set source field info
  const sourceField = configuredFields.find(f => f.field === sourceFieldName && f.table === sourceTableName);
  sourceFieldNameEl.textContent = sourceFieldName;
  sourceFieldDetailsEl.textContent = `${sourceTableName} (${sourceField.type})`;
  
  // Clear and populate target fields
  targetFieldsList.innerHTML = "";
  
  if (availableTargets.length === 0) {
    targetFieldsList.innerHTML = `<div class="no-targets">No fields available for joining.<br>All available tables are already represented.</div>`;
  } else {
    availableTargets.forEach(target => {
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
      targetName.textContent = target.field;
      
      const targetDetails = document.createElement("div");
      targetDetails.className = "target-field-details";
      targetDetails.textContent = `${target.table} (${target.type})`;
      
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

// Close the link modal
function closeLinkModal() {
  const modal = document.getElementById("linkModal");
  modal.classList.remove("active");
}

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
  stylizeJoinedElements();
}

function stylizeJoinedElements() {
  const configuredData = configuredFields.map(field => {
    const element = document.body.querySelector(`#configuredList [data-field="${field.field}"][data-table="${field.table}"]`);
    element.classList.remove("join-item");
    element.querySelector(".field-name").textContent = field.field;
    return { field, element }
  });
  joins.forEach(join => {
    const field = configuredData.find(d =>
      joinIncludesField(join, d.field.field, d.field.table));
    if (field) {
      field.element.classList.add("join-item");
      field.element.querySelector(".field-name").textContent = `${join.leftTable}.${join.leftField} = ${join.rightTable}.${join.rightField}`;
    }
  });
}

function joinIncludesField(join, fieldName, tableName) {
  return (join.leftField === fieldName && join.leftTable === tableName) ||
         (join.rightField === fieldName && join.rightTable === tableName);
}

// Remove a join
function removeJoin(joinKey) {
  joins = joins.filter(j => j.key !== joinKey);
}

// Initialize the app when the page loads
init();

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
