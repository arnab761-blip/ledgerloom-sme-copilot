# 🧵 LedgerLoom — Autonomous SME Finance Copilot
### 2026 8th Shenzhen International FinTech Competition (FinTechathon)
**Organizer:** WeBank & Tsinghua University (PBCSF)  
**Track:** International Track — *AI as a Financial Participant*  
**Selected Topic:** **Topic E: SME Finance Copilot**  
**Team Name:** **LedgerLoom**  

---

## 🌟 Executive Summary

Small and Medium Enterprises (SMEs) represent the backbone of emerging and global economies, yet **over 82% of small businesses fail due to cash flow miscalculations and delayed receivables**. SME owners wear too many hats: managing factory workers, negotiating with suppliers, and coordinating sales, often leaving financial books outdated and cash gaps unnoticed.

**LedgerLoom** is an autonomous, explainable AI Financial Copilot tailored for small business and factory owners. Rather than relying on fragile, hallucination-prone arithmetic from LLMs, LedgerLoom marries:
1. **A Real-Time Excel / Spreadsheet Database Engine** that synchronizes web entries into structured `.xlsx` workbooks.
2. **A Deterministic Accounting & Unit Economics Calculator** for exact break-even calculations, reverse target profit planning (fabric & unit requirements), and loan reconciliation.
3. **Multimodal OCR & Human-in-the-Loop Staging** for offline cash receipts and handwritten memos.
4. **Proactive Overdue Receivables Alerts** that monitor customer debts exceeding configurable thresholds (> 30,000 BDT/USD) and auto-draft respectful collection notices.
5. **A 30-Minute Sliding Security Session Vault** enforcing a strict 4-Tier Permission Architecture to guarantee zero accidental mutations and complete auditability.

---

## 🏗️ System Architecture

```
                                ┌──────────────────────────────────────────────┐
                                │       SME Business Owner / Dashboard         │
                                └──────────────────────┬───────────────────────┘
                                                       │
                                                       ▼
                                ┌──────────────────────────────────────────────┐
                                │        LedgerLoom Orchestrator Agent         │
                                │   (Natural Language / Tool Intent Router)    │
                                └──────┬───────────────┼───────────────┬───────┘
                                       │               │               │
             ┌─────────────────────────┴────┐          │          ┌────┴─────────────────────────┐
             ▼                              ▼          ▼          ▼                              ▼
  ┌──────────────────────┐ ┌──────────────────────┐  ┌──────────────────────┐ ┌──────────────────────┐
  │ Deterministic Math & │ │  Excel Database Sync │  │ Receivables & Debtors│ │ 30-Min Security Vault│
  │ Reverse Profit Engine│ │ (Multi-Sheet .xlsx)  │  │   Alert (>30k Rule)  │ │ (4-Tier Permission)  │
  ├──────────────────────┤ ├──────────────────────┤  ├──────────────────────┤ ├──────────────────────┤
  │• BEP & Margin Safety │ │• Business_Profile    │  │• Automated Risk Scan │ │• Tier 1: Read-Only   │
  │• Target Units/Fabric │ │• Daily_Transactions  │  │• Multi-tone Drafts   │ │• Tier 2: Simulation  │
  │• Loan Reconciliation │ │• Debtors_Creditors   │  │• 1-Click Settlement  │ │• Tier 3: Review Req. │
  │• Zero-Hallucination  │ │• Real-time Download  │  │• WhatsApp/SMS Sync   │ │• Tier 4: Master Auth │
  └──────────────────────┘ └──────────────────────┘  └──────────────────────┘ └──────────────────────┘
```

---

## 🎯 Key Innovation Highlights

### 1. Reverse Unit Economics & Fabric Solver (টার্গেট প্রফিট প্ল্যানার)
Small business owners often think backwards: *"I want to earn 50,000 net profit next month. What exact steps must I take?"*
LedgerLoom computes the exact reverse accounting calculus:
$$\text{Required Units} = \frac{\text{Total Monthly Fixed Costs} + \text{Target Profit}}{\text{Unit Selling Price} - \text{Unit Variable Cost}}$$
$$\text{Required Fabric (Meters/Yards)} = \text{Required Units} \times \text{Fabric Per Unit}$$
The copilot guides the owner with actionable steps: how many units cover the factory's fixed overhead (salaries, electricity, rent), and how many units generate pure profit.

### 2. Zero-Hallucination Deterministic Calculator Engine
Large language models notoriously hallucinate large numbers and compound interest. In LedgerLoom, **no arithmetic is generated via token probabilities**. All math is calculated by deterministic TypeScript functions (`AccountingEngine`) invoked via structured tool calling.

### 3. Automated Receivables Risk Monitoring (> 30k Threshold)
Accounts receivable exceeding thresholds trigger an immediate early warning banner. LedgerLoom generates customized collection reminders in three tones:
- **Polite & Friendly** (for long-time buyers)
- **Formal Business** (for corporate clients)
- **Urgent Notice** (for severely overdue debts)

### 4. Multimodal Cash Receipt Staging (Human-in-the-Loop)
Handwritten bazar receipts and factory maintenance memos are scanned into a **Pending Staging Table**. The owner reviews and clicks **Approve** before entries are permanently written to the Excel database.

### 5. 30-Minute Sliding Session Security Vault (FinTechathon Deliverable 05)
Financial owners get annoyed by constant re-authentication. LedgerLoom implements an enterprise-grade **30-minute sliding session**:
- Unlocked with a 4-digit master PIN (`2026`).
- Active for 30 minutes; auto-resets on user activity.
- Automatically locks on 30 minutes of inactivity.
- Strictly guards Tier-4 state mutations (modifying wages, updating loan settlements, approving high-value transactions).

---

## 📊 4-Tier Security Matrix (Deliverable 05 & 06)

| Tier | Name | Autonomous Scope | Security Requirement |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Read & Analyze** | Dashboard metrics, P&L, 30-day cash curve, historical reports | Public read / No lock |
| **Tier 2** | **Simulate & Model** | Reverse profit solver, loan EMI calculators | Sandboxed simulation |
| **Tier 3** | **Communicate** | Drafting client reminder messages and notification emails | Human-in-the-Loop review |
| **Tier 4** | **Financial Mutation**| Appending to Excel ledger, modifying fixed costs, loan payments | 30-minute PIN Authentication |

---

## 🚀 Quick Start & Deployment Guide

### Prerequisites
- Node.js v18+ (tested on v24)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/LedgerLoom/ledgerloom-sme-copilot.git
cd ledgerloom-sme-copilot

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.  
Default Master Security PIN: **`2026`**

---

## 🧪 Test Cases (Verification Checklist)

- [x] **TC-01: Real Excel Sync** — Adding a transaction via web form creates a row in `ledgerloom_database.xlsx`.
- [x] **TC-02: Reverse Profit Calculation** — Setting target profit to 50,000 correctly solves required polo shirt units and fabric meters.
- [x] **TC-03: Loan Amortization** — Loan EMI formula calculates exact interest vs principal breakdown.
- [x] **TC-04: Debtors Alert** — Accounts with balance >= 30,000 trigger visual warning and multi-tone reminder draft.
- [x] **TC-05: 30-Minute Sliding Vault** — PIN `2026` unlocks Tier-4 mutations; countdown timer is displayed; session auto-expires.
- [x] **TC-06: Audit Logging** — Every financial modification appends an immutable entry to `Audit_Trail` sheet.

---

## 👥 Team LedgerLoom (2026 FinTechathon)
- International Track — Topic E: SME Finance Copilot
- Proudly built for **WeBank FinTech College Students Challenge**.
