// types/carePlan.types.ts
export type CarePlan = {
    uuid: string;
    referral_number?: string;
    leadUuid: string;
    residentName: string;
    avatarUrl?: string;
    groupHome: string;
    date: string;
    createdAt?: string;

    // Profile Fields
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    roomNumber?: string;
    status?: string;
    guardian?: {
        firstName: string;
        lastName: string;
        phone?: string;
        email?: string;
        relation?: string;
    };
  };
  