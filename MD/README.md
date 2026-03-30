# Online Donation Platform

A full-stack donation platform built with:

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB Atlas (or local MongoDB)
- Auth: JWT + bcrypt password hashing
- Payments: Razorpay order creation + signature verification
- Receipt: PDF receipt generation with PDFKit

## Features

### User Side

- Register/Login with JWT authentication
- Browse all active donation campaigns on homepage
- View campaign details (title, description, goal, funds raised)
- Donate using Razorpay Checkout
- Backend payment signature verification for secure transactions
- Donation saved to MongoDB after successful verification
- Digital receipt shown on success and downloadable as PDF
- User dashboard to view full donation history

### Admin Side

- Admin login using role-based access (`role: "admin"`)
- Create campaigns
- Edit campaigns
- Soft delete campaigns (`isActive: false`)
- View campaign fundraising values
- Monitor all platform donations and transactions

## Project Structure

```text
Online-Donation-Platform/
|-- backend/
|   |-- package.json
|   |-- .env.example
|   `-- src/
|       |-- config/
|       |-- controllers/
|       |-- middleware/
|       |-- models/
|       |-- routes/
|       |-- utils/
|       `-- server.js
|-- frontend/
|   |-- index.html
|   |-- campaign.html
|   |-- auth.html
|   |-- dashboard.html
|   |-- admin.html
|   `-- assets/
|       |-- css/styles.css
|       `-- js/*.js
`-- README.md
```

## Database Collections

### Users

- `name`
- `email`
- `password` (hashed)
- `role` (`user` or `admin`)

### Campaigns

- `title`
- `description`
- `goalAmount`
- `fundsRaised`
- `imageUrl`
- `isActive`

### Donations

- `user`
- `campaign`
- `amount`
- `transaction/order/signature IDs`
- `currency`
- `status`
- `donatedAt`

## Backend Setup

1. Open terminal in `backend`.
2. Install dependencies:

```bash
npm install
```

3. Create `.env` from `.env.example` and configure values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret
JWT_EXPIRES_IN=7d
ADMIN_BOOTSTRAP_SECRET=your_admin_bootstrap_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://127.0.0.1:5500
```

**Razorpay Setup:**
- Create a free account at [Razorpay Dashboard](https://dashboard.razorpay.com)
- Go to Settings > API Keys to find your test credentials
- Copy the `Key ID` (starts with `rzp_test_`) and `Key Secret`
- Paste them into the `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` variables in `.env`

4. Run backend:

```bash
npm run dev
```

Health check: `GET http://localhost:5000/api/health`

## Frontend Setup

Frontend is static and can be served using Live Server or any static host.

1. Open `frontend` folder with Live Server (or equivalent).
2. Ensure API URL in `frontend/assets/js/config.js` points to backend:

```js
window.APP_CONFIG = {
	API_BASE_URL: "http://localhost:5000/api",
};
```

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)
- `POST /api/auth/seed-admin` (bootstrap route)

### Campaigns

- `GET /api/campaigns`
- `GET /api/campaigns/:id`
- `POST /api/campaigns` (admin)
- `PUT /api/campaigns/:id` (admin)
- `DELETE /api/campaigns/:id` (admin)
- `GET /api/campaigns/admin/stats/summary` (admin)

### Donations

- `POST /api/donations/create-order` (protected)
- `POST /api/donations/verify` (protected)
- `GET /api/donations/me` (user)
- `GET /api/donations/admin/all` (admin)
- `GET /api/donations/:id/receipt` (owner/admin)

## Security Implemented

- Password hashing with bcrypt
- JWT authentication middleware
- Role-based authorization for admin endpoints
- Request validation using express-validator
- Payment signature verification using Razorpay key secret
- Protected receipt download access

## Workflow

1. User registers/logs in.
2. Campaigns are fetched on homepage.
3. User opens campaign and enters donation amount.
4. Razorpay checkout is launched.
5. Backend verifies payment signature.
6. Donation stored in MongoDB.
7. Campaign `fundsRaised` updated.
8. Digital receipt data displayed and PDF download available.

## Deployment

### Frontend

- Deploy `frontend` on Netlify or Vercel as static site.

### Backend

- Deploy `backend` on Render or Railway.
- Add environment variables from `.env.example`.

### Database

- Use MongoDB Atlas connection string in `MONGO_URI`.

## Important Notes

- For first admin account creation, call `POST /api/auth/seed-admin` with `adminSecret` matching `ADMIN_BOOTSTRAP_SECRET`.
- In production, lock `CLIENT_URL` to real frontend domain and use HTTPS for both frontend and backend.
- Rotate JWT and Razorpay secrets regularly.

## Troubleshooting

**"Internal Server Error" or "Failed to create order" when donating:**
- Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set to valid Razorpay test credentials
- Check that test credentials start with `rzp_test_` (not placeholder values)
- Verify MongoDB connection is active with health check: `GET http://localhost:5000/api/health`
- Check backend logs for detailed error messages

**MongoDB Connection Failed:**
- Ensure MongoDB is running (local) or connection string is correct (MongoDB Atlas)
- Test connection with: `npm run dev`

**JWT Authentication Issues:**
- Ensure `JWT_SECRET` is set and not empty
- JWT tokens expire after `JWT_EXPIRES_IN` duration (default 7d)


