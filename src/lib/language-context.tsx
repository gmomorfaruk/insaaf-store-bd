"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "bn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Bangla translations
const translations: Record<string, Record<Language, string>> = {
  // Navbar
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.packages": { en: "Packages", bn: "প্যাকেজ" },
  "nav.reviews": { en: "Reviews", bn: "রিভিউ" },
  "nav.contact": { en: "Contact", bn: "যোগাযোগ" },
  "nav.policy": { en: "Policy", bn: "নীতিমালা" },
  "nav.profile": { en: "Profile", bn: "প্রোফাইল" },
  "nav.buyNow": { en: "Buy Now", bn: "এখনই কিনুন" },

  // Home page
  "home.tagline": { en: "Insaaf Store BD · Premium Digital Packages", bn: "ইনসাফ স্টোর বিডি · প্রিমিয়াম ডিজিটাল প্যাকেজ" },
  "home.trusted": { en: "Trusted · 24/7 Support · 100% Refundable", bn: "বিশ্বস্ত · ২৪/৭ সাপোর্ট · ১০০% রিফান্ডযোগ্য" },
  "home.hero.title": { en: "Premium AI & Social Platform Packages at Unbeatable Prices", bn: "অতুলনীয় মূল্যে প্রিমিয়াম AI ও সোশ্যাল প্ল্যাটফর্ম প্যাকেজ" },
  "home.hero.subtitle": { en: "Get ChatGPT, Canva Pro, Netflix, Spotify & 50+ premium subscriptions at the lowest prices in Bangladesh. Trusted by 10,000+ customers with 24/7 support and 100% money-back guarantee.", bn: "বাংলাদেশে সর্বনিম্ন মূল্যে ChatGPT, Canva Pro, Netflix, Spotify এবং ৫০+ প্রিমিয়াম সাবস্ক্রিপশন পান। ২৪/৭ সাপোর্ট এবং ১০০% মানি-ব্যাক গ্যারান্টি সহ ১০,০০০+ গ্রাহকের বিশ্বস্ত।" },
  "home.startPurchase": { en: "Browse Packages", bn: "প্যাকেজ দেখুন" },
  "home.viewPolicies": { en: "View policies", bn: "নীতিমালা দেখুন" },
  "home.secureCheckout": { en: "100% Secure Payment", bn: "১০০% নিরাপদ পেমেন্ট" },
  "home.liveApprovals": { en: "Instant Delivery", bn: "তাৎক্ষণিক ডেলিভারি" },
  "home.aiChat": { en: "24/7 Live Support", bn: "২৪/৭ লাইভ সাপোর্ট" },
  "home.livePackages": { en: "Hot Deals", bn: "হট ডিল" },
  "home.updatedRealtime": { en: "Limited time offers", bn: "সীমিত সময়ের অফার" },
  "home.loadingPackages": { en: "Loading packages...", bn: "প্যাকেজ লোড হচ্ছে..." },
  "home.noPackages": { en: "New packages coming soon!", bn: "নতুন প্যাকেজ শীঘ্রই আসছে!" },
  "home.chatbotInfo": { en: "Questions? Our AI assistant is here 24/7 to help you find the perfect package.", bn: "প্রশ্ন? আমাদের AI সহকারী আপনাকে সঠিক প্যাকেজ খুঁজে পেতে ২৪/৭ এখানে আছে।" },
  "home.activePackages": { en: "All Packages", bn: "সব প্যাকেজ" },
  "home.pickService": { en: "Choose your premium subscription", bn: "আপনার প্রিমিয়াম সাবস্ক্রিপশন বাছুন" },
  "home.onlyActive": { en: "All packages are genuine, verified, and come with warranty. Lowest prices guaranteed!", bn: "সব প্যাকেজ আসল, যাচাইকৃত এবং ওয়ারেন্টি সহ। সর্বনিম্ন মূল্য গ্যারান্টিযুক্ত!" },
  "home.goToCheckout": { en: "Go to checkout", bn: "চেকআউটে যান" },
  "home.package": { en: "Package", bn: "প্যাকেজ" },
  "home.oneTime": { en: "One-time", bn: "এককালীন" },
  "home.buy": { en: "Buy Now", bn: "এখনই কিনুন" },
  "home.details": { en: "Details", bn: "বিস্তারিত" },
  "home.whatsappGroup": { en: "WhatsApp", bn: "হোয়াটসঅ্যাপ" },
  "home.telegram": { en: "Telegram", bn: "টেলিগ্রাম" },
  "home.facebookGroup": { en: "Facebook", bn: "ফেসবুক" },
  "home.noPackagesAvailable": { en: "New packages arriving soon. Stay tuned!", bn: "নতুন প্যাকেজ শীঘ্রই আসছে। আমাদের সাথে থাকুন!" },
  
  // Steps
  "home.step": { en: "Step", bn: "ধাপ" },
  "home.step1.title": { en: "Choose Package", bn: "প্যাকেজ বাছুন" },
  "home.step1.copy": { en: "Browse 50+ premium AI & social media subscriptions at unbeatable prices.", bn: "অতুলনীয় মূল্যে ৫০+ প্রিমিয়াম AI ও সোশ্যাল মিডিয়া সাবস্ক্রিপশন দেখুন।" },
  "home.step2.title": { en: "Secure Payment", bn: "নিরাপদ পেমেন্ট" },
  "home.step2.copy": { en: "Pay via bKash, Nagad, or bank transfer. 100% secure & refundable.", bn: "bKash, নগদ বা ব্যাংক ট্রান্সফারে পেমেন্ট করুন। ১০০% নিরাপদ ও রিফান্ডযোগ্য।" },
  "home.step3.title": { en: "Instant Access", bn: "তাৎক্ষণিক অ্যাক্সেস" },
  "home.step3.copy": { en: "Get your credentials within minutes. Enjoy 24/7 support if you need help.", bn: "মিনিটের মধ্যে আপনার ক্রেডেনশিয়াল পান। প্রয়োজনে ২৪/৭ সাপোর্ট উপভোগ করুন।" },

  // Chatbot section
  "home.chatbotKnowledge": { en: "AI Support", bn: "AI সাপোর্ট" },
  "home.aiConcierge": { en: "24/7 AI Assistant at Your Service", bn: "২৪/৭ AI সহকারী আপনার সেবায়" },
  "home.chatbotDesc": { en: "Our smart assistant knows all packages, prices, and can guide you through the purchase process instantly. Available round the clock!", bn: "আমাদের স্মার্ট সহকারী সব প্যাকেজ, মূল্য জানে এবং তাৎক্ষণিকভাবে ক্রয় প্রক্রিয়ায় আপনাকে গাইড করতে পারে। সারাক্ষণ উপলব্ধ!" },
  "home.offerAware": { en: "Instant Price Quotes", bn: "তাৎক্ষণিক মূল্য" },
  "home.paymentProof": { en: "Payment Guidance", bn: "পেমেন্ট গাইড" },
  "home.groupJoin": { en: "Quick Support", bn: "দ্রুত সাপোর্ট" },
  "home.adminControl": { en: "Live Availability", bn: "লাইভ উপলব্ধতা" },
  "home.policyReady": { en: "100% Money-Back Guarantee", bn: "১০০% মানি-ব্যাক গ্যারান্টি" },
  "home.keepBuyersSafe": { en: "Shop with Complete Confidence", bn: "সম্পূর্ণ আস্থায় কেনাকাটা করুন" },
  "home.policyDesc": { en: "Not satisfied? Get a full refund. No questions asked. Your trust is our priority.", bn: "সন্তুষ্ট নন? সম্পূর্ণ রিফান্ড পান। কোনো প্রশ্ন নেই। আপনার বিশ্বাস আমাদের অগ্রাধিকার।" },
  "home.viewPolicy": { en: "View Guarantee", bn: "গ্যারান্টি দেখুন" },

  // Purchase page
  "purchase.secureCheckout": { en: "Secure Checkout", bn: "নিরাপদ চেকআউট" },
  "purchase.title": { en: "Complete Your Purchase", bn: "আপনার ক্রয় সম্পন্ন করুন" },
  "purchase.subtitle": { en: "Pay via bKash/Nagad, submit your transaction ID, and get instant access to your premium subscription. 100% money-back guarantee if not satisfied!", bn: "bKash/নগদ দিয়ে পেমেন্ট করুন, আপনার ট্রানজ্যাকশন আইডি জমা দিন এবং আপনার প্রিমিয়াম সাবস্ক্রিপশনে তাৎক্ষণিক অ্যাক্সেস পান। সন্তুষ্ট না হলে ১০০% মানি-ব্যাক গ্যারান্টি!" },
  "purchase.paymentNumber": { en: "Payment number", bn: "পেমেন্ট নম্বর" },
  "purchase.paymentPlaceholder": { en: "+00 000 0000 (replace in admin)", bn: "+০০ ০০০ ০০০০ (অ্যাডমিনে প্রতিস্থাপন করুন)" },
  "purchase.reminder": { en: "Reminder", bn: "রিমাইন্ডার" },
  "purchase.reminderText": { en: "Send screenshot in your group after submitting.", bn: "জমা দেওয়ার পরে আপনার গ্রুপে স্ক্রিনশট পাঠান।" },
  "purchase.noPackages": { en: "No packages available at the moment. Please check back later.", bn: "এই মুহূর্তে কোনো প্যাকেজ নেই। অনুগ্রহ করে পরে আবার দেখুন।" },
  "purchase.fullName": { en: "Full name", bn: "পুরো নাম" },
  "purchase.namePlaceholder": { en: "John Carter", bn: "আপনার নাম" },
  "purchase.email": { en: "Email", bn: "ইমেইল" },
  "purchase.emailPlaceholder": { en: "you@example.com", bn: "আপনার@ইমেইল.কম" },
  "purchase.userName": { en: "Username (optional)", bn: "ইউজারনেম (ঐচ্ছিক)" },
  "purchase.userNamePlaceholder": { en: "e.g. insaaf_user", bn: "যেমন insaaf_user" },
  "purchase.userId": { en: "User ID (optional)", bn: "ইউজার আইডি (ঐচ্ছিক)" },
  "purchase.userIdPlaceholder": { en: "e.g. 12345", bn: "যেমন 12345" },
  "purchase.mobile": { en: "Mobile number", bn: "মোবাইল নম্বর" },
  "purchase.mobilePlaceholder": { en: "Include country code", bn: "দেশের কোড সহ" },
  "purchase.source": { en: "Source platform", bn: "সোর্স প্ল্যাটফর্ম" },
  "purchase.package": { en: "Package", bn: "প্যাকেজ" },
  "purchase.packagePrice": { en: "Package price", bn: "প্যাকেজ মূল্য" },
  "purchase.transactionId": { en: "Transaction ID", bn: "ট্রানজ্যাকশন আইডি" },
  "purchase.transactionPlaceholder": { en: "Paste the ID from your payment receipt", bn: "আপনার পেমেন্ট রসিদ থেকে আইডি পেস্ট করুন" },
  "purchase.submit": { en: "Submit payment", bn: "পেমেন্ট জমা দিন" },
  "purchase.submitting": { en: "Submitting...", bn: "জমা হচ্ছে..." },
  "purchase.backToHome": { en: "Back to home", bn: "হোমে ফিরুন" },
  "purchase.completeFields": { en: "Please complete all required fields.", bn: "অনুগ্রহ করে সব প্রয়োজনীয় ফিল্ড পূরণ করুন।" },
  "purchase.submitted": { en: "🎉 Order Received! You'll get your credentials within minutes. Check WhatsApp/Email!", bn: "🎉 অর্ডার পাওয়া গেছে! মিনিটের মধ্যে আপনার ক্রেডেনশিয়াল পাবেন। হোয়াটসঅ্যাপ/ইমেইল চেক করুন!" },

  // Contact page
  "contact.tag": { en: "Contact Us", bn: "যোগাযোগ করুন" },
  "contact.title": { en: "We're Here 24/7", bn: "আমরা ২৪/৭ এখানে আছি" },
  "contact.subtitle": { en: "Need help with your purchase? Want a custom package? Our support team responds within minutes!", bn: "আপনার ক্রয়ে সাহায্য প্রয়োজন? কাস্টম প্যাকেজ চান? আমাদের সাপোর্ট টিম মিনিটের মধ্যে উত্তর দেয়!" },
  "contact.sendMessage": { en: "Send us a message", bn: "আমাদের একটি বার্তা পাঠান" },
  "contact.yourName": { en: "Your Name", bn: "আপনার নাম" },
  "contact.namePlaceholder": { en: "John Doe", bn: "আপনার নাম" },
  "contact.email": { en: "Email", bn: "ইমেইল" },
  "contact.emailPlaceholder": { en: "you@example.com", bn: "আপনার@ইমেইল.কম" },
  "contact.mobile": { en: "Mobile Number", bn: "মোবাইল নম্বর" },
  "contact.mobilePlaceholder": { en: "+1 234 567 890", bn: "+৮৮ ০১৭ ০০০ ০০০০" },
  "contact.message": { en: "Message", bn: "বার্তা" },
  "contact.messagePlaceholder": { en: "How can we help you?", bn: "কিভাবে আমরা আপনাকে সাহায্য করতে পারি?" },
  "contact.send": { en: "Send Message", bn: "বার্তা পাঠান" },
  "contact.sending": { en: "Sending...", bn: "পাঠানো হচ্ছে..." },
  "contact.messageSent": { en: "Message Sent!", bn: "বার্তা পাঠানো হয়েছে!" },
  "contact.getBackSoon": { en: "Our team will respond within minutes. Thank you for choosing us!", bn: "আমাদের টিম মিনিটের মধ্যে উত্তর দেবে। আমাদের বেছে নেওয়ার জন্য ধন্যবাদ!" },
  "contact.sendAnother": { en: "Send Another Message", bn: "আরেকটি বার্তা পাঠান" },
  "contact.liveChat": { en: "Instant Support", bn: "তাৎক্ষণিক সাপোর্ট" },
  "contact.liveChatDesc": { en: "Get instant help on WhatsApp or Telegram - we reply within minutes!", bn: "হোয়াটসঅ্যাপ বা টেলিগ্রামে তাৎক্ষণিক সাহায্য পান - আমরা মিনিটের মধ্যে উত্তর দিই!" },
  "contact.whatsapp": { en: "WhatsApp", bn: "হোয়াটসঅ্যাপ" },
  "contact.whatsappNotSet": { en: "WhatsApp (Not set)", bn: "হোয়াটসঅ্যাপ (সেট করা হয়নি)" },
  "contact.telegramNotSet": { en: "Telegram (Not set)", bn: "টেলিগ্রাম (সেট করা হয়নি)" },
  "contact.emailTitle": { en: "Email", bn: "ইমেইল" },
  "contact.emailDesc": { en: "For receipts, approvals, or policy questions.", bn: "রসিদ, অনুমোদন বা নীতি সংক্রান্ত প্রশ্নের জন্য।" },
  "contact.emailNotConfigured": { en: "Email not configured yet", bn: "ইমেইল এখনো কনফিগার করা হয়নি" },
  "contact.followUs": { en: "Join Our Community", bn: "আমাদের কমিউনিটিতে যোগ দিন" },
  "contact.followUsDesc": { en: "Get exclusive deals, flash sales, and new package updates first!", bn: "এক্সক্লুসিভ ডিল, ফ্ল্যাশ সেল এবং নতুন প্যাকেজ আপডেট সবার আগে পান!" },
  "contact.facebookPage": { en: "Facebook Page", bn: "ফেসবুক পেজ" },

  // Reviews page
  "reviews.tag": { en: "10,000+ Happy Customers", bn: "১০,০০০+ সন্তুষ্ট গ্রাহক" },
  "reviews.title": { en: "See Why Customers Trust Us", bn: "দেখুন কেন গ্রাহকরা আমাদের বিশ্বাস করেন" },
  "reviews.subtitle": { en: "Real reviews from real customers. Join thousands who got premium subscriptions at the best prices with 100% satisfaction!", bn: "প্রকৃত গ্রাহকদের আসল রিভিউ। হাজার হাজারের সাথে যোগ দিন যারা সেরা মূল্যে ১০০% সন্তুষ্টি সহ প্রিমিয়াম সাবস্ক্রিপশন পেয়েছেন!" },
  "reviews.whatCustomersSay": { en: "What customers say", bn: "গ্রাহকরা কী বলে" },
  "reviews.noReviews": { en: "Be the first to share your experience!", bn: "আপনার অভিজ্ঞতা শেয়ার করে প্রথম হোন!" },
  "reviews.shareYours": { en: "Share Your Experience", bn: "আপনার অভিজ্ঞতা শেয়ার করুন" },
  "reviews.leaveReview": { en: "Write a Review", bn: "একটি রিভিউ লিখুন" },
  "reviews.leaveReviewDesc": { en: "Loved your purchase? Share your experience and help others discover our premium packages!", bn: "আপনার ক্রয় ভালো লেগেছে? আপনার অভিজ্ঞতা শেয়ার করুন এবং অন্যদের আমাদের প্রিমিয়াম প্যাকেজ আবিষ্কার করতে সাহায্য করুন!" },
  "reviews.name": { en: "Name", bn: "নাম" },
  "reviews.rating": { en: "Rating", bn: "রেটিং" },
  "reviews.stars": { en: "stars", bn: "স্টার" },
  "reviews.source": { en: "Source", bn: "সোর্স" },
  "reviews.comment": { en: "Comment", bn: "মন্তব্য" },
  "reviews.commentPlaceholder": { en: "Share what worked well", bn: "কী ভালো কাজ করেছে শেয়ার করুন" },
  "reviews.submit": { en: "Submit Review", bn: "রিভিউ জমা দিন" },
  "reviews.submitting": { en: "Submitting...", bn: "জমা হচ্ছে..." },
  "reviews.submitted": { en: "Thank you! 🎉 Your review helps our community grow!", bn: "ধন্যবাদ! 🎉 আপনার রিভিউ আমাদের কমিউনিটি বাড়াতে সাহায্য করে!" },

  // Policy page
  "policy.tag": { en: "Our Guarantee", bn: "আমাদের গ্যারান্টি" },
  "policy.title": { en: "Shop with 100% Confidence", bn: "১০০% আস্থায় কেনাকাটা করুন" },
  "policy.subtitle": { en: "Your satisfaction is guaranteed. Read our transparent policies below.", bn: "আপনার সন্তুষ্টি গ্যারান্টিযুক্ত। নিচে আমাদের স্বচ্ছ নীতিগুলি পড়ুন।" },
  "policy.terms": { en: "Terms of Service", bn: "সেবার শর্তাবলী" },
  "policy.terms.1": { en: "All subscriptions are genuine and sourced from authorized channels.", bn: "সমস্ত সাবস্ক্রিপশন আসল এবং অনুমোদিত চ্যানেল থেকে সোর্স করা।" },
  "policy.terms.2": { en: "Delivery is instant - credentials sent within minutes of payment confirmation.", bn: "ডেলিভারি তাৎক্ষণিক - পেমেন্ট নিশ্চিতকরণের মিনিটের মধ্যে ক্রেডেন্শিয়াল পাঠানো হয়।" },
  "policy.terms.3": { en: "24/7 customer support available via WhatsApp, Telegram, and Facebook.", bn: "হোয়াটসঅ্যাপ, টেলিগ্রাম এবং ফেসবুকের মাধ্যমে ২৪/৭ গ্রাহক সহায়তা উপলব্ধ।" },
  "policy.terms.4": { en: "Warranty included on all packages - replacement guaranteed if any issues arise.", bn: "সমস্ত প্যাকেজে ওয়ারেন্টি অন্তর্ভুক্ত - কোনো সমস্যা হলে প্রতিস্থাপন গ্যারান্টিযুক্ত।" },
  "policy.privacy": { en: "Your Privacy Matters", bn: "আপনার গোপনীয়তা গুরুত্বপূর্ণ" },
  "policy.privacy.1": { en: "We only collect information necessary to process your order.", bn: "আমরা শুধুমাত্র আপনার অর্ডার প্রক্রিয়া করতে প্রয়োজনীয় তথ্য সংগ্রহ করি।" },
  "policy.privacy.2": { en: "Your data is encrypted and stored securely - never shared with third parties.", bn: "আপনার ডেটা এনক্রিপ্ট করে নিরাপদে সংরক্ষিত - কখনো তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।" },
  "policy.privacy.3": { en: "Payment information is processed through secure channels only.", bn: "পেমেন্ট তথ্য শুধুমাত্র নিরাপদ চ্যানেলের মাধ্যমে প্রক্রিয়া করা হয়।" },
  "policy.privacy.4": { en: "Request data deletion anytime by contacting our support team.", bn: "আমাদের সাপোর্ট টিমে যোগাযোগ করে যেকোনো সময় ডেটা মুছে ফেলার অনুরোধ করুন।" },
  "policy.refund": { en: "100% Money-Back Guarantee", bn: "১০০% মানি-ব্যাক গ্যারান্টি" },
  "policy.refund.1": { en: "Full refund available if you're not satisfied with your purchase - no questions asked!", bn: "আপনার ক্রয়ে সন্তুষ্ট না হলে সম্পূর্ণ রিফান্ড পাওয়া যায় - কোনো প্রশ্ন নেই!" },
  "policy.refund.2": { en: "Refund requests are processed within 24 hours of submission.", bn: "রিফান্ড অনুরোধ জমা দেওয়ার ২৪ ঘন্টার মধ্যে প্রক্রিয়া করা হয়।" },
  "policy.refund.3": { en: "Contact our 24/7 support for instant refund assistance.", bn: "তাৎক্ষণিক রিফান্ড সহায়তার জন্য আমাদের ২৪/৭ সাপোর্টে যোগাযোগ করুন।" },
  "policy.disclaimer": { en: "Important Notes", bn: "গুরুত্বপূর্ণ নোট" },
  "policy.disclaimer.1": { en: "Subscription validity depends on the original provider's terms.", bn: "সাবস্ক্রিপশন বৈধতা মূল প্রদানকারীর শর্তাবলীর উপর নির্ভর করে।" },
  "policy.disclaimer.2": { en: "We provide genuine subscriptions with full support and warranty.", bn: "আমরা সম্পূর্ণ সাপোর্ট এবং ওয়ারেন্টি সহ আসল সাবস্ক্রিপশন প্রদান করি।" },
  "policy.disclaimer.3": { en: "For any issues, our 24/7 support team is always ready to help.", bn: "যেকোনো সমস্যার জন্য, আমাদের ২৪/৭ সাপোর্ট টিম সবসময় সাহায্য করতে প্রস্তুত।" },

  // Footer
  "footer.title": { en: "Insaaf Store BD · Trusted Premium Subscriptions", bn: "ইনসাফ স্টোর বিডি · বিশ্বস্ত প্রিমিয়াম সাবস্ক্রিপশন" },

  // Chatbot
  "chatbot.assistant": { en: "Insaaf Store BD Assistant", bn: "ইনসাফ স্টোর বিডি সহকারী" },
  "chatbot.greeting": { en: "Hi! 👋 Looking for premium AI or social media subscriptions at the lowest prices? I'm here 24/7 to help!", bn: "হাই! 👋 সর্বনিম্ন মূল্যে প্রিমিয়াম AI বা সোশ্যাল মিডিয়া সাবস্ক্রিপশন খুঁজছেন? আমি ২৪/৭ সাহায্যে এখানে!" },
  "chatbot.thinking": { en: "Thinking...", bn: "ভাবছি..." },
  "chatbot.placeholder": { en: "Ask about packages & prices", bn: "প্যাকেজ ও মূল্য সম্পর্কে জিজ্ঞাসা করুন" },
  "chatbot.tip": { en: "Tip: Ask about ChatGPT, Netflix, Canva or say \"buy\" to get started!", bn: "টিপ: ChatGPT, Netflix, Canva সম্পর্কে জিজ্ঞাসা করুন বা শুরু করতে \"কিনুন\" বলুন!" },
  "chatbot.chat": { en: "Chat", bn: "চ্যাট" },
  "chatbot.error": { en: "I couldn't reach the server, please try again.", bn: "আমি সার্ভারে পৌঁছাতে পারিনি, অনুগ্রহ করে আবার চেষ্টা করুন।" },
  "chatbot.default": { en: "I can help you find the best deals on premium subscriptions!", bn: "আমি আপনাকে প্রিমিয়াম সাবস্ক্রিপশনে সেরা ডিল খুঁজে পেতে সাহায্য করতে পারি!" },

  // Language toggle
  "lang.toggle": { en: "বাংলা", bn: "English" },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "en" || saved === "bn")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
