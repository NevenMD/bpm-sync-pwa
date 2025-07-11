// Globalne varijable za pohranu početnog i krajnjeg timecodea glazbenog segmenta
// Ove varijable se postavljaju kada se učita EDIUS XML datoteka.
let musicStartTC = null;
let musicEndTC = null;
let fileStartTC = null; // Prvi marker iz Edius XML-a
let fileEndTC = null;   // Zadnji marker iz Edius XML-a

// HTML elementi (pretpostavlja se da postoje u tvom HTML-u)
const xmlFileInput = document.getElementById('xmlFileInput');
const pocetakGlazbenogSegmentaInput = document.getElementById('pocetakGlazbenogSegmenta');
const krajGlazbenogSegmentaInput = document.getElementById('krajGlazbenogSegmenta');
const fpsInput = document.getElementById('fps');
const bpmInput = document.getElementById('bpm');
const varijabilniBpmInput = document.getElementById('varijabilniBPM'); // Dodano za varijabilni BPM
const generirajXmlBtn = document.getElementById('generirajXmlBtn');
const rezultatDiv = document.getElementById('rezultat'); // Div za prikaz rezultata

// Event listeneri
if (xmlFileInput) {
    xmlFileInput.addEventListener('change', handleXmlFileSelect);
}
if (generirajXmlBtn) {
    generirajXmlBtn.addEventListener('click', generateXmlAndDownload);
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
                console.log("EDIUS XML datoteka uspješno pročitana.");
                rezultatDiv.textContent = 'EDIUS XML datoteka uspješno učitana. Provjerite unesene vrijednosti i generirajte XML.';
            } catch (error) {
                console.error("Greška pri parsiranju XML datoteke:", error);
                rezultatDiv.textContent = `Greška pri učitavanju XML datoteke: ${error.message}`;
            }
        };
        reader.readAsText(file);
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

    const markers = xmlDoc.querySelectorAll('edius\\:marker');
    console.log("Pronađeni markeri (NodeList) (parseEdiusXmlFile):", markers);

    if (markers.length === 0) {
        console.warn("Nema markera pronađenih u XML datoteci.");
        rezultatDiv.textContent = 'Upozorenje: Nema markera pronađenih u XML datoteci.';
        return;
    }

    // Resetiranje globalnih varijabli
    musicStartTC = null;
    musicEndTC = null;
    fileStartTC = null;
    fileEndTC = null;

    // Prvi marker (obično 00:00:00:00)
    if (markers.length > 0) {
        const firstMarkerPos = markers[0].querySelector('edius\\:position');
        if (firstMarkerPos) {
            fileStartTC = firstMarkerPos.textContent;
            console.log("Pronađen prvi marker (fileStartTC):", fileStartTC);
        }
    }

    // Posljednji marker
    if (markers.length > 0) {
        const lastMarkerPos = markers[markers.length - 1].querySelector('edius\\:position');
        if (lastMarkerPos) {
            fileEndTC = lastMarkerPos.textContent;
            console.log("Pronađen zadnji marker (fileEndTC):", fileEndTC);
        }
    }

    markers.forEach((marker, index) => {
        console.log(`--- Marker ${index + 1} (parseEdiusXmlFile) ---`);
        const commentElement = marker.querySelector('edius\\:comment');
        const positionElement = marker.querySelector('edius\\:position');

        if (commentElement && positionElement) {
            console.log(" Pronađen komentar element (parseEdiusXmlFile):", commentElement);
            const comment = commentElement.textContent.trim();
            console.log(" Sadržaj komentara (parseEdiusXmlFile):", JSON.stringify(comment)); // Koristi JSON.stringify za vidljivost skrivenih znakova
            console.log(" Pronađena pozicija element (parseEdiusXmlFile):", positionElement);
            const position = positionElement.textContent.trim();
            console.log(" Sadržaj pozicije (parseEdiusXmlFile):", JSON.stringify(position));

            if (comment === 'glazba_pocetak') {
                musicStartTC = position;
                console.log("!!! Postavljen musicStartTC na (parseEdiusXmlFile):", musicStartTC);
            } else if (comment === 'glazba_kraj') {
                musicEndTC = position;
                console.log("!!! Postavljen musicEndTC na (parseEdiusXmlFile):", musicEndTC);
            }
        } else {
            console.warn(`Marker ${index + 1} nema element za komentar ili poziciju.`);
        }
    });

    // Ažuriranje input polja na temelju parsiranih vrijednosti
    if (pocetakGlazbenogSegmentaInput) {
        pocetakGlazbenogSegmentaInput.value = musicStartTC || '';
    }
    if (krajGlazbenogSegmentaInput) {
        krajGlazbenogSegmentaInput.value = musicEndTC || '';
    }

    if (musicStartTC && musicEndTC) {
        rezultatDiv.textContent = 'Uspješno učitani i postavljeni XML podaci u input polja.';
    } else {
        rezultatDiv.textContent = 'Upozorenje: "glazba_pocetak" ili "glazba_kraj" markeri nisu pronađeni u XML-u.';
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
 * Glavna funkcija za generiranje XML-a i preuzimanje datoteke.
 */
function generateXmlAndDownload() {
    const fps = parseFloat(fpsInput.value);
    const bpm = parseFloat(bpmInput.value);
    const varijabilniBPM = parseFloat(varijabilniBpmInput.value); // Čitanje varijabilnog BPM-a

    if (isNaN(fps) || fps <= 0) {
        rezultatDiv.textContent = 'Greška: Unesite ispravan FPS (veći od 0).';
        return;
    }
    if (isNaN(bpm) || bpm <= 0) {
        rezultatDiv.textContent = 'Greška: Unesite ispravan BPM (veći od 0).';
        return;
    }
    // Provjera varijabilnog BPM-a - može biti 0 ili veći
    if (isNaN(varijabilniBPM) || varijabilniBPM < 0) {
         rezultatDiv.textContent = 'Greška: Unesite ispravan varijabilni BPM (0 ili veći decimalni broj).';
         return;
    }

    const pocetakSegmenta = pocetakGlazbenogSegmentaInput.value;
    const krajSegmenta = krajGlazbenogSegmentaInput.value;

    if (!pocetakSegmenta || !krajSegmenta) {
        rezultatDiv.textContent = 'Greška: Molimo unesite početni i krajnji timecode glazbenog segmenta.';
        return;
    }

    try {
        const startFrames = timecodeToFrames(pocetakSegmenta, fps);
        const endFrames = timecodeToFrames(krajSegmenta, fps);

        if (endFrames <= startFrames) {
            rezultatDiv.textContent = 'Greška: Krajnji timecode mora biti veći od početnog timecodea.';
            return;
        }

        const durationFrames = endFrames - startFrames;
        const framesPerBeat = (fps * 60) / bpm;

        // Izračunavanje drift efekta
        const initialBpmFramesPerBeat = (fps * 60) / bpm;
        const finalBpmFramesPerBeat = (fps * 60) / (bpm + varijabilniBPM);

        console.log(`Početni timecode: ${pocetakSegmenta} (${startFrames} frames)`);
        console.log(`Krajnji timecode: ${krajSegmenta} (${endFrames} frames)`);
        console.log(`Trajanje segmenta: ${durationFrames} frames`);
        console.log(`FPS: ${fps}`);
        console.log(`BPM: ${bpm}`);
        console.log(`Varijabilni BPM: ${varijabilniBPM}`);
        console.log(`Frames po beatu (početni): ${initialBpmFramesPerBeat.toFixed(2)}`);
        console.log(`Frames po beatu (krajnji): ${finalBpmFramesPerBeat.toFixed(2)}`);

        const beatMarkers = [];
        let currentBeatFrame = startFrames;
        let beatIndex = 0;

        // Iteriranje kroz taktove i dodavanje markera
        while (currentBeatFrame <= endFrames) {
            beatMarkers.push({
                timecode: framesToTimecode(Math.round(currentBeatFrame), fps),
                comment: `Beat ${beatIndex}`
            });

            // Izračunavanje interpoliranog framesPerBeat za sljedeći takt
            // Linearna interpolacija: frames_po_beatu = (1 - progres) * početni_frames_po_beatu + progres * krajnji_frames_po_beatu
            const progress = (currentBeatFrame - startFrames) / durationFrames;
            const interpolatedFramesPerBeat = initialBpmFramesPerBeat + (finalBpmFramesPerBeat - initialBpmFramesPerBeat) * progress;

            currentBeatFrame += interpolatedFramesPerBeat;
            beatIndex++;
        }

        console.log("Izračunati beat markeri:", beatMarkers);

        // --- POZIV FUNKCIJE ZA GENERIRANJE EDIUS-KOMPATIBILNOG XML-a ---
        const xmlContent = generateEdiusCompatibleXml(beatMarkers, musicStartTC, musicEndTC);

        // KREIRANJE BLOB-a s eksplicitnim UTF-16 kodiranjem
        // Ovo bi trebalo prisiliti preglednik da datoteku kodira kao UTF-16
        const blob = new Blob([xmlContent], { type: 'text/xml;charset=utf-16' });

        // Korištenje FileSaver.js za preuzimanje datoteke
        saveAs(blob, 'Edius_Beat_Markers.xml');
        rezultatDiv.textContent = `Generirano ${beatMarkers.length} markera. Datoteka 'Edius_Beat_Markers.xml' preuzeta.`;

        // Prikaz upozorenja o driftu ako je varijabilniBPM veći od 0
        if (varijabilniBPM > 0) {
            rezultatDiv.textContent += `\nUpozorenje: Primijenjen je drift od ${varijabilniBPM.toFixed(2)} BPM-a.`;
        }

    } catch (error) {
        console.error("Greška pri generiranju XML-a:", error);
        rezultatDiv.textContent = `Greška: ${error.message}`;
    }
}

// --- Nova pomoćna funkcija za formatiranje datuma ---
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

// --- Nova funkcija za generiranje Edius-kompatibilnog XML-a ---
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
    // ili ga dodajemo uvijek kao standard. Edius ga obično izvozi.
    const initialMarker = doc.createElement('edius:marker');
    initialMarker.appendChild(doc.createElement('edius:no')).textContent = markerNoCounter++;
    initialMarker.appendChild(doc.createElement('edius:anchor')).textContent = '1';
    initialMarker.appendChild(doc.createElement('edius:position')).textContent = fileStartTC || '00:00:00:00'; // Koristi fileStartTC ako je dostupan
    initialMarker.appendChild(doc.createElement('edius:duration')).textContent = '--:--:--:--';
    initialMarker.appendChild(doc.createElement('edius:comment')).textContent = '';
    initialMarker.appendChild(doc.createElement('edius:color')).textContent = '0xffffffff';
    markerLists.appendChild(initialMarker);

    // Dodaje 'glazba_pocetak' marker ako je dostupan i nije isti kao početni marker 00:00:00:00
    if (musicStartTC && musicStartTC !== initialMarker.querySelector('edius\\:position').textContent) {
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

    // --- KLJUČNA NOVA LINIJA: Zamjena LF s CRLF za Windows kompatibilnost ---
    // Ovo osigurava da prekidi linija budu kompatibilni s Windows sustavima
    xmlString = xmlString.replace(/\n/g, '\r\n');

    return xmlString;
}