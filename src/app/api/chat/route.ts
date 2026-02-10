import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchChatEntries, fetchPackages, upsertChatEntry } from "@/lib/db";

const chatMessageSchema = z.object({
  message: z.string().min(2),
  packageId: z.string().optional(),
  language: z.enum(["en", "bn"]).optional().default("en"),
});

const chatAdminSchema = z.object({
  id: z.string().min(1),
  topic: z.string(),
  prompt: z.string(),
  response: z.string(),
  enabled: z.boolean(),
  tags: z.array(z.string()).optional(),
});

// Bangla responses
const bnResponses = {
  buy: (name: string, price: number | string) => 
    `আপনি ${name ?? "নির্বাচিত"} প্যাকেজটি $${price ?? ""} এ কিনতে পারেন। প্রদত্ত নম্বরে পেমেন্ট পাঠান, আপনার ট্রানজ্যাকশন আইডি রাখুন, তারপর ক্রয় পৃষ্ঠায় জমা দিন। পেমেন্ট নিশ্চিত হলে আমি গ্রুপ লিংকও শেয়ার করতে পারি।`,
  policy: "আপনি /policy পৃষ্ঠায় আমাদের শর্তাবলী, গোপনীয়তা, রিফান্ড এবং দায়মুক্তি পর্যালোচনা করতে পারেন। প্রয়োজনে আমি এটি আপনার জন্য খুলতে পারি।",
  payment: "অ্যাডমিন-নির্ধারিত নম্বরে পেমেন্ট পাঠান, ট্রানজ্যাকশন আইডি রাখুন, ক্রয় ফর্মের মাধ্যমে জমা দিন এবং গ্রুপে স্ক্রিনশট পোস্ট করুন।",
  default: "আমি অফার, পেমেন্ট স্টেপ, নীতিমালা বা অ্যাডমিনের সাথে সংযোগে সাহায্য করতে পারি। আপনার কী প্রয়োজন বলুন।",
};

// English responses
const enResponses = {
  buy: (name: string, price: number | string) => 
    `You can buy the ${name ?? "selected"} package for $${price ?? ""}. Send payment to the provided number, keep your transaction ID, then submit it on the Purchase page. I can also share the group link once payment is confirmed.`,
  policy: "You can review our Terms, Privacy, Refund, and Disclaimer on the /policy page. I can open it for you if needed.",
  payment: "Send payment to the admin-defined number, keep the transaction ID, submit it via the purchase form, and post a screenshot in the group.",
  default: "I can help with offers, payment steps, policies, or connecting you to an admin. Tell me what you need.",
};

export async function GET() {
  const knowledge = await fetchChatEntries();
  return NextResponse.json({ knowledge });
}

export async function POST(req: Request) {
  try {
    const { message, packageId, language } = chatMessageSchema.parse(await req.json());
    const [packagesResult, knowledge] = await Promise.all([fetchPackages(), fetchChatEntries()]);
    const packages = packagesResult.packages;

    const lower = message.toLowerCase();
    const active = packages.find((p) => p.id === packageId) ?? packages[0];
    const responses = language === "bn" ? bnResponses : enResponses;

    // Check for Bangla keywords too
    const buyKeywords = language === "bn" 
      ? ["buy", "purchase", "কিনুন", "কিনতে", "ক্রয়"]
      : ["buy", "purchase"];
    const policyKeywords = language === "bn"
      ? ["policy", "নীতি", "নীতিমালা", "শর্ত"]
      : ["policy"];
    const paymentKeywords = language === "bn"
      ? ["payment", "পেমেন্ট", "টাকা", "পাঠান"]
      : ["payment"];

    const knowledgeHit = knowledge.find((k) => k.enabled && k.tags?.some((tag) => lower.includes(tag.toLowerCase())));

    let reply = knowledgeHit?.response;
    if (!reply) {
      if (buyKeywords.some(kw => lower.includes(kw))) {
        reply = responses.buy(active?.name ?? "", active?.price ?? "");
      } else if (policyKeywords.some(kw => lower.includes(kw))) {
        reply = responses.policy;
      } else if (paymentKeywords.some(kw => lower.includes(kw))) {
        reply = responses.payment;
      } else {
        reply = responses.default;
      }
    }

    return NextResponse.json({ reply, package: active?.name, source: knowledgeHit ? "knowledge" : "rule" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to answer";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const entry = chatAdminSchema.parse(await req.json());
    const saved = await upsertChatEntry(entry);
    return NextResponse.json({ ok: true, entry: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save entry";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
