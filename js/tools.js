class ToolManager {
    constructor(app) {
        this.app = app;
        this.tools = {
            select: new SelectTool(app),
            move: new MoveTool(app),
            rectangle: new RectangleTool(app),
            circle: new CircleTool(app),
            line: new LineTool(app),
            text: new TextTool(app),
            pen: new PenTool(app),
            brush: new BrushTool(app),
            eraser: new EraserTool(app),
            eyedropper: new EyedropperTool(app),
            polygon: new PolygonTool(app),
            star: new StarTool(app),
            gradient: new GradientTool(app),
            shape: new ShapeTool(app),
            curve: new CurveTool(app),
            arrow: new ArrowTool(app),
            image: new ImageTool(app),
            crop: new CropTool(app)
        };
    }

    getCurrentTool() {
        return this.tools[this.app.currentTool];
    }
}

class Tool {
    constructor(app) {
        this.app = app;
        this.startX = 0;
        this.startY = 0;
    }

    onMouseDown(pos) {
        this.startX = pos.x;
        this.startY = pos.y;
    }

    onMouseMove(pos) {}
    onMouseUp(pos) {}
}

class SelectTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.app.selectedObject = null;
        
        // Check if clicked on an object
        for (let layer of this.app.layers) {
            if (!layer.visible) continue;
            
            for (let i = layer.objects.length - 1; i >= 0; i--) {
                const obj = layer.objects[i];
                if (this.isPointInObject(pos, obj)) {
                    this.app.selectedObject = obj;
                    break;
                }
            }
            if (this.app.selectedObject) break;
        }
        
        this.app.render();
    }

    isPointInObject(pos, obj) {
        return pos.x >= obj.x && 
               pos.x <= obj.x + obj.width && 
               pos.y >= obj.y && 
               pos.y <= obj.y + obj.height;
    }
}

class MoveTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        if (this.app.selectedObject) {
            this.originalX = this.app.selectedObject.x;
            this.originalY = this.app.selectedObject.y;
        }
    }

    onMouseMove(pos) {
        if (this.app.selectedObject && this.app.isDrawing) {
            const dx = pos.x - this.startX;
            const dy = pos.y - this.startY;
            this.app.selectedObject.x = this.originalX + dx;
            this.app.selectedObject.y = this.originalY + dy;
            this.app.render();
        }
    }
}

class RectangleTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentRect = {
            type: 'rectangle',
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            style: { ...this.app.properties },
            draw: function(ctx) {
                ctx.fillStyle = this.style.fill;
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.strokeWidth;
                ctx.beginPath();
                ctx.rect(this.x, this.y, this.width, this.height);
                ctx.fill();
                ctx.stroke();
            }
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            this.currentRect.width = pos.x - this.startX;
            this.currentRect.height = pos.y - this.startY;
            this.app.render();
            this.currentRect.draw(this.app.ctx);
        }
    }

    onMouseUp(pos) {
        if (Math.abs(this.currentRect.width) > 1 && Math.abs(this.currentRect.height) > 1) {
            // Normalize negative dimensions
            if (this.currentRect.width < 0) {
                this.currentRect.x += this.currentRect.width;
                this.currentRect.width = Math.abs(this.currentRect.width);
            }
            if (this.currentRect.height < 0) {
                this.currentRect.y += this.currentRect.height;
                this.currentRect.height = Math.abs(this.currentRect.height);
            }
            this.app.addObject(this.currentRect);
        }
    }
}

class CircleTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentCircle = {
            type: 'circle',
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            style: { ...this.app.properties },
            draw: function(ctx) {
                ctx.fillStyle = this.style.fill;
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.strokeWidth;
                ctx.beginPath();
                ctx.ellipse(
                    this.x + this.width/2,
                    this.y + this.height/2,
                    Math.abs(this.width/2),
                    Math.abs(this.height/2),
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                ctx.stroke();
            }
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            this.currentCircle.width = pos.x - this.startX;
            this.currentCircle.height = pos.y - this.startY;
            this.app.render();
            this.currentCircle.draw(this.app.ctx);
        }
    }

    onMouseUp(pos) {
        if (Math.abs(this.currentCircle.width) > 1 && Math.abs(this.currentCircle.height) > 1) {
            this.app.addObject(this.currentCircle);
        }
    }
}

class LineTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentLine = {
            type: 'line',
            x: pos.x,
            y: pos.y,
            endX: pos.x,
            endY: pos.y,
            style: { ...this.app.properties },
            draw: function(ctx) {
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.strokeWidth;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.endX, this.endY);
                ctx.stroke();
            }
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            this.currentLine.endX = pos.x;
            this.currentLine.endY = pos.y;
            this.app.render();
            this.currentLine.draw(this.app.ctx);
        }
    }

    onMouseUp(pos) {
        if (Math.abs(this.currentLine.endX - this.currentLine.x) > 1 || 
            Math.abs(this.currentLine.endY - this.currentLine.y) > 1) {
            this.app.addObject(this.currentLine);
        }
    }
}

class TextTool extends Tool {
    onMouseDown(pos) {
        const text = prompt('Enter text:', '');
        if (text) {
            const textObj = {
                type: 'text',
                x: pos.x,
                y: pos.y,
                text: text,
                style: { ...this.app.properties },
                draw: function(ctx) {
                    ctx.fillStyle = this.style.fill;
                    ctx.font = `${this.style.italic ? 'italic ' : ''}${this.style.bold ? 'bold ' : ''}${this.style.fontSize}px ${this.style.fontFamily}`;
                    ctx.textAlign = this.style.textAlign;
                    ctx.fillText(this.text, this.x, this.y);
                    if (this.style.underline) {
                        const metrics = ctx.measureText(this.text);
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y + 3);
                        ctx.lineTo(this.x + metrics.width, this.y + 3);
                        ctx.stroke();
                    }
                }
            };
            this.app.addObject(textObj);
        }
    }
}

class PenTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.points = [{x: pos.x, y: pos.y}];
        this.currentPath = {
            type: 'path',
            points: this.points,
            style: { ...this.app.properties },
            draw: function(ctx) {
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.strokeWidth;
                ctx.beginPath();
                ctx.moveTo(this.points[0].x, this.points[0].y);
                for (let i = 1; i < this.points.length; i++) {
                    ctx.lineTo(this.points[i].x, this.points[i].y);
                }
                ctx.stroke();
            }
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            this.points.push({x: pos.x, y: pos.y});
            this.app.render();
            this.currentPath.draw(this.app.ctx);
        }
    }

    onMouseUp(pos) {
        if (this.points.length > 1) {
            this.app.addObject(this.currentPath);
        }
    }
}

class BrushTool extends PenTool {
    constructor(app) {
        super(app);
        this.brushSize = 10;
    }

    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentPath.draw = function(ctx) {
            ctx.strokeStyle = this.style.stroke;
            ctx.lineWidth = this.style.strokeWidth * 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
        };
    }
}

class EraserTool extends PenTool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentPath.draw = function(ctx) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 20;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
        };
    }
}

class EyedropperTool extends Tool {
    onMouseDown(pos) {
        const pixel = this.app.ctx.getImageData(pos.x, pos.y, 1, 1).data;
        const color = `#${[pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('')}`;
        document.getElementById('fill-color').value = color;
        this.app.properties.fill = color;
    }
}

class PolygonTool extends Tool {
    constructor(app) {
        super(app);
        this.sides = 6; // Default number of sides
    }

    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentPolygon = {
            type: 'polygon',
            x: pos.x,
            y: pos.y,
            radius: 0,
            sides: this.sides,
            style: { ...this.app.properties },
            draw: function(ctx) {
                const angle = (Math.PI * 2) / this.sides;
                ctx.fillStyle = this.style.fill;
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.strokeWidth;
                ctx.beginPath();
                for (let i = 0; i < this.sides; i++) {
                    const x = this.x + this.radius * Math.cos(angle * i - Math.PI / 2);
                    const y = this.y + this.radius * Math.sin(angle * i - Math.PI / 2);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            const dx = pos.x - this.startX;
            const dy = pos.y - this.startY;
            this.currentPolygon.radius = Math.sqrt(dx * dx + dy * dy);
            this.app.render();
            this.currentPolygon.draw(this.app.ctx);
        }
    }

    onMouseUp(pos) {
        if (this.currentPolygon.radius > 1) {
            this.app.addObject(this.currentPolygon);
        }
    }
}

class StarTool extends Tool {
    constructor(app) {
        super(app);
        this.points = 5; // Default number of points
        this.innerRatio = 0.5; // Ratio of inner radius to outer radius
    }

    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentStar = {
            type: 'star',
            x: pos.x,
            y: pos.y,
            radius: 0,
            points: this.points,
            innerRatio: this.innerRatio,
            style: { ...this.app.properties },
            draw: function(ctx) {
                const angle = (Math.PI * 2) / (this.points * 2);
                ctx.fillStyle = this.style.fill;
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.strokeWidth;
                ctx.beginPath();
                for (let i = 0; i < this.points * 2; i++) {
                    const r = i % 2 === 0 ? this.radius : this.radius * this.innerRatio;
                    const x = this.x + r * Math.cos(angle * i - Math.PI / 2);
                    const y = this.y + r * Math.sin(angle * i - Math.PI / 2);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            const dx = pos.x - this.startX;
            const dy = pos.y - this.startY;
            this.currentStar.radius = Math.sqrt(dx * dx + dy * dy);
            this.app.render();
            this.currentStar.draw(this.app.ctx);
        }
    }

    onMouseUp(pos) {
        if (this.currentStar.radius > 1) {
            this.app.addObject(this.currentStar);
        }
    }
}

class GradientTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentGradient = {
            type: 'gradient',
            startX: pos.x,
            startY: pos.y,
            endX: pos.x,
            endY: pos.y,
            style: { 
                ...this.app.properties,
                gradientColors: ['#ff0000', '#00ff00'] // Default gradient colors
            },
            draw: function(ctx) {
                const gradient = ctx.createLinearGradient(
                    this.startX, this.startY,
                    this.endX, this.endY
                );
                gradient.addColorStop(0, this.style.gradientColors[0]);
                gradient.addColorStop(1, this.style.gradientColors[1]);
                ctx.fillStyle = gradient;
                ctx.fillRect(
                    Math.min(this.startX, this.endX),
                    Math.min(this.startY, this.endY),
                    Math.abs(this.endX - this.startX),
                    Math.abs(this.endY - this.startY)
                );
            }
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            this.currentGradient.endX = pos.x;
            this.currentGradient.endY = pos.y;
            this.app.render();
            this.currentGradient.draw(this.app.ctx);
        }
    }

    onMouseUp(pos) {
        if (Math.abs(this.currentGradient.endX - this.currentGradient.startX) > 1 ||
            Math.abs(this.currentGradient.endY - this.currentGradient.startY) > 1) {
            this.app.addObject(this.currentGradient);
        }
    }
}

class ShapeTool extends Tool {
    constructor(app) {
        super(app);
        this.shapes = ['heart', 'cloud', 'lightning', 'diamond'];
        this.currentShape = 'heart';
    }

    drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
        ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 3/4, x, y + size);
        ctx.bezierCurveTo(x, y + size * 3/4, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    }

    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentCustomShape = {
            type: 'shape',
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            shape: this.currentShape,
            style: { ...this.app.properties },
            draw: (ctx) => {
                ctx.fillStyle = this.style.fill;
                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.strokeWidth;
                
                switch(this.shape) {
                    case 'heart':
                        this.drawHeart(ctx, this.x, this.y, this.width);
                        break;
                    // Add more shape drawing methods
                }
                
                ctx.fill();
                ctx.stroke();
            }
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            this.currentCustomShape.width = pos.x - this.startX;
            this.currentCustomShape.height = pos.y - this.startY;
            this.app.render();
            this.currentCustomShape.draw(this.app.ctx);
        }
    }

    onMouseUp(pos) {
        if (Math.abs(this.currentCustomShape.width) > 1) {
            this.app.addObject(this.currentCustomShape);
        }
    }
}

class CurveTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        if (!this.points) {
            this.points = [pos];
        } else {
            this.points.push(pos);
            if (this.points.length === 4) {
                const curveObj = {
                    type: 'curve',
                    points: [...this.points],
                    style: { ...this.app.properties },
                    draw: function(ctx) {
                        ctx.strokeStyle = this.style.stroke;
                        ctx.lineWidth = this.style.strokeWidth;
                        ctx.beginPath();
                        ctx.moveTo(this.points[0].x, this.points[0].y);
                        ctx.bezierCurveTo(
                            this.points[1].x, this.points[1].y,
                            this.points[2].x, this.points[2].y,
                            this.points[3].x, this.points[3].y
                        );
                        ctx.stroke();
                    }
                };
                this.app.addObject(curveObj);
                this.points = null;
            }
        }
    }

    onMouseMove(pos) {
        if (this.points) {
            this.app.render();
            // Draw points and preview line
            this.app.ctx.fillStyle = '#ff0000';
            this.points.forEach(p => {
                this.app.ctx.beginPath();
                this.app.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                this.app.ctx.fill();
            });
        }
    }
}

class ArrowTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.currentArrow = {
            type: 'arrow',
            startX: pos.x,
            startY: pos.y,
            endX: pos.x,
            endY: pos.y,
            style: { ...this.app.properties },
            draw: function(ctx) {
                const angle = Math.atan2(this.endY - this.startY, this.endX - this.startX);
                const headlen = 20;

                ctx.strokeStyle = this.style.stroke;
                ctx.lineWidth = this.style.strokeWidth;
                ctx.beginPath();
                ctx.moveTo(this.startX, this.startY);
                ctx.lineTo(this.endX, this.endY);
                ctx.lineTo(this.endX - headlen * Math.cos(angle - Math.PI / 6),
                          this.endY - headlen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(this.endX, this.endY);
                ctx.lineTo(this.endX - headlen * Math.cos(angle + Math.PI / 6),
                          this.endY - headlen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            this.currentArrow.endX = pos.x;
            this.currentArrow.endY = pos.y;
            this.app.render();
            this.currentArrow.draw(this.app.ctx);
        }
    }

    onMouseUp(pos) {
        if (Math.abs(this.currentArrow.endX - this.currentArrow.startX) > 1 ||
            Math.abs(this.currentArrow.endY - this.currentArrow.startY) > 1) {
            this.app.addObject(this.currentArrow);
        }
    }
}

class ImageTool extends Tool {
    onMouseDown(pos) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const imageObj = {
                            type: 'image',
                            x: pos.x,
                            y: pos.y,
                            width: img.width,
                            height: img.height,
                            image: img,
                            draw: function(ctx) {
                                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
                            }
                        };
                        this.app.addObject(imageObj);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }
}

class CropTool extends Tool {
    onMouseDown(pos) {
        super.onMouseDown(pos);
        this.cropRect = {
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0
        };
    }

    onMouseMove(pos) {
        if (this.app.isDrawing) {
            this.cropRect.width = pos.x - this.startX;
            this.cropRect.height = pos.y - this.startY;
            this.app.render();
            
            // Draw crop overlay
            this.app.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.app.ctx.fillRect(0, 0, this.app.canvas.width, this.app.canvas.height);
            this.app.ctx.clearRect(
                this.cropRect.x,
                this.cropRect.y,
                this.cropRect.width,
                this.cropRect.height
            );
        }
    }

    onMouseUp(pos) {
        if (Math.abs(this.cropRect.width) > 1 && Math.abs(this.cropRect.height) > 1) {
            // Normalize dimensions
            if (this.cropRect.width < 0) {
                this.cropRect.x += this.cropRect.width;
                this.cropRect.width = Math.abs(this.cropRect.width);
            }
            if (this.cropRect.height < 0) {
                this.cropRect.y += this.cropRect.height;
                this.cropRect.height = Math.abs(this.cropRect.height);
            }

            // Create a new canvas with cropped content
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = this.cropRect.width;
            cropCanvas.height = this.cropRect.height;
            const cropCtx = cropCanvas.getContext('2d');
            
            cropCtx.drawImage(
                this.app.canvas,
                this.cropRect.x,
                this.cropRect.y,
                this.cropRect.width,
                this.cropRect.height,
                0, 0,
                this.cropRect.width,
                this.cropRect.height
            );

            // Clear canvas and draw cropped content
            this.app.ctx.clearRect(0, 0, this.app.canvas.width, this.app.canvas.height);
            this.app.ctx.drawImage(cropCanvas, 0, 0);
            
            // Reset layers to contain only the cropped content
            this.app.layers = [{
                id: 1,
                name: 'Layer 1',
                visible: true,
                objects: []
            }];
            this.app.currentLayer = 0;
        }
    }
} 