import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Compare from './pages/Compare';
import { CompareProvider } from './context/CompareContext';
import FloatingCompareBar from './components/FloatingCompareBar';
import ProjectPage from './pages/ProjectPage';
import ProjectsList from './pages/ProjectsList';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { ProjectProvider } from './context/ProjectContext';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import ProductList from './pages/admin/products/ProductList';
import ProductForm from './pages/admin/products/ProductForm';
import TagList from './pages/admin/tags/TagList';
import AnalysisList from './pages/admin/analysis/AnalysisList';
import AnalysisForm from './pages/admin/analysis/AnalysisForm';

function App() {
  return (
    <ProjectProvider>
      <CompareProvider>
        <ToastProvider>
          <BrowserRouter>
          <Routes>
            {/* Rota Administrativa Oculta */}
            <Route path="/gestor-nlf-admin">
              <Route index element={<AdminLogin />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="produtos" element={<ProductList />} />
                  <Route path="produtos/novo" element={<ProductForm />} />
                  <Route path="produtos/:id/editar" element={<ProductForm />} />
                  <Route path="tags" element={<TagList />} />
                  <Route path="analise" element={<AnalysisList />} />
                  <Route path="analise/novo" element={<AnalysisForm />} />
                  <Route path="analise/:id/editar" element={<AnalysisForm />} />
                </Route>
              </Route>
            </Route>

            {/* Rotas Públicas */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/catalogo" replace />} />
              <Route path="catalogo" element={<Catalog />} />
              <Route path="catalogo/:categoria" element={<Catalog />} />
              <Route path="produto/:slug" element={<ProductDetail />} />
              <Route path="comparar" element={<Compare />} />
              <Route path="projetos" element={<ProjectsList />} />
              <Route path="projetos/:id" element={<ProjectPage />} />
            </Route>
          </Routes>
          <FloatingCompareBar />
          </BrowserRouter>
        </ToastProvider>
      </CompareProvider>
    </ProjectProvider>
  );
}

export default App;
