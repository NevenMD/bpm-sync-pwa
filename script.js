document.addEventListener('DOMContentLoaded', () => {
    console.log('Script.js loaded and DOMContentLoaded fired.'); 

    const inputPage = document.getElementById('input-page');
    const resultsPage = document.getElementById('results-page');
    const calculateButton = document.getElementById('calculateButton');
    const backButton = document.getElementById('backButton');
    const exportEdlButton = document.getElementById('exportEdlButton');

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

    const rezultatiDiv = document.getElementById('rezultati');
    const rezultatCiljaniBPM = document.getElementById('rezultatCiljaniBPM');
    const rezultatIzmjereniBPM = document.getElementById('rezultatIzmjereniBPM');
    const rezultatUkupanBrojBeatovaCilj = document.getElementById('rezultatUkupanBrojBeatovaCilj');
    const rezultatUkupanBrojBeatovaStvarno = document.getElementById('rezultatUkupanBrojBeatovaStvarno');
    const rezultatUkupniDrift = document.getElementById('rezultatUkupniDrift');
    const rezultatNapomenaDrift = document.getElementById('rezultatNapomenaDrift');
    const markeriZaIspravakDiv = document.getElementById('markeriZaIspravak');
    const noMarkersMessage = document.getElementById('noMarkersMessage');

    let edlMarkers = [];

    function showPage(pageToShow) {
        if (pageToShow === 'input') {
            inputPage.classList.add('active');
            resultsPage.classList.remove('active');
            if (fiksniBPMInput) { 
                fiksniBPMInput.focus(); 
            }
        } else if (pageToShow === 'results') {
            inputPage.classList.remove('active');
            resultsPage.classList.add('active');
        }
    }

    function selectOnFocus(event) {
        event.target.select();
    }

    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('focus', selectOnFocus);
    });

    function setupAutoAdvance() {
        const orderedInputs = [
            fiksniBPMInput, ciljaniBPMInput,
            satiCijeleInput, minuteCijeleInput, sekundeCijeleInput, frameoviCijeleInput,
            satiPocetakSegmentaInput, minutePocetakSegmentaInput, sekundePocetakSegmentaInput, frameoviPocetakSegmentaInput,
            satiKrajSegmentaInput, minuteKrajSegmentaInput, sekundeKrajSegmentaInput, frameoviKrajSegmentaInput,
            pragDriftaFrameoviInput
        ];

        orderedInputs.forEach((input, index) => {
            if (!input) return; 

            input.addEventListener('input', () => {
                let value = input.value;
                const nextInput = orderedInputs[index + 1];
                const currentFPS = parseFloat(fpsSelect.value);
                const maxFrames = Math.floor(currentFPS - 1);

                if (value.trim() === '') {
                    return; 
                }

                if (input.id === 'fiksniBPM' || input.id === 'ciljaniBPM') {
                    if (value.includes('.')) {
                        const decimalPart = value.split('.')[1];
                        if (decimalPart && decimalPart.length >= 4) { // Pamtimo da Varijabilni BPM treba biti decimalni broj
                            if (nextInput) {
                                nextInput.focus();
                            }
                        }
                    } else if (value.length >= 3 && !isNaN(parseFloat(value))) {
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                }
                else if (input.id.includes('sati') || input.id.includes('minute') || input.id.includes('sekunde')) {
                    const parsedValue = parseInt(value);
                    if (!isNaN(parsedValue) && value.length === 2 && (input.id.includes('sati') || (parsedValue >= 0 && parsedValue <= 59))) {
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                }
                else if (input.id.includes('frameovi')) {
                    const parsedValue = parseInt(value);
                    if (!isNaN(parsedValue)) {
                        const maxFramesStrLength = String(maxFrames).length;
                        if ((value.length >= maxFramesStrLength && parsedValue >= 0 && parsedValue <= maxFrames) || (value.length === 2 && currentFPS > 10)) {
                            if (input === frameoviCijeleInput) {
                                satiPocetakSegmentaInput.focus();
                            } else if (input === frameoviPocetakSegmentaInput) {
                                satiKrajSegmentaInput.focus();
                            } else if (input === frameoviKrajSegmentaInput) {
                                mjeraTaktaSelect.focus();
                            }
                        } else if (value.length === 1 && currentFPS <= 10 && parsedValue >= 0 && parsedValue <= maxFrames) {
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
                else if (input.id === 'pragDriftaFrameovi') {
                    const parsedValue = parseInt(value);
                    if (!isNaN(parsedValue) && value.length >= 1 && parsedValue >= 0) {
                        calculateButton.focus();
                    }
                }
            });
        });
    }

    setupAutoAdvance();

    fpsSelect.addEventListener('change', () => {
        const currentFPS = parseFloat(fpsSelect.value);
        fpsHelpText.textContent = `Trenutni FPS: ${currentFPS}`;
        frameoviCijeleInput.setAttribute('max', Math.floor(currentFPS - 1));
        frameoviPocetakSegmentaInput.setAttribute('max', Math.floor(currentFPS - 1));
        frameoviKrajSegmentaInput.setAttribute('max', Math.floor(currentFPS - 1));
    });

    function formatFramesToTimecode(totalFrames, fps) {
        if (isNaN(totalFrames) || totalFrames < 0 || isNaN(fps) || fps <= 0) {
            return "00:00:00:00";
        }

        const sati = Math.floor(totalFrames / (fps * 3600));
        const preostaliFrameoviNakonSati = totalFrames % (fps * 3600);
        const minute = Math.floor(preostaliFrameoviNakonSati / (fps * 60));
        const preostaliFrameoviNakonMinuta = preostaliFrameoviNakonSati % (fps * 60);
        const sekunde = Math.floor(preostaliFrameoviNakonMinuta / fps);
        // Round frames to nearest integer to avoid floating point issues
        const frameovi = Math.round(preostaliFrameoviNakonMinuta % fps);

        const framePadding = 2; // Edius example shows 2 digits for frames

        return `${String(sati).padStart(2, '0')}:` +
               `${String(minute).padStart(2, '0')}:` +
               `${String(sekunde).padStart(2, '0')}:` +
               `${String(frameovi).padStart(framePadding, '0')}`;
    }

    function generateAndDownloadEDL() {
        if (edlMarkers.length === 0) {
            alert('Nema markera za generiranje EDL-a. Molimo prvo izračunajte markere.');
            return;
        }

        let edlContent = 'TITLE: BPM_Sync_Markers\r\n'; // CRLF
        edlContent += `FCM: NON-DROP FRAME\r\n`; // CRLF
        
        // Add the specific null character and spacing structure Edius uses after FCM line
        // Based on the provided EDL, it appears to be a pattern of nulls and spaces.
        // It's incredibly hard to replicate exactly, so we'll approximate with what seems to be spaces.
        // The Notepad++ "Save As" will be the real fixer for the specific nulls/padding.
        edlContent += `\r\n`; // A blank line as seen in example after FCM
        edlContent += `\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\r\n`; // Placeholder for potential nulls
        edlContent += `\r\n`; // Another blank line before headers

        // Main header line with exact spacing
        edlContent += `EVENT       AX       DUMMY_CLIP  V     C        SOURCE IN           SOURCE OUT          DEST IN             DEST OUT\r\n`;
        edlContent += `* COMMENT: Dummy clip for Edius compatibility\r\n`;
        edlContent += `\r\n`; // Empty line after comment

        const fps = parseFloat(fpsSelect.value);
        const dummyClipDurationFrames = Math.round(fps * 10); 
        const dummyClipOutTC = formatFramesToTimecode(dummyClipDurationFrames, fps);

        // Dummy clip line - attempting to match Edius's fixed-width spacing
        // 001      AX       DUMMY_CLIP  V     C        00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00
        edlContent += `001      AX       DUMMY_CLIP  V     C        00:00:00:00 ${dummyClipOutTC} 00:00:00:00 ${dummyClipOutTC}\r\n`;
        edlContent += `* COMMENT: Dummy clip for Edius compatibility\r\n`;
        edlContent += `\r\n`; // Additional blank line after dummy clip comment

        edlMarkers.forEach((marker, index) => {
            const eventNum = String(index + 2).padStart(3, '0'); // Start from 002 as 001 is dummy clip
            const reelId = 'V'; // Based on your example
            const track = 'V'; 
            const type = 'M'; // Marker type
            const clipName = 'MARKER_POINT'; // Max 12 chars
            const markerTC = marker.timecode; 
            
            // Attempting to replicate fixed-width spacing for markers
            // 002      V        MARKER_POINTV     M        00:00:38:21 00:00:38:21 00:00:38:21 00:00:38:21
            // Edius example: 002      V        MARKER_POINTV     M        00:00:38:21 00:00:38:21 00:00:38:21 00:00:38:21
            // Let's manually pad to match:
            const line = 
                `${eventNum}      ${reelId}        ${clipName}` + 
                `${track}     ${type}        ` + // Extra spaces to align with Edius example
                `${markerTC} ${markerTC} ${markerTC} ${markerTC}\r\n`;
            edlContent += line;
            edlContent += `* COMMENT: ${marker.comment}\r\n`; 
            edlContent += `\r\n`; // Additional blank line after each marker comment
        });

        // Edius EDL seems to end with a few blank lines
        edlContent += `\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n`; 
        
        // --- KLJUČNA PROMJENA: KORISTIMO UTF-16 LE S BOM-OM ---
        const textEncoder = new TextEncoder('utf-16le'); // Specifikacija UTF-16 LE
        const encodedContent = textEncoder.encode(edlContent); // Enkodiranje stringa

        // Dodajemo BOM za UTF-16 LE (FF FE) na početak
        const bom = new Uint8Array([0xFF, 0xFE]); 

        // Spajamo BOM i kodirani sadržaj u jedan Blob
        const finalBlob = new Blob([bom, encodedContent], { type: 'text/plain' }); // type 'text/plain' bez charseta

        const fileName = `BPM_Sync_Markers_${new Date().toISOString().slice(0, 10)}.edl`;

        const a = document.createElement('a');
        a.href = URL.createObjectURL(finalBlob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    function izracunajMarkere() {
        console.log('Calculate button clicked. Starting calculation...'); 

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
        const frameoviPocetakSegmenta = parseInt(frameoviPocetakSegmentaInput.value)