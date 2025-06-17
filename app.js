/*
 vim:ts=2 sw=2
*/
import { sqlConnection, tableNames, tableLabels, tableSchemas } from "./tables.js";
import { showLinkModal } from "./linkModal.js";
import { setupDragAndDrop } from "./dragAndDrop.js";

export let configuredFields = [];
export let joins = [];

// Initialize the app
function init() {
  setupDataSourceSelect();
  setupDragAndDrop();
  updateAvailableFields();
}

function setupDataSourceSelect() {
  const dataSourceSelect = document.getElementById("dataSourceSelect");
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
  const selectedTable = document.getElementById("dataSourceSelect").value;
  const availableList = document.getElementById("availableList");
  const fields = tableSchemas[selectedTable];

  availableList.innerHTML = "";

  fields.forEach(field => {
    const fieldElement = createFieldElement(field.name, selectedTable, field.group);
    availableList.appendChild(fieldElement);
  });
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
  nameSpan.textContent = fieldName;

  const sourceSpan = document.createElement("div");
  sourceSpan.className = "field-source";
  sourceSpan.textContent = `${tableName} (${fieldGroup})`;

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

// Add field to configured list
export function addToConfigured(fieldName, tableName, fieldGroup, isRow) {
  const exists = configuredFields.some(f => f.field === fieldName && f.table === tableName);
  if (exists) return;

  configuredFields.push({ field: fieldName, table: tableName, group: fieldGroup, isRow });
  updateConfiguredList();
}

// Remove field from configured list
export function removeFromConfigured(fieldName, tableName) {
  const toRemove = configuredFields.find(f => f.field === fieldName && f.table === tableName);
  if (!toRemove) return;
  configuredFields.splice(configuredFields.indexOf(toRemove), 1);
  const existingJoin = joins.find(j => isFieldBeingJoined(j, fieldName, tableName));
  if (existingJoin) {
    removeJoin(existingJoin.key);
  }
  updateConfiguredList();
}

// Update the configured fields display
function updateConfiguredList() {
  const configuredRows = document.getElementById("configuredList-rows");
  const configuredCols = document.getElementById("configuredList-cols");
  if (configuredFields.length === 0) {
    configuredRows.innerHTML = `<div class="empty-state">Drag fields here to configure your query</div>`;
    configuredCols.innerHTML = `<div class="empty-state">Drag fields here to configure your query</div>`;
    return;
  }
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
  handleStateChange();
}

export function handleStateChange() {
  stylizeJoinedElements();
  runReport();
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
    queryFields.push(field);
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
    query += `\nJOIN ${tableName}\n ON ${criteria}`;
  });
  if (groupFields.length) {
    query += `\nGROUP BY${groupFields}`;
  }
  console.debug(query);
  return query;
}

const emptyQueryResult = { columns: [], values: [] };

function runReport() {
  if (configuredFields.length === 0) return;
  const query = buildSqlQuery();
  sqlConnection.then(db => {
    let result = emptyQueryResult;
    try {
      result = db.exec(query)[0] || emptyQueryResult;
      console.debug(result);
    } catch (e) {
      console.warn(e);
    }
    createTable(result.columns, result.values);
  });
}

// Get available fields that can be joined with the selected field
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
    element.querySelector(".field-name").textContent = field.field;
    return { field, element }
  });
  joins.forEach(join => {
    const field = configuredData.find(d =>
      isFieldBeingJoined(join, d.field.field, d.field.table));
    if (field) {
      field.element.classList.add("join-item");
      field.element.querySelector(".field-name").textContent = `${join.leftTable}.${join.leftField} = ${join.rightTable}.${join.rightField}`;
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

const noDataHtml = '<div class="no-data">No data to display</div>';

function createTable(columns, values) {
  const tableContainer = document.getElementById('tableContainer');

  if (values.length === 0) {
    tableContainer.innerHTML = noDataHtml;
    return;
  }

  let html = '<table>';

  // Create header
  html += '<thead><tr>';
  columns.forEach(column => {
    html += `<th>${escapeHtml(column)}</th>`;
  });
  html += '</tr></thead>';

  // Create body
  html += '<tbody>';
  values.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      html += `<td>${escapeHtml(String(cell))}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  html = applyRowspanGrouping(html);
  tableContainer.innerHTML = `<div class="table-container">${html}</div>`;
}

function applyRowspanGrouping(html) {
  const table = document.createElement("TABLE");
  table.innerHTML = html;

  const docFrag = document.createElement("DIV");
  docFrag.appendChild(table);

  const tbody = table.querySelector('tbody');
  if (!tbody) return noDataHtml;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (rows.length === 0) return noDataHtml;

  const numColumns = rows[0].cells.length;

  // Helper function to get the actual cell value at a given row/column position
  // accounting for rowspans that might affect which physical cell we're looking at
  function getCellValue(rowIndex, colIndex) {
    const row = rows[rowIndex];
    let physicalCellIndex = 0;
    let logicalCellIndex = 0;

    // Walk through the cells in this row to find the one at our logical column
    for (let cell of row.cells) {
      if (logicalCellIndex === colIndex) {
        return cell.textContent.trim();
      }

      // This cell might span multiple logical columns due to previous rowspan operations
      // For now, we assume each cell represents one logical column
      logicalCellIndex++;
    }

    // If we can't find the cell in this row, it might be spanned from above
    // Look backwards through rows to find the cell that spans to this position
    for (let checkRow = rowIndex - 1; checkRow >= 0; checkRow--) {
      const checkRowEl = rows[checkRow];
      let checkLogicalCol = 0;

      for (let cell of checkRowEl.cells) {
        const rowspan = parseInt(cell.rowSpan) || 1;

        if (checkLogicalCol === colIndex && (checkRow + rowspan) > rowIndex) {
          return cell.textContent.trim();
        }

        checkLogicalCol++;
      }
    }

    return null; // Shouldn't happen in a well-formed table
  }

  // Helper function to get the actual cell element at a given row/column position
  function getCell(rowIndex, colIndex) {
    const row = rows[rowIndex];
    let logicalCellIndex = 0;

    for (let cell of row.cells) {
      if (logicalCellIndex === colIndex) {
        return cell;
      }
      logicalCellIndex++;
    }

    return null; // Cell is spanned from above
  }

  // Process from left to right (column by column)
  for (let col = 0; col < numColumns; col++) {
    let rowIndex = 0;

    while (rowIndex < rows.length) {
      const startValue = getCellValue(rowIndex, col);
      if (startValue === null) {
        rowIndex++;
        continue;
      }

      let groupEnd = rowIndex + 1;

      // Find how many consecutive rows have the same value in this column
      while (groupEnd < rows.length &&
             getCellValue(groupEnd, col) === startValue) {
        groupEnd++;
      }

      const groupSize = groupEnd - rowIndex;

      // Check if we can apply rowspan (all left columns must span at least this many rows)
      let canApplyRowspan = true;
      if (col > 0 && groupSize > 1) {
        // Check each row in the group to see if left columns have adequate rowspan
        for (let checkRow = rowIndex; checkRow < groupEnd; checkRow++) {
          for (let leftCol = 0; leftCol < col; leftCol++) {
            // Find the cell that covers this position
            let foundSpanningCell = false;

            for (let searchRow = checkRow; searchRow >= 0; searchRow--) {
              const cell = getCell(searchRow, leftCol);
              if (cell) {
                const rowspan = parseInt(cell.rowSpan) || 1;
                if (searchRow + rowspan > checkRow) {
                  // This cell spans to our current row
                  if (searchRow + rowspan < groupEnd) {
                    // But it doesn't span far enough for our desired group
                    canApplyRowspan = false;
                    break;
                  }
                  foundSpanningCell = true;
                  break;
                }
              }
            }

            if (!canApplyRowspan || !foundSpanningCell) {
              canApplyRowspan = false;
              break;
            }
          }
          if (!canApplyRowspan) break;
        }
      }

      if (canApplyRowspan && groupSize > 1) {
        // Apply rowspan to the first cell in the group
        const firstCell = getCell(rowIndex, col);
        if (firstCell) {
          firstCell.rowSpan = groupSize;

          // Remove corresponding cells from subsequent rows in the group
          for (let i = rowIndex + 1; i < groupEnd; i++) {
            const cellToRemove = getCell(i, col);
            if (cellToRemove) {
              cellToRemove.remove();
            }
          }
        }
      }

      rowIndex = groupEnd;
    }
  }
  return docFrag.innerHTML;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize the app when the page loads
init();
