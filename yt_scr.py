from youtube_transcript_api import YouTubeTranscriptApi

# 유튜브 자막 가져오기
transcript = YouTubeTranscriptApi.get_transcript("EqDL2-OW1Z4", languages=['ko'])

# 파일 저장 경로 설정
file_path = r'C:\Users\happy\Desktop\학교\고등학교\3학년\가사 추출\lyrics.txt'

# 텍스트 파일 쓰기 모드로 열기
with open(file_path, 'w', encoding='utf-8') as file:  # UTF-8 인코딩으로 파일 열기
    for entry in transcript:  # 자막 데이터 순회
        text = entry['text'].strip()  # 텍스트 추출 및 양쪽 공백 제거
        file.write(text + '\n')  # 텍스트 쓰고 줄바꿈 추가

print(f'가사가 {file_path}에 저장되었습니다.')
