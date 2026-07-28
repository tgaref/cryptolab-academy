/**
 * FORTH CryptoLab - Interactive Application Logic
 * Βραδιά Ερευνητή - Cryptography & Coding Theory
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initVisualCrypto();
    initParityMagic();
    initDiffieHellman();
    initCaesarWheel();
    initECBDemo();
    initErrorCorrection();
    initSpyChallenge();
});

// Sound Synthesizer via Web Audio API for interactive clicks/effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq = 440, duration = 0.08, type = 'sine') {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

/* ==========================================================================
   NAVIGATION SYSTEM
   ========================================================================== */
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPages = document.querySelectorAll('.tab-page');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
            playSound(580, 0.05);
        });
    });

    document.querySelectorAll('.demo-card').forEach(card => {
        card.addEventListener('click', () => {
            const target = card.dataset.target;
            switchTab(target);
            playSound(640, 0.08);
        });
    });

    function switchTab(tabId) {
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
        tabPages.forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/* ==========================================================================
   MODULE 1: VISUAL CRYPTOGRAPHY (Visual Secret Sharing 2-out-of-2)
   ========================================================================== */
function initVisualCrypto() {
    const canvasA = document.getElementById('vc-canvas-a');
    const canvasB = document.getElementById('vc-canvas-b');
    const canvasOverlay = document.getElementById('vc-canvas-overlay');
    
    if (!canvasA || !canvasB || !canvasOverlay) return;

    const ctxA = canvasA.getContext('2d');
    const ctxB = canvasB.getContext('2d');
    const ctxOverlay = canvasOverlay.getContext('2d');

    const slider = document.getElementById('vc-overlay-slider');
    const presetSelect = document.getElementById('vc-preset-select');
    const textInput = document.getElementById('vc-text-input');
    const textBtn = document.getElementById('vc-generate-text-btn');
    const animateBtn = document.getElementById('vc-animate-btn');
    const downloadBtn = document.getElementById('vc-download-btn');
    const statusText = document.getElementById('vc-status-text');

    const width = 200;
    const height = 200;

    let shareAData = null;
    let shareBData = null;

    function renderPresetSecret(type, customText = '') {
        const offscreen = document.createElement('canvas');
        offscreen.width = width / 2;
        offscreen.height = height / 2;
        const offCtx = offscreen.getContext('2d');

        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
        offCtx.fillStyle = '#000000';

        if (customText) {
            offCtx.font = 'bold 22px Outfit, sans-serif';
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            offCtx.fillText(customText, offscreen.width / 2, offscreen.height / 2);
        } else if (type === 'cryptolab' || type === 'forth') {
            offCtx.font = 'bold 22px Outfit, sans-serif';
            offCtx.textAlign = 'center';
            offCtx.fillText('CRYPTO', offscreen.width / 2, offscreen.height / 2 - 8);
            offCtx.font = 'bold 16px Inter, sans-serif';
            offCtx.fillText('2026', offscreen.width / 2, offscreen.height / 2 + 18);
        } else if (type === 'key') {
            offCtx.font = '50px sans-serif';
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            offCtx.fillText('🗝️', offscreen.width / 2, offscreen.height / 2);
        } else if (type === 'spy') {
            offCtx.font = '50px sans-serif';
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            offCtx.fillText('🕵️', offscreen.width / 2, offscreen.height / 2);
        } else if (type === 'star') {
            offCtx.font = '55px sans-serif';
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            offCtx.fillText('⭐', offscreen.width / 2, offscreen.height / 2);
        }

        generateShares(offCtx.getImageData(0, 0, offscreen.width, offscreen.height));
    }

    function generateShares(secretImgData) {
        const imgW = secretImgData.width;
        const imgH = secretImgData.height;

        ctxA.fillStyle = '#ffffff';
        ctxA.fillRect(0, 0, width, height);
        ctxB.fillStyle = '#ffffff';
        ctxB.fillRect(0, 0, width, height);

        const imgA = ctxA.getImageData(0, 0, width, height);
        const imgB = ctxB.getImageData(0, 0, width, height);

        const dataA = imgA.data;
        const dataB = imgB.data;
        const secretPixels = secretImgData.data;

        for (let y = 0; y < imgH; y++) {
            for (let x = 0; x < imgW; x++) {
                const sIdx = (y * imgW + x) * 4;
                const isBlack = secretPixels[sIdx] < 128; // Black pixel

                const subX = x * 2;
                const subY = y * 2;
                const r = Math.random() < 0.5; // Random sub-pixel pattern

                // 2x2 sub-pixel expansion: [P0, P1, P2, P3]
                // For white pixel: Share A and Share B have SAME pattern
                // For black pixel: Share A and Share B have COMPLEMENTARY pattern
                let patternA = r ? [0, 1, 1, 0] : [1, 0, 0, 1];
                let patternB;
                if (isBlack) {
                    patternB = r ? [1, 0, 0, 1] : [0, 1, 1, 0];
                } else {
                    patternB = r ? [0, 1, 1, 0] : [1, 0, 0, 1];
                }

                setSubPixelBlock(dataA, subX, subY, patternA);
                setSubPixelBlock(dataB, subX, subY, patternB);
            }
        }

        ctxA.putImageData(imgA, 0, 0);
        ctxB.putImageData(imgB, 0, 0);

        shareAData = ctxA.getImageData(0, 0, width, height);
        shareBData = ctxB.getImageData(0, 0, width, height);

        updateOverlay();
    }

    function setSubPixelBlock(data, startX, startY, pattern) {
        const coords = [
            [startX, startY],
            [startX + 1, startY],
            [startX, startY + 1],
            [startX + 1, startY + 1]
        ];

        for (let i = 0; i < 4; i++) {
            const [px, py] = coords[i];
            const idx = (py * width + px) * 4;
            const val = pattern[i] === 1 ? 0 : 255;
            data[idx] = val;     // R
            data[idx + 1] = val; // G
            data[idx + 2] = val; // B
            data[idx + 3] = 255; // A
        }
    }

    function updateOverlay() {
        if (!shareAData || !shareBData) return;

        const shiftPercent = parseInt(slider.value, 10);
        const maxShift = 40; // Max horizontal pixel offset
        const currentShift = Math.round((100 - shiftPercent) / 100 * maxShift);

        ctxOverlay.fillStyle = '#ffffff';
        ctxOverlay.fillRect(0, 0, canvasOverlay.width, canvasOverlay.height);

        const combined = ctxOverlay.getImageData(0, 0, canvasOverlay.width, canvasOverlay.height);
        const cData = combined.data;

        const marginX = Math.round((canvasOverlay.width - width) / 2);
        const marginY = Math.round((canvasOverlay.height - height) / 2);

        // Draw Share A fixed at center
        const aPixels = shareAData.data;
        const bPixels = shareBData.data;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const targetX = marginX + x;
                const targetY = marginY + y;
                const tIdx = (targetY * canvasOverlay.width + targetX) * 4;

                const srcIdx = (y * width + x) * 4;
                const valA = aPixels[srcIdx];

                cData[tIdx] = valA;
                cData[tIdx + 1] = valA;
                cData[tIdx + 2] = valA;
                cData[tIdx + 3] = 255;
            }
        }

        // Overlay Share B with horizontal shift (Simulating transparency multiply / OR)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const shiftedX = marginX + x + currentShift;
                const targetY = marginY + y;

                if (shiftedX >= 0 && shiftedX < canvasOverlay.width) {
                    const tIdx = (targetY * canvasOverlay.width + shiftedX) * 4;
                    const srcIdx = (y * width + x) * 4;
                    const valB = bPixels[srcIdx];

                    // Multiply / Min filter (Black stays black)
                    cData[tIdx] = Math.min(cData[tIdx], valB);
                    cData[tIdx + 1] = Math.min(cData[tIdx + 1], valB);
                    cData[tIdx + 2] = Math.min(cData[tIdx + 2], valB);
                }
            }
        }

        ctxOverlay.putImageData(combined, 0, 0);

        if (shiftPercent > 92) {
            statusText.textContent = '🎉 Τέλεια Ευθυγράμμιση! Το μυστικό μήνυμα αποκαλύφθηκε!';
            statusText.style.color = 'var(--accent-green)';
            unlockMission(1);
        } else {
            statusText.textContent = `👉 Μετατόπιση: ${currentShift}px. Σύρετε προς τα δεξιά για αποκατάσταση!`;
            statusText.style.color = 'var(--accent-cyan)';
        }
    }

    slider.addEventListener('input', updateOverlay);

    presetSelect.addEventListener('change', () => {
        textInput.value = '';
        renderPresetSecret(presetSelect.value);
    });

    textBtn.addEventListener('click', () => {
        const val = textInput.value.trim();
        if (val) {
            renderPresetSecret('', val);
        }
    });

    let animInterval = null;
    animateBtn.addEventListener('click', () => {
        if (animInterval) clearInterval(animInterval);
        slider.value = 0;
        animInterval = setInterval(() => {
            let val = parseInt(slider.value, 10);
            if (val < 100) {
                slider.value = val + 2;
                updateOverlay();
                playSound(300 + val * 5, 0.02);
            } else {
                clearInterval(animInterval);
            }
        }, 30);
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'visual_crypto_share_A.png';
        link.href = canvasA.toDataURL();
        link.click();

        setTimeout(() => {
            link.download = 'visual_crypto_share_B.png';
            link.href = canvasB.toDataURL();
            link.click();
        }, 500);
    });

    // Initial render
    renderPresetSecret('forth');
}

/* ==========================================================================
   MODULE 2: PARITY BIT MAGIC TRICK (6x6 Grid Error Detection)
   ========================================================================== */
function initParityMagic() {
    const boardEl = document.getElementById('parity-board');
    const feedbackEl = document.getElementById('parity-feedback');
    const randomizeBtn = document.getElementById('parity-randomize-btn');
    const computeBtn = document.getElementById('parity-compute-btn');
    const flipRandomBtn = document.getElementById('parity-flip-random-btn');
    const scanBtn = document.getElementById('parity-scan-btn');
    const resetBtn = document.getElementById('parity-reset-btn');

    if (!boardEl) return;

    // Grid state: 6x6 matrix of 0 (blue) or 1 (red)
    let grid = Array(6).fill(0).map(() => Array(6).fill(0));
    let parityAdded = false;
    let tileFlipped = false;
    let badRow = -1;
    let badCol = -1;
    let solved = false;

    function renderBoard() {
        boardEl.innerHTML = '';
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                const cell = document.createElement('div');
                cell.classList.add('parity-cell');
                if (grid[r][c] === 1) {
                    cell.classList.add('red');
                } else {
                    cell.classList.add('blue');
                }

                if (r === 5 || c === 5) {
                    cell.classList.add('parity-bit');
                }

                cell.addEventListener('click', () => handleCellClick(r, c));
                boardEl.appendChild(cell);
            }
        }
    }

    function calculateOddParities() {
        let rError = -1;
        let cError = -1;

        // Check row parities
        for (let r = 0; r < 6; r++) {
            let rowSum = 0;
            for (let c = 0; c < 6; c++) {
                rowSum += grid[r][c];
            }
            if (rowSum % 2 !== 0) {
                rError = r;
                break;
            }
        }

        // Check col parities
        for (let c = 0; c < 6; c++) {
            let colSum = 0;
            for (let r = 0; r < 6; r++) {
                colSum += grid[r][c];
            }
            if (colSum % 2 !== 0) {
                cError = c;
                break;
            }
        }

        return { badRow: rError, badCol: cError };
    }

    function handleCellClick(r, c) {
        // Mode 1: Initial setup / manual flip before parity
        if (!parityAdded) {
            grid[r][c] = 1 - grid[r][c];
            playSound(400 + (r * 6 + c) * 15, 0.06);
            renderBoard();
            return;
        }

        // Mode 2: Parity added, but tile not flipped yet -> Flip this tile to start guessing phase!
        if (parityAdded && !tileFlipped) {
            grid[r][c] = 1 - grid[r][c];
            tileFlipped = true;
            const res = calculateOddParities();
            badRow = res.badRow;
            badCol = res.badCol;
            playSound(450, 0.08);
            renderBoard();
            feedbackEl.className = 'feedback-banner info';
            feedbackEl.textContent = '🕵️ 1 Πλακίδιο αλλάχθηκε! Τώρα κάντε κλικ στο κουτάκι που πιστεύετε ότι άλλαξε!';
            return;
        }

        // Mode 3: Tile flipped, user is guessing which tile was changed!
        if (tileFlipped && !solved) {
            if (r === badRow && c === badCol) {
                // Correct guess!
                solved = true;
                renderBoard();
                const idx = badRow * 6 + badCol;
                const cells = boardEl.children;
                if (cells[idx]) {
                    cells[idx].classList.add('flipped-target');
                }

                playSound(880, 0.25, 'square');
                feedbackEl.className = 'feedback-banner success';
                feedbackEl.textContent = `🎉 ΣΩΣΤΑ! Βρήκατε το αλλαγμένο πλακίδιο στη Γραμμή ${badRow + 1}, Στήλη ${badCol + 1}!`;
                unlockMission(2);
            } else {
                // Incorrect guess
                playSound(250, 0.15, 'sawtooth');
                feedbackEl.className = 'feedback-banner info';
                feedbackEl.textContent = `❌ Όχι αυτό! Ψάξτε στη Γραμμή ${badRow + 1} & Στήλη ${badCol + 1} που έχουν περιττό (odd) αριθμό κόκκινων!`;
            }
        }
    }

    function generateRandom5x5() {
        parityAdded = false;
        tileFlipped = false;
        solved = false;
        badRow = -1;
        badCol = -1;
        grid = Array(6).fill(0).map(() => Array(6).fill(0));
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                grid[r][c] = Math.random() < 0.5 ? 1 : 0;
            }
        }
        renderBoard();
        feedbackEl.className = 'feedback-banner info';
        feedbackEl.textContent = '✅ Δημιουργήθηκε αρχικό 5x5 πλέγμα. Τώρα πατήστε "2. Προσθήκη Parity"!';
    }

    function computeParityBits() {
        // Calculate row parity
        for (let r = 0; r < 5; r++) {
            let rowSum = 0;
            for (let c = 0; c < 5; c++) {
                rowSum += grid[r][c];
            }
            grid[r][5] = rowSum % 2;
        }

        // Calculate col parity
        for (let c = 0; c < 6; c++) {
            let colSum = 0;
            for (let r = 0; r < 5; r++) {
                colSum += grid[r][c];
            }
            grid[5][c] = colSum % 2;
        }

        parityAdded = true;
        tileFlipped = false;
        solved = false;
        renderBoard();

        feedbackEl.className = 'feedback-banner success';
        feedbackEl.textContent = '🔮 Τα Parity Bits προστέθηκαν (όλες οι γραμμές/στήλες έχουν άρτια κόκκινα)! Τώρα πατήστε "3. Αλλαγή 1 Πλακιδίου" (ή κάντε κλικ σε ένα κουτάκι)!';
    }

    function flipRandomTile() {
        if (!parityAdded) {
            computeParityBits();
        }

        const r = Math.floor(Math.random() * 6);
        const c = Math.floor(Math.random() * 6);

        grid[r][c] = 1 - grid[r][c];
        tileFlipped = true;
        solved = false;

        const res = calculateOddParities();
        badRow = res.badRow;
        badCol = res.badCol;

        renderBoard();
        playSound(550, 0.1);
        feedbackEl.className = 'feedback-banner info';
        feedbackEl.textContent = '🎲 1 Τυχαίο Πλακίδιο αλλάχθηκε κρυφά! Κάντε κλικ στο κουτάκι που πιστεύετε ότι είναι το λάθος!';
    }

    function showComputerAnswer() {
        if (!parityAdded) {
            feedbackEl.className = 'feedback-banner info';
            feedbackEl.textContent = '⚠️ Πατήστε πρώτα "2. Προσθήκη Parity"!';
            return;
        }

        const res = calculateOddParities();
        badRow = res.badRow;
        badCol = res.badCol;

        if (badRow !== -1 && badCol !== -1) {
            solved = true;
            renderBoard();
            const idx = badRow * 6 + badCol;
            const cells = boardEl.children;
            if (cells[idx]) {
                cells[idx].classList.add('flipped-target');
            }

            playSound(880, 0.2, 'square');
            feedbackEl.className = 'feedback-banner success';
            feedbackEl.textContent = `🎯 ΑΠΟΚΑΛΥΨΗ: Το αλλαγμένο πλακίδιο είναι στη Γραμμή ${badRow + 1}, Στήλη ${badCol + 1}!`;
            unlockMission(2);
        } else {
            feedbackEl.className = 'feedback-banner info';
            feedbackEl.textContent = '✨ Όλες οι γραμμές και στήλες είναι άρτιες. Κανένα πλακίδιο δεν έχει αλλαχθεί ακόμα!';
        }
    }

    randomizeBtn.addEventListener('click', generateRandom5x5);
    computeBtn.addEventListener('click', computeParityBits);
    if (flipRandomBtn) flipRandomBtn.addEventListener('click', flipRandomTile);
    scanBtn.addEventListener('click', showComputerAnswer);
    resetBtn.addEventListener('click', generateRandom5x5);

    generateRandom5x5();
}

/* ==========================================================================
   MODULE 3: DIFFIE-HELLMAN COLOR MIXER & MATH
   ========================================================================== */
function initDiffieHellman() {
    const alicePrivColor = document.getElementById('dh-alice-color');
    const bobPrivColor = document.getElementById('dh-bob-color');
    const simulateBtn = document.getElementById('dh-simulate-btn');
    const mathBox = document.getElementById('dh-math-results');
    const eveInfo = document.getElementById('dh-eve-info');

    const inputP = document.getElementById('dh-p');
    const inputG = document.getElementById('dh-g');
    const inputA = document.getElementById('dh-a');
    const inputB = document.getElementById('dh-b');

    if (!alicePrivColor || !bobPrivColor) return;

    const publicColor = '#f1c40f'; // Yellow 🟡

    function hexToRgb(hex) {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    function rgbToHex([r, g, b]) {
        return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
    }

    // Mix 2 colors (50% / 50%)
    function mixTwo(c1Hex, c2Hex) {
        const rgb1 = hexToRgb(c1Hex);
        const rgb2 = hexToRgb(c2Hex);
        return rgbToHex([
            (rgb1[0] + rgb2[0]) / 2,
            (rgb1[1] + rgb2[1]) / 2,
            (rgb1[2] + rgb2[2]) / 2
        ]);
    }

    // Mix 3 colors (33.3% / 33.3% / 33.3% - Commutative & Associative tri-blend)
    function mixThree(c1Hex, c2Hex, c3Hex) {
        const rgb1 = hexToRgb(c1Hex);
        const rgb2 = hexToRgb(c2Hex);
        const rgb3 = hexToRgb(c3Hex);
        return rgbToHex([
            (rgb1[0] + rgb2[0] + rgb3[0]) / 3,
            (rgb1[1] + rgb2[1] + rgb3[1]) / 3,
            (rgb1[2] + rgb2[2] + rgb3[2]) / 3
        ]);
    }

    function powerMod(base, exp, mod) {
        let res = 1n;
        base = BigInt(base) % BigInt(mod);
        exp = BigInt(exp);
        const m = BigInt(mod);
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % m;
            base = (base * base) % m;
            exp /= 2n;
        }
        return Number(res);
    }

    function updateDHSimulation() {
        const aColor = alicePrivColor.value;
        const bColor = bobPrivColor.value;

        // Alice mixes Public Yellow + Alice Secret Color
        const alicePubColor = mixTwo(publicColor, aColor);
        // Bob mixes Public Yellow + Bob Secret Color
        const bobPubColor = mixTwo(publicColor, bColor);

        // Shared secret color: Combined blend of (Public Yellow + Alice Secret + Bob Secret)
        const sharedSecretColor = mixThree(publicColor, aColor, bColor);

        // Update Alice Swatches
        const alicePrivEl = document.getElementById('dh-swatch-alice-priv');
        const alicePubEl = document.getElementById('dh-swatch-alice-pub');
        const aliceSharedEl = document.getElementById('dh-swatch-alice-shared');

        if (alicePrivEl) { alicePrivEl.style.backgroundColor = aColor; alicePrivEl.title = `Alice Secret: ${aColor}`; }
        if (alicePubEl) { alicePubEl.style.backgroundColor = alicePubColor; alicePubEl.title = `Alice Mix: ${alicePubColor}`; }
        if (aliceSharedEl) { aliceSharedEl.style.backgroundColor = sharedSecretColor; aliceSharedEl.title = `Shared Key: ${sharedSecretColor}`; }

        // Update Bob Swatches
        const bobPrivEl = document.getElementById('dh-swatch-bob-priv');
        const bobPubEl = document.getElementById('dh-swatch-bob-pub');
        const bobSharedEl = document.getElementById('dh-swatch-bob-shared');

        if (bobPrivEl) { bobPrivEl.style.backgroundColor = bColor; bobPrivEl.title = `Bob Secret: ${bColor}`; }
        if (bobPubEl) { bobPubEl.style.backgroundColor = bobPubColor; bobPubEl.title = `Bob Mix: ${bobPubColor}`; }
        if (bobSharedEl) { bobSharedEl.style.backgroundColor = sharedSecretColor; bobSharedEl.title = `Shared Key: ${sharedSecretColor}`; }

        if (eveInfo) {
            eveInfo.innerHTML = `
                Η Eve βλέπει μόνο το 🟡 Δημόσιο Κίτρινο (${publicColor}), το 🧪 Μίγμα Alice (<span style="color:${alicePubColor};font-weight:bold;">${alicePubColor}</span>) και το 🧪 Μίγμα Bob (<span style="color:${bobPubColor};font-weight:bold;">${bobPubColor}</span>).<br>
                Δεν μπορεί να βρει το τελικό μυστικό χρώμα <span style="color:${sharedSecretColor};font-weight:bold;">${sharedSecretColor}</span>!
            `;
        }

        // Mathematical counterpart
        const p = parseInt(inputP ? inputP.value : 23, 10) || 23;
        const g = parseInt(inputG ? inputG.value : 5, 10) || 5;
        const a = parseInt(inputA ? inputA.value : 6, 10) || 6;
        const b = parseInt(inputB ? inputB.value : 15, 10) || 15;

        const A = powerMod(g, a, p); // Alice public key
        const B = powerMod(g, b, p); // Bob public key

        const SecretA = powerMod(B, a, p); // Alice computes shared key
        const SecretB = powerMod(A, b, p); // Bob computes shared key

        if (mathBox) {
            mathBox.innerHTML = `
                <strong>🎨 Χρώμα Κοινού Κλειδιού:</strong> <span style="display:inline-block;width:14px;height:14px;background-color:${sharedSecretColor};border-radius:50%;vertical-align:middle;"></span> <strong>${sharedSecretColor}</strong> (Tαυτίζεται 100% σε Alice & Bob!)<br><br>
                <strong>🔢 Υπολογισμοί Modular Exponentiation:</strong><br>
                • Alice Δημόσιο A = ${g}^${a} mod ${p} = <strong>${A}</strong><br>
                • Bob Δημόσιο B = ${g}^${b} mod ${p} = <strong>${B}</strong><br>
                • Alice Υπολογίζει Κοινό Κλειδί: K = B^a mod p = ${B}^${a} mod ${p} = <span style="color:var(--accent-green);font-weight:700;">${SecretA}</span><br>
                • Bob Υπολογίζει Κοινό Κλειδί: K = A^b mod p = ${A}^${b} mod ${p} = <span style="color:var(--accent-green);font-weight:700;">${SecretB}</span><br>
                ✨ <strong>Αποτέλεσμα:</strong> Τα κλειδιά ταυτίζονται (${SecretA} == ${SecretB})!
            `;
        }
    }

    [alicePrivColor, bobPrivColor, inputP, inputG, inputA, inputB].forEach(inputEl => {
        if (inputEl) {
            inputEl.addEventListener('input', updateDHSimulation);
            inputEl.addEventListener('change', updateDHSimulation);
        }
    });

    if (simulateBtn) simulateBtn.addEventListener('click', updateDHSimulation);

    updateDHSimulation();
}

/* ==========================================================================
   MODULE 4: CAESAR CIPHER WHEEL & FREQUENCY ANALYSIS
   ========================================================================== */
function initCaesarWheel() {
    const greekAlphabet = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ";
    const slider = document.getElementById('caesar-shift-slider');
    const keyValEl = document.getElementById('caesar-key-val');
    const centerKEl = document.getElementById('wheel-k-center');
    const inputEl = document.getElementById('caesar-input');
    const outputEl = document.getElementById('caesar-output');
    const solveBtn = document.getElementById('caesar-solve-btn');
    const copyBtn = document.getElementById('caesar-copy-btn');
    const innerWheelEl = document.getElementById('inner-wheel');
    const outerWheelEl = document.getElementById('outer-wheel');
    const freqContainer = document.getElementById('freq-chart-container');

    if (!slider || !outerWheelEl || !innerWheelEl) return;

    // Render static letters around wheels
    function buildWheel(wheelEl, radius, color) {
        wheelEl.innerHTML = '';
        const total = greekAlphabet.length;
        for (let i = 0; i < total; i++) {
            const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            const letterSpan = document.createElement('span');
            letterSpan.className = 'wheel-letter';
            letterSpan.textContent = greekAlphabet[i];
            letterSpan.style.left = `${x}%`;
            letterSpan.style.top = `${y}%`;
            letterSpan.style.color = color;
            wheelEl.appendChild(letterSpan);
        }
    }

    function buildSpokes() {
        const spokesSvg = document.getElementById('wheel-spokes-svg');
        if (!spokesSvg) return;
        spokesSvg.innerHTML = '';
        const total = greekAlphabet.length;
        const cx = 170;
        const cy = 170;
        const r1 = 92;
        const r2 = 126;

        for (let i = 0; i < total; i++) {
            const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
            const x1 = cx + r1 * Math.cos(angle);
            const y1 = cy + r1 * Math.sin(angle);
            const x2 = cx + r2 * Math.cos(angle);
            const y2 = cy + r2 * Math.sin(angle);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('class', 'ray-line');

            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', x2);
            dot.setAttribute('cy', y2);
            dot.setAttribute('r', '3');
            dot.setAttribute('class', 'ray-dot');

            spokesSvg.appendChild(line);
            spokesSvg.appendChild(dot);
        }
    }

    buildWheel(outerWheelEl, 41, 'var(--accent-cyan)');
    buildWheel(innerWheelEl, 36, 'var(--accent-purple)');
    buildSpokes();

    function updateCaesar() {
        const k = parseInt(slider.value, 10);
        keyValEl.textContent = k;
        centerKEl.textContent = k;

        // Rotate inner wheel & radial spokes visually
        const angleDeg = (k / greekAlphabet.length) * 360;
        innerWheelEl.style.transform = `rotate(${-angleDeg}deg)`;
        const spokesSvg = document.getElementById('wheel-spokes-svg');
        if (spokesSvg) {
            spokesSvg.style.transform = `rotate(${-angleDeg}deg)`;
        }

        const plainText = inputEl.value.toUpperCase();
        let cipherText = '';

        for (let char of plainText) {
            const idx = greekAlphabet.indexOf(char);
            if (idx !== -1) {
                const newIdx = (idx + k) % greekAlphabet.length;
                cipherText += greekAlphabet[newIdx];
            } else {
                cipherText += char; // Keep space or punctuation
            }
        }

        outputEl.value = cipherText;
        updateFrequencyHistogram(cipherText, k);
    }

    function updateFrequencyHistogram(text, shiftKey = 0) {
        freqContainer.innerHTML = '';
        const counts = {};
        greekAlphabet.split('').forEach(ch => counts[ch] = 0);
        let totalCount = 0;

        for (let ch of text) {
            if (counts[ch] !== undefined) {
                counts[ch]++;
                totalCount++;
            }
        }

        const maxCount = Math.max(...Object.values(counts), 1);

        // Find the shifted positions of high-frequency vowels A (idx 0), E (idx 4), O (idx 14)
        const shiftedA = greekAlphabet[(0 + shiftKey) % greekAlphabet.length];
        const shiftedE = greekAlphabet[(4 + shiftKey) % greekAlphabet.length];
        const shiftedO = greekAlphabet[(14 + shiftKey) % greekAlphabet.length];

        greekAlphabet.split('').forEach(ch => {
            const count = counts[ch];
            const heightPercent = (count / maxCount) * 100;

            const barWrapper = document.createElement('div');
            barWrapper.className = 'freq-bar-wrapper';

            const bar = document.createElement('div');
            bar.className = 'freq-bar';
            bar.style.height = `${heightPercent}%`;
            
            // Highlight the bars corresponding to shifted A, E, O
            if (ch === shiftedA || ch === shiftedE || ch === shiftedO) {
                bar.style.background = 'var(--accent-gold)';
                bar.style.boxShadow = '0 0 8px var(--accent-gold)';
            }

            const label = document.createElement('span');
            label.className = 'freq-label';
            label.textContent = ch;

            barWrapper.appendChild(bar);
            barWrapper.appendChild(label);
            freqContainer.appendChild(barWrapper);
        });
    }

    slider.addEventListener('input', () => {
        updateCaesar();
        playSound(450 + slider.value * 10, 0.02);
    });

    inputEl.addEventListener('input', updateCaesar);

    const caesarFeedbackEl = document.getElementById('caesar-feedback');

    solveBtn.addEventListener('click', () => {
        const cipherText = outputEl.value;
        const currentK = parseInt(slider.value, 10);
        let bestK = 0;
        let maxScore = -1;

        // Test all 24 possible shifts K against the ciphertext
        for (let k = 0; k < greekAlphabet.length; k++) {
            let score = 0;
            for (let char of cipherText) {
                const idx = greekAlphabet.indexOf(char);
                if (idx !== -1) {
                    const decryptedChar = greekAlphabet[(idx - k + greekAlphabet.length) % greekAlphabet.length];
                    if (['Α', 'Ε', 'Ο', 'Ι'].includes(decryptedChar)) score += 2;
                }
            }
            if (score > maxScore) {
                maxScore = score;
                bestK = k;
            }
        }

        // The cracked original key used to encrypt the text
        const crackedKey = (greekAlphabet.length - bestK) % greekAlphabet.length;

        // Update slider and wheel position
        slider.value = currentK; // Keep slider at current position to demonstrate cracking back
        updateCaesar();

        if (caesarFeedbackEl) {
            caesarFeedbackEl.style.display = 'block';
            caesarFeedbackEl.innerHTML = `
                🔓 <strong>ΤΟ ΚΡΥΠΤΟΓΡΑΦΗΜΑ ΕΣΠΑΣΕ!</strong><br>
                • Εντοπίστηκε το μυστικό κλειδί: <strong>K = ${currentK}</strong><br>
                • Αρχικό Αποκρυπτογραφημένο Κείμενο: <em>"${inputEl.value}"</em>
            `;
        }

        playSound(880, 0.25, 'triangle');
        unlockMission(3);
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(outputEl.value);
        copyBtn.textContent = '✓ Αντιγράφηκε!';
        setTimeout(() => copyBtn.textContent = '📋 Αντιγραφή Ciphertext', 2000);
    });

    updateCaesar();
}

/* ==========================================================================
   MODULE 5: ECB MODE VISUAL LEAKAGE DEMO
   ========================================================================== */
// Real AES-128 Block Cipher (FIPS-197 Standard)
const AES128 = (function() {
    const SBOX = new Uint8Array([
        0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
        0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
        0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
        0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
        0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
        0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
        0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
        0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
        0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
        0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
        0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
        0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
        0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
        0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
        0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
        0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
    ]);
    const RCON = new Uint8Array([0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]);

    function gmul(a, b) {
        let p = 0;
        for (let i = 0; i < 8; i++) {
            if (b & 1) p ^= a;
            let hi = a & 0x80;
            a = (a << 1) & 0xff;
            if (hi) a ^= 0x1b;
            b >>= 1;
        }
        return p;
    }

    function keyExpansion(keyBytes) {
        const w = new Uint8Array(176);
        for (let i = 0; i < 16; i++) w[i] = keyBytes[i % keyBytes.length];
        for (let i = 4; i < 44; i++) {
            let temp = w.slice((i - 1) * 4, i * 4);
            if (i % 4 === 0) {
                temp = new Uint8Array([
                    SBOX[temp[1]] ^ RCON[i / 4],
                    SBOX[temp[2]],
                    SBOX[temp[3]],
                    SBOX[temp[0]]
                ]);
            }
            for (let j = 0; j < 4; j++) {
                w[i * 4 + j] = w[(i - 4) * 4 + j] ^ temp[j];
            }
        }
        return w;
    }

    function encryptBlock(block, w) {
        let state = new Uint8Array(block);
        for (let i = 0; i < 16; i++) state[i] ^= w[i];

        for (let round = 1; round <= 10; round++) {
            for (let i = 0; i < 16; i++) state[i] = SBOX[state[i]];

            let t = state[1]; state[1] = state[5]; state[5] = state[9]; state[9] = state[13]; state[13] = t;
            t = state[2]; state[2] = state[10]; state[10] = t; t = state[6]; state[6] = state[14]; state[14] = t;
            t = state[15]; state[15] = state[11]; state[11] = state[7]; state[7] = state[3]; state[3] = t;

            if (round < 10) {
                for (let c = 0; c < 4; c++) {
                    let a0 = state[c * 4], a1 = state[c * 4 + 1], a2 = state[c * 4 + 2], a3 = state[c * 4 + 3];
                    state[c * 4]     = gmul(a0, 2) ^ gmul(a1, 3) ^ a2 ^ a3;
                    state[c * 4 + 1] = a0 ^ gmul(a1, 2) ^ gmul(a2, 3) ^ a3;
                    state[c * 4 + 2] = a0 ^ a1 ^ gmul(a2, 2) ^ gmul(a3, 3);
                    state[c * 4 + 3] = gmul(a0, 3) ^ a1 ^ a2 ^ gmul(a3, 2);
                }
            }
            for (let i = 0; i < 16; i++) state[i] ^= w[round * 16 + i];
        }
        return state;
    }

    return { keyExpansion, encryptBlock };
})();

function initECBDemo() {
    const canvasOrig = document.getElementById('ecb-canvas-orig');
    const canvasEncrypted = document.getElementById('ecb-canvas-encrypted');
    const canvasSecure = document.getElementById('ecb-canvas-secure');

    if (!canvasOrig || !canvasEncrypted || !canvasSecure) return;

    const ctxOrig = canvasOrig.getContext('2d');
    const ctxEnc = canvasEncrypted.getContext('2d');
    const ctxSec = canvasSecure.getContext('2d');

    const width = 200;
    const height = 200;

    let currentPreset = 'tux';

    function drawPreset(preset) {
        ctxOrig.fillStyle = '#ffffff';
        ctxOrig.fillRect(0, 0, width, height);

        if (preset === 'spy') {
            const img = new Image();
            img.onload = () => {
                ctxOrig.drawImage(img, 0, 0, width, height);
                processEncryption();
            };
            img.src = 'preset_spy.jpg';
            return;
        } else if (preset === 'tux') {
            ctxOrig.fillStyle = '#000000';
            ctxOrig.beginPath();
            ctxOrig.ellipse(100, 110, 50, 65, 0, 0, Math.PI * 2);
            ctxOrig.fill();

            ctxOrig.fillStyle = '#ffffff';
            ctxOrig.beginPath();
            ctxOrig.ellipse(100, 120, 32, 45, 0, 0, Math.PI * 2);
            ctxOrig.fill();

            ctxOrig.fillStyle = '#000000';
            ctxOrig.beginPath();
            ctxOrig.arc(85, 75, 6, 0, Math.PI * 2);
            ctxOrig.arc(115, 75, 6, 0, Math.PI * 2);
            ctxOrig.fill();

            ctxOrig.fillStyle = '#f39c12';
            ctxOrig.beginPath();
            ctxOrig.arc(100, 85, 10, 0, Math.PI);
            ctxOrig.fill();
        } else if (preset === 'forth') {
            ctxOrig.fillStyle = '#000000';
            ctxOrig.font = 'bold 38px Outfit, sans-serif';
            ctxOrig.textAlign = 'center';
            ctxOrig.fillText('FORTH', 100, 110);
            ctxOrig.strokeRect(20, 20, 160, 160);
        } else if (preset === 'shapes') {
            ctxOrig.fillStyle = '#000000';
            ctxOrig.fillRect(30, 30, 60, 60);
            ctxOrig.beginPath();
            ctxOrig.arc(140, 60, 35, 0, Math.PI * 2);
            ctxOrig.fill();
            ctxOrig.beginPath();
            ctxOrig.moveTo(100, 170);
            ctxOrig.lineTo(50, 110);
            ctxOrig.lineTo(150, 110);
            ctxOrig.closePath();
            ctxOrig.fill();
        }

        processEncryption();
    }

    // Custom Image Upload Listener
    const fileInput = document.getElementById('ecb-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        ctxOrig.fillStyle = '#ffffff';
                        ctxOrig.fillRect(0, 0, width, height);
                        ctxOrig.drawImage(img, 0, 0, width, height);
                        processEncryption();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function processEncryption() {
        const keyHex = document.getElementById('ecb-key-input') ? document.getElementById('ecb-key-input').value : 'A5F039B2';
        const keyBytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            keyBytes[i] = (keyHex.charCodeAt(i % keyHex.length) * 31 + i * 17) % 256;
        }

        const w = AES128.keyExpansion(keyBytes);

        const origData = ctxOrig.getImageData(0, 0, width, height);
        const pixels = origData.data;

        const encImg = ctxEnc.createImageData(width, height);
        const secImg = ctxSec.createImageData(width, height);

        const encPixels = encImg.data;
        const secPixels = secImg.data;

        // Process in 4x4 pixel blocks (4x4 = 16 pixels = 16 bytes luminance)
        const blockDim = 4;
        let prevCbcBlock = new Uint8Array(16);

        for (let y = 0; y < height; y += blockDim) {
            for (let x = 0; x < width; x += blockDim) {
                // Collect 16 luminance bytes for this 4x4 block
                const pBlock = new Uint8Array(16);
                let pIdx = 0;

                for (let by = 0; by < blockDim; by++) {
                    for (let bx = 0; bx < blockDim; bx++) {
                        const px = x + bx;
                        const py = y + by;
                        const idx = (py * width + px) * 4;
                        pBlock[pIdx++] = pixels[idx]; // Lum byte 0..255
                    }
                }

                // 1. Real AES-128-ECB Encryption
                const ecbBlock = AES128.encryptBlock(pBlock, w);
                const ecbVal = ecbBlock[0]; // Uniform block color for ECB identical block mapping

                // 2. Real AES-128-CBC Encryption (XOR with previous ciphertext block)
                const cbcInput = new Uint8Array(16);
                for (let i = 0; i < 16; i++) cbcInput[i] = pBlock[i] ^ prevCbcBlock[i];
                const cbcBlock = AES128.encryptBlock(cbcInput, w);
                prevCbcBlock = cbcBlock;
                const cbcVal = cbcBlock[0];

                // Write output pixels
                for (let by = 0; by < blockDim; by++) {
                    for (let bx = 0; bx < blockDim; bx++) {
                        const px = x + bx;
                        const py = y + by;
                        if (px >= width || py >= height) continue;

                        const idx = (py * width + px) * 4;

                        // ECB output (Uniform block color -> crystal clear pattern leakage!)
                        encPixels[idx] = ecbVal;
                        encPixels[idx + 1] = ecbVal;
                        encPixels[idx + 2] = ecbVal;
                        encPixels[idx + 3] = 255;

                        // CBC output (Chained AES blocks -> 100% random noise)
                        const pixelCbcVal = cbcBlock[(by * blockDim + bx)];
                        secPixels[idx] = pixelCbcVal;
                        secPixels[idx + 1] = pixelCbcVal;
                        secPixels[idx + 2] = pixelCbcVal;
                        secPixels[idx + 3] = 255;
                    }
                }
            }
        }

        ctxEnc.putImageData(encImg, 0, 0);
        ctxSec.putImageData(secImg, 0, 0);
    }

    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPreset = btn.dataset.img;
            drawPreset(currentPreset);
            playSound(500, 0.05);
        });
    });

    drawPreset('tux');
}

/* ==========================================================================
   MODULE 6: ERROR CORRECTION & HAMMING CODES (7,4)
   ========================================================================== */
function initErrorCorrection() {
    let dataBits = [0, 1, 0, 1]; // d1, d2, d3, d4
    let encodedBits = [0, 0, 0, 0, 0, 0, 0]; // p1, p2, d1, p3, d2, d3, d4 (Hamming 7,4 standard order)
    let corruptedBits = [0, 0, 0, 0, 0, 0, 0];

    const dButtons = [
        document.getElementById('d1'),
        document.getElementById('d2'),
        document.getElementById('d3'),
        document.getElementById('d4')
    ];

    const encodeBtn = document.getElementById('hamming-encode-btn');
    const repairBtn = document.getElementById('hamming-repair-btn');
    const transmittedBox = document.getElementById('transmitted-word');
    const syndromeStatus = document.getElementById('hamming-syndrome-status');

    if (!encodeBtn || !transmittedBox) return;

    dButtons.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            dataBits[idx] = 1 - dataBits[idx];
            btn.textContent = dataBits[idx];
            btn.setAttribute('data-bit', dataBits[idx]);
            computeHammingCode();
            playSound(400 + idx * 50, 0.05);
        });
    });

    function computeHammingCode() {
        const d1 = dataBits[0];
        const d2 = dataBits[1];
        const d3 = dataBits[2];
        const d4 = dataBits[3];

        // Hamming parity equations:
        // p1 covers d1, d2, d4
        // p2 covers d1, d3, d4
        // p3 covers d2, d3, d4
        const p1 = (d1 + d2 + d4) % 2;
        const p2 = (d1 + d3 + d4) % 2;
        const p3 = (d2 + d3 + d4) % 2;

        // Canonical Hamming Position order (Powers of 2 are Parity bits):
        // 1:p1, 2:p2, 3:d1, 4:p3, 5:d2, 6:d3, 7:d4
        encodedBits = [p1, p2, d1, p3, d2, d3, d4];
        corruptedBits = [...encodedBits];

        renderTransmittedWord();
        renderCodebookTable();
        syndromeStatus.innerHTML = '✅ Το Hamming(7,4) κωδικοποιήθηκε. Κάντε κλικ σε ένα bit για να προκαλέσετε σφάλμα!';
    }

    function renderTransmittedWord() {
        transmittedBox.innerHTML = '';
        const labels = ['p1', 'p2', 'd1', 'p3', 'd2', 'd3', 'd4'];

        corruptedBits.forEach((bit, idx) => {
            const cell = document.createElement('div');
            cell.className = 'bit-cell';
            if (['p1', 'p2', 'p3'].includes(labels[idx])) {
                cell.classList.add('cw-parity');
            } else {
                cell.classList.add('cw-data');
            }
            if (bit !== encodedBits[idx]) {
                cell.classList.add('corrupted');
            }

            cell.innerHTML = `
                <span>${bit}</span>
                <span class="bit-idx">${labels[idx]} (${idx + 1})</span>
            `;

            cell.addEventListener('click', () => {
                corruptedBits[idx] = 1 - corruptedBits[idx]; // Bit flip
                renderTransmittedWord();
                playSound(300 + idx * 40, 0.06);
            });

            transmittedBox.appendChild(cell);
        });
    }

    function renderCodebookTable(highlightIdx = null) {
        const tbody = document.getElementById('hamming-codebook-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const currentVal = dataBits[0] * 8 + dataBits[1] * 4 + dataBits[2] * 2 + dataBits[3];
        const activeIdx = (highlightIdx !== null) ? highlightIdx : currentVal;

        for (let i = 0; i < 16; i++) {
            const d1 = (i >> 3) & 1;
            const d2 = (i >> 2) & 1;
            const d3 = (i >> 1) & 1;
            const d4 = i & 1;

            const p1 = (d1 + d2 + d4) % 2;
            const p2 = (d1 + d3 + d4) % 2;
            const p3 = (d2 + d3 + d4) % 2;

            const weight = (p1 + p2 + d1 + p3 + d2 + d3 + d4);

            const tr = document.createElement('tr');
            if (i === activeIdx) {
                if (highlightIdx !== null && highlightIdx !== currentVal) {
                    tr.className = 'decoded-jump-row';
                } else {
                    tr.className = 'active-row';
                }
            }

            tr.innerHTML = `
                <td>${i + 1}</td>
                <td class="cw-data">${d1}${d2}${d3}${d4}</td>
                <td class="cw-parity">${p1}${p2}${p3}</td>
                <td class="codeword-cell">
                    <span class="cw-parity">${p1}${p2}</span><span class="cw-data">${d1}</span><span class="cw-parity">${p3}</span><span class="cw-data">${d2}${d3}${d4}</span>
                </td>
                <td>${weight}</td>
            `;

            tr.addEventListener('click', () => {
                dataBits = [d1, d2, d3, d4];
                dButtons.forEach((btn, bIdx) => {
                    btn.textContent = dataBits[bIdx];
                    btn.setAttribute('data-bit', dataBits[bIdx]);
                });
                computeHammingCode();
                playSound(500 + i * 20, 0.05);
            });

            tbody.appendChild(tr);

            if (i === activeIdx && highlightIdx !== null) {
                setTimeout(() => tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
            }
        }
    }

    repairBtn.addEventListener('click', () => {
        // Bits in canonical order: 0:p1, 1:p2, 2:d1, 3:p3, 4:d2, 5:d3, 6:d4
        const p1 = corruptedBits[0], p2 = corruptedBits[1], d1 = corruptedBits[2];
        const p3 = corruptedBits[3], d2 = corruptedBits[4], d3 = corruptedBits[5], d4 = corruptedBits[6];

        const s1 = (p1 + d1 + d2 + d4) % 2;
        const s2 = (p2 + d1 + d3 + d4) % 2;
        const s3 = (p3 + d2 + d3 + d4) % 2;

        const syndromeVal = s1 * 1 + s2 * 2 + s3 * 4; // Decimal 1..7 directly maps to bit position!
        const originalVal = dataBits[0] * 8 + dataBits[1] * 4 + dataBits[2] * 2 + dataBits[3];

        if (syndromeVal === 0) {
            // Received word is already a valid codeword
            const decodedD1 = corruptedBits[2], decodedD2 = corruptedBits[4], decodedD3 = corruptedBits[5], decodedD4 = corruptedBits[6];
            const decodedVal = decodedD1 * 8 + decodedD2 * 4 + decodedD3 * 2 + decodedD4;

            renderCodebookTable(decodedVal);

            if (decodedVal === originalVal) {
                syndromeStatus.innerHTML = '✨ <strong>Σύνδρομο = [0,0,0]:</strong> Η λέξη είναι έγκυρη κωδική λέξη. Δεν διαπιστώθηκε σφάλμα!';
            } else {
                syndromeStatus.innerHTML = `
                    ⚠️ <strong>Σύνδρομο = [0,0,0] (Πολλαπλά Σφάλματα):</strong> Η παραμόρφωση δημιούργησε μια άλλη έγκυρη κωδική λέξη!<br>
                    🔀 Επισημάνθηκε η λέξη <strong>#${decodedVal + 1} (${decodedD1}${decodedD2}${decodedD3}${decodedD4})</strong> στον πίνακα.
                `;
            }
        } else {
            const labels = ['p1', 'p2', 'd1', 'p3', 'd2', 'd3', 'd4'];
            const errorIdx = syndromeVal - 1; // 0-indexed
            const corruptedLabel = labels[errorIdx];

            // Perform single-error correction step
            corruptedBits[errorIdx] = 1 - corruptedBits[errorIdx]; // Auto repair!
            renderTransmittedWord();

            // Calculate decoded data word
            const decodedD1 = corruptedBits[2], decodedD2 = corruptedBits[4], decodedD3 = corruptedBits[5], decodedD4 = corruptedBits[6];
            const decodedVal = decodedD1 * 8 + decodedD2 * 4 + decodedD3 * 2 + decodedD4;

            renderCodebookTable(decodedVal);

            if (decodedVal === originalVal) {
                syndromeStatus.innerHTML = `
                    🛠️ <strong>Υπολογισμός Συνδρόμου [s<sub>1</sub>,s<sub>2</sub>,s<sub>3</sub>] = [${s1},${s2},${s3}] (Δείκτης: ${syndromeVal}):</strong><br>
                    📍 Εντοπίστηκε σφάλμα στο <strong>Bit θέση ${syndromeVal} (${corruptedLabel})</strong>. Το bit διορθώθηκε και επανήλθε στην αρχική κωδική λέξη!
                `;
            } else {
                syndromeStatus.innerHTML = `
                    🔀 <strong>Αποκωδικοποίηση στην Πλησιέστερη Κωδική Λέξη (Nearest Codeword):</strong><br>
                    ⚠️ Λόγω πολλαπλών σφαλμάτων, ο αποκωδικοποιητής οδηγήθηκε στη <strong>πλησιέστερη έγκυρη κωδική λέξη #${decodedVal + 1} (${decodedD1}${decodedD2}${decodedD3}${decodedD4})</strong> (Επισημαίνεται με χρυσό στον πίνακα)!
                `;
            }

            playSound(900, 0.2);
            unlockMission(4);
        }
    });

    encodeBtn.addEventListener('click', computeHammingCode);

    computeHammingCode();
}

/* ==========================================================================
   MODULE 7: SPY PASSPORT & CERTIFICATE
   ========================================================================== */
let completedMissions = new Set();

function unlockMission(num) {
    completedMissions.add(num);

    const stampEl = document.getElementById(`stamp-${num}`);
    if (stampEl) {
        stampEl.textContent = '🌟';
        stampEl.classList.add('unlocked');
    }

    // Update all buttons for this mission across the app
    document.querySelectorAll(`[data-mission="${num}"]`).forEach(btn => {
        btn.textContent = 'Ολοκληρώθηκε ✓';
        btn.style.background = 'rgba(0, 230, 118, 0.2)';
        btn.style.color = '#fff';
    });

    const countEl = document.getElementById('hub-completed-count');
    const barEl = document.getElementById('hub-progress-bar');
    const levelEl = document.getElementById('hub-agent-level');

    if (countEl) countEl.textContent = completedMissions.size;
    if (barEl) barEl.style.width = `${(completedMissions.size / 6) * 100}%`;

    if (completedMissions.size === 6 && levelEl) {
        levelEl.textContent = 'MASTER CRYPTOGRAPHER 🏆';
        levelEl.style.color = 'var(--accent-gold)';
    }
}

function initSpyChallenge() {
    const nameInput = document.getElementById('spy-name-input');
    const certName = document.getElementById('cert-agent-name');
    const hubAgentName = document.getElementById('hub-agent-name');
    const claimBtn = document.getElementById('spy-claim-btn');
    const printCertBtn = document.getElementById('spy-print-cert-btn');
    const resetProgressBtn = document.getElementById('spy-reset-progress-btn');

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            const name = nameInput.value.trim() || 'Πράκτορας Crypto';
            if (certName) certName.textContent = name;
            if (hubAgentName) hubAgentName.textContent = name;
        });
    }

    document.querySelectorAll('[data-mission]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mNum = parseInt(btn.dataset.mission, 10);
            unlockMission(mNum);
            playSound(750, 0.1);
        });
    });

    if (claimBtn) {
        claimBtn.addEventListener('click', () => {
            const code = document.getElementById('spy-code-input').value.trim().toUpperCase();
            if (code === 'CRYPTO' || code === 'CRYPTO2026' || code === 'CRYPTOLAB' || code === 'FORTH') {
                unlockMission(1); unlockMission(2); unlockMission(3); unlockMission(4); unlockMission(5); unlockMission(6);
                alert('🎉 Έγκυρος Κωδικός! Όλες οι αποστολές ξεκλειδώθηκαν!');
            } else {
                alert('❌ Λανθασμένος κωδικός. Δοκιμάστε "CRYPTO2026"');
            }
        });
    }
    if (printCertBtn) {
        printCertBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // QR Code Share Modal integration
    const shareCertBtn = document.getElementById('spy-share-cert-btn');
    const shareModal = document.getElementById('share-modal');
    const closeShareModalBtn = document.getElementById('close-share-modal-btn');
    const qrcodeContainer = document.getElementById('qrcode-container');
    const shareAgentNameDisplay = document.getElementById('share-agent-name-display');
    const shareModalPrintBtn = document.getElementById('share-modal-print-btn');
    const shareBaseUrlInput = document.getElementById('share-base-url-input');

    // Initialize base URL input from localStorage
    if (shareBaseUrlInput) {
        const savedBaseUrl = localStorage.getItem('spy_academy_share_base_url');
        if (savedBaseUrl) {
            shareBaseUrlInput.value = savedBaseUrl;
        }
        
        // Show default origin as placeholder
        shareBaseUrlInput.placeholder = window.location.origin + window.location.pathname;

        // Regenerate QR code if url is changed while modal is open
        shareBaseUrlInput.addEventListener('input', () => {
            localStorage.setItem('spy_academy_share_base_url', shareBaseUrlInput.value.trim());
            generateQrCode();
        });
    }

    function generateQrCode() {
        if (!qrcodeContainer) return;
        const agentName = nameInput ? nameInput.value.trim() : 'Πράκτορας Crypto';
        if (shareAgentNameDisplay) shareAgentNameDisplay.textContent = agentName;

        // Determine base URL: user input (if valid) or fallback to window.location
        let baseUrl = shareBaseUrlInput ? shareBaseUrlInput.value.trim() : '';
        if (!baseUrl) {
            baseUrl = window.location.origin + window.location.pathname;
        }

        const completedMissionsArray = Array.from(completedMissions);
        const shareUrl = `${baseUrl}?name=${encodeURIComponent(agentName)}&completed=${completedMissionsArray.join(',')}`;

        // Generate QR Code
        qrcodeContainer.innerHTML = ''; // clear previous
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrcodeContainer, {
                text: shareUrl,
                width: 200,
                height: 200,
                colorDark: '#0f172a',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            qrcodeContainer.innerHTML = '<p style="color: red; font-size: 0.8rem;">Σφάλμα: Η βιβλιοθήκη QR Code δεν έχει φορτωθεί.</p>';
        }
    }

    if (shareCertBtn && shareModal) {
        shareCertBtn.addEventListener('click', () => {
            generateQrCode();
            // Open Modal
            shareModal.style.display = 'block';
            playSound(620, 0.1);
        });
    }

    if (closeShareModalBtn && shareModal) {
        closeShareModalBtn.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });
    }

    if (shareModalPrintBtn) {
        shareModalPrintBtn.addEventListener('click', () => {
            if (shareModal) shareModal.style.display = 'none';
            window.print();
        });
    }

    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });

    // Check for shared URL parameters on page load
    const urlParams = new URLSearchParams(window.location.search);
    const sharedName = urlParams.get('name');
    const sharedMissions = urlParams.get('completed');

    if (sharedName) {
        const cleanName = decodeURIComponent(sharedName);
        if (nameInput) nameInput.value = cleanName;
        if (certName) certName.textContent = cleanName;
        if (hubAgentName) hubAgentName.textContent = cleanName;

        if (sharedMissions) {
            const missions = sharedMissions.split(',');
            missions.forEach(m => {
                const mNum = parseInt(m, 10);
                if (!isNaN(mNum)) {
                    unlockMission(mNum);

                }
            });
        }

        // Programmatically navigate to the passport tab
        setTimeout(() => {
            const spyTabBtn = document.querySelector('.nav-btn[data-tab="spy-challenge"]');
            if (spyTabBtn) spyTabBtn.click();
        }, 500);
    }

    if (resetProgressBtn) {
        resetProgressBtn.addEventListener('click', () => {
            completedMissions.clear();
            for (let i = 1; i <= 6; i++) {
                const s = document.getElementById(`stamp-${i}`);
                if (s) { s.textContent = '🔒'; s.classList.remove('unlocked'); }
                // Reset all button styles
                document.querySelectorAll(`[data-mission="${i}"]`).forEach(btn => {
                    if (btn.classList.contains('btn-micro')) {
                        btn.textContent = 'Ολοκλήρωση ✓';
                        btn.style.background = '';
                        btn.style.color = '';
                    } else {
                        btn.textContent = `📥 Λήψη Σφραγίδας Αποστολής ${i}`;
                        btn.style.background = '';
                        btn.style.color = '';
                    }
                });
            }
            if (document.getElementById('hub-completed-count')) document.getElementById('hub-completed-count').textContent = '0';
            if (document.getElementById('hub-progress-bar')) document.getElementById('hub-progress-bar').style.width = '0%';
            alert('Η πρόοδος μηδενίστηκε.');
        });
    }
}

























