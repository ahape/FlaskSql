/*
 vim:ts=2 sw=2
*/
import { sqlConnection, tableNames, tableLabels, tableSchemas } from "./tables.js";
import { showLinkModal } from "./linkModal.js";
import { setupDragAndDrop } from "./dragAndDrop.js";

export let configuredFields = [];
export let joins = [];
export const tableContainer = document.getElementById('tableContainer');
export const dataSourceSelect = document.getElementById("dataSourceSelect");
export const availableList = document.getElementById("availableList");
export const configuredRows = document.getElementById("configuredList-rows");
export const configuredCols = document.getElementById("configuredList-cols");

// Add field to configured list
export function addToConfigured(fieldName, tableName, fieldGroup, isRow, insertIndex = -1) {
  const exists = configuredFields.some(f => f.field === fieldName && f.table === tableName);
  if (exists) return;

  const field = { field: fieldName, table: tableName, group: fieldGroup, isRow };

  if (insertIndex > -1) {
    configuredFields.splice(insertIndex, 0, field);
  } else {
    configuredFields.push(field);
  }
  updateConfiguredList();
}

// Remove field from configured list
export function removeFromConfigured(fieldName, tableName, isSamePanel) {
  const toRemove = configuredFields.find(f => f.field === fieldName && f.table === tableName);
  if (!toRemove) return;
  configuredFields.splice(configuredFields.indexOf(toRemove), 1);
  if (!isSamePanel) {
    const existingJoin = joins.find(j => isFieldBeingJoined(j, fieldName, tableName));
    if (existingJoin) {
      removeJoin(existingJoin.key);
    }
  }
  updateConfiguredList();
}

export function handleStateChange() {
  stylizeJoinedElements();
  runReport();
}

export function tableLabel(tableName) {
  return tableLabels[tableNames.indexOf(tableName)];
}

function tableField(fieldName, tableName) {
  return tableSchemas[tableName].find(x => x.name === fieldName);
}

export function fieldLabel(fieldName, tableName) {
  return tableField(fieldName, tableName).label;
}

// Initialize the app
function init() {
  setupDataSourceSelect();
  setupDragAndDrop();
  updateAvailableFields();
}

function setupDataSourceSelect() {
  dataSourceSelect.addEventListener("change", updateAvailableFields);

  tableNames.forEach((tableName, i) => {
    const option = document.createElement("OPTION");
    option.textContent = tableLabels[i];
    option.value = tableName;
    dataSourceSelect.appendChild(option);
  });
}

// Update available fields based on selected data source
function updateAvailableFields() {
  const selectedTable = dataSourceSelect.value;
  const fields = tableSchemas[selectedTable];

  availableList.innerHTML = "";

  fields.forEach(field => {
    const fieldElement = createFieldElement(field.name, selectedTable, field.group);
    availableList.appendChild(fieldElement);
  });
}

export function getAvailableJoinTargets(sourceField, sourceTableName) {
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
          group: field.group,
        });
      });
    }
  });
  targets.sort((a, b) => a.field.localeCompare(b.field));
  targets.sort((a, b) => a.table.localeCompare(b.table));
  targets.sort((a, b) => a.group === sourceField.group ? -1 : 0);
  return targets;
}

// Create a field element
function createFieldElement(fieldName, tableName, fieldGroup, showActions = false) {
  const fieldDiv = document.createElement("div");
  fieldDiv.className = "field-item";
  fieldDiv.draggable = true;
  fieldDiv.dataset.field = fieldName;
  fieldDiv.dataset.table = tableName;
  fieldDiv.dataset.group = fieldGroup;

  const fieldInfo = document.createElement("div");
  fieldInfo.className = "field-info";

  const nameSpan = document.createElement("div");
  nameSpan.className = "field-name";
  nameSpan.textContent = fieldLabel(fieldName, tableName);

  const sourceSpan = document.createElement("div");
  sourceSpan.className = "field-source";
  sourceSpan.textContent = `${tableLabel(tableName)} (${fieldGroup})`;

  fieldInfo.appendChild(nameSpan);
  fieldInfo.appendChild(sourceSpan);
  fieldDiv.appendChild(fieldInfo);

  if (showActions) {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "field-actions";

    if (fieldGroup !== "metric") {
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
      removeFromConfigured(fieldName, tableName);
    };

    actionsDiv.appendChild(removeBtn);
    fieldDiv.appendChild(actionsDiv);
  }

  return fieldDiv;
}

// Update the configured fields display
function updateConfiguredList() {
  if (configuredFields.length === 0) {
    configuredRows.innerHTML = `<div class="empty-state">Drag fields here to configure your query</div>`;
    configuredCols.innerHTML = `<div class="empty-state">Drag fields here to configure your query</div>`;
  } else {
    configuredRows.innerHTML = "";
    configuredCols.innerHTML = "";
    configuredFields.forEach(field => {
      const fieldElement = createFieldElement(field.field, field.table, field.group, true);
      if (field.isRow) {
        configuredRows.appendChild(fieldElement);
      } else {
        configuredCols.appendChild(fieldElement);
      }
    });
    configuredFields.sort((a, b) => {
      if (a.isRow && b.isRow) return 0;
      if (a.isRow) return -1;
      if (b.isRow) return 1;
      if (!a.isRow && !b.isRow) return 0;
    });
  }
  handleStateChange();
}

function buildSqlQuery() {
  const primaryTable = configuredFields[0].table;
  const queryFields = [];
  const groupFields = [];
  configuredFields.forEach(f => {
    const field = ` ${f.table}.${f.field}`;
    if (f.isRow) {
      groupFields.push(field);
    }
    const agg = tableField(f.field, f.table).aggregator;
    if (agg) {
      queryFields.push(" " + agg.replace("VALUE", field.trim()));
    } else {
      queryFields.push(field);
    }
  });
  let query = "SELECT\n";
  query += queryFields.join(",\n");
  query += `\nFROM ${primaryTable}`;
  const tableJoins = {};
  joins.forEach(j => {
    const left = j.leftTable !== primaryTable ?
      { table: j.leftTable, field: j.leftField } :
      { table: j.rightTable, field: j.rightField };
    const right = j.leftTable !== left.table ?
      { table: j.leftTable, field: j.leftField } :
      { table: j.rightTable, field: j.rightField };
    const criteria = (tableJoins[left.table] ||= []);
    criteria.push(`${left.table}.${left.field} = ${right.table}.${right.field}`);
  });
  Object.keys(tableJoins).forEach(tableName => {
    const criteria = tableJoins[tableName].join("\n AND ");
    query += `\nFULL OUTER JOIN ${tableName}\n ON ${criteria}`;
  });
  if (groupFields.length) {
    query += `\nGROUP BY${groupFields}`;
    query += `\nORDER BY${groupFields} DESC`;
  }
  console.debug(query);
  return query;
}

const emptyQueryResult = { columns: [], values: [] };

function validateReport() {
  if (configuredFields.length === 0) {
    tableContainer.innerHTML = '<div class="no-data">No rows, columns, or values configured</div>';
    return false;
  }
  /*
  if (!configuredFields.some(f => f.group === "metric")) {
    tableContainer.innerHTML = '<div class="no-data">Report must contain at least one value (metric)</div>';
    return false;
  }
  */
  const fieldsByTable = configuredFields.reduce((agg, cur) => {
    (agg[cur.table] ||= []).push(cur);
    return agg;
  }, {});

  const tableWithoutMetric = Object.keys(fieldsByTable).find(table => {
    return !fieldsByTable[table].some(f => f.group === "metric");
  });
  if (tableWithoutMetric) {
    tableContainer.innerHTML = `<div class="no-data">Report must contain at least one value (metric) from ${tableLabel(tableWithoutMetric)} </div>`;
    return false;
  }
  return true;
}
function runReport() {
  if (validateReport()) {
    const query = buildSqlQuery();
    sqlConnection.then(db => {
      let result = emptyQueryResult;
      try {
        result = db.exec(query)[0] || emptyQueryResult;
        console.debug(result);
      } catch (e) {
        console.warn(e);
      }
      if (result.values.length === 0) {
        tableContainer.innerHTML = '<div class="no-data">No data to display</div>';
      } else {
        const html = createTable(result.columns, result.values);
        tableContainer.innerHTML = `<div class="table-container">${html}</div>`;
      }
    });
  }
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

function stylizeJoinedElements() {
  const configuredData = configuredFields.map(field => {
    const dataSelector = `[data-field="${field.field}"][data-table="${field.table}"]`;
    const element = document.body.querySelector(`#configuredList-rows ${dataSelector}, #configuredList-cols ${dataSelector}`);
    element.classList.remove("join-item");
    element.querySelector(".field-name").textContent = fieldLabel(field.field, field.table);
    return { field, element }
  });
  joins.forEach(join => {
    const field = configuredData.find(d =>
      isFieldBeingJoined(join, d.field.field, d.field.table));
    if (field) {
      field.element.classList.add("join-item");
      const leftTable = tableLabel(join.leftTable);
      const rightTable = tableLabel(join.rightTable);
      const leftField = fieldLabel(join.leftField, join.leftTable);
      const rightField = fieldLabel(join.rightField, join.rightTable);
      field.element.querySelector(".field-name").textContent = `${leftTable}.${leftField} = ${rightTable}.${rightField}`;
    }
  });
}

function isFieldBeingJoined(join, fieldName, tableName) {
  return (join.leftField === fieldName && join.leftTable === tableName) ||
         (join.rightField === fieldName && join.rightTable === tableName);
}

// Remove a join
function removeJoin(joinKey) {
  joins = joins.filter(j => j.key !== joinKey);
}

function createTable(columns, values) {
  let html = '<table>';
  html += '<thead><tr>';
  columns.map(escapeHtml).forEach(column => {
    html += `<th>${column}</th>`;
  });
  html += '</tr></thead>';
  html += '<tbody>';
  values.forEach(row => {
    html += '<tr>';
    row.map(escapeHtml).forEach(cell => {
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function escapeHtml(value) {
  if (value == null) return "NULL";
  const text = String(value);
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize the app when the page loads
init();
