import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Screener from './pages/Screener';
import Company from './pages/Company';
import Compare from './pages/Compare';
import Alerts from './pages/Alerts';
import About from './pages/About';

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/company/:ticker" element={<Company />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
