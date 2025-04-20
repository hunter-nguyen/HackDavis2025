# 🔥 FireZero 🔥

[![Next.js](https://img.shields.io/badge/Built%20with-Next.js-000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)  
[![TypeScript](https://img.shields.io/badge/Code-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)  
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind_CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)  
[![HackDavis](https://img.shields.io/badge/Hackathon-HackDavis_2025-blueviolet)](https://hackdavis.io/)  
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🧭 Overview

**FireZero** is a fire risk planning and visualization tool 🔍🔥 designed for government operations and infrastructure planners. It maps UC Davis buildings 🏢 using **Mapbox** and overlays risk scores derived from utility and safety data 📊.

Each building is assigned a **composite fire risk score** (0-100) based on:

-   🔌 Energy intensity
-   💧 Water consumption
-   🔥 Historical fire incidents
-   🏭 Gas usage

Natural language summaries and actionable planning recommendations are generated via the **Gemini API**, transforming raw data into readable insights 📘. Explore each building’s fire resilience, receive actionable safety steps, and make data-informed decisions — all in one interactive dashboard 🗺️.

---

## 🧰 Tech Stack

-   ⚙️ **Framework:** [Next.js](https://nextjs.org/)
-   🧠 **Language:** [TypeScript](https://www.typescriptlang.org/)
-   🎨 **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   📦 **Package Manager:** [npm](https://www.npmjs.com/)

---

## 🚀 Getting Started

### 📋 Prerequisites

-   [Node.js](https://nodejs.org/)
-   [npm](https://www.npmjs.com/)

### 🛠️ Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/hunter-nguyen/HackDavis2025.git
    cd HackDavis2025
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

---

### 🔐 Environment Variables

Copy the example environment file and update it with your API keys:

```bash
cp .env.example .env
```

Then edit `.env`:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your-mapbox-access-token"
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

---

### 🧪 Running the Development Server

Start the dev server locally:

```bash
npm run dev
```

Visit 👉 [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## 🗂️ Project Structure

```bash
/
├── data/            # Project-specific data files
├── public/          # Static assets (images, fonts, etc.)
├── src/             # Main application source code
│   ├── app/         # Next.js App Router (routing, pages, layouts)
│   ├── components/  # Reusable UI components
│   ├── lib/         # Utility functions, helpers
│   └── ...
├── .env             # Local environment variables (ignored by git)
├── .env.example     # Example environment variables
├── .gitignore       # Files ignored by git
├── next.config.ts   # Next.js configuration
├── package.json     # Project metadata and dependencies
├── README.md        # This file
├── tsconfig.json    # TypeScript configuration
└── ...              # Other config files (ESLint, PostCSS, etc.)
```

### 📎 Key Highlights:

-   `src/app`: Core app logic, routes, and layouts
-   `src/components`: Shared UI components 💅
-   `public`: Static files (images, icons, etc.)
-   `data`: Structured datasets and building metadata

---

## 💡 Inspiration

This project was built during **HackDavis 2025** to help first responders plan fire risk responses more effectively using open datasets, modern geospatial tools, and AI 🧠.

---
