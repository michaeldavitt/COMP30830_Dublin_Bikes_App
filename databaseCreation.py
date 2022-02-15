# Import required libraries
from ast import Pass
from sklearn.linear_model import PassiveAggressiveClassifier
import sqlalchemy as sqla
from sqlalchemy import create_engine
from pprint import pprint
import simplejson as json
import requests
import traceback
import sys

# Create variables to store credentials
URL = "database-1.ctesjcult8dm.eu-west-1.rds.amazonaws.com"
PORT = "3306"
# Using sys here in case dbikes database has not been created yet
DB = "sys"
USER = "admin"

with open('mysql_password.txt') as f:
    PASSWORD = ''.join(f.readlines())
    PASSWORD = str(PASSWORD).split()[0]

engine = create_engine(
    "mysql+mysqlconnector://{}:{}@{}:{}/{}".format(USER, PASSWORD, URL, PORT, DB), echo=True)

# Create the database if it does not already exist
sql = """
CREATE DATABASE IF NOT EXISTS dbikes;
"""
engine.execute(sql)

# Connecting to dbikes database
DB = "dbikes"
engine = create_engine(
    "mysql+mysqlconnector://{}:{}@{}:{}/{}".format(USER, PASSWORD, URL, PORT, DB), echo=True)

# Create tables for the station info, availability, and weather
sql = """
CREATE TABLE IF NOT EXISTS station (
    address VARCHAR(256),
    banking INTEGER,
    bike_stands INTEGER,
    bonus INTEGER,
    contract_name VARCHAR(256),
    name VARCHAR(256),
    number INTEGER,
    position_lat REAL,
    position_lng REAL,
    status VARCHAR(256),
    CONSTRAINT station_pk PRIMARY KEY (number)
)
"""

try:
    res = engine.execute("DROP TABLE IF EXISTS station")
    res = engine.execute(sql)
except Exception as e:
    print(e)

sql = """
CREATE TABLE IF NOT EXISTS availability (
    number INTEGER,
    available_bikes INTEGER,
    available_stands INTEGER,
    last_update VARCHAR(256),
    FOREIGN KEY (number) REFERENCES station(number)
)
"""

try:
    res = engine.execute("DROP TABLE IF EXISTS availability")
    res = engine.execute(sql)
except Exception as e:
    print(e)


sql = """
CREATE TABLE IF NOT EXISTS real_time_weather (
    dt VARCHAR(256),
    surinse INTEGER,
    sunset INTEGER,
    temperature INTEGER,
    feels_like INTEGER,
    pressure INTEGER,
    humidity INTEGER,
    clouds INTEGER,
    visibility INTEGER,
    main VARCHAR(100),
    description VARCHAR(100),
    icon VARCHAR(6),
    CONSTRAINT real_time_weather_pk PRIMARY KEY (dt)
)
"""

try:
    res = engine.execute("DROP TABLE IF EXISTS real_time_weather")
    res = engine.execute(sql)
except Exception as e:
    print(e)

# sql = """
# CREATE TABLE IF NOT EXISTS weather_forecast (
#     dt VARCHAR(256),
#     surinse INTEGER,
#     sunset INTEGER,
#     temperature INTEGER,
#     feels_like INTEGER,
#     pressure INTEGER,
#     humidity INTEGER,
#     clouds INTEGER,
#     visibility INTEGER,
#     main VARCHAR(100),
#     description VARCHAR(100),
#     icon VARCHAR(6),
#     CONSTRAINT weather_forecast_pk PRIMARY KEY (dt)
# )
# """

# try:
#     res = engine.execute("DROP TABLE IF EXISTS weather_forecast")
#     res = engine.execute(sql)
# except Exception as e:
#     print(e)


# Populate the static stations table - assuming that these values will only need to be created once and won't change
# # Get API creds
with open('bike_key.txt') as f:
    API_KEY = ''.join(f.readlines())
    API_KEY = str(API_KEY).split()[0]

NAME = "Dublin"
STATIONS = 'https://api.jcdecaux.com/vls/v1/stations'


def stations_to_db(stations):
    for station in stations:
        vals = (station.get("address"), int(station.get("banking")), station.get("bike_stands"), int(station.get("bonus")), station.get(
            "contract_name"), station.get("name"), int(station.get("number")), station.get("lat"), station.get("lng"), station.get("status"))
        engine.execute(
            "insert into station values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", vals)

    return


try:
    r = requests.get(STATIONS, params={
        "apiKey": API_KEY, "contract": NAME})
    bike_data = json.loads(r.text)
    for k in range(len(bike_data)):
        bike_data[k]['lat'] = bike_data[k]['position']['lat']
        bike_data[k]['lng'] = bike_data[k]['position']['lng']

    stations_to_db(bike_data)


except:
    print(traceback.format_exc())
