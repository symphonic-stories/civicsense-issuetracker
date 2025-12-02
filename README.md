**CivicSense — Smart Civic Issue Tracker**
==========================================

A complete web-based platform that allows citizens to report civic issues, track complaint progress, earn reward points, get discount coupons for metro/bus services, and access analytics — powered fully by **Firebase** and client-side JavaScript.

This project helps cities improve transparency, responsiveness, and citizen engagement using a reward-driven system.

🚀 **Features**
===============

🔐 **User Authentication**
--------------------------

*   Firebase Authentication (Email/Password)
    
*   Profile completion system (Name, age, sex)
    
*   Auto-redirect on login/logout
    
*   Secure Firestore rules
    

📝 **Complaint Reporting**
--------------------------

Citizens can submit complaints with:

*   Issue Title
    
*   Description
    
*   Category
    
*   Location
    
*   Image Upload
    
*   Auto timestamp
    

Each complaint:

*   Is stored in Firebase Firestore
    
*   Appears in user dashboard & admin panel
    
*   Sends an **email to admin** using **EmailJS (no backend required)**
    

📊 **Complaint Analytics**
--------------------------

Admins & users can view:

*   Issue types distribution
    
*   Complaint statuses
    
*   Weekly/Monthly charts
    
*   Heatmaps (if enabled)
    

Built using:

*   Chart.js
    
*   Firebase realtime sync
    

🏆 **Gamified Reward System**
-----------------------------

Every complaint gives the user **+10 points**.

### **🎖 Badge Milestones**

Badges are automatically awarded at:

PointsBadge10First Step30Level 1 Citizen50Level 2 Citizen70Level 3 Citizen85Level 4 Citizen100Century Achiever150Rising Star200Double Century Hero250Elite Citizen300Triple Century Legend350Civic Champion400Metro Master500Golden Citizen

Badges are rebuilt automatically even if data gets corrupted.

🎁 **Coupon Reward System**
---------------------------

For **every 100 points milestone**, users can claim a **discount coupon**.

### Coupon Features:

✔ Weighted random discount (10% to 55%)✔ Unique coupon code: CS-XXXXXXXX✔ 30-day expiry✔ Auto-generated PDF download✔ Stored in user history (Firestore)✔ Claim button appears only when eligible

Cyclic progress bar resets every 100 points.

🧩 **Leaderboard**
------------------

Displays top 5 users with:

*   User Name
    
*   Points
    
*   Continuous realtime update
    

✉️ **Automatic Admin Email Notifications**
------------------------------------------

When a user submits a complaint, the admin receives an **instant email** with:

*   Complaint subject
    
*   Description
    
*   User email
    
*   Timestamp
    

Powered by **EmailJS (no backend needed)**.

🔥 **Tech Stack**
-----------------

### Frontend

*   HTML5
    
*   CSS3
    
*   JavaScript (ES6+)
    
*   Chart.js
    
*   EmailJS SDK
    
*   jsPDF
    

### Backend (Serverless)

*   Firebase Authentication
    
*   Firebase Firestore
    
*   Firebase Storage
    

No external backend server required.

❤️ Made for Smart City Projects

CivicSense is built for real-world deployment in colleges, smart-city hackathons, government civic platforms, and entrepreneurship projects.
