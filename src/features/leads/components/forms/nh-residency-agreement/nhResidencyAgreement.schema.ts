import * as yup from 'yup';

export const nhResidencyAgreementFormSchema = yup.object({
  // Step 1: Basic Information
  residentName: yup.string().required('Resident name is required'),
  providerName: yup.string().required('Provider name is required'),
  residentialAddress: yup.string().nullable(),
  
  // Step 2: Agreement Details
  residencyTermFrom: yup
    .date()
    .nullable()
    .test(
      'residencyTermFrom-not-future',
      'From Date cannot be in the future.',
      (value) => {
        if (!value) return true;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return value <= today;
      }
    ),
  residencyTermTo: yup
    .date()
    .nullable()
    .test(
      'residencyTermTo-not-before-from',
      'To Date cannot be earlier than From Date.',
      function (value) {
        const { residencyTermFrom } = this.parent;
        if (!value || !residencyTermFrom) return true;
        return value >= residencyTermFrom;
      }
    ),
  residencyTerm: yup.string().nullable(),
  
  // Step 3: Rights Acknowledgement
  rightsAcknowledged: yup.boolean().required().oneOf([true], 'You must acknowledge that you have read and understand your rights'),
  
  // Step 4: Responsibilities (optional checkboxes)
  residentResponsibilitiesAcknowledged: yup.boolean().nullable(),
  providerResponsibilitiesAcknowledged: yup.boolean().nullable(),
  
  // Step 5: Signatures
  residentSignature: yup.string().required('Resident signature is required'),
  residentSignatureDate: yup.date().nullable().required('Resident signature date is required'),
  residentPrintName: yup.string().required('Resident printed name is required'),
  legalGuardianSignature: yup.string().nullable(),
  legalGuardianSignatureDate: yup.date().nullable(),
  legalGuardianPrintName: yup.string().nullable(),
  providerSignature: yup.string().required('Provider signature is required'),
  providerSignatureDate: yup.date().nullable().required('Provider signature date is required'),
  providerPrintName: yup.string().required('Provider printed name is required'),
  signatureMethod: yup.string().nullable(),
});

