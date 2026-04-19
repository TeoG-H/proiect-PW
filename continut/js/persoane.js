function incarcaPersoane() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'resurse/persoane.xml', true);
    xhr.onload = function() {
        var xml = this.responseXML;
        var persoane = xml.getElementsByTagName('persoana');

        var tabel = '<table><thead><tr>';
        tabel += '<th>Nume</th><th>Prenume</th><th>Vârstă</th>';
        tabel += '<th>Localitate</th><th>Email</th>';
        tabel += '</tr></thead><tbody>';

        for (var i = 0; i < persoane.length; i++) {
            var p = persoane[i];
            var nume      = p.getElementsByTagName('nume')[0].textContent;
            var prenume   = p.getElementsByTagName('prenume')[0].textContent;
            var varsta    = p.getElementsByTagName('varsta')[0].textContent;
            var localitate = p.getElementsByTagName('localitate')[0].textContent;
            var email     = p.getElementsByTagName('email')[0].textContent;

            tabel += '<tr>';
            tabel += '<td>' + nume + '</td>';
            tabel += '<td>' + prenume + '</td>';
            tabel += '<td>' + varsta + '</td>';
            tabel += '<td>' + localitate + '</td>';
            tabel += '<td>' + email + '</td>';
            tabel += '</tr>';
        }

        tabel += '</tbody></table>';

        document.getElementById('mesaj-incarcare').style.display = 'none';
        document.getElementById('tabel-persoane').innerHTML = tabel;
    };
    xhr.send();
}