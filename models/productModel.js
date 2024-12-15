import mongoose from 'mongoose';

// Définir le schéma pour les évaluations de produits
const reviewSchema = new mongoose.Schema(
  {
    // Référence à l'utilisateur qui a soumis l'évaluation
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    // Nom de l'évaluateur
    name: {
      type: String,
      required: true
    },
    // Note donnée dans l'évaluation
    rating: {
      type: Number,
      required: true,
      min: 1,  // Note minimale
      max: 5   // Note maximale
    },
    // Commentaire fourni dans l'évaluation
    comment: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Définir le schéma pour les produits
const productSchema = new mongoose.Schema(
  {
    // Référence à l'utilisateur qui a créé le produit
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    // Nom du produit
    name: {
      type: String,
      required: true
    },
    // URL de l'image du produit
    image: {
      type: String,
      required: true
    },
    // Description du produit
    description: {
      type: String,
      required: true
    },
    // Marque du produit
    brand: {
      type: String,
      required: true
    },
    // Catégorie du produit
    category: {
      type: String,
      required: true
    },
    // Prix du produit
    price: {
      type: Number,
      required: true,
      default: 0
    },
    // Quantité disponible en stock
    countInStock: {
      type: Number,
      required: true,
      default: 0
    },
    // Tableau des évaluations associées au produit
    reviews: [reviewSchema],
    // Note moyenne du produit, calculée automatiquement
    rating: {
      type: Number,
      default: 0
    },
    // Nombre d'évaluations du produit
    numReviews: {
      type: Number,
      required: true,
      default: 0
    },
  },
  { timestamps: true }
);

// Méthode pour ajouter une évaluation et recalculer la note moyenne
productSchema.methods.addReview = async function (review) {
  // Ajouter la nouvelle évaluation dans le tableau des évaluations
  this.reviews.push(review);
  this.numReviews = this.reviews.length;

  // Calculer la nouvelle note moyenne
  this.rating = this.reviews.reduce((acc, review) => acc + review.rating, 0) / this.reviews.length;

  // Sauvegarder le produit après mise à jour
  await this.save();
};

// Créer le modèle Product
const Product = mongoose.model('Product', productSchema);

// Exporter le modèle Product
export default Product;
