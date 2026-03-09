#!/bin/bash
# Ejecuta este script en Git Bash (MINGW64) dentro de la carpeta del proyecto
# o desde la carpeta del proyecto: bash push-to-github.sh

set -e
cd "$(dirname "$0")"

git init
git add .
git commit -m "Barra: app lista para producción"
git remote add origin https://github.com/WeroMilk/barra.git 2>/dev/null || git remote set-url origin https://github.com/WeroMilk/barra.git
git branch -M main
git push -u origin main

echo "Listo: código subido a https://github.com/WeroMilk/barra"
