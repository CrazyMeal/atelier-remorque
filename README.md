# Atelier Remorque

Configurateur 3D de remorque vélo inspiré du **Wike Highsided Cargo Bike Trailer DIY Kit**.
Projet statique en HTML/CSS/JavaScript et Three.js, sans backend, sans compte et sans étape de compilation.

## Dossier de travail WSL

Ce projet se trouve dans Ubuntu, sous :

    /home/crazynix/local-workspace/atelier-remorque

Depuis WSL, avec Node.js 20 ou plus :

    cd ~/local-workspace/atelier-remorque
    npm run dev

Ouvrir http://localhost:5173. Aucun npm install n’est nécessaire :
Three.js 0.180.0 et OrbitControls sont inclus dans vendor/ avec leur licence MIT.
Le serveur Node est uniquement un outil de développement local ; GitHub Pages sert les fichiers directement.
PORT peut être défini pour changer le port, par exemple PORT=5180 npm run dev.

Alternative sans Node : python3 -m http.server 5173 --bind 127.0.0.1
Ne pas ouvrir index.html en file:// : les modules JavaScript nécessitent HTTP.

## Fonctionnalités

- Vue 3D orbitale, vues de dessus et de côté, cotes et vue éclatée.
- Longueur, largeur et hauteur extérieures réglables, trois formats de départ.
- Tubes carrés de 25,4 mm : aluminium ou acier, épaisseur modifiable.
- Plancher optionnel, parois pleines, lattes ou cadre nu.
- Épaisseur du contreplaqué et finition visuelle des panneaux.
- Métrage des tubes, surface de panneaux et masse indicative hors kit.
- Nomenclature CSV, capture PNG, export/import JSON.
- Sauvegarde locale et lien de configuration (paramètres dans le fragment URL).
- Interface française et mise en page responsive.
- Aucune requête externe nécessaire à l’exécution ; pas de suivi analytique.

## GitHub Pages

Les fichiers sont prêts pour un dépôt de projet classique, par exemple atelier-remorque.
Tous les chemins de ressources sont relatifs : le site fonctionne aussi sous /atelier-remorque/.

1. Créer un dépôt GitHub vide, public si votre abonnement l’exige, nommé atelier-remorque.
2. Depuis WSL, initialiser Git si nécessaire, puis pousser :

       git init -b main
       git add .
       git commit -m "Initialise le configurateur Atelier Remorque"
       git remote add origin git@github.com:VOTRE_COMPTE/atelier-remorque.git
       git push -u origin main

   Si le dépôt local contient déjà un commit ou un remote, ne pas répéter les commandes correspondantes.

3. Dans GitHub, Settings → Pages → Build and deployment :
   choisir Deploy from a branch, puis main et / (root).
4. Le site sera publié à https://VOTRE_COMPTE.github.io/atelier-remorque/.

Le fichier .nojekyll désactive le traitement Jekyll. Il n’y a aucun secret ni variable
d’environnement de production à configurer. La publication GitHub n’a pas été effectuée
automatiquement : aucun dépôt distant n’a encore été choisi ou créé.

Documentation : https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Développement

    npm test

- model.js : validation des paramètres, géométrie nominale et calculs de matériaux.
- scene.js : assemblage paramétrique Three.js, éclairage, matériaux, contrôles et capture.
- app.js : interface, sauvegarde, partage et exports.
- style.css : styles responsive.
- scripts/serve.mjs : serveur local statique sans dépendances.
- tests/model.test.mjs : calculs, bornes, lattes, densités, partage et export CSV.

La version vendue de Three.js est figée à 0.180.0. Pour la mettre à jour,
remplacer ensemble three.module.js, three.core.js et OrbitControls.js depuis
la même version officielle ; conserver sa licence. Aucune dépendance CDN à l’exécution.

## Référence et limites du modèle

Source fabricant consultée le 31 octobre 2026 :
https://wikeinc.com/en-ca/products/wike-highsided-cargo-bike-trailer-diy-kit

La fiche indique des roues de 51 cm / 20 pouces, quatre raccords inférieurs,
quatre supérieurs, deux supports de roues, un timon, deux réflecteurs et
des attaches vélo. Elle suggère des tubes carrés de 1 pouce et un plancher de 9,5 mm.

Les dimensions extérieures de caisse sont des choix de l’utilisateur, hors roues
et timon. Le modèle utilise des tubes de 25,4 mm. Les raccords, roues et timon sont
des représentations simplifiées : aucun fichier CAO ou cote exacte de raccord
n’est fourni par cette fiche.

Les longerons et traverses sont représentés entre les montants. Les dimensions
de pièces indiquées sont les dimensions géométriques nominales du modèle,
sans correction d’emboîtement, tolérance, fixation ni trait de scie.
Les lattes ont un espacement vertical de 20 mm.

La masse estimée comprend seulement les tubes et panneaux :
aluminium 2 700 kg/m³, acier 7 850 kg/m³, contreplaqué 600 kg/m³.
Elle exclut le kit, la visserie et la peinture. Le choix de finition n’ajoute pas de masse.
Aucune résistance, stabilité, capacité de charge ou compatibilité mécanique
d’une configuration particulière n’est validée par le site.

Avant de découper, mesurer les pièces réelles du kit et adapter l’assemblage,
les fixations et les tolérances. Outil indépendant, sans affiliation à Wike.