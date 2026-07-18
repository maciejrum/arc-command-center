# Arc Command Center

Arc Command Center is a responsive executive operations workspace for monitoring company performance, project delivery, budgets, workload, risks, and upcoming deadlines in one place.

## Features

- Executive KPI overview with trends and targets
- Department, reporting period, and saved-view filters
- Project portfolio with sorting, filtering, selection, and bulk actions
- Budget, workload, financial, task, risk, and dependency visualizations
- Contextual detail panels for dashboard data
- Command palette and keyboard shortcuts
- Customizable dashboard module order
- Responsive light and dark themes
- Loading, degraded-data, and empty states

The current application uses deterministic mock data, so it can be explored without configuring a backend or external services.

## Tech Stack

- [Next.js](https://nextjs.org/) 15
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [TanStack Table](https://tanstack.com/table)
- [Recharts](https://recharts.org/)
- [React Flow](https://reactflow.dev/)

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

### Installation

```bash
git clone git@github.com:maciejrum/arc-command-center.git
cd arc-command-center
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev        # Start the development server
npm run build      # Create a production build
npm run start      # Start the production server
npm run typecheck  # Run TypeScript checks
```

## Project Structure

```text
app/          Next.js application shell and global styles
components/   Dashboard features and reusable UI components
lib/          Types, utilities, and mock application data
```

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl + K` or `/` | Open the command palette |
| `[` | Toggle the sidebar |
| `E` | Toggle layout editing |
| `Esc` | Close the active detail panel or exit editing |
