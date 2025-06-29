# If you need to make a high volume of requests, consider using proxies
from musicxmatch_api import MusixMatchAPI
track_id = 103149239 # Skyfall by Adele
api = MusixMatchAPI()
search = api.get_track_lyrics(track_id=track_id)
# The lyrics are in the "lyrics_body" key
lyrics = search["message"]["body"]["lyrics"]["lyrics_body"]
print(lyrics)