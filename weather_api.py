# to get the instantaneous weather data from the api
# latitude and longitude have been given as a location in dublin
# can be changed later on when required to do so
import json
import requests
import pandas as pd
import sqlalchemy as sqla
from sqlalchemy import create_engine
import time
import requests
import json
import traceback
from bikedata import PASSWORD
import datetime
import sys

weather_api = 'https://api.openweathermap.org/data/2.5/onecall?lat=53.3065282883422&lon=-6.225434257607019&exclude={part}&appid='

with open('weather_key.txt') as f:
    weather_key = ''.join(f.readlines())
    weather_key = str(weather_key).split()[0]

# Connect to SQL database

URL = "database-1.ctesjcult8dm.eu-west-1.rds.amazonaws.com"
PORT = "3306"
DB = "dbikes"
USER = "admin"

with open('mysql_password.txt') as f:
    PASSWORD = ''.join(f.readlines())
    PASSWORD = str(PASSWORD).split()[0]

engine = create_engine(
    "mysql+mysqlconnector://{}:{}@{}:{}/{}".format(USER, PASSWORD, URL, PORT, DB), echo=True)


def write_to_file(text, now):

    # Replace the special characters with underscore for the filename
    chars = " -:."
    filename = "data/weather_{}".format(now)
    for c in chars:
        filename = filename.replace(c, "_")

    # Write the data into a text file
    with open(filename, "w") as f:
        f.write(text)


def weather_to_db(weather):
    weatherData = weather.get("current")
    vals = (int(weatherData.get("dt")), int(weatherData.get("sunrise")), int(weatherData.get("sunset")), int(weatherData.get("temp")), int(weatherData.get("feels_like")), int(weatherData.get("pressure")), int(weatherData.get(
        "humidity")), int(weatherData.get("clouds")), int(weatherData.get("visibility")), weatherData.get("weather")[0].get("main"), weatherData.get("weather")[0].get("description"), weatherData.get("weather")[0].get("icon"))
    engine.execute(
        "insert into real_time_weather values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", vals)


def main():
    while True:
        try:
            now = datetime.datetime.now()
            r = (requests.get(weather_api + weather_key))
            weather_data = json.loads(r.text)

            write_to_file(r.text, now)
            weather_to_db(weather_data)
            time.sleep(5*60)

        except:
            print(traceback.format_exc())


if __name__ == "__main__":
    main()
