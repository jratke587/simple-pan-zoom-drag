const SVG_NS = "http://www.w3.org/2000/svg";

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

    this.isMouseDown = false;
    this.selectedElement = null;

    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
  }

  setTransformation(element, tx, ty, sx, sy) {
    element.setAttribute("transform", `translate(${tx}, ${ty}), scale(${sx}, ${sy})`)
  }

  getTransformation(element) {
    let tx = 0, ty = 0, sx = 1, sy = 1;
    Array.from(element.transform.baseVal).forEach((transformation) => {
        switch(transformation.type) {
            case SVGTransform.SVG_TRANSFORM_TRANSLATE:
                tx = transformation.matrix.e;
                ty = transformation.matrix.f;
                break;
            case SVGTransform.SVG_TRANSFORM_SCALE:
                sx = transformation.matrix.a;
                sy = transformation.matrix.d;
                break;
            default:
                break;
        }
    });
    return [tx, ty, sx, sy];
  }

  createComponent(x, y, svgElement) {
    const componentGroup = document.createElementNS(SVG_NS, "g");
    componentGroup.setAttribute("draggable", "true");
    componentGroup.setAttribute("id", crypto.randomUUID());
    this.setTransformation(componentGroup, x, y, 1, 1);

    componentGroup.appendChild(svgElement);
    this.svgMainGroup.appendChild(componentGroup);
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
    if (e.target == this.svgContainer) {
      this.selectedElement = e.target;
    } else {
      this.selectedElement = e.target.closest('[draggable]');
    }
  }

  handleMouseUp(e) {
    e.preventDefault();
    this.isMouseDown = false;
    this.selectedElement = null;
  }

  handleMouseMove(e) {
    if (this.isMouseDown && this.selectedElement == this.svgContainer) {
        this.translateX += e.movementX;
        this.translateY += e.movementY;
        this.setTransformation(this.svgMainGroup, this.translateX, this.translateY, this.scale, this.scale);
    } else if (this.isMouseDown && this.selectedElement) {
        const transformations = this.getTransformation(this.selectedElement);
        const newX = (e.movementX * 1/this.scale) + transformations[0];
        const newY = (e.movementY * 1/this.scale) + transformations[1];
        this.setTransformation(this.selectedElement, newX, newY, transformations[2], transformations[3]);
    }
  }
}