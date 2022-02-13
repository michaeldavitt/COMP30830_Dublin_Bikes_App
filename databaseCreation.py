# Import required libraries
import sqlalchemy as sqla
from sqlalchemy import create_engine
import traceback
import glob
import os
from pprint import pprint
import simplejson as json
import requests
import time
# from IPython.display import display

# Create variables to store credentials
URL = "database-1.ctesjcult8dm.eu-west-1.rds.amazonaws.com"
PORT = "3306"
# Using sys here in case dbikes database has not been created yet
DB = "sys"
USER = "admin"

with open('mysql_password.txt') as f:
    PASSWORD = ''.join(f.readlines())

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
    status VARCHAR(256)
)
"""

try:
    res = engine.execute("DROP TABLE IF EXISTS station")
    res = engine.execute(sql)
    print(res.fetchall())
except Exception as e:
    print(e)

sql = """
CREATE TABLE IF NOT EXISTS availability (
    number INTEGER,
    available_bikes INTEGER,
    available_stands INTEGER,
    last_update INTEGER
)
"""

try:
    res = engine.execute(sql)
    print(res.fetchall())
except Exception as e:
    print(e)
