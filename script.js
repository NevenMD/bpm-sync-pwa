// Globalne varijable za pohranu početnog i krajnjeg timecodea glazbenog segmenta
// Ove varijable se postavljaju kada se učita EDIUS XML datoteka.
let musicStartTC = null;
let musicEndTC = null;
let fileStartTC = null;    // Prvi marker iz Edius XML-a
let fileEndTC = null;      // Zadnji marker iz Edius XML-a
let autoMusicStartTC = null; // Timecode za automatski "glazba_pocetak"
let autoMusicEndTC = null;   // Timecode za automatski "glazba_kraj"
let midSegmentTC = null;     // Timecode za središnji marker


// Globalna varijabla za pohranu izračunatih beat markera za generiranje XML-a
let calculatedBeatMarkers = [];

// HTML elementi - Ažurirani ID-jevi i dodani novi
const ediusXmlFileInput = document.getElementById('ediusXmlFile');
const clearXmlButton = document.getElementById('clearXmlButton');
const xmlStatus = document.getElementById('xmlStatus');

// Novi ID-jevi za razdvojena BPM polja
const fiksniBPMIntegerInput = document.getElementById('fiksniBPMInteger');
const fiksniBPMDecimalInput = document.getElementById('fiksniBPMDecimal');
const ciljaniBPMIntegerInput = document.getElementById('ciljaniBPMInteger');
const ciljaniBPMDecimalInput = document.getElementById('ciljaniBPMDecimal');

const fpsSelect = document.getElementById('fpsSelect');
const mjeraTaktaInput = document.getElementById('mjeraTakta');
// NOVO: Referenca na checkbox
const exportOnlyMeasureStartsCheckbox = document.getElementById('exportOnlyMeasureStarts');

const ukupnoTrajanjeDatotekeInput = document.getElementById('ukupnoTrajanjeDatotekeInput');
const pocetakGlazbenogSegmentaInput = document.getElementById('pocetakGlazbenogSegmentaInput');
const krajGlazbenogSegmentaInput = document.getElementById('krajGlazbenogSegmentaInput');
const pragDriftaFrameoviInput = document.getElementById('pragDriftaFrameovi');

const calculateButton = document.getElementById('calculateButton');
const downloadXmlButton = document.getElementById('downloadXmlButton'); // Gumb za preuzimanje XML-a

const inputPage = document.getElementById('input-page');
const markeriOutput = document.getElementById('markeriOutput'); 
const xmlOutputDiv = document.getElementById('xmlOutput');
const rezultatDiv = document.getElementById('rezultat'); 

// --- Event Listeneri ---
if (ediusXmlFileInput) {
    ediusXmlFileInput.addEventListener('change', handleXmlFileSelect);
}
if (clearXmlButton) {
    clearXmlButton.addEventListener('click', clearXmlData);
}
if (calculateButton) {
    calculateButton.addEventListener('click', calculateMarkersAndShowResults);
}
if (downloadXmlButton) {
    downloadXmlButton.addEventListener('click', generateXmlAndDownload);
}

// Funkcija za formatiranje cijelog broja BPM-a i prebacivanje fokusa
function handleIntegerInput(event, nextInputDecimal) {
    let value = event.target.value.replace(/[^0-9]/g, ''); // Dopusti samo brojeve
    
    // Ograniči na 3 znamenke
    if (value.length > 3) {
        value = value.substring(0, 3);
    }
    event.target.value = value; // Odmah ažuriraj vrijednost u polju

    // Provjeri je li cijeli broj unesen (3 znamenke)
    if (value.length === 3) { // Ako su tri znamenke unesene, automatski prebaci
        if (nextInputDecimal) {
            nextInputDecimal.focus();
            nextInputDecimal.select();
        }
    } else if (event.type === 'blur') { // Prisilno formatiranje na blur (ako je prazno ili nepotpuno)
        event.target.value = value.padStart(3, '0');
    }
}

// Funkcija za formatiranje decimalnog dijela BPM-a i prebacivanje fokusa
function handleDecimalInput(event, nextInputElement) {
    let value = event.target.value.replace(/[^0-9]/g, ''); // Dopusti samo brojeve

    // Ograniči na 4 decimale
    if (value.length > 4) {
        value = value.substring(0, 4);
    }
    event.target.value = value; // Odmah ažuriraj vrijednost u polju

    // Dodaj završne nule ako je unesen cijeli broj decimala (4)
    if (value.length === 4) {
        event.target.value = value.padEnd(4, '0'); // Osiguraj 4 decimale
        if (nextInputElement) {
            nextInputElement.focus();
            if (nextInputElement.tagName === 'INPUT' || nextInputElement.tagName === 'SELECT') {
                nextInputElement.select();
            }
        }
    } else if (event.type === 'blur') { // Prisilno formatiranje na blur (ako je prazno ili nepotpuno)
        event.target.value = value.padEnd(4, '0');
    }
}


// Event Listeneri za nova BPM polja
if (fiksniBPMIntegerInput) {
    fiksniBPMIntegerInput.addEventListener('input', function(event) {
        handleIntegerInput(event, fiksniBPMDecimalInput);
    });
    fiksniBPMIntegerInput.addEventListener('blur', function(event) {
        handleIntegerInput(event, fiksniBPMDecimalInput); // Formatiraj na blur
    });
}
if (fiksniBPMDecimalInput) {
    fiksniBPMDecimalInput.addEventListener('input', function(event) {
        handleDecimalInput(event, ciljaniBPMIntegerInput);
    });
    fiksniBPMDecimalInput.addEventListener('blur', function(event) {
        handleDecimalInput(event, ciljaniBPMIntegerInput); // Formatiraj na blur
    });
}

if (ciljaniBPMIntegerInput) {
    ciljaniBPMIntegerInput.addEventListener('input', function(event) {
        handleIntegerInput(event, ciljaniBPMDecimalInput);
    });
    ciljaniBPMIntegerInput.addEventListener('blur', function(event) {
        handleIntegerInput(event, ciljaniBPMDecimalInput); // Formatiraj na blur
    });
}
if (ciljaniBPMDecimalInput) {
    ciljaniBPMDecimalInput.addEventListener('input', function(event) {
        handleDecimalInput(event, fpsSelect);
    });
    ciljaniBPMDecimalInput.addEventListener('blur', function(event) {
        handleDecimalInput(event, fpsSelect); // Formatiraj na blur
    });
}


// Inicijalizacija stanja aplikacije
function initializeApp() {
    clearXmlData(); // Počistimo sve na početku

    // POSTAVI FOKUS NA GUMB ZA UČITAVANJE DATOTEKE PRI POKRETANJU
    if (ediusXmlFileInput) {
        ediusXmlFileInput.focus();
    }
}

// Funkcija za obradu odabrane XML datoteke
function handleXmlFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const xmlString = e.target.result;
                parseEdiusXmlFile(xmlString);
                // Ako je rezultatDiv pronađen, postavi status poruku
                if (xmlStatus) {
                    xmlStatus.textContent = `Učitano: ${file.name}`;
                    xmlStatus.style.display = 'inline-block'; // Promijenjeno u inline-block da bude uz gumb
                    xmlStatus.style.color = 'green'; // Postavi boju na zelenu
                }
                if (clearXmlButton) {
                    clearXmlButton.style.display = 'inline-block';
                }
                console.log("EDIUS XML datoteka uspješno pročitana.");
                // Ovdje NE AŽURIRAMO rezultatDiv s porukom o uspješnom učitavanju,
                // jer xmlStatus već to prikazuje.
                if (rezultatDiv) {
                    rezultatDiv.textContent = ''; // Očisti poruku u rezultatDiv
                    rezultatDiv.style.color = ''; // Resetiraj boju
                }


                // NAKON USPJEŠNOG UČITAVANJA XML-A, PREBACI FOKUS NA FIKSNI BPM INTEGER INPUT
                if (fiksniBPMIntegerInput) {
                    fiksniBPMIntegerInput.focus();
                    fiksniBPMIntegerInput.select(); // Selektiraj tekst u prvom BPM polju
                }

            } catch (error) {
                console.error("Greška pri parsiranju XML datoteke:", error);
                if (xmlStatus) {
                    xmlStatus.textContent = `Greška pri učitavanju: ${error.message}`;
                    xmlStatus.style.display = 'inline-block';
                    xmlStatus.style.color = 'red'; // Greška crvenom bojom
                }
                if (clearXmlButton) {
                    clearXmlButton.style.display = 'inline-block';
                }
                if (rezultatDiv) {
                    rezultatDiv.textContent = `Greška pri parsiranju XML-a: ${error.message}`;
                    rezultatDiv.style.color = 'red';
                }
                // U slučaju greške, vrati fokus na gumb za učitavanje datoteke
                if (ediusXmlFileInput) {
                    ediusXmlFileInput.focus();
                }
            }
        };
        reader.readAsText(file);
    } else {
        clearXmlData();
    }
}

// Funkcija za poništavanje učitanog XML-a i resetiranje input polja
function clearXmlData() {
    musicStartTC = null;
    musicEndTC = null;
    fileStartTC = null;
    fileEndTC = null;
    autoMusicStartTC = null; 
    autoMusicEndTC = null;   
    midSegmentTC = null; // Resetiramo središnji timecode
    calculatedBeatMarkers = [];

    if (ediusXmlFileInput) ediusXmlFileInput.value = ''; // Resetiraj file input
    if (pocetakGlazbenogSegmentaInput) pocetakGlazbenogSegmentaInput.textContent = '';
    if (krajGlazbenogSegmentaInput) krajGlazbenogSegmentaInput.textContent = '';
    if (ukupnoTrajanjeDatotekeInput) ukupnoTrajanjeDatotekeInput.textContent = '';

    if (xmlStatus) {
        xmlStatus.style.display = 'none';
        xmlStatus.style.color = ''; // Resetiraj boju
    }
    if (clearXmlButton) clearXmlButton.style.display = 'none';
    if (rezultatDiv) {
        rezultatDiv.textContent = ''; 
        rezultatDiv.style.color = ''; // Resetiraj boju
    }
    if (markeriOutput) markeriOutput.innerHTML = '';
    if (xmlOutputDiv) { 
        xmlOutputDiv.innerHTML = '';
        xmlOutputDiv.style.display = 'none'; // SAKRIJ xmlOutputDiv
    }
    if (downloadXmlButton) downloadXmlButton.style.display = 'none'; // SAKRIJ gumb za preuzimanje

    // Postavi defaultne vrijednosti za nova BPM polja
    if (fiksniBPMIntegerInput) fiksniBPMIntegerInput.value = "120";
    if (fiksniBPMDecimalInput) fiksniBPMDecimalInput.value = "0000";
    if (ciljaniBPMIntegerInput) ciljaniBPMIntegerInput.value = "128";
    if (ciljaniBPMDecimalInput) ciljaniBPMDecimalInput.value = "0000";
    
    if (fpsSelect) fpsSelect.value = "25";
    if (mjeraTaktaInput) mjeraTaktaInput.value = "4";
    // NOVO: Resetiraj checkbox na unchecked
    if (exportOnlyMeasureStartsCheckbox) exportOnlyMeasureStartsCheckbox.checked = false;

    // Postavljanje defaultne vrijednosti za ukupno trajanje na <p> elementu
    if (ukupnoTrajanjeDatotekeInput) ukupnoTrajanjeDatotekeInput.textContent = "00:05:00:00"; 
    if (pragDriftaFrameoviInput) pragDriftaFrameoviInput.value = "1";

    // NAKON ČIŠĆENJA, VRATI FOKUS NA GUMB ZA UČITAVANJE DATOTEKE
    if (ediusXmlFileInput) {
        ediusXmlFileInput.focus();
    }
}


/**
 * Parsira EDIUS XML string i izvlači timecodeove markera.
 * Postavlja globalne varijable musicStartTC i musicEndTC.
 * @param {string} xmlString Sadržaj EDIUS XML datoteke.
 */
function parseEdiusXmlFile(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // Provjera pogrešaka pri parsiranju
    const errorNode = xmlDoc.querySelector('parsererror');
    if (errorNode) {
        console.error('Greška pri parsiranju XML-a:', errorNode.textContent);
        throw new Error(`Greška pri parsiranju XML-a: ${errorNode.textContent}`);
    }

    console.log("XML dokument učitan (parseEdiusXmlFile):", xmlDoc);

    // Definiramo Edius namespace URI ovdje, koristit ćemo ga za sve XPath evaluacije i kreiranje elemenata
    const EDIUS_XML_NAMESPACE_URI = 'http://www.grassvalley.com/ns/edius/markerListInfo'; // PROVJERI DA JE OVO IDENTIČNO S EDIUS XML-om!

    // Korištenje XPath za sigurnije dohvaćanje elemenata s namespace-om
    const markers = xmlDoc.evaluate('//edius:marker', xmlDoc, (prefix) => {
        if (prefix === 'edius') return EDIUS_XML_NAMESPACE_URI;
        return null;
    }, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);


    console.log("Pronađeni markeri (Snapshot) (parseEdiusXmlFile):", markers.snapshotLength);

    if (markers.snapshotLength < 2) { // Minimalno 2 markera za početak i kraj glazbe
        console.warn("Manje od 2 markera pronađeno u XML datoteci. Ne mogu automatski postaviti 'glazba_pocetak' i 'glazba_kraj'.");
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Upozorenje: Nema dovoljno markera (min. 2) za automatsko postavljanje "glazba_pocetak" i "glazba_kraj".';
            rezultatDiv.style.color = 'orange';
        }
        // I dalje nastavljamo s parsiranjem ako ima bar jedan marker, ali bez auto-oznake
    }

    // Resetiranje globalnih varijabli prije popunjavanja
    musicStartTC = null;
    musicEndTC = null;
    fileStartTC = null;
    fileEndTC = null;
    autoMusicStartTC = null;
    autoMusicEndTC = null;
    midSegmentTC = null; // reset

    // Dohvaćanje prvog, drugog, predzadnjeg i zadnjeg markera
    if (markers.snapshotLength > 0) {
        const firstMarker = markers.snapshotItem(0);
        const lastMarker = markers.snapshotItem(markers.snapshotLength - 1);

        // Korištenje XPatha za dohvaćanje unutar markera
        const firstMarkerPosNode = xmlDoc.evaluate('edius:position', firstMarker, (prefix) => {
            if (prefix === 'edius') return EDIUS_XML_NAMESPACE_URI;
            return null;
        }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (firstMarkerPosNode) {
            fileStartTC = firstMarkerPosNode.textContent.trim();
            console.log("Pronađen prvi marker (fileStartTC):", fileStartTC);
        }

        const lastMarkerPosNode = xmlDoc.evaluate('edius:position', lastMarker, (prefix) => {
            if (prefix === 'edius') return EDIUS_XML_NAMESPACE_URI;
            return null;
        }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (lastMarkerPosNode) {
            fileEndTC = lastMarkerPosNode.textContent.trim();
            console.log("Pronađen zadnji marker (fileEndTC):", fileEndTC);
        }

        // POSTAVLJANJE AUTOMATSKIH GLAZBENIH MARKERA
        if (markers.snapshotLength >= 2) {
            const secondMarker = markers.snapshotItem(1); // Drugi marker (indeks 1)
            const secondMarkerPosNode = xmlDoc.evaluate('edius:position', secondMarker, (prefix) => {
                if (prefix === 'edius') return EDIUS_XML_NAMESPACE_URI;
                return null;
            }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (secondMarkerPosNode) {
                autoMusicStartTC = secondMarkerPosNode.textContent.trim();
                console.log("Automatski postavljen autoMusicStartTC (drugi marker):", autoMusicStartTC);
            }
        }
        
        if (markers.snapshotLength >= 2) {
            // Predzadnji marker (indeks: ukupno - 2)
            const penultimateMarker = markers.snapshotItem(markers.snapshotLength - 2); 
            const penultimateMarkerPosNode = xmlDoc.evaluate('edius:position', penultimateMarker, (prefix) => {
                if (prefix === 'edius') return EDIUS_XML_NAMESPACE_URI;
                return null;
            }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (penultimateMarkerPosNode) {
                autoMusicEndTC = penultimateMarkerPosNode.textContent.trim();
                console.log("Automatski postavljen autoMusicEndTC (predzadnji marker):", autoMusicEndTC);
            }
        }
    }


    // Iteriranje kroz markere za pronalaženje 'glazba_pocetak' i 'glazba_kraj'
    // I dalje tražimo ako su ručno dodani (za premošćivanje automatskih)
    for (let i = 0; i < markers.snapshotLength; i++) {
        const marker = markers.snapshotItem(i);

        const commentNode = xmlDoc.evaluate('edius:comment', marker, (prefix) => {
            if (prefix === 'edius') return EDIUS_XML_NAMESPACE_URI;
            return null;
        }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        const positionNode = xmlDoc.evaluate('edius:position', marker, (prefix) => {
            if (prefix === 'edius') return EDIUS_XML_NAMESPACE_URI;
            return null;
        }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;


        if (commentNode && positionNode) {
            const comment = commentNode.textContent.trim();
            const position = positionNode.textContent.trim();

            if (comment === 'glazba_pocetak') {
                musicStartTC = position; // Ručno dodani ima prednost
                console.log("!!! Ručno postavljen musicStartTC na:", musicStartTC);
            } else if (comment === 'glazba_kraj') {
                musicEndTC = position; // Ručno dodani ima prednost
                console.log("!!! Ručno postavljen musicEndTC na:", musicEndTC);
            }
        }
    }

    // Ažuriranje input polja na temelju parsiranih vrijednosti
    // Prioritet: ručno dodani markeri iz XML-a, pa onda automatski generirani.
    if (pocetakGlazbenogSegmentaInput) {
        pocetakGlazbenogSegmentaInput.textContent = musicStartTC || autoMusicStartTC || '';
    }
    if (krajGlazbenogSegmentaInput) {
        krajGlazbenogSegmentaInput.textContent = musicEndTC || autoMusicEndTC || '';
    }
    if (ukupnoTrajanjeDatotekeInput) {
        // Ako postoji fileEndTC iz Edius XML-a, popuni trajanje datoteke
        ukupnoTrajanjeDatotekeInput.textContent = fileEndTC || '';
    }

    // Provjera jesu li markeri za glazbu uspješno postavljeni
    if ((musicStartTC || autoMusicStartTC) && (musicEndTC || autoMusicEndTC)) {
        if (rezultatDiv) {
            rezultatDiv.textContent = ''; // Očisti rezultatDiv jer je status u xmlStatus
            rezultatDiv.style.color = '';
        }
    } else {
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Upozorenje: Nisu pronađeni "glazba_pocetak" i "glazba_kraj" markeri (ili nije dovoljno markera za automatsko prepoznavanje). Provjerite XML ili ih ručno dodajte.';
            rezultatDiv.style.color = 'orange';
        }
    }
}

/**
 * Konvertira timecode (HH:MM:SS:FF) u ukupni broj frameova.
 * @param {string} timecodeString Timecode u formatu HH:MM:SS:FF.
 * @param {number} fps Broj sličica u sekundi.
 * @returns {number} Ukupni broj frameova.
 */
function timecodeToFrames(timecodeString, fps) {
    const parts = timecodeString.split(':');
    if (parts.length !== 4) {
        throw new Error(`Neispravan timecode format: ${timecodeString}. Očekuje se HH:MM:SS:FF.`);
    }
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    const ss = parseInt(parts[2], 10);
    const ff = parseInt(parts[3], 10);

    return (hh * 3600 + mm * 60 + ss) * fps + ff;
}

/**
 * Konvertira ukupni broj frameova natrag u timecode (HH:MM:SS:FF).
 * @param {number} totalFrames Ukupni broj frameova.
 * @param {number} fps Broj sličica u sekundi.
 * @returns {string} Timecode u formatu HH:MM:SS:FF.
 */
function framesToTimecode(totalFrames, fps) {
    const totalSeconds = Math.floor(totalFrames / fps);
    const ff = totalFrames % fps;
    const ss = totalSeconds % 60;
    const mm = Math.floor((totalSeconds / 60) % 60);
    const hh = Math.floor(totalSeconds / 3600);

    return [hh, mm, ss, ff].map(val => val.toString().padStart(2, '0')).join(':');
}

/**
 * Izračunava markere i prikazuje rezultate, te prebacuje na stranicu rezultata.
 */
function calculateMarkersAndShowResults() {
    const fps = parseFloat(fpsSelect.value);
    
    // Dohvaćanje i spajanje BPM vrijednosti iz odvojenih polja
    const fiksniBPMInteger = fiksniBPMIntegerInput.value.padStart(3, '0');
    const fiksniBPMDecimal = fiksniBPMDecimalInput.value.padEnd(4, '0');
    const fiksniBPM = parseFloat(`${fiksniBPMInteger}.${fiksniBPMDecimal}`);

    const ciljaniBPMInteger = ciljaniBPMIntegerInput.value.padStart(3, '0');
    const ciljaniBPMDecimal = ciljaniBPMDecimalInput.value.padEnd(4, '0');
    const ciljaniBPM = parseFloat(`${ciljaniBPMInteger}.${ciljaniBPMDecimal}`);

    const mjeraTakta = parseInt(mjeraTaktaInput.value, 10);
    const pragDriftaFrameovi = parseInt(pragDriftaFrameoviInput.value, 10);

    // Dodane provjere postojanja elementa prije pristupa value/textContent
    if (isNaN(fiksniBPM) || fiksniBPM <= 0) {
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Greška: Unesite ispravan Fiksni BPM (veći od 0).';
            rezultatDiv.style.color = 'red';
        }
        return;
    }
    if (isNaN(ciljaniBPM) || ciljaniBPM <= 0) {
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Greška: Unesite ispravan Ciljani BPM (veći od 0).';
            rezultatDiv.style.color = 'red';
        }
        return;
    }
    if (!fpsSelect || isNaN(fps) || fps <= 0) {
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Greška: Unesite ispravan FPS (veći od 0).';
            rezultatDiv.style.color = 'red';
        }
        return;
    }
    if (!mjeraTaktaInput || isNaN(mjeraTakta) || mjeraTakta < 1) {
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Greška: Unesite ispravnu mjeru takta (barem 1).';
            rezultatDiv.style.color = 'red';
        }
        return;
    }
    if (!pragDriftaFrameoviInput || isNaN(pragDriftaFrameovi) || pragDriftaFrameovi < 0) {
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Greška: Unesite ispravan prag drifta (0 ili veći).';
            rezultatDiv.style.color = 'red';
        }
        return;
    }

    // Promijenjeno: Čitanje timecodeova iz textContenta <p> elemenata
    const pocetakSegmenta = pocetakGlazbenogSegmentaInput.textContent;
    const krajSegmenta = krajGlazbenogSegmentaInput.textContent;

    if (!pocetakSegmenta || !krajSegmenta) {
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Greška: Početni i krajnji timecode glazbenog segmenta nisu pronađeni. Učitajte XML datoteku ili osigurajte da postoje barem 2 markera za automatsko prepoznavanje.';
            rezultatDiv.style.color = 'red';
        }
        return;
    }

    try {
        const startFrames = timecodeToFrames(pocetakSegmenta, fps);
        const endFrames = timecodeToFrames(krajSegmenta, fps);

        if (endFrames <= startFrames) {
            if (rezultatDiv) {
                rezultatDiv.textContent = 'Greška: Krajnji timecode mora biti veći od početnog timecodea.';
                rezultatDiv.style.color = 'red';
            }
            return;
        }

        const durationFrames = endFrames - startFrames;

        // Izračunavanje varijabilnog BPM-a (drift)
        // Formula: Varijabilni BPM = Ciljani BPM - Fiksni BPM
        const varijabilniBPM = ciljaniBPM - fiksniBPM;

        // Izračunavanje framesPerBeat za početni i krajnji BPM
        const initialBpmFramesPerBeat = (fps * 60) / fiksniBPM;
        const finalBpmFramesPerBeat = (fps * 60) / (fiksniBPM + varijabilniBPM); // Ovdje se koristi fiksniBPM + varijabilniBPM za krajnji BPM

        console.log(`Početni timecode: ${pocetakSegmenta} (${startFrames} frames)`);
        console.log(`Krajnji timecode: ${krajSegmenta} (${endFrames} frames)`);
        console.log(`Trajanje segmenta: ${durationFrames} frames`);
        console.log(`FPS: ${fps}`);
        console.log(`Fiksni BPM: ${fiksniBPM}`);
        console.log(`Ciljani BPM: ${ciljaniBPM}`);
        console.log(`Izračunati varijabilni BPM (drift): ${varijabilniBPM.toFixed(4)}`);
        console.log(`Frames po beatu (početni): ${initialBpmFramesPerBeat.toFixed(2)}`);
        console.log(`Frames po beatu (krajnji): ${finalBpmFramesPerBeat.toFixed(2)}`);


        calculatedBeatMarkers = []; // Resetiraj globalnu listu markera
        let currentBeatFrame = startFrames;
        let beatIndex = 0;
        let markerDisplayHtml = '<h3>Izračunati Beat Markeri:</h3><ul>'; 

        while (currentBeatFrame <= endFrames) {
            const beatTimecode = framesToTimecode(Math.round(currentBeatFrame), fps);
            const comment = `Beat ${beatIndex}`;

            calculatedBeatMarkers.push({
                timecode: beatTimecode,
                comment: comment,
                beatIndex: beatIndex // Dodaj beatIndex za kasnije filtriranje
            });
            
            // Izračunavanje interpoliranog framesPerBeat za sljedeći takt
            const progress = (currentBeatFrame - startFrames) / durationFrames;
            const interpolatedFramesPerBeat = initialBpmFramesPerBeat + (finalBpmFramesPerBeat - initialBpmFramesPerBeat) * progress;

            currentBeatFrame += interpolatedFramesPerBeat;
            beatIndex++;
        }
       
        console.log("Izračunati beat markeri:", calculatedBeatMarkers);

        // Izračunaj središnji timecode segmenta
        const midFrames = startFrames + Math.round(durationFrames / 2);
        midSegmentTC = framesToTimecode(midFrames, fps);
        console.log("Središnji timecode segmenta (midSegmentTC):", midSegmentTC);


        // Prikaz upozorenja o driftu ako je varijabilniBPM veći od 0 ili manji od 0
        if (rezultatDiv) {
            if (varijabilniBPM !== 0) { // Ako je različito od 0, postoji drift
                rezultatDiv.textContent = `Generirano ${calculatedBeatMarkers.length} markera. Drift: ${varijabilniBPM.toFixed(4)}. Kliknite "Preuzmi XML" gumb.`;
                rezultatDiv.style.color = 'blue';
            } else {
                rezultatDiv.textContent = `Generirano ${calculatedBeatMarkers.length} markera. Nema drifta. Kliknite "Preuzmi XML" gumb.`;
                rezultatDiv.style.color = 'green';
            }
        }

        // Prikaži gumb za preuzimanje i izlaznu poruku
        if (downloadXmlButton) downloadXmlButton.style.display = 'inline-block';
        if (xmlOutputDiv) xmlOutputDiv.style.display = 'block'; 

    } catch (error) {
        console.error("Greška pri izračunu markera:", error);
        if (rezultatDiv) {
            rezultatDiv.textContent = `Greška pri izračunu: ${error.message}`;
            rezultatDiv.style.color = 'red';
        }
    }
}

/**
 * Glavna funkcija za generiranje XML-a i preuzimanje datoteke.
 */
function generateXmlAndDownload() {
    if (calculatedBeatMarkers.length === 0) {
        alert('Nema izračunatih markera za generiranje XML-a. Molimo prvo izračunajte markere.');
        return;
    }

    try {
        // Poziv funkcije za generiranje Edius-kompatibilnog XML-a
        // Ova funkcija će vratiti string s UTF-16 deklaracijom i CRLF prekidima
        const xmlContent = generateEdiusCompatibleXml(calculatedBeatMarkers); // musicStartTC i musicEndTC se sada uzimaju globalno

        // --- KLJUČNE LINIJE ZA RUČNU UTF-16 LE KONVERZIJU ---

        // 1. Dodaj BOM (Byte Order Mark) za UTF-16 Little Endian
        // BOM za UTF-16 LE je 0xFF 0xFE
        const bom = new Uint8Array([0xFF, 0xFE]);

        // 2. Kreiraj ArrayBuffer za smještaj UTF-16 kodiranih bajtova
        // Svaki znak u JavaScript stringu (UTF-16) zauzima 2 bajta
        const xmlContentUtf16Buffer = new ArrayBuffer(xmlContent.length * 2);
        const view = new DataView(xmlContentUtf16Buffer);

        // 3. Popuni buffer s UTF-16 LE bajtovima
        for (let i = 0; i < xmlContent.length; i++) {
            view.setUint16(i * 2, xmlContent.charCodeAt(i), true); // true za little-endian
        }

        // 4. Kombiniraj BOM i XML sadržaj u jedan ArrayBuffer za Blob
        const finalBuffer = new Uint8Array(bom.byteLength + xmlContentUtf16Buffer.byteLength);
        finalBuffer.set(new Uint8Array(bom), 0);
        finalBuffer.set(new Uint8Array(xmlContentUtf16Buffer), bom.byteLength);

        // Kreiranje Blob-a s ArrayBufferom i tipom 'application/xml'
        // Type se mijenja jer smo mi već obavili kodiranje, Blob ne treba više to raditi
        const blob = new Blob([finalBuffer], { type: 'application/xml' });


        // Korištenje FileSaver.js za preuzimanje datoteke
        saveAs(blob, 'Edius_Beat_Markers.xml');
        if (xmlOutputDiv) {
            xmlOutputDiv.textContent = 'XML datoteka "Edius_Beat_Markers.xml" uspješno preuzeta.';
            xmlOutputDiv.style.color = 'green';
        }

    } catch (error) {
        console.error("Greška pri generiranju XML-a:", error);
        if (xmlOutputDiv) {
            xmlOutputDiv.textContent = `Greška pri generiranju XML-a: ${error.message}`;
            xmlOutputDiv.style.color = 'red';
        }
    }
}

// --- Pomoćna funkcija za formatiranje datuma u Edius formatu ---
function getFormattedEdiusDate() {
    const now = new Date();
    const days = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
    const months = ['Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'];

    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dayNum = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const year = now.getFullYear();

    return `${dayName} ${monthName} ${dayNum} ${hours}:${minutes}:${seconds} ${year}`;
}

// --- Funkcija za generiranje Edius-kompatibilnog XML-a ---
// Ova funkcija sada koristi globalne musicStartTC i musicEndTC varijable
// koje su popunjene ili ručno ili automatski.
function generateEdiusCompatibleXml(beatMarkers) {
    const XML_NAMESPACE_URI = 'http://www.grassvalley.com/ns/edius/markerListInfo'; // Ovo je ključno! Mora biti točno kao u Edius XML-u.

    const doc = document.implementation.createDocument(XML_NAMESPACE_URI, 'edius:markerInfo', null);
    const root = doc.documentElement;

    root.setAttribute('xmlns:edius', XML_NAMESPACE_URI);

    const formatVersion = doc.createElementNS(XML_NAMESPACE_URI, 'edius:formatVersion');
    formatVersion.textContent = '4';
    root.appendChild(formatVersion);

    const createDate = doc.createElementNS(XML_NAMESPACE_URI, 'edius:CreateDate');
    createDate.textContent = getFormattedEdiusDate();
    root.appendChild(createDate);

    const markerLists = doc.createElementNS(XML_NAMESPACE_URI, 'edius:markerLists');
    root.appendChild(markerLists);

    let markerNoCounter = 1;

    // Uzimamo aktualne početne i krajnje TC-eve za glazbeni segment
    const actualMusicStartTC = musicStartTC || autoMusicStartTC;
    const actualMusicEndTC = musicEndTC || autoMusicEndTC;

    // Dohvati stanje checkboxa
    const shouldExportOnlyMeasureStarts = exportOnlyMeasureStartsCheckbox.checked;
    const mjeraTakta = parseInt(mjeraTaktaInput.value, 10); // Dohvati mjeru takta

    // 1. Dodaje prvi marker iz originalne datoteke (ili 00:00:00:00 ako nije pronađen)
    const initialFileMarker = doc.createElementNS(XML_NAMESPACE_URI, 'edius:marker');
    initialFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:no')).textContent = markerNoCounter++;
    initialFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:anchor')).textContent = '1';
    initialFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:position')).textContent = fileStartTC || '00:00:00:00';
    initialFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:duration')).textContent = '--:--:--:--';
    initialFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:comment')).textContent = 'File Start'; 
    initialFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:color')).textContent = '0xffffffff';
    markerLists.appendChild(initialFileMarker);

    // 2. Dodaje 'glazba_pocetak' marker (ako već nije dodan kao File Start)
    if (actualMusicStartTC && actualMusicStartTC !== (fileStartTC || '00:00:00:00')) {
        const startMarker = doc.createElementNS(XML_NAMESPACE_URI, 'edius:marker');
        startMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:no')).textContent = markerNoCounter++;
        startMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:anchor')).textContent = '1';
        startMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:position')).textContent = actualMusicStartTC;
        startMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:duration')).textContent = '--:--:--:--';
        startMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:comment')).textContent = 'glazba_pocetak';
        startMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:color')).textContent = '0xffffffff';
        markerLists.appendChild(startMarker);
    } else if (actualMusicStartTC && actualMusicStartTC === (fileStartTC || '00:00:00:00')) {
        // Ažuriraj komentar prvog markera ako je glazba_pocetak na istom mjestu kao i početak datoteke
        initialFileMarker.querySelector('edius:comment').textContent = 'glazba_pocetak / File Start';
    }


    // 3. Dodaje "Sredina Drifta" marker
    // Provjeravamo da li središnji marker postoji i da nije isti kao početni ili krajnji.
    if (midSegmentTC && midSegmentTC !== actualMusicStartTC && midSegmentTC !== actualMusicEndTC) {
        const midMarker1 = doc.createElementNS(XML_NAMESPACE_URI, 'edius:marker');
        midMarker1.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:no')).textContent = markerNoCounter++;
        midMarker1.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:anchor')).textContent = '1';
        midMarker1.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:position')).textContent = midSegmentTC;
        midMarker1.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:duration')).textContent = '--:--:--:--';
        midMarker1.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:comment')).textContent = 'Sredina Drifta';
        midMarker1.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:color')).textContent = '0xffffffff';
        markerLists.appendChild(midMarker1);
    }


    // 4. Dodaje sve izračunate beat markere
    // Filtriramo markere na temelju checkboxa i da ne dodamo duplikate
    beatMarkers.forEach((marker) => {
        // Provjeri treba li exportirati samo početke taktova
        const isMeasureStart = (marker.beatIndex % mjeraTakta === 0);

        if (shouldExportOnlyMeasureStarts && !isMeasureStart) {
            return; // Preskoči ako želimo samo početke taktova, a ovo nije početak takta
        }

        // Uvijek preskoči duplikate s fiksnim markerima
        if (marker.timecode !== actualMusicStartTC && marker.timecode !== actualMusicEndTC && marker.timecode !== midSegmentTC) {
            const beatMarker = doc.createElementNS(XML_NAMESPACE_URI, 'edius:marker');
            beatMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:no')).textContent = markerNoCounter++;
            beatMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:anchor')).textContent = '1';
            beatMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:position')).textContent = marker.timecode;
            beatMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:duration')).textContent = '--:--:--:--';
            beatMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:comment')).textContent = marker.comment;
            beatMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:color')).textContent = '0xffffffff';
            markerLists.appendChild(beatMarker);
        }
    });

    // 5. Dodaje 'glazba_kraj' marker (ako već nije dodan kao zadnji marker datoteke)
    if (actualMusicEndTC && actualMusicEndTC !== fileEndTC) {
        const endMarker = doc.createElementNS(XML_NAMESPACE_URI, 'edius:marker');
        endMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:no')).textContent = markerNoCounter++;
        endMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:anchor')).textContent = '1';
        endMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:position')).textContent = actualMusicEndTC;
        endMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:duration')).textContent = '--:--:--:--';
        endMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:comment')).textContent = 'glazba_kraj';
        endMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:color')).textContent = '0xffffffff';
        markerLists.appendChild(endMarker);
    } else if (actualMusicEndTC && actualMusicEndTC === fileEndTC) {
        // Ažuriraj komentar zadnjeg markera ako je glazba_kraj na istom mjestu kao i kraj datoteke
        // Ovo pretpostavlja da je fileEndTC već dodan.
        const lastMarkerInList = markerLists.lastChild; // Dohvaća zadnje dodani marker
        if (lastMarkerInList && lastMarkerInList.querySelector('edius:position').textContent === fileEndTC) {
             const commentNode = lastMarkerInList.querySelector('edius:comment');
             if (commentNode.textContent.includes('File End')) { // Provjeri je li to zadnji marker datoteke
                 commentNode.textContent = 'glazba_kraj / File End';
             }
        }
    }
    
    // 6. Dodaje zadnji marker iz originalne datoteke (ako nije već 'glazba_kraj')
    // Ovaj marker treba biti zadnji u listi, osim ako je glazba_kraj već na toj poziciji
    if (fileEndTC && fileEndTC !== actualMusicEndTC) {
        const finalFileMarker = doc.createElementNS(XML_NAMESPACE_URI, 'edius:marker');
        finalFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:no')).textContent = markerNoCounter++;
        finalFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:anchor')).textContent = '1';
        finalFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:position')).textContent = fileEndTC;
        finalFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:duration')).textContent = '--:--:--:--';
        finalFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:comment')).textContent = 'File End'; 
        finalFileMarker.appendChild(doc.createElementNS(XML_NAMESPACE_URI, 'edius:color')).textContent = '0xffffffff';
        markerLists.appendChild(finalFileMarker);
    }


    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(doc);

    // Dodaje UTF-16 XML deklaraciju i uklanja potencijalnu defaultnu UTF-8 deklaraciju
    xmlString = `<?xml version="1.0" encoding="UTF-16" standalone="no"?>\n` +
                xmlString.replace(/<\?xml version="1.0"( encoding="utf-8")?\?>/i, '');

    // Zamjena LF s CRLF za Windows kompatibilnost
    xmlString = xmlString.replace(/\n/g, '\r\n');

    return xmlString;
}

// Pozovi ovu funkciju kada se stranica učita
document.addEventListener('DOMContentLoaded', initializeApp);