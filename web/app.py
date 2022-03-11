import functools
from flask import Flask, render_template, g, jsonify
from numpy import number
from sqlalchemy import create_engine
import sqlalchemy

app = Flask(__name__)


def connect_to_database():
    USER = "admin"
    DB = "dbikes"
    PORT = "3306"
    URL = "database-1.ctesjcult8dm.eu-west-1.rds.amazonaws.com"
    with open('mysql_password.txt') as f:
        PASSWORD = ''.join(f.readlines())
        PASSWORD = str(PASSWORD).split()[0]
    engine = create_engine(
        "mysql+mysqlconnector://{}:{}@{}:{}/{}".format(USER, PASSWORD, URL, PORT, DB), echo=True)
    conn = engine.connect()
    return conn


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = connect_to_database()
    return db


# @app.teardown_appcontext
@app.route("/shutdown")
def close_connection():
    db = get_db()
    if db is not None:
        db.close()


@app.route("/available/<int:station_id>")
def get_stations(station_id):
    engine = get_db()
    data = []
    rows = engine.execute(
        "SELECT available_bikes FROM dbikes.availability WHERE number = {} Limit 5".format(station_id))
    for row in rows:
        print(row)
        data.append(dict(row))

    return jsonify(available=data)


user = {"name": "John Doe"}

@app.route("/coordinates")
# @functools.lru_cache(maxsize=128)
def get_coordinates():
    engine = get_db()
    rows = engine.execute("SELECT * FROM dbikes.station").fetchall()
    stations=[dict(row.items()) for row in rows]
    return stations

    # for i in range(len(rows)):

    #     station_coordinates[i] = {"address": rows[i][0], "bike_stands": rows[i][2], "number": rows[i][6], "position_lat":rows[i][7], "position_lng": rows[i][8], "status":rows[i][9]}

    # return "hi"
    # for row in rows:
    #     station_coordinates[row[2]] = [row[0], row[1]]
    # return station_coordinates
    

@app.route("/")
def index():
    return render_template("index.html", user=user, stations=get_coordinates())


if __name__ == "__main__":
    app.run(debug=True)
