// ══════════════════════════════════════════
//  TRINITY — Footer compartido
//  Inyecta el footer en todas las páginas.
//  Para migrar de servidor: cambiar solo BASE_URL.
// ══════════════════════════════════════════

const FOOTER_BASE_URL = '/Trinity-page';

(function injectFooter() {
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <div class="footer-brand">
            <a href="${FOOTER_BASE_URL}/index.html" class="nav-logo">TRINITY</a>
            <p class="footer-desc">La plataforma que impulsa la competencia. Organizá, participá y seguí tus torneos favoritos.</p>
            <p class="footer-copy">©${new Date().getFullYear()} Trinity. Todos los derechos reservados.</p>
        </div>

        <div class="footer-col">
            <h4>Plataforma</h4>
            <a href="${FOOTER_BASE_URL}/pages/nav/tournament/tournament.html">Torneos</a>
            <a href="${FOOTER_BASE_URL}/pages/nav/ranking/ranking.html">Rankings</a>
            <a href="${FOOTER_BASE_URL}/pages/nav/news/news.html">Noticias</a>
            <a href="${FOOTER_BASE_URL}/pages/nav/contact/contact.html">Calendarios</a>
        </div>

        <div class="footer-col">
            <h4>Comunidad</h4>
            <a href="${FOOTER_BASE_URL}/pages/about-us/aboutUs.html">Nosotros</a>
            <a href="${FOOTER_BASE_URL}/pages/nav/contact/contact.html">Contacto</a>
            <a href="#">Preguntas frecuentes</a>
        </div>

        <div class="footer-col">
            <h4>Legal</h4>
            <a href="#">Términos y condiciones</a>
            <a href="#">Privacidad</a>
        </div>
    `;

    // Insertar al final del body, antes de los scripts
    document.body.appendChild(footer);
})();