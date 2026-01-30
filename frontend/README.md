# Cognify Frontend

Interactive, AI-powered knowledge management dashboard built with Next.js 15.

## 🚀 Development

### Start the Workspace
```bash
npm run dev
```

### Key Modules
- **Dashboard**: Global overview of knowledge assets and metrics.
- **PDF Intelligence Toolkit**: Structural tools for PDF manipulation (Split, Merge, Redact).
- **AI Explorer**: Deep-reading interface with LLM insights and Q&A.
- **Analytics**: Data visualization using Recharts.

## 🛠 Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State/Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## 🔗 Connection
Connects to the Cognify Backend via REST API (default: `http://localhost:8000/api/`).
Ensure the backend is running and you have an active JWT token in `localStorage`.
