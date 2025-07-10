// --- Funkcija za automatsko selektiranje teksta pri fokusu ---
// Kada korisnik tapne na input polje, sav tekst unutar njega će biti selektiran.
// To omogućuje da odmah počne tipkati novi broj bez ručnog brisanja starog.
function selectOnFocus(event) {
    event.target.select();
}

// Pronađi sva input polja tipa "number" na koja želiš primijeniti ovo ponašanje.
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
    const fpsSelect = document.getElementById('fpsSelect');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');

    // Definiraj redoslijed polja za automatsko prebacivanje fokusa
    const orderedInputs = [
        satiInput,
        minuteInput,
        sekundeInput,
        frameoviInput
    ];

    orderedInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            let value = input.value;
            const nextInput = orderedInputs[index + 1];

            // Preskoči ako polje nije broj ili je prazno (ne želimo prebacivati fokus na temelju nevaljanog unosa)
            if (isNaN(parseFloat(value)) || value.trim() === '') {
                return;
            }

            if (input === satiInput || input === minuteInput || input === sekundeInput) {
                // Za sate, minute, sekunde: prebaci fokus kad korisnik unese 2 znamenke.
                // Dodatna provjera za minute/sekunde da se ne prebaci ako je npr. uneseno "6" pa korisnik čeka "0"
                if (value.length === 2 && parseInt(value) >= 0 && parseInt(value) <= 59) {
                    if (nextInput) { // Provjeri postoji li sljedeći input u nizu
                        nextInput.focus();
                    } else { // Ako je ovo zadnji numerički input, fokusiraj na mjeraTaktaSelect
                        mjeraTaktaSelect.focus();
                    }
                }
            } else if (input === frameoviInput) {
                const currentFPS = parseFloat(fpsSelect.value);
                const maxFrames = Math.floor(currentFPS - 1); // Max valid frame value for current FPS
                const typedValue = parseInt(value);

                // Auto-advance ako je unesen broj dovoljno dug (npr. 2 znamenke)
                // ili ako je duljina unosa jednaka maksimalnoj očekivanoj duljini za tu vrijednost FPS-a
                const maxFramesStrLength = String(maxFrames).length;

                // Ako je duljina unosa jednaka duljini maksimalnog broja frameova (npr. 23 za 24 FPS)
                // ILI ako je duljina unosa 2 (za FPS > 25, npr. 59 za 60 FPS)
                if ((value.length >= maxFramesStrLength && typedValue >=0 && typedValue <= maxFrames) || value.length === 2) {
                     mjeraTaktaSelect.focus();
                }
            }
        });
    });
}
// --- KRAJ KODA ZA AUTO-PREBACIVANJE FOKUSA ---


// --- OSTATAK TVOJ POSTOJEĆI KOD ---

// Dohvaćanje DOM elemenata (ponovno definirano za opseg)
const fiksniBPMInput = document.getElementById('fiksniBPM');
const fpsSelect = document.getElementById('fpsSelect');
const satiInput = document.getElementById('sati');
const minuteInput = document.getElementById('minute');
const sekundeInput = document.getElementById('sekunde');
const frameoviInput = document.getElementById('frameovi');
const mjeraTaktaSelect = document.getElementById('mjeraTakta');

const rezultatVarijabilniBPM = document.getElementById('rezultatVarijabilniBPM');
const rezultatFrameoviPoBeatu = document.getElementById('rezultatFrameoviPoBeatu');
const rezultatFrameoviPoTakatu = document.getElementById('rezultatFrameoviPoTakatu');
const rezultatPostotakPrilagodbe = document.getElementById('rezultatPostotakPrilagodbe');
const rezultatNovaDuljina = document.getElementById('rezultatNovaDuljina');
const rezultatBrojBeatova = document.getElementById('rezultatBrojBeatova');
const fpsHelpText = document.getElementById('fpsHelpText');


// Funkcija za proračun (izracunajMarkere - naziv si promijenio, pa ga zadržavam)
function izracunajMarkere() {
    // 1. Dohvati ulazne podatke iz HTML forme (neke su već dohvaćene gore, ali ovo je za lokalni opseg funkcije)
    const fiksniBPM = parseFloat(fiksniBPMInput.value);
    const FPS = parseFloat(fpsSelect.value);
    const sati = parseInt(satiInput.value);
    const minute = parseInt(minuteInput.value);
    const sekunde = parseInt(sekundeInput.value);
    const frameovi = parseInt(frameoviInput.value);
    const mjeraTakta = parseInt(mjeraTaktaSelect.value);
    const rezultatiDiv = document.getElementById('rezultati');


    // Ažuriraj tekstualnu pomoć za FPS
    fpsHelpText.textContent = `Current FPS: ${FPS}`;
    // Ažuriraj max atribut za frameove input polje radi vizualne pomoći
    frameoviInput.setAttribute('max', Math.floor(FPS - 1));


    // Dohvati elemente za prikaz rezultata (ako postoje, jer se innerHTML mijenja)
    let rezultatVarijabilniBPM = document.getElementById('rezultatVarijabilniBPM');
    let rezultatFrameoviPoBeatu = document.getElementById('rezultatFrameoviPoBeatu');
    let rezultatFrameoviPoTakatu = document.getElementById('rezultatFrameoviPoTakatu');
    let rezultatPostotakPrilagodbe = document.getElementById('rezultatPostotakPrilagodbe');
    let rezultatNovaDuljina = document.getElementById('rezultatNovaDuljina');
    let rezultatBrojBeatova = document.getElementById('rezultatBrojBeatova');


    // Provjera unosa i poruke o grešci
    let errorMessage = '';
    if (isNaN(fiksniBPM) || fiksniBPM <= 0) {
        errorMessage = 'Molimo unesite ispravan pozitivan broj za Fiksni (izmjereni) BPM.';
    } else if (isNaN(FPS) || FPS <= 0) {
        errorMessage = 'Molimo odaberite ispravan FPS.';
    } else if (isNaN(sati) || sati < 0) {
        errorMessage = 'Molimo unesite ispravan broj sati (>= 0).';
    } else if (isNaN(minute) || minute < 0 || minute > 59) {
        errorMessage = 'Molimo unesite ispravan broj minuta (0-59).';
    } else if (isNaN(sekunde) || sekunde < 0 || sekunde > 59) {
        errorMessage = 'Molimo unesite ispravan broj sekundi (0-59).';
    } else if (isNaN(frameovi) || frameovi < 0 || frameovi >= FPS) { // Frameovi sada ovise o odabranom FPS-u
        errorMessage = `Molimo unesite ispravan broj frameova (0-${Math.floor(FPS - 1)} za ${FPS} FPS).`;
    } else if (isNaN(mjeraTakta) || mjeraTakta <= 0) {
        errorMessage = 'Molimo odaberite ispravnu mjeru takta (broj udaraca mora biti pozitivan).';
    }

    if (errorMessage) {
        rezultatiDiv.innerHTML = `<p class="error-message">${errorMessage}</p>`;
        return; // Prekini funkciju ako ima grešaka
    }

    // Ako nema greške, osiguravamo da je struktura rezultata ispravna (ako je bila prebrisana greškom)
    if (!rezultatVarijabilniBPM || !rezultatFrameoviPoBeatu || !rezultatFrameoviPoTakatu || !rezultatPostotakPrilagodbe || !rezultatNovaDuljina || !rezultatBrojBeatova) {
        rezultatiDiv.innerHTML = `
            <h3>Izračunani rezultati:</h3>
            <p><strong>Varijabilni BPM:</strong> <span class="precizan-broj" id="rezultatVarijabilniBPM"></span></p>
            <p><strong>Broj frameova po beatu:</strong> <span id="rezultatFrameoviPoBeatu"></span></p>
            <p><strong>Broj frameova po taktu:</strong> <span id="rezultatFrameoviPoTakatu"></span></p>
            <p><strong>Postotak prilagodbe glazbe:</strong> <span id="rezultatPostotakPrilagodbe"></span></p>
            <p><strong>Nova duljina glazbene datoteke:</strong> <span id="rezultatNovaDuljina"></span></p>
            <p class="napomena" id="rezultatBrojBeatova"></p>
        `;
        // Ponovno dohvati reference jer je innerHTML prebrisan
        rezultatVarijabilniBPM = document.getElementById('rezultatVarijabilniBPM');
        rezultatFrameoviPoBeatu = document.getElementById('rezultatFrameoviPoBeatu');
        rezultatFrameoviPoTakatu = document.getElementById('rezultatFrameoviPoTakatu');
        rezultatPostotakPrilagodbe = document.getElementById('rezultatPostotakPrilagodbe');
        rezultatNovaDuljina = document.getElementById('rezultatNovaDuljina');
        rezultatBrojBeatova = document.getElementById('rezultatBrojBeatova');
    }


    // 2. Izračun ukupnog trajanja glazbene datoteke u frameovima (originalno trajanje)
    const ukupnoSekundiOriginalno = (sati * 3600) + (minute * 60) + sekunde;
    const ukupnoFrameovaOriginalno = (ukupnoSekundiOriginalno * FPS) + frameovi;

    // Ako je ukupnoFrameova 0, ne možemo izračunati, prikaži poruku
    if (ukupnoFrameovaOriginalno === 0) {
        rezultatiDiv.innerHTML = `<p class="error-message">Ukupno trajanje glazbene datoteke ne može biti nula. Molimo unesite ispravno trajanje.</p>`;
        return;
    }

    // 3. Izračun ukupnog broja beatova na fiksnom BPM-u i zaokruživanje
    const trajanjeUMinutamaOriginalno = ukupnoFrameovaOriginalno / FPS / 60;
    let brojBeatova = fiksniBPM * trajanjeUMinutamaOriginalno;
    brojBeatova = Math.round(brojBeatova); // Zaokruživanje na najbliži cijeli broj

    if (brojBeatova === 0) {
        rezultatiDiv.innerHTML = `<p class="error-message">Nema dovoljno beatova za izračun. Molimo unesite dulje trajanje glazbene datoteke ili veći fiksni (izmjereni) BPM.</p>`;
        return;
    }

    // 4. Izračun Varijabilnog BPM-a (visoka preciznost)
    const varijabilniBPM = (brojBeatova / ukupnoFrameovaOriginalno) * FPS * 60;

    // 5. Izračun Frameova po Beatu (za Varijabilni BPM)
    let frameoviPoBeatu = (60 / varijabilniBPM) * FPS;
    frameoviPoBeatu = Math.round(frameoviPoBeatu); // Zaokruživanje na najbliži cijeli broj

    // 6. Izračun Frameova po Takatu
    let frameoviPoTakatu = frameoviPoBeatu * mjeraTakta;
    frameoviPoTakatu = Math.round(frameoviPoTakatu);

    // 7. IZRAČUN I PRIKAZ POSTOTKA PRILAGODBE (PRODUŽITI/SKRATITI)
    let postotakPrilagodbe = 0;
    let postotakTekst = '';

    if (varijabilniBPM !== 0) { // Izbjegavanje dijeljenja s nulom
        postotakPrilagodbe = ((varijabilniBPM - fiksniBPM) / fiksniBPM) * 100;

        if (postotakPrilagodbe > 0) {
            postotakTekst = `Produžiti za ${postotakPrilagodbe.toFixed(2)}%`;
        } else if (postotakPrilagodbe < 0) {
            postotakTekst = `Skratiti za ${Math.abs(postotakPrilagodbe).toFixed(2)}%`;
        } else {
            postotakTekst = `Nije potrebna prilagodba (0.00%)`;
        }
    } else {
        postotakTekst = `N/A`; // Ako varijabilniBPM nije izračunat
    }

    // 8. IZRAČUN NOVE DULJINE GLAZBENE DATOTEKE
    let novaDuljinaFrameovi = 0;
    if (fiksniBPM > 0) { // Izbjegavanje dijeljenja s nulom
        const novaDuljinaSekundePrecizno = (brojBeatova / fiksniBPM) * 60;
        novaDuljinaFrameovi = Math.round(novaDuljinaSekundePrecizno * FPS);
    }

    // Konverzija ukupnih frameova u HH:MM:SS:FF format
    const novaSati = Math.floor(novaDuljinaFrameovi / (FPS * 3600));
    const preostaliFrameoviNakonSati = novaDuljinaFrameovi % (FPS * 3600);
    const novaMinute = Math.floor(preostaliFrameoviNakonSati / (FPS * 60));
    const preostaliFrameoviNakonMinuta = preostaliFrameoviNakonSati % (FPS * 60);
    const novaSekunde = Math.floor(preostaliFrameoviNakonMinuta / FPS);
    const novaFrameovi = preostaliFrameoviNakonMinuta % FPS;

    // Formatiranje u HH:MM:SS:FF
    const formatiranaNovaDuljina =
        `${String(novaSati).padStart(2, '0')}:` +
        `${String(novaMinute).padStart(2, '0')}:` +
        `${String(novaSekunde).padStart(2, '0')}:` +
        `${String(novaFrameovi).padStart(Math.ceil(FPS).toString().length, '0')}`; // Prilagođeno paddingu za frameove

    // 9. NOVO: Prikaz frameova po taktu u formatu sekunde:frameovi
    const sekundePoTakatu = Math.floor(frameoviPoTakatu / FPS);
    const preostaliFrameoviPoTakatu = frameoviPoTakatu % FPS;

    const formatiraniFrameoviPoTakatu =
        `${String(sekundePoTakatu).padStart(2, '0')}:` +
        `${String(preostaliFrameoviPoTakatu).padStart(Math.ceil(FPS).toString().length, '0')}`;

    // 10. Prikaz rezultata u HTML-u
    rezultatVarijabilniBPM.textContent = varijabilniBPM.toFixed(4);
    rezultatFrameoviPoBeatu.textContent = frameoviPoBeatu;
    rezultatFrameoviPoTakatu.textContent = `${frameoviPoTakatu} (${formatiraniFrameoviPoTakatu})`; // Ažurirani prikaz
    rezultatPostotakPrilagodbe.textContent = postotakTekst;
    rezultatNovaDuljina.textContent = formatiranaNovaDuljina;
    rezultatBrojBeatova.textContent = `Ukupni broj beatova za ovo trajanje (zaokruženo): ${brojBeatova}`;
}

// Postavljanje slušatelja događaja (Event Listeners) - ostaje isto
document.addEventListener('DOMContentLoaded', () => {
    // Dohvaćanje referenci na elemente unutar DOMContentLoaded
    // Ovo je sigurniji način da se osigura da su elementi učitani
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const fpsSelect = document.getElementById('fpsSelect');
    const satiInput = document.getElementById('sati');
    const minuteInput = document.getElementById('minute');
    const sekundeInput = document.getElementById('sekunde');
    const frameoviInput = document.getElementById('frameovi');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');

    fiksniBPMInput.addEventListener('input', izracunajMarkere);
    fpsSelect.addEventListener('change', izracunajMarkere);
    satiInput.addEventListener('input', izracunajMarkere);
    minuteInput.addEventListener('input', izracunajMarkere);
    sekundeInput.addEventListener('input', izracunajMarkere);
    frameoviInput.addEventListener('input', izracunajMarkere);
    mjeraTaktaSelect.addEventListener('change', izracunajMarkere);

    // Pozovi setupAutoAdvance funkciju nakon što su svi elementi dohvaćeni
    setupAutoAdvance();

    // Inicijalni proračun pri učitavanju stranice
    izracunajMarkere();
});