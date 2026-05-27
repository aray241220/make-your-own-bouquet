/* ======================== */
/* EDITOR INITIALIZATION */
/* ======================== */

function initializeEditor() {
    // Set initial bouquet preview
    updateBouquetPreview();

    // Setup event listeners
    setupEditorListeners();

    // Populate form with current data
    populateForm();

    // Auto-save draft
    saveDraft();
}

/* ======================== */
/* FORM POPULATION */
/* ======================== */

function populateForm() {
    const titleInput = document.getElementById('titleInput');
    const messageInput = document.getElementById('messageInput');
    const signatureInput = document.getElementById('signatureInput');

    titleInput.value = appState.bouquetTitle;
    messageInput.value = appState.bouquetMessage;
    signatureInput.value = appState.bouquetSignature;
}

/* ======================== */
/* EDITOR EVENT LISTENERS */
/* ======================== */

function setupEditorListeners() {
    const titleInput = document.getElementById('titleInput');
    const messageInput = document.getElementById('messageInput');
    const signatureInput = document.getElementById('signatureInput');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const colorPicker = document.getElementById('colorPicker');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');

    // Title input
    titleInput.addEventListener('input', (e) => {
        appState.bouquetTitle = e.target.value;
        updateBouquetPreview();
        playClickSound();
        saveDraft();
    });

    // Message input
    messageInput.addEventListener('input', (e) => {
        appState.bouquetMessage = e.target.value;
        updateBouquetPreview();
        saveDraft();
    });

    // Signature input
    signatureInput.addEventListener('input', (e) => {
        appState.bouquetSignature = e.target.value;
        updateBouquetPreview();
        playClickSound();
        saveDraft();
    });

    // Font size slider
    fontSizeSlider.addEventListener('input', (e) => {
        const fontSize = e.target.value;
        document.getElementById('fontSizeValue').textContent = fontSize + 'px';
        updateBouquetPreview();
        playClickSound();
        saveDraft();
    });

    // Color picker
    colorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        updateBouquetPreview(color);
        saveDraft();
    });

    // Download button
    downloadBtn.addEventListener('click', downloadBouquetAsPNG);

    // Share button
    shareBtn.addEventListener('click', copyShareableLink);
}

/* ======================== */
/* BOUQUET PREVIEW UPDATE */
/* ======================== */

function updateBouquetPreview(flowerColor) {
    const cardPreview = document.getElementById('cardPreview');
    const previewTitle = document.getElementById('previewTitle');
    const previewMessage = document.getElementById('previewMessage');
    const previewSignature = document.getElementById('previewSignature');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSize = parseInt(fontSizeSlider.value);

    // Update text content
    previewTitle.textContent = appState.bouquetTitle || 'Your Bouquet';
    previewMessage.textContent = appState.bouquetMessage || 'Add your message here...';
    previewSignature.textContent = appState.bouquetSignature || 'With love';

    // Update font sizes
    previewTitle.style.fontSize = (fontSize * 1.5) + 'px';
    previewMessage.style.fontSize = fontSize + 'px';
    previewSignature.style.fontSize = (fontSize * 0.9) + 'px';

    // Draw bouquet SVG
    drawBouquet(flowerColor);
}

/* ======================== */
/* SVG BOUQUET DRAWING */
/* ======================== */

function drawBouquet(flowerColor) {
    const flowersGroup = document.getElementById('flowersGroup');
    const vaseRect = document.getElementById('vaseRect');
    
    // Clear previous flowers
    flowersGroup.innerHTML = '';

    // Get vase color
    const vase = vaseData[appState.selectedVase];
    const arrangement = appState.selectedArrangement;
    const color = flowerColor;

    // Update vase color
    vaseRect.setAttribute('fill', vase.color);

    // Generate flower positions based on arrangement
    const positions = generateFlowerPositions(arrangement);

    // Draw flowers - cycle through selected flowers
    positions.forEach((pos, index) => {
        const selectedFlowerIndex = index % appState.selectedFlowers.length;
        const flowerType = appState.selectedFlowers[selectedFlowerIndex];
        const flowerData = flowerData[flowerType];
        
        const flowerElement = createFlowerElement(pos.x, pos.y, color || flowerData.color, pos.size || 20);
        flowersGroup.appendChild(flowerElement);
    });
}

function generateFlowerPositions(arrangement) {
    const positions = [];

    switch (arrangement) {
        case 'spiral':
            // Spiral arrangement
            for (let i = 0; i < 15; i++) {
                const angle = (i / 15) * Math.PI * 4;
                const radius = 30 + (i / 15) * 60;
                positions.push({
                    x: 200 + Math.cos(angle) * radius,
                    y: 250 + Math.sin(angle) * radius * 0.8,
                    size: 15 + (i / 15) * 10
                });
            }
            break;

        case 'clustered':
            // Clustered arrangement
            for (let i = 0; i < 20; i++) {
                positions.push({
                    x: 180 + Math.random() * 40,
                    y: 200 + Math.random() * 120,
                    size: 18
                });
            }
            break;

        case 'tiered':
            // Tiered arrangement
            for (let layer = 0; layer < 5; layer++) {
                const layerY = 200 + (layer * 30);
                const count = 5 - layer;
                for (let i = 0; i < count; i++) {
                    positions.push({
                        x: 200 + (i - count / 2) * 40,
                        y: layerY,
                        size: 20 - (layer * 2)
                    });
                }
            }
            break;

        case 'asymmetrical':
            // Asymmetrical arrangement
            for (let i = 0; i < 18; i++) {
                const side = i < 9 ? 1 : -1;
                positions.push({
                    x: 200 + side * (30 + Math.random() * 60),
                    y: 200 + Math.random() * 140,
                    size: 16 + Math.random() * 8
                });
            }
            break;

        case 'dome':
            // Rounded dome arrangement
            for (let i = 0; i < 22; i++) {
                const angle = (i / 22) * Math.PI * 2;
                const radius = 50;
                const yOffset = Math.cos(angle) * 30;
                positions.push({
                    x: 200 + Math.cos(angle) * radius,
                    y: 220 + Math.sin(angle) * radius + yOffset,
                    size: 16
                });
            }
            break;

        default:
            // Default spiral
            for (let i = 0; i < 15; i++) {
                const angle = (i / 15) * Math.PI * 4;
                const radius = 30 + (i / 15) * 60;
                positions.push({
                    x: 200 + Math.cos(angle) * radius,
                    y: 250 + Math.sin(angle) * radius * 0.8,
                    size: 15 + (i / 15) * 10
                });
            }
    }

    return positions;
}

function createFlowerElement(x, y, color, size) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${x},${y})`);

    // Create flower petals (simplified flower shape)
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const petalX = Math.cos(angle) * size * 0.6;
        const petalY = Math.sin(angle) * size * 0.6;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', petalX);
        circle.setAttribute('cy', petalY);
        circle.setAttribute('r', size * 0.4);
        circle.setAttribute('fill', color);
        circle.setAttribute('opacity', '0.8');

        group.appendChild(circle);
    }

    // Create flower center
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', '0');
    center.setAttribute('cy', '0');
    center.setAttribute('r', size * 0.2);
    center.setAttribute('fill', '#FFD700');

    group.appendChild(center);

    return group;
}

/* ======================== */
/* DOWNLOAD AS PNG */
/* ======================== */

function downloadBouquetAsPNG() {
    const svg = document.getElementById('bouquetSVG');
    const canvas = document.createElement('canvas');
    const cardPreview = document.getElementById('cardPreview');

    const width = 800;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Draw background
    const style = window.getComputedStyle(cardPreview);
    const bgImage = style.backgroundImage;
    
    // For simplicity, draw a gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#fff5f5');
    gradient.addColorStop(1, '#fff0f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Create image from SVG
    const svgString = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = function() {
        ctx.drawImage(img, 50, 50, 700, 600);
        
        // Draw text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(appState.bouquetTitle, width / 2, 750);

        ctx.font = '18px Courier New';
        ctx.fillStyle = '#555';
        const words = appState.bouquetMessage.split(' ');
        let line = '';
        let y = 820;
        
        words.forEach(word => {
            if (ctx.measureText(line + word).width > 700) {
                ctx.fillText(line, width / 2, y);
                y += 30;
                line = word + ' ';
            } else {
                line += word + ' ';
            }
        });
        if (line) ctx.fillText(line, width / 2, y);

        ctx.font = 'italic 16px Courier New';
        ctx.fillStyle = '#777';
        ctx.fillText(appState.bouquetSignature, width / 2, height - 50);

        // Download
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'bouquet.png';
        link.click();

        URL.revokeObjectURL(url);
    };

    img.src = url;
}

/* ======================== */
/* SHARE FUNCTIONALITY */
/* ======================== */

function copyShareableLink() {
    const bouquetData = {
        flower: appState.selectedFlower,
        vase: appState.selectedVase,
        arrangement: appState.selectedArrangement,
        title: appState.bouquetTitle,
        message: appState.bouquetMessage,
        signature: appState.bouquetSignature
    };

    const encodedData = encodeURIComponent(JSON.stringify(bouquetData));
    const shareUrl = window.location.origin + window.location.pathname + '?bouquet=' + encodedData;

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
        playClickSound();
        alert('Shareable link copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy link. Please try again.');
    });
}
