import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Type definitions for incident data
interface IncidentPDFData {
  // Individual details
  individualName?: string;
  dob?: string;
  region?: string;
  dateOfIncident?: string;
  timeOfIncident?: string;
  locationOfIncident?: string;
  agencyName?: string;

  // Incident types
  medicalFlags?: Array<{ medical_type: string }>;
  legalFlags?: Array<{ legal_type: string }>;
  socialFlags?: Array<{ social_type: string }>;
  victimFlags?: Array<{ victim_type: string }>;
  medicalOther?: string;
  socialOther?: string;

  // Narrative sections
  preIncidentNotes?: string;
  incidentDescription?: string;
  responseAction?: string;

  // Reporter info
  reporterSignatureUrl?: string;
  reporterDate?: string;
  reporterTime?: string;
  reporterName?: string;
  reporterTitle?: string;

  // Notifications
  notifications?: Array<{
    user_name?: string | null;
    user_email?: string | null;
    type?: string;
    notify_date?: string | null;
    notify_time?: string | null;
    method_of_contact?: string | null;
    by_whom?: string | null;
    created_at?: string;
  }>;

  // Reviews
  programManagerReview?: string;
  programType?: string;
  /** Tri-state: "Yes" / "No" / "" (not answered). */
  serviceTransition?: boolean | "Yes" | "No" | "";
  serviceTransitionDescription?: string;
  behaviorPlanFollowed?: string; // "Yes", "No", "N/A"
  programManagerSignatureUrl?: string;
  programManagerDate?: string;
  programManagerTime?: string;
  programManagerName?: string;
  programManagerTitle?: string;

  serviceCoordinatorReview?: string;
  teamMeetingRequired?: boolean;
  serviceCoordinatorSignatureUrl?: string;
  serviceCoordinatorDate?: string;
  serviceCoordinatorTime?: string;
  serviceCoordinatorName?: string;
  serviceCoordinatorTitle?: string;

  // Page 1 header
  dateAAReceivedIR?: string;
}

// Map medical types to display labels
const medicalTypeMap: Record<string, string> = {
  'hospitalization_medical': 'Hospitalization - medical - admittance not ER visit',
  'hospitalization_psychiatric': 'Hospitalization - psychiatric - admittance not ER visit',
  'injury_no_intervention': 'Injury of individual not requiring medical intervention*',
  'injury_with_intervention': 'Injury of individual requiring medical intervention*',
  'illness_no_intervention': 'Illness of individual not requiring medical intervention*',
  'illness_with_intervention': 'Illness of individual requiring medical intervention*',
  'seizure': 'Seizure',
  'medication_refusal': 'Medication refusal',
  'fall': 'Fall',
  'other': 'Other:',
};

// Map legal types to display labels
const legalTypeMap: Record<string, string> = {
  'client_rights_violation': 'Possible/suspected violation of client rights (i.e. potential abuse, neglect, exploitation, or service rights violation)',
  'missing_eloped': 'Individual missing/eloped (even temporarily)',
  'police_involvement': 'Police involvement',
};

// Map social types to display labels
const socialTypeMap: Record<string, string> = {
  'behavior_no_plan': 'Behavior incident - no behavior plan',
  'behavior_with_plan': 'Behavior incident w/behavior plan',
  'mental_health_episode': 'Mental Health episode (suicidal ideation, unusual emotional moods, etc.)',
  'physical_restraint': 'Physical Restraint utilized',
  'other': 'Other:',
};

// Map victim types to display labels
const victimTypeMap: Record<string, string> = {
  'theft': 'Theft',
  'assault': 'Assault',
  'sexual_assault': 'Sexual Assault',
  'car_accident': 'Car Accident',
  'fire_hazard_arson': 'Fire hazard/arson',
};

// Map notification types to relationship labels
const notificationTypeMap: Record<string, string> = {
  'SERVICE_COORDINATOR': 'Area Agency',
  'PROGRAM_MANAGER': 'Program Manager',
  'GUARDIAN': 'Guardian',
  'ADDITIONAL_SERVICE_PROVIDER': 'Program Coordinator',
  'NURSING': 'Nurse',
};

// Map region slug stored in the DB to the human label used in the form dropdown.
// Mirrors regionOptions in AddNewIncidentDrawer.tsx.
const regionLabelMap: Record<string, string> = {
  northern_human_services: 'Northern Human Services',
  pathways_of_the_river_valley: 'PathWays of the River Valley',
  lakes_region_community_services: 'Lakes Region Community Services',
  community_bridges: 'Community Bridges',
  monadnock_developmental_services: 'Monadnock Developmental Services',
  gateways_community_services: 'Gateways Community Services',
  the_moore_center: 'The Moore Center',
  one_sky_community_services: 'One Sky Community Services',
  community_partners: 'Community Partners',
  community_crossroads: 'Community Crossroads',
};

function formatRegion(slug?: string | null): string {
  if (!slug) return '';
  return regionLabelMap[slug] || slug.replace(/_/g, ' ');
}

// Format date from ISO string to MM/DD/YYYY
function formatDate(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return dateString;
  }
}

// Format datetime to time (HH:MM AM/PM)
function formatTime(dateTimeString?: string | null): string {
  if (!dateTimeString) return '';
  try {
    const date = new Date(dateTimeString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutes).padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch {
    return dateTimeString;
  }
}

// Extract date and time from ISO datetime string
function extractDateAndTime(dateTimeString?: string | null): { date: string; time: string; ampm: 'am' | 'pm' } {
  if (!dateTimeString) return { date: '', time: '', ampm: 'am' };
  try {
    const date = new Date(dateTimeString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutes).padStart(2, '0');
    return {
      date: `${month}/${day}/${year}`,
      time: `${displayHours}:${displayMinutes}`,
      ampm,
    };
  } catch {
    return { date: dateTimeString, time: '', ampm: 'am' };
  }
}

// Transform API response to PDF data format
export function transformIncidentDataToPDF(apiResponse: any): IncidentPDFData {
  const data = apiResponse?.data || apiResponse;

  const incidentDateTime = extractDateAndTime(data.incident_datetime);

  return {
    individualName: data.resident_details
      ? `${data.resident_details.first_name || ''} ${data.resident_details.last_name || ''}`.trim()
      : '',
    dob: formatDate(data.resident_details?.date_of_birth),
    region: formatRegion(data.region),
    dateOfIncident: incidentDateTime.date,
    timeOfIncident: incidentDateTime.time,
    locationOfIncident: data.location || '',
    agencyName: data.agency_name || '',

    medicalFlags: data.medical_flags || [],
    legalFlags: data.legal_flags || [],
    socialFlags: data.social_flags || [],
    victimFlags: data.victim_flags || [],
    medicalOther:
      (data.medical_flags?.find((f: any) => f.medical_type === "other") as any)
        ?.medical_other_details ?? "",
    socialOther:
      (data.social_flags?.find((f: any) => f.social_type === "other") as any)
        ?.social_other_details ?? "",

    preIncidentNotes: data.pre_incident_notes || '',
    incidentDescription: data.incident_description || '',
    responseAction: data.response_action || '',

    reporterSignatureUrl: data.reporter_signature_url || data.signature_url || '',
    reporterDate: formatDate(data.signature?.uploaded_at || data.created_at),
    reporterTime: formatTime(data.signature?.uploaded_at || data.created_at),
    reporterName: (() => {
      // Priority 1: The actual DSP who signed the incident (signature.uploaded_by)
      const signer = data.signature?.uploaded_by;
      if (signer) {
        const full = `${signer.first_name || ''} ${signer.last_name || ''}`.trim();
        if (full) return full;
      }
      // Priority 2: Fall back to reported_by_details
      const rb = data.reported_by_details;
      if (!rb) return '';
      return `${rb.first_name || ''} ${rb.last_name || ''}`.trim();
    })(),
    reporterTitle: '',

    notifications: data.notifications || [],

    programManagerReview: data.pm_review_notes || '',
    programType: data.pm_program_type || '',
    serviceTransition:
      data.pm_service_transition === 'YES'
        ? 'Yes'
        : data.pm_service_transition === 'NO'
          ? 'No'
          : '',
    serviceTransitionDescription: data.pm_service_transition_description || '',
    behaviorPlanFollowed:
      data.pm_behavior_plan_followed === 'YES'
        ? 'Yes'
        : data.pm_behavior_plan_followed === 'NO'
          ? 'No'
          : data.pm_behavior_plan_followed === 'N_A'
            ? 'N/A'
            : '',
    programManagerSignatureUrl: data.pm_signature_url || '',
    programManagerDate: formatDate(data.completed_at),
    programManagerTime: formatTime(data.completed_at),
    programManagerName: (() => {
      const signer = data.pm_signature?.uploaded_by;
      if (signer) {
        const full = `${signer.first_name || ''} ${signer.last_name || ''}`.trim();
        if (full) return full;
      }
      return data.assigned_program_manager
        ? `${data.assigned_program_manager.first_name || ''} ${data.assigned_program_manager.last_name || ''}`.trim()
        : '';
    })(),
    programManagerTitle: '',

    serviceCoordinatorReview: '',
    teamMeetingRequired: false,
    serviceCoordinatorSignatureUrl: '',
    serviceCoordinatorDate: '',
    serviceCoordinatorTime: '',
    serviceCoordinatorName: '',
    serviceCoordinatorTitle: '',

    dateAAReceivedIR: formatDate(data.received_date),
  };
}

// Create HTML template for the PDF
function createHTMLTemplate(data: IncidentPDFData): string {
  const incidentDateTime = extractDateAndTime(
    data.dateOfIncident && data.timeOfIncident
      ? `${data.dateOfIncident} ${data.timeOfIncident}`
      : null
  );

  // Check which medical flags are selected
  const medicalChecks = Object.keys(medicalTypeMap).map(type => {
    const isChecked = data.medicalFlags?.some(f => f.medical_type === type);
    if (type === 'other' && isChecked) {
      return `<div style="display: flex; align-items: center; margin-bottom: 2px;"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle; flex-shrink: 0;"><span style="vertical-align: middle;">${medicalTypeMap[type]} <span style="border-bottom: 1px solid black; display: inline-block; min-width: 200px; margin-left: 5px;">${data.medicalOther || ''}</span></span></div>`;
    }
    return `<div style="display: flex; align-items: center; margin-bottom: 2px;"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle; flex-shrink: 0;"><span style="vertical-align: middle;">${medicalTypeMap[type]}</span></div>`;
  }).join('');

  const legalChecks = Object.keys(legalTypeMap).map(type => {
    const isChecked = data.legalFlags?.some(f => f.legal_type === type);
    return `<div style="display: flex; align-items: center; margin-bottom: 2px;"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle; flex-shrink: 0;"><span style="vertical-align: middle;">${legalTypeMap[type]}</span></div>`;
  }).join('');

  const socialChecks = Object.keys(socialTypeMap).map(type => {
    const isChecked = data.socialFlags?.some(f => f.social_type === type);
    if (type === 'other' && isChecked) {
      return `<div style="display: flex; align-items: center; margin-bottom: 2px;"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle; flex-shrink: 0;"><span style="vertical-align: middle;">${socialTypeMap[type]} <span style="border-bottom: 1px solid black; display: inline-block; min-width: 200px; margin-left: 5px;">${data.socialOther || ''}</span></span></div>`;
    }
    return `<div style="display: flex; align-items: center; margin-bottom: 2px;"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle; flex-shrink: 0;"><span style="vertical-align: middle;">${socialTypeMap[type]}</span></div>`;
  }).join('');

  const victimChecks = Object.keys(victimTypeMap).map(type => {
    const isChecked = data.victimFlags?.some(f => f.victim_type === type);
    return `<div style="display: flex; align-items: center; margin-bottom: 2px;"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle; flex-shrink: 0;"><span style="vertical-align: middle;">${victimTypeMap[type]}</span></div>`;
  }).join('');

  // Build notifications table rows
  const notificationRows = [
    { type: 'SERVICE_COORDINATOR', label: 'Area Agency' },
    { type: 'PROGRAM_MANAGER', label: 'Program Manager' },
    { type: 'GUARDIAN', label: 'Guardian' },
    { type: 'ADDITIONAL_SERVICE_PROVIDER', label: 'Program Coordinator' },
    { type: 'NURSING', label: 'Nurse' },
  ].map(({ type, label }) => {
    const notification = data.notifications?.find(n => n.type === type);
    const notifyDateTime = notification?.notify_date && notification?.notify_time
      ? extractDateAndTime(`${notification.notify_date}T${notification.notify_time}`)
      : notification?.created_at
        ? extractDateAndTime(notification.created_at)
        : { date: '', time: '', ampm: 'am' };

    return `
      <tr>
        <td style="border: 1px solid black; padding: 4px; font-size: 9px;">${notification?.user_name || ''}</td>
        <td style="border: 1px solid black; padding: 4px; font-size: 9px;">${label}</td>
        <td style="border: 1px solid black; padding: 4px; font-size: 9px;">${notifyDateTime.date}</td>
        <td style="border: 1px solid black; padding: 4px; font-size: 9px;">
          ${notifyDateTime.time ? `${notifyDateTime.time} <span style="display: inline-flex; align-items: center; margin-left: 5px;"><input type="checkbox" ${notifyDateTime.ampm === 'am' ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle; margin-right: 5px;">am</span></span>
          <span style="display: inline-flex; align-items: center;"><input type="checkbox" ${notifyDateTime.ampm === 'pm' ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle;">pm</span></span>` : ''}
        </td>
        <td style="border: 1px solid black; padding: 4px; font-size: 9px;">${notification?.method_of_contact || ''}</td>
        <td style="border: 1px solid black; padding: 4px; font-size: 9px;">${notification?.by_whom || ''}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        /* Isolate all PDF styles to prevent affecting page */
        .pdf-generation-container {
          all: initial !important;
          font-family: Arial, sans-serif !important;
          font-size: 11px !important;
        }
        .pdf-generation-container * {
          box-sizing: border-box;
        }
        /* Ensure no table styles leak outside */
        body:not(.pdf-generation-container) table,
        body:not(.pdf-generation-container) table th,
        body:not(.pdf-generation-container) table td {
          /* Reset any potential leaks */
        }
        .pdf-generation-container .pdf-container {
          font-family: Arial, sans-serif;
          font-size: 11px;
          padding: 0;
          margin: 0;
        }
        .pdf-generation-container .page {
          page-break-after: always;
          width: 8.5in;
          min-height: 11in;
          padding: 0.3in 0.6in 0.5in 0.6in;
          box-sizing: border-box;
          position: relative;
        }
        .pdf-generation-container .page:last-child {
          page-break-after: auto;
        }
        .pdf-generation-container .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .pdf-generation-container .title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .pdf-generation-container .reminder {
          font-size: 10px;
          margin-bottom: 0px;
        }
        .pdf-generation-container .header-date-field {
          text-align: right;
          margin-bottom: 8px;
          font-size: 10px;
        }
        .pdf-generation-container .section {
          margin-bottom: 12px;
        }
        .pdf-generation-container .section-title {
          font-weight: bold;
          margin-bottom: 6px;
          text-decoration: underline;
        }
        .pdf-generation-container .section-header {
          background-color: black;
          color: white;
          padding: 6px 10px;
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 8px;
        }
        .pdf-generation-container .field {
          margin-bottom: 6px;
        }
        .pdf-generation-container .field-label {
          display: inline-block;
          min-width: 140px;
          max-width: 140px;
          font-size: 10px;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .pdf-generation-container .field-value {
          display: inline-block;
          min-width: 0;
          flex: 1;
          padding: 2px 5px;
          font-size: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 14px;
          margin-left: 1px;
        }
        .pdf-generation-container .form-input-line {
          display: inline-block;
          flex: 1;
          min-height: 16px;
          margin-left: 1px;
          padding: 2px 0;
          font-size: 10px;
          min-width: 100px;
        }
        .pdf-generation-container .checkbox-group {
          margin-left: 20px;
          font-size: 10px;
          word-wrap: break-word;
          line-height: 1.4;
        }
        .pdf-generation-container .narrative-box {
          border: 1px solid black;
          min-height: 80px;
          padding: 8px;
          margin-top: 5px;
          font-size: 10px;
          width: 100%;
          box-sizing: border-box;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        .pdf-generation-container .info-box {
          border: 3px solid black;
          padding: 8px;
          margin-bottom: 10px;
          width: 100%;
          box-sizing: border-box;
        }
        .pdf-generation-container .info-row {
          display: flex;
          margin-bottom: 8px;
          gap: 10px;
          width: 100%;
          box-sizing: border-box;
        }
        .pdf-generation-container .info-row:last-child {
          margin-bottom: 0;
        }
        .pdf-generation-container .info-field {
          flex: 1;
          display: flex;
          align-items: center;
          font-size: 10px;
          min-width: 0;
          overflow: hidden;
        }
        .pdf-generation-container .two-column-box {
          border: 1px solid black;
          padding: 8px;
          margin-bottom: 10px;
          display: flex;
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }
        .pdf-generation-container .column-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }
        .pdf-generation-container .column-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }
        .pdf-generation-container .left-section {
          flex: 1;
          border: 1px solid black;
          padding: 0;
          margin-bottom: 8px;
          min-width: 0;
          overflow: hidden;
        }
        .pdf-generation-container .left-section:last-child {
          margin-bottom: 0;
        }
        .pdf-generation-container .right-section {
          flex: 1;
          border: 1px solid black;
          padding: 0;
          margin-bottom: 8px;
          min-width: 0;
          overflow: hidden;
        }
        .pdf-generation-container .right-section:last-child {
          margin-bottom: 0;
        }
        .pdf-generation-container .section-content {
          padding: 8px 10px;
        }
        .pdf-generation-container .footer {
          position: absolute;
          bottom: 0.5in;
          left: 0.6in;
          right: 0.6in;
          width: calc(100% - 1.2in);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
        }
      </style>
    </head>
    <body class="pdf-container">
      <!-- Page 1 -->
      <div class="page">
        <!-- Header Section with thick borders -->
       <div style="padding: 4px 0 0 0; margin-bottom: 0;">
        <div style="position: relative;">
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px; line-height: 1.2;">
              Incident Report
            </div>
            <div style="font-size: 10px; font-weight: bold; font-style: italic; margin-bottom: 0; line-height: 1.2;">
              <strong>REMINDER:</strong> All incidents must be reported within 24 hours, and incident report submitted within 48 hours.
            </div>
          </div>
          <div style="position: absolute; top: 0; right: 0; font-size: 10px; line-height: 1.2;">
            Date AA Rec'd IR:
            <span style="border-bottom: 1px solid black; display: inline-block; min-width: 150px; margin-left: 5px;">
              ${data.dateAAReceivedIR || ''}
            </span>
          </div>
        </div>
      </div>

        <!-- First Box: Individual Details (4 rows) -->
        <div style="padding: 8px; margin-bottom: 5px; width: 100%; box-sizing: border-box; margin-top: 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; border: 1px solid black; width: 33%;">
                <span style="font-size: 10px;">Individual Name:</span> <span style="font-size: 10px;">${data.individualName || ''}</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; width: 33%;">
                <span style="font-size: 10px;">DOB:</span> <span style="font-size: 10px;">${data.dob || ''}</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; width: 34%;">
                <span style="font-size: 10px;">Region:</span> <span style="font-size: 10px;">${data.region || ''}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px; border: 1px solid black;">
                <span style="font-size: 10px;">Date of Incident:</span> <span style="font-size: 10px;">${data.dateOfIncident || ''}</span>
              </td>
              <td colspan="2" style="padding: 5px; border: 1px solid black;">
                <span style="font-size: 10px;">Time of incident:</span> <span style="font-size: 10px;">${data.timeOfIncident || ''}</span>
                ${data.timeOfIncident ? `<span style="display: inline-flex; align-items: center; margin-left: 10px;"><input type="checkbox" ${incidentDateTime.ampm === 'am' ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle; margin-right: 10px;">am</span></span>
                <span style="display: inline-flex; align-items: center;"><input type="checkbox" ${incidentDateTime.ampm === 'pm' ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle;">pm</span></span>` : ''}
              </td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 5px; border: 1px solid black;">
                <span style="font-size: 10px;">Location of incident:</span> <span style="font-size: 10px;">${data.locationOfIncident || ''}</span>
              </td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 5px; border: 1px solid black;">
                <span style="font-size: 10px;">Name of agency providing services at the time of incident:</span> <span style="font-size: 10px;">${data.agencyName || ''}</span>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Checkboxes Box: Two Columns (Medical & Social on Left, Legal & Victim on Right) -->
        <div style="padding: 6px; margin-bottom: 10px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <!-- Left Column: MEDICAL (spans 2 rows, same height as LEGAL + INDIVIDUAL VICTIM OF) -->
              <td rowspan="2" style="width: 50%; vertical-align: top; padding: 0; border: 1px solid black;">
                <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 11px;">MEDICAL</div>
                <div style="padding: 8px 10px; font-size: 10px;">
                  <div style="margin-left: 20px; line-height: 1.4;">
                    ${medicalChecks}
                  </div>
                  <div style="font-size: 9px; margin-top: 8px; margin-left: 20px; line-height: 1.3;">
                    *by nursing or medical intervention we mean treatment at a medical facility (e.g. ER, Urgent Care, PCP, etc.)
                  </div>
                </div>
              </td>
              <!-- Right Column: LEGAL (top half) -->
              <td style="width: 50%; vertical-align: top; padding: 0; border: 1px solid black;">
                <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 11px;">LEGAL</div>
                <div style="padding: 8px 10px; font-size: 10px;">
                  <div style="margin-left: 20px; line-height: 1.4;">
                    ${legalChecks}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <!-- Right Column: INDIVIDUAL VICTIM OF (bottom half) -->
              <td style="width: 50%; vertical-align: top; padding: 0; border: 1px solid black;">
                <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 11px;">INDIVIDUAL VICTIM OF</div>
                <div style="padding: 8px 10px; font-size: 10px;">
                  <div style="margin-left: 20px; line-height: 1.4;">
                    ${victimChecks}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <!-- SOCIAL (full width, spans both columns) -->
              <td colspan="2" style="vertical-align: top; padding: 0; border: 1px solid black;">
                <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 11px;">SOCIAL</div>
                <div style="padding: 8px 10px; font-size: 10px;">
                  <div style="margin-left: 20px; line-height: 1.4;">
                    ${socialChecks}
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Three Equal Narrative Boxes -->
        <div style="border: 3px solid black; padding: 0; margin-bottom: 10px;">
          <!-- First Section -->
          <div style="border-bottom: 1px solid black;">
            <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 10px;">What happened prior to the incident:</div>
            <div style="padding: 8px; min-height: 60px; font-size: 10px; word-wrap: break-word; white-space: pre-wrap;">${data.preIncidentNotes || ''}</div>
          </div>
          <!-- Second Section -->
          <div style="border-bottom: 1px solid black;">
            <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 10px;">Describe what occurred during this incident (include specific information, i.e. behavior, injury etc.):</div>
            <div style="padding: 8px; min-height: 60px; font-size: 10px; word-wrap: break-word; white-space: pre-wrap;">${data.incidentDescription || ''}</div>
          </div>
          <!-- Third Section -->
          <div>
            <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 10px;">What action did the reporter or others employ in response to this incident:</div>
            <div style="padding: 8px; min-height: 60px; font-size: 10px; word-wrap: break-word; white-space: pre-wrap;">${data.responseAction || ''}</div>
          </div>
        </div>
        
        <!-- Reporter Information Box -->
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; border: 1px solid black; width: 33%;">
                <span style="font-size: 10px;">Signature of Reporter:</span> ${data.reporterSignatureUrl ? `<img src="${data.reporterSignatureUrl}" style="height: 30px; max-width: 180px; object-fit: contain; vertical-align: middle;" crossorigin="anonymous" />` : ''}
              </td>
              <td style="padding: 5px; border: 1px solid black; width: 33%;">
                <span style="font-size: 10px;">Date:</span> <span style="font-size: 10px;">${data.reporterDate || ''}</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; width: 34%;">
                <span style="font-size: 10px;">Time:</span> <span style="font-size: 10px;">${data.reporterTime || ''}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px; border: 1px solid black;">
                <span style="font-size: 10px;">Printed Name of Reporter:</span> <span style="font-size: 10px;">${data.reporterName || ''}</span>
              </td>
              <td colspan="2" style="padding: 5px; border: 1px solid black;">
                <span style="font-size: 10px;">Title:</span> <span style="font-size: 10px;">${data.reporterTitle || ''}</span>
              </td>
            </tr>
          </table>
        
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; margin-top: 10px;">
          <div>Incident Report</div>
          <div>Page <strong>1</strong> of <strong>2</strong></div>
          <div>Rev. 3/2020</div>
        </div>
      </div>
      
      <!-- Page 2 -->
      <div class="page">
        <!-- Header Section -->
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <div>
              <span>Individual Name:</span> <span style="border-bottom: 1px solid black; display: inline-block; min-width: 200px; margin-left: 5px;">${data.individualName || ''}</span>
            </div>
            <div>
              <span>Date of Incident:</span> <span style="border-bottom: 1px solid black; display: inline-block; min-width: 150px; margin-left: 5px;">${data.dateOfIncident || ''}</span>
            </div>
          </div>
        </div>
        
        <!-- NOTIFICATIONS Section -->
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 8px; text-transform: uppercase;">NOTIFICATIONS</div>
          <div style="border: 3px solid black;">
            <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 10px;">
              Who was notified (Include name, date/time and method of contact):
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid black; padding: 4px; text-align: left; font-size: 9px; background-color: #f0f0f0; font-weight: bold;">Name</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: left; font-size: 9px; background-color: #f0f0f0; font-weight: bold;">Relationship to individual</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: left; font-size: 9px; background-color: #f0f0f0; font-weight: bold;">Date</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: left; font-size: 9px; background-color: #f0f0f0; font-weight: bold;">Time</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: left; font-size: 9px; background-color: #f0f0f0; font-weight: bold;">Method of contact</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: left; font-size: 9px; background-color: #f0f0f0; font-weight: bold;">By Whom</th>
                </tr>
              </thead>
              <tbody>
                ${notificationRows}
                <tr>
                  <td style="border: 1px solid black; padding: 4px; font-size: 9px;">Other:</td>
                  <td style="border: 1px solid black; padding: 4px; font-size: 9px;"></td>
                  <td style="border: 1px solid black; padding: 4px; font-size: 9px;"></td>
                  <td style="border: 1px solid black; padding: 4px; font-size: 9px;">
                    <span style="display: inline-flex; align-items: center;"><input type="checkbox" disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle; margin-right: 5px;">am</span></span>
                    <span style="display: inline-flex; align-items: center;"><input type="checkbox" disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle;">pm</span></span>
                  </td>
                  <td style="border: 1px solid black; padding: 4px; font-size: 9px;"></td>
                  <td style="border: 1px solid black; padding: 4px; font-size: 9px;"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- REVIEWS Section -->
        <div style="margin-top: 15px;">
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 10px; text-transform: uppercase;">REVIEWS</div>
          
          <!-- Program Manager Review/Follow-up -->
          <div style="border: 3px solid black; margin-bottom: 20px;">
            <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 11px;">Program Manager Review/Follow-up</div>
            <div style="padding: 10px;">
              <!-- Review Text Area -->
              <div style="border: 1px solid black; min-height: 100px; padding: 8px; font-size: 10px; word-wrap: break-word; white-space: pre-wrap; margin-bottom: 10px;">${data.programManagerReview || ''}</div>
              
              <!-- Type of Program -->
              <div style="margin-bottom: 10px; font-size: 10px;">
                <span>Type of Program individual was in during this incident (e.g. CPS, Res, CSS, SEP, 521, etc.):</span>
                <span style="border-bottom: 1px solid black; display: inline-block; min-width: 200px; margin-left: 5px;">${data.programType || ''}</span>
              </div>
              
              <!-- Service Transition Question -->
              <div style="margin-bottom: 10px; font-size: 10px;">
                <span>Has the individual had a service transition within the past 6 months (new home, new home care provider, significant change in service delivery)?</span>
                <span style="display: inline-flex; align-items: center; margin-left: 10px;"><input type="checkbox" ${data.serviceTransition === true || data.serviceTransition === 'Yes' ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle; margin-right: 10px;">Yes</span></span>
                <span style="display: inline-flex; align-items: center;"><input type="checkbox" ${data.serviceTransition === false || data.serviceTransition === 'No' ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle;">No</span></span>
              </div>

              <!-- Service Transition Description -->
              ${data.serviceTransition === true || data.serviceTransition === 'Yes' ? `
                <div style="margin-bottom: 10px; margin-left: 20px; font-size: 10px;">
                  <div style="margin-bottom: 5px;">If yes, describe the transition and its relationship (if any) to the incident that occurred above:</div>
                  <div style="border: 1px solid black; min-height: 40px; padding: 8px; font-size: 10px; word-wrap: break-word; white-space: pre-wrap;">${data.serviceTransitionDescription || ''}</div>
                </div>
              ` : ''}
              
              <!-- Behavior Plan Question -->
              <div style="margin-bottom: 10px; font-size: 10px;">
                <span>If it is a behavioral incident with plan, was the behavior plan followed?</span>
                <span style="display: inline-flex; align-items: center; margin-left: 10px;"><input type="checkbox" ${data.behaviorPlanFollowed === 'Yes' ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle; margin-right: 10px;">Yes</span></span>
                <span style="display: inline-flex; align-items: center;"><input type="checkbox" ${data.behaviorPlanFollowed === 'No' ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle; margin-right: 10px;">No</span></span>
                <span style="display: inline-flex; align-items: center;"><input type="checkbox" ${data.behaviorPlanFollowed === 'N/A' ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle;">N/A</span></span>
              </div>
              
              <!-- Signature, Date, Time Row -->
              <div style="margin-top: 15px; margin-bottom: 10px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px; border: 1px solid black; width: 50%;">
                      <span style="font-size: 10px;">Signature of Program Manager:</span> ${data.programManagerSignatureUrl ? `<img src="${data.programManagerSignatureUrl}" style="height: 30px; max-width: 180px; object-fit: contain; vertical-align: middle;" crossorigin="anonymous" />` : ''}
                    </td>
                    <td style="padding: 5px; border: 1px solid black; width: 25%;">
                      <span style="font-size: 10px;">Date:</span> <span style="font-size: 10px;">${data.programManagerDate || ''}</span>
                    </td>
                    <td style="padding: 5px; border: 1px solid black; width: 25%;">
                      <span style="font-size: 10px;">Time:</span> <span style="font-size: 10px;">${data.programManagerTime || ''}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Printed Name and Title Row -->
              <div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px; border: 1px solid black; width: 66%;">
                      <span style="font-size: 10px;">Printed Name of Program Manager:</span> <span style="font-size: 10px;">${data.programManagerName || ''}</span>
                    </td>
                    <td style="padding: 5px; border: 1px solid black; width: 34%;">
                      <span style="font-size: 10px;">Title:</span> <span style="font-size: 10px;">${data.programManagerTitle || ''}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Service Coordinator/Case Manager Review/Follow-up -->
          <div style="border: 3px solid black;">
            <div style="background-color: black; color: white; padding: 6px 10px; font-weight: bold; font-size: 11px;">Service Coordinator/Case Manager Review/Follow-up</div>
            <div style="padding: 10px;">
              <!-- Review Text Area -->
              <div style="border: 1px solid black; min-height: 100px; padding: 8px; font-size: 10px; word-wrap: break-word; white-space: pre-wrap; margin-bottom: 10px;">${data.serviceCoordinatorReview || ''}</div>
              
              <!-- Team Meeting Question -->
              <div style="margin-bottom: 10px; font-size: 10px;">
                <span>Is a team meeting required at this time?</span>
                <span style="display: inline-flex; align-items: center; margin-left: 10px;"><input type="checkbox" ${data.teamMeetingRequired ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle; margin-right: 10px;">Yes</span></span>
                <span style="display: inline-flex; align-items: center;"><input type="checkbox" ${!data.teamMeetingRequired ? 'checked' : ''} disabled style="width: 12px; height: 12px; margin-right: 5px; vertical-align: middle;"><span style="vertical-align: middle;">No</span></span>
              </div>
              
              <!-- Signature, Date, Time Row -->
              <div style="margin-top: 15px; margin-bottom: 10px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px; border: 1px solid black; width: 50%;">
                      <span style="font-size: 10px;">Signature of Service Coordinator/Case Manager:</span> ${data.serviceCoordinatorSignatureUrl ? `<img src="${data.serviceCoordinatorSignatureUrl}" style="height: 30px; max-width: 180px; object-fit: contain; vertical-align: middle;" crossorigin="anonymous" />` : ''}
                    </td>
                    <td style="padding: 5px; border: 1px solid black; width: 25%;">
                      <span style="font-size: 10px;">Date:</span> <span style="font-size: 10px;">${data.serviceCoordinatorDate || ''}</span>
                    </td>
                    <td style="padding: 5px; border: 1px solid black; width: 25%;">
                      <span style="font-size: 10px;">Time:</span> <span style="font-size: 10px;">${data.serviceCoordinatorTime || ''}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Printed Name and Title Row -->
              <div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px; border: 1px solid black; width: 66%;">
                      <span style="font-size: 10px;">Printed Name of Service Coordinator/Case Manager:</span> <span style="font-size: 10px;">${data.serviceCoordinatorName || ''}</span>
                    </td>
                    <td style="padding: 5px; border: 1px solid black; width: 34%;">
                      <span style="font-size: 10px;">Title:</span> <span style="font-size: 10px;">${data.serviceCoordinatorTitle || ''}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div>Incident Report</div>
          <div>Page 2 of 2</div>
          <div>Rev. 3/2020</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate PDF from incident data
export async function generateIncidentPDF(incidentData: any): Promise<void> {
  const pdfData = transformIncidentDataToPDF(incidentData);
  const htmlContent = createHTMLTemplate(pdfData);

  // Create a temporary container - completely isolated from page
  const container = document.createElement('div');
  container.className = 'pdf-generation-container';
  container.style.cssText = `
    position: fixed !important;
    top: -99999px !important;
    left: -99999px !important;
    width: 8.5in !important;
    height: 11in !important;
    pointer-events: none !important;
    z-index: -9999 !important;
    overflow: hidden !important;
    background-color: white !important;
    isolation: isolate !important;
    contain: layout style paint !important;
  `;
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    // Wait for all images (signatures) to load
    const images = container.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get both page elements
    const pages = container.querySelectorAll('.page');

    if (pages.length < 2) {
      throw new Error('Expected 2 pages in template');
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter',
    });

    const imgWidth = 8.5;
    const pageHeight = 11;

    // Process each page separately
    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i] as HTMLElement;

      // Convert page to canvas
      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 816, // 8.5 inches at 96 DPI
        windowWidth: 816,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add page to PDF (add new page except for first)
      if (i > 0) {
        pdf.addPage();
      }

      // Calculate position to center vertically if needed
      const yPosition = Math.max(0, (pageHeight - imgHeight) / 2);

      pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
    }

    // Remove container immediately after PDF generation
    if (container.parentNode) {
      document.body.removeChild(container);
    }

    // Open PDF in new tab
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');

    // Revoke URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 100);
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    throw error;
  }
}
