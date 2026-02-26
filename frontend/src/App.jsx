import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Screener from './pages/Screener';
import Company from './pages/Company';
import Compare from './pages/Compare';
import Alerts from './pages/Alerts';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/screener" element={<Screener />} />
        <Route path="/company/:ticker" element={<Company />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </Layout>
  );
}

export default App;
