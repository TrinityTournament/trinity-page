FROM php:8.2-apache

# ── Dependencias del sistema ───────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpng-dev \
        libjpeg62-turbo-dev \
        libwebp-dev \
        libcurl4-openssl-dev \
        pkg-config \
    && docker-php-ext-configure gd \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        gd \
        curl \
        mbstring \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── Módulos Apache ─────────────────────────────────────────
RUN a2enmod rewrite headers

# ── Configuración Apache ───────────────────────────────────
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# ── PHP: ajustes de sesión y upload ───────────────────────
RUN echo "session.save_path = /var/lib/php/sessions" >> /usr/local/etc/php/conf.d/trinity.ini \
 && echo "upload_max_filesize = 10M"                 >> /usr/local/etc/php/conf.d/trinity.ini \
 && echo "post_max_size = 10M"                       >> /usr/local/etc/php/conf.d/trinity.ini \
 && mkdir -p /var/lib/php/sessions \
 && chown www-data:www-data /var/lib/php/sessions

# ── Composer ───────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# En desarrollo el código se monta como volumen (composer install
# ya está en vendor/ local). En producción, descomentar:
# COPY . /var/www/html/
# RUN composer install --no-dev --optimize-autoloader