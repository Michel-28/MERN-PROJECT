# TravelEase — Smart Travel Planning & Tour Booking Platform (MERN Stack)

TravelEase is an enterprise-grade full-stack MERN application built with MongoDB, Express.js, React.js (Vite), and Node.js. It features a complete travel itinerary planner, multi-category budget calculator, tour package booking engine with Razorpay test payment gateway integration and verification, separate JWT-based user and administrator authentication systems, and a mobile-first responsive design.

---

## Highlights & Core Architecture

### 1. Separate & Secure Authentication System
- **Two Distinct Experiences**:
  - **User Portal (`/login`, `/register`)**: Complete registration with full name, email, phone, and password policy (min 6 characters, confirmation validation). Authenticates travelers and issues signed JSON Web Tokens (JWT).
  - **Administrator Portal (`/admin/login`)**: Dedicated, dark-themed administrative sign-in portal. Verifies role `admin` stored in MongoDB before permitting access.
- **Server-Side Role-Based Access Control (RBAC)**:
  - Middleware `protect` cryptographically verifies JWT Bearer tokens and active account statuses.
  - Middleware `authorize('admin')` restricts all administrative endpoints (`/api/v1/admin/*`, package mutations, destination mutations).
  - Normal users cannot access administrative APIs or view/modify another user's private bookings.
- **Security Safeguards**:
  - Passwords hashed using `bcryptjs` with salt rounds. Never stored or returned in plaintext.
  - Public registration strictly enforces `role: 'user'` (cannot escalate to admin via request tampering).
  - Initial administrator is securely created via seed script reading credentials from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).

### 2. Complete Tour Booking & Payment Gateway Workflow
- **Review & Checkout Page (`/packages/:slug/book`)**:
  - Displays package summary, hero image, destination, duration, and departure date availability.
  - Interactive traveler count selector with live capacity checking against remaining spots.
  - Itemized price breakdown: base rate per person, GST/taxes included, and grand total.
  - Server calculates authoritative pricing on the backend (never trusts frontend totals).
- **Payment Lifecycle & Verification**:
  - **Gateway Integration**: Integrated with the official **Razorpay SDK** in Test Mode.
  - **Cryptographic Signature Verification**: Server validates HMAC SHA256 payment signatures (`order_id|payment_id` against `RAZORPAY_KEY_SECRET`).
  - **Academic Test Simulation Fallback**: When running in college lab environments without live internet Razorpay API keys, a seamless test gateway dialog is available allowing full cryptographic verification of orders, transaction IDs, payment methods (UPI, NetBanking, Card), simulated failures, and cancellation retries.
  - **Booking & Payment States**:
    - Booking States: `Pending Payment` ➔ `Confirmed` ➔ `Cancelled` or `Payment Failed`.
    - Payment States: `created` ➔ `pending` ➔ `paid` ➔ `refunded` or `failed`.
  - **Idempotency Safeguard**: Duplicate payment callback requests do not create duplicate confirmations or receipts.
- **Official Booking Confirmation & Receipts (`/booking-confirmation/:id`)**:
  - Formally generated booking confirmation with reference code (`TE-XXXXXX`), verified transaction ID, payment method, traveler count, and itemized receipt breakdown.
  - **Download / Print Receipt**: Print-friendly CSS media styling allows one-click printing or saving as a PDF receipt with TravelEase branding.
- **Booking Cancellation & Refund Management**:
  - Evaluates package cancellation policy based on days remaining until departure date:
    - `> 7 days`: 100% refund.
    - `3 to 7 days`: 70% refund.
    - `< 48 hours`: Non-refundable.
  - Records cancellation reasons, timestamps, and test refund transaction references in both `Booking` and `Payment` models in MongoDB.

### 3. Administrator Booking & User Management (`/admin`)
- **Dashboard Overview Metrics**:
  - Total Destinations, Tour Packages, Registered Users, Total Bookings.
  - Real-time **Verified Paid Revenue** (excludes unpaid, pending, or failed attempts).
  - Reservation Pipeline distribution: Confirmed (Paid) vs. Pending Payment vs. Cancelled.
- **Bookings Management (`/admin/bookings`)**:
  - Search by reference code, guest email, customer name, package title, destination.
  - Filters by booking status (`Confirmed`, `Pending Payment`, `Cancelled`, `Payment Failed`) and payment status (`paid`, `pending`, `failed`, `refunded`).
  - Detailed modal inspection showing customer phone, gateway order IDs, transaction IDs, payment timestamps, and cancellation audit trails.
- **Registered Users Directory (`/admin/users`)**:
  - Table of all accounts, roles (`user` vs `admin`), contact numbers, registration dates, and reservation counts.

### 4. Fully Responsive Mobile & Tablet Design
- Mobile-first layout tested across standard responsive widths:
  - **320 px** (Narrow mobile)
  - **375 px** (Common mobile)
  - **430 px** (Large mobile)
  - **768 px** (Tablet portrait)
  - **1024 px** (Tablet landscape / Small laptop)
  - **1440 px** (Desktop)
- Responsive navigation drawer with hamburger toggle, role-aware navigation links, touch-friendly tap targets, and no horizontal scroll overflows.

---

##  Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router DOM v7, Axios, Lucide React, React Hot Toast |
| **Backend** | Node.js, Express.js, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `razorpay`, CORS, Morgan, Dotenv |
| **Database** | MongoDB (v7.0+ / Community Edition / Atlas) |
| **Testing** | Node.js Automated E2E Test Suite (`server/test_e2e.js`) |

---

##  Repository Structure

```
MERN/
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── components/         # Navbar, ProtectedRoute, AdminRoute, DestinationCard, PackageCard, etc.
│   │   ├── context/            # AuthContext (JWT session, login, adminLogin, register, logout)
│   │   ├── layouts/            # RootLayout (Navbar, Outlet, Footer, Toaster)
│   │   ├── pages/              # Home, Destinations, DestinationDetails, Packages,
│   │   │                       # PackageDetails, BookingFlow (Checkout), BookingConfirmation,
│   │   │                       # MyBookings, Favorites, TripPlanner, TripNew, TripDetail,
│   │   │                       # Login, Register, Dashboard, About, Contact, NotFound
│   │   │   └── admin/          # AdminDashboard, AdminBookings, AdminUsers,
│   │   │                       # AdminDestinations, AdminPackages, AdminLogin
│   │   ├── services/           # api.js (Axios API client with JWT Bearer interceptor)
│   │   ├── App.jsx             # Route registry & ProtectedRoute / AdminRoute guards
│   │   ├── main.jsx            # React root entrypoint
│   │   └── index.css           # Tailwind CSS directives & media print styles
│   ├── .env.example            # Frontend environment variable template
│   └── package.json
│
├── server/                     # Express API Server
│   ├── src/
│   │   ├── config/             # db.js (Mongoose connection)
│   │   ├── models/             # User, Booking, Payment, Destination, TourPackage, Trip, Favorite
│   │   ├── controllers/        # authController, paymentController, bookingController,
│   │   │                       # adminController, destinationController, packageController, tripController
│   │   ├── middleware/         # auth.js (protect, authorize, optionalProtect), errorHandler.js
│   │   ├── routes/             # authRoutes, paymentRoutes, bookingRoutes, adminRoutes, etc.
│   │   ├── seed/               # seed.js, seedData.js
│   │   ├── app.js              # Express app definition & middleware
│   │   └── server.js           # Server bootstrap
│   ├── test_e2e.js             # Automated E2E test suite (21 test cases)
│   ├── .env.example            # Backend environment variable template
│   └── package.json
│
├── package.json                # Root orchestration scripts
└── README.md                   # Complete documentation
```

##  Getting Started

### 1. Database Seeding

Populate MongoDB with default destinations, tour packages, sample payments, and demo user accounts.

```bash
# From the project root
npm run seed

# Alternatively
cd server && npm run seed
```

### 2. Launching the Application

Run both the backend and frontend concurrently from the project root:

```bash
npm run dev
```

Alternatively, run them individually in separate terminals.

**Terminal 1 – Backend API Server**

```bash
cd server
npm run dev
```

**Terminal 2 – Frontend Client**

```bash
cd client
npm run dev
```

### 3. Access the Application

Once both servers are running, open your browser:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000



---

## Automated Testing

An automated end-to-end test suite is included in `server/test_e2e.js`:
```bash
cd server
npm test
```
The test suite validates:
1. User registration with field validation.
2. Prevention of role escalation during public registration.
3. Duplicate email rejection.
4. Cryptographic password hashing in MongoDB.
5. User login and JWT token issuance.
6. Invalid credentials rejection.
7. Role-based authorization: normal users blocked from admin endpoints with 403 Forbidden.
8. Unauthenticated requests to private endpoints blocked with 401 Unauthorized.
9. Administrator login with seeded admin credentials.
10. Administrative stats querying.
11. Administrative user directory retrieval.
12. Tour package booking creation with pending payment status.
13. Authoritative server-side price calculation.
14. Payment order generation.
15. Payment signature verification and transition to confirmed and paid.
16. Idempotency against duplicate payment confirmations.
17. Cross-user access prevention (users cannot view another user's bookings).
18. Downloadable receipt retrieval.
19. Cancellation and refund evaluation.
20. Administrative booking inspection.

---


---

##  Payment Gateway Demonstration Guide

1. Sign in as a traveler at `/login`.
2. Browse **Tour Packages** (`/packages`) and click on any package (e.g., *Ooty Nilgiri Tea & Heritage Escape*).
3. On the package details page, review itinerary and click **Proceed to Checkout & Payment**.
4. On the **Review & Secure Checkout** page (`/packages/:slug/book`):
   - Choose a departure date.
   - Adjust traveler count (observe live subtotal recalculation).
   - Enter optional contact phone and special requests.
   - Review cancellation terms and click **Proceed to Secure Payment**.
5. The gateway modal will appear with the generated **Order ID**:
   - Click **Simulate Successful Payment** (or test live Razorpay checkout if test keys are configured).
   - The backend cryptographically validates the payment signature and transitions the reservation to `Confirmed` and `PAID`.
6. You will be redirected to the **Booking & Payment Confirmation** screen (`/booking-confirmation/:id`).
7. Click **Download / Print Receipt** to view the formal receipt and test printing or saving as PDF.
8. Go to **My Bookings** (`/my-bookings`) to view reservation status, filter by status, or test cancellation with refund policy calculation.
9. Sign in as Administrator at `/admin/login` to inspect the verified booking in **Customer Bookings Management** (`/admin/bookings`) with transaction references and updated gross revenue.
