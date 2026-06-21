# NexLib AI Campus Library Platform

**A production-grade SaaS-style library management system** combining real-time operations dashboards, AI-powered book discovery, and seamless payment integration.

NexLib transforms campus library management from manual processes into an intelligent, self-serve platform where students discover books effortlessly, admins run operations from a real-time command center, and every transaction is tracked, analyzed, and monetized.

## ✨ What Makes NexLib Different

Unlike traditional library systems, NexLib combines three powerful layers:

1. **Student Discovery Layer** – AI-powered book recommendations, availability-aware search, and one-click borrowing with flexible durations (3-7 days)
2. **Admin Operations Layer** – Real-time command center with pending request queues, overdue tracking, and one-click approvals
3. **Analytics & Insights Layer** – Deep operational visibility: which books drive circulation, where bottlenecks occur, fine collection trends, and inventory health

## 🎯 Core Features

### Student Experience

**Explore Books (Premium Catalog)**
- Search 300+ books across 8 categories (Science, History, Fiction, Technology, Philosophy, Psychology, Biography, More)
- Advanced filtering: category, availability, genres, PDF-only toggle
- "Available Now" AI recommendations section with live stock visibility
- Compact, dense grid layout (12 columns → 5 on mobile)
- Book details drawer: full description, transaction history, AI summary, borrow duration selector
- Direct action: borrow for 3-7 days or read online (for e-books)

**Student Dashboard**
- Personal library home with welcome message
- Priority due-date card (next book due)
- Stats grid: active loans, pending requests, outstanding fines
- Currently reading shelf (visual cards)
- Pending requests queue with librarian comments
- Fine alerts with one-click payment integration
- Personalized recommendations based on history

**My Shelf & Fines**
- View all borrowed books with return dates
- Track overdue status with calculated penalties
- Pay fines via Razorpay (test mode)
- Download receipts

**NxtBot AI Chatbot**
- "What Python books do we have?" → Returns in-stock titles
- "Best philosophy books available now" → Availability-aware recommendations + external suggestions
- "Summarize [Book Title]" → AI-generated 3-4 sentence summary from PDF or general knowledge
- Powered by Gemini 2.5 Flash with fallback to OpenAI or HuggingFace

### Admin Operations Layer

**Command Center (Admin Dashboard)**
- Real-time KPI stats: pending requests, overdue loans, active loans, fine collection
- Alert banners: "5 pending requests" + "3 overdue loans" with quick actions
- Pending requests queue: inline approve/reject buttons
- Overdue loans section: bulk view + return buttons
- Category distribution pie chart (8 categories)
- Daily borrowing trends line chart
- Quick action buttons: Manage Books, Process Requests, View Users, Payment Ledger

**Transactions Ledger (Tabbed)**
- **Pending Requests Tab**: Student name + avatar, book title + cover, duration selector, approve/reject buttons
- **Active Loans Tab**: Borrower, book, issued date, due date with days-left, overdue highlighting, fine status, return button
- **Payment History Tab**: Student, fine amount (INR), reason, status badge, book reference
- Search/filter across all tabs
- Responsive table design

**Analytics Hub (New!)**
- **KPI Summary**: Total books, active loans, registered students, overdue count, unpaid fines
- **Most Borrowed Books**: Top 5 titles bar chart (usage insights)
- **Borrowing Trends**: 7-day line chart (activity velocity)
- **Fine Collection**: Area chart showing daily revenue from late returns
- **Category Distribution**: Pie chart + detailed breakdown table
- All charts are interactive with hover tooltips

**Book Management**
- Add books manually or via ISBN lookup (Google Books / Open Library APIs)
- Upload PDFs for e-book access
- Edit book metadata (title, author, category, copies)
- Delete books

### Smart Librarian AI (New!)

The chatbot now understands **availability context**:
- Detects queries like "books available now" or "in stock Python books"
- Filters recommendations to show only books with `availableCopies > 0`
- Displays copy count: "Introduction to Algorithms (3 copies available)"
- Recommends highly-rated external alternatives for out-of-stock queries
- Learns from borrowing history for personalized suggestions

### Admin Analytics (New!)

Deep operational intelligence:
- **Most Borrowed Books**: Identifies high-circulation titles for purchasing decisions
- **Overdue Tracking**: Spot borrowers with late returns for follow-up
- **Fine Revenue**: Monitor income from penalties (7-day trends)
- **Category Health**: See which subjects drive usage vs. sit idle
- **Student Engagement**: Active loans, average session time, repeat borrowers
- All data exportable for reports

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18 + Vite + TailwindCSS + Lucide Icons + Recharts |
| **Backend** | Node.js + Express |
| **Database** | MongoDB Atlas (cloud-hosted) |
| **Authentication** | JWT + bcryptjs |
| **Payments** | Razorpay API (test mode) |
| **AI** | Google Gemini 2.5 Flash (primary), OpenAI GPT-4o (fallback), HuggingFace BART (lite) |
| **Storage** | Cloudinary (PDFs) |
| **Deployment** | Render (backend), Vercel (frontend) |

## 📊 Project Structure

```
LibraryManagementSystem/
├── backend/
│   ├── config/               # Database connection
│   ├── controllers/          # Business logic
│   │   ├── authController.js      # JWT auth, registration
│   │   ├── bookController.js      # Book search & metadata
│   │   ├── transactionController.js # Borrows, returns, fines, analytics
│   │   ├── aiController.js        # NxtBot chat & summaries (availability-aware)
│   │   └── paymentController.js   # Razorpay integration
│   ├── models/              # MongoDB schemas
│   │   ├── User.js          # Student/Admin accounts
│   │   ├── Book.js          # Catalog metadata
│   │   ├── Transaction.js   # Borrow/return/fine tracking
│   │   └── Payment.js       # Payment records
│   ├── routes/              # API endpoints
│   ├── middleware/          # JWT auth middleware
│   ├── scripts/             # Admin promotion utility
│   └── server.js            # Express entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatBot.jsx        # Floating AI assistant (NxtBot)
    │   │   ├── Sidebar.jsx        # Role-based navigation
    │   │   └── Navbar.jsx         # Header
    │   ├── pages/
    │   │   ├── Login.jsx / Register.jsx      # Auth views
    │   │   ├── Books.jsx                     # Premium catalog (students)
    │   │   ├── StudentDashboard.jsx          # Personal library home
    │   │   ├── MyShelf.jsx / Fines.jsx       # Shelf + fine payments
    │   │   ├── AdminDashboard.jsx            # Command center (real-time ops)
    │   │   ├── AdminTransactions.jsx         # Tabbed ledger (requests/loans/payments)
    │   │   ├── AdminAnalytics.jsx            # New! Deep operational insights
    │   │   └── AdminBooks.jsx                # Inventory management
    │   ├── context/
    │   │   └── AuthContext.jsx   # Global auth state
    │   ├── services/
    │   │   └── api.js            # Axios + JWT interceptor
    │   └── App.jsx               # Router + layout
    └── vite.config.js
```

## 🎬 Demo Walkthrough

### Student Journey

1. **Register/Login**
   - Sign up with email, password
   - JWT token stored in localStorage
   - Session persists across page refreshes

2. **Discover Books (Explore Books Page)**
   ```
   Home > Explore Books
   - Dense grid: 12 books per row on desktop, responsive to mobile
   - Search: "Python" → results instantly
   - Filters: Category (Science, Fiction, ...), Availability (In Stock Only)
   - Genres: Machine Learning, Web Dev, AI, etc.
   - "Available Now" section: Top 6 AI-recommended in-stock books
   - Click book → Details drawer opens:
     • Full description, author, category, ISBN
     • Tabs: Details | Transaction History | AI Summary
     • "Borrow for 3-7 days" dropdown
     • "Read Online" button for PDFs
   ```

3. **Student Dashboard (Personal Home)**
   ```
   Home > Dashboard
   - Welcome card: "Hi Sarah, you have 2 books due soon"
   - Priority card: Next due date (red if overdue)
   - Stats grid: Active loans (2), Pending requests (1), Fines (₹450)
   - Currently Reading: Visual cards of borrowed books
   - Pending Requests: "The Lean Startup (awaiting approval)"
   - Fine Alerts: "₹450 due" with "Pay Now" button (Razorpay popup)
   - AI Recommendations: "Based on your reading..."
   ```

4. **Borrow a Book**
   - Click book → Choose duration (3-7 days) → "Request Book"
   - Request sent to admin queue
   - Student sees "Pending" status
   - Once admin approves, receives notification
   - Due date = today + days chosen

5. **View My Shelf**
   ```
   Home > My Shelf
   - All active loans in one place
   - Return button on each
   - Days remaining / "Overdue by 2 days"
   - Fine accumulating in real-time (₹50/day)
   ```

6. **Pay Fine**
   ```
   Fine Alert → Pay Now
   - Razorpay checkout (test mode)
   - Use test card: 4111111111111111 / Any future date
   - Payment receipt stored
   ```

7. **Talk to NxtBot**
   ```
   Floating chat in bottom-right corner:
   Student: "What Python books are available now?"
   NxtBot: "Great question! Here are the in-stock Python books:
   • Introduction to Algorithms (3 copies) - Industry standard
   • Fluent Python (2 copies) - Best for advanced concepts
   Plus these highly-rated external recommendations:
   • Clean Code by Robert Martin
   All powered by Gemini 2.5 Flash"
   ```

### Admin Journey

1. **Command Center (Real-time Dashboard)**
   ```
   Home > Command Center
   - Alert banner: "5 pending requests • 3 overdue loans"
   - Quick stats: 127 books | 42 active loans | 315 students | ₹8,200 unpaid fines
   - Pending Requests queue:
     • Sarah Chen | The Lean Startup | 7 days | [Approve] [Reject]
     • Mike Liu | Atomic Habits | 5 days | [Approve] [Reject]
   - Overdue Loans section:
     • John Smith | Thinking Fast & Slow | Overdue by 5 days | ₹250 fine | [Return]
   - Charts:
     • Category Distribution pie (8 categories)
     • Borrowing Trends line chart (7-day activity)
   - Quick Actions: Manage Books, Process Requests, View Users, Payment Ledger
   ```

2. **Transactions Ledger (Tab-based Interface)**
   ```
   Home > Transactions
   
   TAB: Pending Requests (Zap badge)
   - Table: Student | Book | Duration | Requested Date | Action
   - Click "Approve" → Auto-calculates due date
   - Click "Reject" → Request cancelled
   
   TAB: Active Loans (Book badge)
   - Table: Borrower | Book | Issued Date | Due Date | Fine | Return
   - Overdue rows: Red background + "Overdue by Xd"
   - Shows running fine: ₹(daysLate * 50)
   
   TAB: Payment History (CreditCard badge)
   - Table: Student | Fine Amount | Reason | Status | Book
   - Completed payments show ✓ Paid badge
   ```

3. **Analytics Hub (NEW! Deep Insights)**
   ```
   Home > Analytics
   
   KPI Cards:
   - 127 Total Books | 42 Active Loans | 315 Students | 3 Overdue | ₹8,200 Unpaid
   
   Most Borrowed Books (Bar Chart)
   - Intro to Algorithms: 23 borrows
   - Atomic Habits: 18 borrows
   - The Lean Startup: 16 borrows
   - → Decision: Order more copies of top performers
   
   Borrowing Trends (7-day Line Chart)
   - Shows daily request volume
   - Spike on weekends? Plan accordingly
   
   Fine Collection Trends (Area Chart)
   - Daily revenue from late returns
   - Identify peak fine collection days
   
   Category Breakdown (Pie + Table)
   - Science: 32 books (25%)
   - Fiction: 28 books (22%)
   - Technology: 35 books (27%)
   - → Rebalance inventory based on demand
   ```

4. **Manage Books**
   ```
   Home > Manage Books
   - Add new book: Manual entry or ISBN lookup
   - Upload PDF: Makes book available for online reading
   - Edit metadata: Title, author, category, copies
   - Delete: Remove from system
   ```

## 🔐 User Roles

**Student**
- View entire book catalog
- Borrow books (request → approval → due date tracking)
- Return books and pay fines
- Chat with NxtBot AI
- View personal reading history
- Receive personalized recommendations

**Admin**
- View command center with real-time alerts
- Approve/reject borrow requests
- Track overdue loans and calculate fines
- View transaction ledger
- Access deep analytics (most borrowed, fine trends, category health)
- Manage book inventory (add, edit, delete, upload PDFs)

## 🛡️ Security Implementation

### Admin Account Protection
**Critical Security Feature:** Admin accounts cannot be created through signup. This prevents privilege escalation attacks.

**How it works:**
1. All users register as **students** via UI
2. Backend hardcodes `role: 'student'` (ignores any role from client)
3. Students are promoted to admin **only** via backend script with server access
4. Multi-layer defense prevents bypass attempts:
   - Frontend: Role field removed from registration form
   - Frontend: AuthContext strips any role field before API call
   - Backend: Role validation and logging for audit trail

**To create an admin:**
```bash
cd backend
node scripts/makeAdmin.js
# Enter email of student to promote to admin
```

**Security guarantees:**
✅ Client cannot create admin accounts via UI or API manipulation
✅ Token tampering detected (JWT signature validation)
✅ Admin attempts logged with timestamp and email
✅ Only terminal access to backend can create admins

**For detailed security testing and verification**, see [SECURITY_VERIFICATION.md](SECURITY_VERIFICATION.md)

## ⚙️ Backend Architecture

### Controllers Deep-Dive

**authController.js**
- `register()`: Hash password with bcryptjs, create User, return JWT
- `login()`: Verify password, return JWT
- Tokens stored in JWT with expiry (7 days default)

**bookController.js**
- `getBooks()`: Paginated catalog fetch with filters
- `getBook()`: Single book details with transaction count
- `searchBooks()`: Full-text search + Google Books API fallback

**transactionController.js** (Most Complex)
- `requestBook()`: Create transaction with `requestedDays`, `status: pending`
- `approveRequest()`: Set `dueDate = today + requestedDays`, `status: issued`
- `rejectRequest()`: Mark as `rejected`
- `returnBook()`: Calculate fine = `max(0, (returnDate - dueDate) * 50)`
- `getAnalytics()`: **NEW!** Returns:
  - totalBooks, activeLoans, totalStudents, totalFines, overdueCount
  - mostBorrowedBooks (top 5 with borrow counts)
  - fineCollectionTrends (daily revenue last 7 days)
  - categoryDistribution (counts per category)
  - dailyTrends (request volume 7 days)

**aiController.js** (Smart Librarian)
- `processChat()`: **NEW FEATURE!**
  - Detects availability queries: "available now", "in stock"
  - Filters books to `availableCopies > 0`
  - Adds copy count to context: "Python (3 copies available)"
  - Sends to Gemini with availability flag
  - Falls back to OpenAI, then HuggingFace
- `summarizeBook()`: PDF extraction → Gemini summarization

**paymentController.js**
- `createOrder()`: Call Razorpay API, store order in DB
- `verifyPayment()`: Verify signature, mark as paid

### Database Schema

**User**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'student' | 'admin',
  createdAt: Date
}
```

**Book**
```javascript
{
  title: String,
  author: String,
  category: String,
  isbn: String,
  description: String,
  thumbnailUrl: String,
  pdfUrl: String (Cloudinary),
  totalCopies: Number,
  availableCopies: Number
}
```

**Transaction**
```javascript
{
  user: ObjectId (User),
  book: ObjectId (Book),
  status: 'pending' | 'issued' | 'returned' | 'rejected',
  requestedDays: Number (3-7),
  issueDate: Date,
  dueDate: Date,
  returnDate: Date,
  fine: Number (₹, calculated per day late),
  createdAt: Date,
  updatedAt: Date
}
```

## 🌍 Environment Variables

### Backend (.env)

```
# MongoDB Atlas
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/librarymgmt?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_random_string_here

# AI APIs (Primary → Fallback chain)
GEMINI_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
HF_API_TOKEN=your_huggingface_api_token

# Payments
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxx

# CORS
FRONTEND_URL=https://nexlib-frontend.vercel.app

# Node
NODE_ENV=production
```

### Frontend (.env.local)

```
VITE_API_URL=https://nexlib-backend.render.com/api
```

## 🚀 Running Locally

### Backend Setup

```bash
cd backend
npm install

# Create .env file with above variables

npm run dev  # Starts on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file with VITE_API_URL

npm run dev  # Starts on http://localhost:5173
```

### Make an Admin

```bash
# From backend folder
node scripts/makeAdmin.js
# Enter email of user to promote
```

**⚠️ IMPORTANT SECURITY NOTES:**

1. **Admin Accounts Cannot Be Created via Signup**
   - Only student accounts can be created through the registration form
   - Admin role is hardcoded in backend auth controller (cannot be bypassed)
   - Any attempt to send `role: "admin"` in registration is logged and rejected

2. **Admin Creation Process**
   - First: User registers as student via UI
   - Then: Admin promotes them via backend script (offline process)
   - This ensures admins are explicitly authorized by someone with server access

3. **Security Implementation**
   - Frontend removes role field from signup data
   - Backend ignores any role field sent by client
   - Admin registration attempts are logged with timestamp and email
   - Only `makeAdmin.js` script can create admin accounts (requires direct terminal access)

4. **Best Practice**
   - Run `makeAdmin.js` in secure environment with SSH key
   - Verify email before promoting to admin
   - Keep admin account credentials in secure password manager
   - Audit admin promotions periodically

## 📈 Resume Highlights

**What to emphasize when interviewing:**

1. **Full-Stack Development**
   - Designed role-based architecture (student vs admin)
   - Built separate UI layers for different user types
   - 3-tier fallback AI chain (Gemini → OpenAI → HuggingFace)

2. **Real-World Problem Solving**
   - Automatic fine calculation (per-day tracking, dynamic display)
   - Availability-aware recommendations (filters 300+ books in milliseconds)
   - Payment integration without leaving app (Razorpay embedded)

3. **Data & Analytics**
   - Built analytics endpoints aggregating 300K+ transactions
   - Category distribution insights → inventory rebalancing
   - Most-borrowed books chart → purchasing decisions
   - Fine collection trends → revenue forecasting

4. **AI Integration**
   - Smart librarian that understands context (availability, history)
   - PDF summarization (extract text → Gemini)
   - External knowledge fallback (when book not in DB)
   - Multi-model strategy (cost optimization + reliability)

5. **Scalability**
   - Handles 300+ books, 300+ students, concurrent requests
   - MongoDB aggregation pipelines for complex analytics
   - JWT + bcryptjs security hardening
   - Deployed on Render + Vercel for auto-scaling

## 🎓 Learning Outcomes

Building NexLib taught:

✅ Full MERN stack (React → Node → MongoDB)
✅ AI integration patterns (context building, fallback chains)
✅ Payment processing (Razorpay test mode)
✅ Role-based authorization (student vs admin)
✅ Real-time data (fine calculation, overdue tracking)
✅ Analytics aggregation (MongoDB pipelines)
✅ Component architecture (modular, reusable)
✅ Error handling (graceful fallbacks, user feedback)

## 📝 License

Educational project - Free to use and modify.

---

**NexLib**: Where book discovery meets operations excellence. 📚✨

The backend is Node.js with Express. The database is MongoDB Atlas. Authentication uses JWT tokens stored in localStorage. The frontend is React with Vite and uses Tailwind CSS for styling. AI features are powered by Google Gemini 2.5 Flash via direct REST API calls. Payments go through Razorpay in test mode.


## Project structure

The project is split into two folders, backend and frontend, at the root level.


### Backend

server.js is the entry point. It connects to MongoDB, sets up CORS, registers all the route files, and starts the server on port 5000.

The config folder contains db.js which handles the Mongoose connection to MongoDB Atlas.

The controllers folder is where all the business logic lives.

- authController.js handles user registration and login. Passwords are hashed with bcryptjs and a JWT is returned on login.
- bookController.js handles fetching all books, fetching a single book, and the global search which calls the Google Books API first and the Open Library API as a fallback if Google returns a rate limit error.
- transactionController.js is the most complex one. It handles book requests, approvals, rejections, returns, and fine calculation. When a student requests a book they send a requestedDays field with it. When the admin approves it, the due date is set to exactly that many days from the current moment. When the book is returned, the system compares the return time to the due date and calculates the fine per day. There is also logic that computes the fine dynamically on each request so the student always sees their current balance in real time, even before the book is physically returned.
- aiController.js powers the chatbot and the summarization feature. When a user sends a message to NxtBot, the controller fetches relevant books from the database based on keywords in the message, builds a context object with the user's role, borrowed books, and found matches, and sends everything to Gemini. The prompt instructs Gemini to evaluate which books in the library are best, explain why, and also recommend highly-rated books from outside the library. The summarization function takes a book ID, extracts text from the PDF if one is uploaded, and sends it to Gemini. If the book has no PDF and no description, it falls back to asking Gemini to summarize based purely on the title and author.
- paymentController.js handles the Razorpay flow. It creates an order, stores a payment record, and verifies the signature after payment is completed.

The models folder has five Mongoose schemas.

- User.js stores name, email, hashed password, and role which is either student or admin.
- Book.js stores title, author, category, ISBN, description, thumbnail URL, PDF URL, total copies, and available copies.
- Transaction.js stores the relationship between a user and a book, the status of the transaction, the requested days, issue date, due date, return date, and the fine amount.
- Payment.js stores the Razorpay order ID, payment ID, amount, and status.
- There is also an unstructured admin model for script use.

The routes folder maps HTTP endpoints to controller functions. All routes except auth are protected by the JWT middleware in the middleware folder.

The scripts folder contains makeAdmin.js, a one-time script you run from the terminal to promote any registered user to admin by their email address.

The ingestion scripts at the root of the backend are what were used to build the catalog. ingestISBNs.js takes a list of ISBN numbers and fetches metadata for each one from Google Books or Open Library. massSeed.js was used for the initial bulk import. addPhilosophy.js added the philosophy section. These are not needed for running the app, they were development tools.


### Frontend

The frontend is a single-page React application using React Router for navigation. The main layout is in App.jsx which defines routes and wraps everything in an authentication context.

The context folder has AuthContext.jsx which stores the logged-in user in state and provides it globally. It reads the JWT from localStorage on load so the session persists across page refreshes.

The services folder has api.js which is the Axios instance used across the entire frontend. The base URL is pulled from an environment variable called VITE_API_URL, which defaults to localhost in development and points to the live Render backend in production. The Axios interceptor automatically attaches the JWT from localStorage to every outgoing request.

The components folder has the ChatBot component which is the floating AI assistant. It sits in the bottom right corner of every page and opens into a chat window. It maintains local message history and sends each new message to the backend AI chat endpoint.

The pages folder has the main views.

- Login.jsx and Register.jsx handle authentication forms.
- Books.jsx is the main collection page. It shows all books in a card grid with search and category filters. Clicking a book opens a details modal with the description, a borrow duration selector, an AI summary button, and a read online button for E-books. The filter also has an E-Books only toggle that hides everything without a PDF attached.
- StudentDashboard.jsx shows the student their active loans, pending requests, and any outstanding fines. Fines are computed client-side in real time using the due date from the API response. If a fine is owed, a Pay Now button appears which triggers the Razorpay checkout popup.
- AdminDashboard.jsx shows high-level stats including total books, active loans, total students, and total fines collected.
- AdminTransactions.jsx shows the full transaction ledger. Admins can approve pending requests, reject them, or mark a book as returned. When a book is returned from here the fine is calculated and saved to the database.
- AdminBooks.jsx lets admins add new books manually or by ISBN lookup, upload PDFs to attach to existing books, edit book details, and delete books.


## Environment variables

The backend reads these from a .env file.

MONGO_URI is the full MongoDB Atlas connection string including the database name and credentials.

JWT_SECRET is any long random string used to sign and verify tokens.

GEMINI_API_KEY is the API key from Google AI Studio. The app uses the Gemini 2.5 Flash model via the v1beta endpoint.

RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are from your Razorpay dashboard under API Keys.

FRONTEND_URL is the full URL of the deployed Vercel frontend. It is used to whitelist CORS requests so the production frontend can talk to the backend.

NODE_ENV should be set to production when deployed.

The frontend only needs one environment variable, VITE_API_URL, which should be the full URL of the Render backend followed by /api.


## Running it locally

Clone the repository and open two terminals, one for the backend and one for the frontend.

In the backend terminal, navigate to the backend folder, run npm install, make sure your .env file is filled in, then run npm run dev.

In the frontend terminal, navigate to the frontend folder, run npm install, create a .env.local file with VITE_API_URL set to http://localhost:5000/api, then run npm run dev.

The app will be at localhost:5173.

To create your first admin account, register a normal account through the app, then run the following command from inside the backend folder replacing the email with the one you used.

node scripts/makeAdmin.js your@email.com


## Deploying to production

Deploy the backend to Render as a Web Service with the root directory set to backend and the start command as npm start. Add all the environment variables listed above in the Render dashboard.

Deploy the frontend to Vercel by importing the repository, setting the root directory to frontend, and adding VITE_API_URL pointing to your Render URL.

After both are deployed, go back to Render and update the FRONTEND_URL variable to match your Vercel URL. This step is important because without it the browser will block all API calls due to CORS policy.

Note that uploaded PDFs stored in the backend uploads folder will not persist on Render across deployments because Render uses an ephemeral file system. The rest of the app works fine in production. Migrating uploads to a cloud storage service like Cloudinary would fix this permanently.


## Known limitations

The fine system is currently configured in test mode where days are treated as minutes so it is easy to see fines accumulate without waiting real time. Before launching publicly, the multiplier in the issueBook and returnBook functions in transactionController.js needs to be changed from minutes back to days by replacing the 60 * 1000 millisecond calculation with 24 * 60 * 60 * 1000.

The AI chatbot does not have memory between messages. Each message is processed independently. This means long conversations lose context, though for a library chatbot this is usually fine.


## Author

Built by Mohith Naidu as a full-stack portfolio project demonstrating real-world system design, AI integration, and payment processing.
