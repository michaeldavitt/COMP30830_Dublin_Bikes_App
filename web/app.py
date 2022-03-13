from flask import Flask, render_template, g, jsonify
from sqlalchemy import create_engine

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


def get_maps_api_key():
    """Function to securely obtain API key for Google Maps"""
    with open('google_maps_api_key.txt') as f:
        key = ''.join(f.readlines())
        key = str(key).split()[0]

    return key


@app.route("/")
def index():
    """Function that displays index.html when the user first enters the site"""
    return render_template("index.html", GMAPS_API_KEY=get_maps_api_key())


@app.route("/stations")
def stations_page():
    """Function that displays stations.html when the user navigates to stations"""
    return render_template("stations.html")


@app.route("/station/<int:station_id>")
def station(station_id):
    """Function that outputs information for a specific station"""
    return render_template("specific_station.html", station_id=station_id)


if __name__ == "__main__":
    app.run(debug=True)
