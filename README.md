# 🩸 Blood Donation Community

**A Community-Powered Blood Donation Management Platform**

A fully client-side web application designed to **connect voluntary blood donors with patients in urgent need** and to **manage community-driven blood donation events efficiently**. The entire system runs in the browser with **Firebase Realtime Database & Authentication** — no backend server required.

🔗 **Live Site:** [blood-donation-community.vercel.app](https://blood-donation-community.vercel.app)

---

## 🌟 Key Features

### 🔐 Donor Registration & Authentication
- Secure email/password registration & login
- Profile management with personal details, blood group, location
- Last donation tracking with automatic eligibility indicator (90-day rule)
- Change password from profile page
- Account deletion option

### 🔎 Smart Donor Search
- Filter donors by blood group (A+, A−, B+, B−, O+, O−, AB+, AB−)
- Toggle to show only currently eligible donors
- Quick access to verified donor contact details

### 🛡️ Admin Dashboard
- Create, update, and delete donation events
- Edit and manage all donor profiles
- Log verified recent donations
- Automatically update the **Lives Helped** counter
- Download **Monthly PDF Report** with charts and donation data

### 📊 Live Analytics
- Real-time visual charts powered by Chart.js:
  - Donor age group distribution
  - Blood group availability breakdown
  - Monthly donation trends
- Animated stat counters (Registered Donors, Lives Helped, Events)

### 📈 Visitor Tracking
- **Total page views** counter (incremented once per session on home page only)
- **Real-time online users** count using Firebase presence system
- Displayed above the footer on every page
- Dedicated [Visitor Statistics](visitor-stats.html) page with full details

### 🧾 Certificates & Donor Card
- Generate personalized blood donation certificates
- Download digital donor ID card
- Instant download and share

### 🌐 Bilingual Interface
- Full **English & Bangla** language support
- One-click language toggle across all pages

### 📝 Feedback System
- Collect visitor feedback from any page
- Timestamped entries stored in Firebase

### 📱 Responsive Design
- Fully responsive across mobile, tablet, and desktop
- Mobile hamburger menu with smooth transitions
- Back-to-top button and scroll animations

---

## 📂 Project Structure

```
Blood Donation Community/
├── index.html              # Home page (hero, stats, search, admin dashboard)
├── about.html              # About the community
├── donationGuide.html      # Blood donation guide & FAQs
├── events.html             # Public events listing
├── join.html               # Donor registration form
├── search.html             # Standalone donor search page
├── profile.html            # User profile (edit, certificate, change password)
├── certificate.html        # Certificate viewer
├── donor.html              # Donor card viewer
├── pdf.html                # PDF report viewer
├── visitor-stats.html      # Visitor analytics page
├── README.md
├── assets/
│   ├── css/
│   │   ├── common.css      # Shared styles (header, footer, modals, visitor bar)
│   │   ├── index.css       # Home page specific styles
│   │   ├── events.css      # Events page styles
│   │   ├── join.css        # Join form styles
│   │   └── profile.css     # Profile page styles
│   └── js/
│       ├── app.js           # Main app entry (home, events, join pages)
│       ├── page-common.js   # Shared logic for secondary pages
│       ├── profile.js       # Profile page logic
│       ├── viewport.js      # Viewport detection utilities
│       └── modules/
│           ├── firebase-config.js   # Firebase configuration
│           ├── auth.js              # Authentication logic
│           ├── admin.js             # Admin dashboard functions
│           ├── carousel.js          # Recent donors carousel
│           ├── certificate.js       # Certificate & donor card generation
│           ├── chart-config.js      # Chart.js configuration
│           ├── dashboard.js         # Dashboard charts & refresh
│           ├── events-render.js     # Event rendering
│           ├── feedback.js          # Feedback modal & submission
│           ├── header.js            # Header & mobile menu
│           ├── join-form.js         # Registration form handling
│           ├── language-config.js   # Translation strings (EN/BN)
│           ├── language-ui.js       # Language switcher UI
│           ├── modals.js            # Modal open/close utilities
│           ├── pdf-report.js        # Monthly PDF report generator
│           ├── preloader.js         # Page loader animation
│           ├── search.js            # Donor search logic
│           ├── state.js             # Shared application state
│           ├── stats-counter.js     # Animated number counters
│           ├── float-observer.js    # Scroll-triggered animations
│           ├── back-to-top.js       # Back to top button
│           ├── utils.js             # Utility functions
│           └── visitor-tracker.js   # Visitor count & online presence
└── image/
    ├── blood-drop.png       # Logo / favicon
    └── sign.png             # Signature for certificates
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, Vanilla JavaScript (ES Modules) |
| **Styling** | Tailwind CSS (CDN), Bootstrap 4 utilities, Custom CSS |
| **Backend** | Firebase v10 (Realtime Database, Authentication, Analytics) |
| **Charts** | Chart.js 4.4.x |
| **PDF Export** | jsPDF 2.5.x |
| **Hosting** | Vercel (static deployment) |
| **Icons** | Font Awesome 6.5.x |
| **Fonts** | Google Fonts (Inter, Dancing Script) |

---

## 🗄️ Firebase Database Structure

```json
{
  "donors": { "<uid>": { "fullName": "", "bloodGroup": "", "location": "", "phone": "", ... } },
  "events": { "<eventId>": { "title": "", "date": "", "location": "", ... } },
  "recentDonations": { "<id>": { "name": "", "bloodGroup": "", "date": "", ... } },
  "stats": { "livesHelped": 0 },
  "feedback": { "<id>": { "name": "", "email": "", "message": "", "timestamp": "" } },
  "visitorTracking": {
    "totalViews": 0,
    "presence": { "<sessionId>": true }
  }
}
```

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/mueidshahriar/Blood-Donation-Community.git
   cd Blood-Donation-Community
   ```

2. **Set up Firebase**
   - Create a project at [Firebase Console](https://console.firebase.google.com)
   - Enable **Authentication** (Email/Password)
   - Create a **Realtime Database**
   - Copy your config into `assets/js/modules/firebase-config.js`

3. **Deploy**
   - Push to GitHub and connect to [Vercel](https://vercel.com) for instant deployment
   - Or simply open `index.html` in a browser (with a local server for ES modules)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit and push your changes
4. Submit a Pull Request with a short description

---

## 📜 License

This project is released under the **MIT License** — free to use, modify, and distribute.

---

## 📞 Contact

**Md. Mueid Shahriar**
- 📧 Email: [mdmueidshahriar16@gmail.com](mailto:mdmueidshahriar16@gmail.com)
- 🔗 GitHub: [github.com/mueidshahriar](https://github.com/mueidshahriar)
- 🌐 Live: [blood-donation-community.vercel.app](https://blood-donation-community.vercel.app)

---

> ✨ *Together, we can save lives — one donation at a time.*
