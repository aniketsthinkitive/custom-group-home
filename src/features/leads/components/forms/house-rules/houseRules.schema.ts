import * as yup from 'yup';

export const houseRulesFormSchema = yup.object({
  // Step 3: Signatures (no validations)
  program_manager_name: yup.string().nullable(),
  program_manager_date: yup.date().nullable(),
  guardian_signature: yup.string().nullable(),
  guardian_date: yup.date().nullable(),
  case_manager_signature: yup.string().nullable(),
  case_manager_date: yup.date().nullable(),
  client_signature: yup.string().nullable(),
  client_date: yup.date().nullable(),
  signatureMethod: yup.string().nullable(),
});

