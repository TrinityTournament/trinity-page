# SSL — Trinity

## 1. SSL autofirmado (desarrollo local)

### Generar el certificado con OpenSSL

```bash
# Crear directorio para los certificados
mkdir -p docker/ssl

# Generar clave privada + certificado autofirmado (válido 365 días)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/ssl/trinity.key \
  -out    docker/ssl/trinity.crt \
  -subj "/C=UY/ST=Montevideo/L=Montevideo/O=Trinity/OU=Dev/CN=localhost"
```

Los archivos `trinity.key` y `trinity.crt` se crean en `docker/ssl/`.
Ambos están en `.gitignore` — no subir al repositorio.

### Configurar Apache para HTTPS (docker/apache.conf)

Reemplazar el archivo `docker/apache.conf` con el contenido del archivo
`docker/apache-ssl.conf` que se encuentra en este mismo directorio.

El archivo activa dos VirtualHost:
- Puerto 80: redirige todo el tráfico a HTTPS.
- Puerto 443: sirve la aplicación con SSL.

### Ajustar el Dockerfile

Agregar después de `RUN a2enmod rewrite headers`:

```dockerfile
RUN a2enmod ssl
EXPOSE 443
```

Y en `docker-compose.yml`, en el servicio `app`, agregar el puerto 443
y montar el directorio de certificados:

```yaml
    ports:
      - "${APP_PORT:-3000}:80"
      - "3443:443"
    volumes:
      - .:/var/www/html
      - php_sessions:/var/lib/php/sessions
      - ./docker/ssl:/etc/ssl/trinity:ro   # certificados montados como solo lectura
```

### Acceder en el navegador

```
https://localhost:3443
```

El navegador mostrará una advertencia de certificado no confiable (normal en
desarrollo). Hacer clic en "Avanzado → Continuar de todas formas".

---

## 2. SSL con Let's Encrypt (producción)

Let's Encrypt emite certificados gratuitos y válidos de 90 días, renovables
automáticamente con Certbot.

### Requisitos previos

- Servidor con IP pública y un dominio apuntando a esa IP (ej. `trinity.example.com`).
- Puertos 80 y 443 abiertos en el firewall del servidor.
- Docker y Docker Compose instalados.

### Instalar Certbot en el servidor host

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-apache
```

### Obtener el certificado

Detener temporalmente el contenedor `app` para liberar el puerto 80:

```bash
docker compose stop app
```

Correr Certbot en modo standalone:

```bash
sudo certbot certonly --standalone \
  -d trinity.example.com \
  --email admin@trinity.example.com \
  --agree-tos \
  --non-interactive
```

Certbot guarda los certificados en:
- `/etc/letsencrypt/live/trinity.example.com/fullchain.pem`
- `/etc/letsencrypt/live/trinity.example.com/privkey.pem`

### Montar los certificados en Docker

En `docker-compose.yml`, servicio `app`:

```yaml
    volumes:
      - .:/var/www/html
      - php_sessions:/var/lib/php/sessions
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

En `docker/apache-ssl.conf`, usar las rutas de Certbot:

```apache
SSLCertificateFile    /etc/letsencrypt/live/trinity.example.com/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/trinity.example.com/privkey.pem
```

Volver a levantar los contenedores:

```bash
docker compose up -d
```

### Renovación automática

Certbot instala un timer de systemd que renueva automáticamente.
Verificar que esté activo:

```bash
sudo systemctl status certbot.timer
```

Para forzar una renovación de prueba:

```bash
sudo certbot renew --dry-run
```

---

## Notas de seguridad

- Los archivos `docker/ssl/*.key` y `docker/ssl/*.crt` están en `.gitignore`.
- En producción, las rutas de Let's Encrypt se montan como `:ro` (solo lectura).
- Se recomienda habilitar HTTP/2 en Apache (`a2enmod http2`) para mayor rendimiento.
- Usar la directiva `Header always set Strict-Transport-Security "max-age=31536000"` en producción.