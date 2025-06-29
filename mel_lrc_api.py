import urllib.request
import urllib.parse
import json

def get_lyrics(title, artist):
    base_url = "https://hrrt5dbju7tmd2j5loseysgsce0drhqd.lambda-url.ap-northeast-2.on.aws/"
    
    # 파라미터 인코딩
    params = {
        'title': title.strip(),
        'artist': artist.strip()
    }
    encoded_params = urllib.parse.urlencode(params)
    full_url = f"{base_url}?{encoded_params}"
    
    try:
        # 요청 설정
        req = urllib.request.Request(
            full_url,
            headers={
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        )
        
        # 응답 처리
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get('lyrics', '가사 정보 없음')
            
    except urllib.error.HTTPError as e:
        return f"[{e.code}] {e.reason}"
    except Exception as e:
        return f"오류 발생: {str(e)}"

# 실행부
if __name__ == "__main__":
    title = input("곡명: ").strip()
    artist = input("아티스트: ").strip()
    
    if not title or not artist:
        print("❗곡명과 아티스트를 모두 입력하세요")
    else:
        print("\n=== 가사 검색 결과 ===")
        print(get_lyrics(title, artist))
