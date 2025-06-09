(function initAestheticCanvas() {
    resizeAestheticCanvas();
    startAestheticParticles();
    window.addEventListener('resize', resizeAestheticCanvas);
})();

function resizeAestheticCanvas() {
    const canvas = document.getElementById('aestheticCanvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
}

function startAestheticParticles() {
    const canvas = document.getElementById('aestheticCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stars = [];

    function setCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '0';
        canvas.style.pointerEvents = 'none';
    }

    function randomColor() {
        const colors = [
            'rgba(187,134,252,ALPHA)',
            'rgba(255,255,255,ALPHA)',
            'rgba(120,200,255,ALPHA)',
            'rgba(255,200,255,ALPHA)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function createStars() {
        stars.length = 0;
        const starCount = Math.max(60, Math.min(180, Math.floor(window.innerWidth * window.innerHeight / 9000)));
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        for (let i = 0; i < starCount; i++) {
            const z = Math.random();
            const angle = Math.random() * Math.PI * 2;
            const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * (0.95 + Math.random() * 0.15);
            const bias = Math.sqrt(Math.random());
            const radiusFromCenter = maxRadius * (0.5 + 0.5 * bias) * (0.7 + 0.3 * z);
            stars.push({
                angle,
                radiusFromCenter,
                radius: (Math.random() * 1.8 + 0.7) * (0.5 + z),
                alpha: Math.random() * 0.7 + 0.3,
                delta: (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? -1 : 1),
                speedY: (Math.random() * 0.15 + 0.03) * (0.5 + z),
                speedX: (Math.random() - 0.5) * 0.08 * (0.5 + z),
                color: randomColor().replace('ALPHA', '0.8'),
                z
            });
        }
    }

    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        lastScrollY = window.scrollY;
    });

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const parallaxStrength = 0.25;
        const spiralStrength = 0.0015;
        const scrollOffset = lastScrollY * parallaxStrength;
        const spiralAngle = lastScrollY * spiralStrength;

        for (let star of stars) {
            const angle = star.angle + spiralAngle * (1 - star.z);
            const r = star.radiusFromCenter;
            const spiralX = centerX + Math.cos(angle) * r;
            const spiralY = centerY + Math.sin(angle) * r;
            const parallaxY = spiralY + scrollOffset * (1 - star.z);

            star.x = spiralX;
            star.y = parallaxY;

            ctx.save();
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = star.color.replace('ALPHA', star.alpha.toFixed(2));
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#bb86fc';
            ctx.globalAlpha = star.alpha;
            ctx.fill();
            ctx.restore();

            // Twinkle effect
            star.alpha += star.delta;
            if (star.alpha <= 0.2 || star.alpha >= 1) star.delta *= -1;

            // Float upward and drift
            star.radiusFromCenter -= star.speedY * 0.1;
            star.angle += star.speedX * 0.01;

            // Respawn logic
            if (
                star.radiusFromCenter < 10 ||
                spiralX < -star.radius ||
                spiralX > canvas.width + star.radius ||
                spiralY < -star.radius ||
                spiralY > canvas.height + star.radius
            ) {
                const newAngle = Math.random() * Math.PI * 2;
                const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * (0.95 + Math.random() * 0.15);
                const bias = Math.sqrt(Math.random());
                const newRadius = maxRadius * (0.5 + 0.5 * bias) * (0.7 + 0.3 * star.z);
                star.angle = newAngle;
                star.radiusFromCenter = newRadius;
            }
        }

        requestAnimationFrame(draw);
    }

    setCanvasSize();
    createStars();
    draw();

    window.addEventListener('resize', () => {
        setCanvasSize();
        createStars();
    });
}
