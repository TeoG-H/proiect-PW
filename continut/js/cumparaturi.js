class Produs {
    constructor(id, nume, cantitate) {
        this.id = id;
        this.nume = nume;
        this.cantitate = cantitate;
    }
}

//clasa de baza
class Stocare {
    salveaza(produs) {}
    incarca(callback) {}
}


class StocareLocalStorage extends Stocare {
    salveaza(produs) {
        let produse = JSON.parse(localStorage.getItem('cumparaturi') || '[]');// ia din local itemul de la cheia cumparaturi care arata ceva de genul'[{"id":1,"nume":"Heineken","cantitate":"6 buc"}]'  si || [] in caz de e gol   JSON.parse il trans in obiect JAVA
        produse.push(produs); //adauga la sfarsit 
        localStorage.setItem('cumparaturi', JSON.stringify(produse)); //pune inapoi in local 
    }
    incarca(callback) {
        let produse = JSON.parse(localStorage.getItem('cumparaturi') || '[]');
        callback(produse);
    }
}

class StocareIndexedDB extends Stocare {
    constructor() {
        super();
        this.db = null;
        // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
        let request = indexedDB.open('cumparaturi_db', 1);// se incearca deschidere bazei de date, cu versiunea 1
        request.onupgradeneeded = function(e) { // ce se intampla cand bd trebuie creata sau actualizata 
            let db = e.target.result;  // din eveniment extrag bd 
            if (!db.objectStoreNames.contains('produse')) {
                //daca nu e creatobjectStor, il creez
                db.createObjectStore('produse', { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => {
            this.db = e.target.result;
            this.incarca(afiseazaProduse);
        };
    }
    salveaza(produs) {
        let tx = this.db.transaction('produse', 'readwrite');
        tx.objectStore('produse').add(produs);
    }
    incarca(callback) {
        if (!this.db) return;
        let tx = this.db.transaction('produse', 'readonly');
        let request = tx.objectStore('produse').getAll();
        request.onsuccess = function(e) { callback(e.target.result); };
    }
}

let worker = new Worker('js/worker.js'); // ruleaza in paralele cu scriptul principal



worker.onmessage = function(e) {
    stocareActiva.incarca(afiseazaProduse); // doar reafiseaza
};

var stocareActiva = new StocareLocalStorage(); // implicit e asta, ca e si prima in select in html

//ascult pagina daca vine un eveniment de tip change de la tip-stocare
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'tip-stocare') {
        if (e.target.value === 'indexedDB') {
            stocareActiva = new StocareIndexedDB();
        } else {
            stocareActiva = new StocareLocalStorage();
            stocareActiva.incarca(afiseazaProduse);
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

    let produs = new Produs(Date.now(), nume, cantitate); // ca sa am id unic, pun timpul curent 

    // salvam inainte sa trimitem la worker
    stocareActiva.salveaza(produs);

    // notificam worker-ul cu un produs
    worker.postMessage(produs);

    //resetam 
    document.getElementById('nume-produs').value = '';
    document.getElementById('cantitate-produs').value = '';
}

function afiseazaProduse(produse) {
    let tbody = document.getElementById('lista-produse');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (let i = 0; i < produse.length; i++) {
        let rand = '<tr>';
        rand += '<td>' + (i + 1) + '</td>';
        rand += '<td>' + produse[i].nume + '</td>';
        rand += '<td>' + produse[i].cantitate + '</td>';
        rand += '</tr>';
        tbody.innerHTML += rand;
    }
}

// la incarcare afiseaza ce e salvat
stocareActiva.incarca(afiseazaProduse);