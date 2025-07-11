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
    const varijabilniBPM = parseFloat(varijabilniBPMInput.value); // Čitanje varijabilnog BPM-a

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
         rezultatDiv.textContent = 'Greška: Unesite ispravan varijabilni BPM (0 ili veći decimal