# ───────────────────────────────────────────────
# Stage 1: 依存関係インストール用ステージ
# ───────────────────────────────────────────────
FROM node:18-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# package.json と package-lock.json を先にコピーして依存だけインストール
COPY package*.json ./
RUN npm ci --only=production

# ソースコードをコピー
COPY . .



# ───────────────────────────────────────────────
# Stage 2: 本番用ステージ
# ───────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /usr/src/app

# builder ステージから必要ファイルをコピー
COPY --from=builder /usr/src/app .

# .env やログを除外したい場合は .dockerignore を併用
# ─ .dockerignore ──────────────────────────────
# node_modules
# npm-debug.log
# .env
# ───────────────────────────────────────────────

# デフォルトのポート（Env var で変更可）
ENV PORT=8080

# コンテナ外へ公開するポート
EXPOSE 8080

# サービス起動コマンド
CMD ["node", "index.js"]
