from flask import Flask, render_template, g
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


@app.route("/coordinates")
def get_coordinates():
    """Function to get the static station information

    Reads from our station table in the dbikes database
    Obtains static information such as station location, name etc.
    """
    engine = get_db()
    rows = engine.execute("SELECT * FROM dbikes.station").fetchall()
    stations = [dict(row.items()) for row in rows]
    return stations


@app.route("/")
def index():
    """Function that displays index.html when the user first enters the site"""
    return render_template("index.html", stations=get_coordinates())


if __name__ == "__main__":
    app.run(debug=True)
