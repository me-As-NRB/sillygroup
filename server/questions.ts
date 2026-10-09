import type { LanguageId, ModeId, ToneId } from "../shared/types";
import { sceneQuestions } from "./scenes";
import { EXTRA_GENRE_BANK, EXTRA_HINGLISH_GENRE_BANK } from "./themeQuestions";

// Backup question bank, used when no AI key is set or the AI call fails.

export const QUESTION_BANK: readonly string[] = [
  "Who in the group is the most self-obsessed?",
  "Who is most likely to become famous one day?",
  "Who takes the longest to reply to messages?",
  "Who is most likely to be late to their own wedding?",
  "Who would survive the longest in a zombie apocalypse?",
  "Who is the biggest foodie in the group?",
  "Who is most likely to cry during a movie?",
  "Who spends the most time on their phone?",
  "Who is the best at keeping secrets?",
  "Who is the worst at keeping secrets?",
  "Who is most likely to forget a friend's birthday?",
  "Who would be the best stand-up comedian?",
  "Who is the most competitive person here?",
  "Who is most likely to fall asleep at a party?",
  "Who gives the best advice?",
  "Who is most likely to go viral on social media?",
  "Who is the biggest drama queen or king?",
  "Who is most likely to start a business?",
  "Who would win a dance-off?",
  "Who has the most chaotic camera roll?",
  "Who is most likely to get lost even with Google Maps?",
  "Who is the most likely to adopt ten pets?",
  "Who is the group's unofficial therapist?",
  "Who takes the most selfies?",
  "Who is most likely to say 'I'm 5 minutes away' while still at home?",
  "Who would be the first to quit a reality show?",
  "Who would win a reality show?",
  "Who is the pickiest eater?",
  "Who is most likely to laugh at the wrong moment?",
  "Who is the best cook?",
  "Who is most likely to spend all their salary in one day?",
  "Who is the most organised person in the group?",
  "Who has the best fashion sense?",
  "Who is most likely to become a motivational speaker?",
  "Who is most likely to argue with a referee?",
  "Who is the loudest person in the group?",
  "Who is the best at giving gifts?",
  "Who is most likely to binge an entire series in one night?",
  "Who is most likely to be caught talking to themselves?",
  "Who would make the best teacher?",
  "Who is most likely to move to another country on a whim?",
  "Who is the biggest overthinker?",
  "Who would be the worst at keeping a plant alive?",
  "Who is most likely to send a message to the wrong group chat?",
  "Who is the best storyteller?",
  "Who exaggerates their stories the most?",
  "Who is most likely to win a quiz night?",
  "Who is most likely to cancel plans last minute?",
  "Who is the most adventurous eater?",
  "Who would be the best travel buddy?",
  "Who is most likely to get a tattoo on impulse?",
  "Who is most likely to become a politician?",
  "Who would make the best detective?",
  "Who is the most stubborn?",
  "Who has the most contagious laugh?",
  "Who is most likely to be found at the snack table?",
  "Who is the biggest gym enthusiast?",
  "Who is most likely to sleep through an alarm?",
  "Who is the best at bargaining while shopping?",
  "Who is most likely to try every new trend?",
  "Who is most likely to forget where they parked?",
  "Who would be the best wedding planner?",
  "Who is the most likely to secretly be a superhero?",
  "Who is the calmest in a crisis?",
  "Who panics the most in a crisis?",
  "Who is the biggest gossip?",
  "Who would be the first to volunteer for anything?",
  "Who is most likely to write a book?",
  "Who is most likely to sing in the shower the loudest?",
  "Who is most likely to win the lottery and lose the ticket?",
  "Who is the best at remembering names?",
  "Who is the worst at remembering names?",
  "Who is most likely to break something expensive?",
  "Who would be the best captain of a sports team?",
  "Who is the most likely to start a group chat argument?",
  "Who is the most patient person here?",
  "Who is most likely to have a secret talent?",
  "Who is the biggest night owl?",
  "Who is the earliest riser?",
  "Who is most likely to eat someone else's lunch from the fridge?",
  "Who is the most likely to become a millionaire?",
  "Who would be the best at escaping an escape room?",
  "Who is most likely to cry at a wedding?",
  "Who is most likely to fall for a prank?",
  "Who is the best prankster?",
  "Who is most likely to be mistaken for a celebrity?",
  "Who has the most interesting playlist?",
  "Who is most likely to take charge when plans fall apart?",
  "Who is the most likely to overpack for a weekend trip?",
  "Who is most likely to reply 'ok' to a long message?",
  "Who would be the best host for a party?",
  "Who is the most likely to get into a debate about movies?",
  "Who is most likely to know all the latest memes?",
  "Who would be the best at haggling with an auto driver?",
  "Who is most likely to get distracted mid-sentence?",
  "Who is the most generous person in the group?",
  "Who is most likely to adopt a weird hobby?",
  "Who is most likely to survive alone on an island?",
  "Who would be the worst roommate?",
  "Who would be the best roommate?",
  "Who is the group's biggest optimist?",
  "Who is most likely to become a YouTuber?",
  "Who is most likely to win an argument without being right?",
  "Who has the best poker face?",
  "Who is most likely to cheat at board games?",
  "Who is most likely to be the last one to leave a party?",
  "Who is the best at taking photos of others?",
  "Who is the most likely to remember every inside joke?",
  "Who is most likely to fall asleep during a meeting?",
  "Who is the group's tech support?",
  "Who is most likely to order the same dish every time?",
  "Who would be the best at running a café?",
  "Who is the most likely to become a meme?",
  "Who would be the best partner in a crime movie heist?",
  "Who is most likely to forget their own password?",
  "Who is the biggest cricket fan?",
  "Who is the most likely to start singing at random?",
  "Who is most likely to plan the next group trip?",
  "Who is the most likely to say 'trust me' right before a disaster?",
  "Who is the most responsible person in this group?",
  "Who is the most stupidly funny without even trying?",
  "Who would get the whole group into trouble and then disappear?",
  "Who acts the most mature but is secretly the most childish?",
  "Who says 'I'll pay you back' and never does?",
  "Who would be the first to leave the group chat in anger?",
  "Who always has an excuse ready?",
  "Who is the worst at taking a joke about themselves?",
  "Who would sell out the group for a free pizza?",
  "Who has the most embarrassing story they don't want told?"
];

// Backup questions per genre, so a chosen theme still shows up without AI.
export const GENRE_BANK: Readonly<Record<string, readonly string[]>> = {
  trek: [
    "Who's most likely to forget their bag halfway up a trek?",
    "Who would complain the most on the first uphill climb?",
    "Who would take 200 photos and zero steps?",
    "Who would be the one carrying everyone's snacks?",
    "Who is most likely to get lost on a marked trail?",
    "Who would give up and ask for a mule ride?",
    "Who would reach the summit first and never let anyone forget it?",
    "Who would pack a hair dryer for a camping trek?"
  ],
  trip: [
    "Who would miss the flight because of a last-minute shopping stop?",
    "Who would plan the whole itinerary and still get the dates wrong?",
    "Who would lose their passport on day one?",
    "Who would argue with every hotel receptionist?",
    "Who would bring back the most useless souvenir?",
    "Who would spend the trip on their phone instead of sightseeing?",
    "Who would refuse to try any local food?",
    "Who's the most responsible one to hold everyone's tickets?"
  ],
  party: [
    "Who is the most stupidly funny person at a party?",
    "Who would hijack the music at a party?",
    "Who would fall asleep on the sofa before midnight?",
    "Who would start a deep life talk at 3am?",
    "Who would eat all the snacks before guests arrive?",
    "Who would send a regrettable text after the party?",
    "Who would be the last one to leave and the first to complain?",
    "Who would take charge of cleaning up the next morning?"
  ],
  office: [
    "Who is most likely to reply-all by mistake?",
    "Who joins every meeting on mute and talks anyway?",
    "Who would sleep through an important call?",
    "Who takes the longest lunch break?",
    "Who would become the boss and let it go to their head?",
    "Who says 'let's take this offline' the most?",
    "Who is secretly running the whole team?",
    "Who would forward a meme to the wrong group at work?"
  ],
  movies: [
    "Who would talk through the entire movie?",
    "Who would cry at an animated film?",
    "Who would spoil the ending for everyone?",
    "Who would fall asleep in the first 20 minutes?",
    "Who would be the first to die in a horror movie?",
    "Who would play the villain in a movie about this group?",
    "Who would argue the book was better?",
    "Who has watched the same movie the most times?"
  ],
  dating: [
    "Who would stalk a date's social media before meeting them?",
    "Who would plan the most over-the-top first date?",
    "Who would ghost someone after one date?",
    "Who would fall in love by the second message?",
    "Who would bring a friend along to a first date?",
    "Who gives the best dating advice but never follows it?",
    "Who would get stood up and still say 'it went well'?",
    "Who would write the cheesiest love letter?"
  ],
  sports: [
    "Who would argue with the referee the most?",
    "Who would quit a match because they're losing?",
    "Who would be the coach who shouts but never plays?",
    "Who would get injured during the warm-up?",
    "Who would celebrate a single goal like they won the World Cup?",
    "Who would pick a team only for the jersey colour?",
    "Who would blame the pitch after losing?",
    "Who would be the most responsible team captain?"
  ],
  wedding: [
    "Who is the most stupidly funny at a wedding?",
    "Who would hit the dance floor first at a wedding?",
    "Who would cry the most at a wedding?",
    "Who would go straight to the food counter at a wedding?",
    "Who would give the most embarrassing wedding speech?",
    "Who would be mistaken for the groom's relative and go along with it?",
    "Who would plan their own wedding outfit years in advance?",
    "Who would end up managing the whole wedding without being asked?"
  ]
};

export const HINGLISH_BANK: readonly string[] = [
  "Group mein sabse zyada attitude kiske paas hai?",
  "Kaun 'bas 5 minute mein aa raha hoon' bolke 1 ghanta lagata hai?",
  "Group ka sabse bada kanjoos kaun hai?",
  "Kiske phone ki gallery sabse zyada embarrassing hogi?",
  "Kaun bina wajah drama create karta hai?",
  "Group ka asli 'Sharma ji ka beta/beti' kaun hai?",
  "Kaun 'main toh diet pe hoon' bolke pura pizza kha jaata hai?",
  "Kaun exam se ek raat pehle padhai shuru karta hai?",
  "Kaun mummy ka sabse ladla/ladli hai?",
  "Kaun group chat mein seen karke reply nahi karta?",
  "Group ka sabse bada gossip master kaun hai?",
  "Kaun auto wale se 10 rupaye ke liye 20 minute behes karega?",
  "Kaun last minute pe plan cancel karne mein expert hai?",
  "Group mein sabse zyada filmy kaun hai?",
  "Kaun reels dekhte dekhte raat ke 3 baja deta hai?",
  "Kaun bill aate hi washroom chala jaata hai?",
  "Kaun Google Maps hone ke bawajood raasta bhatak jaata hai?",
  "Kaun hamesha 'main free hoon' bolke kabhi free nahi hota?",
  "Group ka unofficial therapist kaun hai?",
  "Kaun sabse smoothly jhooth bolta hai?",
  "Kaun sabse jaldi emotional ho jaata hai?",
  "Kaun 'bhai trust me' bolke sabko phasaata hai?",
  "Kaun sabse zyada overthinking karta hai?",
  "Kaun breakup ke baad sad songs ki playlist banata hai?",
  "Kiski mummy usko din mein sabse zyada call karti hai?",
  "Kaun 'kal se gym pakka' bolke kabhi nahi jaata?",
  "Kaun party ka DJ ban jaata hai bina kisi ke pooche?",
  "Kaun sabse pehle 'chalo ghar chalte hain yaar' bolta hai?",
  "Kaun WhatsApp pe 5 minute lambe voice notes bhejta hai?",
  "Kaun crush ke saamne bilkul chup ho jaata hai?",
  "Kaun sabka birthday bhool jaata hai, apna kabhi nahi?",
  "Kaun bina pooche sabko advice deta rehta hai?",
  "Group mein sabse responsible kaun hai, sabka khayal rakhta hai?",
  "Kaun raat ke 2 baje Maggi banata hai?",
  "Kaun 'chill guy/girl' banne ki sabse zyada acting karta hai?",
  "Kaun relatives ke saamne sabse sanskari ban jaata hai?",
  "Kaun har photo mein same pose deta hai?",
  "Kaun udhaar lekar bhool jaata hai?",
  "Kaun sabse zyada 'mera toh kuch nahi ho sakta' bolta hai?",
  "Kaun har baat pe 'bro' bolta hai?",
  "Kaun bina wajah sabse zyada hasta hai?",
  "Kaun sabse pehle 'main toh bol hi raha tha' bolega?",
  "Kaun lift mein bhi selfie le leta hai?",
  "Kaun shopping mein sabse zyada time lagata hai?",
  "Kaun group ka asli boss hai, bina bole?"
];

export const HINGLISH_GENRE_BANK: Readonly<Record<string, readonly string[]>> = {
  trek: [
    "Trek pe sabse pehle 'aur kitna door hai?' kaun poochega?",
    "Kaun trek pe apna bag hi bhool jaayega?",
    "Kaun summit pe sirf photo ke liye pahunchega?",
    "Kaun trek ke beech Maggi point pe hi ruk jaayega?",
    "Kaun tent mein sabse zyada kharrate maarega?",
    "Kaun trek pe charger ke liye sabse zyada pareshaan hoga?"
  ],
  trip: [
    "Trip pe sabse zyada shopping kaun karega?",
    "Kaun trip plan karke khud hi nahi aayega?",
    "Kaun hotel mein sabse late uthega?",
    "Kaun trip ka saara budget bigaad dega?",
    "Kaun har jagah 'bhai ek photo le le' bolega?",
    "Kaun trip pe ex ko dikhane ke liye story daalega?"
  ],
  party: [
    "Party mein sabse pehle dance floor pe kaun jaayega?",
    "Kaun party mein sirf khaane ke liye aata hai?",
    "Kaun raat 2 baje deep life talks shuru karega?",
    "Kaun party ke baad sabse embarrassing message bhejega?",
    "Kaun party mein bhi phone mein ghusa rehta hai?",
    "Kaun 'bas ek aur gaana' bolke party khatam nahi hone deta?"
  ],
  office: [
    "Kaun meeting mein mute pe bolta rehta hai?",
    "Boss ka sabse bada chamcha kaun hai?",
    "Kaun 'kal pakka kar dunga' bolke kabhi nahi karta?",
    "Kaun lunch break sabse lamba leta hai?",
    "Kaun office ki saari gossip jaanta hai?",
    "Kaun Monday ko sabse zyada udaas dikhta hai?"
  ],
  college: [
    "Kaun proxy lagwane mein expert hai?",
    "Kaun exam ki raat pehli baar syllabus dekhta hai?",
    "Canteen mein sabse zyada udhaar kiska hai?",
    "Professor ka favourite kaun hai?",
    "Kaun har lecture mein so jaata hai?",
    "Kaun hostel mein sabse zyada Maggi banata hai?"
  ],
  hostel: [
    "Hostel mein sabse zyada doosron ka khaana kaun khaata hai?",
    "Kaun raat bhar jaagke subah ki class miss karta hai?",
    "Kaun warden se sabse zyada baar pakda gaya hoga?",
    "Kaun ghar ka khaana aate hi chhupa leta hai?"
  ],
  dating: [
    "Kaun first date pe bhi late aayega?",
    "Kaun crush ki story sabse pehle dekhta hai?",
    "Kaun 'hum sirf dost hain' bolke sabse zyada pyaar mein hai?",
    "Kaun ex ko abhi bhi stalk karta hai?",
    "Kaun date pe bill split karne ki baat karega?",
    "Kaun sabse filmy tareeke se propose karega?"
  ],
  wedding: [
    "Shaadi mein sabse zyada kaun naachega?",
    "Kaun shaadi mein sirf khaana khaane jaata hai?",
    "Kaun baraat mein naagin dance karega?",
    "Kaun shaadi mein apna rishta pakka karwa ke aayega?",
    "Kaun sangeet ki practice karke bhi galat steps karega?",
    "Kaun vidaai pe sabse zyada royega?"
  ],
  family: [
    "Kaun 'beta shaadi kab karoge' sawaal se sabse zyada bhaagta hai?",
    "Kaun family function mein sirf phone chalata hai?",
    "Kaun family WhatsApp group pe good morning messages bhejta hai?",
    "Kaun nani-dadi ka favourite hai?",
    "Kaun relatives ke saamne sabse zyada sanskari banta hai?"
  ],
  cricket: [
    "Kaun gully cricket mein out hoke bhi out nahi maanta?",
    "Kaun match dekhte waqt TV pe chillata hai?",
    "Kaun khud ko Dhoni samajhta hai?",
    "Kaun bat apna hone ki wajah se pehle batting karta hai?"
  ],
  bollywood: [
    "Kaun Bollywood dialogues mein hi baat karta hai?",
    "Kaun movie mein sabse pehle rota hai?",
    "Kaun SRK ki tarah baahein phailata hai?",
    "Kaun har movie ka ending spoil karta hai?"
  ]
};

// Personal and exposing, never vulgar. Used when the host picks the Savage tone.
export const SAVAGE_BANK: readonly string[] = [
  "Who is most likely to still be secretly in touch with their ex?",
  "Who would read their partner's chats if they got the chance?",
  "Who here is the most fake in front of others?",
  "Who talks behind people's backs the most?",
  "Who would ditch this group first for a new partner?",
  "Who has the most red flags in a relationship?",
  "Who acts confident but is the most insecure inside?",
  "Who is most likely to be the toxic one in a relationship?",
  "Who would sell out a friend's secret for good gossip?",
  "Who pretends to be busy just to avoid people?",
  "Who has the biggest ego that nobody dares to mention?",
  "Who is most likely to lie about their salary?",
  "Who gets the most jealous when someone else gets attention?",
  "Who would ghost someone after a fight instead of talking?",
  "Who here has secretly had a crush on someone in this group?",
  "Who is most likely to be blocked by their ex?",
  "Who never apologises, even when they're clearly wrong?",
  "Who only calls when they need something?",
  "Who would choose money over this friendship?",
  "Who flirts the most even when they're in a relationship?",
  "Who would forget this group exists if they got rich?",
  "Who would cry over an ex in public?",
  "Who here would be the worst person to date?",
  "Who plays the victim in every story?",
  "Who is the most two-faced person in this group?",
  "Who is secretly the most selfish?",
  "Who texts first but pretends they don't care?",
  "Who would leave a friend stranded to impress their crush?",
  "Who has the biggest secret they'll never tell this group?",
  "Who takes credit for other people's work?",
  "Whose phone would cause the biggest scandal if it leaked?",
  "Who would we never trust with a secret again?"
];

export const SAVAGE_HINGLISH_BANK: readonly string[] = [
  "Group mein sabse bada fake kaun hai?",
  "Kaun peeth peeche sabse zyada baatein karta hai?",
  "Kaun abhi bhi ex ko secretly stalk karta hai?",
  "Kaun relationship mein sabse zyada toxic hoga?",
  "Kaun dost ka secret gossip ke liye bech dega?",
  "Kiske sabse zyada red flags hain?",
  "Kaun sirf kaam padne pe hi yaad karta hai?",
  "Kaun paise ke liye dosti chhod dega?",
  "Kaun sabse zyada jealous hota hai jab koi aur limelight le?",
  "Kaun galti hone pe bhi kabhi sorry nahi bolta?",
  "Kaun crush ke liye dosto ko turant chhod dega?",
  "Kaun upar se confident, andar se sabse insecure hai?",
  "Kaun ladai ke baad seedha ghost kar deta hai?",
  "Kiska attitude sabse zyada unbearable hai?",
  "Kaun relationship mein hote hue bhi sabse zyada flirt karta hai?",
  "Kaun 'main single hi khush hoon' ka sabse bada natak karta hai?",
  "Kaun amir hote hi is group ko bhool jaayega?",
  "Kaun har kahaani mein khud ko victim banata hai?",
  "Kaun doosron ke kaam ka credit le leta hai?",
  "Kaun is group mein kisi pe secretly crush rakhta hai?",
  "Kaun ex ke ek message pe sabse pehle pighal jaayega?",
  "Kiska phone kisi ke haath lag gaya toh sabse bada scandal hoga?",
  "Group ka sabse bada do-muha kaun hai?",
  "Kaun dost ki party mein jaake usi ki burai karega?",
  "Kaun salary ke baare mein sabse bada jhooth bolta hai?",
  "Group ka sabse bada attention seeker kaun hai?",
  "Kaun sabse zyada 'main toh kisi ki parwah nahi karta' bolta hai?",
  "Kis pe secret share karna sabse bada risk hai?"
];

// Couple mode: two partners vote and score only when they pick the same one.
export const COUPLE_BANK: readonly string[] = [
  "Who said 'I love you' first?",
  "Who is more likely to forget your anniversary?",
  "Who takes longer to get ready for a date?",
  "Who is the better cook between you two?",
  "Who apologises first after a fight?",
  "Who is more likely to plan a surprise trip?",
  "Who steals the blanket at night?",
  "Who is more romantic?",
  "Who spends more money on online shopping?",
  "Who is the bigger foodie?",
  "Who would win an argument about directions?",
  "Who is more likely to cry during a movie together?",
  "Who texts more 'good morning' messages?",
  "Who is more organised at home?",
  "Who would handle a flat tyre on a road trip better?",
  "Who is more likely to binge a whole series without the other?",
  "Who gets hangry faster?",
  "Who is the better dancer?",
  "Who is closer to the other's family?",
  "Who is more likely to post your photos on social media?",
  "Who falls asleep first during a movie night?",
  "Who makes the big decisions in this relationship?",
  "Who is more likely to remember small details about the first date?",
  "Who would survive longer without their phone?",
  "Who fell for the other first?",
  "Who is more likely to plan your next date night?",
  "Who wins most of your arguments?",
  "Who is more likely to forget what you fought about yesterday?",
  "Who would be the stricter parent?",
  "Who leaves more dishes in the sink when you live together?",
  "Who is more likely to cry at your wedding?",
  "Who takes more photos of the two of you?",
  "Who would plan the honeymoon?",
  "Who gives in first when you both want different movies?",
  "Who is more likely to say 'I'm fine' when they're clearly not?",
  "Who hogs the bed when you share it on holiday?",
  "Who is more likely to secretly re-read your old chats?",
  "Who would remember the date of your first kiss?",
  "Who misses the other more when you're apart?",
  "Who is more likely to change plans for the other?",
  "Who would adopt a pet without asking the other first?",
  "Who drives when you go out together?",
  "Who is the sorer loser when you play games together?",
  "Who would keep your plants alive if you lived together?",
  "Who decides how your home is decorated?",
  "Who is the bigger neat freak of the two of you?",
  "Who would rather stay in on a Saturday night together?",
  "Who gives the better hugs?",
  "Who is more likely to sing badly to the other?",
  "Who is the better listener in this relationship?",
  "Who would win a quiz about the other's life?",
  "Who holds hands more in public?"
];

export const COUPLE_HINGLISH_BANK: readonly string[] = [
  "Ladai ke baad pehle sorry kaun bolta hai?",
  "Kaun date pe hamesha late aata hai?",
  "Kaun zyada possessive hai?",
  "Kaun 'tum bolo kya khaana hai' bolke phir sab reject karta hai?",
  "Kaun zyada filmy romantic hai?",
  "Kaun gussa hone pe sabse zyada der tak muh phula ke rehta hai?",
  "Kaun shopping pe zyada paise udaata hai?",
  "Kaun raat ko zyada der tak phone chalata hai?",
  "Kaun dusre ke ghar walon ka zyada favourite hai?",
  "Kaun pehle 'hum log kab milenge?' poochta hai?",
  "Kaun zyada nakhre karta hai?",
  "Kaun anniversary ki date bhool sakta hai?",
  "Kaun zyada jealous hota hai?",
  "Kaun surprise gift dene mein better hai?",
  "Kaun khaana order karte waqt sabse zyada time lagata hai?",
  "Kaun breakup ka natak karke 5 minute mein maan jaata hai?",
  "Kaun selfie mein sabse zyada retakes karwata hai?",
  "Kaun relationship ka asli boss hai?",
  "Kaun 'main naraz nahi hoon' bolke sabse zyada naraz hota hai?",
  "Kaun pehle shaadi ki baat chhedta hai?",
  "Kaun pehle pyaar mein pada tha?",
  "Kaun 'tumhari yaad aa rahi hai' zyada bolta hai?",
  "Kaun date ka plan banake khud hi bhool jaata hai?",
  "Kaun movie choose karne mein hamesha jeet jaata hai?",
  "Kaun rooth ke manaane ka wait karta hai?",
  "Kaun dusre ke liye sabse zyada adjust karta hai?",
  "Kaun anniversary pe zyada filmy surprise dega?",
  "Kaun shaadi ke baad zyada badal jaayega?",
  "Kaun hamesha 'tum hi bata do' bolta hai?",
  "Kaun pehli date ki baatein zyada yaad rakhta hai?",
  "Kaun ladai mein pehle hasne lagta hai?",
  "Kaun dusre ki family ke saamne zyada sanskari banta hai?",
  "Kaun 'bas 5 minute aur' bolke call nahi rakhta?"
];

// Couple versions of popular themes: the theme is something the two do together.
export const COUPLE_GENRE_BANK: Readonly<Record<string, readonly string[]>> = {
  trip: [
    "Who would overpack for your trip together?",
    "Who would pick the hotel on your next holiday?",
    "Who would sulk first if your flight got delayed?"
  ],
  trek: [
    "Who would ask to turn back first on a trek together?",
    "Who would carry both bags on your trek?",
    "Who would stop for a couple selfie at every turn of the trail?"
  ],
  roadtrip: ["Who controls the music on your road trips?", "Who would get you lost on a drive together?"],
  beach: ["Who would plan a sunset date on the beach?", "Who would get sunburnt first on your beach holiday?"],
  party: [
    "Who drags the other to the dance floor at parties?",
    "Who gets jealous first when the other is chatting with someone at a party?"
  ],
  birthday: [
    "Who plans the better birthday surprise for the other?",
    "Who would forget to wish on time at midnight?"
  ],
  wedding: [
    "Who would dance harder at your own wedding?",
    "Who would want the bigger wedding?",
    "Who would cry first during the pheras?"
  ],
  festivals: ["Who goes all out on Valentine's Day?", "Who would buy the matching outfits for Diwali?"],
  movies: ["Who picks the movie on your date nights?", "Who falls asleep first during your movie dates?"],
  bollywood: [
    "Who would recreate a Shah Rukh Khan scene for the other?",
    "Who thinks your love story is a Bollywood film?"
  ],
  food: [
    "Who always steals food from the other's plate?",
    "Who decides where you eat on date night?"
  ],
  cooking: ["Who would cook a romantic dinner for the other?", "Who burns the food when you cook together?"],
  shopping: ["Who carries the bags when you shop together?", "Who spends more when you go shopping together?"],
  dating: [
    "Who made the first move?",
    "Who planned your best date so far?",
    "Who was more nervous on your first date?"
  ],
  family: [
    "Who is more scared of the other's parents?",
    "Who would win over the in-laws faster?"
  ],
  socialmedia: [
    "Who wanted to make your relationship 'Instagram official' first?",
    "Who checks who liked the other's photos?"
  ]
};

export const COUPLE_HINGLISH_GENRE_BANK: Readonly<Record<string, readonly string[]>> = {
  trip: ["Trip pe saath mein kaun zyada saamaan le jaayega?", "Kaun trip pe har jagah couple photo ki zid karega?"],
  trek: ["Trek pe kaun pehle bolega 'baby, ab aur nahi chal sakte'?", "Kaun trek pe dono ke bag uthayega?"],
  party: ["Party mein kaun dusre ko dance floor pe kheench ke le jaata hai?"],
  wedding: ["Apni shaadi mein kaun zyada naachega?", "Pheron mein pehle kaun royega?"],
  festivals: ["Valentine's Day pe kaun zyada filmy ho jaata hai?", "Karva Chauth pe kaun zyada natak karega?"],
  food: ["Kaun hamesha dusre ki plate se khaata hai?", "Date pe khaana kahan khayenge, ye kaun decide karta hai?"],
  dating: ["Pehla move kisne kiya tha?", "Pehli date pe kaun zyada nervous tha?"],
  family: ["Kaun dusre ke mummy-papa se zyada darta hai?", "Kaun sasural mein jaldi favourite ban jaayega?"],
  movies: ["Movie date pe kaun pehle so jaata hai?", "Kaun romantic movie mein dusre ka haath pakad ke rota hai?"],
  shopping: ["Shopping pe saath jaate waqt bags kaun uthata hai?"]
};

export const COUPLE_SAVAGE_BANK: readonly string[] = [
  "Who still checks their ex's profile sometimes?",
  "Who has secretly gone through the other's phone?",
  "Who lies more about where they are?",
  "Who would be the first to give up in a long-distance relationship?",
  "Who flirts more with other people?",
  "Who has a bigger secret they haven't told yet?",
  "Who is more likely to say sorry without meaning it?",
  "Who is the more toxic one in a fight?",
  "Kaun abhi bhi ex ki stories chupke se dekhta hai?",
  "Kaun dusre ka phone chupke se check karta hai?",
  "Kaun 'bas dost hai' bolke sabse zyada jhooth bolta hai?",
  "Kaun ladai mein purani baatein nikaalta hai?",
  "Kaun zyada attention ke liye natak karta hai?",
  "Kiske phone mein zyada secrets hain?"
];

export interface BankOptions {
  genres?: readonly string[];
  tone?: ToneId;
  language?: LanguageId;
  mode?: ModeId;
  random?: () => number;
}

function shuffle<T>(list: T[], random: () => number): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Alternates between lists so both languages (or theme and tone) show up early. */
function interleave(lists: string[][]): string[] {
  const out: string[] = [];
  for (let i = 0; lists.some((l) => i < l.length); i++) {
    for (const l of lists) if (i < l.length) out.push(l[i]);
  }
  return out;
}

/**
 * Picks unplayed questions: the chosen theme first, then (for Savage) the
 * exposing questions, then general ones. Hinglish mixes in English ~1 in 3.
 */
export function pickFromBank(count: number, used: readonly string[], options: BankOptions = {}): string[] {
  const { genres = [], tone = "blunt", language = "en", mode = "friends", random = Math.random } = options;
  const usedSet = new Set(used.map((q) => q.toLowerCase()));
  const fresh = (list: readonly string[]) => shuffle(list.filter((q) => !usedSet.has(q.toLowerCase())), random);
  const hinglish = language === "hinglish";

  // Hinglish: two Hinglish questions, then one English, repeating.
  const mix = (desi: readonly string[], english: readonly string[]): string[] => {
    const en = fresh(english);
    if (!hinglish) return en;
    const hi = fresh(desi);
    const out: string[] = [];
    while (hi.length || en.length) out.push(...hi.splice(0, 2), ...en.splice(0, 1));
    return out;
  };

  const themed = mix(
    genres.flatMap((g) => [...(HINGLISH_GENRE_BANK[g] ?? []), ...(EXTRA_HINGLISH_GENRE_BANK[g] ?? [])]),
    genres.flatMap((g) => [...(GENRE_BANK[g] ?? []), ...(EXTRA_GENRE_BANK[g] ?? [])])
  );

  if (mode === "couple") {
    // Friends' questions ("who in this group…") don't fit two partners: couple banks only.
    const isHinglish = (q: string) => /\b(kaun|kiske|kiska|kiski|kisne)\b/i.test(q);
    const coupleThemed = mix(
      genres.flatMap((g) => COUPLE_HINGLISH_GENRE_BANK[g] ?? []),
      genres.flatMap((g) => COUPLE_GENRE_BANK[g] ?? [])
    );
    const spicy = tone === "savage" ? fresh(COUPLE_SAVAGE_BANK).filter((q) => hinglish || !isHinglish(q)) : [];
    let couple = mix(COUPLE_HINGLISH_BANK, COUPLE_BANK);
    if (new Set([...coupleThemed, ...spicy, ...couple]).size < count) {
      couple = shuffle([...(hinglish ? COUPLE_HINGLISH_BANK : []), ...COUPLE_BANK], random);
    }
    const lead = interleave([coupleThemed, spicy.length ? spicy : couple]);
    return [...new Set([...lead, ...couple, ...coupleThemed])].slice(0, count);
  }

  if (genres.length) {
    // A theme was picked: every question stays on it. Handwritten theme questions
    // alternate with scenario ones ("If the movie flopped, who would…?").
    const scenarios = genres
      .flatMap((g) => sceneQuestions(g, tone, language, random))
      .filter((q) => !usedSet.has(q.toLowerCase()));
    // Savage rounds lead with the scenarios (spicier); Blunt rounds with handwritten ones.
    const lead = tone === "savage" ? interleave([scenarios, themed]) : interleave([themed, scenarios]);
    // Return only on-theme questions, even if fewer than asked for: the caller
    // asks for spares. Only a theme with no material left falls through.
    if (lead.length) return [...new Set(lead)].slice(0, count);
  }

  const savage = tone === "savage" ? mix(SAVAGE_HINGLISH_BANK, SAVAGE_BANK) : [];
  let general = mix(HINGLISH_BANK, QUESTION_BANK);
  // Everything has been played in this room; start the cycle again.
  if (new Set([...themed, ...savage, ...general]).size < count) {
    general = shuffle([...(hinglish ? HINGLISH_BANK : []), ...QUESTION_BANK], random);
  }

  const lead = savage.length ? interleave([themed, savage]) : themed;
  return [...new Set([...lead, ...themed, ...general])].slice(0, count);
}
