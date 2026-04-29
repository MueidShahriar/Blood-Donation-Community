# 🩸 Blood Donation Community

**A Community-Powered Blood Donation Management Platform**

A fully client-side web application designed to **connect voluntary blood donors with patients in urgent need** and to **manage community-driven blood donation events efficiently**. The entire system runs in the browser with **Firebase Realtime Database & Authentication** — no backend server required.

Live Site: [blood-donation-community.vercel.app](https://blood-donation-community.vercel.app)

---

## Key Features

### Donor Registration & Authentication
- Secure email/password registration & login
- Profile management with personal details, blood group, location
- Last donation tracking with automatic eligibility indicator (90-day rule)
- Change password from profile page
- Account deletion option

### Smart Donor Search
- Filter donors by blood group (A+, A−, B+, B−, O+, O−, AB+, AB−)
- Toggle to show only currently eligible donors
- Available on the public Search page and inside the Admin Dashboard (Find Donors tab)

### Admin Dashboard
- Overview cards for total members, admins, donations, and events
- Click overview cards to open the right tab and filter the list
- Create, update, and delete donation events
- Edit and manage all donor profiles
- Promote or demote admins
- Log verified recent donations (auto-syncs to donor profile)
- Download Monthly PDF report with charts and donation data (includes donor contact when available)

### Recent Donation Tracking
- Admin records recent donations by donor ID or manual entry
- Recent donation details are shown on the donor profile
- Admin recent donation list shows contact number when provided

### Live Analytics
- Real-time visual charts powered by Chart.js:
   - Donor age group distribution
   - Blood group availability breakdown
   - Monthly donation trends
- Animated stat counters (Registered Donors, Lives Helped, Events)

### Visitor Tracking
- Total page views counter (incremented once per session on home page only)
- Real-time online users count using Firebase presence system
- Displayed above the footer on every page
- Dedicated Visitor Statistics page with full details

### Certificates & Donor Card
- Generate personalized blood donation certificates
- Download digital donor ID card

### Bilingual Interface
- Full English & Bangla language support
- One-click language toggle across all pages

### AI Chatbot Assistant
- Smart donor finder by blood group
- Answers blood donation, eligibility, and health questions
- Supports Bangla, Banglish, and English

### Feedback System
- Collect visitor feedback from any page
- Timestamped entries stored in Firebase

### Responsive Design
- Fully responsive across mobile, tablet, and desktop
- Mobile hamburger menu with smooth transitions
- Back-to-top button and scroll animations

---

## Project Structure

```
Blood Donation Community/
├── index.html
├── pages/
│   ├── 404.html
│   ├── about.html
│   ├── certificate.html
│   ├── donationGuide.html
│   ├── donor-card.html
│   ├── donor.html
│   ├── events.html
│   ├── join.html
│   ├── pdf.html
│   ├── preloader.html
│   ├── profile.html
│   ├── search.html
│   └── visitor-stats.html
├── assets/
│   ├── css/
│   │   ├── about.css
│   │   ├── common.css
│   │   ├── donationGuide.css
│   │   ├── events.css
│   │   ├── index.css
│   │   ├── join.css
│   │   ├── main.css
│   │   └── profile.css
│   └── js/
│       ├── app.js
│       ├── page-common.js
│       ├── profile.js
│       ├── viewport.js
│       ├── pages/
│       │   ├── events.js
│       │   ├── join.js
│       │   ├── search.js
│       │   ├── static-page.js
│       │   └── visitor-stats.js
│       └── modules/
│           ├── admin.js
│           ├── auth.js
│           ├── back-to-top.js
│           ├── carousel.js
│           ├── certificate.js
│           ├── chart-config.js
│           ├── chatbot.js
│           ├── dashboard.js
│           ├── events-render.js
│           ├── feedback.js
│           ├── firebase-config.js
│           ├── float-observer.js
│           ├── footer.js
│           ├── header.js
│           ├── join-form.js
│           ├── language-config.js
│           ├── language-ui.js
│           ├── modals.js
│           ├── pdf-report.js
│           ├── preloader.js
│           ├── search.js
│           ├── state.js
│           ├── stats-counter.js
│           ├── utils.js
│           └── visitor-tracker.js
└── image/
      ├── blood-drop.png
      └── sign.png
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Vanilla JavaScript (ES Modules) |
| Styling | Tailwind CSS (CDN), Bootstrap 4 utilities, Custom CSS |
| Backend | Firebase v10 (Realtime Database, Authentication, Analytics) |
| Charts | Chart.js 4.4.x |
| PDF Export | jsPDF 2.5.x |
| Hosting | Vercel (static deployment) |
| Icons | Font Awesome 6.5.x |
| Fonts | Google Fonts (Inter, Dancing Script) |

---

## Firebase Database Structure

```json
{
   "donors": {
      "<uid>": {
         "fullName": "",
         "email": "",
         "bloodGroup": "",
         "location": "",
         "phone": "",
         "role": "member",
         "donorId": "BDC-001",
         "lastDonateDate": "YYYY-MM-DD",
         "lastDonationInfo": {
            "date": "YYYY-MM-DD",
            "bloodGroup": "",
            "location": "",
            "department": "",
            "batch": "",
            "age": "",
            "height": "",
            "weight": "",
            "donorId": "BDC-001"
         },
         "isPhoneHidden": false,
         "publicComment": ""
      }
   },
   "events": { "<eventId>": { "title": "", "date": "", "location": "", "time": "", "description": "" } },
   "recentDonations": {
      "<id>": {
         "name": "",
         "bloodGroup": "",
         "location": "",
         "department": "",
         "batch": "",
         "age": "",
         "height": "",
         "weight": "",
         "phone": "",
         "date": "",
         "donorId": ""
      }
   },
   "stats": { "livesHelped": 0, "donorIdCounter": 0 },
   "feedback": { "<id>": { "name": "", "email": "", "message": "", "timestamp": "" } },
   "visitorTracking": {
      "totalViews": 0,
      "presence": { "<sessionId>": true }
   }
}
```

---

## Getting Started

1. Clone the repository
    ```bash
    git clone https://github.com/mueidshahriar/Blood-Donation-Community.git
    cd Blood-Donation-Community
    ```

2. Set up Firebase
    - Create a project at [Firebase Console](https://console.firebase.google.com)
    - Enable Authentication (Email/Password)
    - Create a Realtime Database
    - Copy your config into `assets/js/modules/firebase-config.js`

3. Run locally
    - Use a local server (ES Modules require it)
    - Then open `index.html` in the browser

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch
    ```bash
    git checkout -b feature/your-feature-name
    ```
3. Commit and push your changes
4. Submit a Pull Request with a short description

---

## License

This project is released under the MIT License — free to use, modify, and distribute.

---

## Contact

Md. Mueid Shahriar
- Email: [mdmueidshahriar16@gmail.com](mailto:mdmueidshahriar16@gmail.com)
- GitHub: [github.com/mueidshahriar](https://github.com/mueidshahriar)
- Live: [blood-donation-community.vercel.app](https://blood-donation-community.vercel.app)

---

Together, we can save lives — one donation at a time.
