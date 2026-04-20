class Produs {
    constructor(id, nume, cantitate) {
        this.id = id;
        this.nume = nume;
        this.cantitate = cantitate;
    }
}

class Stocare {
    salveaza(produs) {}
    incarca(callback) {}
}

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
        request.onsuccess = function(e) { callback(e.target.result); };
    }
}

var worker = new Worker('js/worker.js');

// worker primeste UN singur produs, il trimite inapoi confirmat
// worker.onmessage nu mai salveaza, doar afiseaza - salvarea s-a facut deja in adaugaProdus
worker.onmessage = function(e) {
    storareActiva.incarca(afiseazaProduse); // doar reafiseaza
};

var storareActiva = new StorareLocalStorage();

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

function adaugaProdus() {
    var nume = document.getElementById('nume-produs').value;
    var cantitate = document.getElementById('cantitate-produs').value;

    if (!nume || !cantitate) {
        alert('Completează numele și cantitatea!');
        return;
    }

    var produs = new Produs(Date.now(), nume, cantitate);

    // salvam INAINTE sa trimitem la worker
    storareActiva.salveaza(produs);

    // notificam worker-ul cu UN singur produs
    worker.postMessage(produs);

    document.getElementById('nume-produs').value = '';
    document.getElementById('cantitate-produs').value = '';
}

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

// la incarcare afisam ce e salvat
storareActiva.incarca(afiseazaProduse);