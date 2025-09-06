from database import db
from datetime import datetime, timezone

class JWTBlacklist(db.Model):
    __tablename__ = 'jwt_blacklist'
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True)  # JWT ID
    token_type = db.Column(db.String(10), nullable=False)  # 'access' or 'refresh'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    revoked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    expires_at = db.Column(db.DateTime, nullable=False)
    
    def __repr__(self):
        return f'<JWTBlacklist {self.jti}>'
    
    @classmethod
    def is_blacklisted(cls, jti):
        """Check if a JWT ID is blacklisted"""
        return cls.query.filter_by(jti=jti).first() is not None
    
    @classmethod
    def add_to_blacklist(cls, jti, token_type, user_id=None, expires_at=None):
        """Add a JWT ID to the blacklist"""
        blacklist_entry = cls(
            jti=jti,
            token_type=token_type,
            user_id=user_id,
            expires_at=expires_at or datetime.now(timezone.utc).replace(tzinfo=None)
        )
        db.session.add(blacklist_entry)
        db.session.commit()
        return blacklist_entry
