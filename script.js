function izracunajMarkere() {
    // 1. Dohvati ulazne podatke iz HTML forme
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const fpsSelect = document.getElementById('fpsSelect');
    const satiInput = document.getElementById('sati');
    const minuteInput = document.getElementById('minute');
    const sekundeInput = document.getElementById('sekunde');
    const frameoviInput = document.getElementById('frameovi');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');
    const rezultatiDiv = document.getElementById('rezultati');
    const fpsHelpText = document.getElementById('fpsHelpText');

    const fiksniBPM = parseFloat(fiksniBPMInput.value);
    const FPS = parseFloat(fpsSelect.value); // Sada se FPS uzima iz select polja
    const sati = parseInt(satiInput.value);
    const minute = parseInt(minuteInput.value);
    const sekunde = parseInt(sekundeInput.value);
    const frameovi = parseInt(frameoviInput.value);
    const mjeraTakta = parseInt(mjeraTaktaSelect.value); // Broj udaraca u taktu

    // Ažuriraj tekstualnu pomoć za FPS
    fpsHelpText.textContent = `Current FPS: ${FPS}`;
    // Ažuriraj max atribut za frameove input polje radi vizualne pomoći
    frameoviInput.setAttribute('max', Math.floor(FPS - 1));


    // Dohvati elemente za prikaz rezultata (ako postoje, jer se innerHTML mijenja)
    let rezultatVarijabilniBPM = document.getElementById('rezultatVarijabilniBPM');
    let rezultatFrameoviPoBeatu = document.getElementById('rezultatFrameoviPoBeatu');
    let rezultatFrameoviPoTakatu = document.getElementById('rezultatFrameoviPoTakatu');
    let rezultatPostotakPrilagodbe = document.getElementById('rezultatPostotakPrilagodbe');
    let rezultatBrojBeatova = document.getElementById('rezultatBrojBeatova');


    // Provjera unosa i poruke o grešci
    let errorMessage = '';
    if (isNaN(fiksniBPM) || fiksniBPM <= 0) {
        errorMessage = 'Molimo unesite ispravan pozitivan broj za Fiksni (izmjereni) BPM.';
    } else if (isNaN(FPS) || FPS <= 0) {
        errorMessage = 'Molimo odaberite ispravan FPS.';
    } else if (isNaN(sati) || sati < 0) {
        errorMessage = 'Molimo unesite ispravan broj sati (>= 0).';
    } else if (isNaN(minute) || minute < 0 || minute > 59) {
        errorMessage = 'Molimo unesite ispravan broj minuta (0-59).';
    } else if (isNaN(sekunde) || sekunde < 0 || sekunde > 59) {
        errorMessage = 'Molimo unesite ispravan broj sekundi (0-59).';
    } else if (isNaN(frameovi) || frameovi < 0 || frameovi >= FPS) { // Frameovi sada ovise o odabranom FPS-u
        errorMessage = `Molimo unesite ispravan broj frameova (0-${Math.floor(FPS - 1)} za ${FPS} FPS).`;
    } else if (isNaN(mjeraTakta) || mjeraTakta <= 0) {
        errorMessage = 'Molimo odaberite ispravnu mjeru takta (broj udaraca mora biti pozitivan).';
    }

    if (errorMessage) {
        rezultatiDiv.innerHTML = `<p class="error-message">${errorMessage}</p>`;
        return; // Prekini funkciju ako ima grešaka
    }

    // Ako nema greške, osiguravamo da je struktura rezultata ispravna (ako je bila prebrisana greškom)
    if (!rezultatVarijabilniBPM || !rezultatFrameoviPoBeatu || !rezultatFrameoviPoTakatu || !rezultatPostotakPrilagodbe || !rezultatBrojBeatova) {
        rezultatiDiv.innerHTML = `
            <h3>Izračunani rezultati:</h3>
            <p><strong>Varijabilni BPM:</strong> <span class="precizan-broj" id="rezultatVarijabilniBPM"></span></p>
            <p><strong>Broj frameova po beatu:</strong> <span id="rezultatFrameoviPoBeatu"></span></p>
            <p><strong>Broj frameova po taktu:</strong> <span id="rezultatFrameoviPoTakatu"></span></p>
            <p><strong>Postotak prilagodbe glazbe:</strong> <span id="rezultatPostotakPrilagodbe"></span></p>
            <p class="napomena" id="rezultatBrojBeatova"></p>
        `;
        // Ponovno dohvati reference jer je innerHTML prebrisan
        rezultatVarijabilniBPM = document.getElementById('rezultatVarijabilniBPM');
        rezultatFrameoviPoBeatu = document.getElementById('rezultatFrameoviPoBeatu');
        rezultatFrameoviPoTakatu = document.getElementById('rezultatFrameoviPoTakatu');
        rezultatPostotakPrilagodbe = document.getElementById('rezultatPostotakPrilagodbe');
        rezultatBrojBeatova = document.getElementById('rezultatBrojBeatova');
    }


    // 2. Izračun ukupnog trajanja glazbene datoteke u frameovima
    const ukupnoSekundi = (sati * 3600) + (minute * 60) + sekunde;
    const ukupnoFrameova = (ukupnoSekundi * FPS) + frameovi;

    // Ako je ukupnoFrameova 0, ne možemo izračunati, prikaži poruku
    if (ukupnoFrameova === 0) {
        rezultatiDiv.innerHTML = `<p class="error-message">Ukupno trajanje glazbene datoteke ne može biti nula. Molimo unesite ispravno trajanje.</p>`;
        return;
    }

    // 3. Izračun ukupnog broja beatova na fiksnom BPM-u i zaokruživanje
    const trajanjeUMinutama = ukupnoFrameova / FPS / 60;
    let brojBeatova = fiksniBPM * trajanjeUMinutama;
    brojBeatova = Math.round(brojBeatova); // Zaokruživanje na najbliži cijeli broj

    if (brojBeatova === 0) {
        rezultatiDiv.innerHTML = `<p class="error-message">Nema dovoljno beatova za izračun. Molimo unesite dulje trajanje glazbene datoteke ili veći fiksni (izmjereni) BPM.</p>`;
        return;
    }

    // 4. Izračun Varijabilnog BPM-a (visoka preciznost)
    const varijabilniBPM = (brojBeatova / ukupnoFrameova) * FPS * 60;

    // 5. Izračun Frameova po Beatu (za Varijabilni BPM)
    let frameoviPoBeatu = (60 / varijabilniBPM) * FPS;
    frameoviPoBeatu = Math.round(frameoviPoBeatu); // Zaokruživanje na najbliži cijeli broj

    // 6. Izračun Frameova po Takatu
    let frameoviPoTakatu = frameoviPoBeatu * mjeraTakta;
    frameoviPoTakatu = Math.round(frameoviPoTakatu);

    // 7. IZRAČUN I PRIKAZ POSTOTKA PRILAGODBE (PRODUŽITI/SKRATITI)
    let postotakPrilagodbe = 0;
    let postotakTekst = '';

    if (varijabilniBPM !== 0) { // Izbjegavanje dijeljenja s nulom
        // Izračun postotka promjene u trajanju: (Originalno trajanje - Novo trajanje) / Novo trajanje * 100
        // S obzirom na to da je BPM obrnuto proporcionalan trajanju, formula je slična, ali s zamijenjenim Fiksnim i Varijabilnim BPM-om
        // Postotak promjene = (Varijabilni BPM - Fiksni BPM) / Fiksni BPM * 100
        // Ako je Varijabilni BPM manji od Fiksnog BPM-a, glazba je "preduga" i treba je skratiti
        // Ako je Varijabilni BPM veći od Fiksnog BPM-a, glazba je "prekratka" i treba je produžiti

        // Postotak za koliko treba promijeniti *trajanje* datoteke
        // Ako je fiksni BPM veći od varijabilnog, znači da je glazba prespora i treba je skratiti.
        // Ako je fiksni BPM manji od varijabilnog, znači da je glazba prebrza i treba je produžiti.
        postotakPrilagodbe = ((varijabilniBPM - fiksniBPM) / fiksniBPM) * 100;


        if (postotakPrilagodbe > 0) {
            postotakTekst = `Produžiti za ${postotakPrilagodbe.toFixed(2)}%`;
        } else if (postotakPrilagodbe < 0) {
            postotakTekst = `Skratiti za ${Math.abs(postotakPrilagodbe).toFixed(2)}%`;
        } else {
            postotakTekst = `Nije potrebna prilagodba (0.00%)`;
        }
    } else {
        postotakTekst = `N/A`; // Ako varijabilniBPM nije izračunat
    }


    // 8. Prikaz rezultata u HTML-u
    rezultatVarijabilniBPM.textContent = varijabilniBPM.toFixed(4);
    rezultatFrameoviPoBeatu.textContent = frameoviPoBeatu;
    rezultatFrameoviPoTakatu.textContent = frameoviPoTakatu;
    rezultatPostotakPrilagodbe.textContent = postotakTekst; // Prikazujemo gotov tekst
    rezultatBrojBeatova.textContent = `Ukupni broj beatova za ovo trajanje (zaokruženo): ${brojBeatova}`;
}

// Postavljanje slušatelja događaja (Event Listeners) - ostaje isto
document.addEventListener('DOMContentLoaded', () => {
    const fiksniBPMInput = document.getElementById('fiksniBPM');
    const fpsSelect = document.getElementById('fpsSelect');
    const satiInput = document.getElementById('sati');
    const minuteInput = document.getElementById('minute');
    const sekundeInput = document.getElementById('sekunde');
    const frameoviInput = document.getElementById('frameovi');
    const mjeraTaktaSelect = document.getElementById('mjeraTakta');

    fiksniBPMInput.addEventListener('input', izracunajMarkere);
    fpsSelect.addEventListener('change', izracunajMarkere);
    satiInput.addEventListener('input', izracunajMarkere);
    minuteInput.addEventListener('input', izracunajMarkere);
    sekundeInput.addEventListener('input', izracunajMarkere);
    frameoviInput.addEventListener('input', izracunajMarkere);
    mjeraTaktaSelect.addEventListener('change', izracunajMarkere);

    izracunajMarkere();
});