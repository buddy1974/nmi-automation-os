import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon }   from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const DISTRIBUTORS = [
  {
    name:    "NMI Distribution — Adamawa",
    region:  "Adamawa",
    city:    "Ngaoundéré",
    phone:   "+237 222 250 001",
    email:   "adamawa@nmieducation.com",
    address: "Quartier Commercial, Avenue du Lamidat, Ngaoundéré",
    active:  true,
  },
  {
    name:    "NMI Distribution — Centre",
    region:  "Centre",
    city:    "Yaoundé",
    phone:   "+237 222 220 002",
    email:   "centre@nmieducation.com",
    address: "Avenue Kennedy, Bastos, Yaoundé",
    active:  true,
  },
  {
    name:    "NMI Distribution — East",
    region:  "East",
    city:    "Bertoua",
    phone:   "+237 222 240 003",
    email:   "east@nmieducation.com",
    address: "Quartier Haoussa, Rue du Commerce, Bertoua",
    active:  true,
  },
  {
    name:    "NMI Distribution — Far North",
    region:  "Far North",
    city:    "Maroua",
    phone:   "+237 222 290 004",
    email:   "farnorth@nmieducation.com",
    address: "Grand Marché de Maroua, Rue Principale",
    active:  true,
  },
  {
    name:    "NMI Distribution — Littoral",
    region:  "Littoral",
    city:    "Douala",
    phone:   "+237 233 400 005",
    email:   "littoral@nmieducation.com",
    address: "Rue Joss, Akwa, Douala",
    active:  true,
  },
  {
    name:    "NMI Distribution — North",
    region:  "North",
    city:    "Garoua",
    phone:   "+237 222 270 006",
    email:   "north@nmieducation.com",
    address: "Quartier Administratif, Avenue de la République, Garoua",
    active:  true,
  },
  {
    name:    "NMI Distribution — North West",
    region:  "North West",
    city:    "Bamenda",
    phone:   "+237 233 360 007",
    email:   "northwest@nmieducation.com",
    address: "Commercial Avenue, Up Station, Bamenda",
    active:  true,
  },
  {
    name:    "NMI Distribution — South",
    region:  "South",
    city:    "Ebolowa",
    phone:   "+237 222 280 008",
    email:   "south@nmieducation.com",
    address: "Quartier Nko'ovos, Rue du Stade, Ebolowa",
    active:  true,
  },
  {
    name:    "NMI Distribution — South West",
    region:  "South West",
    city:    "Buea",
    phone:   "+237 233 320 009",
    email:   "southwest@nmieducation.com",
    address: "Molyko, Great Soppo Road, Buea",
    active:  true,
  },
  {
    name:    "NMI Distribution — West",
    region:  "West",
    city:    "Bafoussam",
    phone:   "+237 233 440 010",
    email:   "west@nmieducation.com",
    address: "Centre Commercial, Avenue des Bamilékés, Bafoussam",
    active:  true,
  },
]

async function main() {
  console.log("── Seeding distributors ───────────────────────────────────────")
  for (const d of DISTRIBUTORS) {
    const exists = await prisma.distributor.findFirst({ where: { region: d.region } })
    if (exists) {
      console.log(`  ${d.region} distributor already exists`)
    } else {
      await prisma.distributor.create({ data: d })
      console.log(`✓ Created: ${d.name} — ${d.city}`)
    }
  }
  console.log("\n✓ Distributors seed complete")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
