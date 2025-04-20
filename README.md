# FireZero 🔥

[![Next.js](https://img.shields.io/badge/Built%20with-Next.js-000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)  
[![TypeScript](https://img.shields.io/badge/Code-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)  
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind_CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)  
[![HackDavis](https://img.shields.io/badge/Hackathon-HackDavis_2025-blueviolet)](https://hackdavis.io/)  

---
## 📊 Running the Visualization

To generate reproducible static data visualizations:

1. Navigate to the visualization directory:
   ```bash
   cd @visualization/
   ```

2. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the visualization script:
   ```bash
   python visualize_fire_risk.py
   ```

This will create several output files in the current directory, including charts and maps visualizing the fire risk data for UC Davis buildings.

## 🧭 Overview

**FireZero** is a fire risk planning and visualization tool designed for government operations and infrastructure planners. It maps UC Davis buildings using **Mapbox** and overlays risk scores derived from utility and safety data 📊.

Each building is assigned a **composite fire risk score** (0-100) based on two key datasets:
1. [CEED UC Davis](https://ceed.ucdavis.edu/)
2. [Clery Fire Safety Report](https://clery.ucdavis.edu/sites/g/files/dgvnsk1761/files/media/documents/ASFSR-UCD-2024vOct2024_0.pdf)

The application aggregates contextual data from both the CEED UC Davis dataset and the Clery Fire Safety Report into a comprehensive JSON structure. This unified data format enables seamless integration of utility consumption metrics, fire safety features, and historical incident data, providing a holistic view of each building's fire risk profile.

---
## 🧰 Tech Stack

- ⚙️ **Frontend:** [Next.js](https://nextjs.org/)
- 🎨 **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- 🗄️ **Backend:** JSON data stored in `/data/` directory
- 📦 **Package Manager:** [npm](https://www.npmjs.com/)

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
