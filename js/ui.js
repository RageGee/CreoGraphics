class UIManager {
    constructor(app) {
        this.app = app;
        this.initializeMenus();
        this.initializePropertyControls();
        this.initializeLayerControls();
        this.initializeZoomControls();
        this.initializeKeyboardShortcuts();
    }

    initializeMenus() {
        // File Menu
        document.getElementById('file-menu-btn').addEventListener('click', () => {
            document.getElementById('file-modal').style.display = 'block';
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('file-modal').style.display = 'none';
        });

        // File operations
        document.getElementById('new-file-btn').addEventListener('click', () => {
            if (confirm('Create new file? All unsaved changes will be lost.')) {
                this.app.layers = [{
                    id: 1,
                    name: 'Layer 1',
                    visible: true,
                    objects: []
                }];
                this.app.currentLayer = 0;
                this.app.render();
            }
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            this.app.saveProject();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.app.exportImage();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    initializePropertyControls() {
        // Object properties
        const updateObjectProperties = () => {
            if (this.app.selectedObject) {
                const obj = this.app.selectedObject;
                obj.width = parseFloat(document.getElementById('object-width').value);
                obj.height = parseFloat(document.getElementById('object-height').value);
                obj.x = parseFloat(document.getElementById('object-x').value);
                obj.y = parseFloat(document.getElementById('object-y').value);
                this.app.render();
            }
        };

        ['object-width', 'object-height', 'object-x', 'object-y'].forEach(id => {
            document.getElementById(id).addEventListener('change', updateObjectProperties);
        });

        // Style properties
        document.getElementById('fill-color').addEventListener('change', (e) => {
            this.app.properties.fill = e.target.value;
            if (this.app.selectedObject) {
                this.app.selectedObject.style.fill = e.target.value;
                this.app.render();
            }
        });

        document.getElementById('stroke-color').addEventListener('change', (e) => {
            this.app.properties.stroke = e.target.value;
            if (this.app.selectedObject) {
                this.app.selectedObject.style.stroke = e.target.value;
                this.app.render();
            }
        });

        document.getElementById('stroke-width').addEventListener('change', (e) => {
            this.app.properties.strokeWidth = parseInt(e.target.value);
            if (this.app.selectedObject) {
                this.app.selectedObject.style.strokeWidth = parseInt(e.target.value);
                this.app.render();
            }
        });

        // Text properties
        document.getElementById('font-family').addEventListener('change', (e) => {
            this.app.properties.fontFamily = e.target.value;
            if (this.app.selectedObject && this.app.selectedObject.type === 'text') {
                this.app.selectedObject.style.fontFamily = e.target.value;
                this.app.render();
            }
        });

        document.getElementById('font-size').addEventListener('change', (e) => {
            this.app.properties.fontSize = parseInt(e.target.value);
            if (this.app.selectedObject && this.app.selectedObject.type === 'text') {
                this.app.selectedObject.style.fontSize = parseInt(e.target.value);
                this.app.render();
            }
        });

        // Text style buttons
        ['bold', 'italic', 'underline'].forEach(style => {
            document.getElementById(`${style}-btn`).addEventListener('click', (e) => {
                const button = e.currentTarget;
                button.classList.toggle('active');
                this.app.properties[style] = button.classList.contains('active');
                if (this.app.selectedObject && this.app.selectedObject.type === 'text') {
                    this.app.selectedObject.style[style] = this.app.properties[style];
                    this.app.render();
                }
            });
        });

        // Text alignment buttons
        ['left', 'center', 'right'].forEach(align => {
            document.getElementById(`align-${align}-btn`).addEventListener('click', (e) => {
                document.querySelectorAll('.text-align-controls .style-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                this.app.properties.textAlign = align;
                if (this.app.selectedObject && this.app.selectedObject.type === 'text') {
                    this.app.selectedObject.style.textAlign = align;
                    this.app.render();
                }
            });
        });
    }

    initializeLayerControls() {
        document.getElementById('add-layer-btn').addEventListener('click', () => {
            const newLayer = {
                id: this.app.layers.length + 1,
                name: `Layer ${this.app.layers.length + 1}`,
                visible: true,
                objects: []
            };
            this.app.layers.push(newLayer);
            this.updateLayersList();
        });

        document.getElementById('delete-layer-btn').addEventListener('click', () => {
            if (this.app.layers.length > 1) {
                this.app.layers.splice(this.app.currentLayer, 1);
                this.app.currentLayer = Math.max(0, this.app.currentLayer - 1);
                this.updateLayersList();
                this.app.render();
            }
        });

        document.getElementById('move-layer-up-btn').addEventListener('click', () => {
            if (this.app.currentLayer > 0) {
                const temp = this.app.layers[this.app.currentLayer];
                this.app.layers[this.app.currentLayer] = this.app.layers[this.app.currentLayer - 1];
                this.app.layers[this.app.currentLayer - 1] = temp;
                this.app.currentLayer--;
                this.updateLayersList();
                this.app.render();
            }
        });

        document.getElementById('move-layer-down-btn').addEventListener('click', () => {
            if (this.app.currentLayer < this.app.layers.length - 1) {
                const temp = this.app.layers[this.app.currentLayer];
                this.app.layers[this.app.currentLayer] = this.app.layers[this.app.currentLayer + 1];
                this.app.layers[this.app.currentLayer + 1] = temp;
                this.app.currentLayer++;
                this.updateLayersList();
                this.app.render();
            }
        });
    }

    updateLayersList() {
        const layersList = document.getElementById('layers-list');
        layersList.innerHTML = '';
        
        this.app.layers.forEach((layer, index) => {
            const li = document.createElement('li');
            li.className = `layer-item${index === this.app.currentLayer ? ' active' : ''}`;
            li.dataset.layerId = layer.id;
            
            const visibility = document.createElement('div');
            visibility.className = 'layer-visibility';
            visibility.innerHTML = `<i class="fas fa-eye${layer.visible ? '' : '-slash'}"></i>`;
            
            const name = document.createElement('div');
            name.className = 'layer-name';
            name.textContent = layer.name;
            
            li.appendChild(visibility);
            li.appendChild(name);
            
            li.addEventListener('click', () => {
                document.querySelectorAll('.layer-item').forEach(item => {
                    item.classList.remove('active');
                });
                li.classList.add('active');
                this.app.currentLayer = index;
            });
            
            visibility.addEventListener('click', (e) => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                visibility.innerHTML = `<i class="fas fa-eye${layer.visible ? '' : '-slash'}"></i>`;
                this.app.render();
            });
            
            layersList.appendChild(li);
        });
    }

    initializeZoomControls() {
        document.getElementById('zoom-in-btn').addEventListener('click', () => {
            this.app.zoom = Math.min(5, this.app.zoom * 1.1);
            document.getElementById('zoom-level').textContent = `${Math.round(this.app.zoom * 100)}%`;
            this.app.render();
        });

        document.getElementById('zoom-out-btn').addEventListener('click', () => {
            this.app.zoom = Math.max(0.1, this.app.zoom / 1.1);
            document.getElementById('zoom-level').textContent = `${Math.round(this.app.zoom * 100)}%`;
            this.app.render();
        });
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Command/Control shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'z':
                        if (e.shiftKey) {
                            this.app.redo();
                        } else {
                            this.app.undo();
                        }
                        e.preventDefault();
                        break;
                    case 's':
                        this.app.saveProject();
                        e.preventDefault();
                        break;
                    case 'o':
                        document.getElementById('open-file-btn').click();
                        e.preventDefault();
                        break;
                    case 'n':
                        document.getElementById('new-file-btn').click();
                        e.preventDefault();
                        break;
                }
            } else {
                // Tool shortcuts
                switch(e.key.toLowerCase()) {
                    case 'v':
                        this.app.setCurrentTool('select');
                        break;
                    case 'm':
                        this.app.setCurrentTool('move');
                        break;
                    case 'r':
                        this.app.setCurrentTool('rectangle');
                        break;
                    case 'o':
                        this.app.setCurrentTool('circle');
                        break;
                    case 'l':
                        this.app.setCurrentTool('line');
                        break;
                    case 't':
                        this.app.setCurrentTool('text');
                        break;
                    case 'p':
                        if (e.shiftKey) {
                            this.app.setCurrentTool('polygon');
                        } else {
                            this.app.setCurrentTool('pen');
                        }
                        break;
                    case 'b':
                        this.app.setCurrentTool('brush');
                        break;
                    case 'e':
                        this.app.setCurrentTool('eraser');
                        break;
                    case 'i':
                        this.app.setCurrentTool('eyedropper');
                        break;
                    case 'c':
                        if (!e.ctrlKey && !e.metaKey) {
                            this.app.setCurrentTool('crop');
                        }
                        break;
                    case 's':
                        if (!e.ctrlKey && !e.metaKey) {
                            this.app.setCurrentTool('shape');
                        }
                        break;
                    case '*':
                        this.app.setCurrentTool('star');
                        break;
                    case 'g':
                        this.app.setCurrentTool('gradient');
                        break;
                    case 'q':
                        this.app.setCurrentTool('curve');
                        break;
                    case 'a':
                        if (!e.ctrlKey && !e.metaKey) {
                            this.app.setCurrentTool('arrow');
                        }
                        break;
                    case 'delete':
                        if (this.app.selectedObject) {
                            const layer = this.app.layers[this.app.currentLayer];
                            const index = layer.objects.indexOf(this.app.selectedObject);
                            if (index > -1) {
                                layer.objects.splice(index, 1);
                                this.app.selectedObject = null;
                                this.app.render();
                            }
                        }
                        break;
                    case 'escape':
                        if (this.app.currentTool !== 'select') {
                            this.app.setCurrentTool('select');
                        }
                        break;
                }
            }
        });

        // Prevent browser defaults for some shortcuts
        document.addEventListener('keypress', (e) => {
            if ((e.ctrlKey || e.metaKey) && 
                ['s', 'o', 'n'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
    }
} 