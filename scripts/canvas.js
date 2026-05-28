/* ======================== */
/* CANVAS RENDERING MODULE */
/* ======================== */

/**
 * Canvas rendering utilities for exporting bouquets as images
 * This module handles converting SVG to canvas and generating downloadable images
 */

// Placeholder for advanced canvas rendering features
// This file can be expanded with additional canvas manipulation features

function renderBouquetToCanvas(svgElement, width = 800, height = 1000) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    // Draw SVG to canvas
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            resolve(canvas);
        };
        
        img.onerror = function() {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to render SVG to canvas'));
        };
        
        img.src = url;
    });
}

function addTextToCanvas(ctx, text, x, y, fontSize, color = '#333', align = 'center', style = 'normal') {
    ctx.fillStyle = color;
    ctx.font = `${style} ${fontSize}px Courier New`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    
    words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, x, y);
            line = word + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    });
    
    if (line !== '') {
        ctx.fillText(line, x, y);
    }
    
    return y;
}

function applyFilter(canvas, filterType = 'none') {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    switch (filterType) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
            }
            break;
            
        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
                data[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
                data[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
            }
            break;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
