export interface GroupHomeDetails {
  id: string;
  groupHomeName: string;
  contactNumber: string;
  emailId: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timeZone: string;
  avatarUrl?: string;
  certificates: Certificate[];
}

export interface Certificate {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedOn: string;
  uploadedAt: string;
}

export const mockGroupHomeDetails: GroupHomeDetails = {
  id: "1",
  groupHomeName: "New Memory care",
  contactNumber: "555-012-3456",
  emailId: "contact@mywebsite.com",
  addressLine1: "221B Baker Street, Near Regent's Park",
  addressLine2: "-",
  city: "Springfield",
  state: "California",
  zipCode: "90210",
  country: "United States",
  timeZone: "Pacific Timezone",
  avatarUrl: undefined,
  certificates: [
    {
      id: "1",
      fileName: "Certificate.pdf",
      fileSize: "200 KB",
      uploadedOn: "12/01/2025",
      uploadedAt: "2:30 PM",
    },
    {
      id: "2",
      fileName: "Certificate.pdf",
      fileSize: "200 KB",
      uploadedOn: "12/01/2025",
      uploadedAt: "2:30 PM",
    },
    {
      id: "3",
      fileName: "Certificate.pdf",
      fileSize: "200 KB",
      uploadedOn: "12/01/2025",
      uploadedAt: "2:30 PM",
    },
  ],
};
