import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

// Middleware pour protéger les routes en vérifiant le token JWT.
const protect = async (req, res, next) => {
  try {
    // Récupérer le token JWT depuis les cookies.
    const token = req.cookies.jwt;

    // Si le token est absent, retourner une erreur 401 (non autorisé).
    if (!token) {
      res.status(401);
      throw new Error('Authentication failed: Token not provided.');
    }

    // Vérifier et décoder le token JWT
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Si le token est invalide ou expiré, une erreur sera lancée
    if (!decodedToken) {
      res.clearCookie('jwt'); // Supprimer le cookie JWT
      res.status(401);
      throw new Error('Authentication failed: Invalid token.');
    }

    // Chercher l'utilisateur dans la base de données en utilisant l'ID du token
    req.user = await User.findById(decodedToken.userId).select('-password');

    if (!req.user) {
      res.clearCookie('jwt'); // Supprimer le cookie JWT si l'utilisateur n'est pas trouvé
      res.status(401);
      throw new Error('Authentication failed: User not found.');
    }

    // Passer au middleware suivant
    next();
  } catch (error) {
    // Gérer les erreurs spécifiques au JWT
    if (error instanceof jwt.JsonWebTokenError) {
      res.clearCookie('jwt'); // Supprimer le cookie JWT en cas d'erreur de token
      res.status(401).json({ message: 'Authentication failed: Invalid or expired token.' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.clearCookie('jwt'); // Supprimer le cookie JWT si le token a expiré
      res.status(401).json({ message: 'Authentication failed: Token expired.' });
    } else {
      res.status(401).json({ message: error.message || 'Authentication failed' });
    }
  }
};

// Middleware pour vérifier si l'utilisateur est un administrateur.
const admin = (req, res, next) => {
  try {
    // Vérifier si l'utilisateur existe et s'il est un administrateur
    if (!req.user || !req.user.isAdmin) {
      res.status(401);
      throw new Error('Authorization failed: Not authorized as an admin.');
    }
    next();
  } catch (error) {
    res.status(401).json({ message: error.message || 'Authorization failed' });
  }
};

export { protect, admin };
