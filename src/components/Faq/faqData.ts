import { FAQ } from "@/types/faq";

const faqData: FAQ[] = [
  {
    id: 74,
    question: "What is Amorolle Journal?",
    answer:
      "A private journaling app with optional AI assistance. You write entries; with your consent the assistant can notice patterns, send reminders, and help with lists, bills, and next steps. It is not a mental health provider and does not diagnose.",
  },
  {
    id: 100,
    question: "Does the AI read everything I write?",
    answer:
      "Only if you opt in to AI insights. You can mark any entry as private so it is excluded from analysis, recaps, and texts. Crisis-related writing is also kept out of normal insight processing.",
  },
  {
    id: 7,
    question: "Is this a replacement for therapy?",
    answer:
      "No. The journal can support reflection and everyday organization, but it is not therapy, does not diagnose, and is not a substitute for professional care. If you are in crisis, call or text 988.",
  },
  {
    id: 67,
    question: "What can the assistant help with?",
    answer:
      "Recaps, gentle observations, reminders, research requests, and life organization such as to-dos, shopping lists, and bill due dates — confirmed with you before anything is added on your behalf.",
  },
  {
    id: 9,
    question: "How do I get started?",
    answer:
      "Sign in through Amorolle, open Journal, and write your first entry. You can add a mood, tags, and choose whether that entry can be used for AI insights.",
  },
  {
    id: 10,
    question: "Have more questions or need assistance?",
    answer:
      "<ContactSection />",
  }
];

export default faqData;
