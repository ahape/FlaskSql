export class Tooltip {
  constructor() {
    this.tooltip = null;
    this.init();
  }

  init() {
    this.createTooltip();
    this.bindEvents();
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    document.body.appendChild(this.tooltip);
  }

  bindEvents() {
    document.addEventListener('mouseover', (e) => {
      if (e.target.hasAttribute('data-tooltip')) {
        this.showTooltip(e.target, e);
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.hasAttribute('data-tooltip')) {
        this.hideTooltip();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (e.target.hasAttribute('data-tooltip')) {
        this.updatePosition(e);
      }
    });
  }

  showTooltip(element, event) {
    const text = element.getAttribute('data-tooltip');
    if (!text) return;

    this.tooltip.innerHTML = text;
    this.tooltip.classList.add('show');
    this.updatePosition(event);
  }

  hideTooltip() {
    this.tooltip.classList.remove('show');
  }

  updatePosition(event) {
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = event.clientX;
    let y = event.clientY - tooltipRect.height - 10; // 10px offset above cursor

    // Adjust horizontal position if tooltip would go off-screen
    if (x + tooltipRect.width > viewportWidth) {
      x = viewportWidth - tooltipRect.width - 10;
    }
    if (x < 10) {
      x = 10;
    }

    // If tooltip would go above viewport, show it below cursor instead
    if (y < 10) {
      y = event.clientY + 10;
    }

    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = y + 'px';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Tooltip();
});
