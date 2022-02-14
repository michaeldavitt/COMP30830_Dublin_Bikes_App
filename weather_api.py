# to get the instantaneous weather data from the api 
# latitude and longitude have been given as a location in dublin
# can be changed later on when required to do so
import time
import requests
import json
import traceback

weather_api = 'https://api.openweathermap.org/data/2.5/onecall?lat=53.3065282883422&lon=-6.225434257607019&exclude={part}&appid='

with open('weather_key.txt') as f:
    weather_key = ''.join(f.readlines())
while True:
    try:
        weather = json.loads(requests.get(weather_api + weather_key).text)
        print(weather)
        time.sleep(5*60) #will stop the program for 5 minutes before trying again
    except:
        print(traceback.format_exc())
