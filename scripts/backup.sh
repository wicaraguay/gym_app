#!/bin/sh
# Backup de la base de trainingloja (Postgres).
# Crea un dump comprimido y conserva SOLO los ultimos 10 (borra los mas viejos).
# Pensado para correr por cron.  Uso manual:  ./scripts/backup.sh

set -e

# cron trae un PATH minimo: aseguramos que encuentre docker / docker-compose.
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Pararse en la carpeta del proyecto (este script vive en scripts/).
cd "$(dirname "$0")/.." || exit 1

COMPOSE="docker-compose -f docker-compose.prod.yml"
BACKUP_DIR="./backups"
MAX_BACKUPS=10

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILE="$BACKUP_DIR/trainingloja_$STAMP.sql.gz"

# Dump desde el contenedor de la base, usando su propio usuario/clave.
$COMPOSE exec -T db \
  sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  | gzip > "$FILE"

# Si el backup salio vacio es un error: borrarlo y avisar.
if [ ! -s "$FILE" ]; then
  rm -f "$FILE"
  echo "$(date '+%F %T') ERROR: el backup salio vacio. Revisar la base."
  exit 1
fi

echo "$(date '+%F %T') OK backup creado: $FILE ($(du -h "$FILE" | cut -f1))"

# Rotacion: conservar solo los MAX_BACKUPS mas nuevos, borrar el resto.
ls -1t "$BACKUP_DIR"/trainingloja_*.sql.gz 2>/dev/null \
  | tail -n +$((MAX_BACKUPS + 1)) \
  | xargs -r rm -f

echo "$(date '+%F %T') OK rotacion: se conservan hasta $MAX_BACKUPS backups"
