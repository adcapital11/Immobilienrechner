// PWA Installation handling
let deferredPrompt;
const installBtn = document.getElementById('pwa-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-flex';
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      installBtn.style.display = 'none';
    }
    deferredPrompt = null;
  }
});

// Register Service Worker for offline PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered.'))
      .catch(err => console.log('Service Worker registration failed: ', err));
  });
}

// Element Mapping
const elements = {
  kaufpreis: document.getElementById('input-kaufpreis'),
  standort: document.getElementById('input-standort'),
  btnClearStandort: document.getElementById('btn-clear-standort'),
  miete: document.getElementById('input-miete'),
  flaeche: document.getElementById('input-flaeche'),
  mietpreisQm: document.getElementById('input-mietpreis-qm'),
  kataster: document.getElementById('input-kataster'),
  
  kaufTypToggle: document.getElementById('kauf-typ-toggle'),
  steuerTypToggle: document.getElementById('steuer-typ-toggle'),
  mwstRateGroup: document.getElementById('mwst-rate-group'),
  mwstRateToggle: document.getElementById('mwst-rate-toggle'),
  checkKonventioniert: document.getElementById('check-konventioniert'),
  checkGarage: document.getElementById('check-garage'),
  
  eigenkapital: document.getElementById('input-eigenkapital'),
  sanierung: document.getElementById('input-sanierung'),
  zins: document.getElementById('range-zins'),
  zinsVal: document.getElementById('zins-val'),
  monatsrate: document.getElementById('input-monatsrate'),
  rangeMonatsrate: document.getElementById('range-monatsrate'),
  aufteilungVal: document.getElementById('aufteilung-val'),
  laufzeitVal: document.getElementById('laufzeit-val'),
  hausgeld: document.getElementById('input-hausgeld'),
  
  checkReverseCalc: document.getElementById('check-reverse-calc'),
  reverseFields: document.getElementById('reverse-calc-fields'),
  zielCashflow: document.getElementById('input-ziel-cashflow'),
  
  leerstand: document.getElementById('range-leerstand'),
  leerstandVal: document.getElementById('leerstand-val'),
  stresszins: document.getElementById('range-stresszins'),
  stresszinsVal: document.getElementById('stresszins-val'),
  
  // Outputs
  verdictBadge: document.getElementById('out-verdict-badge'),
  verdictTitle: document.getElementById('out-verdict-title'),
  cashflow: document.getElementById('out-cashflow'),
  verdictDesc: document.getElementById('out-verdict-desc'),
  alertKonventioniert: document.getElementById('alert-konventioniert'),
  validationAlert: document.getElementById('validation-alert'),
  validationMsg: document.getElementById('validation-msg'),
  
  nettoRendite: document.getElementById('out-netto-rendite'),
  bruttoRendite: document.getElementById('out-brutto-rendite'),
  ekRendite: document.getElementById('out-ek-rendite'),
  faktor: document.getElementById('out-faktor'),
  nebenkosten: document.getElementById('out-nebenkosten'),
  nebenkostenDetail: document.getElementById('out-nebenkosten-detail'),
  
  tileReverseResult: document.getElementById('tile-reverse-result'),
  reverseKaufpreis: document.getElementById('out-reverse-kaufpreis'),
  reverseDetail: document.getElementById('out-reverse-detail'),
  tooltipCalcKataster: document.getElementById('tooltip-calc-kataster'),
  tooltipCalcHausgeld: document.getElementById('tooltip-calc-hausgeld'),
  
  summaryKaufpreis: document.getElementById('summary-kaufpreis'),
  summaryNebenkosten: document.getElementById('summary-nebenkosten'),
  summarySanierung: document.getElementById('summary-sanierung'),
  summaryKapitalbedarf: document.getElementById('summary-kapitalbedarf'),
  summaryEigenkapital: document.getElementById('summary-eigenkapital'),
  summaryKreditbedarf: document.getElementById('summary-kreditbedarf'),
  
  cfMiete: document.getElementById('cf-miete'),
  cfHausgeld: document.getElementById('cf-hausgeld'),
  cfKreditrate: document.getElementById('cf-kreditrate'),
  cfCashflowPretax: document.getElementById('cf-cashflow-pretax'),
  cfSteuer: document.getElementById('cf-steuer'),
  labelCfSteuer: document.getElementById('label-cf-steuer'),
  cfCashflow: document.getElementById('cf-cashflow'),
  
  selectSteuerMiete: document.getElementById('select-steuer-miete'),
  groupPersonalTax: document.getElementById('group-personal-tax'),
  inputPersonalTaxRate: document.getElementById('input-personal-tax-rate')
};

// Configuration state
let kaufTyp = 'seconda'; // 'prima' or 'seconda'
let steuerTyp = 'register'; // 'register' or 'mwst'
let mwstRate = 4; // 4, 10, or 22
let isKatasterManuallyEdited = false;
let isHausgeldManuallyEdited = false;
let isMonatsrateManuallyEdited = false;

// Helper functions for parsing and formatting
function parseLocaleFloat(valueStr) {
  if (!valueStr) return 0;
  const clean = valueStr.toString().replace(/\./g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatInputField(inputElement, fractionDigits = null) {
  let rawVal = inputElement.value.trim();
  if (!rawVal) return;
  
  let val = parseLocaleFloat(rawVal);
  let formatted;
  if (fractionDigits !== null) {
    formatted = formatNumber(val, fractionDigits);
  } else {
    const parts = rawVal.split(',');
    const decimals = parts.length > 1 ? parts[1].length : 0;
    formatted = formatNumber(val, Math.min(decimals, 2));
  }
  inputElement.value = formatted;
}

// Initializing Toggles
function setupSegmentedControl(element, callback) {
  const buttons = element.querySelectorAll('.segment-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      callback(btn.dataset.val);
    });
  });
}

setupSegmentedControl(elements.kaufTypToggle, (val) => {
  kaufTyp = val;
  // Auto-adjust MwSt rate toggle state based on Prima/Seconda choice
  if (val === 'prima') {
    setMwstRate(4);
  } else {
    setMwstRate(10);
  }
  calculate();
});

setupSegmentedControl(elements.steuerTypToggle, (val) => {
  steuerTyp = val;
  if (val === 'mwst') {
    elements.mwstRateGroup.style.display = 'flex';
  } else {
    elements.mwstRateGroup.style.display = 'none';
  }
  calculate();
});

setupSegmentedControl(elements.mwstRateToggle, (val) => {
  mwstRate = parseInt(val, 10);
  calculate();
});

function setMwstRate(rate) {
  mwstRate = rate;
  const buttons = elements.mwstRateToggle.querySelectorAll('.segment-btn');
  buttons.forEach(btn => {
    if (parseInt(btn.dataset.val, 10) === rate) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Complete database of all 116 South Tyrol municipalities with average cold rent per m²
const GEMEINDE_MIETPREISE = {
  // A
  "abtei (badia)": 17.0,
  "ahrntal": 9.0,
  "aldein": 9.0,
  "algund": 12.5,
  "altrei": 8.5,
  "andrian": 11.5,
  "auer": 11.0,
  // B
  "barbian": 10.0,
  "bozen": 16.5,
  "brenner": 9.0,
  "brixen": 12.5,
  "bruneck": 12.5,
  // C
  "corvara": 18.0,
  // D
  "deutschnofen": 10.5,
  // E
  "elvas (brixen)": 11.5,
  "eppan an der weinstraße": 12.5,
  // F
  "fahrhof (lana)": 11.5,
  "feldthurns": 10.5,
  "franzensfeste": 9.0,
  "freienfeld": 9.5,
  // G
  "gais": 10.0,
  "gargazon": 11.0,
  "glurns": 9.5,
  "graun im vinschgau": 8.5,
  "gsies": 9.0,
  // H
  "hafling": 12.0,
  // I
  "innichen": 13.0,
  // J
  "jenesien": 11.5,
  // K
  "kaltern an der weinstraße": 12.5,
  "kardaund (karneid)": 12.0,
  "karneid": 11.5,
  "kastelbell-tschars": 10.0,
  "kastelruth": 13.0,
  "kiens": 10.5,
  "klausen": 11.0,
  "kuens": 11.0,
  "kurtatsch an der weinstraße": 10.5,
  "kurtinig an der weinstraße": 10.0,
  // L
  "laas": 9.5,
  "lajen": 11.0,
  "lana": 12.0,
  "latsch": 10.0,
  "laurein": 8.0,
  "leifers": 11.5,
  "lüsen": 9.5,
  // M
  "mals": 9.5,
  "margreid an der weinstraße": 10.0,
  "marling": 12.5,
  "martell": 8.5,
  "meran": 13.5,
  "mölten": 9.5,
  "montan": 11.0,
  "mühlbach": 10.5,
  "mühlwald": 8.5,
  // N
  "nals": 11.5,
  "naturns": 11.0,
  "natz-schabs": 11.0,
  "neumarkt": 10.5,
  "niederdorf": 11.0,
  // O
  "olang": 11.5,
  // P
  "partschins": 11.5,
  "percha": 10.5,
  "pfalzen": 13.0,
  "pfitsch": 9.0,
  "plaus": 11.0,
  "prad am stilfserjoch": 9.5,
  "prags": 11.0,
  "prettau": 8.0,
  "proveis": 8.0,
  // R
  "rasen-antholz": 10.5,
  "ratschings": 10.0,
  "riffian": 11.5,
  "ritten": 12.5,
  "rodeneck": 10.0,
  // S
  "salurn an der weinstraße": 10.0,
  "sand in taufers": 10.5,
  "santa cristina (gröden)": 17.5,
  "sarntal": 9.5,
  "schenna": 13.0,
  "schlanders": 10.0,
  "schluderns": 9.0,
  "schnals": 9.0,
  "sexten": 12.5,
  "st. leonhard in passeier": 10.0,
  "st. lorenzen": 11.0,
  "st. martin in passeier": 10.0,
  "st. martin in thurn": 11.0,
  "st. pankraz": 9.0,
  "st. ulrich in gröden": 18.0,
  "sterzing": 10.5,
  "stilfs": 8.5,
  // T
  "taufers im münstertal": 9.0,
  "terenten": 10.5,
  "terlan": 12.0,
  "tiers": 11.0,
  "tirol (dorf tirol)": 13.0,
  "tisens": 11.0,
  "toblach": 12.0,
  "tramin an der weinstraße": 11.5,
  "truden im naturpark": 9.5,
  "tscherms": 12.0,
  // U
  "ulten": 9.0,
  "unsere liebe frau im walde-st. felix": 8.5,
  // V
  "vahrn": 12.0,
  "villanders": 10.0,
  "villnöß": 11.5,
  "vintl": 10.0,
  "völs am schlern": 12.5,
  "vöran": 9.5,
  // W
  "waidbruck": 10.0,
  "welsberg-taisten": 10.5,
  "welschnofen": 11.5,
  "wolkenstein in gröden": 18.5,
  "sonstige gemeinde (südtirol)": 10.5
};

// Flexible municipality search: supports exact match (case-insensitive)
function findGemeindePrice(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return null;
  const cleanInput = inputStr.trim().toLowerCase();
  if (!cleanInput) return null;
  
  if (GEMEINDE_MIETPREISE.hasOwnProperty(cleanInput)) {
    return GEMEINDE_MIETPREISE[cleanInput];
  }
  return null;
}

// Inputs event listeners
const numericInputs = [
  elements.kaufpreis, elements.miete, elements.flaeche, elements.mietpreisQm,
  elements.kataster, elements.eigenkapital, elements.sanierung, 
  elements.monatsrate, elements.hausgeld, elements.zielCashflow
];

numericInputs.forEach(input => {
  input.addEventListener('input', () => {
    let start = input.selectionStart;
    let oldVal = input.value;
    let newVal = oldVal.replace(/[^0-9.,-]/g, '');
    if (oldVal !== newVal) {
      input.value = newVal;
      input.setSelectionRange(start - 1, start - 1);
    }
    
    // Track if Kataster has been manually edited by user
    if (input === elements.kataster) {
      isKatasterManuallyEdited = input.value.trim().length > 0;
      updateHausgeldFromSqm();
    }
    
    // Track if Hausgeld has been manually edited by user
    if (input === elements.hausgeld) {
      isHausgeldManuallyEdited = input.value.trim().length > 0;
    }
    
    // Track if Monatsrate has been manually edited by user
    if (input === elements.monatsrate) {
      isMonatsrateManuallyEdited = input.value.trim().length > 0;
      const val = parseLocaleFloat(input.value);
      elements.rangeMonatsrate.value = val;
    }
    
    // If area or sqm-price changes, recalculate total rent
    if (input === elements.flaeche || input === elements.mietpreisQm) {
      updateRentFromSqm();
    }
    
    // If area changes, also update estimated Katasterertrag & Hausgeld
    if (input === elements.flaeche) {
      updateKatasterFromSqm();
      updateHausgeldFromSqm();
    }
    
    calculate();
  });

  input.addEventListener('blur', () => {
    if (input === elements.mietpreisQm) {
      formatInputField(input, 2);
    } else {
      formatInputField(input, 0);
    }
    calculate();
  });
});

// Helper function to update Monatskaltmiete based on sqm * price
function updateRentFromSqm() {
  const flaeche = parseLocaleFloat(elements.flaeche.value);
  const qmPreis = parseLocaleFloat(elements.mietpreisQm.value);
  if (flaeche > 0 && qmPreis > 0) {
    const garage = elements.checkGarage.checked;
    const rent = Math.round(flaeche * qmPreis) + (garage ? 70 : 0);
    elements.miete.value = formatNumber(rent, 0);
  }
}

// Helper function to update estimated Katasterertrag based on sqm + garage
function updateKatasterFromSqm() {
  if (isKatasterManuallyEdited) return;
  const flaeche = parseLocaleFloat(elements.flaeche.value);
  if (flaeche > 0) {
    const garage = elements.checkGarage.checked;
    const est = Math.round(flaeche * 9 + (garage ? 80 : 0));
    elements.kataster.value = formatNumber(est, 0);
  } else {
    elements.kataster.value = '';
  }
}

// Helper function to update estimated Hausgeld (non-recoverable) based on sqm + GIS
function updateHausgeldFromSqm() {
  if (isHausgeldManuallyEdited) return;
  const flaeche = parseLocaleFloat(elements.flaeche.value);
  if (flaeche > 0) {
    const kataster = parseLocaleFloat(elements.kataster.value);
    const konventioniert = elements.checkKonventioniert.checked;
    const isBeguenstigt = elements.selectSteuerMiete.value === 'cedolare10';
    
    // GIS rate: 0.40% if konventioniert or begünstigt (Canone Concordato), otherwise 0.76%
    const gisSatz = (konventioniert || isBeguenstigt) ? 0.0040 : 0.0076;
    
    // Estimate Katasterertrag if it's currently empty
    const effKataster = kataster > 0 ? kataster : (flaeche * 9 + (elements.checkGarage.checked ? 80 : 0));
    
    // Calculate monthly GIS: (Kataster * 1.05 * 120 * rate) / 12
    const monatlicheGis = (effKataster * 1.05 * 120 * gisSatz) / 12;
    
    // Other non-recoverable costs (0.90 €/m²)
    const sonstigeKosten = flaeche * 0.90;
    
    const est = Math.round(sonstigeKosten + monatlicheGis);
    elements.hausgeld.value = formatNumber(est, 0);
  } else {
    elements.hausgeld.value = '';
  }
}

// Helper to show/hide clear button
function toggleClearBtn() {
  const hasText = elements.standort.value.length > 0;
  elements.btnClearStandort.style.display = hasText ? 'inline-flex' : 'none';
}

// Standort input listener for autocompleting sqm price
elements.standort.addEventListener('input', () => {
  toggleClearBtn();
  const price = findGemeindePrice(elements.standort.value);
  if (price !== null) {
    elements.mietpreisQm.value = formatNumber(price, 2);
    updateRentFromSqm();
    calculate();
  }
  saveToLocalStorage();
});

// Auto-select text on focus to make overwriting easy
elements.standort.addEventListener('focus', () => {
  elements.standort.select();
});

// Clear button logic
elements.btnClearStandort.addEventListener('click', () => {
  elements.standort.value = '';
  toggleClearBtn();
  elements.standort.focus();
  calculate();
  saveToLocalStorage();
});


// Slider displays and triggers
elements.zins.addEventListener('input', () => {
  calculate();
});

elements.rangeMonatsrate.addEventListener('input', () => {
  const val = parseFloat(elements.rangeMonatsrate.value);
  elements.monatsrate.value = formatNumber(val, 0);
  isMonatsrateManuallyEdited = true;
  calculate();
});

elements.leerstand.addEventListener('input', () => {
  const val = parseFloat(elements.leerstand.value);
  elements.leerstandVal.textContent = val === 0 ? '0 Monate / Jahr' : `${val.toString().replace('.', ',')} Monate / Jahr`;
  calculate();
});

elements.stresszins.addEventListener('input', () => {
  const val = parseFloat(elements.stresszins.value);
  elements.stresszinsVal.textContent = val === 0 ? '+0,0 % (Kein)' : `+${val.toString().replace('.', ',')} %`;
  calculate();
});

elements.checkKonventioniert.addEventListener('change', () => {
  elements.alertKonventioniert.style.display = elements.checkKonventioniert.checked ? 'flex' : 'none';
  updateHausgeldFromSqm();
  calculate();
});

elements.checkGarage.addEventListener('change', () => {
  updateRentFromSqm();
  updateKatasterFromSqm();
  updateHausgeldFromSqm();
  calculate();
});

elements.checkReverseCalc.addEventListener('change', () => {
  const active = elements.checkReverseCalc.checked;
  elements.reverseFields.style.display = active ? 'block' : 'none';
  elements.tileReverseResult.style.display = active ? 'flex' : 'none';
  calculate();
});

elements.selectSteuerMiete.addEventListener('change', () => {
  const isIrpef = elements.selectSteuerMiete.value === 'irpef';
  elements.groupPersonalTax.style.display = isIrpef ? 'block' : 'none';
  updateHausgeldFromSqm();
  calculate();
});

elements.inputPersonalTaxRate.addEventListener('input', () => {
  calculate();
});

// Load values from Local Storage on load
function loadFromLocalStorage() {
  const fields = ['kaufpreis', 'standort', 'miete', 'flaeche', 'mietpreisQm', 'kataster', 'eigenkapital', 'sanierung', 'monatsrate', 'hausgeld', 'zielCashflow', 'selectSteuerMiete', 'inputPersonalTaxRate'];
  fields.forEach(f => {
    const val = localStorage.getItem(`immo_${f}`);
    if (val !== null && elements[f]) {
      elements[f].value = val;
    }
  });
  
  const isIrpef = elements.selectSteuerMiete.value === 'irpef';
  elements.groupPersonalTax.style.display = isIrpef ? 'block' : 'none';
  
  if (localStorage.getItem('immo_konv') === 'true') {
    elements.checkKonventioniert.checked = true;
    elements.alertKonventioniert.style.display = 'flex';
  }
  
  if (localStorage.getItem('immo_garage') === 'true') {
    elements.checkGarage.checked = true;
  }
  
  isKatasterManuallyEdited = localStorage.getItem('immo_kataster_edited') === 'true';
  isHausgeldManuallyEdited = localStorage.getItem('immo_hausgeld_edited') === 'true';
  isMonatsrateManuallyEdited = localStorage.getItem('immo_monatsrate_edited') === 'true';
  
  toggleClearBtn();
}

function saveToLocalStorage() {
  const fields = ['kaufpreis', 'standort', 'miete', 'flaeche', 'mietpreisQm', 'kataster', 'eigenkapital', 'sanierung', 'monatsrate', 'hausgeld', 'zielCashflow', 'selectSteuerMiete', 'inputPersonalTaxRate'];
  fields.forEach(f => {
    if (elements[f]) {
      localStorage.setItem(`immo_${f}`, elements[f].value);
    }
  });
  localStorage.setItem('immo_konv', elements.checkKonventioniert.checked);
  localStorage.setItem('immo_garage', elements.checkGarage.checked);
  localStorage.setItem('immo_kataster_edited', isKatasterManuallyEdited);
  localStorage.setItem('immo_hausgeld_edited', isHausgeldManuallyEdited);
  localStorage.setItem('immo_monatsrate_edited', isMonatsrateManuallyEdited);
}

// Primary calculation function
function calculate() {
  saveToLocalStorage();
  
  const kaufpreis = parseLocaleFloat(elements.kaufpreis.value);
  const miete = parseLocaleFloat(elements.miete.value);
  const flaeche = parseLocaleFloat(elements.flaeche.value);
  const kataster = parseLocaleFloat(elements.kataster.value);
  const eigenkapital = parseLocaleFloat(elements.eigenkapital.value);
  const sanierung = parseLocaleFloat(elements.sanierung.value);
  const monatsrate = parseLocaleFloat(elements.monatsrate.value);
  const hausgeld = parseLocaleFloat(elements.hausgeld.value);
  const zielCashflow = parseLocaleFloat(elements.zielCashflow.value);
  
  const zins = parseFloat(elements.zins.value);
  const leerstand = parseFloat(elements.leerstand.value);
  const stresszins = parseFloat(elements.stresszins.value);
  
  // Reset alerts
  elements.validationAlert.style.display = 'none';
  
  // Update dynamic tooltip math details in real-time
  const garageInklusiveToggle = elements.checkGarage.checked;
  if (flaeche > 0) {
    const estKatasterVal = Math.round(flaeche * 9 + (garageInklusiveToggle ? 80 : 0));
    elements.tooltipCalcKataster.textContent = `Rechnung: 9,00 € × ${formatNumber(flaeche, 0)} m²${garageInklusiveToggle ? ' + 80 € (Garage)' : ''} = ${formatNumber(estKatasterVal, 0)} €`;
    
    // Dynamic Hausgeld estimation breakdown
    const currentKataster = kataster > 0 ? kataster : estKatasterVal;
    const isKonv = elements.checkKonventioniert.checked;
    const isBeg = elements.selectSteuerMiete.value === 'cedolare10';
    const currentGisSatz = (isKonv || isBeg) ? 0.0040 : 0.0076;
    const monatlicheGis = (currentKataster * 1.05 * 120 * currentGisSatz) / 12;
    const sonstigeKosten = flaeche * 0.90;
    const estHausgeldVal = Math.round(sonstigeKosten + monatlicheGis);
    
    elements.tooltipCalcHausgeld.textContent = `Rechnung: (${formatNumber(flaeche, 0)} m² × 0,90 €) + GIS (${formatNumber(monatlicheGis, 0)} €/Mon. bei ${(isKonv || isBeg) ? '0,40%' : '0,76%'}) = ${formatNumber(estHausgeldVal, 0)} €`;
  } else {
    elements.tooltipCalcKataster.textContent = 'Rechnung: m² eingeben';
    elements.tooltipCalcHausgeld.textContent = 'Rechnung: m² eingeben';
  }
  
  if (kaufpreis <= 0 || miete <= 0) {
    elements.cashflow.textContent = '—';
    elements.verdictTitle.textContent = 'Monatlicher Cashflow';
    elements.nettoRendite.textContent = '—';
    elements.bruttoRendite.textContent = '—';
    elements.ekRendite.textContent = '—';
    elements.faktor.textContent = '—';
    elements.nettoRendite.style.color = '';
    elements.bruttoRendite.style.color = '';
    elements.ekRendite.style.color = '';
    elements.faktor.style.color = '';
    elements.nebenkosten.textContent = '—';
    elements.nebenkostenDetail.textContent = 'Warte auf Eingabe...';
    elements.zinsVal.textContent = `${zins.toString().replace('.', ',')} %`;
    elements.aufteilungVal.textContent = 'Aufteilung gesamt: —';
    elements.laufzeitVal.textContent = 'Theoretische Laufzeit: —';
    elements.summaryKaufpreis.textContent = '0 €';
    elements.summaryNebenkosten.textContent = '0 €';
    elements.summarySanierung.textContent = '0 €';
    elements.summaryKapitalbedarf.textContent = '0 €';
    elements.summaryEigenkapital.textContent = '- 0 €';
    elements.summaryKreditbedarf.textContent = '0 €';
    elements.cfMiete.textContent = '0 €';
    elements.cfHausgeld.textContent = '- 0 €';
    elements.cfKreditrate.textContent = '- 0 €';
    elements.cfCashflowPretax.textContent = '0 €';
    elements.cfSteuer.textContent = '- 0 €';
    elements.cfCashflow.textContent = '0 €';
    elements.verdictBadge.className = 'primary-result-badge badge-neutral';
    elements.verdictDesc.textContent = 'Bitte füllen Sie Kaufpreis und Miete aus';
    return;
  }
  
  // Determine if garage is included
  const garageInklusive = elements.checkGarage.checked;
  
  // Estimate Katasterertrag if not manually provided
  let effektiverKataster = kataster;
  let isEstimatedKataster = !isKatasterManuallyEdited;
  if (kataster <= 0 && flaeche > 0) {
    effektiverKataster = flaeche * 9;
    if (garageInklusive) {
      effektiverKataster += 80;
    }
    isEstimatedKataster = true;
  }
  
  // Calculate Purchase Taxes (Südtirol-specific)
  let steuer = 0;
  let taxDetailsStr = '';
  
  // Common tertiary costs (Broker & Notary/Land registry)
  const agenturSatz = 0.03 * 1.22; // 3% plus 22% VAT (MwSt) = 3.66%
  const agenturGebuehr = kaufpreis * agenturSatz;
  const notarGebuehr = Math.max(1500, kaufpreis * 0.015); // Average 1.5%, min 1.500
  
  if (steuerTyp === 'register') {
    // Rendita Catastatale valuation: +5% (x1.05), then x110 (Prima Casa) or x120 (Seconda Casa)
    const coeff = kaufTyp === 'prima' ? 110 : 120;
    const basiswert = effektiverKataster > 0 ? (effektiverKataster * 1.05 * coeff) : kaufpreis;
    const steuerSatz = kaufTyp === 'prima' ? 0.02 : 0.09;
    
    steuer = basiswert * steuerSatz;
    if (steuer < 1000) steuer = 1000; // Minimum Registersteuer
    steuer += 100; // Fixed 50 € mortgage tax + 50 € cadastral tax
    
    if (isEstimatedKataster) {
      taxDetailsStr = `Katasterertrag (geschätzt): ${formatNumber(effektiverKataster, 0)} €\n`;
    } else if (kataster > 0) {
      taxDetailsStr = `Katasterertrag: ${formatNumber(kataster, 0)} €\n`;
    }
    taxDetailsStr += `Registersteuer (${kaufTyp === 'prima' ? '2%' : '9%'}): ${formatNumber(steuer - 100)} €\nHypotheken- & Katastersteuer: 100 €\n`;
  } else {
    // MwSt / IVA calculation
    const mwstSatzVal = mwstRate / 100;
    steuer = kaufpreis * mwstSatzVal;
    steuer += 600; // 3x 200 € Fixed taxes
    
    taxDetailsStr = `MwSt (${mwstRate}%): ${formatNumber(steuer - 600)} €\nFixsteuern (3x 200 €): 600 €\n`;
  }
  
  const kaufnebenkosten = steuer + agenturGebuehr + notarGebuehr;
  taxDetailsStr += `Maklergebühr (3,66%): ${formatNumber(agenturGebuehr)} €\nNotar & Grundbuch (ca. 1,5%): ${formatNumber(notarGebuehr)} €`;
  
  elements.nebenkosten.textContent = `${formatNumber(kaufnebenkosten)} €`;
  elements.nebenkostenDetail.textContent = taxDetailsStr;
  
  // Total cost and financing
  const gesamtkosten = kaufpreis + kaufnebenkosten + sanierung;
  const darlehnsbedarf = Math.max(0, gesamtkosten - eigenkapital);
  
  // Update dynamic financing summary card
  elements.summaryKaufpreis.textContent = `${formatNumber(kaufpreis, 0)} €`;
  elements.summaryNebenkosten.textContent = `${formatNumber(kaufnebenkosten, 0)} €`;
  elements.summarySanierung.textContent = `${formatNumber(sanierung, 0)} €`;
  elements.summaryKapitalbedarf.textContent = `${formatNumber(gesamtkosten, 0)} €`;
  elements.summaryEigenkapital.textContent = `- ${formatNumber(eigenkapital, 0)} €`;
  elements.summaryKreditbedarf.textContent = `${formatNumber(darlehnsbedarf, 0)} €`;
  
  // Stress-testing parameters
  const effektiverZins = zins + stresszins;
  const effektiveMiete = miete * ((12 - leerstand) / 12);
  
  // Calculate Monatsrate-based interest, principal, and duration
  const monatlicherZinsEur = darlehnsbedarf * (effektiverZins / 100) / 12;
  let monatlicheRate = monatsrate;
  let calculatedTilgungPct = 2.0; // Default if no loan
  
  if (darlehnsbedarf <= 0) {
    monatlicheRate = 0;
    if (!isMonatsrateManuallyEdited) {
      elements.monatsrate.value = '0';
    }
    elements.rangeMonatsrate.min = 0;
    elements.rangeMonatsrate.max = 100;
    elements.rangeMonatsrate.value = 0;
    elements.laufzeitVal.textContent = 'Theoretische Laufzeit: 0 Jahre (Kein Kredit)';
    elements.aufteilungVal.textContent = 'Aufteilung gesamt: 0 € Kapital / 0 € Zinsen gesamt';
    elements.aufteilungVal.style.color = 'var(--text-muted)';
    elements.zinsVal.textContent = `${zins.toString().replace('.', ',')} %`;
    calculatedTilgungPct = 0;
  } else {
    // Dynamically adjust slider range limits based on current loan and interest
    const minRate = Math.ceil(monatlicherZinsEur) + 10;
    const maxRate = Math.ceil(monatlicherZinsEur) + Math.ceil(darlehnsbedarf * 0.10 / 12);
    elements.rangeMonatsrate.min = minRate;
    elements.rangeMonatsrate.max = maxRate;
    
    // If not manually edited, default to Zins + 2.0% Tilgung
    if (!isMonatsrateManuallyEdited || monatsrate <= 0) {
      monatlicheRate = Math.round(darlehnsbedarf * (effektiverZins + 2.0) / 100 / 12);
      elements.monatsrate.value = formatNumber(monatlicheRate, 0);
    }
    
    // Sync the range slider position
    elements.rangeMonatsrate.value = monatlicheRate;
    
    let monatlicheTilgungEur = monatlicheRate - monatlicherZinsEur;
    
    if (monatlicheRate <= monatlicherZinsEur) {
      monatlicheTilgungEur = 0;
      calculatedTilgungPct = 0;
      elements.laufzeitVal.textContent = 'Theoretische Laufzeit: Unendlich ⚠️ (Zinsen nicht gedeckt)';
      elements.aufteilungVal.textContent = `Aufteilung gesamt: ${formatNumber(darlehnsbedarf, 0)} € Kapital / Unendlich Zinsen`;
      elements.aufteilungVal.style.color = '#f87171'; // light red for dark mode
    } else {
      calculatedTilgungPct = (monatlicheTilgungEur * 12) / darlehnsbedarf * 100;
      
      const rateZins = effektiverZins / 100;
      const Ri = rateZins / 12;
      let totalInterest = 0;
      let totalPayment = 0;
      let m_fractional = 0;
      let months = 0;
      let years = 0;
      let laufzeitText = 'Theoretische Laufzeit: ';
      
      if (rateZins === 0) {
        m_fractional = darlehnsbedarf / monatlicheRate;
        months = Math.ceil(m_fractional);
        years = m_fractional / 12;
        totalPayment = darlehnsbedarf;
        totalInterest = 0;
        laufzeitText += `${formatNumber(years, 1)} Jahre (${months} Monate)`;
      } else {
        // Amortization formula for months: m = ln(1 + (Ri * D) / (M - Ri * D)) / ln(1 + Ri)
        const numerator = Math.log(1 + (Ri * darlehnsbedarf) / (monatlicheRate - Ri * darlehnsbedarf));
        const denominator = Math.log(1 + Ri);
        m_fractional = numerator / denominator;
        
        months = Math.ceil(m_fractional);
        years = m_fractional / 12;
        
        totalPayment = m_fractional * monatlicheRate;
        totalInterest = Math.max(0, totalPayment - darlehnsbedarf);
        
        laufzeitText += `${formatNumber(years, 1)} Jahre (${months} Monate)`;
        
        // Add bank limits warning (30 years cap)
        if (years > 30) {
          laufzeitText += ' ⚠️ (Über 30-Jahre-Limit in IT)';
        } else if (years > 25) {
          laufzeitText += ' ℹ️ (Sehr lange Laufzeit)';
        } else if (years < 15) {
          laufzeitText += ' ℹ️ (Schnelle Entschuldung)';
        }
      }
      
      elements.laufzeitVal.textContent = laufzeitText;
      elements.aufteilungVal.textContent = `Aufteilung gesamt: ${formatNumber(darlehnsbedarf, 0)} € Kapital / ${formatNumber(totalInterest, 0)} € Zinsen gesamt`;
      elements.aufteilungVal.style.color = 'var(--text-muted)';
    }
    
    elements.zinsVal.textContent = `${zins.toString().replace('.', ',')} %`;
  }
  
  // Calculate Income Tax on Rental Income
  const steuerArt = elements.selectSteuerMiete.value;
  const personalTaxPct = parseLocaleFloat(elements.inputPersonalTaxRate.value) || 43;
  let monatlicheSteuer = 0;
  let taxLabel = '- Einkommenssteuer:';
  
  if (steuerArt === 'cedolare21') {
    monatlicheSteuer = effektiveMiete * 0.21;
    taxLabel = '- Einkommenssteuer (21% Cedolare):';
  } else if (steuerArt === 'cedolare10') {
    monatlicheSteuer = effektiveMiete * 0.10;
    taxLabel = '- Einkommenssteuer (10% Cedolare):';
  } else if (steuerArt === 'irpef') {
    // In Italy, IRPEF is calculated on 95% of the rental income
    monatlicheSteuer = (effektiveMiete * 0.95) * (personalTaxPct / 100);
    taxLabel = `- Einkommenssteuer (IRPEF ${personalTaxPct}%):`;
  } else {
    monatlicheSteuer = 0;
    taxLabel = '- Einkommenssteuer (Keine):';
  }
  
  // Monthly Cashflow calculations
  const monatlicherCashflowPreTax = effektiveMiete - monatlicheRate - hausgeld;
  const monatlicherCashflow = monatlicherCashflowPreTax - monatlicheSteuer; // Post-tax cashflow is primary
  
  elements.cashflow.textContent = `${formatNumber(monatlicherCashflow, 0)} €`;
  elements.verdictTitle.textContent = 'Monatlicher Cashflow (netto)';
  
  // Update Cashflow Breakdown summary card
  elements.cfMiete.textContent = `${formatNumber(effektiveMiete, 0)} €`;
  elements.cfHausgeld.textContent = `- ${formatNumber(hausgeld, 0)} €`;
  elements.cfKreditrate.textContent = `- ${formatNumber(monatlicheRate, 0)} €`;
  elements.cfCashflowPretax.textContent = `${formatNumber(monatlicherCashflowPreTax, 0)} €`;
  elements.labelCfSteuer.textContent = taxLabel;
  elements.cfSteuer.textContent = `- ${formatNumber(monatlicheSteuer, 0)} €`;
  elements.cfCashflow.textContent = `${formatNumber(monatlicherCashflow, 0)} €`;
  
  // Color code the cashflow total inside breakdown
  if (monatlicherCashflow > 50) {
    elements.cfCashflow.style.color = '#4ade80'; // light green for dark mode
  } else if (monatlicherCashflow >= -50) {
    elements.cfCashflow.style.color = '#fbbf24'; // amber/yellow
  } else {
    elements.cfCashflow.style.color = '#f87171'; // light red
  }
  
  // Verdict Badge Styling (Ampel-Logik)
  if (monatlicherCashflow > 50) {
    elements.verdictBadge.className = 'primary-result-badge badge-success';
    elements.verdictDesc.textContent = '🟢 Positiver Cashflow nach Steuern. Attraktiv!';
  } else if (monatlicherCashflow >= -50) {
    elements.verdictBadge.className = 'primary-result-badge badge-warning';
    elements.verdictDesc.textContent = '🟡 Grenzwertiger Cashflow nach Steuern. Preis verhandeln!';
  } else {
    elements.verdictBadge.className = 'primary-result-badge badge-danger';
    elements.verdictDesc.textContent = '🔴 Negativer Cashflow nach Steuern. Zuzahlung nötig!';
  }
  
  // Renditen
  const brutto = (miete * 12) / kaufpreis * 100;
  const netto = ((miete - hausgeld) * 12) / gesamtkosten * 100;
  
  // Return on Equity (Eigenkapital + Kaufnebenkosten + Sanierung)
  const eingesetztesEigenkapital = eigenkapital + kaufnebenkosten + sanierung;
  const ekRenditeVal = eingesetztesEigenkapital > 0 ? ((monatlicherCashflow * 12) / eingesetztesEigenkapital * 100) : 0;
  
  const kaufpreisFaktorVal = kaufpreis / (miete * 12);
  
  elements.bruttoRendite.textContent = `${formatNumber(brutto, 2)} %`;
  elements.nettoRendite.textContent = `${formatNumber(netto, 2)} %`;
  elements.ekRendite.textContent = eingesetztesEigenkapital > 0 ? `${formatNumber(ekRenditeVal, 2)} %` : 'N/A';
  elements.faktor.textContent = `${formatNumber(kaufpreisFaktorVal, 1)}x`;
  
  // Color-code yields based on benchmarks
  // Bruttomietrendite
  if (brutto >= 5.5) {
    elements.bruttoRendite.style.color = 'var(--success-color)';
  } else if (brutto >= 4.5) {
    elements.bruttoRendite.style.color = 'var(--warning-color)';
  } else {
    elements.bruttoRendite.style.color = 'var(--danger-color)';
  }
  
  // Nettomietrendite
  if (netto >= 4.5) {
    elements.nettoRendite.style.color = 'var(--success-color)';
  } else if (netto >= 3.5) {
    elements.nettoRendite.style.color = 'var(--warning-color)';
  } else {
    elements.nettoRendite.style.color = 'var(--danger-color)';
  }
  
  // Eigenkapitalrendite
  if (eingesetztesEigenkapital <= 0) {
    elements.ekRendite.style.color = '';
  } else if (ekRenditeVal >= 8.0) {
    elements.ekRendite.style.color = 'var(--success-color)';
  } else if (ekRenditeVal >= 4.0) {
    elements.ekRendite.style.color = 'var(--warning-color)';
  } else {
    elements.ekRendite.style.color = 'var(--danger-color)';
  }
  
  // Kaufpreisfaktor (Lower is better)
  if (kaufpreisFaktorVal <= 20.0) {
    elements.faktor.style.color = 'var(--success-color)';
  } else if (kaufpreisFaktorVal <= 25.0) {
    elements.faktor.style.color = 'var(--warning-color)';
  } else {
    elements.faktor.style.color = 'var(--danger-color)';
  }
  
  // Reverse Calculation (Max. Purchase Price)
  if (elements.checkReverseCalc.checked) {
    // target operating surplus per month
    const targetM = effektiveMiete - hausgeld - zielCashflow;
    const rateDecimal = (effektiverZins + calculatedTilgungPct) / 100;
    
    if (targetM <= 0) {
      elements.reverseKaufpreis.textContent = 'Nicht möglich';
      elements.reverseDetail.textContent = 'Miete reicht nicht aus, um Betriebskosten und Ziel-Cashflow zu decken.';
    } else {
      // Max allowed loan D_max
      const maxD = (targetM * 12) / rateDecimal;
      
      let maxKaufpreis = 0;
      if (steuerTyp === 'register') {
        // Analytical formula: maxD = KP * (1 + 0.0366 + 0.015) + Registersteuer + 100 + Sanierung - EK
        // Registersteuer = (Kataster * 1.05 * coeff) * 0.02/0.09.
        const coeff = kaufTyp === 'prima' ? 110 : 120;
        const basiswert = effektiverKataster > 0 ? (effektiverKataster * 1.05 * coeff) : 0; 
        
        let calculatedRegSteuer = basiswert * (kaufTyp === 'prima' ? 0.02 : 0.09);
        if (basiswert > 0 && calculatedRegSteuer < 1000) {
          calculatedRegSteuer = 1000;
        }
        
        // If no kataster value (and no area to estimate), fall back to KP-based tax
        if (effektiverKataster <= 0) {
          // If kataster is 0, register tax is based on KP:
          // maxD = KP * (1 + 0.0366 + 0.015 + registerSatz) + 100 + Sanierung - EK
          const totalProp = 1 + agenturSatz + 0.015 + (kaufTyp === 'prima' ? 0.02 : 0.09);
          maxKaufpreis = (maxD - 100 - 50 - sanierung + eigenkapital) / totalProp; 
        } else {
          maxKaufpreis = (maxD - (calculatedRegSteuer + 100) - sanierung + eigenkapital) / 1.0516;
        }
      } else {
        // MwSt-Kauf: total proportional tax rate is agenturSatz + notarySatz (0.015) + mwstRate%
        const totalProp = 1 + agenturSatz + 0.015 + (mwstRate / 100);
        maxKaufpreis = (maxD - 600 - sanierung + eigenkapital) / totalProp;
      }
      
      if (maxKaufpreis < 0) maxKaufpreis = 0;
      elements.reverseKaufpreis.textContent = `${formatNumber(maxKaufpreis, 0)} €`;
      elements.reverseDetail.textContent = `Wunsch-Cashflow: ${formatNumber(zielCashflow)} €/Monat\nNebenkosten bei diesem Kaufpreis: ca. ${formatNumber(maxKaufpreis * 0.0516 + (steuerTyp === 'register' ? (effektiverKataster * 1.05 * (kaufTyp === 'prima' ? 110 : 120) * (kaufTyp === 'prima' ? 0.02 : 0.09) + 100) : (maxKaufpreis * mwstRate/100 + 600)))} €`;
    }
  }
}

// Load storage and calculate on boot
loadFromLocalStorage();
calculate();
