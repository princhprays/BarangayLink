from flask import Blueprint, request, jsonify
from database import db
from models.location import Location

locations_bp = Blueprint('locations', __name__)

@locations_bp.route('/provinces', methods=['GET'])
def get_provinces():
    """Get all provinces"""
    try:
        provinces = Location.get_provinces()
        
        return jsonify({
            'provinces': [province.to_dict() for province in provinces]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@locations_bp.route('/municipalities', methods=['GET'])
def get_municipalities():
    """Get municipalities/cities by province"""
    try:
        province_id = request.args.get('province_id', type=int)
        
        if not province_id:
            return jsonify({'error': 'province_id parameter is required'}), 400
        
        # Verify province exists
        province = Location.query.get(province_id)
        if not province or province.geographic_level != 'Prov':
            return jsonify({'error': 'Invalid province'}), 400
        
        municipalities = Location.get_municipalities_by_province(province_id)
        
        return jsonify({
            'province': province.to_dict(),
            'municipalities': [municipality.to_dict() for municipality in municipalities]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@locations_bp.route('/barangays', methods=['GET'])
def get_barangays():
    """Get barangays by municipality/city"""
    try:
        municipality_id = request.args.get('municipality_id', type=int)
        
        if not municipality_id:
            return jsonify({'error': 'municipality_id parameter is required'}), 400
        
        # Verify municipality exists
        municipality = Location.query.get(municipality_id)
        if not municipality or municipality.geographic_level not in ['City', 'Mun']:
            return jsonify({'error': 'Invalid municipality/city'}), 400
        
        barangays = Location.get_barangays_by_municipality(municipality_id)
        
        return jsonify({
            'municipality': municipality.to_dict(),
            'barangays': [barangay.to_dict() for barangay in barangays]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@locations_bp.route('/search', methods=['GET'])
def search_locations():
    """Search locations by name"""
    try:
        query = request.args.get('q', '').strip()
        level = request.args.get('level', '').strip()  # Optional: Reg, Prov, City, Mun, Bgy
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        # Build search query
        search_query = Location.query.filter(
            Location.name.ilike(f'%{query}%')
        )
        
        # Filter by level if specified
        if level:
            search_query = search_query.filter(Location.geographic_level == level)
        
        # Limit results
        limit = request.args.get('limit', 50, type=int)
        search_query = search_query.limit(limit)
        
        locations = search_query.all()
        
        return jsonify({
            'query': query,
            'level': level,
            'locations': [location.to_dict() for location in locations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@locations_bp.route('/hierarchy/<int:location_id>', methods=['GET'])
def get_location_hierarchy(location_id):
    """Get full location hierarchy for a given location"""
    try:
        location = Location.query.get(location_id)
        
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        
        hierarchy = []
        current = location
        
        # Build hierarchy from bottom to top
        while current:
            hierarchy.insert(0, current.to_dict())
            current = current.parent
        
        return jsonify({
            'location': location.to_dict(),
            'hierarchy': hierarchy
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@locations_bp.route('/stats', methods=['GET'])
def get_location_stats():
    """Get location statistics"""
    try:
        stats = {
            'total_locations': Location.query.count(),
            'regions': Location.query.filter_by(geographic_level='Reg').count(),
            'provinces': Location.query.filter_by(geographic_level='Prov').count(),
            'cities': Location.query.filter_by(geographic_level='City').count(),
            'municipalities': Location.query.filter_by(geographic_level='Mun').count(),
            'barangays': Location.query.filter_by(geographic_level='Bgy').count()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
