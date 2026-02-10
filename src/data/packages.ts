export type Package = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  status: "active" | "hidden" | "inactive" | "upcoming";
  features: string[];
  groups: {
    whatsapp?: string;
    telegram?: string;
    facebook?: string;
  };
  isHighlighted?: boolean;
};

export const demoPackages: Package[] = [
  {
    id: "starter",
    name: "Starter Growth",
    description: "Kickstart your campaign with ready-to-launch assets and managed onboarding.",
    price: 199,
    currency: "BDT",
    status: "active",
    features: ["Account setup & audit", "1x onboarding call", "Priority chat support"],
    groups: {
      whatsapp: "https://wa.me/0000000000",
      telegram: "https://t.me/insafstorebd_support",
    },
    isHighlighted: true,
  },
  {
    id: "scale",
    name: "Scale Engine",
    description: "Automations, campaign playbooks, and weekly check-ins to scale safely.",
    price: 499,
    currency: "BDT",
    status: "active",
    features: ["Automation setup", "Weekly performance reviews", "Conversion reporting"],
    groups: {
      whatsapp: "https://wa.me/0000000000",
      facebook: "https://facebook.com/groups/insafstorebd",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise Care",
    description: "Hands-on management, SLA-backed responses, and executive analytics.",
    price: 999,
    currency: "BDT",
    status: "active",
    features: ["Dedicated manager", "24/7 escalation", "Custom AI chatbot playbooks"],
    groups: {
      telegram: "https://t.me/insafstorebd_elite",
      facebook: "https://facebook.com/groups/insafstorebd",
    },
  },
];
