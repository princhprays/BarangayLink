from flask import Blueprint, request, jsonify
from database import db
from models.location import Location
import json
import os

populate_bp = Blueprint('populate', __name__)

def generate_psgc_code(level, parent_code="", index=0):
    """Generate a simple PSGC code for locations without official codes"""
    if level == 1:  # Region
        return f"R{index:02d}"
    elif level == 2:  # Province
        return f"{parent_code}P{index:02d}"
    elif level == 3:  # Municipality/City
        return f"{parent_code}M{index:02d}"
    elif level == 4:  # Barangay
        return f"{parent_code}B{index:03d}"
    return f"LOC{index:06d}"

@populate_bp.route('/api/populate/locations', methods=['POST'])
def populate_locations():
    """API endpoint to populate locations from PH_LOC.json"""
    try:
        # Check if PH_LOC.json exists
        json_paths = [
            'PH_LOC.json',
            '../PH_LOC.json',
            '/app/PH_LOC.json'
        ]
        
        location_data = None
        for path in json_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    location_data = json.load(f)
                break
        
        if not location_data:
            return jsonify({
                'success': False,
                'message': 'PH_LOC.json not found. Please upload it first.'
            }), 400
        
        # Clear existing data
        Location.query.delete()
        db.session.commit()
        
        # Create Philippines region
        region = Location(
            psgc_code="R01",
            name="Philippines",
            geographic_level="Reg",
            level=1,
            parent_id=None
        )
        db.session.add(region)
        db.session.flush()
        region_id = region.id
        
        province_index = 1
        municipality_index = 1
        barangay_index = 1
        
        # Process each province
        for province_name, municipalities in location_data.items():
            # Create province
            province = Location(
                psgc_code=generate_psgc_code(2, "R01", province_index),
                name=province_name,
                geographic_level="Prov",
                level=2,
                parent_id=region_id
            )
            db.session.add(province)
            db.session.flush()
            province_id = province.id
            province_index += 1
            
            # Process municipalities/cities
            for municipality_name, barangays in municipalities.items():
                # Determine if it's a city
                is_city = "City" in municipality_name or municipality_name in [
                    "Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", 
                    "Malabon", "Mandaluyong", "Marikina", "Muntinlupa", "Navotas",
                    "Parañaque", "Pasay", "Pasig", "San Juan", "Taguig", "Valenzuela"
                ]
                
                municipality = Location(
                    psgc_code=generate_psgc_code(3, province.psgc_code, municipality_index),
                    name=municipality_name,
                    geographic_level="City" if is_city else "Mun",
                    level=3,
                    parent_id=province_id
                )
                db.session.add(municipality)
                db.session.flush()
                municipality_id = municipality.id
                municipality_index += 1
                
                # Process barangays
                for barangay_name in barangays:
                    barangay = Location(
                        psgc_code=generate_psgc_code(4, municipality.psgc_code, barangay_index),
                        name=barangay_name,
                        geographic_level="Bgy",
                        level=4,
                        parent_id=municipality_id
                    )
                    db.session.add(barangay)
                    barangay_index += 1
                
                # Commit every 500 records
                if barangay_index % 500 == 0:
                    db.session.commit()
        
        # Final commit
        db.session.commit()
        
        # Get statistics
        total = Location.query.count()
        regions = Location.query.filter_by(geographic_level="Reg").count()
        provinces = Location.query.filter_by(geographic_level="Prov").count()
        municipalities = Location.query.filter_by(geographic_level="Mun").count()
        cities = Location.query.filter_by(geographic_level="City").count()
        barangays = Location.query.filter_by(geographic_level="Bgy").count()
        
        return jsonify({
            'success': True,
            'message': 'Successfully populated database with Philippine location data',
            'statistics': {
                'total_locations': total,
                'regions': regions,
                'provinces': provinces,
                'municipalities': municipalities,
                'cities': cities,
                'barangays': barangays
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error populating database: {str(e)}'
        }), 500

@populate_bp.route('/api/populate/status', methods=['GET'])
def get_population_status():
    """Get current population status"""
    try:
        total = Location.query.count()
        regions = Location.query.filter_by(geographic_level="Reg").count()
        provinces = Location.query.filter_by(geographic_level="Prov").count()
        municipalities = Location.query.filter_by(geographic_level="Mun").count()
        cities = Location.query.filter_by(geographic_level="City").count()
        barangays = Location.query.filter_by(geographic_level="Bgy").count()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_locations': total,
                'regions': regions,
                'provinces': provinces,
                'municipalities': municipalities,
                'cities': cities,
                'barangays': barangays
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting status: {str(e)}'
        }), 500
