import socket
import os
import gzip
import json
from urllib.parse import unquote_plus
from concurrent.futures import ThreadPoolExecutor

director_continut = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'continut')

# Dictionar cu tipurile de fisiere
tipuri_continut = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml':  'application/xml; charset=utf-8',
    '.dtd':  'text/plain; charset=utf-8',
    '.xsd':  'text/plain; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.ico':  'image/x-icon',
    '.mp4':  'video/mp4',
}


def proceseaza_cererea(clientsocket, address):
    try:
        cerere = ''
        clientsocket.settimeout(2) #daca clientul nu trimite in 2 sec se opreste citirea
        try:
            while True:
                data = clientsocket.recv(1024) #citeste date 1024 de bytes, returneaza nr de bytes cititi
                if not data:   #cand nu mai sunt date se opreste 
                    break
                cerere += data.decode('utf-8', errors='ignore') #face frumos un string cu cererea, si decodeaza fiecare byte cititi, daca apare cava invalid nu da eroare da ignor 
                if '\r\n\r\n' in cerere:  #separatorul dintee header-ul HTTP si corpul cererii mi-a picat la exam la RC 
                    # de ce trebuie sa ma opresc cand vad asta? 
                    header_part = cerere.split('\r\n\r\n')[0]
                    corp_primit = cerere.split('\r\n\r\n', 1)[1]
                    
                    content_length = 0
                    for linie in header_part.split('\r\n'):
                        if linie.lower().startswith('content-length:'):
                            content_length = int(linie.split(':')[1].strip())
                    
                    # citeste pana avem tot corpul
                    while len(corp_primit.encode('utf-8')) < content_length:
                        data = clientsocket.recv(4096)
                        if not data:
                            break
                        corp_primit += data.decode('utf-8', errors='ignore')
                    
                    cerere = header_part + '\r\n\r\n' + corp_primit
                    break
        except:
            pass

        if not cerere:
            clientsocket.close()
            return

        pozitie = cerere.find('\r\n')

        if pozitie > -1:
            linieDeStart = cerere[0:pozitie] #ia practic headerul 
            elemente     = linieDeStart.split(' ')

            if len(elemente) > 1: #daca cererea e valida are minim metoda si resursa 
                metoda      = elemente[0]
                numeResursa = elemente[1]

                if numeResursa == '/':
                    numeResursa = '/index.html'

                print(f"[{metoda}] Cerere pentru: {numeResursa}")

                # POST /api/utilizatori
                if metoda == 'POST' and numeResursa == '/api/utilizatori': #cand completez formularul mare si vreau sa salvez in utilizatori.json
                    separator = cerere.find('\r\n\r\n')
                    corp = cerere[separator + 4:] if separator > -1 else '' #ia corpul

                    try:
                        date_noi = json.loads(corp) #trans textul json in obiect py

                        cale_json = os.path.join(director_continut, 'resurse', 'utilizatori.json') #director_continut e definita sus

                        with open(cale_json, 'r', encoding='utf-8') as f:
                            utilizatori = json.load(f) #il transforma in lista python

                        utilizatori.append(date_noi) #baga in lista 

                        with open(cale_json, 'w', encoding='utf-8') as f:
                            json.dump(utilizatori, f, ensure_ascii=False, indent=2) #suprascrie fisierul, ensure permite diacritice ident -json frumos

                        #face raspunsul in bytes
                        raspuns_ok = b'{"status": "ok"}'
                        header  = "HTTP/1.1 200 OK\r\n"
                        header += f"Content-Length: {len(raspuns_ok)}\r\n"
                        header += "Content-Type: application/json; charset=utf-8\r\n"
                        header += "Connection: close\r\n\r\n"
                        clientsocket.sendall(header.encode('utf-8') + raspuns_ok)
                        print(f"[+] Utilizator nou inregistrat: {date_noi.get('utilizator', '?')}")

                    except Exception as e:
                        print(f"Eroare POST utilizatori: {e}")
                        raspuns_err = b'{"status": "error"}'
                        header  = "HTTP/1.1 500 Internal Server Error\r\n"
                        header += f"Content-Length: {len(raspuns_err)}\r\n"
                        header += "Content-Type: application/json; charset=utf-8\r\n"
                        header += "Connection: close\r\n\r\n"
                        clientsocket.sendall(header.encode('utf-8') + raspuns_err)

                    return

                # POST /api/preferinta
                #la fel ca mai sus doar ca aici ca raspuns trimite un html
                if metoda == 'POST' and numeResursa == '/api/preferinta':
                    separator = cerere.find('\r\n\r\n')
                    corp = cerere[separator + 4:] if separator > -1 else '' 

                    params = {}
                    for pereche in corp.split('&'):
                        if '=' in pereche:
                            cheie, valoare = pereche.split('=', 1)
                            params[cheie] = unquote_plus(valoare)

                    nume      = params.get('nume', '?')
                    prenume   = params.get('prenume', '?')
                    bere      = params.get('bere', '?')
                    descriere = params.get('descriere', '')

                    print(f"DEBUG corp: {corp}")
                    print(f"DEBUG params: {params}")

                    pagina_html = f"""<!DOCTYPE html>
                        <html lang="ro">
                        <head>
                            <meta charset="utf-8">
                            <title>Multumim!</title>
                            <link rel="stylesheet" href="/css/stil.css">
                        </head>
                        <body>
                            <div style="display:flex; align-items:center; justify-content:center; min-height:100vh;">
                                <div class="card-bloc" style="max-width:480px; text-align:center; padding:48px 40px;">
                                    <div class="bloc-label">Heineken &bull; 1873</div>
                                    <h2>Multumim, {nume}!</h2>
                                    <div class="separator" style="margin: 0 auto 20px;"></div>
                                    <p>Votul tau a fost salvat.</p>
                                    <p>Berea preferata: <strong style="color:var(--verde-neon);">{bere}</strong></p>
                                    {"<p style='font-style:italic; color:rgba(240,248,240,0.55);'>&ldquo;" + descriere + "&rdquo;</p>" if descriere else ""}
                                    <a href="/index.html" class="btn-submit"
                                    style="display:inline-block; margin-top:24px; text-decoration:none;">
                                        &larr; Inapoi la site
                                    </a>
                                </div>
                            </div>
                        </body>
                        </html>"""

                    continut = pagina_html.encode('utf-8')  #aici de ce nu mai trebuie in bytes raspunsul?
                    header  = "HTTP/1.1 200 OK\r\n"
                    header += f"Content-Length: {len(continut)}\r\n"
                    header += "Content-Type: text/html; charset=utf-8\r\n"
                    header += "Connection: close\r\n\r\n"
                    clientsocket.sendall(header.encode('utf-8') + continut)
                    print(f"[+] Preferinta primita: {nume} {prenume} -> {bere}")
                    return

                # GET 
                cale_fisier = os.path.normpath(os.path.join(director_continut, numeResursa.lstrip('/')))

                if os.path.exists(cale_fisier) and os.path.isfile(cale_fisier):

                    _, extensie = os.path.splitext(cale_fisier)
                    extensie    = extensie.lower()
                    content_type = tipuri_continut.get(extensie, 'application/octet-stream')

                    with open(cale_fisier, 'rb') as f:
                        continut_fisier = f.read()

                    suporta_gzip = 'Accept-Encoding' in cerere and 'gzip' in cerere
                    extra_header = ""

                    if suporta_gzip and extensie in ['.html', '.css', '.js', '.json', '.xml']:
                        continut_final = gzip.compress(continut_fisier)
                        extra_header   = "Content-Encoding: gzip\r\n"
                    else:
                        continut_final = continut_fisier

                    header  = "HTTP/1.1 200 OK\r\n"
                    header += f"Content-Length: {len(continut_final)}\r\n"
                    header += f"Content-Type: {content_type}\r\n"
                    header += extra_header
                    header += "Server: HeiNekenServer/1.0\r\n"
                    header += "Connection: close\r\n\r\n"

                    clientsocket.sendall(header.encode('utf-8') + continut_final)

                else:
                    print(f"EROARE 404: Nu am gasit {cale_fisier}")

                    mesaj_404 = b"<h1>404 - Pagina negasita</h1>"
                    header_404  = "HTTP/1.1 404 Not Found\r\n"
                    header_404 += f"Content-Length: {len(mesaj_404)}\r\n"
                    header_404 += "Content-Type: text/html; charset=utf-8\r\n"
                    header_404 += "Connection: close\r\n\r\n"

                    clientsocket.sendall(header_404.encode('utf-8') + mesaj_404)

    except Exception as e:
        print(f"Eroare de conexiune: {e}")
    finally:
        clientsocket.close()








serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM) # creeaza un socket nou AF_INET e IPV4, SOCK_STREAM e TCP 
serversocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1) #permite refolosirea portului chiar daca a fost folosit recent 
serversocket.bind(('', 5678)) #leaga socket  la toate adresele ip('') si la un port 
serversocket.listen(5)  #asculta, 5 clienti maxim in coada

print(" a pornit serverul ")


# ThreadPoolExecutor cu 50 de fire - reutilizate, nu recreate
pool = ThreadPoolExecutor(max_workers=30) #creeaza mai multe fire de executie care vor rula in paralel, pool e manager de threaduri

while True:
    (clientsocket, address) = serversocket.accept()  #asteapta pana un client se conecteaza si returneaza socketul si adresaip exact ca la RC 
    pool.submit(proceseaza_cererea, clientsocket, address) #trimite o sarcina catre pool, adica ruleaza functia prece.. pe un thread separat 