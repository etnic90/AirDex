import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

const aircrafts = [
  {
    id: "369087de-4293-4900-8854-1be0c7f91e9e",
    name: "Boeing 707-120",
    description_it: `### Contesto Storico & Origini\n\nIl **Boeing 707-120** è ampiamente considerato l'aereo che ha dato il via all'era dei jet commerciali di massa. Sviluppato a partire dal prototipo **Dash 80** a metà degli anni '50, il 707 fu la risposta di **Boeing** al **de Havilland Comet** britannico, introducendo standard superiori di velocità, capacità e affidabilità.\n\nLa versione iniziale **707-120** volò per la prima volta nel dicembre **1957** ed entrò in servizio commerciale nell'ottobre **1958** con la celebre compagnia [Pan American World Airways](file:///it/airlines/2576554b-a8f3-4325-9358-c5307e667997). Questa rotta transatlantica inaugurale cambiò per sempre la percezione dei viaggi aerei a lungo raggio.\n\n### Architettura & Design Tecnologico\n\nIl design del **Boeing 707** si caratterizzava per la configurazione con **ali a freccia di 35 gradi** e quattro motori turbogetto montati in pod subalari. Questa scelta aerodinamica, ereditata dai bombardieri militari, divenne lo standard per gli aerei di linea moderni.\n\nI motori della prima serie -120 erano i turbogetti **Pratt & Whitney JT3C-6**, che richiedevano l'iniezione d'acqua per aumentare la spinta durante il decollo, generando le famose e spettacolari scie di fumo nero. Successivamente, la versione **707-120B** introdusse i più efficienti turboventola **JT3D**, migliorando sensibilmente consumi e autonomia.\n\n**Specifiche di Bordo:**\n*   **Quattro motori subalari** Pratt & Whitney JT3C (poi JT3D)\n*   **Configurazione di cabina** a 6 posti per fila (3+3), che stabilì lo standard dei fusoliera stretta\n*   **Velocità di crociera** di circa 960 km/h, quasi il doppio rispetto ai vecchi velivoli a elica\n\n### Carriera Operativa & Vettori\n\nIl **707-120** divenne rapidamente la scelta privilegiata delle principali compagnie aeree globali. Oltre alla pioniera [Pan American World Airways](file:///it/airlines/2576554b-a8f3-4325-9358-c5307e667997), la statunitense [TWA (Trans World Airlines)](file:///it/airlines/4ac244e8-735d-45ad-b006-e56d6be02f5f) e [American Airlines](file:///it/airlines/1332212a-6283-4c83-987f-c675ef8b5d52) costruirono le loro reti a lungo raggio attorno a questo modello.\n\nL'aereo permise di collegare le coste americane in poche ore e ridusse il viaggio transatlantico a un volo diurno o notturno senza scalo, decretando la fine commerciale dei transatlantici marittimi. Fu impiegato anche da vettori prestigiosi come [Qantas](file:///it/airlines/9be55bf8-b3e3-405e-bd45-d7b43d34e148).\n\n### Eredità & Impatto Culturale\n\nL'eredità del **Boeing 707** è immensa: non solo ha plasmato l'architettura dei moderni aviogetti di linea, ma ha anche ridefinito la globalizzazione, rendendo il mondo più piccolo e accessibile.\n\nPopolarizzò il termine "Jet Set" per descrivere l'élite sociale che poteva viaggiare rapidamente tra New York, Parigi e Londra. Il suo design di cabina fu riutilizzato da **Boeing** per i modelli successivi, inclusi il 727, il 737 e il 757, lasciando un'impronta duratura nell'ingegneria aeronautica.`,
    trivia: [
      "Il 707 non fu il primo jet di linea in assoluto (primato del de Havilland Comet), ma fu il primo ad avere un successo commerciale travolgente.",
      "Durante i voli dimostrativi del prototipo Dash 80 nel 1955, il pilota collaudatore Tex Johnston eseguì a sorpresa un tonneau (barrell roll) sopra Seattle.",
      "La fusoliera del 707 fu allargata di pochi centimetri all'ultimo minuto su insistenza di Pan Am, permettendo la configurazione a 6 posti per fila."
    ],
    operators: [
      { id: "2576554b-a8f3-4325-9358-c5307e667997", qty: 29 }, // Pan Am
      { id: "4ac244e8-735d-45ad-b006-e56d6be02f5f", qty: 15 }, // TWA
      { id: "1332212a-6283-4c83-987f-c675ef8b5d52", qty: 26 }, // American Airlines
      { id: "9be55bf8-b3e3-405e-bd45-d7b43d34e148", qty: 13 }  // Qantas
    ]
  },
  {
    id: "49f5d486-4b1e-45b3-8c3b-204854fcf4d2",
    name: "Boeing 747-100",
    description_it: `### Contesto Storico & Origini\n\nIl **Boeing 747-100**, noto in tutto il mondo come la "Regina dei Cieli" (Queen of the Skies), fu il primo aereo wide-body (a doppio corridoio) della storia dell'aviazione. Concepito nella seconda metà degli anni '60 per soddisfare la vertiginosa crescita del traffico aereo passeggeri guidata da Juan Trippe di [Pan American World Airways](file:///it/airlines/2576554b-a8f3-4325-9358-c5307e667997), il 747 rivoluzionò il trasporto aereo rendendolo accessibile a milioni di persone.\n\nLa prima versione, la **747-100**, decollò per il suo volo inaugurale nel febbraio **1969** ed entrò in servizio commerciale nel gennaio **1970** sulla rotta New York-Londra di Pan Am. La sua mole era talmente imponente che richiese la costruzione del più grande stabilimento industriale del mondo a Everett, nello stato di Washington.\n\n### Architettura & Design Tecnologico\n\nLa caratteristica più celebre del **Boeing 747** è la sua sezione anteriore a **doppio ponte**, che crea la sua inconfondibile "gobba". Questa soluzione fu adottata originariamente per consentire una facile conversione in aereo cargo con muso apribile, poiché all'epoca si pensava che il Concorde avrebbe presto reso obsoleti i voli passeggeri subsonici.\n\nIl velivolo era spinto da quattro motori turboventola ad alto rapporto di diluizione **Pratt & Whitney JT9D-3A**, una tecnologia allora pionieristica. L'ala, con freccia di 37,5 gradi, consentiva una velocità di crociera eccezionale per un aereo di tali dimensioni.\n\n**Specifiche di Bordo:**\n*   **Doppio corridoio** interno con cabina passeggeri larga oltre 6 metri\n*   **Iconica gobba superiore** (Upper Deck) originariamente adibita a salotto di prima classe con bar\n*   **Carrello d'atterraggio principale** a 16 ruote suddiviso in quattro carrelli per distribuire l'enorme peso\n\n### Carriera Operativa & Vettori\n\nIl **747-100** divenne il simbolo del prestigio globale per ogni grande compagnia aerea. Vettori storici come [Pan American World Airways](file:///it/airlines/2576554b-a8f3-4325-9358-c5307e667997), [TWA (Trans World Airlines)](file:///it/airlines/4ac244e8-735d-45ad-b006-e56d6be02f5f), [British Airways](file:///it/airlines/85bb16da-5c09-4347-8fca-e67a64e3971a), [Air France](file:///it/airlines/3a4f36c2-8b44-4afc-90aa-2404c776ec64), [Lufthansa](file:///it/airlines/22489f2f-d864-4d61-87e4-70bfda937f4e) e [Alitalia](file:///it/airlines/ac617f8a-e5b6-41b3-a324-a72c60538570) acquistarono il modello per le loro rotte intercontinentali a più alta densità.\n\nL'aereo consentì di abbassare drasticamente il costo del biglietto per passeggero, democratizzando il viaggio aereo internazionale. Le versioni passeggeri potevano ospitare oltre 360 passeggeri in una comoda configurazione multi-classe.\n\n### Eredità & Impatto Culturale\n\nIl **Boeing 747** ha dominato i cieli per oltre mezzo secolo, diventando una delle icone culturali del ventesimo secolo. Il suo profilo elegante e maestoso è universalmente riconoscibile.\n\nOltre al ruolo passeggeri, le versioni cargo hanno trasportato merci di ogni tipo, dallo Space Shuttle della NASA a carichi umanitari. Nonostante l'introduzione di moderni bireattori più efficienti ne abbia decretato il graduale pensionamento passeggeri, la Regina dei Cieli mantiene un posto unico ed eterno nella storia aeronautica.`,
    trivia: [
      "Per addestrare i piloti a guidare il 747 a terra dall'altissima cabina di pilotaggio prima che l'aereo fosse pronto, Boeing costruì un simulatore stradale chiamato 'Waddell's Wagon' montato su un camion.",
      "Il ponte superiore del 747-100 includeva originariamente una scala a chiocciola che portava a un lounge lounge di prima classe ispirato al tema dei viaggi marittimi.",
      "Il volume interno del 747-100 era così vasto che durante i test di volo alcuni piloti segnalarono che si formavano micro-nuvole di condensa all'interno della cabina vuota."
    ],
    operators: [
      { id: "2576554b-a8f3-4325-9358-c5307e667997", qty: 33 }, // Pan Am
      { id: "4ac244e8-735d-45ad-b006-e56d6be02f5f", qty: 19 }, // TWA
      { id: "85bb16da-5c09-4347-8fca-e67a64e3971a", qty: 18 }, // British Airways
      { id: "3a4f36c2-8b44-4afc-90aa-2404c776ec64", qty: 16 }, // Air France
      { id: "22489f2f-d864-4d61-87e4-70bfda937f4e", qty: 10 }, // Lufthansa
      { id: "ac617f8a-e5b6-41b3-a324-a72c60538570", qty: 5 }   // Alitalia
    ]
  },
  {
    id: "34c339ff-1f32-4abc-8f2e-317eb281408d",
    name: "Concorde",
    description_it: `### Contesto Storico & Origini\n\nIl **Concorde** è il più celebre aereo da trasporto supersonico (SST) della storia, un capolavoro dell'ingegneria congiunta franco-britannica sviluppato da Sud Aviation (poi Aérospatiale) e British Aircraft Corporation. Nato nei primi anni '60, il progetto mirava a collegare le principali metropoli mondiali a una velocità superiore a quella di rotazione della Terra.\n\nIl Concorde effettuò il primo volo nel marzo **1969** ed entrò in servizio commerciale nel gennaio **1976**. Pur rappresentando l'apice tecnologico dell'aviazione civile, il Concorde rimase un velivolo di nicchia, limitato dagli alti costi operativi e dalle restrizioni sul boom sonico nei voli sopra la terraferma.\n\n### Architettura & Design Tecnologico\n\nIl **Concorde** si distingueva per la sua straordinaria **ala a delta ogivale** e la mancanza di ipersostentatori o timoni di profondità separati (utilizzava elevoni). Per garantire la visibilità dei piloti durante le fasi di decollo e atterraggio ad alto angolo d'attacco, l'aereo era dotato di un caratteristico **muso inclinabile (droop nose)**.\n\nI motori erano quattro potenti turbogetti **Rolls-Royce/Snecma Olympus 593** dotati di postbruciatori, posizionati in coppie sotto le ali. Il Concorde era in grado di volare a una velocità di crociera di **Mach 2,04** (circa 2.180 km/h) a una quota di oltre 18.000 metri, dove la curvatura terrestre era chiaramente visibile.\n\n**Specifiche di Bordo:**\n*   **Muso mobile a geometria variabile** per migliorare la visibilità in atterraggio\n*   **Struttura in alluminio speciale** progettata per resistere al calore cinetico generato dall'attrito dell'aria a velocità supersonica\n*   **Cabina passeggeri stretta** con configurazione a 4 posti per fila (2+2) per minimizzare la sezione frontale\n\n### Carriera Operativa & Vettori\n\nSolo due compagnie aeree gestirono il Concorde per tutta la sua carriera commerciale: [British Airways](file:///it/airlines/85bb16da-5c09-4347-8fca-e67a64e3971a) e [Air France](file:///it/airlines/3a4f36c2-8b44-4afc-90aa-2404c776ec64). Le rotte principali erano i voli transatlantici da Londra e Parigi verso New York e Washington, coperti in meno di tre ore e mezza (la metà del tempo di un jet subsonico).\n\nPer un breve periodo, anche [Singapore Airlines](file:///it/airlines/c5944f06-cda8-4d9a-af17-7d5a6a9276a7) operò voli congiunti con Concorde dipinti con la propria livrea sul lato sinistro della fusoliera. Il servizio passeggeri era d'élite, offrendo caviale, champagne e un servizio a cinque stelle a bordo.\n\n### Eredità & Impatto Culturale\n\nIl Concorde è diventato un'icona del design moderno, ammirato per le sue linee affilate e la sua straordinaria silhouette. Ha rappresentato il sogno dell'aviazione supersonica per intere generazioni.\n\nIl servizio è stato interrotto definitivamente nel **2003**, a seguito del tragico incidente del volo Air France 4590 nel 2000, del calo dei passeggeri post-11 settembre e dell'aumento insostenibile dei costi di manutenzione. Il Concorde rimane uno dei pochissimi esempi in cui l'umanità ha fatto un passo indietro tecnologico, rinunciando alla velocità supersonica civile.`,
    trivia: [
      "A causa dell'estremo calore cinetico generato a Mach 2, la fusoliera del Concorde si allungava fino a 20-30 centimetri durante il volo supersonico.",
      "Per riflettere il calore solare e cinetico e proteggere la struttura in alluminio, il Concorde doveva essere verniciato con una speciale vernice bianca ad altissima riflettanza.",
      "Volando verso ovest da Londra a New York, il Concorde atterrava a un'ora locale precedente a quella di partenza, consentendo ai passeggeri di 'viaggiare indietro nel tempo'."
    ],
    operators: [
      { id: "85bb16da-5c09-4347-8fca-e67a64e3971a", qty: 7 }, // British Airways
      { id: "3a4f36c2-8b44-4afc-90aa-2404c776ec64", qty: 7 }, // Air France
      { id: "c5944f06-cda8-4d9a-af17-7d5a6a9276a7", qty: 1 }  // Singapore Airlines
    ]
  },
  {
    id: "47eef079-9f32-4d16-ba6e-7cbbcb753b9d",
    name: "Douglas DC-3",
    description_it: `### Contesto Storico & Origini\n\nIl **Douglas DC-3** (Douglas Commercial 3) è unanimemente considerato l'aereo di linea più importante mai costruito. Progettato a metà degli anni '30 su richiesta di C.R. Smith, presidente di [American Airlines](file:///it/airlines/1332212a-6283-4c83-987f-c675ef8b5d52), il DC-3 nacque come evoluzione del fortunato DC-2, con l'obiettivo di offrire un aereo dotato di cuccette per i voli notturni transcontinentali americani.\n\nIl DC-3 effettuò il suo volo inaugurale nel dicembre **1935** ed entrò in servizio nel **1936**. La sua introduzione rivoluzionò il trasporto aereo, poiché fu il primo aereo in grado di generare profitti operativi trasportando unicamente passeggeri, senza dover dipendere dai sussidi governativi per il trasporto postale.\n\n### Architettura & Design Tecnologico\n\nIl **DC-3** era un monoplano ad ala bassa interamente metallico, costruito in lega di alluminio con una robusta struttura multi-longherone inventata da Jack Northrop. Questa caratteristica conferiva al velivolo una resistenza strutturale eccezionale, che gli permetteva di operare in condizioni estreme.\n\nEra spinto da due motori radiali a doppia stella **Wright R-1820 Cyclone** o **Pratt & Whitney R-1830 Twin Wasp**. Il carrello d'atterraggio era di tipo retrattile convenzionale (biciclo), con la coda che poggiava su un pattino o un ruotino orientabile a terra.\n\n**Specifiche di Bordo:**\n*   **Struttura interamente metallica** in alluminio ad alta resistenza\n*   **Cabina passeggeri riscaldata e insonorizzata**, con capacità da 21 a 32 passeggeri\n*   **Eccezionale sicurezza di volo**, in grado di mantenere la quota e manovrare anche con un solo motore operativo\n\n### Carriera Operativa & Vettori\n\nPrima della seconda guerra mondiale, il DC-3 dominava i cieli americani, trasportando oltre il 90% dei passeggeri del paese. Compagnie pioniere come [American Airlines](file:///it/airlines/1332212a-6283-4c83-987f-c675ef8b5d52), [TWA (Trans World Airlines)](file:///it/airlines/4ac244e8-735d-45ad-b006-e56d6be02f5f), [Delta Air Lines](file:///it/airlines/cb4fe387-bc17-47c4-b983-fa03e27f0cfe) ed [Eastern Air Lines](file:///it/airlines/ded5425e-a9c0-43f9-880d-819960a93263) strutturarono i propri servizi nazionali su questo leggendario velivolo.\n\nDurante la guerra, venne prodotta la versione militarizzata **C-47 Skytrain** (o Dakota) in oltre 10.000 esemplari, utilizzata per il lancio di paracadutisti, il traino di alianti e il trasporto logistico. Nel dopoguerra, migliaia di C-47 surplus vennero riconvertiti all'uso civile, diventando la spina dorsale di centinaia di compagnie aeree nascenti nel mondo, inclusa l'italiana [Alitalia](file:///it/airlines/ac617f8a-e5b6-41b3-a324-a72c60538570).\n\n### Eredità & Impatto Culturale\n\nIl generale Dwight Eisenhower citò il C-47/DC-3 come una delle quattro tecnologie che permisero agli Alleati di vincere la seconda guerra mondiale. La sua affidabilità è diventata leggendaria.\n\nAncora oggi, a novant'anni dal primo volo, alcune decine di DC-3 e C-47 continuano a volare commercialmente in regioni remote del mondo o come aerei storici restaurati. Il DC-3 non è solo un monumento storico, ma un esempio immortale di perfezione ingegneristica industriale.`,
    trivia: [
      "Un famoso detto aeronautico recita: 'L'unico sostituto per un DC-3 è un altro DC-3', evidenziando l'insostituibilità delle sue eccezionali doti di decollo e atterraggio corto su piste sterrate.",
      "Durante la seconda guerra mondiale, un C-47 militare fu attaccato da un caccia giapponese che speronò la sua coda. Il C-47 riuscì comunque a volare e ad atterrare in sicurezza, nonostante i gravissimi danni strutturali.",
      "Il DC-3 ridusse il tempo di volo da New York a Los Angeles a sole 15 ore, richiedendo solo tre scali per il rifornimento rispetto alle oltre 25 ore dei modelli precedenti."
    ],
    operators: [
      { id: "1332212a-6283-4c83-987f-c675ef8b5d52", qty: 94 }, // American Airlines
      { id: "4ac244e8-735d-45ad-b006-e56d6be02f5f", qty: 78 }, // TWA
      { id: "cb4fe387-bc17-47c4-b983-fa03e27f0cfe", qty: 24 }, // Delta
      { id: "ded5425e-a9c0-43f9-880d-819960a93263", qty: 45 }, // Eastern
      { id: "ac617f8a-e5b6-41b3-a324-a72c60538570", qty: 12 }  // Alitalia
    ]
  },
  {
    id: "2ab0adc5-35b4-4de1-866a-43e22b1023d1",
    name: "Airbus A300B4",
    description_it: `### Contesto Storico & Origini\n\nL'**Airbus A300B4** rappresenta una pietra miliare assoluta nella storia dell'aviazione civile: è stato il primo aereo di linea wide-body (a doppio corridoio) spinto da soli due motori (bireattore). Sviluppato dal consorzio europeo **Airbus** nei primi anni '70 per sfidare l'egemonia dei giganti trimotori e quadrimotori americani, l'A300 dimostrò che un bireattore di grandi dimensioni poteva essere sicuro, incredibilmente efficiente ed economico.\n\nLa versione **A300B4**, decollata nel **1974** ed entrata in servizio nel **1975**, fu la prima variante a lungo raggio ad alto successo commerciale, dotata di un serbatoio di carburante centrale aggiuntivo e di flap di bordo d'attacco migliorati per incrementare il peso massimo al decollo e l'autonomia operativa.\n\n### Architettura & Design Tecnologico\n\nL'innovazione chiave dell'**A300** fu l'adozione di due soli motori turboventola ad alto rapporto di diluizione, i **General Electric CF6-50C** o i **Pratt & Whitney JT9D-59A**, montati sotto le ali. Questa scelta consentiva consumi di carburante nettamente inferiori rispetto ai trimotori coevi come il DC-10 o l'L-1011 TriStar.\n\nLa fusoliera, larga 5,64 metri, consentiva una comoda configurazione a doppio corridoio a 8 posti per fila (2+4+2), massimizzando al contempo lo spazio nel ponte inferiore per ospitare container di carico standard LD3, una caratteristica che lo rese popolarissimo per il trasporto merci.\n\n**Specifiche di Bordo:**\n*   **Primo bireattore wide-body al mondo**, che aprì la strada alle future regole di volo ETOPS a lungo raggio\n*   **Ali ad alta efficienza aerodinamica** progettate dai partner britannici di Hawker Siddeley\n*   **Sistemi di controllo di volo avanzati** con pilota automatico per atterraggi in condizioni di scarsa visibilità\n\n### Carriera Operativa & Vettori\n\nIl cliente di lancio dell'A300 fu [Air France](file:///it/airlines/3a4f36c2-8b44-4afc-90aa-2404c776ec64). Sebbene le vendite iniziali fossero lente, il modello decollò commercialmente grazie all'acquisizione da parte di grandi compagnie aeree statunitensi come [Eastern Air Lines](file:///it/airlines/ded5425e-a9c0-43f9-880d-819960a93263), che ne noleggiò inizialmente quattro esemplari dimostrando risparmi di carburante straordinari.\n\nIn Europa e nel mondo fu acquistato in grandi quantità da vettori di primo piano come [Lufthansa](file:///it/airlines/22489f2f-d864-4d61-87e4-70bfda937f4e), [Alitalia](file:///it/airlines/ac617f8a-e5b6-41b3-a324-a72c60538570) e [Singapore Airlines](file:///it/airlines/c5944f06-cda8-4d9a-af17-7d5a6a9276a7). Molti A300B4 vennero successivamente convertiti in aerei da trasporto merci (A300B4-F), volando per decenni per operatori cargo come FedEx ed DHL.\n\n### Eredità & Impatto Culturale\n\nL'**A300** ha fondato il successo commerciale di **Airbus** come concorrente globale di Boeing. Senza il successo dell'A300, non sarebbero mai esistiti i modelli successivi come l'A310, l'A330 o l'A380.\n\nHa dimostrato l'affidabilità e l'efficienza dei bireattori a fusoliera larga, portando alla progressiva scomparsa dei trimotori commerciali a lungo raggio e definendo il moderno panorama dell'aviazione civile incentrato sulla massima efficienza di esercizio.`,
    trivia: [
      "L'A300B4 fu il primo velivolo di linea commerciale a utilizzare materiali compositi per parti significative della struttura primaria, riducendone il peso morto.",
      "Per promuovere l'aereo negli Stati Uniti, Airbus noleggiò gratuitamente quattro A300 a Eastern Air Lines per sei mesi, una scommessa commerciale audace che fruttò un ordine di 23 velivoli.",
      "L'A300 stabilì la larghezza standard della fusoliera Airbus wide-body che fu successivamente ereditata quasi identica dal modello A310 e dal fortunato bireattore A330."
    ],
    operators: [
      { id: "3a4f36c2-8b44-4afc-90aa-2404c776ec64", qty: 16 }, // Air France
      { id: "22489f2f-d864-4d61-87e4-70bfda937f4e", qty: 11 }, // Lufthansa
      { id: "ded5425e-a9c0-43f9-880d-819960a93263", qty: 34 }, // Eastern Air Lines
      { id: "ac617f8a-e5b6-41b3-a324-a72c60538570", qty: 8 },  // Alitalia
      { id: "c5944f06-cda8-4d9a-af17-7d5a6a9276a7", qty: 6 }   // Singapore Airlines
    ]
  }
];

async function main() {
  try {
    await client.connect();
    console.log("Connected successfully to DB!");

    for (const ac of aircrafts) {
      console.log(`\nOptimizing ${ac.name} (${ac.id})...`);
      
      // Update aircraft details
      const updateRes = await client.query(`
        UPDATE public.aircraft_models
        SET description_it = $1, trivia = $2, status = 'HISTORIC'
        WHERE id = $3;
      `, [ac.description_it, JSON.stringify(ac.trivia), ac.id]);
      
      console.log(`- Updated aircraft details: ${updateRes.rowCount} row(s)`);

      // Clean old operator entries just in case
      await client.query(`
        DELETE FROM public.airline_fleet 
        WHERE aircraft_model_id = $1;
      `, [ac.id]);

      // Insert historic operator records
      let operatorsInsertedCount = 0;
      for (const op of ac.operators) {
        await client.query(`
          INSERT INTO public.airline_fleet (aircraft_model_id, airline_id, qty, status)
          VALUES ($1, $2, $3, 'HISTORIC');
        `, [ac.id, op.id, op.qty]);
        operatorsInsertedCount++;
      }
      console.log(`- Inserted ${operatorsInsertedCount} historic operators`);
    }

    console.log("\nAll 5 aircraft models optimized successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

main();
