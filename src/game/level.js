//_____________________________LEVEL

RAPT.MESSAGE = null;
RAPT.LEVELS = [
"Intro 1","Intro 2","Intro 3","Intro 4","It's Okay, You Can Press Escape","Doomed","Mr. Four-Arms","Chain","Traps","Walk Through Walls",
"My Head 'Asplode","No Cover","Hunter Food","Run!","Shocker","Laserland","Up and Down","Leap Of Faith","Sandwiched", "Clock Tower","Stick Together",
"Foursquare","Going Down Faster","Bomberland","Coordinated Panic","Going Down","Look But Don't Touch","Triple Threat",
"Better Keep Moving","Tour","Cube"
];

//RAPT.LEVEL = null;

RAPT.Level = function ( w, h, message) {
    //this.w3d = w3d;

    RAPT.MESSAGE = message;

    this.w = w;
    this.h = h;

    /*this.canvas = canvas; //document.getElementById("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
    this.context = this.canvas.getContext('2d');*/
    this.lastTime = new Date();
    //this.game = null;
    this.json = null;

    //RAPT.LEVEL = this;
}

RAPT.Level.prototype = {
    constructor: RAPT.Level,
    resize: function(w,h){
        this.w = w;
        this.h = h;
        RAPT.game.resize(w,h);
    },
    tick : function() {
        var currentTime = new Date();
        var seconds = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (RAPT.game !== null) {
            // if the computer goes to sleep, act like the game was paused
            if (seconds > 0 && seconds < 1) RAPT.game.tick(seconds); 

            //this.game.lastLevel = menu.isLastLevel(this.username, this.levelname);
            //

            RAPT.game.draw3d();
            //RAPT.game.draw(this.context);
        }
    },
    load : function (levelname) {
        var xhr = new XMLHttpRequest();
        var _this = this;
        xhr.onreadystatechange =  function() {
            if (xhr.readyState == 4) _this.parseLevel(this.responseText);
        };
        xhr.open("get", 'level/'+levelname+'.json', true);
        xhr.send();
    },
    restart : function() {
        RAPT.Particle.reset();
        RAPT.game = new RAPT.Game();
        
        RAPT.game.resize(this.w, this.h);
        RAPT.gameState.loadLevelFromJSON(this.json);
    },
    parseLevel : function(j) {
        this.json = JSON.parse(j);
        this.restart();
    },
    keyDown : function(e) {
        if (RAPT.game != null) {
            RAPT.game.keyDown(e);

            if (e.which === 32) {// space
                if (RAPT.gameState.gameStatus === RAPT.GAME_WON) playNext();
                else this.restart();
            }
        }
    },
    keyUp : function(e) {
        if (RAPT.game != null) {
            RAPT.game.keyUp(e);
        }
    }
}