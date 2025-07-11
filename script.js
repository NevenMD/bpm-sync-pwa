// Globalne varijable za pohranu početnog i krajnjeg timecodea glazbenog segmenta
// Ove varijable se postavljaju kada se učita EDIUS XML datoteka.
let musicStartTC = null;
let musicEndTC = null;
let fileStartTC = null; // Prvi marker iz Edius XML-a
let fileEndTC = null;   // Zadnji marker iz Edius XML-a

// Globalna varijabla za pohranu izračunatih beat markera za generiranje XML-a
let calculatedBeatMarkers = [];

// HTML elementi - Ažurirani ID-jevi i dodani novi
const ediusXmlFileInput = document.getElementById('ediusXmlFile');
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
                if (xmlStatus) {
                    xmlStatus.textContent = `Učitano: ${file.name}`;
                    xmlStatus.style.display = 'block';
                }
                if (clearXmlButton) {
                    clearXmlButton.style.display = 'inline-block';
                }
                console.log("EDIUS XML datoteka uspješno pročitana.");
                if (rezultatDiv) {
                    rezultatDiv.textContent = 'EDIUS XML datoteka uspješno učitana. Sada možete izračunati markere.';
                    rezultatDiv.style.color = 'green';
                }

            } catch (error) {
                console.error("Greška pri parsiranju XML datoteke:", error);
                if (xmlStatus) {
                    xmlStatus.textContent = `Greška pri učitavanju: ${error.message}`;
                    xmlStatus.style.display = 'block';
                }
                if (clearXmlButton) {
                    clearXmlButton.style.display = 'inline-block';
                }
                if (rezultatDiv) {
                    rezultatDiv.textContent = `Greška pri pars