# 안드로이드 앱 배포 가이드

## 1. 필수 도구 설치

### Node.js 설치
1. [Node.js 공식 사이트](https://nodejs.org/)에서 LTS 버전 다운로드
2. 설치 후 터미널에서 확인:
   ```bash
   node --version
   npm --version
   ```

### Android Studio 설치
1. [Android Studio 공식 사이트](https://developer.android.com/studio)에서 다운로드
2. 설치 시 Android SDK 포함하여 설치
3. 환경 변수 설정:
   - ANDROID_HOME: Android SDK 경로
   - PATH에 platform-tools 추가

### Java JDK 설치
1. [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) 또는 [OpenJDK](https://openjdk.org/) 설치
2. JAVA_HOME 환경 변수 설정

## 2. Capacitor 설정

### 의존성 설치
```bash
npm install
```

### Capacitor 초기화
```bash
npx cap init
```

### Android 플랫폼 추가
```bash
npx cap add android
```

### 웹 파일 동기화
```bash
npx cap sync
```

## 3. Android 앱 빌드

### Android Studio에서 프로젝트 열기
```bash
npx cap open android
```

### 앱 아이콘 설정
1. `android/app/src/main/res/` 폴더에 아이콘 파일 추가
2. `mipmap-hdpi`, `mipmap-mdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi` 폴더에 각각 다른 크기로 아이콘 추가

### 앱 서명 설정
1. 키스토어 생성:
   ```bash
   keytool -genkey -v -keystore othello-release-key.keystore -alias othello-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. `android/app/build.gradle`에 서명 설정 추가:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file("othello-release-key.keystore")
               storePassword "your-store-password"
               keyAlias "othello-key-alias"
               keyPassword "your-key-password"
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

### APK 빌드
```bash
cd android
./gradlew assembleRelease
```

## 4. Google Play Console 설정

### 1. Google Play Console 계정 생성
1. [Google Play Console](https://play.google.com/console) 접속
2. 개발자 계정 등록 ($25 일회성 비용)

### 2. 앱 등록
1. "앱 만들기" 클릭
2. 앱 정보 입력:
   - 앱 이름: "준우와 함께하는 오셀로 게임"
   - 기본 언어: 한국어
   - 앱 또는 게임: 게임
   - 유료 또는 무료: 무료

### 3. 앱 정보 입력
1. **앱 액세스**: 모든 사용자
2. **카테고리**: 게임 > 보드
3. **태그**: 오셀로, 보드게임, 전략
4. **콘텐츠 등급**: 3세 이상

### 4. 개인정보처리방침
1. 개인정보처리방침 URL 입력 (GitHub Pages URL 사용 가능)
2. 데이터 보안 섹션 작성

### 5. 앱 번들 업로드
1. "프로덕션" 트랙 선택
2. "새 버전 만들기" 클릭
3. AAB (Android App Bundle) 파일 업로드
4. 릴리스 노트 작성

### 6. 스토어 등록 정보
1. **앱 설명**:
   ```
   준우와 함께하는 오셀로 게임
   
   클래식한 오셀로 게임을 모바일에서 즐겨보세요!
   
   🎮 게임 특징:
   • 2인 플레이 모드
   • AI 대전 모드 (3단계 난이도)
   • 직관적인 터치 조작
   • 아름다운 그래픽과 효과음
   • 힌트 기능 (5회 제한)
   • 되돌리기 기능
   • 게임 기록 저장
   
   🎯 게임 규칙:
   • 흑돌부터 시작
   • 상대방 돌을 양쪽에서 둘러싸면 뒤집기
   • 더 많은 돌을 가진 플레이어가 승리
   
   지금 다운로드하고 오셀로의 재미를 경험해보세요!
   ```

2. **스크린샷**: 게임 플레이 화면 캡처하여 업로드
3. **앱 아이콘**: 512x512 PNG 파일

### 7. 검토 및 출시
1. 모든 정보 입력 완료 후 "검토" 클릭
2. 검토 완료 후 "출시" 클릭
3. Google 검토 대기 (보통 1-3일 소요)

## 5. 업데이트 방법

### 새 버전 배포 시
1. 코드 수정 후 GitHub에 푸시
2. Capacitor 동기화:
   ```bash
   npx cap sync
   ```
3. Android Studio에서 새 버전 빌드
4. Google Play Console에서 새 버전 업로드

## 6. 문제 해결

### 빌드 오류
- Android SDK 경로 확인
- Java 버전 확인 (JDK 11 이상 권장)
- Gradle 캐시 삭제 후 재빌드

### 서명 오류
- 키스토어 비밀번호 확인
- 키스토어 파일 경로 확인

### Google Play Console 오류
- 앱 번들 파일이 올바른지 확인
- 모든 필수 정보가 입력되었는지 확인

## 7. 추가 최적화

### 성능 최적화
- 이미지 압축
- 코드 최소화
- 캐싱 전략 구현

### 사용자 경험 개선
- 스플래시 스크린 추가
- 로딩 화면 개선
- 오프라인 지원

---

**참고**: 이 가이드는 기본적인 배포 과정을 안내합니다. 실제 배포 시에는 Google의 최신 정책과 가이드라인을 확인하시기 바랍니다. 