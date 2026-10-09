// Conditional, on-theme questions built from a theme's "scenes" and a set of
// reactions: "If <scene>, who would <reaction>?" / "Agar <scene>, toh kaun <reaction>?".
// Each theme gets dozens of fresh, fun questions without any AI.
import type { LanguageId, ToneId } from "../shared/types";

interface Scenes {
  en: readonly string[];
  hi: readonly string[];
}

export const SCENES: Readonly<Record<string, Scenes>> = {
  trip: {
    en: ["the flight got cancelled at 3am", "the hotel looked nothing like the photos", "we ran out of money on day two", "someone lost the passports", "the trip budget leaked in the group chat"],
    hi: ["flight raat 3 baje cancel ho jaaye", "hotel photo jaisa bilkul na nikle", "doosre hi din paise khatam ho jaayein", "kisi ka passport kho jaaye", "trip ka budget group chat mein leak ho jaaye"]
  },
  trek: {
    en: ["we got lost on the trek at sunset", "the trek guide quit halfway", "it started pouring on the trek", "there was no network on the trek for three days", "the summit was cancelled at the last minute"],
    hi: ["trek pe sunset ke time raasta bhatak jaayein", "guide trek ke beech mein chhod ke chala jaaye", "trek pe zor ki baarish ho jaaye", "trek pe teen din network na mile", "summit last minute pe cancel ho jaaye"]
  },
  roadtrip: {
    en: ["the car broke down on an empty highway", "the playlist was taken over by one person", "we missed the last petrol pump", "Google Maps sent us down a farm road", "the road trip turned into a 14-hour drive"],
    hi: ["gaadi sunsaan highway pe band ho jaaye", "poori playlist pe ek hi insaan ka kabza ho jaaye", "aakhri petrol pump nikal jaaye", "Google Maps khet mein le jaaye", "road trip 14 ghante ki drive ban jaaye"]
  },
  beach: {
    en: ["a wave took everyone's phones", "the beach shack ran out of food", "we got stranded on the beach at night", "someone's ex showed up at the same beach", "the sunset photos all came out blurry"],
    hi: ["lehar sabke phone le jaaye", "beach shack mein khaana khatam ho jaaye", "raat ko beach pe phas jaayein", "same beach pe kisi ka ex aa jaaye", "sunset ki saari photos blur aa jaayein"]
  },
  camping: {
    en: ["the tent collapsed at 3am", "a wild animal was heard outside the tent", "the campfire wouldn't light", "we forgot the food at home", "it rained inside the tent"],
    hi: ["raat 3 baje tent gir jaaye", "tent ke bahar kisi janwar ki awaaz aaye", "campfire jale hi nahi", "khaana ghar pe hi bhool jaayein", "tent ke andar paani bhar jaaye"]
  },
  party: {
    en: ["the music stopped in the middle of the party", "the host's parents came home early", "the party food ran out in 20 minutes", "someone's ex walked into the party", "the neighbours called the police"],
    hi: ["party ke beech gaana band ho jaaye", "host ke mummy-papa jaldi ghar aa jaayein", "20 minute mein party ka khaana khatam ho jaaye", "party mein kisi ka ex aa jaaye", "padosi police bula lein"]
  },
  nightout: {
    en: ["the club refused entry to half the group", "the cab never came at 3am", "the bill was double what we expected", "someone's boss was at the next table", "we got locked out of the house after the night out"],
    hi: ["club aadhe group ko andar na jaane de", "raat 3 baje cab aaye hi nahi", "bill soch se double aa jaaye", "agle table pe kisi ka boss baitha ho", "night out ke baad ghar ka darwaza band mile"]
  },
  birthday: {
    en: ["nobody wished them at midnight", "the birthday cake fell on the floor", "the surprise party was revealed a day early", "their ex sent the first birthday wish", "the birthday dinner bill came to them"],
    hi: ["raat 12 baje kisi ne wish nahi kiya", "birthday cake zameen pe gir jaaye", "surprise party ek din pehle leak ho jaaye", "sabse pehla wish ex ka aaye", "birthday dinner ka bill unhi pe aa jaaye"]
  },
  wedding: {
    en: ["the DJ stopped at the wedding sangeet", "the baraat was three hours late", "the food counter at the wedding ran out", "someone's ex turned up as a wedding guest", "the wedding photographer only clicked one person"],
    hi: ["sangeet mein DJ band ho jaaye", "baraat teen ghante late ho", "shaadi mein khaane ka counter khatam ho jaaye", "shaadi mein kisi ka ex guest bankar aa jaaye", "photographer sirf ek hi insaan ki photo kheeche"]
  },
  bachelor: {
    en: ["the bachelor trip photos leaked to the family group", "the groom went missing the night before", "the bachelor budget was spent on day one", "the bride called during the bachelor party", "we ended up in the wrong city"],
    hi: ["bachelor trip ki photos family group mein leak ho jaayein", "shaadi se ek raat pehle dulha gaayab ho jaaye", "pehle hi din saara budget khatam ho jaaye", "bachelor party ke beech dulhan ka call aa jaaye", "galat shehar pahunch jaayein"]
  },
  newyear: {
    en: ["the countdown happened while we were stuck in traffic", "the New Year party got cancelled at 11pm", "someone's ex wished them first at midnight", "the fireworks set off the car alarms", "all the New Year resolutions broke by January 2nd"],
    hi: ["countdown traffic mein phase hue ho jaaye", "11 baje New Year party cancel ho jaaye", "raat 12 baje sabse pehle ex ka wish aaye", "pataakon se gaadiyon ke alarm baj jaayein", "2 January tak saare resolutions toot jaayein"]
  },
  festivals: {
    en: ["the Diwali sweets went missing", "Holi colours ruined someone's favourite outfit", "relatives asked about marriage at the festival lunch", "the festival plans clashed with a date", "the gift exchange gave someone a terrible gift"],
    hi: ["Diwali ki mithai gaayab ho jaaye", "Holi ke rang se kisi ka favourite outfit kharaab ho jaaye", "tyohaar ke lunch pe rishtedaar shaadi ka sawaal poochhein", "tyohaar ka plan date se takra jaaye", "gift exchange mein kisi ko bekaar gift mile"]
  },
  office: {
    en: ["the boss read the group chat", "the appraisal emails went to the wrong people", "the camera turned on during the meeting", "the office party had an open bar", "the team got stuck in a lift for an hour"],
    hi: ["boss group chat padh le", "appraisal ki mail galat logon ko chali jaaye", "meeting mein galti se camera on ho jaaye", "office party mein open bar ho", "poori team ek ghante lift mein phas jaaye"]
  },
  wfh: {
    en: ["the Wi-Fi died during a client call", "the camera caught them in bed", "the boss called during their afternoon nap", "the mute button stopped working", "the family walked into the video call"],
    hi: ["client call ke beech Wi-Fi chala jaaye", "camera mein bistar pe pakde jaayein", "dopahar ki neend mein boss ka call aa jaaye", "mute button kaam karna band kar de", "video call mein poori family aa jaaye"]
  },
  teamouting: {
    en: ["the team outing turned into karaoke night", "the boss joined the team outing", "the outing bus left without half the team", "the outing games got way too competitive", "the outing photos ended up on LinkedIn"],
    hi: ["team outing karaoke night ban jaaye", "boss bhi outing pe aa jaaye", "aadhi team ke bina outing ki bus nikal jaaye", "outing ke games mein ladai ho jaaye", "outing ki photos LinkedIn pe aa jaayein"]
  },
  startup: {
    en: ["the startup ran out of money", "an investor walked out of the pitch", "the app crashed on launch day", "a competitor copied the whole idea", "the founders had a public fight"],
    hi: ["startup ke paise khatam ho jaayein", "investor pitch ke beech uthke chala jaaye", "launch ke din app crash ho jaaye", "competitor poora idea copy kar le", "founders ki public mein ladai ho jaaye"]
  },
  college: {
    en: ["attendance was made compulsory overnight", "the professor caught the proxy", "the college fest got cancelled", "the canteen stopped giving credit", "the results came out a day early"],
    hi: ["raaton raat attendance compulsory ho jaaye", "professor proxy pakad le", "college fest cancel ho jaaye", "canteen udhaar dena band kar de", "result ek din pehle aa jaaye"]
  },
  hostel: {
    en: ["the warden did a surprise room check", "the hostel mess food got worse", "the Wi-Fi went down during exams", "someone's parents visited without telling", "the hostel lights went out at midnight"],
    hi: ["warden achanak room check karne aa jaaye", "hostel mess ka khaana aur bekaar ho jaaye", "exams ke time Wi-Fi band ho jaaye", "kisi ke mummy-papa bina bataye hostel aa jaayein", "raat 12 baje hostel ki light chali jaaye"]
  },
  school: {
    en: ["the teacher left the class alone", "the report card reached home first", "the school trip got cancelled", "the principal walked in during the chaos", "the homework was due in five minutes"],
    hi: ["teacher class akeli chhod ke chali jaaye", "report card pehle ghar pahunch jaaye", "school trip cancel ho jaaye", "hungame ke beech principal aa jaayein", "homework 5 minute mein jama karna ho"]
  },
  exams: {
    en: ["the exam paper leaked", "the syllabus changed the night before", "the exam was moved a week earlier", "the invigilator caught a chit", "the results were posted on the group chat"],
    hi: ["exam ka paper leak ho jaaye", "exam se ek raat pehle syllabus badal jaaye", "exam ek hafta pehle aa jaaye", "invigilator ko parchi mil jaaye", "results group chat pe daal diye jaayein"]
  },
  movies: {
    en: ["the movie turned out to be a total flop", "the hero looked exactly like your ex", "someone's phone rang in the climax", "we got stuck in the front row for 3 hours", "the person behind us spoiled the ending"],
    hi: ["movie ekdum flop nikle", "hero bilkul tumhare ex jaisa dikhe", "climax mein kisi ka phone baj jaaye", "teen ghante first row mein phas jaayein", "peeche wala insaan ending spoil kar de"]
  },
  bollywood: {
    en: ["our life became a Bollywood film", "a superstar walked into our café", "we were cast as extras in a song", "the dance number needed one volunteer", "a director wanted to film our love stories"],
    hi: ["humari life Bollywood film ban jaaye", "humare café mein superstar aa jaaye", "kisi gaane mein extras ban jaayein", "dance number ke liye ek volunteer chahiye ho", "director humari love stories pe film banana chahe"]
  },
  ott: {
    en: ["the shared Netflix password got changed", "the finale was spoiled on Instagram", "the binge session crossed 10 episodes", "someone's watch history got exposed", "the show we loved got cancelled"],
    hi: ["shared Netflix ka password badal jaaye", "Instagram pe finale spoil ho jaaye", "binge 10 episode paar kar jaaye", "kisi ki watch history khul jaaye", "pasandida show cancel ho jaaye"]
  },
  music: {
    en: ["the aux cable was taken away", "we had to sing on stage at a karaoke bar", "someone's guilty-pleasure playlist got played", "the concert tickets were fake", "the band asked the crowd for a singer"],
    hi: ["aux cable chheen liya jaaye", "karaoke bar mein stage pe gaana pade", "kisi ki sharmindagi wali playlist baj jaaye", "concert ke tickets nakli nikle", "band crowd se singer maange"]
  },
  dance: {
    en: ["a dance-off started at the party", "the DJ played a song only one person knew", "the dance floor emptied in the middle of a move", "someone's dance video went viral", "the choreographer quit before the sangeet"],
    hi: ["party mein dance-off shuru ho jaaye", "DJ aisa gaana bajaye jo sirf ek ko aata ho", "step ke beech dance floor khaali ho jaaye", "kisi ka dance video viral ho jaaye", "sangeet se pehle choreographer chhod de"]
  },
  sports: {
    en: ["the referee made a terrible call", "our team was losing badly at half-time", "the match was decided on penalties", "someone got injured in the warm-up", "the trophy went to the other team"],
    hi: ["referee bilkul galat decision de", "half-time tak team buri tarah haar rahi ho", "match penalty pe aa jaaye", "warm-up mein hi kisi ko chot lag jaaye", "trophy doosri team le jaaye"]
  },
  cricket: {
    en: ["the gully cricket ball broke a window", "the umpire gave a wrong LBW", "India needed 6 off the last ball", "the bat-owner got out first ball", "rain stopped the match at the best moment"],
    hi: ["gully cricket ki ball se kisi ka sheesha toot jaaye", "umpire galat LBW de de", "India ko last ball pe 6 chahiye", "bat wala pehli hi ball pe out ho jaaye", "match ke best moment pe baarish ho jaaye"]
  },
  football: {
    en: ["the match went to extra time at 2am", "our club lost the final", "a five-a-side game turned into a fight", "the ball went over the society wall", "someone scored an own goal"],
    hi: ["match raat 2 baje extra time mein chala jaaye", "humara club final haar jaaye", "five-a-side game ladai ban jaaye", "ball society ki deewar ke paar chali jaaye", "kisi ne apne hi goal mein goal maar diya"]
  },
  gym: {
    en: ["the gym mirrors were removed", "the trainer posted a before-after photo", "the gym was full of their ex's friends", "the protein shake exploded in the bag", "the gym membership auto-renewed for a year"],
    hi: ["gym se saare sheeshe hata diye jaayein", "trainer before-after photo daal de", "gym mein ex ke saare dost hon", "protein shake bag mein phat jaaye", "gym membership saal bhar ke liye auto-renew ho jaaye"]
  },
  gaming: {
    en: ["the Wi-Fi died in the final round", "a 12-year-old beat them online", "the game save file got deleted", "someone rage-quit and broke the controller", "the console was banned for a week"],
    hi: ["final round mein Wi-Fi chala jaaye", "online ek 12 saal ka bachcha hara de", "game ki save file delete ho jaaye", "gusse mein kisi ka controller toot jaaye", "console ek hafte ke liye ban ho jaaye"]
  },
  food: {
    en: ["the last slice of pizza was left", "the restaurant bill came with no split option", "the food order got delivered to the wrong house", "the buffet ran out before we got there", "the street food made everyone sick"],
    hi: ["pizza ka last slice bacha ho", "restaurant ka bill split karne ka option na ho", "khaane ka order galat ghar chala jaaye", "humare pahunchne se pehle buffet khatam ho jaaye", "street food khaake sab beemar pad jaayein"]
  },
  cooking: {
    en: ["the kitchen caught fire", "the cake didn't rise", "guests arrived before the food was ready", "the gas cylinder ran out mid-dinner", "everyone had to cook one dish"],
    hi: ["kitchen mein aag lag jaaye", "cake phoole hi nahi", "khaana bane usse pehle mehmaan aa jaayein", "dinner ke beech cylinder khatam ho jaaye", "sabko ek-ek dish banani pade"]
  },
  dating: {
    en: ["the date turned out to be someone's ex", "the date ordered the most expensive thing", "the dating profile photos were five years old", "the date brought their mom along", "the crush replied 'haha' to a long message"],
    hi: ["date pe kisi ka ex hi aa jaaye", "date sabse mehenga item order kar de", "dating profile ki photos 5 saal purani nikle", "date apni mummy ko saath le aaye", "lambe message ka reply crush sirf 'haha' de"]
  },
  relationships: {
    en: ["the partner checked their phone", "an ex liked a photo from 2019", "the anniversary was forgotten", "the couple fought in public", "a relationship status changed overnight"],
    hi: ["partner phone check kar le", "ex 2019 ki photo like kar de", "anniversary bhool jaayein", "couple ki public mein ladai ho jaaye", "raaton raat relationship status badal jaaye"]
  },
  friendship: {
    en: ["two best friends fell out", "a friend's secret got out", "the group chat had a fight", "someone wasn't invited to the trip", "a friend borrowed money and vanished"],
    hi: ["do best friends ki ladai ho jaaye", "kisi dost ka raaz khul jaaye", "group chat mein ladai ho jaaye", "kisi ko trip pe invite na kiya jaaye", "dost paise udhaar leke gaayab ho jaaye"]
  },
  family: {
    en: ["relatives asked about marriage at dinner", "the family WhatsApp group found our photos", "mom read the group chat", "the family trip had one car for 12 people", "a relative compared everyone's salaries"],
    hi: ["dinner pe rishtedaar shaadi ka sawaal poochhein", "family WhatsApp group ko humari photos mil jaayein", "mummy group chat padh lein", "12 logon ke liye family trip pe ek hi gaadi ho", "koi rishtedaar sabki salary compare kare"]
  },
  cousins: {
    en: ["the cousins' secret got leaked to the elders", "all the cousins had to share one room", "the elders made a cousin ranking", "a cousin got engaged first", "the cousins' trip plan fell apart"],
    hi: ["cousins ka raaz bado tak pahunch jaaye", "saare cousins ko ek hi kamre mein sona pade", "bade cousins ki ranking bana dein", "sabse pehle kisi cousin ki sagai ho jaaye", "cousins ka trip plan bigad jaaye"]
  },
  childhood: {
    en: ["our childhood diaries were found", "old school photos were posted online", "a childhood crush messaged after years", "our parents told embarrassing childhood stories", "we had to replay a childhood game"],
    hi: ["bachpan ki diaries mil jaayein", "school ki purani photos online aa jaayein", "saalon baad bachpan ke crush ka message aaye", "mummy-papa bachpan ki sharmnaak kahaaniyan sunaayein", "bachpan ka koi game dobara khelna pade"]
  },
  socialmedia: {
    en: ["their finsta got exposed", "a story went to 'close friends' by mistake", "an old cringe post resurfaced", "a reel got a million views overnight", "Instagram went down for a whole day"],
    hi: ["unka secret account pakda jaaye", "galti se story 'close friends' ko chali jaaye", "purana cringe post phir se aa jaaye", "ek reel raaton raat million views le aaye", "poore din Instagram band ho jaaye"]
  },
  tech: {
    en: ["the phone died at 1%", "someone's browser history got shared on screen", "the laptop crashed before a deadline", "the smartwatch said they slept 14 hours", "an AI chatbot replaced their job"],
    hi: ["phone 1% pe band ho jaaye", "screen share pe kisi ki browser history dikh jaaye", "deadline se pehle laptop crash ho jaaye", "smartwatch bataye ki 14 ghante soye", "AI chatbot unki naukri le le"]
  },
  shopping: {
    en: ["a 90% sale went live at midnight", "the card got declined at the counter", "the parcel arrived at their parents' house", "they ran into their ex at the mall", "the return window closed yesterday"],
    hi: ["raat 12 baje 90% sale lag jaaye", "counter pe card decline ho jaaye", "parcel mummy-papa ke ghar pahunch jaaye", "mall mein ex se takra jaayein", "return ka time kal hi khatam ho gaya"]
  },
  fashion: {
    en: ["two people showed up in the same outfit", "the outfit tore at the party", "a fashion influencer roasted their look", "the dress code was 'all white' at Holi", "their outfit got compared to a curtain"],
    hi: ["do log same kapde pehen ke aa jaayein", "party mein kapde phat jaayein", "fashion influencer unke look ka mazaak uda de", "Holi pe dress code 'all white' ho", "unke outfit ko parda bol diya jaaye"]
  },
  pets: {
    en: ["the dog ate the birthday cake", "a stray followed us home", "the cat walked across a work call", "the pet got more likes than them", "the pet ran away during the walk"],
    hi: ["kutta birthday cake kha jaaye", "gali ka kutta ghar tak peeche aa jaaye", "work call pe billi keyboard pe chal de", "pet ko unse zyada likes mil jaayein", "walk pe pet bhaag jaaye"]
  },
  driving: {
    en: ["we got pulled over by the traffic police", "the car got scratched in the parking", "Google Maps lost signal in the hills", "the car ran out of fuel on a flyover", "we had to reverse down a narrow lane"],
    hi: ["traffic police gaadi rok le", "parking mein gaadi pe scratch aa jaaye", "pahadon mein Google Maps band ho jaaye", "flyover pe petrol khatam ho jaaye", "patli gali mein reverse karna pade"]
  },
  monsoon: {
    en: ["the street flooded on the way home", "the umbrella flipped inside out", "power went out for the whole night", "the monsoon cancelled every plan", "a car splashed us with muddy water"],
    hi: ["ghar jaate waqt sadak pe paani bhar jaaye", "chhata ulta ho jaaye", "poori raat light chali jaaye", "baarish saare plan cancel kar de", "koi gaadi keechad ka paani uchhaal de"]
  },
  survival: {
    en: ["zombies attacked the city", "we were stranded on an island", "the food supply ran out", "only one person could escape", "the group had to vote someone out"],
    hi: ["shehar mein zombies aa jaayein", "kisi island pe phas jaayein", "khaana khatam ho jaaye", "sirf ek insaan bach ke nikal sake", "group ko kisi ek ko bahar karna pade"]
  },
  fantasy: {
    en: ["we all got superpowers", "someone could read minds", "a genie gave one wish to the group", "we swapped bodies for a day", "time travel became possible"],
    hi: ["sabko superpowers mil jaayein", "koi mann padh sake", "jinn poore group ko ek wish de", "ek din ke liye body swap ho jaaye", "time travel possible ho jaaye"]
  },
  future: {
    en: ["we met again in 10 years", "someone became a millionaire", "the group had a reunion with partners", "one of us became famous", "we all had to work together"],
    hi: ["10 saal baad phir milein", "koi millionaire ban jaaye", "reunion mein sab partners ke saath aayein", "hum mein se koi famous ho jaaye", "sabko saath mein kaam karna pade"]
  },
  habits: {
    en: ["bad habits were posted on a billboard", "phones were banned for a week", "everyone had to wake up at 5am", "snoozing the alarm became illegal", "our screen times were made public"],
    hi: ["buri aadatein billboard pe lag jaayein", "ek hafte ke liye phone ban ho jaaye", "sabko subah 5 baje uthna pade", "alarm snooze karna gair-kaanooni ho jaaye", "sabka screen time public ho jaaye"]
  },
  secrets: {
    en: ["everyone's secrets came out at once", "the group chat was read aloud", "a lie detector party was organised", "someone's diary was found", "the truth-or-dare got too real"],
    hi: ["sabke raaz ek saath khul jaayein", "group chat zor se padha jaaye", "lie detector party ho", "kisi ki diary mil jaaye", "truth-or-dare zyada hi asli ho jaaye"]
  }
};

/** Reactions completing "…, who would ___?" / "…, toh kaun ___?". */
export const REACTIONS: Readonly<Record<ToneId, { en: readonly string[]; hi: readonly string[] }>> = {
  savage: {
    en: [
      "blame everyone else and walk out",
      "secretly enjoy the drama",
      "post a story before helping anyone",
      "throw their best friend under the bus",
      "make the whole thing about themselves",
      "lie about it for the next five years",
      "text their ex about it",
      "flirt with a stranger to fix it",
      "cry first and then deny it",
      "vanish without telling anyone",
      "turn it into gossip by morning",
      "say 'I knew this would happen'"
    ],
    hi: [
      "sabko blame karke nikal jaayega",
      "chupke se drama enjoy karega",
      "madad se pehle story daalega",
      "apne best friend ko phasa dega",
      "poori baat khud pe le aayega",
      "agle 5 saal tak jhooth bolega",
      "ex ko message kar dega",
      "kisi stranger se flirt karke kaam nikalega",
      "pehle royega, phir mukar jaayega",
      "bina bataye gaayab ho jaayega",
      "subah tak gossip bana dega",
      "bolega 'mujhe pehle se pata tha'"
    ]
  },
  blunt: {
    // Every reaction has to make sense after any scene of any theme.
    en: [
      "panic first",
      "complain the loudest",
      "make a reel out of it",
      "laugh at the worst moment",
      "call their mom",
      "act like an expert",
      "start a debate about it",
      "pretend nothing happened",
      "give a dramatic speech about it",
      "blame the universe",
      "give everyone unwanted advice",
      "tell the story wrong for years"
    ],
    hi: [
      "sabse pehle ghabrayega",
      "sabse zyada shikayat karega",
      "uski reel bana dega",
      "galat time pe hasega",
      "mummy ko call karega",
      "expert ban jaayega",
      "us pe behes shuru kar dega",
      "aise behave karega jaise kuch hua hi nahi",
      "lamba dramatic bhashan dega",
      "kismat ko blame karega",
      "sabko free ki advice dega",
      "saalon tak kahaani badha-chadha ke sunayega"
    ]
  }
};

function shuffle<T>(list: T[], random: () => number): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Scenario questions for one theme. Scenes and reactions are paired so that
 * the first questions each use a different scene AND a different reaction.
 */
export function sceneQuestions(genre: string, tone: ToneId, language: LanguageId, random: () => number = Math.random): string[] {
  const scenes = SCENES[genre];
  if (!scenes) return [];
  const build = (lang: "en" | "hi") => {
    const s = shuffle([...scenes[lang]], random);
    const r = shuffle([...REACTIONS[tone][lang]], random);
    const out: string[] = [];
    // Pass k pairs scene i with reaction (i + k): every pass is a fresh combination.
    for (let k = 0; k < r.length; k++) {
      for (let i = 0; i < s.length; i++) {
        const reaction = r[(i + k * s.length) % r.length];
        out.push(lang === "en" ? `If ${s[i]}, who would ${reaction}?` : `Agar ${s[i]}, toh kaun ${reaction}?`);
      }
    }
    return out;
  };
  if (language === "en") return build("en");
  // Hinglish: two Hinglish, one English, repeating.
  const hi = build("hi");
  const en = build("en");
  const out: string[] = [];
  while (hi.length || en.length) out.push(...hi.splice(0, 2), ...en.splice(0, 1));
  return out;
}
