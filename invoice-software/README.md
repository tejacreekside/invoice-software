# Invoice Software Backend

A production-ready invoice management system built with Node.js, Express, Prisma, and PostgreSQL.

## Features

- User authentication with JWT
- Customer CRUD operations
- Product/Service management
- Invoice creation and management
- Automated invoice calculations (subtotal, tax, discount, total, balance due)
- Payment tracking
- Invoice status transitions
- Centralized business rules (invoiceRules module)
- Centralized calculations (invoiceCalculator module)

## Architecture

### Key Modules

- **invoiceCalculator**: Handles all financial calculations with safe numeric handling
- **invoiceRules**: Enforces business logic and status transitions
- **auth**: JWT token generation and validation
- **validation**: Request payload validation utilities

### Database Schema

- **Users**: User accounts with JWT authentication
- **Customers**: Customer information
- **Products**: Products/services for invoicing
- **Invoices**: Invoice records with status tracking
- **InvoiceItems**: Line items for each invoice

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Setup

### 1. Clone and Install

```bash
cd invoice-software
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/invoice_software"
JWT_SECRET="your_secure_random_key_here"
NODE_ENV="development"
PORT=3000
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates tables)
npm run prisma:migrate

# Optional: Open Prisma Studio to view/edit data
npm run prisma:studio
```

### 4. Build

```bash
npm run build
```

## Running Locally

### Development Mode (with hot reload)

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production Mode

```bash
npm run build
npm start
```

## Deployment

### Backend (Render Web Service)

1. Create a new Render Web Service from your GitHub repo.
2. Set the following settings:
   - **Root Directory**: `.` (repository root)
   - **Build Command**: `npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:migrate:prod && npm start`
3. Set environment variables:
   - `DATABASE_URL`: Your Render PostgreSQL database URL
   - `JWT_SECRET`: A secure random string
   - `CLIENT_URL`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or Render's default)

### Database (Render PostgreSQL)

1. Create a Render PostgreSQL database.
2. Copy the `DATABASE_URL` from the database settings.

### Frontend (Vercel)

1. Create a new Vercel project from your GitHub repo.
2. Set the following settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set environment variable:
   - `VITE_API_BASE_URL`: Your Render backend URL (e.g., `https://your-backend.onrender.com`)

### Custom Domain

1. In Vercel dashboard, go to your project settings.
2. Add your custom domain in the "Domains" section.
3. Follow Vercel's instructions to configure DNS.

## Testing

Run all tests:
```bash
npm test
```

Watch mode (re-run on file changes):
```bash
npm run test:watch
```

## API Endpoints

### Authentication

- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Login and get JWT token

### Customers

- `GET /customers` - List all customers
- `GET /customers/:id` - Get a single customer
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

### Products

- `GET /products` - List all products
- `GET /products/:id` - Get a single product
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Invoices

- `GET /invoices` - List user's invoices (supports `?status=draft` filter)
- `GET /invoices/:id` - Get a single invoice
- `POST /invoices` - Create new invoice
- `PUT /invoices/:id` - Update invoice
- `POST /invoices/:id/status` - Change invoice status
- `POST /invoices/:id/payment` - Record a payment

## Example Usage

### 1. Sign Up

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "name": "John Doe"
  }'
```

Response includes JWT token - save it for subsequent requests as `TOKEN`

### 2. Create a Customer

```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }'
```

Save the returned `id` as `CUSTOMER_ID`

### 3. Create Products

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Web Development",
    "description": "Custom web application development",
    "unitPrice": 100.00,
    "sku": "WEB-001"
  }'
```

Save the returned `id` as `PRODUCT_ID_1`. Create more products as needed.

### 4. Create an Invoice

```bash
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": "'$CUSTOMER_ID'",
    "issueDate": "2026-04-06",
    "dueDate": "2026-04-20",
    "items": [
      {
        "productId": "'$PRODUCT_ID_1'",
        "quantity": 10,
        "unitPrice": 100
      }
    ],
    "taxRate": 0.08,
    "discountAmount": 50,
    "notes": "Payment due within 14 days"
  }'
```

Save the returned `id` as `INVOICE_ID`

### 5. Update Invoice Status

```bash
curl -X POST http://localhost:3000/invoices/$INVOICE_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "sent"
  }'
```

### 6. Record a Payment

```bash
curl -X POST http://localhost:3000/invoices/$INVOICE_ID/payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amountPaid": 500
  }'
```

## Invoice Calculations

All invoices are calculated using the centralized `invoiceCalculator` module:

- **Subtotal** = Sum of (quantity × unitPrice) for all items
- **Tax Amount** = Subtotal × Tax Rate
- **Total** = Subtotal + Tax Amount - Discount
- **Balance Due** = Total - Amount Paid

Example:
- Items: 10 × $100 = $1,000
- Tax (8%): $80
- Discount: $50
- Total: $1,030
- After $500 payment: Balance Due = $530

## Invoice Status Flow

```
draft → sent → paid
    ↓       ↓      ↓
    └─→ cancelled ←─→ overdue
```

- **draft**: Initial state, fully editable
- **sent**: Sent to customer, still editable
- **paid**: Balance due is 0
- **overdue**: Balance due > 0 and past due date
- **cancelled**: Can be cancelled from most states, cannot be reversed

## Business Rules

1. **Only draft and sent invoices can be edited**
2. **Only draft invoices can be deleted**
3. **Customers with invoices cannot be deleted**
4. **Products used in invoices cannot be deleted**
5. **Due date must be on or after issue date**
6. **Discounts cannot exceed subtotal (unless allowed by custom rules)**
7. **Negative quantities, prices, or payments are rejected**
8. **Payment amounts must be positive and finite**

## Extending with Custom Rules

To add custom invoice rules:

1. Add logic to `src/lib/invoiceRules.ts` for business rules
2. Add calculations to `src/lib/invoiceCalculator.ts` for financial logic
3. Update route handlers to use the new rules
4. Add tests in `src/lib/__tests__/`

This keeps custom logic centralized and easy to maintain.

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful GET or UPDATE
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate unique constraints
- `500 Internal Server Error` - Server error

## Deployment

### Environment Variables for Production

```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
JWT_SECRET=[generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
NODE_ENV=production
PORT=3000
```

### Database Migration in Production

```bash
npm run prisma:migrate:prod
```

## Monitoring & Debugging

Enable detailed logging in development:

```bash
NODE_ENV=development npm run dev
```

Open Prisma Studio to inspect data:
```bash
npm run prisma:studio
```

## Type Safety

This project uses TypeScript throughout. Generated types from Prisma are available:

```typescript
import { Invoice, Customer, Product } from '@prisma/client';
```

## Contributing

Follow the coding rules in [.github/copilot-instructions.md](../.github/copilot-instructions.md):

- Keep diffs minimal
- Preserve backward compatibility
- Reuse existing patterns
- Ensure null safety
- Optimize for readability
- Put business logic in `invoiceRules`
- Put calculations in `invoiceCalculator`
- Include tests and edge cases

## License

Proprietary - Modisoft
