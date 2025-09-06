from database import db
from datetime import datetime, timezone

class Location(db.Model):
    __tablename__ = 'locations'
    
    id = db.Column(db.Integer, primary_key=True)
    psgc_code = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    correspondence_code = db.Column(db.String(10), nullable=True)
    geographic_level = db.Column(db.String(20), nullable=False)  # Reg, Prov, City, Mun, Bgy
    old_names = db.Column(db.Text, nullable=True)
    city_class = db.Column(db.String(50), nullable=True)
    income_classification = db.Column(db.String(50), nullable=True)
    urban_rural = db.Column(db.String(10), nullable=True)  # U, R
    population_2020 = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(50), nullable=True)
    
    # Hierarchical relationships
    parent_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    level = db.Column(db.Integer, nullable=False)  # 1=Region, 2=Province, 3=City/Mun, 4=Barangay
    
    # Relationships
    parent = db.relationship('Location', remote_side=[id], backref='children')
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    def __repr__(self):
        return f'<Location {self.name} ({self.geographic_level})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'psgc_code': self.psgc_code,
            'name': self.name,
            'correspondence_code': self.correspondence_code,
            'geographic_level': self.geographic_level,
            'old_names': self.old_names,
            'city_class': self.city_class,
            'income_classification': self.income_classification,
            'urban_rural': self.urban_rural,
            'population_2020': self.population_2020,
            'status': self.status,
            'parent_id': self.parent_id,
            'level': self.level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def get_provinces():
        """Get all provinces"""
        return Location.query.filter_by(geographic_level='Prov').all()
    
    @staticmethod
    def get_municipalities_by_province(province_id):
        """Get municipalities/cities by province"""
        return Location.query.filter(
            Location.parent_id == province_id,
            Location.geographic_level.in_(['City', 'Mun'])
        ).all()
    
    @staticmethod
    def get_barangays_by_municipality(municipality_id):
        """Get barangays by municipality/city"""
        return Location.query.filter(
            Location.parent_id == municipality_id,
            Location.geographic_level == 'Bgy'
        ).all()
    
    @staticmethod
    def get_by_psgc_code(psgc_code):
        """Get location by PSGC code"""
        return Location.query.filter_by(psgc_code=psgc_code).first()
