import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const defaultCategories = [
  { name: 'Boodschappen', type: 'expense', icon: '🛒', color: '#22c55e', keywords: 'albert heijn,jumbo,lidl,aldi,plus,dirk,supermarkt,ah,spar,coop' },
  { name: 'Huur/Hypotheek', type: 'expense', icon: '🏠', color: '#3b82f6', keywords: 'huur,hypotheek,woningcorporatie' },
  { name: 'Energie', type: 'expense', icon: '⚡', color: '#f59e0b', keywords: 'vattenfall,eneco,essent,greenchoice,energie,gas,elektra,stroom' },
  { name: 'Transport', type: 'expense', icon: '🚗', color: '#8b5cf6', keywords: 'ns,ov-chipkaart,shell,bp,tango,tinq,benzine,parkeren,anwb' },
  { name: 'Verzekeringen', type: 'expense', icon: '🛡️', color: '#06b6d4', keywords: 'zorgverzekering,inshared,centraal beheer,nationale nederlanden,aegon,achmea' },
  { name: 'Abonnementen', type: 'expense', icon: '📱', color: '#ec4899', keywords: 'netflix,spotify,kpn,t-mobile,vodafone,ziggo,disney,amazon prime' },
  { name: 'Uit eten', type: 'expense', icon: '🍕', color: '#f97316', keywords: 'restaurant,thuisbezorgd,uber eats,deliveroo,mcdonalds,dominos' },
  { name: 'Kleding', type: 'expense', icon: '👕', color: '#a855f7', keywords: 'h&m,zara,primark,zalando,bol.com kleding,wehkamp' },
  { name: 'Gezondheid', type: 'expense', icon: '💊', color: '#ef4444', keywords: 'apotheek,huisarts,tandarts,fysiotherapie,ziekenhuis' },
  { name: 'Sport', type: 'expense', icon: '🏋️', color: '#14b8a6', keywords: 'sportschool,basic-fit,fitness,gym' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#6366f1', keywords: 'bioscoop,pathe,concert,festival,museum' },
  { name: 'Cadeaus', type: 'expense', icon: '🎁', color: '#f43f5e', keywords: 'cadeau,gift,bol.com,amazon' },
  { name: 'Onderwijs', type: 'expense', icon: '📚', color: '#0ea5e9', keywords: 'studie,opleiding,boeken,cursus,duo' },
  { name: 'Huishouden', type: 'expense', icon: '🧹', color: '#84cc16', keywords: 'ikea,action,blokker,hema,gamma,praxis' },
  { name: 'Overig uitgaven', type: 'expense', icon: '📋', color: '#94a3b8', keywords: '' },
  { name: 'Salaris', type: 'income', icon: '💰', color: '#22c55e', keywords: 'salaris,loon,werkgever' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#3b82f6', keywords: 'freelance,factuur,opdracht' },
  { name: 'Toeslagen', type: 'income', icon: '🏛️', color: '#8b5cf6', keywords: 'belastingdienst,toeslag,zorgtoeslag,huurtoeslag,kinderbijslag' },
  { name: 'Beleggingen', type: 'income', icon: '📈', color: '#f59e0b', keywords: 'dividend,belegging,rente,spaarrente' },
  { name: 'Overig inkomsten', type: 'income', icon: '📋', color: '#94a3b8', keywords: '' },
]

async function main() {
  const email = 'mikeschonewille@gmail.com'
  const password = 'CM120309cm!!'
  const name = 'Mike Schonewille'

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('User already exists, skipping.')
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  })

  await prisma.category.createMany({
    data: defaultCategories.map(c => ({
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      keywords: c.keywords,
      userId: user.id,
    })),
  })

  console.log(`User created: ${email}`)
  console.log(`Categories seeded: ${defaultCategories.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
