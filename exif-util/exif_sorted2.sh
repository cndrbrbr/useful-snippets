#!/bin/bash
#######################################################################################################
# Voraussetzungen Linux:
# sudo apt update
# sudo apt install python3 python3-pip python3-tk
# sudo apt install libimage-exiftool-perl
#######################################################################################################
# Voraussetzungen Apple:
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# brew install exiftool
# Ist python da? python3 --version
# wenn nein: brew install python
# chmod +x exif_pro_endung_semikolon.sh
# ./exif_sorted2.sh ~/Pictures ~/Desktop/exif_output
#######################################################################################################
# Aufruf: ./exif_sorted2.sh /home/mint/exif/testbilder /home/mint/exif/ausgabe
#######################################################################################################
# cndrbrbr (c) 2026
#######################################################################################################

ORDNER="$1"
AUSGABEORDNER="${2:-.}"

if [ -z "$ORDNER" ]; then
  echo "Aufruf: $0 <bildordner> [ausgabeordner]"
  exit 1
fi

if [ ! -d "$ORDNER" ]; then
  echo "Ordner nicht gefunden: $ORDNER"
  exit 1
fi

mkdir -p "$AUSGABEORDNER"

ENDUNGEN=$(find "$ORDNER" -type f | sed -n 's/.*\.\([^.]*\)$/\1/p' | tr 'A-Z' 'a-z' | sort -u)

if [ -z "$ENDUNGEN" ]; then
  echo "Keine Dateien mit Endung gefunden."
  exit 1
fi

for EXT in $ENDUNGEN; do
    echo "Verarbeite .$EXT ..."

    TMPFILE=$(mktemp)

    exiftool -r \
      -ext "$EXT" \
      -csv -G1 -a -u \
      -FileName \
      -Directory \
      -FileTypeExtension \
      -All:All \
      --SourceFile \
      -d "%Y-%m-%d %H:%M:%S" \
      "$ORDNER" > "$TMPFILE"

    python3 - "$TMPFILE" "$AUSGABEORDNER/exif_${EXT}.csv" <<'PY'
import csv
import sys

src = sys.argv[1]
dst = sys.argv[2]

with open(src, "r", encoding="utf-8", newline="") as fin, \
     open(dst, "w", encoding="utf-8-sig", newline="") as fout:
    reader = csv.reader(fin)
    writer = csv.writer(fout, delimiter=';')
    for row in reader:
        writer.writerow(row)
PY

    rm "$TMPFILE"
done

echo "Fertig. CSV-Dateien liegen in: $AUSGABEORDNER"
