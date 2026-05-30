import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { ToastProvider } from './components/Toast'
import { CategoriaFormPage } from './features/categories/CategoriaFormPage'
import { CategoriasIndexPage } from './features/categories/CategoriasIndexPage'
import { ProductoFormPage } from './features/products/ProductoFormPage'
import { ProductoShowPage } from './features/products/ProductoShowPage'
import { ProductosIndexPage } from './features/products/ProductosIndexPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 20_000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="productos" element={<ProductosIndexPage />} />
                <Route path="productos/nuevo" element={<ProductoFormPage />} />
                <Route path="productos/:id" element={<ProductoShowPage />} />
                <Route path="productos/:id/editar" element={<ProductoFormPage />} />
                <Route path="categorias" element={<CategoriasIndexPage />} />
                <Route path="categorias/nueva" element={<CategoriaFormPage />} />
                <Route path="categorias/:id/editar" element={<CategoriaFormPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
