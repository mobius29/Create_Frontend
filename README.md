# @mobius29/template-frontend

나만의 프론트엔드 시작 템플릿을 생성하는 CLI 패키지입니다.

배포 후에는 다음 명령으로 새 프로젝트를 만들 수 있습니다.

```bash
pnpm dlx @mobius29/template-frontend my-app
```

패키지 내부 bin 이름은 `create-frontend`입니다.

## Features

- React Router framework mode 기반 SSR 템플릿
- Next.js App Router 기반 OXC 템플릿
- React 19, TypeScript, Tailwind CSS v4
- TanStack Query 기본 provider
- React Hook Form + Zod 폼 예시
- `ky` 기반 HTTP client 유틸
- oxlint, oxfmt, lint-staged, husky 설정
- pnpm 11 build-script 승인 설정 포함
- Dockerfile 포함

## Usage

```bash
pnpm dlx @mobius29/template-frontend my-app
```

템플릿을 명시하려면:

```bash
pnpm dlx @mobius29/template-frontend my-app --template react-router-ts
```

Next.js 템플릿을 사용하려면:

```bash
pnpm dlx @mobius29/template-frontend my-app --template next-oxc
```

생성 후 의존성 설치까지 실행하려면:

```bash
pnpm dlx @mobius29/template-frontend my-app --install
```

Git 저장소 초기화까지 같이 하려면:

```bash
pnpm dlx @mobius29/template-frontend my-app --install --git
```

기존 폴더를 비우고 다시 생성하려면:

```bash
pnpm dlx @mobius29/template-frontend my-app --overwrite
```

## CLI Options

| Option              | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `--template <name>` | 사용할 템플릿을 지정합니다. 기본값은 `react-router-ts`입니다. |
| `--install`         | 생성 후 의존성을 설치합니다.                                  |
| `--no-install`      | 의존성 설치를 건너뜁니다.                                     |
| `--git`             | 생성 후 `git init`을 실행합니다.                              |
| `--no-git`          | Git 초기화를 건너뜁니다.                                      |
| `--overwrite`       | 대상 폴더가 비어 있지 않아도 내용을 삭제하고 생성합니다.      |
| `-y`, `--yes`       | 프롬프트 없이 기본값을 사용합니다.                            |
| `-h`, `--help`      | 도움말을 출력합니다.                                          |

## Templates

### `react-router-ts`

React Router framework mode와 SSR이 켜진 기본 프론트엔드 앱 템플릿입니다.

포함 스택:

- React Router 7
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- React Hook Form
- Zod
- ky
- oxlint
- oxfmt

생성된 프로젝트의 주요 명령:

```bash
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm lint
pnpm format
```

### `next-oxc`

Next.js App Router와 OXC 도구를 사용하는 앱 템플릿입니다.

포함 스택:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Compiler
- TanStack Query
- React Hook Form
- Zod
- ky
- oxlint
- oxfmt

생성된 프로젝트의 주요 명령:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
```

## Project Structure

```txt
template-frontend/
  src/
    index.js
  templates/
    next-oxc/
      src/
      package.json
      next.config.ts
    react-router-ts/
      app/
      package.json
      vite.config.ts
      react-router.config.ts
      tsconfig.json
      Dockerfile
  package.json
  README.md
```

`src/index.js`가 생성기 CLI입니다.

`templates/react-router-ts`는 실제로 새 프로젝트에 복사되는 앱 템플릿입니다.

`templates/next-oxc`는 `create-next-app` 기반 Next.js 앱 템플릿입니다.

## Local Development

CLI 문법을 확인합니다.

```bash
pnpm check
```

로컬 smoke test를 실행합니다.

```bash
pnpm smoke
```

위 명령은 `/tmp/create-frontend-smoke`에 프로젝트를 생성합니다.

Next.js 템플릿 smoke test를 실행합니다.

```bash
pnpm smoke:next-oxc
```

`templates/next-oxc`를 최신 `create-next-app` 기반으로 다시 생성하려면:

```bash
pnpm install:next-oxc
```

이 명령은 네트워크 접근이 필요하며, 생성된 앱에 OXC, React Compiler, TanStack Query, React Hook Form, Zod, ky 기본 설정을 적용합니다.

생성된 프로젝트까지 검증하려면:

```bash
cd /tmp/create-frontend-smoke
pnpm install
pnpm typecheck
pnpm build
pnpm lint
```

## Package Test

npm 패키지에 어떤 파일이 포함되는지 확인합니다.

```bash
pnpm pack --dry-run
```

실제 tarball로 실행 경로를 검증합니다.

```bash
pnpm pack --pack-destination /tmp
pnpm dlx /tmp/mobius29-template-frontend-0.1.0.tgz my-app --template react-router-ts --no-install --no-git
```

Next.js 템플릿 실행 경로도 검증합니다.

```bash
pnpm dlx /tmp/mobius29-template-frontend-0.1.0.tgz my-app --template next-oxc --no-install --no-git
```

## Publish

npm에 로그인합니다.

```bash
pnpm login
```

패키지를 배포합니다.

```bash
pnpm publish --access public
```

배포 후 사용자는 다음 명령을 사용할 수 있습니다.

```bash
pnpm dlx @mobius29/template-frontend my-app
```

특정 버전을 실행하려면:

```bash
pnpm dlx @mobius29/template-frontend@latest my-app
```

## Naming Rule

`pnpm create`는 입력한 이름 앞에 `create-`를 붙여 패키지를 찾습니다.

| Command                       | Package                  |
| ----------------------------- | ------------------------ |
| `pnpm create frontend`        | `create-frontend`        |
| `pnpm create @scope/frontend` | `@scope/create-frontend` |
| `pnpm create @scope`          | `@scope/create`          |

현재 패키지 이름은 `@mobius29/template-frontend`이므로 `pnpm create frontend` 대상 패키지가 아닙니다.
`pnpm create @mobius29/frontend` 명령을 쓰려면 패키지 이름을 `@mobius29/create-frontend`로 배포해야 합니다.

현재 패키지 이름을 유지할 때의 실행 명령은 다음과 같습니다.

```bash
pnpm dlx @mobius29/template-frontend my-app
```

## Notes

- 생성된 앱의 `.gitignore`는 템플릿 내부에서 `_gitignore`로 보관되고, 생성 시 `.gitignore`로 변환됩니다.
- `templates/react-router-ts/pnpm-workspace.yaml`에는 pnpm 11에서 `esbuild` postinstall을 허용하기 위한 `allowBuilds` 설정이 포함되어 있습니다.
- `templates/next-oxc/pnpm-workspace.yaml`에는 pnpm 11에서 `sharp` postinstall을 허용하기 위한 `allowBuilds` 설정이 포함되어 있습니다.
- React Router 빌드 중 `envFile` deprecation warning이 출력될 수 있지만 현재 템플릿의 타입체크와 빌드 실패 원인은 아닙니다.
