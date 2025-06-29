# musicxmatch_api 라이브러리 설치 (터미널에서 실행)
# pip install musicxmatch_api

from musicxmatch_api import MusixMatchAPI

def get_lyrics(track, artist):
    # API 클라이언트 초기화
    api = MusixMatchAPI()
    
    try:
        # 곡 검색 (트랙명 + 아티스트명으로 검색)
        search_result = api.search_tracks(f"{track} {artist}")
        
        print(search_result)
        
        # 검색 결과에서 첫 번째 트랙 ID 추출
        track_id = search_result['message']['body']['track_list'][0]['track']['track_id']
        
        print(track_id)
        
        # 가사 조회
        lyrics_data = api.get_track_lyrics(track_id=track_id)
        return lyrics_data['message']['body']['lyrics']['lyrics_body']
    
    except Exception as e:
        return f"⚠️ 가사를 찾을 수 없습니다. 정확한 곡명과 아티스트를 입력해주세요.\n {e}" 

# 사용자 입력 받기
track = input("🎵 곡 명을 입력하세요: ")
artist = input("🎤 아티스트명을 입력하세요: ")

# 가사 가져오기 및 출력
print("\n🎶 가사 출력:")
print(get_lyrics(track, artist))
