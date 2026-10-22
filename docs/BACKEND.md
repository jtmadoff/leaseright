# LeaseRight backend design

Status: designed, not built. The prototype runs every service below as a stand-in inside the browser (`src/core/sim.js`), writing the same fields on the same project record the real service will write. Swapping a stand-in for the real service changes where the writes come from, not the screens.

## The principle

The front end reads and writes one record per project: units, prospects with their messages and applications, platforms, prices, concessions, and the agent's settings. The backend exists to write into that record the things that happen while nobody has the app open: an inquiry arriving from Zillow at 9 pm, the reply that goes out two minutes later, the tour that books itself, the screening report that comes back, the lease that gets signed. Everything a person does stays in the app as it is today.

## Platform

Supabase: Postgres, sign-in, row-level security, file storage, scheduled jobs and edge functions in one service. The Pro plan starts at $25 a month with 8 GB of database and 100,000 monthly active users, which covers years of pilots. Each project belongs to an organization; members have a role (owner, leasing, lender read-only). Row-level security keeps one sponsor's data invisible to another.

Tables follow the record the prototype already uses: `orgs`, `members`, `projects`, `units`, `prospects`, `messages`, `applications`, `leases`, `platforms`, `price_changes`, `concessions`, `agent_settings`, plus an append-only `events` table that every service writes to. The daily digest on Today is a query over `events`, exactly as `digestSince` reads `sim.log` now. The browser keeps its local copy as an offline cache and subscribes to changes. A project exported from the prototype imports on first sign-in.

## Services

**Lead intake.** Every project gets an inbound address, `slug@leads.leaseright.app`, received by an inbound-email provider and parsed per sender (Zillow, Apartments.com, Zumper, Facebook, the website form). The parser creates the prospect and its first message, deduplicating on phone and email. Zillow also offers a Lead API that delivers lead data straight to management systems; it replaces email parsing for Zillow once LeaseRight is an approved partner. Stand-in: step 1 of `advanceDay`, with inquiry volume driven by price, season and live platforms.

**Leasing agent.** Conversations run over text and email. Texting goes through Twilio: $0.0083 per message segment each way plus carrier fees, about $1.15 a month per local number, and A2P 10DLC registration before any business texting. A language model drafts each reply from the building's facts, live availability and asking rents, and open tour slots. Routine questions send on their own; negotiation, exceptions, complaints and anything touching a protected class go to a person with the thread attached. The agent replies only to people who wrote first and honors STOP. It has to answer every prospect the same way: the federal Fair Housing Act applies, and Rhode Island has prohibited discrimination by lawful source of income, including housing vouchers, since 2021, so voucher questions get a standard, accurate answer. Stand-in: `agentAnswer` and the escalation rules in `advanceDay`.

**Tours.** Tour hours live on the project (the Agent page). The real service also reads the leasing person's calendar so a booked slot never collides with something else, and a scheduled job sends the morning reminder and the after-tour application link. Stand-in: `nextSlot` and the tour step.

**Listing syndication.** A nightly job builds a feed from units, prices and concessions. Zillow's Rental Network takes an XML feed (its own format or MITS) from property managers and software partners at no cost, after an integration request, approval, and four to six weeks of testing on production data. Other networks have their own programs and terms, several of them paid. Until a network is integrated, the Listings page keeps the manual link and "mark updated" flow. Stand-in: the sync step, which also models what a stale price costs in leads.

**Applications and screening.** Each project gets an application page. TransUnion SmartMove runs $25 to $49 per applicant depending on the package, and the owner can pass the fee to the applicant where the law allows. Results land on the application and the existing policy check (`applicationCheck`) decides whether the agent may approve on its own or must hand it to a person. Income multiples should count voucher payments as income. Stand-in: the applied step, which returns credit, income and background a day after the application.

**Lease and signature.** The approved application fills the project's lease template and goes out through the Dropbox Sign API, priced by monthly signature volume and free to test. A webhook on completion moves the prospect to leased. Stand-in: the approved step.

**Payments.** Deposit and first month by card or bank transfer through Stripe. After the first pilot.

**Market data.** Already built: RentCast listings and the Zillow rent index on a schedule, inside the 50-call monthly allowance.

## Cost for one building

A 64-unit lease-up drawing about 40 inquiries a week for six months sees roughly 1,000 inquiries. At around eight text segments per conversation that is 8,000 segments, near $100 in texting with carrier fees, plus a dollar or two a month for the number. Screening passes to applicants. Signature and database costs are shared across every building on the platform. The language model is the open variable; measure it in the pilot rather than guess. Against a vacancy cost the sample shows at over $90,000 a month, a week saved is worth far more than the whole stack, which is the case for pricing on results.

## Build order

1. Accounts and sync, so the prototype runs on a server-kept record.
2. Lead intake by email, with the agent in draft mode: it writes every reply and a person approves it. Track how often the draft goes out unedited.
3. Texting, then autopilot for the intents whose drafts go out unedited nearly every time.
4. Tour booking with calendar sync and reminders.
5. Applications and screening.
6. Listing feed, Zillow first.
7. Lease signature.
8. Payments.

Step 2 is the first point where a real building gets value: every lead answered inside minutes, and the leasing person sees only the conversations that need judgment.

## Where each stand-in lives

| Service | Stand-in | Writes |
|---|---|---|
| Lead intake | `advanceDay`, step 1 | new prospects, first message, source |
| Leasing agent | `agentAnswer`, lead step | agent messages (`by: "agent"`), `needsYou` handoffs |
| Tours | `nextSlot`, tour step | `tourAt`, reminders, no-shows, reschedules |
| Listing sync | sync step | `platforms[].syncedAt` |
| Screening | applied step | `app.credit`, `app.income`, `app.background` |
| Signature | approved step | `leasedAt`, `leaseRent`, `freeMonths` |
| Event log | `sim.log` | the daily digest and weekly report |

## What the simulation assumes

The numbers in `SIM` are starting assumptions, not findings: about 1.1 inquiries per open unit per week at a fair price; a fair price is the town's listing median plus the project's premium; inquiry volume falls as `exp(-8 × (effective rent ÷ fair rent − 1))`; 45% of leads answered within an hour book a tour, against 18% answered the next day or later; 90% of reminded tours show; half of toured prospects apply at a fair price, fewer above it. They should be recalibrated against Justin's own lease-up records before anyone reads the simulation as a forecast.
