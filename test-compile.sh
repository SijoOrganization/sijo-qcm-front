#!/bin/bash

# Script pour tester la compilation Angular
echo "🔧 Test de compilation du projet Angular..."

cd /home/mohamed/Desktop/SIJO-prjects/Sijo-qcm/sijo-qcm-front

# Installer les dépendances si nécessaire
echo "📦 Installation des dépendances..."
npm install --silent

# Test de compilation simple
echo "🏗️ Test de compilation..."
npx ng build --configuration development --verbose=false 2>&1 | head -20

echo "✅ Test terminé!"
