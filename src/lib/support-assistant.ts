export type SupportQuestionKey =
  | "boost_methods"
  | "pricing"
  | "solo_duo"
  | "placements"
  | "tracking"
  | "payments"
  | "account_access";

export type SupportQuestion = {
  key: SupportQuestionKey;
  label: string;
  shortLabel: string;
  answer: string;
};

export const supportQuestions: SupportQuestion[] = [
  {
    key: "boost_methods",
    label: "Which boost type should I choose?",
    shortLabel: "Boost type",
    answer:
      "Division boost is best when you want a specific rank target. Net wins is best when you want guaranteed wins above losses. Placements covers up to five placement games. Duo boost is self-play with the booster. Pay per game is cheaper, but every game counts whether it is a win or loss.",
  },
  {
    key: "pricing",
    label: "How is the price calculated?",
    shortLabel: "Pricing",
    answer:
      "Pricing depends on the selected service, queue, current rank, current LP, target rank, selected game or win count, duo premium, and add-ons. Higher ranks cost more because each win or division takes more time and risk.",
  },
  {
    key: "solo_duo",
    label: "What is the difference between solo and duo boost?",
    shortLabel: "Solo vs duo",
    answer:
      "Duo boost means you keep playing on your own account while queued with the booster. Solo boost means the booster completes the games for you after the paid order handoff. Duo is usually more expensive because it takes more coordination.",
  },
  {
    key: "placements",
    label: "How do placement games work?",
    shortLabel: "Placements",
    answer:
      "League placement boost orders are capped at five games. You choose the queue, role preferences, and number of placement games. The quote is based on your current or expected rank tier.",
  },
  {
    key: "tracking",
    label: "How do I track my order?",
    shortLabel: "Tracking",
    answer:
      "After checkout, your order dashboard shows the selected service, target, status, payment state, milestones, and updates. Admin and support replies will also appear in this assistant when you return.",
  },
  {
    key: "payments",
    label: "Can I change my order after paying?",
    shortLabel: "Changes",
    answer:
      "Small preference changes such as role or champion pool can usually be handled before the booster starts. Rank target, win count, or service type changes may need a support request because they can change the price.",
  },
  {
    key: "account_access",
    label: "Do you need account access for solo boost?",
    shortLabel: "Account access",
    answer:
      "Duo boost does not require account access because you play yourself. Solo boost requires authorized temporary access after checkout through the protected order handoff. Do not post account details in public chat or support messages.",
  },
];

export function getSupportQuestion(key: string | null | undefined) {
  return supportQuestions.find((question) => question.key === key) ?? null;
}

export const fallbackBotAnswer =
  "I can help with boost types, pricing, placements, tracking, payments, and solo or duo differences. If that does not answer it, choose Contact support and send the team your question.";
