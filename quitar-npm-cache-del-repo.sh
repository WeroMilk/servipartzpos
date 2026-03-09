#!/bin/bash
# Ejecuta en Git Bash desde la carpeta MiBarra para quitar .npm-cache del repo y subir el cambio.
set -e
cd "$(dirname "$0")"

git rm -r --cached .npm-cache 2>/dev/null || true
git add .gitignore
git add -A
git status
git commit -m "Quitar .npm-cache del repo y añadir a .gitignore"
git push

echo "Listo: .npm-cache ya no se sube al repo."
