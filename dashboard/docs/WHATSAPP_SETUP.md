# NMI Education — WhatsApp Business Integration

## Overview

The WhatsApp integration receives incoming customer messages, generates AI replies via Claude, and logs everything to the dashboard at `/whatsapp`.

---

## Webhook Configuration

### Endpoint
```
POST https://your-domain.vercel.app/api/whatsapp/webhook
GET  https://your-domain.vercel.app/api/whatsapp/webhook  (verification)
```

### Meta Developer Setup
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new App → Business → WhatsApp
3. Under **WhatsApp → Configuration**:
   - Webhook URL: `https://your-domain.vercel.app/api/whatsapp/webhook`
   - Verify Token: `nmi-whatsapp-verify-2025` (must match `WHATSAPP_VERIFY_TOKEN` in env)
4. Subscribe to **messages** webhook field
5. Copy your **Access Token** and **Phone Number ID** to env vars

---

## Required Environment Variables

| Variable | Description |
|---|---|
| `WHATSAPP_VERIFY_TOKEN` | Token used during webhook verification (you choose this) |
| `WHATSAPP_ACCESS_TOKEN` | Permanent access token from Meta Developer Dashboard |
| `WHATSAPP_PHONE_ID`     | Your WhatsApp Business phone number ID from Meta |

Set all three in Vercel → Project → Settings → Environment Variables.

---

## n8n Workflow Blueprint — WhatsApp → NMI → Reply

```
Trigger: WhatsApp Business Cloud Trigger (new message)
  ↓
HTTP Request — POST to NMI:
  URL: https://your-domain.vercel.app/api/whatsapp/webhook
  Method: POST
  Body: (already handled by webhook — this step is optional if using direct webhook)

Alternatively, use n8n HTTP Request as the forwarder:

Step 1: Receive via HTTP Webhook (n8n)
  Method: POST
  Path: /whatsapp-in

Step 2: HTTP Request → NMI
  URL: https://your-domain.vercel.app/api/whatsapp/simulate
  Method: POST
  Body:
    {
      "from":         "{{ $json.from }}",
      "customerName": "{{ $json.profile.name }}",
      "message":      "{{ $json.text.body }}"
    }

Step 3: HTTP Request → WhatsApp Cloud API (send reply)
  URL: https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages
  Method: POST
  Headers:
    Authorization: Bearer {{ $env.WHATSAPP_ACCESS_TOKEN }}
    Content-Type: application/json
  Body:
    {
      "messaging_product": "whatsapp",
      "to": "{{ $json.from }}",
      "type": "text",
      "text": { "body": "{{ $('HTTP Request').item.json.reply }}" }
    }
```

---

## Website Embed — Floating WhatsApp Button

Paste this snippet into the `<body>` of nmieducation.com to add a floating WhatsApp contact button:

```html
<!-- NMI WhatsApp Button -->
<style>
  .nmi-wa-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #25d366;
    color: #fff;
    text-decoration: none;
    padding: 0 20px;
    height: 52px;
    border-radius: 999px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(37, 211, 102, 0.45);
    transition: all 0.2s;
  }
  .nmi-wa-btn:hover {
    background: #1ebe5d;
    transform: scale(1.05);
  }
  .nmi-wa-btn svg { flex-shrink: 0; }
</style>

<a
  href="https://wa.me/237XXXXXXXXX?text=Bonjour%20NMI%20Education"
  target="_blank"
  rel="noopener noreferrer"
  class="nmi-wa-btn"
  aria-label="Chat on WhatsApp"
>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.534 5.852L.057 23.5a.5.5 0 00.603.637l5.882-1.542A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.127-1.42l-.368-.218-3.786.993 1.01-3.677-.239-.378A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
  WhatsApp
</a>
<!-- End NMI WhatsApp Button -->
```

Replace `237XXXXXXXXX` with your actual WhatsApp Business number (no `+`).

---

## Testing Without Real WhatsApp

Use the built-in simulator at `/whatsapp/simulate` or call the API directly:

```bash
curl -X POST https://your-domain.vercel.app/api/whatsapp/simulate \
  -H "Content-Type: application/json" \
  -d '{"from": "+237691000000", "customerName": "Test", "message": "Bonjour, prix du livre CM2?"}'
```

---

## Production Checklist

- [ ] `WHATSAPP_VERIFY_TOKEN` set in Vercel
- [ ] `WHATSAPP_ACCESS_TOKEN` set in Vercel
- [ ] `WHATSAPP_PHONE_ID` set in Vercel
- [ ] Webhook URL registered in Meta Developer Portal
- [ ] Webhook verified (GET endpoint returns challenge)
- [ ] Test message received and logged in `/whatsapp` dashboard
- [ ] n8n reply workflow configured and tested
- [ ] Website embed button deployed on nmieducation.com
