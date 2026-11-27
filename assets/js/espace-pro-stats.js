/* Espace pro — page de statistiques de l'administrateur.
   Les scans réels viennent du bloc #pro-donnees, écrit par la page protégée (30 derniers jours, par
   magasin). Les inscriptions et les forfaits ne sont pas encore reliés : ils restent à zéro. Le mode « exemple simulé » ne sert qu'à montrer la page. */
(function () {
  'use strict';
  var racine = document.getElementById('pro-stats');
  if (!racine) return;

  var BRUT = {
      'Maxxess': '06 Nice|10 Troyes|13 Aix-en-Provence|13 Aubagne|14 Caen|16 Cognac|17 La Rochelle|26 Valence|29 Brest|31 Toulouse|35 Rennes|36 Châteauroux|38 Grenoble|38 Salaise|42 Saint-Étienne|50 Saint-Lô|51 Reims|54 Nancy|56 Vannes|58 Nevers|59 Lille|62 Arras|63 Clermont-Ferrand|64 Biarritz - Anglet|66 Perpignan|67 Strasbourg|68 Colmar|69 Lyon Dardilly|69 Lyon Vénissieux|73 Chambéry|74 Annecy|76 Le Havre|76 Rouen|78 Mantes|83 Fréjus|83 Toulon|87 Limoges|95 Cergy St Ouen',
      'Moto Axxe': '01 Bourg-en-Bresse|02 Château-Thierry|02 Laon|02 Saint-Quentin|03 Montluçon|03 Yzeure - Moulins|05 Gap|06 Cannes - Mougins|07 Annonay|07 Aubenas|09 Pamiers|11 Carcassonne|11 Narbonne|12 Rodez|13 Gardanne|13 Martigues|13 Salon-de-Provence|14 Caen|14 Lisieux|15 Aurillac|16 Angoulême|17 La Rochelle|17 Royan|18 Bourges|19 Brive|21 Dijon|22 Dinan|22 Saint-Brieuc|23 Guéret|24 Périgueux|25 Besançon|25 Pontarlier|27 Évreux|27 Vernon|30 Alès|32 Auch|33 Arcachon|33 Libourne|33 Podensac|34 Montpellier|35 Rennes|35 Saint-Malo|38 Bourgoin|38 Grenoble|39 Dole - Tavaux|39 Lons-le-Saunier|40 Mont-de-Marsan|42 Roanne|44 Nantes|45 Montargis|45 Orléans|47 Agen|47 Marmande|49 Angers|49 Cholet|50 Cherbourg|50 Granville|51 Châlons-en-Champagne|52 Saint-Dizier|55 Verdun|56 Lorient|56 Pontivy|57 Metz - Augny|59 Valenciennes|60 Beauvais|60 Saint-Maximin|61 Alençon|61 Argentan|61 Flers - La Lande-Patry|64 Pau|66 Perpignan|67 Haguenau|67 Rosheim - Obernai|68 Mulhouse|69 Villefranche-sur-Saône|71 Chalon-sur-Saône|72 Le Mans|73 Chambéry - La Ravoire|73 Pont-de-Beauvoisin|74 Annemasse|74 Thonon|76 Rouen|77 Pontault-Combault|78 Conflans-Sainte-Honorine|79 Niort|82 Montauban|83 Draguignan|83 Fréjus|85 Aizenay|85 Olonne-sur-Mer|86 Poitiers|88 Épinal|89 Sens|90 Belfort|91 Sainte-Geneviève-des-Bois|92 Châtillon'
    };
  var POSITIONS = '80.9,73.7|58.1,31.7|68.4,75.8|69.3,78.0|30.2,23.1|29.0,55.5|23.8,50.9|64.2,62.9|3.7,28.7|40.5,75.3|21.4,32.6|42.7,45.5|69.7,60.3|63.5,59.0|60.7,58.2|25.6,23.5|57.8,22.8|71.5,27.7|14.1,36.4|52.4,43.9|51.7,10.1|50.0,13.2|51.9,55.1|19.8,75.6|50.6,83.7|81.5,28.3|79.2,33.0|63.0,54.7|64.0,55.7|70.9,56.7|72.2,53.6|33.3,20.4|39.5,21.0|43.3,25.3|77.4,76.3|71.9,79.5|39.7,54.5|45.7,24.8|66.1,50.9|53.8,24.8|55.2,20.0|53.1,17.3|48.7,49.9|53.6,47.8|72.4,66.0|79.1,74.7|62.6,60.0|60.8,65.8|41.6,79.7|46.8,79.0|51.3,79.3|48.4,68.4|68.5,76.5|65.6,76.9|65.9,74.8|30.6,22.9|33.9,23.5|47.5,63.0|32.3,56.0|24.2,50.6|24.3,55.9|47.4,43.0|41.4,60.8|64.6,40.7|19.2,29.3|14.7,28.5|43.8,51.4|35.9,60.5|71.0,41.2|73.3,44.3|39.7,24.9|41.8,24.3|58.8,70.4|34.6,74.7|22.9,64.8|29.3,62.7|28.5,65.1|57.4,75.2|21.7,32.9|19.6,27.5|66.5,56.7|70.0,60.6|67.3,43.1|68.1,46.6|27.1,72.1|58.4,52.7|21.7,40.9|49.6,34.5|44.2,35.4|34.9,69.5|31.9,66.7|28.3,38.9|26.0,42.6|22.6,18.5|22.3,25.9|59.9,25.5|63.7,28.4|66.3,23.5|10.3,35.2|13.1,32.5|70.9,24.3|54.5,12.6|45.6,21.2|47.9,23.2|32.8,30.2|32.2,27.3|28.7,27.1|27.8,77.7|50.3,83.4|81.6,26.0|79.7,29.1|79.3,36.1|62.8,53.0|63.5,45.7|33.3,34.2|71.3,56.9|69.2,57.1|72.8,50.9|74.3,49.2|39.1,21.3|48.8,27.1|45.6,25.2|28.4,49.6|39.9,71.3|75.4,75.4|77.1,76.2|21.0,45.4|19.9,47.2|33.8,47.4|73.4,32.5|53.1,32.7|76.3,37.3|47.1,28.6|46.8,27.1'.split('|');
  var FRANCE = 'M581.7,501.8L581.3,510.2L582.3,512.7L583.9,514.3L584.9,516.2L588,538.5L587.8,540.3L583.3,549.9L582.4,552.5L583.1,563.9L582.4,566.9L580.8,570.1L578.3,579.9L575.6,584.5L567.3,579.8L562.5,577.9L560.1,575.6L558.5,574.0L559.2,571.6L561.2,569.2L561.4,567.3L556.3,565.5L553.8,564.3L553.7,561.9L555.1,558.0L554.1,554.8L551.3,555.2L549.0,554.9L548.7,553.2L550.1,551.0L552.1,548.1L551.7,545.2L549.1,544.0L546.7,541.7L545.5,538.5L547.2,536.0L549.8,534.3L547.6,531.1L546.1,531.1L544.9,530.5L545.7,528.8L547.7,526.3L550.4,518.9L554.4,515.3L561.9,512.6L563.9,511.5L565.6,508.9L567.6,507.1L570.0,507.1L572.5,507.8L574.0,508.8L575.1,507.6L575.8,504.4L575.0,501.8L574.7,494.3L575.7,490.0L577.9,489.5L580.1,491.7L580.1,493.8L581.3,498.6ZM486.9,232.1L482.3,235.0L481.4,237.3L479.8,240.4L476.8,241.9L473.9,242.5L471.3,242.2L469.9,241.1L470.0,240.0L468.6,239.1L465.4,239.3L462.2,241.6L459.7,245.1L460.6,246.9L463.2,247.3L463.8,248.0L463.8,249.0L463.0,250.2L462.2,252.3L457.3,258.5L452.3,264.8L451.6,266.6L450.1,268.0L443.6,271.4L442.9,272.8L442.7,278.2L442.2,282.7L437.4,287.0L432.8,291.4L431.6,293.9L430.9,296.9L429.4,300.3L429.2,302.0L431.7,304.8L431.5,307.1L431.0,310.6L428.6,313.1L426.1,314.4L426.2,318.1L427.7,318.6L430.8,318.2L435.3,315.4L438.0,311.8L436.2,308.7L435.9,308.1L436.3,307.2L439.7,303.6L443.7,301.3L449.7,300.7L456.9,301.5L457.6,302.0L457.3,304.2L458.2,307.4L459.6,309.5L458.2,316.0L459.5,317.8L461.7,320.1L463.4,322.2L465.8,324.1L467.9,327.3L468.8,329.2L465.6,332.7L460.4,336.1L459.8,338.0L460.1,340.3L460.7,342.1L463.9,344.2L467.3,349.1L469.7,353.6L474.4,357.9L475.7,359.1L475.4,360.2L474.2,362.2L473.1,368.5L471.3,369.6L469.2,370.1L463.8,375.0L461.3,374.5L457.6,374.8L455.2,376.4L455.5,379.2L457.9,381.8L459.4,384.5L460.1,387.5L462.9,389.6L466.4,390.7L468.5,390.7L469.9,391.4L470.8,392.4L472.6,398.7L471.8,400.3L469.9,401.1L468.9,403.8L466.7,407.8L465.5,411.0L467.1,413.6L467.8,415.5L467.2,417.7L468.4,420.8L471.4,423.9L479.0,428.1L486.2,431.3L488.4,431.8L497.7,429.0L499.3,429.1L500.7,431.8L501.2,433.7L500.3,436.5L498.0,440.6L495.4,443.9L493.9,446.7L494.3,449.1L494.7,452.3L492.5,453.4L492.3,452.7L491.4,452.2L490.6,452.6L490.1,453.3L490.0,454.5L485.3,456.9L482.0,459.2L469.4,472.5L463.4,476.6L462.3,478.9L461.3,483.1L457.9,486.9L454.6,488.7L446.8,490.9L439.0,495.0L435.4,493.5L426.0,494.0L420.1,489.6L408.8,487.0L405.0,480.5L400.0,480.2L396.7,480.5L394.7,479.5L394.1,477.3L394.0,475.1L390.6,476.1L387.9,476.2L386.2,477.2L385.0,478.2L383.5,477.5L382.6,477.8L382.8,479.1L379.5,479.5L376.0,478.8L366.7,475.5L365.4,475.0L359.0,473.8L356.5,472.4L354.3,469.0L352.6,468.0L351.7,467.3L345.9,469.1L343.8,471.8L340.7,475.0L318.8,490.7L314.7,497.1L310.0,506.7L309.7,511.1L311.7,525.3L316.3,532.8L316.9,534.6L314.3,534.6L310.0,533.6L306.5,532.5L303.3,533.1L300.1,534.7L297.1,535.6L295.1,535.9L293.8,536.7L293.1,538.5L293.0,539.8L289.4,539.5L281.2,536.8L273.8,535.0L269.4,536.9L266.6,538.8L264.6,538.5L263.2,536.5L262.2,534.5L259.3,532.8L252.8,530.0L253.2,528.7L254.3,526.9L254.4,525.8L253.0,524.2L247.1,522.3L244.3,521.8L242.5,523.0L241.1,524.5L237.8,518.9L235.6,517.7L231.9,517.4L227.8,515.7L223.6,513.4L213.4,509.8L210.5,509.3L209.4,509.8L208.6,511.8L208.0,517.5L207.5,518.2L202.6,518.3L196.7,517.3L193.9,517.6L191.5,517.5L189.2,515.8L179.0,517.2L177.3,516.3L175.0,513.6L172.2,511.3L170.1,510.3L168.3,508.9L166.6,508.6L164.2,509.7L160.6,510.1L157.8,509.8L156.2,510.0L150.0,503.3L149.2,501.5L145.8,500.9L141.9,500.6L131.9,495.9L127.4,493.4L126.8,492.1L126.9,491.1L126.1,491.2L124.7,493.0L123.8,494.5L122.7,494.7L121.4,494.5L120.1,493.5L119.2,492.3L120.3,490.4L121.9,488.0L122.8,485.2L122.8,482.8L120.3,481.1L116.6,480.2L113.9,479.8L110.4,478.2L108.6,477.1L107.3,474.2L107.2,472.2L114.1,470.9L120.7,464.0L128.0,438.0L133.8,407.2L137.1,401.6L141.0,400.1L138.1,395.7L136.1,397.7L135.3,400.0L134.2,401.1L137.9,372.8L140.0,362.4L143.4,351.7L148.8,356.3L153.2,360.9L155.5,364.9L158.0,377.7L160.0,380.5L163.4,383.3L162.3,380.3L159.9,378.0L157.0,360.9L154.9,356.0L151.5,351.8L140.3,342.7L139.3,341.0L138.9,337.7L142.8,338.0L146.0,339.8L145.7,338.0L144.7,336.0L143.7,329.1L143.2,313.0L143.5,310.2L143.1,306.8L139.4,305.9L136.6,305.5L133.5,304.0L118.4,293.6L113.7,283.6L108.7,276.0L107.6,272.8L107.9,269.6L111.2,263.1L108.9,258.6L106.6,257.7L104.6,255.4L106.8,252.1L108.5,249.9L111.6,249.5L115.8,250.6L119.6,252.8L122.5,253.5L113.9,247.5L99.0,248.4L95.9,247.4L93.3,246.1L92.6,242.0L94.8,240.4L96.8,237.1L94.9,234.7L92.2,233.6L87.8,233.4L83.8,233.8L82.9,232.3L85.5,228.8L83.5,227.2L80.7,227.7L76.6,228.1L72.8,226.7L69.5,222.3L67.1,222.1L65.4,222.4L63.0,220.6L60.4,220.0L58.6,220.4L56.3,217.8L41.6,211.6L35.1,210.5L29.0,212.1L25.7,211.1L23.5,207.7L22.1,202.3L12.8,197.3L15.0,194.8L19.5,194.6L24.7,193.2L26.9,191.1L23.1,188.0L20.2,187.0L19.0,185.9L18.0,183.4L19.9,182.3L21.1,183.1L24.6,183.8L30.9,183.8L28.9,181.1L26.5,180.3L25.5,179.6L20.6,178.8L18.1,179.5L13.1,178.6L12.1,175.8L12,173.4L14.0,168.5L21.6,164.6L40.0,161.2L47.5,162.6L53.1,162.2L59.7,159.6L62.7,157.0L71.9,156.2L80.3,159.7L87.5,171.2L91.1,175.2L100.8,169.5L114.7,170.6L117.4,174.4L118.7,171.4L121.5,168.0L123.4,169.7L124.4,172.0L139.1,172.3L141.4,171.8L137.6,169.0L134.8,162.6L135.5,139.7L131.8,133.1L127.8,122.6L126.0,116.5L126.0,114.4L126.9,111.4L132.5,111.9L136.8,112.9L145.2,111.1L149.1,112.9L148.6,117.6L149.5,123.7L150.8,126.5L152.7,129.9L159.4,130.0L166.6,132.2L175.8,133.0L189.0,136.9L194.8,135.1L200.4,131.3L211.1,128.9L212.0,127.5L206.0,127.9L200.4,125.1L199.8,122.2L200.6,119.7L203.0,114.0L219.3,105.4L230.8,102.9L242.8,98.2L248.9,93.1L253.0,86.4L254.3,85.0L256.0,83.7L254.4,81.3L255.9,55.7L257.2,51.1L259.5,47.3L263.1,44.5L268.4,41.3L287.8,37.1L290.6,35.4L291.0,38.1L292.4,41.7L293.3,43.6L292.5,46.1L293.2,48.2L295.8,51.9L299.1,55.4L301.9,57.7L302.9,57.4L305.0,56.8L308.7,54.5L311.8,53.8L313.5,55.5L314.4,56.5L316.4,60.5L317.0,64.6L317.9,68.0L319.5,69.4L325.3,69.9L329.7,71.2L330.9,72.3L332.4,79.9L333.2,81.0L334.4,80.0L335.4,78.8L336.9,78.6L339.4,79.1L342.8,79.2L346.3,79.9L351.1,84.3L351.0,85.7L350.1,88.2L349.8,90.2L350.6,91.0L351.9,92.9L351.7,95.4L350.4,97.1L350.0,98.5L350.0,99.4L350.4,100.1L351.5,100.7L358.6,101.4L365.1,100.4L369.2,97.9L369.8,95.4L371.0,92.5L373.3,89.9L375.0,89.1L376.6,90.1L374.2,100.3L376.1,102.9L376.5,106.8L377.4,110.2L379.7,110.0L382.5,110.5L384.5,111.8L387.0,113.7L390.4,115.5L392.8,116.1L393.7,117.6L395.8,119.4L398.8,123.0L401.6,125.4L402.9,125.4L405.5,124.3L409.2,123.6L412.2,123.6L413.5,125.4L416.4,126.1L417.4,126.9L418.7,128.1L420.6,128.6L423.0,128.0L424.5,126.1L426.8,125.2L429.1,125.4L430.5,126.4L433.1,127.6L434.4,127.3L437.3,128.1L440.4,130.6L441.6,133.4L442.1,134.9L443.4,136.5L448.4,143.8L450.1,144.1L451.7,142.8L452.7,141.2L454.3,140.8L456.7,141.4L458.4,142.2L459.4,145.4L460.0,146.0L461.0,145.3L463.0,145.0L466.1,145.6L470.3,144.5L473.6,142.9L475.4,142.9L478.5,146.5L481.8,147.7L488.9,148.4L496.6,149.7L499.7,151.0L501.8,151.6L502.4,156.6L501.8,157.4L494.8,167.9L491.9,171.7L490.5,176.9L489.8,184.8L488.0,192.4L485.0,199.7L484.1,205.2L485.2,208.6L485.0,214.2L483.4,221.9L483.3,227.7L484.9,231.4ZM140.6,330.1L138.9,335.0L136.5,330.3L133.2,326.0L132.6,322.3L132.7,321.3L136.7,324.2Z';
  var DONNEES_REELLES = null; // { jours: [30 dates], scans: { identifiant: [30 nombres] } }
  try { DONNEES_REELLES = JSON.parse(document.getElementById('pro-donnees').textContent); } catch (e) { DONNEES_REELLES = null; }
  // Compte partenaire : la page ne montre que son magasin, ou les magasins de son enseigne.
  // Le serveur n'envoie déjà que ses chiffres ; ceci ne règle que l'affichage.
  var PORTEE = DONNEES_REELLES && DONNEES_REELLES.portee ? DONNEES_REELLES.portee : null;
  // Même règle que l'annuaire des comptes : « Maxxess Aix-en-Provence » -> « maxxess-aix-en-provence »
  function identifiant(nom) { return nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  // Chiffre d'affaires : chaque forfait compté est un forfait annuel. Deux valeurs à tenir à jour ici.
  var PRIX_FORFAIT_TTC = 59.99; // euros, TVA comprise
  var TAUX_TVA = 0.20;
  function euros(n) { return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }); }
  function ttc(forfaits) { return forfaits * PRIX_FORFAIT_TTC; }
  function ht(forfaits) { return ttc(forfaits) / (1 + TAUX_TVA); }
  var MESURES = { scans: 'Scans', inscriptions: 'Inscriptions', forfaits: 'Forfaits' };
  var VUES = { toutes: 'Toutes les enseignes', 'Maxxess': 'Maxxess', 'Moto Axxe': 'Moto Axxe' };

  var etat = { vue: 'toutes', mesure: 'scans', tri: 'scans', tout: false, demo: false, donnees: false };
  var magasins = [], jours = {}, fil = [], minuteur = null;

  function nf(n) { return n.toLocaleString('fr-FR'); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function vide() { var a = []; for (var i = 0; i < 30; i++) a.push(0); return a; }

  function charger(demo) {
    var graine = 20261127;
    function alea() { graine = (graine * 1664525 + 1013904223) % 4294967296; return graine / 4294967296; }
    magasins = []; jours = {}; fil = [];
    Object.keys(BRUT).forEach(function (enseigne) {
      jours[enseigne] = { scans: vide(), inscriptions: vide(), forfaits: vide() };
      BRUT[enseigne].split('|').forEach(function (ligne) {
        var p = POSITIONS[magasins.length].split(',');
        var m = { enseigne: enseigne, dept: ligne.slice(0, 2), nom: enseigne + ' ' + ligne.slice(3), x: p[0], y: p[1], scans: 0, inscriptions: 0, forfaits: 0 };
        var reels = !demo && DONNEES_REELLES && DONNEES_REELLES.scans ? DONNEES_REELLES.scans[identifiant(m.nom)] : null;
        if (reels) reels.forEach(function (n, i) { m.scans += n; jours[enseigne].scans[i] += n; });
        if (demo) {
          m.scans = 20 + Math.floor(alea() * 260);
          m.inscriptions = Math.floor(m.scans * (0.18 + alea() * 0.22));
          m.forfaits = Math.floor(m.inscriptions * (0.08 + alea() * 0.2));
          ['scans', 'inscriptions', 'forfaits'].forEach(function (k) {
            for (var i = 0; i < m[k]; i++) jours[enseigne][k][Math.min(29, Math.floor(30 * Math.sqrt(alea())))] += 1;
          });
        }
        magasins.push(m);
      });
    });
    if (PORTEE) {
      etat.vue = PORTEE.enseigne;
      magasins = magasins.filter(function (m) { return PORTEE.type === 'magasin' ? identifiant(m.nom) === PORTEE.id : m.enseigne === PORTEE.enseigne; });
    }
    if (minuteur) { clearInterval(minuteur); minuteur = null; }
    if (demo) minuteur = setInterval(evenement, 1600);
  }

  function evenement() {
    var m = magasins[Math.floor(Math.random() * magasins.length)], t = Math.random(), quoi = 'Scan', j = jours[m.enseigne];
    m.scans += 1; j.scans[29] += 1;
    if (t < 0.3) { m.inscriptions += 1; j.inscriptions[29] += 1; quoi = 'Inscription'; }
    if (t < 0.07) { m.forfaits += 1; j.forfaits[29] += 1; quoi = 'Forfait'; }
    fil.unshift({ heure: new Date().toLocaleTimeString('fr-FR'), quoi: quoi, ou: m.nom, enseigne: m.enseigne });
    fil = fil.slice(0, 40);
    rendre();
  }

  function vus() { return etat.vue === 'toutes' ? magasins : magasins.filter(function (m) { return m.enseigne === etat.vue; }); }
  function somme(l, k) { return l.reduce(function (a, m) { return a + m[k]; }, 0); }
  function pct(a, b) { return b === 0 ? '0 %' : (Math.round((a / b) * 1000) / 10).toLocaleString('fr-FR') + ' %'; }
  function boutons(groupe, valeurs, actif) {
    return Object.keys(valeurs).map(function (k) {
      return '<button type="button" class="ps-choix" data-groupe="' + groupe + '" data-valeur="' + esc(k) + '" aria-pressed="' + (k === actif) + '">' + esc(valeurs[k]) + '</button>';
    }).join('');
  }

  function serieDuJour() {
    var noms = etat.vue === 'toutes' ? Object.keys(BRUT) : [etat.vue], s = [];
    for (var i = 0; i < 30; i++) s.push(noms.reduce(function (a, e) { return a + jours[e][etat.mesure][i]; }, 0));
    return s;
  }
  function dateDe(i) { var d = new Date(); d.setDate(d.getDate() - (29 - i)); return d; }
  function court(i) { return i === 29 ? "Aujourd'hui" : dateDe(i).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
  function long(i) { return i === 29 ? "Aujourd'hui" : dateDe(i).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
  var geo = { px: function (i) { return Math.round((56 + i * (904 / 29)) * 10) / 10; } };

  function serieDe(k) {
    var noms = etat.vue === 'toutes' ? Object.keys(BRUT) : [etat.vue], s = [];
    for (var i = 0; i < 30; i++) s.push(noms.reduce(function (a, e) { return a + jours[e][k][i]; }, 0));
    return s;
  }
  function etincelle(k) {
    var s = serieDe(k), max = Math.max(1, Math.max.apply(null, s));
    var pts = s.map(function (v, i) { return (Math.round((i * (120 / 29)) * 10) / 10) + ',' + (Math.round((30 - (v / max) * 26) * 10) / 10); }).join(' ');
    return '<svg class="ps-etincelle" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts + '"/></svg>';
  }
  function anneau(a, b) {
    var t = b === 0 ? 0 : Math.min(1, a / b), c = 2 * Math.PI * 18;
    return '<svg class="ps-anneau" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18"/><circle class="ps-anneau-val" cx="22" cy="22" r="18" stroke-dasharray="' + (Math.round(t * c * 10) / 10) + ' ' + (Math.round(c * 10) / 10) + '" transform="rotate(-90 22 22)"/></svg>';
  }
  function heure() { return new Date().toLocaleTimeString('fr-FR'); }

  function graphique() {
    var s = serieDuJour(), max = Math.max(3, Math.max.apply(null, s));
    var puissance = Math.pow(10, Math.floor(Math.log10(max / 3)));
    var pas = [1, 2, 2.5, 5, 10].map(function (f) { return f * puissance; }).filter(function (p) { return p * 3 >= max; })[0];
    var haut = pas * 3;
    geo.serie = s; geo.py = function (v) { return Math.round((260 - (v / haut) * 240) * 10) / 10; };
    var pts = s.map(function (v, i) { return geo.px(i) + ',' + geo.py(v); }).join(' ');
    var desc = MESURES[etat.mesure] + ' par jour sur les 30 derniers jours. Aujourd’hui : ' + nf(s[29]) + '.';
    return '<div class="ps-graphe" tabindex="0" role="group" aria-label="' + esc(desc) + ' Flèches gauche et droite pour lire chaque jour.">' +
      '<svg viewBox="0 0 1000 300" role="img" aria-label="' + esc(desc) + '">' +
      [20, 100, 180].map(function (y) { return '<line x1="56" y1="' + y + '" x2="960" y2="' + y + '" class="ps-grille"/>'; }).join('') +
      '<line x1="56" y1="260" x2="960" y2="260" class="ps-axe"/>' +
      '<text x="46" y="24" text-anchor="end">' + nf(haut) + '</text><text x="46" y="104" text-anchor="end">' + nf(pas * 2) + '</text><text x="46" y="184" text-anchor="end">' + nf(pas) + '</text><text x="46" y="264" text-anchor="end">0</text>' +
      '<text x="56" y="286">' + esc(court(0)) + '</text><text x="357" y="286" text-anchor="middle">' + esc(court(10)) + '</text><text x="659" y="286" text-anchor="middle">' + esc(court(20)) + '</text><text x="960" y="286" text-anchor="end">Aujourd’hui</text>' +
      '<defs><linearGradient id="ps-degrade" x1="0" y1="0" x2="0" y2="1"><stop class="ps-stop-haut" offset="0"/><stop class="ps-stop-bas" offset="1"/></linearGradient></defs>' +
      '<path class="ps-aire" fill="url(#ps-degrade)" d="M56,260 L' + pts.split(' ').join(' L') + ' L960,260 Z"/>' +
      '<polyline class="ps-courbe" points="' + pts + '"/>' +
      '<line class="ps-repere" x1="0" y1="20" x2="0" y2="260" opacity="0"/><circle class="ps-point ps-point-survol" r="5" cx="0" cy="0" opacity="0"/>' +
      '<circle class="ps-onde" r="5" cx="960" cy="' + geo.py(s[29]) + '"/><circle class="ps-point" r="5" cx="960" cy="' + geo.py(s[29]) + '"/>' +
      '<text class="ps-fin" x="952" y="' + Math.max(16, geo.py(s[29]) - 12) + '" text-anchor="end">' + nf(s[29]) + '</text>' +
      '</svg><div class="ps-bulle" role="status" hidden></div></div>' +
      '<button type="button" class="ps-lien" data-action="donnees" aria-expanded="' + etat.donnees + '">' + (etat.donnees ? 'Masquer les données' : 'Voir les données du graphique') + '</button>' +
      (etat.donnees ? '<ul class="ps-donnees">' + s.map(function (v, i) { return '<li><span>' + esc(court(i)) + '</span><strong>' + nf(v) + '</strong></li>'; }).join('') + '</ul>' : '');
  }

  function carte(liste) {
    var tri = liste.slice().sort(function (a, b) { return b[etat.mesure] - a[etat.mesure] || a.nom.localeCompare(b.nom); });
    var max = Math.max(1, tri[0][etat.mesure]), aDesDonnees = tri[0][etat.mesure] > 0, cinq = aDesDonnees ? tri.slice(0, 5) : [];
    var points = liste.map(function (m) {
      var r = cinq.indexOf(m) + 1, d = r ? 24 : Math.round(7 + 11 * Math.sqrt(m[etat.mesure] / max));
      return '<span class="ps-zone" style="left:' + m.x + '%;top:' + m.y + '%;width:' + Math.max(d, 20) + 'px;height:' + Math.max(d, 20) + 'px;z-index:' + (r ? 5 : 1) + '" data-magasin="' + magasins.indexOf(m) + '">' +
        '<span class="ps-marque ' + (m.enseigne === 'Maxxess' ? 'ps-rond' : 'ps-carre') + (r ? ' ps-brille' : '') + '" style="width:' + d + 'px;height:' + d + 'px">' + (r || '') + '</span></span>';
    }).join('');
    var podium = cinq.length ? '<ol class="ps-podium">' + cinq.map(function (m, i) {
      var autres = Object.keys(MESURES).filter(function (k) { return k !== etat.mesure; });
      return '<li><span aria-hidden="true" class="ps-marque ps-brille ' + (m.enseigne === 'Maxxess' ? 'ps-rond' : 'ps-carre') + '" style="width:28px;height:28px">' + (i + 1) + '</span>' +
        '<span class="ps-qui"><strong>' + esc(m.nom) + '</strong><small>' + nf(m[autres[0]]) + ' ' + autres[0] + ' · ' + nf(m[autres[1]]) + ' ' + autres[1] + '</small></span>' +
        '<span class="ps-lueur">' + nf(m[etat.mesure]) + '</span></li>';
    }).join('') + '</ol>' : '<p class="ps-vide">Aucun magasin n’a encore de ' + MESURES[etat.mesure].toLowerCase() + '. Le classement apparaîtra avec les premières données.</p>';
    return '<div class="ps-carte-rang"><div class="ps-carte" role="img" aria-label="Carte de France des ' + liste.length + ' magasins. Le détail figure dans le classement plus bas.">' +
      '<span class="ps-radar" aria-hidden="true"></span><svg viewBox="0 0 600 620" aria-hidden="true"><path d="' + FRANCE + '"/></svg>' + points + '<div class="ps-bulle" role="status" hidden></div></div>' +
      '<div class="ps-cote"><h3>Les cinq plus gros magasins</h3>' + podium + '</div></div>';
  }

  function parEnseigne() {
    var noms = etat.vue === 'toutes' ? Object.keys(BRUT) : [etat.vue];
    var lignes = noms.map(function (e) {
      var l = magasins.filter(function (m) { return m.enseigne === e; });
      return { nom: e, magasins: l.length, forfaits: somme(l, 'forfaits') };
    });
    if (lignes.length > 1) lignes.push({ nom: 'Total', magasins: somme(lignes, 'magasins'), forfaits: somme(lignes, 'forfaits'), total: true });
    return '<div class="ps-entete-ca"><span>Enseigne</span><span>Magasins</span><span>Forfaits</span><span>CA TTC</span><span>CA HT</span></div><ul class="ps-table-ca">' +
      lignes.map(function (r) {
        return '<li' + (r.total ? ' class="ps-total"' : '') + '><span class="ps-nom">' + esc(r.nom) + '</span><span>' + nf(r.magasins) + '</span><span>' + nf(r.forfaits) + '</span><span>' + euros(ttc(r.forfaits)) + '</span><span>' + euros(ht(r.forfaits)) + '</span></li>';
      }).join('') + '</ul>';
  }

  function tableau(liste) {
    var tri = liste.slice().sort(function (a, b) { return b[etat.tri] - a[etat.tri] || a.nom.localeCompare(b.nom); });
    var max = Math.max(1, tri[0][etat.tri]);
    return '<div class="ps-entete-table"><span>Dép.</span><span>Magasin</span><span aria-hidden="true"></span><span>Scans</span><span>Inscr.</span><span>Forfaits</span><span>CA TTC</span><span>CA HT</span></div><ul class="ps-table">' +
      (etat.tout ? tri : tri.slice(0, 15)).map(function (m) {
        return '<li><span class="ps-dept">' + m.dept + '</span><span class="ps-nom">' + esc(m.nom) + '</span><span class="ps-barre" aria-hidden="true"><span style="width:' + Math.round((m[etat.tri] / max) * 100) + '%"></span></span><span>' + nf(m.scans) + '</span><span>' + nf(m.inscriptions) + '</span><span>' + nf(m.forfaits) + '</span><span>' + euros(ttc(m.forfaits)) + '</span><span>' + euros(ht(m.forfaits)) + '</span></li>';
      }).join('') + '</ul><button type="button" class="ps-lien" data-action="tout">' + (etat.tout ? 'Afficher les 15 premiers' : 'Afficher les ' + liste.length + ' magasins') + '</button>';
  }

  function rendre() {
    var cle = document.activeElement && racine.contains(document.activeElement) ? document.activeElement.getAttribute('data-cle') : null;
    var l = vus(), sc = somme(l, 'scans'), ins = somme(l, 'inscriptions'), fo = somme(l, 'forfaits');
    if (PORTEE) { rendrePartenaire(l, sc, ins, fo); return apresRendu(cle); }
    var filVu = fil.filter(function (f) { return etat.vue === 'toutes' || f.enseigne === etat.vue; }).slice(0, 6);
    racine.innerHTML =
      '<div class="ps-tete"><div><span class="kicker">Administration IzenRide</span><h1>Statistiques</h1>' +
      '<p class="lede">' + l.length + ' magasins' + (etat.vue === 'toutes' ? ', 2 enseignes' : ' ' + esc(etat.vue)) + ' · 30 derniers jours</p></div>' +
      '<button type="button" class="ps-lien" data-action="demo">' + (etat.demo ? 'Revenir aux données réelles' : 'Afficher un exemple simulé') + '</button></div>' +
      '<div class="ps-etat" role="status"><span class="ps-voyant' + (etat.demo || DONNEES_REELLES ? ' ps-voyant-actif' : '') + '">' + (etat.demo ? 'Simulation active' : (DONNEES_REELLES ? 'Scans comptés' : 'Suivi non relié')) + '</span><span>' + l.length + ' magasins suivis</span><span>Heure locale <b class="ps-horloge">' + heure() + '</b></span></div>' +
      (etat.demo
        ? '<p class="ps-note ps-note-demo"><strong>Exemple simulé.</strong> Ces chiffres sont générés par la page pour montrer son fonctionnement. Ce ne sont pas vos données.</p>'
        : (DONNEES_REELLES
          ? '<p class="ps-note"><strong>Les scans sont comptés.</strong> Chaque ouverture d’un QR code valide est ajoutée au magasin concerné ; rechargez la page pour actualiser. Les inscriptions et les forfaits ne sont pas encore reliés : ils restent à zéro, comme le chiffre d’affaires.</p>'
          : '<p class="ps-note"><strong>Aucune donnée pour l’instant.</strong> Le suivi des scans, des inscriptions et des forfaits n’est pas encore relié à cette page : les compteurs restent à zéro.</p>')) +
      '<div class="ps-groupe" role="group" aria-label="Enseigne affichée">' + boutons('vue', VUES, etat.vue) + '</div>' +
      '<div class="ps-tuiles">' +
      '<div class="ps-tuile"><span class="ps-etq">Scans de QR code</span><b>' + nf(sc) + '</b><small>sur les 30 derniers jours</small>' + etincelle('scans') + '</div>' +
      '<div class="ps-tuile"><span class="ps-etq">Inscriptions</span><b>' + nf(ins) + '</b><small>' + pct(ins, sc) + ' des scans</small>' + etincelle('inscriptions') + anneau(ins, sc) + '</div>' +
      '<div class="ps-tuile"><span class="ps-etq">Forfaits Premium</span><b>' + nf(fo) + '</b><small>' + pct(fo, ins) + ' des inscriptions</small>' + etincelle('forfaits') + anneau(fo, ins) + '</div></div>' +
      '<div class="ps-tuiles ps-tuiles-ca">' +
      '<div class="ps-tuile"><span class="ps-etq">Chiffre d’affaires TTC</span><b>' + euros(ttc(fo)) + '</b><small>' + nf(fo) + ' forfaits × ' + euros(PRIX_FORFAIT_TTC) + '</small></div>' +
      '<div class="ps-tuile"><span class="ps-etq">Chiffre d’affaires HT</span><b>' + euros(ht(fo)) + '</b><small>dont TVA à ' + (TAUX_TVA * 100).toLocaleString('fr-FR') + ' % : ' + euros(ttc(fo) - ht(fo)) + '</small></div></div>' +
      '<section class="ps-bloc"><div class="ps-titre"><h2>Chiffre d’affaires par enseigne</h2><p class="ps-legende"><span>Base : forfait annuel à ' + euros(PRIX_FORFAIT_TTC) + ' TTC, TVA ' + (TAUX_TVA * 100).toLocaleString('fr-FR') + ' %</span></p></div>' + parEnseigne() + '</section>' +
      '<section class="ps-bloc"><div class="ps-titre"><h2>' + MESURES[etat.mesure] + ' par jour</h2><div class="ps-groupe" role="group" aria-label="Mesure affichée">' + boutons('mesure', MESURES, etat.mesure) + '</div></div>' + graphique() + '</section>' +
      '<section class="ps-bloc"><div class="ps-titre"><h2>Carte des magasins</h2><p class="ps-legende"><span><i class="ps-marque ps-rond"></i>Maxxess (rond plein)</span><span><i class="ps-marque ps-carre"></i>Moto Axxe (carré évidé)</span></p></div>' + carte(l) + '</section>' +
      (etat.demo ? '<section class="ps-bloc"><h2>En direct</h2>' + (filVu.length ? '<ul class="ps-fil">' + filVu.map(function (f) { return '<li><span>' + esc(f.heure) + '</span><em>' + esc(f.quoi) + '</em><strong>' + esc(f.ou) + '</strong></li>'; }).join('') + '</ul>' : '<p class="ps-vide">Les prochains événements s’afficheront ici.</p>') + '</section>' : '') +
      '<section class="ps-bloc"><div class="ps-titre"><h2>Par magasin</h2><div class="ps-groupe" role="group" aria-label="Classer par">' + boutons('tri', MESURES, etat.tri) + '</div></div>' + tableau(l) + '</section>';
    apresRendu(cle);
  }

  // Vue d'un magasin (ses chiffres seuls) ou d'une maison mère (ses magasins) : pas de chiffre d'affaires.
  function rendrePartenaire(l, sc, ins, fo) {
    var seul = PORTEE.type === 'magasin';
    racine.innerHTML =
      '<div class="ps-tete"><div><h2>Vos chiffres</h2>' +
      '<p class="lede">' + (seul ? esc(l[0] ? l[0].nom : '') : l.length + ' magasins ' + esc(PORTEE.enseigne)) + ' · 30 derniers jours</p></div></div>' +
      '<p class="ps-note"><strong>' + (seul ? 'Les scans de votre QR code sont comptés.' : 'Les scans des QR codes de vos magasins sont comptés.') + '</strong> Rechargez la page pour actualiser. Les inscriptions et les forfaits ne sont pas encore reliés : ils restent à zéro.</p>' +
      '<div class="ps-tuiles">' +
      '<div class="ps-tuile"><span class="ps-etq">Scans de QR code</span><b>' + nf(sc) + '</b><small>sur les 30 derniers jours</small>' + etincelle('scans') + '</div>' +
      '<div class="ps-tuile"><span class="ps-etq">Inscriptions</span><b>' + nf(ins) + '</b><small>' + pct(ins, sc) + ' des scans</small>' + etincelle('inscriptions') + anneau(ins, sc) + '</div>' +
      '<div class="ps-tuile"><span class="ps-etq">Forfaits Premium</span><b>' + nf(fo) + '</b><small>' + pct(fo, ins) + ' des inscriptions</small>' + etincelle('forfaits') + anneau(fo, ins) + '</div></div>' +
      '<section class="ps-bloc"><div class="ps-titre"><h2>' + MESURES[etat.mesure] + ' par jour</h2><div class="ps-groupe" role="group" aria-label="Mesure affichée">' + boutons('mesure', MESURES, etat.mesure) + '</div></div>' + graphique() + '</section>' +
      (seul ? '' :
        '<section class="ps-bloc"><div class="ps-titre"><h2>Carte de vos magasins</h2></div>' + carte(l) + '</section>' +
        '<section class="ps-bloc"><div class="ps-titre"><h2>Par magasin</h2><div class="ps-groupe" role="group" aria-label="Classer par">' + boutons('tri', MESURES, etat.tri) + '</div></div>' + tableau(l) + '</section>');
  }

  function apresRendu(cle) {
    var n = 0;
    racine.querySelectorAll('button').forEach(function (b) { b.setAttribute('data-cle', 'b' + (n++)); });
    if (cle) { var e = racine.querySelector('[data-cle="' + cle + '"]'); if (e) e.focus(); }
  }

  racine.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    var g = b.getAttribute('data-groupe'), a = b.getAttribute('data-action');
    if (g) { etat[g] = b.getAttribute('data-valeur'); if (g === 'vue') etat.tout = false; }
    else if (a === 'tout') etat.tout = !etat.tout;
    else if (a === 'donnees') etat.donnees = !etat.donnees;
    else if (a === 'demo') { etat.demo = !etat.demo; charger(etat.demo); }
    else return;
    rendre();
  });

  function montrerJour(zone, i) {
    var x = geo.px(i), y = geo.py(geo.serie[i]), rep = zone.querySelector('.ps-repere'), pt = zone.querySelector('.ps-point-survol'), bulle = zone.querySelector('.ps-bulle');
    rep.setAttribute('x1', x); rep.setAttribute('x2', x); rep.setAttribute('opacity', 1);
    pt.setAttribute('cx', x); pt.setAttribute('cy', y); pt.setAttribute('opacity', 1);
    bulle.hidden = false; bulle.textContent = long(i) + ' : ' + nf(geo.serie[i]) + ' ' + MESURES[etat.mesure].toLowerCase();
    bulle.style.left = (x / 10) + '%'; bulle.style.top = '0'; bulle.style.transform = i > 22 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)';
    zone.setAttribute('data-jour', i);
  }
  racine.addEventListener('pointermove', function (ev) {
    var zone = ev.target.closest('.ps-graphe');
    if (zone) {
      var r = zone.querySelector('svg').getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * 1000;
      montrerJour(zone, Math.max(0, Math.min(29, Math.round((x - 56) / (904 / 29)))));
      return;
    }
    var z = ev.target.closest('.ps-zone'), carteEl = racine.querySelector('.ps-carte'), bulle = carteEl && carteEl.querySelector('.ps-bulle');
    if (!bulle) return;
    if (!z) { bulle.hidden = true; return; }
    var m = magasins[Number(z.getAttribute('data-magasin'))];
    bulle.hidden = false; bulle.textContent = m.nom + ' : ' + nf(m.scans) + ' scans, ' + nf(m.inscriptions) + ' inscriptions, ' + nf(m.forfaits) + ' forfaits';
    bulle.style.left = m.x + '%'; bulle.style.top = m.y + '%'; bulle.style.transform = 'translate(' + (Number(m.x) > 55 ? '-100%' : '0') + ', -130%)';
  });
  racine.addEventListener('keydown', function (ev) {
    var zone = ev.target.closest && ev.target.closest('.ps-graphe');
    if (!zone || (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight')) return;
    ev.preventDefault();
    var i = zone.hasAttribute('data-jour') ? Number(zone.getAttribute('data-jour')) : 29;
    montrerJour(zone, Math.max(0, Math.min(29, i + (ev.key === 'ArrowRight' ? 1 : -1))));
  });

  charger(false);
  rendre();
  setInterval(function () { var h = racine.querySelector('.ps-horloge'); if (h) h.textContent = heure(); }, 1000);
})();
