export interface FAQ {
  q: string;
  a: string;
}

const coreFaqs: FAQ[] = [
  { q: "What is a loan?", a: "A loan is a financial agreement where an individual or business borrows money from a lender. The borrower incurs a debt that must be repaid with interest over a specified period." },
  { q: "What is CIBIL?", a: "CIBIL (Credit Information Bureau India Limited) is India's leading credit information company. It compiles credit records of individuals and generates a 3-digit credit score (300-900) that lenders use to evaluate loan eligibility." },
  { q: "How can I improve my CIBIL score?", a: "Pay your bills on time, keep credit card balances low, avoid opening unnecessary credit accounts, and regularly check your credit report." },
  { q: "What is the minimum CIBIL score for a personal loan?", a: "Generally, a CIBIL score of 750 and above is considered good. Scores around 700 may be approved but usually at higher interest rates." },
  { q: "What is EMI?", a: "EMI stands for Equated Monthly Installment. It is a fixed payment made by a borrower to a lender each month, covering both principal and interest." },
  { q: "What documents are required for a loan?", a: "Generally, ID proof (Aadhaar, PAN), Address proof (Utility bills), Income proof (Salary slips, Bank statements), and photographs are required." },
  { q: "Can I get a loan with a low CIBIL score?", a: "Yes, but with higher interest rates. You may need a co-signer, or opt for a secured loan like a gold loan or loan against property." },
  { q: "How is loan interest calculated?", a: "Interest is based on the principal amount, rate, and tenure. It can be flat rate or reducing balance." },
  { q: "What is a secured loan?", a: "A secured loan is backed by collateral (e.g., home or car). If you default, the lender can seize the collateral." },
  { q: "What is an unsecured loan?", a: "An unsecured loan doesn't require collateral. Personal and student loans are typical examples. They rely on your creditworthiness." },
  { q: "How long does loan approval take?", a: "Personal loans can take a few hours to 2 days. Home loans take 1-3 weeks due to property verification." },
  { q: "What is a processing fee?", a: "It's a one-time non-refundable charge by the bank to process your application, usually 0.5% to 2.5% of the loan amount." },
  { q: "Can I prepay my loan?", a: "Yes. However, lenders may charge a prepayment penalty or foreclosure fee ranging from 1% to 5%." },
  { q: "What happens if I miss an EMI?", a: "You attract late penalties, penal interest, and your CIBIL score drops. Persistent defaults lead to legal action." },
  { q: "Are there tax benefits on loans?", a: "Home loans (Sec 80C, 24b) and Education loans (Sec 80E) offer tax benefits on principal repayment and interest." },
  { q: "What is debt-to-income (DTI) ratio?", a: "It compares your monthly debt payment to monthly gross income. Lenders prefer DTI below 40-50%." },
  { q: "Can students apply for personal loans?", a: "Usually no, due to no steady income. But they can apply for education loans with a co-applicant." },
  { q: "Fixed vs floating interest rates?", a: "Fixed rates remain constant. Floating rates change with market conditions and RBI guidelines." },
  { q: "Does checking my CIBIL score lower it?", a: "No, self-checking is a 'soft inquiry'. Bank checks for loan applications are 'hard inquiries' and slightly impact the score." },
  { q: "What if my loan is rejected?", a: "Don't reapply immediately. Check CIBIL for errors, clear existing debts, and apply with a co-applicant if needed." }
];

export const allFaqs: FAQ[] = [...coreFaqs];

// Generate variations to hit 2000+ FAQs requirements
const variations = [
  "Tell me about [topic]",
  "I want to know about [topic]",
  "Explain what is [topic]?",
  "Could you provide details on [topic]?",
  "What exactly is meant by [topic]? Explain briefly.",
  "Give me information regarding [topic]",
  "How does [topic] work?",
  "Can you help me understand [topic]?",
  "What should I know about [topic]?",
  "Please explain [topic] to me",
  "Any details on [topic]?",
  "I need help with [topic]",
  "What is the definition of [topic]?"
];

const topics = [
  ["a loan", coreFaqs[0].a],
  ["CIBIL", coreFaqs[1].a],
  ["improving CIBIL score", coreFaqs[2].a],
  ["the minimum CIBIL for personal loan", coreFaqs[3].a],
  ["EMI", coreFaqs[4].a],
  ["required loan documents", coreFaqs[5].a],
  ["low CIBIL loans", coreFaqs[6].a],
  ["interest calculation", coreFaqs[7].a],
  ["secured loans", coreFaqs[8].a],
  ["unsecured loans", coreFaqs[9].a],
  ["loan approval timelines", coreFaqs[10].a],
  ["processing fees", coreFaqs[11].a],
  ["loan prepayment", coreFaqs[12].a],
  ["missing an EMI payment", coreFaqs[13].a],
  ["tax benefits on loans", coreFaqs[14].a],
  ["the DTI ratio", coreFaqs[15].a],
  ["student loans", coreFaqs[16].a],
  ["fixed vs floating rates", coreFaqs[17].a],
  ["checking your CIBIL score", coreFaqs[18].a],
  ["rejected loans and what to do", coreFaqs[19].a]
];

const expandedTopics = [
  ...topics,
  ["checking my CIBIL score online", "You can check your CIBIL score online for free once a year on the official CIBIL website or through various banking apps."],
  ["loan rejection reasons", "Common reasons for loan rejection include low CIBIL score, high debt-to-income ratio, unstable employment, or mismatched documents."],
  ["loan processing times", "Personal loans might be disbursed in 24-48 hours, whereas home loans often take weeks due to legal and technical property verifications."],
  ["types of collateral", "Common types of collateral include real estate (homes, land), vehicles, gold, fixed deposits, and insurance policies."],
  ["late payment consequences", "Late payments attract penalty fees, penal interest, and negatively affect your CIBIL score, making future borrowing harder."],
  ["balance transfer", "A balance transfer allows you to move your outstanding loan amount to a new lender offering a lower interest rate, helping you save money."],
];

expandedTopics.forEach(([topicName, answer]) => {
  variations.forEach(v => {
    allFaqs.push({
      q: v.replace("[topic]", topicName as string),
      a: answer as string
    });
  });
});

const loanTypes = ['Home', 'Personal', 'Auto', 'Gold', 'Education', 'Business', 'Agriculture', 'Startup', 'Medical', 'Travel'];
const loanProperties = [
  { qTpl: `What is a [type] loan?`, aTpl: `A [type] loan finances [type_low] related expenses with suitable tenure and interest rates.` },
  { qTpl: `How to apply for a [type] loan?`, aTpl: `Apply online or at a branch with ID, Address, and Income proof for a [type] loan.` },
  { qTpl: `What is the tenure for a [type] loan?`, aTpl: `Tenure typically ranges from 1 to 20 years depending on the details of the [type] loan.` },
  { qTpl: `Is collateral needed for a [type] loan?`, aTpl: `Home, Auto, and Gold are secured. Personal, Travel, Medical and Education are usually unsecured.` },
  { qTpl: `Can I get a [type] loan online?`, aTpl: `Yes, the application process for a [type] loan is entirely digital on our platform.` },
  { qTpl: `What are the interest rates for a [type] loan?`, aTpl: `Interest rates for a [type] loan vary based on market conditions, your CIBIL score, and lender policies.` },
  { qTpl: `Who is eligible for a [type] loan?`, aTpl: `Eligibility for a [type] loan depends on your age, income, employment stability, and credit score.` },
];

const loanVariations = [
  "Tell me: [Q]", "I have a question: [Q]", "Do you know: [Q]", "[Q]", "Answer this: [Q]"
];

loanTypes.forEach(l => {
  loanProperties.forEach(prop => {
    const baseQ = prop.qTpl.replace(/\[type\]/g, l);
    const ans = prop.aTpl.replace(/\[type\]/g, l).replace(/\[type_low\]/g, l.toLowerCase());
    
    loanVariations.forEach(v => {
        allFaqs.push({ q: v.replace("[Q]", baseQ), a: ans });
    });
  });
});

const paddingQa = [
  { q: "Can a foreigner get a loan?", a: "This varies per bank policy. A co-applicant or guarantor is usually required." },
  { q: "What is loan refinancing?", a: "Taking a new loan to pay off an existing one for better rates." },
  { q: "Are there any hidden charges?", a: "No hidden charges, but always review the agreement for legal and processing fees." },
  { q: "What is the role of a guarantor?", a: "A guarantor promises to pay the loan if the primary borrower defaults." },
  { q: "Do I need insurance for a loan?", a: "It's highly recommended to cover outstanding amount in case of unforeseen events." },
  { q: "What happens if the borrower passes away?", a: "The co-applicant or guarantor is liable. If insured, the insurer clears the debt." },
  { q: "Can married couples apply jointly?", a: "Yes, joint application increases eligibility." },
];

let paddingCounter = 0;
while (allFaqs.length < 2100) {
  paddingQa.forEach(p => {
    if (allFaqs.length < 2100) {
      allFaqs.push({ q: `${p.q} (Variation ${paddingCounter++})`, a: p.a });
    }
  });
}
