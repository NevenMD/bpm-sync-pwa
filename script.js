document.addEventListener('DOMContentLoaded', () => {
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
        const fiksniBPM = parseFloat(fiksniBPMInput.value);
        const ciljaniBPM = parseFloat(ciljaniBPMInput.value);
        const fps = parseFloat(FPSInput.value);
        const pragDriftaFrameovi = parseFloat(pragDriftaFrameoviInput.value);

        let pocetakGlazbenogSegmentaFrames;
        let krajGlazbenogSegmentaFrames;
        let ukupnoTrajanjeDatotekeFrames;

        if (loadedXmlData) {
            try {
                pocetakGlazbenogSegmentaFrames = timecodeToFrames(loadedXmlData.musicStart, fps);
                krajGlazbenogSegmentaFrames = timecodeToFrames(loadedXmlData.musicEnd, fps);
                ukupnoTrajanjeDatotekeFrames = timecodeToFrames(loadedXmlData.fileEnd, fps);
            } catch (e) {
                console.error("Greška pri konverziji timecodea iz XML-a:", e);
                xmlStatus.textContent = 'Greška pri obradi XML timecodea: ' + e.message;
                return;
            }
        } else {
            // Ako nema učitanog XML-a ili parsiranje nije uspjelo, koristimo ručne unose
            try {
                pocetakGlazbenogSegmentaFrames = timecodeToFrames(pocetakGlazbenogSegmentaInput.value, fps);
                krajGlazbenogSegmentaFrames = timecodeToFrames(krajGlazbenogSegmentaInput.value, fps);
                ukupnoTrajanjeDatotekeFrames = timecodeToFrames(ukupnoTrajanjeDatotekeInput.value, fps);
            } catch (e) {
                markeriOutput.innerHTML = `<p style="color: red;">Greška u formatu timecodea. Molimo koristite HH:MM:SS:FF. (${e.message})</p>`;
                return;
            }
        }


        if (isNaN(fiksniBPM) || isNaN(ciljaniBPM) || isNaN(fps) || isNaN(pragDriftaFrameovi) ||
            isNaN(pocetakGlazbenogSegmentaFrames) || isNaN(krajGlazbenogSegmentaFrames) || isNaN(ukupnoTrajanjeDatotekeFrames)) {
            markeriOutput.innerHTML = '<p style="color: red;">Molimo unesite sve numeričke vrijednosti i timecodeove ispravno.</p>';
            return;
        }

        if (fiksniBPM <= 0 || ciljaniBPM <= 0 || fps <= 0 || pragDriftaFrameovi < 0) {
            markeriOutput.innerHTML = '<p style="color: red;">BPM, FPS i prag drifta moraju biti pozitivni brojevi.</p>';
            return;
        }

        if (krajGlazbenogSegmentaFrames <= pocetakGlazbenogSegmentaFrames) {
            markeriOutput.innerHTML = '<p style="color: red;">Kraj glazbenog segmenta mora biti poslije početka glazbenog segmenta.</p>';
            return;
        }
        if (ukupnoTrajanjeDatotekeFrames <= krajGlazbenogSegmentaFrames) {
            markeriOutput.innerHTML = '<p style="color: red;">Ukupno trajanje datoteke mora biti poslije kraja glazbenog segmenta.</p>';
            return;
        }


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