# SijoQcmFront

Front-end Angular de la plateforme de quiz et de coding questions.

---

## Fonctionnalités

- Authentification et autorisation (JWT)
- Pour consultant : Répondre aux quiz et coding questions
- Pour tuteur/admin : Créer, modifier, supprimer quiz et coding questions
- Génération automatique de questions via l’API OpenAI

---

## Prérequis

- Node.js >= 18
- Angular CLI (`npm install -g @angular/cli`)
- Accès à un backend Spring Boot et à Judge0 (API d’exécution de code)
- Accès à Azure Container Registry et Azure Container Apps (pour déploiement cloud)

---

## Installation et lancement en local

1. **Cloner le projet**
   ```sh
   git clone https://github.com/SijoOrganization/sijo-qcm-front.git
   cd sijo-qcm-front
   ```

2. **Installer les dépendances**
   ```sh
   npm install
   ```

3. **Configurer l’environnement**
   - Modifier `src/environments/environment.ts` pour pointer vers l’URL du backend.

4. **Lancer le serveur de développement**
   ```sh
   ng serve
   ```
   Accéder à [http://localhost:4200](http://localhost:4200)

---

## Build et Docker

Pour générer le build de production :
```sh
ng build --prod
```

Pour construire l’image Docker :
```sh
docker build -t sijo-qcm-front .
```

---

## Déploiement sur Azure (CI/CD)

Le projet utilise **GitHub Actions** pour automatiser le build et le déploiement sur Azure Container Apps :

- À chaque push sur la branche `main` :
  - Le workflow `.github/workflows/azure_deploy.yml` :
    - Build l’image Docker du frontend
    - Push l’image sur Azure Container Registry
    - Met à jour automatiquement le Container App Azure avec la nouvelle image

**Configuration requise :**
- Secrets GitHub :
  - `ACR_USERNAME` et `ACR_PASSWORD` (Azure Container Registry)
  - `AZURE_CREDENTIALS` (Service principal Azure avec rôle Contributor)
- Azure Container App créé et configuré pour pointer vers l’image du frontend

---

## Mise à jour automatique

Dès qu’un push est effectué sur `main`, le site est reconstruit et déployé automatiquement sur Azure.  
Aucune intervention manuelle n’est nécessaire pour mettre à jour le site en production.

---

## Backend et services nécessaires

- **Backend Spring Boot** : API REST pour quiz, utilisateurs, etc.
- **Judge0** : API d’exécution de code (hébergée sur VM ou Container App)
- **MongoDB** : Base de données quiz
- **OpenAI** : Génération de questions (clé API à configurer)

---

## Support et développement

- Génération de composants : `ng generate component <nom>`
- Tests unitaires : `ng test`
- Tests end-to-end : `ng e2e`

Pour toute question, consulte la documentation Angular ou contacte l’auteur.
