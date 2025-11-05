# Embed Rendering Issues 해결 가이드

**Reference**: [Embed Rendering Issues](https://docs.base.org/mini-apps/troubleshooting/common-issues#3-embed-rendering-issues)

## 문제 분석

**문제**: Mini App URL이 공유될 때 리치 embed로 렌더링되지 않음

**원인**: `fc:frame` 메타데이터가 잘못되었거나 누락됨

**해결**: `<head>`에 `name="fc:frame"` 메타 태그 사용 및 Embed Tool로 검증

---

## 현재 상태 확인 ✅

### 1. `fc:frame` 메타데이터 설정 ✅

**위치**: `app/layout.tsx`

```typescript
export async function generateMetadata(): Promise<Metadata> {
  return {
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Join the ${minikitConfig.miniapp.name} Waitlist`,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
            type: "launch_frame",
          },
        },
      }),
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: "Open LPing",
          action: {
            type: "launch_frame",
            url: ROOT_URL,
            name: minikitConfig.miniapp.name,
          },
        },
      }),
    },
  };
}
```

**Status**: ✅ Next.js의 `Metadata` API를 통해 설정됨

### 2. 실제 HTML 출력 확인

Next.js는 `other` 필드를 `<meta name="fc:frame" content="...">` 형태로 렌더링합니다.

**예상 HTML 출력**:
```html
<head>
  <meta name="fc:frame" content='{"version":"1","imageUrl":"https://lping.vercel.app/blue-hero.png","button":{"title":"Join the LPing Waitlist","action":{"name":"Launch LPing","type":"launch_frame"}}}' />
  <meta name="fc:miniapp" content='{"version":"next","imageUrl":"https://lping.vercel.app/blue-hero.png","button":{"title":"Open LPing","action":{"type":"launch_frame","url":"https://lping.vercel.app","name":"LPing"}}}' />
</head>
```

---

## 검증 방법

### 1. 실제 HTML 확인

**방법 1: 브라우저 개발자 도구**
1. `https://lping.vercel.app` 접속
2. 개발자 도구 열기 (F12)
3. Elements 탭에서 `<head>` 확인
4. `fc:frame` 및 `fc:miniapp` 메타 태그 확인

**방법 2: curl 명령어**
```bash
curl -s https://lping.vercel.app | grep -i "fc:frame"
```

**방법 3: View Page Source**
1. `https://lping.vercel.app` 접속
2. 페이지 소스 보기 (Ctrl+U / Cmd+U)
3. `<head>` 섹션에서 메타 태그 확인

### 2. Embed Tool로 검증

**Base Embed Tool**: [Embed Tool](https://warpcast.com/~/developers/embeds) (Farcaster)

**검증 단계**:
1. Embed Tool 접속
2. 앱 URL 입력: `https://lping.vercel.app`
3. Rich embed가 올바르게 렌더링되는지 확인
4. 이미지, 버튼, 제목이 모두 표시되는지 확인

### 3. Base Preview Tool로 검증

**Base Preview Tool**: [base.dev/preview](https://base.dev/preview)

**검증 단계**:
1. Base Preview Tool 접속
2. 앱 URL 입력: `https://lping.vercel.app`
3. Metadata 탭 확인
4. 모든 필수 필드가 올바르게 표시되는지 확인

---

## 잠재적 문제 및 해결 방법

### 문제 1: 메타 태그가 렌더링되지 않음

**증상**: HTML 소스에 `fc:frame` 메타 태그가 없음

**해결**:
- Next.js 빌드 확인
- 프로덕션 배포 확인
- 캐시 삭제 후 재배포

### 문제 2: JSON 형식 오류

**증상**: 메타 태그는 있지만 JSON 형식이 잘못됨

**해결**:
- `JSON.stringify()` 사용 확인
- JSONLint로 검증
- 특수 문자 이스케이프 확인

### 문제 3: 이미지 URL 접근 불가

**증상**: 이미지가 표시되지 않음

**해결**:
- 이미지 URL 접근성 확인 (incognito 모드)
- HTTPS URL 확인
- 이미지 크기 및 형식 확인

### 문제 4: 버튼이 작동하지 않음

**증상**: 버튼 클릭 시 앱이 실행되지 않음

**해결**:
- `action.type`이 `"launch_frame"`인지 확인
- `action.url`이 올바른지 확인
- `homeUrl`이 manifest와 일치하는지 확인

---

## 개선 사항 (선택)

### 더 명확한 메타데이터 설정

현재 구현은 올바르지만, 더 명확하게 하려면:

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const ROOT_URL =
    process.env.NEXT_PUBLIC_ROOT_URL ||
    process.env.NEXT_PUBLIC_URL ||
    "http://localhost:3000";

  const fcFrameData = {
    version: minikitConfig.miniapp.version,
    imageUrl: minikitConfig.miniapp.heroImageUrl,
    button: {
      title: `Launch ${minikitConfig.miniapp.name}`,
      action: {
        name: minikitConfig.miniapp.name,
        type: "launch_frame",
        url: ROOT_URL,
      },
    },
  };

  const fcMiniAppData = {
    version: "next",
    imageUrl: minikitConfig.miniapp.heroImageUrl,
    button: {
      title: "Open LPing",
      action: {
        type: "launch_frame",
        url: ROOT_URL,
        name: minikitConfig.miniapp.name,
      },
    },
  };

  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other: {
      "fc:frame": JSON.stringify(fcFrameData),
      "fc:miniapp": JSON.stringify(fcMiniAppData),
    },
  };
}
```

---

## 검증 체크리스트

### ✅ 필수 확인 사항

- [ ] HTML 소스에 `fc:frame` 메타 태그 존재
- [ ] HTML 소스에 `fc:miniapp` 메타 태그 존재
- [ ] JSON 형식이 올바름
- [ ] 이미지 URL이 접근 가능
- [ ] Embed Tool에서 올바르게 렌더링됨
- [ ] Base Preview Tool에서 검증 통과

### ⚠️ 추가 확인 사항

- [ ] 이미지 크기가 적절함 (1200×630px 권장)
- [ ] 버튼 텍스트가 명확함
- [ ] 앱 URL이 올바름
- [ ] 프로덕션에서 테스트 완료

---

## 테스트 시나리오

### 시나리오 1: Base App에서 공유

1. Base App에서 앱 URL 공유
2. 리치 embed가 표시되는지 확인
3. 이미지, 버튼, 제목이 모두 표시되는지 확인
4. 버튼 클릭 시 앱이 실행되는지 확인

### 시나리오 2: Farcaster에서 공유

1. Farcaster에서 앱 URL 공유
2. 리치 embed가 표시되는지 확인
3. 모든 메타데이터가 올바르게 표시되는지 확인

---

## 문제 해결 워크플로우

1. **HTML 소스 확인**
   - 실제 렌더링된 HTML 확인
   - `fc:frame` 메타 태그 존재 확인

2. **JSON 검증**
   - JSONLint로 형식 검증
   - 모든 필드가 올바른지 확인

3. **이미지 확인**
   - 이미지 URL 접근성 확인
   - 이미지 크기 및 형식 확인

4. **Embed Tool 검증**
   - Base/Farcaster Embed Tool 사용
   - 실제 렌더링 확인

5. **캐시 문제 해결**
   - 브라우저 캐시 삭제
   - Farcaster 클라이언트 캐시 (최대 24시간)
   - 재공유하여 새로고침

---

## 요약

✅ **현재 상태**: `fc:frame` 메타데이터가 올바르게 설정됨

✅ **Next.js 구현**: `Metadata` API의 `other` 필드 사용

⚠️ **검증 필요**: 
- 실제 HTML 출력 확인
- Embed Tool로 검증
- Base Preview Tool로 검증

**다음 단계**:
1. 실제 HTML 소스 확인
2. Embed Tool로 검증
3. Base Preview Tool로 검증
4. 문제 발견 시 위의 해결 방법 적용

---

## 참고 문서

- [Embed Rendering Issues](https://docs.base.org/mini-apps/troubleshooting/common-issues#3-embed-rendering-issues)
- [Embeds & Previews](https://docs.base.org/mini-apps/core-concepts/embeds-and-previews)
- [Base Preview Tool](https://base.dev/preview)
- [JSONLint](https://jsonlint.com/)

