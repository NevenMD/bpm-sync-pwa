// --- Funkcija za automatsko selektiranje teksta pri fokusu ---
// Kada korisnik tapne na input polje, sav tekst unutar njega će biti selektiran.
// To omogućuje da odmah počne tipkati novi broj bez ručnog brisanja starog.
function selectOnFocus(event) {
    event.target.select();
}

// Pronađi sva input polja tipa "number" na koja želiš primijeniti ovo ponašanje.
// Ovdje se automatski dohvaćaju i novi inputi za 'cijela' polja.
const numberInputs = document.querySelectorAll('input[type="number"]');

// Dodaj 'focus' event listener svakom pronađenom numeričkom input polju.
numberInputs.forEach(input => {
    input.addEventListener('focus', selectOnFocus);
});

// --- KRAJ KODA ZA AUTO-SELEKCIJU ---

// --- POČETAK KODA ZA AUTO-PREBACIVANJE FOKUSA NA SLJEDEĆE POLJE ---

// Funkcija za automatsko prebacivanje fokusa na sljedeće polje
function setupAutoAdvance() {
    // Dohvaćanje DOM elemenata unutar funkcije, kako bi bili sigurni da su dostupni
    const satiInput = document.getElementById('sati');
    const minuteInput = document.getElementById('minute');
    const sekundeInput = document.getElementById('sekunde');
    const frameoviInput = document.getElementById('frameovi');
    const fpsSelect = document.getElementById('fpsSelect'); // Treba nam za maxFrameove
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');

    // NOVI DOM elementi za ukupnu duljinu fizičke datoteke
    const satiCijeleInput = document.getElementById('satiCijele');
    const minuteCijeleInput = document.getElementById('minuteCijele');
    const sekundeCijeleInput = document.getElementById('sekundeCijele');
    const frameoviCijeleInput = document.getElementById('frameoviCijele');


    // Definiraj redoslijed polja za automatsko prebacivanje fokusa
    // Uključujemo i nova polja za ukupnu duljinu
    const orderedInputs = [
        satiInput,
        minuteInput,
        sekundeInput,
        frameoviInput,
        satiCijeleInput, // Dodano
        minuteCijeleInput, // Dodano
        sekundeCijeleInput, // Dodano
        frameoviCijeleInput // Dodano
    ];

    orderedInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            let value = input.value;
            // Provjeri postoji li sljedeći input u nizu
            const nextInput = orderedInputs[index + 1];

            // Preskoči ako polje nije broj ili je prazno
            if (isNaN(parseFloat(value)) || value.trim() === '') {
                return;
            }

            // Logika za sate, minute, sekunde (primjenjuje se na oba seta inputa)
            if (input === satiInput || input === minuteInput || input === sekundeInput ||
                input === satiCijeleInput || input === minuteCijeleInput || input === sekundeCijeleInput) {
                // Prebaci fokus kad korisnik unese 2 znamenke i broj je validan za minute/sekunde (0-59)
                // Sati mogu biti > 59, ali za dosljednost ostajemo na 2 znamenke za prebacivanje
                if (value.length === 2 && (input === satiInput || input === satiCijeleInput || (parseInt(value) >= 0 && parseInt(value) <= 59))) {
                    if (nextInput) {
                        nextInput.focus();
                    }
                }
            }
            // Logika za frameove (primjenjuje se na oba seta inputa)
            else if (input === frameoviInput || input === frameoviCijeleInput) {
                const currentFPS = parseFloat(fpsSelect.value);
                const maxFrames = Math.floor(currentFPS - 1); // Max valid frame value
                const typedValue = parseInt(value);
                const maxFramesStrLength = String(maxFrames).length;

                // Auto-advance ako je unesen broj dovoljno dug (ovisno o max frames)
                if ((value.length >= maxFramesStrLength && typedValue >=0 && typedValue <= maxFrames) || value.length === 2) {
                    if (input === frameoviInput) {
                        // Nakon frameova segmenta, prebaci na prve sate cijele datoteke
                        satiCijeleInput.focus();
                    } else if (input === frameoviCijeleInput) {
                        // Nakon frameova cijele datoteke, prebaci na mjeru takta
                        mjeraTaktaSelect.focus();
                    }
                }
            }
        });
    });
}
// --- KRAJ KODA ZA AUTO-PREBACIVANJE FOKUSA ---


// --- POČETAK KODA ZA PRORAČUN I PRIKAZ REZULTATA ---

// Dohvaćanje DOM elemenata
const fiksniBPMInput = document.getElementById('fiksniBPM');
const fpsSelect = document.getElementById('fpsSelect');

// Inputi za segment duljine glazbenog sadržaja
const satiInput = document.getElementById('sati');
const minuteInput = document.getElementById('minute');
const sekundeInput = document.getElementById('sekunde');
const frameoviInput = document.getElementById('frameovi');

// NOVI Inputi za ukupnu duljinu fizičke datoteke
const satiCijeleInput = document.getElementById('satiCijele');
const minuteCijeleInput = document.getElementById('minuteCijele');
const sekundeCijeleInput = document.getElementById('sekundeCijele');
const frameoviCijeleInput = document.getElementById('frameoviCijele');

const mjeraTaktaSelect = document.getElementById('mjeraTakta');

// Elementi za prikaz rezultata
let rezultatVarijabilniBPM = document.getElementById('rezultatVarijabilniBPM');
let rezultatFrameoviPoBeatu = document.getElementById('rezultatFrameoviPoBeatu');
let rezultatFrameoviPoTakatu = document.getElementById('rezultatFrameoviPoTakatu');
let rezultatPostotakPrilagodbe = document.getElementById('rezultatPostotakPrilagodbe');
let rezultatNovaDuljina = document.getElementById('rezultatNovaDuljina'); // Za glazbeni segment
let rezultatBrojBeatova = document.getElementById('rezultatBrojBeatova');
let fpsHelpText = document.getElementById('fpsHelpText');

// NOVI element za prikaz rezultata nove ukupne duljine fizičke datoteke
let rezultatNovaDuljinaCijele = document.getElementById('rezultatNovaDuljinaCijele');
const rezultatiDiv = document.getElementById('rezultati'); // Kontejner za rezultate

// Pomoćna funkcija za formatiranje frameova u timecode (HH:MM:SS:FF)
function formatFramesToTimecode(totalFrames, fps) {
    const sati = Math.floor(totalFrames / (fps * 3600));
    const preostaliFrameoviNakonSati = totalFrames % (fps * 3600);
    const minute = Math.floor(preostaliFrameoviNakonSati / (fps * 60));
    const preostaliFrameoviNakonMinuta = preostaliFrameoviNakonSati % (fps * 60);
    const sekunde = Math.floor(preostaliFrameoviNakonMinuta / fps);
    // Zaokruživanje frameova na najbliži cijeli broj
    const frameovi = Math.round(preostaliFrameoviNakonMinuta % fps);

    // Padding za frameove treba biti dinamičan ovisno o FPS-u (npr. 24 FPS -> 2 zn. (00-23), 10 FPS -> 1 zn. (0-9))
    const framePadding = Math.ceil(fps).toString().length > 1 ? 2 : 1; // Ako je FPS npr 23.976, Math.ceil je 24, length 2

    return `${String(sati).padStart(2, '0')}:` +
           `${String(minute).padStart(2, '0')}:` +
           `${String(sekunde).padStart(2, '0')}:` +
           `${String(frameovi).padStart(framePadding, '0')}`;
}

// Glavna funkcija za proračun
function izracunajMarkere() {
    const fiksniBPM = parseFloat(fiksniBPMInput.value);
    const FPS = parseFloat(fpsSelect.value);

    // Vrijednosti za glazbeni segment
    const satiSegment = parseInt(satiInput.value) || 0;
    const minuteSegment = parseInt(minuteInput.value) || 0;
    const sekundeSegment = parseInt(sekundeInput.value) || 0;
    const frameoviSegment = parseInt(frameoviInput.value) || 0;

    //