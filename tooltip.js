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

    // Use pageX/pageY to account for scroll position
    let x = event.pageX;
    let y = event.pageY - tooltipRect.height - 10; // 10px offset above cursor

    // Adjust horizontal position if tooltip would go off-screen
    // Need to account for scroll when checking viewport bounds
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    if (x + tooltipRect.width > scrollX + viewportWidth) {
      x = scrollX + viewportWidth - tooltipRect.width - 10;
    }
    if (x < scrollX + 10) {
      x = scrollX + 10;
    }

    // If tooltip would go above viewport, show it below cursor instead
    if (y < scrollY + 10) {
      y = event.pageY + 10;
    }

    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = y + 'px';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Tooltip();
});
