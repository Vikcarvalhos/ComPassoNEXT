from flask import Blueprint, render_template_string, request, jsonify, make_response
import folium
import branca
import os
import json
from folium.plugins import AntPath
from folium.raster_layers import ImageOverlay
from folium.plugins import LocateControl
from .utils import get_coordinates_by_id, get_route_by_control_and_interest
import uuid

main = Blueprint('main', __name__)

# Caminho dos arquivos GeoJSON
geo_resources_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'GeoResources', 'model'))
control_geojson_file = os.path.join(geo_resources_dir, 'control.geojson')
interest_geojson_file = os.path.join(geo_resources_dir, 'interest.geojson')
auxpoint_geojson_file = os.path.join(geo_resources_dir, 'auxpoint.geojson')
line_geojson_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'GeoResources', 'path', 'line.geojson'))

# Verificar o caminho gerado para garantir que o arquivo seja encontrado
print(f"Caminho gerado para o control.geojson: {control_geojson_file}")

# Rota para carregar o mapa com os pontos
@main.route('/map', methods=['GET'])
def iframe():
    # Coordenadas dos vértices da planta baixa
    vertex1 = [-23.53992316266249, -46.73528262010234]
    vertex2 = [-23.540391059102745, -46.73477225093106]
    vertex3 = [-23.539533842981285, -46.73385670318282]
    vertex4 = [-23.539073087007395, -46.734374864248736]

    # Coordenadas iniciais do mapa
    UMMlocation = [-23.5396664, -46.734547]
    m = folium.Map(location=UMMlocation, zoom_start=18, max_zoom=22)

    # Adicionar a planta baixa como uma imagem (ImageOverlay)
    image_path = os.path.join(os.path.dirname(__file__), '../static/images/planta_baixa.png')
    bounds = [vertex1, vertex2, vertex3, vertex4]
    ImageOverlay(image=image_path, bounds=bounds, opacity=1).add_to(m)

    # Adicionar o controle de localização se HTTPS estiver disponível
    if request.is_secure:
        LocateControl(auto_start=True).add_to(m)
    else:
        print("HTTPS não detectado. Controle de localização não adicionado.")

    # Carregar os pontos de controle e de interesse
    for geojson_file, color in [(control_geojson_file, 'red'), (interest_geojson_file, 'blue')]:
        try:
            with open(geojson_file, 'r') as f:
                points_data = json.load(f)
            for feature in points_data['features']:
                lat, lon = feature['geometry']['coordinates'][1], feature['geometry']['coordinates'][0]
                point_name = feature['properties']['name']
                folium.Marker([lat, lon], popup=point_name, icon=folium.Icon(color=color)).add_to(m)
        except FileNotFoundError:
            pass

    # Adicionar LatLng Popup (exibe coordenadas ao clicar)
    folium.LatLngPopup().add_to(m)

    # Usar branca para ajustar o tamanho do mapa
    fig = branca.element.Figure(height='100%', width='100%')
    fig.add_child(m)

    # Gerar o HTML do mapa com a altura ajustada
    map_html = fig.render()

    # Adicionar estilos para garantir que o mapa ocupe 100% da tela
    style = "<style>body, html { margin: 0; padding: 0; height: 100%; }</style>"
    map_html = style + map_html

    response = make_response(render_template_string(map_html))
    response.headers['Permissions-Policy'] = 'geolocation=*'
    return response

# Rota para obter todos os pontos de controle e de interesse
@main.route('/get_points', methods=['GET'])
def get_points():
    points = {"features": []}
    for geojson_file, point_type in [(control_geojson_file, 'control'), (interest_geojson_file, 'interest')]:
        try:
            print(f"Tentando abrir o arquivo: {geojson_file}")
            with open(geojson_file, 'r') as f:
                points_data = json.load(f)
                for feature in points_data['features']:
                    feature['properties']['type'] = point_type
                    points['features'].append(feature)
        except FileNotFoundError:
            error_message = f"File not found: {geojson_file}"
            print(error_message)
            return jsonify({"status": error_message}), 404
        except json.JSONDecodeError:
            error_message = f"Error decoding JSON from file: {geojson_file}"
            print(error_message)
            return jsonify({"status": error_message}), 400
    return jsonify(points)

# Rota para buscar uma rota específica via URL params (GET)
@main.route('/get_route_map', methods=['GET'])
def get_route_map():
    control_id = request.args.get('control_id')
    interest_id = request.args.get('interest_id')

    # Buscar a rota correspondente
    route = get_route_by_control_and_interest(control_id, interest_id)
    if route:
        # Coordenadas dos vértices da planta baixa
        vertex1 = [-23.53992316266249, -46.73528262010234]
        vertex2 = [-23.540391059102745, -46.73477225093106]
        vertex3 = [-23.539533842981285, -46.73385670318282]
        vertex4 = [-23.539073087007395, -46.734374864248736]

        # Localização inicial do mapa
        UMMlocation = [-23.5396664, -46.734547]
        m = folium.Map(location=UMMlocation, zoom_start=18, max_zoom=22)

        # Corrigindo o caminho da imagem
        image_path = os.path.join(os.path.dirname(__file__), '../static/images/planta_baixa.png')

        # Verificar se o caminho da imagem existe
        if not os.path.exists(image_path):
            return jsonify({"status": "Imagem não encontrada no servidor"}), 404

        bounds = [vertex1, vertex2, vertex3, vertex4]
        ImageOverlay(image=image_path, bounds=bounds, opacity=1).add_to(m)

        # Adicionar o controle de localização, visível apenas em HTTPS
        if request.is_secure:
            LocateControl(auto_start=True).add_to(m)
        else:
            print("HTTPS não detectado. Controle de localização não adicionado.")

        # Carregar os pontos de controle e interesse
        for geojson_file, color in [(control_geojson_file, 'red'), (interest_geojson_file, 'blue')]:
            try:
                with open(geojson_file, 'r') as f:
                    points_data = json.load(f)
                for feature in points_data['features']:
                    lat, lon = feature['geometry']['coordinates'][1], feature['geometry']['coordinates'][0]
                    point_name = feature['properties']['name']
                    folium.Marker([lat, lon], popup=point_name, icon=folium.Icon(color=color)).add_to(m)
            except FileNotFoundError:
                print(f"Arquivo {geojson_file} não encontrado.")

        # Adicionar a rota (se encontrada)
        if route:
            path = route['geometry']['coordinates']
            path = [[coord[1], coord[0]] for coord in path]  # Inverter latitude e longitude
            AntPath(path, color='blue', weight=2.5).add_to(m)

        # Usar branca para ajustar o tamanho do mapa
        fig = branca.element.Figure(height='100%', width='100%')
        fig.add_child(m)
        map_html = fig.render()

        # Adicionar estilos para garantir que o mapa ocupe 100% da tela
        style = "<style>body, html { margin: 0; padding: 0; height: 100%; }</style>"
        map_html = style + map_html

        return render_template_string(map_html)
    else:
        return jsonify({"status": "Rota não encontrada"}), 404

# Rota para desenhar linha entre ponto de interesse, controle e pontos auxiliares
@main.route('/draw_line', methods=['POST'])
def draw_line():
    data = request.get_json()
    interest_id = data.get('interest')
    control_id = data.get('control')
    aux_points = data.get('auxPoints', [])

    # Buscar as coordenadas dos pontos de controle e interesse
    interest_coords = get_coordinates_by_id(str(interest_id), interest_geojson_file)
    control_coords = get_coordinates_by_id(str(control_id), control_geojson_file)

    if interest_coords and control_coords:
        try:
            interest_coords = [float(coord) for coord in interest_coords]
            control_coords = [float(coord) for coord in control_coords]
            aux_coords = [[float(point['lon']), float(point['lat'])] for point in aux_points]
        except (TypeError, ValueError) as e:
            return jsonify({"status": f"Erro de conversão: {str(e)}"}), 400

        path_coords = [control_coords] + aux_coords + [interest_coords]

        with open(line_geojson_file, 'r+') as f:
            line_data = json.load(f)
            new_feature = {
                "type": "Feature",
                "properties": {
                    "name": "Linha com Auxiliares",
                    "description": f"Linha entre {interest_id} e {control_id} com auxiliares",
                    "id": f"{control_id}-{interest_id}",
                    "type": "line"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": path_coords
                }
            }
            line_data['features'].append(new_feature)
            f.seek(0)
            json.dump(line_data, f, indent=4)
            f.truncate()

        return jsonify({"status": "Rota traçada com sucesso!"})
    return jsonify({"status": "Erro ao traçar a rota"}), 400

@main.route('/add_point', methods=['POST'])
def add_point():
    data = request.get_json()
    geojson_file = control_geojson_file if data['type'] == 'control' else interest_geojson_file

    # Determinar o próximo ID disponível com base no tipo de ponto
    next_id = get_next_id(geojson_file, data['type'])

    # Criar um ponto no formato GeoJSON
    point = {
        "type": "Feature",
        "properties": {
            "name": data['name'],
            "description": data['description'],
            "id": str(next_id),
            "type": data['type']
        },
        "geometry": {
            "type": "Point",
            "coordinates": [float(data['lon']), float(data['lat'])]
        }
    }

    # Abrir o arquivo GeoJSON e adicionar o novo ponto
    with open(geojson_file, 'r+') as f:
        geojson_data = json.load(f)
        geojson_data['features'].append(point)
        f.seek(0)
        json.dump(geojson_data, f, indent=4)
        f.truncate()

    return jsonify({"status": "Ponto adicionado com sucesso!", "id": next_id})

def get_next_id(geojson_file, point_type):
    """
    Retorna o próximo ID disponível para o tipo de ponto.
    Pontos de controle terão IDs de 1 a 999.
    Pontos de interesse terão IDs a partir de 1001.
    """
    with open(geojson_file, 'r') as f:
        geojson_data = json.load(f)
        ids = [int(feature['properties']['id']) for feature in geojson_data['features'] if feature['properties']['type'] == point_type]

    if point_type == 'control':
        # Procurar o próximo ID de 1 a 999
        for i in range(1, 1000):
            if i not in ids:
                return i
        raise ValueError("Limite de IDs para pontos de controle atingido (1 a 999).")
    elif point_type == 'interest':
        # Procurar o próximo ID começando de 1001
        return max(ids, default=1000) + 1

@main.route('/get_interest_ids', methods=['GET'])
def get_interest_ids():
    with open(interest_geojson_file, 'r') as f:
        data = json.load(f)
        ids = [feature['properties']['id'] for feature in data['features'] if feature['properties']['type'] == 'interest']
    return jsonify(ids)

@main.route('/get_interest_details', methods=['GET'])
def get_interest_details():
    interest_id = request.args.get('id')
    with open(interest_geojson_file, 'r') as f:
        data = json.load(f)
        for feature in data['features']:
            if feature['properties']['id'] == interest_id:
                return jsonify({
                    "name": feature['properties']['name'],
                    "description": feature['properties']['description']
                })
    return jsonify({"status": "Interest point not found"}), 404
