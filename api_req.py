import requests
import base64
import json

# API 1 테스트: 가사 추출 (api_type=1)
def test_api1(api_url):
    # 요청 데이터 구성
    data = {
        'url': 'hhttps://www.youtube.com/watch?v=YnyY7dsWPg0'  # 테스트용 유튜브 URL 입력
    }
    
    try:
        response = requests.post(api_url, json=data)
        response.raise_for_status()  # HTTP 에러 확인
        
        result = response.json()
        if 'lyrics' in result:
            print("[API1 성공] 가사 추출 완료")
            return result['lyrics']  # 추출된 가사 반환
        else:
            print(f"[API1 오류] 응답 내용: {json.dumps(result, indent=2)}")
            return None
            
    except Exception as e:
        print(f"[API1 실패] 오류 발생: {str(e)}")
        return None

# API 2 테스트: PPT 생성 (api_type=2)
def test_api2(api_url, lyrics, bg_image_path=None):
    # 요청 데이터 구성
    data = {
        'api_type': 2,
        'lyrics': lyrics,
        'font_size': 40,
        'font_color': [255, 255, 255],  # 흰색 글자
        'bold': True,
        'line_spacing': 1.2
    }
    
    # 배경 이미지 처리
    if bg_image_path:
        with open(bg_image_path, 'rb') as image_file:
            data['bg_image'] = base64.b64encode(image_file.read()).decode('utf-8')
    
    try:
        response = requests.post(api_url, json=data)
        response.raise_for_status()
        
        # PPT 파일 저장
        with open('output.pptx', 'wb') as f:
            f.write(response.content)
        print("[API2 성공] PPT 파일 생성 완료 (output.pptx)")
        return True
        
    except Exception as e:
        print(f"[API2 실패] 오류 발생: {str(e)}")
        print(f"응답 상태 코드: {response.status_code}")
        return False

# 메인 테스트 실행
if __name__ == "__main__":
    API_URL = 'https://kza4cc4i5xr3ywvrvtjkhew6oq0ckeoq.lambda-url.ap-northeast-2.on.aws/'
    
    print("1번 api호출")
    # 1단계: API1 테스트
    lyrics = test_api1(API_URL)
    
        
        
