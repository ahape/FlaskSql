/**
 * Drag & Drop Widget - Self-contained plugin architecture
 * Usage:
 * <script src="widget.js"></script>
 * <script>
 *   var widget = new Widget();
 *   widget.appendTo('#container'); // or widget.appendTo() for body
 *   widget.onUpdate(function(data) { console.log(data); });
 * </script>
 */
(function(global) {
  'use strict';

  // Widget constructor
  function Widget(options) {
    this.options = Object.assign({
      container: null,
      theme: 'default'
    }, options || {});

    // Data sources with their available items
    this.dataSources = {
      user: [
        'User Authentication',
        'User Profiles',
        'Permission Management',
        'Role Assignment',
        'Account Settings',
        'Password Reset'
      ],
      analytics: [
        'Dashboard Analytics',
        'Traffic Reports',
        'Conversion Tracking',
        'User Behavior',
        'Performance Metrics',
        'Custom Events'
      ],
      commerce: [
        'Payment Processing',
        'Shopping Cart',
        'Product Catalog',
        'Order Management',
        'Inventory Tracking',
        'Discount Codes'
      ],
      content: [
        'File Upload',
        'Content Editor',
        'Media Library',
        'SEO Management',
        'Content Scheduling',
        'Email Notifications'
      ]
    };

    // Data model to track items in each container
    this.dataModel = {
      available: [...this.dataSources.user],
      configured: []
    };

    this.currentDataSource = 'user';
    this.draggedItem = null;
    this.draggedItemText = null;
    this.updateCallbacks = [];
    this.container = null;
    this.widgetId = 'widget_' + Math.random().toString(36).substr(2, 9);
  }

  // CSS styles as a string
  Widget.prototype.getStyles = function() {
    return `
      .drag-drop-widget-${this.widgetId} * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .drag-drop-widget-${this.widgetId} {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        width: 100%;
        box-sizing: border-box;
      }

      .drag-drop-widget-${this.widgetId} .container {
        max-width: 1200px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 30px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .drag-drop-widget-${this.widgetId} h1 {
        text-align: center;
        color: white;
        margin-bottom: 30px;
        font-size: 2.5rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .drag-drop-widget-${this.widgetId} .columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
      }

      .drag-drop-widget-${this.widgetId} .column-wrapper {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .drag-drop-widget-${this.widgetId} .data-source-selector {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 15px;
        backdrop-filter: blur(5px);
      }

      .drag-drop-widget-${this.widgetId} .data-source-selector label {
        display: block;
        color: white;
        font-weight: bold;
        margin-bottom: 8px;
        font-size: 1.1rem;
      }

      .drag-drop-widget-${this.widgetId} .data-source-selector select {
        width: 100%;
        padding: 10px 15px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .drag-drop-widget-${this.widgetId} .data-source-selector select:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
      }

      .drag-drop-widget-${this.widgetId} .column {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 15px;
        padding: 20px;
        min-height: 400px;
        border: 2px dashed rgba(255, 255, 255, 0.3);
        transition: all 0.3s ease;
      }

      .drag-drop-widget-${this.widgetId} .column:hover {
        border-color: rgba(255, 255, 255, 0.6);
      }

      .drag-drop-widget-${this.widgetId} .column.drag-over {
        border-color: #4CAF50 !important;
        background: rgba(76, 175, 80, 0.2) !important;
      }

      .drag-drop-widget-${this.widgetId} .column-title {
        font-size: 1.5rem;
        font-weight: bold;
        color: white;
        text-align: center;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 1px;
        pointer-events: none;
      }

      .drag-drop-widget-${this.widgetId} .item {
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        color: white;
        padding: 15px 20px;
        margin: 10px 0;
        border-radius: 10px;
        cursor: grab;
        user-select: none;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        font-weight: 500;
      }

      .drag-drop-widget-${this.widgetId} .item:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      }

      .drag-drop-widget-${this.widgetId} .item:active {
        cursor: grabbing;
      }

      .drag-drop-widget-${this.widgetId} .item.dragging {
        opacity: 0.5;
      }

      @media (max-width: 768px) {
        .drag-drop-widget-${this.widgetId} .columns {
          grid-template-columns: 1fr;
        }
        
        .drag-drop-widget-${this.widgetId} h1 {
          font-size: 2rem;
        }
        
        .drag-drop-widget-${this.widgetId} .column-wrapper {
          order: -1;
        }
      }
    `;
  };

  // HTML template
  Widget.prototype.getTemplate = function() {
    return `
      <div class="container">
        <h1>Drag & Drop Manager</h1>
        
        <div class="columns">
          <div class="column-wrapper">
            <div class="data-source-selector">
              <label for="dataSource_${this.widgetId}">Data Sources</label>
              <select id="dataSource_${this.widgetId}">
                <option value="user">User Management</option>
                <option value="analytics">Analytics</option>
                <option value="commerce">E-commerce</option>
                <option value="content">Content Management</option>
              </select>
            </div>
            <div class="column" id="available_${this.widgetId}">
              <div class="column-title">Available Items</div>
            </div>
          </div>
          
          <div class="column" id="configured_${this.widgetId}">
            <div class="column-title">Configured Items</div>
          </div>
        </div>
      </div>
    `;
  };

  // Append widget to DOM
  Widget.prototype.appendTo = function(selector) {
    var targetElement;
    
    if (selector) {
      if (typeof selector === 'string') {
        targetElement = document.querySelector(selector);
      } else {
        targetElement = selector;
      }
    } else {
      targetElement = document.body;
    }

    if (!targetElement) {
      console.error('Widget: Target element not found');
      return this;
    }

    // Create widget container
    this.container = document.createElement('div');
    this.container.className = 'drag-drop-widget-' + this.widgetId;

    // Inject styles
    var style = document.createElement('style');
    style.textContent = this.getStyles();
    document.head.appendChild(style);

    // Inject HTML
    this.container.innerHTML = this.getTemplate();

    // Append to target
    targetElement.appendChild(this.container);

    // Initialize widget
    this.init();

    return this;
  };

  // Register update callback
  Widget.prototype.onUpdate = function(callback) {
    if (typeof callback === 'function') {
      this.updateCallbacks.push(callback);
    }
    return this;
  };

  // Trigger update callbacks
  Widget.prototype.triggerUpdate = function() {
    var self = this;
    this.updateCallbacks.forEach(function(callback) {
      try {
        callback.call(self, {
          available: self.dataModel.available,
          configured: self.dataModel.configured,
          currentSource: self.currentDataSource
        });
      } catch (e) {
        console.error('Widget update callback error:', e);
      }
    });
  };

  // Initialize the widget
  Widget.prototype.init = function() {
    this.renderItems();
    this.setupDragAndDrop();
    this.setupDataSourceSelector();
    this.triggerUpdate();
  };

  // Setup data source selector
  Widget.prototype.setupDataSourceSelector = function() {
    var self = this;
    var selector = document.getElementById('dataSource_' + this.widgetId);
    
    selector.addEventListener('change', function(e) {
      self.currentDataSource = e.target.value;
      self.dataModel.available = [...self.dataSources[self.currentDataSource]];
      self.renderItems();
      self.setupDragAndDrop();
      self.triggerUpdate();
    });
  };

  // Setup drag and drop functionality
  Widget.prototype.setupDragAndDrop = function() {
    var self = this;
    var columns = this.container.querySelectorAll('.column');
    
    columns.forEach(function(column) {
      column.addEventListener('dragover', function(e) { self.handleDragOver(e); });
      column.addEventListener('dragenter', function(e) { self.handleDragEnter(e); });
      column.addEventListener('dragleave', function(e) { self.handleDragLeave(e); });
      column.addEventListener('drop', function(e) { self.handleDrop(e); });
    });
  };

  // Handle drag over
  Widget.prototype.handleDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drag enter
  Widget.prototype.handleDragEnter = function(e) {
    e.preventDefault();
    var column = e.target.classList.contains('column') ? e.target : e.target.closest('.column');
    if (column) {
      column.classList.add('drag-over');
    }
  };

  // Handle drag leave
  Widget.prototype.handleDragLeave = function(e) {
    var column = e.target.classList.contains('column') ? e.target : e.target.closest('.column');
    if (column && !column.contains(e.relatedTarget)) {
      column.classList.remove('drag-over');
    }
  };

  // Handle drop
  Widget.prototype.handleDrop = function(e) {
    e.preventDefault();
    
    var column = e.target.classList.contains('column') ? e.target : e.target.closest('.column');
    if (!column) return;
    
    column.classList.remove('drag-over');
    
    var targetContainer = column.id.replace('_' + this.widgetId, '');
    
    if (this.draggedItemText && this.draggedItem) {
      if (targetContainer === 'configured') {
        // Moving from available to configured
        if (this.dataModel.available.includes(this.draggedItemText)) {
          // Remove from available
          this.dataModel.available = this.dataModel.available.filter(function(item) {
            return item !== this.draggedItemText;
          }.bind(this));
          
          // Add to configured with source information
          this.dataModel.configured.push({
            name: this.draggedItemText,
            source: this.currentDataSource
          });
          
          // Update display
          this.renderItems();
          this.setupDragAndDrop();
          this.triggerUpdate();
        }
      } else if (targetContainer === 'available') {
        // Moving from configured back to available
        var configuredItem = this.dataModel.configured.find(function(item) {
          return item.name === this.draggedItemText;
        }.bind(this));
        
        if (configuredItem) {
          // Remove from configured
          this.dataModel.configured = this.dataModel.configured.filter(function(item) {
            return item.name !== this.draggedItemText;
          }.bind(this));
          
          // Add back to the appropriate data source (only if it matches current source)
          if (configuredItem.source === this.currentDataSource) {
            this.dataModel.available.push(this.draggedItemText);
            
            // Update display
            this.renderItems();
            this.setupDragAndDrop();
            this.triggerUpdate();
          }
        }
      }
    }
    
    // Clear dragged item reference
    this.draggedItem = null;
    this.draggedItemText = null;
  };

  // Create a draggable item element
  Widget.prototype.createItemElement = function(text) {
    var self = this;
    var item = document.createElement('div');
    item.className = 'item';
    item.draggable = true;
    item.textContent = text;
    
    // Add drag event listeners
    item.addEventListener('dragstart', function(e) {
      self.draggedItem = this;
      // For configured items, get just the name (before the source indicator)
      self.draggedItemText = this.textContent.split(' (')[0];
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', self.draggedItemText);
    });
    
    item.addEventListener('dragend', function(e) {
      this.classList.remove('dragging');
      // Remove drag-over from all columns
      self.container.querySelectorAll('.column').forEach(function(col) {
        col.classList.remove('drag-over');
      });
    });
    
    return item;
  };

  // Render items in their respective columns
  Widget.prototype.renderItems = function() {
    var availableColumn = document.getElementById('available_' + this.widgetId);
    var configuredColumn = document.getElementById('configured_' + this.widgetId);
    
    // Clear existing items (keep titles)
    availableColumn.innerHTML = '<div class="column-title">Available Items</div>';
    configuredColumn.innerHTML = '<div class="column-title">Configured Items</div>';

    // Render available items
    var self = this;
    this.dataModel.available.forEach(function(item) {
      var itemElement = self.createItemElement(item);
      availableColumn.appendChild(itemElement);
    });

    // Render configured items
    this.dataModel.configured.forEach(function(item) {
      var itemElement = self.createItemElement(item.name);
      // Add a small indicator showing the source
      var sourceIndicator = document.createElement('span');
      sourceIndicator.textContent = ' (' + item.source + ')';
      sourceIndicator.style.opacity = '0.7';
      sourceIndicator.style.fontSize = '0.8em';
      itemElement.appendChild(sourceIndicator);
      configuredColumn.appendChild(itemElement);
    });
  };

  // Get current data model
  Widget.prototype.getData = function() {
    return {
      available: this.dataModel.available,
      configured: this.dataModel.configured,
      currentSource: this.currentDataSource
    };
  };

  // Set data model
  Widget.prototype.setData = function(data) {
    if (data.available) this.dataModel.available = data.available;
    if (data.configured) this.dataModel.configured = data.configured;
    if (data.currentSource) this.currentDataSource = data.currentSource;
    
    this.renderItems();
    this.triggerUpdate();
    return this;
  };

  // Destroy widget
  Widget.prototype.destroy = function() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.updateCallbacks = [];
    return this;
  };

  // Expose Widget to global scope
  global.Widget = Widget;

})(typeof window !== 'undefined' ? window : this);
