import socket
import os
import threading
import gzip
import json

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


# Aceasta functie va rula in paralel pentru fiecare utilizator care intra pe site
def proceseaza_cererea(clientsocket, address):
    try:
        # Citim cererea completa
        cerere = ''
        clientsocket.settimeout(2)
        try:
            while True:
                data = clientsocket.recv(4096)
                if not data:
                    break
                cerere += data.decode('utf-8', errors='ignore')
                if '\r\n\r\n' in cerere:
                    break
        except:
            pass

        if not cerere:
            clientsocket.close()
            return

        pozitie = cerere.find('\r\n')

        if pozitie > -1:
            linieDeStart = cerere[0:pozitie]
            elemente     = linieDeStart.split(' ')

            if len(elemente) > 1:
                metoda      = elemente[0]   # GET sau POST
                numeResursa = elemente[1]

                # Daca scriem in browser doar "localhost:5678/", il trimitem la "index.html"
                if numeResursa == '/':
                    numeResursa = '/index.html'

                print(f"[{metoda}] Cerere pentru: {numeResursa}")

                # ── Tratam cererea POST pentru /api/utilizatori ──
                if metoda == 'POST' and numeResursa == '/api/utilizatori':
                    # Corpul cererii vine dupa \r\n\r\n
                    separator = cerere.find('\r\n\r\n')
                    corp = cerere[separator + 4:] if separator > -1 else ''

                    try:
                        date_noi = json.loads(corp)

                        cale_json = os.path.join(director_continut, 'resurse', 'utilizatori.json')

                        # Citim utilizatorii existenti
                        with open(cale_json, 'r', encoding='utf-8') as f:
                            utilizatori = json.load(f)

                        # Adaugam utilizatorul nou
                        utilizatori.append(date_noi)

                        # Salvam inapoi in fisier
                        with open(cale_json, 'w', encoding='utf-8') as f:
                            json.dump(utilizatori, f, ensure_ascii=False, indent=2)

                        raspuns_ok = b'{"status": "ok"}'
                        header  = "HTTP/1.1 200 OK\r\n"
                        header += f"Content-Length: {len(raspuns_ok)}\r\n"
                        header += "Content-Type: application/json; charset=utf-8\r\n"
                        header += "Connection: close\r\n\r\n"
                        clientsocket.sendall(header.encode('utf-8') + raspuns_ok)
                        print(f"[+] Utilizator nou inregistrat: {date_noi.get('utilizator', '?')}")

                    except Exception as e:
                        print(f"Eroare POST: {e}")
                        raspuns_err = b'{"status": "error"}'
                        header  = "HTTP/1.1 500 Internal Server Error\r\n"
                        header += f"Content-Length: {len(raspuns_err)}\r\n"
                        header += "Content-Type: application/json; charset=utf-8\r\n"
                        header += "Connection: close\r\n\r\n"
                        clientsocket.sendall(header.encode('utf-8') + raspuns_err)

                    return  # oprim procesarea, nu mai cautam fisier

                # ── Tratam cererile GET normale ──
                # lstrip('/') sterge bara de la inceput ca sa putem uni calea corect
                cale_fisier = os.path.normpath(os.path.join(director_continut, numeResursa.lstrip('/')))

                # Verificam daca fisierul exista
                if os.path.exists(cale_fisier) and os.path.isfile(cale_fisier):

                    # Determinam Content-Type
                    _, extensie = os.path.splitext(cale_fisier)
                    extensie    = extensie.lower()

                    content_type = tipuri_continut.get(extensie, 'application/octet-stream')

                    # Citim fisierul ca bytes
                    with open(cale_fisier, 'rb') as f:
                        continut_fisier = f.read()

                    # Verificam daca browserul suporta gzip
                    suporta_gzip = 'Accept-Encoding' in cerere and 'gzip' in cerere
                    extra_header = ""

                    # Comprimam doar textul (html, css, js, json, xml)
                    if suporta_gzip and extensie in ['.html', '.css', '.js', '.json', '.xml']:
                        continut_final = gzip.compress(continut_fisier)
                        extra_header   = "Content-Encoding: gzip\r\n"
                    else:
                        continut_final = continut_fisier

                    # Construim raspunsul 200 OK
                    header  = "HTTP/1.1 200 OK\r\n"
                    header += f"Content-Length: {len(continut_final)}\r\n"
                    header += f"Content-Type: {content_type}\r\n"
                    header += extra_header
                    header += "Server: HeiNekenServer/1.0\r\n"
                    header += "Connection: close\r\n\r\n"

                    clientsocket.sendall(header.encode('utf-8') + continut_final)

                else:
                    print(f"EROARE 404: Nu am gasit {cale_fisier}")

                    mesaj_404 = (
                        "<h1>404 - Resursa nu a fost gasita</h1>"
                        "<p>Fisierul cerut nu exista pe server.</p>"
                    ).encode('utf-8')

                    header_404  = "HTTP/1.1 404 Not Found\r\n"
                    header_404 += f"Content-Length: {len(mesaj_404)}\r\n"
                    header_404 += "Content-Type: text/html; charset=utf-8\r\n"
                    header_404 += "Connection: close\r\n\r\n"

                    clientsocket.sendall(header_404.encode('utf-8') + mesaj_404)

    except Exception as e:
        print(f"Eroare de conexiune: {e}")
    finally:
        clientsocket.close()


# Pornire server
serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# Permite reutilizarea portului imediat dupa oprire
serversocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
serversocket.bind(('', 5678))
serversocket.listen(5)

print("=" * 55)
print("  HeiNekenServer pornit pe http://localhost:5678")
print(f"  Serveste fisiere din: {os.path.abspath(director_continut)}")
print("  Multithreading & GZIP activ")
print("  Suport POST /api/utilizatori activ")
print("=" * 55)

while True:
    (clientsocket, address) = serversocket.accept()
    fir_executie = threading.Thread(target=proceseaza_cererea, args=(clientsocket, address))
    fir_executie.daemon = True
    fir_executie.start()