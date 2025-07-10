document.addEventListener('DOMContentLoaded', () => {
    // --- Dohvaćanje DOM elemenata za stranice ---
    const inputPage = document.getElementById('input-page');
    const resultsPage = document.getElementById('results-page');
    const calculateButton = document.getElementById('calculateButton');
    const backButton = document.getElementById('backButton');

    // --- Dohvaćanje DOM elemenata za unos ---
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const fpsSelect = document.getElementById('fpsSelect');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');

    const satiCijeleInput = document.getElementById('satiCijele');
    const minuteCijeleInput = document.getElementById('minuteCijele');
    const sekundeCijeleInput = document.getElementById('sekundeCijele');
    const frameoviCijeleInput = document.getElementById('frameoviCijele');

    const satiPocetakSegmentaInput = document.getElementById('satiPocetakSegmenta');
    const minutePocetakSegmentaInput = document.getElementById('minutePocetakSegmenta');
    const sekundePocetakSegmentaInput = document.getElementById('sekundePocetakSegmenta');
    const frameoviPocetakSegmentaInput = document.getElementById('frameoviPocetakSegmenta');

    const satiKrajSegmentaInput = document.getElementById('satiKrajSegmenta');
    const minuteKrajSegmentaInput = document.getElementById('minuteKrajSegmenta');
    const sekundeKrajSegmentaInput = document.getElementById('sekundeKrajSegmenta');
    const frameoviKrajSegmentaInput = document.getElementById('frameoviKrajSegmenta');

    const fpsHelpText = document.getElementById('fpsHelpText');

    // --- Dohvaćanje DOM elemenata za rezultate ---
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

    // --- Funkcija za prebacivanje stranica ---
    function showPage(pageToShow) {
        if (pageToShow === 'input') {
            inputPage.classList.add('active');
            resultsPage.classList.remove('active');
        } else if (pageToShow === 'results') {
            inputPage.classList.remove('active');
            resultsPage.classList.add('active');
        }
    }

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
            fiksniBPMInput, // Dodan fiksniBPMInput
            satiCijeleInput, minuteCijeleInput, sekundeCijeleInput, frameoviCijeleInput,
            satiPocetakSegmentaInput, minutePocetakSegmentaInput, sekundePocetakSegmentaInput, frameoviPocetakSegmentaInput,
            satiKrajSegmentaInput, minuteKrajSegmentaInput, sekundeKrajSegmentaInput, frameoviKrajSegmentaInput
        ];

        orderedInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                let value = input.value;
                const nextInput = orderedInputs[index + 1];
                const currentFPS = parseFloat(fpsSelect.value);
                const maxFrames = Math.floor(currentFPS - 1);

                if (value.trim() === '') {
                    return;
                }

                const parsedValue = parseInt(value);

                if (isNaN(parsedValue) && input.type === 'number') { // Provjeri samo ako je input number
                    return;
                }

                // Logika za sate, minute, sekunde
                if (input.id.includes('sati') || input.id.includes('minute') || input.id.includes('sekunde')) {
                    if (value.length === 2 && (input.id.includes('sati') || (parsedValue >= 0 && parsedValue <= 59))) {
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                } else if (input.id.includes('frameovi')) {
                    const maxFramesStrLength = String(maxFrames).length;
                    if ((value.length >= maxFramesStrLength && parsedValue >= 0 && parsedValue <= maxFrames) || (value.length === 2 && maxFramesStrLength > 2)) {
                        if (input === frameoviCijeleInput) {
                            satiPocetakSegmentaInput.focus();
                        } else if (input === frameoviPocetakSegmentaInput) {
                            satiKrajSegmentaInput.focus();
                        } else if (input === frameoviKrajSegmentaInput) {
                            mjeraTaktaSelect.focus();
                        }
                    } else if (value.length === 1 && maxFramesStrLength === 1 && parsedValue >= 0 && parsedValue <= maxFrames) {
                        if (input === frameoviCijeleInput) {
                            satiPocetakSegmentaInput.focus();
                        } else if (input === frameoviPocetakSegmentaInput) {
                            satiKrajSegmentaInput.focus();
                        } else if (input === frameoviKrajSegmentaInput) {
                            mjeraTaktaSelect.focus();
                        }
                    }
                } else if (input.id === 'fiksniBPM') { // Posebna provjera za fiksniBPM
                    // Prebacuje fokus kad se unese decimalni broj ili dovoljan broj znamenki
                    if (value.includes('.') && value.split('.')[1].length === 3 || value.length >= 3) {
                         if (nextInput) {
                            fpsSelect.focus(); // FPS select je sljedeći nakon BPM-a
                         }
                    }
                }
            });
        });
    }

    setupAutoAdvance();

    // --- Pomoćna funkcija za formatiranje frameova u timecode (HH:MM:SS:FF) ---
    function formatFramesToTimecode(totalFrames, fps) {
        if (isNaN(totalFrames) || totalFrames < 0 || isNaN(fps) || fps <= 0) {
            return "00:00:00:00";
        }

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

        const satiCijele = parseInt(satiCijeleInput.value) || 0;
        const minuteCijele = parseInt(minuteCijeleInput.value) || 0;
        const sekundeCijele = parseInt(sekundeCijeleInput.value) || 0;
        const frameoviCijele = parseInt(frameoviCijeleInput.value) || 0;

        const satiPocetakSegmenta = parseInt(satiPocetakSegmentaInput.value) || 0;
        const minutePocetakSegmenta = parseInt(minutePocetakSegmentaInput.value) || 0;
        const sekundePocetakSegmenta = parseInt(sekundePocetakSegmentaInput.value) || 0;
        const frameoviPocetakSegmenta = parseInt(frameoviPocetakSegmentaInput.value) || 0;

        const satiKrajSegmenta = parseInt(satiKrajSegmentaInput.value) || 0;
        const minuteKrajSegmenta = parseInt(minuteKrajSegmentaInput.value) || 0;
        const sekundeKrajSegmenta = parseInt(sekundeKrajSegmentaInput.value) || 0;
        const frameoviKrajSegmenta = parseInt(frameoviKrajSegmentaInput.value) || 0;

        const mjeraTakta = parseInt(mjeraTaktaSelect.value);

        fpsHelpText.textContent = `Trenutni FPS: ${FPS}`;
        frameoviCijeleInput.setAttribute('max', Math.floor(FPS - 1));
        frameoviPocetakSegmentaInput.setAttribute('max', Math.floor(FPS - 1));
        frameoviKrajSegmentaInput.setAttribute('max', Math.floor(FPS - 1));

        const ukupnoSekundiCijele = (satiCijele * 3600) + (minuteCijele * 60) + sekundeCijele;
        const ukupnoFrameovaCijele = (ukupnoSekundiCijele * FPS) + frameoviCijele;

        const ukupnoSekundiPocetakSegmenta = (satiPocetakSegmenta * 3600) + (minutePocetakSegmenta * 60) + sekundePocetakSegmenta;
        const ukupnoFrameovaPocetakSegmenta = (ukupnoSekundiPocetakSegmenta * FPS) + frameoviPocetakSegmenta;

        const ukupnoSekundiKrajSegmenta = (satiKrajSegmenta * 3600) + (minuteKrajSegmenta * 60) + sekundeKrajSegmenta;
        const ukupnoFrameovaKrajSegmenta = (ukupnoSekundiKrajSegmenta * FPS) + frameoviKrajSegmenta;

        const ukupnoFrameovaSegment = ukupnoFrameovaKrajSegmenta - ukupnoFrameovaPocetakSegmenta;

        // --- Obrada grešaka ---
        let errorMessage = '';
        if (isNaN(fiksniBPM) || fiksniBPM <= 0) {
            errorMessage = 'Molimo unesite ispravan pozitivan broj za Fiksni (izmjereni) BPM.';
        } else if (isNaN(FPS) || FPS <= 0) {
            errorMessage = 'Molimo odaberite ispravan FPS.';
        }
        else if (
            typeof satiCijele !== 'number' || satiCijele < 0 ||
            typeof minuteCijele !== 'number' || minuteCijele < 0 || minuteCijele > 59 ||
            typeof sekundeCijele !== 'number' || sekundeCijele < 0 || sekundeCijele > 59 ||
            typeof frameoviCijele !== 'number' || frameoviCijele < 0 || frameoviCijele >= FPS
        ) {
            errorMessage = `Molimo unesite ispravno trajanje cijele datoteke (0-${Math.floor(FPS - 1)} frameova).`;
        }
        else if (
            typeof satiPocetakSegmenta !== 'number' || satiPocetakSegmenta < 0 ||
            typeof minutePocetakSegmenta !== 'number' || minutePocetakSegmenta < 0 || minutePocetakSegmenta > 59 ||
            typeof sekundePocetakSegmenta !== 'number' || sekundePocetakSegmenta < 0 || sekundePocetakSegmenta > 59 ||
            typeof frameoviPocetakSegmenta !== 'number' || frameoviPocetakSegmenta < 0 || frameoviPocetakSegmenta >= FPS
        ) {
            errorMessage = `Molimo unesite ispravan timecode početka glazbenog segmenta (0-${Math.floor(FPS - 1)} frameova).`;
        }
        else if (
            typeof satiKrajSegmenta !== 'number' || satiKrajSegmenta < 0 ||
            typeof minuteKrajSegmenta !== 'number' || minuteKrajSegmenta < 0 || minuteKrajSegmenta > 59 ||
            typeof sekundeKrajSegmenta !== 'number' || sekundeKrajSegmenta < 0 || sekundeKrajSegmenta > 59 ||
            typeof frameoviKrajSegmenta !== 'number' || frameoviKrajSegmenta < 0 || frameoviKrajSegmenta >= FPS
        ) {
            errorMessage = `Molimo unesite ispravan timecode kraja glazbenog segmenta (0-${Math.floor(FPS - 1)} frameova).`;
        }
        else if (isNaN(mjeraTakta) || mjeraTakta <= 0) {
            errorMessage = 'Molimo odaberite ispravnu mjeru takta (broj udaraca mora biti pozitivan).';
        }
        else if (ukupnoFrameovaCijele <= 0) {
            errorMessage = `Ukupno trajanje fizičke datoteke mora biti veće od nule. Molimo unesite ispravno trajanje.`;
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
        else if (isNaN(fiksniBPM) || fiksniBPM <= 0) { // Ponovna provjera BPM-a
             errorMessage = 'Molimo unesite ispravan pozitivan broj za Fiksni (izmjereni) BPM.';
        }


        let errorParagraph = rezultatiDiv.querySelector('.error-message');
        if (errorParagraph) {
            errorParagraph.remove();
        }

        if (errorMessage) {
            errorParagraph = document.createElement('p');
            errorParagraph.classList.add('error-message');
            errorParagraph.textContent = errorMessage;
            // Ne dodajemo ga u rezultatiDiv na results-page, već na input-page
            // Bolje je imati zasebno mjesto za greške na stranici unosa
            const inputPageContainer = document.querySelector('#input-page .container'); // Dohvati kontejner za inpute
            if (!inputPageContainer.querySelector('.error-message')) { // Dodaj samo ako već ne postoji
                inputPage.insertBefore(errorParagraph, calculateButton); // Dodaj prije gumba Izračunaj
            }
            // Sakrij sve rezultate i vrati se na input stranicu
            document.querySelectorAll('#rezultati p').forEach(p => p.style.display = 'none');
            document.querySelector('#rezultati h3').style.display = 'none';
            showPage('input'); // Vrati se na stranicu za unos
            return;
        } else {
            // Ako nema grešaka, prikaži sve rezultate i prikaži rezultate stranicu
            const existingError = inputPage.querySelector('.error-message');
            if (existingError) {
                existingError.remove(); // Ukloni poruku o grešci s input stranice
            }
            document.querySelectorAll('#rezultati p').forEach(p => p.style.display = 'block');
            document.querySelector('#rezultati h3').style.display = 'block';
            showPage('results'); // Prijeđi na stranicu za rezultate
        }
        // --- Kraj obrade grešaka ---

        const trajanjeUMinutamaSegment = ukupnoFrameovaSegment / FPS / 60;
        let brojBeatova = fiksniBPM * trajanjeUMinutamaSegment;
        brojBeatova = Math.round(brojBeatova);

        if (brojBeatova === 0) {
            errorMessage = `Nema dovoljno beatova za izračun. Molimo unesite dulji glazbeni segment ili veći fiksni (izmjereni) BPM.`;
            errorParagraph = document.createElement('p');
            errorParagraph.classList.add('error-message');
            errorParagraph.textContent = errorMessage;
            inputPage.insertBefore(errorParagraph, calculateButton); // Dodaj na input stranici
            document.querySelectorAll('#rezultati p').forEach(p => p.style.display = 'none');
            document.querySelector('#rezultati h3').style.display = 'none';
            showPage('input'); // Vrati se na input stranicu
            return;
        }

        const varijabilniBPM = (brojBeatova / ukupnoFrameovaSegment) * FPS * 60;

        let frameoviPoBeatu = (60 / varijabilniBPM) * FPS;
        const prikazFrameoviPoBeatu = Math.round(frameoviPoBeatu);

        let frameoviPoTakatu = frameoviPoBeatu * mjeraTakta;
        const prikazFrameoviPoTakatu = Math.round(frameoviPoTakatu);

        let novaDuljinaFrameoviSegmentCalc = 0;
        if (fiksniBPM > 0) {
            const novaDuljinaSekundePrecizno = (brojBeatova / fiksniBPM) * 60;
            novaDuljinaFrameoviSegmentCalc = Math.round(novaDuljinaSekundePrecizno * FPS);
        }
        const formatiranaNovaDuljinaSegment = formatFramesToTimecode(novaDuljinaFrameoviSegmentCalc, FPS);

        const scalingFactor = ukupnoFrameovaSegment > 0 ? (novaDuljinaFrameoviSegmentCalc / ukupnoFrameovaSegment) : 1;

        let postotakPrilagodbe = (scalingFactor - 1) * 100;
        let postotakTekst = '';

        if (postotakPrilagodbe > 0) {
            postotakTekst = `Produžiti za ${postotakPrilagodbe.toFixed(2)}%`;
        } else if (postotakPrilagodbe < 0) {
            postotakTekst = `Skratiti za ${Math.abs(postotakPrilagodbe).toFixed(2)}%`;
        } else {
            postotakTekst = `Nije potrebna prilagodba (0.00%)`;
        }

        const novaDuljinaFrameoviCijeleCalc = Math.round(ukupnoFrameovaCijele * scalingFactor);
        const formatiranaNovaDuljinaCijele = formatFramesToTimecode(novaDuljinaFrameoviCijeleCalc, FPS);

        const noviPocetakSegmentaFrameovi = Math.round(ukupnoFrameovaPocetakSegmenta * scalingFactor);
        const formatiraniNoviPocetakSegmenta = formatFramesToTimecode(noviPocetakSegmentaFrameovi, FPS);

        const noviKrajSegmentaFrameovi = noviPocetakSegmentaFrameovi + novaDuljinaFrameoviSegmentCalc;
        const formatiraniNoviKrajSegmenta = formatFramesToTimecode(noviKrajSegmentaFrameovi, FPS);

        const formatiranaIzracunataOriginalnaDuljinaSegmenta = formatFramesToTimecode(ukupnoFrameovaSegment, FPS);

        const sekundePoTakatu = Math.floor(prikazFrameoviPoTakatu / FPS);
        const preostaliFrameoviPoTakatu = prikazFrameoviPoTakatu % FPS;
        const formatiraniFrameoviPoTakatu =
            `${String(sekundePoTakatu).padStart(2, '0')}:` +
            `${String(preostaliFrameoviPoTakatu).padStart(formatFramesToTimecode(0, FPS).split(':')[3].length, '0')}`;


        // AŽURIRANJE TEKSTA ELEMENATA
        rezultatVarijabilniBPM.textContent = varijabilniBPM.toFixed(4);
        rezultatFrameoviPoBeatu.textContent = prikazFrameoviPoBeatu;
        rezultatFrameoviPoTakatu.textContent = `${prikazFrameoviPoTakatu} (${formatiraniFrameoviPoTakatu})`;
        rezultatPostotakPrilagodbe.textContent = postotakTekst;
        rezultatIzracunataOriginalnaDuljinaSegmenta.textContent = formatiranaIzracunataOriginalnaDuljinaSegmenta;
        rezultatNovaDuljinaSegment.textContent = formatiranaNovaDuljinaSegment;
        rezultatBrojBeatova.textContent = `Ukupni broj beatova za ovo trajanje (zaokruženo): ${brojBeatova}`;
        rezultatNovaDuljinaCijele.textContent = formatiranaNovaDuljinaCijele;
        rezultatNoviPocetakSegmenta.textContent = formatiraniNoviPocetakSegmenta;
        rezultatNoviKrajSegmenta.textContent = formatiraniNoviKrajSegmenta;
    }

    // --- Postavljanje slušatelja događaja (Event Listeners) ---
    // Slušatelj za gumb "Izračunaj"
    calculateButton.addEventListener('click', izracunajMarkere);

    // Slušatelj za gumb "Natrag na unos"
    backButton.addEventListener('click', () => showPage('input'));

    // Slušatelji za input polja - sada će samo pokrenuti izračun ako su na input stranici
    // i prebaciti se na rezultate ako su validni
    fiksniBPMInput.addEventListener('input', () => { /* no direct calculation */ });
    fpsSelect.addEventListener('change', izracunajMarkere); // FPS i mjeraTakta mogu odmah pokrenuti izračun ako su svi ostali podaci validni
    mjeraTaktaSelect.addEventListener('change', izracunajMarkere);

    const timecodeInputs = [
        satiCijeleInput, minuteCijeleInput, sekundeCijeleInput, frameoviCijeleInput,
        satiPocetakSegmentaInput, minutePocetakSegmentaInput, sekundePocetakSegmentaInput, frameoviPocetakSegmentaInput,
        satiKrajSegmentaInput, minuteKrajSegmentaInput, sekundeKrajSegmentaInput, frameoviKrajSegmentaInput
    ];
    timecodeInputs.forEach(input => {
        input.addEventListener('input', () => { /* no direct calculation */ });
    });

    // Inicijalno prikaži input stranicu
    showPage('input');
    izracunajMarkere(); // Pokreni inicijalni proračun da popuni rezultate pri prvom otvaranju
});