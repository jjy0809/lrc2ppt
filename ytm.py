from ytmusicapi import YTMusic

# API 초기화
ytmusic = YTMusic()

# 'BTS Dynamite' 검색
results = ytmusic.search('어둔 날 다 지나고 어노인팅', filter='songs')
print(results[0]['videoId'])
# 상위 5개 결과 출력 및 링크 생성
for idx, song in enumerate(results[:5], 1):
    video_id = song['videoId']
    print(f"{idx}. {song['title']} - {song['artists'][0]['name']}")
    print(f"   https://music.youtube.com/watch?v={video_id}\n")
