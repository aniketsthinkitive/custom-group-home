/**
 * Generates a print-ready HTML document for the NH Bureau of Developmental Services
 * Service Agreement form — matching the official PDF layout (2-page form).
 */

interface ServiceAgreementFormData {
  // Step 1: General Information
  meetingDate?: string;
  startDate?: string;
  endDate?: string;
  certificationBeginDate?: string;
  certificationEndDate?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string;
  email?: string;
  phone?: string;
  midNumber?: string;
  mailingAddress?: string;
  mailingCityStZip?: string;
  residentialAddress?: string;
  residentialCityStZip?: string;
  region?: string;
  duckNumber?: string;
  waiver?: string;
  servicesDeliveredByPDMS?: boolean;
  // Guardian
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianAddress?: string;
  guardianCityStZip?: string;
  guardianType?: string;
  // Co-Guardian
  coGuardianName?: string;
  coGuardianPhone?: string;
  coGuardianEmail?: string;
  coGuardianAddress?: string;
  coGuardianCityStZip?: string;
  coGuardianType?: string;
  // 3rd Guardian
  thirdGuardianName?: string;
  thirdGuardianPhone?: string;
  thirdGuardianEmail?: string;
  thirdGuardianAddress?: string;
  thirdGuardianCityStZip?: string;
  thirdGuardianType?: string;
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  emergencyContactAddress?: string;
  emergencyContactCityStZip?: string;
  // Family Representative
  familyRepresentativeName?: string;
  familyRepresentativePhone?: string;
  familyRepresentativeEmail?: string;
  familyRepresentativeAddress?: string;
  familyRepresentativeCityStZip?: string;
  // Backup Provider
  backupProviderName?: string;
  backupProviderPhone?: string;
  backupProviderEmail?: string;
  backupProviderAddress?: string;
  backupProviderCityStZip?: string;

  // Step 2: Diagnoses
  allergies?: string;
  healthCareLevel?: string;
  medicallyFragile?: boolean;
  diagnosis1?: string;
  diagnosis2?: string;
  diagnosis3?: string;
  diagnosis4?: string;
  diagnosis5?: string;
  diagnosis6?: string;
  diagnosis7?: string;
  diagnosis8?: string;
  diagnosis9?: string;
  diagnosis10?: string;

  // Step 3: Guardianship
  isMinor?: boolean;
  noGuardian?: boolean;
  isGuardianNeeded?: boolean;
  guardianInProcess?: boolean;
  inProcessOfApplyingFor?: boolean;
  hasGuardian?: boolean;
  coGuardian?: boolean;
  thirdGuardian?: boolean;
  typeOfGuardianship?: string;
  coGuardianTypeOfGuardianship?: string;
  thirdGuardianTypeOfGuardianship?: string;
  comments?: string;

  // Step 4: Rep Payee
  hasRepPayee?: boolean;
  repPayeeName?: string;
  repPayeePhone?: string;
  repPayeeResidentialAddress?: string;
  repPayeeMailingAddress?: string;
  amountOfMonthlySpendingMoney?: string;
}

/** Render a filled value or a blank underline */
const f = (value?: string | boolean | null, width = "180px"): string => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return value
    ? `<span class="fv">${value}</span>`
    : `<span class="bl" style="min-width:${width}"></span>`;
};

/** Render checkbox */
const cb = (checked?: boolean, label?: string): string =>
  `<span class="cb">${checked ? "&#9745;" : "&#9744;"} <em>${label || ""}</em></span>`;

export const generateServiceAgreementPrintHTML = (
  formJson: ServiceAgreementFormData | Record<string, unknown>,
  _leadName?: string
): string => {
  const d = formJson as ServiceAgreementFormData;

  const individualName = [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ") || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Service Agreement</title>
  <style>
    @media print {
      @page { margin: 0.5in 0.6in; size: letter; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
      .no-break { page-break-inside: avoid; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      line-height: 1.35;
      color: #000;
      padding: 0.5in 0.6in;
    }

    /* ---- Header ---- */
    .hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .hdr-left { display: flex; align-items: center; gap: 18px; }
    .hdr-left .logo-text { font-weight: bold; font-size: 9pt; }
    .hdr-right { text-align: right; }
    .hdr-right .dept { font-weight: bold; font-size: 12pt; }
    .hdr-right .title { font-weight: bold; font-size: 16pt; }

    /* ---- Info box ---- */
    .info-box { border: 1px solid #000; border-collapse: collapse; width: 60%; margin: 0 auto 10px auto; font-size: 9pt; }
    .info-box td { border: 1px solid #000; padding: 2px 6px; }
    .info-box .lbl { font-weight: normal; }

    /* ---- Section heading ---- */
    .sec-title { font-size: 14pt; font-weight: bold; border-bottom: 1px solid #000; margin: 14px 0 8px 0; padding-bottom: 2px; }

    /* ---- Two-column layout ---- */
    .row { display: flex; gap: 20px; }
    .col { flex: 1; min-width: 0; }

    /* ---- Field row ---- */
    .fr { display: flex; align-items: baseline; margin-bottom: 3px; font-size: 10pt; }
    .fl { font-style: italic; min-width: 155px; flex-shrink: 0; }
    .fv { border-bottom: 1px solid #000; padding-bottom: 1px; }
    .bl { display: inline-block; border-bottom: 1px solid #000; min-width: 180px; height: 1.1em; vertical-align: bottom; }

    /* ---- Sub-section heading ---- */
    .sub-title { font-weight: bold; font-size: 11pt; margin: 10px 0 5px 0; }

    /* ---- Checkbox ---- */
    .cb { font-size: 10pt; margin-right: 14px; white-space: nowrap; }
    .cb em { font-style: italic; }
    .cb-row { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-bottom: 6px; }

    /* ---- Guardianship type row ---- */
    .gtype-row { display: flex; align-items: baseline; margin-bottom: 4px; gap: 6px; }
    .gtype-row .fl { min-width: 120px; }

    /* ---- Allergies box ---- */
    .allergy-box { border: 1px solid #000; min-height: 60px; padding: 4px 6px; margin-bottom: 8px; white-space: pre-wrap; font-size: 10pt; }

    /* ---- Diagnosis rows ---- */
    .diag-row { margin-bottom: 2px; }

    /* ---- Comments box ---- */
    .comments-box { border: 1px solid #000; min-height: 40px; padding: 4px 6px; font-size: 10pt; white-space: pre-wrap; }

    /* ---- Footer ---- */
    .page-footer { text-align: left; font-size: 9pt; margin-top: 20px; }
    .footer-row { display: flex; justify-content: space-between; }
  </style>
</head>
<body>

  <!-- ===================== PAGE 1 ===================== -->
  <!-- Header -->
  <div class="hdr">
    <div class="hdr-left">
      <span class="logo-text">HRST<br/><small>HEALTH RISK SCREENING TOOL</small></span>
      <span class="logo-text" style="font-size:10pt;">New Hampshire</span>
    </div>
    <div class="hdr-right">
      <div class="dept">NH Bureau of Developmental Services</div>
      <div class="title">Service Agreement</div>
    </div>
  </div>

  <!-- Info Box -->
  <table class="info-box">
    <tr>
      <td class="lbl">Individual</td>
      <td>${f(individualName, "150px")}</td>
      <td colspan="2"></td>
    </tr>
    <tr>
      <td class="lbl">Start Date</td>
      <td>${f(d.startDate, "100px")}</td>
      <td class="lbl">End Date</td>
      <td>${f(d.endDate, "100px")}</td>
    </tr>
    <tr>
      <td class="lbl">Waiver</td>
      <td>${f(d.waiver, "100px")}</td>
      <td class="lbl">Delivered by PDMS</td>
      <td>${d.servicesDeliveredByPDMS ? "Yes" : "No"}</td>
    </tr>
  </table>

  <!-- Section 1. General Information -->
  <div class="sec-title">1. General Information</div>

  <div class="row">
    <!-- Left column -->
    <div class="col">
      <div class="fr"><span class="fl">Meeting Date</span> ${f(d.meetingDate)}</div>
      <div class="fr"><span class="fl">Start Date</span> ${f(d.startDate)}</div>
      <div class="fr"><span class="fl">Certification Begin Date</span> ${f(d.certificationBeginDate, "120px")}</div>
      <div class="fr"><span class="fl">First Name</span> ${f(d.firstName)}</div>
      <div class="fr"><span class="fl">Last Name</span> ${f(d.lastName)}</div>
      <div class="fr"><span class="fl">Email</span> ${f(d.email)}</div>
      <div class="fr"><span class="fl">MID Number</span> ${f(d.midNumber)}</div>
      <div class="fr"><span class="fl">Mailing Address</span> ${f(d.mailingAddress)}</div>
      <div class="fr"><span class="fl">Residential Address</span> ${f(d.residentialAddress)}</div>
      <div class="fr"><span class="fl">DUCK#</span> ${f(d.duckNumber)}</div>
      <div class="fr"><span class="fl">Waiver</span> ${f(d.waiver)}</div>
    </div>
    <!-- Right column -->
    <div class="col">
      <div class="fr"><span class="fl">End Date</span> ${f(d.endDate)}</div>
      <div class="fr"><span class="fl">Certification End Date</span> ${f(d.certificationEndDate, "120px")}</div>
      <div class="fr">&nbsp;</div>
      <div class="fr"><span class="fl">Middle Name</span> ${f(d.middleName)}</div>
      <div class="fr"><span class="fl">DOB</span> ${f(d.dob)}</div>
      <div class="fr"><span class="fl">Phone</span> ${f(d.phone)}</div>
      <div class="fr">&nbsp;</div>
      <div class="fr"><span class="fl">Mailing City St. ZIP</span> ${f(d.mailingCityStZip)}</div>
      <div class="fr"><span class="fl">Residential City St. ZIP</span> ${f(d.residentialCityStZip)}</div>
      <div class="fr"><span class="fl">Region</span> ${f(d.region)}</div>
      <div class="fr"><span class="fl">Are these services delivered by PDMS?</span> ${d.servicesDeliveredByPDMS ? "Yes" : "No"}</div>
    </div>
  </div>

  <!-- Guardian / Co-Guardian -->
  <div class="row" style="margin-top:10px;">
    <div class="col">
      <div class="sub-title">Guardian</div>
      <div class="fr"><span class="fl">Guardian Name</span> ${f(d.guardianName)}</div>
      <div class="fr"><span class="fl">Phone</span> ${f(d.guardianPhone)}</div>
      <div class="fr"><span class="fl">Email</span> ${f(d.guardianEmail)}</div>
      <div class="fr"><span class="fl">Address</span> ${f(d.guardianAddress)}</div>
      <div class="fr"><span class="fl">City St. ZIP</span> ${f(d.guardianCityStZip)}</div>
      <div class="fr"><span class="fl">Type</span> ${f(d.guardianType)}</div>
    </div>
    <div class="col">
      <div class="sub-title">Co-Guardian</div>
      <div class="fr"><span class="fl">Co-Guardian Name</span> ${f(d.coGuardianName)}</div>
      <div class="fr"><span class="fl">Phone</span> ${f(d.coGuardianPhone)}</div>
      <div class="fr"><span class="fl">Email</span> ${f(d.coGuardianEmail)}</div>
      <div class="fr"><span class="fl">Address</span> ${f(d.coGuardianAddress)}</div>
      <div class="fr"><span class="fl">City St. ZIP</span> ${f(d.coGuardianCityStZip)}</div>
      <div class="fr"><span class="fl">Type</span> ${f(d.coGuardianType)}</div>
    </div>
  </div>

  <!-- 3rd Guardian / Emergency Contact -->
  <div class="row" style="margin-top:10px;">
    <div class="col">
      <div class="sub-title">3rd Guardian</div>
      <div class="fr"><span class="fl">3rd Guardian Name</span> ${f(d.thirdGuardianName)}</div>
      <div class="fr"><span class="fl">Phone</span> ${f(d.thirdGuardianPhone)}</div>
      <div class="fr"><span class="fl">Email</span> ${f(d.thirdGuardianEmail)}</div>
      <div class="fr"><span class="fl">Address</span> ${f(d.thirdGuardianAddress)}</div>
      <div class="fr"><span class="fl">City St. ZIP</span> ${f(d.thirdGuardianCityStZip)}</div>
      <div class="fr"><span class="fl">Type</span> ${f(d.thirdGuardianType)}</div>
    </div>
    <div class="col">
      <div class="sub-title">Emergency Contact</div>
      <div class="fr"><span class="fl">Emergency Contact</span> ${f(d.emergencyContactName)}</div>
      <div class="fr"><span class="fl">Relationship</span> ${f(d.emergencyContactRelationship)}</div>
      <div class="fr"><span class="fl">Phone</span> ${f(d.emergencyContactPhone)}</div>
      <div class="fr"><span class="fl">Email</span> ${f(d.emergencyContactEmail)}</div>
      <div class="fr"><span class="fl">Address</span> ${f(d.emergencyContactAddress)}</div>
      <div class="fr"><span class="fl">City St. ZIP</span> ${f(d.emergencyContactCityStZip)}</div>
    </div>
  </div>

  <!-- Family Representative / Backup Provider -->
  <div class="row" style="margin-top:10px;">
    <div class="col">
      <div class="sub-title">Family Representative</div>
      <div class="fr"><span class="fl">Family Representative</span> ${f(d.familyRepresentativeName)}</div>
      <div class="fr"><span class="fl">Phone</span> ${f(d.familyRepresentativePhone)}</div>
      <div class="fr"><span class="fl">Email</span> ${f(d.familyRepresentativeEmail)}</div>
      <div class="fr"><span class="fl">Address</span> ${f(d.familyRepresentativeAddress)}</div>
      <div class="fr"><span class="fl">City St. ZIP</span> ${f(d.familyRepresentativeCityStZip)}</div>
    </div>
    <div class="col">
      <div class="sub-title">Backup Provider</div>
      <div class="fr"><span class="fl">Backup Provider</span> ${f(d.backupProviderName)}</div>
      <div class="fr"><span class="fl">Phone</span> ${f(d.backupProviderPhone)}</div>
      <div class="fr"><span class="fl">Email</span> ${f(d.backupProviderEmail)}</div>
      <div class="fr"><span class="fl">Address</span> ${f(d.backupProviderAddress)}</div>
      <div class="fr"><span class="fl">City St. ZIP</span> ${f(d.backupProviderCityStZip)}</div>
    </div>
  </div>

  <div class="page-footer">
    <div class="footer-row">
      <span>Page 1/2</span>
    </div>
  </div>

  <!-- ===================== PAGE 2 ===================== -->
  <div class="page-break"></div>

  <!-- Header (repeated) -->
  <div class="hdr">
    <div class="hdr-left">
      <span class="logo-text">HRST<br/><small>HEALTH RISK SCREENING TOOL</small></span>
      <span class="logo-text" style="font-size:10pt;">New Hampshire</span>
    </div>
    <div class="hdr-right">
      <div class="dept">NH Bureau of Developmental Services</div>
      <div class="title">Service Agreement</div>
    </div>
  </div>

  <!-- Info Box (repeated) -->
  <table class="info-box">
    <tr>
      <td class="lbl">Individual</td>
      <td>${f(individualName, "150px")}</td>
      <td colspan="2"></td>
    </tr>
    <tr>
      <td class="lbl">Start Date</td>
      <td>${f(d.startDate, "100px")}</td>
      <td class="lbl">End Date</td>
      <td>${f(d.endDate, "100px")}</td>
    </tr>
    <tr>
      <td class="lbl">Waiver</td>
      <td>${f(d.waiver, "100px")}</td>
      <td class="lbl">Delivered by PDMS</td>
      <td>${d.servicesDeliveredByPDMS ? "Yes" : "No"}</td>
    </tr>
  </table>

  <!-- Section 2. Diagnoses -->
  <div class="sec-title">2. Diagnoses</div>

  <div style="margin-bottom:4px;"><em>Allergies</em></div>
  <div class="allergy-box">${d.allergies || ""}</div>

  <div class="row" style="margin-bottom:8px;">
    <div class="col">
      <div class="fr"><span class="fl">Health Care Level</span> ${f(d.healthCareLevel)}</div>
    </div>
    <div class="col">
      ${cb(d.medicallyFragile, "Medically Fragile")}
    </div>
  </div>

  ${[1,2,3,4,5,6,7,8,9,10].map(n => {
    const val = (d as any)[`diagnosis${n}`];
    return `<div class="diag-row"><span class="fl">Diagnosis</span> ${f(val)}</div>`;
  }).join("\n  ")}

  <!-- Section 3. Guardianship -->
  <div class="sec-title">3. Guardianship</div>

  <div class="cb-row">
    ${cb(d.isMinor, "Is Minor")}
    ${cb(d.noGuardian, "No Guardian")}
    ${cb(d.isGuardianNeeded, "Is a Guardian needed?")}
    ${cb(d.guardianInProcess, "Guardian In Process")}
  </div>
  <div class="cb-row">
    ${cb(d.inProcessOfApplyingFor, "In Process of Applying For")}
  </div>

  <div class="gtype-row">
    ${cb(d.hasGuardian, "Has Guardian")}
    <span class="fl">Type of Guardianship</span> ${f(d.typeOfGuardianship)}
  </div>
  <div class="gtype-row">
    ${cb(d.coGuardian, "Co-Guardian")}
    <span class="fl">Type of Guardianship</span> ${f(d.coGuardianTypeOfGuardianship)}
  </div>
  <div class="gtype-row">
    ${cb(d.thirdGuardian, "3rd Guardian")}
    <span class="fl">Type of Guardianship</span> ${f(d.thirdGuardianTypeOfGuardianship)}
  </div>

  <div style="margin-top:4px;"><em>Comments</em></div>
  <div class="comments-box">${d.comments || ""}</div>

  <!-- Section 4. Rep Payee -->
  <div class="sec-title">4. Rep Payee</div>

  <div style="margin-bottom:6px;">
    ${cb(d.hasRepPayee, "Rep Payee")}
  </div>

  <div class="fr"><span class="fl">Rep Payee</span> ${f(d.repPayeeName)}</div>
  <div class="fr"><span class="fl">Phone</span> ${f(d.repPayeePhone)}</div>
  <div class="fr"><span class="fl">Residential Address</span> ${f(d.repPayeeResidentialAddress)}</div>
  <div class="fr"><span class="fl">Mailing Address</span> ${f(d.repPayeeMailingAddress)}</div>
  <div class="fr"><span class="fl">Amount of monthly spending money</span> ${f(d.amountOfMonthlySpendingMoney)}</div>

  <div class="page-footer">
    <div class="footer-row">
      <span>Page 2/2</span>
    </div>
  </div>

</body>
</html>`;
};

export default generateServiceAgreementPrintHTML;
