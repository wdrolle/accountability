# AI-Assisted Journal & Life Companion App
### Product Requirements Document (Draft for Development)

---

## 1. Product Vision

A journaling app that pairs a private, reflective writing space with an AI assistant that actually *acts* on what the user writes — reaching them proactively over text message (via Twilio) rather than waiting for them to open an app. The AI reads journal entries (with consent), recognizes patterns in the user's thinking and habits, and turns those patterns into concrete, low-friction help: reminders, recaps, research, plans, and organized lists for the practical side of life (tasks, shopping, bills, budgets).

The core differentiator: most journaling apps are passive record-keepers. This one is meant to feel like a supportive personal assistant who has actually read your journal, remembers what you're working through, and checks in on you — by text, where people already live.

---

## 2. Target User & Problem Statement

People who want to reflect and grow through writing, but who don't reliably return to an app on their own, and who are also juggling everyday logistics (bills, tasks, budgets) that add stress on top of whatever they're working through emotionally. They want:

- A place to process difficult thoughts and feelings that doesn't just sit there unread.
- Gentle, timely nudges that meet them where they are (text messages), not another app badge they ignore.
- Help translating "I keep thinking about X" into an actual next step.
- One place that also helps them stay on top of the boring-but-stressful parts of life — bills, budgets, shopping, chores — because financial and logistical stress compounds emotional stress.

---

## 3. Core Product Pillars

1. **Journal** — private entries (text, and ideally voice-to-text) that form the source of truth for everything else the AI does.
2. **AI Reflection & Insight** — the AI reads entries (with explicit consent) and identifies themes, recurring worries, thought patterns (e.g., catastrophizing, avoidance), progress, and mood trends over time.
3. **Two-Way SMS via Twilio** — reminders, recaps, and check-ins sent as texts; users can reply by text to add a quick journal entry, mark a task done, or ask the AI something, without opening the app.
4. **AI Agent / Concierge** — on request (or proactively, with permission), the AI does small tasks *on the user's behalf*: light research, drafting a plan, breaking a goal into steps, looking up information relevant to something the user is dealing with.
5. **Life Organization** — to-do lists, shopping lists, bill tracking, and simple budgeting, all reachable and updatable by text.
6. **Wellbeing Support (non-clinical)** — encouragement toward small daily actions that support the user's stated goals (sleep, movement, self-care, medication or habit reminders), with clear boundaries around what the app is *not* (see Section 6).

---

## 4. Detailed Feature Spec

### 4.1 Journaling (core web app)

- Free-form text entries, timestamped, tagged automatically by the AI with detected themes/moods (e.g., "work stress," "relationship," "grateful," "anxious") — tags are suggested, user can edit/remove them.
- Optional guided prompts for days the user doesn't know what to write ("What's one thing on your mind today?" / "What's something you're avoiding?").
- Mood/energy quick-rating on each entry (simple scale, e.g. 1–5) to let the AI track trends without requiring the user to write anything if they don't want to.
- Entry privacy controls: user can mark specific entries as "private / do not use for AI insights or recaps," which excludes them from any AI analysis, texts, or recaps entirely.
- Search and filter past entries by date, tag, or keyword.
- Voice-to-text entry option (stretch goal) for lower-friction journaling.

### 4.2 Two-Way SMS via Twilio

- **Outbound:** the app sends texts for reminders, recaps, check-in prompts, and AI-generated nudges (see 4.3–4.5).
- **Inbound:** users can reply to any text to:
  - Add a quick journal entry ("just texting how I feel" style — the AI converts it into a journal entry automatically).
  - Mark a reminder/task done ("done," "yes," a simple keyword scheme).
  - Ask the AI a question or make a request ("can you look up X for me," "add milk to my shopping list").
  - Snooze or reschedule a reminder ("remind me tomorrow instead").
- Twilio Conversation/Messaging API handles the SMS thread; the backend maps each inbound message to the right user, parses intent (task update vs. journal entry vs. AI request vs. list item), and routes accordingly.
- Must handle standard SMS compliance: opt-in confirmation, STOP/HELP keyword handling, A2P 10DLC registration for the Twilio number, and rate limiting so users aren't overwhelmed with texts.
- User-configurable quiet hours and message frequency (e.g., max 1 check-in text/day, no texts after 9pm) — this should be a first-class setting, not an afterthought, given the emotional nature of the content.

### 4.3 AI-Generated Recaps

- **Daily recap** (optional, opt-in): a short evening or morning text summarizing yesterday's entries — themes, mood trend, and one gentle reflective question or observation.
- **Weekly recap**: a slightly longer summary (can link to a fuller view in the web app) highlighting patterns across the week — what came up repeatedly, what seemed to help, what the user said they wanted to work on and whether they made progress.
- Recaps should be written in a warm, non-clinical tone — reflecting the user's own words back to them rather than diagnosing or labeling.
- User can reply to a recap to correct or add context, which feeds back into future recaps.

### 4.4 Thought-Pattern & Trend Analysis

- Over time, the AI should surface (gently, not alarmingly) recurring patterns it notices in the user's writing — for example, a recurring worry, a pattern of avoiding a certain topic, a repeated negative self-talk phrase, or a cyclical mood pattern tied to certain days/events.
- These insights should be framed as observations and questions ("I've noticed you've mentioned feeling overwhelmed at work three times this week — want to talk through what's driving that, or make a plan around it?"), never as clinical diagnoses.
- Insights view in the web app: a simple dashboard showing mood over time, top recurring themes/tags, and any patterns the AI has flagged, so the user can see their own trends visually, not just in texts.

### 4.5 AI as Personal Concierge ("research and plan on my behalf")

This is the more agentic layer — things the AI *does*, not just reflects on:

- **Light research requests**: the user can ask (by text or in-app) for the AI to look something up — e.g., "find me three therapists near me who take my insurance," "what are some good beginner strength-training plans," "look up how to negotiate a raise." The AI researches and texts back a concise summary with next steps, not a wall of text.
- **Goal breakdown / planning**: if a user writes in their journal (or tells the AI directly) that they want to achieve something — get out of debt, start exercising, apply for a new job — the AI helps turn it into a concrete plan: a short sequence of small, dated steps, which then become reminders.
- **Contextual follow-through**: if a user's journal entry mentions an intention ("I really need to call my mom this week," "I should start looking for a new apartment"), the AI can proactively offer to set a reminder for it, closing the loop between reflection and action.
- Every agentic action (setting a reminder, adding a task, sending research results) should be confirmed with the user, either by requiring a quick reply ("Want me to set a reminder for this? Reply YES") or a clearly reversible in-app action — never something silently added without visibility.

### 4.6 Daily Task & Habit Reminders

- Users (or the AI, per 4.5) can create recurring or one-off reminders tied to personal goals — habits, self-care, errands, appointments.
- Reminders arrive by text at a user-chosen time; replying done/skip/snooze updates the task without needing the app.
- Optional "streaks" or simple progress tracking for habits the user is trying to build (kept low-pressure — framed as encouragement, never guilt).

### 4.7 Life Organization: Lists

- **General to-do lists**: create, view, check off, and reorder items by text or in-app. Texting "add [item] to [list name]" should just work.
- **Shopping lists**: a dedicated list type; items can be grouped by store/category (stretch goal: auto-categorize into aisle sections).
- Users can maintain multiple named lists (e.g., "Groceries," "Weekend errands," "Apartment hunting").
- Shareable lists (stretch goal) so a partner or family member can view/edit a shared shopping or household list.

### 4.8 Bills, Budgets & Payment Reminders

- **Bill tracking**: user enters recurring bills (name, amount, due date, frequency) manually, or connects accounts via a bank-aggregation provider (e.g., Plaid) for automatic detection — this should be an explicit opt-in given the sensitivity of financial data.
- **Payment reminders**: text reminders ahead of due dates (configurable lead time, e.g., 3 days and 1 day before), with a quick reply to mark as paid.
- **Simple budgeting**: monthly budget by category (rent, groceries, subscriptions, etc.), with a simple text-based or in-app check-in on how spending is tracking against the budget.
- **Budget nudges**: e.g., a mid-month text if the user is trending over budget in a category, or a reminder to review subscriptions they mentioned wanting to cancel.
- This is not meant to replace a full financial app — scope it as lightweight organization and reminders, not investment/accounting features.

### 4.9 Wellbeing Nudges (non-clinical)

- Simple, optional daily check-in ("How are you feeling today, 1–5?") that feeds the mood-trend data.
- Encouragement toward small stated goals — sleep, movement, drinking water, medication or supplement reminders, therapy-appointment reminders if the user has one.
- All wellbeing features should be framed as support for habits the *user* has defined, not the app prescribing health behavior.

---

## 5. Example User Flows (illustrative SMS exchanges)

**Evening recap**
> App: "Today you wrote about feeling stretched thin at work and worrying about the apartment search. You also said you went for a walk, which you said helped. Anything you want to add before I file today away?"
> User: "no that's about right, just tired"
> App: "Got it — resting sounds like the right move tonight. 🌙"

**Goal → plan → reminder**
> User (in journal): "I really need to get my finances together, I have no idea where my money is going."
> App (next check-in): "Saw your entry about wanting a handle on your finances — want me to help set up a simple budget and a few reminders to check in on it?"
> User: "yes please"
> App: sets up budget categories in-app, texts back a simple starting budget draft and a weekly Sunday check-in reminder.

**Bill reminder**
> App: "Reminder: your internet bill ($68) is due in 3 days. Reply PAID once it's done, or SNOOZE to remind you again tomorrow."

**Research request**
> User: "can you find me some good books on managing anxiety"
> App: [after light research] "Here are 3 well-reviewed options: [Title 1], [Title 2], [Title 3] — want a short summary of any of them, or should I add one to your reading list?"

**Crisis-language detection (see Section 6)**
> User (journal entry contains language suggesting acute distress or self-harm risk)
> App does **not** attempt AI analysis/recap on that entry. Instead: "That sounds like a lot to carry right now. I'm not able to help with something this serious, but I want to make sure you have support — here's the 988 Suicide & Crisis Lifeline (call or text 988), available 24/7. Would it help to see a couple other options too?"

---

## 6. Safety, Ethical & Legal Guardrails

Because this app processes journal content about emotional struggles and "hard times," it needs explicit, non-negotiable guardrails baked in from day one:

- **Not a therapy replacement**: the app should clearly disclose, at onboarding and periodically, that it is not a mental health provider, does not diagnose, and is not a substitute for professional care.
- **Crisis-language detection**: inbound journal entries and texts should be screened (via a classifier, not just keyword matching, though keyword matching can be a first-pass filter) for language suggesting self-harm, suicidal ideation, or acute crisis. On a match:
  - Suppress normal AI recap/insight processing for that content.
  - Respond with a supportive, non-clinical message and surface crisis resources (988 Suicide & Crisis Lifeline, Crisis Text Line, or region-appropriate equivalents) rather than making assurances about confidentiality that the app can't guarantee.
  - Optionally (opt-in, set up in advance by the user) allow the user to designate a trusted contact who can be notified — this must be explicit, user-configured opt-in, never automatic, and clearly explained at setup.
- **No confident clinical claims**: the AI should never tell a user it thinks they have a specific mental health condition. It can reflect patterns ("you've mentioned trouble sleeping several nights this week") without labeling them.
- **Data sensitivity**: journal content is highly sensitive personal data. Even if the product isn't a HIPAA-covered entity, it should be engineered as if it were sensitive health-adjacent data: encryption at rest and in transit, strict access controls, no selling/sharing of data to third parties, and a clear, simple data-deletion path (user can delete their account and all associated data on demand).
- **Consent for AI processing**: users should explicitly opt in to having their entries analyzed by AI (vs. just stored privately), and should be able to exclude specific entries from AI processing (see 4.1).
- **Financial data handling**: if bank-linking (e.g., Plaid) is used for bills/budgeting, this needs its own explicit consent flow, separate from journal-AI consent, since it's a different (and equally sensitive) category of data.
- **Transparency**: users should be able to see, in plain language, what the AI has "learned" about them (e.g., a settings page showing detected recurring themes) and be able to correct or delete that.

---

## 7. High-Level Technical Architecture

*(Presented as requirements/options — final stack choices are left to the development team.)*

- **Frontend**: a responsive web app for full journaling, insights dashboard, list/budget management, and settings.
- **Backend API**: handles auth, journal storage, list/task/bill CRUD, scheduling of reminders, and orchestration between the LLM provider and Twilio.
- **SMS layer**: Twilio Programmable Messaging (or Conversations API) for both outbound sends and inbound webhook handling. Needs a message-routing layer that classifies each inbound text (journal entry vs. task command vs. AI question vs. list update) before acting on it.
- **AI/LLM layer**: an LLM API (e.g., via Anthropic's API or similar) for entry analysis, recap generation, pattern detection, research summarization, and intent parsing of inbound SMS. Should include a lightweight crisis-language classifier as a pre-processing safety layer (see Section 6), run before content reaches the general-purpose recap/insight pipeline.
- **Scheduler / job queue**: for recurring reminders, daily/weekly recap generation, and bill due-date checks — needs reliable timezone-aware scheduling per user.
- **Database**: relational store for structured data (users, tasks, lists, bills, reminders, message log) plus a store for journal entries and their AI-derived tags/embeddings (could be the same relational DB, or a separate document/vector store if semantic search across entries is wanted later).
- **Optional integrations**:
  - Bank-aggregation API (e.g., Plaid) for automatic bill/transaction detection.
  - Calendar integration (Google/Outlook) so appointment-based reminders (e.g., therapy sessions) can sync both ways.

### Suggested Core Data Model (entities)

- **User** — profile, phone number, timezone, quiet-hours settings, consent flags (AI processing, financial linking, trusted-contact opt-in).
- **JournalEntry** — text, timestamp, mood rating, AI-suggested tags, `excluded_from_ai` flag.
- **Insight** — AI-detected pattern/theme, linked source entries, created date, dismissed/confirmed status.
- **Reminder/Task** — title, due date/time, recurrence rule, status, source (user-created vs. AI-suggested).
- **List** — name, type (todo/shopping/custom), items (text, checked status, order).
- **Bill** — name, amount, due date, recurrence, paid status, linked account (if bank-linked).
- **Budget** — category, monthly limit, linked bills/transactions.
- **Message** — inbound/outbound SMS log, direction, parsed intent, linked entity (journal entry, task, etc.).

---

## 8. Non-Functional Requirements

- **Reliability of reminders**: missed or late reminders undermine trust fast — scheduling needs to be robust to timezone changes (e.g., travel) and daylight saving shifts.
- **Latency**: AI-generated replies to inbound texts (e.g., "add milk to my list") should feel near-instant; heavier AI tasks (research, recaps) can take longer but should set expectations ("Looking into it, give me a minute…") rather than leaving the user wondering if the text was received.
- **Scalability**: SMS volume and LLM calls both cost money per user — architecture should support rate-limiting and cost monitoring per user from the start.
- **Accessibility**: web app should meet basic accessibility standards (contrast, screen-reader support) given the audience may include people in vulnerable emotional states.

---

## 9. Open Questions for Product/Dev to Resolve

- Message volume/cost model: how many SMS sends per user per day is sustainable, and does the business model support LLM + Twilio costs at scale (subscription pricing, usage caps, etc.)?
- Should trusted-contact crisis escalation be included at launch, or added later once legal/liability review is done?
- Bank-linking (Plaid or similar) for bills/budget — build at launch, or start with manual entry and add automatic detection later?
- Multi-channel support later (e.g., WhatsApp via Twilio, or push notifications) in addition to SMS?
- Data retention policy specifics (how long are journal entries and message logs kept, and what happens to derived AI insights if a user deletes source entries?).

---

*Prepared as a discussion draft for scoping and estimation — feature depth, especially in Sections 4.5–4.8, should be refined with the developer based on timeline and budget.*
