/**
 * Generates a print-ready HTML document for the CAFC House Rules form.
 * If formJson contains filled data, the signature fields are populated; otherwise blank lines are shown.
 */

interface HouseRulesFormData {
  program_manager_name?: string;
  program_manager_date?: string;
  guardian_signature?: string;
  guardian_date?: string;
  case_manager_signature?: string;
  case_manager_date?: string;
  client_signature?: string;
  client_date?: string;
  // Legacy field names used by older signed documents
  legalGuardianSignature?: string;
  legalGuardianSignatureDate?: string;
}

/** Render a filled value or a blank underline */
const field = (value?: string, width = "200px"): string =>
  value
    ? `<span class="filled-value">${value}</span>`
    : `<span class="blank-line" style="min-width:${width}"></span>`;

/** Render a signature image or blank line */
const signatureField = (value?: string, width = "260px"): string => {
  if (value && (value.startsWith("data:image") || value.startsWith("http"))) {
    return `<img src="${value}" class="signature-img" alt="Signature" />`;
  }
  if (value) {
    return `<span class="filled-value">${value}</span>`;
  }
  return `<span class="blank-line" style="min-width:${width}"></span>`;
};

export const generateHouseRulesPrintHTML = (
  formJson: HouseRulesFormData | Record<string, unknown>,
  _leadName?: string
): string => {
  const raw = formJson as HouseRulesFormData;
  // Backward-compatibility: fall back to legacy camelCase field names
  // for documents signed before the field-name fix was applied.
  const d: HouseRulesFormData = {
    ...raw,
    guardian_signature: raw.guardian_signature || raw.legalGuardianSignature,
    guardian_date: raw.guardian_date || raw.legalGuardianSignatureDate,
  };


  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Custom Group Home House Rules</title>
  <style>
    @media print {
      @page { margin: 0.7in 0.85in; size: letter; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
      .no-break { page-break-inside: avoid; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      padding: 0.7in 0.85in;
    }
    h1 {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 4px;
    }
    h2 {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 24px;
    }
    ul {
      list-style: disc;
      margin-left: 28px;
      margin-bottom: 0;
    }
    ul > li {
      margin-bottom: 10px;
      text-align: justify;
      line-height: 1.45;
    }
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
    .damage-title {
      text-align: center;
      font-weight: bold;
      text-decoration: underline;
      font-size: 12pt;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    ul.damage-list {
      list-style: disc;
      margin-left: 28px;
    }
    ul.damage-list > li {
      font-weight: bold;
      margin-bottom: 6px;
    }
    .disclaimer {
      font-style: italic;
      margin-top: 24px;
      margin-bottom: 28px;
      line-height: 1.5;
    }
    .sig-row {
      display: flex;
      align-items: flex-end;
      margin-bottom: 18px;
    }
    .sig-label {
      font-weight: bold;
      font-size: 12pt;
      min-width: 210px;
      flex-shrink: 0;
    }
    .sig-value {
      flex: 1;
      border-bottom: 1px solid #000;
      min-height: 26px;
      display: flex;
      align-items: flex-end;
      padding-left: 4px;
    }
    .sig-date-label {
      font-weight: bold;
      font-size: 12pt;
      margin-left: 30px;
      min-width: 55px;
      flex-shrink: 0;
    }
    .sig-date-value {
      min-width: 90px;
      border-bottom: 1px solid #000;
      min-height: 26px;
      display: flex;
      align-items: flex-end;
      padding-left: 4px;
    }
    .signature-img {
      max-height: 45px;
      max-width: 220px;
      display: block;
    }
    .page-footer {
      text-align: center;
      font-size: 10pt;
      margin-top: 30px;
      color: #333;
    }
  </style>
</head>
<body>

  <!-- =============== PAGE 1 =============== -->
  <h1>Common Actions For Change</h1>
  <h2>HOUSE RULES</h2>

  <ul>
    <li>
      All persons should be treated with dignity and respect. Use a level voice
      tone, knock before entering doors, no property destruction (see note below
      for property destruction)
    </li>
    <li>
      It is asked that you follow your daily schedule and participate in
      programming activities.
    </li>
    <li>
      Smoking in designated areas only. Smoking is not allowed in company
      vehicles or staff vehicles.
    </li>
    <li>
      To allow for adequate rest, individuals should be in their rooms from
      10:45pm until 6am. Individuals should let staff know if they need to smoke
      at night and limit cigarette times to 10 minutes overnight. Individuals
      should not congregate outside to smoke overnight.
    </li>
    <li>
      Please use your bedroom for naps and for sleeping.
    </li>
    <li>
      Quiet time is between 9pm and 6am. Always keep music and television at
      appropriate levels and avoid loud activities that may disturb the other
      individuals in the house.
    </li>
    <li>
      Meals will be eaten in the kitchen and dining areas. Snacks and drinks are
      allowed in the common areas. Drinks are allowed in bedrooms, but please
      limit food items. Please make sure to clean up after yourself.
    </li>
    <li>
      Hand washing and/or gloves are required for food handling and meal
      preparation.
    </li>
    <li>
      Mealtimes are from 7:30-9:00am, 11:30-12:30pm, and 4:30-6:15pm. Snacks
      are available upon request at any time. Food is always available to
      individuals. The kitchen should not be used to cook full meals during quiet
      time (unless permission is given i.e. an appointment ran late or individuals
      haven&rsquo;t had a meal yet).
    </li>
    <li>
      Cabinets can and will be locked for safety reasons, no food cabinets will be
      locked unless requested by an individual (to prevent food from being
      stolen), and will be immediately unlocked at the request of the individual
      who&rsquo;s food items are locked.
    </li>
    <li>
      Individuals may not record or take photos of other individuals at any time.
    </li>
  </ul>

  <p class="page-footer">1</p>

  <!-- =============== PAGE 2 =============== -->
  <div class="page-break"></div>

  <ul>
    <li>
      All individuals have individual programs that they are working on to
      transition. Do not discuss your program or another individuals&rsquo; program as
      it may be different than yours.
    </li>
    <li>
      Individuals should be dressed appropriately when in common areas. This
      means wearing shoes/slippers and being fully clothed. Individuals should
      use an appropriate cover when in nightclothes (i.e. robe, pants or shorts
      not boxers or briefs, proper top covering shirt, t-shirt).
    </li>
    <li>
      No visitors before 8am or after 9pm. Exceptions may be made on an
      individual basis. Notice for visitors will require at least 24-hour notification
      and need to be approved by the House Coordinator or Program Manager.
      Please refrain from having unscheduled or &ldquo;pop&rdquo; in visits.
    </li>
    <li>
      Seatbelts are required in company vehicles and staff vehicles.
    </li>
    <li>
      Do not horseplay as it could cause injury or be misinterpreted as aggression
      or fighting.
    </li>
    <li>
      Individuals are not to use alcohol or drugs at any time.
    </li>
    <li>
      Lighters are not permitted to be held by individuals or on the premises.
      There are flameless lighters placed in the designated smoking areas. We are
      a flameless home.
    </li>
    <li>
      Selling, buying, borrowing, bartering, or contracting (of any kind) with other
      individuals is prohibited. (i.e., money, cigarettes, personal items, foods)
    </li>
    <li>
      Stealing of any kind is prohibited.
    </li>
    <li>
      Individuals are not allowed to purchase over-the-counter medications. All
      medications, including over-the-counter medications, must have a doctor&rsquo;s
      orders and be stored in the medication cart.
    </li>
    <li>
      Individuals are not allowed to enter other individuals&rsquo; bedrooms unless
      specific permission is given.
    </li>
    <li>
      Any physical incidents, sign of discomfort, or other sicknesses or areas of
      concern should be reported to staff and/or supervisor on duty.
    </li>
    <li>
      Property Damage is the responsibility of the individual/rep payee of the
      individual that causes the damage. Restitution is broken down by the
      matrix below:
    </li>
  </ul>

  <p class="damage-title">Property Damage Consequence Matrix</p>

  <ul class="damage-list">
    <li>$50 per hole in the wall</li>
    <li>$100 per damaged window</li>
    <li>$50 for damage to small furniture (love seats, dining room chairs, etc.)</li>
  </ul>

  <p class="page-footer">2</p>

  <!-- =============== PAGE 3 =============== -->
  <div class="page-break"></div>

  <ul class="damage-list">
    <li>$100 for damage to big furniture (couches, beds, tables)</li>
    <li>$100 for electronics under $500</li>
    <li>$200 for electronics over $500</li>
    <li>$150 per damaged door if it is a regular door</li>
    <li>$300 per damaged door if it has magnetic locks</li>
    <li>$500 per damaged car</li>
  </ul>

  <p class="disclaimer">
    The above rules are designed to address general expectations of individuals.
    These rules may not address every situation that arises within the home and
    community. Individuals should consult with staff for feedback and direction
    when new situations arise or consult with the treatment team.
  </p>

  <!-- Signatures -->
  <div class="no-break">
    <div class="sig-row">
      <span class="sig-label">Program Manager:</span>
      <span class="sig-value">${signatureField(d.program_manager_name, "220px")}</span>
      <span class="sig-date-label">DATE:</span>
      <span class="sig-date-value">${field(d.program_manager_date, "90px")}</span>
    </div>

    <div class="sig-row">
      <span class="sig-label">Guardian Signature:</span>
      <span class="sig-value">${signatureField(d.guardian_signature, "220px")}</span>
      <span class="sig-date-label">DATE:</span>
      <span class="sig-date-value">${field(d.guardian_date, "90px")}</span>
    </div>

    <div class="sig-row">
      <span class="sig-label">Case Manager Signature:</span>
      <span class="sig-value">${signatureField(d.case_manager_signature, "220px")}</span>
      <span class="sig-date-label">DATE:</span>
      <span class="sig-date-value">${field(d.case_manager_date, "90px")}</span>
    </div>

    <div class="sig-row">
      <span class="sig-label">Client Signature:</span>
      <span class="sig-value">${signatureField(d.client_signature, "220px")}</span>
      <span class="sig-date-label">DATE:</span>
      <span class="sig-date-value">${field(d.client_date, "90px")}</span>
    </div>
  </div>

  <p class="page-footer">3</p>

</body>
</html>`;
};

export default generateHouseRulesPrintHTML;
