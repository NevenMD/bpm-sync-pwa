document.addEventListener('DOMContentLoaded', () => {
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    if (fiksniBPMInput) { console.log('fiksniBPMInput pronađen.'); } else { console.error('fiksniBPMInput NIJE pronađen.'); }

    const ciljaniBPMInput = document.getElementById('ciljaniBPM');
    if (ciljaniBPMInput) { console.log('ciljaniBPMInput pronađen.'); } else { console.error('ciljaniBPMInput NIJE pronađen.'); }

    const fpsSelect = document.getElementById('fpsSelect');
    if (fpsSelect) { console.log('FPSInput pronađen.'); } else { console.error('FPSInput NIJE pronađen.'); }

    const pragDriftaFrameoviInput = document.getElementById('pragDriftaFrameovi');
    if (pragDriftaFrameoviInput) { console.log('pragDriftaFrameoviInput pronađen.'); } else { console.error('pragDriftaFrameoviInput NIJE pronađen.'); }

    const pocetakGlazbenogSegmentaInput = document.getElementById('pocetakGlazbenogSegmentaInput');
    if (pocetakGlazbenogSegmentaInput) { console.log('pocetakGlazbenogSegmentaInput pronađen.'); } else { console.error('pocetakGlazbenogSegmentaInput NIJE pronađen.'); }

    const krajGlazbenogSegmentaInput = document.getElementById('krajGlazbenogSegmentaInput');
    if (krajGlazbenogSegmentaInput) { console.log('krajGlazbenogSegmentaInput pronađen.'); } else { console.error('krajGlazbenogSegmentaInput NIJE pronađen.'); }

    const ukupnoTrajanjeDatotekeInput = document.getElementById('ukupnoTrajanjeDatotekeInput');
    if (ukupnoTrajanjeDatotekeInput) { console.log('ukupnoTrajanjeDatotekeInput pronađen.'); } else { console.error('ukupnoTrajanjeDatotekeInput NIJE pronađen.'); }

    const calculateButton = document.getElementById('calculateButton');
    if (calculateButton) { console.log('calculateButton pronađen.'); } else { console.error('calculateButton NIJE pronađen.'); }

    const generateXmlButton = document.getElementById('generateXmlButton');
    if (generateXmlButton) { console.log('generateXmlButton pronađen.'); } else { console.error('generateXmlButton NIJE pronađen.'); }

    const markeriOutput = document.getElementById('markeriOutput');
    if (markeriOutput) { console.log('markeriOutput pronađen.'); } else { console.error('markeriOutput NIJE pronađen.'); }

    const xmlOutput = document.getElementById('xmlOutput');
    if (xmlOutput) { console.log('xmlOutput pronađen.'); } else { console.error('xmlOutput NIJE pronađen.'); }

    const ediusXmlFile = document.getElementById('ediusXmlFile');
    if (ediusXmlFile) { console.log('ediusXmlFile pronađen.'); } else { console.error('ediusXmlFile NIJE pronađen.'); }

    const xmlStatus = document.getElementById('xmlStatus');
    if (xmlStatus) { console.log('xmlStatus pronađen.'); } else { console.error('xmlStatus NIJE pronađen.'); }

    const downloadXmlButton = document.getElementById('downloadXmlButton');
    if (downloadXmlButton) { console.log('downloadXmlButton pronađen.'); } else { console.error('downloadXmlButton NIJE pronađen.'); }

    // Novi elementi za upravljanje stranicama
    const inputPage = document.getElementById('input-page');
    if (inputPage) { console.log('input-page pronađen.'); } else { console.error('input-page NIJE pronađen.'); }

    const resultsPage = document.getElementById('results-page');
    if (resultsPage) { console.log('results-page pronađen.'); } else { console.error('results-page NIJE pronađen.'); }


    // Globalne varijable za pohranu učitanih XML podataka
    let globalFileStartTC = '00:00:00:00';
    let globalFileEndTC = '00:00:00:00';
    let globalMusicStartTC = null;
    let globalMusicEndTC = null;


    if (calculateButton) {
        calculateButton.addEventListener('click', () => {
            console.log('Gumb \'Izračunaj Markere\' je kliknut!');
            izracunajMarkere();
        });
    }


    function timecodeToFrames(timecode, fps) {
        if (!timecode || typeof timecode !== 'string') {
            console.error('Invalid timecode provided to timecodeToFrames:', timecode);
            return 0;
        }
        const parts = timecode.split(':');
        if (parts.length !== 4) {
            console.error('Timecode format error, expected HH:MM:SS:FF, got:', timecode);
            return 0;
        }
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        const frames = parseInt(parts[3], 10);
        return ((hours * 3600 + minutes * 60 + seconds) * fps) + frames;
    }

    function framesToTimecode(totalFrames, fps) {
        const _fps = parseFloat(fps);
        if (isNaN(_fps) || _fps <= 0) {
            console.error('Invalid FPS provided to framesToTimecode:', fps);
            return '00:00:00:00';
        }

        const framesInSecond = _fps;
        const totalSeconds = Math.floor(totalFrames / framesInSecond);
        const frames = Math.round(totalFrames % framesInSecond); // Round to nearest frame

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        return [hours, minutes, seconds, frames]
            .map(v => v.toString().padStart(2, '0'))
            .join(':');
    }

    function calculateBPM(fiksniBPM, ciljaniBPM, fps, pragDriftaFrameovi, musicStartFrames, musicEndFrames, totalFileFrames) {
        console.log('Funkcija calculateBPM se pokreće.');

        // Prioritet XML podacima ako su globalne varijable postavljene
        if (globalMusicStartTC !== null && globalMusicEndTC !== null) {
            console.log('Korištenje podataka iz učitanog XML-a.');
            musicStartFrames = timecodeToFrames(globalMusicStartTC, fps);
            musicEndFrames = timecodeToFrames(globalMusicEndTC, fps);
            // totalFileFrames je već postavljen iz XML-a u parseEdiusXmlFile
            console.log(`XML podaci - Glazba početak (frames): ${musicStartFrames}, Kraj (frames): ${musicEndFrames}`);
        } else {
            console.log('Korištenje podataka iz unesenih Timecodeova.');
        }

        // Konverzija stringova u brojeve
        fiksniBPM = parseFloat(fiksniBPM);
        ciljaniBPM = parseFloat(ciljaniBPM);
        fps = parseFloat(fps);
        pragDriftaFrameovi = parseInt(pragDriftaFrameovi, 10);
        // musicStartFrames i musicEndFrames su već parsirani ako dolaze iz XML-a ili inputa

        // Validacija ulaznih podataka
        if (isNaN(fiksniBPM) || fiksniBPM <= 0 ||
            isNaN(ciljaniBPM) || ciljaniBPM <= 0 ||
            isNaN(fps) || fps <= 0 ||
            isNaN(pragDriftaFrameovi) || pragDriftaFrameovi < 0 ||
            isNaN(musicStartFrames) || isNaN(musicEndFrames) || musicStartFrames < 0 || musicEndFrames < 0 ||
            musicStartFrames >= musicEndFrames ||
            isNaN(totalFileFrames) || totalFileFrames <= 0 || totalFileFrames <= musicEndFrames) {
            console.error('Greška: Jedan ili više ulaznih podataka su nevažeći.');
            if (markeriOutput) {
                markeriOutput.innerHTML = '<p class="error-message">Molimo popunite sva polja ispravnim numeričkim vrijednostima. Provjerite da su timecodeovi valjani i da je kraj segmenta iza početka, te da je ukupno trajanje veće od kraja glazbenog segmenta.</p>';
            }
            return null;
        }

        console.log('Svi ulazni podaci su validni, nastavljam s izračunima.');

        const trajanjeGlazbenogSegmentaFrames = musicEndFrames - musicStartFrames;
        const trajanjeGlazbenogSegmentaSekunde = trajanjeGlazbenogSegmentaFrames / fps;

        const brojBeatovaFiksniBPM = (trajanjeGlazbenogSegmentaSekunde / 60) * fiksniBPM;
        const varijabilniBPM = (brojBeatovaFiksniBPM * 60) / trajanjeGlazbenogSegmentaSekunde; // Ovo bi trebalo biti isto kao fiksniBPM, ali je tu za demonstraciju

        const ocekivaniBeatoviVarijabilniBPM = (trajanjeGlazbenogSegmentaSekunde / 60) * ciljaniBPM;
        const driftBeatovi = brojBeatovaFiksniBPM - ocekivaniBeatoviVarijabilniBPM;

        const razmakIzmeduMarkeraSekunde = 60 / ciljaniBPM;
        const razmakIzmeduMarkeraFrameovi = razmakIzmeduMarkeraSekunde * fps;

        let outputHtml = `
            <h2>Rezultati Izračuna</h2>
            <p><strong>Fiksni BPM:</strong> ${fiksniBPM.toFixed(4)}</p>
            <p><strong>Ciljani BPM:</strong> ${ciljaniBPM.toFixed(4)}</p>
            <p><strong>FPS:</strong> ${fps}</p>
            <p><strong>Prag drifta (frameovi):</strong> ${pragDriftaFrameovi}</p>
            <p><strong>Početak glazbenog segmenta (frames):</strong> ${musicStartFrames}</p>
            <p><strong>Kraj glazbenog segmenta (frames):</strong> ${musicEndFrames}</p>
            <p><strong>Ukupno trajanje datoteke (frames):</strong> ${totalFileFrames}</p>
            <p><strong>Trajanje glazbenog segmenta (frames):</strong> ${trajanjeGlazbenogSegmentaFrames}</p>
            <p><strong>Trajanje glazbenog segmenta (sekunde):</strong> ${trajanjeGlazbenogSegmentaSekunde.toFixed(2)}</p>
            <p><strong>Broj beatova (fiksni BPM):</strong> ${brojBeatovaFiksniBPM.toFixed(2)}</p>
            <p><strong>Varijabilni BPM:</strong> <span style="font-weight: bold; color: blue;">${varijabilniBPM.toFixed(decimalniBroj)}</span></p>
            <p><strong>Očekivani beatovi (varijabilni BPM):</strong> ${ocekivaniBeatoviVarijabilniBPM.toFixed(2)}</p>
            <p><strong>Drift (beatovi):</strong> ${driftBeatovi.toFixed(8)}</p>
            <p><strong>Razmak između markera (sekunde):</strong> ${razmakIzmeduMarkeraSekunde.toFixed(4)}</p>
            <p><strong>Razmak između markera (frameovi):</strong> ${razmakIzmeduMarkeraFrameovi.toFixed(0)}</p>
        `;

        const driftFrameovi = driftBeatovi * razmakIzmeduMarkeraFrameovi;
        let driftPoruka = '';
        if (Math.abs(driftFrameovi) <= pragDriftaFrameovi) {
            driftPoruka = `<p style="color: green; font-weight: bold;">Drift (${driftFrameovi.toFixed(2)} frameova) je unutar prihvatljivih granica (${pragDriftaFrameovi} frameova).</p>`;
        } else {
            driftPoruka = `<p style="color: red; font-weight: bold;">Upozorenje: Drift (${driftFrameovi.toFixed(2)} frameova) je IZVAN prihvatljivih granica (${pragDriftaFrameovi} frameova)!</p>`;
        }
        outputHtml += driftPoruka;

        outputHtml += '<hr><h3>Predloženi markeri:</h3><div class="markers-list">';

        // Generiranje novih markera
        let currentFrame = musicStartFrames;
        let beatCounter = 0;
        while (currentFrame <= musicEndFrames) {
            const timecode = framesToTimecode(currentFrame, fps);
            let markerText = `Beat ${beatCounter}: ${timecode}`;

            // Izračun drifta za svaki marker
            const ocekivaniFrameZaBeat = musicStartFrames + (beatCounter * razmakIzmeduMarkeraFrameovi);
            const trenutniDrift = currentFrame - ocekivaniFrameZaBeat;

            let driftClass = '';
            if (trenutniDrift > pragDriftaFrameovi) {
                driftClass = 'drift-positive'; // Glazba kasni
            } else if (trenutniDrift < -pragDriftaFrameovi) {
                driftClass = 'drift-negative'; // Glazba pretiče
            }

            if (driftClass) {
                markerText += ` <span class="${driftClass}">Drift: ${trenutniDrift.toFixed(2)}f</span>`;
            }

            outputHtml += `<p>${markerText}</p>`;
            currentFrame += razmakIzmeduMarkeraFrameovi;
            beatCounter++;
        }
        outputHtml += '</div>';

        console.log('Generirani outputHtml: ', outputHtml); // Dodan log za provjeru
        if (markeriOutput) {
            markeriOutput.innerHTML = outputHtml;
            console.log('markeriOutput.innerHTML je postavljen.'); // Dodan log za provjeru
        } else {
            console.error('markeriOutput element nije pronađen prilikom pokušaja postavljanja innerHTML-a.');
        }

        // Omogući XML gumb
        if (generateXmlButton) {
            generateXmlButton.disabled = false;
            console.log('generateXmlButton.disabled je postavljen na false.');
        }

        return {
            varijabilniBPM: varijabilniBPM,
            markeri: [] // Ovdje bi se dodali markeri ako ih treba vratiti za daljnju obradu
        };
    }

    function izracunajMarkere() {
        console.log('Funkcija izracunajMarkere se pokreće.');
        const fiksniBPM = fiksniBPMInput ? fiksniBPMInput.value : '';
        const ciljaniBPM = ciljaniBPMInput ? ciljaniBPMInput.value : '';
        const fps = fpsSelect ? fpsSelect.value : '';
        const pragDriftaFrameovi = pragDriftaFrameoviInput ? pragDriftaFrameoviInput.value : '';

        // Definiranje decimalnogBroja ovdje kako bi bio dostupan
        const decimalniBroj = 4; // Prema vašem zahtjevu

        let musicStartFrames;
        let musicEndFrames;
        let totalFileFrames;

        // Provjeri jesu li globalne XML varijable popunjene
        if (globalMusicStartTC !== null && globalMusicEndTC !== null && globalFileEndTC !== null) {
            musicStartFrames = timecodeToFrames(globalMusicStartTC, fps);
            musicEndFrames = timecodeToFrames(globalMusicEndTC, fps);
            totalFileFrames = timecodeToFrames(globalFileEndTC, fps); // Koristi totalFileFrames iz XML-a
        } else {
            // Parsiraj timecodeove iz input polja ako XML nije učitan ili nema markere
            const pocetakGlazbenogSegmentaTC = pocetakGlazbenogSegmentaInput ? pocetakGlazbenogSegmentaInput.value : '00:00:00:00';
            const krajGlazbenogSegmentaTC = krajGlazbenogSegmentaInput ? krajGlazbenogSegmentaInput.value : '00:00:00:00';
            const ukupnoTrajanjeDatotekeTC = ukupnoTrajanjeDatotekeInput ? ukupnoTrajanjeDatotekeInput.value : '00:00:00:00';

            musicStartFrames = timecodeToFrames(pocetakGlazbenogSegmentaTC, fps);
            musicEndFrames = timecodeToFrames(krajGlazbenogSegmentaTC, fps);
            totalFileFrames = timecodeToFrames(ukupnoTrajanjeDatotekeTC, fps);
        }

        const rezultati = calculateBPM(
            fiksniBPM,
            ciljaniBPM,
            fps,
            pragDriftaFrameovi,
            musicStartFrames,
            musicEndFrames,
            totalFileFrames
        );

        if (rezultati) {
            console.log('Izračuni završeni, rezultati: Object', rezultati);

            // Prebaci na results-page
            if (inputPage && resultsPage) {
                inputPage.classList.remove('active');
                resultsPage.classList.add('active');
                console.log('Prebačeno na results-page.');
            } else {
                console.error('Nije moguće pronaći input-page ili results-page za prebacivanje.');
            }
        }
    }


    if (ediusXmlFile) {
        ediusXmlFile.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                parseEdiusXmlFile(file);
            }
        });
    }

    function parseEdiusXmlFile(file) {
        if (!file) {
            if (xmlStatus) xmlStatus.textContent = 'Nema odabrane datoteke.';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
                console.log('XML dokument učitan (parseEdiusXmlFile):', xmlDoc);

                // Provjera grešaka pri parsiranju
                const errorNode = xmlDoc.querySelector('parsererror');
                if (errorNode) {
                    console.error('Greška pri parsiranju XML-a (parseEdiusXmlFile):', errorNode.textContent);
                    if (xmlStatus) {
                        xmlStatus.textContent = `Greška pri učitavanju XML-a: ${errorNode.textContent}`;
                        xmlStatus.style.display = 'block';
                        xmlStatus.style.color = 'red';
                    }
                    return;
                }

                const markers = xmlDoc.querySelectorAll('edius\\:marker, marker'); // Podrška za edius:marker i marker
                console.log('Pronađeni markeri (NodeList) (parseEdiusXmlFile):', markers);
                console.log('Broj pronađenih markera (parseEdiusXmlFile):', markers.length);

                if (markers.length > 0) {
                    // Pronađi prvi i zadnji marker za ukupno trajanje datoteke
                    const firstMarkerPosition = markers[0].querySelector('edius\\:position, position');
                    if (firstMarkerPosition) {
                        globalFileStartTC = firstMarkerPosition.textContent.trim();
                        console.log('fileStartTC (iz prvog markera) (parseEdiusXmlFile):', globalFileStartTC);
                    }

                    const lastMarkerPosition = markers[markers.length - 1].querySelector('edius\\:position, position');
                    if (lastMarkerPosition) {
                        globalFileEndTC = lastMarkerPosition.textContent.trim();
                        console.log('fileEndTC (iz zadnjeg markera) (parseEdiusXmlFile):', globalFileEndTC);
                    }

                    // Pronađi glazba_pocetak i glazba_kraj
                    globalMusicStartTC = null;
                    globalMusicEndTC = null;

                    markers.forEach((marker, index) => {
                        console.log(`--- Marker ${index + 1} (parseEdiusXmlFile) ---`);
                        const commentElement = marker.querySelector('edius\\:comment, comment');
                        console.log(' Pronađen komentar element (parseEdiusXmlFile):', commentElement);
                        const comment = commentElement ? commentElement.textContent.trim() : '';
                        console.log(' Sadržaj komentara (parseEdiusXmlFile):', JSON.stringify(comment)); // Koristi JSON.stringify za prikaz praznog stringa
                        const positionElement = marker.querySelector('edius\\:position, position');
                        console.log(' Pronađena pozicija element (parseEdiusXmlFile):', positionElement);
                        const position = positionElement ? positionElement.textContent.trim() : '';
                        console.log(' Sadržaj pozicije (parseEdiusXmlFile):', JSON.stringify(position));

                        if (comment.toLowerCase() === 'glazba_pocetak') {
                            globalMusicStartTC = position;
                            console.log('!!! Postavljen musicStartTC na (parseEdiusXmlFile):', globalMusicStartTC);
                        }
                        if (comment.toLowerCase() === 'glazba_kraj') {
                            globalMusicEndTC = position;
                            console.log('!!! Postavljen musicEndTC na (parseEdiusXmlFile):', globalMusicEndTC);
                        }
                    });

                    // Popuni input polja ako su pronađeni markeri
                    if (ukupnoTrajanjeDatotekeInput) ukupnoTrajanjeDatotekeInput.value = globalFileEndTC;
                    if (pocetakGlazbenogSegmentaInput && globalMusicStartTC) pocetakGlazbenogSegmentaInput.value = globalMusicStartTC;
                    if (krajGlazbenogSegmentaInput && globalMusicEndTC) krajGlazbenogSegmentaInput.value = globalMusicEndTC;

                    if (xmlStatus) {
                        xmlStatus.textContent = 'XML datoteka uspješno učitana.';
                        xmlStatus.style.display = 'block';
                        xmlStatus.style.color = 'green';
                    }
                    console.log('Uspješno učitani i postavljeni XML podaci u input polja.');

                } else {
                    if (xmlStatus) {
                        xmlStatus.textContent = 'Učitani XML ne sadrži markere.';
                        xmlStatus.style.display = 'block';
                        xmlStatus.style.color = 'orange';
                    }
                    console.warn('Učitani XML ne sadrži markere.');
                }

            } catch (error) {
                console.error('Greška pri parsiranju XML datoteke (parseEdiusXmlFile):', error);
                if (xmlStatus) {
                    xmlStatus.textContent = `Greška pri učitavanju datoteke: ${error.message}`;
                    xmlStatus.style.display = 'block';
                    xmlStatus.style.color = 'red';
                }
            }
        };
        reader.onerror = () => {
            console.error('Greška pri čitanju datoteke (parseEdiusXmlFile).');
            if (xmlStatus) {
                xmlStatus.textContent = 'Greška pri čitanju datoteke.';
                xmlStatus.style.display = 'block';
                xmlStatus.style.color = 'red';
            }
        };
        reader.readAsText(file);
    }
});