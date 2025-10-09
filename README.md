<div align="center">
  <img src="https://raw.githubusercontent.com/oguzyucel1/ComProSearch/main/frontend/public/images/denge_banner.png" alt="ComProSearch Logo Banner" width="70%"/>
  <h1>ComProSearch: Enterprise Product Comparison Engine</h1>
  <p>
    <strong>A high-performance product aggregation and comparison platform designed to unify data from multiple electronics distributors into a single, intuitive interface.</strong>
  </p>
  
  <p>
    <a href="https://github.com/oguzyucel1/ComProSearch/actions/workflows/node.js.yml"><img src="https://github.com/oguzyucel1/ComProSearch/actions/workflows/node.js.yml/badge.svg" alt="CI/CD Status"/></a>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
    <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
    <img src="https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify"/>
  </p>
</div>

<div align="center">
  <img src="frontend/public/images/penta_banner.jpg" alt="Penta Banner" width="48%"/>
  <img src="frontend/public/images/oksid_banner.jpg" alt="Oksid Banner" width="48%"/>
</div>

---

## ✨ Core Features

- **🌐 Multi-Source Aggregation**: Integrates product data from key distributors: **Oksid**, **Penta (Bayinet)**, and **Denge**.
- **🔍 Unified & Blazing-Fast Search**: A single, powerful search bar to query across all marketplaces with instant results.
- **🎨 Dynamic & Themed UI**: A modern, responsive interface with unique color themes and animations for each distributor, built with React and Tailwind CSS.
- **📊 Advanced Filtering & Sorting**: Filter products by category and sort by price to find the best deals.
- **⏱️ Real-time Data Sync**: View the last data refresh timestamp for each marketplace, ensuring data integrity.
- **🏗️ Scalable & Modular Architecture**: Decoupled frontend, backend, and data-sync services for maintainability and scalability.

---

## 🛠️ Enterprise-Grade Technology Stack

### **Frontend**

- **Framework**: **React 18** with **TypeScript** for robust, type-safe component development.
- **Build Tool**: **Vite** for lightning-fast development and optimized production builds.
- **Styling**: **Tailwind CSS** for a utility-first, highly customizable design system.
- **State Management**: React Hooks & Context API for efficient state handling.
- **UI Components**: `lucide-react` for clean, modern icons.

### **Backend & Database**

- **Platform**: **Supabase** (Postgres) for a scalable, secure, and real-time database backend.
- **API**: Auto-generated RESTful API provided by Supabase for seamless data access.
- **Serverless**: Ready for **Supabase Edge Functions** (Deno) for future backend logic extensions.

### **Data Integration & ETL Scripts (Python)**

- **Core**: Modular Python scripts for fetching, cleaning, and uploading data.
- **Web Scraping & Automation**:
  - **Playwright**: For browser automation to handle dynamic, JavaScript-heavy sites (e.g., Denge, Bayinet).
  - **Beautiful Soup & Requests**: For parsing static HTML content.
  - **CFScrape**: To bypass Cloudflare challenges on sites like Oksid.
- **Database Client**: `supabase-client` for reliable communication with the Supabase backend.
- **Environment Management**: `python-dotenv` for secure handling of credentials.

### **Deployment & DevOps**

- **Hosting**: **Netlify** for continuous deployment, global CDN, and easy management of the frontend.
- **CI/CD**: **GitHub Actions** for automated checks and build processes.
- **Infrastructure as Code**: `netlify.toml` for declarative deployment configuration.

---

## 📂 Project Architecture

```
ComProSearch/
├── 📁 .github/            # CI/CD workflows (GitHub Actions)
├── 📁 frontend/            # React/Vite frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/    # Reusable React components
│   │   ├── 📁 services/      # Data fetching & Supabase logic
│   │   └── 📁 lib/           # Supabase client initialization
│   └── 📄 vite.config.ts     # Vite configuration
│
├── 📁 scripts/             # Python ETL scripts for data synchronization
│   ├── 📁 bayinet/          # Scripts for Penta/Bayinet
│   ├── 📁 denge/            # Scripts for Denge
│   └── 📁 oksid/            # Scripts for Oksid
│
├── 📁 supabase/            # Supabase backend configuration
│   └── 📁 functions/         # Serverless Edge Functions
│
├── 📄 netlify.toml         # Netlify deployment configuration
└── 📄 README.md            # This file
```

---

## 🚀 Getting Started

### ✅ Prerequisites

- **Node.js**: v18+
- **Python**: v3.9+
- **Git** & **GitHub CLI**
- **Supabase Account**

### 1. Clone & Setup Environment

```bash
git clone https://github.com/oguzyucel1/ComProSearch.git
cd ComProSearch
```

### 2. Supabase Backend Setup

1.  Create a new project on [Supabase](https://supabase.com/).
2.  In the **SQL Editor**, create tables (`oksid_products`, `bayinet_products`, `denge_products`). Refer to the Python scripts for schema.
3.  Get your **Project URL**, **`anon` key**, and **`service_role` key** from **Project Settings > API**.

### 3. Frontend Development

1.  Navigate to the `frontend` directory.
2.  Create `.env.local` with your public Supabase keys:
    ```env
    VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
3.  Install dependencies and start the dev server:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### 4. Python Scripts Configuration

1.  Create a `.env` file in the root of the `scripts/` directory.
2.  Add your Supabase URL and **service role key** (for write access):
    ```env
    # In scripts/.env
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    # Add credentials for each marketplace
    DENGE_EMAIL=your_denge_email
    DENGE_PASSWORD=your_denge_password
    ```
3.  Install dependencies for each script (e.g., for `denge`):
    ```bash
    pip install -r scripts/denge/requirements.txt
    ```
4.  Run a script to sync data:
    ```bash
    python -m scripts.denge.update_denge
    ```

---

## 🚢 Deployment

The frontend is deployed on **Netlify** and configured for CI/CD with GitHub Actions. Any push to the `main` branch will trigger a new deployment.
