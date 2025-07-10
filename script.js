document.addEventListener('DOMContentLoaded', () => {
    console.log('Script.js loaded and DOMContentLoaded fired.');

    const inputPage = document.getElementById('input-page');
    const resultsPage = document.getElementById('results-page');
    const calculateButton = document.getElementById('calculateButton');
    const backButton = document.getElementById('backButton');
    const exportEdlButton = document.getElementById('exportEdlButton');
    exportEdlButton.textContent = 'Izvezi XML'; // Promjena teksta gumba

    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const ciljaniBPMInput = document.getElementById('ciljaniBPM');
    const fpsSelect = document.getElementById('fpsSelect');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');
    const pragDriftaFrameoviInput = document.getElementById('pragDriftaFrameovi');

    // Manually controlled timecode inputs
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

    // NEW XML elements
    const ediusXmlFile = document.getElementById('ediusXmlFile');
    const clearXmlButton = document.getElementById('clearXmlButton');
    const xmlStatus = document.getElementById('xmlStatus');
    const timecodeSection = document.querySelector('.timecode-section'); // Select the whole section to hide/show
    const manualInputMessage = document.getElementById('manualInputMessage');

    let edlMarkers = []; // This array will now be used for XML markers
    let loadedXmlData = null; // To store parsed XML timecodes

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
        const maxFrames = Math.floor(currentFPS - 1);
        frameoviCijeleInput.setAttribute('max', maxFrames);
        frameoviPocetakSegmentaInput.setAttribute('max', maxFrames);
        frameoviKrajSegmentaInput.setAttribute('max', maxFrames);
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

        const framePadding = 2; // Edius example shows 2 digits for frames

        return `${String(sati).padStart(2, '0')}:` +
               `${String(minute).padStart(2, '0')}:` +
               `${String(sekunde).padStart(2, '0')}:` +
               `${String(frameovi).padStart(framePadding, '0')}`;
    }

    // NEW: Function to convert timecode string (HH:MM:SS:FF) to total frames
    function timecodeToFrames(timecode, fps) {
        const parts = timecode.split(':').map(Number);
        if (parts.length !== 4) return NaN;

        const [h, m, s, f] = parts;
        return (h * 3600 * fps) + (m * 60 * fps) + (s * fps) + f;
    }

    // Function to escape XML special characters
    function escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    // Function to convert string to UTF-16LE bytes (with BOM)
    function stringToUTF16LEBytes(str) {
        const arr = [];
        // UTF-16 Little Endian BOM (FF FE)
        arr.push(0xFF, 0xFE);

        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            // Push lower byte first, then higher byte for Little Endian
            arr.push(charCode & 0xFF);
            arr.push((charCode >> 8) & 0xFF);
        }
        return new Uint8Array(arr);
    }

    function generateAndDownloadXML() {
        if (edlMarkers.length === 0) {
            alert('Nema markera za generiranje XML-a. Molimo prvo izračunajte markere.');
            return;
        }

        const CRLF = '\r\n';

        let xmlContent = `<?xml version="1.0" encoding="UTF-16" standalone="no"?>${CRLF}`;
        xmlContent += `<edius:markerInfo xmlns:edius="http://www.grassvalley.com/ns/edius/markerListInfo">${CRLF}`;
        xmlContent += `\t<edius:formatVersion>4</edius:formatVersion>${CRLF}`;

        const currentDate = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayOfWeek = days[currentDate.getDay()];
        const month = months[currentDate.getMonth()];
        const dayOfMonth = String(currentDate.getDate()).padStart(2, '0');
        const year = currentDate.getFullYear();
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');

        xmlContent += `\t<edius:CreateDate>${dayOfWeek} ${month} ${dayOfMonth} ${hours}:${minutes}:${seconds} ${year}</edius:CreateDate>${CRLF}`;

        xmlContent += `\t<edius:markerLists>${CRLF}`;

        edlMarkers.forEach((marker, index) => {
            const markerNo = index + 1;
            const anchorValue = 1;
            const positionTimecode = marker.timecode;
            const durationValue = '--:--:--:--';
            const colorValue = '0xffffffff';

            let commentXml = '';
            if (marker.comment.trim() === '') {
                commentXml = `<edius:comment/>`;
            } else {
                commentXml = `<edius:comment>${escapeXml(marker.comment)}</edius:comment>`;
            }

            xmlContent += `\t\t<edius:marker>${CRLF}`;
            xmlContent += `\t\t\t<edius:no>${markerNo}</edius:no>${CRLF}`;
            xmlContent += `\t\t\t<edius:anchor>${anchorValue}</edius:anchor>${CRLF}`;
            xmlContent += `\t\t\t<edius:position>${positionTimecode}</edius:position>${CRLF}`;
            xmlContent += `\t\t\t<edius:duration>${durationValue}</edius:duration>${CRLF}`;
            xmlContent += `\t\t\t${commentXml}${CRLF}`;
            xmlContent += `\t\t\t<edius:color>${colorValue}</edius:color>${CRLF}`;
            xmlContent += `\t\t</edius:marker>${CRLF}`;
        });

        xmlContent += `\t</edius:markerLists>${CRLF}`;
        xmlContent += `</edius:markerInfo>${CRLF}`;

        const fileName = `BPM_Sync_Markers_${new Date().toISOString().slice(0, 10)}.xml`;

        const encodedContentBytes = stringToUTF16LEBytes(xmlContent);

        const blob = new Blob([encodedContentBytes], { type: 'text/xml' });

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    // NEW: Function to parse the uploaded Edius XML file
    function parseEdiusXmlFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const xmlString = event.target.result;
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

                    // Check for parsing errors
                    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                        throw new Error('Pogreška pri parsiranju XML datoteke. Provjerite je li ispravan Edius XML format.');
                    }

                    const markers = xmlDoc.querySelectorAll('edius\\:marker, marker'); // Handle both namespaced and non-namespaced if parsing fails

                    if (markers.length === 0) {
                        throw new Error('Nema markera pronađenih u XML datoteci.');
                    }

                    let fileStartTC = null;
                    let fileEndTC = null;
                    let musicStartTC = null;
                    let musicEndTC = null;

                    // First marker is file start
                    fileStartTC = markers[0].querySelector('edius\\:position, position')?.textContent;

                    // Last marker is file end
                    fileEndTC = markers[markers.length - 1].querySelector('edius\\:position, position')?.textContent;

                    markers.forEach(marker => {
                        const commentElement = marker.querySelector('edius\\:comment, comment');
                        const comment = commentElement ? commentElement.textContent.trim().toLowerCase() : '';
                        const position = marker.querySelector('edius\\:position, position')?.textContent;

                        if (comment === 'glazba_pocetak' && position) {
                            musicStartTC = position;
                        }
                        if (comment === 'glazba_kraj' && position) {
                            musicEndTC = position;
                        }
                    });

                    if (!fileStartTC) {
                        throw new Error('Nije pronađen timecode za početak datoteke (prvi marker).');
                    }
                    if (!fileEndTC) {
                        throw new Error('Nije pronađen timecode za kraj datoteke (zadnji marker).');
                    }
                    if (!musicStartTC) {
                        throw new Error('Nije pronađen marker "glazba_pocetak". Molimo dodajte ga u Edius XML.');
                    }
                    if (!musicEndTC) {
                        throw new Error('Nije pronađen marker "glazba_kraj". Molimo dodajte ga u Edius XML.');
                    }

                    resolve({
                        fileStart: fileStartTC,
                        fileEnd: fileEndTC,
                        musicStart: musicStartTC,
                        musicEnd: musicEndTC
                    });

                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    // NEW: Handle XML file input change
    ediusXmlFile.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            xmlStatus.style.display = 'block';
            xmlStatus.textContent = 'Učitavam i parsiram XML...';
            xmlStatus.classList.remove('error-message');
            xmlStatus.classList.add('info-message');
            clearXmlButton.style.display = 'inline-block';
            timecodeSection.style.display = 'none'; // Hide manual inputs
            manualInputMessage.style.display = 'none';

            try {
                loadedXmlData = await parseEdiusXmlFile(file);
                xmlStatus.textContent = 'XML uspješno učitan i markeri pronađeni.';
                xmlStatus.classList.remove('error-message');
                xmlStatus.classList.add('info-message');
                console.log('Parsed XML Data:', loadedXmlData);

                // Populate manual fields with XML data (optional, for visibility)
                // This ensures auto-advance and direct calculation still works with loaded data
                const currentFPS = parseFloat(fpsSelect.value);
                const frameData = {
                    fileStartFrames: timecodeToFrames(loadedXmlData.fileStart, currentFPS),
                    fileEndFrames: timecodeToFrames(loadedXmlData.fileEnd, currentFPS),
                    musicStartFrames: timecodeToFrames(loadedXmlData.musicStart, currentFPS),
                    musicEndFrames: timecodeToFrames(loadedXmlData.musicEnd, currentFPS)
                };

                const setTimecodeInputs = (satiInput, minuteInput, sekundeInput, frameoviInput, totalFrames) => {
                    const h = Math.floor(totalFrames / (currentFPS * 3600));
                    const remH = totalFrames % (currentFPS * 3600);
                    const m = Math.floor(remH / (currentFPS * 60));
                    const remM = remH % (currentFPS * 60);
                    const s = Math.floor(remM / currentFPS);
                    const f = Math.round(remM % currentFPS);
                    satiInput.value = String(h).padStart(2, '0');
                    minuteInput.value = String(m).padStart(2, '0');
                    sekundeInput.value = String(s).padStart(2, '0');
                    frameoviInput.value = String(f).padStart(2, '0');
                };

                setTimecodeInputs(satiCijeleInput, minuteCijeleInput, sekundeCijeleInput, frameoviCijeleInput, frameData.fileEndFrames);
                setTimecodeInputs(satiPocetakSegmentaInput, minutePocetakSegmentaInput, sekundePocetakSegmentaInput, frameoviPocetakSegmentaInput, frameData.musicStartFrames);
                setTimecodeInputs(satiKrajSegmentaInput, minuteKrajSegmentaInput, sekundeKrajSegmentaInput, frameoviKrajSegmentaInput, frameData.musicEndFrames);


            } catch (error) {
                xmlStatus.textContent = `Greška: ${error.message}`;
                xmlStatus.classList.remove('info-message');
                xmlStatus.classList.add('error-message');
                loadedXmlData = null; // Clear loaded data on error
                ediusXmlFile.value = ''; // Clear file input
                timecodeSection.style.display = 'block'; // Show manual inputs again
                manualInputMessage.style.display = 'block';
                clearXmlButton.style.display = 'none';
            }
        } else {
            loadedXmlData = null;
            xmlStatus.style.display = 'none';
            clearXmlButton.style.display = 'none';
            timecodeSection.style.display = 'block'; // Show manual inputs again
            manualInputMessage.style.display = 'block';
        }
    });

    // NEW: Clear XML button functionality
    clearXmlButton.addEventListener('click', () => {
        ediusXmlFile.value = ''; // Clear the file input
        loadedXmlData = null; // Clear stored XML data
        xmlStatus.style.display = 'none'; // Hide status message
        clearXmlButton.style.display = 'none'; // Hide clear button
        timecodeSection.style.display = 'block'; // Show manual inputs
        manualInputMessage.style.display = 'block'; // Show manual input message
        // Optionally clear manual inputs if they were pre-filled by XML
        satiCijeleInput.value = '00'; minuteCijeleInput.value = '00'; sekundeCijeleInput.value = '00'; frameoviCijeleInput.value = '00';
        satiPocetakSegmentaInput.value = '00'; minutePocetakSegmentaInput.value = '00'; sekundePocetakSegmentaInput.value = '00'; frameoviPocetakSegmentaInput.value = '00';
        satiKrajSegmentaInput.value = '00'; minuteKrajSegmentaInput.value = '00'; sekundeKrajSegmentaInput.value = '00'; frameoviKrajSegmentaInput.value = '00';
    });


    function izracunajMarkere() {
        console.log('Calculate button clicked. Starting calculation...');

        const fiksniBPM = parseFloat(fiksniBPMInput.value);
        const ciljaniBPM = parseFloat(ciljaniBPMInput.value);
        const FPS = parseFloat(fpsSelect.value);
        const pragDriftaFrameovi = parseInt(pragDriftaFrameoviInput.value);

        let ukupnoFrameovaCijele, ukupnoFrameovaPocetakSegmenta, ukupnoFrameovaKrajSegmenta;

        let errorMessage = '';

        if (loadedXmlData) {
            // Use timecodes from loaded XML
            try {
                ukupnoFrameovaCijele = timecodeToFrames(loadedXmlData.fileEnd, FPS);
                ukupnoFrameovaPocetakSegmenta = timecodeToFrames(loadedXmlData.musicStart, FPS);
                ukupnoFrameovaKrajSegmenta = timecodeToFrames(loadedXmlData.musicEnd, FPS);

                if (isNaN(ukupnoFrameovaCijele) || isNaN(ukupnoFrameovaPocetakSegmenta) || isNaN(ukupnoFrameovaKrajSegmenta)) {
                    throw new Error('Problem s konverzijom timecodea iz XML-a u frameove. Provjerite FPS i format timecodea u XML-u.');
                }

            } catch (e) {
                errorMessage = e.message;
            }

        } else {
            // Use manually entered timecodes
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

            ukupnoFrameovaCijele = (satiCijele * 3600 * FPS) + (minuteCijele * 60 * FPS) + (sekundeCijele * FPS) + frameoviCijele;
            ukupnoFrameovaPocetakSegmenta = (satiPocetakSegmenta * 3600 * FPS) + (minutePocetakSegmenta * 60 * FPS) + (sekundePocetakSegmenta * FPS) + frameoviPocetakSegmenta;
            ukupnoFrameovaKrajSegmenta = (satiKrajSegmenta * 3600 * FPS) + (minuteKrajSegmenta * 60 * FPS) + (sekundeKrajSegmenta * FPS) + frameoviKrajSegmenta;
        }

        const mjeraTakta = parseInt(mjeraTaktaSelect.value);

        fpsHelpText.textContent = `Trenutni FPS: ${FPS}`;
        const maxFrames = Math.floor(FPS - 1);
        frameoviCijeleInput.setAttribute('max', maxFrames);
        frameoviPocetakSegmentaInput.setAttribute('max', maxFrames);
        frameoviKrajSegmentaInput.setAttribute('max', maxFrames);

        const ukupnoFrameovaSegment = ukupnoFrameovaKrajSegmenta - ukupnoFrameovaPocetakSegmenta;

        if (isNaN(fiksniBPM) || fiksniBPM <= 0) {
            errorMessage = 'Molimo unesite ispravan pozitivan broj za Fiksni (izmjereni) BPM glazbe.';
        } else if (isNaN(ciljaniBPM) || ciljaniBPM <= 0) {
            errorMessage = 'Molimo unesite ispravan pozitivan broj za Ciljani BPM videa.';
        } else if (isNaN(FPS) || FPS <= 0) {
            errorMessage = 'Molimo odaberite ispravan FPS.';
        }
        // Validate timecodes only if not loaded from XML (or if XML loading had an issue)
        else if (!loadedXmlData || errorMessage) {
            if (
                typeof parseInt(satiCijeleInput.value) !== 'number' || parseInt(satiCijeleInput.value) < 0 ||
                typeof parseInt(minuteCijeleInput.value) !== 'number' || parseInt(minuteCijeleInput.value) < 0 || parseInt(minuteCijeleInput.value) > 59 ||
                typeof parseInt(sekundeCijeleInput.value) !== 'number' || parseInt(sekundeCijeleInput.value) < 0 || parseInt(sekundeCijeleInput.value) > 59 ||
                typeof parseInt(frameoviCijeleInput.value) !== 'number' || parseInt(frameoviCijeleInput.value) < 0 || parseInt(frameoviCijeleInput.value) >= FPS
            ) {
                errorMessage = `Molimo unesite ispravno trajanje cijele datoteke (0-${Math.floor(FPS - 1)} frameova).`;
            }
            else if (
                typeof parseInt(satiPocetakSegmentaInput.value) !== 'number' || parseInt(satiPocetakSegmentaInput.value) < 0 ||
                typeof parseInt(minutePocetakSegmentaInput.value) !== 'number' || parseInt(minutePocetakSegmentaInput.value) < 0 || parseInt(minutePocetakSegmentaInput.value) > 59 ||
                typeof parseInt(sekundePocetakSegmentaInput.value) !== 'number' || parseInt(sekundePocetakSegmentaInput.value) < 0 || parseInt(sekundePocetakSegmentaInput.value) > 59 ||
                typeof parseInt(frameoviPocetakSegmentaInput.value) !== 'number' || parseInt(frameoviPocetakSegmentaInput.value) < 0 || parseInt(frameoviPocetakSegmentaInput.value) >= FPS
            ) {
                errorMessage = `Molimo unesite ispravan timecode početka glazbenog segmenta (0-${Math.floor(FPS - 1)} frameova).`;
            }
            else if (
                typeof parseInt(satiKrajSegmentaInput.value) !== 'number' || parseInt(satiKrajSegmentaInput.value) < 0 ||
                typeof parseInt(minuteKrajSegmentaInput.value) !== 'number' || parseInt(minuteKrajSegmentaInput.value) < 0 || parseInt(minuteKrajSegmentaInput.value) > 59 ||
                typeof parseInt(sekundeKrajSegmentaInput.value) !== 'number' || parseInt(sekundeKrajSegmentaInput.value) < 0 || parseInt(sekundeKrajSegmentaInput.value) > 59 ||
                typeof parseInt(frameoviKrajSegmentaInput.value) !== 'number' || parseInt(frameoviKrajSegmentaInput.value) < 0 || parseInt(frameoviKrajSegmentaInput.value) >= FPS
            ) {
                errorMessage = `Molimo unesite ispravan