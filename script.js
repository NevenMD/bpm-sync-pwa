document.addEventListener('DOMContentLoaded', () => {
    // --- Dohvaćanje DOM elemenata za stranice ---
    const inputPage = document.getElementById('input-page');
    const resultsPage = document.getElementById('results-page');
    const calculateButton = document.getElementById('calculateButton');
    const backButton = document.getElementById('backButton');
    const exportEdlButton = document.getElementById('exportEdlButton');

    // --- Dohvaćanje DOM elemenata za unos ---
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const ciljaniBPMInput = document.getElementById('ciljaniBPM');
    const fpsSelect = document.getElementById('fpsSelect');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');
    const pragDriftaFrameoviInput = document.getElementById('pragDriftaFrameovi');

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
    const rezultatCiljaniBPM = document.getElementById('rezultatCiljaniBPM');
    const rezultatIzmjereniBPM = document.getElementById('rezultatIzmjereniBPM');
    const rezultatUkupanBrojBeatovaCilj = document.getElementById('rezultatUkupanBrojBeatovaCilj');
    const rezultatUkupanBrojBeatovaStvarno = document.getElementById('rezultatUkupanBrojBeatovaStvarno');
    const rezultatUkupniDrift = document.getElementById('rezultatUkupniDrift');
    const rezultatNapomenaDrift = document.getElementById('rezultatNapomenaDrift');
    const markeriZaIspravakDiv = document.getElementById('markeriZaIspravak');
    const noMarkersMessage = document.getElementById('noMarkersMessage');

    // --- Globalna varijabla za spremanje markera za EDL izvoz ---
    let edlMarkers = [];

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
            fiksniBPMInput, ciljaniBPMInput,
            satiCijeleInput, minuteCijeleInput, sekundeCijeleInput, frameoviCijeleInput,
            satiPocetakSegmentaInput, minutePocetakSegmentaInput, sekundePocetakSegmentaInput, frameoviPocetakSegmentaInput,
            satiKrajSegmentaInput, minuteKrajSegmentaInput, sekundeKrajSegmentaInput, frameoviKrajSegmentaInput,
            pragDriftaFrameoviInput
        ];

        orderedInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                let value = input.value;
                const nextInput = orderedInputs[index + 1];
                const currentFPS = parseFloat(fpsSelect.value);
                const maxFrames = Math.floor(currentFPS - 1);

                if (value.trim() === '') {
                    return; // Don't advance on empty input
                }

                // Logic for BPM fields (fiksniBPM and ciljaniBPM)
                if (input.id === 'fiksniBPM' || input.id === 'ciljaniBPM') {
                    if (value.includes('.')) {
                        const decimalPart = value.split('.')[1];
                        // Advance only when 4 or more decimal digits are entered
                        if (decimalPart && decimalPart.length >= 4) {
                            if (nextInput) {
                                nextInput.focus();
                            }
                        }
                    } else if (value.length >= 3 && !isNaN(parseFloat(value))) {
                        // Advance for whole numbers with 3+ digits (e.g., 120)
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                }
                // Logic for hours, minutes, seconds fields
                else if (input.id.includes('sati') || input.id.includes('minute') || input.id.includes('sekunde')) {
                    const parsedValue = parseInt(value);
                    // Advance if 2 digits are entered, and it's a valid number for minutes/seconds (0-59) or for hours
                    if (!isNaN(parsedValue) && value.length === 2 && (input.id.includes('sati') || (parsedValue >= 0 && parsedValue <= 59))) {
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                }
                // Logic for frame fields
                else if (input.id.includes('frameovi')) {
                    const parsedValue = parseInt(value);
                    if (!isNaN(parsedValue)) {
                        const maxFramesStrLength = String(maxFrames).length;
                        // Advance if value length is equal to max frames digit length AND it's within range
                        // OR if it's 2 digits for FPS > 10 (e.g., 25, 30, 60)
                        if ((value.length >= maxFramesStrLength && parsedValue >= 0 && parsedValue <= maxFrames) || (value.length === 2 && currentFPS > 10)) {
                            if (input === frameoviCijeleInput) {
                                satiPocetakSegmentaInput.focus();
                            } else if (input === frameoviPocetakSegmentaInput) {
                                satiKrajSegmentaInput.focus();
                            } else if (input === frameoviKrajSegmentaInput) {
                                mjeraTaktaSelect.focus();
                            }
                        } else if (value.length === 1 && currentFPS <= 10 && parsedValue >= 0 && parsedValue <= maxFrames) { // For FPS <= 10 (single digit frames)
                            if (input === frameoviCijeleInput) {
                                satiPocetakSegmentaInput.focus();
                            } else if (input === frameoviPocetakSegmentaInput) {
                                satiKrajSegmentaInput.focus();
                            } else if (input === frameoviKrajSegmentaInput) {
                                mjeraTaktaSelect.focus();
                            }
                        }
                    }
                }
                // Logic for pragDriftaFrameovi
                else if (input.id === 'pragDriftaFrameovi') {
                    const parsedValue = parseInt(value);
                    if (!isNaN(parsedValue) && value.length >= 1 && parsedValue >= 0) {
                        calculateButton.focus(); // Switch to the Calculate button
                    }
                }
            });
        });
    }

    setupAutoAdvance();

    // Update FPS help text on select change
    fpsSelect.addEventListener('change', () => {
        const currentFPS = parseFloat(fpsSelect.value);
        fpsHelpText.textContent = `Trenutni FPS: ${currentFPS}`;
        frameoviCijeleInput.setAttribute('max', Math.floor(currentFPS - 1));
        frameoviPocetakSegmentaInput.setAttribute('max', Math.floor(currentFPS - 1));
        frameoviKrajSegmentaInput.setAttribute('max', Math.floor(currentFPS - 1));
    });

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

        // Determines padding for frames (e.g., 00-24 for 25 FPS, 0-9 for 10 FPS)
        const framePadding = Math.ceil(fps).toString().length > 1 ? 2 : 1; 

        return `${String(sati).padStart(2, '0')}:` +
               `${String(minute).padStart(2, '0')}:` +
               `${String(sekunde).padStart(2, '0')}:` +
               `${String(frameovi).padStart(framePadding, '0')}`;
    }

    // --- Funkcija za generiranje i preuzimanje EDL datoteke ---
    function generateAndDownloadEDL() {
        if (edlMarkers.length === 0) {
            alert('Nema markera za generiranje EDL-a. Molimo prvo izračunajte markere.');
            return;
        }

        let edlContent = 'TITLE: BPM_Sync_Markers\n';
        edlContent += `FCM: NON-DROP FRAME\n\n`;

        edlMarkers.forEach((marker, index) => {
            const eventNum = String(index + 1).padStart(3, '0');
            const reelId = 'VIDEO';
            const track = 'V';
            const type = 'M';
            const sourceIn = marker.timecode;
            const sourceOut = formatFramesToTimecode(Math.round(marker.totalFrames + 1), parseFloat(fpsSelect.value)); 
            const destIn = marker.timecode;
            const destOut = formatFramesToTimecode(Math.round(marker.totalFrames + 1), parseFloat(fpsSelect.value)); 
            const comment = `* COMMENT: ${marker.comment}`;

            edlContent += `${eventNum}  ${reelId} ${track} ${type}         ${sourceIn} ${sourceOut} ${destIn} ${destOut}\n`;
            edlContent += `${comment}\n`;
        });

        const blob = new Blob([edlContent], { type: 'text/plain;charset=utf-8' });
        const fileName = `BPM_Sync_Markers_${new Date().toISOString().slice(0, 10)}.edl`;

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    // --- Glavna funkcija za proračun ---
    function izracunajMarkere() {
        const fiksniBPM = parseFloat(fiksniBPMInput.value);
        const ciljaniBPM = parseFloat(ciljaniBPMInput.value);
        const FPS = parseFloat(fpsSelect.value);
        const pragDriftaFrameovi = parseInt(pragDriftaFrameoviInput.value);

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

        // Update FPS help text and max frames on each calculation
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
            errorMessage = 'Molimo unesite ispravan pozitivan broj za Fiksni (izmjereni) BPM glazbe.';
        } else if (isNaN(ciljaniBPM) || ciljaniBPM <= 0) {
            errorMessage = 'Molimo unesite ispravan pozitivan broj za Ciljani BPM videa.';
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
        else if (isNaN(pragDriftaFrameovi) || pragDriftaFrameovi < 0) {
            errorMessage = 'Molimo unesite ispravan prag drifta (pozitivan broj ili nula).';
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


        let errorParagraph = inputPage.querySelector('.error-message');
        if (errorParagraph) {
            errorParagraph.remove(); 
        }

        if (errorMessage) {
            errorParagraph = document.createElement('p');
            errorParagraph.classList.add('error-message');
            errorParagraph.textContent = errorMessage;
            inputPage.insertBefore(errorParagraph, calculateButton);
            showPage('input'); 
            markeriZaIspravakDiv.innerHTML = ''; 
            noMarkersMessage.style.display = 'none';
            exportEdlButton.style.display = 'none'; 
            edlMarkers = []; 
            return; 
        } else {
            showPage('results');
        }
        // --- Kraj obrade grešaka ---

        // IZRAČUNI NA TEMELJU NOVOG PRISTUPA
        const ciljTrajanjeSekundeSegment = ukupnoFrameovaSegment / FPS;
        const ciljaniBrojBeatova = Math.round(ciljaniBPM * (ciljTrajanjeSekundeSegment /