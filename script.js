// =========================
//  Dinamikus Szerencsekerék
// =========================

// <<< ITT ÁLLÍTOD: a valódi nyeremények listája >>>
const basePrizes = ["egérpad", "karszalag", "mobil tartó", "kulcstartó", "csoki", "cukor"];

// --- A "nem nyert" automatikus hozzáadása (ugyanannyi, mint a nyeremények) ---
let slices = basePrizes.flatMap(p => [p, "nem nyert"]); // [nyer, nem, nyer, nem, ...]

// --- Dinamikus színpaletta (HSL) a szeletekhez ---
function makeColors(n) {
    return Array.from({ length: n }, (_, i) => `hsl(${Math.round((360 / n) * i)}, 85%, 55%)`);
}
let colors = makeColors(slices.length);

// Canvas
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const out = document.getElementById("out");

// HiDPI
function fitHiDPI() {
    const ratio = window.devicePixelRatio || 1;
    const size = Math.min(canvas.clientWidth || canvas.width, canvas.clientHeight || canvas.height);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
fitHiDPI();
addEventListener("resize", fitHiDPI);

// Hasznos rövidítések: mindig a JELENLEGI szeletszámmal dolgozunk
const TAU = Math.PI * 2;
const EPS = 1e-10;
const currentN = () => slices.length;
const currentAng = () => TAU / currentN();

let angle = 0;
let spinning = false;

// Kerék rajz
function drawWheel() {
    const N = currentN();
    const SLICE = currentAng();

    const size = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 1);
    const r = size / 2 - 10;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // — felirat rajzolása (auto-kisebbítés + opcionális 2 sor)
    function drawLabelCentered(label, maxWidthPx) {
        let fontSize = 22;
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;

        while (ctx.measureText(label).width > maxWidthPx && fontSize > 12) {
            fontSize -= 1;
            ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
        }

        let lines = [label];
        if (ctx.measureText(label).width > maxWidthPx && label.includes(' ')) {
            const words = label.split(' ');
            let best = [label], minOver = Infinity;
            for (let i = 1; i < words.length; i++) {
                const l1 = words.slice(0, i).join(' ');
                const l2 = words.slice(i).join(' ');
                const w1 = ctx.measureText(l1).width;
                const w2 = ctx.measureText(l2).width;
                const over = Math.max(w1, w2) - maxWidthPx;
                if (over < minOver) { minOver = over; best = [l1, l2]; }
            }
            lines = best;
            while ((ctx.measureText(lines[0]).width > maxWidthPx || ctx.measureText(lines[1]).width > maxWidthPx) && fontSize > 10) {
                fontSize -= 1;
                ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
            }
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.lineJoin = 'round';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = Math.max(1, Math.round(fontSize * 0.2));

        const strokeW = Math.max(1, Math.round(fontSize * 0.07));
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = strokeW;

        if (lines.length === 1) {
            ctx.strokeText(lines[0], 0, 0);
            ctx.fillText(lines[0], 0, 0);
        } else {
            const lh = Math.round(fontSize * 1.12);
            ctx.strokeText(lines[0], 0, -lh / 2);
            ctx.fillText(lines[0], 0, -lh / 2);
            ctx.strokeText(lines[1], 0, lh / 2);
            ctx.fillText(lines[1], 0, lh / 2);
        }
        ctx.shadowBlur = 0;
    }

    for (let i = 0; i < N; i++) {
        // szelet
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, i * SLICE, (i + 1) * SLICE);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        // elválasztó
        ctx.strokeStyle = 'rgba(0,0,0,.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // felirat
        ctx.save();
        ctx.rotate(i * SLICE + SLICE / 2);
        const radiusLabel = r * 0.65;
        const arcWidth = Math.min(r * 0.9 - 24, radiusLabel * SLICE * 0.9);
        ctx.translate(radiusLabel, 0);
        ctx.rotate(0);
        drawLabelCentered(slices[i], arcWidth);
        ctx.restore();
    }

    // közép dísz
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, TAU);
    ctx.fillStyle = '#0ea5e9';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.stroke();

    ctx.restore();
}
drawWheel();

// Easing
const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Indítás — minden a JELENLEGI szeletszám alapján számol
function startSpin() {
    if (spinning) return;
    spinning = true;

    const duration = 4200 + Math.random() * 1200;
    const startAngle = angle;
    const extraRot = (4 + Math.random() * 2) * TAU + Math.random() * TAU; // 4–6 fordulat + véletlen
    const endAngle = startAngle + extraRot;

    const N = currentN();
    const SLICE = currentAng();

    function frame(now) {
        const k = Math.min(1, (performance.now() - (frame.t0 ?? (frame.t0 = now))) / duration);
        const eased = easeInOutCubic(k);
        angle = startAngle + (endAngle - startAngle) * eased;
        drawWheel();

        if (k < 1) {
            requestAnimationFrame(frame);
        } else {
            spinning = false;

            // Mutató felfelé (−π/2) — stabil index EPS-szel
            const pointerAngle = -Math.PI / 2;
            const final = ((angle % TAU) + TAU) % TAU;
            const rel = (pointerAngle - final + TAU) % TAU;

            let idx = Math.floor((rel + EPS) / SLICE);
            if (idx < 0) idx = 0;
            if (idx >= N) idx = N - 1;

            const prize = slices[idx];
            // out.innerHTML = prize === "nem nyert"
            //     ? `😕 <span class="accent">${prize}</span>`
            //     : `🎉 Nyeremény: <span class="accent">${prize}</span>`;
            out.textContent = '';
            openModal(prize);
        }
    }
    requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", startSpin);
addEventListener("keydown", (e) => {
    if (e.code === "Enter" || e.code === "Space") startSpin();
});

// ===== MODAL vezérlés =====
const modal = document.getElementById('prize-modal');
const modalCard = modal.querySelector('.modal-card');
const modalCloseBtn = modal.querySelector('.modal-close');
const prizeTextSpan = document.getElementById('prize-text');
const prizeSub = document.getElementById('prize-sub');

function openModal(prize) {
    // Szövegek
    if (prize === 'nem nyert') {
        prizeTextSpan.textContent = 'Nem nyert';
        prizeSub.textContent = 'Próbáld újra!';
    } else {
        prizeTextSpan.textContent = prize;
        prizeSub.textContent = 'Gratulálunk!';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // fókusz a kártyára, hogy Esc működjön képernyőn
    setTimeout(() => modalCard.focus(), 0);
}

function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Bezárás események
modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-backdrop')) closeModal();
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});
