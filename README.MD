# Trinity — Sistema de Gestion Deportiva Modular

## Proyecto final de *Tecnologias de la Informacion 3°MN*

| Realizado por:     |
|       ---          |
| Santiago Rodriguez |
| Lucia              |
| Facundo            |

Instituto Tecnologico Superior "Arias - Balparda" | Bachillerato Tecnologico | 2026

---

## Tabla de contenidos

- [Descripcion general](#descripcion-general)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Roles del sistema](#roles-del-sistema)
- [Modulos funcionales](#modulos-funcionales)
- [Base de datos](#base-de-datos)
- [API REST](#api-rest)
- [Bot de WhatsApp](#bot-de-whatsapp)
- [Frontend](#frontend)
- [Panel de administracion](#panel-de-administracion)
- [Scripts de mantenimiento](#scripts-de-mantenimiento)
- [Configuracion con Docker](#configuracion-con-docker)
- [Variables de entorno](#variables-de-entorno)
- [Instalacion y puesta en marcha](#instalacion-y-puesta-en-marcha)
- [Seguridad](#seguridad)
- [Exclusiones del sistema](#exclusiones-del-sistema)

---

## Descripcion general

Trinity es una plataforma web modular para la organizacion, administracion y seguimiento de torneos deportivos, mentales y electronicos. El sistema permite gestionar diferentes formatos de torneo desde una misma plataforma, evitando que cada organizacion deba recurrir a herramientas separadas o planillas manuales.

El proyecto contempla deportes tradicionales (futbol, basketball, tenis, voleibol, atletismo, natacion) y videojuegos competitivos (Fortnite, League of Legends, Valorant, Rocket League, Clash Royale, Call of Duty), unificando la gestion bajo una arquitectura comun.

Tecnicamente, el sistema se compone de un frontend estatico en HTML/CSS/JS, una API REST en PHP con arquitectura MVC, una base de datos MySQL y un bot de WhatsApp integrado mediante Node.js para el envio de notificaciones.

---

## Estructura del proyecto

```
Trinity/
├── index.html                  # Pagina principal (landing)
├── style.css                   # Estilos globales
├── main.js                     # JS global
├── database.sql                # Esquema MySQL completo
├── Dockerfile                  # Imagen PHP 8.2 + Apache
├── docker-compose.yml          # Orquestacion de los tres servicios
├── composer.json               # Dependencias PHP
├── package.json                # Metadatos del proyecto Node
├── dbcheck.php                 # Diagnostico de conexion (ELIMINAR en produccion)
├── .env                        # Variables de entorno (no subir al repositorio)
├── .gitignore
│
├── api/                        # Backend PHP (Controladores y logica de negocio)
│   ├── config.php              # Configuracion global, PDO singleton, helpers
│   ├── middleware.php          # Autenticacion y control de roles
│   ├── auth/                   # Modulo de autenticacion
│   │   ├── login.php
│   │   ├── check-session.php
│   │   ├── request-reset.php
│   │   ├── do-reset.php
│   │   └── verify-token.php
│   ├── users/                  # Modulo de gestion de usuarios
│   │   ├── get-profile.php
│   │   ├── update-profile.php
│   │   ├── update-credentials.php
│   │   ├── change-password.php
│   │   ├── check-email.php
│   │   ├── search-users.php
│   │   ├── follow.php
│   │   ├── get-followers.php
│   │   ├── get-my-tournaments.php
│   │   └── delete-account.php
│   ├── tournaments/            # Modulo de torneos
│   │   ├── get-all-tournament.php
│   │   ├── invite-tournament.php
│   │   └── notify-tournament.php
│   ├── notifications/          # Modulo de notificaciones in-app
│   │   ├── get-notifications.php
│   │   └── mark-notifications-read.php
│   ├── admin/                  # Endpoints exclusivos para administradores
│   │   ├── usuarios.php
│   │   └── crear-admin.php
│   └── verification/           # Verificacion por codigo (email / telefono)
│       ├── send-code.php
│       └── verify-code.php
│
├── pages/                      # Vistas HTML (capa Vista del MVC)
│   ├── login/
│   │   ├── login.html
│   │   ├── script.js
│   │   └── style.css
│   ├── profile/
│   │   ├── acc/                # Vista publica de perfil
│   │   │   ├── view.html
│   │   │   ├── profile.js
│   │   │   ├── profile.css
│   │   │   └── pickerpref/     # Selector de preferencias (deportes/videojuegos)
│   │   └── cfg/                # Edicion de perfil
│   │       ├── edit.html
│   │       ├── edit.js
│   │       ├── edit.css
│   │       └── cropper/        # Recorte de imagen de perfil
│   ├── admin/                  # Panel de administracion
│   │   ├── index.html
│   │   ├── admin.js
│   │   └── admin.css
│   ├── nav/                    # Secciones en produccion
│   │   ├── ranking/
│   │   ├── news/
│   │   ├── tournament/
│   │   └── contact/
│   └── about-us/
│
├── components/                 # Componentes reutilizables del frontend
│   ├── nav.js                  # Navbar dinamica con deteccion de sesion
│   └── nav.css
│
├── assets/                     # Recursos estaticos
│   ├── HeroMain.png
│   ├── TrinityLogo.png
│   ├── AstraxLogo.jpg
│   ├── pageicon.png
│   ├── sports/
│   ├── videogames/
│   ├── banners-main/
│   └── banners-vertical/
│
├── WhatsApp/                   # Bot de WhatsApp — microservicio Node.js
│   ├── src/
│   │   ├── index.js            # Punto de entrada, conexion Baileys
│   │   ├── apiServer.js        # Servidor Express interno (PHP → bot)
│   │   ├── config.js
│   │   ├── events/
│   │   │   ├── connection.update.js
│   │   │   └── messages.upsert.js
│   │   ├── commands/
│   │   │   └── start.js
│   │   └── lib/
│   │       ├── core/
│   │       │   ├── socket.js
│   │       │   └── serialize.js
│   │       ├── botState.js
│   │       ├── loaders.js
│   │       └── utils.js
│   └── package.json
│
├── scripts/                    # Scripts de administracion del servidor
│   ├── backup.sh               # Backup automatico de la base de datos
│   ├── cron-install.sh         # Instalacion de tarea cron para backup
│   ├── monitor.sh              # Monitor de estado de servicios
│   └── usuarios.sh             # Gestion de usuarios Linux (requiere root)
│
├── docker/
│   └── apache.conf             # Configuracion de Apache
└── vendor/                     # Dependencias PHP gestionadas por Composer
```

---

## Tecnologias utilizadas

**Frontend**
- HTML5, CSS3, JavaScript vanilla con filosofia Mobile First
- Flexbox para layout responsive
- Fuentes Google Fonts: Barlow y Barlow Condensed
- Cropper.js para recorte de imagen de perfil

**Backend**
- PHP 8.2 con PDO para acceso a la base de datos
- Apache 2 con `mod_rewrite` y `mod_headers` habilitados
- Composer para gestion de dependencias PHP
- `vlucas/phpdotenv` para carga de variables de entorno
- Brevo (ex Sendinblue) como servicio de envio de emails transaccionales

**Base de datos**
- MySQL 8.0 (compatible con MariaDB 10.5+)
- Codificacion `utf8mb4` / `utf8mb4_unicode_ci`

**Bot de WhatsApp**
- Node.js 20 con ESModules
- Baileys como cliente de WhatsApp Web
- Express.js como servidor HTTP interno

**Infraestructura**
- Docker y Docker Compose para orquestacion de los tres servicios
- Scripts Bash para backup, monitoreo y administracion del servidor

**Control de versiones**
- Git — repositorio en GitHub: `https://github.com/TrinityTournament/trinity-page`

---

## Roles del sistema

El sistema implementa control de acceso basado en roles con tres niveles definidos.

**Administrador general (`admin`)**
Tiene control completo sobre el sistema. Puede crear, editar y eliminar usuarios administrativos, gestionar todos los torneos, acceder al panel de administracion, consultar registros y promover usuarios a otros roles. Accede mediante `ADMIN_KEY` para la creacion del primer administrador.

**Organizador (`organizador`)**
Tiene permisos limitados a los torneos que administra. Puede configurar torneos asignados, inscribir participantes, cargar y corregir resultados, publicar o cerrar rondas y enviar notificaciones a los participantes de sus torneos.

**Participante (`participante`)**
Rol por defecto al registrarse. Puede consultar los torneos en los que participa, ver calendario de enfrentamientos, consultar resultados y posiciones, y editar los datos basicos de su perfil. No puede modificar resultados ni crear torneos.

**Usuario publico (sin autenticacion)**
Puede acceder a la landing page, ver deportes y videojuegos disponibles, y consultar informacion publica. No puede realizar acciones que modifiquen informacion del sistema.

La verificacion de roles se realiza en el servidor a traves del middleware `api/middleware.php`. Las funciones `requiere_sesion()` y `requiere_rol()` cortan la ejecucion con HTTP 401 o 403 antes de que el controlador procese cualquier logica.

---

## Modulos funcionales

### Implementados

**Modulo de usuarios y autenticacion** — registro, login por email o telefono, recuperacion de contrasena por token de un solo uso, verificacion de credenciales por codigo, gestion de sesion PHP y cierre de sesion.

**Modulo de perfil** — vista publica con foto, estadisticas de torneos jugados y ganados, descripcion, pronombres y preferencias. Edicion con recorte de imagen, cambio de email o telefono verificado por codigo, cambio de contrasena y eliminacion de cuenta.

**Modulo de seguidores** — seguir y dejar de seguir a otros usuarios, listado de seguidores y seguidos.

**Modulo de notificaciones** — notificaciones in-app con estado de lectura. Cada notificacion activa de forma automatica un email via Brevo y, si el usuario lo habilito, un mensaje de WhatsApp.

**Modulo de administracion** — panel con listado de usuarios y torneos, busqueda en tiempo real y gestion de cuentas.

**Modulo de torneos (base)** — estructura de datos para torneos con campos de titulo, deporte, estado, fecha de inicio, maximo de participantes y organizador. Estados disponibles: `en_creacion`, `abierto`, `en_curso`, `finalizado`, `cancelado`.

### En produccion

**Modulo de liga** — generacion automatica de fixture todos contra todos, tabla de posiciones acumulada.

**Modulo de eliminacion directa** — generacion de llaves, avance automatico por resultado, visualizacion del bracket.

**Modulo de sistema suizo** — emparejamiento por rendimiento acumulado evitando repeticiones entre rondas.

**Modulo de resultados** — registro, edicion y validacion de resultados por enfrentamiento.

**Modulo de consulta publica de torneos** — pagina de busqueda, detalle de torneo y posiciones visible sin autenticacion.

**Rankings** — clasificacion historica de participantes por deporte o videojuego.

**Noticias** — publicacion de novedades del sistema o de torneos activos.

**Contacto** — formulario de contacto para organizadores o usuarios.

---

## Base de datos

El archivo `database.sql` define el esquema completo con motor InnoDB, codificacion `utf8mb4` y compatibilidad con MySQL 8.0+.

**`usuarios`** — tabla central del sistema. Almacena nombre, usuario unico, email unico, telefono unico, contrasena (hash bcrypt), fecha de nacimiento, pronombres, descripcion, URL de foto, tipo de cuenta (`deportes` o `videojuegos`), deportes seleccionados en formato JSON, contadores de torneos jugados y ganados, preferencia de notificaciones por WhatsApp y rol. Incluye indices sobre email y telefono para busquedas eficientes.

**`password_resets`** — tokens de un solo uso para recuperacion de contrasena. Cada token tiene fecha de expiracion y marca de uso, vinculado al usuario mediante clave foranea con eliminacion en cascada.

**`seguidores`** — relacion muchos a muchos entre usuarios (seguidor / seguido). Clave unica compuesta para evitar duplicados. Ambas claves foraneas con eliminacion en cascada.

**`codigos_verificacion`** — codigos temporales enviados por email o telefono para verificar cambios de credenciales o el proceso de registro. Incluye tipo (`registro`, `cambio_credencial`, `cambio_password`), fecha de expiracion y marca de uso.

**`notificaciones`** — notificaciones in-app con tipo, titulo, mensaje, link opcional y estado de lectura. Indice compuesto sobre `(usuario_id, leido, creado_en)` para consultas eficientes del centro de notificaciones.

> Las contrasenas se almacenan exclusivamente como hash generado por `password_hash($plain, PASSWORD_BCRYPT)`. Nunca se almacena texto plano.

Para inicializar la base de datos manualmente:

```bash
mysql -u root -p < database.sql
```

Con Docker Compose, el archivo se carga automaticamente al crear el contenedor por primera vez a traves del punto de montaje `/docker-entrypoint-initdb.d/`.

### Tablas en produccion

Las siguientes tablas corresponden a modulos aun no implementados y se incorporaran en proximas entregas:

- `torneos` — datos del torneo, tipo, estado y organizador
- `participantes` — inscripcion de usuarios o equipos a torneos
- `equipos` — gestion de equipos con integrantes
- `rondas` — rondas de cada torneo con su estado
- `enfrentamientos` — pares de participantes por ronda
- `resultados` — marcadores o vencedores de cada enfrentamiento
- `tabla_posiciones` — puntos y estadisticas acumuladas por torneo
- `auditoria` — registro de cambios en la base de datos

---

## API REST

Todos los endpoints se encuentran bajo `/api/` y responden en JSON con `Content-Type: application/json; charset=utf-8`. La autenticacion se basa en sesiones PHP gestionadas por el servidor.

### Autenticacion (`api/auth/`)

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `login.php` | POST | Login con email o telefono + contrasena. Acepta `{ identifier, password }` |
| `check-session.php` | GET | Verifica si hay sesion activa y devuelve datos del usuario |
| `request-reset.php` | POST | Solicita token de reset de contrasena y lo envia por email |
| `do-reset.php` | POST | Aplica el nuevo password usando el token recibido |
| `verify-token.php` | POST | Valida un token de reset sin aplicarlo |

### Usuarios (`api/users/`)

| Endpoint | Descripcion |
|---|---|
| `get-profile.php` | Obtiene el perfil publico de un usuario por ID o nombre de usuario |
| `update-profile.php` | Actualiza foto, descripcion, pronombres y preferencias del perfil |
| `update-credentials.php` | Cambia email o telefono con verificacion previa por codigo |
| `change-password.php` | Cambia la contrasena del usuario autenticado |
| `check-email.php` | Verifica si un email ya esta registrado en el sistema |
| `search-users.php` | Busqueda de usuarios por nombre completo o @usuario |
| `follow.php` | Seguir o dejar de seguir a un usuario |
| `get-followers.php` | Lista de seguidores y de usuarios seguidos |
| `get-my-tournaments.php` | Torneos en los que participa el usuario autenticado |
| `delete-account.php` | Elimina definitivamente la cuenta del usuario autenticado |

### Torneos (`api/tournaments/`)

| Endpoint | Descripcion |
|---|---|
| `get-all-tournament.php` | Lista todos los torneos del sistema (requiere rol `admin`) |
| `invite-tournament.php` | Envia invitacion a un usuario para participar en un torneo |
| `notify-tournament.php` | Envia notificacion masiva por email y WhatsApp a participantes de un torneo |

### Notificaciones (`api/notifications/`)

| Endpoint | Descripcion |
|---|---|
| `get-notifications.php` | Obtiene las notificaciones del usuario autenticado, ordenadas por fecha |
| `mark-notifications-read.php` | Marca una o varias notificaciones como leidas |

### Verificacion (`api/verification/`)

| Endpoint | Descripcion |
|---|---|
| `send-code.php` | Genera y envia un codigo de verificacion a un email o telefono |
| `verify-code.php` | Valida el codigo ingresado por el usuario |

### Administracion (`api/admin/`)

| Endpoint | Descripcion |
|---|---|
| `usuarios.php` | Lista y permite gestionar usuarios del sistema (requiere rol `admin`) |
| `crear-admin.php` | Promueve un usuario existente al rol `admin` (requiere `ADMIN_KEY` en el header) |

### Sistema de notificaciones

Cuando cualquier parte del backend llama a `crear_notificacion()`, el sistema ejecuta tres acciones de forma encadenada:

1. Inserta el registro en la tabla `notificaciones` (visible en el centro de notificaciones del usuario).
2. Envia un email HTML con el branding de Trinity usando la API de Brevo, si el usuario tiene email registrado y la variable `BREVO_KEY` esta configurada.
3. Envia un mensaje de WhatsApp via el bot interno, si el usuario activo la opcion `notif_whatsapp` y tiene telefono registrado.

### Endpoints en produccion

Los siguientes grupos de endpoints se incorporaran al completar los modulos correspondientes:

- `api/tournaments/` — creacion, edicion y administracion completa de torneos
- `api/matches/` — generacion de enfrentamientos por tipo de torneo
- `api/results/` — registro y validacion de resultados
- `api/standings/` — consulta de tablas de posiciones y llaves
- `api/public/` — endpoints sin autenticacion para consulta publica

---

## Bot de WhatsApp

El directorio `WhatsApp/` contiene un microservicio Node.js que conecta con WhatsApp Web mediante la libreria Baileys. Opera como un servicio independiente dentro de la red Docker interna.

**Funcionamiento:** el bot establece y mantiene una sesion de WhatsApp. Al iniciarse por primera vez muestra un codigo QR en la consola para vincular la cuenta. Las credenciales se persisten en el directorio `auth/` (volumen Docker `wa_auth`) para no repetir el proceso en cada reinicio. Una vez conectado, expone un servidor HTTP interno mediante Express que escucha en `127.0.0.1:{WA_BOT_PORT}`.

**Endpoints del servidor interno:**

| Endpoint | Descripcion |
|---|---|
| `POST /api/whatsapp/send` | Envia un mensaje a un numero especifico. Body: `{ phone, message }` |
| `POST /api/whatsapp/broadcast` | Envia el mismo mensaje a multiples numeros con pausa de 800ms entre envios para evitar restricciones de WhatsApp. Body: `{ phones[], message }` |
| `GET /api/whatsapp/status` | Health check — informa si el bot esta conectado o no |

La comunicacion entre PHP y el bot se autentica con el header `X-WA-Secret`, cuyo valor debe coincidir con la variable `WA_SECRET` del `.env`. Los numeros de telefono son normalizados automaticamente (se eliminan caracteres no numericos) antes de construir el JID de WhatsApp.

---

## Frontend

### Pagina principal (`index.html`)

Landing page con seccion hero ("Compite. Gana. Haz Historia."), scroll horizontal de tarjetas de deportes disponibles (futbol, basketball, tenis, voleibol, atletismo, natacion) y de videojuegos (Fortnite, League of Legends, Valorant, Rocket League, Clash Royale, Call of Duty). La navegacion entre tarjetas se realiza con flechas y scroll nativo.

### Login y registro (`pages/login/`)

Formulario de autenticacion que acepta email o numero de telefono como identificador. Incluye flujo completo de recuperacion de contrasena por token enviado por email, con validacion en frontend y backend.

### Perfil de usuario (`pages/profile/`)

Vista publica del perfil (`acc/view.html`) con foto de perfil, nombre de usuario, pronombres, descripcion, estadisticas de torneos jugados y ganados, lista de deportes o videojuegos seleccionados, seguidores, seguidos y boton de seguir/dejar de seguir.

Edicion del perfil (`cfg/edit.html`) con recorte de imagen integrado (Cropper.js), selector interactivo de tipo de cuenta y preferencias deportivas, cambio de email o telefono con verificacion por codigo y eliminacion de cuenta con confirmacion.

### Navegacion (`components/nav.js`)

Componente de barra de navegacion dinamica que se inyecta en todas las paginas. Detecta si el usuario tiene sesion activa mediante la API y muestra opciones diferenciadas: acceso al perfil, centro de notificaciones y boton de logout para usuarios autenticados; botones de login y registro para usuarios no autenticados. Incluye menu hamburguesa para dispositivos moviles.

### Secciones en produccion

Las paginas de Rankings, Noticias, Torneos y Contacto muestran actualmente un placeholder "Proximamente" y seran implementadas en las proximas entregas del proyecto.

---

## Panel de administracion

Accesible en `pages/admin/index.html`, exclusivo para usuarios con rol `admin`. La sesion se verifica al cargar la pagina y redirige al login si no hay autenticacion valida.

El panel cuenta con un sidebar lateral con tres secciones:

**Usuarios** — tabla con todos los usuarios del sistema, busqueda en tiempo real por nombre o @usuario, contador total de cuentas y opciones de gestion por registro.

**Torneos** — listado de todos los torneos con estado, organizador, fecha de creacion y maximo de participantes. Los estados se muestran con etiquetas legibles (`En creacion`, `Abierto`, `En curso`, `Finalizado`, `Cancelado`).

**Configuracion** — ajustes generales del panel de administracion (en produccion).

---

## Scripts de mantenimiento

Ubicados en `scripts/`, se ejecutan directamente en el servidor host (fuera de Docker). Todos leen las credenciales desde el archivo `.env` del proyecto.

**`backup.sh`** — realiza un dump completo de la base de datos MySQL, lo comprime en formato `.sql.gz` con timestamp y lo guarda en `/var/backups/trinity/`. Mantiene un maximo de 7 backups rotativos. Registra cada operacion en `/var/log/trinity-backup.log`.

**`cron-install.sh`** — instala una tarea cron para ejecutar `backup.sh` de forma automatica segun la frecuencia configurada.

**`monitor.sh`** — muestra en consola el estado de los servicios del sistema (Docker, Apache, MySQL), uso de disco, memoria y actividad reciente. Utiliza colores para indicar servicios activos o inactivos.

**`usuarios.sh`** — herramienta interactiva de consola para gestionar usuarios Linux del servidor (crear, modificar, eliminar). Requiere privilegios de root (`sudo bash scripts/usuarios.sh`).

---

## Configuracion con Docker

El proyecto incluye un `docker-compose.yml` que orquesta tres servicios en una red bridge interna llamada `trinity_net`.

**`db`** — MySQL 8.0. El esquema se inicializa automaticamente desde `database.sql` la primera vez que se crea el contenedor (directorio `/docker-entrypoint-initdb.d/`). Los datos persisten en el volumen `db_data`. Incluye healthcheck para garantizar que el servicio este listo antes de iniciar los demas.

**`app`** — PHP 8.2 + Apache. Construido desde el `Dockerfile` del proyecto. El codigo fuente se monta como volumen para que los cambios se reflejen en tiempo real sin reconstruir la imagen. Las sesiones PHP persisten en el volumen `php_sessions`. Expone el puerto definido en `APP_PORT` (por defecto `3000`). Depende del servicio `db` con condicion `service_healthy`.

**`whatsapp`** — Node.js 20 Alpine. Instala dependencias y ejecuta el bot al iniciarse. Las credenciales de sesion de WhatsApp persisten en el volumen `wa_auth` para evitar repetir el escaneo del QR. Se comunica con `app` dentro de la red interna bajo el hostname `whatsapp`.

**Volumenes definidos:** `db_data`, `php_sessions`, `wa_auth`.

Para iniciar el proyecto completo:

```bash
docker compose up -d
```

Para ver los logs del bot de WhatsApp y escanear el QR inicial:

```bash
docker compose logs -f whatsapp
```

---

## Variables de entorno

Crear un archivo `.env` en la raiz del proyecto con los siguientes valores antes de levantar los servicios. El archivo `.env` esta incluido en `.gitignore` y no debe subirse al repositorio.

| Variable | Descripcion |
|---|---|
| `DB_HOST` | Host del servidor MySQL (`localhost` en local, `db` en Docker) |
| `DB_NAME` | Nombre de la base de datos (`trinity`) |
| `DB_USER` | Usuario MySQL de la aplicacion |
| `DB_PASS` | Contrasena del usuario MySQL |
| `DB_ROOT_PASS` | Contrasena root de MySQL (solo requerida para Docker) |
| `APP_PORT` | Puerto en el que Apache expone la aplicacion (por defecto `3000`) |
| `APP_URL` | URL base de la aplicacion para construir links en emails (ej. `http://localhost:3000`) |
| `BREVO_KEY` | API key de Brevo para envio de emails transaccionales |
| `WA_BOT_PORT` | Puerto del servidor interno del bot de WhatsApp (por defecto `3001`) |
| `WA_BOT_HOST` | Host del bot (`127.0.0.1` en local, `whatsapp` en Docker) |
| `WA_SECRET` | Clave secreta compartida entre PHP y el bot de WhatsApp |
| `ADMIN_KEY` | Clave para el endpoint de promocion a rol admin |

---

## Instalacion y puesta en marcha

### Con Docker (recomendado)

Requisitos previos: Docker y Docker Compose instalados.

```bash
# 1. Clonar el repositorio
git clone https://github.com/TrinityTournament/trinity-page.git
cd trinity-page

# 2. Crear y completar el archivo de entorno
cp .env.example .env
# Editar .env con los valores correspondientes

# 3. Instalar dependencias PHP (vendor/ se monta como volumen)
composer install

# 4. Levantar los tres servicios
docker compose up -d

# 5. Al iniciar por primera vez, escanear el QR del bot de WhatsApp
docker compose logs -f whatsapp
```

La aplicacion queda disponible en `http://localhost:3000` (o el puerto configurado en `APP_PORT`).

### Desarrollo local (sin Docker)

Requisitos previos: PHP 8.2+, Apache 2 con `mod_rewrite`, MySQL 8.0+, Composer, Node.js 20+.

```bash
# 1. Instalar dependencias PHP
composer install

# 2. Inicializar la base de datos
mysql -u root -p < database.sql

# 3. Iniciar el bot de WhatsApp
cd WhatsApp
npm install
node .

# 4. Configurar Apache para que sirva la raiz del proyecto
# y habilitar mod_rewrite y mod_headers
```

---

## Seguridad

### Medidas implementadas

- Las contrasenas se almacenan exclusivamente como hash bcrypt generado por `password_hash($plain, PASSWORD_BCRYPT)`. No se almacena texto plano en ningun momento.
- Todos los endpoints del backend utilizan sentencias preparadas con PDO para prevenir inyeccion SQL.
- La autenticacion se basa en sesiones PHP del lado del servidor. El cliente no almacena tokens en localStorage.
- El control de acceso por roles se verifica en el servidor antes de ejecutar cualquier logica de negocio.
- La comunicacion entre PHP y el bot de WhatsApp esta protegida por una clave secreta compartida en el header `X-WA-Secret`.
- Los tokens de recuperacion de contrasena son de un solo uso y tienen fecha de expiracion.
- Los codigos de verificacion de credenciales son temporales y se invalidan tras su uso.
- El archivo `.env` esta excluido del repositorio mediante `.gitignore`.

### Pendiente de implementacion (en produccion)

- Certificado SSL / HTTPS en el servidor de produccion.
- Politica de firewall e iptables en el servidor host.
- Implementacion de fail2ban para bloqueo de intentos de login repetidos.
- Registro de auditoria de cambios en la base de datos.
- Informe OWASP Top 10 aplicado al sistema.
- Validaciones adicionales en frontend (en progreso).
- Politicas formales de contrasenas para usuarios del sistema.
- IDS / IPS en la infraestructura de red.
- Sistema de monitoreo (Zabbix o Grafana).

> El archivo `dbcheck.php` es una herramienta de diagnostico temporal que expone credenciales de la base de datos. Debe eliminarse antes de cualquier despliegue en un entorno accesible publicamente.

---

## Exclusiones del sistema

( Por tema de letra )
- Procesamiento o integracion con pasarelas de pago
- Integracion con redes sociales externas
- Inteligencia artificial embebida
- Arbitraje automatico de resultados
- Sistema de apuestas
- Venta de entradas o control de acceso fisico a eventos
