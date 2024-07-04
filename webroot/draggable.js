const SVG_NS = "http://www.w3.org/2000/svg";

class Component {
  constructor(x, y, svgElement) {
    this.id = crypto.randomUUID();

    this.componentGroup = document.createElementNS(SVG_NS, "g");
    this.componentGroup.setAttribute("draggable", "true");
    this.componentGroup.setAttribute("id", this.id);

    this.x = x;
    this.y = y;
    this.setPosition(x, y, false);

    this.componentGroup.appendChild(svgElement);
  }

  setPosition(x, y) {
    this.tx = x;
    this.ty = y;
    this.componentGroup.setAttribute("transform", `translate(${x}, ${y})`)
  }

  drag(movementX, movementY, scale) {
    const newX = (movementX * 1/scale) + this.tx;
    const newY = (movementY * 1/scale) + this.ty;
    this.setPosition(newX, newY)
  }

  finishMove() {
    if(Math.hypot(this.tx-this.x, this.ty-this.y) >= 1) {
      this.x = this.tx;
      this.y = this.ty;
    } else {
      this.setPosition(this.x, this.y);
    }
  }

  deselect() {
    this.setPosition(this.x, this.y);
    this.componentGroup.setAttribute("style","");
  }

  select() {
    this.componentGroup.setAttribute("style","filter: drop-shadow(-1px -1px 0px #3e68ff) drop-shadow(1px -1px 0px #3e68ff) drop-shadow(1px 1px 0px #3e68ff) drop-shadow(-1px 1px 0px #3e68ff);");
  }

}

class Workspace {
  constructor(canvasElement) {
    this.canvasElement = canvasElement;

    this.svgContainer = document.createElementNS(SVG_NS, "svg");
    this.svgContainer.setAttribute("style", "width:100%; height:100%;");
    this.canvasElement.appendChild(this.svgContainer);

    this.svgMainGroup = document.createElementNS(SVG_NS, "g");
    this.svgContainer.appendChild(this.svgMainGroup);

    canvasElement.addEventListener('wheel', (e) => this.handleMouseWheel(e));
    canvasElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('keydown', (e) => this.handleKeypress(e));

    this.isMouseDown = false;
    this.isDraggingWorkspace = false;
    this.selectedComponent = null;

    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;

    this.components = {};
  }

  setTransformation(element, tx, ty, sx, sy) {
    element.setAttribute("transform", `translate(${tx}, ${ty}), scale(${sx}, ${sy})`)
  }

  createComponent(x, y, svgElement) {
    const component = new Component(x, y, svgElement);
    this.svgMainGroup.appendChild(component.componentGroup);
    this.components[component.id] = component;
  }

  createFromURL(x, y, url) {
    let xhr = new XMLHttpRequest();
    
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'image/svg+xml');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        let parser = new DOMParser();
        let svgDoc = parser.parseFromString(xhr.responseText, 'image/svg+xml');
        var svgElement = svgDoc.documentElement;

        this.createComponent(x, y, svgElement);
      }
    }.bind(this);

    xhr.send();
  }

  handleMouseWheel(e) {
    e.preventDefault();
    
    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;

    this.scale *= scaleFactor;
    this.translateX = e.offsetX - ((e.offsetX - this.translateX) * scaleFactor);
    this.translateY = e.offsetY - ((e.offsetY - this.translateY) * scaleFactor);

    this.setTransformation(this.svgMainGroup, this.translateX, this.translateY, this.scale, this.scale);
  }

  handleMouseDown(e) {
    e.preventDefault();

    this.isMouseDown = true;
    this.selectedComponent?.deselect();
    this.selectedComponent = null;
    
    if (e.target == this.svgContainer) {
      this.isDraggingWorkspace = true;
    } else {
      const topElement = e.target.closest('[draggable]');
      if (topElement) {
        this.selectedComponent = this.components[topElement.getAttribute("id")];
        this.selectedComponent.select();
      }
    }
  }

  handleMouseUp(e) {
    e.preventDefault();

    this.isMouseDown = false;
    this.isDraggingWorkspace = false;
    if (this.selectedComponent instanceof Component) {
      this.selectedComponent.finishMove();
    }
  }

  handleMouseMove(e) {
    if (this.isDraggingWorkspace) {
      this.translateX += e.movementX;
      this.translateY += e.movementY;
      this.setTransformation(this.svgMainGroup, this.translateX, this.translateY, this.scale, this.scale);
    } else if (this.isMouseDown && this.selectedComponent instanceof Component) {
      this.selectedComponent.drag(e.movementX, e.movementY, this.scale);
    }
  }

  handleKeypress(e) {
    if (e.keyCode === 27 && this.selectedComponent instanceof Component) { //esc key pressed
      this.selectedComponent.deselect();
      this.selectedComponent = null;
      this.isMouseDown = false;
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { //ctrl + z

    }
  }
}