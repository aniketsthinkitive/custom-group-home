export interface NHResidencyAgreementFormValues {
  // Step 1: Basic Information
  basic: {
    residentName: string;
    providerName: string;
    facilityName?: string;
    residentAddress?: string;
    providerAddress?: string;
    residentPhone?: string;
    providerPhone?: string;
    residentEmail?: string;
    providerEmail?: string;
    agreementDate?: Date | null;
  };
  
  // Step 2: Agreement Details
  agreement: {
    residencyTermFrom?: Date | null;
    residencyTermTo?: Date | null;
    residencyTerm?: string;
  };
  
  // Step 3: Rights Acknowledgement
  ack: {
    rightsAcknowledged: boolean;
  };
  
  // Step 4: Responsibilities
  responsibilities: {
    residentResponsibilitiesAcknowledged?: boolean;
    providerResponsibilitiesAcknowledged?: boolean;
  };
  
  // Step 5: Signatures
  signature: {
    residentSignature: string;
    residentSignatureDate: Date | null;
    residentPrintName: string;
    legalGuardianSignature?: string;
    legalGuardianSignatureDate?: Date | null;
    legalGuardianPrintName?: string;
    providerSignature: string;
    providerSignatureDate: Date | null;
    providerPrintName: string;
    signatureMethod: 'DRAW' | 'UPLOAD';
  };
}




