# ProfitPulse - Financial Analysis and Prediction Platform

Advanced machine learning system for analyzing and predicting profitability of Vietnamese listed companies using PCA and ensemble models.

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Key Features](#key-features)
4. [Technology Stack](#technology-stack)
5. [Quick Start](#quick-start)
6. [Project Structure](#project-structure)
7. [Deployment](#deployment)
8. [Documentation](#documentation)
9. [Data and Models](#data-and-models)
10. [Security](#security)
11. [Contributing](#contributing)
12. [Support](#support)
13. [License](#license)

---

## Overview

ProfitPulse is a comprehensive financial analysis platform designed to provide data-driven insights into the profitability and risk profiles of companies listed on Vietnamese stock exchanges. The system leverages machine learning techniques, including Principal Component Analysis (PCA) and gradient boosting algorithms, to generate profit scores and risk classifications.

### Project Goals

- Provide transparent, reproducible financial analysis
- Enable rapid screening and comparison of company performance
- Detect significant changes in financial health through automated alerts
- Deliver actionable insights through intuitive data visualization

### Target Users

- Financial analysts researching Vietnamese stock markets
- Investment professionals seeking data-driven insights
- Individual investors tracking company performance
- Academic researchers studying financial metrics

---

## System Architecture

The platform follows a three-tier architecture:

```
Frontend Layer (React + Vite)
    |
    | HTTPS REST API
    v
Backend Layer (Flask + Python)
    |
    | SQL Queries
    v
Database Layer (Supabase PostgreSQL)
```

### Architecture Components

**Frontend Application**
- Single-page application built with React 18
- Vite-powered build system for fast development
- Deployed on Vercel with automatic CI/CD
- Responsive design supporting mobile and desktop

**Backend API Server**
- RESTful API built with Flask 3.0
- Python-based business logic and ML inference
- Deployed on Render with auto-scaling
- Gunicorn WSGI server for production

**Database System**
- PostgreSQL hosted on Supabase
- 4 primary tables storing company and financial data
- Optimized indexes for fast queries
- Regular backups and point-in-time recovery

---

## Key Features

### Company Analysis
- Detailed profitability scoring using PCA methodology
- Historical trend analysis spanning multiple years
- Risk classification with percentile rankings
- Principal component breakdown and interpretation

### Market Screening
- Filter companies by year and profit score range
- Sort and compare multiple metrics simultaneously
- Export filtered results to CSV format
- Visual charts highlighting top performers

### Comparison Tools
- Side-by-side analysis of up to 4 companies
- Multi-year trend visualization with line charts
- Synchronized metrics comparison tables
- Export comparison reports

### Alert System
- Automated detection of significant year-over-year changes
- Risk level notifications for high-risk companies
- Customizable alert filters and sorting
- Export alert lists for further analysis

### Model Transparency
- Detailed model performance metrics
- PCA variance explanations
- Risk label distribution analysis
- Methodology documentation

---

## Technology Stack

### Frontend Technologies

**Core Framework**
- React 18.3.1 - Component-based UI library
- React Router 7.1.1 - Client-side routing
- Vite 6.0.5 - Build tool and dev server

**Styling**
- Tailwind CSS 4.0.0 - Utility-first CSS framework
- PostCSS - CSS transformation

**Data Visualization**
- Recharts 2.15.0 - Composable charting library
- Lucide React 0.469.0 - Icon library

**Utilities**
- Axios 1.7.9 - HTTP client
- Custom hooks for state management

### Backend Technologies

**Web Framework**
- Flask 3.0.3 - Lightweight Python web framework
- Flask-CORS 5.0.0 - Cross-origin resource sharing

**Data Processing**
- pandas 2.2.3 - Data manipulation and analysis
- NumPy 2.2.1 - Numerical computing

**Machine Learning**
- scikit-learn 1.6.1 - ML algorithms and utilities
- XGBoost 2.1.3 - Gradient boosting framework

**Database**
- Supabase 2.12.3 - PostgreSQL client library
- psycopg2 - PostgreSQL adapter

**Deployment**
- Gunicorn 23.0.0 - WSGI HTTP server
- python-dotenv 1.0.1 - Environment variable management

### Infrastructure

**Hosting Platforms**
- Vercel - Frontend hosting and CDN
- Render - Backend API hosting
- Supabase - Managed PostgreSQL database

**Version Control**
- Git - Source control
- GitHub - Repository hosting and CI/CD

---

## Quick Start

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- Git

### Local Development Setup

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix/MacOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with required variables
# See docs/ENVIRONMENT_VARIABLES.md for details
cp .env.example .env

# Run development server
python app.py
```

Backend will start on `http://localhost:5000`

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "VITE_API_BASE_URL=http://localhost:5000" > .env.local

# Run development server
npm run dev
```

Frontend will start on `http://localhost:5173`

### Testing the Installation

**Backend Health Check**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "status": "ok",
  "message": "ProfitPulse API is running",
  "database": "Supabase PostgreSQL",
  "version": "1.0.0"
}
```

**Frontend Access**
Open browser and navigate to `http://localhost:5173`

---

## Project Structure

```
profitpulse/
├── README.md                          # This file
├── QUICK_START.md                     # Detailed setup instructions
├── DEPLOYMENT.md                      # Production deployment guide
├── DATA_FIELDS_MAPPING.md             # Database schema reference
├── FRONTEND_STRUCTURE.md              # Frontend architecture documentation
├── requirements.txt                   # Root-level Python dependencies
├── vercel.json                        # Vercel deployment configuration
│
├── frontend/                          # React frontend application
│   ├── src/
│   │   ├── App.jsx                   # Main application component
│   │   ├── main.jsx                  # Application entry point
│   │   ├── index.css                 # Global styles
│   │   ├── pages/                    # Page components (7 pages)
│   │   │   ├── Home.jsx              # Dashboard overview
│   │   │   ├── Screener.jsx          # Company filtering
│   │   │   ├── Company.jsx           # Company detail analysis
│   │   │   ├── Compare.jsx           # Multi-company comparison
│   │   │   ├── Alerts.jsx            # Change detection alerts
│   │   │   ├── About.jsx             # Methodology documentation
│   │   │   └── ModelPerformance.jsx  # Model metrics display
│   │   ├── components/               # Reusable UI components (10 components)
│   │   ├── services/                 # API client layer
│   │   ├── hooks/                    # Custom React hooks
│   │   └── utils/                    # Helper functions
│   ├── public/                       # Static assets
│   ├── package.json                  # Node dependencies
│   ├── vite.config.js                # Vite configuration
│   └── tailwind.config.js            # Tailwind CSS configuration
│
├── backend/                           # Flask backend API
│   ├── app.py                        # Main Flask application
│   ├── database.py                   # Supabase database client
│   ├── requirements.txt              # Python dependencies
│   ├── runtime.txt                   # Python version specification
│   ├── Procfile                      # Render deployment configuration
│   ├── core/                         # Business logic modules
│   │   ├── data_loader.py           # Data loading utilities
│   │   ├── preprocessing.py         # Data cleaning and transformation
│   │   ├── pca_profitscore.py       # PCA scoring implementation
│   │   ├── ml_models.py             # ML model definitions
│   │   ├── labeling.py              # Risk labeling logic
│   │   └── explanations.py          # Result interpretation
│   └── utils/                        # Helper utilities
│
├── api/                               # Vercel serverless API (optional)
│   └── index.py                      # Serverless endpoint wrapper
│
├── docs/                              # Additional documentation
│   ├── ARCHITECTURE.md               # System design details
│   ├── ENVIRONMENT_VARIABLES.md      # Configuration reference
│   └── TROUBLESHOOTING.md            # Common issues and solutions
│
└── scripts/                           # Data processing and utilities
    ├── supabase/                     # Database management scripts
    │   ├── upload_data.py           # Data upload utility
    │   ├── test_connection.py       # Connection verification
    │   └── upload.sh                # Batch upload script
    └── utils/                        # General utilities
        ├── process_data.py          # Data transformation
        ├── test_api.py              # API testing
        └── start.sh                 # Development startup script
```

---

## Deployment

### Production Environments

**Frontend (Vercel)**
- Platform: Vercel
- URL: https://profitpulse.vercel.app (pending)
- Build Command: `npm run build`
- Output Directory: `dist`
- Auto-deploy: Enabled on push to main branch

**Backend (Render)**
- Platform: Render Web Service
- URL: https://profitpulse-ihv0.onrender.com
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`
- Instance Type: Free tier (scales on demand)

**Database (Supabase)**
- Platform: Supabase (Managed PostgreSQL)
- Region: Asia-Pacific (Singapore)
- Plan: Free tier (up to 500MB)
- Backups: Daily automatic backups

### Environment Variables

Required environment variables for each component:

**Backend (.env)**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key
FLASK_ENV=production
PORT=5000
```

**Frontend (.env.local or Vercel)**
```
VITE_API_BASE_URL=https://profitpulse-ihv0.onrender.com
```

See [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) for complete reference.

### Deployment Workflow

1. Push changes to GitHub repository
2. Frontend auto-deploys via Vercel GitHub integration
3. Backend auto-deploys via Render GitHub integration
4. Database migrations applied manually via Supabase dashboard

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Documentation

### Core Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | Step-by-step local development setup |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment procedures |
| [DATA_FIELDS_MAPPING.md](DATA_FIELDS_MAPPING.md) | Complete database schema and API field reference |
| [FRONTEND_STRUCTURE.md](FRONTEND_STRUCTURE.md) | Frontend architecture and component documentation |

### Additional Resources

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and architectural decisions |
| [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | Configuration variables reference |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and debugging guide |

---

## Data and Models

### Data Sources

**Financial Metrics**
- Source: Audited financial reports from Vietnamese listed companies
- Coverage: 628 companies across HoSE, HNX, and UPCOM exchanges
- Time Range: 1999 - 2025 (27 years)
- Records: ~10,000 company-year observations

**Key Financial Indicators**
- X1_ROA: Return on Assets
- X2_ROE: Return on Equity
- X3_ROC: Return on Capital
- X4_EPS: Earnings per Share
- X5_NPM: Net Profit Margin

### Machine Learning Models

**Principal Component Analysis (PCA)**
- Purpose: Dimensionality reduction and profit scoring
- Input: Normalized financial metrics (5 features)
- Output: 3 principal components (PC1, PC2, PC3)
- Variance Explained: Approximately 85% (PC1+PC2+PC3)

**Profit Score Calculation**
```
ProfitScore = weighted_sum(PC1, PC2, PC3)
```
- Range: Typically -3 to +9
- Interpretation: Higher scores indicate better profitability

**Risk Classification**
- Model Type: XGBoost / Random Forest ensemble
- Input: ProfitScore, PC1-PC3, financial metrics
- Output: Binary risk label (0=Low Risk, 1=High Risk)
- Threshold: Percentile-based classification

**Percentile Ranking**
- Calculated within each year
- Range: 0-100
- Interpretation: Position relative to all companies in same year

### Model Performance

**Metrics Available**
- Variance explained by each principal component
- Feature loadings and contributions
- Risk label distribution
- Year-over-year consistency

For detailed model documentation, visit `/performance` page in the application.

---

## Security

### Security Measures

**Authentication and Authorization**
- Service role key for backend-to-database communication
- No direct database access from frontend
- Row-level security policies in Supabase (optional)

**Data Protection**
- Environment variables for sensitive credentials
- No hardcoded secrets in codebase
- HTTPS enforcement for all API communications

**CORS Configuration**
- Whitelisted origins for API access
- Preflight request handling
- Secure header policies

**Input Validation**
- Backend validation for all API inputs
- SQL injection prevention via parameterized queries
- XSS protection in frontend rendering

### Best Practices

- Regular dependency updates for security patches
- Automated vulnerability scanning
- Minimal privilege access for service accounts
- Secure session management
- API rate limiting (planned)

---

## Contributing

This is primarily a personal research project. However, contributions are welcome in the following areas:

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting
- Provide clear commit messages

### Areas for Contribution

- Bug fixes and error handling improvements
- Additional data visualizations
- Performance optimizations
- Documentation enhancements
- New analysis features

---

## Support

### Getting Help

For issues or questions:

1. **Check Documentation**
   - Review [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues
   - Consult API reference in [DATA_FIELDS_MAPPING.md](DATA_FIELDS_MAPPING.md)

2. **Verify System Status**
   - Backend health: https://profitpulse-ihv0.onrender.com/health
   - Check deployment logs on Render/Vercel dashboards

3. **Report Issues**
   - Create an issue on GitHub with detailed description
   - Include error messages, screenshots, and reproduction steps

### Contact Information

- Project Maintainer: [Your Name/Email]
- Repository: https://github.com/[your-username]/profitpulse

---

## License

This project is a personal research initiative. All rights reserved.

### Usage Terms

- Code is provided as-is without warranty
- Not intended as financial or investment advice
- Users responsible for their own investment decisions
- Attribution required for academic or commercial use

---

## Project Status

**Version**: 1.0.0  
**Last Updated**: March 5, 2026  
**Status**: Production Ready

### Recent Updates

- March 2026: Initial production release
- Complete database schema with 628 companies
- Full frontend implementation with 7 pages
- Comprehensive API with 8 endpoints
- Deployment on Vercel and Render

### Roadmap

**Upcoming Features**
- User authentication and personalized dashboards
- Real-time data updates via WebSocket
- Advanced portfolio analysis tools
- Mobile application (iOS/Android)
- Additional ML models and predictions

**Technical Improvements**
- Progressive Web App (PWA) support
- Server-side rendering for SEO
- Enhanced caching and performance
- Comprehensive test coverage
- API versioning and deprecation policy

---

### Acknowledgments

- Financial data sources: Vietnamese stock exchanges
- Open source libraries and frameworks used throughout the project
- Community feedback and suggestions

---

**Built with dedication to transparency and data-driven financial analysis.**
