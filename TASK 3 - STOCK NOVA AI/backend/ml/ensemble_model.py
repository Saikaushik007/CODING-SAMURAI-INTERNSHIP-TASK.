from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

def train_random_forest(X_train, y_train, n_estimators=100, random_state=42):
    """
    Train a Random Forest Regressor.
    """
    model = RandomForestRegressor(n_estimators=n_estimators, random_state=random_state)
    model.fit(X_train, y_train)
    return model

def train_gradient_boosting(X_train, y_train, n_estimators=100, learning_rate=0.1, random_state=42):
    """
    Train a Gradient Boosting Regressor.
    """
    model = GradientBoostingRegressor(n_estimators=n_estimators, learning_rate=learning_rate, random_state=random_state)
    model.fit(X_train, y_train)
    return model
