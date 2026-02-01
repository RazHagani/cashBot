#!/bin/sh
set -eu

: "${BOT_METRICS_TARGET:?Set BOT_METRICS_TARGET (example: passionate-wonder:8080)}"
: "${METRICS_TOKEN:?Set METRICS_TOKEN (must match bot's METRICS_TOKEN)}"

TEMPLATE="/etc/prometheus/prometheus.yml.template"
OUT="/etc/prometheus/prometheus.yml"

sed \
  -e "s|__BOT_METRICS_TARGET__|${BOT_METRICS_TARGET}|g" \
  -e "s|__METRICS_TOKEN__|${METRICS_TOKEN}|g" \
  "$TEMPLATE" > "$OUT"

PORT="${PORT:-9090}"

exec /bin/prometheus \
  --config.file="$OUT" \
  --storage.tsdb.path=/prometheus \
  --web.listen-address="0.0.0.0:${PORT}"

