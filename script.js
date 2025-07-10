document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event pokrenut, script.js se izvršava."); // Dodano za debug

    // Definiranje input polja
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const ciljaniBPMInput = document.getElementById('ciljaniBPM');
    const FPSInput = document.getElementById('FPS');
    const pragDriftaFrameoviInput = document.getElementById('pragDriftaFrameovi');
    const pocetakGlazbenogSegmentaInput = document.getElementById('pocetakGlazbenogSegmentaInput');
    const krajGlazbenogSegmentaInput = document.getElementById('krajGlazbenogSegmentaInput');
    const ukupnoTrajanjeDatotekeInput = document.getElementById('ukupnoTrajanjeDatotekeInput');
    const calculateButton = document.getElementById('calculateButton');
    const generateXmlButton = document.getElementById('generateXmlButton');
    const markeriOutput = document.getElementById('markeriOutput');
    const xmlOutput = document.getElementById('xmlOutput');
    const ediusXmlFile = document.getElementById('ediusXmlFile'); // Input za XML datoteku
    const xmlStatus = document.getElementById('xmlStatus'); // Status poruke za XML
    const downloadXmlButton = document.getElementById('downloadXmlButton'); // Gumb za preuzimanje XML-a

    let loadedXmlData = null; // Varijabla za pohranu parsiranih XML podataka
    let lastGeneratedXmlContent = ''; // Varijabla za pohranu zadnje generiranog XML-a

    // Provjera da li je gumb pronađen
    if (calculateButton) {
        console.log("Gumb 'Izračunaj Markere' pronađen u DOM-u."); // Dodano za debug
        calculateButton.addEventListener('click', () => {
            console.log("Gumb 'Izračunaj Markere' je kliknut!"); // Dodano za debug
            izracunajMarkere();
        });
    } else {
        console.error("GREŠKA: Gumb s ID-jem 'calculateButton' NIJE PRONAĐEN. Provjerite HTML."); // Dodano za debug
    }
    
    if (generateXmlButton) {
        generateXmlButton.addEventListener('click', () => {
            if (window.generatedMarkers) {
                const fps = parseFloat(FPSInput.value);
                if (isNaN(fps) || fps <= 0) {
                    xmlOutput.textContent = 'Molimo unesite valjani FPS prije generiranja XML-a.';
                    return;
                }
                generateXml(window.generatedMarkers, fps);
            } else {
                xmlOutput.textContent = 'Prvo izračunajte markere.';
            }
        });
    } else {
        console.warn("Upozorenje: Gumb s ID-jem 'generateXmlButton' NIJE PRONAĐEN."); // Dodano za debug
    }


    // Pomoćna funkcija za pretvaranje timecodea u frameove (HH:MM:SS:FF)
    function timecodeToFrames(timecode, fps) {
        const parts = timecode.split(':').map(Number);
        if (parts.length !== 4) {
            throw new Error('Neispravan format timecodea. Očekivano HH:MM:SS:FF');
        }
        const [hours, minutes, seconds, frames] = parts;
        return (hours * 3600 + minutes * 60 + seconds) * fps + frames;
    }

    // Pomoćna funkcija za pretvaranje frameova u timecode (HH:MM:SS:FF)
    function framesToTimecode(totalFrames, fps) {
        const hours = Math.floor(totalFrames / (3600 * fps));
        totalFrames %= (3600 * fps);
        const minutes = Math.floor(totalFrames / (60 * fps));
        totalFrames %= (60 * fps);
        const seconds = Math.floor(totalFrames / fps);
        const frames = totalFrames % fps;

        return [hours, minutes, seconds, frames]
            .map(part => String(Math.floor(part)).padStart(2, '0'))
            .join(':');
    }

    // Funkcija za izračunavanje Beat Per Minute (BPM)
    function calculateBPM() {
        console.log("Funkcija calculateBPM se pokreće."); // Dodano za debug
        const fiksniBPM = parseFloat(fiksniBPMInput.value);
        const ciljaniBPM = parseFloat(ciljaniBPMInput.value);
        const fps = parseFloat(FPSInput.value);
        const pragDriftaFrameovi = parseFloat(pragDriftaFrameoviInput.value);

        let pocetakGlazbenogSegmentaFrames;
        let krajGlazbenogSegmentaFrames;
        let ukupnoTrajanjeDatotekeFrames;

        if (loadedXmlData) {
            console.log("Korištenje podataka iz učitanog XML-a."); // Dodano za debug
            try {
                pocetakGlazbenogSegmentaFrames = timecodeToFrames(loadedXmlData.musicStart, fps);
                krajGlazbenogSegmentaFrames = timecodeToFrames(loadedXmlData.musicEnd, fps);
                ukupnoTrajanjeDatotekeFrames = timecodeToFrames(loadedXmlData.fileEnd, fps);
                console.log(`XML podaci - Glazba početak (frames): ${pocetakGlazbenogSegmentaFrames}, Kraj (frames): ${krajGlazbenogSegmentaFrames}`); // Dodano za debug
            } catch (e) {
                console.error("Greška pri konverziji timecodea iz XML-a u frames:", e); // Dodano za debug
                xmlStatus.textContent = 'Greška pri obradi XML timecodea: ' + e.message;
                return;
            }
        } else {
            console.log("Korištenje podataka iz ručnih unosa (nije učitan XML ili greška u parsiranju)."); // Dodano za debug
            // Ako nema učitanog XML-a ili parsiranje nije uspjelo, koristimo ručne unose
            try {
                pocetakGlazbenogSegmentaFrames = timecodeToFrames(pocetakGlazbenogSegmentaInput.value, fps);
                krajGlazbenogSegmentaFrames = timecodeToFrames(krajGlazbenogSegmentaInput.value, fps);
                ukupnoTrajanjeDatotekeFrames = timecodeToFrames(ukupnoTrajanjeDatotekeInput.value, fps);
                console.log(`Ručni unosi - Glazba početak (frames): ${pocetakGlazbenogSegmentaFrames}, Kraj (frames): ${krajGlazbenogSegmentaFrames}`); // Dodano za debug
            } catch (e) {
                markeriOutput.innerHTML = `<p style="color: red;">Greška u formatu timecodea. Molimo koristite HH:MM:SS:FF. (${e.message})</p>`;
                console.error("Greška pri konverziji ručnih timecodea u frames:", e); // Dodano za debug
                return;
            }
        }


        if (isNaN(fiksniBPM) || isNaN(ciljaniBPM) || isNaN(fps) || isNaN(pragDriftaFrameovi) ||
            isNaN(pocetakGlazbenogSegmentaFrames) || isNaN(krajGlazbenogSegmentaFrames) || isNaN(ukupnoTrajanjeDatotekeFrames)) {
            markeriOutput.innerHTML = '<p style="color: red;">Molimo unesite sve numeričke vrijednosti i timecodeove ispravno.</p>';
            console.error("Validacijska greška: Neki od ulaznih podataka su NaN."); // Dodano za debug
            return;
        }

        if (fiksniBPM <= 0 || ciljaniBPM <= 0 || fps <= 0 || pragDriftaFrameovi < 0) {
            markeriOutput.innerHTML = '<p style="color: red;">BPM, FPS i prag drifta moraju biti pozitivni brojevi.</p>';
            console.error("Validacijska greška: Negativne ili nulte vrijednosti za BPM, FPS, prag drifta."); // Dodano za debug
            return;
        }

        if (krajGlazbenogSegmentaFrames <= pocetakGlazbenogSegmentaFrames) {
            markeriOutput.innerHTML = '<p style="color: red;">Kraj glazbenog segmenta mora biti poslije početka glazbenog segmenta.</p>';
            console.error("Validacijska greška: Kraj glazbenog segmenta prije ili na početku."); // Dodano za debug
            return;
        }
        if (ukupnoTrajanjeDatotekeFrames <= krajGlazbenogSegmentaFrames) {
            markeriOutput.innerHTML = '<p style="color: red;">Ukupno trajanje datoteke mora biti poslije kraja glazbenog segmenta.</p>';
            console.error("Validacijska greška: Ukupno trajanje datoteke prije ili na kraju glazbenog segmenta."); // Dodano za debug
            return;
        }

        console.log("Svi ulazni podaci su validni, nastavljam s izračunima."); // Dodano za debug


        const trajanjeGlazbenogSegmentaFrames = krajGlazbenogSegmentaFrames - pocetakGlazbenogSegmentaFrames;
        const trajanjeGlazbenogSegmentaSekunde = trajanjeGlazbenogSegmentaFrames / fps;

        // Izračunaj broj beatova u fiksnom BPM-u
        const brojBeatovaFiksniBPM = (trajanjeGlazbenogSegmentaSekunde / 60) * fiksniBPM;

        // Izračunaj varijabilni BPM (s 8 decimalnih mjesta, sukladno zahtjevu za preciznošću)
        const varijabilniBPM = parseFloat(((brojBeatovaFiksniBPM / trajanjeGlazbenogSegmentaSekunde) * 60).toFixed(8));

        // Provjera drifta
        const ocekivaniBeatoviVarijabilniBPM = (trajanjeGlazbenogSegmentaSekunde / 60) * varijabilniBPM;
        const drift = Math.abs(brojBeatovaFiksniBPM - ocekivaniBeatoviVarijabilniBPM);

        // Izračunaj razmak između markera u frameovima
        const razmakMarkeraSekunde = 60 / varijabilniBPM;
        const razmakMarkeraFrames = Math.round(razmakMarkeraSekunde * fps);

        let outputHtml = `
            <h2>Rezultati Izračuna</h2>
            <p><strong>Fiksni BPM:</strong> ${fiksniBPM}</p>
            <p><strong>Ciljani BPM:</strong> ${ciljaniBPM}</p>
            <p><strong>FPS:</strong> ${fps}</p>
            <p><strong>Prag drifta (frameovi):</strong> ${pragDriftaFrameovi}</p>
            <p><strong>Početak glazbenog segmenta (frames):</strong> ${pocetakGlazbenogSegmentaFrames}</p>
            <p><strong>Kraj glazbenog segmenta (frames):</strong> ${krajGlazbenogSegmentaFrames}</p>
            <p><strong>Ukupno trajanje datoteke (frames):</strong> ${ukupnoTrajanjeDatotekeFrames}</p>
            <p><strong>Trajanje glazbenog segmenta (frames):</strong> ${trajanjeGlazbenogSegmentaFrames}</p>
            <p><strong>Trajanje glazbenog segmenta (sekunde):</strong> ${trajanjeGlazbenogSegmentaSekunde.toFixed(2)}</p>
            <p><strong>Broj beatova (fiksni BPM):</strong> ${brojBeatovaFiksniBPM.toFixed(2)}</p>
            <p><strong>Varijabilni BPM:</strong> <span style="font-weight: bold; color: blue;">${varijabilniBPM}</span></p>
            <p><strong>Očekivani beatovi (varijabilni BPM):</strong> ${ocekivaniBeatoviVarijabilniBPM.toFixed(2)}</p>
            <p><strong>Drift (beatovi):</strong> ${drift.toFixed(8)}</p>
            <p><strong>Razmak između markera (sekunde):</strong> ${razmakMarkeraSekunde.toFixed(4)}</p>
            <p><strong>Razmak između markera (frameovi):</strong> ${razmakMarkeraFrames}</p>
        `;

        if (Math.round(drift * fps) > pragDriftaFrameovi) {
            outputHtml += `<p style="color: orange; font-weight: bold;">Upozorenje: Drift (${(drift * fps).toFixed(2)} frameova) prelazi prag drifta (${pragDriftaFrameovi} frameova).</p>`;
        } else {
            outputHtml += `<p style="color: green; font-weight: bold;">Drift (${(drift * fps).toFixed(2)} frameova) je unutar prihvatljivih granica (${pragDriftaFrameovi} frameova).</p>`;
        }

        markeriOutput.innerHTML = outputHtml;

        // Generiranje markera
        const markeri = [];
        let currentFrames = pocetakGlazbenogSegmentaFrames;
        let markerNo = 2; // Počinjemo od 2 jer 1. marker označava početak datoteke, 2. početak glazbe. Dodatni markeri idu nakon toga.

        // Dodaj prvi marker (početak datoteke)
        markeri.push({ no: 1, position: framesToTimecode(0, fps), comment: '' });
        // Dodaj marker za početak glazbenog segmenta
        markeri.push({ no: markerNo++, position: framesToTimecode(pocetakGlazbenogSegmentaFrames, fps), comment: 'glazba_pocetak' });

        currentFrames += razmakMarkeraFrames; // Pomakni za prvi interval nakon početka glazbe

        while (currentFrames < krajGlazbenogSegmentaFrames) {
            markeri.push({
                no: markerNo++,
                position: framesToTimecode(currentFrames, fps),
                comment: `beat_varijabilni_BPM`
            });
            currentFrames += razmakMarkeraFrames;
        }

        // Dodaj marker za kraj glazbenog segmenta
        markeri.push({ no: markerNo++, position: framesToTimecode(krajGlazbenogSegmentaFrames, fps), comment: 'glazba_kraj' });
        // Dodaj zadnji marker (kraj datoteke)
        markeri.push({ no: markerNo++, position: framesToTimecode(ukupnoTrajanjeDatotekeFrames, fps), comment: '' });


        generateXmlButton.disabled = false; // Omogući gumb za generiranje XML-a
        // Spremi markere za generiranje XML-a
        window.generatedMarkers = markeri;

        return { markeri, fps, varijabilniBPM }; // Vraća izračunate markere i ostale potrebne podatke
    }

    // Funkcija za generiranje XML datoteke
    function generateXml(markers, fps) {
        let xmlString = `<?xml version="1.0" encoding="UTF-16" standalone="no"?>
<edius:markerInfo xmlns:edius="http://www.grassvalley.com/ns/edius/markerListInfo">
	<edius:formatVersion>4</edius:formatVersion>
	<edius:CreateDate>${new Date().toDateString()} ${new Date().toLocaleTimeString()}</edius:CreateDate>
	<edius:markerLists>\n`;

        markers.forEach(marker => {
            // Prilagodi izlaz za duration da bude --:--:--:--
            const duration = '--:--:--:--';
            xmlString += `\t\t<edius:marker>
			<edius:no>${marker.no}</edius:no>
			<edius:anchor>1</edius:anchor>
			<edius:position>${marker.position}</edius:position>
			<edius:duration>${duration}</edius:duration>
			<edius:comment>${marker.comment}</edius:comment>
			<edius:color>0xffffffff</edius:color>
		</edius:marker>\n`;
        });

        xmlString += `\t</edius:markerLists>
</edius:markerInfo>`;

        xmlOutput.textContent = xmlString; // Prikaz XML-a u textarea
        downloadXmlButton.style.display = 'block'; // Prikaži gumb za preuzimanje
        lastGeneratedXmlContent = xmlString; // Pohrani generirani XML
    }

    // Funkcija za preuzimanje XML-a
    downloadXmlButton.addEventListener('click', () => {
        const blob = new Blob([lastGeneratedXmlContent], { type: 'text/xml;charset=utf-16' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generirani_markeri.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });


    // NEW: Function to parse the uploaded Edius XML file
    function parseEdiusXmlFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const xmlString = event.target.result;
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

                    console.log("XML dokument učitan (parseEdiusXmlFile):", xmlDoc); // Dodano za debug
                    // Check for parsing errors
                    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                        throw new Error('Pogreška pri parsiranju XML datoteke. Provjerite je li ispravan Edius XML format.');
                    }

                    const markers = xmlDoc.querySelectorAll('edius\\:marker, marker'); // Handle both namespaced and non-namespaced if parsing fails
                    console.log("Pronađeni markeri (NodeList) (parseEdiusXmlFile):", markers); // Dodano za debug
                    console.log("Broj pronađenih markera (parseEdiusXmlFile):", markers.length); // Dodano za debug


                    if (markers.length === 0) {
                        throw new Error('Nema markera pronađenih u XML datoteci.');
                    }

                    let fileStartTC = null;
                    let fileEndTC = null;
                    let musicStartTC = null;
                    let musicEndTC = null;

                    // First marker is file start
                    fileStartTC = markers[0].querySelector('edius\\:position, position')?.textContent;
                    console.log("fileStartTC (iz prvog markera) (parseEdiusXmlFile):", fileStartTC); // Dodano za debug

                    // Last marker is file end
                    fileEndTC = markers[markers.length - 1].querySelector('edius\\:position, position')?.textContent;
                    console.log("fileEndTC (iz zadnjeg markera) (parseEdiusXmlFile):", fileEndTC); // Dodano za debug

                    // Iteriramo kroz sve markere kako bismo pronašli "glazba_pocetak" i "glazba_kraj"
                    markers.forEach((marker, index) => { // Dodan 'index' za debugiranje
                        const commentElement = marker.querySelector('edius\\:comment, comment');
                        const comment = commentElement ? commentElement.textContent.trim().toLowerCase() : '';
                        const position = marker.querySelector('edius\\:position, position')?.textContent;

                        console.log(`--- Marker ${index + 1} (parseEdiusXmlFile) ---`); // Dodano za debug
                        console.log(`  Pronađen komentar element (parseEdiusXmlFile):`, commentElement); // Dodano za debug
                        console.log(`  Sadržaj komentara (parseEdiusXmlFile): "${comment}"`); // Dodano za debug
                        console.log(`  Pronađena pozicija element (parseEdiusXmlFile):`, marker.querySelector('edius\\:position, position')); // Dodano za debug
                        console.log(`  Sadržaj pozicije (parseEdiusXmlFile): "${position}"`); // Dodano za debug

                        if (comment === 'glazba_pocetak' && position) {
                            musicStartTC = position;
                            console.log("!!! Postavljen musicStartTC na (parseEdiusXmlFile):", musicStartTC); // Dodano za debug
                        }
                        if (comment === 'glazba_kraj' && position) {
                            musicEndTC = position;
                            console.log("!!! Postavljen musicEndTC na (parseEdiusXmlFile):", musicEndTC); // Dodano za debug
                        }
                    });

                    // Provjera jesu li svi potrebni timecodeovi pronađeni
                    if (!fileStartTC) {
                        throw new Error('Nije pronađen timecode za početak datoteke (prvi marker).');
                    }
                    if (!fileEndTC) {
                        throw new Error('Nije pronađen timecode za kraj datoteke (zadnji marker).');
                    }
                    if (!musicStartTC) {
                        throw new Error('Nije pronađen timecode za početak glazbenog segmenta (marker s komentarom "glazba_pocetak"). Molimo dodajte ga u Edius XML.');
                    }
                    if (!musicEndTC) {
                        throw new Error('Nije pronađen timecode za kraj glazbenog segmenta (marker s komentarom "glazba_kraj"). Molimo dodajte ga u Edius XML.');
                    }

                    resolve({
                        fileStart: fileStartTC,
                        fileEnd: fileEndTC,
                        musicStart: musicStartTC,
                        musicEnd: musicEndTC
                    });

                } catch (error) {
                    console.error("Greška u parseEdiusXmlFile catch bloku:", error); // Dodano za debug
                    xmlStatus.textContent = `Greška pri obradi datoteke: ${error.message}`;
                    loadedXmlData = null; // Resetirajte loadedXmlData u slučaju greške
                    reject(error);
                }
            };
            reader.onerror = (error) => {
                console.error("Greška pri čitanju datoteke (reader.onerror):", error); // Dodano za debug
                xmlStatus.textContent = `Greška pri čitanju datoteke: ${error.message}`;
                loadedXmlData = null; // Resetirajte loadedXmlData u slučaju greške
                reject(error);
            };
            reader.readAsText(file);
        });
    }


    // Event listener za učitavanje XML datoteke
    if (ediusXmlFile) {
        ediusXmlFile.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                xmlStatus.textContent = 'Učitavam XML datoteku...';
                parseEdiusXmlFile(file)
                    .then(data => {
                        loadedXmlData = data;
                        xmlStatus.textContent = 'XML datoteka uspješno učitana!';
                        // Popunjavanje input polja
                        pocetakGlazbenogSegmentaInput.value = data.musicStart;
                        krajGlazbenogSegmentaInput.value = data.musicEnd;
                        ukupnoTrajanjeDatotekeInput.value = data.fileEnd;
                        // Ovisno o vašem HTML-u, možda trebate postaviti i input za početak datoteke ako postoji
                        // Npr. document.getElementById('pocetakDatotekeInput').value = data.fileStart;
                        console.log("Uspješno učitani i postavljeni XML podaci u input polja."); // Dodano za debug
                    })
                    .catch(error => {
                        console.error("Greška pri parsiranju ili obradi XML-a u 'change' listeneru:", error); // Dodano za debug
                        xmlStatus.textContent = `Greška: ${error.message}`;
                        loadedXmlData = null; // Resetirajte loadedXmlData u slučaju greške
                        // Opcionalno: Resetirajte input polja na 00:00:00:00 ili prazno
                        pocetakGlazbenogSegmentaInput.value = '00:00:00:00';
                        krajGlazbenogSegmentaInput.value = '00:00:00:00';
                        ukupnoTrajanjeDatotekeInput.value = '00:00:00:00';
                    });
            } else {
                xmlStatus.textContent = 'Nije odabrana XML datoteka.';
                loadedXmlData = null;
            }
        });
    } else {
        console.warn("Upozorenje: Input za XML datoteku s ID-jem 'ediusXmlFile' NIJE PRONAĐEN."); // Dodano za debug
    }


    // Funkcija koja se poziva na klik gumba "Izračunaj Markere"
    function izracunajMarkere() {
        console.log("Funkcija izracunajMarkere se pokreće."); // Dodano za debug
        // Pozovite calculateBPM, koja će obaviti sve provjere i izračune
        const results = calculateBPM();
        if (results) {
            console.log("Izračuni završeni, rezultati:", results); // Dodano za debug
            // Ako su izračuni uspješni, rezultati su u 'results' objektu.
            // Ovdje možete dodatno manipulirati rezultatima ako je potrebno.
            // Npr. automatski generirati XML nakon izračuna ako je to željeno ponašanje.
            // generateXml(results.markeri, results.fps);
        } else {
            console.log("calculateBPM nije vratila rezultate (vjerojatno zbog greške ili validacije)."); // Dodano za debug
        }
    }
});