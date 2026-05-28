/* ======================== */
/* FLOWER IMAGE REGISTRY    */
/* (declared first so functions defined below cannot hit a TDZ) */
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

/* ======================== */
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
