// Worker-ul primeste lista de produse de la cumparaturi.js
// Afiseaza un mesaj in consola si trimite lista inapoi
onmessage = function(e) {
    var produse = e.data;
    console.log('[Worker] Primit ' + produse.length + ' produse.');
    // Trimitem lista inapoi la scriptul principal
    postMessage(produse);
};