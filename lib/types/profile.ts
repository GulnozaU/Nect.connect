export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  has_onboarded: boolean;
  linkedin_connected: boolean;
  linkedin_access_token: string | null;
  linkedin_person_id: string | null;
};
