# Fidélité des composants du kit Wike Highsided

Recherche du 31 octobre 2026.

## Priorité confirmée par l’utilisateur

Les pièces fournies dans le kit doivent correspondre au produit réel.
L’utilisateur possède déjà le kit.
La vue mobile n’est pas prioritaire : ne pas poursuivre son optimisation pour le moment.
Le projet reste dans /home/crazynix/local-workspace/atelier-remorque.

Les petits blocs de raccord et les supports simplifiés actuellement dans scene.js
sont provisoires et ne constituent pas une reproduction du kit Wike.
Les calculs de coupe de model.js utilisent également un assemblage générique.
Ne pas les considérer comme validés pour la fabrication.

## Sources officielles

Kit :
https://wikeinc.com/en-ca/products/wike-highsided-cargo-bike-trailer-diy-kit

Raccord de coin Highsided (photo WP-027_CC.jpg) :
https://wikeinc.com/products/diy-high-sided-kit-corner-connector

Brackets Highsided vendus par deux (photo WP-039_CC.jpg) :
https://wikeinc.com/products/diy-highside-corner-kit-2pack-of-brackets

Support de roue (photo WP-029_CC.jpg) :
https://wikeinc.com/products/trailer-wheel-connector

Manuels :
https://wikeinc.com/en-ca/pages/product-manuals

Contact fabricant :
https://wikeinc.com/en-ca/pages/contact
customerservice@wikeinc.com

Ces pages fournissent des photos et descriptions. Aucun téléchargement STEP, STL
ou GLB du kit exact n’a été identifié sur les pages consultées.
La recherche de modèles publics sur le Web, notamment via des recherches ciblant
GrabCAD, Printables et Thingiverse, n’a pas fait ressortir de modèle correspondant
de façon vérifiable. Ce résultat ne prouve pas qu’aucun fichier existe.

## Piste indépendante : un véritable modèle 3D publié

Auteur : Sahib Virdee
Projet SARIT Trailer Hitch :
https://sahibvirdee.com/professional/yorku/research/sarit/trailer-hitch

Le texte indique que l’auteur a mesuré une remorque Wike et réalisé son modèle
SolidWorks, faute de CAO fabricant disponible pour son projet.
La page affiche effectivement trois visualiseurs 3D.

Le visualiseur avec la remorque charge ce fichier GLB :
https://sahibvirdee.com/assets/sarit-trailer-hitch-light-duty-v3-with-trailer.glb?v=4.387

Source vérifiée dans l’attribut src du model-viewer, avec rendu visible dans le
navigateur. Le fichier représente un ensemble remorque + adaptation d’attelage
SARIT, et non une bibliothèque identifiée de composants du kit WCT-DIYH.

Points non établis :
- correspondance des raccords avec la version du kit détenue par l’utilisateur ;
- exactitude dimensionnelle des composants individuels ;
- possibilité d’extraire des pièces distinctes ;
- autorisation de redistribution dans un dépôt GitHub public.

Le GLB n’a pas été téléchargé dans le projet, copié ni intégré.
Il s’agit d’une piste documentaire, pas d’une géométrie approuvée.

## Démarche de remplacement

1. Identifier les raccords réels du kit détenu par l’utilisateur et comparer
   leurs formes aux photos officielles.
2. Demander éventuellement à Wike les STEP/STL/GLB ou dessins cotés des raccords
   inférieurs, supérieurs, supports de roue et du timon.
3. À défaut, modéliser à partir de mesures réelles, en commençant par un
   raccord inférieur et un supérieur.
4. Relever les dimensions hors tout, sections et profondeurs des logements,
   axes des tubes et positions des perçages. Une photo seule ne valide pas les cotes.
5. Construire chaque composant à taille fixe et positionner les tubes par rapport
   à ses points d’assemblage. Seules les longueurs choisies par l’utilisateur varient.
6. Recalculer la nomenclature avec les emboîtements mesurés.
7. Valider les pièces une à une avant de présenter la remorque comme fidèle.

## Brouillon de demande au fabricant — non envoyé

Subject: CAD files or dimensioned drawings for WCT-DIYH Highsided DIY kit

Hello,

I own a Wike Highsided Cargo Bike Trailer DIY Kit (WCT-DIYH). I am creating a
browser-based configurator to visualize frame tubing and panel choices using
the actual supplied components.

Do you have STEP, STL, GLB files or dimensioned drawings for the lower corner
connectors, upper brackets, wheel brackets and tow bar? Socket insertion depths,
tube centerline offsets and mounting-hole positions would be particularly useful.

Could you also confirm whether simplified visual models of these components may
be included, with attribution, in a publicly accessible configurator and its
GitHub repository?

Thank you.