# Frontend Structure Documentation

**Last Updated**: March 5, 2026

---

## Overview

ProfitPulse frontend is a modern single-page application (SPA) built with React 18, Vite, and Tailwind CSS. The application provides an intuitive interface for analyzing Vietnamese stock company profitability using machine learning-powered insights.

---

## Technology Stack

### Core Technologies
- **React 18.3.1**: UI library with hooks and functional components
- **Vite 6.0.5**: Fast build tool with hot module replacement
- **React Router 7.1.1**: Client-side routing
- **Tailwind CSS 4.0.0**: Utility-first CSS framework

### Data Visualization
- **Recharts 2.15.0**: Composable charting library for React
- Line charts, bar charts, area charts, and pie charts
- Responsive design with customizable tooltips

### UI Components
- **Lucide React 0.469.0**: Modern icon library
- Custom-built reusable components
- Responsive and accessible design patterns

### HTTP Client
- **Axios 1.7.9**: Promise-based HTTP client for API communication

---

## Application Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── App.jsx                    # Main application component with routing
│   ├── main.jsx                   # Application entry point
│   ├── index.css                  # Global styles and Tailwind imports
│   ├── pages/                     # Page-level components (7 pages)
│   │   ├── Home.jsx
│   │   ├── Screener.jsx
│   │   ├── Company.jsx
│   │   ├── Compare.jsx
│   │   ├── Alerts.jsx
│   │   ├── About.jsx
│   │   └── ModelPerformance.jsx
│   ├── components/                # Reusable UI components (10 components)
│   │   ├── Layout.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── ModelContextBar.jsx
│   │   ├── PageIntro.jsx
│   │   ├── StatsCard.jsx
│   │   ├── QuickSearch.jsx
│   │   ├── ChartCaption.jsx
│   │   ├── DataCoverageBadge.jsx
│   │   └── Tooltip.jsx
│   ├── services/                  # API service layer
│   │   └── api.js
│   ├── hooks/                     # Custom React hooks
│   │   └── useWatchlist.js
│   └── utils/                     # Helper functions
│       └── helpers.js
├── public/                        # Static assets
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── postcss.config.js              # PostCSS configuration
```

---

## Page Components

### 1. Home Page (Home.jsx)

**Route**: `/`

**Purpose**: Dashboard overview of market statistics and top performers

**Key Features**:
- Hero section with quick search functionality
- KPI cards showing:
  - Total companies analyzed
  - Average profit score
  - High risk count
  - Low risk count
- Interactive charts:
  - Score distribution (area chart)
  - Risk distribution (pie chart)
- Top companies table with sorting capabilities

**Data Sources**:
- API: `/api/meta` (metadata)
- API: `/api/summary` (summary statistics)

**Components Used**:
- ModelContextBar
- PageIntro
- QuickSearch
- StatsCard
- ChartCaption
- LoadingSpinner

---

### 2. Screener Page (Screener.jsx)

**Route**: `/screener`

**Purpose**: Filter and search companies by year and profit score range

**Key Features**:
- Filter panel with inputs for:
  - Year selection
  - Minimum profit score
  - Maximum profit score
  - Result limit (20, 50, 100, 200)
- Top 10 bar chart with alternating colors
- Sortable results table with columns:
  - Company ticker
  - Profit score
  - Risk label
  - Principal components (PC1, PC2, PC3)
  - Percentile ranking
- Export to CSV functionality
- Click-through to company detail pages

**Data Sources**:
- API: `/api/meta` (available years)
- API: `/api/screener` (filtered results)

**Components Used**:
- ModelContextBar
- PageIntro
- ChartCaption
- Tooltip (for metric explanations)

---

### 3. Company Detail Page (Company.jsx)

**Route**: `/company/:ticker`

**Purpose**: Comprehensive analysis of individual company performance

**Key Features**:

#### Tab Navigation
Three tabs for different analysis views:
1. **Overview Tab**
   - Current year KPI cards:
     - Profit score
     - Risk level
     - Percentile ranking
     - Data coverage
   - Risk interpretation and recommendations
   - Percentile bucket visualization
   - Future predictions (if available)

2. **History Tab**
   - Profit score trend line chart
   - Year-over-year delta indicators
   - Historical percentile rankings
   - Multi-year performance table

3. **Drivers Tab**
   - Principal component breakdown (PC1, PC2, PC3)
   - Financial metrics over time
   - Contribution analysis
   - Detailed explanations of score drivers

**Additional Features**:
- Year selector dropdown
- Watchlist toggle (star/unstar)
- Responsive design for mobile devices

**Data Sources**:
- API: `/api/company/:ticker` (company details, timeseries, financial data)

**Components Used**:
- ModelContextBar
- PageIntro
- ChartCaption
- DataCoverageBadge
- Tooltip

---

### 4. Compare Page (Compare.jsx)

**Route**: `/compare`

**Purpose**: Side-by-side comparison of multiple companies

**Key Features**:
- Multi-company selector (up to 4 companies)
- Auto-complete search with suggestions
- Comparison table showing:
  - Company name and exchange
  - Profit score
  - Risk label
  - Principal components
  - Percentile
- Multi-line chart showing profit score trends over time
- Color-coded lines for each company (purple, cyan, amber, rose)
- Export comparison to CSV

**Data Sources**:
- API: `/api/meta` (company list)
- API: `/api/compare` (comparison data)
- API: `/api/company/:ticker` (timeseries for each company)

**Components Used**:
- ModelContextBar
- PageIntro
- ChartCaption
- LoadingSpinner

---

### 5. Alerts Page (Alerts.jsx)

**Route**: `/alerts`

**Purpose**: Automatic detection of significant changes in company performance

**Key Features**:
- Filter controls:
  - Risk level filter (All, High, Low)
  - Direction filter (All, Up, Down)
  - Sort by absolute delta or profit score
  - Sort direction (ascending/descending)
- Alert severity distribution bar chart
- Alerts table with:
  - Company ticker
  - Current profit score
  - Year-over-year change
  - Risk label
  - Action links to company pages
- Export alerts to CSV

**Alert Types Detected**:
- Risk level changes
- Significant score drops
- Borderline companies

**Data Sources**:
- API: `/api/meta` (years)
- API: `/api/alerts` (alert data)

**Components Used**:
- ModelContextBar
- PageIntro
- ChartCaption
- Tooltip

---

### 6. About Page (About.jsx)

**Route**: `/about`

**Purpose**: Project methodology and transparency documentation

**Key Features**:

#### Methodology Cards
- **Data Source**: Audited financial reports from Vietnamese stock exchanges
- **PCA & Scoring**: Principal Component Analysis for scoring
- **Percentile & Label**: Statistical ranking without subjective judgment
- **Transparency**: Reproducible pipeline with saved artifacts

#### Pipeline Flow
Visual representation of the 6-step process:
1. Raw data input
2. Preprocessing
3. PCA fitting
4. Scoring calculation
5. Risk labeling
6. API delivery and dashboard

#### Transparency Commitments
- No sensitive or non-public data usage
- 100% reproducible results
- Transparent artifact storage
- Statistical thresholds for risk labels
- Annotated charts with sources

#### Disclaimer
Clear warning that ProfitPulse is an analytical tool, not investment advice

**Data Sources**:
- Static content (no API calls)

**Components Used**:
- ModelContextBar
- PageIntro

---

### 7. Model Performance Page (ModelPerformance.jsx)

**Route**: `/performance`

**Purpose**: Display ML model metrics and technical details

**Key Features**:

#### KPI Cards
- Variance explained by PCA
- Total companies in dataset
- Number of years analyzed
- Number of features used

#### Model Metrics Table
- PC1/PC2/PC3 variance ratios
- Total companies count
- Total years count
- Number of features
- Companies per year metric

#### Risk Distribution Chart
Bar chart showing distribution across risk levels:
- Very High Risk (red)
- High Risk (orange)
- Medium Risk (amber)
- Low Risk (green)

#### Label Explanations
Detailed breakdown of risk label criteria:
- Percentile ranges for each label
- Interpretation guidelines
- Color-coded badges

**Data Sources**:
- API: `/api/meta` (metadata)
- API: `/api/model-metrics` (model performance data)

**Components Used**:
- ModelContextBar
- PageIntro
- StatsCard
- ChartCaption
- Tooltip

---

## Reusable Components

### Layout Components

#### Layout.jsx
**Purpose**: Main application layout wrapper

**Features**:
- Top navigation bar with logo and menu items
- Responsive mobile menu (hamburger)
- Footer with copyright and links
- Consistent spacing and styling

**Navigation Items**:
- Home
- Screener
- Compare
- Alerts
- Performance
- About

---

#### ErrorBoundary.jsx
**Purpose**: Catch and handle React errors gracefully

**Features**:
- Catches JavaScript errors in child components
- Displays fallback UI when errors occur
- Provides error details in development mode
- Reload button for user recovery

---

#### LoadingSpinner.jsx
**Purpose**: Consistent loading state indicator

**Features**:
- Animated spinner with customizable message
- Centered layout
- Accessible aria attributes
- Smooth fade-in animation

---

### UI Components

#### ModelContextBar.jsx
**Purpose**: Display current model context (year, model type)

**Features**:
- Shows selected year or current model year
- Consistent placement across all pages
- Icon-based visual indicator
- Subtle background styling

---

#### PageIntro.jsx
**Purpose**: Standardized page introduction section

**Props**:
- `text`: Main introductory text
- `note`: Disclaimer or additional note

**Features**:
- Consistent typography
- Icon-based info indicator
- Responsive text sizing

---

#### StatsCard.jsx
**Purpose**: Display KPI metrics with icon and styling

**Props**:
- `title`: Metric label
- `value`: Metric value
- `subtitle`: Additional context
- `icon`: Lucide icon component
- `color`: Theme color (purple, cyan, red, green)

**Features**:
- Color-coded backgrounds
- Icon integration
- Hover effects
- Responsive sizing

---

#### QuickSearch.jsx
**Purpose**: Fast company search with auto-complete

**Props**:
- `firms`: Array of company tickers

**Features**:
- Real-time search filtering
- Click outside to close
- Keyboard navigation support
- Navigate directly to company page

---

#### ChartCaption.jsx
**Purpose**: Explanatory text below charts

**Props**:
- `caption`: Explanation text

**Features**:
- Consistent styling
- Info icon
- Muted text color
- Small size for subtlety

---

#### DataCoverageBadge.jsx
**Purpose**: Display data completeness indicator

**Props**:
- `percentage`: Coverage percentage (0-100)

**Features**:
- Color-coded by coverage level:
  - Green: 80-100%
  - Amber: 60-79%
  - Rose: <60%
- Icon display
- Tooltip support

---

#### Tooltip.jsx
**Purpose**: Display helpful explanations on hover

**Props**:
- `text`: Tooltip content
- `children`: Wrapped content

**Features**:
- Predefined tooltips for common terms:
  - profit_score
  - label_risk
  - percentile
  - pc1, pc2, pc3
- Info icon indicator
- Hover-triggered display

---

## Hooks

### useWatchlist.js

**Purpose**: Manage user's watchlist of companies

**Features**:
- Add/remove companies from watchlist
- Persist watchlist to localStorage
- Check if company is in watchlist
- Get full watchlist array

**Methods**:
- `isInWatchlist(ticker)`: Returns boolean
- `toggleWatchlist(ticker)`: Add or remove ticker
- `getWatchlist()`: Returns array of tickers

---

## Services

### api.js

**Purpose**: Centralized API client for backend communication

**Base URL**: Configurable via environment variable `VITE_API_BASE_URL`

**API Methods**:

#### Metadata
- `getMeta()`: Get company list, years, and counts
  - Endpoint: `GET /api/meta`

#### Company Data
- `getCompanies()`: Get all companies
  - Endpoint: `GET /api/companies`
- `getCompany(ticker)`: Get detailed company information
  - Endpoint: `GET /api/company/:ticker`

#### Analysis
- `screener(params)`: Filter companies by criteria
  - Endpoint: `GET /api/screener`
  - Params: year, min_score, max_score, limit
- `getSummary(year)`: Get market summary statistics
  - Endpoint: `GET /api/summary`
- `compareCompanies(tickers, year)`: Compare multiple companies
  - Endpoint: `POST /api/compare`

#### Alerts & Monitoring
- `getAlerts(year)`: Get alert notifications
  - Endpoint: `GET /api/alerts`

#### Model Information
- `getModelMetrics()`: Get ML model performance metrics
  - Endpoint: `GET /api/model-metrics`
- `getAbout()`: Get project information
  - Endpoint: `GET /api/about`

**Error Handling**:
- Automatic error catching
- Console logging for debugging
- User-friendly error messages

---

## Utilities

### helpers.js

**Purpose**: Common utility functions used across the application

**Functions**:

#### Number Formatting
- `safeNum(value, decimals)`: Safely format numbers with fixed decimals
- `formatPercent(value)`: Format as percentage with 1 decimal

#### Risk & Label Functions
- `riskBadge(label)`: Generate badge HTML for risk labels
- `getRiskBadgeColor(label)`: Get color class for risk level
- `severityColor(severity)`: Get color for alert severity

#### Company Functions
- `tickerFromFirmId(firmId)`: Extract ticker from firm_id (e.g., "FPT.HM" -> "FPT")

#### Percentile Functions
- `percentileInterpretation(percentile)`: Human-readable percentile explanation
- `rankBucket(percentile)`: Categorize percentile into buckets

#### PCA Descriptions
- `PC_DESCRIPTIONS`: Object containing explanations for PC1, PC2, PC3

#### Data Processing
- `sortBy(array, key, order)`: Generic array sorting
- `computeYoYDeltas(timeseries)`: Calculate year-over-year changes
- `exportToCSV(data, filename)`: Export data to CSV file

#### Tooltip Definitions
- `TOOLTIPS`: Object containing explanatory text for common terms

---

## Styling System

### Tailwind CSS Configuration

**Custom Theme Extensions**:

#### Colors
- `primary`: Purple shades for main brand color
- `accent`: Cyan shades for secondary highlights
- `surface`: Dark background shades
- `success`, `warning`, `error`: Semantic colors

#### Typography
- `font-display`: Inter for headings
- `font-body`: System fonts for body text

#### Custom Classes
- `.card`: Base card styling with dark background
- `.card-hover`: Card with hover effects
- `.btn-primary`: Primary button style
- `.btn-ghost`: Ghost button style
- `.badge-*`: Status badges (risk, info, success, warn)

---

## Responsive Design

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (xl, 2xl)

### Mobile Optimizations
- Hamburger menu for navigation
- Stacked layouts for cards and KPIs
- Touch-friendly button sizes (min-height: 40px)
- Simplified charts on small screens
- Horizontal scroll for tables

---

## Performance Optimizations

### Code Splitting
- Lazy loading considered for route-based splitting
- Dynamic imports for large components

### Memoization
- `useMemo` for expensive calculations (sorting, filtering)
- `useCallback` for stable function references

### API Caching
- Component-level state caching
- Avoid unnecessary re-fetches

### Chart Performance
- Responsive containers with fixed heights
- Limited data points on mobile
- Debounced interactions

---

## Accessibility

### ARIA Attributes
- Proper labels for interactive elements
- Screen reader-friendly tooltips
- Semantic HTML structure

### Keyboard Navigation
- Tab order for all interactive elements
- Enter/Space for button activation
- Escape to close modals/dropdowns

### Color Contrast
- WCAG AA compliant color combinations
- High contrast mode support
- Clear focus indicators

---

## State Management

### Approach
- Local component state using `useState`
- No global state management library (Redux, Zustand)
- Context used for watchlist persistence

### Data Flow
1. User interaction
2. API call via axios
3. Update local state
4. Re-render affected components
5. Cache in localStorage (for watchlist)

---

## Build & Deployment

### Development
```bash
npm run dev
# Runs on http://localhost:5173
# Hot Module Replacement enabled
```

### Production Build
```bash
npm run build
# Output: dist/ directory
# Optimized and minified assets
```

### Preview Build
```bash
npm run preview
# Preview production build locally
```

### Deployment Target
- **Platform**: Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: `VITE_API_BASE_URL`

---

## Environment Variables

### Development (.env.local)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Production (Vercel)
```env
VITE_API_BASE_URL=https://profitpulse-ihv0.onrender.com
```

---

## Browser Support

### Supported Browsers
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 13+
- Chrome Mobile: Last 2 versions

### Polyfills
- Modern JavaScript features (ES2020+)
- CSS Grid and Flexbox (native support)

---

## Future Enhancements

### Planned Features
- Real-time data updates via WebSocket
- Advanced filtering with multiple criteria
- Custom dashboard creation
- Saved searches and alerts
- User authentication and profiles
- Dark/light theme toggle
- Export to PDF reports

### Technical Improvements
- Service worker for offline support
- Progressive Web App (PWA) capabilities
- Server-side rendering (SSR) with Next.js
- End-to-end testing with Cypress
- Component documentation with Storybook

---

**Last Updated**: March 5, 2026  
**Status**: Production Ready  
**Version**: 1.0.0
