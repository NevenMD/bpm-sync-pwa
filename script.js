document.addEventListener('DOMContentLoaded', () => {
    // --- Dohvaćanje DOM elemenata ---
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const fpsSelect = document.getElementById('fpsSelect');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');

    // Inputi za ukupnu duljinu fizičke datoteke
    const satiCijeleInput = document.getElementById('satiCijele');
    const minuteCijeleInput = document.getElementById('minuteCijele');
    const sekundeCijeleInput = document.getElementById('sekundeCijele');
    const frameoviCijeleInput = document.getElementById('frameoviCijele');

    // Inputi za timecode početka glazbenog segmenta
    const satiPocetakSegmentaInput = document.getElementById('satiPocetakSegmenta');
    const minutePocetakSegmentaInput = document.getElementById('minutePocetakSegmenta');
    const sekundePocetakSegmentaInput = document.getElementById('sekundePocetakSegmenta');
    const frameoviPocetakSegmentaInput = document.getElementById('frameoviPocetakSegmenta');

    // Inputi za timecode kraja glazbenog segmenta
    const satiKrajSegmentaInput = document.getElementById('satiKrajSegmenta');
    const minuteKrajSegmentaInput = document.getElementById('minuteKrajSegmenta');
    const sekundeKrajSegmentaInput = document.getElementById('sekundeKrajSegmenta');
    const frameoviKrajSegmentaInput = document.getElementById('frameoviKrajSegmenta');

    // Elementi za prikaz rezultata (DOHVAĆANJE SAMO JEDNOM NA POČETKU)
    const rezultatiDiv = document.getElementById('rezultati');
    const rezultatVarijabilniBPM = document.getElementById('rezultatVarijabilniBPM');
    const rezultatFrameoviPoBeatu = document.getElementById('rezultatFrameoviPoBeatu');
    const rezultatFrameoviPoTakatu = document.getElementById('rezultatFrameoviPoTakatu');
    const rezultatPostotakPrilagodbe = document.getElementById('rezultatPostotakPrilagodbe');
    const rezultatIzracunataOriginalnaDuljinaSegmenta = document.getElementById('rezultatIzracunataOriginalnaDuljinaSegmenta');
    const rezultatNovaDuljinaSegment = document.getElementById('rezultatNovaDuljinaSegment');
    const rezultatBrojBeatova = document.getElementById('rezultatBrojBeatova');
    const rezultatNovaDuljinaCijele = document.getElementById('rezultatNovaDuljinaCijele');
    const rezultatNoviPocetakSegmenta = document.getElementById('rezultatNoviPocetakSegmenta');
    const rezultatNoviKrajSegmenta = document.getElementById('rezultatNoviKrajSegmenta');

    const fpsHelpText = document.getElementById('fpsHelpText');

    // --- Funkcija za automatsko selektiranje teksta pri fokusu ---
    function selectOnFocus(event) {
        event.target.select();
    }

    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('focus', selectOnFocus);
    });

    // --- Funkcija za automatsko prebacivanje fokusa na sljedeće polje ---
    function setupAutoAdvance() {
        const orderedInputs = [
            satiCijeleInput, minuteCijeleInput, sekundeCijeleInput, frameoviCijeleInput,
            satiPocetakSegmentaInput, minutePocetakSegmentaInput, sekundePocetakSegmentaInput, frameoviPocetakSegmentaInput,
            satiKrajSegmentaInput, minuteKrajSegmentaInput, sekundeKrajSegmentaInput, frameoviKrajSegmentaInput
        ];

        orderedInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                let value = input.value;
                const nextInput = orderedInputs[index + 1];

                if (isNaN(parseFloat(value)) || value.trim() === '') {
                    return;
                }

                // Općenita logika za sate, minute, sekunde
                if (input.id.includes('sati') || input.id.includes('minute') || input.id.includes('sekunde')) {
                    if (value.length === 2 && (input.id.includes('sati') || (parseInt(value) >= 0 && parseInt(value) <= 59))) {
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                }
                // Logika za frameove
                else if (input.id.includes('frameovi')) {
                    const currentFPS = parseFloat(fpsSelect.value);
                    const maxFrames = Math.floor(currentFPS - 1);
                    const typedValue = parseInt(value);
                    const maxFramesStrLength = String(maxFrames).length;

                    if ((value.length >= maxFramesStrLength && typedValue >=0 && typedValue <= maxFrames) || value.length === 2) {
                        if (input === frameoviCijeleInput) {
                            satiPocetakSegmentaInput.focus();
                        } else if (input === frameoviPocetakSegmentaInput) {
                            satiKrajSegmentaInput.focus();
                        } else if (input === frameoviKrajSegmentaInput) {
                            mjeraTaktaSelect.focus();
                        }
                    }
                }
            });
        });
    }

    setupAutoAdvance();

    // --- Pomoćna funkcija za formatiranje frameova u timecode (HH:MM:SS:FF) ---
    function formatFramesToTimecode(totalFrames, fps) {
        const sati = Math.floor(totalFrames / (fps * 3600));
        const preostaliFrameoviNakonSati = totalFrames % (fps * 3600);
        const minute = Math.floor(preostaliFrameoviNakonSati / (fps * 60));
        const preostaliFrameoviNakonMinuta = preostaliFrameoviNakonSati % (fps * 60);
        const sekunde = Math.floor(preostaliFrameoviNakonMinuta / fps);
        const frameovi = Math.round(preostaliFrameoviNakonMinuta % fps);

        const framePadding = Math.ceil(fps).toString().length > 1 ? 2 : 1;

        return `${String(sati).padStart(2, '0')}:` +
               `${String(minute).padStart(2, '0')}:` +
               `${String(sekunde).padStart(2, '0')}:` +
               `${String(frameovi).padStart(framePadding, '0')}`;
    }

    // --- Glavna funkcija za proračun ---
    function izracunajMarkere() {
        const fiksniBPM = parseFloat(fiksniBPMInput.value);
        const FPS = parseFloat(fpsSelect.value);

        // Vrijednosti za ukupnu fizičku datoteku
        const satiCijele = parseInt(satiCijeleInput.value) || 0;
        const minuteCijele = parseInt(minuteCijeleInput.value) || 0;
        const sekundeCijele = parseInt(sekundeCijeleInput.value) || 0;
        const frameoviCijele = parseInt(frameoviCijeleInput.value) || 0;

        // Vrijednosti za timecode početka glazbenog segmenta
        const satiPocetakSegmenta = parseInt(satiPocetakSegmentaInput.value) || 0;
        const minutePocetakSegmenta = parseInt(minutePocetakSegmentaInput.value) || 0;
        const sekundePocetakSegmenta = parseInt(sekundePocetakSegmentaInput.value) || 0;
        const frameoviPocetakSegmenta = parseInt(frameoviPocetakSegmentaInput.value) || 0;

        // Vrijednosti za timecode kraja glazbenog segmenta
        const satiKrajSegmenta = parseInt(satiKrajSegmentaInput.value) || 0;
        const minuteKrajSegmenta = parseInt(minuteKrajSegmentaInput.value) || 0;
        const sekundeKrajSegmenta = parseInt(sekundeKrajSegmentaInput.value) || 0;
        const frameoviKrajSegmenta = parseInt(frameoviKrajSegmentaInput.value) || 0;

        const mjeraTakta = parseInt(mjeraTaktaSelect.value);

        fpsHelpText.textContent = `Current FPS: ${FPS}`;
        frameoviCijeleInput.setAttribute('max', Math.floor(FPS - 1));
        frameoviPocetakSegmentaInput.setAttribute('max', Math.floor(FPS - 1));
        frameoviKrajSegmentaInput.setAttribute('max', Math.floor(FPS - 1));

        // Konverzija svih unosa u ukupne frameove
        const ukupnoSekundiCijele = (satiCijele * 3600) + (minuteCijele * 60) + sekundeCijele;
        const ukupnoFrameovaCijele = (ukupnoSekundiCijele * FPS) + frameoviCijele;

        const ukupnoSekundiPocetakSegmenta = (satiPocetakSegmenta * 3600) + (minutePocetakSegmenta * 60) + sekundePocetakSegmenta;
        const ukupnoFrameovaPocetakSegmenta = (ukupnoSekundiPocetakSegmenta * FPS) + frameoviPocetakSegmenta;

        const ukupnoSekundiKrajSegmenta = (satiKrajSegmenta * 3600) + (minuteKrajSegmenta * 60) + sekundeKrajSegmenta;
        const ukupnoFrameovaKrajSegmenta = (ukupnoSekundiKrajSegmenta * FPS) + frameoviKrajSegmenta;

        // Izračun duljine glazbenog segmenta (u frameovima) iz razlike TCa
        const ukupnoFrameovaSegment = ukupnoFrameovaKrajSegmenta - ukupnoFrameovaPocetakSegmenta;

        // Provjera unosa i poruke o grešci
        let errorMessage = '';
        if (isNaN(fiksniBPM) || fiksniBPM <= 0) {
            errorMessage = 'Molimo unesite ispravan pozitivan broj za Fiksni (izmjereni) BPM.';
        } else if (isNaN(FPS) || FPS <= 0) {
            errorMessage = 'Molimo odaberite ispravan FPS.';
        }
        // Validacija za ukupnu duljinu datoteke
        else if (isNaN(satiCijele) || satiCijele < 0 || isNaN(minuteCijele) || minuteCijele < 0 || minuteCijele > 59 || isNaN(sekundeCijele) || sekundeCijele < 0 || sekundeCijele > 59 || isNaN(frameoviCijele) || frameoviCijele < 0 || frameoviCijele >= FPS) {
            errorMessage = `Molimo unesite ispravno trajanje cijele datoteke (0-${Math.floor(FPS - 1)} frameova).`;
        }
        // Validacija za timecode početka segmenta
        else if (isNaN(satiPocetakSegmenta) || satiPocetakSegmenta < 0 || isNaN(minutePocetakSegmenta) || minutePocetakSegmenta < 0 || minutePocetakSegmenta > 59 || isNaN(sekundePocetakSegmenta) || sekundePocetakSegmenta < 0 || sekundePocetakSegmenta > 59 || isNaN(frameoviPocetakSegmenta) || frameoviPocetakSegmenta < 0 || frameoviPocetakSegmenta >= FPS) {
            errorMessage = `Molimo unesite ispravan timecode početka glazbenog segmenta (0-${Math.floor(FPS - 1)} frameova).`;
        }
        // Validacija za timecode kraja segmenta
        else if (isNaN(satiKrajSegmenta) || satiKrajSegmenta < 0 || isNaN(minuteKrajSegmenta) || minuteKrajSegmenta < 0 || minuteKrajSegmenta > 59 || isNaN(sekundeKrajSegmenta) || sekundeKrajSegmenta < 0 || sekundeKrajSegmenta > 59 || isNaN(frameoviKrajSegmenta) || frameoviKrajSegmenta < 0 || frameoviKrajSegmenta >= FPS) {
            errorMessage = `Molimo unesite ispravan timecode kraja glazbenog segmenta (0-${Math.floor(FPS - 1)} frameova).`;
        }
        else if (isNaN(mjeraTakta) || mjeraTakta <= 0) {
            errorMessage = 'Molimo odaberite ispravnu mjeru takta (broj udaraca mora biti pozitivan).';
        }
        // Logičke provjere
        else if (ukupnoFrameovaCijele === 0) {
            errorMessage = `Ukupno trajanje fizičke datoteke ne može biti nula. Molimo unesite ispravno trajanje.`;
        }
        else if (ukupnoFrameovaPocetakSegmenta >= ukupnoFrameovaCijele) {
            errorMessage = `Početak glazbenog segmenta ne može biti veći ili jednak ukupnoj duljini fizičke datoteke.`;
        }
        else if (ukupnoFrameovaKrajSegmenta <= ukupnoFrameovaPocetakSegmenta) {
            errorMessage = `Timecode kraja segmenta mora biti veći od timecodea početka segmenta.`;
        }
        else if (ukupnoFrameovaSegment <= 0) {
            errorMessage = `Glazbeni segment mora imati duljinu veću od nule.`;
        }
        else if (ukupnoFrameovaKrajSegmenta > ukupnoFrameovaCijele) {
            errorMessage = `Timecode kraja segmenta (${formatFramesToTimecode(ukupnoFrameovaKrajSegmenta, FPS)}) prelazi ukupnu duljinu fizičke datoteke.`;
        }


        if (errorMessage) {
            rezultatiDiv.innerHTML = `<p class="error-message">${errorMessage}</p>`;
            return;
        }

        // Ako nema grešaka, osiguraj da su rezultati vidljivi i bez poruke o grešci
        const currentErrorMessage = rezultatiDiv.querySelector('.error-message');
        if (currentErrorMessage) {
            currentErrorMessage.remove(); // Ukloni poruku o grešci ako postoji
        }
        // Osiguraj da su svi rezultati elementi prisutni i vidljivi
        // (Ovo bi trebalo biti ok jer se dohvaćaju samo jednom na početku)
        rezultatiDiv.style.display = 'block'; // Pokaži rezultate div ako je bio sakriven zbog greške

        const trajanjeUMinutamaSegment = ukupnoFrameovaSegment / FPS / 60;
        let brojBeatova = fiksniBPM * trajanjeUMinutamaSegment;
        brojBeatova = Math.round(brojBeatova);

        if (brojBeatova === 0) {
            rezultatiDiv.innerHTML = `<p class="error-message">Nema dovoljno beatova za izračun. Molimo unesite dulji glazbeni segment ili veći fiksni (izmjereni) BPM.</p>`;
            return;
        }

        const varijabilniBPM = (brojBeatova / ukupnoFrameovaSegment) * FPS * 60;

        let frameoviPoBeatu = (60 / varijabilniBPM) * FPS;
        frameoviPoBeatu = Math.round(frameoviPoBeatu);

        let frameoviPoTakatu = frameoviPoBeatu * mjeraTakta;
        frameoviPoTakatu = Math.round(frameoviPoTakatu);

        // Izračun nove duljine segmenta
        let novaDuljinaFrameoviSegmentCalc = 0;
        if (fiksniBPM > 0) {
            const novaDuljinaSekundePrecizno = (brojBeatova / fiksniBPM) * 60;
            novaDuljinaFrameoviSegmentCalc = Math.round(novaDuljinaSekundePrecizno * FPS);
        }
        const formatiranaNovaDuljinaSegment = formatFramesToTimecode(novaDuljinaFrameoviSegmentCalc, FPS);

        // IZRAČUN FAKTORA SKALIRANJA: Koliko se glazbeni segment promijenio
        const scalingFactor = ukupnoFrameovaSegment > 0 ? (novaDuljinaFrameoviSegmentCalc / ukupnoFrameovaSegment) : 1; // Spriječi dijeljenje s nulom

        let postotakPrilagodbe = (scalingFactor - 1) * 100;
        let postotakTekst = '';

        if (postotakPrilagodbe > 0) {
            postotakTekst = `Produžiti za ${postotakPrilagodbe.toFixed(2)}%`;
        } else if (postotakPrilagodbe < 0) {
            postotakTekst = `Skratiti za ${Math.abs(postotakPrilagodbe).toFixed(2)}%`;
        } else {
            postotakTekst = `Nije potrebna prilagodba (0.00%)`;
        }

        // Izračun nove ukupne duljine fizičke datoteke koristeći SCALING FACTOR
        const novaDuljinaFrameoviCijeleCalc = Math.round(ukupnoFrameovaCijele * scalingFactor);
        const formatiranaNovaDuljinaCijele = formatFramesToTimecode(novaDuljinaFrameoviCijeleCalc, FPS);

        // Izračun novih timecodea za početak i kraj segmenta koristeći SCALING FACTOR
        const noviPocetakSegmentaFrameovi = Math.round(ukupnoFrameovaPocetakSegmenta * scalingFactor);
        const formatiraniNoviPocetakSegmenta = formatFramesToTimecode(noviPocetakSegmentaFrameovi, FPS);

        const noviKrajSegmentaFrameovi = noviPocetakSegmentaFrameovi + novaDuljinaFrameoviSegmentCalc;
        const formatiraniNoviKrajSegmenta = formatFramesToTimecode(noviKrajSegmentaFrameovi, FPS);

        const formatiranaIzracunataOriginalnaDuljinaSegmenta = formatFramesToTimecode(ukupnoFrameovaSegment, FPS);

        const sekundePoTakatu = Math.floor(frameoviPoTakatu / FPS);
        const preostaliFrameoviPoTakatu = frameoviPoTakatu % FPS;
        const formatiraniFrameoviPoTakatu =
            `${String(sekundePoTakatu).padStart(2, '0')}:` +
            `${String(preostaliFrameoviPoTakatu).padStart(formatFramesToTimecode(0, FPS).split(':')[3].length, '0')}`;


        // AŽURIRANJE TEKSTA ELEMENATA, NE PREPISIVANJE CIJELOG DIV-a
        rezultatVarijabilniBPM.textContent = varijabilniBPM.toFixed(4);
        rezultatFrameoviPoBeatu.textContent = frameoviPoBeatu;
        rezultatFrameoviPoTakatu.textContent = `${frameoviPoTakatu} (${formatiraniFrameoviPoTakatu})`;
        rezultatPostotakPrilagodbe.textContent = postotakTekst;
        rezultatIzracunataOriginalnaDuljinaSegmenta.textContent = formatiranaIzracunataOriginalnaDuljinaSegmenta;
        rezultatNovaDuljinaSegment.textContent = formatiranaNovaDuljinaSegment;
        rezultatBrojBeatova.textContent = `Ukupni broj beatova za ovo trajanje (zaokruženo): ${brojBeatova}`;
        rezultatNovaDuljinaCijele.textContent = formatiranaNovaDuljinaCijele;
        rezultatNoviPocetakSegmenta.textContent = formatiraniNoviPocetakSegmenta;
        rezultatNoviKrajSegmenta.textContent = formatiraniNoviKrajSegmenta;
    }

    // --- Postavljanje slušatelja događaja (Event Listeners) ---
    fiksniBPMInput.addEventListener('input', izracunajMarkere);
    fpsSelect.addEventListener('change', izracunajMarkere);
    mjeraTaktaSelect.addEventListener('change', izracunajMarkere);

    satiCijeleInput.addEventListener('input', izracunajMarkere);
    minuteCijeleInput.addEventListener('input', izracunajMarkere);
    sekundeCijeleInput.addEventListener('input', izracunajMarkere);
    frameoviCijeleInput.addEventListener('input', izracunajMarkere);

    satiPocetakSegmentaInput.addEventListener('input', izracunajMarkere);
    minutePocetakSegmentaInput.addEventListener('input', izracunajMarkere);
    sekundePocetakSegmentaInput.addEventListener('input', izracunajMarkere);
    frameoviPocetakSegmentaInput.addEventListener('input', izracunajMarkere);

    satiKrajSegmentaInput.addEventListener('input', izracunajMarkere);
    minuteKrajSegmentaInput.addEventListener('input', izracunajMarkere);
    sekundeKrajSegmentaInput.addEventListener('input', izracunajMarkere);
    frameoviKrajSegmentaInput.addEventListener('input', izracunajMarkere);

    // Inicijalni proračun pri učitavanju stranice
    izracunajMarkere();
});