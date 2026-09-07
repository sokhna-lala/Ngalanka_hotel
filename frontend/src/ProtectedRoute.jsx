import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { estConnecte } = useAuth()

  if (!estConnecte) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute