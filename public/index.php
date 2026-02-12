<?php include "../config/database.php" ?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Festival de Cortos – Universidad Europea</title>

    <!-- CSS principal -->
    <link rel="stylesheet" href="css/index.css">

    <!-- CSS del carrusel de noticias -->
    <link rel="stylesheet" href="css/noticias_publico.css">
    <link rel="stylesheet" href="css/ui.css">
    
    <link rel="stylesheet" href="css/footer_override.css">
</head>

<body>

    <header class="ue-header">
        <div class="main-nav">
            <div class="logo">
                <a href="index.php">
                    <img src="img/logo_uem.png" alt="Universidad Europea">
                </a>
            </div>

            <nav class="nav-links">
                <a href="html/eventos.html">Eventos</a>
                <a href="html/premios.html">Premios</a>
                <a href="html/gala.html">Gala</a>
                <a href="html/ediciones.html">Ediciones anteriores</a>
                <a href="html/inscripcion.html">Inscripción</a>

                <select id="login">
                    <option value="" selected disabled hidden>👤 Entrar</option>
                    <option value="participante">Participante</option>
                    <option value="organizador">Organizador</option>
                </select>
            </nav>
        </div>
    </header>

    <main class="content">

        <!-- ================= HERO ================= -->
        <section class="hero">
            <h1>Festival Universitario de Cortometrajes</h1>
            <p>
                Bienvenido al festival anual de cortos de la Universidad Europea.
                Descubre las mejores candidaturas, eventos, premios y galas.
            </p>
            <a href="html/inscripcion.html" class="btn-principal">
                Sube tu corto
            </a>
        </section>

        <!-- ================= NOTICIAS SIN BOTONES ================= -->
        <section id="noticiasIndex" style="margin-top: 80px;">
            <h2 style="margin-bottom: 20px;">Últimas noticias</h2>

            <div class="carousel-viewport">
                <div class="carousel-track" id="newsTrack">
                    <!-- Noticias cargadas dinámicamente -->
                </div>
            </div>
        </section>

    </main>

    <!-- ================= FOOTER UE ================= -->
    <footer class="ue-footer">
        <div class="ue-footer-top">

            <div class="ue-footer-logo">
                <img src="img/logo_footer.png" alt="Universidad Europea">
            </div>

            <div class="ue-footer-columns">

                <div class="ue-footer-col">
                    <h3>Festival</h3>
                    <ul>
                        <li><a href="html/eventos.html">Eventos</a></li>
                        <li><a href="html/premios.html">Premios</a></li>
                        <li><a href="html/gala.html">Gala</a></li>
                        <li><a href="html/ediciones.html">Ediciones anteriores</a></li>
                    </ul>
                </div>

                <div class="ue-footer-col">
                    <h3>Contacto</h3>
                    <ul>
                        <li><a>Email: festival@universidadeuropea.es</a></li>
                        <li><a>Tel: +34 91 740 72 72</a></li>
                        <li><a>Campus de Villaviciosa de Odón</a></li>
                    </ul>
                </div>

                <div class="ue-footer-col footer-patrocinadores">
                    <h3>Patrocinadores</h3>
                    <div id="footerPatrocinadores" class="patrocinadores-grid"></div>
                </div>

                <div class="ue-footer-col">
                    <h3>Síguenos</h3>
                    <div class="social-icons">

                        <a href="https://www.facebook.com/UniversidadEuropea" target="_blank">
                            <img src="img/footer/logo-de-facebook.png" alt="Facebook">
                        </a>

                        <a href="https://www.instagram.com/universidadeuropea" target="_blank">
                            <img src="img/footer/instagram.png" alt="Instagram">
                        </a>

                        <a href="https://www.youtube.com/user/UniversidadEuropea" target="_blank">
                            <img src="img/footer/youtube.png" alt="YouTube">
                        </a>

                        <a href="https://www.linkedin.com/school/universidad-europea-de-madrid/posts/?feedView=all" target="_blank">
                            <img src="img/footer/linkedin.png" alt="LinkedIn">
                        </a>

                        <a href="https://twitter.com/UEuropea" target="_blank">
                            <img src="img/footer/twitter.png" alt="X (Twitter)">
                        </a>

                    </div>
                </div>

            </div>
        </div>

        <div class="ue-footer-bottom">
            <p>© Universidad Europea – Festival Universitario de Cortometrajes</p>
        </div>
    </footer>

    <!-- ================= SCRIPTS ================= -->
    <script src="js/ui.js"></script>
    <script src="js/noticias_publico.js"></script>
    <script src="js/session.js"></script>
    <script src="js/index.js"></script>
    <script src="js/patrocinadores_public.js"></script>
</body>

</html>
