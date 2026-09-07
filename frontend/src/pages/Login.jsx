import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../App.css'

function Login() {
  const [nomUtilisateur, setNomUtilisateur] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [message, setMessage] = useState('')

  const { connecter, loading } = useAuth()
  const navigate = useNavigate()

  const handleConnexion = async (e) => {
    e.preventDefault()

    setMessage('')

    const resultat = await connecter(
      nomUtilisateur,
      motDePasse
    )

    if (resultat.success) {
      navigate('/dashboard')
    } else {
      setMessage(resultat.message)
    }
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="hotel-header">

          <div className="hotel-icon">
            🏨
          </div>

          <h1>NGALANKA HOTEL</h1>

          <p>
            Système de gestion hôtelière
          </p>

        </div>

        <div className="login-content">

          <h2>Connexion</h2>

          <p className="welcome">
            Bienvenue dans votre espace de gestion
          </p>

          <form onSubmit={handleConnexion}>

            <div className="form-group">

              <label htmlFor="nomUtilisateur">
                Nom d'utilisateur
              </label>

              <input
                id="nomUtilisateur"
                type="text"
                placeholder="Entrez votre nom d'utilisateur"
                value={nomUtilisateur}
                onChange={(e) =>
                  setNomUtilisateur(e.target.value)
                }
                required
              />

            </div>

            <div className="form-group">

              <label htmlFor="motDePasse">
                Mot de passe
              </label>

              <input
                id="motDePasse"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={motDePasse}
                onChange={(e) =>
                  setMotDePasse(e.target.value)
                }
                required
              />

            </div>

            {message && (
              <div className="message">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? 'Connexion...'
                : 'Se connecter'}
            </button>

          </form>

        </div>

        <div className="login-footer">

          <p>
            © 2026 NGALANKA HOTEL
          </p>

          <span>
            Système de gestion hôtelière
          </span>

        </div>

      </div>

    </div>
  )
}

export default Login