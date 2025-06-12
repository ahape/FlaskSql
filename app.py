#!/usr/bin/env python3.11
from flask import Flask, render_template, request, jsonify
import sqlite3
import os
from contextlib import closing

app = Flask(__name__)

# Configuration - Add your database paths here
DATABASES = {
  "calls": "databases/calls.db",
  "tickets": "databases/tickets.db",
}

def get_db_connection(db_name):
  """Get database connection for the specified database."""
  if db_name not in DATABASES:
    raise ValueError(f"Database {db_name} not found in configuration")
  
  db_path = DATABASES[db_name]
  return sqlite3.connect(db_path)

def execute_query(db_name, query):
  """Execute SQL query and return results."""
  try:
    with closing(get_db_connection(db_name)) as conn:
      conn.row_factory = sqlite3.Row  # This allows us to access columns by name
      cursor = conn.cursor()
      cursor.execute(query)
      
      # Check if it"s a SELECT query
      if query.strip().upper().startswith("SELECT"):
        rows = cursor.fetchall()
        columns = [description[0] for description in cursor.description]
        return {
          "success": True,
          "columns": columns,
          "rows": [dict(row) for row in rows],
          "row_count": len(rows)
        }
      else:
        # For INSERT, UPDATE, DELETE, etc.
        conn.commit()
        return {
          "success": True,
          "message": f"Query executed successfully. {cursor.rowcount} row(s) affected.",
          "row_count": cursor.rowcount
        }
  except Exception as e:
    return {
      "success": False,
      "error": str(e)
    }

@app.route("/")
def index():
  """Main page with query interface."""
  return render_template("index.html", databases=list(DATABASES.keys()))

@app.route("/execute", methods=["POST"])
def execute():
  """Execute SQL query endpoint."""
  data = request.get_json()
  db_name = data.get("database")
  query = data.get("query", "").strip()
  
  if not db_name or not query:
    return jsonify({"success": False, "error": "Database and query are required"})
  
  result = execute_query(db_name, query)
  return jsonify(result)

# HTML Template
html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SQL Query Interface</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      text-align: center;
      margin-bottom: 30px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }
    select, textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    textarea {
      min-height: 120px;
      font-family: "Courier New", monospace;
      resize: vertical;
    }
    button {
      background-color: #007bff;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    button:hover {
      background-color: #0056b3;
    }
    button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
    .results {
      margin-top: 30px;
    }
    .error {
      background-color: #f8d7da;
      color: #721c24;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #f5c6cb;
    }
    .success {
      background-color: #d4edda;
      color: #155724;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #c3e6cb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: white;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
      color: #495057;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #e8f4fd;
    }
    .loading {
      text-align: center;
      padding: 20px;
      color: #666;
    }
    .row-count {
      margin-top: 10px;
      font-style: italic;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>SQL Query Interface</h1>
    
    <form id="queryForm">
      <div class="form-group">
        <label for="database">Select Database:</label>
        <select id="database" name="database" required>
          {% for db in databases %}
          <option value="{{ db }}">{{ db }}</option>
          {% endfor %}
        </select>
      </div>
      
      <div class="form-group">
        <label for="query">SQL Query:</label>
        <textarea id="query" name="query" placeholder="Enter your SQL query here..." required></textarea>
      </div>
      
      <button type="submit" id="executeBtn">Execute Query</button>
    </form>
    
    <div id="results" class="results"></div>
  </div>

  <script>
    document.getElementById("queryForm").addEventListener("submit", async function(e) {
      e.preventDefault();
      
      const database = document.getElementById("database").value;
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
        const response = await fetch("/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ database, query })
        });
        
        const result = await response.json();
        
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
            resultsDiv.innerHTML = html;
          } else {
            // Non-SELECT query results
            resultsDiv.innerHTML = `<div class="success">${result.message}</div>`;
          }
        } else {
          resultsDiv.innerHTML = `<div class="error">Error: ${escapeHtml(result.error)}</div>`;
        }
      } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Network error: ${escapeHtml(error.message)}</div>`;
      } finally {
        executeBtn.disabled = false;
        executeBtn.textContent = "Execute Query";
      }
    });
    
    function escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>
"""

CREATE_TICKETS_TABLE = """
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY,
    assignee TEXT UNIQUE,
    avg_resolution_time INTEGER
  )
  ;
  INSERT OR IGNORE INTO tickets (assignee, avg_resolution_time) VALUES 
    ("John Doe", 30),
    ("Jane Smith", 25),
    ("Bob Johnson", 35)
"""
CREATE_CALLS_TABLE = """
  CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY,
    agent TEXT UNIQUE,
    avg_handle_time INTEGER
  )
  ;
  INSERT OR IGNORE INTO calls (agent, avg_handle_time) VALUES 
    ("John Doe", 130),
    ("Jane Smith", 125),
    ("Bob Johnson", 135)
"""

if __name__ == "__main__":
  os.makedirs("templates", exist_ok=True)

  with open("templates/index.html", "w") as f:
    f.write(html_template)

  # Create some sample databases for testing
  def create_sample_db(path, queries):
    with closing(sqlite3.connect(path)) as conn:
      cursor = conn.cursor()
      for query in queries.split(";"):
        cursor.execute(query)
      conn.commit()
  
  create_sample_db(DATABASES["calls"], CREATE_CALLS_TABLE)
  create_sample_db(DATABASES["tickets"], CREATE_TICKETS_TABLE)
  
  print("Starting SQL Query Web App...")
  print("Visit http://localhost:5001 to use the application")
  print("Sample database 'sample.db' created with a 'users' table")
  app.run(debug=True, port=5001)
