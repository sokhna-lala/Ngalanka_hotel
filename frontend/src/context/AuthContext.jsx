import { createContext, useContext, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const utilisateurSauvegarde = localStorage.getItem('utilisateur')
    return utilisateurSauvegarde
      ? JSON.parse(utilisateurSauvegarde)
      : null
  })

  const [loading, setLoading] = useState(false)

  const connecter = async (nom_utilisateur, mot_de_passe) => {
    setLoading(true)

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        {
          nom_utilisateur,
          mot_de_passe,
        }
      )

      const utilisateurConnecte = response.data.utilisateur

      setUtilisateur(utilisateurConnecte)

      localStorage.setItem(
        'utilisateur',
        JSON.stringify(utilisateurConnecte)
      )

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      console.error('Erreur de connexion :', error)

      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Erreur lors de la connexion',
      }
    } finally {
      setLoading(false)
    }
  }

  const deconnecter = () => {
    setUtilisateur(null)
    localStorage.removeItem('utilisateur')
  }

  const estConnecte = !!utilisateur

  return (
    <AuthContext.Provider
      value={{
        utilisateur,
        connecter,
        deconnecter,
        estConnecte,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}