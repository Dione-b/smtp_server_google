from flask import Flask, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from utils import mail
from routes import app as api_blueprint

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    jwt = JWTManager(app)
    CORS(app, resources=app.config['CORS_RESOURCES'])
    db.init_app(app)
    mail.init_app(app)
    
    app.register_blueprint(api_blueprint, url_prefix='/api')
    
    @app.route('/')
    def index():
        return render_template('login.html')
    
    @app.route('/login')
    def login():
        return render_template('login.html')
    
    @app.route('/dashboard')
    def dashboard():
        return render_template('dashboard.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True)
