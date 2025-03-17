class CreographicsApp {
    constructor() {
        this.currentTool = 'select';
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.objects = [];
        this.selectedObject = null;
        this.zoom = 1;
        this.history = [];
        this.historyIndex = -1;
        this.layers = [{
            id: 1,
            name: 'Layer 1',
            visible: true,
            objects: []
        }];
        this.currentLayer = 0;
        
        this.init();
    }

    init() {
        // Initialize canvas
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Initialize event listeners
        this.initializeEventListeners();
        
        // Initialize tools
        this.toolManager = new ToolManager(this);
        
        // Initialize UI
        this.uiManager = new UIManager(this);

        // Set default properties
        this.setDefaultProperties();

        // Initial render
        this.render();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    setDefaultProperties() {
        this.properties = {
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 1,
            fontSize: 16,
            fontFamily: 'Arial',
            textAlign: 'left',
            bold: false,
            italic: false,
            underline: false
        };
    }

    initializeEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Canvas event listeners
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Tool selection
        document.querySelectorAll('.tool-item').forEach(tool => {
            tool.addEventListener('click', (e) => {
                this.setCurrentTool(e.currentTarget.dataset.tool);
            });
        });

        // Property changes
        document.getElementById('fill-color').addEventListener('change', (e) => {
            this.properties.fill = e.target.value;
            this.updateSelectedObject();
        });

        document.getElementById('stroke-color').addEventListener('change', (e) => {
            this.properties.stroke = e.target.value;
            this.updateSelectedObject();
        });

        // Save and export buttons
        document.getElementById('save-btn').addEventListener('click', () => this.saveProject());
        document.getElementById('export-btn').addEventListener('click', () => this.exportImage());
    }

    handleMouseDown(e) {
        this.isDrawing = true;
        const pos = this.getMousePosition(e);
        this.toolManager.getCurrentTool().onMouseDown(pos);
    }

    handleMouseMove(e) {
        const pos = this.getMousePosition(e);
        document.getElementById('cursor-x').textContent = Math.round(pos.x);
        document.getElementById('cursor-y').textContent = Math.round(pos.y);

        if (this.isDrawing) {
            this.toolManager.getCurrentTool().onMouseMove(pos);
        }
    }

    handleMouseUp(e) {
        if (this.isDrawing) {
            const pos = this.getMousePosition(e);
            this.toolManager.getCurrentTool().onMouseUp(pos);
            this.isDrawing = false;
            this.saveState();
        }
    }

    handleWheel(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom = Math.min(Math.max(0.1, this.zoom * delta), 5);
            document.getElementById('zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
            this.render();
        }
    }

    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.zoom,
            y: (e.clientY - rect.top) / this.zoom
        };
    }

    setCurrentTool(toolName) {
        this.currentTool = toolName;
        document.getElementById('current-tool').textContent = toolName.charAt(0).toUpperCase() + toolName.slice(1);
        document.querySelectorAll('.tool-item').forEach(tool => {
            tool.classList.toggle('active', tool.dataset.tool === toolName);
        });
    }

    addObject(object) {
        this.layers[this.currentLayer].objects.push(object);
        this.render();
    }

    updateSelectedObject() {
        if (this.selectedObject) {
            Object.assign(this.selectedObject.style, this.properties);
            this.render();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);

        // Render all layers
        this.layers.forEach(layer => {
            if (layer.visible) {
                layer.objects.forEach(obj => obj.draw(this.ctx));
            }
        });

        // Render selection
        if (this.selectedObject) {
            this.drawSelectionBox(this.selectedObject);
        }

        this.ctx.restore();
    }

    drawSelectionBox(object) {
        this.ctx.strokeStyle = '#0095ff';
        this.ctx.lineWidth = 1 / this.zoom;
        this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
        this.ctx.strokeRect(
            object.x - 5 / this.zoom,
            object.y - 5 / this.zoom,
            object.width + 10 / this.zoom,
            object.height + 10 / this.zoom
        );
        this.ctx.setLineDash([]);
    }

    saveState() {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new state
        this.history.push(JSON.stringify(this.layers));
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.layers = JSON.parse(this.history[this.historyIndex]);
            this.render();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.layers = JSON.parse(this.history[this.historyIndex]);
            this.render();
        }
    }

    saveProject() {
        const projectData = {
            layers: this.layers,
            properties: this.properties,
            zoom: this.zoom
        };
        
        const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'creographics-project.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    exportImage() {
        const link = document.createElement('a');
        link.download = 'creographics-export.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CreographicsApp();
}); 