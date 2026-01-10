
import folium
import pandas as pd
import os
import sys

# Define colors for different zones to visualize distribution
ZONE_COLORS = {
    'Centro': 'blue',
    'Norte': 'red',
    'Sur': 'green',
    'Universidad': 'purple',
    'Viva': 'orange',
    'Estadio': 'cadetblue'
}

def monotone_chain_convex_hull(points):
    """Computes the convex hull of a set of 2D points using Monotone Chain algorithm."""
    points = sorted(set(points))
    if len(points) <= 1:
        return points

    # Build lower hull 
    lower = []
    for p in points:
        while len(lower) >= 2 and cross_product(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    # Build upper hull
    upper = []
    for p in reversed(points):
        while len(upper) >= 2 and cross_product(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    return lower[:-1] + upper[:-1]

def cross_product(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def generate_map():
    # 1. Path Setup
    # Use absolute path relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Assuming script is in ml/scripts, data is in ml/data
    csv_path = os.path.abspath(os.path.join(script_dir, '..', 'data', 'restaurantes_web_enriquecido_v2.csv'))
    
    print(f"Reading data from: {csv_path}")
    
    # 2. Load Data
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_path}")
        return

    # Basic cleaning
    df = df.dropna(subset=['lat', 'lon', 'nombre'])
    
    # 3. Create Map (Centered on Tunja) with BETTER TILES
    tunja_center = [5.5393, -73.3577] # Approximate center
    # Tiles='OpenStreetMap' gives better contrast for streets/city limits
    m = folium.Map(location=tunja_center, zoom_start=13, tiles="OpenStreetMap")

    # Collection of points for Hull
    points_for_hull = []

    # 4. Add Markers
    for _, row in df.iterrows():
        try:
            lat = float(row['lat'])
            lon = float(row['lon'])
            
            # Store point (lat, lon) note: valid hull algo needs (x, y) often lon, lat but consistent
            # We will use (lat, lon) for simplicity and consistency
            points_for_hull.append((lat, lon))

            name = row['nombre']
            zone = row.get('zona', 'Desconocida')
            specialty = row.get('especialidad', 'General')
            is_regional = str(row.get('es_regional', 'False')).lower() in ['true', 'si', 'yes']
            
            # Decide Icon/Color
            if is_regional:
                icon = folium.Icon(color='green', icon='star', prefix='fa')
                tooltip_text = f"{name} (Cocina Regional)"
            else:
                color = ZONE_COLORS.get(zone, 'gray')
                icon = folium.Icon(color=color, icon='cutlery', prefix='fa')
                tooltip_text = f"{name} ({zone})"

            popup_html = f"""
            <div style="font-family: Arial; width: 200px;">
                <b>{name}</b><br>
                <i>{specialty}</i><br>
                <hr>
                Zona: {zone}<br>
                Regional: {'Sí' if is_regional else 'No'}
            </div>
            """

            folium.Marker(
                location=[lat, lon],
                popup=folium.Popup(popup_html, max_width=250),
                tooltip=tooltip_text,
                icon=icon
            ).add_to(m)
            
        except ValueError:
            continue

    # 5. Draw Study Area (Convex Hull) - "Delinear"
    if len(points_for_hull) > 2:
        hull_points = monotone_chain_convex_hull(points_for_hull)
        # Add the first point at the end to close the loop
        hull_points.append(hull_points[0])
        
        folium.PolyLine(
            hull_points,
            color="black",
            weight=2,
            opacity=0.8,
            dash_array='5, 10',
            tooltip="Zona de Cobertura del Estudio"
        ).add_to(m)
        
        folium.Polygon(
            hull_points,
            fill=True,
            fill_color="#3388ff",
            fill_opacity=0.1,
            stroke=False
        ).add_to(m)

    # 6. Add Legend (Macro Regions)
    legend_html = '''
     <div style="position: fixed; 
     bottom: 50px; left: 50px; width: 160px; height: 160px; 
     border:2px solid grey; z-index:9999; font-size:12px;
     background-color:white; opacity: 0.9;">
     &nbsp;<b>Leyenda de Zonas</b> <br>
     &nbsp;<i class="fa fa-map-marker" style="color:blue"></i>&nbsp; Centro Histórico<br>
     &nbsp;<i class="fa fa-map-marker" style="color:red"></i>&nbsp; Norte<br>
     &nbsp;<i class="fa fa-map-marker" style="color:green"></i>&nbsp; Sur<br>
     &nbsp;<i class="fa fa-map-marker" style="color:purple"></i>&nbsp; Universidad<br>
     &nbsp;<i class="fa fa-map-marker" style="color:orange"></i>&nbsp; Cc. Viva<br>
     <br>
     &nbsp;<i class="fa fa-star" style="color:green"></i>&nbsp; Plato Regional <br>
      </div>
     '''
    m.get_root().html.add_child(folium.Element(legend_html))

    # 6. Save
    output_path = os.path.join(script_dir, 'figura6_mapa_tunja.html')
    m.save(output_path)
    print(f"Map generated at: {output_path}")

if __name__ == "__main__":
    generate_map()
