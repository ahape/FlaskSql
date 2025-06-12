#!/usr/bin/env python3.11
from flask import Flask, render_template, request, jsonify
import sqlite3
import os
import shutil
from contextlib import closing

app = Flask(__name__)

# Configuration - Add your database paths here
TABLES = ["Calls", "Tickets"]
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

def execute_query(query):
  """Execute SQL query and return results."""
  try:
    with closing(sqlite3.connect("database.db")) as conn:
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
  shutil.copy("templates/index.html", "index.html")
  return render_template("index.html", tables=TABLES)

@app.route("/execute", methods=["POST"])
def execute():
  """Execute SQL query endpoint."""
  data = request.get_json()
  print("Dataaaaaaa")
  print(data)
  query = data.get("query", "").strip()
  
  if not query:
    return jsonify({"success": False, "error": "Query required"})
  
  result = execute_query(query)
  return jsonify(result)

def bootstrap_query(queries):
  with closing(sqlite3.connect("database.db")) as conn:
    cursor = conn.cursor()
    for query in queries.split(";"):
      cursor.execute(query)
    conn.commit()

def main():
  bootstrap_query(CREATE_CALLS_TABLE)
  bootstrap_query(CREATE_TICKETS_TABLE)
  
  print("Visit http://localhost:5001 to use the application")
  app.run(debug=True, port=5001)

if __name__ == "__main__":
  main()
