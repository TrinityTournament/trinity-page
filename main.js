// ══════════════════════════════════════════
//  TRINITY — main.js
//  Solo funciones específicas del index.
//  El nav, auth y sesión los maneja /components/nav.js
// ══════════════════════════════════════════

// ── DRAG TO SCROLL ──
document.querySelectorAll('.cards-scroll').forEach(slider => {
    let isDown = false, startX, scrollLeft;

    slider.addEventListener('mousedown', e => {
        isDown = true;
        slider.classList.add('grabbing');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mouseup',    () => { isDown = false; slider.classList.remove('grabbing'); });
    slider.addEventListener('mousemove',  e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        slider.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });
});

function scrollCards(id, dir) {
    const el = document.getElementById('scroll-' + id);
    el.scrollBy({ left: dir * 300, behavior: 'smooth' });
}
