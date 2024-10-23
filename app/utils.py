import json
import os

geo_resources_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'GeoResources', 'path'))
line_geojson_file = os.path.join(geo_resources_dir, 'line.geojson')

def get_coordinates_by_id(point_id, geojson_file):
    with open(geojson_file) as f:
        data = json.load(f)
        for feature in data['features']:
            if feature['properties']['id'] == point_id:
                return feature['geometry']['coordinates']
    return None 

def get_route_by_control_and_interest(control_id, interest_id):
    with open(line_geojson_file, 'r') as f:
        data = json.load(f)
        route_id = f"{control_id}-{interest_id}"
        for feature in data['features']:
            if feature['properties']['id'] == route_id:
                return feature
    return None