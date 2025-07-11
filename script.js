// Globalne varijable za pohranu početnog i krajnjeg timecodea glazbenog segmenta
// Ove varijable se postavljaju kada se učita EDIUS XML datoteka.
let musicStartTC = null;
let musicEndTC = null;
let fileStartTC = null; // Prvi marker iz Edius XML-a
let fileEndTC = null;   // Zadnji marker iz Edius XML-a

// Globalna varijabla za pohranu izračunatih beat markera za generiranje XML-a
let calculatedBeatMarkers = [];

// HTML elementi - Ažurirani ID-jevi i dodani novi
const ediusXmlFileInput = document.getElementById('ediusXmlFile'); // ISPRAVLJEN ID
const clearXmlButton = document.getElementById('clearXmlButton');
const xmlStatus = document.getElementById('xmlStatus');

const fiksniBPMInput = document.getElementById('fiksniBPM');
const ciljaniBPMInput = document.getElementById('ciljaniBPM');
const fpsSelect = document.getElementById('fpsSelect');
const mjeraTaktaInput = document.getElementById('mjeraTakta');
const ukupnoTrajanjeDatotekeInput = document.getElementById('ukupnoTrajanjeDatotekeInput');
const pocetakGlazbenogSegmentaInput = document.getElementById('pocetakGlazbenogSegmentaInput');
const krajGlazbenogSegmentaInput = document.getElementById('krajGlazbenogSegmentaInput');
const pragDriftaFrameoviInput = document.getElementById('pragDriftaFrameovi');

const calculateButton = document.getElementById('calculateButton');
const generateXmlButton = document.getElementById('generateXmlButton'); // Novi gumb za generiranje XML-a (ako postoji, ali koristimo downloadXmlButton)
const downloadXmlButton = document.getElementById('downloadXmlButton'); // Gumb za preuzimanje XML-a

const inputPage = document.getElementById('input-page');
const resultsPage = document.getElementById('results-page');
const markeriOutput = document.getElementById('markeriOutput');
const xmlOutputDiv = document.getElementById('xmlOutput');
const rezultatDiv = document.getElementById('rezultat'); // VAŽNO: PROVJERI HTML ZA OVAJ ID!

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

// Inicijalizacija stanja aplikacije
function initializeApp() {
    clearXmlData(); // Počistimo sve na početku
    showPage('input-page'); // Prikazujemo početnu stranicu
}

// Funkcija za prebacivanje između stranica
function showPage(pageId) {
    if (inputPage) inputPage.classList.remove('active');
    if (resultsPage) resultsPage.classList.remove('active');

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        // Skrivanje/prikaz gumba za preuzimanje XML-a ovisno o stranici
        if (pageId === 'results-page') {
            if (downloadXmlButton) downloadXmlButton.style.display = 'block';
        } else {
            if (downloadXmlButton) downloadXmlButton.style.display = 'none';
        }
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
                if (xmlStatus) { // Dodana provjera postojanja elementa
                    xmlStatus.textContent = `Učitano: ${file.name}`;
                    xmlStatus.style.display = 'block';
                }
                if (clearXmlButton) { // Dodana provjera postojanja elementa
                    clearXmlButton.style.display = 'inline-block';
                }
                console.log("EDIUS XML datoteka uspješno pročitana.");
                if (rezultatDiv) { // Dodana provjera postojanja elementa
                    rezultatDiv.textContent = 'EDIUS XML datoteka uspješno učitana. Sada možete izračunati markere.';
                }

            } catch (error) {
                console.error("Greška pri parsiranju XML datoteke:", error);
                if (xmlStatus) { // Dodana provjera postojanja elementa
                    xmlStatus.textContent = `Greška pri učitavanju: ${error.message}`;
                    xmlStatus.style.display = 'block';
                }
                if (clearXmlButton) { // Dodana provjera postojanja elementa
                    clearXmlButton.style.display = 'inline-block';
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
    calculatedBeatMarkers = [];

    if (ediusXmlFileInput) ediusXmlFileInput.value = ''; // Resetiraj file input
    if (pocetakGlazbenogSegmentaInput) pocetakGlazbenogSegmentaInput.value = '';
    if (krajGlazbenogSegmentaInput) krajGlazbenogSegmentaInput.value = '';
    if (xmlStatus) xmlStatus.style.display = 'none';
    if (clearXmlButton) clearXmlButton.style.display = 'none';
    if (rezultatDiv) rezultatDiv.textContent = ''; // Provjera postojanja
    if (markeriOutput) markeriOutput.innerHTML = '';
    if (xmlOutputDiv) xmlOutputDiv.innerHTML = '';
    if (downloadXmlButton) downloadXmlButton.style.display = 'none';

    // Postavi defaultne vrijednosti (ako želiš da se inputi vrate na nešto)
    if (fiksniBPMInput) fiksniBPMInput.value = "120.0000";
    if (ciljaniBPMInput) ciljaniBPMInput.value = "128.0000";
    if (fpsSelect) fpsSelect.value = "25";
    if (mjeraTaktaInput) mjeraTaktaInput.value = "4";
    if (ukupnoTrajanjeDatotekeInput) ukupnoTrajanjeDatotekeInput.value = "00:05:00:00";
    if (pragDriftaFrameoviInput) pragDriftaFrameoviInput.value = "1";

    showPage('input-page'); // Vrati se na početnu stranicu
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

    // Korištenje XPath za sigurnije dohvaćanje elemenata s namespace-om
    const markers = xmlDoc.evaluate('//edius:marker', xmlDoc, (prefix) => {
        if (prefix === 'edius') return 'http://www.grassvalley.com/ns/edius/markerListInfo';
        return null;
    }, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);


    console.log("Pronađeni markeri (Snapshot) (parseEdiusXmlFile):", markers.snapshotLength);

    if (markers.snapshotLength === 0) {
        console.warn("Nema markera pronađenih u XML datoteci.");
        if (rezultatDiv) rezultatDiv.textContent = 'Upozorenje: Nema markera pronađenih u XML datoteci.';
        return;
    }

    // Resetiranje globalnih varijabli prije popunjavanja
    musicStartTC = null;
    musicEndTC = null;
    fileStartTC = null;
    fileEndTC = null;

    // Dohvaćanje prvog i zadnjeg markera
    if (markers.snapshotLength > 0) {
        const firstMarker = markers.snapshotItem(0);
        const lastMarker = markers.snapshotItem(markers.snapshotLength - 1);

        // Ažurirano: Korištenje XPatha za dohvaćanje unutar markera
        const firstMarkerPosNode = xmlDoc.evaluate('edius:position', firstMarker, (prefix) => {
            if (prefix === 'edius') return 'http://www.grassvalley.com/ns/edius/markerListInfo';
            return null;
        }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (firstMarkerPosNode) {
            fileStartTC = firstMarkerPosNode.textContent.trim();
            console.log("Pronađen prvi marker (fileStartTC):", fileStartTC);
        }

        const lastMarkerPosNode = xmlDoc.evaluate('edius:position', lastMarker, (prefix) => {
            if (prefix === 'edius') return 'http://www.grassvalley.com/ns/edius/markerListInfo';
            return null;
        }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (lastMarkerPosNode) {
            fileEndTC = lastMarkerPosNode.textContent.trim();
            console.log("Pronađen zadnji marker (fileEndTC):", fileEndTC);
        }
    }

    // Iteriranje kroz markere za pronalaženje 'glazba_pocetak' i 'glazba_kraj'
    for (let i = 0; i < markers.snapshotLength; i++) {
        const marker = markers.snapshotItem(i);

        // Ažurirano: Korištenje XPatha za dohvaćanje unutar markera
        const commentNode = xmlDoc.evaluate('edius:comment', marker, (prefix) => {
            if (prefix === 'edius') return 'http://www.grassvalley.com/ns/edius/markerListInfo';
            return null;
        }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        const positionNode = xmlDoc.evaluate('edius:position', marker, (prefix) => {
            if (prefix === 'edius') return 'http://www.grassvalley.com/ns/edius/markerListInfo';
            return null;
        }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;


        if (commentNode && positionNode) {
            const comment = commentNode.textContent.trim();
            const position = positionNode.textContent.trim();

            console.log(`--- Marker ${i + 1} ---`);
            console.log(" Sadržaj komentara:", JSON.stringify(comment));
            console.log(" Sadržaj pozicije:", JSON.stringify(position));

            if (comment === 'glazba_pocetak') {
                musicStartTC = position;
                console.log("!!! Postavljen musicStartTC na:", musicStartTC);
            } else if (comment === 'glazba_kraj') {
                musicEndTC = position;
                console.log("!!! Postavljen musicEndTC na:", musicEndTC);
            }
        } else {
            console.warn(`Marker ${i + 1} nema element za komentar ili poziciju.`);
        }
    }

    // Ažuriranje input polja na temelju parsiranih vrijednosti
    if (pocetakGlazbenogSegmentaInput) {
        pocetakGlazbenogSegmentaInput.value = musicStartTC || '';
    }
    if (krajGlazbenogSegmentaInput) {
        krajGlazbenogSegmentaInput.value = musicEndTC || '';
    }
    if (ukupnoTrajanjeDatotekeInput) {
        // Ako postoji fileEndTC iz Edius XML-a, popuni trajanje datoteke
        ukupnoTrajanjeDatotekeInput.value = fileEndTC || '';
    }

    if (musicStartTC && musicEndTC) {
        if (rezultatDiv) { // Dodana provjera postojanja elementa
            rezultatDiv.textContent = 'Uspješno učitani i postavljeni XML podaci u input polja. Sada možete kliknuti "Izračunaj Markere".';
            rezultatDiv.style.color = 'green';
        }
    } else {
        if (rezultatDiv) { // Dodana provjera postojanja elementa
            rezultatDiv.textContent = 'Upozorenje: "glazba_pocetak" ili "glazba_kraj" markeri nisu pronađeni u XML-u. Unesite ih ručno ili provjerite XML.';
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
    const fiksniBPM = parseFloat(fiksniBPMInput.value);
    const ciljaniBPM = parseFloat(ciljaniBPMInput.value);
    const mjeraTakta = parseInt(mjeraTaktaInput.value, 10);
    const pragDriftaFrameovi = parseInt(pragDriftaFrameoviInput.value, 10);

    // Dodane provjere postojanja elementa prije pristupa value/textContent
    if (!fiksniBPMInput || isNaN(fiksniBPM) || fiksniBPM <= 0) {
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Greška: Unesite ispravan Fiksni BPM (veći od 0).';
            rezultatDiv.style.color = 'red';
        }
        return;
    }
    if (!ciljaniBPMInput || isNaN(ciljaniBPM) || ciljaniBPM <= 0) {
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

    const pocetakSegmenta = pocetakGlazbenogSegmentaInput.value;
    const krajSegmenta = krajGlazbenogSegmentaInput.value;

    if (!pocetakSegmenta || !krajSegmenta) {
        if (rezultatDiv) {
            rezultatDiv.textContent = 'Greška: Molimo unesite početni i krajnji timecode glazbenog segmenta (ili učitajte XML).';
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
        console.log(`Izračunati varijabilni BPM (drift): ${varijabilniBPM.toFixed(4)}`); // Preciznost za varijabilni BPM
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
                comment: comment
            });
            markerDisplayHtml += `<li>${comment}: ${beatTimecode}</li>`;

            // Izračunavanje interpoliranog framesPerBeat za sljedeći takt
            const progress = (currentBeatFrame - startFrames) / durationFrames;
            const interpolatedFramesPerBeat = initialBpmFramesPerBeat + (finalBpmFramesPerBeat - initialBpmFramesPerBeat) * progress;

            currentBeatFrame += interpolatedFramesPerBeat;
            beatIndex++;
        }
        markerDisplayHtml += '</ul>';
        if (markeriOutput) markeriOutput.innerHTML = markerDisplayHtml; // Provjera postojanja

        console.log("Izračunati beat markeri:", calculatedBeatMarkers);

        // Prikaz upozorenja o driftu ako je varijabilniBPM veći od 0 ili manji od 0
        if (rezultatDiv) { // Provjera postojanja
            if (varijabilniBPM !== 0) { // Ako je različito od 0, postoji drift
                rezultatDiv.textContent = `Generirano ${calculatedBeatMarkers.length} markera. Drift: ${varijabilniBPM.toFixed(4)}. Kliknite "Preuzmi XML" gumb.`;
                rezultatDiv.style.color = 'blue';
            } else {
                rezultatDiv.textContent = `Generirano ${calculatedBeatMarkers.length} markera. Nema drifta. Kliknite "Preuzmi XML" gumb.`;
                rezultatDiv.style.color = 'green';
            }
        }

        showPage('results-page'); // Prelazak na stranicu s rezultatima

    } catch (error) {
        console.error("Greška pri izračunu markera:", error);
        if (rezultatDiv) { // Provjera postojanja
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
        const xmlContent = generateEdiusCompatibleXml(calculatedBeatMarkers, musicStartTC, musicEndTC);

        // --- KLJUČNE NOVE LINIJE ZA RUČNU UTF-16 LE KONVERZIJU ---

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
        if (xmlOutputDiv) { // Provjera postojanja
            xmlOutputDiv.textContent = 'XML datoteka "Edius_Beat_Markers.xml" uspješno preuzeta.';
            xmlOutputDiv.style.color = 'green';
        }

    } catch (error) {
        console.error("Greška pri generiranju XML-a:", error);
        if (xmlOutputDiv) { // Provjera postojanja
            xmlOutputDiv.textContent = `Greška pri generiranju XML-a: ${error.message}`;
            xmlOutputDiv.style.color = 'red';
        }
    }
}

// --- Pomoćna funkcija za formatiranje datuma u Edius formatu ---
function getFormattedEdiusDate() {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
function generateEdiusCompatibleXml(beatMarkers, musicStartTC, musicEndTC) {
    const doc = document.implementation.createDocument(null, 'edius:markerInfo', null);
    const root = doc.documentElement;

    root.setAttribute('xmlns:edius', 'http://www.grassvalley.com/ns/edius/markerListInfo');

    const formatVersion = doc.createElement('edius:formatVersion');
    formatVersion.textContent = '4';
    root.appendChild(formatVersion);

    const createDate = doc.createElement('edius:CreateDate');
    createDate.textContent = getFormattedEdiusDate();
    root.appendChild(createDate);

    const markerLists = doc.createElement('edius:markerLists');
    root.appendChild(markerLists);

    let markerNoCounter = 1;

    // Dodaje početni marker na 00:00:00:00 ako je pronađen u ulaznom XML-u (fileStartTC)
    const initialMarker = doc.createElement('edius:marker');
    initialMarker.appendChild(doc.createElement('edius:no')).textContent = markerNoCounter++;
    initialMarker.appendChild(doc.createElement('edius:anchor')).textContent = '1';
    // Koristi fileStartTC iz parsiranog XML-a, ili default '00:00:00:00'
    initialMarker.appendChild(doc.createElement('edius:position')).textContent = fileStartTC || '00:00:00:00';
    initialMarker.appendChild(doc.createElement('edius:duration')).textContent = '--:--:--:--';
    initialMarker.appendChild(doc.createElement('edius:comment')).textContent = '';
    initialMarker.appendChild(doc.createElement('edius:color')).textContent = '0xffffffff';
    markerLists.appendChild(initialMarker);

    // Dodaje 'glazba_pocetak' marker ako je dostupan i nije isti kao početni marker (00:00:00:00)
    // Važno: Provjeravamo da li se musicStartTC razlikuje od initialMarkera da ne bi duplicirali 00:00:00:00
    if (musicStartTC && musicStartTC !== (fileStartTC || '00:00:00:00')) {
        const startMarker = doc.createElement('edius:marker');
        startMarker.appendChild(doc.createElement('edius:no')).textContent = markerNoCounter++;
        startMarker.appendChild(doc.createElement('edius:anchor')).textContent = '1';
        startMarker.appendChild(doc.createElement('edius:position')).textContent = musicStartTC;
        startMarker.appendChild(doc.createElement('edius:duration')).textContent = '--:--:--:--';
        startMarker.appendChild(doc.createElement('edius:comment')).textContent = 'glazba_pocetak';
        startMarker.appendChild(doc.createElement('edius:color')).textContent = '0xffffffff';
        markerLists.appendChild(startMarker);
    }

    // Dodaje sve izračunate beat markere
    beatMarkers.forEach((marker) => {
        const beatMarker = doc.createElement('edius:marker');
        beatMarker.appendChild(doc.createElement('edius:no')).textContent = markerNoCounter++;
        beatMarker.appendChild(doc.createElement('edius:anchor')).textContent = '1';
        beatMarker.appendChild(doc.createElement('edius:position')).textContent = marker.timecode;
        beatMarker.appendChild(doc.createElement('edius:duration')).textContent = '--:--:--:--';
        beatMarker.appendChild(doc.createElement('edius:comment')).textContent = marker.comment;
        beatMarker.appendChild(doc.createElement('edius:color')).textContent = '0xffffffff';
        markerLists.appendChild(beatMarker);
    });

    // Dodaje 'glazba_kraj' marker ako je dostupan
    if (musicEndTC) {
        const endMarker = doc.createElement('edius:marker');
        endMarker.appendChild(doc.createElement('edius:no')).textContent = markerNoCounter++;
        endMarker.appendChild(doc.createElement('edius:anchor')).textContent = '1';
        endMarker.appendChild(doc.createElement('edius:position')).textContent = musicEndTC;
        endMarker.appendChild(doc.createElement('edius:duration')).textContent = '--:--:--:--';
        endMarker.appendChild(doc.createElement('edius:comment')).textContent = 'glazba_kraj';
        endMarker.appendChild(doc.createElement('edius:color')).textContent = '0xffffffff';
        markerLists.appendChild(endMarker);
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