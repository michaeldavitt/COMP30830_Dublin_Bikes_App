from flask import Flask, render_template, g, jsonify
from numpy import number
from sqlalchemy import create_engine

app = Flask(__name__)

def connect_to_database():
    USER = "admin"
    DB = "dbikes"
    PORT = "3306"
    URL = "database-1.ctesjcult8dm.eu-west-1.rds.amazonaws.com"
    with open('mysql_password.txt') as f:
        PASSWORD = ''.join(f.readlines())
        PASSWORD = str(PASSWORD).split()[0]
    engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(USER, PASSWORD, URL, PORT, DB), echo=True)
    return engine


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = connect_to_database()
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route("/available_bikes/<int:station_id>")
def get_stations(station_id):
    engine = get_db()
    data = []
    rows = engine.execute("SELECT available_bikes FROM availability WHERE number = {}".format(station_id))
    for row in rows:
        data.append(dict(row))
    
    return jsonify(available=data)




user = {"name": "John Doe"}

@app.route("/")
def index():
    return render_template("index.html", user=user)


    return engine
if __name__ == "__main__":
    app.run(debug=True)