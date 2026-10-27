# Anti-Hallucination Guidelines & Safeguards

These guidelines govern both **the development agent team** (building the application) and **the CommunityVoice AI microservice** (processing complaints for Barangay Hibao-an Sur).

---

## Part 1: Rules for the Development Team (Our 8 Agents)

1. **Source of Truth Priority**:
   - Always adhere to the approved project proposal (`CommunityVoice_Final_Project_Proposal_preview.pdf`).
   - If a technical detail, API contract, or requirement is unclear, **ask the user** instead of inventing assumptions or features outside the scope.

2. **Real Libraries & Dependencies Only**:
   - Never invent non-existent npm packages, Python libraries, or fabricated API endpoints.
   - Always verify that third-party methods and versions exist before using them.

3. **Verify by Execution**:
   - Do not claim a database migration, API route, or frontend component is working without testing or verifying syntax.

---

## Part 2: Rules for the CommunityVoice AI Service (FastAPI + OpenAI)

These safeguards prevent the AI from producing false, misleading, or fabricated results when handling resident complaints:

### 1. Strict Category Whitelist (Zero Inventions)
- The AI is strictly restricted to selecting from the **official predefined categories**:
  - `Sanitation and Waste Management`
  - `Peace and Order (Blotter)`
  - `Infrastructure and Roads`
  - `Public Utilities (Water, Streetlights, Power)`
  - `Health and Sanitation`
  - `Cases Involving Minors (SWDO Referral)`
- The model is **forbidden** from outputting any category not in this list. If the text does not fit cleanly, it must categorize it as `General Community Feedback` with a flag for manual staff review.

### 2. Evidence-Based Priority Scoring
- Priority levels are restricted strictly to: `High`, `Medium`, or `Low`.
- The AI must provide a 1-sentence **evidence quote** directly citing the resident's text to justify the score (e.g., *"Priority: High. Justification: 'Exposed live wire posing immediate electrocution hazard on main road.'"*).
- If there is no immediate safety hazard or minor involved, the default must remain `Medium` or `Low`. The AI must never invent urgency.

### 3. Strict Structured Outputs (No Free-Form Hallucinations)
- The AI microservice must use OpenAI's **Structured Outputs (`json_schema`)** and Pydantic models.
- Any response that does not strictly match the expected JSON structure is rejected and logged.

### 4. Human-in-the-Loop Mandate
- The AI produces **recommendations only**. It **never makes final decisions**.
- Barangay staff must review and explicitly click "Confirm" or "Override" on every recommended category, priority, and assigned official before any case is officially routed.

### 5. Grounding on Submitted Text Only (No Speculation)
- The AI must evaluate **only the text provided by the resident**.
- It is prohibited from guessing motives, speculating on unmentioned individuals, or providing legal advice.

### 6. PII Masking & Privacy (RA 10173)
- Before the complaint text reaches OpenAI, all personal names, phone numbers, and private contact info are stripped or masked (e.g., `[REDACTED_NAME]`, `[REDACTED_PHONE]`).

