var preload = [
  "stand.png", "talk.gif", "happy.gif", "shy.gif", "NeoLogo.png", "helpjpg.png", "helpjpg2.png", "helpjpg3.png", "helpjpg4.png", "helpdeskattractmode.webp"
];
var preloadObj = new Array(preload.length);
for (var i = 0; i < preload.length; i++)
{
    preloadObj[i] = new Image();
    preloadObj[i].src = "Novel/images/" + preload[i];
}


var script;

var mentan;
var penelope;
var photo;
var textBlock;
var leftSide;
var rightSide;
var upperCenter;
var bottomcenter;

function day()
{
    var TendDate = new Date("Feb 25, 2025 11:26:00").getTime();
    var Td = new Date();
    var TlocalTime = Td.getTime();
    var TlocalOffset = Td.getTimezoneOffset() * 60000;
    var Tutc = TlocalTime + TlocalOffset;
    var Tdistance = Tutc - TendDate;
    
    novel.userVar.datee = Math.floor(Tdistance / (1000 * 60 * 60 * 24 ));
}

function prepareNovel()
{
    novel.imagePath = "Novel/images/"; // path to your image directory
    novel.audioPath = "Novel/audio/"; // path to your audio directory
    you = new Character("You", {color: "#000000"});
    mentan = new Character("", {color: "#000000"});
    penelope = new Character("", {color: "#000000"});
    helper = new Character("", {color: "#000000"});
    
    bottomcenter = new Position(200, 98, 0, 0);
    bottomright = new Position(330, 98, 0, 0);
    bottomright2 = new Position(330, 50, 0, 0);
    bottomleft = new Position(60, 35, 0, 0);
    
    photo = new Character("", {position: bottomcenter});
    
    textArea = new TextBlock("myText");
  
script = [
    label, "start",
    scene, "stand.png",
    mentan, {image: "idle.png", position: bottomleft},
    penelope, {image: "helpdeskattractmode.webp", position: bottomright},
    mentan, "<b>Welcome to Twelve Men!</b><br>I'm here to answer any FAQs and for general help",
    hide, penelope,
    mentan, {image: "idle.png"},
    
    label,"menu",
    mentan, {image: "talk.gif"},
    menu, [
        "What do you want help with?",
        "What is this site about?", [jump, "q1"],
        "Can I use stuff found here?", [jump, "q3"],
        "What is 'Neocities'?", [jump, "q4"],
        "Can you teach me how to code?", [jump, "qbabby"],
        "Who are you?", [jump, "qYOU"],
        "I'm good, thanks", [jump, "qEND"],
    ],
    
    label,"menu2pre",
    mentan, {image: "happy.gif", say:"Alright, thanks for chatting!"},
    label,"menu2",
    mentan, {image: "talk.gif"},
    menu, [
        "Is there anything else you want help with?",
        "What is this site about?", [jump, "q1"],
        "Can I use stuff found here?", [jump, "q3"],
        "What is 'Neocities'?", [jump, "q4"],
        "Can you teach me how to code?", [jump, "qbabby"],
        "Who are you?", [jump, "qYOU"],
        "I'm good, thanks", [jump, "qEND"],
    ],
    
    label,"menuflatter",
    mentan, {image: "talk.gif"},
    menu, [
        "Is there anything else you want help with?",
        "What is this site about?", [jump, "q1"],
        "Can I use stuff found here?", [jump, "q3"],
        "What is 'Neocities'?", [jump, "q4"],
        "Can you teach me how to code?", [jump, "qbabby"],
        "✦ Tell me more about you!", [jump, "qYOU2"],
        "I'm good, thanks", [jump, "qEND"],
    ],
    
    
    mentan, "",
    mentan, {image: "talk.gif", say:""},
    
    label,"q1",
    mentan, {image: "talk.gif", say:"Twelve Men isn't all that different from other pages here on neocities."},
    mentan, {image: "talk.gif", say:"There's personal photography, hobbies, interests,"},
    mentan, {image: "talk.gif", say:"a little social media page removed from the 'professional' world"},
    show, helper,
    penelope, {image: "helpjpg.png", position: bottomright2},
    mentan, {image: "talk.gif", say:"To start, main page navigation is done through the tabs at the top,"},
    penelope, {image: "helpjpg2.png", position: bottomright2},
    mentan, {image: "talk.gif", say:"and some pages have subpages that can be navigated through with a sidebar on the left."},
    penelope, {image: "helpjpg3.png", position: bottomright2},
    mentan, {image: "talk.gif", say:"The gallery and stuff pages are the main content here, though,"},
    penelope, {image: "helpjpg4.png", position: bottomright2},
    mentan, {image: "talk.gif", say:"and the extras page has everything that doesn't quite fit anywhere else,"},
    hide, penelope,
    mentan, {image: "happy.gif", say:"In my opinion it's best to just explore!"},
    mentan, {image: "talk.gif", say:"Surf through the pages and maybe you'll find something you like,"},
    mentan, {image: "talk.gif", say:"or something hidden beneath many links."},
    mentan, {image: "happy.gif", say:"Don't forget to sign the guestbook on the extras page on your way out!"},
    jump,"menu2",
    
    label,"q3",
    mentan, {image: "talk.gif", say:"Sure! Twelve Men is and always has been creative commons."},
    mentan, {image: "talk.gif", say:"Though if you do use something, a little credit would be nice."},
    mentan, {image: "talk.gif", say:"And contact the creator! They'd love to hear if something from the site was bringing joy to a wider scale."},
    mentan, {image: "talk.gif", say:"We'd prefer if you don't copy big chunks of code or repost art"},
    mentan, {image: "happy.gif", say:"The last time someone did that resulted in some pretty awkward conversations"},
    mentan, {image: "talk.gif", say:"Though if there's something you want to use for a project or set as a wallpaper,"},
    mentan, {image: "talk.gif", say:"go ahead, I ain't stopping ya."},
    jump,"menu2",
    
    label,"q6",
    mentan, {image: "talk.gif"},
    label,"q61",
    menu, [
        "Which page are you wondering about?",
        "Photography", [jump, "p1"],
        "Videos", [jump, "p2"],
        "Art", [jump, "p3"],
        "Fashion", [jump, "p4"],
        "Cameras", [jump, "p5"],
        "Recommendations", [jump, "p6"],
        "- next page -", [jump, "q62"],
    ],
    
    label,"q62",
    menu, [
        "Which page are you wondering about?",
        "Possessions", [jump, "p7"],
        "Blog", [jump, "p8"],
        "Recipes", [jump, "p9"],
        "Characters", [jump, "p10"],
        "Extras", [jump, "p11"],
        "Life Simulator", [jump, "p12"],
        "- next page -", [jump, "q63"],
        "- previous page -", [jump, "q61"],
    ],
    
    label,"q63",
    menu, [
        "Which page are you wondering about?",
        "Guestbook", [jump, "p14"],
        "The Blue Room", [jump, "p13"],
        "The Gift Shoppe", [jump, "p16"],
        "Build a Men", [jump, "p17"],
        "Deltagold", [jump, "p15"],
        "- previous page -", [jump, "q62"],
        "Never mind", [jump, "menu2"],
    ],
    
    label,"p1",
    mentan, {image: "talk.gif", say:"This page is, well, where all the best photography is posted."},
    mentan, {image: "talk.gif", say:"Because of this, it's not updated often, though there's links to photo folders at the bottom."},
    mentan, {image: "talk.gif", say:"Some of these are excerpts from the blog, and might contain a lot of images (which might take a while to load)"},
    mentan, {image: "talk.gif", say:"None of this is done professionally, and is posted simply as a hobby"},
    jump,"menu2",
    
    label,"p2",
    mentan, {image: "talk.gif", say:"This page consists mainly of school projects,"},
    mentan, {image: "talk.gif", say:"though if there's ever enough production time and reason,"},
    mentan, {image: "talk.gif", say:"there's plans for a decent bit more here,"},
    mentan, {image: "happy.gif", say:"as video making is pretty fun."},
    mentan, {image: "talk.gif", say:"Most of the stuff here is edited with DaVinci, and previous works made with shotcut."},
    jump,"menu2",
    
    label,"p3",
    mentan, {image: "happy.gif", say:"A way you can see into the mind of Twelve Men,"},
    mentan, {image: "talk.gif", say:"a plethora of different type of art is posted here."},
    mentan, {image: "talk.gif", say:"Lots of variation, as the art here isn't created as often as it probably should be."},
    mentan, {image: "talk.gif", say:"Though there's plenty of other ways creative freedom is expressed around here."},
    mentan, {image: "happy.gif", say:"May have to work on a style though if there's ever enough motivation."},
    jump,"menu2",
    
    label,"p4",
    mentan, {image: "talk.gif", say:"While not all of this stuff is often worn out,"},
    mentan, {image: "happy.gif", say:"You could probably agree that it's nice to look cute every once in a while."},
    mentan, {image: "talk.gif", say:"This is just the place that some of this is shared with the world,"},
    mentan, {image: "talk.gif", say:"and to be used as inspiration in case you also have similar tastes in fashion."},
    jump,"menu2",
    
    label,"p5",
    mentan, {image: "talk.gif", say:"Ever wonder how all the photos from the gallery are taken?"},
    mentan, {image: "talk.gif", say:"This page contains all the cameras used for that, a lot of which are out of the ordinary."},
    mentan, {image: "happy.gif", say:"Photography is fun, but finding the different ways different cameras take photos can be interesting all on it's own."},
    jump,"menu2",
    
    label,"p6",
    mentan, {image: "talk.gif", say:"A collection of good pieces of media that you might enjoy,"},
    mentan, {image: "talk.gif", say:"from games, to movies, to sites, to music, and more."},
    mentan, {image: "talk.gif", say:"This is also where the button collection is housed."},
    mentan, {image: "talk.gif", say:"Get in contact if there's anything that you might recommend as well!"},
    jump,"menu2",
    
    label,"p7",
    mentan, {image: "talk.gif", say:"A lot of people own a lot of things,"},
    mentan, {image: "talk.gif", say:"Though here's a few of the more interesting ones owned here."},
    mentan, {image: "talk.gif", say:"Sorted by things such as computers, vehicles, anime, and more."},
    mentan, {image: "talk.gif", say:"Some things you might not even know existed."},
    jump,"menu2",
    
    label,"p8",
    mentan, {image: "happy.gif", say:"Don't even get me started on social media nowadays,"},
    mentan, {image: "talk.gif", say:"feeds curated to keep you glued to stuff you hate."},
    mentan, {image: "talk.gif", say:"Neocities is kind of it's own type of social media,"},
    mentan, {image: "talk.gif", say:"though in my opinion a lot better place to post than anywhere else."},
    mentan, {image: "talk.gif", say:"So this is a good 'ol classic blog, even if it might not be reaching as many people."},
    jump,"menu2",
    
    label,"p9",
    mentan, {image: "talk.gif", say:"The Recipes page houses a few recipes that were though up or modified with the brains right here at Twelve Men."},
    mentan, {image: "talk.gif", say:"Everything here should be legal and healthy to make if you really wanted to follow any directions."},
    mentan, {image: "talk.gif", say:"Sort of some interesting stuff here,"},
    mentan, {image: "happy.gif", say:"though none of it is very notable for it's taste."},
    jump,"menu2",
    
    label,"p10",
    mentan, {image: "happy.gif", say:"It's been a while since this page has been updated. (I nearly forgot about it)"},
    mentan, {image: "talk.gif", say:"That's because there not really a whole lot here of note."},
    mentan, {image: "talk.gif", say:"It's common for neocities sites to have similar pages,"},
    mentan, {image: "talk.gif", say:"so this is just a few characters dubbed interesting here,"},
    mentan, {image: "talk.gif", say:"though on the bottom of the page, there's links to shrines of various semi-interesting things."},
    mentan, {image: "happy.gif", say:"This probably should've went on the extras page, though it's at home next to the characters"},
    jump,"menu2",
    
    label,"p11",
    mentan, {image: "talk.gif", say:"The Extras page is a little hub for all the things that don't really belong anywhere else."},
    mentan, {image: "talk.gif", say:"It houses things such as previous site version backups, a button to link back to Twelve Men, advertisements,"},
    mentan, {image: "talk.gif", say:"a compatability chart, wallpapers, and links to a few more subpages."},
    mentan, {image: "talk.gif", say:"It's not arranged super cleanly, but that's because it's a bit of a hodge podge."},
    jump,"menu2",
    
    label,"p12",
    mentan, {image: "happy.gif", say:"Well isn't this timely!"},
    mentan, {image: "talk.gif", say:"The Twelve Men Life Simulator runs on the same engine that my help desk does."},
    mentan, {image: "talk.gif", say:"It's a bit more of a proper visual novel, though it's not very long at all."},
    mentan, {image: "happy.gif", say:"I think it's kind of funny, though, if you have the time."},
    jump,"menu2",
    
    label,"p13",
    mentan, {image: "talk.gif", say:"The Blue Room was here since the start of Twelve Men."},
    mentan, {image: "happy.gif", say:"It got a revamp a while back, but there's still not a whole lot to do or see there."},
    mentan, {image: "talk.gif", say:"Like a champagne room that we have lying around just because it looks nice."},
    jump,"menu2",
    
    label,"p14",
    mentan, {image: "talk.gif", say:"Similar to public attractions, and other personal sites out there,"},
    mentan, {image: "talk.gif", say:"the guestbook is a way to leave your mark, or any comments you'd like to leave about the site."},
    mentan, {image: "happy.gif", say:"It's not required, but I always enjoy reading them"},
    jump,"menu2",
    
    label,"p15",
    mentan, {image: "talk.gif", say:"The Deltagold page was made to serve as an information center for Deltagold on the internet"},
    mentan, {image: "talk.gif", say:"Mainly because if you google 'DeltaGold' you get airline tickets and jewelry,"},
    mentan, {image: "talk.gif", say:"and if you do find any computer information it's sparce."},
    mentan, {image: "talk.gif", say:"Nowadays, though, the article here on Twelve Men is quite high on search engines when searching for a DeltaGold computer,"},
    mentan, {image: "talk.gif", say:"So hopefully we've made an impact on the slim chance that anyone else out there is researching that old company."},
    jump,"menu2",
    
    label,"p16",
    mentan, {image: "talk.gif", say:"The joke should be obvious once you click around there,"},
    mentan, {image: "happy.gif", say:"but in addition to some code practice, it's kind of funny to think of some outlandish merch for a website."},
    mentan, {image: "talk.gif", say:"Though I do kinda want that puzzle"},
    jump,"menu2",
    
    label,"p17",
    mentan, {image: "talk.gif", say:"This took a lot of research to get the downloader working properly,"},
    mentan, {image: "talk.gif", say:"but here you can dress up your own lil marketable Twelve Men Men logo."},
    mentan, {image: "talk.gif", say:"Afterwards you can download it like a lil printable, and stick it on your site with elmers glue"},
    jump,"menu2",
    
    
    
    label,"q4",
    show, penelope,
    penelope, {image: "NeoLogo.png", position: bottomright},
    mentan, {image: "talk.gif", say:"Neocities is the service that is hosting twelve men."},
    mentan, {image: "happy.gif", say:"If it weren't for them, Twelve Men would probably not be able to afford to stay up."},
    mentan, {image: "talk.gif", say:"If you have any knowledge with html, or really none at all,"},
    mentan, {image: "talk.gif", say:"neocities makes it pretty easy to make a website from the ground up."},
    mentan, {image: "talk.gif", say:"and there's other alternatives too, like <a href=https://nekoweb.org/ target=_blank>nekoweb</a>"},
    mentan, {image: "talk.gif", say:"Twelve Men's neocities page is linked on the extras page, in case you want to check the community out."},
    hide, penelope,
    jump,"menu2",
    
    label,"qYOU",
    mentan, {image: "talk.gif", say:"I'm the secratary at, and embodiment of, Twelve Men."},
    mentan, {image: "talk.gif", say:"You can refer to me as 'Men-tan' or something similar if you'd like,"},
    mentan, {image: "talk.gif", say:"in reference to similar moe anthropomorphs such as win98-tan or sega saturn-tan."},
    jump, "menuflatter",
    
    label,"qYOU2",
    mentan, {image: "happy.gif"},
    menu, [
        "Well what do you want to know?",
        "Do you enjoy your job?", [jump, "fq1"],
        "How old are you?", [jump, "fq2"],
        "How were you created?", [jump, "fq4"],
        "Will I be seeing any more of you?", [jump, "fq3"],
        "That's all!", [jump, "menu2pre"],
    ],
    jump, "menu",
    
    label,"qYOU3",
    mentan, {image: "talk.gif"},
    menu, [
        "What else do you want to know?",
        "Do you enjoy your job?", [jump, "fq1"],
        "How old are you?", [jump, "fq2"],
        "How were you created?", [jump, "fq4"],
        "Will I be seeing any more of you?", [jump, "fq3"],
        "That's all!", [jump, "menu2pre"],
    ],
    jump, "menu",
    
    label,"fq1",
    mentan, {image: "talk.gif", say:"Being it what I was designed for, and created in vision of,"},
    mentan, {image: "happy.gif", say:"I find helping visitors around the site quite fun."},
    mentan, {image: "talk.gif", say:"Though I don't see people all too often,"},
    mentan, {image: "talk.gif", say:"so in my free time I walk around and look at the site's code."},
    mentan, {image: "happy.gif", say:"It's a bit of a mess back there!"},
    jump,"qYOU3",
    
    label,"fq2",
    jsCall,  { fcn: day},
    mentan, {image: "talk.gif", say:"I was last updated February 25th, 2025, Which makes me {{novel.userVar.datee}} days old."},
    jump,"qYOU3",
    
    label,"fq3",
    mentan, {image: "talk.gif", say:"Currently I'm just supposed to stay put at the help desk."},
    mentan, {image: "talk.gif", say:"Though in the future you might be seeing me help around the site,"},
    mentan, {image: "talk.gif", say:"such as helping people out of a 404,"},
    mentan, {image: "talk.gif", say:"or directing construction work on developing pages."},
    mentan, {image: "happy.gif", say:"Until then, you'll just be able to find me here"},
    jump,"qYOU3",
    
    label,"fq4",
    mentan, {image: "talk.gif", say:"I was thought up as a sort of chibi mascot for the site."},
    mentan, {image: "talk.gif", say:"Someone that could show people around and promote new updates."},
    mentan, {image: "talk.gif", say:"After some more brainstorming I was given my job at the help desk (similar to a certains paperclip)"},
    mentan, {image: "talk.gif", say:"Which was created with the <a href=http://langintro.com/js-vine/ target=_blank>javascript virtual novel engine</a>,"},
    mentan, {image: "talk.gif", say:"and my current form was made using paint.net."},
    jump,"qYOU3",
    
    label,"qbabby",
    mentan, {image: "happy.gif", say:"What's a good way to put this..."},
    mentan, {image: "talk.gif", say:"Twelve Men's code is like if you discovered the square peg fit in the triangle hole,"},
    mentan, {image: "happy.gif", say:"and then filled the entire pail up with square pegs maneuvered through the triangle hole"},
    mentan, {image: "talk.gif", say:"It certainly gets the job done, though it's not too many steps up from a page of the 90s"},
    mentan, {image: "talk.gif", say:"You can see how early iterations were built together using html tables as structure,"},
    mentan, {image: "happy.gif", say:"And it still is! They're just invisible now."},
    mentan, {image: "talk.gif", say:"I wouldn't recommend doing this if you want your site to work on mobile even remotely well, especially not with px widths everywhere"},
    mentan, {image: "talk.gif", say:"If you wanna get started, neocities has great basic tutorials <a href=https://neocities.org/tutorials target=_blank>here</a>,"},
    mentan, {image: "talk.gif", say:"and w3schools has great references for html, css, and more. <a href=https://www.w3schools.com/html/ target=_blank>Here's</a> one for html"},
    mentan, {image: "talk.gif", say:"There's also some good resources and tools for web development located on our reccomended page"},
    jump,"menu2",
    
    label,"qEND",
    mentan, {image: "talk.gif", say:"Well thanks for stopping in!"},
    mentan, {image: "happy.gif", say:"Don't hesitate to get in touch in case you have any unanswered questions"},
    show, penelope,
    penelope, {image: "helpdeskattractmode.webp", position: bottomright},
    mentan, {image: "talk.gif", say:"And if there's anything else you need, just click back in my window."},
    hide, penelope,
    jump, "menu",
    
    
    
    
    
    
    
    
];
}



