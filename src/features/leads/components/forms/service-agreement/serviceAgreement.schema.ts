import * as yup from 'yup';
import dayjs from 'dayjs';

// Reusable phone validation (optional, exactly 10 digits)
const phoneValidation = yup
  .string()
  .nullable()
  .matches(/^\d{10}$/, {
    message: 'Enter a valid 10-digit number',
    excludeEmptyString: true,
  });

// Reusable email validation (optional, valid format when provided)
const emailValidation = yup
  .string()
  .nullable()
  .test('email-format', 'Please enter a valid email address', function (value) {
    if (!value || value.trim() === '') return true; // Allow null/empty
    return value.includes('@') && value.includes('.');
  });

export const serviceAgreementFormSchema = yup.object({
  // Step 1: General Information
  meetingDate: yup.date().nullable(),
  startDate: yup.date().nullable(),
  endDate: yup.date().nullable(),
  certificationBeginDate: yup.date().nullable(),
  certificationEndDate: yup.date().nullable(),
  firstName: yup.string().nullable(),
  middleName: yup.string().nullable(),
  lastName: yup.string().nullable(),
  dob: yup
    .date()
    .typeError('Date of birth is required')
    .required('Date of birth is required')
    // Use a test (not .max) so "today" is re-evaluated at validation time
    // rather than baked in when the schema module first loads.
    .test(
      'dob-not-future',
      'Date of birth cannot be in the future',
      (value) => !value || !dayjs(value).isAfter(dayjs(), 'day'),
    ),
  email: emailValidation,
  phone: phoneValidation,
  midNumber: yup.string().nullable(),
  mailingAddress: yup.string().nullable(),
  mailingCityStZip: yup.string().nullable(),
  residentialAddress: yup.string().nullable(),
  residentialCityStZip: yup.string().nullable(),
  region: yup.string().nullable(),
  duckNumber: yup.string().nullable(),
  waiver: yup.string().nullable(),
  servicesDeliveredByPDMS: yup.boolean().nullable(),
  guardianName: yup.string().nullable(),
  guardianPhone: phoneValidation,
  guardianEmail: emailValidation,
  guardianAddress: yup.string().nullable(),
  guardianCityStZip: yup.string().nullable(),
  guardianType: yup.string().nullable(),
  coGuardianName: yup.string().nullable(),
  coGuardianPhone: phoneValidation,
  coGuardianEmail: emailValidation,
  coGuardianAddress: yup.string().nullable(),
  coGuardianCityStZip: yup.string().nullable(),
  coGuardianType: yup.string().nullable(),
  thirdGuardianName: yup.string().nullable(),
  thirdGuardianPhone: phoneValidation,
  thirdGuardianEmail: emailValidation,
  thirdGuardianAddress: yup.string().nullable(),
  thirdGuardianCityStZip: yup.string().nullable(),
  thirdGuardianType: yup.string().nullable(),
  emergencyContactName: yup.string().nullable(),
  emergencyContactRelationship: yup.string().nullable(),
  emergencyContactPhone: phoneValidation,
  emergencyContactEmail: emailValidation,
  emergencyContactAddress: yup.string().nullable(),
  emergencyContactCityStZip: yup.string().nullable(),
  familyRepresentativeName: yup.string().nullable(),
  familyRepresentativePhone: phoneValidation,
  familyRepresentativeEmail: emailValidation,
  familyRepresentativeAddress: yup.string().nullable(),
  familyRepresentativeCityStZip: yup.string().nullable(),
  backupProviderName: yup.string().nullable(),
  backupProviderPhone: phoneValidation,
  backupProviderEmail: emailValidation,
  backupProviderAddress: yup.string().nullable(),
  backupProviderCityStZip: yup.string().nullable(),
  
  // Step 2: Diagnoses
  allergies: yup.string().nullable(),
  healthCareLevel: yup.string().nullable(),
  medicallyFragile: yup.boolean().nullable(),
  diagnosis1: yup.string().nullable(),
  diagnosis2: yup.string().nullable(),
  diagnosis3: yup.string().nullable(),
  diagnosis4: yup.string().nullable(),
  diagnosis5: yup.string().nullable(),
  diagnosis6: yup.string().nullable(),
  diagnosis7: yup.string().nullable(),
  diagnosis8: yup.string().nullable(),
  diagnosis9: yup.string().nullable(),
  diagnosis10: yup.string().nullable(),
  
  // Step 3: Guardianship
  isMinor: yup.boolean().nullable(),
  noGuardian: yup.boolean().nullable(),
  isGuardianNeeded: yup.boolean().nullable(),
  guardianInProcess: yup.boolean().nullable(),
  inProcessOfApplyingFor: yup.boolean().nullable(),
  hasGuardian: yup.boolean().nullable(),
  coGuardian: yup.boolean().nullable(),
  thirdGuardian: yup.boolean().nullable(),
  typeOfGuardianship: yup.string().nullable(),
  coGuardianTypeOfGuardianship: yup.string().nullable(),
  thirdGuardianTypeOfGuardianship: yup.string().nullable(),
  comments: yup.string().nullable(),
  
  // Step 4: Rep Payee
  hasRepPayee: yup.boolean().nullable(),
  repPayeeName: yup.string().nullable(),
  repPayeePhone: phoneValidation,
  repPayeeResidentialAddress: yup.string().nullable(),
  repPayeeMailingAddress: yup.string().nullable(),
  amountOfMonthlySpendingMoney: yup.string().nullable(),
});



