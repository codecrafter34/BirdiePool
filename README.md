# ⛳ BirdiePool

**Turn Every Round Into Real Impact.**

BirdiePool is a premium, full-stack Next.js web platform that transforms everyday golf rounds into meaningful charity donations. By subscribing, golfers not only contribute directly to charities of their choice but also earn entries into an exciting monthly algorithmic prize draw based on their golfing performance.

---

## ✨ Core Features

### 1. 🛡️ Complete Role-Based Access Control (RBAC)
Secure routing and server actions powered by Next.js Edge Middleware.
- **Visitor:** Can explore the public landing page, view charities, and see prize pools.
- **Subscriber:** Gets access to the User Dashboard to log scores, manage charity preferences, and upload winner proofs.
- **Admin:** Exclusive access to the `/admin` dashboard to oversee users, manage charities, verify winner IDs, and trigger payouts.

### 2. 💳 Secure Razorpay Subscriptions
- Users can purchase **Monthly** or **Yearly** subscriptions securely via Razorpay.
- Checkout flows are entirely seamless and update the Supabase database automatically upon verification.
- Calculates dynamic renewal dates based on subscription type.

### 3. 🤝 Charity Impact System
- Subscribers choose exactly which charity they want to support from a curated list of Impact Partners.
- They control what percentage (e.g., 10% - 100%) of the charity allocation goes to their selected partner.
- The platform automatically updates total funds raised for each charity in real-time.

### 4. 🏌️‍♂️ Golf Score Tracking & AI Insights
- Users log their Stableford golf scores directly into their dashboard.
- The system retains the 5 most recent scores, dynamically evicting older ones via PostgreSQL triggers.
- **Google Gemini AI** analyzes these scores to provide personalized performance insights.

### 5. 🏆 The Algorithmic Draw Engine
- At the end of each month, a highly secure serverless Cron Job executes the monthly draw.
- It translates users' logged scores into draw numbers.
- Generates a grand prize pool algorithmically, and distributes it across:
  - 🥇 5 Match Winners (40% Pool)
  - 🥈 4 Match Winners (35% Pool)
  - 🥉 3 Match Winners (25% Pool)

### 6. ✅ KYC Winner Verification
- Winners are notified in their dashboard and prompted to upload ID proof.
- Proofs are securely stored in Supabase Storage Buckets (`winner-proofs`).
- Admins review the uploaded documents to **Approve** or **Reject** claims before marking payouts as completed.

### 7. 🎨 Premium UI/UX Design
- Completely bespoke aesthetic using **Tailwind CSS**.
- Fluid micro-interactions and animations using **Framer Motion**.
- Interactive 3D graphics on the landing page powered by **React Three Fiber** and **Drei**.

---

## 🛠️ Technology Stack

| Category | Technology |
| --- | --- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS, Framer Motion |
| **3D Engine** | React Three Fiber, Drei |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security) |
| **Payments** | Razorpay (Checkout Flow) |
| **AI** | Google Gemini API |
| **File Storage** | Supabase Storage |

---

## 📂 Project Structure

```text
src/
├── actions/              # Server Actions for DB mutations (Admin, Winners, etc.)
├── app/                  # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (auth)/           # Login, Signup, Auth Callbacks
│   ├── (dashboard)/      # Protected User & Admin Dashboards
│   ├── api/              # Razorpay webhooks, Cron job endpoints
│   └── page.tsx          # 3D Landing Page
├── components/           # Reusable UI components
│   ├── 3d/               # R3F Canvas and 3D Models
│   ├── layout/           # Smooth-scrolling Navbar, Sidebars
│   └── ui/               # Shadcn-inspired custom interactive widgets
├── lib/                  # Utilities (Supabase client, Razorpay config, utils)
└── middleware.ts         # Edge Middleware for strict RBAC protection
```

---

## 🚀 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/your-username/birdiepool.git
cd birdiepool
npm install
```

### 2. Configure Environment Variables
Copy the template and fill in your keys:
```bash
cp .env.local.example .env.local
```
**Required Keys:**
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
- `GEMINI_API_KEY`

### 3. Setup Supabase Database
Run the provided `supabase_schema.sql` in your Supabase SQL Editor.
This provisions all tables, enforces Row Level Security (RLS) policies, and creates the automatic DB Triggers.

*(Optional) To make yourself an admin:*
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 4. Run the Server
```bash
npm run dev
```
Visit `http://localhost:3000` to see the platform.

---

## 🚢 Deployment

1. **Vercel Setup:** Import the repository to Vercel.
2. **Environment Variables:** Add all `.env.local` keys to the Vercel project settings.
3. **Cron Jobs:** The `vercel.json` file is already configured to trigger the monthly draw at `/api/cron/execute-draw`. Ensure you set a `CRON_SECRET` to protect the endpoint.
4. **Deploy:** Hit deploy and your platform is live!

---

*Built with precision for golfers who want to make a difference.* ⛳
