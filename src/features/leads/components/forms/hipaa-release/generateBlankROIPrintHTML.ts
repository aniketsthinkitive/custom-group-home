/**
 * Generates a print-ready HTML document for the HIPAA Release (Blank ROI) form.
 * If formJson contains filled data, the fields are populated; otherwise blank lines are shown.
 */

interface BlankROIFormData {
  // Section 1
  patientName?: string;
  organizationName?: string;
  // Section 2
  discloseCompleteRecord?: boolean;
  discloseCompleteRecordExcept?: boolean;
  exceptMentalHealth?: boolean;
  exceptCommunicableDiseases?: boolean;
  exceptAlcoholDrugAbuse?: boolean;
  exceptGeneticInfo?: boolean;
  exceptOther?: boolean;
  exceptOtherDescription?: string;
  formOfDisclosureElectronic?: boolean;
  formOfDisclosureHardCopy?: boolean;
  // Section 3
  reasonForDisclosure1?: string;
  reasonForDisclosureDescription?: string;
  // Section 4
  recipient_name?: string;
  recipient_organization?: string;
  recipient_address?: string;
  // Section 5
  durationOptionA?: boolean;
  durationFromDate?: string;
  durationToDate?: string;
  durationOptionB?: boolean;
  durationOptionC?: boolean;
  durationEventDescription?: string;
  revocation_name?: string;
  revocation_organization?: string;
  revocation_address?: string;
  // Section 6
  signature?: string;
  signatureDate?: string;
  printName?: string;
  thirdPartyName?: string;
  thirdPartySignature?: string;
  legalAuthorityDescription?: string;
}

/** Render a checkbox — checked or unchecked */
const cb = (checked?: boolean): string =>
  checked
    ? `<span class="checkbox checked">&#10003;</span>`
    : `<span class="checkbox"></span>`;

/** Render a filled value or a blank underline */
const field = (value?: string, width = "300px"): string =>
  value
    ? `<span class="filled-value">${value}</span>`
    : `<span class="blank-line" style="width:${width}"></span>`;

/** Render a signature image or blank line */
const signatureField = (value?: string, width = "250px"): string => {
  if (value && (value.startsWith("data:image") || value.startsWith("http"))) {
    return `<img src="${value}" class="signature-img" alt="Signature" />`;
  }
  if (value) {
    return `<span class="filled-value">${value}</span>`;
  }
  return `<span class="blank-line" style="width:${width}"></span>`;
};

export const generateBlankROIPrintHTML = (
  formJson: BlankROIFormData | Record<string, unknown>,
  leadName?: string
): string => {
  const d = formJson as BlankROIFormData;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HIPAA Release Form – Blank ROI</title>
  <style>
    @media print {
      @page { margin: 0.75in 0.8in; size: letter; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
      .no-break { page-break-inside: avoid; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      padding: 0.75in 0.8in;
    }
    h1 {
      text-align: center;
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 14px;
    }
    .subtitle {
      font-size: 11pt;
      margin-bottom: 18px;
      line-height: 1.4;
    }
    .section-title {
      font-weight: bold;
      font-size: 12pt;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    p { margin-bottom: 6px; }
    .blank-line {
      display: inline-block;
      border-bottom: 1px solid #000;
      min-width: 200px;
      height: 1.2em;
      vertical-align: bottom;
    }
    .filled-value {
      display: inline;
      font-weight: 500;
      border-bottom: 1px solid #000;
      padding-bottom: 1px;
    }
    .checkbox {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1.5px solid #000;
      text-align: center;
      line-height: 14px;
      font-size: 12px;
      vertical-align: middle;
      margin-right: 8px;
      position: relative;
      top: -1px;
    }
    .checkbox.checked {
      background-color: #000;
      color: #fff;
      font-weight: bold;
    }
    .indent { margin-left: 40px; }
    .indent-2 { margin-left: 80px; }
    .check-row { margin-bottom: 4px; display: flex; align-items: flex-start; gap: 0; }
    .check-row .checkbox { flex-shrink: 0; margin-top: 3px; }
    .or-label { margin: 6px 0; font-size: 12pt; }
    .field-row {
      margin-bottom: 4px;
      display: flex;
      align-items: baseline;
    }
    .field-label {
      font-weight: normal;
      min-width: 110px;
      flex-shrink: 0;
    }
    .field-value {
      flex: 1;
      border-bottom: 1px solid #000;
      min-height: 1.3em;
      padding-left: 4px;
      word-break: break-word;
    }
    .long-line {
      display: block;
      border-bottom: 1px solid #000;
      min-height: 1.3em;
      margin-bottom: 4px;
      padding-left: 4px;
      word-break: break-word;
    }
    .signature-row {
      display: flex;
      align-items: baseline;
      gap: 40px;
      margin-top: 16px;
      margin-bottom: 16px;
    }
    .signature-row > div { flex: 1; }
    .signature-img {
      max-height: 60px;
      max-width: 250px;
      display: block;
      margin-bottom: -2px;
    }
    ul.understand {
      list-style: disc;
      margin-left: 24px;
      margin-bottom: 10px;
    }
    ul.understand li { margin-bottom: 8px; font-size: 11.5pt; line-height: 1.45; }
    .page-footer {
      text-align: center;
      font-size: 10pt;
      margin-top: 28px;
      color: #333;
    }
    .except-lines .long-line { margin-left: 80px; width: calc(100% - 80px); }
  </style>
</head>
<body>

  <!-- =============== PAGE 1 =============== -->
  <h1>HIPAA Release Form</h1>
  <p class="subtitle">
    Please complete all sections of this HIPAA release form. If any sections are left blank, this form
    will be invalid and it will not be possible for your health information to be shared as requested.
  </p>

  <p class="section-title">Section I</p>
  <p>
    I, ${field(d.patientName || leadName, "320px")}, give my permission for
    ${field(d.organizationName, "320px")} to share the information listed in
    Section II of this document with the person(s) or organization(s) I have specified in Section IV
    of this document.
  </p>

  <p class="section-title">Section II &ndash; Health Information</p>
  <p>I would like to give the above healthcare organization permission to:</p>
  <p style="margin-bottom: 10px;">Tick as appropriate</p>

  <div class="indent">
    <div class="check-row">
      ${cb(d.discloseCompleteRecord)}
      <span>Disclose my complete health record including, but not limited to, diagnoses, lab test results, treatment, and billing records for all conditions.</span>
    </div>
  </div>

  <p class="or-label">Or</p>

  <div class="indent">
    <div class="check-row">
      ${cb(d.discloseCompleteRecordExcept)}
      <span>Disclose my complete health record except for the following information</span>
    </div>
  </div>

  <div class="indent-2" style="margin-top:4px;">
    <div class="check-row">${cb(d.exceptMentalHealth)}<span>Mental health records</span></div>
    <div class="check-row">${cb(d.exceptCommunicableDiseases)}<span>Communicable diseases including, but not limited to, HIV and AIDS</span></div>
    <div class="check-row">${cb(d.exceptAlcoholDrugAbuse)}<span>Alcohol/drug abuse treatment records</span></div>
    <div class="check-row">${cb(d.exceptGeneticInfo)}<span>Genetic information</span></div>
    <div class="check-row">${cb(d.exceptOther)}<span>Other (Specify)</span></div>
  </div>

  <div class="except-lines" style="margin-top:4px;">
    <div class="long-line">${d.exceptOtherDescription || "&nbsp;"}</div>
    <div class="long-line">&nbsp;</div>
  </div>

  <p style="margin-top:14px;"><strong>Form of Disclosure:</strong></p>
  <div class="indent" style="margin-top:4px;">
    <div class="check-row">${cb(d.formOfDisclosureElectronic)}<span>Electronic copy or access via a web-based portal</span></div>
    <div class="check-row">${cb(d.formOfDisclosureHardCopy)}<span>Hard copy</span></div>
  </div>

  <p class="section-title">Section III &ndash; Reason for Disclosure</p>
  <p style="margin-bottom:8px;">
    Please detail the reasons why information is being shared. If you are initiating the request for
    sharing information and do not wish to list the reasons for sharing, write &lsquo;at my request&rsquo;.
  </p>
  <div class="long-line">${d.reasonForDisclosure1 || "For treatment and ongoing care"}</div>
  <div class="long-line">${d.reasonForDisclosureDescription || "&nbsp;"}</div>
  <div class="long-line">&nbsp;</div>
  <div class="long-line">&nbsp;</div>

  <p class="page-footer">Page 1 of 3</p>

  <!-- =============== PAGE 2 =============== -->
  <div class="page-break"></div>

  <p class="section-title">Section IV &ndash; Who Can Receive My Health Information</p>
  <p style="margin-bottom:10px;">
    I give authorization for the health information detailed in section II of this document to be
    shared with the following individual(s) or organization(s)
  </p>

  <div class="field-row">
    <span class="field-label">Name:</span>
    <span class="field-value">${d.recipient_name || "Employees of"}</span>
  </div>
  <div class="field-row">
    <span class="field-label">Organization:</span>
    <span class="field-value">${d.recipient_organization || "Common Actions for Change"}</span>
  </div>
  <div class="field-row">
    <span class="field-label">Address:</span>
    <span class="field-value">${d.recipient_address || "310 Main Street Manchester, NH 03102"}</span>
  </div>

  <p style="margin-top:14px; font-size:11pt; line-height:1.45;">
    I understand that the person(s)/organization(s) listed above may not be covered by
    state/federal rules governing privacy and security of data and may be permitted to further
    share the information that is provided to them.
  </p>

  <p class="section-title">Section V &ndash; Duration of Authorization</p>
  <p style="margin-bottom:8px;">This authorization to share my health information is valid:</p>
  <p style="margin-bottom:6px;">Tick as appropriate</p>

  <div class="indent">
    <div class="check-row">
      ${cb(d.durationOptionA)}
      <span>a) From ${field(d.durationFromDate, "140px")} to ${field(d.durationToDate, "140px")}</span>
    </div>
  </div>
  <p class="or-label">Or</p>
  <div class="indent">
    <div class="check-row">
      ${cb(d.durationOptionB)}
      <span>b) All past, present, and future periods</span>
    </div>
  </div>
  <p class="or-label">Or</p>
  <div class="indent">
    <div class="check-row">
      ${cb(d.durationOptionC)}
      <span>c) The date of the signature in section VI until the following event:</span>
    </div>
  </div>
  <div class="long-line" style="margin-top:4px;">${d.durationEventDescription || "&nbsp;"}</div>

  <p style="margin-top:16px;">
    I understand that I am permitted to revoke this authorization to share my health data at any
    time and can do so by submitting a request in writing to:
  </p>

  <div class="field-row" style="margin-top:8px;">
    <span class="field-label">Name:</span>
    <span class="field-value">${d.revocation_name || "&nbsp;"}</span>
  </div>
  <div class="field-row">
    <span class="field-label">Organization:</span>
    <span class="field-value">${d.revocation_organization || "Common Actions for Change"}</span>
  </div>
  <div class="field-row">
    <span class="field-label">Address:</span>
    <span class="field-value">${d.revocation_address || "310 Main Street Manchester, NH 03102"}</span>
  </div>

  <p class="page-footer">Page 2 of 3</p>

  <!-- =============== PAGE 3 =============== -->
  <div class="page-break"></div>

  <p style="margin-bottom:8px;">I understand that:</p>
  <ul class="understand">
    <li>
      In the event that my information has already been shared by the time my
      authorization is revoked, it may be too late to cancel permission to share my health
      data.
    </li>
    <li>
      I understand that I do not need to give any further permission for the information
      detailed in Section II to be shared with the person(s) or organization(s) listed in section
      IV.
    </li>
    <li>
      I understand that the failure to sign/submit this authorization or the cancellation of
      this authorization will not prevent me from receiving any treatment or benefits I am
      entitled to receive, provided this information is not required to determine if I am
      eligible to receive those treatments or benefits or to pay for the services I receive.
    </li>
  </ul>

  <p class="section-title">Section VI &ndash; Signature</p>

  <div class="signature-row">
    <div>
      <p>Signature: ${signatureField(d.signature, "250px")}</p>
    </div>
    <div>
      <p>Date: ${field(d.signatureDate, "180px")}</p>
    </div>
  </div>

  <div class="field-row" style="margin-top:12px;">
    <span class="field-label">Print your name:</span>
    <span class="field-value">${d.printName || "&nbsp;"}</span>
  </div>

  <p style="margin-top:16px; font-size:11.5pt; line-height:1.45;">
    If this form is being completed by a person with legal authority to act an individual&rsquo;s behalf,
    such as a parent or legal guardian of a minor or health care agent, please complete the
    following information:
  </p>

  <div class="field-row" style="margin-top:14px;">
    <span class="field-label" style="min-width: 280px;">Name of person completing this form:</span>
    <span class="field-value">${d.thirdPartyName || "&nbsp;"}</span>
  </div>

  <div class="field-row" style="margin-top:14px;">
    <span class="field-label" style="min-width: 280px;">Signature of person completing this form:</span>
    <span class="field-value">${d.thirdPartySignature ? (d.thirdPartySignature.startsWith("data:image") || d.thirdPartySignature.startsWith("http") ? `<img src="${d.thirdPartySignature}" class="signature-img" alt="Third Party Signature" />` : d.thirdPartySignature) : "&nbsp;"}</span>
  </div>

  <p style="margin-top:16px;">Describe below how this person has legal authority to sign this form:</p>
  <div class="long-line" style="margin-top:8px;">${d.legalAuthorityDescription || "Legal guardian of"}</div>
  <div class="long-line">&nbsp;</div>
  <div class="long-line">&nbsp;</div>

  <p class="page-footer">Page 3 of 3</p>

</body>
</html>`;
};

export default generateBlankROIPrintHTML;
