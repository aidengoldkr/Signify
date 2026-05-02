# Signify - 실시간 수어 및 제스처 인식 도구

Signify는 MediaPipe를 활용하여 실시간으로 사용자의 손동작을 추적하고, 미리 정의된 제스처 라이브러리와 비교하여 어떤 동작인지 인식하는 웹 애플리케이션입니다.

## 주요 기능

- **실시간 손 추적 (Real-time Hand Tracking)**: MediaPipe Hands 모델을 사용하여 카메라 피드에서 실시간으로 21개의 손 랜드마크를 추출합니다.
- **제스처 매칭 (Gesture Matching)**: 수집된 랜드마크 데이터를 기반으로 등록된 제스처 라이브러리와 유사도를 계산하여 가장 일치하는 결과를 보여줍니다.
- **키보드 오버라이드 (Keyboard Override)**: AI 인식 외에도 특정 키 조합을 통해 수동으로 텍스트를 출력하거나 시퀀스를 제어할 수 있습니다.
- **유연한 레이아웃**: 스플릿 뷰(Split View)를 통해 카메라 피드와 출력 영역의 비율을 자유롭게 조절할 수 있습니다.
- **설정 제어**: 오버라이드 설정 및 제스처 라이브러리 구성을 직접 관리할 수 있는 설정 패널을 제공합니다.

## 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **AI/ML**: MediaPipe Tasks Vision (@mediapipe/tasks-vision)
- **Styling**: CSS Modules
- **State Management**: React Hooks (useState, useMemo, useEffect, useRef)

## 시작하기

### 사전 준비

- Node.js (최신 LTS 버전 권장)
- 카메라가 장착된 기기

### 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **WASM 파일 동기화 및 개발 서버 실행**
   MediaPipe 실행에 필요한 WASM 파일을 로컬 `public` 디렉토리로 복사한 후 Vite 서버를 실행합니다.
   ```bash
   npm run dev
   ```

3. **빌드**
   ```bash
   npm run build
   ```

### 주요 스크립트

- `npm run dev`: 개발 모드로 실행 (WASM 동기화 포함)
- `npm run sync-wasm`: `@mediapipe/tasks-vision`의 WASM 파일을 `public/mediapipe-wasm` 폴더로 복사합니다.
- `npm run build`: 프로덕션용 빌드 파일을 생성합니다.

## 사용 방법

1. 앱을 실행하고 카메라 권한을 허용합니다.
2. 카메라 앞에 손을 위치시키면 실시간으로 랜드마크가 표시됩니다.
3. 등록된 제스처를 취하면 화면 오른쪽에 **AI 인식 결과**와 정확도(Score)가 표시됩니다.
4. 특정 키를 눌러 **수동 모드(Manual)**로 텍스트를 고정하거나 시퀀스를 진행할 수 있습니다.
5. 설정(Settings) 아이콘을 클릭하여 키보드 오버라이드 맵을 수정하거나 초기화할 수 있습니다.

## 프로젝트 구조

- `src/components`: UI 컴포넌트 (Viewport, Output, Settings 등)
- `src/hooks`: 카메라, MediaPipe, 제스처 매칭 로직 등 커스텀 훅
- `src/lib`: 제스처 매칭 알고리즘 및 유틸리티
- `src/data`: 제스처 스냅샷 데이터 및 오버라이드 설정
- `src/routes`: 메인 페이지 뷰 (`MainView.tsx`)
- `src/styles`: 글로벌 스타일 및 테마 정의
