export type PackageStatus = "active" | "hidden" | "inactive" | "upcoming";

export type PackageRecord = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  status: PackageStatus;
  features: string[];
  groups: {
    whatsapp?: string;
    telegram?: string;
    facebook?: string;
  };
  is_highlighted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type OrderStatus = "pending" | "approved" | "rejected";

export type OrderRecord = {
  id: string;
  profile_id?: string | null;
  profile_number?: number | null;
  full_name: string;
  user_name?: string;
  user_id?: string;
  email: string;
  mobile: string;
  package_id: string;
  source: "WhatsApp" | "Facebook" | "Telegram" | "Website";
  transaction_id: string;
  price: number;
  currency?: string;
  status: OrderStatus;
  account_id?: string | null;
  notes?: string;
  created_at?: string;
};

export type NewOrderRecord = Omit<OrderRecord, "id" | "created_at">;

export type ChatEntry = {
  id: string;
  topic: string;
  prompt: string;
  response: string;
  enabled: boolean;
  tags?: string[];
};

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewRecord = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  source?: string;
  institution?: string; // University name or Company/Profession
  occupation?: "student" | "professional"; // Student or Job holder
  status: ReviewStatus;
  created_at?: string;
};

export type PackageAccountStatus = "available" | "assigned" | "revoked";

export type PackageAccountRecord = {
  id: string;
  package_id: string;
  username: string;
  password: string;
  status: PackageAccountStatus;
  assigned_order_id?: string | null;
  assigned_at?: string | null;
  created_at?: string;
};

export type ProfileRecord = {
  id: string;
  profile_number: number;
  full_name: string;
  email: string;
  mobile: string;
  created_at?: string;
};
