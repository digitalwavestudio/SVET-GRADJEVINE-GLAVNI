#!/usr/bin/env bash
# -------------------------------------------------
# Deploy Firebase Cloud Function `aggregateAdminStats`
# -------------------------------------------------

# Proveri da li je instaliran Firebase CLI
if ! command -v firebase &> /dev/null; then
  echo "[ERROR] Firebase CLI nije instaliran. Instalirajte ga sa: npm install -g firebase-tools"
  exit 1
fi

# Autentifikacija (prijavi se ako već niste)
echo "[INFO] Prijavljivanje na Firebase (ako je potrebno)..."
firebase login

# Deploy samo funkcije aggregateAdminStats
echo "[INFO] Deploy funkcije aggregateAdminStats..."
firebase deploy --only functions:aggregateAdminStats

if [ $? -eq 0 ]; then
  echo "[SUCCESS] Funkcija je uspešno deploy‑ovana."
else
  echo "[ERROR] Deploy je neuspešan. Proverite logove i pokušajte ponovo."
fi
