# Use the official PHP image with Apache
FROM php:8.2-apache

# 1. Install system tools needed for Composer (git and unzip)
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 2. Install the mysqli extension for database connection
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

# 3. Install Composer explicitly
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 4. Set the working directory to the web root
WORKDIR /var/www/html

# 5. Copy ALL files from your repo to the container
COPY . .

# 6. Run Composer Install to download PHPMailer
# This creates the /vendor folder inside the image
RUN composer install --no-dev --optimize-autoloader

# 7. Set permissions so Apache can read files
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# 8. Enable Apache rewrite module
RUN a2enmod rewrite

# 9. Expose port 80 for Render
EXPOSE 80