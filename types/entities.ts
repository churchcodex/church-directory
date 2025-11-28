export interface Church {
  id: string;
  name: string;
  location: string;
  images: string[];
  head_pastor: string;
  members: number;
  income: number;
}

export type ClergyType = "Bishop" | "Mother" | "Sister" | "Reverend" | "Pastor" | "Governor";

export type Ministry = "GLGC" | "Film Stars" | "Dancing Stars" | "Praise and Worship" | "N/A";

export type DancingStarsCreativeArts =
  | "Eels on wheels"
  | "Spiders"
  | "Doves"
  | "Lizardos"
  | "Butterflies"
  | "Kangaroos"
  | "Impalas"
  | "Unicorns"
  | "Gazelles"
  | "Camels"
  | "Eagles"
  | "Lions"
  | "Dolphins";

export type FilmStarsCreativeArts =
  | "Actors Ministry"
  | "Props Ministry"
  | "Costume ministry"
  | "Make up"
  | "Protocol"
  | "Script writers"
  | "Social media"
  | "Technical"
  | "Love theatre company";

export type GLGCCreativeArts =
  | "Many Are Called"
  | "Love is Large"
  | "Peace and Love"
  | "True Love"
  | "Love Never Fails"
  | "Abundant Love"
  | "Steadfast Love"
  | "Perfect Love"
  | "Unfeigned Love"
  | "Love Is Patient"
  | "Everlasting Love"
  | "God So Loved";

export type PraiseAndWorshipCreativeArts = "Praise Stars" | "Worship Stars";

export type CreativeArts =
  | DancingStarsCreativeArts
  | FilmStarsCreativeArts
  | GLGCCreativeArts
  | PraiseAndWorshipCreativeArts;

export type Basonta =
  | "Backstage Hostesses"
  | "Backstage Hosts"
  | "Engedi Food Team"
  | "Mood Changing Food Team"
  | "Marriage Counseling"
  | "Sheep seeking September"
  | "Sheep seeking October"
  | "Sheep seeking November"
  | "Sheep seeking December"
  | "Sheep seeking January"
  | "Sheep seeking February"
  | "Sheep seeking March"
  | "Sheep seeking April"
  | "Sheep seeking May"
  | "Sheep seeking June"
  | "Sheep seeking July"
  | "Sheep seeking August"
  | "School of Solid Foundation"
  | "School of Victorious Living"
  | "School of Evangelism"
  | "School of the Word"
  | "School of Apologetics"
  | "Addictions and substance abuse Counsellors"
  | "Grief and Trauma Counsellors"
  | "Relationship and love related issues Counsellors"
  | "Career and financial management Counsellors"
  | "Business Community"
  | "Music mixers"
  | "Salvation corner ushers"
  | "Podcast corner ushers"
  | "Balcony ushers"
  | "Left wing ushers"
  | "Right wing ushers"
  | "Middle ground ushers"
  | "Photography Team"
  | "Vox Team"
  | "Video Clip Cutters Team"
  | "YouTube & Graphics Team"
  | "X Team"
  | "TikTok & Snapchat Team"
  | "Videography team"
  | "Meta Team"
  | "FLOC Production and editing Team"
  | "Clap nighters"
  | "Sunday intercessors"
  | "Soul winning intercessors"
  | "Testimony Maestros"
  | "Mood changing Campus control"
  | "External Campus control"
  | "Cross Car Park Campus control"
  | "Office block Car Park Campus control"
  | "Revival street Campus control"
  | "Lord's Tower- Praise and Worship"
  | "Lord's Tower- Preaching and solo team"
  | "Lord's Tower- Film stars"
  | "Lord's Tower- Choir"
  | "Lord's Tower- Dance"
  | "Choir Telepastors"
  | "Dancing stars Telepastors"
  | "Film stars Telepastors"
  | "Basonta Telepastors"
  | "Philippians Telepastors"
  | "Galatians Telepastors"
  | "Ephesians Telepastors"
  | "Anagkazo Telepastors"
  | "Hostesses of the Offices"
  | "Hostesses of the First timers"
  | "Hostesses of the Greater lovers & Special Visitors"
  | "Balcony Security"
  | "Stage Security"
  | "Ground Security"
  | "I - church"
  | "J - Church"
  | "K - Church"
  | "B - Church"
  | "Y - Church"
  | "Lovelets Check in"
  | "Smiles on arrival airport stars"
  | "First Offering airport stars"
  | "Second offering airport stars"
  | "Bus welcomers airport stars"
  | "Car welcomers airport stars"
  | "Car confirmers"
  | "Bus confirmers"
  | "Payments"
  | "Treasurers"
  | "Fragrance"
  | "Governors lounge"
  | "The Lord's garden"
  | "HGE Telepastors"
  | "HGE Understanding campaign"
  | "HGE Sheep seeking"
  | "HGE Airport Stars"
  | "HGE Intimate counseling"
  | "HGE Lord's tower"
  | "HGE Ushers"
  | "HGE Hostesses"
  | "HGE Hearing and seeing";

export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";

export type Gender = "Male" | "Female";

export type Council = "Philippians" | "Galatians" | "Colossians" | "2 Corinthians" | "Anagkazo" | "Ephesians" | "N/A";

export type Area =
  | "HGE Area 1"
  | "HGE Area 2"
  | "HGE Area 3"
  | "HGE Area 4"
  | "Experience Area 1"
  | "Experience Area 2"
  | "Experience Area 3"
  | "Experience Area 4";

export type Status = "Active" | "Inactive";

export type Occupation = "Medical Doctor" | "Lawyer" | "Engineer" | "Accountant" | "Pharmacist" | "Student" | "Other";

export interface Pastor {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  date_of_appointment?: string;
  profile_image?: string;
  clergy_type?: ClergyType[];
  marital_status?: MaritalStatus;
  church?: string;
  gender?: Gender;
  council?: Council;
  area?: Area;
  ministry?: Ministry;
  ministry_group?: string;
  basonta?: string;
  occupation?: string;
  country?: string;
  email?: string;
  contact_number?: string;
  status?: Status;
}
