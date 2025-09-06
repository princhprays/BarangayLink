#!/usr/bin/env python3
"""
Simple script to populate Railway database with Philippine location data
Run this on Railway to populate the database
"""

import json
import os
import sys
from datetime import datetime, timezone

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import db
from models.location import Location

def load_location_data():
    """Load location data from PH_LOC.json"""
    try:
        # Try to find PH_LOC.json in the project root
        json_path = '../PH_LOC.json'
        if not os.path.exists(json_path):
            json_path = 'PH_LOC.json'
        if not os.path.exists(json_path):
            json_path = '/app/PH_LOC.json'  # Railway path
        
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: PH_LOC.json not found. Please upload it to Railway.")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None

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

def populate_locations():
    """Populate the database with location data"""
    print("🇵🇭 Starting Philippine location data population...")
    
    location_data = load_location_data()
    if not location_data:
        return False
    
    with app.app_context():
        try:
            # Clear existing location data
            print("Clearing existing location data...")
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
            
            print(f"Created region: {region.name}")
            
            province_index = 1
            municipality_index = 1
            barangay_index = 1
            
            # Process each province
            for province_name, municipalities in location_data.items():
                print(f"Processing province: {province_name}")
                
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
                        print(f"  Committed {barangay_index} records...")
            
            # Final commit
            db.session.commit()
            
            # Print statistics
            total = Location.query.count()
            regions = Location.query.filter_by(geographic_level="Reg").count()
            provinces = Location.query.filter_by(geographic_level="Prov").count()
            municipalities = Location.query.filter_by(geographic_level="Mun").count()
            cities = Location.query.filter_by(geographic_level="City").count()
            barangays = Location.query.filter_by(geographic_level="Bgy").count()
            
            print(f"\n✅ Population completed!")
            print(f"📊 Total locations: {total:,}")
            print(f"   Regions: {regions}")
            print(f"   Provinces: {provinces}")
            print(f"   Municipalities: {municipalities}")
            print(f"   Cities: {cities}")
            print(f"   Barangays: {barangays:,}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error during population: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    print("Starting location data population...")
    success = populate_locations()
    if success:
        print("🎉 Successfully populated database!")
    else:
        print("❌ Failed to populate database.")
        sys.exit(1)
