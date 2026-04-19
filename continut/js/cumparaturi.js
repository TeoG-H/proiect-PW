// ── Clasa de baza ──
class Stocare {
    salveaza(produs) {}
    incarca(callback) {}
}

// ── Clasa pentru localStorage ──
class StorareLocalStorage extends Stocare {
    salveaza(produs) {
        var produse = JSON.parse(localStorage.getItem('cumparaturi') || '[]');
        produse.push(produs);
        localStorage.setItem('cumparaturi', JSON.stringify(produse));
    }

    incarca(callback) {
        var produse = JSON.parse(localStorage.getItem('cumparaturi') || '[]');
        callback(produse);
    }
}

// ── Clasa pentru IndexedDB ──
class StorareIndexedDB extends Stocare {
    constructor() {
        super();
        this.db = null;
        var request = indexedDB.open('cumparaturi_db', 1);

        request.onupgradeneeded = function(e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('produse')) {
                db.createObjectStore('produse', { keyPath: 'id' });
            }
        };

        request.onsuccess = (e) => {
            this.db = e.target.result;
            // reincarcam tabelul dupa ce db e gata
            this.incarca(afiseazaProduse);
        };
    }

    salveaza(produs) {
        var tx = this.db.transaction('produse', 'readwrite');
        tx.objectStore('produse').add(produs);
    }

    incarca(callback) {
        if (!this.db) return;
        var tx = this.db.transaction('produse', 'readonly');
        var request = tx.objectStore('produse').getAll();
        request.onsuccess = function(e) {
            callback(e.target.result);
        };
    }
}

// ── Worker ──
var worker = new Worker('js/worker.js');

// Cand worker-ul trimite mesaj inapoi, adaugam linia in tabel
worker.onmessage = function(e) {
    afiseazaProduse(e.data);
};

// ── Stocare activa (implicit localStorage) ──
var storareActiva = new StorareLocalStorage();

// Cand se schimba selectul, schimbam si stocare
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'tip-stocare') {
        if (e.target.value === 'indexedDB') {
            storareActiva = new StorareIndexedDB();
        } else {
            storareActiva = new StorareLocalStorage();
            storareActiva.incarca(afiseazaProduse);
        }
    }
});

// ── Functia principala ──
function adaugaProdus() {
    var nume     = document.getElementById('nume-produs').value;
    var cantitate = document.getElementById('cantitate-produs').value;

    if (!nume || !cantitate) {
        alert('Completează numele și cantitatea!');
        return;
    }

    // Cream obiectul Produs cu clasa
    var produs = new Produs(Date.now(), nume, cantitate);

    // Salvam in stocare
    storareActiva.salveaza(produs);

    // Notificam worker-ul
    storareActiva.incarca(function(produse) {
        worker.postMessage(produse);
    });

    // Golim inputurile
    document.getElementById('nume-produs').value = '';
    document.getElementById('cantitate-produs').value = '';
}

// ── Clasa Produs ──
function Produs(id, nume, cantitate) {
    this.id       = id;
    this.nume     = nume;
    this.cantitate = cantitate;
}

// ── Afiseaza produsele in tabel ──
function afiseazaProduse(produse) {
    var tbody = document.getElementById('lista-produse');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (var i = 0; i < produse.length; i++) {
        var rand = '<tr>';
        rand += '<td>' + (i + 1) + '</td>';
        rand += '<td>' + produse[i].nume + '</td>';
        rand += '<td>' + produse[i].cantitate + '</td>';
        rand += '</tr>';
        tbody.innerHTML += rand;
    }
}

// La incarcare, afisam ce e deja salvat
storareActiva.incarca(afiseazaProduse);