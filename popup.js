// ═══════════════════════════════════════════════════════════════
// SafeDraft – popup.js
// All logic runs locally in the browser. No network calls.
// Sections:
//   1. Data pools (fake names, addresses, etc.)
//   2. Date helpers
//   3. Note templates (4 types)
//   4. PII redaction engine
//   5. Detection summary UI
//   6. Download summary
//   7. Event listeners
// ═══════════════════════════════════════════════════════════════

'use strict';

// ── Module-level state ──────────────────────────────────────────
// Stored here so the Download button can access the latest redaction.
let lastSanitizedText = '';
let lastCounts = {};
let lastTimestamp = '';

// ── 1. DATA POOLS ───────────────────────────────────────────────
// All data is entirely fabricated. Any resemblance to real persons
// is coincidental.

const CLIENT_NAMES = [
  { full: 'Maria Delgado-Torres',  first: 'Maria',   last: 'Delgado-Torres' },
  { full: 'Jerome Washington',     first: 'Jerome',  last: 'Washington' },
  { full: 'Aisha Patel-Nguyen',    first: 'Aisha',   last: 'Patel-Nguyen' },
  { full: 'Carlos Reyes Morales',  first: 'Carlos',  last: 'Reyes Morales' },
  { full: 'Linda Kowalski',        first: 'Linda',   last: 'Kowalski' },
  { full: 'Darnell Brown',         first: 'Darnell', last: 'Brown' },
  { full: 'Fatima Al-Hassan',      first: 'Fatima',  last: 'Al-Hassan' },
];

const EMERGENCY_CONTACTS = [
  { name: 'Rosa Delgado',        relationship: 'mother' },
  { name: 'Tyrone Washington',   relationship: 'brother' },
  { name: 'Priya Sharma',        relationship: 'sister' },
  { name: 'Miguel Reyes',        relationship: 'father' },
  { name: 'Susan Kowalski',      relationship: 'daughter' },
  { name: 'Keisha Brown',        relationship: 'partner' },
  { name: 'Omar Al-Hassan',      relationship: 'husband' },
];

const STREETS = [
  '4821 Maple Grove Ave',
  '123 Birchwood Lane',
  '7702 Crescent Park Blvd',
  '55 Willowbrook Dr',
  '310 Harbor View Rd',
  '988 Elmhurst Terrace',
  '2200 Pinecrest Way',
];

const CITIES = [
  'Springfield, IL 62701',
  'Riverside, CA 92501',
  'Millbrook, OH 44202',
  'Lakewood, CO 80226',
  'Ferndale, WA 98248',
  'Oak Grove, MN 55303',
  'Cedar Falls, IA 50613',
];

const MEDICATIONS = [
  'metformin 500 mg twice daily',
  'lisinopril 10 mg once daily',
  'sertraline 50 mg once daily',
  'atorvastatin 20 mg at bedtime',
  'amlodipine 5 mg once daily',
  'omeprazole 20 mg before meals',
  'gabapentin 300 mg three times daily',
];

const INSURANCES = [
  'Medicaid (CHIP)',
  'Blue Cross Community Plan',
  'Ambetter Health',
  'Aetna Better Health',
  'Molina Healthcare',
];

const REFERRAL_AGENCIES = [
  '211 Helpline',
  'Catholic Charities Housing Services',
  'Salvation Army Emergency Assistance',
  'Local Community Action Agency',
  'Legal Aid Society',
  'Family & Children\'s Services',
];

const CASE_MANAGERS = [
  'J. Rivera, MSW',
  'T. Chen, LCSW',
  'D. Okafor, BSW',
  'P. Müller, LMSW',
  'A. Nguyen, LCSW',
];

// Fake but plausible US phone numbers (555 range is safe for fiction)
const PHONES = [
  '(555) 214-8830',
  '(555) 377-0142',
  '(555) 489-6201',
  '555-612-9074',
  '555.741.3388',
];

const EMAILS = [
  'mdelgado1987@freemail.net',
  'jerome.w@quickmail.org',
  'aisha.pn@webpost.com',
  'c.reyes55@mailbox.io',
  'lkowalski@hometown.net',
];

// Fake MRNs
const MRNS = ['MRN: 7734821', 'MRN: 5501294', 'MRN: 8823047', 'MRN: 6612983', 'MRN: 9940021'];

// Fake SSNs (obviously invalid numbers in 000 and 666 ranges)
const SSNS = ['000-00-1234', '666-00-5678', '000-12-3456'];

// ── 2. DATE HELPERS ─────────────────────────────────────────────

/**
 * Returns a date string MM/DD/YYYY relative to today.
 * Positive offset = future, negative = past.
 */
function relDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/** Short readable timestamp: "June 12, 2026 at 2:34 PM" */
function readableNow() {
  return new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

/** ISO-style date for filenames: "2026-06-12" */
function isoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── 3. RANDOM HELPERS ───────────────────────────────────────────

/** Pick a random element from an array. */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick a random integer between min and max (inclusive). */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── 4. NOTE TEMPLATES ───────────────────────────────────────────
// Each template function returns a string of ~150–250 words
// containing realistic (but entirely fake) PII.

function noteProgressVisit() {
  const client   = pick(CLIENT_NAMES);
  const contact  = pick(EMERGENCY_CONTACTS);
  const street   = pick(STREETS);
  const city     = pick(CITIES);
  const med1     = pick(MEDICATIONS);
  const med2     = pick(MEDICATIONS.filter(m => m !== med1));
  const ins      = pick(INSURANCES);
  const agency   = pick(REFERRAL_AGENCIES);
  const cm       = pick(CASE_MANAGERS);
  const phone    = pick(PHONES);
  const email    = pick(EMAILS);
  const mrn      = pick(MRNS);
  const ssn      = pick(SSNS);
  const dob      = relDate(-randInt(8000, 16000)); // 22–44 years ago
  const visitDate = relDate(-3);
  const prevVisit = relDate(-30);
  const nextAppt  = relDate(14);
  const eviction  = relDate(-7);
  const rent      = randInt(750, 1600);

  return `PROGRESS NOTE — SOCIAL WORK VISIT
Date: ${visitDate} | Prior visit: ${prevVisit} | Next appointment: ${nextAppt}
Case Manager: ${cm}

Client: ${client.full}
DOB: ${dob} | ${mrn} | SSN: ${ssn}
Address: ${street}, ${city}
Phone: ${phone} | Email: ${email}
Insurance: ${ins}
Emergency Contact: ${contact.name} (${contact.relationship})

Client presented as calm and cooperative during today's home visit. She reports ongoing difficulty managing chronic conditions and confirms adherence to ${med1} and ${med2}. Client disclosed receipt of an eviction notice dated ${eviction} from landlord citing non-payment of rent ($${rent}/month). Client states she was unaware of a lapse in housing assistance.

Assessment: Client is at imminent risk of housing instability. PHQ-2 screen administered; score of 3 noted, warranting follow-up. Client provided verbal consent to release information to ${agency} for emergency rental assistance application.

Plan: Case manager ${cm} will contact ${agency} on client's behalf by ${nextAppt}. Client instructed to gather lease documentation and bank statements. Follow-up call scheduled for ${nextAppt} at client's contact number on file.

— Note authored by ${cm}`;
}

function noteIntakeAssessment() {
  const client   = pick(CLIENT_NAMES);
  const contact  = pick(EMERGENCY_CONTACTS);
  const street   = pick(STREETS);
  const city     = pick(CITIES);
  const phone    = pick(PHONES);
  const email    = pick(EMAILS);
  const mrn      = pick(MRNS);
  const ssn      = pick(SSNS);
  const ins      = pick(INSURANCES);
  const agency   = pick(REFERRAL_AGENCIES);
  const cm       = pick(CASE_MANAGERS);
  const dob      = relDate(-randInt(10000, 20000));
  const intake   = relDate(0);
  const injury   = relDate(-randInt(30, 180));
  const consent  = relDate(0);
  const phq2     = randInt(0, 6);
  const fpl      = randInt(80, 130);

  return `INTAKE ASSESSMENT
Date: ${intake} | Intake Worker: ${cm}

IDENTIFYING INFORMATION
Client name: ${client.full}
DOB: ${dob} | ${mrn} | SSN: ${ssn}
Current Address: ${street}, ${city}
Phone: ${phone} | Email: ${email}
Insurance: ${ins}
Emergency Contact: ${contact.name} (${contact.relationship}) — same address

PRESENTING CONCERN
${client.first} self-referred following an employment-related injury sustained on ${injury}. Client reports inability to work and loss of income since injury date. Currently at approximately ${fpl}% of the Federal Poverty Level based on reported household income.

SCREENING RESULTS
PHQ-2 Score: ${phq2}/6 — ${phq2 >= 3 ? 'Positive; referral for mental health evaluation recommended.' : 'Negative; monitor at follow-up.'}
Food Insecurity Screen (Hunger Vital Sign): Positive — client reports skipping meals 3+ times per week.

REFERRALS INITIATED
• ${agency} — benefits enrollment support
• Consent form signed by client on ${consent}

NEXT STEPS
File reviewed by ${cm}. Benefits eligibility screening to be completed within 5 business days. Emergency food box requested from ${agency}.`;
}

function noteHospitalDischarge() {
  const client   = pick(CLIENT_NAMES);
  const contact  = pick(EMERGENCY_CONTACTS);
  const street   = pick(STREETS);
  const city     = pick(CITIES);
  const phone    = pick(PHONES);
  const email    = pick(EMAILS);
  const mrn      = pick(MRNS);
  const ssn      = pick(SSNS);
  const ins      = pick(INSURANCES);
  const agency   = pick(REFERRAL_AGENCIES);
  const cm       = pick(CASE_MANAGERS);
  const med1     = pick(MEDICATIONS);
  const med2     = pick(MEDICATIONS.filter(m => m !== med1));
  const dob      = relDate(-randInt(14000, 25000));
  const admit    = relDate(-5);
  const discharge = relDate(0);
  const followUp = relDate(7);
  const los      = 5;
  const homeHrs  = pick([4, 8, 12, 16]);

  return `HOSPITAL DISCHARGE PLANNING NOTE
Discharge date: ${discharge} | Admitted: ${admit} | Length of stay: ${los} days
Discharging Social Worker: ${cm}

PATIENT: ${client.full}
DOB: ${dob} | ${mrn} | SSN: ${ssn}
Discharge Address: ${street}, ${city}
Phone: ${phone} | Email: ${email}
Insurance: ${ins}
Emergency Contact: ${contact.name} (${contact.relationship})

DISCHARGE SUMMARY
${client.first} is being discharged to home following a ${los}-day inpatient admission. Patient is medically stable and has demonstrated adequate understanding of discharge instructions. Medications on discharge: ${med1} and ${med2}. Co-pay assistance application submitted to ${agency} on patient's behalf; awaiting approval.

POST-DISCHARGE SERVICES ARRANGED
• Home health aide: ${homeHrs} hours/week authorized through ${ins}
• Meal delivery: referred to ${agency}; first delivery expected within 48 hours of discharge
• Follow-up appointment: ${followUp} with outpatient care team

SAFETY & TRANSPORTATION
${contact.name} (${contact.relationship}) confirmed availability for transport home today. Patient verbalized understanding of medication schedule and confirmed access to a working phone at the number above.

Authored by ${cm}`;
}

function noteCrisisIntervention() {
  const client   = pick(CLIENT_NAMES);
  const contact  = pick(EMERGENCY_CONTACTS);
  const street   = pick(STREETS);
  const city     = pick(CITIES);
  const phone    = pick(PHONES);
  const email    = pick(EMAILS);
  const mrn      = pick(MRNS);
  const ssn      = pick(SSNS);
  const ins      = pick(INSURANCES);
  const agency   = pick(REFERRAL_AGENCIES);
  const cm       = pick(CASE_MANAGERS);
  const dob      = relDate(-randInt(6000, 18000));
  const crisisDate = relDate(-1);
  const crisisTime = `${randInt(8,11)}:${String(randInt(0,59)).padStart(2,'0')} AM`;
  const duration = `${randInt(22,55)} minutes`;
  const followUp = relDate(2);
  const shutOff  = relDate(3);
  const warmline = '(555) 800-WARM';

  return `CRISIS INTERVENTION CONTACT LOG
Date of Contact: ${crisisDate} at ${crisisTime} | Duration: ${duration}
Crisis Counselor: ${cm}

CLIENT: ${client.full}
DOB: ${dob} | ${mrn} | SSN: ${ssn}
Address on file: ${street}, ${city}
Phone: ${phone} | Email: ${email}
Insurance: ${ins}
Emergency Contact: ${contact.name} (${contact.relationship})

PRESENTING CRISIS
${client.first} contacted the crisis line in significant distress. Client reported receiving a utility shut-off notice effective ${shutOff}. Client expressed feeling overwhelmed and hopeless, citing the compounding stressors of financial insecurity and housing instability. Landlord reportedly also contacted client this week.

RISK ASSESSMENT
• Suicidal Ideation (SI): Passive ideation reported; no plan or intent disclosed
• Self-Harm (SH): Denied current SH
• Homicidal Ideation (HI): Denied
• Substance Use: Reports occasional alcohol use; denied current intoxication

INTERVENTION & SAFETY PLANNING
Crisis counselor ${cm} completed collaborative safety plan with client. ${contact.name} (${contact.relationship}) contacted with client's consent and confirmed ability to provide overnight support tonight. Warmline number provided: ${warmline}. Referral placed with ${agency} for emergency utility assistance.

FOLLOW-UP
Scheduled outreach call: ${followUp}. ${email} on file for written summary of resources.
— Authored by ${cm}`;
}

// Array of all template functions for easy random selection
const NOTE_TEMPLATES = [
  noteProgressVisit,
  noteIntakeAssessment,
  noteHospitalDischarge,
  noteCrisisIntervention,
];

// ── 5. PII REDACTION ENGINE ─────────────────────────────────────
// Runs replacements in a defined order to avoid partial matches.
// Returns { sanitized, counts }.

function redactPII(text, clientNames, contactNames) {
  // Mutable working copy
  let s = text;

  // Counts object – track every category
  const counts = {
    names:     0,
    dobs:      0,
    phones:    0,
    emails:    0,
    addresses: 0,
    mrns:      0,
    ssns:      0,
    dates:     0,
  };

  // Helper: replace all regex matches and increment a counter
  function replace(regex, replacement, counterKey) {
    s = s.replace(regex, (...args) => {
      counts[counterKey]++;
      // If replacement is a function, call it; otherwise use string
      return typeof replacement === 'function' ? replacement(...args) : replacement;
    });
  }

  // ── 5a. Known client names (full → first → last) ────────────
  // We process full names first to avoid partial clobbering.
  for (const n of clientNames) {
    if (!n) continue;
    // Full name
    const reFull = new RegExp(escapeRegex(n.full), 'gi');
    s = s.replace(reFull, () => { counts.names++; return '[PERSON_NAME]'; });
    // First name only
    const reFirst = new RegExp(`\\b${escapeRegex(n.first)}\\b`, 'gi');
    s = s.replace(reFirst, () => { counts.names++; return '[PERSON_NAME]'; });
    // Last name only (may be hyphenated)
    const reLast = new RegExp(`\\b${escapeRegex(n.last)}\\b`, 'gi');
    s = s.replace(reLast, () => { counts.names++; return '[PERSON_NAME]'; });
  }

  // ── 5b. Emergency contact names ─────────────────────────────
  for (const cn of contactNames) {
    if (!cn) continue;
    const reName = new RegExp(escapeRegex(cn), 'gi');
    s = s.replace(reName, () => { counts.names++; return '[CONTACT_NAME]'; });
  }

  // ── 5c. SSNs ─────────────────────────────────────────────────
  // Pattern: digits-digits-digits (common SSN formats)
  replace(/\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g, '[SSN]', 'ssns');

  // ── 5d. MRN label patterns ───────────────────────────────────
  replace(/MRN[:\s#]*[\w\d]+/gi, '[MRN]', 'mrns');

  // ── 5e. DOB label patterns ───────────────────────────────────
  // "DOB: MM/DD/YYYY" or "Date of Birth: ..."
  replace(
    /\b(?:DOB|Date of Birth|D\.O\.B\.?)[:\s]+\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
    'DOB: [DATE_OF_BIRTH]',
    'dobs'
  );

  // ── 5f. Phone numbers ─────────────────────────────────────────
  // Handles: (555) 555-5555 | 555-555-5555 | 555.555.5555 | 5555555555
  replace(
    /(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/g,
    '[PHONE]',
    'phones'
  );

  // ── 5g. Email addresses ───────────────────────────────────────
  replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL]', 'emails');

  // ── 5h. Street addresses (number + street keyword) ───────────
  // Matches patterns like "123 Maple Ave" or "4821 Crescent Park Blvd"
  replace(
    /\d{1,5}\s+[A-Z][a-zA-Z\s]+(?:Ave|Blvd|Dr|Ln|Lane|Rd|Road|St|Street|Way|Terrace|Terr|Ct|Court|Pl|Place|Pkwy|Parkway|Cir|Circle|Loop|Trail|Trl)\b/gi,
    '[ADDRESS]',
    'addresses'
  );

  // ── 5i. Bare dates MM/DD/YYYY ─────────────────────────────────
  // Only catch what wasn't already caught by DOB pattern above.
  replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[DATE]', 'dates');

  return { sanitized: s, counts };
}

/** Escape special regex characters in a string. */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── 6. DETECTION SUMMARY UI ─────────────────────────────────────

/**
 * Render the badge grid and show the summary card.
 * @param {Object} counts - PII counts from redactPII()
 * @param {string} ts     - Human-readable timestamp
 */
function renderSummary(counts, ts) {
  const card      = document.getElementById('card-summary');
  const grid      = document.getElementById('badge-grid');
  const tsEl      = document.getElementById('summary-timestamp');
  const totalEl   = document.getElementById('total-removed');

  // Timestamp
  const datePart = ts.split(' at ')[0];
  const timePart = ts.split(' at ')[1] || '';
  tsEl.innerHTML = `${datePart}<br>${timePart}`;

  // Badge definitions: [label, counts key]
  const badges = [
    ['Names',     counts.names],
    ['DOBs',      counts.dobs],
    ['Phones',    counts.phones],
    ['Emails',    counts.emails],
    ['Addresses', counts.addresses],
    ['MRNs',      counts.mrns],
    ['SSNs',      counts.ssns],
    ['Dates',     counts.dates],
  ];

  grid.innerHTML = '';
  for (const [label, count] of badges) {
    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.innerHTML = `
      <span class="badge-count ${count > 0 ? 'nonzero' : ''}">${count}</span>
      <span class="badge-label">${label}</span>
    `;
    grid.appendChild(badge);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  totalEl.textContent = `Total items flagged for redaction: ${total}`;

  card.classList.add('visible');
  card.setAttribute('aria-hidden', 'false');
}

// ── 7. DOWNLOAD SUMMARY ─────────────────────────────────────────

function downloadSummary() {
  const counts = lastCounts;
  const ts     = lastTimestamp;
  const text   = lastSanitizedText;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const namesTotal = (counts.names || 0);

  const content = `
╔══════════════════════════════════════════════════════╗
║              SAFEDRAFT — REDACTION SUMMARY           ║
╚══════════════════════════════════════════════════════╝

Generated     : ${ts}
Total PII items removed: ${total}

──────────────────────────────────────────────────────
DETECTION BREAKDOWN
──────────────────────────────────────────────────────
  Names / Contacts      : ${namesTotal}
  Dates of Birth        : ${counts.dobs || 0}
  Phone Numbers         : ${counts.phones || 0}
  Email Addresses       : ${counts.emails || 0}
  Addresses             : ${counts.addresses || 0}
  MRNs                  : ${counts.mrns || 0}
  SSNs                  : ${counts.ssns || 0}
  Other Dates           : ${counts.dates || 0}

──────────────────────────────────────────────────────
SANITIZED NOTE
──────────────────────────────────────────────────────

${text}

──────────────────────────────────────────────────────
DISCLAIMER
──────────────────────────────────────────────────────
This file was produced by SafeDraft, an educational
proof-of-concept browser extension. Redaction is
imperfect — always review before sharing.
This tool is NOT HIPAA compliant.
──────────────────────────────────────────────────────
`.trimStart();

  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `safedraft-summary-${isoDate()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── 8. EVENT LISTENERS ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  const btnGenerate  = document.getElementById('btn-generate');
  const btnRedact    = document.getElementById('btn-redact');
  const btnDownload  = document.getElementById('btn-download');
  const inputArea    = document.getElementById('textarea-input');
  const outputArea   = document.getElementById('textarea-output');
  const copyStatus   = document.getElementById('copy-status');

  // ── Generate button ──────────────────────────────────────────
  btnGenerate.addEventListener('click', () => {
    // Pick a random template and generate a note
    const templateFn = pick(NOTE_TEMPLATES);
    inputArea.value = templateFn();
    // Clear previous output & summary when regenerating
    outputArea.value = '';
    document.getElementById('card-summary').classList.remove('visible');
    copyStatus.classList.remove('visible');
    copyStatus.textContent = '';
  });

  // ── Redact button ────────────────────────────────────────────
  btnRedact.addEventListener('click', async () => {
    const rawText = inputArea.value.trim();
    if (!rawText) {
      inputArea.focus();
      return;
    }

    // Build the lists of names to redact from ALL pools so we catch
    // whichever names appear in this note regardless of template.
    const allClientNames  = CLIENT_NAMES;
    const allContactNames = EMERGENCY_CONTACTS.map(c => c.name);

    const { sanitized, counts } = redactPII(rawText, allClientNames, allContactNames);

    // Store for Download button
    lastSanitizedText = sanitized;
    lastCounts        = counts;
    lastTimestamp     = readableNow();

    // Show sanitized text
    outputArea.value = sanitized;

    // Copy to clipboard using the Clipboard API
    try {
      await navigator.clipboard.writeText(sanitized);
      copyStatus.textContent = '✓ Copied to clipboard';
    } catch {
      // Fallback for environments where Clipboard API isn't available
      copyStatus.textContent = '⚠ Copy failed – select text manually';
    }
    copyStatus.classList.add('visible');

    // Render detection summary card
    renderSummary(counts, lastTimestamp);

    // Auto-hide the copy confirmation after 3 s
    setTimeout(() => copyStatus.classList.remove('visible'), 3000);
  });

  // ── Download button ──────────────────────────────────────────
  btnDownload.addEventListener('click', () => {
    if (!lastSanitizedText) return;
    downloadSummary();
  });

});
