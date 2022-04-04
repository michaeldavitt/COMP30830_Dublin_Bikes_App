import json
import requests
import traceback
import time
import datetime
import pandas as pd
import sqlalchemy as sqla
from sqlalchemy import create_engine

# Get API creds
with open('bike_key.txt') as f:
    API_KEY = ''.join(f.readlines())
    API_KEY = str(API_KEY).split()[0]

NAME = "Dublin"
STATIONS = 'https://api.jcdecaux.com/vls/v1/stations'


# Connect to SQL database
# Create variables to store credentials
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
    filename = "data/bikes_{}".format(now)
    for c in chars:
        filename = filename.replace(c, "_")

    # Write the data into a text file
    with open(filename, "w") as f:
        f.write(text)


def availability_to_db(stations):
    for station in stations:
        vals = (int(station.get("number")), int(station.get("available_bikes")), int(
            station.get("available_bike_stands")), station.get("last_update"))
        engine.execute(
            "insert into availability values(%s, %s, %s, %s)", vals)

    return


def main():
    while True:
        try:
            now = datetime.datetime.now()
            r = requests.get(STATIONS, params={
                             "apiKey": API_KEY, "contract": NAME})
            bike_data = json.loads(r.text)

            write_to_file(r.text, now)
            availability_to_db(bike_data)
            time.sleep(5*60)

        except:
            print(traceback.format_exc())


if __name__ == "__main__":
    main()
