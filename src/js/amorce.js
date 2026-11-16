// Chargé avant l'affichage : signale que JavaScript est disponible,
// pour que la page s'affiche directement dans son état final (aucun décalage).
document.documentElement.classList.add('js');
// Page Manifestations ouverte directement sur « Passées » : le filtre est appliqué avant l'affichage.
if (/[?&]filtre=passees(&|$)/.test(location.search)) document.documentElement.setAttribute('data-filtre', 'passees');
