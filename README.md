## Insaaf Store BD

Next.js (App Router + TypeScript + Tailwind v4) build for Insaaf Store BD: public offers site, purchase flow, AI chatbot, reviews, and protected admin dashboard with Supabase.

### Quick start

```bash
npm install
npm run dev
# http://localhost:3000
# Admin login at http://localhost:3000/admin/login
```

### Environment

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_anon_key
SUPABASE_SERVICE_ROLE_KEY=service_role_key # server-only
```

### Supabase tables

```sql
create table packages (
	id text primary key,
	name text not null,
	description text,
	price numeric not null,
	currency text default 'BDT',
	status text check (status in ('active','hidden','inactive')) default 'active',
	features text[] default '{}',
	groups jsonb default '{}',
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

create table orders (
	id uuid primary key default gen_random_uuid(),
	full_name text,
	email text,
	mobile text,
	package_id text references packages(id),
	source text,
	transaction_id text,
	price numeric,
	currency text default 'BDT',
	status text check (status in ('pending','approved','rejected')) default 'pending',
	notes text,
	created_at timestamptz default now()
);

create table chat_entries (
	id text primary key,
	topic text,
	prompt text,
	response text,
	enabled boolean default true,
	tags text[] default '{}',
	created_at timestamptz default now()
);

create table reviews (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	rating int check (rating between 1 and 5),
	comment text not null,
	source text,
	status text check (status in ('pending','approved','rejected')) default 'pending',
	created_at timestamptz default now()
);
```

### Features

- Public home with active packages, social links, and CTA to purchase
- Purchase form (name/email/mobile/source/transaction ID) with auto-filled price
- Floating chatbot on all public pages using knowledge base + rules
- Policy page (terms, privacy, refund, disclaimer)
- Reviews page with submission + moderation (API-backed)
- Admin dashboard (Supabase Auth) for packages, orders, analytics, chatbot knowledge, CSV export
- API routes: `/api/packages`, `/api/orders`, `/api/chat`, `/api/reviews`

### Deployment notes

- Works on Netlify: set `NODE_VERSION` per Netlify, install with `npm ci`, build with `npm run build`, publish `.next`.
- Set env vars in Netlify dashboard. Service role must stay server-only.
- Database layer isolated in `src/lib/db.ts` for future migrations.
