#!/bin/bash
# ساخت زیپ نهایی وب‌سایت نیکا بنا — فقط سورس و دارایی‌های لازم، بدون فایل‌های اضافه
set -e

BASE=/home/z/my-project
STAGE=$BASE/scripts/staging
ROOT=$STAGE/nika-bona
ZIP=$BASE/download/nika-bona-website-v1.0.zip

echo "==> پاک‌سازی استیجینگ قبلی"
rm -rf "$STAGE"
mkdir -p "$ROOT/db" "$ROOT/prisma"

echo "==> کپی سورس و دارایی‌ها"
cp -r "$BASE/src"            "$ROOT/src"
cp -r "$BASE/public"         "$ROOT/public"
cp    "$BASE/prisma/schema.prisma" "$ROOT/prisma/"
cp    "$BASE/prisma/seed.ts"       "$ROOT/prisma/"
cp    "$BASE/db/custom.db"         "$ROOT/db/"

# فایل‌های پیکربندی
for f in package.json bun.lock tsconfig.json tailwind.config.ts \
         postcss.config.mjs next.config.ts components.json eslint.config.mjs .gitignore; do
  cp "$BASE/$f" "$ROOT/$f"
done

# پاک‌سازی فایل‌های زائد احتمالی
find "$ROOT" -name ".DS_Store" -delete 2>/dev/null || true
find "$ROOT" -name "*.log" -delete 2>/dev/null || true

echo "==> قرار دادن README و فایل‌های env پرتابل"
cp "$BASE/scripts/zip-assets/README.md" "$ROOT/README.md"
printf 'DATABASE_URL=file:../db/custom.db\n' > "$ROOT/.env"
printf 'DATABASE_URL=file:../db/custom.db\n' > "$ROOT/.env.example"

echo "==> پچ package.json برای اجرای پرتابل (node به‌جای bun + اسکریپت seed)"
python3 - <<'PYEOF'
import json
p = "/home/z/my-project/scripts/staging/nika-bona/package.json"
with open(p, encoding="utf-8") as f:
    pkg = json.load(f)
pkg["name"] = "nika-bona-website"
pkg["version"] = "1.0.0"
pkg["scripts"]["dev"] = "next dev -p 3000"
pkg["scripts"]["start"] = "node .next/standalone/server.js"
pkg["scripts"]["db:seed"] = "npx tsx prisma/seed.ts"
with open(p, "w", encoding="utf-8") as f:
    json.dump(pkg, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("    package.json پچ شد")
PYEOF

echo "==> ساخت زیپ"
mkdir -p "$BASE/download"
rm -f "$ZIP"
cd "$STAGE" && zip -r -q "$ZIP" nika-bona

echo ""
echo "==> نتیجه:"
du -h "$ZIP"
echo "تعداد فایل‌ها: $(unzip -l "$ZIP" | tail -1 | awk '{print $2}')"
echo ""
echo "==> ۱۵ ورودی اول زیپ:"
unzip -l "$ZIP" | head -19
