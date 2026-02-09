<?php include "../config/database.php"?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Festival de Cortos – Universidad Europea</title>
    <link rel="stylesheet" href="css/index.css">
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
            <a href="html/noticias.html">Noticias</a>
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

    <section class="bloques">
        <div class="bloque">
            <h2>Noticias</h2>
            <p>Últimas novedades del festival.</p>
            <a href="noticias.html">Ver noticias</a>
        </div>

        <div class="bloque">
            <h2>Eventos</h2>
            <p>Consulta el calendario completo.</p>
            <a href="eventos.html">Ver eventos</a>
        </div>

        <div class="bloque">
            <h2>Premios</h2>
            <p>Categorías y galardones.</p>
            <a href="premios.html">Ver premios</a>
        </div>
    </section>

</main>

<script src="js/index.js"></script>

</body>
</html>
