#!/usr/bin/env python3
"""
Script to populate Railway PostgreSQL database with Philippine location data from PH_LOC.json
"""

import json
import os
import sys
from datetime import datetime, timezone

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import db
from models.location import Location

def load_location_data():
    """Load location data from PH_LOC.json"""
    try:
        with open('../PH_LOC.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: PH_LOC.json not found. Make sure it's in the project root.")
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
    print("Loading location data from PH_LOC.json...")
    location_data = load_location_data()
    
    if not location_data:
        return False
    
    print("Starting database population...")
    
    with app.app_context():
        # Clear existing location data
        print("Clearing existing location data...")
        Location.query.delete()
        db.session.commit()
        
        region_id = None
        province_id = None
        municipality_id = None
        
        region_index = 1
        province_index = 1
        municipality_index = 1
        barangay_index = 1
        
        # Create a default region (we'll use the first province's region)
        region = Location(
            psgc_code=generate_psgc_code(1, "", region_index),
            name="Philippines",
            geographic_level="Reg",
            level=1,
            parent_id=None
        )
        db.session.add(region)
        db.session.flush()  # Get the ID
        region_id = region.id
        region_index += 1
        
        print(f"Created region: {region.name}")
        
        # Process each province
        for province_name, municipalities in location_data.items():
            print(f"Processing province: {province_name}")
            
            # Create province
            province = Location(
                psgc_code=generate_psgc_code(2, region.psgc_code, province_index),
                name=province_name,
                geographic_level="Prov",
                level=2,
                parent_id=region_id
            )
            db.session.add(province)
            db.session.flush()  # Get the ID
            province_id = province.id
            province_index += 1
            
            print(f"  Created province: {province_name}")
            
            # Process each municipality/city in the province
            for municipality_name, barangays in municipalities.items():
                print(f"    Processing municipality: {municipality_name}")
                
                # Determine if it's a city or municipality
                # Simple heuristic: if it contains "City" or is a major city, mark as City
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
                db.session.flush()  # Get the ID
                municipality_id = municipality.id
                municipality_index += 1
                
                print(f"      Created {'city' if is_city else 'municipality'}: {municipality_name}")
                
                # Process each barangay in the municipality
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
                
                print(f"        Added {len(barangays)} barangays")
                
                # Commit every 1000 records to avoid memory issues
                if barangay_index % 1000 == 0:
                    db.session.commit()
                    print(f"        Committed {barangay_index} records so far...")
        
        # Final commit
        print("Committing final changes...")
        db.session.commit()
        
        # Print statistics
        total_locations = Location.query.count()
        regions = Location.query.filter_by(geographic_level="Reg").count()
        provinces = Location.query.filter_by(geographic_level="Prov").count()
        municipalities = Location.query.filter_by(geographic_level="Mun").count()
        cities = Location.query.filter_by(geographic_level="City").count()
        barangays = Location.query.filter_by(geographic_level="Bgy").count()
        
        print(f"\n✅ Database population completed!")
        print(f"📊 Statistics:")
        print(f"   Total locations: {total_locations:,}")
        print(f"   Regions: {regions}")
        print(f"   Provinces: {provinces}")
        print(f"   Municipalities: {municipalities}")
        print(f"   Cities: {cities}")
        print(f"   Barangays: {barangays:,}")
        
        return True

def main():
    """Main function"""
    print("🇵🇭 Philippine Location Data Population Script")
    print("=" * 50)
    
    try:
        success = populate_locations()
        if success:
            print("\n🎉 Successfully populated Railway database with Philippine location data!")
        else:
            print("\n❌ Failed to populate database.")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
