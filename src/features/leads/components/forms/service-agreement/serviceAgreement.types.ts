export interface ServiceAgreementFormValues {
  // Step 1: General Information
  generalInfo: {
    meetingDate: Date | null;
    startDate: Date | null;
    endDate: Date | null;
    certificationBeginDate: Date | null;
    certificationEndDate: Date | null;
    firstName: string;
    middleName: string;
    lastName: string;
    dob: Date | null;
    email: string;
    phone: string;
    midNumber: string;
    mailingAddress: string;
    mailingCityStZip: string;
    residentialAddress: string;
    residentialCityStZip: string;
    region: string;
    duckNumber: string;
    waiver: string;
    servicesDeliveredByPDMS: boolean;
    guardian: {
      name: string;
      phone: string;
      email: string;
      address: string;
      cityStZip: string;
      type: string;
    };
    coGuardian: {
      name: string;
      phone: string;
      email: string;
      address: string;
      cityStZip: string;
      type: string;
    };
    thirdGuardian: {
      name: string;
      phone: string;
      email: string;
      address: string;
      cityStZip: string;
      type: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
      email: string;
      address: string;
      cityStZip: string;
    };
    familyRepresentative: {
      name: string;
      phone: string;
      email: string;
      address: string;
      cityStZip: string;
    };
    backupProvider: {
      name: string;
      phone: string;
      email: string;
      address: string;
      cityStZip: string;
    };
  };
  
  // Step 2: Diagnoses
  diagnoses: {
    allergies: string;
    healthCareLevel: string;
    medicallyFragile: boolean;
    diagnosis1: string;
    diagnosis2: string;
    diagnosis3: string;
    diagnosis4: string;
    diagnosis5: string;
    diagnosis6: string;
    diagnosis7: string;
    diagnosis8: string;
    diagnosis9: string;
    diagnosis10: string;
  };
  
  // Step 3: Guardianship
  guardianship: {
    isMinor: boolean;
    noGuardian: boolean;
    isGuardianNeeded: boolean;
    guardianInProcess: boolean;
    inProcessOfApplyingFor: boolean;
    hasGuardian: boolean;
    coGuardian: boolean;
    thirdGuardian: boolean;
    typeOfGuardianship: string;
    coGuardianTypeOfGuardianship: string;
    thirdGuardianTypeOfGuardianship: string;
    comments: string;
  };
  
  // Step 4: Rep Payee
  repPayee: {
    hasRepPayee: boolean;
    name: string;
    phone: string;
    residentialAddress: string;
    mailingAddress: string;
    amountOfMonthlySpendingMoney: string;
  };
}




