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
    saveDraft();/* ======================== */
/* EDITOR INITIALIZATION */
/* ======================== */

function initializeEditor() {
    // Preload flower photos as data URIs first so PNG export isn't tainted
    ensureFlowerImagesLoaded().then(() => {
        updateBouquetPreview();
    });

    // Initial render (will be replaced once images load)
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
    const flowerCountSlider = document.getElementById('flowerCountSlider');
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
    // Flower count slider
    if (flowerCountSlider) {
        flowerCountSlider.value = appState.flowerCount;
        const cv = document.getElementById('flowerCountValue');
        if (cv) cv.textContent = appState.flowerCount;
        flowerCountSlider.addEventListener('input', (e) => {
            const count = parseInt(e.target.value, 10);
            appState.flowerCount = count;
            if (cv) cv.textContent = count;
            updateBouquetPreview();
            playClickSound();
            saveDraft();
        });
    }

    // Download button
    downloadBtn.addEventListener('click', downloadBouquetAsPNG);

    // Share button
    shareBtn.addEventListener('click', copyShareableLink);
}

/* ======================== */
/* BOUQUET PREVIEW UPDATE */
/* ======================== */

function updateBouquetPreview() {
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
    drawBouquet();
}

/* ======================== */
/* SVG BOUQUET DRAWING */
/* ======================== */

function drawBouquet() {
    const flowersGroup = document.getElementById('flowersGroup');
    const vaseGroup = document.getElementById('vaseGroup');
    
    // Clear previous elements
    flowersGroup.innerHTML = '';
    vaseGroup.innerHTML = '';

    // Scale the whole bouquet (vase + flowers) by 1.875x around the vase base center,
    // keeping aspect ratio.
    const SCALE = 1.875;
    const CX = 200;
    const CY = 350;
    const transform = `translate(${CX} ${CY}) scale(${SCALE}) translate(${-CX} ${-CY})`;
    vaseGroup.setAttribute('transform', transform);
    flowersGroup.setAttribute('transform', transform);

    // Get vase color and type
    const vase = vaseData[appState.selectedVase];
    const arrangement = appState.selectedArrangement;

    // Create and add vase SVG
    const vaseElement = createVaseElement(appState.selectedVase, vase.color);
    vaseGroup.appendChild(vaseElement);

    // Generate flower positions based on arrangement and selected count
    const count = Math.max(1, appState.flowerCount || 12);
    const positions = generateFlowerPositions(arrangement, count);

    // Draw flowers - cycle through selected flowers, each keeps its own color
    positions.forEach((pos, index) => {
        const selectedFlowerIndex = index % appState.selectedFlowers.length;
        const flowerType = appState.selectedFlowers[selectedFlowerIndex];
        const flowerInfo = flowerData[flowerType];
        
        const flowerElement = createFlowerElement(pos.x, pos.y, flowerInfo.color, pos.size || 22, flowerType);
        flowersGroup.appendChild(flowerElement);
    });
}

function createVaseElement(vaseType, ribbonColor) {
    // Draws a brown-paper bouquet wrap (cone) tied with a colored ribbon.
    // ribbonColor varies per "wrap" choice; the paper itself is always kraft brown.
    const svgNS = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(svgNS, 'g');

    // Coordinate frame: viewBox 0..400 wide, ~250..440 vertical for the wrap.
    // Wrap opening sits around y=255; cone tapers down to y=435.
    const cx = 200;
    const openY = 255;
    const tipY = 438;
    const halfOpen = 90;   // half-width of paper opening
    const halfTip  = 22;   // half-width at the tip

    const PAPER_DARK  = '#6a4a1f';
    const PAPER_MID   = '#8b6332';
    const PAPER_LIGHT = '#b0824a';

    // Back paper panel (slightly wider, rotated outward)
    const back = document.createElementNS(svgNS, 'polygon');
    back.setAttribute('points', [
        cx - halfOpen - 8, openY - 4,
        cx + halfOpen + 8, openY - 4,
        cx + halfTip + 6,  tipY,
        cx - halfTip - 6,  tipY
    ].join(' '));
    back.setAttribute('fill', PAPER_DARK);
    back.setAttribute('stroke', '#3d2810');
    back.setAttribute('stroke-width', '2');
    back.setAttribute('stroke-linejoin', 'round');
    group.appendChild(back);

    // Front paper panel (the main visible cone)
    const front = document.createElementNS(svgNS, 'polygon');
    front.setAttribute('points', [
        cx - halfOpen, openY,
        cx + halfOpen, openY,
        cx + halfTip,  tipY,
        cx - halfTip,  tipY
    ].join(' '));
    front.setAttribute('fill', PAPER_MID);
    front.setAttribute('stroke', '#4a3315');
    front.setAttribute('stroke-width', '2');
    front.setAttribute('stroke-linejoin', 'round');
    group.appendChild(front);

    // Inner fold highlight along the front center
    const fold = document.createElementNS(svgNS, 'polygon');
    fold.setAttribute('points', [
        cx - 30, openY + 6,
        cx + 30, openY + 6,
        cx + halfTip - 4, tipY - 4,
        cx - halfTip + 4, tipY - 4
    ].join(' '));
    fold.setAttribute('fill', PAPER_LIGHT);
    fold.setAttribute('opacity', '0.55');
    group.appendChild(fold);

    // Diagonal crease lines on the front paper for a paper texture feel
    for (const x0 of [-60, -20, 20, 60]) {
        const crease = document.createElementNS(svgNS, 'line');
        const startX = cx + x0;
        // crease points toward the tip
        const t = 0.78; // length fraction
        const endX = cx + x0 * (1 - t) * (halfTip / halfOpen);
        crease.setAttribute('x1', startX);
        crease.setAttribute('y1', openY + 4);
        crease.setAttribute('x2', endX);
        crease.setAttribute('y2', openY + (tipY - openY) * t);
        crease.setAttribute('stroke', '#4a3315');
        crease.setAttribute('stroke-width', '0.8');
        crease.setAttribute('opacity', '0.45');
        group.appendChild(crease);
    }

    // Ribbon band wrapped around ~75% down the cone
    const ribbonY = openY + (tipY - openY) * 0.72;
    // width of cone at that height
    const ti = 0.72;
    const halfAtRibbon = (halfOpen + (halfTip - halfOpen) * ti) * 0.8;
    const ribbonH = 22 * 0.8;

    // Ribbon body
    const ribbon = document.createElementNS(svgNS, 'rect');
    ribbon.setAttribute('x', cx - halfAtRibbon - 4);
    ribbon.setAttribute('y', ribbonY - ribbonH / 2);
    ribbon.setAttribute('width', (halfAtRibbon + 4) * 2);
    ribbon.setAttribute('height', ribbonH);
    ribbon.setAttribute('fill', ribbonColor);
    ribbon.setAttribute('stroke', '#1a1a1a');
    ribbon.setAttribute('stroke-width', '1.2');
    ribbon.setAttribute('opacity', '0.95');
    group.appendChild(ribbon);

    // Ribbon top highlight
    const ribbonHi = document.createElementNS(svgNS, 'rect');
    ribbonHi.setAttribute('x', cx - halfAtRibbon - 2);
    ribbonHi.setAttribute('y', ribbonY - ribbonH / 2 + 2);
    ribbonHi.setAttribute('width', (halfAtRibbon + 2) * 2);
    ribbonHi.setAttribute('height', 4);
    ribbonHi.setAttribute('fill', '#ffffff');
    ribbonHi.setAttribute('opacity', '0.18');
    group.appendChild(ribbonHi);

    // Bow knot
    const knot = document.createElementNS(svgNS, 'ellipse');
    knot.setAttribute('cx', cx);
    knot.setAttribute('cy', ribbonY);
    knot.setAttribute('rx', 8);
    knot.setAttribute('ry', 6.4);
    knot.setAttribute('fill', ribbonColor);
    knot.setAttribute('stroke', '#1a1a1a');
    knot.setAttribute('stroke-width', '1.2');
    group.appendChild(knot);

    // Bow loops (left & right) using paths
    const loopL = document.createElementNS(svgNS, 'path');
    loopL.setAttribute('d',
        `M ${cx - 4.8} ${ribbonY}
         C ${cx - 28.8} ${ribbonY - 17.6}, ${cx - 35.2} ${ribbonY + 8}, ${cx - 17.6} ${ribbonY + 4.8}
         C ${cx - 11.2} ${ribbonY + 3.2}, ${cx - 6.4} ${ribbonY + 1.6}, ${cx - 4.8} ${ribbonY} Z`);
    loopL.setAttribute('fill', ribbonColor);
    loopL.setAttribute('stroke', '#1a1a1a');
    loopL.setAttribute('stroke-width', '1.2');
    group.appendChild(loopL);

    const loopR = document.createElementNS(svgNS, 'path');
    loopR.setAttribute('d',
        `M ${cx + 4.8} ${ribbonY}
         C ${cx + 28.8} ${ribbonY - 17.6}, ${cx + 35.2} ${ribbonY + 8}, ${cx + 17.6} ${ribbonY + 4.8}
         C ${cx + 11.2} ${ribbonY + 3.2}, ${cx + 6.4} ${ribbonY + 1.6}, ${cx + 4.8} ${ribbonY} Z`);
    loopR.setAttribute('fill', ribbonColor);
    loopR.setAttribute('stroke', '#1a1a1a');
    loopR.setAttribute('stroke-width', '1.2');
    group.appendChild(loopR);

    // Trailing ribbon tails
    const tailL = document.createElementNS(svgNS, 'path');
    tailL.setAttribute('d',
        `M ${cx - 3.2} ${ribbonY + 4.8}
         C ${cx - 6.4} ${ribbonY + 19.2}, ${cx - 12.8} ${ribbonY + 28.8}, ${cx - 8} ${ribbonY + 38.4}
         L ${cx - 1.6} ${ribbonY + 35.2}
         C ${cx - 3.2} ${ribbonY + 22.4}, ${cx} ${ribbonY + 14.4}, ${cx + 1.6} ${ribbonY + 4.8} Z`);
    tailL.setAttribute('fill', ribbonColor);
    tailL.setAttribute('stroke', '#1a1a1a');
    tailL.setAttribute('stroke-width', '1');
    group.appendChild(tailL);

    const tailR = document.createElementNS(svgNS, 'path');
    tailR.setAttribute('d',
        `M ${cx + 3.2} ${ribbonY + 4.8}
         C ${cx + 6.4} ${ribbonY + 19.2}, ${cx + 12.8} ${ribbonY + 28.8}, ${cx + 8} ${ribbonY + 38.4}
         L ${cx + 1.6} ${ribbonY + 35.2}
         C ${cx + 3.2} ${ribbonY + 22.4}, ${cx} ${ribbonY + 14.4}, ${cx - 1.6} ${ribbonY + 4.8} Z`);
    tailR.setAttribute('fill', ribbonColor);
    tailR.setAttribute('stroke', '#1a1a1a');
    tailR.setAttribute('stroke-width', '1');
    group.appendChild(tailR);

    return group;
}

function generateFlowerPositions(arrangement, count) {
    const positions = [];
    const n = Math.max(1, count || 12);
    // Flower size: 27.5 * 2 = 55
    const BASE = 55;
    // Spacing multiplier: 0.65 * 2 = 1.3
    const SP = 1.3;

    // Bouquet anchor (above vase rim at y ~265-285)
    const cx = 200;
    const topY = 230;   // top of bouquet cluster
    const baseY = 265;  // just above vase rim

    switch (arrangement) {
        case 'spiral': {
            const turns = 2.5;
            const maxR = 70 * SP;
            for (let i = 0; i < n; i++) {
                const t = i / Math.max(1, n - 1);
                const angle = t * Math.PI * 2 * turns;
                const radius = 10 * SP + t * maxR;
                positions.push({
                    x: cx + Math.cos(angle) * radius,
                    y: baseY - 20 + Math.sin(angle) * radius * 0.6,
                    size: BASE * (0.9 + (1 - t) * 0.3)
                });
            }
            break;
        }

        case 'clustered': {
            for (let i = 0; i < n; i++) {
                positions.push({
                    x: cx + (Math.random() - 0.5) * 80 * SP,
                    y: topY + Math.random() * 70 * SP,
                    size: BASE * (0.85 + Math.random() * 0.3)
                });
            }
            break;
        }

        case 'tiered': {
            // Distribute across layers from wide bottom to narrow top
            const layers = Math.max(2, Math.min(6, Math.ceil(Math.sqrt(n))));
            let placed = 0;
            for (let layer = 0; layer < layers && placed < n; layer++) {
                const remaining = n - placed;
                const layersLeft = layers - layer;
                const inLayer = Math.max(1, Math.ceil(remaining / layersLeft));
                const layerY = baseY - 5 - (layer * 22 * SP);
                for (let i = 0; i < inLayer && placed < n; i++) {
                    positions.push({
                        x: cx + (i - (inLayer - 1) / 2) * 28 * SP,
                        y: layerY,
                        size: BASE * (1 - layer * 0.06)
                    });
                    placed++;
                }
            }
            break;
        }

        case 'asymmetrical': {
            for (let i = 0; i < n; i++) {
                const side = i % 2 === 0 ? 1 : -1;
                positions.push({
                    x: cx + side * (15 * SP + Math.random() * 55 * SP),
                    y: topY + Math.random() * 80 * SP,
                    size: BASE * (0.85 + Math.random() * 0.3)
                });
            }
            break;
        }

        case 'dome': {
            // Filled dome shape
            const rings = Math.max(2, Math.min(4, Math.ceil(n / 8)));
            let placed = 0;
            // Center flower
            positions.push({ x: cx, y: topY + 5, size: BASE });
            placed++;
            for (let r = 1; r <= rings && placed < n; r++) {
                const ringCount = Math.min(n - placed, r * 6);
                const radius = r * 22 * SP;
                for (let i = 0; i < ringCount && placed < n; i++) {
                    const angle = (i / ringCount) * Math.PI * 2;
                    positions.push({
                        x: cx + Math.cos(angle) * radius,
                        y: topY + 5 + Math.sin(angle) * radius * 0.55,
                        size: BASE * (1 - r * 0.05)
                    });
                    placed++;
                }
            }
            break;
        }

        default: {
            for (let i = 0; i < n; i++) {
                const angle = (i / n) * Math.PI * 2;
                positions.push({
                    x: cx + Math.cos(angle) * 40 * SP,
                    y: baseY - 20 + Math.sin(angle) * 25 * SP,
                    size: BASE
                });
            }
        }
    }

    return positions;
}

/* ======================== */
/* FLOWER IMAGE LOADING     */
/* ======================== */

const flowerImagePaths = {
    rose: '../imgs/rose_6.png',
    tulip: '../imgs/tulip.png',
    sunflower: '../imgs/sunflower.png',
    daisy: '../imgs/daisy.png',
    lily: '../imgs/lily.png',
    orchid: '../imgs/orchid.png'
};

const flowerImageDataUrls = {};
let flowerImagesLoaded = false;
let flowerImagesPromise = null;

function loadImageAsDataUrl(path) {
    return fetch(path)
        .then(res => res.blob())
        .then(blob => new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
        }))
        .catch(() => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                c.getContext('2d').drawImage(img, 0, 0);
                try {
                    resolve(c.toDataURL('image/jpeg'));
                } catch (err) {
                    resolve(path);
                }
            };
            img.onerror = () => resolve(path);
            img.src = path;
        }));
}

function ensureFlowerImagesLoaded() {
    if (flowerImagesPromise) return flowerImagesPromise;
    flowerImagesPromise = Promise.all(
        Object.entries(flowerImagePaths).map(([type, path]) =>
            loadImageAsDataUrl(path).then(url => { flowerImageDataUrls[type] = url; })
        )
    ).then(() => { flowerImagesLoaded = true; });
    return flowerImagesPromise;
}

function createFlowerElement(x, y, _color, size, flowerType) {
    // Render the flower as a transparent PNG from /imgs (real flower shape).
    // Size is the flower radius so the rendered box is size*2 on each side.
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${x},${y})`);

    const href = flowerImageDataUrls[flowerType] || flowerImagePaths[flowerType];
    const d = size * 2;

    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);
    image.setAttribute('href', href);
    image.setAttribute('x', -size);
    image.setAttribute('y', -size);
    image.setAttribute('width', d);
    image.setAttribute('height', d);
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    group.appendChild(image);
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

    // Preload the calligraphy fonts so they render in the exported PNG
    const fontPromises = (document.fonts && document.fonts.load) ? Promise.all([
        document.fonts.load("48px 'Great Vibes'"),
        document.fonts.load("bold 48px 'Dancing Script'"),
        document.fonts.load("24px 'Dancing Script'"),
        document.fonts.load("28px 'Great Vibes'"),
        document.fonts.ready
    ]) : Promise.resolve();

    img.onload = function() {
        fontPromises.then(() => {
            ctx.drawImage(img, 50, 50, 700, 600);

            // Title - elegant calligraphy
            ctx.fillStyle = '#c2185b';
            ctx.font = "56px 'Great Vibes', 'Dancing Script', cursive";
            ctx.textAlign = 'center';
            ctx.fillText(appState.bouquetTitle, width / 2, 760);

            // Message - casual script
            ctx.font = "500 30px 'Dancing Script', cursive";
            ctx.fillStyle = '#444';
            const words = (appState.bouquetMessage || '').split(' ');
            let line = '';
            let y = 830;

            words.forEach(word => {
                if (ctx.measureText(line + word).width > 700) {
                    ctx.fillText(line.trim(), width / 2, y);
                    y += 40;
                    line = word + ' ';
                } else {
                    line += word + ' ';
                }
            });
            if (line.trim()) ctx.fillText(line.trim(), width / 2, y);

            // Signature - flowing calligraphy
            ctx.font = "36px 'Great Vibes', 'Dancing Script', cursive";
            ctx.fillStyle = '#8b1e58';
            ctx.fillText(appState.bouquetSignature, width / 2, height - 50);

            // Download
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'bouquet.png';
            link.click();

            URL.revokeObjectURL(url);
        });
    };

    img.src = url;
}

/* ======================== */
/* SHARE FUNCTIONALITY */
/* ======================== */

function copyShareableLink() {
    const bouquetData = {
        flowers: appState.selectedFlowers,
        vase: appState.selectedVase,
        arrangement: appState.selectedArrangement,
        title: appState.bouquetTitle,
        message: appState.bouquetMessage,
        signature: appState.bouquetSignature,
        flowerCount: appState.flowerCount
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
    const vaseGroup = document.getElementById('vaseGroup');
    
    // Clear previous elements
    flowersGroup.innerHTML = '';
    vaseGroup.innerHTML = '';

    // Get vase color and type
    const vase = vaseData[appState.selectedVase];
    const arrangement = appState.selectedArrangement;
    const color = flowerColor;

    // Create and add vase SVG
    const vaseElement = createVaseElement(appState.selectedVase, vase.color);
    vaseGroup.appendChild(vaseElement);

    // Generate flower positions based on arrangement
    const positions = generateFlowerPositions(arrangement);

    // Draw flowers - cycle through selected flowers
    positions.forEach((pos, index) => {
        const selectedFlowerIndex = index % appState.selectedFlowers.length;
        const flowerType = appState.selectedFlowers[selectedFlowerIndex];
        const flowerInfo = flowerData[flowerType];
        
        const flowerElement = createFlowerElement(pos.x, pos.y, color || flowerInfo.color, pos.size || 25, flowerType);
        flowersGroup.appendChild(flowerElement);
    });
}

function createVaseElement(vaseType, color) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    switch (vaseType) {
        case 'classic':
            // Classic ceramic vase - curved pottery shape
            const classicPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            classicPath.setAttribute('d', 'M 150 430 Q 135 410 135 380 L 135 320 Q 135 290 155 280 L 245 280 Q 265 290 265 320 L 265 380 Q 265 410 250 430');
            classicPath.setAttribute('fill', color);
            classicPath.setAttribute('stroke', '#8b6f47');
            classicPath.setAttribute('stroke-width', '2');
            
            const classicRim = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            classicRim.setAttribute('cx', '200');
            classicRim.setAttribute('cy', '280');
            classicRim.setAttribute('rx', '55');
            classicRim.setAttribute('ry', '15');
            classicRim.setAttribute('fill', '#c9956f');
            classicRim.setAttribute('stroke', '#8b6f47');
            classicRim.setAttribute('stroke-width', '1.5');
            
            group.appendChild(classicPath);
            group.appendChild(classicRim);
            break;

        case 'modern':
            // Modern minimalist - rectangular shape
            const modernRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            modernRect.setAttribute('x', '160');
            modernRect.setAttribute('y', '290');
            modernRect.setAttribute('width', '80');
            modernRect.setAttribute('height', '140');
            modernRect.setAttribute('fill', color);
            modernRect.setAttribute('stroke', '#999');
            modernRect.setAttribute('stroke-width', '2');
            modernRect.setAttribute('rx', '4');
            
            const modernRim = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            modernRim.setAttribute('x', '156');
            modernRim.setAttribute('y', '285');
            modernRim.setAttribute('width', '88');
            modernRim.setAttribute('height', '10');
            modernRim.setAttribute('fill', '#d0d0d0');
            modernRim.setAttribute('stroke', '#999');
            modernRim.setAttribute('stroke-width', '1.5');
            modernRim.setAttribute('rx', '2');
            
            group.appendChild(modernRect);
            group.appendChild(modernRim);
            break;

        case 'rustic':
            // Rustic glass - curved shape with transparency
            const rusticPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            rusticPath.setAttribute('d', 'M 142 430 Q 125 410 125 375 L 125 320 Q 128 295 160 285 L 240 285 Q 272 295 275 320 L 275 375 Q 275 410 258 430');
            rusticPath.setAttribute('fill', color);
            rusticPath.setAttribute('stroke', '#4a90a4');
            rusticPath.setAttribute('stroke-width', '2');
            rusticPath.setAttribute('opacity', '0.8');
            
            const rusticHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            rusticHighlight.setAttribute('cx', '160');
            rusticHighlight.setAttribute('cy', '360');
            rusticHighlight.setAttribute('rx', '15');
            rusticHighlight.setAttribute('ry', '40');
            rusticHighlight.setAttribute('fill', '#ffffff');
            rusticHighlight.setAttribute('opacity', '0.3');
            
            const rusticRim = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            rusticRim.setAttribute('cx', '200');
            rusticRim.setAttribute('cy', '285');
            rusticRim.setAttribute('rx', '50');
            rusticRim.setAttribute('ry', '15');
            rusticRim.setAttribute('fill', '#8cc5d4');
            rusticRim.setAttribute('stroke', '#4a90a4');
            rusticRim.setAttribute('stroke-width', '1.5');
            rusticRim.setAttribute('opacity', '0.9');
            
            group.appendChild(rusticPath);
            group.appendChild(rusticHighlight);
            group.appendChild(rusticRim);
            break;

        case 'crystal':
            // Crystal vase - faceted geometric shape
            const crystalPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            crystalPath.setAttribute('d', 'M 155 430 L 130 385 L 110 330 L 115 280 L 155 265 L 245 265 L 285 280 L 290 330 L 270 385 L 245 430');
            crystalPath.setAttribute('fill', color);
            crystalPath.setAttribute('stroke', '#b884d4');
            crystalPath.setAttribute('stroke-width', '2');
            
            const leftFacet = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            leftFacet.setAttribute('d', 'M 130 385 L 115 330 L 145 350 L 155 385');
            leftFacet.setAttribute('fill', '#ffffff');
            leftFacet.setAttribute('opacity', '0.4');
            
            const rightFacet = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            rightFacet.setAttribute('d', 'M 270 385 L 290 330 L 255 350 L 245 385');
            rightFacet.setAttribute('fill', '#ffffff');
            rightFacet.setAttribute('opacity', '0.4');
            
            const crystalRim = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            crystalRim.setAttribute('cx', '200');
            crystalRim.setAttribute('cy', '265');
            crystalRim.setAttribute('rx', '50');
            crystalRim.setAttribute('ry', '12');
            crystalRim.setAttribute('fill', '#d9b8e8');
            crystalRim.setAttribute('stroke', '#b884d4');
            crystalRim.setAttribute('stroke-width', '1.5');
            
            group.appendChild(crystalPath);
            group.appendChild(leftFacet);
            group.appendChild(rightFacet);
            group.appendChild(crystalRim);
            break;

        case 'vintage':
            // Vintage pitcher - with handle
            const vintageBody = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            vintageBody.setAttribute('d', 'M 142 430 Q 132 410 128 375 L 128 320 Q 128 295 155 280 L 245 280 Q 272 295 272 320 L 272 375 Q 268 410 258 430 Z');
            vintageBody.setAttribute('fill', color);
            vintageBody.setAttribute('stroke', '#b8860b');
            vintageBody.setAttribute('stroke-width', '2');
            
            const vintageHandle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            vintageHandle.setAttribute('d', 'M 272 340 Q 305 360 305 385 Q 305 395 290 400');
            vintageHandle.setAttribute('fill', 'none');
            vintageHandle.setAttribute('stroke', color);
            vintageHandle.setAttribute('stroke-width', '6');
            vintageHandle.setAttribute('stroke-linecap', 'round');
            
            const vintageRim = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            vintageRim.setAttribute('cx', '200');
            vintageRim.setAttribute('cy', '280');
            vintageRim.setAttribute('rx', '50');
            vintageRim.setAttribute('ry', '12');
            vintageRim.setAttribute('fill', '#d4a574');
            vintageRim.setAttribute('stroke', '#b8860b');
            vintageRim.setAttribute('stroke-width', '2');
            
            const vintageDecor = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            vintageDecor.setAttribute('cx', '200');
            vintageDecor.setAttribute('cy', '330');
            vintageDecor.setAttribute('rx', '65');
            vintageDecor.setAttribute('ry', '6');
            vintageDecor.setAttribute('fill', 'none');
            vintageDecor.setAttribute('stroke', '#b8860b');
            vintageDecor.setAttribute('stroke-width', '1');
            vintageDecor.setAttribute('opacity', '0.5');
            
            group.appendChild(vintageBody);
            group.appendChild(vintageHandle);
            group.appendChild(vintageRim);
            group.appendChild(vintageDecor);
            break;

        case 'contemporary':
            // Contemporary tall - cylindrical shape
            const contempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            contempPath.setAttribute('d', 'M 165 430 Q 155 400 155 360 L 158 305 Q 158 280 200 270 Q 242 280 242 305 L 245 360 Q 245 400 235 430');
            contempPath.setAttribute('fill', color);
            contempPath.setAttribute('stroke', '#5f9ea0');
            contempPath.setAttribute('stroke-width', '2');
            
            const contempHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            contempHighlight.setAttribute('cx', '170');
            contempHighlight.setAttribute('cy', '350');
            contempHighlight.setAttribute('rx', '12');
            contempHighlight.setAttribute('ry', '50');
            contempHighlight.setAttribute('fill', '#ffffff');
            contempHighlight.setAttribute('opacity', '0.3');
            
            const contempRim = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            contempRim.setAttribute('cx', '200');
            contempRim.setAttribute('cy', '270');
            contempRim.setAttribute('rx', '55');
            contempRim.setAttribute('ry', '12');
            contempRim.setAttribute('fill', '#7ecdd6');
            contempRim.setAttribute('stroke', '#5f9ea0');
            contempRim.setAttribute('stroke-width', '2');
            
            const contempBottom = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            contempBottom.setAttribute('cx', '200');
            contempBottom.setAttribute('cy', '430');
            contempBottom.setAttribute('rx', '60');
            contempBottom.setAttribute('ry', '8');
            contempBottom.setAttribute('fill', '#5f9ea0');
            contempBottom.setAttribute('opacity', '0.3');
            
            group.appendChild(contempPath);
            group.appendChild(contempHighlight);
            group.appendChild(contempRim);
            group.appendChild(contempBottom);
            break;

        default:
            // Fallback to classic
            const fallbackPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            fallbackPath.setAttribute('d', 'M 150 430 Q 135 410 135 380 L 135 320 Q 135 290 155 280 L 245 280 Q 265 290 265 320 L 265 380 Q 265 410 250 430');
            fallbackPath.setAttribute('fill', color);
            fallbackPath.setAttribute('stroke', '#999');
            fallbackPath.setAttribute('stroke-width', '2');
            group.appendChild(fallbackPath);
            break;
    }
    
    return group;
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
                    size: 75 + (i / 15) * 45
                });
            }
            break;

        case 'clustered':
            // Clustered arrangement
            for (let i = 0; i < 20; i++) {
                positions.push({
                    x: 180 + Math.random() * 40,
                    y: 200 + Math.random() * 120,
                    size: 85
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
                        size: 80 - (layer * 5)
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
                    size: 75 + Math.random() * 25
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
                    size: 80
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
                    size: 25 + (i / 15) * 15
                });
            }
    }

    return positions;
}

function createFlowerElement(x, y, color, size, flowerType) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${x},${y})`);

    switch (flowerType) {
        case 'rose':
            createRose(group, color, size);
            break;
        case 'tulip':
            createTulip(group, color, size);
            break;
        case 'sunflower':
            createSunflower(group, color, size);
            break;
        case 'daisy':
            createDaisy(group, color, size);
            break;
        case 'lily':
            createLily(group, color, size);
            break;
        case 'orchid':
            createOrchid(group, color, size);
            break;
        default:
            createRose(group, color, size);
    }

    return group;
}

function createRose(group, color, size) {
    // Rose with layered petals
    const centerSize = size * 0.3;
    
    // Outer petals (8 petals)
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const petalX = Math.cos(angle) * size * 0.7;
        const petalY = Math.sin(angle) * size * 0.7;

        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        petal.setAttribute('cx', petalX);
        petal.setAttribute('cy', petalY);
        petal.setAttribute('rx', size * 0.35);
        petal.setAttribute('ry', size * 0.45);
        petal.setAttribute('fill', color);
        petal.setAttribute('opacity', '0.7');
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI})`);
        group.appendChild(petal);
    }

    // Middle petals (6 petals, slightly smaller)
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 12;
        const petalX = Math.cos(angle) * size * 0.45;
        const petalY = Math.sin(angle) * size * 0.45;

        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        petal.setAttribute('cx', petalX);
        petal.setAttribute('cy', petalY);
        petal.setAttribute('rx', size * 0.25);
        petal.setAttribute('ry', size * 0.35);
        petal.setAttribute('fill', color);
        petal.setAttribute('opacity', '0.85');
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI})`);
        group.appendChild(petal);
    }

    // Inner petals (4 petals, darker)
    const darkerColor = shadeColor(color, -20);
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const petalX = Math.cos(angle) * size * 0.25;
        const petalY = Math.sin(angle) * size * 0.25;

        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        petal.setAttribute('cx', petalX);
        petal.setAttribute('cy', petalY);
        petal.setAttribute('rx', size * 0.15);
        petal.setAttribute('ry', size * 0.25);
        petal.setAttribute('fill', darkerColor);
        petal.setAttribute('opacity', '1');
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI})`);
        group.appendChild(petal);
    }

    // Center
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', '0');
    center.setAttribute('cy', '0');
    center.setAttribute('r', size * 0.12);
    center.setAttribute('fill', shadeColor(color, -40));
    group.appendChild(center);
}

function createSunflower(group, color, size) {
    // Sunflower with many petals radiating from center
    const petalCount = 24;
    
    // Yellow/golden petals
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalX = Math.cos(angle) * size * 0.6;
        const petalY = Math.sin(angle) * size * 0.6;

        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        petal.setAttribute('cx', petalX);
        petal.setAttribute('cy', petalY);
        petal.setAttribute('rx', size * 0.25);
        petal.setAttribute('ry', size * 0.4);
        petal.setAttribute('fill', color);
        petal.setAttribute('opacity', '0.9');
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI})`);
        group.appendChild(petal);
    }

    // Dark center circle with pattern
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', '0');
    centerCircle.setAttribute('cy', '0');
    centerCircle.setAttribute('r', size * 0.35);
    centerCircle.setAttribute('fill', '#8B4513');
    group.appendChild(centerCircle);

    // Add seed pattern to center
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const seedX = (i - 3.5) * size * 0.08;
            const seedY = (j - 3.5) * size * 0.08;
            const seed = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            seed.setAttribute('cx', seedX);
            seed.setAttribute('cy', seedY);
            seed.setAttribute('r', size * 0.04);
            seed.setAttribute('fill', '#654321');
            group.appendChild(seed);
        }
    }
}

function createTulip(group, color, size) {
    // Tulip with 6 large solid cup-shaped petals
    const petalCount = 6;
    
    // Outer petals - large and solid
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        petal.setAttribute('cx', '0');
        petal.setAttribute('cy', -size * 0.35);
        petal.setAttribute('rx', size * 0.32);
        petal.setAttribute('ry', size * 0.48);
        petal.setAttribute('fill', color);
        petal.setAttribute('opacity', '0.95');
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI})`);
        group.appendChild(petal);
    }

    // Inner petals (lighter shade for depth)
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 + Math.PI / petalCount;
        const lightColor = shadeColor(color, 40);
        
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        petal.setAttribute('cx', '0');
        petal.setAttribute('cy', -size * 0.25);
        petal.setAttribute('rx', size * 0.20);
        petal.setAttribute('ry', size * 0.36);
        petal.setAttribute('fill', lightColor);
        petal.setAttribute('opacity', '0.88');
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI})`);
        group.appendChild(petal);
    }

    // Gold center
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', '0');
    center.setAttribute('cy', '0');
    center.setAttribute('r', size * 0.14);
    center.setAttribute('fill', '#FFD700');
    group.appendChild(center);
}

function createDaisy(group, color, size) {
    // Daisy with simple white petals and yellow center
    const petalCount = 16;
    
    // White petals
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalX = Math.cos(angle) * size * 0.6;
        const petalY = Math.sin(angle) * size * 0.6;

        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        petal.setAttribute('cx', petalX);
        petal.setAttribute('cy', petalY);
        petal.setAttribute('rx', size * 0.2);
        petal.setAttribute('ry', size * 0.38);
        petal.setAttribute('fill', color);
        petal.setAttribute('opacity', '0.9');
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI})`);
        group.appendChild(petal);
    }

    // Yellow center
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', '0');
    center.setAttribute('cy', '0');
    center.setAttribute('r', size * 0.28);
    center.setAttribute('fill', '#FFD700');
    group.appendChild(center);
}

function createLily(group, color, size) {
    // Lily with 6 large petals and prominent stamens
    const petalCount = 6;
    
    // Petals
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalX = Math.cos(angle) * size * 0.5;
        const petalY = Math.sin(angle) * size * 0.5;

        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        petal.setAttribute('d', `M 0 ${-size * 0.7} Q ${Math.cos(angle) * size * 0.3} ${-size * 0.3} ${petalX} ${petalY}`);
        petal.setAttribute('fill', color);
        petal.setAttribute('opacity', '0.85');
        petal.setAttribute('stroke', shadeColor(color, -15));
        petal.setAttribute('stroke-width', '0.5');
        group.appendChild(petal);
    }

    // Stamens
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 12;
        const stamenX = Math.cos(angle) * size * 0.25;
        const stamenY = Math.sin(angle) * size * 0.25;

        const stamen = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        stamen.setAttribute('x1', '0');
        stamen.setAttribute('y1', '0');
        stamen.setAttribute('x2', stamenX);
        stamen.setAttribute('y2', stamenY);
        stamen.setAttribute('stroke', '#FF6B00');
        stamen.setAttribute('stroke-width', size * 0.06);
        group.appendChild(stamen);

        const anther = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        anther.setAttribute('cx', stamenX);
        anther.setAttribute('cy', stamenY);
        anther.setAttribute('r', size * 0.08);
        anther.setAttribute('fill', '#FF8C00');
        group.appendChild(anther);
    }

    // Center
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', '0');
    center.setAttribute('cy', '0');
    center.setAttribute('r', size * 0.12);
    center.setAttribute('fill', '#FFD700');
    group.appendChild(center);
}

function createOrchid(group, color, size) {
    // Orchid with unique petal arrangement - large and prominent
    const mainColor = color;
    const accentColor = shadeColor(color, 35);
    
    // Top sepal (large)
    const topSepal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    topSepal.setAttribute('cx', '0');
    topSepal.setAttribute('cy', -size * 0.50);
    topSepal.setAttribute('rx', size * 0.28);
    topSepal.setAttribute('ry', size * 0.50);
    topSepal.setAttribute('fill', mainColor);
    topSepal.setAttribute('opacity', '0.95');
    group.appendChild(topSepal);

    // Side petals (2) - large wing-like petals
    for (let i = 0; i < 2; i++) {
        const angle = i === 0 ? -Math.PI / 2.8 : Math.PI / 2.8;
        const petalX = Math.cos(angle) * size * 0.55;
        const petalY = Math.sin(angle) * size * 0.35 - size * 0.1;

        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        petal.setAttribute('cx', petalX);
        petal.setAttribute('cy', petalY);
        petal.setAttribute('rx', size * 0.32);
        petal.setAttribute('ry', size * 0.42);
        petal.setAttribute('fill', mainColor);
        petal.setAttribute('opacity', '0.92');
        petal.setAttribute('transform', `rotate(${angle * 180 / Math.PI})`);
        group.appendChild(petal);
    }

    // Lip (labellum) - distinctive large orchid feature
    const lip = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    lip.setAttribute('cx', '0');
    lip.setAttribute('cy', size * 0.45);
    lip.setAttribute('rx', size * 0.38);
    lip.setAttribute('ry', size * 0.35);
    lip.setAttribute('fill', accentColor);
    lip.setAttribute('opacity', '0.95');
    group.appendChild(lip);
    
    // Lip detail (ruffled texture)
    const lipDetail = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    lipDetail.setAttribute('cx', '0');
    lipDetail.setAttribute('cy', size * 0.48);
    lipDetail.setAttribute('rx', size * 0.25);
    lipDetail.setAttribute('ry', size * 0.20);
    lipDetail.setAttribute('fill', shadeColor(accentColor, -15));
    lipDetail.setAttribute('opacity', '0.8');
    group.appendChild(lipDetail);

    // Gold center
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', '0');
    center.setAttribute('cy', '0');
    center.setAttribute('r', size * 0.12);
    center.setAttribute('fill', '#FFD700');
    group.appendChild(center);
}

function shadeColor(color, percent) {
    // Convert hex color and lighten/darken it
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;
    G = (G<255)?G:255;
    B = (B<255)?B:255;

    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
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
