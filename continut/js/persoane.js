function incarcaPersoane() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'resurse/persoane.xml', true); // creeaza cererea dar nu se trimite
    
    xhr.onload = function() {//ce se intampla cand vine raspunsul 
        //citeste xml si face un tabel 
        var xml = this.responseXML;
        var persoane = xml.getElementsByTagName('persoana');

       var tabel = '<table><thead><tr>';
        tabel += '<th>Nume</th><th>Prenume</th>';
        tabel += '<th>Funcție</th><th>An naștere</th><th>Localitate</th>';
        tabel += '</tr></thead><tbody>';

        for (var i = 0; i < persoane.length; i++) {
            var p = persoane[i];
            var nume      = p.getElementsByTagName('nume')[0].textContent;   //getElem.. ia toate campurile cu nume la pers respectiva, ia primul element (e singurul :)) ) si il citeste
            var prenume   = p.getElementsByTagName('prenume')[0].textContent;
            var functie   = p.getElementsByTagName('functie')[0].textContent;
            var an        = p.getElementsByTagName('an_nastere')[0].textContent;
            var localitate = p.getElementsByTagName('localitate')[0].textContent;

            tabel += '<tr>';
            tabel += '<td>' + nume + '</td>';
            tabel += '<td>' + prenume + '</td>';
            tabel += '<td>' + functie + '</td>';
            tabel += '<td>' + an + '</td>';
            tabel += '<td>' + localitate + '</td>';
            tabel += '</tr>';
        }

        tabel += '</tbody></table>';

        document.getElementById('mesaj-incarcare').style.display = 'none';  //ascunde paragraful cu se incarca 
        document.getElementById('tabel-persoane').innerHTML = tabel;  //pune tabelul
    };
    xhr.send(); // trimite cererea 
}