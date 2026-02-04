# POS Back Office

Administrative web application for managing POS App operations. Built with Next.js 16, TypeScript, and Firebase.

## Features

- **Dashboard** - Real-time sales overview, low stock alerts, revenue trends
- **Inventory Management** - Product CRUD, bulk import/export, stock adjustments
- **Sales History** - Transaction search, void/refund management
- **Reports** - Sales analytics, top products, category performance, export to PDF/CSV
- **Settings** - Tax configuration, business info, payment methods, default location
- **Employee Management** - User CRUD with email invitations, role assignment
- **Role-Based Access Control (RBAC)** - 16 granular permissions across 6 categories
- **Multi-Location Support** - Manage multiple store locations with timezone/currency settings
- **Default Location for Receipts** - Configure location info to display on POS receipts

### Coming Soon
- Supplier management and purchase orders
- Advanced analytics and forecasting
- Bulk product import from CSV/Excel

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **State Management**: Zustand + React Query
- **Database**: Firebase Firestore (shared with POS App)
- **Authentication**: Firebase Auth
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project (shared with POS App)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/pos-backoffice.git
cd pos-backoffice

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your Firebase configuration to .env.local
```

### Environment Variables

Create a `.env.local` file with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_TENANT_ID=your-tenant-id
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard
│   ├── inventory/         # Inventory management
│   ├── sales/             # Sales history
│   ├── reports/           # Reports and analytics
│   ├── settings/          # App settings
│   ├── employees/         # Employee management (RBAC)
│   └── locations/         # Multi-location management
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── app-sidebar.tsx    # Navigation sidebar
│   ├── users/             # Employee/user components
│   ├── locations/         # Location components
│   └── providers.tsx      # React Query provider
├── hooks/
│   ├── use-current-user.ts # Auth & permission checking
│   ├── use-locations.ts    # Location data hooks
│   └── use-settings.ts     # Settings data hooks
├── lib/
│   ├── firebase.ts        # Firebase configuration
│   ├── firestore/         # Firestore data access
│   │   ├── users.ts       # User queries & RBAC logic
│   │   ├── locations.ts   # Location queries
│   │   └── settings.ts    # Settings queries
│   └── utils.ts           # Utility functions
└── types/
    └── index.ts           # Shared TypeScript types
```

## Related Projects

- [POS App](https://github.com/your-org/pos-app) - Android POS application

## Deployment

See [docs/PRODUCTION.md](docs/PRODUCTION.md) for a comprehensive deployment guide including:
- Pre-deployment checklist
- Initial setup (first admin user, tenant configuration)
- Deployment options (Vercel, Firebase Hosting, Docker)
- Post-deployment verification
- Monitoring and troubleshooting

### Quick Start (Vercel)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy
4. Create first admin user (see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md))

### Self-hosted

```bash
npm run build
npm start
```

## License

Private - All rights reserved
