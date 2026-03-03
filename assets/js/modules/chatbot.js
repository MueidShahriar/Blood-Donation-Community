/**
 * Blood Donation AI Chatbot Module
 * Bilingual (Bangla + English) chatbot with built-in knowledge base + Gemini API
 * Acts as a personal health assistant focused on blood donation
 */

/* ── Language detection ── */
function isBangla(text) {
    // Bengali Unicode range: \u0980-\u09FF
    const banglaChars = (text.match(/[\u0980-\u09FF]/g) || []).length;
    return banglaChars > text.length * 0.15;
}

/* ── Knowledge Base (bilingual) ── */
const KNOWLEDGE_BASE = [
    // Greetings
    { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good night', 'howdy', 'sup', 'yo'],
      answer: 'Hello! 👋 I\'m your Blood Donation Assistant. I can help you with blood donation info — eligibility, blood types, preparation tips, health advice, and much more. Ask me anything!',
      answerBn: 'হ্যালো! 👋 আমি আপনার রক্তদান সহকারী। আমি রক্তদান সম্পর্কে সাহায্য করতে পারি — যোগ্যতা, রক্তের গ্রুপ, প্রস্তুতির টিপস, স্বাস্থ্য পরামর্শ এবং আরও অনেক কিছু। যেকোনো প্রশ্ন করুন!' },
    { keywords: ['assalamu', 'salam', 'আসসালামু', 'সালাম', 'ওয়ালাইকুম'],
      answer: 'Wa Alaikum Assalam! 🙏 I\'m your Blood Donation Assistant. How can I help you today?',
      answerBn: 'ওয়ালাইকুম আসসালাম! 🙏 আমি আপনার রক্তদান সহকারী। আজ কীভাবে সাহায্য করতে পারি?' },
    { keywords: ['হ্যালো', 'হাই', 'হেই', 'শুভ সকাল', 'শুভ সন্ধ্যা', 'কেমন আছ', 'কেমন আছেন', 'কি খবর', 'কি অবস্থা'],
      answer: 'Hello! 👋 I\'m your Blood Donation Assistant. How can I assist you?',
      answerBn: 'হ্যালো! 👋 আমি আপনার রক্তদান সহকারী। কীভাবে সাহায্য করতে পারি?' },
    { keywords: ['how are you', 'how r u', 'hows it going', 'whats up'],
      answer: 'I\'m doing great, thanks for asking! 😊 I\'m always ready to help with blood donation questions. What would you like to know?',
      answerBn: 'আমি ভালো আছি, ধন্যবাদ! 😊 রক্তদান সম্পর্কে যেকোনো প্রশ্ন করুন।' },
    { keywords: ['ভালো আছি', 'ভাল আছি', 'আলহামদুলিল্লাহ'],
      answer: 'Great to hear! How can I help you with blood donation today?',
      answerBn: 'শুনে ভালো লাগলো! আজ রক্তদান নিয়ে কী জানতে চান?' },

    // Thanks
    { keywords: ['thank', 'thanks', 'thx', 'ty', 'appreciate'],
      answer: 'You\'re welcome! 😊 If you have more questions about blood donation, feel free to ask. Remember — every donation can save up to 3 lives! ❤️',
      answerBn: 'স্বাগতম! 😊 রক্তদান নিয়ে আরও প্রশ্ন থাকলে জিজ্ঞাসা করুন। মনে রাখবেন — একটি রক্তদানে ৩টি জীবন বাঁচতে পারে! ❤️' },
    { keywords: ['ধন্যবাদ', 'ধন্যবাদ', 'শুক্রিয়া', 'জাযাকাল্লাহ'],
      answer: 'You\'re welcome! ❤️',
      answerBn: 'আপনাকেও ধন্যবাদ! 😊 রক্তদান নিয়ে আরও কিছু জানতে চাইলে নির্দ্বিধায় জিজ্ঞাসা করুন। ❤️' },

    // Who can donate / Eligibility
    { keywords: ['who can donate', 'eligible', 'eligibility', 'can i donate', 'requirements', 'criteria', 'qualify'],
      answer: 'Generally, anyone aged 18–65, weighing at least 50 kg (110 lbs), and in good health can donate blood. You must not have donated in the last 90 days (12 weeks). Conditions like recent surgery, pregnancy, certain medications, or chronic illnesses may temporarily or permanently defer you.',
      answerBn: 'সাধারণত ১৮-৬৫ বছর বয়সী, কমপক্ষে ৫০ কেজি ওজনের এবং সুস্থ যেকোনো ব্যক্তি রক্তদান করতে পারেন। শেষ রক্তদানের পর কমপক্ষে ৯০ দিন (১২ সপ্তাহ) অপেক্ষা করতে হবে। সাম্প্রতিক অস্ত্রোপচার, গর্ভাবস্থা, কিছু ওষুধ বা দীর্ঘস্থায়ী রোগ সাময়িক বা স্থায়ীভাবে বাধা হতে পারে।' },
    { keywords: ['কে দিতে পারে', 'যোগ্যতা', 'রক্তদান করতে পারব', 'রক্ত দিতে পারবো', 'আমি কি দিতে পারি', 'কি কি লাগে', 'শর্ত'],
      answer: 'Anyone aged 18-65, at least 50 kg, and in good health can donate. Must wait 90 days between donations.',
      answerBn: '১৮-৬৫ বছর বয়সী, কমপক্ষে ৫০ কেজি ওজনের এবং সুস্থ যেকোনো ব্যক্তি রক্তদান করতে পারেন। দুটি রক্তদানের মধ্যে কমপক্ষে ৯০ দিন (৩ মাস) বিরতি থাকতে হবে।' },

    // Blood types
    { keywords: ['blood type', 'blood group', 'types of blood', 'how many blood groups', 'blood groups list'],
      answer: 'There are 8 main blood types: A+, A-, B+, B-, O+, O-, AB+, AB-. These are determined by the ABO system and the Rh factor. O- is the universal donor (can give to all), and AB+ is the universal recipient (can receive from all).',
      answerBn: '৮টি প্রধান রক্তের গ্রুপ আছে: A+, A-, B+, B-, O+, O-, AB+, AB-। এগুলো ABO সিস্টেম এবং Rh ফ্যাক্টর দ্বারা নির্ধারিত হয়। O- হলো সার্বজনীন দাতা (সবাইকে দিতে পারে) এবং AB+ হলো সার্বজনীন গ্রহীতা (সবার থেকে নিতে পারে)।' },
    { keywords: ['রক্তের গ্রুপ', 'ব্লাড গ্রুপ', 'কত ধরনের রক্ত', 'গ্রুপ কয়টি', 'রক্তের প্রকার'],
      answer: 'There are 8 blood types: A+, A-, B+, B-, O+, O-, AB+, AB-.',
      answerBn: '৮টি প্রধান রক্তের গ্রুপ: A+, A-, B+, B-, O+, O-, AB+, AB-। O- সার্বজনীন দাতা এবং AB+ সার্বজনীন গ্রহীতা।' },

    // How often
    { keywords: ['how often', 'frequency', 'how many times', 'gap between', 'interval', 'কতদিন পর', 'কতবার', 'বিরতি'],
      answer: 'You can donate whole blood every 90 days (about 12 weeks). Platelet donations can be made every 7 days, up to 24 times a year. Double red cell donations can be made every 168 days.',
      answerBn: 'প্রতি ৯০ দিন (প্রায় ১২ সপ্তাহ) পর পর সম্পূর্ণ রক্তদান করা যায়। প্লেটলেট দান প্রতি ৭ দিনে করা যায়, বছরে সর্বোচ্চ ২৪ বার। ডাবল রেড সেল দান প্রতি ১৬৮ দিনে করা যায়।' },

    // Benefits
    { keywords: ['benefits', 'why donate', 'advantage', 'good for health', 'healthy', 'কেন দেব', 'উপকারিতা', 'সুবিধা', 'লাভ'],
      answer: 'Blood donation has many benefits: saves up to 3 lives per donation, stimulates new blood cell production, reduces iron overload, provides a free health checkup, may lower heart disease risk, and gives a great sense of fulfillment! 💪',
      answerBn: 'রক্তদানের অনেক উপকারিতা রয়েছে: একটি দানে ৩টি জীবন বাঁচে, নতুন রক্তকোষ তৈরি হয়, অতিরিক্ত আয়রন কমে, বিনামূল্যে স্বাস্থ্য পরীক্ষা হয়, হৃদরোগের ঝুঁকি কমতে পারে এবং মানসিক প্রশান্তি পাওয়া যায়! 💪' },

    // Preparation
    { keywords: ['prepare', 'before donat', 'preparation', 'what to do before', 'tips before', 'প্রস্তুতি', 'কি করব আগে', 'দানের আগে'],
      answer: 'Before donating: 1) Eat a healthy meal 2-3 hours before, 2) Drink plenty of water (at least 500ml extra), 3) Avoid fatty foods, 4) Get good sleep, 5) Bring a valid ID, 6) Wear comfortable clothing. Avoid alcohol for 24 hours.',
      answerBn: 'রক্তদানের আগে: ১) ২-৩ ঘণ্টা আগে পুষ্টিকর খাবার খান, ২) প্রচুর পানি পান করুন (কমপক্ষে ৫০০মিলি অতিরিক্ত), ৩) চর্বিযুক্ত খাবার এড়িয়ে চলুন, ৪) ভালো ঘুম নিন, ৫) বৈধ পরিচয়পত্র নিন, ৬) আরামদায়ক পোশাক পরুন। ২৪ ঘণ্টা আগে মদ্যপান এড়িয়ে চলুন।' },

    // After donation
    { keywords: ['after donat', 'post donation', 'after giving blood', 'side effects', 'what to do after', 'দানের পরে', 'পরে কি করব', 'পার্শ্বপ্রতিক্রিয়া'],
      answer: 'After donating: 1) Rest 10-15 minutes, 2) Drink extra fluids for 24-48 hours, 3) Avoid heavy lifting for 24 hours, 4) Keep bandage on for 4+ hours, 5) Eat iron-rich foods. Minor dizziness is normal and temporary.',
      answerBn: 'রক্তদানের পরে: ১) ১০-১৫ মিনিট বিশ্রাম নিন, ২) ২৪-৪৮ ঘণ্টা বেশি তরল পান করুন, ৩) ২৪ ঘণ্টা ভারী কাজ এড়িয়ে চলুন, ৪) ব্যান্ডেজ ৪+ ঘণ্টা রাখুন, ৫) আয়রন সমৃদ্ধ খাবার খান। হালকা মাথা ঘোরা স্বাভাবিক এবং সাময়িক।' },

    // Duration
    { keywords: ['how long', 'duration', 'time take', 'how much time', 'কতক্ষণ', 'সময় লাগে'],
      answer: 'The actual blood draw takes about 8-10 minutes. Including registration, screening, and rest, the whole process takes about 45-60 minutes.',
      answerBn: 'প্রকৃত রক্ত নেওয়া হয় ৮-১০ মিনিটে। নিবন্ধন, পরীক্ষা এবং বিশ্রামসহ পুরো প্রক্রিয়ায় প্রায় ৪৫-৬০ মিনিট সময় লাগে।' },

    // Pain
    { keywords: ['pain', 'hurt', 'painful', 'needle', 'does it hurt', 'ব্যথা', 'কষ্ট', 'সুই', 'ব্যথা হয়'],
      answer: 'You\'ll feel a brief pinch when the needle is inserted, but it\'s generally not painful. Most donors say it\'s much easier than expected! If you feel discomfort, let the staff know immediately.',
      answerBn: 'সুই ঢোকানোর সময় সামান্য চিমটির মতো লাগবে, কিন্তু সাধারণত ব্যথা হয় না। বেশিরভাগ দাতা বলেন এটি তাদের ধারণার চেয়ে অনেক সহজ! অস্বস্তি হলে কর্মীদের জানান।' },

    // Universal donor/recipient
    { keywords: ['universal donor', 'universal recipient', 'O negative', 'AB positive', 'সার্বজনীন দাতা', 'সার্বজনীন গ্রহীতা'],
      answer: 'O- (O negative) is the universal donor — can give red blood cells to anyone. AB+ (AB positive) is the universal recipient — can receive from any blood type. In emergencies, O- is used when the patient\'s blood type is unknown.',
      answerBn: 'O- (ও নেগেটিভ) হলো সার্বজনীন দাতা — যেকোনো রক্তের গ্রুপকে দিতে পারে। AB+ (এবি পজিটিভ) হলো সার্বজনীন গ্রহীতা — যেকোনো গ্রুপ থেকে নিতে পারে। জরুরি অবস্থায় রোগীর গ্রুপ অজানা থাকলে O- ব্যবহার হয়।' },

    // Compatibility
    { keywords: ['compatible', 'compatibility', 'who can receive', 'who can give', 'matching', 'সামঞ্জস্য', 'কে কাকে দিতে পারে', 'ম্যাচিং'],
      answer: 'O- can give to all; O+ to A+, B+, AB+, O+; A- to A+, A-, AB+, AB-; A+ to A+, AB+; B- to B+, B-, AB+, AB-; B+ to B+, AB+; AB- to AB+, AB-; AB+ to AB+ only.',
      answerBn: 'O- সবাইকে দিতে পারে; O+ দিতে পারে A+, B+, AB+, O+ কে; A- দিতে পারে A+, A-, AB+, AB- কে; A+ দিতে পারে A+, AB+ কে; B- দিতে পারে B+, B-, AB+, AB- কে; B+ দিতে পারে B+, AB+ কে; AB- দিতে পারে AB+, AB- কে; AB+ শুধু AB+ কে।' },

    // Platelet/Plasma
    { keywords: ['platelet', 'plasma', 'types of donation', 'donation types', 'component', 'প্লেটলেট', 'প্লাজমা', 'দানের ধরন'],
      answer: 'Types: 1) Whole Blood — most common, 8-10 min. 2) Platelets (Apheresis) — for cancer patients, ~2 hours. 3) Plasma — for burn/trauma patients. 4) Double Red Cells — collects twice the red cells.',
      answerBn: 'প্রকারভেদ: ১) সম্পূর্ণ রক্ত — সবচেয়ে সাধারণ, ৮-১০ মিনিট। ২) প্লেটলেট — ক্যান্সার রোগীদের জন্য, ~২ ঘণ্টা। ৩) প্লাজমা — পোড়া/ট্রমা রোগীদের জন্য। ৪) ডাবল রেড সেল — দ্বিগুণ লোহিত কণিকা সংগ্রহ।' },

    // Iron/Hemoglobin
    { keywords: ['iron', 'hemoglobin', 'anemia', 'low iron', 'আয়রন', 'হিমোগ্লোবিন', 'রক্তস্বল্পতা'],
      answer: 'Hemoglobin is checked before every donation. Men need at least 13 g/dL; women 12.5 g/dL. Eat iron-rich foods (red meat, spinach, beans, fortified cereals) and vitamin C to maintain levels.',
      answerBn: 'প্রতিবার দানের আগে হিমোগ্লোবিন পরীক্ষা করা হয়। পুরুষদের কমপক্ষে ১৩ g/dL এবং মহিলাদের ১২.৫ g/dL প্রয়োজন। আয়রন সমৃদ্ধ খাবার (মাংস, পালং শাক, ডাল) এবং ভিটামিন সি খান।' },

    // Tattoo
    { keywords: ['tattoo', 'piercing', 'can i donate with tattoo', 'ট্যাটু', 'পিয়ার্সিং'],
      answer: 'You can donate if your tattoo/piercing was done at a regulated facility with sterile equipment. Some banks require a 3-12 month wait. Check with your local blood bank.',
      answerBn: 'জীবাণুমুক্ত সরঞ্জাম দিয়ে নিয়ন্ত্রিত জায়গায় ট্যাটু/পিয়ার্সিং করা হলে রক্তদান করতে পারবেন। কিছু রক্ত ব্যাংক ৩-১২ মাস অপেক্ষা চায়। স্থানীয় রক্ত ব্যাংকে জিজ্ঞাসা করুন।' },

    // Medication
    { keywords: ['medication', 'medicine', 'drugs', 'on medication', 'ওষুধ', 'মেডিসিন', 'ঔষধ খেলে'],
      answer: 'Many medications are fine. Blood thinners (aspirin — wait 48 hrs), antibiotics (wait till course ends), Accutane (1 month wait) may require deferral. Always disclose all medications.',
      answerBn: 'অনেক ওষুধ চলাকালীন দান করা যায়। রক্ত পাতলা করার ওষুধ (অ্যাসপিরিন — ৪৮ ঘণ্টা অপেক্ষা), অ্যান্টিবায়োটিক (কোর্স শেষ হওয়া পর্যন্ত অপেক্ষা) বাধা হতে পারে। সব ওষুধের কথা জানান।' },

    // Diabetes
    { keywords: ['diabetes', 'diabetic', 'sugar', 'ডায়াবেটিস', 'সুগার', 'বহুমূত্র'],
      answer: 'Diabetics can usually donate if their condition is well-controlled. Both Type 1 and Type 2 may be eligible. Blood sugar should be normal at donation time. Insulin alone doesn\'t disqualify.',
      answerBn: 'ডায়াবেটিস নিয়ন্ত্রণে থাকলে সাধারণত রক্তদান করা যায়। টাইপ ১ ও টাইপ ২ উভয়ই যোগ্য হতে পারেন। দানের সময় রক্তের সুগার স্বাভাবিক থাকতে হবে। ইনসুলিন নেওয়া বাধা নয়।' },

    // Pregnancy
    { keywords: ['pregnancy', 'pregnant', 'breastfeeding', 'nursing', 'গর্ভবতী', 'গর্ভাবস্থা', 'বুকের দুধ', 'স্তন্যদান'],
      answer: 'Pregnant women cannot donate. Wait at least 6 weeks after giving birth. Breastfeeding mothers are generally eligible, but best to wait until baby is 6 months old.',
      answerBn: 'গর্ভবতী মহিলারা রক্তদান করতে পারবেন না। প্রসবের পর কমপক্ষে ৬ সপ্তাহ অপেক্ষা করুন। স্তন্যদানকারী মায়েরা সাধারণত যোগ্য, তবে শিশুর ৬ মাস বয়স পর্যন্ত অপেক্ষা করা ভালো।' },

    // Storage
    { keywords: ['storage', 'shelf life', 'how long blood stored', 'expiry', 'সংরক্ষণ', 'কতদিন রাখা যায়', 'মেয়াদ'],
      answer: 'Whole blood: 42 days refrigerated. Platelets: 5 days (room temp). Plasma: up to 1 year frozen. Red blood cells: up to 10 years frozen.',
      answerBn: 'সম্পূর্ণ রক্ত: ফ্রিজে ৪২ দিন। প্লেটলেট: ৫ দিন (ঘরের তাপমাত্রায়)। প্লাজমা: হিমায়িত অবস্থায় ১ বছর পর্যন্ত। লোহিত কণিকা: হিমায়িত অবস্থায় ১০ বছর পর্যন্ত।' },

    // COVID
    { keywords: ['covid', 'coronavirus', 'vaccination', 'vaccine', 'কোভিড', 'করোনা', 'টিকা', 'ভ্যাকসিন'],
      answer: 'You can donate after most COVID-19 vaccines with no waiting period (Pfizer, Moderna, AstraZeneca). After COVID infection, wait 14 days after symptoms fully resolve.',
      answerBn: 'বেশিরভাগ কোভিড-১৯ টিকা নেওয়ার পর অপেক্ষা ছাড়াই রক্তদান করা যায়। কোভিড সংক্রমণের পর লক্ষণ সম্পূর্ণ সেরে যাওয়ার ১৪ দিন পর দান করতে পারবেন।' },

    // Weight
    { keywords: ['weight', 'minimum weight', 'how heavy', 'ওজন', 'কত কেজি', 'ন্যূনতম ওজন'],
      answer: 'Minimum weight is typically 50 kg (110 lbs). This ensures enough blood volume to safely donate ~450-500 ml.',
      answerBn: 'ন্যূনতম ওজন সাধারণত ৫০ কেজি (১১০ পাউন্ড)। এটি নিরাপদে ~৪৫০-৫০০ মিলি রক্তদানের জন্য পর্যাপ্ত রক্তের পরিমাণ নিশ্চিত করে।' },

    // Age
    { keywords: ['age', 'minimum age', 'maximum age', 'how old', 'age limit', 'বয়স', 'কত বছর', 'বয়সসীমা'],
      answer: 'Minimum age: 18 years (16-17 with parental consent in some places). Upper limit: usually 65, some places have no upper limit if healthy.',
      answerBn: 'ন্যূনতম বয়স: ১৮ বছর (কিছু জায়গায় ১৬-১৭ অভিভাবকের সম্মতিতে)। সর্বোচ্চ বয়স: সাধারণত ৬৫, কিছু জায়গায় সুস্থ থাকলে সীমা নেই।' },

    // Emergency
    { keywords: ['emergency', 'urgent', 'need blood', 'blood needed', 'জরুরি', 'রক্ত দরকার', 'রক্ত লাগবে', 'রক্ত প্রয়োজন'],
      answer: 'In emergencies: 1) Contact nearest hospital blood bank, 2) Use our "Search Donors" page to find donors by blood group, 3) Share on social media, 4) Contact local blood donation organizations.',
      answerBn: 'জরুরি অবস্থায়: ১) নিকটস্থ হাসপাতালের ব্লাড ব্যাংকে যোগাযোগ করুন, ২) আমাদের "ডোনার খুঁজুন" পেজে রক্তের গ্রুপ অনুযায়ী দাতা খুঁজুন, ৩) সোশ্যাল মিডিয়ায় শেয়ার করুন, ৪) স্থানীয় রক্তদান সংগঠনে যোগাযোগ করুন।' },

    // Motivation
    { keywords: ['motivation', 'inspire', 'why should i', 'scared', 'nervous', 'fear', 'ভয়', 'উৎসাহ', 'অনুপ্রেরণা', 'কেন করব', 'ভয় লাগে'],
      answer: 'Every 2 seconds, someone needs blood. One donation saves up to 3 lives! 🩸 There\'s no substitute for human blood. By donating, you become a hero to a patient waiting for a chance to live. Your small act of courage creates a huge impact. Be brave, be a donor! 💪❤️',
      answerBn: 'প্রতি ২ সেকেন্ডে কারো রক্তের প্রয়োজন হয়। একটি দানে ৩টি জীবন বাঁচে! 🩸 মানুষের রক্তের কোনো বিকল্প নেই। রক্তদান করে আপনি একজন রোগীর জন্য আশার আলো হয়ে উঠবেন। আপনার ছোট সাহসী পদক্ষেপ বিশাল প্রভাব ফেলে। সাহসী হোন, রক্তদাতা হোন! 💪❤️' },

    // Smoking
    { keywords: ['smoke', 'smoking', 'cigarette', 'ধূমপান', 'সিগারেট'],
      answer: 'Smokers can donate blood! Just avoid smoking for at least 1 hour before and after donation. This helps your body recover better.',
      answerBn: 'ধূমপায়ীরা রক্তদান করতে পারেন! শুধু দানের কমপক্ষে ১ ঘণ্টা আগে ও পরে ধূমপান এড়িয়ে চলুন। এটি শরীরের পুনরুদ্ধারে সাহায্য করে।' },

    // Food / Diet
    { keywords: ['food', 'diet', 'eat', 'nutrition', 'what to eat', 'খাবার', 'কি খাব', 'খাদ্য', 'পুষ্টি'],
      answer: 'Before donation: eat iron-rich foods (red meat, spinach, lentils, beans). After: drink juice, eat snacks, have iron-rich meals. Avoid fatty foods before donating. Stay hydrated! 🥤',
      answerBn: 'দানের আগে: আয়রন সমৃদ্ধ খাবার খান (মাংস, পালং শাক, ডাল, শিম)। পরে: জুস পান করুন, স্ন্যাকস খান, আয়রন সমৃদ্ধ খাবার খান। দানের আগে চর্বিযুক্ত খাবার এড়িয়ে চলুন। পানি বেশি পান করুন! 🥤' },

    // What is blood donation
    { keywords: ['what is blood donation', 'blood donation meaning', 'define', 'রক্তদান কি', 'রক্তদান কী', 'রক্তদান মানে'],
      answer: 'Blood donation is the voluntary act of giving your blood to help save others\' lives. The donated blood is used for transfusions, surgeries, accident victims, cancer patients, and people with blood disorders. It\'s one of the greatest gifts you can give! 🩸',
      answerBn: 'রক্তদান হলো অন্যের জীবন বাঁচাতে স্বেচ্ছায় নিজের রক্ত দেওয়ার মহৎ কাজ। দান করা রক্ত রক্ত সংযোজন, অস্ত্রোপচার, দুর্ঘটনার শিকার, ক্যান্সার রোগী এবং রক্তের রোগে আক্রান্তদের জন্য ব্যবহার হয়। এটি সবচেয়ে মূল্যবান উপহারগুলোর একটি! 🩸' },

    // This website / community
    { keywords: ['this website', 'this site', 'blood donation community', 'your community', 'এই ওয়েবসাইট', 'এই সাইট', 'তোমাদের কমিউনিটি'],
      answer: 'Blood Donation Community is a volunteer-driven platform that connects blood donors with patients in need. You can join as a donor, search for donors by blood group, view events, and get your donor card! Visit our Search page to find donors near you.',
      answerBn: 'ব্লাড ডোনেশন কমিউনিটি একটি স্বেচ্ছাসেবী প্ল্যাটফর্ম যা রক্তদাতা ও রোগীদের সংযুক্ত করে। আপনি দাতা হিসেবে যোগ দিতে পারেন, রক্তের গ্রুপ অনুযায়ী দাতা খুঁজতে পারেন, ইভেন্ট দেখতে পারেন এবং ডোনার কার্ড পেতে পারেন! আমাদের সার্চ পেজে দাতা খুঁজুন।' },

    // Bye
    { keywords: ['bye', 'goodbye', 'see you', 'বিদায়', 'আবার দেখা হবে', 'যাই'],
      answer: 'Goodbye! Take care and remember — donating blood saves lives! See you soon! 👋❤️',
      answerBn: 'বিদায়! ভালো থাকবেন এবং মনে রাখবেন — রক্তদান জীবন বাঁচায়! আবার দেখা হবে! 👋❤️' },
];

function findLocalAnswer(question) {
    const q = question.toLowerCase().trim();
    const bangla = isBangla(question);
    let bestMatch = null;
    let bestScore = 0;
    for (const entry of KNOWLEDGE_BASE) {
        let score = 0;
        for (const kw of entry.keywords) {
            if (q.includes(kw.toLowerCase())) {
                score += kw.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }
    if (bestScore >= 2 && bestMatch) {
        return bangla ? (bestMatch.answerBn || bestMatch.answer) : bestMatch.answer;
    }
    return null;
}

const GEMINI_API_KEY = 'AIzaSyDa1OeSnJKLmVlPi9MNsAqfKDWEgxW-Vuk';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function askGemini(question) {
    const bangla = isBangla(question);
    const langInstruction = bangla
        ? 'The user is asking in Bengali/Bangla. You MUST reply in Bengali/Bangla language using Bengali script.'
        : 'The user is asking in English. Reply in English.';

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a friendly, knowledgeable blood donation and health assistant for the "Blood Donation Community" website. You act as a personal health assistant focused on blood donation.

Your capabilities:
- Answer all blood donation questions (eligibility, types, preparation, safety, benefits, health tips)
- Respond to greetings warmly (hi, hello, salam, etc.)
- Provide health motivation and encouragement related to blood donation
- Answer general health questions that relate to blood donation (iron levels, diet, fitness for donation, etc.)
- If the question is completely unrelated to health or blood donation, politely redirect

${langInstruction}

Keep answers concise (2-4 sentences max), warm, and helpful. Use emojis occasionally for a friendly tone.

User's question: ${question}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 400
                }
            })
        });
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
        console.error('Gemini API error:', err);
        return null;
    }
}

async function getAnswer(question) {
    const localAnswer = findLocalAnswer(question);
    if (localAnswer) return localAnswer;
    const aiAnswer = await askGemini(question);
    if (aiAnswer) return aiAnswer;
    const bangla = isBangla(question);
    return bangla
        ? 'দুঃখিত, আমি শুধুমাত্র রক্তদান সম্পর্কিত প্রশ্নে সাহায্য করতে পারি। রক্তের গ্রুপ, দানের যোগ্যতা, প্রস্তুতির টিপস ইত্যাদি বিষয়ে জিজ্ঞাসা করুন!'
        : "I'm sorry, I can only help with blood donation related questions. Please try asking about blood types, donation eligibility, preparation tips, or other blood donation topics!";
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function initChatbot() {
    // Create chat FAB button
    const fab = document.createElement('div');
    fab.id = 'chatbot-fab';
    fab.innerHTML = `<button id="chatbot-toggle" aria-label="Blood Donation Assistant" title="Blood Donation Assistant" style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;border:none;cursor:pointer;box-shadow:0 6px 24px rgba(220,38,38,0.35);display:flex;align-items:center;justify-content:center;transition:all 0.3s;font-size:1.2rem;position:relative">
        <i class="fa-solid fa-robot"></i>
        <span style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:#10b981;border-radius:50%;border:2px solid #fff"></span>
    </button>`;
    fab.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:45;transition:bottom 0.3s ease;';

    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chatbot-window';
    chatWindow.style.cssText = 'position:fixed;bottom:136px;right:24px;width:360px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 180px);background:#fff;border-radius:1.25rem;box-shadow:0 20px 60px rgba(0,0,0,0.15),0 0 0 1px rgba(0,0,0,0.05);z-index:46;display:none;flex-direction:column;overflow:hidden;font-family:Inter,sans-serif;';
    chatWindow.innerHTML = `
        <div style="background:linear-gradient(135deg,#b91c1c,#dc2626,#ef4444);padding:1rem 1.25rem;display:flex;align-items:center;gap:0.75rem;flex-shrink:0">
            <div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="fa-solid fa-robot" style="color:#fff;font-size:1.05rem"></i>
            </div>
            <div style="flex:1;min-width:0">
                <div style="font-size:0.92rem;font-weight:700;color:#fff">Blood Donation Assistant</div>
                <div style="font-size:0.7rem;color:rgba(255,255,255,0.75);display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block"></span> Online</div>
            </div>
            <button id="chatbot-close" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                <i class="fa-solid fa-xmark" style="font-size:0.85rem"></i>
            </button>
        </div>
        <div id="chatbot-messages" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;background:#f9fafb;scroll-behavior:smooth">
            <div style="display:flex;gap:0.5rem;align-items:flex-start">
                <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#ef4444);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
                    <i class="fa-solid fa-robot" style="color:#fff;font-size:0.65rem"></i>
                </div>
                <div style="background:#fff;border-radius:0 0.85rem 0.85rem 0.85rem;padding:0.7rem 0.9rem;font-size:0.82rem;color:#374151;line-height:1.5;box-shadow:0 1px 3px rgba(0,0,0,0.06);max-width:85%">
                    Hello! 👋 I'm your <strong>Blood Donation Assistant</strong>. Ask me anything about blood donation — eligibility, blood types, preparation, and more!
                </div>
            </div>
        </div>
        <div style="padding:0.75rem;background:#fff;border-top:1px solid #f3f4f6;flex-shrink:0">
            <form id="chatbot-form" style="display:flex;gap:0.5rem;align-items:center">
                <input id="chatbot-input" type="text" placeholder="Ask about blood donation..." autocomplete="off" style="flex:1;padding:0.6rem 0.9rem;border:1.5px solid #e5e7eb;border-radius:0.75rem;font-size:0.82rem;outline:none;transition:border-color 0.2s;font-family:Inter,sans-serif;background:#f9fafb" onfocus="this.style.borderColor='#fca5a5';this.style.background='#fff'" onblur="this.style.borderColor='#e5e7eb';this.style.background='#f9fafb'" />
                <button type="submit" style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <i class="fa-solid fa-paper-plane" style="font-size:0.8rem"></i>
                </button>
            </form>
            <div style="text-align:center;margin-top:0.4rem">
                <span style="font-size:0.62rem;color:#9ca3af">Powered by AI • Blood donation topics only</span>
            </div>
        </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(chatWindow);

    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const chatForm = document.getElementById('chatbot-form');
    const chatInput = document.getElementById('chatbot-input');
    const messagesDiv = document.getElementById('chatbot-messages');

    let isOpen = false;
    function toggleChat() {
        isOpen = !isOpen;
        chatWindow.style.display = isOpen ? 'flex' : 'none';
        if (isOpen) {
            chatInput.focus();
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    }
    toggleBtn?.addEventListener('click', toggleChat);
    closeBtn?.addEventListener('click', toggleChat);

    function addMessage(text, isUser) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `display:flex;gap:0.5rem;align-items:flex-start;${isUser ? 'flex-direction:row-reverse' : ''}`;
        if (isUser) {
            wrapper.innerHTML = `
                <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#818cf8);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
                    <i class="fa-solid fa-user" style="color:#fff;font-size:0.65rem"></i>
                </div>
                <div style="background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:0.85rem 0 0.85rem 0.85rem;padding:0.7rem 0.9rem;font-size:0.82rem;color:#fff;line-height:1.5;max-width:85%">${escapeHtml(text)}</div>
            `;
        } else {
            wrapper.innerHTML = `
                <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#ef4444);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
                    <i class="fa-solid fa-robot" style="color:#fff;font-size:0.65rem"></i>
                </div>
                <div style="background:#fff;border-radius:0 0.85rem 0.85rem 0.85rem;padding:0.7rem 0.9rem;font-size:0.82rem;color:#374151;line-height:1.5;box-shadow:0 1px 3px rgba(0,0,0,0.06);max-width:85%">${text}</div>
            `;
        }
        messagesDiv.appendChild(wrapper);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return wrapper;
    }

    function addTypingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.id = 'chatbot-typing';
        wrapper.style.cssText = 'display:flex;gap:0.5rem;align-items:flex-start';
        wrapper.innerHTML = `
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#ef4444);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
                <i class="fa-solid fa-robot" style="color:#fff;font-size:0.65rem"></i>
            </div>
            <div style="background:#fff;border-radius:0 0.85rem 0.85rem 0.85rem;padding:0.7rem 0.9rem;font-size:0.82rem;color:#9ca3af;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
                <span class="chatbot-dots"><span>.</span><span>.</span><span>.</span></span>
            </div>
        `;
        messagesDiv.appendChild(wrapper);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function removeTypingIndicator() {
        document.getElementById('chatbot-typing')?.remove();
    }

    chatForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = chatInput.value.trim();
        if (!question) return;
        chatInput.value = '';
        addMessage(question, true);
        addTypingIndicator();
        chatInput.disabled = true;
        try {
            const answer = await getAnswer(question);
            removeTypingIndicator();
            addMessage(answer, false);
        } catch (err) {
            removeTypingIndicator();
            addMessage("Sorry, something went wrong. Please try again.", false);
        }
        chatInput.disabled = false;
        chatInput.focus();
    });

    // Add typing animation styles
    const style = document.createElement('style');
    style.textContent = `
        .chatbot-dots span { animation: chatbot-blink 1.4s infinite both; font-size: 1.5rem; line-height: 0.5; }
        .chatbot-dots span:nth-child(2) { animation-delay: 0.2s; }
        .chatbot-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes chatbot-blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
        #chatbot-messages::-webkit-scrollbar { width: 4px; }
        #chatbot-messages::-webkit-scrollbar-track { background: transparent; }
        #chatbot-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        @media (max-width: 640px) {
            #chatbot-window { width: calc(100vw - 16px) !important; right: 8px !important; bottom: 80px !important; height: calc(100vh - 140px) !important; max-height: calc(100vh - 140px) !important; border-radius: 1rem !important; }
            #chatbot-fab { right: 16px !important; bottom: 72px !important; }
            #chatbot-fab button { width: 44px !important; height: 44px !important; font-size: 1.05rem !important; }
        }
        @media (max-width: 400px) {
            #chatbot-window { height: calc(100vh - 130px) !important; max-height: calc(100vh - 130px) !important; }
            #chatbot-fab { right: 12px !important; bottom: 68px !important; }
            #chatbot-fab button { width: 40px !important; height: 40px !important; font-size: 1rem !important; }
        }
    `;
    document.head.appendChild(style);
}
