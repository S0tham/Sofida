import os
import sys
import time
import webbrowser
import subprocess
from pathlib import Path
import shutil

print("🚀 Start AI Tutor – auto-zoek frontend")

ROOT = Path(__file__).parent.resolve()

# ---- Zoek frontend-map ----
CANDIDATE_DIRNAMES = ["", "frontend", "web", "app", "client", "ui"]

def find_frontend_dir(root: Path) -> Path | None:
    # 1) snelle check op bekende namen
    for name in CANDIDATE_DIRNAMES:
        p = (root / name) if name else root
        if (p / "package.json").exists():
            return p

    # 2) scan 2 niveaus diep naar package.json
    for p in root.rglob("package.json"):
        # sla node_modules en .venv over
        if "node_modules" in p.parts or ".venv" in p.parts:
            continue
        return p.parent
    return None

frontend_dir = find_frontend_dir(ROOT)
if not frontend_dir:
    print("❌ Geen package.json gevonden in project.")
    print("   Oplossing A: maak een frontend aan in ./frontend (zie stappen hieronder).")
    print("   Oplossing B: als je al een frontend hebt, plaats die in een submap en zorg dat package.json daar staat.")
    sys.exit(1)

print(f"📦 Frontend map gevonden: {frontend_dir}")

# ---- Check npm ----
npm = shutil.which("npm") or shutil.which("npm.cmd")
if not npm:
    print("❌ 'npm' niet gevonden. Installeer Node.js (LTS) en open een nieuwe terminal.")
    sys.exit(1)

# ---- Zet env var voor Vite ----
env = os.environ.copy()
env["VITE_API_URL"] = "http://127.0.0.1:8000"  # stabiel op Windows

# ---- Start backend (uvicorn) ----
print("▶️  Backend starten (FastAPI @ 127.0.0.1:8000)")
backend = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "api:app", "--reload", "--port", "8000"],
    cwd=str(ROOT),
    env=env,
)

time.sleep(1.5)

# ---- npm install indien nodig ----
if not (frontend_dir / "node_modules").exists():
    print("📥 node_modules niet gevonden → npm install...")
    try:
        subprocess.check_call([npm, "install"], cwd=str(frontend_dir), env=env)
    except subprocess.CalledProcessError as e:
        print("❌ npm install faalde:", e)
        backend.terminate()
        sys.exit(1)

# ---- Start frontend (Vite) ----
print(f"▶️  Frontend starten (npm run dev) in: {frontend_dir}")
try:
    frontend = subprocess.Popen([npm, "run", "dev"], cwd=str(frontend_dir), env=env)
except FileNotFoundError:
    print("❌ Kon 'npm run dev' niet starten. Bestaat het 'dev' script in package.json?")
    print('   Voor Vite: voeg toe: "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" }')
    backend.terminate()
    sys.exit(1)

time.sleep(1.5)
webbrowser.open("http://localhost:5173")

print("✅ Backend:  http://127.0.0.1:8000")
print("✅ Frontend: http://localhost:5173  (of de poort die Vite logt)")
print("🧯 Stoppen met Ctrl+C")

try:
    backend.wait()
    frontend.wait()
except KeyboardInterrupt:
    print("\n🛑 Afsluiten…")
    backend.terminate()
    frontend.terminate()
