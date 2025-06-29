@echo off
echo ========================================
echo 안드로이드 앱 배포 스크립트
echo ========================================

echo 1. Node.js 설치 확인...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org/에서 Node.js를 설치해주세요.
    pause
    exit /b 1
)

echo 2. npm 패키지 설치...
npm install

echo 3. Capacitor 초기화...
npx cap init "준우와 함께하는 오셀로 게임" "com.junwoo.othello" --web-dir="."

echo 4. Android 플랫폼 추가...
npx cap add android

echo 5. 웹 파일 동기화...
npx cap sync

echo 6. Android Studio에서 프로젝트 열기...
npx cap open android

echo ========================================
echo 배포 준비 완료!
echo ========================================
echo 
echo 다음 단계:
echo 1. Android Studio에서 앱 아이콘 설정
echo 2. 앱 서명 설정
echo 3. APK/AAB 빌드
echo 4. Google Play Console에 업로드
echo 
echo 자세한 내용은 ANDROID_DEPLOYMENT.md 파일을 참조하세요.
pause 