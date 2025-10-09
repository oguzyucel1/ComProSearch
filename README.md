# ComProSearch: Multi-Source Product Comparison Tool

ComProSearch is a powerful product comparison engine designed to aggregate and display product data from multiple electronics distributors in Turkey. It provides a unified, fast, and feature-rich interface for searching, filtering, and comparing products from sources like Oksid, Penta (Bayinet), and Denge.

![ComProSearch Banner](frontend/public/images/penta_banner.jpg)

## ✨ Features

- **🌐 Multi-Source Aggregation**: Fetches and displays product data from Oksid, Penta (Bayinet), and Denge.
- **🔍 Unified Search**: A single, powerful search bar to query across all available marketplaces.
- **🗂️ Tabbed Navigation**: Easily switch between different data sources with a clean, tabbed interface.
- **📊 Advanced Filtering & Sorting**: Filter products by category and sort by price (low-to-high or high-to-low).
- **🎨 Dynamic UI**: A modern, responsive interface built with React and Tailwind CSS, featuring smooth animations and unique color themes for each distributor.
- **⏱️ Real-time Data Updates**: Instantly see the last time the data for each marketplace was refreshed.
- **🏗️ Scalable Architecture**: Backend powered by Supabase, with data integration handled by modular Python scripts.

---

## 🛠️ Tech Stack

| Category               | Technology -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**           | <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React"/> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/> <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/> <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/> - |
| **Backend & Database** | <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase"/> <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/> <img src="https://img.shields.io/badge/Deno-000000?style=flat-square&logo=deno&logoColor=white" alt="Deno"/> -                                                                                                                              |
| **Data Integration**   | <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/> <img src="https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white" alt="Pandas"/> <img src="https://img.shields.io/badge/Requests-2.31.0-brightgreen?style=flat-square" alt="Requests"/> -                                                                                                                                                      |
| **Deployment**         | <img src="https://img.shields.io/badge/Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white" alt="Netlify"/> -                                                                                                                                                                                                                                                                                                                                                                             |

---

## 📂 Project Structure

```
ComProSearch/
├── 📁 frontend/         # React/Vite frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/ # Reusable React components
│   │   ├── 📁 services/   # Data fetching logic (products.ts)
│   │   └── 📁 lib/        # Supabase client initialization
│   └── 📄 vite.config.ts  # Vite configuration
│
├── 📁 scripts/          # Python scripts for data scraping/updating
│   ├── 📁 bayinet/
│   ├── 📁 denge/
│   └── 📁 oksid/
│
├── 📁 supabase/         # Supabase backend configuration
│   └── 📁 functions/      # Serverless edge functions
│
├── 📄 netlify.toml      # Netlify deployment configuration
└── 📄 README.md         # This file
```

---

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### ✅ Prerequisites

- **Node.js**: v18.x or higher
- **Python**: v3.9 or higher
- **Git**: For cloning the repository
- **Supabase Account**: A free Supabase account to host the database.

### 1. Clone the Repository

```bash
git clone https://github.com/oguzyucel1/ComProSearch.git
cd ComProSearch
```

### 2. Supabase Setup

1.  Go to [Supabase](https://supabase.com/) and create a new project.
2.  Inside your project, go to the **SQL Editor** and create the necessary tables (e.g., `oksid_products`, `bayinet_products`, `denge_products`). Refer to the Python scripts for schema details.
3.  Go to **Project Settings > API**. You will need the **Project URL** and the **`anon` public key**.

### 3. Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Create a `.env.local` file with your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
3.  Install dependencies and run the development server:
    ```bash
    npm install
    npm run dev
    ```
    The app will be running on `http://localhost:5173`.

### 4. Data Scripts Setup

1.  Create a `.env` file in `scripts/shared/` with your Supabase **`service_role` key**:
    ```env
    # In scripts/shared/.env
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```
2.  Install dependencies for each script. For example, for `denge`:
    ```bash
    pip install -r scripts/denge/requirements.txt
    ```
3.  Run a script to populate the database:
    ```bash
    python -m scripts.denge.update_denge
    ```

---

## 🚢 Deployment

The frontend is configured for seamless deployment on **Netlify**.

1.  Push your code to a GitHub repository.
2.  Connect the repository to a new site on Netlify.
3.  Configure the build settings:
    - **Base directory**: `frontend`
    - **Build command**: `npm run build`
    - **Publish directory**: `frontend/dist`
4.  Add your Supabase environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) to the Netlify site's environment variables.
5.  Deploy! 🚀
