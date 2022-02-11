import json
import requests
import pandas as pd
bike_api = 'https://api.jcdecaux.com/vls/v1/stations?contract=dublin&apiKey='
with open('bike_key.txt') as f:
    bike_key = ''.join(f.readlines())
response = requests.get(bike_api+bike_key)
bike_data = json.loads(response.text)  # to convert the response to a list

for k in range(len(bike_data)):
    bike_data[k]['lat'] = bike_data[k]['position']['lat']
    bike_data[k]['lng'] = bike_data[k]['position']['lng']

df = pd.DataFrame(bike_data)
df = df.drop(df.columns[[1, 2, 4, 5, 6, 10]], axis=1)
print(df)
