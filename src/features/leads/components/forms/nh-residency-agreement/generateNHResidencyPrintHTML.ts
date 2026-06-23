/**
 * Generates a print-ready HTML document for the NH Residency Agreement form.
 * If formJson contains filled data, the fields are populated; otherwise blank lines are shown.
 */

interface NHResidencyFormData {
  residentName?: string;
  providerName?: string;
  residentialAddress?: string;
  residencyTermFrom?: string;
  residencyTermTo?: string;
  residentSignature?: string;
  residentSignatureDate?: string;
  residentPrintName?: string;
  legalGuardianSignature?: string;
  legalGuardianSignatureDate?: string;
  legalGuardianPrintName?: string;
  providerSignature?: string;
  providerSignatureDate?: string;
  providerPrintName?: string;
}

/** Render a filled value or a blank underline */
const field = (value?: string, width = "280px"): string =>
  value
    ? `<span class="filled-value">${value}</span>`
    : `<span class="blank-line" style="min-width:${width}"></span>`;

/** Render a signature image or blank line */
const signatureField = (value?: string): string => {
  if (value && (value.startsWith("data:image") || value.startsWith("http"))) {
    return `<img src="${value}" class="signature-img" alt="Signature" />`;
  }
  return `<span class="blank-line" style="min-width:320px"></span>`;
};

export const generateNHResidencyPrintHTML = (
  formJson: NHResidencyFormData | Record<string, unknown>,
  leadName?: string
): string => {
  const d = formJson as NHResidencyFormData;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title></title>
  <style>
    @media print {
      @page { margin: 0; size: letter; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0.6in 0.75in; }
      .page-break { page-break-before: always; padding-top: 0.6in; }
      .no-break { page-break-inside: avoid; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #000;
      padding: 0.6in 0.75in;
    }
    h1 {
      text-align: center;
      font-size: 20pt;
      font-weight: normal;
      margin-bottom: 20px;
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    }
    .section-heading {
      font-weight: bold;
      font-size: 11pt;
      text-decoration: underline;
      margin-top: 16px;
      margin-bottom: 8px;
      background-color: #d6e4f0;
      padding: 3px 4px;
    }
    .sub-heading {
      font-weight: bold;
      font-size: 11pt;
      text-decoration: underline;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    p { margin-bottom: 4px; }
    .blank-line {
      display: inline-block;
      border-bottom: 1px solid #000;
      min-width: 200px;
      height: 1.2em;
      vertical-align: bottom;
    }
    .filled-value {
      display: inline;
      border-bottom: 1px solid #000;
      padding-bottom: 1px;
    }
    ol {
      list-style: none;
      counter-reset: roman;
      padding-left: 0;
      margin-bottom: 4px;
    }
    ol > li {
      counter-increment: roman;
      margin-bottom: 6px;
      padding-left: 48px;
      position: relative;
      text-align: justify;
    }
    ol > li::before {
      content: counter(roman, upper-roman) ".";
      position: absolute;
      left: 0;
      width: 40px;
      text-align: right;
      padding-right: 8px;
    }
    ol.sub-list {
      counter-reset: alpha;
      margin-top: 4px;
    }
    ol.sub-list > li {
      counter-increment: alpha;
      padding-left: 30px;
    }
    ol.sub-list > li::before {
      content: counter(alpha, lower-alpha) ".";
      width: 22px;
    }
    .sig-section { margin-top: 20px; }
    .sig-row {
      display: flex;
      align-items: flex-end;
      gap: 40px;
      margin-bottom: 6px;
      margin-top: 24px;
    }
    .sig-col {
      display: flex;
      flex-direction: column;
    }
    .sig-col.name { flex: 1.4; }
    .sig-col.date { flex: 1; }
    .sig-line {
      border-bottom: 1px solid #000;
      min-height: 28px;
      display: flex;
      align-items: flex-end;
    }
    .sig-label {
      font-size: 10pt;
      margin-top: 2px;
    }
    .signature-img {
      max-height: 50px;
      max-width: 250px;
      display: block;
    }
    .page-footer {
      text-align: right;
      font-size: 9pt;
      margin-top: 30px;
      color: #333;
    }
    .address-labels {
      display: flex;
      gap: 0;
      font-size: 8pt;
      color: #555;
      padding-left: 198px;
    }
    .address-labels span { margin-right: 80px; }
  </style>
</head>
<body>

  <!-- =============== PAGE 1 =============== -->
  <h1>New Hampshire Residency Agreement</h1>

  <p class="section-heading">Residency Terms</p>

  <ol>
    <li>
      The residency agreement is between ${field(d.residentName || leadName, "320px")} and the
      provider, ${field(d.providerName, "240px")}.
    </li>
    <li>
      The residential address is ${field(d.residentialAddress, "400px")}.
      <div class="address-labels">
        <span>Street Address</span>
        <span>City</span>
        <span>ST</span>
        <span>Zip</span>
      </div>
    </li>
    <li>
      The residency agreement is renewed on an annual basis, at the time of the Annual Service Agreement.
      The duration of this term is from ${field(d.residencyTermFrom, "130px")} to ${field(d.residencyTermTo, "130px")}.
    </li>
    <li>
      The resident or provider may request a team meeting at any time to discuss the terms of this agreement.
    </li>
    <li>
      Upon termination of this residency agreement, the resident shall be entitled to all personal property as
      reflected on the most current inventory of the resident&rsquo;s property.
    </li>
  </ol>

  <p class="sub-heading">Your Rights as a Resident:</p>
  <ol>
    <li>To enter into this enforceable residency agreement.</li>
    <li>Privacy in your sleeping or living unit.</li>
    <li>Lockable doors to your sleeping or living unit with only appropriate staff having keys to doors.</li>
    <li>Ability to have visitors of your choosing at any time.</li>
    <li>Choice of furnishings and decorations in your sleeping or living unit.</li>
    <li>Choice of a roommate, if bedrooms are shared.</li>
    <li>Access to food at any time.</li>
    <li>Modifications to the above-noted rights in accordance with He-M 310.09(h) and (i).</li>
    <li>An inventory of personal property (valued at $25 or more, as well as any item of sentimental value to
    you) will occur on the day of move-in and will be updated quarterly to ensure accuracy.</li>
    <li>A setting that is physically accessible.</li>
    <li>All rights under He-M 310, including those noted above.</li>
  </ol>

  <p class="sub-heading">Your Responsibilities as a Resident:</p>
  <ol>
    <li>Maintain cleanliness of your sleeping or living unit and shared living spaces.</li>
    <li>Review and sign a complete inventory of personal property (valued at $25 or more, as well as any item of
    sentimental value to you) on the day of move-in, quarterly to ensure accuracy, and on the day of departure
    of the residence.</li>
  </ol>

  <p class="sub-heading">Your Responsibilities as a Provider:</p>
  <ol>
    <li>Maintain a safe residential environment.</li>
    <li>Always treat the resident with dignity and respect.</li>
    <li>Implement the resident&rsquo;s approved Individual Service Agreement and approved behavior support plan.</li>
    <li>Provide services in accordance with all applicable State regulations, and the contract with the provider agency.</li>
    <li style="counter-increment: roman 2;">Assist, as necessary, the resident to develop and maintain an inventory of personal property (valued at
    $25 or more, as well as any item of sentimental value to the resident) and ensure that upon termination
    of this agreement, the resident receives all personal property on the most recent inventory.</li>
  </ol>

  <p class="page-footer">June 2023&nbsp;&nbsp;&nbsp;1</p>

  <!-- =============== PAGE 2 =============== -->
  <div class="page-break"></div>

  <h1>New Hampshire Residency Agreement</h1>

  <p class="section-heading">If the Provider Chooses to End the Residency Agreement:</p>

  <ol>
    <li>
      The provider shall notify the resident, legal guardian (if applicable), and service coordinator in writing of the
      intended termination of the residency agreement and the reason(s) therefor, at least 90 calendar days
      before the proposed termination date of the residency agreement, and in an agency residence, inform the
      resident that this notice is not an order requiring them to vacate the residence, and include the rights of the
      resident to appeal the provider&rsquo;s decision to terminate the residency agreement in accordance with He-M 310.12.
    </li>
    <li>
      The resident, or legal guardian if applicable, shall have the right to request a team meeting to discuss
      whether the provider would reconsider the notice.
    </li>
    <li>
      Upon receipt of the notice required in I. above, the service coordinator shall convene a team meeting within
      ten calendar days to develop a transition plan for the resident in order to ensure an appropriate transition
      to an alternative residence.
    </li>
    <li>
      In cases where the behavior of the resident poses a serious threat of bodily harm to the provider or others
      living in the residence, or substantial damage to the residence or property, the provider shall notify the
      resident, legal guardian (if applicable), and the service coordinator of the situation and provide 72 hours&rsquo;
      notice before the proposed termination date, and in an agency residence, inform the resident that this
      notice is not an order requiring them to vacate the residence, and include the rights of the resident to appeal
      the provider&rsquo;s decision to terminate the residency agreement in accordance with He-M 310.12.
    </li>
    <li>
      Upon receipt of notification in IV. above, the service coordinator, or designee, shall immediately convene a
      team meeting within 24 hours to determine and take the appropriate course of action to ensure the
      resident&rsquo;s health and safety, and ensure that the resident has access to an alternative safe residence.
    </li>
    <li>
      If the provider is an agency residence, if the resident fails to vacate the residence by the proposed
      termination date, the provider shall issue a notice to the resident or legal guardian, if applicable, for the
      resident to vacate the residence within 3 days, and include the rights of the resident to appeal the notice in
      accordance with He-M 310.12 and remain in the residence in accordance with He-M 310.12(d).
    </li>
    <li>
      In the absence of the conditions for termination provided in IV. above, an agency residence shall only
      terminate this agreement if the termination is necessary for the resident&rsquo;s welfare and the resident&rsquo;s needs
      can no longer be met at the agency residence, the residence ceases to operate, or for other good cause as
      provided in He-M 310.10(c)(7)c.
    </li>
  </ol>

  <p class="section-heading">If the Resident Chooses to End the Residency Agreement:</p>

  <ol>
    <li>
      The resident, or legal guardian if applicable, will notify the provider and service coordinator in writing of the
      intended termination of the residency agreement 90 calendar days prior to the proposed termination date.
    </li>
    <li>
      In cases where the behavior of the provider poses a serious threat of bodily harm to the resident or others
      living in the residence, or substantial damage to the residence or property:
      <ol class="sub-list">
        <li>The resident, or guardian if applicable, shall notify the service coordinator of the situation.</li>
        <li>The provider shall receive 72 hours&rsquo; notice before the proposed termination date.</li>
      </ol>
    </li>
    <li>
      Upon receipt of notification in II. above, the Service Coordinator, or designee, shall:
      <ol class="sub-list">
        <li>Immediately convene a team meeting, in accordance with the requirements of He-M 503, within 24
        hours to determine the appropriate course of action to ensure the resident&rsquo;s health and safety, and that
        the resident has access to an alternative safe residence, and</li>
        <li>Ensure that the complaint procedure in He-M 202 is initiated.</li>
      </ol>
    </li>
  </ol>

  <p class="page-footer">June 2023&nbsp;&nbsp;&nbsp;2</p>

  <!-- =============== PAGE 3 =============== -->
  <div class="page-break"></div>

  <h1>New Hampshire Residency Agreement</h1>

  <div class="sig-section">
    <p class="section-heading">Signatures:</p>

    <!-- Resident Signature -->
    <div class="sig-row">
      <div class="sig-col name">
        <div class="sig-line">${signatureField(d.residentSignature)}</div>
        <div class="sig-label">Individual/Resident</div>
      </div>
      <div class="sig-col date">
        <div class="sig-line">${d.residentSignatureDate ? `<span class="filled-value">${d.residentSignatureDate}</span>` : "&nbsp;"}</div>
        <div class="sig-label">Date</div>
      </div>
    </div>

    <!-- Legal Guardian Signature -->
    <div class="sig-row">
      <div class="sig-col name">
        <div class="sig-line">${signatureField(d.legalGuardianSignature)}</div>
        <div class="sig-label">Legal Guardian (if applicable)</div>
      </div>
      <div class="sig-col date">
        <div class="sig-line">${d.legalGuardianSignatureDate ? `<span class="filled-value">${d.legalGuardianSignatureDate}</span>` : "&nbsp;"}</div>
        <div class="sig-label">Date</div>
      </div>
    </div>

    <!-- Provider Signature -->
    <div class="sig-row">
      <div class="sig-col name">
        <div class="sig-line">${signatureField(d.providerSignature)}</div>
        <div class="sig-label">Provider</div>
      </div>
      <div class="sig-col date">
        <div class="sig-line">${d.providerSignatureDate ? `<span class="filled-value">${d.providerSignatureDate}</span>` : "&nbsp;"}</div>
        <div class="sig-label">Date</div>
      </div>
    </div>
  </div>

  <p class="page-footer">June 2023&nbsp;&nbsp;&nbsp;3</p>

</body>
</html>`;
};

export default generateNHResidencyPrintHTML;
