export interface Church {
  id: string;
  name: string;
  location: string;
  images: string[];
  head_pastor: string;
  members: number;
  income: number;
}

export type ClergyType = "Bishop" | "Mother" | "Sister" | "Reverend" | "Pastor" | "Basonta Leader" | "Governor";

export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";

export interface Pastor {
  id: string;
  name: string;
  date_of_birth: string; // ISO date string
  position: string;
  profile_image: string;
  clergy_type: ClergyType;
  marital_status: MaritalStatus;
  church: string; // Church ID reference
}
