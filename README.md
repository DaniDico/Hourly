# Hourly

App per registrare le ore di lavoro (dipendenti) e raccogliere i fogli ore in un archivio per dipendente (azienda).
Funziona **senza server**: tutto è su GitHub Pages e i dati restano sui dispositivi degli utenti.

## Come funziona
- **Licenza aziendale:** codice `HLY1…` firmato con la tua chiave privata. L'app contiene solo la chiave *pubblica* (`js/config.js`) e verifica la firma. I codici non compaiono mai nel codice sorgente.
- **Codice dipendente:** l'azienda crea l'invito (`HLE1…`) dalla scheda *Dipendenti*; lo firma con la chiave contenuta nella sua licenza.
- **Foglio ore:** il dipendente invia il mese (`HLS1…`, link o file) e l'azienda lo importa in *Archivio*. Ogni foglio è autenticato con un segreto personale.

## Messa in funzione
1. Apri `tools/genera-licenze.html` **dal tuo computer** → *Genera nuova coppia di chiavi*. Salva la chiave privata in un posto sicuro (mai nel repository).
2. Incolla la chiave pubblica in `js/config.js` (`window.HLY_PUB={...};`) e pubblica.
3. Compila i campi tra parentesi in `privacy.html` e `termini.html` e **fai verificare i testi da un professionista legale**.
4. Per ogni cliente: nello stesso strumento *Crea licenza* (azienda, scadenza, dipendenti massimi) e consegna il codice. Per i rinnovi incolla la licenza precedente.
5. (Facoltativo, consigliato per la privacy) scarica `jspdf.umd.min.js` e `jspdf.plugin.autotable.min.js` nella cartella `lib/`: l'app li userà al posto della CDN.

## Limiti da conoscere
- Senza server **non si può revocare** un codice né impedire che venga condiviso; la scadenza si controlla con la data del dispositivo.
- Il codice è open source (GPL-3.0): chiunque può modificarlo e togliere il controllo licenze nella propria copia. La licenza vale per il servizio ufficiale, l'assistenza e gli aggiornamenti.
- I dati sono solo sul dispositivo: servono backup regolari (Impostazioni).
- GitHub Pages non è pensato per attività commerciali/SaaS: leggi le condizioni correnti o valuta un altro hosting statico.
