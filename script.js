document.addEventListener('DOMContentLoaded', () => {
    // --- Dohvaćanje DOM elemenata ---
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const fpsSelect = document.getElementById('fpsSelect');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');

    // Inputi za duljinu glazbenog segmenta
    const satiSegmentInput = document.getElementById('satiSegment');
    const minuteSegmentInput = document.getElementById('minuteSegment');
    const sekundeSegmentInput = document.getElementById('sekundeSegment');
    const frameoviSegmentInput = document.getElementById('frameoviSegment');

    // Inputi za ukupnu duljinu fizičke datoteke
    const satiCijeleInput = document.getElementById('satiCijele');
    const minuteCijeleInput = document.getElementById('minuteCijele');
    const sekundeCijeleInput = document.getElementById('sekundeCijele');
    const frameoviCijeleInput = document.getElementById('frameoviCijele');

    // NOVI Inputi za početak glazbenog segmenta unutar fizičke datoteke
    const satiPocetakSegmentaInput = document.getElementById('satiPocetakSegmenta');
    const minutePocetakSegmentaInput = document.getElementById('minutePocetakSegmenta');
    const sekundePocetakSegmentaInput = document.getElementById('sekundePocetakSegmenta');
    const frameoviPocetakSegmentaInput = document.getElementById('frameoviPocetakSegmenta');

    // Elementi za prikaz rezultata
    const rezultatiDiv = document.getElementById('rezultati');
    let rezultatVarijabilniBPM;
    let rezultatFrameoviPoBeatu;
    let rezultatFrameoviPoTakatu;
    let rezultatPostotakPrilagodbe;
    let rezultatNovaDuljinaSegment;
    let rezultatBrojBeatova;
    let rezultatNovaDuljinaCijele;
    let rezultatNoviPocetakSegmenta; // NOVO
    let rezultatNoviKrajSegmenta;   // NOVO

    const fpsHelpText = document.getElementById('fpsHelpText');

    // --- Pomoćna funkcija za renderiranje HTML-a rezultata ---
    function renderResultsHtml() {
        rezultatiDiv.innerHTML = `
            <h3>Izračunani rezultati:</h3>
            <p><strong>Varijabilni BPM:</strong> <span class="precizan-broj" id="rezultatVarijabilniBPM"></span></p>
            <p><strong>Broj frameova po beatu:</strong> <span id="rezultatFrameoviPoBeatu"></span></p>
            <p><strong>Broj frameova po taktu:</strong> <span id="rezultatFrameoviPoTakatu"></span></p>
            <p><strong>Postotak prilagodbe glazbe:</strong> <span id="rezultatPostotakPrilagodbe"></span></p>
            <p><strong>Nova duljina glazbenog segmenta:</strong> <span id="rezultatNovaDuljinaSegment"></span></p>
            <p><strong>Nova ukupna duljina fizičke datoteke:</strong> <span id="rezultatNovaDuljinaCijele"></span></p>
            <p><strong>Novi početak segmenta:</strong> <span id="rezultatNoviPocetakSegmenta"></span></p>
            <p><strong>Novi kraj segmenta:</strong> <span id="rezultatNoviKrajSegmenta"></span></p>
            <p class="napomena" id="rezultatBrojBeatova"></p>
        `;
        // Ponovno dohvati reference jer je innerHTML prebrisan
        rezultatVarijabilniBPM = document.getElementById('rezultatVarijabilniBPM');
        rezultatFrameoviPoBeatu = document.getElementById('rezultatFrameoviPoBeatu');
        rezultatFrameoviPoTakatu = document.getElementById('rezultatFrameoviPoTakatu');
        rezultatPostotakPrilagodbe = document.getElementById('rezultatPostotakPrilagodbe');
        rezultatNovaDuljinaSegment = document.getElementById('rezultatNovaDuljinaSegment');
        rezultatBrojBeatova = document.getElementById('rezultatBrojBeatova');
        rezultatNovaDuljinaCijele = document.getElementById('rezultatNovaDuljinaCijele');
        rezultatNoviPocetakSegmenta = document.getElementById('rezultatNoviPocetakSegmenta');
        rezultatNoviKrajSegmenta = document.getElementById('rezultatNoviKrajSegmenta');
    }

    renderResultsHtml(); // Inicijalno renderiranje

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
            satiSegmentInput, minuteSegmentInput, sekundeSegmentInput, frameoviSegmentInput,
            satiCijeleInput, minuteCijeleInput, sekundeCijeleInput, frameoviCijeleInput,
            satiPocetakSegmentaInput, minutePocetakSegmentaInput, sekundePocetakSegmentaInput, frameoviPocetakSegmentaInput
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
                        if (input === frameoviSegmentInput) {
                            satiCijeleInput.focus();
                        } else if (input === frameoviCijeleInput) {
                            satiPocetakSegmentaInput.focus(); // NOVO: Skok na početak segmenta
                        } else if (input === frameoviPocetakSegmentaInput) { // NOVO: Skok s kraja početka segmenta
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

        // Vrijednosti za glazbeni segment
        const satiSegment = parseInt(satiSegmentInput.value) || 0;
        const minuteSegment = parseInt(minuteSegmentInput.value) || 0;
        const sekundeSegment = parseInt(sekundeSegmentInput.value) || 0;
        const frameoviSegment = parseInt(frameoviSegmentInput.value) || 0;

        // Vrijednosti za ukupnu fizičku datoteku
        const satiCijele = parseInt(satiCijeleInput.value) || 0;
        const minuteCijele = parseInt(minuteCijeleInput.value) || 0;
        const sekundeCijele = parseInt(sekundeCijeleInput.value) || 0;
        const frameoviCijele = parseInt(frameoviCijeleInput.value) || 0;

        // NOVE Vrijednosti za početak glazbenog segmenta
        const satiPocetakSegmenta = parseInt(satiPocetakSegmentaInput.value) || 0;
        const minutePocetakSegmenta = parseInt(minutePocetakSegmentaInput.value) || 0;
        const sekundePocetakSegmenta = parseInt(sekundePocetakSegmentaInput.value) || 0;
        const frameoviPocetakSegmenta = parseInt(frameoviPocetakSegmentaInput.value) || 0;

        const mjeraTakta = parseInt(mjeraTaktaSelect.value);

        fpsHelpText.textContent = `Current FPS: ${FPS}`;
        frameoviSegmentInput.setAttribute('max', Math.floor(FPS - 1));
        frameoviCijeleInput.setAttribute('max', Math.floor(FPS - 1));
        frameoviPocetakSegmentaInput.setAttribute('max', Math.floor(FPS - 1)); // NOVO

        // Provjera unosa i poruke o grešci
        let errorMessage = '';
        if (isNaN(fiksniBPM) || fiksniBPM <= 0) {
            errorMessage = 'Molimo unesite ispravan pozitivan broj za Fiksni (izmjereni) BPM.';
        } else if (isNaN(FPS) || FPS <= 0) {
            errorMessage = 'Molimo odaberite ispravan FPS.';
        }
        else if (isNaN(satiSegment) || satiSegment < 0 || isNaN(minuteSegment) || minuteSegment < 0 || minuteSegment > 59 || isNaN(sekundeSegment) || sekundeSegment < 0 || sekundeSegment > 59 || isNaN(frameoviSegment) || frameoviSegment < 0 || frameoviSegment >= FPS) {
            errorMessage = `Molimo unesite ispravno trajanje glazbenog segmenta (0-${Math.floor(FPS - 1)} frameova).`;
        }
        else if (isNaN(satiCijele) || satiCijele < 0 || isNaN(minuteCijele) || minuteCijele < 0 || minuteCijele > 59 || isNaN(sekundeCijele) || sekundeCijele < 0 || sekundeCijele > 59 || isNaN(frameoviCijele) || frameoviCijele < 0 || frameoviCijele >= FPS) {
            errorMessage = `Molimo unesite ispravno trajanje cijele datoteke (0-${Math.floor(FPS - 1)} frameova).`;
        }
        // NOVE VALIDACIJE za početak segmenta
        else if (isNaN(satiPocetakSegmenta) || satiPocetakSegmenta < 0 || isNaN(minutePocetakSegmenta) || minutePocetakSegmenta < 0 || minutePocetakSegmenta > 59 || isNaN(sekundePocetakSegmenta) || sekundePocetakSegmenta < 0 || sekundePocetakSegmenta > 59 || isNaN(frameoviPocetakSegmenta) || frameoviPocetakSegmenta < 0 || frameoviPocetakSegmenta >= FPS) {
            errorMessage = `Molimo unesite ispravan početak glazbenog segmenta (0-${Math.floor(FPS - 1)} frameova).`;
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

        // NOVO: Izračun početka segmenta u frameovima (originalni timecode)
        const ukupnoSekundiPocetakSegmenta = (satiPocetakSegmenta * 3600) + (minutePocetakSegmenta * 60) + sekundePocetakSegmenta;
        const ukupnoFrameovaPocetakSegmenta = (ukupnoSekundiPocetakSegmenta * FPS) + frameoviPocetakSegmenta;

        if (ukupnoFrameovaSegment === 0) {
            errorMessage = `Ukupno trajanje glazbenog segmenta ne može biti nula. Molimo unesite ispravno trajanje.`;
        }
        if (ukupnoFrameovaCijele === 0 && !errorMessage) {
            errorMessage = `Ukupno trajanje fizičke datoteke ne može biti nula. Molimo unesite ispravno trajanje.`;
        }
        // NOVO: Provjera da početak segmenta ne prelazi ukupnu duljinu
        if (ukupnoFrameovaPocetakSegmenta >= ukupnoFrameovaCijele && !errorMessage) {
            errorMessage = `Početak glazbenog segmenta ne može biti veći ili jednak ukupnoj duljini fizičke datoteke.`;
        }
        // NOVO: Provjera da kraj segmenta ne prelazi ukupnu duljinu
        if ((ukupnoFrameovaPocetakSegmenta + ukupnoFrameovaSegment) > ukupnoFrameovaCijele && !errorMessage) {
             errorMessage = `Kraj glazbenog segmenta (${formatFramesToTimecode(ukupnoFrameovaPocetakSegmenta + ukupnoFrameovaSegment, FPS)}) prelazi ukupnu duljinu fizičke datoteke.`;
        }


        if (errorMessage) {
            rezultatiDiv.innerHTML = `<p class="error-message">${errorMessage}</p>`;
            return;
        }

        if (rezultatiDiv.querySelector('.error-message')) {
            renderResultsHtml();
        }

        const trajanjeUMinutamaSegment = ukupnoFrameovaSegment / FPS / 60;
        let brojBeatova = fiksniBPM * trajanjeUMinutamaSegment;
        brojBeatova = Math.round(brojBeatova);

        if (brojBeatova === 0) {
            rezultatiDiv.innerHTML = `<p class="error-message">Nema dovoljno beatova za izračun. Molimo unesite dulje trajanje glazbenog segmenta ili veći fiksni (izmjereni) BPM.</p>`;
            return;
        }

        const varijabilniBPM = (brojBeatova / ukupnoFrameovaSegment) * FPS * 60;

        let frameoviPoBeatu = (60 / varijabilniBPM) * FPS;
        frameoviPoBeatu = Math.round(frameoviPoBeatu);

        let frameoviPoTakatu = frameoviPoBeatu * mjeraTakta;
        frameoviPoTakatu = Math.round(frameoviPoTakatu);

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

        let novaDuljinaFrameoviSegmentCalc = 0;
        if (fiksniBPM > 0) {
            const novaDuljinaSekundePrecizno = (brojBeatova / fiksniBPM) * 60;
            novaDuljinaFrameoviSegmentCalc = Math.round(novaDuljinaSekundePrecizno * FPS);
        }
        const formatiranaNovaDuljinaSegment = formatFramesToTimecode(novaDuljinaFrameoviSegmentCalc, FPS);

        let novaDuljinaFrameoviCijeleCalc = ukupnoFrameovaCijele;
        if (postotakPrilagodbe !== 0) {
            novaDuljinaFrameoviCijeleCalc = Math.round(ukupnoFrameovaCijele * (1 + (postotakPrilagodbe / 100)));
        }
        const formatiranaNovaDuljinaCijele = formatFramesToTimecode(novaDuljinaFrameoviCijeleCalc, FPS);

        // --- NOVO: Izračun novih timecodea za početak i kraj segmenta ---
        let noviPocetakSegmentaFrameovi = ukupnoFrameovaPocetakSegmenta;
        if (postotakPrilagodbe !== 0) {
            noviPocetakSegmentaFrameovi = Math.round(ukupnoFrameovaPocetakSegmenta * (1 + (postotakPrilagodbe / 100)));
        }
        const formatiraniNoviPocetakSegmenta = formatFramesToTimecode(noviPocetakSegmentaFrameovi, FPS);

        const noviKrajSegmentaFrameovi = noviPocetakSegmentaFrameovi + novaDuljinaFrameoviSegmentCalc;
        const formatiraniNoviKrajSegmenta = formatFramesToTimecode(noviKrajSegmentaFrameovi, FPS);

        const sekundePoTakatu = Math.floor(frameoviPoTakatu / FPS);
        const preostaliFrameoviPoTakatu = frameoviPoTakatu % FPS;
        const formatiraniFrameoviPoTakatu =
            `${String(sekundePoTakatu).padStart(2, '0')}:` +
            `${String(preostaliFrameoviPoTakatu).padStart(formatFramesToTimecode(0, FPS).split(':')[3].length, '0')}`;


        rezultatVarijabilniBPM.textContent = varijabilniBPM.toFixed(4);
        rezultatFrameoviPoBeatu.textContent = frameoviPoBeatu;
        rezultatFrameoviPoTakatu.textContent = `${frameoviPoTakatu} (${formatiraniFrameoviPoTakatu})`;
        rezultatPostotakPrilagodbe.textContent = postotakTekst;
        rezultatNovaDuljinaSegment.textContent = formatiranaNovaDuljinaSegment;
        rezultatBrojBeatova.textContent = `Ukupni broj beatova za ovo trajanje (zaokruženo): ${brojBeatova}`;
        rezultatNovaDuljinaCijele.textContent = formatiranaNovaDuljinaCijele;
        rezultatNoviPocetakSegmenta.textContent = formatiraniNoviPocetakSegmenta; // NOVO
        rezultatNoviKrajSegmenta.textContent = formatiraniNoviKrajSegmenta;     // NOVO
    }

    // --- Postavljanje slušatelja događaja (Event Listeners) ---
    fiksniBPMInput.addEventListener('input', izracunajMarkere);
    fpsSelect.addEventListener('change', izracunajMarkere);
    mjeraTaktaSelect.addEventListener('change', izracunajMarkere);

    satiSegmentInput.addEventListener('input', izracunajMarkere);
    minuteSegmentInput.addEventListener('input', izracunajMarkere);
    sekundeSegmentInput.addEventListener('input', izracunajMarkere);
    frameoviSegmentInput.addEventListener('input', izracunajMarkere);

    satiCijeleInput.addEventListener('input', izracunajMarkere);
    minuteCijeleInput.addEventListener('input', izracunajMarkere);
    sekundeCijeleInput.addEventListener('input', izracunajMarkere);
    frameoviCijeleInput.addEventListener('input', izracunajMarkere);

    // Dodaj event listenere za nove inpute početka segmenta
    satiPocetakSegmentaInput.addEventListener('input', izracunajMarkere);
    minutePocetakSegmentaInput.addEventListener('input', izracunajMarkere);
    sekundePocetakSegmentaInput.addEventListener('input', izracunajMarkere);
    frameoviPocetakSegmentaInput.addEventListener('input', izracunajMarkere);

    // Inicijalni proračun pri učitavanju stranice
    izracunajMarkere();
});