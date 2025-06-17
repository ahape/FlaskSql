/*
 vim:ts=2 sw=2
*/
import { removeFromConfigured, addToConfigured } from "./app.js";

let draggedElement = null;

export function setupDragAndDrop() {
  const availableList = document.getElementById("availableList");
  const configuredRows = document.getElementById("configuredList-rows");
  const configuredCols = document.getElementById("configuredList-cols");

  // Add event listeners for drag and drop
  [availableList, configuredRows, configuredCols].forEach(list => {
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
  const fieldGroup = draggedElement.dataset.group;

  removeFromConfigured(fieldName, tableName);

  switch (targetList.id) {
    case "configuredList-rows":
      return addToConfigured(fieldName, tableName, fieldGroup, true);
    case "configuredList-cols":
      return addToConfigured(fieldName, tableName, fieldGroup, false);
  }
}
