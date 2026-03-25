import { NextResponse }  from "next/server"
import { checkRateLimit } from "@/lib/rateLimit"

export const runtime = "nodejs"

interface Suggestion {
  display: string
  street:  string
  city:    string
  region:  string
  zip:     string
}

const CAMEROON_CITIES: { city: string; region: string }[] = [
  { city: "Yaoundé",       region: "Centre"    },
  { city: "Douala",        region: "Littoral"  },
  { city: "Bamenda",       region: "North West"},
  { city: "Bafoussam",     region: "West"      },
  { city: "Garoua",        region: "North"     },
  { city: "Maroua",        region: "Far North" },
  { city: "Ngaoundéré",    region: "Adamawa"   },
  { city: "Bertoua",       region: "East"      },
  { city: "Ebolowa",       region: "South"     },
  { city: "Kumba",         region: "South West"},
  { city: "Limbe",         region: "South West"},
  { city: "Buea",          region: "South West"},
  { city: "Kribi",         region: "South"     },
  { city: "Edéa",          region: "Littoral"  },
  { city: "Nkongsamba",    region: "Littoral"  },
  { city: "Dschang",       region: "West"      },
  { city: "Foumban",       region: "West"      },
  { city: "Mbalmayo",      region: "Centre"    },
  { city: "Sangmélima",    region: "South"     },
  { city: "Kaélé",         region: "Far North" },
  { city: "Meiganga",      region: "Adamawa"   },
  { city: "Tibati",        region: "Adamawa"   },
  { city: "Guider",        region: "North"     },
  { city: "Mora",          region: "Far North" },
  { city: "Wum",           region: "North West"},
  { city: "Kumbo",         region: "North West"},
  { city: "Mbouda",        region: "West"      },
  { city: "Abong-Mbang",   region: "East"      },
  { city: "Ambam",         region: "South"     },
  { city: "Yokadouma",     region: "East"      },
]

interface NominatimResult {
  display_name: string
  address?: {
    road?:     string
    city?:     string
    town?:     string
    village?:  string
    state?:    string
    postcode?: string
  }
}

export async function GET(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ suggestions: [] }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() ?? ""

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // ── Try Nominatim ─────────────────────────────────────────────────────
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + " Cameroon")}&format=json&limit=6&countrycodes=cm&addressdetails=1&accept-language=fr,en`
      const res = await fetch(url, {
        headers: { "User-Agent": "NMI-Education-Dashboard/1.0" },
        signal:  AbortSignal.timeout(3000),
      })

      if (res.ok) {
        const data = await res.json() as NominatimResult[]
        if (data.length > 0) {
          const suggestions: Suggestion[] = data.map(item => ({
            display: item.display_name.split(",").slice(0, 3).join(",").trim(),
            street:  item.address?.road ?? "",
            city:    item.address?.city ?? item.address?.town ?? item.address?.village ?? "",
            region:  item.address?.state ?? "",
            zip:     item.address?.postcode ?? "",
          }))
          return NextResponse.json({ suggestions })
        }
      }
    } catch {
      // Nominatim unavailable — fall through to local list
    }

    // ── Fallback: hardcoded city list ──────────────────────────────────────
    const lower = q.toLowerCase()
    const suggestions: Suggestion[] = CAMEROON_CITIES
      .filter(c =>
        c.city.toLowerCase().includes(lower) ||
        c.region.toLowerCase().includes(lower)
      )
      .map(c => ({
        display: `${c.city}, ${c.region}, Cameroon`,
        street:  "",
        city:    c.city,
        region:  c.region,
        zip:     "",
      }))

    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error("[GET /api/address]", err)
    return NextResponse.json({ suggestions: [] })
  }
}
