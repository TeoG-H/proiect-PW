
window.addEventListener("load", initPagina);  /* window-intreaga pag, addEv.. asculta un ev, load- la incarcare, apeleaza intiPag */

let x1 = 0;
let y1 = 0; /*coord primului click*/
let clickuri = 0; /*contor pt click-uri */
let ctx;  /* context object */


function initPagina() {

    /* document-pagina incarcata cu tot ce e in ea, titlu, tabele, paragrafe... apoi cauta elementul cu id-ul...   innerHTML continutul din interiorul elem */
    document.getElementById("dataOra").innerHTML = "se incarcă " + new Date();  /*daca dai refreh rapid vezi asta timp de o sec*/
    document.getElementById("url").innerHTML     = window.location.href;  /* window  e fereastra browserului, adica mediul in care ruleaza pag, location contine inf despre protocol, domeniu, calea, param URL,   href e adresa completa a pag*/
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            document.getElementById("locatie").innerHTML =
                "Lat: " + position.coords.latitude.toFixed(4) +
                " / Long: " + position.coords.longitude.toFixed(4);
        }, function() {
            document.getElementById("locatie").innerHTML = "Acces refuzat";
        });
    }
    document.getElementById("browser").innerHTML = window.navigator.userAgent;  /* https://www.w3schools.com/jsref/prop_nav_useragent.asp */
    document.getElementById("os").innerHTML      = window.navigator.platform;
    /* https://www.w3schools.com/jsref/obj_navigator.asp */

   //la fiecare sec
    window.setInterval(infoBrowser, 1000);  /*setInterval executa functia infoBr.. la interval de 1000ms, functia e fara () pt e transmisa ca referinta, nu se executa imediat*/

    initCanvas();
}


function infoBrowser() {
    let d = new Date();  /*d primeste timpul curent*/

    let dataFormatata = d.toLocaleDateString("ro-RO", {
        weekday: "long",
        year:    "numeric",
        month:   "long",
        day:     "numeric"
    });
    let oraFormatata = d.toLocaleTimeString("ro-RO");

    document.getElementById("dataOra").innerHTML = dataFormatata + " - " + oraFormatata;
}

function initCanvas() {
    /*ia elem canvas din html, creeaza un context  (ctx e obiectul prin care desenez), cand dau click pe canvas se apeleaza desen*/
    /* https://www.w3schools.com/tags/ref_canvas.asp */
    let canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    canvas.addEventListener("click", desen);
}


function desen(event) {  /*event contine inf despre unde am dat click */
    let canvas = document.getElementById("canvas");
    
    /*scalarea canvas si ce vad in css */
    let scaleX = canvas.width  / canvas.offsetWidth; 
    let scaleY = canvas.height / canvas.offsetHeight;
    
    /*cordonate relativ la coltul stanga sus si inmultim pentru corectie scalare */
    let x = event.offsetX * scaleX;
    let y = event.offsetY * scaleY;

    if (clickuri === 0) {
        x1 = x;
        y1 = y;
        clickuri = 1;

        /* https://www.w3schools.com/tags/ref_canvas.asp */
        ctx.beginPath();  /*incepe un desen nou*/
        ctx.arc(x, y, 5, 0, Math.PI * 2); /*adaug punctul pt primul click */
        ctx.fillStyle = document.getElementById("culoareContur").value; /*ia culoarea */
        ctx.fill(); /*umple cercul */

    } else {
        let contur = document.getElementById("culoareContur").value;
        let fill   = document.getElementById("culoareFill").value;

        let xx = Math.min(x1, x);
        let yy = Math.min(y1, y);
        let w  = Math.abs(x - x1);
        let h  = Math.abs(y - y1);


        /* https://www.w3schools.com/tags/ref_canvas.asp */
        ctx.fillStyle   = fill;
        ctx.fillRect(xx, yy, w, h);

        ctx.strokeStyle = contur;
        ctx.lineWidth   = 2;
        ctx.strokeRect(xx, yy, w, h);

        clickuri = 0;
    }
}


function stergeCanvas() {
    let canvas = window.document.getElementById("canvas");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clickuri = 0; 
}




function insereazaLinie() {
    let t       = document.getElementById("tabel");
    let poz     = parseInt(document.getElementById("poz").value); /*inputul da text si eu il iau ca nr */
    let culoare = document.getElementById("culoareLinie").value;

    let nrColoane = t.rows[0].cells.length; /* ia nr de celule dintr-un rand ca sa vad nr de col https://www.w3schools.com/jsref/dom_obj_table.asp */
    let rand = t.insertRow(poz);  /* https://www.w3schools.com/jsref/coll_table_rows.asp */ 

    for (let i = 0; i < nrColoane; i++) {
        let numColoana = t.rows[0].cells[i].innerHTML;  /* ia numele coloanei din header https://www.w3schools.com/jsref/dom_obj_table.asp */
        let valoare = window.prompt("Introdu valoarea pentru coloana: " + numColoana);   

        let celula = rand.insertCell(i);
        celula.innerHTML = valoare !== null ? valoare : " ";  // daca apesi Cancel pune spatiu
        celula.style.backgroundColor = culoare;
    }
}

function insereazaColoana() {
    let t       = document.getElementById("tabel");
    let poz     = parseInt(document.getElementById("poz").value); 
    let culoare = document.getElementById("culoareLinie").value;

    let numeColoana = window.prompt("Introdu numele coloanei noi:");

    for (let i = 0; i < t.rows.length; i++) {
        let celula = t.rows[i].insertCell(poz);
        celula.style.backgroundColor = culoare;

        if (i === 0) {
            celula.innerHTML = numeColoana !== null ? numeColoana : "–";
        } else {
            let numRand = t.rows[i].cells[0].innerHTML;  
            let valoare = window.prompt("Introdu valoarea pentru rândul: " + numRand);
            celula.innerHTML = valoare !== null ? valoare : "–";
        }
    }
}




function verificaUtilizator() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'resurse/utilizatori.json', true);
    xhr.onload = function() {
        let utilizatori = JSON.parse(this.responseText);
        let user   = document.getElementById('v-user').value;
        let parola = document.getElementById('v-parola').value;

        let gasit = false;
        for (let i = 0; i < utilizatori.length; i++) {
            if (utilizatori[i].utilizator === user && utilizatori[i].parola === parola) {
                gasit = true;
                break;
            }
        }

        let rezultat = document.getElementById('rezultat-verificare');
        if (gasit) {
            rezultat.innerHTML = ' Conectare reuşită!';
            rezultat.style.color = '#1db954';

            // ← salvezi in sessionStorage
            sessionStorage.setItem('utilizatorLogat', user);
            afiseazaUtilizatorLogat(); // actualizezi imediat UI-ul
        
        } else {
            rezultat.innerHTML = ' Utilizator sau parolă incorecte.';
            rezultat.style.color = '#e30613';
        }
    };
    xhr.send();
}


function afiseazaUtilizatorLogat() {
    let user = sessionStorage.getItem('utilizatorLogat');
    let el = document.getElementById('user-logat-footer');
    if (!el) return;

    if (user) {
        el.textContent = '👤 ' + user;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

// la fiecare incarcare de pagina verifici
window.addEventListener('load', afiseazaUtilizatorLogat);



function inregistreazaUtilizator() {
     let form = document.getElementById('form-inregistrare');

    let utilizator = form.querySelector('#nume_utilizator').value.trim();
    let parola     = form.querySelector('#parola').value.trim();
    let nume       = form.querySelector('#nume').value.trim();
    let prenume    = form.querySelector('#prenume').value.trim();
    let email      = form.querySelector('#email').value.trim();
    let nr_tel     = form.querySelector('#nr_tel').value.trim();

    // ── Validări ──────────────────────────────────────────────

    if (!utilizator) {
        alert('Numele de utilizator este obligatoriu.');
        return;
    }
    if (utilizator.length < 3) {
        alert('Numele de utilizator trebuie să aibă cel puțin 3 caractere.');
        return;
    }

    if (!parola) {
        alert('Parola este obligatorie.');
        return;
    }
    if (parola.length < 6) {
        alert('Parola trebuie să aibă cel puțin 6 caractere.');
        return;
    }

    // regex simplu pentru email: ceva@ceva.ceva
    let regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !regexEmail.test(email)) {
        alert('Adresa de email nu este validă.');
        return;
    }

    // exact 10 cifre pentru telefon românesc
    let regexTel = /^\d{10}$/;
    if (nr_tel && !regexTel.test(nr_tel)) {
        alert('Numărul de telefon trebuie să conțină exact 10 cifre.');
        return;
    }

    // ── Trimitere ─────────────────────────────────────────────

    let date = { utilizator, parola, nume, prenume, email, nr_tel };

    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/utilizatori', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert('Înregistrare reușită!');
            form.reset(); 
        } else {
            alert('Eroare la înregistrare.');
        }
    };
    xhr.send(JSON.stringify(date));
}