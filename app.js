import { sqlConnection, tableNames, tableLabels, tableSchemas } from "./tables.js";
import { showLinkModal } from "./linkModal.js";
import { setupDragAndDrop } from "./dragAndDrop.js";
import "./tooltip.js"

export let configuredFields = [];
export let joins = [];
export const tableContainer = document.getElementById('tableContainer');
export const dataSourceSelect = document.getElementById("dataSourceSelect");
export const savedReportSelect = document.getElementById("savedReportSelect");
export const saveReportButton = document.getElementById("saveReportButton");
export const availableList = document.getElementById("availableList");
export const configuredRows = document.getElementById("configuredList-rows");
export const configuredCols = document.getElementById("configuredList-cols");
const localStorageKey = "__xdatademo__";

export function addToConfigured(fieldName, tableName, fieldGroup, isRow, insertIndex = -1) {
  const exists = configuredFields.some(f => f.field === fieldName && f.table === tableName);
  if (exists) return;

  const field = {
    field: fieldName,
    table: tableName,
    group: fieldGroup,
    isRow,
  };
  if (insertIndex > -1) {
    configuredFields.splice(insertIndex, 0, field);
  } else {
    configuredFields.push(field);
  }
  handleStateChange();
}

export function removeFromConfigured(fieldName, tableName, isSamePanel) {
  const toRemove = findConfiguredField(fieldName, tableName);
  if (!toRemove) return;
  configuredFields.splice(configuredFields.indexOf(toRemove), 1);
  // Handle removing joins EXPLICITLY (the joining field is being removed)
  if (!isSamePanel) {
    let existingJoin = null;
    while (existingJoin = findJoin(fieldName, tableName)) {
      removeJoin(existingJoin);
    }
  }
  // Handle removing joins IMPLICITLY (the last metric field is being removed)
  const orphanedJoins = joins.filter(j =>
    !configuredFields.some(f => f.table === j.leftTable) ||
    !configuredFields.some(f => f.table === j.rightTable));
  orphanedJoins.forEach(removeJoin);
  handleStateChange();
}

// If configuredFields or joins is modified, this needs to be triggered
export function handleStateChange() {
  updateConfiguredList();
  updateAvailableFields();
  stylizeJoinedElements();
  runReport();
}

function findConfiguredField(fieldName, tableName) {
  return configuredFields.find(f => f.field === fieldName && f.table === tableName);
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
  setupSavedReportSelect();
  setupDragAndDrop();
  updateAvailableFields();
  saveReportButton.onclick = saveReport;
}

function setupSavedReportSelect() {
  savedReportSelect.addEventListener("change", changeSavedReport);

  const options = ["Choose from saved reports"].concat(Object.keys(loadSavedReports()));
  options.forEach(label => {
    const option = document.createElement("OPTION");
    option.textContent = label;
    savedReportSelect.appendChild(option);
  });
}

function loadSavedReports() {
  const json = localStorage.getItem(localStorageKey);
  if (json) {
    return JSON.parse(json);
  }
  return {};
}

function saveReport() {
  const data = loadSavedReports();
  const label = prompt("Name your report");
  data[label] = { configuredFields, joins };
  localStorage.setItem(localStorageKey, JSON.stringify(data));
}

function changeSavedReport() {
  const report = loadSavedReports()[savedReportSelect.value];
  if (report) {
    configuredFields = report.configuredFields;
    joins = report.joins;
    handleStateChange();
  } else {
    console.warn("No report found in localStorage");
  }
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
  const fields = tableSchemas[selectedTable].filter(f => {
    if (findConfiguredField(f.name, selectedTable)) {
      return false;
    }
    if (findJoin(f.name, selectedTable)) {
      return false;
    }
    return true;
  });

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
      tableSchemas[tableName]
        .filter(({ name }) => !findJoin(name, tableName))
        .forEach(({ name, group }) => targets.push({
          field: name,
          table: tableName,
          group,
        }));
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

const emptyConfiguredListHtml = `<div class="empty-state">Drag fields here to configure your query</div>`;

// Update the configured fields display
function updateConfiguredList() {
  configuredCols.innerHTML = configuredRows.innerHTML = emptyConfiguredListHtml;
  configuredFields.forEach(field => {
    const fieldElement = createFieldElement(field.field, field.table, field.group, true);
    const container = field.isRow ? configuredRows : configuredCols;
    const placeholder = container.querySelector(".empty-state");
    if (placeholder) {
      container.removeChild(placeholder);
    }
    container.appendChild(fieldElement);
  });
}

function prepareQueryFields() {
  const fields = configuredFields.slice(0);
  fields.sort((a, b) => {
    if (a.isRow && b.isRow) return 0;
    if (a.isRow) return -1;
    if (b.isRow) return 1;
    if (!a.isRow && !b.isRow) return 0;
  });
  return fields;
}

function buildSqlQuery() {
  const primaryTable = (
    configuredFields.find(f => findJoin(f.field, f.table)) ||
    configuredFields[0]
  ).table;
  const fields = prepareQueryFields();
  const reportConfig = {
    rows: [], cols: [], vals: [], joins: [],
  };
  const queryFields = [];
  const groupFields = [];
  fields.forEach(f => {
    const field = `${f.table}.${f.field}`;
    if (f.isRow) {
      groupFields.push(" " + field);
    }
    const agg = tableField(f.field, f.table).aggregator;
    if (agg) {
      reportConfig.vals.push(field);
      queryFields.push(" " + agg.replace("VALUE", field));
    } else if (!f.isRow) {
      reportConfig.cols.push(field);
      queryFields.push(` CASE
  WHEN COUNT(DISTINCT(${field})) = 1
  THEN ${field}
  ELSE "warn3"
 END AS ${field.replace(".","$")}`);
    } else {
      reportConfig.rows.push(field);
      queryFields.push(" " + field);
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
    const criterion = `${left.table}.${left.field} = ${right.table}.${right.field}`;
    reportConfig.joins.push(criterion);
    criteria.push(criterion);
  });
  Object.keys(tableJoins).forEach(tableName => {
    const criteria = tableJoins[tableName].join("\n AND ");
    query += `\nFULL OUTER JOIN ${tableName}\n ON ${criteria}`;
  });
  if (groupFields.length) {
    query += `\nGROUP BY${groupFields}`;
    query += `\nORDER BY${groupFields} DESC`;
  }
  console.debug(JSON.stringify(reportConfig, null, 2));
  console.debug(query);
  return query;
}

const emptyQueryResult = { columns: [], values: [] };

function validateReport() {
  if (configuredFields.length === 0) {
    tableContainer.innerHTML = '<div class="no-data">No rows, columns, or values configured</div>';
    return false;
  }
  if (configuredFields.filter(f => f.isRow).length === 0) {
    tableContainer.innerHTML = '<div class="no-data">Report must contain at least one row</div>';
    return false;
  }
  const table = findTableWithoutMetric();
  if (table) {
    tableContainer.innerHTML = `<div class="no-data">Report must contain at least one value (metric) from ${table}</div>`;
    return false;
  }
  return true;
}

function findTableWithoutMetric() {
  const fieldsByTable = configuredFields.reduce((agg, cur) => {
    (agg[cur.table] ||= []).push(cur);
    return agg;
  }, {});
  const table = Object.keys(fieldsByTable).find(table => {
    return !fieldsByTable[table].some(f => f.group === "metric");
  });
  return table ? tableLabel(table) : "";
}

function runReport() {
  if (validateReport()) {
    const query = buildSqlQuery();
    sqlConnection.then(db => {
      let result = emptyQueryResult;
      let isJoinRequired = false;
      try {
        result = db.exec(query)[0] || emptyQueryResult;
        console.debug(result);
      } catch (e) {
        isJoinRequired = e.message.includes("no such column");
        if (!isJoinRequired) {
          console.warn(e);
        }
      }
      if (isJoinRequired) {
        tableContainer.innerHTML = '<div class="no-data">You must choose a <strong>link</strong> between tables</div>';
      } else if (result.values.length === 0) {
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
  const sourceField = tableField(fieldName, tableName);
  const availableTargets = getAvailableJoinTargets(sourceField, tableName);

  if (availableTargets.length === 0) {
    alert("Add fields from other tables to create joins");
    return;
  }

  showLinkModal(fieldName, tableName, availableTargets);
}

function stylizeJoinedElements() {
  const configuredData = configuredFields.map(field => {
    const childSelector = `[data-field="${field.field}"][data-table="${field.table}"]`;
    const element = document.body.querySelector(`
      #configuredList-rows ${childSelector},
      #configuredList-cols ${childSelector}`);
    // Reset style (no join styling)
    element.classList.remove("join-item");
    // Reset label back to default
    labelEl(element).textContent = fieldLabel(field.field, field.table);
    return { field, element }
  });

  const joinData = new Map();
  joins.forEach(join => {
    configuredData
      .filter(({ field }) => isFieldBeingJoined(join, field.field, field.table))
      .forEach(({ element, field }) => {
        element.classList.add("join-item");

        const leftTable = tableLabel(join.leftTable);
        const rightTable = tableLabel(join.rightTable);
        const leftField = fieldLabel(join.leftField, join.leftTable);
        const rightField = fieldLabel(join.rightField, join.rightTable);

        const conditions = joinData.get(element) || [];
        conditions.push(`${leftTable}.${leftField} = ${rightTable}.${rightField}`);
        joinData.set(element, conditions);

        const label = fieldLabel(field.field, field.table);
        const tooltip = `<strong data-tooltip="${conditions.join("<br />")}">(+${conditions.length})</strong>`
        labelEl(element).innerHTML = label + " " + tooltip;
      });
  });

  function labelEl(element) {
    return element.querySelector(".field-name");
  }
}

function findJoin(fieldName, tableName) {
  return joins.find(j => isFieldBeingJoined(j, fieldName, tableName));
}

function isFieldBeingJoined(join, fieldName, tableName) {
  return (join.leftField === fieldName && join.leftTable === tableName) ||
         (join.rightField === fieldName && join.rightTable === tableName);
}

function removeJoin(join) {
  joins = joins.filter(j => j !== join);
}

const warn1tooltip = `Data was not found in one of the joined tables`;
const warn2tooltip = `Table 1's grouping is too granular, causing Table 2's values to be duplicated across multiple rows`;
const warn3tooltip = `Table 1's grouping is too broad, forcing Table 2 to combine (non-aggregable) text columns`;

function createTable(columns, values) {
  const duplicates = findPossibleDuplicateCells(values);
  let html = '<table><thead><tr>';
  columns.map(escapeHtml).forEach(column => {
    html += `<th>${column}</th>`;
  });
  html += '</tr></thead><tbody>';
  values.forEach((row, rowIndex) => {
    html += '<tr>';
    row.map(escapeHtml).forEach((cell, colIndex) => {
      if (cell == null) {
        cell = `<em data-tooltip="${warn1tooltip}">WARN</em><sup>1</sup>`;
      } else if (duplicates.has(String([rowIndex, colIndex]))) {
        cell = `<em data-tooltip="${warn2tooltip}">WARN</em><sup>2</sup>`;
      } else if (cell === "warn3") {
        cell = `<em data-tooltip="${warn3tooltip}">WARN</em><sup>3</sup>`;
      }
      const classAttr = cell.includes("WARN") ? ` class="warn"` : '';
      html += `<td${classAttr}>${cell}</td>`;
    });
    html += '</tr>';
  });
  return html + '</tbody></table>';
}

function findPossibleDuplicateCells(values) {
  const duplicateCells = new Set();
  const reportLayout = prepareQueryFields();
  const rowGroups = reportLayout.filter(f => f.isRow).length;
  if (rowGroups === 0)
    return duplicateCells;

  const valueIndexValues = reportLayout
    .map((f, i) => f.group === "metric" ? i : -1)
    .filter(f => f > -1)
    .reduce((agg, curIndex) => {
      agg.set(curIndex, new Set());
      return agg;
    }, new Map());

  values.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const existing = valueIndexValues.get(colIndex)
      if (existing && cell != null) {
        const key = String(cell);
        if (existing.has(key)) {
          duplicateCells.add(String([rowIndex, colIndex]));
        }
        existing.add(key);
      }
    });
  });
  return duplicateCells;
}

function escapeHtml(value) {
  if (value == null) return null;
  const text = String(value);
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize the app when the page loads
init();
