# WASTE2WORTH

WASTE2WORTH is a circular-economy web platform built to connect citizens, scrap collectors, creators, volunteers, and administrators.
It supports scrap listings, pollution reporting, upcycled craft creation, cleanup campaigns, reward certificates, and admin pricing controls.

## 🚀 Features

- Role-based access for Admin, Citizen, BhangariShop, Creator, and Volunteer
- Secure JWT authentication with HttpOnly cookies
- Scrap listing creation and marketplace purchasing flows
- Pollution reporting and administrative review dashboards
- Creator raw material management and craft storefront listings
- Volunteer campaign participation and tracking
- Admin pricing directory, campaign management, and global dashboard controls

## 🧱 Tech Stack

- Node.js + Express
- MySQL database via `mysql2`
- JWT authentication
- `multer` file upload support
- `pdfkit` for reward certificates
- Vanilla HTML/CSS/JavaScript for frontend views

## 📁 Database Schema

This repository includes two schema files:

- `schema.sql` — Phase 1 database schema
- `schema-phase2.sql` — Phase 2 schema additions

### schema.sql (Phase 1)

Includes core application tables:

- `Users` — user accounts, roles, and green point balances
- `ScrapListings` — scrap item listings with owner, category, weight, and status
- `UpcycledCrafts` — creator craft products with pricing, inventory, and images

### schema-phase2.sql (Phase 2)

Adds campaign, volunteer, pollution, and pricing support:

- `CleanupCampaigns` — cleanup campaign events and volunteer caps
- `CampaignRegistrations` — volunteer registrations per campaign
- `PollutionComplaints` — citizen pollution reports for admin review
- `PriceDirectory` — material pricing by category with update timestamps

## ⚙️ Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and update your database credentials and JWT secret.

3. Initialize the database using the schema files:

```bash
mysql -u <user> -p < schema.sql
mysql -u <user> -p < schema-phase2.sql
```

4. Start the server:

```bash
npm start
```

5. Open the app at:

```text
http://localhost:3000
```

## 🛠️ Development

- `npm start` — start the server
- `npm run dev` — start the server with automatic restart on change

## 📂 Project Structure

- `app.js` — main Express application
- `routes/` — API routes grouped by role and resource
- `controllers/` — request handlers and business logic
- `models/` — database access layer
- `views/` — server-side HTML views
- `public/` — static CSS and client-side JavaScript
- `utils/` — shared utilities like payment and PDF generation
- `middleware/` — authentication, authorization, and upload helpers

## 📌 Notes

- Use an Admin account to access `/dashboard/admin` and `/api/admin/dashboard`
- The site protects API routes with `verifyToken` and role-based middleware

## 🔗 Repository

Remote GitHub: https://github.com/ItsNafi/WASTE2WORTH
