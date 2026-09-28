import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { customRoutes } from '@/routes/custom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>{customRoutes()}</Routes>
    </BrowserRouter>
  );
}
