const widgetWrapper = document.getElementById("widget-wrapper");
const widget = new Widget();

widget.appendTo(widgetWrapper);

document.getElementById("queryForm").addEventListener("submit", onSubmit);

async function onSubmit(e) {
  e.preventDefault();

  const query = document.getElementById("query").value.trim();
  const resultsDiv = document.getElementById("results");
  const executeBtn = document.getElementById("executeBtn");

  if (!query) {
    resultsDiv.innerHTML = `<div class="error">Please enter a SQL query.</div>`;
    return;
  }

  // Show loading state
  executeBtn.disabled = true;
  executeBtn.textContent = "Executing...";
  resultsDiv.innerHTML = `<div class="loading">Executing query...</div>`;

  try {
    const result = await executeQuery(query);
    resultsDiv.innerHTML = renderTable(result);
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error">Network error: ${escapeHtml(error.message)}</div>`;
  } finally {
    executeBtn.disabled = false;
    executeBtn.textContent = "Execute Query";
  }
}

function renderTable(result) {
  if (result.success) {
    if (result.columns && result.rows) {
      // SELECT query results
      let html = `<div class="success">Query executed successfully!</div>`;
      html += `<div class="row-count">Returned ${result.row_count} row(s)</div>`;

      if (result.rows.length > 0) {
        html += "<table>";
        html += "<thead><tr>";
        result.columns.forEach(col => {
          html += `<th>${escapeHtml(col)}</th>`;
        });
        html += "</tr></thead><tbody>";

        result.rows.forEach(row => {
          html += "<tr>";
          result.columns.forEach(col => {
            const value = row[col];
            html += `<td>${value !== null ? escapeHtml(String(value)) : "<em>NULL</em>"}</td>`;
          });
          html += "</tr>";
        });
        html += "</tbody></table>";
      }
      return html;
    }
    // Non-SELECT query results
    return `<div class="success">${result.message}</div>`;
  }
  return `<div class="error">Error: ${escapeHtml(result.error)}</div>`;
}

async function executeQuery(query) {
  const response = await fetch("/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query })
  });
  return await response.json();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
