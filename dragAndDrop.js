import { removeFromConfigured, addToConfigured } from "./app.js";

let draggedElement = null;
let draggedFromContainer = null;
let dropIndicator = null;

export function setupDragAndDrop() {
  const availableList = document.getElementById("availableList");
  const configuredRows = document.getElementById("configuredList-rows");
  const configuredCols = document.getElementById("configuredList-cols");

  // Create drop indicator element
  createDropIndicator();

  // Add event listeners for drag and drop
  [availableList, configuredRows, configuredCols].forEach(list => {
    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("drop", handleDrop);
    list.addEventListener("dragenter", handleDragEnter);
    list.addEventListener("dragleave", handleDragLeave);
  });

  // Delegate drag start events
  document.addEventListener("dragstart", (e) => {
    if (isNotElement(e.target)) return;
    if (e.target.classList.contains("field-item")) {
      draggedElement = e.target;
      draggedFromContainer = e.target.closest(".field-list");
      e.target.classList.add("dragging");

      // Set drag effect
      e.dataTransfer.effectAllowed = "move";
    }
  });

  document.addEventListener("dragend", (e) => {
    if (isNotElement(e.target)) return;
    if (e.target.classList.contains("field-item")) {
      e.target.classList.remove("dragging");
      hideDropIndicator();
      draggedElement = null;
      draggedFromContainer = null;
    }
  });
}

function createDropIndicator() {
  dropIndicator = document.createElement("div");
  dropIndicator.className = "drop-indicator";
  dropIndicator.style.cssText = `
    height: 2px;
    background-color: #007bff;
    margin: 2px 0;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  `;
  document.body.appendChild(dropIndicator);
}

function showDropIndicator(targetElement, position) {
  if (!dropIndicator || !targetElement) return;

  hideDropIndicator();

  const rect = targetElement.getBoundingClientRect();
  const containerRect = targetElement.parentElement.getBoundingClientRect();

  // Position the indicator
  if (position === "before") {
    dropIndicator.style.top = rect.top + "px";
  } else {
    dropIndicator.style.top = (rect.bottom - 2) + "px";
  }

  dropIndicator.style.left = containerRect.left + "px";
  dropIndicator.style.width = containerRect.width + "px";
  dropIndicator.style.opacity = "1";
  dropIndicator.style.position = "fixed";
  dropIndicator.style.zIndex = "1000";
}

function hideDropIndicator() {
  if (dropIndicator) {
    dropIndicator.style.opacity = "0";
  }
}

function handleDragOver(e) {
  e.preventDefault();

  if (!draggedElement) return;

  const targetList = e.target.closest(".field-list");
  if (!targetList) return;

  // Find the closest field item being hovered over
  const targetItem = e.target.closest(".field-item");

  if (targetItem && targetItem !== draggedElement) {
    // We're hovering over another item - show sort indicator
    const rect = targetItem.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? "before" : "after";

    showDropIndicator(targetItem, position);
  } else if (targetList.children.length === 0 || !targetItem) {
    // We're hovering over empty space in the container
    hideDropIndicator();
  }
}

function handleDragEnter(e) {
  if (e.target.classList.contains("field-list")) {
    e.target.classList.add("drag-over");
  }
}

function handleDragLeave(e) {
  if (e.target.classList.contains("field-list") && !e.target.contains(e.relatedTarget)) {
    e.target.classList.remove("drag-over");
    hideDropIndicator();
  }
}

function handleDrop(e) {
  e.preventDefault();

  const targetList = e.target.closest(".field-list");
  if (!targetList || !draggedElement) return;

  targetList.classList.remove("drag-over");
  hideDropIndicator();

  const fieldName = draggedElement.dataset.field;
  const tableName = draggedElement.dataset.table;
  const fieldGroup = draggedElement.dataset.group;
  const targetItem = e.target.closest(".field-item");
  // Hacky way of checking if the field is moving from one configured container
  // to another configured container (and not going back to available)
  const isSamePanel = targetList.id.substr(9) === draggedFromContainer.id.substr(9);
  // Remove from current configured state
  removeFromConfigured(fieldName, tableName, isSamePanel);

  // Determine drop position for sorting
  let insertIndex = -1; // -1 means append to end

  if (targetItem && targetItem !== draggedElement) {
    // We're dropping near another item - calculate insertion index
    const allItems = Array.from(targetList.querySelectorAll(".field-item"));
    const targetIndex = allItems.indexOf(targetItem);

    if (targetIndex !== -1) {
      const rect = targetItem.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (e.clientY < midpoint) {
        insertIndex = targetIndex;
      } else {
        insertIndex = targetIndex + 1;
      }
    }
  }

  // Handle different target containers
  switch (targetList.id) {
    case "configuredList-rows":
      return addToConfigured(fieldName, tableName, fieldGroup, true, insertIndex);
    case "configuredList-cols":
      return addToConfigured(fieldName, tableName, fieldGroup, false, insertIndex);
    case "availableList":
      // If dropping back to available, just remove from configured
      // The removeFromConfigured call above should handle this
      break;
  }
}

// Helper function to insert element at specific index
export function insertAtIndex(container, element, index) {
  const children = Array.from(container.children);

  if (index === -1 || index >= children.length) {
    // Append to end
    container.appendChild(element);
  } else {
    // Insert before the item at the specified index
    container.insertBefore(element, children[index]);
  }
}

function isNotElement(target) {
  return target == null || target.nodeType !== 1;
}
