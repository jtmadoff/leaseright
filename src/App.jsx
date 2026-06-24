import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Area, AreaChart, ComposedChart
} from "recharts";

/*
  LeaseRight — Property Management, Rebuilt.
  $1/unit/month. Forever. No hidden fees. Payment processing on the renter, not you.
*/

// ============ DESIGN SYSTEM ============
const C = {
  bg: "#FAFAF7", surface: "#FFFFFF", surfaceAlt: "#F6F5F0", surfaceHover: "#EDECE6",
  sidebar: "#1A1A1A", sidebarHover: "#2A2A2A", sidebarActive: "#333333",
  ink: "#1E1E1E", inkLight: "#5A5A52", inkMuted: "#8A897F", inkOnDark: "#F0F0EC", inkDimOnDark: "#8C8C8C",
  accent: "#5B7B6A", accentLight: "#EEF3F0", accentMid: "#7A9A8A",
  green: "#3D7A5A", greenBg: "#EBF5EF", red: "#C2453A", redBg: "#FDECEB",
  amber: "#C47D1A", amberBg: "#FFF5E6", purple: "#7C6B9E", purpleBg: "#F2EFFA",
  border: "#E4E3DB", borderStrong: "#D2D1C8",
  shadow: "0 1px 3px rgba(30,28,20,0.04), 0 1px 2px rgba(30,28,20,0.06)",
  shadowMd: "0 4px 12px rgba(30,28,20,0.06), 0 1px 3px rgba(30,28,20,0.04)",
  radius: 12, radiusSm: 8,
};
const font = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const fontSerif = "'Instrument Serif', 'Georgia', 'Times New Roman', serif";

// ============ MOCK DATA ============
const properties = [
  { id: 1, name: "The Meridian", address: "800 Congress Ave, Austin TX", units: 260, leased: 121, status: "leasing" },
  { id: 2, name: "Luminary Midtown", address: "1200 Broadway, Nashville TN", units: 188, leased: 42, status: "pre-lease" },
];

// absorptionData consolidated into stabilizationProjection (in Lease Up data section)

const weeklyFunnel = [
  { w: "W1", leads: 32, tours: 18, apps: 8, signed: 5 }, { w: "W2", leads: 28, tours: 15, apps: 7, signed: 4 },
  { w: "W3", leads: 41, tours: 24, apps: 12, signed: 8 }, { w: "W4", leads: 35, tours: 20, apps: 10, signed: 7 },
  { w: "W5", leads: 38, tours: 22, apps: 11, signed: 6 }, { w: "W6", leads: 45, tours: 28, apps: 14, signed: 9 },
];

const allLeads = [
  { id: 1, name: "Alex Rivera", source: "Zillow", status: "tour_scheduled", unit: "2BR-A", agent: "Sarah C.", created: "2h ago", sla: "ok", rent: 2800, phone: "(512) 555-0142", email: "arivera@gmail.com", notes: "Relocating from Denver." },
  { id: 2, name: "Jordan Phillips", source: "Website", status: "new", unit: "1BR-B", agent: null, created: "15m ago", sla: "warning", rent: 2100, phone: "(615) 555-0198", email: "jphillips@outlook.com", notes: "First-time renter." },
  { id: 3, name: "Taylor Kim", source: "Apts.com", status: "applied", unit: "Studio", agent: "Priya P.", created: "1d ago", sla: "ok", rent: 1650, phone: "(404) 555-0267", email: "tkim@yahoo.com", notes: "Waiting on employer verification." },
  { id: 4, name: "Morgan Davis", source: "Walk-In", status: "toured", unit: "2BR-D", agent: "Marcus J.", created: "3h ago", sla: "ok", rent: 2800, phone: "(512) 555-0311", email: "mdavis@gmail.com", notes: "Very interested. Follow up tomorrow." },
  { id: 5, name: "Casey Brown", source: "Referral", status: "new", unit: "1BR", agent: null, created: "45m", sla: "critical", rent: 2100, phone: "(512) 555-0423", email: "cbrown@icloud.com", notes: "Referred by Unit 204." },
  { id: 6, name: "Jamie Lee", source: "Zillow", status: "lease_signed", unit: "Studio-A", agent: "Lisa T.", created: "2d ago", sla: "ok", rent: 1650, phone: "(512) 555-0534", email: "jlee@gmail.com", notes: "14-month lease. Move-in May 1." },
  { id: 7, name: "Sam Ortiz", source: "IG Ad", status: "contacted", unit: "3BR", agent: "David K.", created: "5h ago", sla: "ok", rent: 3400, phone: "(512) 555-0645", email: "sortiz@gmail.com", notes: "Family of 4." },
  { id: 8, name: "Riley Chen", source: "Website", status: "new", unit: "2BR", agent: null, created: "1h ago", sla: "warning", rent: 2800, phone: "(512) 555-0756", email: "rchen@proton.me", notes: "Budget $2500-3000." },
];

const maintenanceRequests = [
  { id: "MR-1042", unit: "204", resident: "James Wilson", type: "Plumbing", title: "Kitchen faucet leaking", priority: "high", status: "completed", created: "2h ago", assigned: "Mike R." },
  { id: "MR-1041", unit: "118", resident: "Ana Gomez", type: "HVAC", title: "AC not cooling properly", priority: "urgent", status: "open", created: "4h ago", assigned: null },
  { id: "MR-1040", unit: "305", resident: "David Park", type: "Electrical", title: "Bathroom outlet not working", priority: "medium", status: "open", created: "6h ago", assigned: "Mike R." },
  { id: "MR-1039", unit: "412", resident: "Sarah N.", type: "Appliance", title: "Dishwasher won't drain", priority: "medium", status: "in_progress", created: "1d ago", assigned: "Carlos L." },
  { id: "MR-1038", unit: "107", resident: "Tyler Brooks", type: "Lock/Key", title: "Front door deadbolt sticking", priority: "high", status: "open", created: "1d ago", assigned: null },
];

const messages = [
  { id: 1, from: "Ana Gomez", unit: "118", channel: "sms", preview: "Any update on when someone can look at my AC?", time: "12m ago", unread: true, type: "resident" },
  { id: 2, from: "Alex Rivera", unit: null, channel: "email", preview: "Thanks for scheduling the tour! Is there parking?", time: "28m ago", unread: true, type: "prospect" },
  { id: 3, from: "James Wilson", unit: "204", channel: "sms", preview: "Plumber just left. Faucet is fixed, thank you!", time: "1h ago", unread: false, type: "resident" },
  { id: 4, from: "Casey Brown", unit: null, channel: "email", preview: "Referred by my friend in Unit 204. Would love a tour.", time: "45m ago", unread: true, type: "prospect" },
  { id: 5, from: "Sarah Chen (Agent)", unit: null, channel: "internal", preview: "Quinn is comparing us with competitor. Offer concession?", time: "2h ago", unread: true, type: "team" },
];

const tenantLedger = [
  { id: 1, name: "Lisa Chang", unit: "221", rent: 2100, status: "paid", paidDate: "Apr 1", method: "autopay", processingFee: 4.95, lateFee: 0 },
  { id: 2, name: "Mark Anderson", unit: "330", rent: 2800, status: "paid", paidDate: "Apr 1", method: "autopay", processingFee: 4.95, lateFee: 0 },
  { id: 3, name: "James Wilson", unit: "204", rent: 2100, status: "paid", paidDate: "Apr 3", method: "manual", processingFee: 4.95, lateFee: 0 },
  { id: 4, name: "Ana Gomez", unit: "118", rent: 1650, status: "paid", paidDate: "Apr 2", method: "autopay", processingFee: 4.95, lateFee: 0 },
  { id: 5, name: "David Park", unit: "305", rent: 2800, status: "pending", paidDate: null, method: null, processingFee: 0, lateFee: 0 },
  { id: 6, name: "Tyler Brooks", unit: "107", rent: 2100, status: "late", paidDate: null, method: null, processingFee: 0, lateFee: 75 },
  { id: 7, name: "Sarah N.", unit: "412", rent: 2800, status: "paid", paidDate: "Apr 1", method: "autopay", processingFee: 4.95, lateFee: 0 },
  { id: 8, name: "Rachel Kim", unit: "115", rent: 1650, status: "paid", paidDate: "Apr 1", method: "autopay", processingFee: 4.95, lateFee: 0 },
  { id: 9, name: "Sam Ortiz", unit: "308", rent: 3400, status: "upcoming", paidDate: null, method: "autopay", processingFee: 0, lateFee: 0 },
  { id: 10, name: "Tom Nguyen", unit: "208", rent: 2100, status: "late", paidDate: null, method: null, processingFee: 0, lateFee: 75 },
];

const unitMix = [
  { type: "Studio", total: 60, leased: 38, asking: 1650, effective: 1580 },
  { type: "1 Bed", total: 100, leased: 52, asking: 2100, effective: 2010 },
  { type: "2 Bed", total: 72, leased: 25, asking: 2800, effective: 2680 },
  { type: "3 Bed", total: 28, leased: 6, asking: 3400, effective: 3250 },
];

// ============ LEASE UP DATA ============
const velocityWeekly = [
  { w: "W1", signed: 5, target: 6, tours: 18, apps: 8 },
  { w: "W2", signed: 4, target: 6, tours: 15, apps: 7 },
  { w: "W3", signed: 8, target: 6, tours: 24, apps: 12 },
  { w: "W4", signed: 7, target: 6, tours: 20, apps: 10 },
  { w: "W5", signed: 6, target: 6, tours: 22, apps: 11 },
  { w: "W6", signed: 9, target: 6, tours: 28, apps: 14 },
  { w: "W7", signed: 8, target: 7, tours: 25, apps: 13 },
  { w: "W8", signed: 11, target: 7, tours: 32, apps: 16 },
];

const stabilizationProjection = [
  { m: "Jan", actual: 10, plan: 8, optimistic: null, pessimistic: null },
  { m: "Feb", actual: 26, plan: 22, optimistic: null, pessimistic: null },
  { m: "Mar", actual: 48, plan: 40, optimistic: null, pessimistic: null },
  { m: "Apr", actual: 71, plan: 62, optimistic: null, pessimistic: null },
  { m: "May", actual: 94, plan: 88, optimistic: null, pessimistic: null },
  { m: "Jun", actual: 121, plan: 118, optimistic: null, pessimistic: null },
  { m: "Jul", actual: null, plan: 148, optimistic: 156, pessimistic: 138 },
  { m: "Aug", actual: null, plan: 176, optimistic: 192, pessimistic: 162 },
  { m: "Sep", actual: null, plan: 200, optimistic: 224, pessimistic: 182 },
  { m: "Oct", actual: null, plan: 220, optimistic: 247, pessimistic: 198 },
  { m: "Nov", actual: null, plan: 238, optimistic: 260, pessimistic: 214 },
  { m: "Dec", actual: null, plan: 252, optimistic: 260, pessimistic: 228 },
];

const rentAnalysis = [
  { type: "Studio", units: 60, leased: 38, available: 22, asking: 1650, effective: 1580, avgDaysOnMarket: 11, compAvg: 1590, compRange: "$1,500–$1,680", trend: "stable", velocity: "fast", suggestion: "none", suggestedRent: 1650 },
  { type: "1 Bed", units: 100, leased: 52, available: 48, asking: 2100, effective: 2010, avgDaysOnMarket: 18, compAvg: 2050, compRange: "$1,950–$2,200", trend: "stable", velocity: "normal", suggestion: "none", suggestedRent: 2100 },
  { type: "2 Bed", units: 72, leased: 25, available: 47, asking: 2800, effective: 2680, avgDaysOnMarket: 34, compAvg: 2620, compRange: "$2,500–$2,750", trend: "down", velocity: "slow", suggestion: "decrease", suggestedRent: 2650 },
  { type: "3 Bed", units: 28, leased: 6, available: 22, asking: 3400, effective: 3250, avgDaysOnMarket: 52, compAvg: 3150, compRange: "$2,900–$3,350", trend: "down", velocity: "stale", suggestion: "decrease", suggestedRent: 3200 },
];

const activeConcessions = [
  { id: 1, name: "1 Month Free", unitTypes: ["2 Bed", "3 Bed"], startDate: "Mar 15", endDate: "May 31", leasesSigned: 14, leadsGenerated: 48, costPerLease: 2690, totalCost: 37660, status: "active", convRate: 29.2 },
  { id: 2, name: "Waived App Fee", unitTypes: ["All"], startDate: "Jan 1", endDate: "Ongoing", leasesSigned: 121, leadsGenerated: 416, costPerLease: 75, totalCost: 9075, status: "active", convRate: 29.1 },
  { id: 3, name: "$500 Move-In Credit", unitTypes: ["Studio"], startDate: "Feb 1", endDate: "Mar 14", leasesSigned: 18, leadsGenerated: 62, costPerLease: 500, totalCost: 9000, status: "ended", convRate: 29.0 },
  { id: 4, name: "Free Parking (3 mo)", unitTypes: ["2 Bed", "3 Bed"], startDate: "Apr 1", endDate: "Jun 30", leasesSigned: 3, leadsGenerated: 15, costPerLease: 450, totalCost: 1350, status: "active", convRate: 20.0 },
];

const prospectFeedback = [
  { reason: "Rent too high for the area", count: 38, pct: 22, trend: "up", category: "pricing" },
  { reason: "Liked a competitor's amenities more", count: 29, pct: 17, trend: "stable", category: "competition" },
  { reason: "Unit felt smaller than photos", count: 24, pct: 14, trend: "down", category: "expectations" },
  { reason: "No in-unit washer/dryer", count: 21, pct: 12, trend: "stable", category: "amenities" },
  { reason: "Parking cost too high", count: 18, pct: 10, trend: "up", category: "pricing" },
  { reason: "Chose to renew current lease", count: 16, pct: 9, trend: "stable", category: "timing" },
  { reason: "Relocating fell through", count: 14, pct: 8, trend: "down", category: "timing" },
  { reason: "Wanted pet-friendlier policy", count: 13, pct: 8, trend: "stable", category: "policy" },
];

const lostLeads = [
  { name: "Quinn Morris", unit: "2BR-C", reason: "Chose competitor (The Vance)", daysInPipeline: 12, lastStage: "toured", feedback: "Loved the unit but The Vance offered 2 months free + lower parking", agent: "Sarah C." },
  { name: "Jordan Ellis", unit: "3BR-A", reason: "Rent too high", daysInPipeline: 5, lastStage: "tour_scheduled", feedback: "Budget was $3,000 max. Didn't show for tour.", agent: "Marcus J." },
  { name: "Avery Chen", unit: "1BR-B", reason: "No in-unit W/D", daysInPipeline: 8, lastStage: "toured", feedback: "Really liked the space but W/D was a dealbreaker. Went to building with in-unit.", agent: "Priya P." },
  { name: "Dakota Reeves", unit: "Studio", reason: "Timing", daysInPipeline: 3, lastStage: "contacted", feedback: "Moving in August, not ready to commit yet. Asked to follow up in 6 weeks.", agent: "Lisa T." },
  { name: "Harper Woods", unit: "2BR-D", reason: "Chose competitor (Ovation)", daysInPipeline: 18, lastStage: "applied", feedback: "Applied here but Ovation matched our price and has a pool.", agent: "Sarah C." },
  { name: "Skyler Pham", unit: "3BR-B", reason: "Rent too high", daysInPipeline: 2, lastStage: "new", feedback: "Inquiry only. Saw price, never responded to follow-up.", agent: "David K." },
];

const competitorIntel = [
  { name: "The Vance", distance: "0.4 mi", units: 310, occupancy: "61%", concession: "2 months free", avgRent1BR: "$1,950", avgRent2BR: "$2,600", threat: "high" },
  { name: "Ovation", distance: "0.8 mi", units: 220, occupancy: "74%", concession: "1 month free + pool", avgRent1BR: "$2,050", avgRent2BR: "$2,700", threat: "medium" },
  { name: "The Astor", distance: "1.2 mi", units: 180, occupancy: "89%", concession: "None", avgRent1BR: "$2,250", avgRent2BR: "$3,000", threat: "low" },
];

// ============ TENANTS DATA ============
const currentTenants = [
  { id: 1, name: "Lisa Chang", unit: "221", type: "1 Bed", rent: 2100, leaseStart: "2026-01-15", leaseEnd: "2027-01-14", moveIn: "Jan 15, 2026", status: "active", autopay: true, balance: 0, renewalStatus: "offered", phone: "(512) 555-1001", email: "lchang@gmail.com" },
  { id: 2, name: "Mark Anderson", unit: "330", type: "2 Bed", rent: 2800, leaseStart: "2026-02-01", leaseEnd: "2027-01-31", moveIn: "Feb 1, 2026", status: "active", autopay: true, balance: 0, renewalStatus: "pending", phone: "(512) 555-1002", email: "manderson@outlook.com" },
  { id: 3, name: "James Wilson", unit: "204", type: "1 Bed", rent: 2100, leaseStart: "2026-01-05", leaseEnd: "2027-01-04", moveIn: "Jan 5, 2026", status: "active", autopay: false, balance: 0, renewalStatus: "at_risk", phone: "(512) 555-1003", email: "jwilson@gmail.com" },
  { id: 4, name: "Ana Gomez", unit: "118", type: "Studio", rent: 1650, leaseStart: "2026-01-10", leaseEnd: "2027-01-09", moveIn: "Jan 10, 2026", status: "active", autopay: true, balance: 0, renewalStatus: "pending", phone: "(512) 555-1004", email: "agomez@yahoo.com" },
  { id: 5, name: "David Park", unit: "305", type: "2 Bed", rent: 2800, leaseStart: "2026-02-15", leaseEnd: "2027-02-14", moveIn: "Feb 15, 2026", status: "active", autopay: false, balance: 2800, renewalStatus: "pending", phone: "(512) 555-1005", email: "dpark@gmail.com" },
  { id: 6, name: "Tyler Brooks", unit: "107", type: "1 Bed", rent: 2100, leaseStart: "2026-01-20", leaseEnd: "2027-01-19", moveIn: "Jan 20, 2026", status: "active", autopay: false, balance: 2175, renewalStatus: "not_renewing", phone: "(512) 555-1006", email: "tbrooks@icloud.com" },
  { id: 7, name: "Sarah N.", unit: "412", type: "2 Bed", rent: 2800, leaseStart: "2026-01-15", leaseEnd: "2027-01-14", moveIn: "Jan 15, 2026", status: "active", autopay: true, balance: 0, renewalStatus: "n/a", phone: "(512) 555-1007", email: "sarahN@gmail.com" },
  { id: 8, name: "Rachel Kim", unit: "115", type: "Studio", rent: 1650, leaseStart: "2026-01-25", leaseEnd: "2027-01-24", moveIn: "Jan 25, 2026", status: "active", autopay: true, balance: 0, renewalStatus: "pending", phone: "(512) 555-1008", email: "rkim@proton.me" },
  { id: 9, name: "Jamie Lee", unit: "Studio-A", type: "Studio", rent: 1650, leaseStart: "2026-05-01", leaseEnd: "2027-06-30", moveIn: "May 1, 2026", status: "future", autopay: true, balance: 0, renewalStatus: "n/a", phone: "(512) 555-1009", email: "jlee@gmail.com" },
  { id: 10, name: "Tom Nguyen", unit: "208", type: "1 Bed", rent: 2100, leaseStart: "2026-03-01", leaseEnd: "2027-02-28", moveIn: "Mar 1, 2026", status: "active", autopay: false, balance: 2175, renewalStatus: "at_risk", phone: "(512) 555-1010", email: "tnguyen@gmail.com" },
];

// ============ APPLICATIONS DATA ============
const applications = [
  { id: "APP-1047", name: "Alex Rivera", unit: "2BR-A", appliedDate: "Apr 12", status: "screening", rent: 2800, creditScore: null, income: "$92,000", employer: "Dell Technologies", step: "credit_check", docs: { id: true, paystubs: true, bank: false, employer: false }, phone: "(512) 555-0142", email: "arivera@gmail.com" },
  { id: "APP-1046", name: "Morgan Davis", unit: "2BR-D", appliedDate: "Apr 11", status: "screening", rent: 2800, creditScore: 720, income: "$108,000", employer: "Self-employed", step: "income_verify", docs: { id: true, paystubs: true, bank: true, employer: false }, phone: "(512) 555-0311", email: "mdavis@gmail.com" },
  { id: "APP-1045", name: "Taylor Kim", unit: "Studio", appliedDate: "Apr 10", status: "pending_review", rent: 1650, creditScore: 695, income: "$54,000", employer: "Austin ISD", step: "review", docs: { id: true, paystubs: true, bank: true, employer: true }, phone: "(404) 555-0267", email: "tkim@yahoo.com" },
  { id: "APP-1044", name: "Sam Ortiz", unit: "3BR", appliedDate: "Apr 9", status: "approved", rent: 3400, creditScore: 780, income: "$145,000", employer: "Google", step: "complete", docs: { id: true, paystubs: true, bank: true, employer: true }, phone: "(512) 555-0645", email: "sortiz@gmail.com" },
  { id: "APP-1043", name: "Riley Chen", unit: "2BR", appliedDate: "Apr 8", status: "screening", rent: 2800, creditScore: null, income: "$76,000", employer: "UT Austin", step: "credit_check", docs: { id: true, paystubs: false, bank: false, employer: false }, phone: "(512) 555-0756", email: "rchen@proton.me" },
  { id: "APP-1042", name: "Nia Thompson", unit: "1BR-C", appliedDate: "Apr 6", status: "denied", rent: 2100, creditScore: 520, income: "$38,000", employer: "Contract work", step: "complete", docs: { id: true, paystubs: true, bank: true, employer: false }, phone: "(512) 555-0888", email: "nthompson@gmail.com" },
];

// ============ CONTRACTORS DATA ============
const contractors = [
  { id: 1, name: "Mike Rodriguez", company: "MR Plumbing & HVAC", specialties: ["Plumbing", "HVAC"], rating: 4.8, jobsCompleted: 47, avgResponse: "2.1 hrs", avgCompletion: "1.2 days", status: "available", phone: "(512) 555-2001", rate: "$85/hr", activeJobs: 1 },
  { id: 2, name: "Carlos Luna", company: "Luna Electrical", specialties: ["Electrical", "Lighting"], rating: 4.9, jobsCompleted: 32, avgResponse: "1.5 hrs", avgCompletion: "0.8 days", status: "on_job", phone: "(512) 555-2002", rate: "$95/hr", activeJobs: 2 },
  { id: 3, name: "Premier Appliance Repair", company: "Premier Appliance", specialties: ["Appliance", "Kitchen"], rating: 4.5, jobsCompleted: 28, avgResponse: "4.2 hrs", avgCompletion: "1.5 days", status: "available", phone: "(512) 555-2003", rate: "$75/hr", activeJobs: 0 },
  { id: 4, name: "Austin Lock & Key", company: "Austin Lock & Key", specialties: ["Lock/Key", "Security"], rating: 4.7, jobsCompleted: 15, avgResponse: "0.8 hrs", avgCompletion: "0.3 days", status: "available", phone: "(512) 555-2004", rate: "$65/hr", activeJobs: 0 },
  { id: 5, name: "Elite Painting Co", company: "Elite Painting", specialties: ["Painting", "Drywall"], rating: 4.6, jobsCompleted: 22, avgResponse: "6.0 hrs", avgCompletion: "2.1 days", status: "available", phone: "(512) 555-2005", rate: "$70/hr", activeJobs: 0 },
];

// ============ RENT SETTINGS DATA ============
const rentComplianceDefaults = {
  state: "Texas",
  gracePeriod: 3,
  lateFeeType: "flat",
  lateFeeAmount: 75,
  lateFeeMaxPct: null,
  securityDepositMax: "No state limit",
  securityDepositEscrow: false,
  securityDepositInterest: false,
  returnDeadline: 30,
  nsfFee: 30,
  autopayDefault: true,
  acceptedMethods: ["ach", "debit", "credit"],
  paymentProcessingDays: 2,
};

// ============ SHARED COMPONENTS ============
const Badge = ({ label, color, bg }) => (
  <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color, backgroundColor: bg, letterSpacing: 0.2 }}>{label}</span>
);
const StatusDot = ({ color, pulse }) => (
  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
    {pulse && <span style={{ position: "absolute", width: 12, height: 12, borderRadius: "50%", backgroundColor: color, opacity: 0.25, animation: "pulse 2s ease-in-out infinite" }} />}
    <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: color }} />
  </span>
);
const KPI = ({ label, value, sub, trend, accent: isAccent = false }) => (
  <div style={{ padding: "16px 0", flex: 1, minWidth: 130, borderLeft: isAccent ? `2px solid ${C.accent}` : "none", paddingLeft: isAccent ? 16 : 0 }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: isAccent ? C.accent : C.inkMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: fontSerif, fontSize: 24, fontWeight: 400, color: C.ink, letterSpacing: -0.5 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, marginTop: 3, fontWeight: 500, color: trend === "up" ? C.green : trend === "down" ? C.red : C.inkMuted }}>{trend === "up" ? "\u2191 " : trend === "down" ? "\u2193 " : ""}{sub}</div>}
  </div>
);
const SectionTitle = ({ children, sub, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
    <div>
      <h2 style={{ fontFamily: fontSerif, fontSize: 18, fontWeight: 400, color: C.ink, margin: 0, letterSpacing: -0.2 }}>{children}</h2>
      {sub && <p style={{ fontSize: 12, color: C.inkMuted, margin: "4px 0 0", lineHeight: 1.5 }}>{sub}</p>}
    </div>
    {right}
  </div>
);
const Pill = ({ label, active, onClick, count }) => (
  <button onClick={onClick} style={{ padding: "6px 14px", fontSize: 13, fontWeight: active ? 600 : 400, borderRadius: 20, backgroundColor: active ? C.ink : "transparent", color: active ? "#fff" : C.inkMuted, border: active ? "none" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", fontFamily: font }}>
    {label}{count > 0 && <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: active ? "rgba(255,255,255,0.2)" : C.surfaceAlt, padding: "1px 5px", borderRadius: 10 }}>{count}</span>}
  </button>
);
const Panel = ({ children, style = {} }) => (
  <div style={{ backgroundColor: C.surface, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: 22, boxShadow: C.shadow, ...style }}>{children}</div>
);
const ttStyle = { backgroundColor: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, color: C.ink, fontSize: 12, padding: "6px 10px", boxShadow: C.shadow };
const leadStatusMap = { new: { l: "New", c: C.accent, b: C.accentLight }, contacted: { l: "Contacted", c: C.purple, b: C.purpleBg }, tour_scheduled: { l: "Tour Set", c: C.amber, b: C.amberBg }, toured: { l: "Toured", c: "#0891b2", b: "#E0F7FA" }, applied: { l: "Applied", c: C.purple, b: C.purpleBg }, approved: { l: "Approved", c: C.green, b: C.greenBg }, lease_signed: { l: "Signed", c: C.green, b: C.greenBg }, lost: { l: "Lost", c: C.red, b: C.redBg } };
const priorityMap = { urgent: { l: "URGENT", c: C.red, b: C.redBg }, high: { l: "High", c: C.amber, b: C.amberBg }, medium: { l: "Medium", c: C.accent, b: C.accentLight }, low: { l: "Low", c: C.inkMuted, b: C.surfaceAlt } };
const mxStatusMap = { open: { l: "Open", c: C.red, b: C.redBg }, in_progress: { l: "In Progress", c: C.amber, b: C.amberBg }, scheduled: { l: "Scheduled", c: C.accent, b: C.accentLight }, completed: { l: "Done", c: C.green, b: C.greenBg } };

// Dashboard merged into CommandCenterView

// ============ LEADS ============
const LeadsView = () => {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const filtered = allLeads.filter(l => filter === "all" ? true : filter === "unassigned" ? !l.agent : filter === "attention" ? l.sla !== "ok" : l.status === filter);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <KPI label="Total Leads" value="416" sub="+45 this week" trend="up" /><KPI label="Pipeline" value="89" sub="21% of total" /><KPI label="Tour Conv." value="58.3%" sub="+3.2%" trend="up" /><KPI label="Lead\u2192Lease" value="29.1%" sub="Avg: 22%" trend="up" />
      </div>
      <Panel>
        <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
          {[{k:"all",l:"All",n:allLeads.length},{k:"attention",l:"Attention",n:allLeads.filter(l=>l.sla!=="ok").length},{k:"unassigned",l:"Unassigned",n:allLeads.filter(l=>!l.agent).length},{k:"lease_signed",l:"Signed",n:allLeads.filter(l=>l.status==="lease_signed").length}].map(f=><Pill key={f.k} label={f.l} active={filter===f.k} onClick={()=>setFilter(f.k)} count={f.n} />)}
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{["","Name","Source","Status","Unit","Agent","When"].map(h=><th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(l=>{const st=leadStatusMap[l.status]||leadStatusMap.new;return(
                <tr key={l.id} onClick={()=>setSelected(selected?.id===l.id?null:l)} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", backgroundColor: selected?.id===l.id?C.accentLight:"transparent" }}>
                  <td style={{ padding: "10px", width: 20 }}><StatusDot color={l.sla==="critical"?C.red:l.sla==="warning"?C.amber:C.green} pulse={l.sla==="critical"} /></td>
                  <td style={{ padding: "10px", fontWeight: 600, color: C.ink }}>{l.name}</td><td style={{ padding: "10px", color: C.inkLight }}>{l.source}</td>
                  <td style={{ padding: "10px" }}><Badge label={st.l} color={st.c} bg={st.b} /></td>
                  <td style={{ padding: "10px", color: C.inkLight }}>{l.unit}</td><td style={{ padding: "10px", color: l.agent?C.inkLight:C.red, fontWeight: l.agent?400:600 }}>{l.agent||"Unassigned"}</td><td style={{ padding: "10px", color: C.inkMuted }}>{l.created}</td>
                </tr>)})}</tbody>
            </table>
          </div>
          {selected && (
            <div style={{ width: 260, borderLeft: `1px solid ${C.border}`, paddingLeft: 18, marginLeft: 14, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{selected.name}</h3><button onClick={()=>setSelected(null)} style={{ background: "none", border: "none", color: C.inkMuted, cursor: "pointer", fontSize: 16 }}>{"\u00D7"}</button></div>
              <Badge label={leadStatusMap[selected.status]?.l} color={leadStatusMap[selected.status]?.c} bg={leadStatusMap[selected.status]?.b} />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Source",selected.source],["Unit",`${selected.unit} \u2014 $${selected.rent?.toLocaleString()}/mo`],["Agent",selected.agent||"Unassigned"],["Phone",selected.phone],["Email",selected.email]].map(([k,v])=>(
                  <div key={k}><div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1 }}>{k}</div><div style={{ fontSize: 13, color: C.ink }}>{v}</div></div>
                ))}
                <div><div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>Notes</div><div style={{ fontSize: 12, color: C.inkLight, lineHeight: 1.5, padding: "8px 10px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>{selected.notes}</div></div>
              </div>
              {!selected.agent && <button style={{ marginTop: 12, width: "100%", padding: "9px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Assign Agent</button>}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
};

// ============ LISTINGS & SYNDICATION ============
const ListingsView = () => {
  const [subTab, setSubTab] = useState("syndication");
  const [buildStep, setBuildStep] = useState(0);
  const [platforms, setPlatforms] = useState({
    zillow: { name: "Zillow", status: "live", listings: 139, leads: 142, enabled: true, logo: "Z", color: "#006AFF" },
    apartments: { name: "Apartments.com", status: "live", listings: 139, leads: 98, enabled: true, logo: "A", color: "#E74C3C" },
    rentcom: { name: "Rent.com", status: "live", listings: 139, leads: 34, enabled: true, logo: "R", color: "#00B4D8" },
    realtor: { name: "Realtor.com", status: "live", listings: 139, leads: 28, enabled: true, logo: "R", color: "#D92228" },
    hotpads: { name: "HotPads", status: "live", listings: 139, leads: 15, enabled: true, logo: "H", color: "#43B02A" },
    facebook: { name: "FB Marketplace", status: "live", listings: 139, leads: 22, enabled: true, logo: "f", color: "#1877F2" },
    trulia: { name: "Trulia", status: "live", listings: 139, leads: 45, enabled: true, logo: "T", color: "#53B50A" },
    craigslist: { name: "Craigslist", status: "paused", listings: 0, leads: 0, enabled: false, logo: "CL", color: "#800080" },
  });

  const togglePlatform = (key) => setPlatforms(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled, status: !prev[key].enabled ? "syncing" : "paused", listings: !prev[key].enabled ? 139 : 0 } }));

  const listingSteps = [
    { title: "Upload Real Photos", desc: "Minimum 8 photos per unit type. We mean it \u2014 no AI-generated images, no stock photos, no heavy filters. Renters can spot fake imagery instantly and it destroys trust before they ever walk in. Shoot on a phone in natural light, clean the unit first, and show the space honestly. A real photo of a clean apartment will always outperform a staged render." },
    { title: "Write a Human Description", desc: "Our listing agent will draft your copy using real details about the unit and building. No buzzword salad. No \u201Cluxury living redefined.\u201D Say what makes the unit actually nice to live in: the natural light in the morning, the walk to the coffee shop, the fact that the dishwasher is brand new. People are choosing a home, not buying a tagline." },
    { title: "Set Honest Pricing", desc: "List the real price. If you\u2019re offering a concession, show it clearly \u2014 \u201C$2,100/mo (first month free)\u201D not a fake $1,925 that requires a 14-month lease to work out. Transparency converts. Bait-and-switch pricing wastes everyone\u2019s time and generates leads that ghost after the first call." },
    { title: "Review & Publish", desc: "Preview exactly what renters will see on each platform. Our agent will optimize formatting for each site (Zillow, Apartments.com, etc.) since they all display differently. One click publishes everywhere. Updates sync automatically when you change pricing or availability." },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <Pill label="Syndication" active={subTab==="syndication"} onClick={()=>setSubTab("syndication")} />
        <Pill label="Create Listing" active={subTab==="create"} onClick={()=>setSubTab("create")} />
        <Pill label="Listing Agent" active={subTab==="agent"} onClick={()=>setSubTab("agent")} />
      </div>

      {subTab === "syndication" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <KPI label="Live Platforms" value={Object.values(platforms).filter(p=>p.status==="live").length} sub={`of ${Object.keys(platforms).length}`} accent />
            <KPI label="Active Listings" value="139" sub="Across all platforms" />
            <KPI label="Leads from Listings" value={Object.values(platforms).reduce((s,p)=>s+p.leads,0)} sub="All-time" trend="up" />
            <KPI label="Listing Cost" value="$0" sub="Included with LeaseRight" />
          </div>
          <div style={{ backgroundColor: C.greenBg, borderRadius: C.radius, padding: "14px 20px", marginBottom: 16, border: `1px solid ${C.green}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{"\u2713"}</span>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Syndication Active</div><div style={{ fontSize: 12, color: C.inkLight }}>139 units on {Object.values(platforms).filter(p=>p.status==="live").length} platforms. Last synced 4 min ago.</div></div>
            </div>
            <button style={{ padding: "8px 18px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.green, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font }}>Sync Now</button>
          </div>
          <Panel>
            <SectionTitle sub="Toggle on/off. Listings push automatically.">Platforms</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(platforms).map(([key, p]) => {
                const sc = { live: C.green, syncing: C.amber, paused: C.inkMuted };
                const sl = { live: "Live", syncing: "Syncing...", paused: "Off" };
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", backgroundColor: p.enabled ? C.surface : C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${C.border}`, opacity: p.enabled ? 1 : 0.55 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: `${p.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: p.color, fontSize: 15, fontWeight: 800, border: `1px solid ${p.color}22` }}>{p.logo}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}><span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{p.name}</span><StatusDot color={sc[p.status]} pulse={p.status==="syncing"} /><span style={{ fontSize: 11, color: sc[p.status], fontWeight: 600 }}>{sl[p.status]}</span></div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>{p.enabled ? `${p.listings} listings \u00B7 ${p.leads} leads` : "Not publishing"}</div>
                    </div>
                    <button onClick={()=>togglePlatform(key)} style={{ width: 42, height: 22, borderRadius: 11, border: "none", cursor: "pointer", backgroundColor: p.enabled ? C.green : C.border, position: "relative", transition: "background 0.2s" }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 3, left: p.enabled ? 22 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {subTab === "create" && (
        <div>
          <Panel style={{ marginBottom: 16, borderLeft: `3px solid ${C.accent}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Our listing philosophy</div>
            <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7 }}>
              The best-performing listings aren't the flashiest \u2014 they're the most honest. Real photos, real language, real pricing. Renters scroll past hundreds of listings that all sound the same. The ones that convert are the ones that feel like a real person wrote them about a real place. That's what we help you build here.
            </div>
          </Panel>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {listingSteps.map((s, i) => (
              <div key={i} onClick={() => setBuildStep(i)} style={{ flex: 1, padding: "14px 16px", borderRadius: C.radiusSm, border: `1px solid ${i === buildStep ? C.accent : C.border}`, backgroundColor: i === buildStep ? C.accentLight : i < buildStep ? C.greenBg : C.surface, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, backgroundColor: i < buildStep ? C.green : i === buildStep ? C.accent : C.surfaceAlt, color: i <= buildStep ? "#fff" : C.inkMuted, border: i > buildStep ? `1px solid ${C.border}` : "none" }}>
                    {i < buildStep ? "\u2713" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: i === buildStep ? C.accent : C.ink }}>{s.title}</span>
                </div>
              </div>
            ))}
          </div>

          <Panel>
            <SectionTitle>Step {buildStep + 1}: {listingSteps[buildStep].title}</SectionTitle>
            <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7, marginBottom: 20, maxWidth: 700 }}>{listingSteps[buildStep].desc}</div>

            {buildStep === 0 && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                  {["Living Room","Kitchen","Bedroom","Bathroom","Building Exterior","Amenity Space","View from Unit","Hallway/Entry"].map((label, i) => (
                    <div key={i} style={{ aspectRatio: "4/3", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `2px dashed ${i < 3 ? C.green : C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      {i < 3 ? <span style={{ fontSize: 18, color: C.green, marginBottom: 4 }}>{"\u2713"}</span> : <span style={{ fontSize: 20, color: C.inkMuted, marginBottom: 4 }}>+</span>}
                      <span style={{ fontSize: 11, color: i < 3 ? C.green : C.inkMuted, fontWeight: 500 }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "12px 16px", backgroundColor: C.amberBg, borderRadius: C.radiusSm, fontSize: 12, color: C.amber }}>
                  <strong>Photo guidelines:</strong> Natural light only. No wide-angle lens distortion. No AI-generated or stock images. Minimum 8 photos required. Clean the unit before shooting.
                </div>
              </div>
            )}

            {buildStep === 1 && (
              <div>
                <div style={{ backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, padding: "16px 20px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: C.inkMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Draft by LeaseRight Listing Assistant</div>
                  <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.8, fontStyle: "italic" }}>
                    "Bright one-bedroom on the third floor with south-facing windows that get great morning light. The kitchen was just finished \u2014 quartz counters, soft-close cabinets, and a full-size dishwasher. You're a 5-minute walk to the Red Line and there's a coffee shop on the ground floor that makes a solid cortado. Building has a rooftop with downtown views, package lockers, and covered bike parking. Pets welcome, no weight limit."
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ padding: "9px 18px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>Use This Draft</button>
                  <button style={{ padding: "9px 18px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>Edit Draft</button>
                  <button style={{ padding: "9px 18px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>Regenerate (1 token)</button>
                </div>
              </div>
            )}

            {buildStep === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.inkMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Monthly Rent</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>$2,100</span><span style={{ fontSize: 13, color: C.inkMuted }}>/month</span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: C.inkMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Concession (optional)</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["None","1 month free","$500 off first month","Waived app fee"].map((c,i) => (
                      <button key={i} style={{ padding: "8px 14px", borderRadius: C.radiusSm, border: `1px solid ${i===1?C.accent:C.border}`, backgroundColor: i===1?C.accentLight:"transparent", color: i===1?C.accent:C.inkLight, fontSize: 12, fontWeight: i===1?600:400, cursor: "pointer", fontFamily: font }}>{c}</button>
                    ))}
                  </div>
                </div>
                <div style={{ backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, padding: "16px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>What the renter sees:</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>$2,100/mo</div>
                  <div style={{ fontSize: 13, color: C.green, fontWeight: 600, marginTop: 2 }}>First month free on 13+ month leases</div>
                  <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 8 }}>Effective rent: $1,938/mo over 13 months</div>
                  <div style={{ marginTop: 12, padding: "8px 10px", backgroundColor: C.greenBg, borderRadius: 4, fontSize: 11, color: C.green }}>Transparent pricing builds trust. No hidden math.</div>
                </div>
              </div>
            )}

            {buildStep === 3 && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {["Zillow Preview","Apartments.com Preview","Facebook Preview"].map((p,i) => (
                    <div key={i} style={{ padding: "40px 16px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${C.border}`, textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 4 }}>{p}</div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>Formatted for platform</div>
                    </div>
                  ))}
                </div>
                <button style={{ padding: "12px 32px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.green, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font }}>
                  Publish to All Platforms
                </button>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              {buildStep > 0 && <button onClick={()=>setBuildStep(buildStep-1)} style={{ padding: "9px 20px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>{"\u2190 Back"}</button>}
              {buildStep < 3 && <button onClick={()=>setBuildStep(buildStep+1)} style={{ padding: "9px 24px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", marginLeft: "auto", fontFamily: font }}>{"Next \u2192"}</button>}
            </div>
          </Panel>
        </div>
      )}

      {subTab === "agent" && (
        <div>
          <Panel style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>LA</span>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 4 }}>LeaseRight Listing Assistant</div>
                <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7, marginBottom: 12 }}>
                  Our listing agent writes descriptions that sound like a helpful friend, not a real estate ad. It studies your photos, unit features, and neighborhood to write copy that's specific, warm, and honest. No "luxury" unless the place actually feels luxurious. No "steps from downtown" if it's a 20-minute walk. Real language for real renters.
                </div>
                <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7, marginBottom: 16 }}>
                  The agent also optimizes your listing for each platform \u2014 Zillow, Apartments.com, and Facebook all display listings differently, and what performs on one may not perform on another. One draft, multiple optimized outputs.
                </div>
              </div>
            </div>
          </Panel>

          <Panel style={{ marginBottom: 16 }}>
            <SectionTitle sub="Tokens are used for listing generation, rewrites, and optimization">Token Balance</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ textAlign: "center", padding: "20px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>47</div>
                <div style={{ fontSize: 12, color: C.inkMuted }}>Tokens remaining</div>
              </div>
              <div style={{ textAlign: "center", padding: "20px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.inkLight }}>13</div>
                <div style={{ fontSize: 12, color: C.inkMuted }}>Used this month</div>
              </div>
              <div style={{ textAlign: "center", padding: "20px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>92%</div>
                <div style={{ fontSize: 12, color: C.inkMuted }}>First-draft acceptance rate</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ tokens: 50, price: "$25", per: "$0.50/ea" }, { tokens: 200, price: "$80", per: "$0.40/ea", popular: true }, { tokens: 500, price: "$150", per: "$0.30/ea" }].map((p, i) => (
                <div key={i} style={{ flex: 1, padding: "16px", borderRadius: C.radiusSm, border: `1px solid ${p.popular ? C.accent : C.border}`, backgroundColor: p.popular ? C.accentLight : C.surface, textAlign: "center", cursor: "pointer", position: "relative" }}>
                  {p.popular && <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", backgroundColor: C.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Popular</div>}
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{p.tokens} tokens</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.accent, marginTop: 4 }}>{p.price}</div>
                  <div style={{ fontSize: 11, color: C.inkMuted }}>{p.per}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle>What costs a token?</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { action: "Generate full listing description", cost: "1 token", note: "From your photos and unit details" },
                { action: "Rewrite / adjust tone", cost: "1 token", note: "Make it warmer, shorter, highlight different features" },
                { action: "Platform optimization", cost: "Free", note: "Auto-formatting for each platform is always included" },
                { action: "Bulk generate (full building)", cost: "1 token per unit type", note: "Studios, 1BR, 2BR each count as one" },
              ].map((item, i) => (
                <div key={i} style={{ padding: "12px 14px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{item.action}</span>
                    <Badge label={item.cost} color={item.cost === "Free" ? C.green : C.accent} bg={item.cost === "Free" ? C.greenBg : C.accentLight} />
                  </div>
                  <div style={{ fontSize: 11, color: C.inkMuted }}>{item.note}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
};

// ============ RENT COLLECTION ============
const RentView = () => {
  const [subTab, setSubTab] = useState("overview");
  const totalDue = tenantLedger.reduce((s, t) => s + t.rent, 0);
  const totalCollected = tenantLedger.filter(t => t.status === "paid").reduce((s, t) => s + t.rent, 0);
  const collectionRate = ((totalCollected / totalDue) * 100).toFixed(1);
  const autopayCount = tenantLedger.filter(t => t.method === "autopay").length;
  const lateCount = tenantLedger.filter(t => t.status === "late").length;
  const pendingCount = tenantLedger.filter(t => t.status === "pending").length;

  const payStatusMap = {
    paid: { l: "Paid", c: C.green, b: C.greenBg },
    pending: { l: "Pending", c: C.amber, b: C.amberBg },
    late: { l: "Late", c: C.red, b: C.redBg },
    upcoming: { l: "Upcoming", c: C.accent, b: C.accentLight },
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <Pill label="Overview" active={subTab==="overview"} onClick={()=>setSubTab("overview")} />
        <Pill label="Tenant Ledger" active={subTab==="ledger"} onClick={()=>setSubTab("ledger")} />
        <Pill label="Autopay Setup" active={subTab==="autopay"} onClick={()=>setSubTab("autopay")} />
      </div>

      {subTab === "overview" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <KPI label="Collected (Apr)" value={`$${totalCollected.toLocaleString()}`} sub={`${collectionRate}% collection rate`} trend="up" accent />
            <KPI label="Outstanding" value={`$${(totalDue - totalCollected).toLocaleString()}`} sub={`${pendingCount} pending, ${lateCount} late`} trend="down" />
            <KPI label="Autopay Enrolled" value={`${autopayCount}/${tenantLedger.length}`} sub={`${Math.round(autopayCount/tenantLedger.length*100)}% enrollment`} trend="up" />
            <KPI label="Late Fees Assessed" value="$150" sub="2 residents" />
            <KPI label="Your Processing Cost" value="$0" sub="Renters pay $4.95/tx" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
            <Panel>
              <SectionTitle sub="How rent payment works for your tenants">The Tenant Experience</SectionTitle>
              <div style={{ display: "flex", gap: 0 }}>
                {[
                  { step: "1", title: "Invite", desc: "Tenant gets an email with a link to set up their payment account. Takes 2 minutes." },
                  { step: "2", title: "Connect", desc: "They link a bank account or debit card. ACH or card \u2014 their choice." },
                  { step: "3", title: "Autopay", desc: "They toggle autopay on. Rent hits your account on the 1st, every month." },
                  { step: "4", title: "Done", desc: "They see a $4.95 processing fee per transaction. You see $0 fees. Ever." },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: "16px 14px", textAlign: "center", position: "relative" }}>
                    {i < 3 && <div style={{ position: "absolute", top: 26, right: -8, width: 16, height: 2, backgroundColor: C.border }} />}
                    <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: C.accentLight, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, margin: "0 auto 8px" }}>{s.step}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: C.inkLight, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <SectionTitle>Fee Structure</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { item: "Rent payment (ACH)", renterFee: "$4.95", ownerFee: "$0" },
                  { item: "Rent payment (Card)", renterFee: "2.99%", ownerFee: "$0" },
                  { item: "Same-day payment", renterFee: "$9.95", ownerFee: "$0" },
                  { item: "Split rent (2 payments)", renterFee: "$4.95/split", ownerFee: "$0" },
                  { item: "Rent reporting to credit bureaus", renterFee: "$2.95/mo", ownerFee: "$0" },
                  { item: "Security deposit", renterFee: "$4.95", ownerFee: "$0" },
                  { item: "Application + screening", renterFee: "$45", ownerFee: "$0" },
                  { item: "Late fee collection", renterFee: "$0", ownerFee: "$0" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                    <span style={{ color: C.ink }}>{row.item}</span>
                    <span style={{ color: C.inkMuted, textAlign: "center" }}>{row.renterFee}</span>
                    <span style={{ color: C.green, fontWeight: 700, textAlign: "center" }}>{row.ownerFee}</span>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px", padding: "6px 0", fontSize: 10, color: C.inkMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  <span></span><span style={{ textAlign: "center" }}>Renter Pays</span><span style={{ textAlign: "center" }}>You Pay</span>
                </div>
              </div>
            </Panel>
          </div>

          <Panel style={{ backgroundColor: C.greenBg, border: `1px solid ${C.green}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>$0</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>You never pay processing fees. Period.</div>
                <div style={{ fontSize: 13, color: C.inkLight }}>Processing fees are charged to the renter per transaction. This is standard — most tenants already pay convenience fees through their current portal. Renters also get optional benefits: credit bureau reporting ($2.95/mo builds their credit), split payments ($4.95), and same-day processing ($9.95). You keep 100% of collected rent.</div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {subTab === "ledger" && (
        <div>
          <Panel>
            <SectionTitle sub="April 2026 rent roll">Tenant Ledger</SectionTitle>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["Resident","Unit","Rent","Status","Paid On","Method","Processing Fee","Late Fee"].map(h=><th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {tenantLedger.map((t, i) => {
                  const st = payStatusMap[t.status];
                  return (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: t.status === "late" ? C.redBg : "transparent" }}>
                      <td style={{ padding: "10px", fontWeight: 600, color: C.ink }}>{t.name}</td>
                      <td style={{ padding: "10px", color: C.inkLight }}>{t.unit}</td>
                      <td style={{ padding: "10px", fontWeight: 600, color: C.ink }}>${t.rent.toLocaleString()}</td>
                      <td style={{ padding: "10px" }}><Badge label={st.l} color={st.c} bg={st.b} /></td>
                      <td style={{ padding: "10px", color: C.inkLight }}>{t.paidDate || "\u2014"}</td>
                      <td style={{ padding: "10px", color: C.inkLight }}>{t.method === "autopay" ? <Badge label="Autopay" color={C.green} bg={C.greenBg} /> : t.method || "\u2014"}</td>
                      <td style={{ padding: "10px", color: C.inkMuted }}>{t.processingFee > 0 ? `$${t.processingFee} (renter)` : "\u2014"}</td>
                      <td style={{ padding: "10px", color: t.lateFee > 0 ? C.red : C.inkMuted, fontWeight: t.lateFee > 0 ? 600 : 400 }}>{t.lateFee > 0 ? `$${t.lateFee}` : "\u2014"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {subTab === "autopay" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <KPI label="Autopay Enrolled" value={`${autopayCount}`} sub={`of ${tenantLedger.length} residents`} accent />
            <KPI label="On-Time Rate (Autopay)" value="100%" sub="Never missed" trend="up" />
            <KPI label="On-Time Rate (Manual)" value="71%" sub="Often late" trend="down" />
          </div>
          <Panel style={{ marginBottom: 16 }}>
            <SectionTitle sub="Push tenants toward autopay and everyone wins">Why Autopay Matters</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 8 }}>For you</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Predictable cash flow on the 1st, every month","Zero chasing late payments","Fewer delinquencies = fewer evictions","Bank account gets funded automatically"].map((b,i)=>(
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><span style={{ color: C.green, fontWeight: 800, fontSize: 12, marginTop: 2 }}>{"\u2713"}</span><span style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{b}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 8 }}>For tenants</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Never worry about missing rent","No late fees (saves $75+ per incident)","2-minute setup, works forever","Can cancel anytime from their portal"].map((b,i)=>(
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><span style={{ color: C.green, fontWeight: 800, fontSize: 12, marginTop: 2 }}>{"\u2713"}</span><span style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{b}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
          <Panel>
            <SectionTitle>Non-Enrolled Residents</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tenantLedger.filter(t => t.method !== "autopay" && t.status !== "upcoming").map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{t.name}</span>
                    <span style={{ fontSize: 12, color: C.inkMuted, marginLeft: 8 }}>Unit {t.unit}</span>
                    {t.status === "late" && <Badge label="Currently Late" color={C.red} bg={C.redBg} />}
                  </div>
                  <button style={{ padding: "7px 16px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: font }}>Send Autopay Invite</button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
};

// ============ BANKING ============
const BankingView = () => {
  const monthlyData = [
    { m: "Nov", rent: 168000, fees: 0, deposits: 12000, net: 180000 },
    { m: "Dec", rent: 185000, fees: 0, deposits: 15000, net: 200000 },
    { m: "Jan", rent: 198000, fees: 0, deposits: 8500, net: 206500 },
    { m: "Feb", rent: 212000, fees: 0, deposits: 11000, net: 223000 },
    { m: "Mar", rent: 235000, fees: 0, deposits: 13200, net: 248200 },
    { m: "Apr", rent: 248050, fees: 0, deposits: 9800, net: 257850 },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <KPI label="Apr Revenue" value="$257,850" sub="Rent + deposits" trend="up" accent />
        <KPI label="Processing Fees" value="$0.00" sub="Paid by renters" />
        <KPI label="Net to Your Account" value="$257,850" sub="100% of collected revenue" />
        <KPI label="Next Payout" value="Apr 16" sub="$12,450 (pending deposits)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <Panel>
          <SectionTitle sub="Net revenue deposited to your bank account">Monthly Revenue</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={monthlyData}>
              <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.15}/><stop offset="100%" stopColor={C.green} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="m" tick={{ fontSize: 11, fill: C.inkMuted }} stroke={C.border} /><YAxis tick={{ fontSize: 11, fill: C.inkMuted }} stroke={C.border} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} /><Tooltip contentStyle={ttStyle} formatter={v=>`$${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="net" stroke={C.green} strokeWidth={2.5} fill="url(#rg)" name="Net Revenue" dot={{ r: 3, fill: C.green, stroke: "#fff", strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <SectionTitle>Connected Account</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>B</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Chase Business Checking</div>
              <div style={{ fontSize: 12, color: C.inkMuted }}>{"\u2022\u2022\u2022\u2022"} 4821</div>
            </div>
            <Badge label="Verified" color={C.green} bg={C.greenBg} />
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Payout Schedule</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Rent payments", schedule: "Daily rolling (T+2)" },
              { label: "Security deposits", schedule: "Held in escrow, released per lease terms" },
              { label: "Application fees", schedule: "Same day" },
              { label: "Late fees", schedule: "Daily rolling (T+2)" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ color: C.ink }}>{p.label}</span>
                <span style={{ color: C.inkMuted }}>{p.schedule}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionTitle sub="Recent transactions hitting your bank account">Payout History</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Date","Description","Gross","Processing Fees","Net to You"].map(h=><th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              { date: "Apr 3", desc: "Daily payout \u2014 8 rent payments", gross: "$17,900", fees: "$0.00", net: "$17,900" },
              { date: "Apr 2", desc: "Daily payout \u2014 3 rent payments", gross: "$6,350", fees: "$0.00", net: "$6,350" },
              { date: "Apr 1", desc: "Daily payout \u2014 52 rent payments (autopay)", gross: "$114,200", fees: "$0.00", net: "$114,200" },
              { date: "Apr 1", desc: "Security deposit \u2014 Jamie Lee", gross: "$1,650", fees: "$0.00", net: "$1,650" },
              { date: "Mar 31", desc: "Application fees (3)", gross: "$225", fees: "$0.00", net: "$225" },
              { date: "Mar 28", desc: "Daily payout \u2014 late payments (5)", gross: "$10,850", fees: "$0.00", net: "$10,850" },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px", color: C.inkLight }}>{row.date}</td>
                <td style={{ padding: "10px", color: C.ink }}>{row.desc}</td>
                <td style={{ padding: "10px", fontWeight: 600, color: C.ink }}>{row.gross}</td>
                <td style={{ padding: "10px", color: C.green, fontWeight: 700 }}>{row.fees}</td>
                <td style={{ padding: "10px", fontWeight: 700, color: C.green }}>{row.net}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, padding: "10px 14px", backgroundColor: C.greenBg, borderRadius: C.radiusSm, fontSize: 12, color: C.green, fontWeight: 500 }}>
          Every row shows $0.00 in processing fees. Renters absorb the $4.95 per transaction. Your gross = your net.
        </div>
      </Panel>
    </div>
  );
};



// ============ INBOX ============
const InboxView = () => {
  const [channelFilter, setChannelFilter] = useState("all");
  const [selectedMsg, setSelectedMsg] = useState(null);
  const filtered = messages.filter(m => channelFilter === "all" ? true : m.type === channelFilter);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <KPI label="Unread" value={messages.filter(m=>m.unread).length} accent /><KPI label="Resident" value={messages.filter(m=>m.type==="resident").length} /><KPI label="Prospect" value={messages.filter(m=>m.type==="prospect").length} /><KPI label="Team" value={messages.filter(m=>m.type==="team").length} />
      </div>
      <Panel>
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {[{k:"all",l:"All",n:messages.length},{k:"resident",l:"Residents",n:messages.filter(m=>m.type==="resident").length},{k:"prospect",l:"Prospects",n:messages.filter(m=>m.type==="prospect").length},{k:"team",l:"Team",n:messages.filter(m=>m.type==="team").length}].map(f=><Pill key={f.k} label={f.l} active={channelFilter===f.k} onClick={()=>setChannelFilter(f.k)} count={f.n} />)}
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1 }}>
            {filtered.map((m, i) => {
              const cc = { sms: C.green, email: C.accent, internal: C.purple, portal: C.amber };
              const cl = { sms: "SMS", email: "Email", internal: "Internal", portal: "Portal" };
              return (
                <div key={m.id} onClick={()=>setSelectedMsg(selectedMsg?.id===m.id?null:m)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", backgroundColor: selectedMsg?.id===m.id?C.accentLight:m.unread?C.surfaceAlt:"transparent" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.ink, flexShrink: 0, border: `1px solid ${C.border}` }}>{m.from.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}>{m.unread && <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.accent }} />}<span style={{ fontSize: 13, fontWeight: m.unread?700:500, color: C.ink }}>{m.from}</span>{m.unit && <span style={{ fontSize: 11, color: C.inkMuted }}>Unit {m.unit}</span>}</div><span style={{ fontSize: 11, color: C.inkMuted }}>{m.time}</span></div>
                    <div style={{ fontSize: 12, color: C.inkLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.preview}</div>
                    <div style={{ marginTop: 4 }}><Badge label={cl[m.channel]} color={cc[m.channel]} bg={`${cc[m.channel]}18`} /></div>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedMsg && (
            <div style={{ width: 300, borderLeft: `1px solid ${C.border}`, paddingLeft: 18, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{selectedMsg.from}</h3><button onClick={()=>setSelectedMsg(null)} style={{ background: "none", border: "none", color: C.inkMuted, cursor: "pointer", fontSize: 16 }}>{"\u00D7"}</button></div>
              {selectedMsg.unit && <div style={{ fontSize: 12, color: C.inkMuted, marginBottom: 12 }}>Unit {selectedMsg.unit}</div>}
              <div style={{ backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, padding: "14px 16px", fontSize: 13, color: C.ink, lineHeight: 1.6, marginBottom: 14 }}>{selectedMsg.preview}</div>
              <div style={{ display: "flex", gap: 8 }}><input placeholder="Type a reply..." style={{ flex: 1, padding: "9px 12px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: font, outline: "none", backgroundColor: C.surfaceAlt, color: C.ink }} /><button style={{ padding: "9px 16px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Send</button></div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
};

// Strategy merged into Pre-Con DD

// ============ PRE-CONSTRUCTION DUE DILIGENCE ============
const PreConView = () => {
  const [step, setStep] = useState(0);
  const [deal, setDeal] = useState({
    name: "", address: "", totalUnits: 200, studios: 40, oneBed: 80, twoBed: 56, threeBed: 24,
    studioRent: 1600, oneBedRent: 2100, twoBedRent: 2700, threeBedRent: 3300,
    coDate: "2027-03-01", lenderStabilization: 18, lenderOccupancy: 93,
    loanAmount: 42000000, interestRate: 7.2,
    marketVacancy: 6.2, compAvgRent1BR: 2050, nearbyUnitsDelivering: 800,
  });

  const update = (k, v) => setDeal(prev => ({ ...prev, [k]: v }));

  // Calculations
  const totalMonthlyRev = (deal.studios * deal.studioRent) + (deal.oneBed * deal.oneBedRent) + (deal.twoBed * deal.twoBedRent) + (deal.threeBed * deal.threeBedRent);
  const stabilizedTarget = Math.round(deal.totalUnits * (deal.lenderOccupancy / 100));
  const monthsToStabilize = deal.lenderStabilization;
  const requiredWeeklyVelocity = Math.ceil(stabilizedTarget / (monthsToStabilize * 4.33));
  const annualGrossRev = totalMonthlyRev * 12;

  // Absorption schedule generation
  const absorptionSchedule = [];
  let cumulative = 0;
  const coDate = new Date(deal.coDate);
  for (let m = 0; m < monthsToStabilize + 3; m++) {
    const monthDate = new Date(coDate);
    monthDate.setMonth(monthDate.getMonth() + m);
    const monthLabel = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    // S-curve absorption: slow start, ramp, plateau
    const progress = m / monthsToStabilize;
    const rate = progress < 0.2 ? 0.4 : progress < 0.7 ? 1.3 : 0.7;
    const monthlyLeases = Math.round(requiredWeeklyVelocity * 4.33 * rate);
    cumulative = Math.min(stabilizedTarget, cumulative + monthlyLeases);
    const monthlyRev = Math.round((cumulative / deal.totalUnits) * totalMonthlyRev);
    absorptionSchedule.push({ m: monthLabel, leased: cumulative, target: Math.min(stabilizedTarget, Math.round((m + 1) / monthsToStabilize * stabilizedTarget)), revenue: monthlyRev });
  }

  // Staffing recommendation
  const getStaffRec = () => {
    if (deal.totalUnits <= 50) return { model: "Part-Time Leasing Agent", headcount: "1 (2-3 days/week)", annualCost: "$18,000-22,000", toursPerWeek: "8-12" };
    if (deal.totalUnits <= 150) return { model: "Full-Time Leasing Agent", headcount: "1", annualCost: "$38,000-48,000", toursPerWeek: "15-25" };
    if (deal.totalUnits <= 300) return { model: "Leasing Team", headcount: "1 Manager + 1 Agent", annualCost: "$85,000-110,000", toursPerWeek: "25-40" };
    return { model: "Full Leasing Office", headcount: "1 Manager + 2-3 Agents", annualCost: "$140,000-190,000", toursPerWeek: "40-60" };
  };
  const staff = getStaffRec();

  // Concession budget
  const concessionBudget = Math.round(totalMonthlyRev * 0.8); // ~1 month effective rent as budget
  const concessionPerUnit = Math.round(concessionBudget / deal.totalUnits);

  const InputField = ({ label, value, onChange, type = "number", prefix, suffix, small }) => (
    <div style={{ marginBottom: small ? 8 : 12 }}>
      <div style={{ fontSize: 11, color: C.inkMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {prefix && <span style={{ fontSize: 14, color: C.inkMuted, fontWeight: 600 }}>{prefix}</span>}
        <input type={type} value={value} onChange={e => onChange(type === "number" ? +e.target.value : e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.ink, fontFamily: font, outline: "none", backgroundColor: C.surfaceAlt }} />
        {suffix && <span style={{ fontSize: 12, color: C.inkMuted, fontWeight: 500, whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)`, borderRadius: C.radius, padding: "28px 32px", marginBottom: 20, color: "#fff" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.6, marginBottom: 6 }}>Pre-Construction</div>
        <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 4, backgroundColor: "rgba(255,255,255,0.15)", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>PLAN MODE</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Lease-Up Strategy Builder</div>
        <div style={{ fontSize: 14, opacity: 0.8, maxWidth: 650, lineHeight: 1.7 }}>
          Build a data-backed lease-up plan for your lender's due diligence package. Input your deal, get an absorption schedule, staffing plan, concession budget, and revenue projection. Export as a lender-ready PDF.
        </div>
      </div>

      {/* Step Indicators */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
        {["Deal Inputs", "Unit Mix & Rents", "Financing Terms", "Your Strategy"].map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: i <= step ? C.ink : C.surfaceAlt, color: i <= step ? "#fff" : C.inkMuted, fontSize: 12, fontWeight: 700, border: `2px solid ${i <= step ? C.ink : C.border}` }}>{i < step ? "\u2713" : i + 1}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: i <= step ? C.ink : C.inkMuted }}>{s}</span>
            </div>
            {i < 3 && <div style={{ flex: 1, height: 2, backgroundColor: i < step ? C.ink : C.border, margin: "0 14px", borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      {/* Step 0: Deal Inputs */}
      {step === 0 && (
        <Panel style={{ maxWidth: 650, margin: "0 auto" }}>
          <SectionTitle sub="Basic information about your development">Tell us about the deal</SectionTitle>
          <InputField label="Project Name" value={deal.name} onChange={v => update("name", v)} type="text" />
          <InputField label="Address / Market" value={deal.address} onChange={v => update("address", v)} type="text" />
          <InputField label="Total Units" value={deal.totalUnits} onChange={v => update("totalUnits", v)} />
          <InputField label="Expected Certificate of Occupancy" value={deal.coDate} onChange={v => update("coDate", v)} type="date" />
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
            <button onClick={() => setStep(1)} style={{ padding: "10px 28px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.ink, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font }}>Next {"\u2192"}</button>
          </div>
        </Panel>
      )}

      {/* Step 1: Unit Mix */}
      {step === 1 && (
        <Panel style={{ maxWidth: 700, margin: "0 auto" }}>
          <SectionTitle sub="How many of each type and your target rents">Unit Mix & Target Rents</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
            {[
              { label: "Studios", countKey: "studios", rentKey: "studioRent" },
              { label: "1-Bedroom", countKey: "oneBed", rentKey: "oneBedRent" },
              { label: "2-Bedroom", countKey: "twoBed", rentKey: "twoBedRent" },
              { label: "3-Bedroom", countKey: "threeBed", rentKey: "threeBedRent" },
            ].map(u => (
              <div key={u.label} style={{ padding: "16px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>{u.label}</div>
                <InputField label="Units" value={deal[u.countKey]} onChange={v => update(u.countKey, v)} small />
                <InputField label="Target Rent" value={deal[u.rentKey]} onChange={v => update(u.rentKey, v)} prefix="$" suffix="/mo" small />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: C.inkMuted }}>Total units from mix: <strong style={{ color: C.ink }}>{deal.studios + deal.oneBed + deal.twoBed + deal.threeBed}</strong></span>
            <span style={{ fontSize: 13, color: C.inkMuted }}>Monthly gross at full occupancy: <strong style={{ color: C.green }}>${totalMonthlyRev.toLocaleString()}</strong></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14 }}>
            <button onClick={() => setStep(0)} style={{ padding: "10px 20px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>{"\u2190 Back"}</button>
            <button onClick={() => setStep(2)} style={{ padding: "10px 28px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.ink, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font }}>Next {"\u2192"}</button>
          </div>
        </Panel>
      )}

      {/* Step 2: Financing Terms */}
      {step === 2 && (
        <Panel style={{ maxWidth: 650, margin: "0 auto" }}>
          <SectionTitle sub="Your lender's requirements drive the entire strategy">Financing & Lender Terms</SectionTitle>
          <div style={{ padding: "14px 18px", backgroundColor: C.amberBg, borderRadius: C.radiusSm, border: `1px solid ${C.amber}22`, marginBottom: 16, fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
            <strong>This is the number that matters.</strong> Everything in your lease-up strategy — velocity targets, concession budgets, staffing decisions — is reverse-engineered from your lender's stabilization requirements.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <InputField label="Months to Stabilize (from CO)" value={deal.lenderStabilization} onChange={v => update("lenderStabilization", v)} suffix="months" />
            <InputField label="Required Occupancy" value={deal.lenderOccupancy} onChange={v => update("lenderOccupancy", v)} suffix="%" />
            <InputField label="Construction Loan Amount" value={deal.loanAmount} onChange={v => update("loanAmount", v)} prefix="$" />
            <InputField label="Interest Rate" value={deal.interestRate} onChange={v => update("interestRate", v)} suffix="%" />
          </div>
          <div style={{ marginTop: 12, padding: "14px 18px", backgroundColor: C.redBg, borderRadius: C.radiusSm, border: `1px solid ${C.red}22` }}>
            <div style={{ fontSize: 10, color: C.red, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Monthly loan carry cost</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.red }}>${Math.round(deal.loanAmount * (deal.interestRate / 100) / 12).toLocaleString()}/mo</div>
            <div style={{ fontSize: 12, color: C.inkLight, marginTop: 2 }}>Every month you're not stabilized, this is what it costs.</div>
          </div>
          <InputField label="Market Vacancy Rate" value={deal.marketVacancy} onChange={v => update("marketVacancy", v)} suffix="%" />
          <InputField label="Nearby Units Delivering (same timeframe)" value={deal.nearbyUnitsDelivering} onChange={v => update("nearbyUnitsDelivering", v)} suffix="units" />
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14 }}>
            <button onClick={() => setStep(1)} style={{ padding: "10px 20px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>{"\u2190 Back"}</button>
            <button onClick={() => setStep(3)} style={{ padding: "10px 28px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.ink, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font }}>Generate Strategy {"\u2192"}</button>
          </div>
        </Panel>
      )}

      {/* Step 3: Generated Strategy */}
      {step === 3 && (
        <div>
          {/* Executive Summary */}
          <div style={{ background: `linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)`, borderRadius: C.radius, padding: "28px 32px", marginBottom: 16, color: "#fff" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.6, marginBottom: 6 }}>Strategy Summary</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{deal.name || "Your Development"} — {deal.totalUnits} Units</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 14 }}>
              {[
                { label: "Stabilization Target", value: `${stabilizedTarget} units`, sub: `${deal.lenderOccupancy}% in ${monthsToStabilize} months` },
                { label: "Required Velocity", value: `${requiredWeeklyVelocity} units/week`, sub: `${Math.round(requiredWeeklyVelocity * 4.33)} per month` },
                { label: "Monthly Gross (Stabilized)", value: `$${totalMonthlyRev.toLocaleString()}`, sub: `$${annualGrossRev.toLocaleString()}/yr` },
                { label: "Monthly Carry Cost", value: `$${Math.round(deal.loanAmount * (deal.interestRate / 100) / 12).toLocaleString()}`, sub: `Until stabilization` },
                { label: "Recommended Staff", value: staff.headcount, sub: staff.model },
              ].map((kpi, i) => (
                <div key={i} style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: C.radiusSm, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, marginBottom: 4 }}>{kpi.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16 }}>
            {/* Absorption Curve */}
            <Panel>
              <SectionTitle sub="Projected cumulative leases by month">Absorption Schedule</SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={absorptionSchedule}>
                  <defs><linearGradient id="preconGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.ink} stopOpacity={0.1}/><stop offset="100%" stopColor={C.ink} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: C.inkMuted }} stroke={C.border} />
                  <YAxis tick={{ fontSize: 11, fill: C.inkMuted }} stroke={C.border} domain={[0, deal.totalUnits]} />
                  <Tooltip contentStyle={ttStyle} />
                  <Area type="monotone" dataKey={() => stabilizedTarget} stroke={C.green} strokeWidth={1} strokeDasharray="8 4" fill="none" name={`Stabilized (${stabilizedTarget})`} />
                  <Line type="monotone" dataKey="target" stroke={C.inkMuted} strokeWidth={2} strokeDasharray="6 3" dot={false} name="Linear Target" />
                  <Area type="monotone" dataKey="leased" stroke={C.ink} strokeWidth={2.5} fill="url(#preconGrad)" name="Projected (S-Curve)" dot={{ r: 3, fill: C.ink, stroke: "#fff", strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>

            {/* Revenue Ramp */}
            <Panel>
              <SectionTitle sub="Monthly rent revenue as units come online">Revenue Ramp</SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={absorptionSchedule}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: C.inkMuted }} stroke={C.border} />
                  <YAxis tick={{ fontSize: 11, fill: C.inkMuted }} stroke={C.border} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={ttStyle} formatter={v=>`$${v.toLocaleString()}`} />
                  <Bar dataKey="revenue" name="Monthly Revenue" radius={[4,4,0,0]}>
                    {absorptionSchedule.map((entry, i) => (
                      <Cell key={i} fill={entry.revenue >= totalMonthlyRev * 0.9 ? C.green : C.ink} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Staffing Plan */}
            <Panel>
              <SectionTitle sub="Based on unit count and velocity needs">Staffing Recommendation</SectionTitle>
              <div style={{ padding: "18px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 4 }}>{staff.model}</div>
                <div style={{ fontSize: 13, color: C.inkLight }}>{staff.headcount}</div>
              </div>
              {[
                { label: "Annual Cost", value: staff.annualCost },
                { label: "Expected Tours/Week", value: staff.toursPerWeek },
                { label: "LeaseRight Software", value: `$${(deal.totalUnits * 12).toLocaleString()}/yr ($1/unit/mo)` },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.inkMuted }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: C.ink }}>{row.value}</span>
                </div>
              ))}
            </Panel>

            {/* Concession Budget */}
            <Panel>
              <SectionTitle sub="Recommended concession reserve">Concession Budget</SectionTitle>
              <div style={{ padding: "18px", backgroundColor: C.amberBg, borderRadius: C.radiusSm, marginBottom: 12, border: `1px solid ${C.amber}22` }}>
                <div style={{ fontSize: 10, color: C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Recommended Reserve</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>${concessionBudget.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: C.inkMuted }}>${concessionPerUnit.toLocaleString()} per unit avg</div>
              </div>
              <div style={{ fontSize: 12, color: C.inkLight, lineHeight: 1.7, marginBottom: 12 }}>
                Budget assumes ~0.8x one month's gross rent as concession reserve. Actual deployment depends on velocity — if you're ahead of plan, deploy less. If you're behind, deploy more.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                {[
                  { type: "Studios", strategy: "Likely minimal — these lease fastest" },
                  { type: "1-Beds", strategy: "Moderate — watch comp set pricing" },
                  { type: "2-Beds", strategy: "Aggressive if slow — biggest inventory risk" },
                  { type: "3-Beds", strategy: "May need 1-2 months free to move" },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0" }}>
                    <span style={{ fontWeight: 700, color: C.ink, minWidth: 55 }}>{c.type}</span>
                    <span style={{ color: C.inkLight }}>{c.strategy}</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Market Risk */}
            <Panel>
              <SectionTitle sub="Factors that could affect your timeline">Risk Assessment</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { factor: "Market Vacancy", value: `${deal.marketVacancy}%`, risk: deal.marketVacancy > 7 ? "high" : deal.marketVacancy > 5 ? "medium" : "low", note: deal.marketVacancy > 7 ? "Elevated vacancy = more competition for renters" : "Healthy absorption environment" },
                  { factor: "Competing Deliveries", value: `${deal.nearbyUnitsDelivering} units`, risk: deal.nearbyUnitsDelivering > deal.totalUnits ? "high" : deal.nearbyUnitsDelivering > deal.totalUnits * 0.5 ? "medium" : "low", note: deal.nearbyUnitsDelivering > deal.totalUnits ? "Significant new supply in your submarket" : "Manageable competitive environment" },
                  { factor: "Required Velocity", value: `${requiredWeeklyVelocity}/wk`, risk: requiredWeeklyVelocity > 12 ? "high" : requiredWeeklyVelocity > 7 ? "medium" : "low", note: requiredWeeklyVelocity > 12 ? "Aggressive — consider extending timeline with lender" : "Achievable with proper staffing" },
                  { factor: "Carry Cost Exposure", value: `$${(Math.round(deal.loanAmount * (deal.interestRate / 100) / 12) * monthsToStabilize).toLocaleString()}`, risk: "info", note: `Total interest during ${monthsToStabilize}-month lease-up` },
                ].map((r, i) => {
                  const rc = { high: C.red, medium: C.amber, low: C.green, info: C.accent };
                  return (
                    <div key={i} style={{ padding: "12px 14px", backgroundColor: `${rc[r.risk]}08`, borderRadius: C.radiusSm, border: `1px solid ${rc[r.risk]}15` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{r.factor}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: rc[r.risk] }}>{r.value}</span>
                          {r.risk !== "info" && <Badge label={r.risk} color={rc[r.risk]} bg={`${rc[r.risk]}18`} />}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.inkLight }}>{r.note}</div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* Export Section */}
          <Panel style={{ borderLeft: `3px solid ${C.ink}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Export Lender Package</div>
                <div style={{ fontSize: 13, color: C.inkLight }}>Download a professional absorption study formatted for your lender's due diligence review.</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "10px 20px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.ink, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font }}>Export PDF (Free)</button>
                <button style={{ padding: "10px 20px", borderRadius: C.radiusSm, border: `1px solid ${C.ink}`, backgroundColor: "transparent", color: C.ink, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font }}>White-Label PDF — $9.99</button>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: "10px 14px", backgroundColor: C.greenBg, borderRadius: C.radiusSm, fontSize: 12, color: C.green, fontWeight: 500 }}>
              When you're ready to execute this plan, convert this strategy into an active LeaseRight property with one click. All your data carries over.
            </div>
          </Panel>

          <div style={{ paddingTop: 14 }}>
            <button onClick={() => setStep(2)} style={{ padding: "10px 20px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>{"\u2190 Adjust Inputs"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ LEASE UP — THE DECISION ENGINE ============
const CommandCenterView = () => {
  const [subTab, setSubTab] = useState("command");
  const [rentAdjustments, setRentAdjustments] = useState({});
  const [scenarioVelocity, setScenarioVelocity] = useState(9);

  const applyAdjustment = (type, newRent) => setRentAdjustments(prev => ({ ...prev, [type]: newRent }));

  // Scenario projections
  const currentLeased = 121;
  const targetUnits = 260;
  const stabilizationTarget = Math.round(targetUnits * 0.93); // 93% = stabilized
  const weeksRemaining = Math.ceil((stabilizationTarget - currentLeased) / scenarioVelocity);
  const projectedDate = new Date(2026, 3, 15); // today
  projectedDate.setDate(projectedDate.getDate() + weeksRemaining * 7);
  const projDateStr = projectedDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  // Suggestions — calm, helpful tone
  const suggestions = [
    { title: "Your 3-bedrooms are moving slow", detail: "6 of 28 leased, averaging 52 days on market. The rest of the building averages 18. A pricing adjustment or concession could pick up the pace.", tab: "rents", action: "Review pricing" },
    { title: "Your \"1 Month Free\" concession is working", detail: "29.2% conversion on 2BR/3BR units \u2014 your best performer. It expires May 31. Worth extending while your larger units still need velocity.", tab: "concessions", action: "View concessions" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <Pill label="Today" active={subTab==="command"} onClick={()=>setSubTab("command")} />
        <Pill label="Trends" active={subTab==="trends"} onClick={()=>setSubTab("trends")} />
        <Pill label="Rent Optimizer" active={subTab==="rents"} onClick={()=>setSubTab("rents")} />
        <Pill label="Concessions" active={subTab==="concessions"} onClick={()=>setSubTab("concessions")} />
        <Pill label="Feedback & Intel" active={subTab==="feedback"} onClick={()=>setSubTab("feedback")} />
      </div>

      {/* ---- TODAY ---- */}
      {subTab === "command" && (
        <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 16 }}>

          {/* Property Status Header — editorial, not dashboard */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20 }}>
              <span style={{ fontFamily: fontSerif, fontSize: 42, fontWeight: 400, color: C.ink, letterSpacing: -1.5, lineHeight: 1 }}>{Math.round((currentLeased/targetUnits)*100)}%</span>
              <span style={{ fontSize: 15, color: C.inkMuted, fontWeight: 400 }}>leased</span>
              <span style={{ fontSize: 13, color: C.green, fontWeight: 600, marginLeft: "auto", backgroundColor: C.greenBg, padding: "4px 12px", borderRadius: 20 }}>On track</span>
            </div>
            <div style={{ width: "100%", height: 3, backgroundColor: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ width: `${Math.round((currentLeased/stabilizationTarget)*100)}%`, height: "100%", backgroundColor: C.accent, borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ fontSize: 14, color: C.inkLight, lineHeight: 1.8 }}>
              {currentLeased} of {stabilizationTarget} units to stabilization. {currentLeased - 118} ahead of plan, projecting <strong style={{ color: C.ink, fontWeight: 600 }}>{projDateStr}</strong>.
            </div>
          </div>

          {/* Velocity + Weekly Pulse — inline, not boxed */}
          <div style={{ display: "flex", gap: 40, marginBottom: 48, paddingBottom: 48, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>This week</div>
              <div style={{ display: "flex", gap: 32 }}>
                {[
                  { value: "9", label: "leases", delta: "+2" },
                  { value: "28", label: "tours", delta: "29% conv." },
                  { value: "$248K", label: "collected", delta: "96.2%" },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: fontSerif, fontSize: 28, fontWeight: 400, color: C.ink, letterSpacing: -0.5 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: C.green, fontWeight: 600, marginTop: 2 }}>{s.delta}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 1, backgroundColor: C.border }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Velocity</div>
              <div style={{ fontFamily: fontSerif, fontSize: 28, fontWeight: 400, color: C.accent, letterSpacing: -0.5 }}>9.2<span style={{ fontSize: 14, color: C.inkMuted, fontFamily: font, fontWeight: 400, marginLeft: 4 }}>/wk</span></div>
              <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>Target: 6/wk</div>
            </div>
          </div>

          {/* Suggestions — the core of the product */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 20 }}>Needs your attention</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ padding: "28px 32px", backgroundColor: C.surface, borderRadius: C.radius, border: `1px solid ${C.border}`, boxShadow: C.shadow, borderLeft: `3px solid ${i === 0 ? C.amber : C.accent}` }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, marginBottom: 10, letterSpacing: -0.3 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: C.inkLight, lineHeight: 1.8, marginBottom: 20 }}>{s.detail}</div>
                  <button onClick={() => setSubTab(s.tab)} style={{ padding: "8px 20px", borderRadius: 20, border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font, transition: "opacity 0.15s" }}>{s.action} &rarr;</button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links — understated */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Trends", tab: "trends" },
              { label: "Rent Optimizer", tab: "rents" },
              { label: "Concessions", tab: "concessions" },
              { label: "Market Intel", tab: "feedback" },
            ].map((link, i) => (
              <button key={i} onClick={() => setSubTab(link.tab)} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontWeight: 500, fontSize: 12, cursor: "pointer", fontFamily: font, transition: "all 0.15s" }}>{link.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* ---- TRENDS ---- */}
      {subTab === "trends" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Stabilization Projection */}
            <Panel>
              <SectionTitle sub="Actual vs. plan — with optimistic and pessimistic bands">Stabilization Projection</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={stabilizationProjection} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.inkMuted }} />
                  <YAxis tick={{ fontSize: 11, fill: C.inkMuted }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Area type="monotone" dataKey="optimistic" stroke="none" fill={C.accentLight} fillOpacity={0.7} name="Optimistic" />
                  <Area type="monotone" dataKey="pessimistic" stroke="none" fill={C.accentLight} fillOpacity={0.3} name="Pessimistic" />
                  <Line type="monotone" dataKey="plan" stroke={C.border} strokeWidth={2} strokeDasharray="6 3" dot={false} name="Plan" />
                  <Line type="monotone" dataKey="actual" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent }} name="Actual" />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>

            {/* Velocity Chart */}
            <Panel>
              <SectionTitle sub="Weekly leases signed vs. target">Leasing Velocity</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={velocityWeekly} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="w" tick={{ fontSize: 11, fill: C.inkMuted }} />
                  <YAxis tick={{ fontSize: 11, fill: C.inkMuted }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="signed" fill={C.accent} radius={[4, 4, 0, 0]} name="Signed" />
                  <Line type="monotone" dataKey="target" stroke={C.red} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Target" />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Funnel */}
            <Panel>
              <SectionTitle sub="Weekly conversion through the pipeline">Leasing Funnel</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={weeklyFunnel} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="w" tick={{ fontSize: 11, fill: C.inkMuted }} />
                  <YAxis tick={{ fontSize: 11, fill: C.inkMuted }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Area type="monotone" dataKey="leads" stackId="1" stroke={C.accentMid} fill={C.accentLight} name="Leads" />
                  <Area type="monotone" dataKey="tours" stackId="2" stroke={C.accent} fill={`${C.accent}40`} name="Tours" />
                  <Area type="monotone" dataKey="apps" stackId="3" stroke={C.green} fill={`${C.green}30`} name="Applications" />
                  <Area type="monotone" dataKey="signed" stackId="4" stroke={C.green} fill={C.green} name="Signed" />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>

            {/* Unit Mix */}
            <Panel>
              <SectionTitle sub="Absorption by unit type">Unit Mix Performance</SectionTitle>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>{["Type", "Total", "Leased", "Available", "Asking", "Effective", "Absorption"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                <tbody>
                  {unitMix.map((u, i) => {
                    const pct = Math.round((u.leased / u.total) * 100);
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "12px", fontWeight: 700, color: C.ink }}>{u.type}</td>
                        <td style={{ padding: "12px", color: C.inkLight }}>{u.total}</td>
                        <td style={{ padding: "12px", fontWeight: 600, color: C.green }}>{u.leased}</td>
                        <td style={{ padding: "12px", fontWeight: 600, color: (u.total - u.leased) > 30 ? C.red : C.inkLight }}>{u.total - u.leased}</td>
                        <td style={{ padding: "12px", color: C.ink }}>${u.asking.toLocaleString()}</td>
                        <td style={{ padding: "12px", color: C.inkLight }}>${u.effective.toLocaleString()}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 60, height: 5, backgroundColor: C.border, borderRadius: 3 }}>
                              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, backgroundColor: pct > 60 ? C.green : pct > 40 ? C.accent : C.amber }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          </div>

          {/* What-If Scenario */}
          <Panel>
            <SectionTitle sub="Drag the slider to model different leasing speeds">What-If: Velocity Scenario Planner</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 10 }}>Weekly leasing pace</div>
                <input type="range" min={3} max={15} value={scenarioVelocity} onChange={e => setScenarioVelocity(Number(e.target.value))} style={{ width: "100%", accentColor: C.accent }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.inkMuted, marginTop: 4 }}>
                  <span>3/wk (slow)</span><span style={{ fontWeight: 700, color: C.accent, fontSize: 14 }}>{scenarioVelocity}/wk</span><span>15/wk (fast)</span>
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "20px", backgroundColor: C.surfaceAlt, borderRadius: C.radius }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Weeks to Stabilize</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: C.ink, letterSpacing: -1 }}>{weeksRemaining}</div>
                <div style={{ fontSize: 12, color: C.inkMuted }}>at {scenarioVelocity} units/week</div>
              </div>
              <div style={{ textAlign: "center", padding: "20px", backgroundColor: C.accentLight, borderRadius: C.radius, border: `1px solid ${C.accent}22` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Projected Date</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.accent, letterSpacing: -0.5 }}>{projDateStr}</div>
                <div style={{ fontSize: 12, color: C.inkMuted }}>stabilization ({stabilizationTarget} units)</div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ---- RENT OPTIMIZER ---- */}
      {subTab === "rents" && (
        <div>
          <Panel style={{ marginBottom: 16, borderLeft: `3px solid ${C.accent}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>How this works</div>
            <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7 }}>
              We compare your asking rents against days on market, comp set averages, and conversion rates. If units are sitting too long, the price is wrong — not the market. Fast-moving unit types might be underpriced. The goal isn't just occupancy — it's maximum revenue at target velocity.
            </div>
          </Panel>

          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <KPI label="Avg Days on Market" value="22 days" sub="Building avg across all types" />
            <KPI label="Fastest" value="Studios — 11d" sub="Leasing healthy" trend="up" />
            <KPI label="Slowest" value="3BR — 52d" sub="Stale. Needs action." trend="down" />
            <KPI label="Revenue at Risk" value="$47,200/mo" sub="69 vacant units" />
          </div>

          {/* Rent Analysis Table */}
          <Panel style={{ marginBottom: 16 }}>
            <SectionTitle sub="Every row is a decision. Green = on track. Red = needs attention.">Unit Type Analysis</SectionTitle>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{["Type", "Leased", "Available", "Asking", "Effective", "Days on Mkt", "Comp Avg", "Velocity", "Action"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {rentAnalysis.map((r, i) => {
                  const velColor = { fast: C.green, normal: C.accent, slow: C.amber, stale: C.red };
                  const velLabel = { fast: "Fast", normal: "Normal", slow: "Slow", stale: "Stale" };
                  const adjusted = rentAdjustments[r.type];
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: r.velocity === "stale" ? C.redBg : r.velocity === "slow" ? C.amberBg : "transparent" }}>
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: C.ink }}>{r.type}</td>
                      <td style={{ padding: "12px 10px" }}><span style={{ fontWeight: 600, color: C.green }}>{r.leased}</span><span style={{ color: C.inkMuted }}> / {r.units}</span></td>
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: r.available > 30 ? C.red : C.inkLight }}>{r.available}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontWeight: 600, color: C.ink, textDecoration: adjusted ? "line-through" : "none", opacity: adjusted ? 0.5 : 1 }}>${r.asking.toLocaleString()}</span>
                        {adjusted && <span style={{ fontWeight: 700, color: C.green, marginLeft: 6 }}>${adjusted.toLocaleString()}</span>}
                      </td>
                      <td style={{ padding: "12px 10px", color: C.inkLight }}>${r.effective.toLocaleString()}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700, color: r.avgDaysOnMarket > 30 ? C.red : r.avgDaysOnMarket > 20 ? C.amber : C.green }}>{r.avgDaysOnMarket}d</span>
                          <div style={{ width: 36, height: 4, backgroundColor: C.border, borderRadius: 2 }}><div style={{ width: `${Math.min(100, (r.avgDaysOnMarket / 60) * 100)}%`, height: "100%", borderRadius: 2, backgroundColor: r.avgDaysOnMarket > 30 ? C.red : r.avgDaysOnMarket > 20 ? C.amber : C.green }} /></div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px", color: C.inkLight }}>${r.compAvg.toLocaleString()}<div style={{ fontSize: 10, color: C.inkMuted }}>{r.compRange}</div></td>
                      <td style={{ padding: "12px 10px" }}><Badge label={velLabel[r.velocity]} color={velColor[r.velocity]} bg={`${velColor[r.velocity]}18`} /></td>
                      <td style={{ padding: "12px 10px" }}>
                        {r.suggestion === "decrease" && !adjusted ? (
                          <button onClick={() => applyAdjustment(r.type, r.suggestedRent)} style={{ padding: "6px 12px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.amber, color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: font }}>
                            Adjust to ${r.suggestedRent.toLocaleString()}
                          </button>
                        ) : adjusted ? (
                          <Badge label="Adjusted" color={C.green} bg={C.greenBg} />
                        ) : (
                          <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>On track</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          {/* Revenue Impact */}
          <Panel>
            <SectionTitle sub="What happens when you adjust rents">Revenue Impact Model</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div style={{ padding: "18px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Current Monthly Revenue (if full)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>${rentAnalysis.reduce((sum, r) => sum + (r.asking * r.units), 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: C.inkMuted }}>At current asking rents</div>
              </div>
              <div style={{ padding: "18px", backgroundColor: Object.keys(rentAdjustments).length > 0 ? C.greenBg : C.surfaceAlt, borderRadius: C.radiusSm, textAlign: "center", border: Object.keys(rentAdjustments).length > 0 ? `1px solid ${C.green}22` : "none" }}>
                <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Adjusted Monthly Revenue</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: Object.keys(rentAdjustments).length > 0 ? C.green : C.ink }}>
                  ${(rentAnalysis.reduce((sum, r) => {
                    const rent = rentAdjustments[r.type] || r.asking;
                    return sum + (rent * r.units);
                  }, 0)).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: C.inkMuted }}>{Object.keys(rentAdjustments).length > 0 ? "With your adjustments" : "No adjustments yet"}</div>
              </div>
              <div style={{ padding: "18px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Vacancy Cost / Month</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.red }}>$154,300</div>
                <div style={{ fontSize: 11, color: C.inkMuted }}>69 vacant units × weighted avg rent</div>
              </div>
            </div>
            {Object.keys(rentAdjustments).length > 0 && (
              <div style={{ marginTop: 14, padding: "12px 16px", backgroundColor: C.greenBg, borderRadius: C.radiusSm, fontSize: 13, color: C.green, fontWeight: 500, lineHeight: 1.6, border: `1px solid ${C.green}22` }}>
                Your adjustments lower full-building monthly revenue by ${(rentAnalysis.reduce((sum, r) => sum + (r.asking * r.units), 0) - rentAnalysis.reduce((sum, r) => sum + ((rentAdjustments[r.type] || r.asking) * r.units), 0)).toLocaleString()}, but faster lease-up velocity means less vacancy loss. A unit sitting empty at $2,800 earns $0. A unit filled at $2,650 earns $2,650.
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* ---- CONCESSIONS ---- */}
      {subTab === "concessions" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <KPI label="Active Concessions" value={activeConcessions.filter(c=>c.status==="active").length} accent />
            <KPI label="Total Concession Cost" value={`$${activeConcessions.reduce((s,c)=>s+c.totalCost,0).toLocaleString()}`} sub="All-time" />
            <KPI label="Leases via Concession" value={activeConcessions.reduce((s,c)=>s+c.leasesSigned,0)} sub="Across all programs" />
            <KPI label="Best Performer" value="Waived App Fee" sub="$75/lease, highest volume" trend="up" />
          </div>

          <Panel style={{ marginBottom: 16 }}>
            <SectionTitle sub="Track what's working, kill what's not">Active Concession Programs</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeConcessions.map(c => {
                const isActive = c.status === "active";
                return (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", alignItems: "center", gap: 12, padding: "16px 18px", backgroundColor: isActive ? C.surface : C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${isActive ? C.border : C.border}`, opacity: isActive ? 1 : 0.7 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>{c.unitTypes.join(", ")} — {c.startDate} to {c.endDate}</div>
                    </div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{c.leasesSigned}</div><div style={{ fontSize: 10, color: C.inkMuted }}>Leases</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{c.convRate}%</div><div style={{ fontSize: 10, color: C.inkMuted }}>Conv Rate</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: C.amber }}>${c.costPerLease.toLocaleString()}</div><div style={{ fontSize: 10, color: C.inkMuted }}>Cost/Lease</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: C.red }}>${c.totalCost.toLocaleString()}</div><div style={{ fontSize: 10, color: C.inkMuted }}>Total Cost</div></div>
                    <div><Badge label={isActive ? "Active" : "Ended"} color={isActive ? C.green : C.inkMuted} bg={isActive ? C.greenBg : C.surfaceAlt} /></div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* ROI Analysis */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Panel>
              <SectionTitle sub="Is the concession worth it?">Concession vs. Vacancy Cost</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Avg vacancy cost per unit/month", value: "$2,237", note: "Weighted avg rent across types", color: C.red },
                  { label: "Avg concession cost per lease", value: "$1,107", note: "Across all active programs", color: C.amber },
                  { label: "Net savings per leased unit", value: "$1,130", note: "Concession pays for itself in < 1 month of avoided vacancy", color: C.green },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{row.label}</div><div style={{ fontSize: 11, color: C.inkMuted }}>{row.note}</div></div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: row.color }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <SectionTitle sub="Based on current data">Recommendation</SectionTitle>
              <div style={{ padding: "18px", backgroundColor: C.accentLight, borderRadius: C.radiusSm, border: `1px solid ${C.accent}22`, marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Extend "1 Month Free" past May 31</div>
                <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7 }}>
                  Your 2BR and 3BR units are your slowest movers. The "1 Month Free" concession is converting at 29.2% — your best rate on these unit types. Ending it in May while you still have 47 vacant 2BRs and 22 vacant 3BRs would slow velocity when you need it most.
                </div>
              </div>
              <div style={{ padding: "18px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Consider: $200/mo parking credit for 3BRs</div>
                <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7 }}>
                  18 lost leads cited parking cost. Your 3BRs are your most expensive and slowest. A 6-month parking credit ($1,200 total) costs less than 1 month of vacancy ($3,400) and addresses the #5 objection directly.
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ---- FEEDBACK & INTEL ---- */}
      {subTab === "feedback" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <KPI label="Lost Leads (90d)" value="173" sub="Out of 416 total" />
            <KPI label="Top Reason" value="Price" sub="22% of lost leads" trend="down" />
            <KPI label="Competitor Losses" value="31" sub="17% — mainly The Vance" />
            <KPI label="Recoverable" value="~14" sub="Timing / follow-up issues" trend="up" />
          </div>

          {/* Why People Say No */}
          <Panel style={{ marginBottom: 16 }}>
            <SectionTitle sub="Aggregated from agent notes, tour feedback, and lost lead surveys">Why People Say No</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {prospectFeedback.map((f, i) => {
                const catColors = { pricing: C.red, competition: C.purple, expectations: C.amber, amenities: C.accent, timing: C.inkMuted, policy: C.amber };
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 60px 50px 60px 120px", alignItems: "center", gap: 12, padding: "12px 16px", backgroundColor: i < 3 ? `${catColors[f.category]}08` : C.surface, borderRadius: C.radiusSm, border: `1px solid ${i < 3 ? `${catColors[f.category]}15` : C.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: i < 3 ? 700 : 500, color: C.ink }}>{f.reason}</div>
                    <div style={{ textAlign: "center" }}><span style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{f.count}</span></div>
                    <div style={{ textAlign: "center" }}><span style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted }}>{f.pct}%</span></div>
                    <div style={{ textAlign: "center" }}>
                      <Badge label={f.trend === "up" ? "Rising" : f.trend === "down" ? "Falling" : "Stable"} color={f.trend === "up" ? C.red : f.trend === "down" ? C.green : C.inkMuted} bg={f.trend === "up" ? C.redBg : f.trend === "down" ? C.greenBg : C.surfaceAlt} />
                    </div>
                    <div><Badge label={f.category} color={catColors[f.category]} bg={`${catColors[f.category]}15`} /></div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Lost Lead Detail */}
            <Panel>
              <SectionTitle sub="Recent losses with full context">Lost Lead Breakdown</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                {lostLeads.map((l, i) => (
                  <div key={i} style={{ padding: "14px 16px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{l.name}</span>
                        <Badge label={l.unit} color={C.accent} bg={C.accentLight} />
                      </div>
                      <span style={{ fontSize: 11, color: C.inkMuted }}>{l.daysInPipeline}d in pipeline</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.red, marginBottom: 4 }}>{l.reason}</div>
                    <div style={{ fontSize: 12, color: C.inkLight, lineHeight: 1.6, padding: "8px 10px", backgroundColor: C.surface, borderRadius: 4 }}>"{l.feedback}"</div>
                    <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 6 }}>Last stage: {l.lastStage} — Agent: {l.agent}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Competitive Intel */}
            <Panel>
              <SectionTitle sub="What you're up against">Competitor Landscape</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {competitorIntel.map((comp, i) => {
                  const threatColors = { high: C.red, medium: C.amber, low: C.green };
                  return (
                    <div key={i} style={{ padding: "16px 18px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${comp.threat === "high" ? `${C.red}22` : C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{comp.name}</span>
                          <Badge label={`${comp.threat} threat`} color={threatColors[comp.threat]} bg={`${threatColors[comp.threat]}18`} />
                        </div>
                        <span style={{ fontSize: 11, color: C.inkMuted }}>{comp.distance}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, fontSize: 12 }}>
                        <div><span style={{ color: C.inkMuted }}>Units: </span><span style={{ fontWeight: 600, color: C.ink }}>{comp.units}</span></div>
                        <div><span style={{ color: C.inkMuted }}>Occupancy: </span><span style={{ fontWeight: 600, color: C.ink }}>{comp.occupancy}</span></div>
                        <div><span style={{ color: C.inkMuted }}>1BR: </span><span style={{ fontWeight: 600, color: C.ink }}>{comp.avgRent1BR}</span></div>
                        <div><span style={{ color: C.inkMuted }}>2BR: </span><span style={{ fontWeight: 600, color: C.ink }}>{comp.avgRent2BR}</span></div>
                      </div>
                      <div style={{ marginTop: 8, padding: "6px 10px", backgroundColor: `${threatColors[comp.threat]}08`, borderRadius: 4, fontSize: 12, color: threatColors[comp.threat], fontWeight: 600 }}>
                        Concession: {comp.concession}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 14, padding: "14px 16px", backgroundColor: C.accentLight, borderRadius: C.radiusSm, border: `1px solid ${C.accent}22` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Intel Summary</div>
                <div style={{ fontSize: 12, color: C.inkLight, lineHeight: 1.7 }}>
                  The Vance is your biggest threat — similar product, lower price, and more aggressive concessions. They're at 61% occupancy so they're fighting hard too. Ovation has the amenity edge (pool) but higher rents. The Astor isn't competing at your price point. Focus your energy on differentiating from The Vance.
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ TENANTS ============
const TenantsView = () => {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const daysUntilEnd = (endDate) => {
    const end = new Date(endDate);
    const now = new Date(2026, 3, 15);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const renewalMap = {
    offered: { l: "Offered", c: C.accent, b: C.accentLight },
    pending: { l: "Pending", c: C.amber, b: C.amberBg },
    at_risk: { l: "At Risk", c: C.red, b: C.redBg },
    not_renewing: { l: "Not Renewing", c: C.red, b: C.redBg },
    "n/a": { l: "N/A", c: C.inkMuted, b: C.surfaceAlt },
    renewed: { l: "Renewed", c: C.green, b: C.greenBg },
  };

  const filtered = currentTenants.filter(t => {
    if (filter === "all") return true;
    if (filter === "expiring_soon") return daysUntilEnd(t.leaseEnd) <= 90 && daysUntilEnd(t.leaseEnd) > 0;
    if (filter === "at_risk") return t.renewalStatus === "at_risk" || t.renewalStatus === "not_renewing";
    if (filter === "balance") return t.balance > 0;
    return true;
  });

  const expiringSoon = currentTenants.filter(t => daysUntilEnd(t.leaseEnd) <= 90 && daysUntilEnd(t.leaseEnd) > 0).length;
  const atRisk = currentTenants.filter(t => t.renewalStatus === "at_risk" || t.renewalStatus === "not_renewing").length;
  const avgLeaseLength = "12.8 mo";

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <KPI label="Active Tenants" value={currentTenants.filter(t=>t.status==="active").length} sub={`of ${currentTenants.length} total`} accent />
        <KPI label="Expiring ≤90 Days" value={expiringSoon} sub="Need renewal outreach" trend="down" />
        <KPI label="At Risk / Not Renewing" value={atRisk} sub="Potential vacancy" trend="down" />
        <KPI label="Avg Lease Length" value={avgLeaseLength} />
        <KPI label="Outstanding Balances" value={`$${currentTenants.reduce((s,t)=>s+t.balance,0).toLocaleString()}`} sub={`${currentTenants.filter(t=>t.balance>0).length} tenants`} />
      </div>

      <Panel>
        <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { k: "all", l: "All Tenants", n: currentTenants.length },
            { k: "expiring_soon", l: "Expiring Soon", n: expiringSoon },
            { k: "at_risk", l: "At Risk", n: atRisk },
            { k: "balance", l: "Outstanding Balance", n: currentTenants.filter(t=>t.balance>0).length },
          ].map(f => <Pill key={f.k} label={f.l} active={filter===f.k} onClick={()=>setFilter(f.k)} count={f.n} />)}
        </div>

        <div style={{ display: "flex" }}>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{["Tenant", "Unit", "Type", "Rent", "Lease End", "Days Left", "Renewal", "Balance"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.inkMuted, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(t => {
                  const days = daysUntilEnd(t.leaseEnd);
                  const ren = renewalMap[t.renewalStatus] || renewalMap.pending;
                  return (
                    <tr key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", backgroundColor: selected?.id === t.id ? C.accentLight : t.renewalStatus === "at_risk" || t.renewalStatus === "not_renewing" ? `${C.red}06` : "transparent" }}>
                      <td style={{ padding: "10px", fontWeight: 600, color: C.ink }}>{t.name}</td>
                      <td style={{ padding: "10px", color: C.inkLight }}>{t.unit}</td>
                      <td style={{ padding: "10px", color: C.inkLight }}>{t.type}</td>
                      <td style={{ padding: "10px", fontWeight: 600, color: C.ink }}>${t.rent.toLocaleString()}</td>
                      <td style={{ padding: "10px", color: C.inkLight }}>{new Date(t.leaseEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ fontWeight: 700, color: days <= 30 ? C.red : days <= 90 ? C.amber : C.green }}>{days}d</span>
                      </td>
                      <td style={{ padding: "10px" }}><Badge label={ren.l} color={ren.c} bg={ren.b} /></td>
                      <td style={{ padding: "10px", fontWeight: t.balance > 0 ? 700 : 400, color: t.balance > 0 ? C.red : C.inkMuted }}>{t.balance > 0 ? `$${t.balance.toLocaleString()}` : "\u2014"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selected && (
            <div style={{ width: 280, borderLeft: `1px solid ${C.border}`, paddingLeft: 18, marginLeft: 14, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{selected.name}</h3>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.inkMuted, cursor: "pointer", fontSize: 16 }}>{"\u00D7"}</button>
              </div>
              <Badge label={renewalMap[selected.renewalStatus]?.l} color={renewalMap[selected.renewalStatus]?.c} bg={renewalMap[selected.renewalStatus]?.b} />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Unit", `${selected.unit} (${selected.type})`],
                  ["Monthly Rent", `$${selected.rent.toLocaleString()}`],
                  ["Lease", `${selected.moveIn} \u2014 ${new Date(selected.leaseEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`],
                  ["Days Remaining", `${daysUntilEnd(selected.leaseEnd)} days`],
                  ["Autopay", selected.autopay ? "Enrolled" : "Not enrolled"],
                  ["Balance", selected.balance > 0 ? `$${selected.balance.toLocaleString()} outstanding` : "Current"],
                  ["Phone", selected.phone],
                  ["Email", selected.email],
                ].map(([k, v]) => (
                  <div key={k}><div style={{ fontSize: 10, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1 }}>{k}</div><div style={{ fontSize: 13, color: C.ink }}>{v}</div></div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
                {selected.renewalStatus === "at_risk" && <button style={{ width: "100%", padding: "9px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.amber, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: font }}>Send Renewal Offer</button>}
                {selected.renewalStatus === "not_renewing" && <button style={{ width: "100%", padding: "9px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.red, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: font }}>Schedule Move-Out</button>}
                {!selected.autopay && <button style={{ width: "100%", padding: "9px", borderRadius: C.radiusSm, border: `1px solid ${C.accent}`, backgroundColor: "transparent", color: C.accent, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: font }}>Send Autopay Invite</button>}
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Lease Expiration Timeline */}
      <Panel style={{ marginTop: 16 }}>
        <SectionTitle sub="Visual timeline of upcoming expirations">Lease Expiration Calendar</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {["May '26", "Jun '26", "Jul '26", "Aug '26", "Sep '26", "Oct '26"].map((month, mi) => {
            const monthStart = new Date(2026, 4 + mi, 1);
            const monthEnd = new Date(2026, 5 + mi, 0);
            const expiringThisMonth = currentTenants.filter(t => {
              const end = new Date(t.leaseEnd);
              return end >= monthStart && end <= monthEnd;
            });
            return (
              <div key={mi} style={{ padding: "14px", borderRadius: C.radiusSm, border: `1px solid ${expiringThisMonth.length > 2 ? `${C.red}33` : C.border}`, backgroundColor: expiringThisMonth.length > 2 ? C.redBg : C.surfaceAlt, textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{month}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: expiringThisMonth.length > 0 ? (expiringThisMonth.length > 2 ? C.red : C.amber) : C.green }}>{expiringThisMonth.length}</div>
                <div style={{ fontSize: 10, color: C.inkMuted }}>expirations</div>
                {expiringThisMonth.map((t, ti) => (
                  <div key={ti} style={{ fontSize: 10, color: C.inkLight, marginTop: 4, padding: "2px 6px", backgroundColor: C.surface, borderRadius: 3 }}>{t.name} ({t.unit})</div>
                ))}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};

// ============ APPLICATIONS ============
const ApplicationsView = () => {
  const [selected, setSelected] = useState(null);

  const appStatusMap = {
    screening: { l: "Screening", c: C.amber, b: C.amberBg },
    pending_review: { l: "Ready for Review", c: C.purple, b: C.purpleBg },
    approved: { l: "Approved", c: C.green, b: C.greenBg },
    denied: { l: "Denied", c: C.red, b: C.redBg },
    withdrawn: { l: "Withdrawn", c: C.inkMuted, b: C.surfaceAlt },
  };

  const stepLabels = { credit_check: "Credit Check", income_verify: "Income Verification", review: "Manager Review", complete: "Complete" };
  const stepOrder = ["credit_check", "income_verify", "review", "complete"];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <KPI label="Active Applications" value={applications.filter(a => a.status === "screening" || a.status === "pending_review").length} accent />
        <KPI label="Pending Review" value={applications.filter(a => a.status === "pending_review").length} sub="Ready for decision" />
        <KPI label="Approved (30d)" value={applications.filter(a => a.status === "approved").length} trend="up" />
        <KPI label="Denial Rate" value={`${((applications.filter(a => a.status === "denied").length / applications.length) * 100).toFixed(1)}%`} sub="Below 20% = healthy" />
        <KPI label="Avg Processing" value="3.2 days" sub="Application to decision" />
      </div>

      <Panel style={{ marginBottom: 16, borderLeft: `3px solid ${C.accent}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Application Workflow</div>
        <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7 }}>
          Prospects apply through your listings or website. We collect ID, proof of income, bank statements, and employer verification. Credit and background checks run automatically via TransUnion integration. Once all documents clear, the application lands in your review queue with a recommendation. You approve or deny — the system handles the rest.
        </div>
      </Panel>

      <Panel>
        <SectionTitle sub="Click any application for full detail">Application Pipeline</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {applications.map(app => {
            const st = appStatusMap[app.status];
            const stepIdx = stepOrder.indexOf(app.step);
            const isSelected = selected?.id === app.id;
            return (
              <div key={app.id}>
                <div onClick={() => setSelected(isSelected ? null : app)} style={{ display: "grid", gridTemplateColumns: "80px 2fr 1fr 1fr 1.5fr 80px", alignItems: "center", gap: 10, padding: "14px 16px", backgroundColor: isSelected ? C.accentLight : app.status === "pending_review" ? `${C.purple}08` : C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${isSelected ? C.accent : C.border}`, cursor: "pointer" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.inkMuted }}>{app.id}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{app.name}</div>
                    <div style={{ fontSize: 11, color: C.inkMuted }}>{app.unit} — ${app.rent.toLocaleString()}/mo</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.inkLight }}>Applied {app.appliedDate}</div>
                  <div>
                    {/* Progress bar */}
                    <div style={{ display: "flex", gap: 3 }}>
                      {stepOrder.map((s, si) => (
                        <div key={si} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: si <= stepIdx ? (app.status === "denied" ? C.red : C.green) : C.border }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: C.inkMuted, marginTop: 3 }}>{stepLabels[app.step]}</div>
                  </div>
                  <div>
                    {/* Document checklist */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {Object.entries(app.docs).map(([doc, done]) => (
                        <div key={doc} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 10, color: done ? C.green : C.red }}>{done ? "\u2713" : "\u2717"}</span>
                          <span style={{ fontSize: 10, color: C.inkMuted, textTransform: "capitalize" }}>{doc === "paystubs" ? "Pay" : doc === "employer" ? "Emp" : doc === "bank" ? "Bank" : "ID"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Badge label={st.l} color={st.c} bg={st.b} />
                </div>

                {/* Expanded Detail */}
                {isSelected && (
                  <div style={{ padding: "16px 20px", backgroundColor: C.surface, border: `1px solid ${C.accent}`, borderTop: "none", borderRadius: `0 0 ${C.radiusSm}px ${C.radiusSm}px`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Applicant Info</div>
                      {[["Phone", app.phone], ["Email", app.email], ["Income", app.income], ["Employer", app.employer]].map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 6 }}><span style={{ fontSize: 11, color: C.inkMuted }}>{k}: </span><span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{v}</span></div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Screening Results</div>
                      <div style={{ marginBottom: 6 }}><span style={{ fontSize: 11, color: C.inkMuted }}>Credit Score: </span><span style={{ fontSize: 16, fontWeight: 800, color: app.creditScore ? (app.creditScore >= 700 ? C.green : app.creditScore >= 600 ? C.amber : C.red) : C.inkMuted }}>{app.creditScore || "Pending..."}</span></div>
                      <div style={{ marginBottom: 6 }}><span style={{ fontSize: 11, color: C.inkMuted }}>Income to Rent: </span><span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{app.income ? `${(parseInt(app.income.replace(/\D/g, "")) / (app.rent * 12)).toFixed(1)}x` : "—"}</span><span style={{ fontSize: 11, color: C.inkMuted }}> (min 2.5x recommended)</span></div>
                      <div><span style={{ fontSize: 11, color: C.inkMuted }}>Background: </span><span style={{ fontSize: 13, fontWeight: 600, color: app.step === "complete" ? (app.status === "denied" ? C.red : C.green) : C.amber }}>{app.step === "complete" ? (app.status === "denied" ? "Flag found" : "Clear") : "In progress"}</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Actions</div>
                      {app.status === "pending_review" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <button style={{ padding: "9px 16px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.green, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font }}>Approve Application</button>
                          <button style={{ padding: "9px 16px", borderRadius: C.radiusSm, border: `1px solid ${C.red}`, backgroundColor: "transparent", color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font }}>Deny Application</button>
                          <button style={{ padding: "9px 16px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: font }}>Request More Info</button>
                        </div>
                      )}
                      {app.status === "approved" && (
                        <button style={{ padding: "9px 16px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font, width: "100%" }}>Generate Lease</button>
                      )}
                      {app.status === "screening" && (
                        <div style={{ padding: "10px 12px", backgroundColor: C.amberBg, borderRadius: C.radiusSm, fontSize: 12, color: C.amber, fontWeight: 500 }}>
                          Screening in progress. Missing docs: {Object.entries(app.docs).filter(([,v]) => !v).map(([k]) => k).join(", ") || "None"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};

// ============ ENHANCED MAINTENANCE WITH CONTRACTORS ============
const EnhancedMaintenanceView = () => {
  const [subTab, setSubTab] = useState("requests");
  const [filter, setFilter] = useState("all");
  const filtered = maintenanceRequests.filter(m => filter === "all" ? true : m.status === filter);

  const autoMatch = (type) => {
    const match = contractors.find(c => c.specialties.includes(type) && c.status === "available");
    return match || contractors.find(c => c.specialties.includes(type));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <Pill label="Requests" active={subTab==="requests"} onClick={()=>setSubTab("requests")} />
        <Pill label="Contractors" active={subTab==="contractors"} onClick={()=>setSubTab("contractors")} />
      </div>

      {subTab === "requests" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <KPI label="Open" value={maintenanceRequests.filter(m=>m.status==="open").length} sub={`${maintenanceRequests.filter(m=>m.priority==="urgent").length} urgent`} trend="down" />
            <KPI label="In Progress" value={maintenanceRequests.filter(m=>m.status==="in_progress").length} />
            <KPI label="Avg Resolution" value="1.8 days" sub="-0.3 vs last mo" trend="up" />
            <KPI label="Satisfaction" value="4.6/5" trend="up" />
          </div>
          <Panel>
            <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
              {[{k:"all",l:"All",n:maintenanceRequests.length},{k:"open",l:"Open",n:maintenanceRequests.filter(m=>m.status==="open").length},{k:"in_progress",l:"In Progress",n:maintenanceRequests.filter(m=>m.status==="in_progress").length}].map(f=><Pill key={f.k} label={f.l} active={filter===f.k} onClick={()=>setFilter(f.k)} count={f.n} />)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map(m => {
                const pr = priorityMap[m.priority]; const st = mxStatusMap[m.status];
                const matched = autoMatch(m.type);
                return (
                  <div key={m.id} style={{ padding: "14px 16px", backgroundColor: m.priority==="urgent"?C.redBg:C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${m.priority==="urgent"?`${C.red}33`:C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 }}><span style={{ fontSize: 10, color: C.inkMuted, fontWeight: 600 }}>Unit</span><span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{m.unit}</span></div>
                      <div style={{ width: 1, height: 36, backgroundColor: C.border }} />
                      <div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}><span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{m.title}</span><Badge label={pr.l} color={pr.c} bg={pr.b} /></div><div style={{ fontSize: 12, color: C.inkMuted }}>{m.resident} \u00B7 {m.type} \u00B7 {m.created}</div></div>
                      <Badge label={st.l} color={st.c} bg={st.b} /><div style={{ fontSize: 12, color: C.inkLight, minWidth: 70 }}>{m.assigned||"Unassigned"}</div>
                    </div>
                    {/* Auto-dispatch suggestion for unassigned */}
                    {!m.assigned && matched && (
                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: C.accentLight, borderRadius: C.radiusSm, border: `1px solid ${C.accent}22` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>Auto-Match:</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{matched.name}</span>
                          <span style={{ fontSize: 11, color: C.inkMuted }}>{matched.company} \u00B7 {matched.rate} \u00B7 {matched.avgResponse} avg response</span>
                          <span style={{ fontSize: 11, color: C.amber }}>{"\u2605"} {matched.rating}</span>
                        </div>
                        <button style={{ padding: "6px 14px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: font }}>Dispatch Now</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {subTab === "contractors" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <KPI label="Active Contractors" value={contractors.length} accent />
            <KPI label="Available Now" value={contractors.filter(c => c.status === "available").length} />
            <KPI label="Avg Rating" value={(contractors.reduce((s,c) => s + c.rating, 0) / contractors.length).toFixed(1)} sub="Across all vendors" trend="up" />
            <KPI label="Avg Response" value="2.9 hrs" sub="Time to accept job" />
          </div>

          <Panel style={{ marginBottom: 16, borderLeft: `3px solid ${C.accent}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>How contractor dispatch works</div>
            <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7 }}>
              When a maintenance request comes in, LeaseRight auto-matches it to the best available contractor based on specialty, rating, response time, and current workload. The contractor gets a push notification with the job details. They accept, schedule, complete, and mark done — all tracked here. No phone tag, no back-and-forth. You can also manually assign or override at any time.
            </div>
          </Panel>

          <Panel>
            <SectionTitle sub="Your vendor network">Contractor Roster</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {contractors.map(c => {
                const statusColor = { available: C.green, on_job: C.amber, offline: C.inkMuted };
                const statusLabel = { available: "Available", on_job: "On Job", offline: "Offline" };
                return (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 100px", alignItems: "center", gap: 12, padding: "16px 18px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>{c.company}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        {c.specialties.map(s => <Badge key={s} label={s} color={C.accent} bg={C.accentLight} />)}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: C.amber }}>{"\u2605"} {c.rating}</div><div style={{ fontSize: 10, color: C.inkMuted }}>{c.jobsCompleted} jobs</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{c.avgResponse}</div><div style={{ fontSize: 10, color: C.inkMuted }}>Avg response</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{c.rate}</div><div style={{ fontSize: 10, color: C.inkMuted }}>{c.activeJobs} active</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{c.phone}</div></div>
                    <div style={{ textAlign: "right" }}><Badge label={statusLabel[c.status]} color={statusColor[c.status]} bg={`${statusColor[c.status]}18`} /></div>
                  </div>
                );
              })}
            </div>
            <button style={{ marginTop: 14, padding: "10px 20px", borderRadius: C.radiusSm, border: `1px solid ${C.accent}`, backgroundColor: "transparent", color: C.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font }}>+ Add Contractor</button>
          </Panel>
        </div>
      )}
    </div>
  );
};

// ============ SETTINGS & COMPLIANCE ============
const SettingsView = () => {
  const [subTab, setSubTab] = useState("rent_rules");
  const [settings, setSettings] = useState(rentComplianceDefaults);

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <Pill label="Rent & Compliance" active={subTab==="rent_rules"} onClick={()=>setSubTab("rent_rules")} />
        <Pill label="Connections" active={subTab==="connections"} onClick={()=>setSubTab("connections")} />
        <Pill label="Market Data" active={subTab==="market_data"} onClick={()=>setSubTab("market_data")} />
        <Pill label="Property Config" active={subTab==="property"} onClick={()=>setSubTab("property")} />
      </div>

      {subTab === "rent_rules" && (
        <div>
          <Panel style={{ marginBottom: 16, borderLeft: `3px solid ${C.amber}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>State-Specific Compliance</div>
            <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7 }}>
              Rent collection rules vary by state and sometimes by city. Late fee caps, grace period requirements, security deposit escrow rules, and interest requirements on deposits are all regulated. We pre-load your state's rules and flag anything that needs attention. You can customize within legal limits — we won't let you set a $500 late fee in a state that caps it at $50.
            </div>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Panel>
              <SectionTitle sub="Auto-configured based on property location">State Rules ({settings.state})</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Grace Period", value: `${settings.gracePeriod} days`, note: "Texas has no statutory requirement, but 3 days is standard practice", editable: true },
                  { label: "Late Fee", value: settings.lateFeeType === "flat" ? `$${settings.lateFeeAmount} flat` : `${settings.lateFeeAmount}%`, note: "Texas: reasonable fees permitted, no statutory cap", editable: true },
                  { label: "NSF / Bounced Check Fee", value: `$${settings.nsfFee}`, note: "Texas allows up to $30 for bounced checks", editable: true },
                  { label: "Security Deposit Max", value: settings.securityDepositMax, note: "Texas has no statutory maximum", editable: false },
                  { label: "Deposit Escrow Required", value: settings.securityDepositEscrow ? "Yes" : "No", note: "Texas does not require separate escrow", editable: false },
                  { label: "Deposit Interest Required", value: settings.securityDepositInterest ? "Yes" : "No", note: "Texas does not require interest on deposits", editable: false },
                  { label: "Deposit Return Deadline", value: `${settings.returnDeadline} days`, note: "Texas requires return within 30 days of move-out", editable: false },
                ].map((rule, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{rule.label}</div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>{rule.note}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{rule.value}</span>
                      {rule.editable && <button style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontSize: 11, cursor: "pointer", fontFamily: font }}>Edit</button>}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <SectionTitle sub="Payment methods and processing">Payment Settings</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "ACH / Bank Transfer", enabled: true, fee: "$4.95 flat (to renter)" },
                  { label: "Debit Card", enabled: true, fee: "$4.95 flat (to renter)" },
                  { label: "Credit Card", enabled: true, fee: "2.99% (to renter)" },
                  { label: "Check / Money Order", enabled: false, fee: "No fee" },
                ].map((method, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{method.label}</div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>{method.fee}</div>
                    </div>
                    <div style={{ width: 42, height: 22, borderRadius: 11, backgroundColor: method.enabled ? C.green : C.border, position: "relative", cursor: "pointer" }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 3, left: method.enabled ? 22 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                    </div>
                  </div>
                ))}
              </div>

              <SectionTitle sub="How deposits and escrow are handled">Escrow & Deposits</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Security Deposit Account", value: "Chase Escrow ••••6219", status: "Connected" },
                  { label: "Operating Account", value: "Chase Business ••••4821", status: "Connected" },
                  { label: "Auto-segregate deposits", value: "Security deposits route to escrow automatically", status: "Enabled" },
                ].map((acc, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{acc.label}</div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>{acc.value}</div>
                    </div>
                    <Badge label={acc.status} color={C.green} bg={C.greenBg} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {subTab === "connections" && (
        <div>
          <Panel style={{ marginBottom: 16, borderLeft: `3px solid ${C.accent}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Listing Service Connections</div>
            <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7 }}>
              LeaseRight syndicates your listings via industry-standard MITS XML feeds. You don't need accounts on every platform — we are the feed provider. For platforms that require direct API access (Zillow Partner Feed, CoStar ILS), we handle the partnership. Your job is to keep your listing data current. We handle distribution.
            </div>
          </Panel>

          <Panel style={{ marginBottom: 16 }}>
            <SectionTitle sub="These integrations feed your listing syndication">Platform Connections</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "Zillow / Trulia / HotPads", method: "Zillow Partner Feed (XML)", status: "connected", note: "Zillow Group owns all three. One feed covers all.", color: "#006AFF" },
                { name: "Apartments.com / Rent.com", method: "CoStar ILS Feed", status: "connected", note: "CoStar Group owns both. Enterprise feed partnership.", color: "#E74C3C" },
                { name: "Realtor.com", method: "MITS XML Feed", status: "connected", note: "Direct feed via Move, Inc. API.", color: "#D92228" },
                { name: "Facebook Marketplace", method: "Property Listings API", status: "connected", note: "Meta's rental listing integration.", color: "#1877F2" },
                { name: "Craigslist", method: "Bulk posting (email-based)", status: "not_connected", note: "Craigslist doesn't have a formal API. We use approved bulk posting.", color: "#800080" },
                { name: "MLS / Local Feeds", method: "RETS/RESO Web API", status: "setup_required", note: "Requires MLS board registration. We'll walk you through it.", color: "#333" },
              ].map((conn, i) => {
                const sc = { connected: { l: "Connected", c: C.green, b: C.greenBg }, not_connected: { l: "Not Connected", c: C.inkMuted, b: C.surfaceAlt }, setup_required: { l: "Setup Required", c: C.amber, b: C.amberBg } };
                const s = sc[conn.status];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: `${conn.color}12`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${conn.color}22` }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: conn.color }}>{conn.name[0]}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{conn.name}</div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>{conn.method}</div>
                      <div style={{ fontSize: 11, color: C.inkLight, marginTop: 2 }}>{conn.note}</div>
                    </div>
                    <Badge label={s.l} color={s.c} bg={s.b} />
                    {conn.status === "setup_required" && <button style={{ padding: "6px 14px", borderRadius: C.radiusSm, border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: font }}>Set Up</button>}
                    {conn.status === "not_connected" && <button style={{ padding: "6px 14px", borderRadius: C.radiusSm, border: `1px solid ${C.accent}`, backgroundColor: "transparent", color: C.accent, fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: font }}>Connect</button>}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <SectionTitle sub="Third-party integrations">Other Integrations</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { name: "Stripe Connect", desc: "Payment processing", status: "connected" },
                { name: "TransUnion", desc: "Credit & background checks", status: "connected" },
                { name: "Plaid", desc: "Bank account verification", status: "connected" },
                { name: "Twilio", desc: "SMS notifications", status: "connected" },
                { name: "Resend", desc: "Email delivery", status: "connected" },
                { name: "QuickBooks", desc: "Accounting sync", status: "not_connected" },
              ].map((int, i) => {
                const connected = int.status === "connected";
                return (
                  <div key={i} style={{ padding: "14px 16px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${connected ? `${C.green}22` : C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{int.name}</span>
                      <StatusDot color={connected ? C.green : C.inkMuted} />
                    </div>
                    <div style={{ fontSize: 11, color: C.inkMuted }}>{int.desc}</div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {subTab === "market_data" && (
        <div>
          <Panel style={{ marginBottom: 16, borderLeft: `3px solid ${C.accent}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Comp Set Builder</div>
            <div style={{ fontSize: 13, color: C.inkLight, lineHeight: 1.7 }}>
              Your lease-up intelligence is only as good as your market data. We pull baseline rental data from Rentometer and public listings, but the real power comes from your local knowledge. Add your direct competitors below — their rents, concessions, occupancy. This feeds your Rent Optimizer, Concession recommendations, and Feedback intelligence. Update it monthly for best results.
            </div>
          </Panel>

          <Panel style={{ marginBottom: 16 }}>
            <SectionTitle sub="These properties feed your market analysis">Your Comp Set</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {competitorIntel.map((comp, i) => {
                const threatColors = { high: C.red, medium: C.amber, low: C.green };
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", alignItems: "center", gap: 12, padding: "14px 16px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{comp.name}</div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>{comp.distance} away \u00B7 {comp.units} units</div>
                    </div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{comp.occupancy}</div><div style={{ fontSize: 10, color: C.inkMuted }}>Occupancy</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{comp.avgRent1BR}</div><div style={{ fontSize: 10, color: C.inkMuted }}>1BR</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{comp.avgRent2BR}</div><div style={{ fontSize: 10, color: C.inkMuted }}>2BR</div></div>
                    <div style={{ fontSize: 12, color: threatColors[comp.threat], fontWeight: 600 }}>{comp.concession}</div>
                    <button style={{ padding: "6px 12px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontSize: 11, cursor: "pointer", fontFamily: font }}>Edit</button>
                  </div>
                );
              })}
            </div>
            <button style={{ marginTop: 14, padding: "10px 20px", borderRadius: C.radiusSm, border: `1px solid ${C.accent}`, backgroundColor: "transparent", color: C.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font }}>+ Add Competitor</button>
          </Panel>

          <Panel>
            <SectionTitle sub="Automated data sources">Market Data Feeds</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { name: "Rentometer", desc: "Baseline rent ranges by unit type and ZIP", status: "active", lastSync: "Apr 14, 2026" },
                { name: "Census / ACS Data", desc: "Demographic and income data for your market area", status: "active", lastSync: "2025 dataset" },
                { name: "CoStar Analytics", desc: "Professional market analytics (requires subscription)", status: "not_connected", lastSync: null },
                { name: "LeaseRight Network", desc: "Anonymized data from other LeaseRight properties in your market", status: "active", lastSync: "Real-time" },
              ].map((feed, i) => (
                <div key={i} style={{ padding: "14px 16px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm, border: `1px solid ${feed.status === "active" ? `${C.green}22` : C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{feed.name}</span>
                    <Badge label={feed.status === "active" ? "Active" : "Not Connected"} color={feed.status === "active" ? C.green : C.inkMuted} bg={feed.status === "active" ? C.greenBg : C.surfaceAlt} />
                  </div>
                  <div style={{ fontSize: 11, color: C.inkMuted }}>{feed.desc}</div>
                  {feed.lastSync && <div style={{ fontSize: 10, color: C.inkLight, marginTop: 4 }}>Last sync: {feed.lastSync}</div>}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {subTab === "property" && (
        <div>
          <Panel>
            <SectionTitle sub="Core property information">Property Configuration</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Property Name", value: "The Meridian" },
                  { label: "Address", value: "800 Congress Ave, Austin TX 78701" },
                  { label: "Total Units", value: "260" },
                  { label: "Year Built", value: "2025" },
                  { label: "Property Type", value: "Ground-Up New Construction" },
                  { label: "Management Company", value: "Meridian Development Group" },
                  { label: "Certificate of Occupancy", value: "Dec 15, 2025" },
                  { label: "First Move-In", value: "Jan 5, 2026" },
                ].map((field, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{field.label}</span>
                    <span style={{ fontSize: 13, color: C.inkLight }}>{field.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Unit Mix Configuration</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {unitMix.map((u, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: C.surfaceAlt, borderRadius: C.radiusSm }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{u.type}</span>
                        <span style={{ fontSize: 12, color: C.inkMuted, marginLeft: 8 }}>{u.total} units</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>${u.asking.toLocaleString()}/mo</span>
                        <button style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.inkLight, fontSize: 11, cursor: "pointer", fontFamily: font }}>Edit</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, fontSize: 11, color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Amenities</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Rooftop Deck", "Fitness Center", "Package Lockers", "Covered Parking", "Bike Storage", "Dog Park", "Co-Working Space", "Pool", "EV Charging"].map((a, i) => (
                    <span key={i} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 500, color: i < 7 ? C.green : C.inkMuted, backgroundColor: i < 7 ? C.greenBg : C.surfaceAlt, border: `1px solid ${i < 7 ? `${C.green}22` : C.border}` }}>{i < 7 ? "\u2713 " : ""}{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
};

// ============ SIDEBAR NAV (PARENT/CHILD) ============
const navGroups = [
  { label: null, items: [
    { id: "command_center", label: "Command Center", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-4 3 3 7-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 4h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { id: "precon", label: "Pre-Con DD", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 2h12a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/><path d="M6 7h6M6 10h4M6 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]},
  { label: "Leasing", items: [
    { id: "leads", label: "Leads", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 16.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, badge: 3 },
    { id: "applications", label: "Applications", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="1.5" width="12" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 5.5h6M6 8.5h6M6 11.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, badge: 1 },
    { id: "listings", label: "Listings", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 5h14M2 9h14M2 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]},
  { label: "Operations", items: [
    { id: "tenants", label: "Tenants", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 16.5c0-3 3.1-5.5 7-5.5s7 2.5 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14.5 6.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { id: "maintenance", label: "Maintenance", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 2l1 3.5 3.5 1-3.5 1-1 3.5-1-3.5L6 6.5l3.5-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M4 12l.5 1.5L6 14l-1.5.5L4 16l-.5-1.5L2 14l1.5-.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>, badge: 1 },
    { id: "inbox", label: "Inbox", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="3" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 7l6.8 4.2a1.5 1.5 0 001.4 0L16.5 7" stroke="currentColor" strokeWidth="1.5"/></svg>, badge: 4 },
  ]},
  { label: "Money", items: [
    { id: "rent", label: "Rent Collection", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="4" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 8h15" stroke="currentColor" strokeWidth="1.5"/></svg> },
    { id: "banking", label: "Banking", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5v15M5.5 5h5a2 2 0 010 4H7a2 2 0 000 4h5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]},
  { label: null, items: [
    { id: "settings", label: "Settings", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]},
];

const allNavItems = navGroups.flatMap(g => g.items);

// ============ MAIN APP ============
export default function LeaseRightApp() {
  const [tab, setTab] = useState("command_center");
  const [propIdx, setPropIdx] = useState(0);
  const [propMenu, setPropMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const prop = properties[propIdx];
  const occPct = ((prop.leased / prop.units) * 100).toFixed(1);

  return (
    <div style={{ fontFamily: font, backgroundColor: C.bg, minHeight: "100vh", display: "flex", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap');
        @keyframes pulse { 0%,100% { transform:scale(1); opacity:0.3 } 50% { transform:scale(2); opacity:0 } }
        * { box-sizing: border-box; }
        input[type="range"] { height: 4px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        button:hover { opacity: 0.85; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: collapsed ? 60 : 220, backgroundColor: C.sidebar, display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <div style={{ padding: collapsed ? "16px 12px" : "16px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: "#fff", fontFamily: fontSerif, fontSize: 16, fontWeight: 400 }}>L</span></div>
          {!collapsed && <span style={{ color: "#fff", fontFamily: fontSerif, fontSize: 18, fontWeight: 400, letterSpacing: -0.3 }}>LeaseRight</span>}
        </div>

        {!collapsed && (
          <div style={{ padding: "10px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setPropMenu(!propMenu)} style={{ width: "100%", padding: "7px 10px", borderRadius: C.radiusSm, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: C.sidebarHover, color: C.inkOnDark, fontSize: 12, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 7, fontFamily: font }}>
                <StatusDot color={prop.status === "leasing" ? C.accent : C.amber} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prop.name}</div><div style={{ fontSize: 10, color: C.inkDimOnDark }}>{prop.units} units</div></div>
                <span style={{ fontSize: 9, color: C.inkDimOnDark }}>{"\u25BC"}</span>
              </button>
              {propMenu && (
                <div style={{ position: "absolute", top: 48, left: 0, right: 0, backgroundColor: C.sidebarHover, border: "1px solid rgba(255,255,255,0.1)", borderRadius: C.radiusSm, padding: 4, zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                  {properties.map((p, i) => (
                    <button key={p.id} onClick={() => { setPropIdx(i); setPropMenu(false); }} style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: "none", backgroundColor: i === propIdx ? `${C.accent}22` : "transparent", color: C.inkOnDark, cursor: "pointer", textAlign: "left", fontSize: 12, fontFamily: font, display: "flex", alignItems: "center", gap: 7 }}>
                      <StatusDot color={p.status === "leasing" ? C.accent : C.amber} /><div><div style={{ fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 10, color: C.inkDimOnDark }}>{p.address}</div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
          {navGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 4 }}>
              {group.label && !collapsed && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1.2, padding: "10px 12px 4px" }}>{group.label}</div>
              )}
              {collapsed && group.label && <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", margin: "6px 8px" }} />}
              {group.items.map(n => (
                <button key={n.id} onClick={() => setTab(n.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 9,
                  padding: collapsed ? "9px 0" : "7px 12px", borderRadius: C.radiusSm,
                  backgroundColor: tab === n.id ? C.sidebarActive : "transparent",
                  color: tab === n.id ? "#fff" : C.inkDimOnDark, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: tab === n.id ? 600 : 400, transition: "all 0.12s",
                  justifyContent: collapsed ? "center" : "flex-start", position: "relative", fontFamily: font,
                }}>
                  {n.icon}
                  {!collapsed && <span>{n.label}</span>}
                  {n.badge && <span style={{ position: collapsed ? "absolute" : "relative", top: collapsed ? 2 : "auto", right: collapsed ? 6 : "auto", marginLeft: collapsed ? 0 : "auto", backgroundColor: C.red, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 4, minWidth: 16, textAlign: "center" }}>{n.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ width: "100%", padding: "7px", borderRadius: C.radiusSm, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "transparent", color: C.inkDimOnDark, cursor: "pointer", fontSize: 12, fontFamily: font }}>
            {collapsed ? "\u25B6" : "\u25C0 Collapse"}
          </button>
        </div>
        {!collapsed && (
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.inkDimOnDark, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>Your plan</div>
            <div style={{ fontFamily: fontSerif, fontSize: 16, fontWeight: 400, color: "#fff", marginTop: 2 }}>$1/unit/mo</div>
            <div style={{ fontSize: 10, color: C.inkDimOnDark, marginTop: 1 }}>Forever. No hidden fees.</div>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <h1 style={{ fontFamily: fontSerif, fontSize: 18, fontWeight: 400, color: C.ink, margin: 0 }}>{allNavItems.find(n => n.id === tab)?.label || "Dashboard"}</h1>
            <span style={{ fontSize: 12, color: C.inkMuted, fontWeight: 500 }}>{occPct}% leased</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}><span style={{ fontSize: 16, cursor: "pointer", opacity: 0.5 }}>{"\uD83D\uDD14"}</span><span style={{ position: "absolute", top: -4, right: -6, backgroundColor: C.red, color: "#fff", fontSize: 9, fontWeight: 800, padding: "0 4px", borderRadius: 4 }}>3</span></div>
            <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>JM</div>
          </div>
        </div>
        <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto" }}>
          {tab === "precon" && <PreConView />}
          {tab === "command_center" && <CommandCenterView />}
          {tab === "leads" && <LeadsView />}
          {tab === "applications" && <ApplicationsView />}
          {tab === "listings" && <ListingsView />}
          {tab === "tenants" && <TenantsView />}
          {tab === "maintenance" && <EnhancedMaintenanceView />}
          {tab === "inbox" && <InboxView />}
          {tab === "rent" && <RentView />}
          {tab === "banking" && <BankingView />}
          {tab === "settings" && <SettingsView />}
        </div>
      </div>
    </div>
  );
}
