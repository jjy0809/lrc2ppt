import requests
from bs4 import BeautifulSoup

# 사용자로부터 멜론 링크 입력 받기
query = input("제목 + 아티스트: ")

url = f'https://www.melon.com/search/total/index.htm?q={query}'

# 헤더 설정 (멜론 차단 방지를 위해 User-Agent 추가)
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

try:
    # 웹 페이지 요청
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # HTTP 오류 발생 시 예외 발생

    # HTML 파싱
    soup = BeautifulSoup(response.text, 'html.parser')

    # 1. 요소 찾기: 클래스가 'btn btn_icon_detail'인 <a> 태그 선택 [1][3][5]
    target_tag = soup.find('a', {'class': ['btn', 'btn_icon_detail']})

    # 2. href 속성 추출 [2][7]
    if target_tag and target_tag.has_attr('href'):
        href_value = target_tag['href']
        
        # 3. 문자열 분할로 곡 ID 추출 (방법 1)
        track_id = href_value.split("'")[-2]

    url = f'https://www.melon.com/song/detail.htm?songId={track_id}'

    response = requests.get(url, headers=headers)
    response.raise_for_status()  # HTTP 오류 발생 시 예외 발생

    # HTML 파싱
    soup = BeautifulSoup(response.text, 'html.parser')
    # 가사 추출
    lyrics_div = soup.find('div', {'class': 'lyric', 'id': 'd_video_summary'})
    
    if lyrics_div:
        # 줄바꿈 유지하며 텍스트 추출
        lyrics = lyrics_div.get_text('\n', strip=False)
        print(lyrics.strip())
    else:
        print("가사를 찾을 수 없습니다.")

except requests.exceptions.RequestException as e:
    print(f"요청 오류 발생: {e}")
except Exception as e:
    print(f"오류 발생: {e}")
