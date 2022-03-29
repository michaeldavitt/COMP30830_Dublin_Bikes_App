from flask import Flask, render_template, g, jsonify
from itsdangerous import json
from sqlalchemy import create_engine
import pandas as pd
from haversine import haversine
import pickle
import requests

app = Flask(__name__)


def connect_to_database():
    """Function for connecting to the SQL database"""

    # Create variables to store cretentials
    USER = "admin"
    DB = "dbikes"
    PORT = "3306"
    URL = "database-1.ctesjcult8dm.eu-west-1.rds.amazonaws.com"

    # Read in password from text file
    with open('mysql_password.txt') as f:
        PASSWORD = ''.join(f.readlines())
        PASSWORD = str(PASSWORD).split()[0]

    # Create engine using credentials
    engine = create_engine(
        "mysql+mysqlconnector://{}:{}@{}:{}/{}".format(USER, PASSWORD, URL, PORT, DB), echo=True)

    # Create connection using engine and return connection
    conn = engine.connect()
    return conn


def get_db():
    """Function for getting the database"""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = connect_to_database()
    return db


@app.teardown_appcontext
def close_connection(exception):
    """Function for closing the database connection"""
    db = get_db()
    if db is not None:
        db.close()


@app.route("/station_info")
def get_station_info():
    """Function to get the static station information

    Reads from our station table in the dbikes database
    Obtains static information such as station location, name etc.
    """
    engine = get_db()
    rows = engine.execute("SELECT * FROM dbikes.station").fetchall()
    stations = [dict(row.items()) for row in rows]
    return jsonify(stations)


@app.route("/station_info/<int:station_id>")
def get_specific_station(station_id):
    """Function to get information for a specific station"""
    engine = get_db()
    rows = engine.execute(
        "SELECT * FROM dbikes.station WHERE number=" + str(station_id)).fetchall()
    return jsonify([dict(row.items()) for row in rows])


@app.route("/availability/<int:station_id>")
def get_specific_station_availability(station_id):
    """Function to get realtime availability information for a specific station"""
    engine = get_db()
    rows = engine.execute(
        f"SELECT * FROM dbikes.availability WHERE number = {station_id} ORDER BY last_update DESC LIMIT 1").fetchall()
    return jsonify([dict(row.items()) for row in rows])


@app.route("/hourly_availability/<bikes_or_stands>/<int:station_id>/<day>")
def get_hourly_availability(station_id, bikes_or_stands, day):
    """Function that gets hourly availability data for a specific day

    Can choose to get either bike or parking space availability data
    """
    engine = get_db()
    df = pd.read_sql_query(
        f"select * from availability where number = {station_id}", engine)

    # Convert last_update column to datetime
    df['last_update_date'] = pd.to_datetime(df.last_update, unit='ms')

    # Get the day of the week for each row
    df["Day_of_week"] = df["last_update_date"].dt.day_name()

    # Filter the database so that we only display data for a specific day
    df = df[df["Day_of_week"] == day]

    # Get the hour for each row (13:00, 14:00 etc.)
    df["Hour"] = df["last_update_date"].dt.hour

    # Get the average availability in each hour
    hourly_availability = df.groupby(["Hour"])[bikes_or_stands].mean()
    return jsonify(data=list(zip(map(lambda x: str(x), hourly_availability.index), hourly_availability)))


@app.route("/distances/<location_lat>/<location_lng>")
def get_distance(location_lat, location_lng):
    """Returns the havershine distance between two coordinates"""

    # Connect to database
    engine = get_db()

    # Get the coordinates and name of each station
    rows = engine.execute(
        "SELECT position_lat, position_lng, address FROM dbikes.station").fetchall()
    stations = [dict(row.items()) for row in rows]

    # Loop through each station and store the distance from the user location
    distance_station_to_location = {}
    for station in stations:
        distance_station_to_location[station["address"]] = [haversine((float(station["position_lat"]), float(
            station["position_lng"])), (float(location_lat), float(location_lng))), [station["position_lat"], station["position_lng"]]]

    return jsonify(distance_station_to_location)


def get_maps_api_key():
    """Function to securely obtain API key for Google Maps"""
    with open('google_maps_api_key.txt') as f:
        key = ''.join(f.readlines())
        key = str(key).split()[0]

    return key


@app.route("/index")
@app.route("/")
def index():
    """Function that displays index.html when the user first enters the site"""
    return render_template("index.html", GMAPS_API_KEY=get_maps_api_key())


@app.route("/stations")
def stations():
    """Function that displays stations.html when the user navigates to stations"""
    return render_template("stations.html")


@app.route("/station/<int:station_id>")
def station(station_id):
    """Function that outputs information for a specific station"""
    return render_template("specific_station.html", station_id=station_id)



@app.route("/testWeather")
def getWeatherInfo():
    weather_api = 'https://api.openweathermap.org/data/2.5/onecall?lat=53.3065282883422&lon=-6.225434257607019&exclude={part}&appid='

    with open('weather_key.txt') as f:
        weather_key = ''.join(f.readlines())
        weather_key = str(weather_key).split()[0]

    r = (requests.get(weather_api + weather_key))
    weather_data = json.loads(r.text).get("daily")


@app.route("/prediction/<bikeOrSpace>/<userDay>/<userHour>/<station1>/<station2>/<station3>/<station4>/<station5>")
def predictions(bikeOrSpace, userDay, userHour, station1, station2, station3, station4, station5):
    """Function that outputs predictions for bike availability and space availability for a chosen time of the day"""
    stationIds = [station1, station2, station3, station4 ,station5]
    predictions = []
    for i in range(len(stationIds)):
        fileName = "station_" + stationIds[i] +"_" + bikeOrSpace + "_model.pkl"
        with open(fileName, "rb") as handle:
            model = pickle.load(handle)







if __name__ == "__main__":
    app.run(debug=True)
