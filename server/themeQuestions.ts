// Backup questions for every theme, so a chosen theme shows up even without AI.
// Crisp, and about half are conditional ("If… / Agar…") scenarios.

export const EXTRA_GENRE_BANK: Readonly<Record<string, readonly string[]>> = {
  roadtrip: [
    "If the car broke down on a highway, who would panic first?",
    "Who hogs the aux cable on every road trip?",
    "Who falls asleep two minutes after the road trip starts?"
  ],
  beach: [
    "If a wave took everyone's phones, who would cry first?",
    "Who spends the whole beach trip taking photos and never swims?",
    "Who would get sunburnt on day one and blame the sun?"
  ],
  camping: [
    "If the tent collapsed at 3am, who would sleep through it?",
    "Who would refuse to use the camping washroom?",
    "Who brings snacks for themselves only on a camping trip?"
  ],
  nightout: [
    "If the club had a dress code, who'd get turned away at the door?",
    "Who says 'one last place' at 3am every night out?",
    "Who disappears mid-night-out and texts 'reached home' later?"
  ],
  birthday: [
    "If nobody wished them at midnight, who'd sulk all day?",
    "Who would forget a best friend's birthday and blame the time zone?",
    "Who plans their own birthday and acts surprised?"
  ],
  bachelor: [
    "If the bachelor trip got cancelled, who would still go alone?",
    "Who would spill every bachelor trip secret at the wedding?",
    "Who would be the first to say 'what happens here stays here'?"
  ],
  newyear: [
    "Who makes the same New Year resolution every year?",
    "If the countdown was at midnight, who'd still be getting ready?",
    "Who sends 'Happy New Year' messages to their ex?"
  ],
  festivals: [
    "If the Diwali sweets went missing, who ate them?",
    "Who plays Holi in white and then complains?",
    "Who shows up to every festival only for the food?"
  ],
  wfh: [
    "If the camera turned on by mistake, who'd be caught in pyjamas?",
    "Who says 'my internet is down' to skip meetings?",
    "Who works from bed and calls it a home office?"
  ],
  teamouting: [
    "If the team outing had karaoke, who would refuse the mic, then never leave it?",
    "Who skips every team outing with the same excuse?",
    "Who turns the team outing into a networking event?"
  ],
  startup: [
    "If the startup failed, who'd post a 'lessons learned' thread?",
    "Who calls every idea 'disruptive'?",
    "Who would pitch a startup at a wedding?"
  ],
  school: [
    "If the teacher left the class, who'd start the chaos?",
    "Who copied homework every single day?",
    "Who was the teacher's spy in class?"
  ],
  exams: [
    "If the exam was cancelled, who'd be secretly upset?",
    "Who says 'I didn't study at all' and then tops?",
    "Who starts studying the night before, every time?"
  ],
  ott: [
    "If one show had to be banned, whose comfort show would it be?",
    "Who binges a whole season and then spoils it?",
    "Who uses someone else's Netflix password and never pays?"
  ],
  music: [
    "If the group had a band, who'd be the dramatic lead singer?",
    "Who has the most embarrassing song on repeat?",
    "Who sings every song with the wrong lyrics, confidently?"
  ],
  dance: [
    "If there was a dance-off, who'd fake an injury to skip it?",
    "Who has exactly one dance move for every song?",
    "Who dances best after midnight only?"
  ],
  cricket: [
    "If the match was in the last over, who'd stop watching from tension?",
    "Who blames the pitch every time they get out?"
  ],
  football: [
    "If the group played a match, who'd fake a foul the most?",
    "Who supports a club and can't name three players?",
    "Who stays up till 3am for a match and sleeps in office?"
  ],
  gym: [
    "If the gym banned mirrors, who'd quit immediately?",
    "Who posts more gym selfies than workouts?",
    "Who has paid for a gym for a year and gone twice?"
  ],
  gaming: [
    "If the Wi-Fi died mid-match, who'd rage the hardest?",
    "Who blames lag for every loss?",
    "Who would choose a game over a date?"
  ],
  food: [
    "If the last slice of pizza was left, who'd take it without asking?",
    "Who orders the same dish at every restaurant?",
    "Who says 'I'm not hungry' and eats from everyone's plate?"
  ],
  cooking: [
    "If the group cooked together, who'd burn the kitchen down?",
    "Who calls Maggi 'cooking'?",
    "Who watches recipe videos and never cooks?"
  ],
  relationships: [
    "If their partner checked their phone, who'd be in trouble?",
    "Who says 'I'm fine' after every fight?",
    "Who falls in love every three months?"
  ],
  friendship: [
    "If two friends fought, who'd secretly take both sides?",
    "Who vanishes when you need them, but calls when they need you?",
    "Who would remember every friend's darkest secret?"
  ],
  cousins: [
    "If the cousins planned a trip, who'd cancel last minute?",
    "Who was the cousin our parents compared us with?",
    "Who leaks cousin secrets to the elders?"
  ],
  childhood: [
    "If we met as kids, who'd steal everyone's tiffin?",
    "Who cried the most on the first day of school?",
    "Who still keeps their childhood toys?"
  ],
  socialmedia: [
    "If Instagram shut down tomorrow, who'd have an identity crisis?",
    "Who posts a story and checks who viewed it every five minutes?",
    "Who has a secret second account?"
  ],
  tech: [
    "If the phone died at 1%, who'd have a breakdown?",
    "Who fixes every gadget by turning it off and on?",
    "Who buys every new phone the day it launches?"
  ],
  shopping: [
    "If there was a 90% sale, who'd empty their bank account?",
    "Who returns half of what they order online?",
    "Who says 'just looking' and buys everything?"
  ],
  fashion: [
    "If we did a fashion show, who'd take it too seriously?",
    "Who repeats outfits and hopes nobody notices?",
    "Who needs three outfit changes for a casual dinner?"
  ],
  pets: [
    "If a stray followed us home, who'd adopt it on the spot?",
    "Who talks to animals more than people?",
    "Who would let a pet sleep on their face?"
  ],
  driving: [
    "If we were lost, who'd refuse to use Google Maps?",
    "Who honks the most for no reason?",
    "Who would fail the driving test twice?"
  ],
  monsoon: [
    "If it flooded outside, who'd still go out for pakoras?",
    "Who forgets their umbrella every single monsoon?",
    "Who romanticises the rain and then complains about the mud?"
  ],
  survival: [
    "If zombies attacked, who'd be eaten first?",
    "Who would sell out the group to survive?",
    "Who would secretly hoard all the food in a crisis?"
  ],
  fantasy: [
    "If we all got superpowers, who'd misuse theirs first?",
    "Who would be the villain in a movie about this group?",
    "If someone could read minds, who'd be most in danger?"
  ],
  future: [
    "If we met in 10 years, who'd have changed the most?",
    "Who will be the first to get married?",
    "Who will become famous for the wrong reasons?"
  ],
  habits: [
    "If bad habits were a sport, who'd win gold?",
    "Who leaves every message on 'seen'?",
    "Who says 'last episode' and watches five more?"
  ],
  secrets: [
    "If everyone's secrets came out, who'd leave the country?",
    "Who has a secret nobody in this room knows?",
    "Who would crack first under questioning?"
  ],
  sports: [
    "If we played any sport, who'd argue with the referee first?"
  ],
  college: [
    "If attendance was cancelled, who would never show up again?",
    "Who has a proxy arrangement for every lecture?",
    "Who peaked in the college fest and never recovered?"
  ],
  hostel: [
    "If the hostel mess shut down, who'd survive on Maggi alone?",
    "Who borrows everything and returns nothing in the hostel?",
    "Who sneaks in after curfew and never gets caught?"
  ],
  bollywood: [
    "If our life was a Bollywood film, who'd be the overacting hero?",
    "Who answers in movie dialogues during serious talks?",
    "Who cries at every Karan Johar climax?"
  ],
  family: [
    "If relatives asked about marriage, who would hide in the kitchen?",
    "Who becomes a different person in front of family?",
    "Who is the family's favourite and knows it?"
  ]
};

export const EXTRA_HINGLISH_GENRE_BANK: Readonly<Record<string, readonly string[]>> = {
  roadtrip: ["Road trip pe gaane kaun control karta hai?", "Agar gaadi highway pe ruk jaaye, kaun sabse pehle ghabrayega?"],
  beach: ["Beach pe kaun sirf photo khinchwata hai, paani mein nahi jaata?", "Agar lehar phone le jaaye, kaun sabse pehle royega?"],
  camping: ["Agar raat ko tent gir jaaye, kaun phir bhi soya rahega?", "Camping pe kaun apne snacks chhupa ke rakhega?"],
  nightout: ["Kaun raat 3 baje bhi 'bas ek aur jagah' bolta hai?", "Agar club mein dress code ho, kaun bahar reh jaayega?"],
  birthday: ["Agar raat 12 baje wish na aaye, kaun din bhar muh phula ke rahega?", "Kaun apni birthday khud plan karke surprised hone ka natak karta hai?"],
  bachelor: ["Bachelor trip ke saare raaz shaadi mein kaun khol dega?", "Agar bachelor trip cancel ho jaaye, kaun akela chala jaayega?"],
  newyear: ["Kaun har saal same New Year resolution leta hai?", "Kaun 'Happy New Year' ex ko bhejta hai?"],
  festivals: ["Agar Diwali ki mithai gaayab ho jaaye, kisne khaayi hogi?", "Kaun Holi pe safed kapde pehen ke phir rota hai?", "Kaun har tyohaar pe sirf khaane ke liye aata hai?"],
  wfh: ["Agar galti se camera on ho jaaye, kaun pyjama mein pakda jaayega?", "Kaun meeting se bachne ke liye 'net nahi chal raha' bolta hai?"],
  teamouting: ["Team outing pe kaun har baar same bahana banata hai?", "Agar outing pe karaoke ho, kaun mic nahi chhodega?"],
  startup: ["Kaun shaadi mein bhi startup pitch kar dega?", "Agar startup band ho jaaye, kaun LinkedIn pe lamba post likhega?"],
  school: ["Agar teacher class se bahar jaaye, kaun hungama shuru karega?", "Kaun roz homework copy karta tha?"],
  exams: ["Kaun 'maine kuch nahi padha' bolke top karta hai?", "Agar exam cancel ho jaaye, kaun andar se udaas hoga?"],
  movies: ["Kaun movie ka climax sabse pehle bata deta hai?", "Agar movie boring ho, kaun popcorn khatam karke so jaayega?"],
  ott: ["Kaun doosre ka Netflix password chalata hai aur kabhi paise nahi deta?", "Kaun poora season ek raat mein khatam karke spoil karta hai?"],
  music: ["Kaun galat lyrics poore confidence se gaata hai?", "Agar group ka band ho, kaun drama wala lead singer banega?"],
  dance: ["Kaun har gaane pe ek hi step karta hai?", "Agar dance-off ho, kaun chot ka bahana banayega?"],
  sports: ["Kaun haarne pe referee se ladne lagta hai?", "Agar match haar jaayein, kaun sabse pehle doosron ko blame karega?"],
  football: ["Kaun club support karta hai par teen players ke naam nahi jaanta?", "Agar match ho, kaun sabse zyada foul ka natak karega?"],
  gym: ["Kaun gym mein workout se zyada selfie leta hai?", "Kaun saal bhar ki fees bharke do baar gaya hai?"],
  gaming: ["Kaun har haar ka blame lag pe daalta hai?", "Agar match ke beech Wi-Fi chala jaaye, kaun sabse zyada bhadkega?"],
  food: ["Agar pizza ka last slice bacha ho, kaun bina pooche utha lega?", "Kaun 'mujhe bhook nahi hai' bolke sabki plate se khaata hai?"],
  cooking: ["Kaun Maggi banane ko cooking kehta hai?", "Agar sab milke khaana banayein, kaun kitchen jala dega?"],
  relationships: ["Kaun har ladai ke baad 'main theek hoon' bolta hai?", "Agar partner phone check kare, kaun phas jaayega?"],
  friendship: ["Kaun mushkil mein gaayab, aur kaam padne pe haazir hota hai?", "Agar do dost lad padein, kaun chupke se dono ki side lega?"],
  cousins: ["Kaun cousins ke raaz bado ko bata deta hai?", "Kaun woh cousin hai jisse humesha compare kiya jaata tha?"],
  childhood: ["Bachpan mein sabka tiffin kaun churata?", "Kaun aaj bhi bachpan ke khilone sambhal ke rakhta hai?"],
  socialmedia: ["Kaun story daalke har 5 minute views check karta hai?", "Agar Instagram band ho jaaye, kiski pehchaan chali jaayegi?", "Kiska secret second account hai?"],
  tech: ["Agar phone 1% pe ho, kaun panic attack mein chala jaayega?", "Kaun naya phone launch ke din hi khareedta hai?"],
  shopping: ["Agar 90% sale lage, kaun poora account khaali kar dega?", "Kaun 'bas dekh rahe hain' bolke sab khareed leta hai?"],
  fashion: ["Kaun same kapde repeat karke sochta hai kisi ko pata nahi chalega?", "Kaun simple dinner ke liye teen baar kapde badalta hai?"],
  pets: ["Agar gali ka kutta peeche aa jaaye, kaun turant ghar le jaayega?", "Kaun insaano se zyada janwaron se baat karta hai?"],
  driving: ["Kaun bina wajah sabse zyada horn bajata hai?", "Agar raasta bhatak jaayein, kaun Google Maps use karne se mana karega?"],
  monsoon: ["Agar bahar paani bhara ho, kaun phir bhi pakode khane jaayega?", "Kaun har monsoon chhata bhool jaata hai?"],
  survival: ["Agar zombies aa jaayein, sabse pehle kaun pakda jaayega?", "Kaun bachne ke liye poore group ko bech dega?"],
  fantasy: ["Agar sabko superpower mile, kaun sabse pehle galat use karega?", "Agar koi mann padh sake, sabse zyada khatra kisko hoga?"],
  future: ["Agar 10 saal baad milein, kaun sabse zyada badal chuka hoga?", "Sabse pehle shaadi kaun karega?"],
  habits: ["Kaun 'bas last episode' bolke paanch aur dekh leta hai?", "Kaun har message seen pe chhod deta hai?"],
  secrets: ["Agar sabke raaz khul jaayein, kaun desh chhod dega?", "Kaun poochh-taachh mein sabse pehle sab ugal dega?"]
};
