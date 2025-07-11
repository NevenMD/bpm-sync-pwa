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
const pocetakGlazbenogSegmentaInput = document.getElementById('pocetakGlazbenogSegmentaInput'); // ISPRAVLJEN ID (bio pocetakGlazbenogSegmenta)
const krajGlazbenogSegmentaInput = document.getElementById('krajGlazbenogSegmentaInput'); // ISPRAVLJEN ID (bio krajGlazbenogSegmenta)
const pragDriftaFrameoviInput = document.getElementById('pragDriftaFrameovi');

const calculateButton = document.getElementById('calculateButton');
const generateXmlButton = document.getElementById('generateXmlButton'); // Novi gumb za generiranje XML-a (ako postoji, ali koristimo downloadXmlButton)
const downloadXmlButton = document.getElementById('downloadXmlButton'); // Gumb za preuzimanje XML-a

const inputPage = document.getElementById('input-page');
const resultsPage = document.getElementById('results-page');
const markeriOutput = document.getElementById('markeriOutput');
const xmlOutputDiv = document.getElementById('xmlOutput');
const rezultatDiv = document.getElementById('rezultat'); // Koristit ćemo ovo za opće poruke

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
if (downloadXmlButton) { // Sada je ovo glavni gumb za preuzimanje
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
                xmlStatus.textContent = `Učitano: ${file.name}`;
                xmlStatus.style.display = 'block';
                clearXmlButton.style.display = 'inline-block';
                console.log("EDIUS XML datoteka uspješno pročitana.");
                // Ovdje NE mijenjamo stranicu, samo popunjavamo inpute
                rezultatDiv.textContent = 'EDIUS XML datoteka uspješno učitana. Sada možete izračunati markere.';

            } catch (error) {
                console.error("Greška pri parsiranju XML datoteke:", error);
                xmlStatus.textContent = `Greška pri učitavanju: ${error.message}`;
                xmlStatus.style.display = 'block';
                clearXmlButton.style.display = 'inline-block';
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
    if (rezultatDiv) rezultatDiv.textContent = '';
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
    // const markers = xmlDoc.querySelectorAll('edius\\:marker'); // Ovo radi u većini preglednika
    // Ažurirano za bolju kompatibilnost s namespaceovima koristeći evaluate
    const markers = xmlDoc.evaluate('//edius:marker', xmlDoc, (prefix) => {
        if (prefix === 'edius') return 'http://www.grassvalley.com/ns/edius/markerListInfo';
        return null;
    }, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);


    console.log("Pronađeni markeri (Snapshot) (parseEdiusXmlFile):", markers.snapshotLength);

    if (markers.snapshotLength === 0) {
        console.warn("Nema markera pronađenih u XML datoteci.");
        rezultatDiv.textContent = 'Upozorenje: Nema markera pronađenih u XML datoteci.';
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

        const firstMarkerPos = firstMarker.querySelector('edius\\:position');
        if (firstMarkerPos) {
            fileStartTC = firstMarkerPos.textContent.trim();
            console.log("Pronađen prvi marker (fileStartTC):", fileStartTC);
        }

        const lastMarkerPos = lastMarker.querySelector('edius\\:position');
        if (lastMarkerPos) {
            fileEndTC = lastMarkerPos.textContent.trim();
            console.log("Pronađen zadnji marker (fileEndTC):", fileEndTC);
        }
    }

    // Iteriranje kroz markere za pronalaženje 'glazba_pocetak' i 'glazba_kraj'
    for