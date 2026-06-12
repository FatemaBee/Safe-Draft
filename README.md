# SafeDraft

**Local-first PII redaction demo for healthcare-adjacent text.**  
A Chrome browser extension (Manifest V3) that helps users practice removing obvious personally identifiable information from notes before pasting them into AI tools.

> ⚠ **Not HIPAA compliant. Not medical or legal advice. Educational proof-of-concept only.**

---

Demo
<img width="497" height="604" alt="Screenshot 2026-06-12 at 4 38 28 PM" src="https://github.com/user-attachments/assets/8afc2a63-850c-47f9-808e-8d0fe1768749" />

<img width="497" height="604" alt="Screenshot 2026-06-12 at 4 38 22 PM" src="https://github.com/user-attachments/assets/332498ba-e363-45b0-b419-657791ddba13" />

<img width="497" height="604" alt="Screenshot 2026-06-12 at 4 37 55 PM" src="https://github.com/user-attachments/assets/b9501f4e-d25b-458d-8b2e-a569671237cb" />


## What it does

1. Generates a realistic synthetic social work / healthcare note (with entirely fake data).
2. Detects and redacts common PII/PHI patterns **locally in your browser** — no data ever leaves your device.
3. Copies the sanitized text to your clipboard.
4. Shows a detection summary with per-category counts.
5. Lets you download a structured `.txt` redaction report.

---

## How to load in Chrome

1. Download or clone this repository so all files are in a single folder (e.g. `SafeDraft/`).
2. Open Chrome and navigate to **`chrome://extensions`**.
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **"Load unpacked"**.
5. Select the `SafeDraft/` folder.
6. The SafeDraft icon appears in your toolbar. Click it to open the popup.

> **Tip:** If you edit any file, click the ↺ refresh icon on the extension card in `chrome://extensions` to reload.

---

## Privacy-first design principles

| Principle | How SafeDraft implements it |
|-----------|----------------------------|
| **No network calls** | Zero external API calls; no telemetry |
| **No storage** | Nothing written to `localStorage`, cookies, or databases |
| **No auth** | No accounts, no sign-in |
| **Local-only processing** | All regex runs in the popup's JS context |
| **Fake data only** | Generated notes use fictional names, addresses, and numbers |
| **Minimal permissions** | Only `clipboardWrite` is requested |

---

## PII detection coverage

| Category | Pattern matched | Replacement |
|----------|----------------|-------------|
| Person names | Full name, first name, last name (pool-based) | `[PERSON_NAME]` |
| Contact names | Emergency contact name (pool-based) | `[CONTACT_NAME]` |
| SSN | `000-00-0000` format | `[SSN]` |
| MRN | `MRN:` / `MRN #` label + value | `[MRN]` |
| Date of birth | `DOB:` / `Date of Birth:` label + date | `DOB: [DATE_OF_BIRTH]` |
| Phone | `(555) 555-5555`, `555-555-5555`, `555.555.5555` | `[PHONE]` |
| Email | Standard `user@domain.tld` | `[EMAIL]` |
| Street address | Number + street type keyword | `[ADDRESS]` |
| Bare dates | `MM/DD/YYYY` not already caught by DOB rule | `[DATE]` |

---

## Demo flow

1. Click the SafeDraft icon in Chrome to open the popup.
2. Click **"Generate Fake Note"** — a synthetic note appears in the top textarea.
3. Read through it. Notice realistic-looking (but entirely fake) names, SSNs, addresses, etc.
4. Click **"Remove PII + Copy"** — the sanitized version appears below; text is auto-copied.
5. Check the **Detection Summary** — see per-type counts and the total.
6. Click **"Download Summary"** — saves a structured `.txt` report to your Downloads folder.
7. Paste the copied text into your AI tool of choice.

---

## Limitations

- **Regex-based only.** Novel name formats, abbreviations, or unusual PII patterns may slip through.
- **Pool-limited.** Only names and contacts from the built-in fake data pools are caught by name; real notes with different names require different redaction.
- **No NLP/ML.** This tool does not use named-entity recognition. It will miss PII it doesn't have a rule for.
- **English-language only.** Non-English names and address formats are not handled.
- **Clipboard permission required.** Auto-copy relies on `navigator.clipboard.writeText()`; it may fail in some browser contexts.
- **Not a compliance tool.** Do not use as a substitute for a vetted de-identification system.

---

## File structure

```
SafeDraft/
├── manifest.json        Chrome MV3 manifest
├── popup.html           Extension popup UI
├── popup.css            Styling
├── popup.js             All logic: generation, redaction, download
├── README.md            This file
└── .claude/
    └── skills/
        └── healthcare-note-summarizer/
            └── SKILL.md  Claude skill for summarizing redacted notes
```

---

## Future improvements

- Named-entity recognition via a lightweight on-device model (e.g. WebAssembly).
- Support for user-pasted notes (not just generated ones).
- Customizable redaction rules via a settings page.
- Highlight diff view comparing original and sanitized text side-by-side.
- Export to JSON for downstream tooling.
- Multi-language support.

---

## Disclaimer

SafeDraft is an **educational proof-of-concept**. It is not a HIPAA-compliant de-identification tool, not a medical device, and not legal advice. Always review sanitized text manually before sharing. The authors make no warranties regarding the completeness or accuracy of redaction.
