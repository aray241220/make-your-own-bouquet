/* ======================== */
/* APP STATE & VARIABLES */
/* ======================== */

const appState = {
    selectedFlowers: [],  // Array for multiple flower selection
    selectedVase: null,
    selectedArrangement: null,
    bouquetTitle: 'Your Bouquet',
    bouquetMessage: '',
    bouquetSignature: 'With love',
    flowerCount: 12
};

const flowerData = {
    rose: {
        name: 'Rose',
        emoji: '🌹',
        color: '#ff1493',
        desc: 'Classic elegance'
    },
    tulip: {
        name: 'Tulip',
        emoji: '🌷',
        color: '#ff69b4',
        desc: 'Spring beauty'
    },
    sunflower: {
        name: 'Sunflower',
        emoji: '🌻',
        color: '#ffa500',
        desc: 'Cheerful rays'
    },
    daisy: {
        name: 'Daisy',
        emoji: '🌼',
        color: '#ffff00',
        desc: 'Simple charm'
    },
    lily: {
        name: 'Lily',
        emoji: '🌸',
        color: '#ff69b4',
        desc: 'Exotic beauty'
    },
    orchid: {
        name: 'Orchid',
        emoji: '💜',
        color: '#da70d6',
        desc: 'Sophisticated'
    }
};

const vaseData = {
    classic: {
        name: 'Kraft & Twine',
        color: '#c9a45a',
        desc: 'Rustic natural twine',
        shape: 'classic'
    },
    modern: {
        name: 'Black Ribbon',
        color: '#2b2b2b',
        desc: 'Sleek & modern',
        shape: 'modern'
    },
    rustic: {
        name: 'Burgundy Satin',
        color: '#7a1f2b',
        desc: 'Rich romantic',
        shape: 'rustic'
    },
    crystal: {
        name: 'Lavender Silk',
        color: '#b39ddb',
        desc: 'Soft & elegant',
        shape: 'crystal'
    },
    vintage: {
        name: 'Blush Pink',
        color: '#e7a3b5',
        desc: 'Sweet & vintage',
        shape: 'vintage'
    },
    contemporary: {
        name: 'Sage Green',
        color: '#8aa67a',
        desc: 'Earthy & fresh',
        shape: 'contemporary'
    }
};

const arrangementData = {
    spiral: {
        name: 'Spiral',
        desc: 'Flowing pattern'
    },
    clustered: {
        name: 'Clustered',
        desc: 'Densely packed'
    },
    tiered: {
        name: 'Tiered',
        desc: 'Layered heights'
    },
    asymmetrical: {
        name: 'Asymmetrical',
        desc: 'Artistic design'
    },
    dome: {
        name: 'Rounded Dome',
        desc: 'Full appearance'
    }
};

/* ======================== */
/* PAGE NAVIGATION */
/* ======================== */

function goToPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(pageName);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    // Play sound
    playClickSound();
}

/* ======================== */
/* FLOWER SELECTION */
/* ======================== */

document.addEventListener('DOMContentLoaded', function() {
    // Flower selection
    document.querySelectorAll('.flower-card').forEach(card => {
        card.addEventListener('click', selectFlower);
    });

    // Vase selection
    document.querySelectorAll('.vase-card').forEach(card => {
        card.addEventListener('click', selectVase);
    });

    // Arrangement selection
    document.querySelectorAll('.arrangement-card').forEach(card => {
        card.addEventListener('click', selectArrangement);
    });

    // Check for shared bouquet on load
    checkForSharedBouquet();
});

function selectFlower(event) {
    const flowerName = event.currentTarget.getAttribute('data-flower');
    const card = event.currentTarget;

    // Toggle selection
    if (appState.selectedFlowers.includes(flowerName)) {
        // Remove flower
        appState.selectedFlowers = appState.selectedFlowers.filter(f => f !== flowerName);
        card.classList.remove('selected');
    } else {
        // Add flower
        appState.selectedFlowers.push(flowerName);
        card.classList.add('selected');
    }

    // Play sound
    playClickSound();

    // Update continue button visibility
    updateFlowerPageButtons();
}

function updateFlowerPageButtons() {
    const continueBtn = document.getElementById('continueFromFlowerBtn');
    if (continueBtn) {
        if (appState.selectedFlowers.length > 0) {
            continueBtn.style.display = 'block';
        } else {
            continueBtn.style.display = 'none';
        }
    }
}

function continueFromFlowerPage() {
    if (appState.selectedFlowers.length > 0) {
        playClickSound();
        setTimeout(() => {
            goToPage('vasePage');
        }, 300);
    }
}

/* ======================== */
/* VASE SELECTION */
/* ======================== */

function selectVase(event) {
    // Remove previous selection
    document.querySelectorAll('.vase-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selection to clicked card
    event.currentTarget.classList.add('selected');

    // Get vase name
    const vaseName = event.currentTarget.getAttribute('data-vase');
    appState.selectedVase = vaseName;

    // Play sound
    playClickSound();

    // Go to arrangement selection page
    setTimeout(() => {
        goToPage('arrangementPage');
    }, 300);
}

/* ======================== */
/* ARRANGEMENT SELECTION */
/* ======================== */

function selectArrangement(event) {
    // Remove previous selection
    document.querySelectorAll('.arrangement-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selection to clicked card
    event.currentTarget.classList.add('selected');

    // Get arrangement name
    const arrangementName = event.currentTarget.getAttribute('data-arrangement');
    appState.selectedArrangement = arrangementName;

    // Play sound
    playClickSound();

    // Go to editor page
    setTimeout(() => {
        goToPage('editorPage');
        initializeEditor();
    }, 300);
}

/* ======================== */
/* SOUND EFFECT */
/* ======================== */

function playClickSound() {
    const audioElement = document.getElementById('clickSound');
    if (audioElement) {
        try {
            audioElement.currentTime = 0;
            audioElement.play().catch(() => {
                // Fallback: Create a simple beep using Web Audio API
                createBeepSound();
            });
        } catch (e) {
            // Ignore errors
        }
    }
}

function createBeepSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Ignore if Web Audio API is not available
    }
}

/* ======================== */
/* SHARED BOUQUET HANDLING */
/* ======================== */

function checkForSharedBouquet() {
    const urlParams = new URLSearchParams(window.location.search);
    const bouquetData = urlParams.get('bouquet');

    if (bouquetData) {
        try {
            const data = JSON.parse(decodeURIComponent(bouquetData));
            appState.selectedFlowers = data.flowers || (data.flower ? [data.flower] : []);
            appState.selectedVase = data.vase;
            appState.selectedArrangement = data.arrangement;
            appState.bouquetTitle = data.title;
            appState.bouquetMessage = data.message;
            appState.bouquetSignature = data.signature;
            if (typeof data.flowerCount === 'number') appState.flowerCount = data.flowerCount;

            // Navigate directly to editor
            goToPage('editorPage');
            setTimeout(initializeEditor, 500);
        } catch (e) {
            console.error('Error loading shared bouquet:', e);
        }
    }
}

/* ======================== */
/* LOCAL STORAGE */
/* ======================== */

function saveDraft() {
    const draft = {
        flowers: appState.selectedFlowers,
        vase: appState.selectedVase,
        arrangement: appState.selectedArrangement,
        title: appState.bouquetTitle,
        message: appState.bouquetMessage,
        signature: appState.bouquetSignature,
        flowerCount: appState.flowerCount
    };
    localStorage.setItem('bouquetDraft', JSON.stringify(draft));
}

function loadDraft() {
    const draft = localStorage.getItem('bouquetDraft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            appState.selectedFlowers = data.flowers || (data.flower ? [data.flower] : []);
            appState.selectedVase = data.vase;
            appState.selectedArrangement = data.arrangement;
            appState.bouquetTitle = data.title;
            appState.bouquetMessage = data.message;
            appState.bouquetSignature = data.signature;
            if (typeof data.flowerCount === 'number') appState.flowerCount = data.flowerCount;
        } catch (e) {
            console.error('Error loading draft:', e);
        }
    }
}
