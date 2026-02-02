import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const defaultCategories = [
  { name: 'Boodschappen', type: 'expense', icon: '🛒', color: '#22c55e', keywords: 'albert heijn,ah to go,ah bezorg,jumbo,lidl,aldi,plus,dirk,supermarkt,ah,spar,coop,dekamarkt,vomar,picnic,crisp,hoogvliet,jan linders,poiesz,boni,nettorama,deen,ekoplaza,marqt' },
  { name: 'Huur/Hypotheek', type: 'expense', icon: '🏠', color: '#3b82f6', keywords: 'huur,hypotheek,woningcorporatie,woonlasten,vestia,ymere,eigen haard,portaal,woonstad,stadgenoot,rochdale,de alliantie,woningstichting,abn amro hypotheek,ing hypotheek,rabobank hypotheek' },
  { name: 'Energie', type: 'expense', icon: '⚡', color: '#f59e0b', keywords: 'vattenfall,eneco,essent,greenchoice,energie,gas,elektra,stroom,vandebron,budget energie,energiedirect,oxxio,dutch energy,powerpeers,pure energie,waternet,evides,brabant water,vitens,dunea,pwn' },
  { name: 'Transport', type: 'expense', icon: '🚗', color: '#8b5cf6', keywords: 'ns,ov-chipkaart,shell,bp,tango,tinq,benzine,parkeren,anwb,total energies,esso,texaco,gulf,q8,fastned,allego,swapfiets,check,felyx,tier,lime,bolt,uber,freenow,sixt,greenwheels,mywheels,snappcar,flitsmeister,parkmobile,yellowbrick,q-park,apcoa' },
  { name: 'Verzekeringen', type: 'expense', icon: '🛡️', color: '#06b6d4', keywords: 'zorgverzekering,inshared,centraal beheer,nationale nederlanden,aegon,achmea,interpolis,ohra,ditzo,zilveren kruis,cz,menzis,vgz,unive,fbto,allianz,asr,reaal,delta lloyd,verzekeringsmaatschappij' },
  { name: 'Abonnementen', type: 'expense', icon: '📱', color: '#ec4899', keywords: 'netflix,spotify,kpn,t-mobile,vodafone,ziggo,disney,amazon prime,apple,google storage,icloud,youtube premium,hbo max,videoland,viaplay,nlziet,dazn,storytel,audible,adobe,microsoft 365,playstation,xbox,nintendo,simyo,lebara,hollandsnieuwe,ben,odido' },
  { name: 'Uit eten', type: 'expense', icon: '🍕', color: '#f97316', keywords: 'restaurant,thuisbezorgd,uber eats,deliveroo,mcdonalds,dominos,new york pizza,subway,burger king,kfc,starbucks,coffee company,bagels & beans,bakker bart,dunkin,febo,smullers,chopstix,vapiano,la place,lunch,eetcafe,pizzeria,sushi,wok,broodje' },
  { name: 'Kleding', type: 'expense', icon: '👕', color: '#a855f7', keywords: 'h&m,zara,primark,zalando,wehkamp,c&a,only,vero moda,jack jones,nike,adidas,puma,uniqlo,mango,scotch soda,g-star,tommy hilfiger,ralph lauren,about you,asos,coolblue kleding,bristol,scapino,van haren,nelson' },
  { name: 'Gezondheid', type: 'expense', icon: '💊', color: '#ef4444', keywords: 'apotheek,huisarts,tandarts,fysiotherapie,ziekenhuis,etos,kruidvat,da drogist,trekpleister,holland barrett,eigen bijdrage,eigen risico,cak,ggz,psycholoog,optiek,specsavers,hans anders,pearle,brillen' },
  { name: 'Sport', type: 'expense', icon: '🏋️', color: '#14b8a6', keywords: 'sportschool,basic-fit,fitness,gym,anytime fitness,fit for free,healthcity,trainmore,sportcity,decathlon,intersport,perry sport,zwembad,tennisclub,voetbalvereniging,sportvereniging' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#6366f1', keywords: 'bioscoop,pathe,concert,festival,museum,ticketmaster,eventim,bol.com,steam,playstation store,xbox store,nintendo eshop,spotify,boekhandel,bruna,efteling,walibi,madurodam,artis,burgers zoo,attractiepark,pretpark,theater,schouwburg' },
  { name: 'Cadeaus', type: 'expense', icon: '🎁', color: '#f43f5e', keywords: 'cadeau,gift,bol.com,amazon,greetz,hallmark,kaartje2go,bloemen,fleurop,euroflorist' },
  { name: 'Onderwijs', type: 'expense', icon: '📚', color: '#0ea5e9', keywords: 'studie,opleiding,boeken,cursus,duo,collegegeld,universiteit,hogeschool,studielink,surf,ov studentenkaart,tentamen,inschrijving' },
  { name: 'Huishouden', type: 'expense', icon: '🧹', color: '#84cc16', keywords: 'ikea,action,blokker,hema,gamma,praxis,karwei,hornbach,formido,brico,leen bakker,jysk,kwantum,xenos,flying tiger,mediamarkt,coolblue,bcc,expert' },
  { name: 'Overig uitgaven', type: 'expense', icon: '📋', color: '#94a3b8', keywords: '' },
  { name: 'Salaris', type: 'income', icon: '💰', color: '#22c55e', keywords: 'salaris,loon,werkgever,salarisbetaling,nettoloon,uitbetaling,loonbetaling' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#3b82f6', keywords: 'freelance,factuur,opdracht,honorarium,declaratie' },
  { name: 'Toeslagen', type: 'income', icon: '🏛️', color: '#8b5cf6', keywords: 'belastingdienst,toeslag,zorgtoeslag,huurtoeslag,kinderbijslag,kinderopvangtoeslag,svb,uwv,ww-uitkering,bijstand,studiefinanciering,voorlopige teruggave' },
  { name: 'Beleggingen', type: 'income', icon: '📈', color: '#f59e0b', keywords: 'dividend,belegging,rente,spaarrente,rendement,degiro,meesman,brand new day,binck,lynx,ing beleggen,abn amro beleggen' },
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
