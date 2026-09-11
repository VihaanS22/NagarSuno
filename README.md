# NagarSuno 🏙️

**Your City. Your Voice.**

Developed by Vihaan ©

NagarSuno is a civic issue reporting and tracking web application that enables citizens to report local infrastructure problems and follow their progress while providing authorities with a dedicated dashboard to manage and resolve complaints.

🔗 **Live Demo:** https://vihaans22.github.io/NagarSuno/

---

## ✨ Features

### 👤 Citizen Portal

* Report civic issues such as road damage, garbage, drainage problems and faulty streetlights
* Select the city where the issue occurred
* Add an address, landmark and detailed description
* Attach a photo preview while reporting
* Receive a unique complaint tracking ID
* View registered complaints
* Track complaint progress through:

  * Submitted
  * Assigned
  * In Progress
  * Resolved
* View resolved complaints separately
* City-specific complaint statistics and filtering
* Real-time updates when authorities change complaint status

### 🛡️ Authority Portal

A protected Authority Dashboard allows authorised users to:

* View complaints across cities
* See complaint details and locations
* Monitor overall complaint statistics
* Change complaint status
* Update citizen-facing tracking information in real time

### 🔐 Demo Authority Access

The dedicated authority system is presented with temporary credentials for portfolio demonstration purposes.

**Email:** `head@cf.com`
**Password:** `admin1`

> These credentials are provided only for demonstration and testing of the portfolio project.

---

## 🛠️ Tech Stack

* **React**
* **Vite**
* **JavaScript**
* **Firebase Firestore**
* **Firebase Authentication**
* **Lucide React**
* **CSS**
* **GitHub Pages**

---

## 🔄 How It Works

```text
Citizen selects a city
        ↓
Reports a civic issue
        ↓
Complaint stored in Firestore
        ↓
Unique tracking ID generated
        ↓
Authority reviews complaint
        ↓
Status updated by Authority
        ↓
Citizen sees update in real time
        ↓
Issue marked as Resolved
```

---

## 🔒 Security

NagarSuno uses Firebase Authentication for Authority access and Firestore Security Rules to control database operations.

Citizens can submit and view complaints, while modification of existing complaint records is restricted to authenticated Authority users.

---

## 📍 City-Aware Experience

Users can select their city directly from the NagarSuno navigation interface.

The selected city automatically affects:

* New complaint submissions
* Registered complaint listings
* Resolved complaint listings
* Monthly complaint statistics
* Resolution statistics

The Authority Dashboard can continue to monitor complaints across all supported cities.



## 🔮 Future Scope

Potential future improvements include:

* Permanent cloud storage for complaint photographs
* Map-based issue location selection
* Authority assignment to individual departments
* Push/email status notifications
* Complaint priority and severity levels
* Analytics dashboards for civic authorities
* Citizen accounts and personal complaint history
* Expanded role-based access control

---

## 💡 Project Purpose

NagarSuno was developed as a portfolio project exploring how modern web technologies can be used to create a transparent communication workflow between citizens and civic authorities.

The project demonstrates frontend development, real-time cloud data, authentication, database security, responsive UI design and deployment through a complete working application.

---

## 👨‍💻 Developer

**Vihaan**

Built as a full-stack web development portfolio project.
