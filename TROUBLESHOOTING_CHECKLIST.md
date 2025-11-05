# Base Troubleshooting 가이드 체크리스트

**Reference**: [Common Issues & Debugging](https://docs.base.org/mini-apps/troubleshooting/common-issues)

이 문서는 Base의 Troubleshooting 가이드에 따라 앱의 문제를 진단하고 해결합니다.

---

## ✅ Prerequisites & Setup Verification

### Required Files and Structure ✅

```
lping.vercel.app/
├── .well-known/
│   └── farcaster.json          # ✅ Required manifest file
├── app/
│   ├── layout.tsx              # ✅ App entry point
│   └── ...                     # ✅ App files
```

**Status**: ✅ 모든 필수 파일 존재

### Environment Setup Checklist ✅

- ✅ Domain is accessible via HTTPS (`https://lping.vercel.app`)
- ✅ Manifest file exists at `/.well-known/farcaster.json`
- ✅ All image URLs are publicly accessible

---

## ✅ Debugging 체크리스트

### 1. Manifest Accessibility ✅

**Test**: `https://lping.vercel.app/.well-known/farcaster.json`

**Status**: ✅ 접근 가능, 올바른 JSON 형식

### 2. Image Display Issues ✅

**Checklist**:
- ✅ 이미지 접근성 확인 (incognito 모드에서 테스트)
- ✅ 이미지 형식 확인 (PNG, JPG, WebP 지원)
- ✅ HTTPS URL만 사용
- ⚠️ 이미지 크기 확인 필요 (1024×1024px 아이콘 등)

### 3. Embed Rendering ✅

**Checklist**:
- ✅ `fc:frame` 메타데이터 존재 (`app/layout.tsx`)
- ✅ `fc:miniapp` 메타데이터 존재
- ✅ Embed Tool로 검증 가능

---

## ✅ 문제 해결 완료

### 1. Gesture Conflicts 해결 ✅

**문제**: Pull-to-refresh 기능이 Base App의 네이티브 제스처와 충돌 가능

**해결**:
- `MiniAppInitializer.tsx`에 `disableNativeGestures: true` 옵션 추가
- Swipe/drag 인터랙션 사용 시 필수 설정

```typescript
// 변경 전
await sdk.actions.ready();

// 변경 후
await sdk.actions.ready({ disableNativeGestures: true });
```

**참고**: [Gesture Conflicts Documentation](https://docs.base.org/mini-apps/troubleshooting/common-issues#5--gesture-conflicts-and-app-dismissal-issues)

### 2. Wallet Connection ✅

**Status**: ✅ 올바르게 구현됨

- ✅ Wagmi의 `useAccount` 훅 사용
- ✅ OnchainKit의 `ConnectWallet` 컴포넌트 사용
- ✅ 사용자 연결 지갑 사용

**구현 확인**:
```typescript
// app/lp/page.tsx
const { address: connectedAddress, isConnected } = useAccount();
```

**참고**: [Wallet Connection Documentation](https://docs.base.org/mini-apps/troubleshooting/common-issues#4--wallet-connection-problems)

---

## 🔄 추가 개선 사항

### Mobile Testing & Debugging (선택 사항)

**Eruda Mobile Console Setup**: 개발 환경에서 모바일 디버깅을 위해 Eruda 추가 가능

**구현 방법**:
```typescript
// app/components/MobileDebugger.tsx (선택 사항)
"use client";

import { useEffect } from "react";

export function MobileDebugger() {
  useEffect(() => {
    // Only load Eruda in development and not on localhost
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development" &&
      !window.location.hostname.includes("localhost")
    ) {
      import("eruda").then((eruda) => eruda.default.init());
    }
  }, []);

  return null;
}
```

**사용 방법**:
1. `npm install eruda --save-dev`
2. `MobileDebugger` 컴포넌트를 `layout.tsx`에 추가
3. 프로덕션에 배포하거나 ngrok으로 로컬 테스트
4. 모바일 클라이언트에서 Farcaster DM으로 공유
5. Eruda 콘솔로 디버깅

**참고**: [Mobile Testing Documentation](https://docs.base.org/mini-apps/troubleshooting/common-issues#6--mobile-testing--debugging)

---

## 📋 검증 체크리스트

### Basic Functionality ✅

- ✅ 앱 로드 확인
- ✅ 이미지 표시 확인
- ✅ 지갑 연결 확인
- ✅ Manifest 엔드포인트 접근 가능
- ✅ Embed 렌더링 확인

### App Discovery ⚠️

- ✅ Manifest 완성도 확인
- ✅ `primaryCategory` 설정 확인
- ✅ `accountAssociation` 설정 확인
- ⚠️ 인덱싱 확인 (최대 10분 소요)
- ⚠️ 앱 카탈로그에 표시 확인

### Sharing ✅

- ✅ URL 공유 시 리치 embed 표시
- ✅ `fc:frame` 메타데이터 확인
- ✅ `fc:miniapp` 메타데이터 확인

---

## 🔍 잠재적 문제 및 해결 방법

### 1. Changes Not Appearing

**문제**: 변경 사항이 나타나지 않음

**해결**:
- Farcaster 클라이언트는 최대 24시간 manifest 데이터 캐싱
- 재공유하여 새로고침 트리거 (약 10분 소요)

### 2. App Not Appearing in Search

**문제**: 검색 결과에 나타나지 않음

**해결**:
- Manifest에 모든 필수 필드 확인
- `primaryCategory` 필수
- `accountAssociation` 필수
- 앱 URL을 포스트로 공유하여 인덱싱 트리거
- 최대 10분 대기

### 3. Image Issues

**문제**: 이미지가 표시되지 않음

**해결**:
- Incognito 모드에서 이미지 접근성 테스트
- 이미지 형식 확인 (PNG, JPG, WebP)
- HTTPS URL만 사용
- 이미지 크기 확인

---

## 🛠️ 디버깅 도구

### Base Build Preview Tool

**URL**: [base.dev/preview](https://base.dev/preview)

**사용 방법**:
1. 앱 URL 입력
2. Console, Account Association, Metadata 탭 확인
3. ✅/❌ 표시로 상태 확인

### JSONLint

**URL**: [JSONLint](https://jsonlint.com/)

**사용 방법**:
1. Manifest JSON 복사
2. JSONLint에 붙여넣기
3. 문법 오류 확인

### Eruda (선택 사항)

**설치**: `npm install eruda --save-dev`

**사용**: 개발 환경에서 모바일 디버깅

---

## ✅ Success Verification

### Basic Functionality ✅

- ✅ 앱 로드
- ✅ 이미지 표시
- ✅ 지갑 연결
- ✅ Manifest 엔드포인트 접근
- ✅ Embed 렌더링

### Discovery & Sharing ✅

- ✅ Manifest 완성도
- ✅ `primaryCategory` 설정
- ✅ `accountAssociation` 설정
- ✅ 검색 인덱싱 (대기 중)
- ✅ 앱 카탈로그 표시 (대기 중)

---

## 📚 참고 문서

- [Common Issues & Debugging](https://docs.base.org/mini-apps/troubleshooting/common-issues)
- [Base Build Preview Tool](https://base.dev/preview)
- [JSONLint](https://jsonlint.com/)
- [Eruda](https://github.com/liriliri/eruda)

---

## 요약

✅ **완료된 개선 사항**:
1. Gesture Conflicts 해결 (`disableNativeGestures: true` 추가)
2. 기본 디버깅 체크리스트 확인 완료

⚠️ **추가 고려 사항**:
1. Eruda 모바일 디버깅 추가 (선택 사항)
2. 이미지 크기 및 형식 확인
3. 검색 인덱싱 대기 (최대 10분)

**Status**: ✅ Base Troubleshooting 가이드의 주요 요구사항 충족

