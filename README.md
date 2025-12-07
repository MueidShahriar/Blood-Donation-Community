# 🩸 Blood Donation Community Platform

*A Community-Powered Blood Donation Management System*

A fully client-side web application designed to **connect voluntary blood donors with patients in urgent need** and to **manage community-driven blood donation events efficiently**. The entire system runs securely in the browser and stores data using **Firebase Realtime Database and Authentication**.

---

## 🌟 Key Features

### 🔐 Donor Registration & Authentication

* Secure email/password login system
* Profile management with last donation tracking
* Automatic eligibility indication (90+ days rule)

### 🔎 Smart Donor Search

* Filter donors by blood group
* Option to show only currently eligible donors
* Quick access to verified donor details

### 🛡️ Admin Dashboard

* Create, update, and manage donation events
* Approve and edit donor profiles
* Log verified recent donations
* Automatically update the **Lives Helped** counter

### 📊 Analytics & Reporting

* Live visual charts for:

  * Age distribution
  * Blood group availability
  * Monthly donation trends
* One-click **Monthly PDF Report** for administrators

### 🧾 Certificates & Sharing

* Generate blood donation certificates
* Download and share instantly
* **Bilingual interface** (English & Bangla)

### 📝 Feedback System

* Collect and store visitor feedback
* Timestamped entries for tracking and review

---

## ⚙️ Quick Start Guide (No Backend Server Required)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/mueidshahriar/Blood-Donation-Community.git
cd Blood-Donation-Community
```

### 2️⃣ Create a Firebase Project

* Enable **Authentication → Email/Password**
* Create a **Realtime Database** (start in locked mode)
* *(Optional)* Enable **Firebase Analytics**

### 3️⃣ Configure Firebase

* Open:

  ```
  assets/js/firebase-config.js
  ```
* Replace the placeholder keys with your Firebase credentials
* Set your admin email using:

  ```js
  const ADMIN_EMAIL = "your-email@example.com";
  ```

### 4️⃣ Run Locally Using Any Static Server

Because JavaScript modules are used, a server is required.

* **PowerShell**

  ```bash
  python -m http.server 8000
  ```

  Then open: `http://localhost:8000/bdc.html`

* **VS Code**
  Use the **Live Server** extension

* **Node.js**

  ```bash
  npx serve .
  ```

### 5️⃣ Deploy to a Hosting Platform

You may deploy to:

* Firebase Hosting
* Netlify
* Vercel
* GitHub Pages

⚠️ Remember to add your deployed domain inside:

```
Firebase Auth → Authorized Domains
```

---

## 🗂️ Firebase Database Structure

### ✅ Donors

```
donors/{uid}
```

Fields:

* fullName
* email
* phone
* bloodGroup
* location
* lastDonateDate
* gender
* isPhoneHidden
* role (admin / member)
* notes
* timestamps

---

### ✅ Events

```
events/{eventId}
```

Fields:

* title
* date
* time
* location
* description

---

### ✅ Recent Donations

```
recentDonations/{id}
```

Fields:

* name
* bloodGroup
* location
* department
* batch
* age
* weight
* date

---

### ✅ Statistics

```
stats/livesHelped
```

* Integer value increased whenever a verified donation is logged

---

### ✅ Feedback

```
feedback/{id}
```

Fields:

* name
* email
* message
* submittedAt
* userId (optional)

---

### 🔑 Admin Authorization

A user becomes an admin automatically if their email matches the value of:

```js
ADMIN_EMAIL
```

Their role is stored in:

```
donors/{uid}/role
```

---

## 🛠️ Technology Stack

* **Frontend:** HTML5 + Vanilla JavaScript (ES Modules)
* **Styling:** Tailwind CSS (CDN), Bootstrap 4 utilities, Custom CSS
* **Backend:** Firebase v10

  * Realtime Database
  * Authentication
  * Analytics (optional)
* **Charts & Exports:**

  * Chart.js 4.4.x
  * jsPDF 2.5.x (Reports & Certificates)

---

## 🤝 Contribution Guidelines

We welcome community contributions:

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

## 📞 Contact Information

👤 **Md. Mueid Shahriar**
📧 **Email:** [mdmueidshahriar16@gmail.com](mailto:mdmueidshahriar16@gmail.com)
🔗 **GitHub Project:**
[https://github.com/mueidshahriar/Blood-Donation-Community](https://github.com/mueidshahriar/Blood-Donation-Community)

---

✨ *Together, we can save lives — one donation at a time.*

---
