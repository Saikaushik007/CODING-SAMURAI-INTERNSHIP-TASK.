from sklearn.linear_model import RidgeCV
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
import numpy as np

def train_linear(X_train, y_train):
    """Linear Regression with Ridge Regularization"""
    alphas = [0.01, 0.1, 1.0, 10.0, 100.0]
    model = RidgeCV(alphas=alphas, cv=5)
    model.fit(X_train, y_train)
    return model

def train_polynomial(X_train, y_train, degree: int = 3, auto_select: bool = True):
    """Polynomial Regression via Pipeline with Auto Degree Selection"""
    alphas = [0.01, 0.1, 1.0, 10.0]
    
    if auto_select and len(X_train) > 50:
        best_degree = 2
        best_score = float('-inf')
        for d in [2, 3, 4]:
            pipe = Pipeline([
                ('poly', PolynomialFeatures(degree=d, include_bias=False)),
                ('ridge', RidgeCV(alphas=alphas, cv=5))
            ])
            try:
                # Use negative MSE since cross_val_score maximizes
                score = np.mean(cross_val_score(pipe, X_train, y_train, cv=3, scoring='neg_mean_squared_error'))
                if score > best_score:
                    best_score = score
                    best_degree = d
            except:
                pass
        degree = best_degree
        
    model = Pipeline([
        ('poly', PolynomialFeatures(degree=degree, include_bias=False)),
        ('ridge', RidgeCV(alphas=alphas, cv=5))
    ])
    model.fit(X_train, y_train)
    model.selected_degree = degree
    return model

def predict(model, X):
    """Run prediction"""
    return model.predict(X)

def get_model_coefficients(model, feature_names):
    """Extract coefficients for explainability"""
    if isinstance(model, RidgeCV):
        return dict(zip(feature_names, model.coef_.tolist()))
    elif isinstance(model, Pipeline):
        # Extract from the 'ridge' step
        ridge_step = model.named_steps['ridge']
        return {"intercept": ridge_step.intercept_, "n_features": len(ridge_step.coef_)}
    return {}
