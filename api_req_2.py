import requests
vid = "EqDL2-OW1Z4"  # 테스트용 영상 ID
try:
    response = requests.get(f"http://jjy0809.jinyung.net/api?v_id={vid}", timeout=20)
    
    # 응답 유효성 검사 추가
    if response.status_code != 200:
        print(f"서버 오류 ({response.status_code}): {response.text}")
        exit()
        
    # 실제 JSON 데이터 확인
    raw_data = response.json()
    if 'data' not in raw_data:
        print("잘못된 응답 형식:", raw_data)
        exit()
        
    # 정상 출력
    for line in raw_data['data']:
        print(f"[{line['start']:.2f}s] {line['text']}")
        
except requests.exceptions.JSONDecodeError:
    print(f"JSON 파싱 실패 (원본 응답): {response.text}")
except Exception as e:
    print(f"오류 발생: {str(e)}")
