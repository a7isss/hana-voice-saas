# Railway Internal Networking & Environment Variable Guide

This document combines the two explanations into a clear, coder-friendly implementation guide. It is meant to help a developer (or an AI agent acting as a developer) integrate communication between Railway services using **internal networking** and **environment variables**, without hardcoding hostnames.

---

## ✅ 1. Understanding Railway Internal Networking

Railway provides a **private internal network** that allows services inside the same project/environment to talk to each other via:

```
service-name.railway.internal
```

Key characteristics:

* Internal DNS works **only inside Railway**, not on your local machine.
* Internal networking is **IPv6-only**, so your server must listen on IPv6.
* Use **http://**, not https, for internal service-to-service calls.

### Uvicorn (Python) must bind to IPv6:

```
uvicorn app:app --host "::" --port $PORT
```

If a service binds only to IPv4, internal calls will fail.

---

## ✅ 2. Avoid Hardcoding: Use Railway Environment Variables

You never need to hardcode:

* internal hostnames,
* ports,
* URLs.

Instead, Railway allows **reference variables** that dynamically inject service information.

### Example env variable in your Python service:

```
HANA_VOICE_URL = http://${{hana-voice.RAILWAY_PRIVATE_DOMAIN}}:${{hana-voice.PORT}}
```

Railway expands this automatically to:

```
http://hana-voice.railway.internal:XXXX
```

### Your Python backend just reads the variable:

```python
import os
import httpx

HANA_URL = os.environ["HANA_VOICE_URL"]

async def call_voice():
    async with httpx.AsyncClient() as client:
        r = await client.post(f"{HANA_URL}/process", json={"hello": "world"})
        return r.json()
```

Your code stays generic and environment-agnostic.

---

## ✅ 3. Optional: Split Host + Port

You may want separate variables for clarity:

```
HANA_VOICE_HOST = ${{hana-voice.RAILWAY_PRIVATE_DOMAIN}}
HANA_VOICE_PORT = ${{hana-voice.PORT}}
```

Then assemble in code:

```python
BASE_URL = f"http://{HOST}:{PORT}"
```
note that my frontend public domain is "https://horof.space" 
---

## 🎉 Benefits of the ENV-based approach

* No hardcoded service names
* Seamless across staging/prod/preview deployments
* Renaming services doesn’t require code changes
* CI/CD friendly
* Follows 12-factor app standards

---

## 🧩 Checklist for Implementation

* [ ] Ensure both services exist in the same Railway project/environment.
* [ ] Configure environment variables using Railway reference notation.
* [ ] Bind server on IPv6 (`--host "::"`).
* [ ] Call services using `http://internal-host:port` from env vars.
* [ ] Test inside Railway (local machines cannot resolve `.railway.internal`).

---

This explainer is now ready for a coding AI to implement service-to-service communication using Railway’s internal network and environment variables.
