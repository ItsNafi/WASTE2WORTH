# Viva Defense Explanation: Feature 20 - Real-Time Environmental Impact Dashboard

This document provides a comprehensive breakdown of the implementation of **Feature 20 (Real-Time Environmental Impact Dashboard)**. Use these points during your project defense to explain the technical decisions, architecture, and exact fulfillment of the system requirements.

---

## 1. System Architecture: Native Node.js vs Express
**Question:** *How does your backend handle requests to MySQL without using the Express.js framework?*

**Explanation:**
To strictly isolate the impact dashboard and avoid altering the existing Express routing in `app.js`, a standalone native Node.js HTTP server was implemented in `server.js`.
1. **The Server (`http.createServer`):** We use Node's native `http` module to create a server listening on port `8080`. It intercepts incoming HTTP requests directly.
2. **Routing Logic:** Instead of using Express's `app.get()`, we manually inspect the `req.url` and `req.method`. If it matches `GET /api/impact-dashboard`, we route it to the isolated `dashboardController.js`.
3. **CORS Handling:** Since this is a native implementation, standard CORS headers (`Access-Control-Allow-Origin: '*'`) are explicitly written using `res.setHeader()` to ensure the frontend can fetch data without cross-origin blocks.
4. **Database Execution:** Inside the controller, we use the `mysql2/promise` module. It maintains a connection pool to `127.0.0.1` and executes standard raw SQL queries. We use `Promise.all()` to fire three queries simultaneously to MySQL for maximum performance, waiting for all of them to resolve before responding.

---

## 2. SQL Breakdown: Aggregating Across Tables
**Question:** *Can you explain the exact SQL aggregation logic used to pull these metrics?*

**Explanation:**
We strictly followed read-only SQL aggregation using `SUM()`, `COUNT()`, and `IFNULL()` to prevent any modification to existing tables while accurately deriving the platform's macro-analytics.

*   **Total Waste Diverted (kg):**
    We combine weight from two sources in a single query:
    1. *Scrap listings marked as sold:* `SELECT IFNULL(SUM(weight), 0) FROM ScrapListings WHERE status = 'Sold'`
    2. *Public cleanup waste:* `SELECT IFNULL(SUM(weightKg), 0) FROM WasteLogs WHERE driveId IS NOT NULL AND status IN ('Verified', 'Claimed')`
    *Why IFNULL?* If a table is empty (e.g., no waste logged yet), `SUM()` returns `NULL`. `IFNULL(..., 0)` ensures we safely receive mathematical zeroes instead of null references breaking the frontend.

*   **Total Volunteer Hours Logged:**
    Since the database tracks attendance (not direct duration), we use a standard conversion (e.g., 3 hours per event).
    `SELECT IFNULL(COUNT(ca.attendance_id) * 3, 0) FROM campaign_attendance ca JOIN CleanupCampaigns c ON ca.campaign_id = c.campaignId WHERE c.status = 'Completed'`
    We join the `campaign_attendance` with `CleanupCampaigns` to ensure we only sum hours from *completed* cleanups, fulfilling the exact business requirement.

*   **Total Green Revenue Distributed (BDT):**
    `SELECT IFNULL(SUM(amount), 0) FROM Payments WHERE status = 'Completed'`
    The `Payments` table centralizes all platform transactions (Citizen scrap sales + Cleanup waste sales + Customer checkouts). Summing the `amount` of all 'Completed' payments accurately retrieves the platform's Total Green Revenue without complex multi-table joins.

---

## 3. Real-Time Mechanism: Live Updates Without Reloading
**Question:** *How does the dashboard achieve live updates without the user having to refresh the page?*

**Explanation:**
The real-time effect is achieved using **AJAX Polling** via Vanilla JavaScript.
1. **Background Fetching:** In `public/js/dashboard.js`, we use the native `fetch()` API to make an HTTP GET request to our `/api/impact-dashboard` endpoint.
2. **The `setInterval` Loop:** We wrap this fetch call inside a `setInterval(fetchMetrics, 10000);` function. This forces the browser to silently re-execute the network request every 10 seconds.
3. **DOM Manipulation:** Once the JSON response is received, the script surgically updates the `innerHTML` of the three specific stat cards (`val-waste`, `val-hours`, `val-revenue`). Because we only update these isolated text nodes rather than re-rendering the whole page, the user experiences a smooth, real-time live-updating dashboard.

---

## 4. Requirement Mapping: Meeting NFRs and FRs
**Question:** *Show how your code explicitly satisfies the feature and non-functional requirements.*

**Explanation:**
*   **FR-20 (Real-Time Impact Dashboard):** 
    We completely separated this from Feature 13 (individual Green Score). This macro-dashboard globally queries `ScrapListings`, `WasteLogs`, `campaign_attendance`, and `Payments` to show platform-wide totals.
*   **NFR-3 (Responsive / Mobile-Friendly):** 
    In `public/css/dashboard.css`, we implemented CSS Grid and `@media` queries. 
    `@media (max-width: 768px) { .metrics-grid { grid-template-columns: 1fr; } }` 
    This automatically stacks the three stat cards vertically on mobile devices, ensuring perfect readability without horizontal scrolling.
*   **NFR-4 (Bilingual Support):** 
    In `public/dashboard.html`, we embedded placeholder tags for both English (`<h3 class="lang-en">`) and Bengali (`<h3 class="lang-bn">`). The JavaScript `toggleLanguage(lang)` function dynamically adds/removes the `.active` CSS class to instantly switch the displayed text without needing to reload the page or fetch new HTML, fully supporting bilingual accessibility.
