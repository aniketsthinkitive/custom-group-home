export interface HouseRulesFormValues {
  // Step 1: Rules Acknowledgement
  acknowledgements: {
    rules_ack: boolean;
    damage_ack: boolean;
  };
  
  // Step 2: Signatures
  signatures: {
    program_manager_signature: string;
    program_manager_date: Date | null;
    guardian_signature: string;
    guardian_date: Date | null;
    case_manager_signature: string;
    case_manager_date: Date | null;
    client_signature: string;
    client_date: Date | null;
    signatureMethod: 'DRAW' | 'UPLOAD';
  };
}




