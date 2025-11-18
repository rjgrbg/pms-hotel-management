# Use the official PHP image with Apache
FROM php:8.2-apache

# Install the mysqli extension for database connection
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

# Copy your application files to the web server root
# ADJUST THIS PATH: If your code is in a subfolder 'pms-hotel-management', use that.
# If 'index.php' is in the root, just use COPY . /var/www/html/
COPY pms-hotel-management/ /var/www/html/

# Set permissions (optional but good practice)
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Apache configuration to allow .htaccess overrides
RUN a2enmod rewrite

# Expose port 80
EXPOSE 80