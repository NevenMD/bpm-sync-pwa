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
        const frameovi = Math.round(preostaliFrameoviNakonMinuta % fps);

        const framePadding = 2; 

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

        let edlContent = 'TITLE: BPM_Sync_Markers\r\n'; // CRLF za Windows
        edlContent += `FCM: NON-DROP FRAME\r\n\r\n`; // CRLF za Windows, dva za praznu liniju

        const fps = parseFloat(fpsSelect.value);
        const dummyClipDurationFrames = Math.round(fps * 10); 
        const dummyClipOutTC = formatFramesToTimecode(dummyClipDurationFrames, fps);

        // Reel ID za DUMMY_CLIP je AX (za 'Axillary', generička traka)
        // Pažljivo postavljeni razmaci radi fiksne širine polja
        // EventNum ReelID ClipName    Track Type Source In   Source Out  Dest In     Dest Out
        // 001      AX       DUMMY_CLIP  V     C    00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00
        edlContent += `001      AX       DUMMY_CLIP  V     C        00:00:00:00 ${dummyClipOutTC} 00:00:00:00 ${dummyClipOutTC}\r\n`;
        edlContent += `* COMMENT: Dummy clip for Edius compatibility\r\n`;
        edlContent += `\r\n`; // Dodatna prazna linija nakon dummy klipa


        edlMarkers.forEach((marker, index) => {
            const eventNum = String(index + 2).padStart(3, '0');
            const reelId = 'V'; 
            const track = 'V'; 
            const type = 'M'; // Marker type
            const clipName = 'MARKER_POINT'; // Max 12 znakova

            const markerTC = marker.timecode; 
            
            // Pažljivo postavljeni razmaci i CRLF
            // 002      V        MARKER_POINTV     M        00:00:38:21 00:00:38:21 00:00:38:21 00:00:38:21
            edlContent += `${eventNum}      ${reelId}        ${clipName}  ${track}     ${type}    ${markerTC} ${markerTC} ${markerTC} ${markerTC}\r\n`;
            edlContent += `* COMMENT: ${marker.comment}\r\n`; 
            edlContent += `\r\n`; // Dodatna prazna linija nakon svakog markera
        });

        // Edius EDL završava praznim linijama (pretpostavka iz tvog primjera)
        edlContent += `\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n`; 
        
        // Stvara Blob s UTF-8 kodiranjem i CRLF
        // Preglednici standardno preferiraju UTF-8.
        const finalBlob = new Blob([edlContent], { type: 'text/plain;charset=utf-8' });

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

        const ciljTrajanjeSekundeSegment = ukupnoFrameovaSegment / FPS;
        const ciljaniBrojBeatova = Math.round(ciljaniBPM * (ciljTrajanjeSekundeSegment / 60));

        const stvarniTrajanjeSekundeSegment = ukupnoFrameovaSegment / FPS;
        const stvarniBrojBeatova = Math.round(fiksniBPM * (stvarniTrajanjeSekundeSegment / 60));

        const ciljanaDuljinaSegmentaFrameovi = (ciljaniBrojBeatova / ciljaniBPM) * 60 * FPS;
        const stvarnaDuljinaSegmentaFrameoviFiksniBPM = (stvarniBrojBeatova / fiksniBPM) * 60 * FPS;

        const ukupniDriftFrameovi = stvarnaDuljinaSegmentaFrameoviFiksniBPM - ciljanaDuljinaSegmentaFrameovi;

        rezultatCiljaniBPM.textContent = ciljaniBPM.toFixed(4);
        rezultatIzmjereniBPM.textContent = fiksniBPM.toFixed(4);
        rezultatUkupanBrojBeatovaCilj.textContent = ciljaniBrojBeatova;
        rezultatUkupanBrojBeatovaStvarno.textContent = stvarniBrojBeatova;
        rezultatUkupniDrift.textContent = `${ukupniDriftFrameovi.toFixed(2)} frameova`;

        let driftNapomena = '';
        if (Math.abs(ukupniDriftFrameovi) < 0.1) {
            driftNapomena = 'Gotovo savršeno usklađeno na kraju segmenta!';
        } else if (ukupniDriftFrameovi > 0) {
            driftNapomena = `Glazba kasni za video za ${ukupniDriftFrameovi.toFixed(2)} frameova na kraju segmenta. Trebat će je ubrzavati.`;
        } else {
            driftNapomena = `Glazba pretiče video za ${Math.abs(ukupniDriftFrameovi).toFixed(2)} frameova na kraju segmenta. Trebat će je usporavati.`;
        }
        rezultatNapomenaDrift.textContent = driftNapomena;

        markeriZaIspravakDiv.innerHTML = '';
        edlMarkers = [];
        let korekcijePotrebne = false;

        const ciljaniBeatDurationFrames = (60 / ciljaniBPM) * FPS;
        const stvarniBeatDurationFrames = (60 / fiksniBPM) * FPS;

        for (let i = 0; ; i++) {
            const ocekivaniBeatTimeFrames = ukupnoFrameovaPocetakSegmenta + (i * ciljaniBeatDurationFrames);
            const stvarniBeatTimeFrames = ukupnoFrameovaPocetakSegmenta + (i * stvarniBeatDurationFrames);

            if (ocekivaniBeatTimeFrames > ukupnoFrameovaKrajSegmenta + FPS) {
                break;
            }

            if (ocekivaniBeatTimeFrames >= ukupnoFrameovaPocetakSegmenta) {
                currentDrift = stvarniBeatTimeFrames - ocekivaniBeatTimeFrames;

                const isLastBeat = ocekivaniBeatTimeFrames + ciljaniBeatDurationFrames > ukupnoFrameovaKrajSegmenta;
                if (Math.abs(currentDrift) >= pragDriftaFrameovi || (isLastBeat && Math.abs(currentDrift) > 0.1)) {
                    korekcijePotrebne = true;
                    const markerTimecode = formatFramesToTimecode(Math.round(ocekivaniBeatTimeFrames), FPS);
                    const driftClass = currentDrift > 0 ? 'drift-positive' : 'drift-negative';
                    const actionText = currentDrift > 0 ? 'Ubrzati' : 'Usporiti';
                    const commentText = `ISPRAVAK_Beat_${i + 1}_Drift_${currentDrift > 0 ? '+' : ''}${currentDrift.toFixed(2)}f`;

                    edlMarkers.push({
                        timecode: markerTimecode,
                        totalFrames: ocekivaniBeatTimeFrames,
                        comment: commentText
                    });

                    const p = document.createElement('p');
                    p.innerHTML = `Beat #${i + 1} (${markerTimecode}): <span class="${driftClass}">${actionText} za ${Math.abs(currentDrift).toFixed(2)} frameova</span>`;
                    markeriZaIspravakDiv.appendChild(p);

                    currentDrift = 0; 
                }
            }
        }

        if (!korekcijePotrebne && edlMarkers.length === 0) { 
            noMarkersMessage.style.display = 'block';
            exportEdlButton.style.display = 'none';
        } else {
            noMarkersMessage.style.display = 'none';
            exportEdlButton.style.display = 'block'; 
        }

        document.querySelectorAll('#rezultati p').forEach(p => p.style.display = 'block');
        document.querySelector('#rezultati h3').style.display = 'block';
    }

    calculateButton.addEventListener('click', izracunajMarkere);
    
    backButton.addEventListener('click', () => {
        showPage('input');
        markeriZaIspravakDiv.innerHTML = '';
        noMarkersMessage.style.display = 'none';
        exportEdlButton.style.display = 'none';
        edlMarkers = [];
    });
    exportEdlButton.addEventListener('click', generateAndDownloadEDL);

    fpsHelpText.textContent = `Trenutni FPS: ${parseFloat(fpsSelect.value)}`;
    frameoviCijeleInput.setAttribute('max', Math.floor(parseFloat(fpsSelect.value) - 1));
    frameoviPocetakSegmentaInput.setAttribute('max', Math.floor(parseFloat(fpsSelect.value) - 1));
    frameoviKrajSegmentaInput.setAttribute('max', Math.floor(parseFloat(fpsSelect.value) - 1));

    showPage('input');
    exportEdlButton.style.display = 'none'; 
});