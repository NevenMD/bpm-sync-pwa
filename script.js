document.addEventListener('DOMContentLoaded', () => {
    // --- Dohvaćanje DOM elemenata ---
    // Ovi elementi se dohvaćaju JEDNOM, kada je cijeli HTML dokument učitan.
    // Time osiguravamo da su uvijek dostupni.

    // Inputi za osnovne postavke
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const fpsSelect = document.getElementById('fpsSelect');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');

    // Inputi za duljinu glazbenog segmenta
    const satiSegmentInput = document.getElementById('sati');
    const minuteSegmentInput = document.getElementById('minute');
    const sekundeSegmentInput = document.getElementById('sekunde');
    const frameoviSegmentInput = document.getElementById('frameovi');

    // Inputi za ukupnu duljinu fizičke datoteke (NOVO)
    const satiCijeleInput = document.getElementById('satiCijele');
    const minuteCijeleInput = document.getElementById('minuteCijele');
    const sekundeCijeleInput = document.getElementById('sekundeCijele');
    const frameoviCijeleInput = document.getElementById('frameoviCijele');

    // Elementi za prikaz rezultata
    const rezultatiDiv = document.getElementById('rezultati');
    let rezultatVarijabilniBPM; // Deklarirane, ali dodijeljene u renderResultsHtml()
    let rezultatFrameoviPoBeatu;
    let rezultatFrameoviPoTakatu;
    let rezultatPostotakPrilagodbe;
    let rezultatNovaDuljinaSegment; // Preimenovano za jasnoću
    let rezultatBrojBeatova;
    let rezultatNovaDuljinaCijele; // NOVO

    const fpsHelpText = document.getElementById('fpsHelpText');

    // --- Pomoćna funkcija za renderiranje HTML-a rezultata ---
    // Ova funkcija stvara HTML za rezultate i dohvaća reference na span elemente.
    // Koristi se kada se rezultatiDiv prebriše (npr. zbog poruke o grešci).
    function renderResultsHtml() {
        rezultatiDiv.innerHTML = `
            <h3>Izračunani rezultati:</h3>
            <p><strong>Varijabilni BPM:</strong> <span class="precizan-broj" id="rezultatVarijabilniBPM"></span></p>
            <p><strong>Broj frameova po beatu:</strong> <span id="rezultatFrameoviPoBeatu"></span></p>
            <p><strong>Broj frameova po taktu:</strong> <span id="rezultatFrameoviPoTakatu"></span></p>
            <p><strong>Postotak prilagodbe glazbe:</strong> <span id="rezultatPostotakPrilagodbe"></span></p>
            <p><strong>Nova duljina glazbenog segmenta:</strong> <span id="rezultatNovaDuljina"></span></p>
            <p><strong>Nova ukupna duljina fizičke datoteke:</strong> <span id="rezultatNovaDuljinaCijele"></span></p>
            <p class="napomena" id="rezultatBrojBeatova"></p>
        `;
        // Ponovno dohvati reference jer je innerHTML prebrisan
        rezultatVarijabilniBPM = document.getElementById('rezultatVarijabilniBPM');
        rezultatFrameoviPoBeatu = document.getElementById('rezultatFrameoviPoBeatu');
        rezultatFrameoviPoTakatu = document.getElementById('rezultatFrameoviPoTakatu');
        rezultatPostotakPrilagodbe = document.getElementById('rezultatPostotakPrilagodbe');
        rezultatNovaDuljinaSegment = document.getElementById('rezultatNovaDuljina');
        rezultatBrojBeatova = document.getElementById('rezultatBrojBeatova');
        rezultatNovaDuljinaCijele = document.getElementById('rezultatNovaDuljinaCijele');
    }

    // Pozovi jednom na početku da osiguraš inicijalnu strukturu rezultata
    renderResultsHtml();

    // --- Funkcija za automatsko selektiranje teksta pri fokusu ---
    function selectOnFocus(event) {
        event.target.select();
    }

    // Primijeni na sva input polja tipa "number"
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('focus', selectOnFocus);
    });

    // --- Funkcija za automatsko prebacivanje fokusa na sljedeće polje ---
    function setupAutoAdvance() {
        const orderedInputs = [
            satiSegmentInput,
            minuteSegmentInput,
            sekundeSegmentInput,
            frameoviSegmentInput,
            satiCijeleInput,
            minuteCijeleInput,
            sekundeCijeleInput,
            frameoviCijeleInput
        ];

        orderedInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                let value = input.value;
                const nextInput = orderedInputs[index + 1];

                if (isNaN(parseFloat(value)) || value.trim() === '') {
                    return;
                }

                if (input === satiSegmentInput || input === minuteSegmentInput || input === sekundeSegmentInput ||
                    input === satiCijeleInput || input === minuteCijeleInput || input === sekundeCijeleInput) {
                    if (value.length === 2 && (input === satiSegmentInput || input === satiCijeleInput || (parseInt(value) >= 0 && parseInt(value) <= 59))) {
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                } else if (input === frameoviSegmentInput) { // Specifično za frameove segmenta
                    const currentFPS = parseFloat(fpsSelect.value);
                    const maxFrames = Math.floor(currentFPS - 1);
                    const typedValue = parseInt(value);
                    const maxFramesStrLength = String(maxFrames).length;

                    if ((value.length >= maxFramesStrLength && typedValue >=0 && typedValue <= maxFrames) || value.length === 2) {
                        satiCijeleInput.focus(); // Prebaci na sate cijele datoteke
                    }
                } else if (input === frameoviCijeleInput) { // Specifično za frameove cijele datoteke
                    const currentFPS = parseFloat(fpsSelect.value);
                    const maxFrames = Math.floor(currentFPS - 1);
                    const typedValue = parseInt(value);
                    const maxFramesStrLength = String(maxFrames).length;

                    if ((value.length >= maxFramesStrLength && typedValue >=0 && typedValue <= maxFrames) || value.length === 2) {
                        mjeraTaktaSelect.focus(); // Prebaci na mjeru takta
                    }
                }
            });
        });
    }

    // Pozovi setupAutoAdvance funkciju nakon što su svi elementi dohvaćeni
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

        // Vrijednosti za glazbeni segment
        const satiSegment = parseInt(satiSegmentInput.value) || 0;
        const minuteSegment = parseInt(minuteSegmentInput.value) || 0;
        const sekundeSegment = parseInt(sekundeSegmentInput.value) || 0;
        const frameoviSegment = parseInt(frameoviSegmentInput.value) || 0;

        // Vrijednosti za cijelu fizičku datoteku
        const satiCijele = parseInt(satiCijeleInput.value) || 0;
        const minuteCijele = parseInt(minuteCijeleInput.value) || 0;
        const sekundeCijele = parseInt(sekundeCijeleInput.value) || 0;
        const frameoviCijele = parseInt(frameoviCijeleInput.value) || 0;

        const mjeraTakta = parseInt(mjeraTaktaSelect.value);

        // Ažuriraj tekstualnu pomoć za FPS i max atribute za frameove
        fpsHelpText.textContent = `Current FPS: ${FPS}`;
        frameoviSegmentInput.setAttribute('max', Math.floor(FPS - 1));
        frameoviCijeleInput.setAttribute('max', Math.floor(FPS - 1));

        // Provjera unosa i poruke o grešci
        let errorMessage = '';
        if (isNaN(fiksniBPM) || fiksniBPM <= 0) {
            errorMessage = 'Molimo unesite ispravan pozitivan broj za Fiksni (izmjereni) BPM.';
        } else if (isNaN(FPS) || FPS <= 0) {
            errorMessage = 'Molimo odaberite ispravan FPS.';
        }
        // Validacija za glazbeni segment
        else if (isNaN(satiSegment) || satiSegment < 0) {
            errorMessage = 'Molimo unesite ispravan broj sati (>= 0) za glazbeni segment.';
        } else if (isNaN(minuteSegment) || minuteSegment < 0 || minuteSegment > 59) {
            errorMessage = 'Molimo unesite ispravan broj minuta (0-59) za glazbeni segment.';
        } else if (isNaN(sekundeSegment) || sekundeSegment < 0 || sekundeSegment > 59) {
            errorMessage = 'Molimo unesite ispravan broj sekundi (0-59) za glazbeni segment.';
        } else if (isNaN(frameoviSegment) || frameoviSegment < 0 || frameoviSegment >= FPS) {
            errorMessage = `Molimo unesite ispravan broj frameova (0-${Math.floor(FPS - 1)}) za glazbeni segment.`;
        }
        // Validacija za cijelu fizičku datoteku
        else if (isNaN(satiCijele) || satiCijele < 0) {
            errorMessage = 'Molimo unesite ispravan broj sati (>= 0) za cijelu datoteku.';
        } else if (isNaN(minuteCijele) || minuteCijele < 0 || minuteCijele > 59) {
            errorMessage = 'Molimo unesite ispravan broj minuta (0-59) za cijelu datoteku.';
        } else if (isNaN(sekundeCijele) || sekundeCijele < 0 || sekundeCijele > 59) {
            errorMessage = 'Molimo unesite ispravan broj sekundi (0-59) za cijelu datoteku.';
        } else if (isNaN(frameoviCijele) || frameoviCijele < 0 || frameoviCijele >= FPS) {
            errorMessage = `Molimo unesite ispravan broj frameova (0-${Math.floor(FPS - 1)}) za cijelu datoteku.`;
        }
        else if (isNaN(mjeraTakta) || mjeraTakta <= 0) {
            errorMessage = 'Molimo odaberite ispravnu mjeru takta (broj udaraca mora biti pozitivan).';
        }

        // Izračun ukupnog trajanja glazbenog segmenta u frameovima
        const ukupnoSekundiSegment = (satiSegment * 3600) + (minuteSegment * 60) + sekundeSegment;
        const ukupnoFrameovaSegment = (ukupnoSekundiSegment * FPS) + frameoviSegment;

        // Izračun ukupnog trajanja cijele fizičke datoteke u frameovima
        const ukupnoSekundiCijele = (satiCijele * 3600) + (minuteCijele * 60) + sekundeCijele;
        const ukupnoFrameovaCijele = (ukupnoSekundiCijele * FPS) + frameoviCijele;


        if (ukupnoFrameovaSegment === 0) {
            errorMessage = `Ukupno trajanje glazbenog segmenta ne može biti nula. Molimo unesite ispravno trajanje.`;
        }
        if (ukupnoFrameovaCijele === 0 && !errorMessage) { // Samo ako već nema druge greške
            errorMessage = `Ukupno trajanje fizičke datoteke ne može biti nula. Molimo unesite ispravno trajanje.`;
        }


        if (errorMessage) {
            rezultatiDiv.innerHTML = `<p class="error-message">${errorMessage}</p>`;
            // Ovdje NE moramo ponovno dohvaćati reference jer renderResultsHtml() to radi pri sljedećem ispravnom pozivu
            return; // Prekini funkciju ako ima grešaka
        }

        // Ako je bila greška i sada je ispravljena, ponovno renderiraj HTML rezultata
        if (rezultatiDiv.querySelector('.error-message')) {
            renderResultsHtml();
        }

        // Izračun ukupnog broja beatova na fiksnom BPM-u za SEGMENT i zaokruživanje
        const trajanjeUMinutamaSegment = ukupnoFrameovaSegment / FPS / 60;
        let brojBeatova = fiksniBPM * trajanjeUMinutamaSegment;
        brojBeatova = Math.round(brojBeatova); // Zaokruživanje na najbliži cijeli broj

        if (brojBeatova === 0) {
            rezultatiDiv.innerHTML = `<p class="error-message">Nema dovoljno beatova za izračun. Molimo unesite dulje trajanje glazbenog segmenta ili veći fiksni (izmjereni) BPM.</p>`;
            return;
        }

        // Izračun Varijabilnog BPM-a (visoka preciznost) - TEMELJI SE NA GLAZBENOM SEGMENTU
        const varijabilniBPM = (brojBeatova / ukupnoFrameovaSegment) * FPS * 60;

        // Izračun Frameova po Beatu (za Varijabilni BPM)
        let frameoviPoBeatu = (60 / varijabilniBPM) * FPS;
        frameoviPoBeatu = Math.round(frameoviPoBeatu);

        // Izračun Frameova po Takatu
        let frameoviPoTakatu = frameoviPoBeatu * mjeraTakta;
        frameoviPoTakatu = Math.round(frameoviPoTakatu);

        // IZRAČUN I PRIKAZ POSTOTKA PRILAGODBE (PRODUŽITI/SKRATITI)
        let postotakPrilagodbe = 0;
        let postotakTekst = '';

        if (varijabilniBPM !== 0) {
            postotakPrilagodbe = ((varijabilniBPM - fiksniBPM) / fiksniBPM) * 100;

            if (postotakPrilagodbe > 0) {
                postotakTekst = `Produžiti za ${postotakPrilagodbe.toFixed(2)}%`;
            } else if (postotakPrilagodbe < 0) {
                postotakTekst = `Skratiti za ${Math.abs(postotakPrilagodbe).toFixed(2)}%`;
            } else {
                postotakTekst = `Nije potrebna prilagodba (0.00%)`;
            }
        } else {
            postotakTekst = `N/A`;
        }

        // IZRAČUN NOVE DULJINE GLAZBENOG SEGMENTA
        let novaDuljinaFrameoviSegmentCalc = 0;
        if (fiksniBPM > 0) {
            const novaDuljinaSekundePrecizno = (brojBeatova / fiksniBPM) * 60;
            novaDuljinaFrameoviSegmentCalc = Math.round(novaDuljinaSekundePrecizno * FPS);
        }
        const formatiranaNovaDuljinaSegment = formatFramesToTimecode(novaDuljinaFrameoviSegmentCalc, FPS);


        // --- NOVO: IZRAČUN NOVE UKUPNE DULJINE FIZIČKE DATOTEKE ---
        let novaDuljinaFrameoviCijeleCalc = ukupnoFrameovaCijele; // Početna vrijednost je originalna duljina
        if (postotakPrilagodbe !== 0) { // Primijeni prilagodbu samo ako je potrebna
            novaDuljinaFrameoviCijeleCalc = Math.round(ukupnoFrameovaCijele * (1 + (postotakPrilagodbe / 100)));
        }
        const formatiranaNovaDuljinaCijele = formatFramesToTimecode(novaDuljinaFrameoviCijeleCalc, FPS);


        // Prikaz frameova po taktu u formatu sekunde:frameovi
        const sekundePoTakatu = Math.floor(frameoviPoTakatu / FPS);
        const preostaliFrameoviPoTakatu = frameoviPoTakatu % FPS;
        const formatiraniFrameoviPoTakatu =
            `${String(sekundePoTakatu).padStart(2, '0')}:` +
            `${String(preostaliFrameoviPoTakatu).padStart(formatFramesToTimecode(0, FPS).split(':')[3].length, '0')}`; // Koristi padding iz helper funkcije


        // Prikaz rezultata u HTML-u
        rezultatVarijabilniBPM.textContent = varijabilniBPM.toFixed(4);
        rezultatFrameoviPoBeatu.textContent = frameoviPoBeatu;
        rezultatFrameoviPoTakatu.textContent = `${frameoviPoTakatu} (${formatiraniFrameoviPoTakatu})`;
        rezultatPostotakPrilagodbe.textContent = postotakTekst;
        rezultatNovaDuljinaSegment.textContent = formatiranaNovaDuljinaSegment;
        rezultatBrojBeatova.textContent = `Ukupni broj beatova za ovo trajanje (zaokruženo): ${brojBeatova}`;
        rezultatNovaDuljinaCijele.textContent = formatiranaNovaDuljinaCijele; // Prikaz novog rezultata
    }

    // --- Postavljanje slušatelja događaja (Event Listeners) ---
    // Slušatelji se postavljaju ovdje, nakon što su svi elementi dohvaćeni.
    fiksniBPMInput.addEventListener('input', izracunajMarkere);
    fpsSelect.addEventListener('change', izracunajMarkere);
    mjeraTaktaSelect.addEventListener('change', izracunajMarkere);

    satiSegmentInput.addEventListener('input', izracunajMarkere);
    minuteSegmentInput.addEventListener('input', izracunajMarkere);
    sekundeSegmentInput.addEventListener('input', izracunajMarkere);
    frameoviSegmentInput.addEventListener('input', izracunajMarkere);

    // Dodaj event listenere za nove inpute cijele datoteke
    satiCijeleInput.addEventListener('input', izracunajMarkere);
    minuteCijeleInput.addEventListener('input', izracunajMarkere);
    sekundeCijeleInput.addEventListener('input', izracunajMarkere);
    frameoviCijeleInput.addEventListener('input', izracunajMarkere);

    // Inicijalni proračun pri učitavanju stranice
    izracunajMarkere();
});