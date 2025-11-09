# 🏥 A&E Accelerate: Agentic AI for Emergency Care

**A&E Accelerate** is a high-fidelity prototype of an agentic AI system designed to solve the UK's A&E "gridlock".  
It functions as a **Virtual Command Centre** that optimises patient flow from the moment of first contact (at home) through to hospital admission — *before the patient ever arrives at the hospital.*

**🔗 Live Demo:** [https://ae-accelerate.lovable.app](https://ae-accelerate.lovable.app)

### IF YOU'RE REPLY, PLEASE IGNORE THE roll-your-rent LINK.

---

## 🚀 The Core Concept

The core problem in UK emergency care is not just long triage queues; it is a systemic **“exit block”** that leads to A&E overcrowding and ambulance handover delays.

Our solution is not just another “triage app” (which would only optimise the queue for a blocked system).  
It is a **multi-agent ecosystem** that manages the entire patient journey.

Its goal is to **parallelise emergency care** — converting ambulance transit time from “dead time” into active “preparation time” and reducing the congestion of physical waiting rooms by introducing a virtual waiting lobby for **low-severity** cases.

This system is built on a **Human-in-the-Loop** model, ensuring a clinician is always in control of the final, critical decisions.

---

## 🤖 The Multi-Agent Architecture

Our prototype simulates **four distinct agents** communicating in a shared environment (the app's central state, managed in `Index.tsx`).  
Each tab in the demo represents the *view* for a different agent:

### 🧍‍♂️ TriageAgent (`Patient View` tab)
- The “digital front door” for the public.
- Uses AI (`triage-assessment` function) to conduct a multimodal assessment (text, and simulated video/voice).
- Autonomously registers the patient in the correct hospital queue.

### 🚑 EMSAgent (`First Responder` tab)
- The “remote diagnostic sensor” in the field.
- Used by paramedics to send high-fidelity data (vitals, notes, on-scene video) back to the hospital.

### 🏥 OpsAgent (`Hospital Ops` & `Preparation` tabs)
- The central “brain” of the hospital.
- Ingests data from all agents, manages the master patient queue.
- Triggers the **resource-planning AI** to generate detailed preparatory plans.

### 👩‍⚕️ ClinicianAgent (`Clinician` tab)
- The “human-in-the-loop” decision-maker.
- Receives the AI’s proposed plan and provides the **1-Button Approval** to activate hospital resources.

---

## 💻 How to Use the Demo
This demo showcases **two key user journeys** from our hackathon plan.

---

### 🩹 Scenario 1: Low-Acuity Patient (The “Student” Scenario)

Simulates a low-priority case and shows how the OpsAgent correctly de-prioritises it.

1. Go to the **Patient View** tab.  
2. **NHS Number:** `9912003071` (mock patient *Jane Doe*).  
3. **Select Hospital:** “St. Mary’s Medical Center”.  
4. **Describe Symptoms:** “My friend twisted their ankle at a party.”  
5. **Upload Video:** *Ankle Injury – Limp (Mock Video)*.  
6. Click **Submit Assessment**.  
   - The AI triage-assessment agent runs.  
   - The AI identifies it as *low severity (≈4/10)* and places the patient in queue.  
7. Go to the **Hospital Ops** tab.  
   - Observe *Jane Doe* added to the bottom of the queue with status **“Waiting (Remote)”**.

---

### ⚡ Scenario 2: High-Acuity Patient (The “Stroke Patient” Scenario)

Demonstrates the full, life-saving multi-agent workflow.

1. Return to **Patient View** (Reset Form if needed).  
2. **NHS Number:** `9912003072` (*John Smith*).  
3. **Select Hospital:** “City General Hospital”.  
4. **Describe Symptoms:** “My father’s face is drooping and he can’t speak.”  
5. **Upload Video:** *Suspected Stroke Symptoms (Mock Video)*.  
6. Click **Submit Assessment**.  
   - AI flags *HIGH SEVERITY DETECTED (10/10)*.  
7. Click **Confirm 999 Dispatch**.  
   - Live ambulance tracking and first-aid instructions appear.  
8. Go to **Hospital Ops** tab.  
   - *John Smith* now appears at the **top** of the queue as **“Ambulance Dispatched”**.  
9. Go to **First Responder** tab.  
   - Fill in on-scene updates and click **Send Update to Hospital & Clinician**.  
10. Go to **Clinician** tab.  
    - Alert appears for “INBOUND: John Smith”.  
    - OpsAgent AI proposes a **Resource Plan** (e.g., “Reserve Stroke Bay 2”, “Prep CT Scanner”).  
11. Click **APPROVE PLAN** → activates hospital preparation.  
12. Go to **Preparation** tab.  
    - Hospital team sees the full plan and live ETA.  
13. Finally, check **Hospital Ops** tab again.  
    - *John Smith* status: **“In Transit”** -> **“Prep Ready”** ->  **“Operation Ongoing”**. ✅

---

## 🧠 Challenges & Solutions

| **Challenge** | **Initial Problem** | **Agentic Solution** |
|----------------|--------------------|----------------------|
| 🌀 **The “Triage Trap”** | A simple triage app feeds a blocked system; the real NHS issue is *exit block*. | Pivoted to a **multi-agent system** (TriageAgent, EMSAgent, OpsAgent) managing full patient flow. |
| ⚙️ **Technical Feasibility** | Diagnosing internal injuries from a phone video is unsafe. | Switched to **functional assessment** (e.g., gait analysis + text fusion) for triage safety. |
| 📊 **Real-World Data** | No access to NHS APIs for patient data or capacity. | Simulated with **mockData.ts**, using real functional AI agents via **Supabase**. |
| 🎙️ **AI for Voice** | Voice input is messy and unstructured. | Built a **multimodal voice pipeline** (`VoiceRecorder.tsx` → STT → structured JSON parser). |
| ⚖️ **Legal & Ethical Liability** | Fully autonomous AI creates accountability gaps. | Designed a **Human-in-the-Loop** system: AI proposes, *clinician approves.* |

---

## 🛠️ Technology Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui  
**Backend (AI Agents):** Supabase Edge Functions  

**AI Models:**
- **OpenAI (gpt-4o-mini):** Resource-planning, triage-assessment  
- **Google Gemini-2.5-flash:** Real-time chat and first-aid tasks  
- **Eleven Labs:** Speech-to-text transcription  

**State Management:** Local React State (`useState` in `Index.tsx`)

---

## 📦 How to Run Locally

### Clone the Repository
```bash
git clone https://github.com/FHL-08/gridlocker-solver-ai.git
```
