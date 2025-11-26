export interface Church {
  id: string;
  name: string;
  location: string;
  images: string[];
  head_pastor: string;
  members: number;
  income: number;
}

export type ClergyType = "Bishop" | "Mother" | "Sister" | "Reverend" | "Pastor";

export type Ministry =
  | "Film Stars"
  | "GLGC"
  | "Dancing Stars"
  | "Praise and Worship"
  | "Ushers"
  | "Airport Stars"
  | "Telepastors"
  | "Sheep Seeking"
  | "";

export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";

export type Gender = "Male" | "Female";

export type Council = "Philippians" | "Galatians" | "2 Corinthians" | "Anagkazo" | "Area 1" | "Area 3" | "Area 4";

export type Occupation = "Medical Doctor" | "Lawyer" | "Engineer" | "Accountant" | "Pharmacist" | "Other";

export interface Pastor {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  position?: string;
  profile_image?: string;
  clergy_type?: ClergyType;
  marital_status?: MaritalStatus;
  church?: string;
  gender?: Gender;
  council?: Council;
  occupation?: string;
  country?: string;
  phone_number?: string;
  whatsapp_number?: string;
}
