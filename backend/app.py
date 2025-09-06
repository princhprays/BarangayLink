from flask import Flask, send_from_directory
from flask_restful import Api
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from database import db
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire for now
app.config['JWT_BLACKLIST_ENABLED'] = True
app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access']
app.config['FRONTEND_URL'] = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Database configuration
if os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('FLASK_ENV') == 'production':
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///barangaylink.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
api = Api(app)
CORS(app)

# JWT blacklist checking
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    from models.jwt_blacklist import JWTBlacklist
    jti = jwt_payload['jti']
    return JWTBlacklist.is_blacklisted(jti)

# Import models (to ensure they're registered with SQLAlchemy)
from models import *

# Import and register API routes
from routes.auth import auth_bp
from routes.barangay import barangay_bp
from routes.residents import residents_bp
from routes.admin import admin_bp
from routes.marketplace import marketplace_bp
from routes.benefits import benefits_bp
from routes.announcements import announcements_bp
from routes.documents import documents_bp
from routes.sos import sos_bp
from routes.relocation import relocation_bp
from routes.locations import locations_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(barangay_bp, url_prefix='/api/barangay')
app.register_blueprint(residents_bp, url_prefix='/api/residents')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(marketplace_bp, url_prefix='/api/marketplace')
app.register_blueprint(benefits_bp, url_prefix='/api/benefits')
app.register_blueprint(announcements_bp, url_prefix='/api/announcements')
app.register_blueprint(documents_bp, url_prefix='/api/documents')
app.register_blueprint(sos_bp, url_prefix='/api/sos')
app.register_blueprint(relocation_bp, url_prefix='/api/relocation')
app.register_blueprint(locations_bp, url_prefix='/api/locations')

@app.route('/')
def health_check():
    return {'status': 'healthy', 'message': 'BarangayLink API is running'}

@app.route('/api/health')
def api_health_check():
    return {'status': 'healthy', 'message': 'BarangayLink API is running', 'version': '1.0.0'}

@app.route('/uploads/documents/<filename>')
def serve_document(filename):
    """Serve generated PDF documents"""
    uploads_dir = os.path.join(app.root_path, 'uploads', 'documents')
    return send_from_directory(uploads_dir, filename)

@app.route('/uploads/<path:file_path>')
def serve_file(file_path):
    """Serve uploaded files"""
    uploads_dir = os.path.join(app.root_path, 'uploads')
    return send_from_directory(uploads_dir, file_path)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    # Get port from environment variable (Railway sets this)
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') != 'production'
    
    app.run(debug=debug, host='0.0.0.0', port=port)
