import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import WelcomePage from './pages/WelcomePage.jsx';
import SurveyPage from './pages/SurveyPage.jsx';
import DemoPage from './pages/DemoPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<WelcomePage />} />
        <Route path="/survey"   element={<SurveyPage />} />
        <Route path="/demo"     element={<DemoPage />} />
        <Route path="/admin"    element={<AdminPage />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
