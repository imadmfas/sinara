# Claude Code implementation brief — فنّ السؤال | The Art of Asking

Act as the implementation lead for an Arabic-first AI literacy product for Iraq. Work as a product engineer, Arabic interaction designer and learning designer. Build the working website and mobile app in the GitHub repository provided by the owner. Use the attached index.html as the content and interaction baseline. The owner’s name is Prof. Dr. Imad Mohammed Farhan (البروفيسور عماد محمد فرحان). The working product name is فنّ السؤال. Keep the brand and guide name configurable.

## 1. Product promise and first minute

Teach a learner to state a goal, ask a useful question, inspect the answer, identify what is missing and ask a better follow-up. The first minute must demonstrate that changing a question changes the result. A visitor should reach an activity through age band → interest or field → activity, with a specialization selector only when meaningful. Open directly into that choice. A returning learner may resume or switch paths. Offer a visible “جرّب من جديد” action. Reading an introduction, opening an account and enabling sound are optional.

Before editing, inspect the repository, build scripts and the supplied prototype. Inventory its six age bands, child activities, school topics, twelve fields, forty-seven professional branches, ten generator services and Arabic examples. Preserve useful content and familiar labels. Fix factual, grammatical and accessibility defects as you migrate. If the attachment is absent, continue from the specifications below and document any parity you could not verify. Protect unrelated work. Work on a feature branch and continue through implementation, testing and handoff in the same assignment. A plan, screenshots or a landing page alone do not complete the assignment.

## 2. Deliverables and technical boundaries

Deliver a responsive website deployable to GitHub Pages, an installable offline-capable PWA, and Android and iOS app projects sharing the learning content and UI. If the repository has a suitable stack, retain it. For a new repository, use React, TypeScript, Vite, structured local content, a service worker and Capacitor for mobile packaging. Keep the optional chat endpoint in a separate deployable server component. Use a small serverless worker when there is no existing backend. The core experience must work without API credentials, paid services or a database.

Support GitHub Pages project subpaths, direct links and refresh on inner screens. A hash router is acceptable. Configure web and native asset paths separately where necessary. Provide a minimal GitHub Actions build and Pages deployment workflow appropriate for the repository. Supply an installable debug APK when the Android toolchain is available and an iOS project with precise build/signing steps. Verify both on available platforms. Identify any unavailable SDK, macOS runner, signing identity or provider credential and what remains unverified. Do not imply that a store submission, release signing or public deployment has happened without evidence. Never overwrite an existing production site from an unrelated project.

## 3. Age changes the interaction, vocabulary and purpose

| Age | Learning experience | Example |
| --- | --- | --- |
| 4–6 | Adult and child share one screen. One invitation per screen, large illustrated choices, optional narration and meaningful play without typing or reading. | Choose a bird, hear a three-sentence story, change the setting to a palm grove, then point to what changed. |
| 7–9 | Everyday school interests, simple language, two or three choices and a chance to retry with a hint. | Ask for a counting game with dates, then ask for smaller numbers. |
| 10–12 | Small experiments, hints before answers, compare two sample outputs and explain one difference. | Ask for a fraction example, solve it on paper, then check the model’s explanation. |
| 13–17 | School projects that require independent thinking, evidence checks and revision. | Build a presentation outline about the Iraqi marshes and flag one claim requiring a source. |
| 18–22 | University and vocational tracks, practical briefs, rubrics and prompts with evidence requirements. | Turn a vague research topic into a feasible comparison and identify what evidence is missing. |
| 23+ | Professional and everyday tasks, with a persistent simple-interface option for newcomers and older adults. | Plan a short workshop, compare two irrigation logs or ask how to organize phone contacts. |

Age selects the learning interface. Expertise remains a separate choice. An experienced adult should be able to go directly to the generator, and an adult beginner should be able to ask for a slow walkthrough. Collect an age band only. Support a shared family device with separate progress by band and an obvious reset. Keep free-text drafts ephemeral unless an adult explicitly saves one locally.

## 4. Curriculum and working screens

Implement the full journey in Arabic RTL. Use clear standard Arabic for teaching. Use light, natural Iraqi Arabic for selected spoken interactions and the signature follow-up feature “شنو نسأل بعدها؟”. Make Arabic copy editable in content files.

- **دليل البداية.** What AI is, what it can do, recognition/prediction/generation, everyday uses, and how to check an answer. Give each concept one age-appropriate demonstration. Label prerecorded or curated outputs “مثال تعليمي”.
- **مساري.** For ages 4–6 include stories and animals, colors and drawing, counting and games, home and shapes. Preserve the school paths for ages 7–12. For older learners include engineering and architecture, health education, teaching, research, computing, business, law and public administration, agriculture, arts and media, languages, everyday life and crafts, and humanities and Islamic studies. Import every branch from the supplied file. Make each branch searchable and reachable. Give every branch at least one task someone in that field would recognize, with a worked prompt and an explanation. Replacing the name of the profession inside a generic paragraph does not count.
- **قُل ولا تقل.** Show the original request, let the learner identify what is missing, then reveal the improved wording. Highlight the words that changed the meaning. Explain when a short prompt is sufficient. Use everyday requests respectfully.
- **اختبر نفسك.** Create single-best-answer questions with plausible distractors. Provide feedback for each choice, a retry and a transfer question using a different example. Avoid training learners to choose the longest answer. Include a flawed sample AI answer so learners practice evaluating outputs too.
- **شنو نسأل بعدها؟** Present a first request and a concrete sample answer with a visible omission. Let the learner select or compose a follow-up, reveal a revised sample and highlight the difference. Ship at least one complete editorially distinct scenario per professional field, two school scenarios and one for each preschool activity family. Do not describe a deterministic response as live AI.
- **تقدّمي.** Show what the learner has practised: specifying a task, adding a constraint, choosing a format, checking a claim and asking a follow-up. Mark a skill as practised after a meaningful action. A page view earns no mastery claim. Use private local progress and a clear “متابعة من حيث توقفت” entry.

Use Iraqi examples naturally: a school in Fallujah, a Baghdad stationery shop, date palms, a timetable, an Iraqi-dinar budget and a university seminar. Use fictional records. In academic, legal, religious and health examples, teach learners to supply and verify sources. Never invent citations, sacred text, statutes, medical dosages or official endorsements.

## 5. Two showcase journeys to implement in full

**A child and a caregiver.** The child chooses a bird, a place and an action using pictures. The guide reads the assembled request after the caregiver enables audio. Display an authored miniature story that actually incorporates the selected choices. The child can change one choice, see the revised story and identify the changed element. Every visible option must affect the outcome. Add a caregiver cue: “اسأله: شنو تغيّر بالقصة من غيّرنا المكان؟”. Include a silent route that works from illustrations and an adult reading aloud. No free typing, microphone or external model is needed for this experience.

**An Iraqi homeowner.** Begin with “ارسم لي خريطة بيت”. Let the learner add a 10 × 20 metre plot, north-facing street, one floor, three bedrooms and a courtyard. Request a conceptual room schedule with approximate areas. Display a small, clearly labelled sample table. Account for the courtyard and circulation without presenting the result as a construction drawing. Then reveal a new fact: the family may add a second floor. Ask which question will help revise the concept. Show how reserving stair access alters the proposal and which decisions need a qualified local architect. Write distractors that sound reasonable, such as choosing facade colors too early. Demonstrate checking the sum of the proposed areas. Do not fabricate setbacks or local building regulations.

## 6. Professional prompt studio — مولّد الطلبات

Ship the original ten services: explain, compare, plan, design a visual, create a quiz, summarize supplied text, draft a message, review a draft, brainstorm and practise a conversation. Supply service-specific fields. A visual brief needs subject, composition and aspect ratio. A document review needs source material, review criteria and permission to rewrite. A comparison needs alternatives and criteria. Use progressive disclosure and useful, editable defaults.

Build the prompt from goal, field, subfield, audience, inputs, constraints, output format and verification step. Show a live preview. Support edit, copy with fallback, reset and regenerate from changed inputs. Warn before overwriting a manually edited result. Explain which detail improved the request and why. When a task depends on a missing text, the prompt must ask the receiving assistant to wait for it. Keep local generation available offline. Never automatically send a draft to an external model. Provide an adult-only explicit action to share a selected draft with the live coach, when configured.

## 7. An original robot guide — فَطين

Design a recognizable guide with a compact silhouette, expressive eyes and a warm Iraqi Arabic voice when available. On a preschool screen it can briefly point to the next choice. On a professional screen it rests in a small labelled help button. Do not cover the primary action, keyboard, safe area or quiz options. Use purposeful states: idle, offering a hint, speaking, waiting for an answer, feedback and unavailable. A tap opens help. Escape, a close button and the system Back action dismiss it predictably. Return focus to the opener.

Implement two explicit modes using distinct visible labels.

1. **Guided coach — مرشد الدرس.** Available offline at every age. Build an actual local conversational flow with branching replies. “اشرح أبسط”، “أعطني مثالاً”، “ليش هذا الجواب؟” and “شنو أسأل بعدها؟” must respond to the current lesson, the learner’s last choice and their age band. Start a preschool conversation using illustrated reply buttons. For ages 7–17 use curated lesson paths with hints and retries. Switch lesson → switch context. This mode is the launch default.
2. **Live AI coach — محادثة ذكية مباشرة.** Optional adult mode, enabled only after a real server-side provider is configured. Stream replies if supported, allow cancellation and retry, expose connection status, limit inputs and session length, and recover from rate limits, lost connectivity and provider errors. Forward only the deliberate message and the minimum relevant lesson context. Enforce eligibility server-side using an adult session or other adult authorization distinct from the client-side age selector. Keep live chat disabled if this control is unavailable. Keep keys on the server. Do not persist raw conversations by default. A provider failure must return the user gracefully to the guided coach. Never disguise canned text as a provider response. A first visit must not trigger a billable call.

The guide is a teaching tool. It may ask a clarifying question or offer a hint. It should never solicit a child’s name, school, photo, exact address, contact details or a private conversation. In professional examples, distinguish a teaching example, a source-backed fact and a claim that needs checking.

## 8. Art direction, motion and sound

Build an Arabic editorial learning studio with the warmth of an illustrated activity book. Start from the prototype’s deep palm green, ivory, apricot and pale lime. Use high-contrast Arabic typography, consistent icon shapes and original artwork or locally hosted, properly licensed assets. Add one recognisable visual idea: a vague speech bubble gains illustrated detail as the learner refines a request. On adult screens turn the same idea into a clean before/after comparison. Prefer a small number of memorable scenes to many unrelated effects.

| Interaction | Motion | Optional sound and silent equivalent |
| --- | --- | --- |
| Choose an age or interest | The selected card lifts slightly and its illustration reacts once | A soft click and a visible selection mark |
| Improve a prompt | Newly added words appear in place with a short highlight | A light note and a persistent text highlight |
| Receive a hint | The robot glances toward the relevant control | Optional spoken hint and identical readable text |
| Give an incorrect answer | The chosen card opens to show a specific hint | Calm feedback text without a buzzer or punitive shake |
| Finish a challenge | A brief character reaction followed by the next action | One optional chime and a visible completion message |
| Move between screens | A short RTL-aware transition preserving orientation and focus | Silent by default |

Keep most transitions around 160–300 ms. Sound starts muted. Offer separate controls for effects and narration, replay and stop. Stop previous narration when screens change. Use locally bundled Arabic clips for the core preschool journey if suitable recorded assets are available. Where a device Arabic voice is available, it can provide a clearly labelled fallback. If neither exists, show an honest read-aloud cue for the caregiver. Never show a working-looking audio button without an available audio path. Respect reduced motion and provide a manual calm mode. No information may be communicated through color, sound or movement alone. No autoplay music, flashing, continuous decorative loops or time pressure.

## 9. Engineering quality and release gates

Keep lesson content independent from UI components. Use stable IDs for age bands, fields, branches, lessons, choices and progress. Validate duplicate IDs, missing branch content, dead routes and quiz keys during the build. Version the local progress schema. Make lessons, the guided robot and the generator available after the first successful offline cache. Explain first-load offline and live-chat offline states truthfully. Cache versioned assets safely and preserve progress across updates. Provide large touch targets, keyboard access, meaningful focus, screen-reader labels, safe areas, readable Arabic at 200% zoom and correct mixed RTL/LTR rendering for numbers, dimensions and code. Test phone portrait from 320 px, tablet and desktop. Lazy-load nonessential illustration and sound assets.

Run the following acceptance journeys before calling the work complete.

- A caregiver opens the 4–6 path, plays without sound, changes one story choice and sees the output change. Verify that this path makes zero external AI requests.
- A pupil chooses an incorrect quiz option, receives specific feedback, retries and transfers the skill to a new example.
- An adult completes the house scenario, checks the area table, revises the request for future stairs and copies the result.
- Two different professional branches produce substantively different prompts. Changing the service changes its fields and output. Missing input and clipboard refusal have useful recovery.
- Open the robot from two lessons. It knows which lesson and choice it is helping with. Disconnect the network, refuse audio, enable reduced motion, navigate Back and reopen the app. Confirm that each route remains usable.
- Verify that a child route cannot activate live chat by changing a frontend field or calling the endpoint without an authorized adult session. Test provider errors using fixtures. Label simulated tests separately from any real-provider smoke test.
- Test a GitHub Pages subpath and refresh, the PWA offline path and progress persistence. Build and smoke-test Android and iOS wherever tooling permits. Test a narrow phone with the keyboard open while chatting.

Return working source, reproducible setup commands, an example environment file containing placeholders only, build artifacts where available, an Arabic owner README and a short release report. The README must explain how to publish the Pages build, deploy the optional backend, create a mobile build, change artwork or audio and add a new lesson without modifying a screen. In the report, list what actually works, commands and checks performed, actual URLs or artifacts and any unfinished verification. Explicitly distinguish local guided chat, simulated provider tests and tested live chat. Prioritize complete learning journeys and correct Arabic whenever visual polish competes with learning quality.
