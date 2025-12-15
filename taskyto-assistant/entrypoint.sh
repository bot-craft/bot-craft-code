#!/bin/bash
# Este script maneja los permisos y ejecuta la aplicación

# Asegurar que el directorio de la aplicación tiene los permisos correctos
sudo chown -R $(id -u):$(id -g) /home/ubuntu/app/assistant-flask

# Ejecutar la aplicación
exec /.venv/bin/python app.py