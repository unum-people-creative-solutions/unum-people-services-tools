# Baseline Tools Spec

## Technical Stack
- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js
- **Styling**: Tailwind CSS v4 (with custom Unum People theme)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Formatting**: react-number-format
- **State & Persistence**: React Hooks + localStorage (Privacy by Design)

## Development Workflow
- **Package Manager**: npm
- **Linting**: ESLint (`npm run lint`)
- **Build**: Next.js Build (`npm run build`)
- **Dev Mode**: `npm run dev`

## UI/UX Patterns
- **Colors**:
  - Unum Blue: `#015294`
  - Unum Slate: `#5E88A1`
  - Unum Gray: `#727A80`
  - Unum Sky: `#00A6D7`
  - Unum Lawn: `#8DC24B`
  - Unum Orange: `#EB9400`
- **Typography**: Inter (via Geist font family optimization)
- **Shared Components**:
  - `Header`: Consistent with `toolName` prop.
  - `Footer`: Institutional footer.
  - No `CookieBanner`: the site has no ads and no tracking cookies since 23/11/2026 (F1 sem anúncios); only functional localStorage, explained in `/privacidade` and in the footer line.

## Architecture
- Tool-based routing under `src/app/`.
- Privacy-first: No server-side data storage for tool data.
- Logic handled via custom hooks (e.g., `useServices`, `usePricing`).
