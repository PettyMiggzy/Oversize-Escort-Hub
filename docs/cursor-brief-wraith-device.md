# Cursor brief: the in-vehicle Wraith box (prototype)

Product idea: a small Raspberry Pi 5 box that plugs into a truck's diagnostic port, reads engine data, talks to the OEH Wraith assistant by voice, and later reports to a fleet dashboard. Trucks first (J1939), cars later (OBD2) with a different cable. Sold under Oversize Escort Hub. Nothing is built yet.

## Hard rules
- **Listen only.** The box must never transmit on the vehicle's data bus. Configure the CAN interface in listen-only mode and make the code unable to send frames.
- No safety claims anywhere (no "collision warning", no "keeps you safe"). It reads and reports.
- No secrets in the repo. The device token and API keys live in an environment file on the device, never committed.
- Do not wire anything into a real truck until the owner has confirmed his truck's 9-pin type (black and green connectors are wired differently) and the cable pinout.

## Phase 0: desk prototype, no truck needed
1. Python 3.11+ project in `device/` (new folder). Read CAN from a file replay (`candump` log format) with `python-can`, and decode a few common J1939 values (engine speed, coolant temperature, fuel rate, DEF level, active fault codes) behind a small interface so real hardware can replace the replay.
2. Voice loop: wake word ("hey wraith", use `openWakeWord`), record until silence, speech to text, send the text plus a short snapshot of the latest engine values to the backend, speak the answer. Keep every vendor behind one small function so it can be swapped.
3. Local buffer of the last few minutes of readings; nothing leaves the box except the question text and the snapshot.
4. Tests with recorded CAN logs. No test may need hardware or the internet.

## Phase 1: the backend part (Claude builds this in the OEH repo, not Cursor)
Device pairing and a device token, a device endpoint that is separate from `/api/wraith`, trip logs and fault history tables, and the fleet dashboard. Do not invent API routes in the OEH app. Write down what you need from the backend in `device/NEEDS_BACKEND.md` and the owner will pass it on.

## Phase 2: hardware (needs the owner)
Pick a Pi-compatible CAN interface board, a 12/24 V to 5 V power converter rated for trucks, and the 9-pin Deutsch cable. Do not guess part numbers: list two or three options with prices and the owner picks. Test on the owner's truck only in listen-only mode.

## Branch and checks
Branch `cursor/wraith-device`. No pull request, no push to `main`, no deploys. Report what changed, exact commands, what was not tested, and what the owner must do.
