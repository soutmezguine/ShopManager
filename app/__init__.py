from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
from config import Config

db = SQLAlchemy()
csrf = CSRFProtect()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
bcrypt = Bcrypt()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    csrf.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)

    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.main import main_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(main_bp)

    from flask import redirect, url_for, request
    from flask_login import current_user

    @app.before_request
    def check_must_change_password():
        if current_user.is_authenticated and current_user.must_change_password:
            if request.endpoint not in ['auth.change_password', 'auth.logout', 'static']:
                return redirect(url_for('auth.change_password'))

    return app
