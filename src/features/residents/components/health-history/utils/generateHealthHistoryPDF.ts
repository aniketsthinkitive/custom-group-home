import jsPDF from 'jspdf';
import dayjs from 'dayjs';

/**
 * Type definitions for Health History Form data
 */
export interface HealthHistoryFormData {
  // Step 1: Basic Information
  completedBy?: string;
  relationshipToIndividual?: string;
  date?: string | null;
  name?: string;
  likesToBeCalled?: string;
  dateOfBirth?: string | null;
  socSec?: string;
  religion?: string;
  contactNumber?: string;
  address?: string | { line1?: string; line2?: string; city?: string; state?: string; zipcode?: string; country?: string };
  healthInsuranceType?: string;
  healthInsuranceNumber?: string;
  agencyResponsible?: string;
  agencyContactNumber?: string;
  agencyPrimaryContact?: string;
  agencyPrimaryContactNumber?: string;

  // Step 2: Consent & Legal Status
  consentStatus?: string;
  guardianName?: string;
  guardianContactNumber?: string;
  resuscitationStatus?: string;
  comfortCareFormAvailable?: string;
  dnrContactName?: string;
  dnrContactNumber?: string;
  advancedDirectives?: string;
  advancedDirectivesName?: string;
  advancedDirectivesContact?: string;

  // Step 3: Emergency Contacts
  emergencyContact1Name?: string;
  emergencyContact1Number?: string;
  emergencyContact2Name?: string;
  emergencyContact2Number?: string;

  // Step 4: Medications & Allergies
  medicationsAttachedType?: string;
  medicationSheet?: string;
  medicationList?: string;
  pharmacyName?: string;
  pharmacyContactNumber?: string;
  pharmacyAddress?: string | { line1?: string; line2?: string; city?: string; state?: string; zipcode?: string; country?: string };
  medicationAllergies?: string;
  foodEnvironmentalAllergies?: string;
  typeOfReaction?: string;

  // Step 5: Functional Abilities
  currentMedicalProblems?: string;
  communication?: string;
  medicationAdministration?: string;
  diningEating?: string;
  ambulation?: string;
  vision?: string;
  hearing?: string;
  personalHygiene?: string;
  personalHygieneSpecial?: string;
  oralHygiene?: string;
  oralHygieneSpecial?: string;
  dietTexture?: string;
  dietType?: string;
  toiletingAbility?: string;
  supportiveDevices?: string;
  supportiveDevicesOther?: string;
  headOfBedElevated?: string;
  adaptiveEquipment?: string;
  adaptiveEquipmentDescription?: string;

  // Step 6: Special Needs & Exam Preferences
  medicalExamResponse?: string;
  sedationRequired?: boolean;
  specialPositioning?: boolean;
  doubleStaffingRequired?: boolean;
  limitedWaitingPeriods?: boolean;
  earlyDayAppointments?: boolean;
  endOfDayAppointments?: boolean;
  specialCommunicationDevice?: boolean;
  specialCommunicationDeviceType?: string;
  painResponse?: string;
  painResponseUnique?: string;

  // Step 7: Medical Providers
  primaryCareName?: string;
  primaryCareContactNumber?: string;
  primaryCareAddress?: string | { line1?: string; line2?: string; city?: string; state?: string; zipcode?: string; country?: string };
  dentalCareName?: string;
  dentalCareContactNumber?: string;
  dentalCareAddress?: string | { line1?: string; line2?: string; city?: string; state?: string; zipcode?: string; country?: string };
  eyeCareName?: string;
  eyeCareContactNumber?: string;
  eyeCareAddress?: string | { line1?: string; line2?: string; city?: string; state?: string; zipcode?: string; country?: string };
  subspecialists?: Array<{ name?: string; contactNumber?: string; address?: string; specialty?: string; contact?: string }>;

  // Step 8: Living & Social Information
  livingStatus?: string;
  livingStatusOther?: string;
  homeCareContactName?: string;
  homeCareContactNumber?: string;
  maritalStatus?: string;
  workDayProgramStatus?: string;
  nursingSupports?: string;

  // Step 9: Immunizations
  tetanusDate?: string | null;
  tetanusStatus?: string;
  fluShotDate?: string | null;
  fluShotStatus?: string;
  pneumovaxDate?: string | null;
  pneumovaxStatus?: string;
  hepatitisBDate?: string | null;
  hepatitisBStatus?: string;
  otherVaccinationsDate?: string | null;
  otherVaccinationsSpecify?: string;
  otherVaccinationsStatus?: string;
  ppdPositiveTest?: string;
  ppdTreatmentGiven?: string;
  ppdTreatmentExplain?: string;
  ppdLastDate?: string | null;
  healthUpdatesWeight?: string;
  healthUpdatesMajorChanges?: string;
  smoking?: string;
  alcoholDrugUse?: string;
  eatingDisorderHistory?: string;
  eatingDisorderDescription?: string;

  // Step 10: Past Medical History
  medicalHistoryNotReleased?: boolean;
  medicalHistoryContactName?: string;
  medicalHistoryContactRelation?: string;
  medicalHistoryContactNumber?: string;
  medicalHistoryContactAddress?: string | { line1?: string; line2?: string; city?: string; state?: string; zipcode?: string; country?: string };
  surgicalHistory?: string;
  surgicalHistoryDate?: string | null;
  traumaBrokenBones?: string;
  traumaBrokenBonesDate?: string | null;
  anesthesiaProblems?: string;
  anesthesiaProblemsDescription?: string;
  ageMenstruationStarted?: string;
  ageMenstruationStopped?: string;
  stillMenstruating?: boolean;
  givenBirth?: string;
  lastPapSmearDate?: string | null;
  lastPapSmearStatus?: string;
  abnormalPapSmear?: string;
  abnormalPapSmearDescription?: string;
  lastMammogramDate?: string | null;
  lastMammogramStatus?: string;
  seriousIllnessesConditions?: string;
  behavioralPsychiatricDiagnoses?: string;

  // Step 11: Prior Evaluations
  audiologicalExamDate?: string | null;
  audiologicalExamStatus?: string;
  eyeExamDate?: string | null;
  eyeExamStatus?: string;
  dentalExamDate?: string | null;
  dentalExamStatus?: string;
  boneDensityDate?: string | null;
  boneDensityStatus?: string;
  colonoscopySigmoidoscopyDate?: string | null;
  colonoscopySigmoidoscopyStatus?: string;
  psaDate?: string | null;
  psaStatus?: string;

  // Step 12: Family History
  brothersSisters?: Array<{ age?: string; health?: string }>;
  familyDiseases?: string;
  familyDiseasesRunInFamily?: string;
  familyDiseasesDescription?: string;
  geneticCounseling?: string;
  geneticCounselingDescription?: string;
  fatherDeceased?: string;
  fatherAgeAtDeath?: string;
  fatherCauseOfDeath?: string;
  fatherCurrentAge?: string;
  motherDeceased?: string;
  motherAgeAtDeath?: string;
  motherCauseOfDeath?: string;
  motherCurrentAge?: string;
  familyHistoryDiabetes?: boolean;
  familyHistoryHighBloodPressure?: boolean;
  familyHistoryHighCholesterol?: boolean;
  familyHistoryHeartDisease?: boolean;
  familyHistoryOsteoporosis?: boolean;
  familyHistoryColonPolyps?: boolean;
  familyHistoryCancer?: boolean;
  familyHistoryCancerType?: string;

  [key: string]: any; // Allow additional fields
}

/**
 * Field label mapping for readable PDF output
 */
const fieldLabels: Record<string, string> = {
  // Step 1: Basic Information
  completedBy: 'Completed By',
  relationshipToIndividual: 'Relationship to Individual',
  date: 'Date',
  name: 'Name',
  likesToBeCalled: 'Likes to be Called',
  dateOfBirth: 'Date of Birth',
  socSec: 'Social Security No.',
  religion: 'Religion',
  contactNumber: 'Phone Number',
  address: 'Address',
  healthInsuranceType: 'Health Insurance Type',
  healthInsuranceNumber: 'Health Insurance Number',
  agencyResponsible: 'Agency Responsible',
  agencyContactNumber: 'Agency Phone Number',
  agencyPrimaryContact: 'Agency Primary Contact',
  agencyPrimaryContactNumber: 'Agency Primary Phone Number',

  // Step 2: Consent & Legal Status
  consentStatus: 'Consent Status',
  guardianName: 'Guardian Name',
  guardianContactNumber: 'Guardian Phone Number',
  resuscitationStatus: 'Resuscitation Status',
  comfortCareFormAvailable: 'Comfort Care Form Available',
  dnrContactName: 'DNR Contact Name',
  dnrContactNumber: 'DNR Phone Number',
  advancedDirectives: 'Advanced Directives',
  advancedDirectivesName: 'Advanced Directives Name',
  advancedDirectivesContact: 'Advanced Directives Contact',

  // Step 3: Emergency Contacts
  emergencyContact1Name: 'Emergency Contact 1 Name',
  emergencyContact1Number: 'Emergency Contact 1 Number',
  emergencyContact2Name: 'Emergency Contact 2 Name',
  emergencyContact2Number: 'Emergency Contact 2 Number',

  // Step 4: Medications & Allergies
  medicationsAttachedType: 'Medications Attached Type',
  medicationSheet: 'Medication Sheet',
  medicationList: 'Medication List',
  pharmacyName: 'Pharmacy Name',
  pharmacyContactNumber: 'Pharmacy Phone Number',
  pharmacyAddress: 'Pharmacy Address',
  medicationAllergies: 'Medication Allergies',
  foodEnvironmentalAllergies: 'Food/Environmental Allergies',
  typeOfReaction: 'Type of Reaction',

  // Step 5: Functional Abilities
  currentMedicalProblems: 'Current Medical Problems',
  communication: 'Communication',
  medicationAdministration: 'Medication Administration',
  diningEating: 'Dining/Eating',
  ambulation: 'Ambulation',
  vision: 'Vision',
  hearing: 'Hearing',
  personalHygiene: 'Personal Hygiene',
  personalHygieneSpecial: 'Personal Hygiene Special',
  oralHygiene: 'Oral Hygiene',
  oralHygieneSpecial: 'Oral Hygiene Special',
  dietTexture: 'Diet Texture',
  dietType: 'Diet Type',
  toiletingAbility: 'Toileting Ability',
  supportiveDevices: 'Supportive Devices',
  supportiveDevicesOther: 'Supportive Devices Other',
  headOfBedElevated: 'Head of Bed Elevated',
  adaptiveEquipment: 'Adaptive Equipment',
  adaptiveEquipmentDescription: 'Adaptive Equipment Description',

  // Step 6: Special Needs & Exam Preferences
  medicalExamResponse: 'Medical Exam Response',
  sedationRequired: 'Sedation Required',
  specialPositioning: 'Special Positioning',
  doubleStaffingRequired: 'Double Staffing Required',
  limitedWaitingPeriods: 'Limited Waiting Periods',
  earlyDayAppointments: 'Early Day Appointments',
  endOfDayAppointments: 'End of Day Appointments',
  specialCommunicationDevice: 'Special Communication Device',
  specialCommunicationDeviceType: 'Special Communication Device Type',
  painResponse: 'Pain Response',
  painResponseUnique: 'Pain Response Unique',

  // Step 7: Medical Providers
  primaryCareName: 'Primary Care Name',
  primaryCareContactNumber: 'Primary Care Phone Number',
  primaryCareAddress: 'Primary Care Address',
  dentalCareName: 'Dental Care Name',
  dentalCareContactNumber: 'Dental Care Phone Number',
  dentalCareAddress: 'Dental Care Address',
  eyeCareName: 'Eye Care Name',
  eyeCareContactNumber: 'Eye Care Phone Number',
  eyeCareAddress: 'Eye Care Address',
  subspecialists: 'Subspecialists',

  // Step 8: Living & Social Information
  livingStatus: 'Living Status',
  livingStatusOther: 'Living Status Other',
  homeCareContactName: 'Home Care Contact Name',
  homeCareContactNumber: 'Home Care Phone Number',
  maritalStatus: 'Marital Status',
  workDayProgramStatus: 'Work/Day Program Status',
  nursingSupports: 'Nursing Supports',

  // Step 9: Immunizations
  tetanusDate: 'Tetanus Date',
  tetanusStatus: 'Tetanus Status',
  fluShotDate: 'Flu Shot Date',
  fluShotStatus: 'Flu Shot Status',
  pneumovaxDate: 'Pneumovax Date',
  pneumovaxStatus: 'Pneumovax Status',
  hepatitisBDate: 'Hepatitis B Date',
  hepatitisBStatus: 'Hepatitis B Status',
  otherVaccinationsDate: 'Other Vaccinations Date',
  otherVaccinationsSpecify: 'Other Vaccinations Specify',
  otherVaccinationsStatus: 'Other Vaccinations Status',
  ppdPositiveTest: 'PPD Positive Test',
  ppdTreatmentGiven: 'PPD Treatment Given',
  ppdTreatmentExplain: 'PPD Treatment Explain',
  ppdLastDate: 'PPD Last Date',
  healthUpdatesWeight: 'Health Updates Weight',
  healthUpdatesMajorChanges: 'Health Updates Major Changes',
  smoking: 'Smoking',
  alcoholDrugUse: 'Alcohol/Drug Use',
  eatingDisorderHistory: 'Eating Disorder History',
  eatingDisorderDescription: 'Eating Disorder Description',

  // Step 10: Past Medical History
  medicalHistoryNotReleased: 'Medical History Not Released',
  medicalHistoryContactName: 'Medical History Contact Name',
  medicalHistoryContactRelation: 'Medical History Contact Relation',
  medicalHistoryContactNumber: 'Medical History Phone Number',
  medicalHistoryContactAddress: 'Medical History Contact Address',
  surgicalHistory: 'Surgical History',
  surgicalHistoryDate: 'Surgical History Date',
  traumaBrokenBones: 'Trauma/Broken Bones',
  traumaBrokenBonesDate: 'Trauma/Broken Bones Date',
  anesthesiaProblems: 'Anesthesia Problems',
  anesthesiaProblemsDescription: 'Anesthesia Problems Description',
  ageMenstruationStarted: 'Age Menstruation Started',
  ageMenstruationStopped: 'Age Menstruation Stopped',
  stillMenstruating: 'Still Menstruating',
  givenBirth: 'Given Birth',
  lastPapSmearDate: 'Last Pap Smear Date',
  lastPapSmearStatus: 'Last Pap Smear Status',
  abnormalPapSmear: 'Abnormal Pap Smear',
  abnormalPapSmearDescription: 'Abnormal Pap Smear Description',
  lastMammogramDate: 'Last Mammogram Date',
  lastMammogramStatus: 'Last Mammogram Status',
  seriousIllnessesConditions: 'Serious Illnesses/Conditions',
  behavioralPsychiatricDiagnoses: 'Behavioral/Psychiatric Diagnoses',

  // Step 11: Prior Evaluations
  audiologicalExamDate: 'Audiological Exam Date',
  audiologicalExamStatus: 'Audiological Exam Status',
  eyeExamDate: 'Eye Exam Date',
  eyeExamStatus: 'Eye Exam Status',
  dentalExamDate: 'Dental Exam Date',
  dentalExamStatus: 'Dental Exam Status',
  boneDensityDate: 'Bone Density Date',
  boneDensityStatus: 'Bone Density Status',
  colonoscopySigmoidoscopyDate: 'Colonoscopy/Sigmoidoscopy Date',
  colonoscopySigmoidoscopyStatus: 'Colonoscopy/Sigmoidoscopy Status',
  psaDate: 'PSA Date',
  psaStatus: 'PSA Status',

  // Step 12: Family History
  brothersSisters: 'Brothers/Sisters',
  familyDiseases: 'Family Diseases',
  familyDiseasesRunInFamily: 'Family Diseases Run in Family',
  familyDiseasesDescription: 'Family Diseases Description',
  geneticCounseling: 'Genetic Counseling',
  geneticCounselingDescription: 'Genetic Counseling Description',
  fatherDeceased: 'Father Deceased',
  fatherAgeAtDeath: 'Father Age at Death',
  fatherCauseOfDeath: 'Father Cause of Death',
  fatherCurrentAge: 'Father Current Age',
  motherDeceased: 'Mother Deceased',
  motherAgeAtDeath: 'Mother Age at Death',
  motherCauseOfDeath: 'Mother Cause of Death',
  motherCurrentAge: 'Mother Current Age',
  familyHistoryDiabetes: 'Family History Diabetes',
  familyHistoryHighBloodPressure: 'Family History High Blood Pressure',
  familyHistoryHighCholesterol: 'Family History High Cholesterol',
  familyHistoryHeartDisease: 'Family History Heart Disease',
  familyHistoryOsteoporosis: 'Family History Osteoporosis',
  familyHistoryColonPolyps: 'Family History Colon Polyps',
  familyHistoryCancer: 'Family History Cancer',
  familyHistoryCancerType: 'Family History Cancer Type',
};

/**
 * Step configuration with field mappings and section organization
 */
interface StepConfig {
  title: string;
  sections: Array<{
    sectionTitle: string;
    fields: string[];
  }>;
}

const stepConfigs: StepConfig[] = [
  {
    title: 'Step 1: Basic Information',
    sections: [
      {
        sectionTitle: 'Completed By',
        fields: ['completedBy', 'relationshipToIndividual', 'date'],
      },
      {
        sectionTitle: 'Individual Details',
        fields: ['name', 'likesToBeCalled', 'dateOfBirth', 'socSec', 'religion'],
      },
      {
        sectionTitle: 'Contact Information',
        fields: ['contactNumber', 'address'],
      },
      {
        sectionTitle: 'Health Insurance Details',
        fields: ['healthInsuranceType', 'healthInsuranceNumber'],
      },
      {
        sectionTitle: 'Agency Information',
        fields: ['agencyResponsible', 'agencyContactNumber', 'agencyPrimaryContact', 'agencyPrimaryContactNumber'],
      },
    ],
  },
  {
    title: 'Step 2: Consent & Legal Status',
    sections: [
      {
        sectionTitle: 'Consent Information',
        fields: ['consentStatus', 'guardianName', 'guardianContactNumber'],
      },
      {
        sectionTitle: 'Resuscitation & DNR',
        fields: ['resuscitationStatus', 'comfortCareFormAvailable', 'dnrContactName', 'dnrContactNumber'],
      },
      {
        sectionTitle: 'Advanced Directives',
        fields: ['advancedDirectives', 'advancedDirectivesName', 'advancedDirectivesContact'],
      },
    ],
  },
  {
    title: 'Step 3: Emergency Contacts',
    sections: [
      {
        sectionTitle: 'Emergency Contacts',
        fields: ['emergencyContact1Name', 'emergencyContact1Number', 'emergencyContact2Name', 'emergencyContact2Number'],
      },
    ],
  },
  {
    title: 'Step 4: Medications & Allergies',
    sections: [
      {
        sectionTitle: 'Medications',
        fields: ['medicationsAttachedType', 'medicationSheet', 'medicationList', 'pharmacyName', 'pharmacyContactNumber', 'pharmacyAddress'],
      },
      {
        sectionTitle: 'Allergies',
        fields: ['medicationAllergies', 'foodEnvironmentalAllergies', 'typeOfReaction'],
      },
    ],
  },
  {
    title: 'Step 5: Functional Abilities',
    sections: [
      {
        sectionTitle: 'Medical & Communication',
        fields: ['currentMedicalProblems', 'communication', 'medicationAdministration'],
      },
      {
        sectionTitle: 'Daily Living Activities',
        fields: ['diningEating', 'ambulation', 'vision', 'hearing', 'personalHygiene', 'personalHygieneSpecial', 'oralHygiene', 'oralHygieneSpecial'],
      },
      {
        sectionTitle: 'Diet & Nutrition',
        fields: ['dietTexture', 'dietType'],
      },
      {
        sectionTitle: 'Mobility & Equipment',
        fields: ['toiletingAbility', 'supportiveDevices', 'supportiveDevicesOther', 'headOfBedElevated', 'adaptiveEquipment', 'adaptiveEquipmentDescription'],
      },
    ],
  },
  {
    title: 'Step 6: Special Needs & Exam Preferences',
    sections: [
      {
        sectionTitle: 'Exam Preferences',
        fields: ['medicalExamResponse', 'sedationRequired', 'specialPositioning', 'doubleStaffingRequired'],
      },
      {
        sectionTitle: 'Appointment Preferences',
        fields: ['limitedWaitingPeriods', 'earlyDayAppointments', 'endOfDayAppointments'],
      },
      {
        sectionTitle: 'Communication & Pain',
        fields: ['specialCommunicationDevice', 'specialCommunicationDeviceType', 'painResponse', 'painResponseUnique'],
      },
    ],
  },
  {
    title: 'Step 7: Medical Providers',
    sections: [
      {
        sectionTitle: 'Primary Care',
        fields: ['primaryCareName', 'primaryCareContactNumber', 'primaryCareAddress'],
      },
      {
        sectionTitle: 'Dental Care',
        fields: ['dentalCareName', 'dentalCareContactNumber', 'dentalCareAddress'],
      },
      {
        sectionTitle: 'Eye Care',
        fields: ['eyeCareName', 'eyeCareContactNumber', 'eyeCareAddress'],
      },
      {
        sectionTitle: 'Subspecialists',
        fields: ['subspecialists'],
      },
    ],
  },
  {
    title: 'Step 8: Living & Social Information',
    sections: [
      {
        sectionTitle: 'Living Status',
        fields: ['livingStatus', 'livingStatusOther', 'homeCareContactName', 'homeCareContactNumber'],
      },
      {
        sectionTitle: 'Social Information',
        fields: ['maritalStatus', 'workDayProgramStatus', 'nursingSupports'],
      },
    ],
  },
  {
    title: 'Step 9: Immunizations',
    sections: [
      {
        sectionTitle: 'Vaccinations',
        fields: ['tetanusDate', 'tetanusStatus', 'fluShotDate', 'fluShotStatus', 'pneumovaxDate', 'pneumovaxStatus', 'hepatitisBDate', 'hepatitisBStatus', 'otherVaccinationsDate', 'otherVaccinationsSpecify', 'otherVaccinationsStatus'],
      },
      {
        sectionTitle: 'PPD Testing',
        fields: ['ppdPositiveTest', 'ppdTreatmentGiven', 'ppdTreatmentExplain', 'ppdLastDate'],
      },
      {
        sectionTitle: 'Health Updates & Lifestyle',
        fields: ['healthUpdatesWeight', 'healthUpdatesMajorChanges', 'smoking', 'alcoholDrugUse', 'eatingDisorderHistory', 'eatingDisorderDescription'],
      },
    ],
  },
  {
    title: 'Step 10: Past Medical History',
    sections: [
      {
        sectionTitle: 'Medical History Release',
        fields: ['medicalHistoryNotReleased', 'medicalHistoryContactName', 'medicalHistoryContactRelation', 'medicalHistoryContactNumber', 'medicalHistoryContactAddress'],
      },
      {
        sectionTitle: 'Surgical & Trauma History',
        fields: ['surgicalHistory', 'surgicalHistoryDate', 'traumaBrokenBones', 'traumaBrokenBonesDate', 'anesthesiaProblems', 'anesthesiaProblemsDescription'],
      },
      {
        sectionTitle: 'Women\'s Health',
        fields: ['ageMenstruationStarted', 'ageMenstruationStopped', 'stillMenstruating', 'givenBirth', 'lastPapSmearDate', 'lastPapSmearStatus', 'abnormalPapSmear', 'abnormalPapSmearDescription', 'lastMammogramDate', 'lastMammogramStatus'],
      },
      {
        sectionTitle: 'Medical Conditions',
        fields: ['seriousIllnessesConditions', 'behavioralPsychiatricDiagnoses'],
      },
    ],
  },
  {
    title: 'Step 11: Prior Evaluations',
    sections: [
      {
        sectionTitle: 'Prior Evaluations',
        fields: ['audiologicalExamDate', 'audiologicalExamStatus', 'eyeExamDate', 'eyeExamStatus', 'dentalExamDate', 'dentalExamStatus', 'boneDensityDate', 'boneDensityStatus', 'colonoscopySigmoidoscopyDate', 'colonoscopySigmoidoscopyStatus', 'psaDate', 'psaStatus'],
      },
    ],
  },
  {
    title: 'Step 12: Family History',
    sections: [
      {
        sectionTitle: 'Siblings',
        fields: ['brothersSisters'],
      },
      {
        sectionTitle: 'Family Diseases',
        fields: ['familyDiseases', 'familyDiseasesRunInFamily', 'familyDiseasesDescription', 'geneticCounseling', 'geneticCounselingDescription'],
      },
      {
        sectionTitle: 'Father\'s History',
        fields: ['fatherDeceased', 'fatherAgeAtDeath', 'fatherCauseOfDeath', 'fatherCurrentAge'],
      },
      {
        sectionTitle: 'Mother\'s History',
        fields: ['motherDeceased', 'motherAgeAtDeath', 'motherCauseOfDeath', 'motherCurrentAge'],
      },
      {
        sectionTitle: 'Family Medical History',
        fields: ['familyHistoryDiabetes', 'familyHistoryHighBloodPressure', 'familyHistoryHighCholesterol', 'familyHistoryHeartDisease', 'familyHistoryOsteoporosis', 'familyHistoryColonPolyps', 'familyHistoryCancer', 'familyHistoryCancerType'],
      },
    ],
  },
];

/**
 * Format a value for display in PDF
 */
function formatValue(value: any): string {
  // Handle boolean values first (including false)
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  // Handle date strings
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const date = dayjs(value);
    if (date.isValid()) {
      return date.format('MM/DD/YYYY');
    }
  }

  // Handle dayjs objects
  if (dayjs.isDayjs(value)) {
    return value.format('MM/DD/YYYY');
  }

  // Handle address objects
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (value.line1 || value.city || value.state || value.zipcode) {
      const parts: string[] = [];
      if (value.line1) parts.push(value.line1);
      if (value.line2) parts.push(value.line2);
      if (value.city) parts.push(value.city);
      if (value.state) parts.push(value.state);
      if (value.zipcode) parts.push(value.zipcode);
      if (value.country) parts.push(value.country);
      return parts.filter(Boolean).join(', ');
    }
  }

  // Handle arrays (checkboxes, subspecialists, etc.)
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    
    // Handle subspecialists array
    if (value[0] && typeof value[0] === 'object' && (value[0].name || value[0].contactNumber || value[0].specialty)) {
      return value
        .map((item: any, index: number) => {
          const parts: string[] = [];
          if (item.name) parts.push(`Name: ${item.name}`);
          if (item.specialty) parts.push(`Specialty: ${item.specialty}`);
          if (item.contactNumber) parts.push(`Contact: ${item.contactNumber}`);
          if (item.contact) parts.push(`Contact: ${item.contact}`);
          if (item.address) {
            const addr = typeof item.address === 'string' ? item.address : formatValue(item.address);
            parts.push(`Address: ${addr}`);
          }
          return `Subspecialist ${index + 1}: ${parts.join('; ')}`;
        })
        .join('\n');
    }
    
    // Handle brothers/sisters array
    if (value[0] && typeof value[0] === 'object' && (value[0].age || value[0].health)) {
      return value
        .map((item: any, index: number) => {
          const parts: string[] = [];
          if (item.age) parts.push(`Age: ${item.age}`);
          if (item.health) parts.push(`Health: ${item.health}`);
          return `Sibling ${index + 1}: ${parts.join(', ')}`;
        })
        .join('\n');
    }
    
    // Handle simple arrays (checkbox values)
    return value.map(String).join(', ');
  }

  return String(value);
}

/**
 * Check if we need a new page and add it if necessary
 */
function checkPageBreak(pdf: jsPDF, currentY: number, lineHeight: number = 6): number {
  const pageHeight = pdf.internal.pageSize.height;
  const marginBottom = 20;
  
  if (currentY + lineHeight > pageHeight - marginBottom) {
    pdf.addPage();
    // Draw sidebar on new page
    pdf.setFillColor(60, 60, 60); // Dark grey color
    pdf.rect(0, 0, 25, pdf.internal.pageSize.height, 'F');
    return 20; // Return to top margin
  }
  
  return currentY;
}

/**
 * Add a section heading to the PDF
 */
function addSectionHeading(
  pdf: jsPDF,
  title: string,
  startY: number,
  contentLeftMargin: number,
): number {
  let currentY = checkPageBreak(pdf, startY, 10);
  
  // Set font for section heading (bold, larger)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  
  currentY = checkPageBreak(pdf, currentY, 8);
  pdf.text(title, contentLeftMargin, currentY);
  currentY += 6;
  
  return currentY;
}

/**
 * Add a field (question/answer pair) to the PDF - label and value on same line
 */
function addField(
  pdf: jsPDF,
  label: string,
  value: any,
  startY: number,
  contentLeftMargin: number,
  maxWidth: number = 150,
): number {
  let currentY = checkPageBreak(pdf, startY, 8);
  
  const formattedValue = formatValue(value);
  
  // Always show all fields - don't skip any

  // Set font for label (bold)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  // Calculate positions for aligned layout
  const bulletX = contentLeftMargin;
  const labelX = contentLeftMargin + 4;
  const labelText = label + ':';
  
  // Set font to calculate label width accurately
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  const labelWidth = pdf.getTextWidth(labelText);
  
  // Small gap between label and value (4-6mm, equivalent to ~6-8px)
  // Using actual label width + small gap to minimize horizontal spacing
  const labelValueGap = 5; // Small gap (approximately 7px equivalent)
  const valueStartX = labelX + labelWidth + labelValueGap;
  const valueMaxWidth = maxWidth - (valueStartX - contentLeftMargin);
  
  // Check if value fits on same line
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const valueWidth = pdf.getTextWidth(formattedValue);
  
  // If value fits on same line, put it there
  if (valueWidth <= valueMaxWidth && !formattedValue.includes('\n')) {
    currentY = checkPageBreak(pdf, currentY, 6);
    
    // Add bullet point
    pdf.setFont('helvetica', 'bold');
    pdf.text('•', bulletX, currentY);
    
    // Add label
    pdf.text(labelText, labelX, currentY);
    
    // Add value on same line
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(50, 50, 50);
    pdf.text(formattedValue, valueStartX, currentY);
    
    currentY += 6;
  } else {
    // Multi-line value - label on first line, value wraps below
    currentY = checkPageBreak(pdf, currentY, 6);
    
    // Add bullet point
    pdf.setFont('helvetica', 'bold');
    pdf.text('•', bulletX, currentY);
    
    // Add label
    pdf.text(labelText, labelX, currentY);
    
    // Set font for value (normal)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    
    // Handle multi-line values
    const lines = pdf.splitTextToSize(formattedValue, valueMaxWidth);
    currentY += 5;
    
    lines.forEach((line: string) => {
      currentY = checkPageBreak(pdf, currentY, 5);
      pdf.text(line, valueStartX, currentY);
      currentY += 5;
    });
  }
  
  // Add spacing after field
  currentY += 3;
  
  return currentY;
}

/**
 * Generate PDF from Health History Form data
 */
export function generateHealthHistoryPDF(formData: HealthHistoryFormData, individualName?: string): void {
  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // PDF Constants
  const sidebarWidth = 25; // Dark grey sidebar width
  const contentLeftMargin = 35; // Content starts after sidebar
  const rightMargin = 20;
  const topMargin = 20;
  const pageWidth = pdf.internal.pageSize.width;
  const contentWidth = pageWidth - contentLeftMargin - rightMargin;
  let currentY = topMargin;

  // Draw dark grey sidebar on first page
  pdf.setFillColor(60, 60, 60); // Dark grey color
  pdf.rect(0, 0, sidebarWidth, pdf.internal.pageSize.height, 'F');

  // Add Title (centered in content area)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  const title = 'Health History Form';
  const titleWidth = pdf.getTextWidth(title);
  const contentCenterX = contentLeftMargin + (contentWidth / 2);
  pdf.text(title, contentCenterX - (titleWidth / 2), currentY);
  currentY += 10;

  // Add Individual Name if provided (centered)
  if (individualName) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    const nameLabel = `Individual's Name: ${individualName}`;
    const nameWidth = pdf.getTextWidth(nameLabel);
    pdf.text(nameLabel, contentCenterX - (nameWidth / 2), currentY);
    currentY += 8;
  }

  // Add date generated (right aligned)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  const generatedDate = `Generated: ${dayjs().format('MM/DD/YYYY h:mm A')}`;
  pdf.text(generatedDate, pageWidth - rightMargin - pdf.getTextWidth(generatedDate), currentY);
  currentY += 10;

  // Draw separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(contentLeftMargin, currentY, pageWidth - rightMargin, currentY);
  currentY += 8;

  // Process each step - show ALL steps and fields
  stepConfigs.forEach((step) => {
    // Add step title
    currentY = checkPageBreak(pdf, currentY, 12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(step.title.toUpperCase(), contentLeftMargin, currentY);
    currentY += 10;

    // Process each section in the step
    step.sections.forEach((section) => {
      // Add section heading
      currentY = addSectionHeading(pdf, section.sectionTitle, currentY, contentLeftMargin);

      // Add ALL fields for this section (even if empty)
      section.fields.forEach((fieldName) => {
        const label = fieldLabels[fieldName] || fieldName;
        const value = formData[fieldName];
        
        // Always show the field, regardless of value
        currentY = addField(pdf, label, value, currentY, contentLeftMargin, contentWidth);
      });

      // Add spacing after section
      currentY += 3;
    });

    // Add spacing between steps
    currentY += 5;
  });

  // Draw sidebar on all pages (if multiple pages)
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFillColor(60, 60, 60); // Dark grey color
    pdf.rect(0, 0, sidebarWidth, pdf.internal.pageSize.height, 'F');
  }

  // Generate PDF blob and create object URL
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // Open PDF in new window/tab for print preview
  const printWindow = window.open(pdfUrl, '_blank');
  
  if (printWindow) {
    // Function to trigger print preview
    const triggerPrint = () => {
      try {
        if (printWindow && !printWindow.closed) {
          // Focus the window and trigger print dialog (print preview)
          printWindow.focus();
          printWindow.print();
        }
      } catch (error) {
        console.error('Error triggering print:', error);
      }
    };
    
    // Wait for PDF to fully load before triggering print preview
    // Use multiple attempts to ensure PDF viewer is ready
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryPrint = setInterval(() => {
      attempts++;
      
      try {
        // Check if window is still open
        if (printWindow.closed) {
          clearInterval(tryPrint);
          URL.revokeObjectURL(pdfUrl);
          return;
        }
        
        // Try to trigger print (will work once PDF is loaded)
        printWindow.focus();
        printWindow.print();
        
        // If we successfully called print, clear interval
        clearInterval(tryPrint);
        
        // Clean up URL after print dialog opens
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 2000);
      } catch (error) {
        // If error, continue trying
        if (attempts >= maxAttempts) {
          clearInterval(tryPrint);
          // Final attempt
          setTimeout(() => {
            try {
              if (printWindow && !printWindow.closed) {
                printWindow.focus();
                printWindow.print();
              }
            } catch (e) {
              console.error('Final print attempt failed:', e);
            }
            URL.revokeObjectURL(pdfUrl);
          }, 500);
        }
      }
    }, 300); // Check every 300ms
    
    // Fallback: ensure print is triggered even if interval doesn't work
    setTimeout(() => {
      clearInterval(tryPrint);
      triggerPrint();
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 2000);
    }, 3000);
    
  } else {
    // If popup blocked, fall back to download
    pdf.save('health_history_form.pdf');
    URL.revokeObjectURL(pdfUrl);
  }
}

