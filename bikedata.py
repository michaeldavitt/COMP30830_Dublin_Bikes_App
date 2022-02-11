import json
import requests
api = 'https://api.jcdecaux.com/vls/v1/stations?contract=dublin&apiKey='
with open('key.txt') as f:
    key = ''.join(f.readlines())
response = requests.get(api+key)
bike_data = json.loads(response.text) #to convert the response to a list

for k in range(len(bike_data)):
    bike_data[k]['lat']=bike_data[k]['position']['lat']
    bike_data[k]['lng']=bike_data[k]['position']['lng']
    
df = pd.DataFrame(bike_data)
df = df.drop(df.columns[[1, 2,4,5,6,10]], axis=1) 