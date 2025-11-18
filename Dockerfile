# Use the official PHP image with Apache
FROM php:8.2-apache

# Install the mysqli extension for database connection
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

# COPY ALL FILES from the repository root (.) to the web server root
COPY . /var/www/html/

# Set permissions to ensure Apache can read the files
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Enable Apache rewrite module (useful for routing)
RUN a2enmod rewrite

# Expose port 80 so Render can access it
EXPOSE 80