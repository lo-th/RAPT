(function(w){
    var perfNow;
    var perfNowNames = ['now', 'webkitNow', 'msNow', 'mozNow'];
    if(!!w['performance']) for(var i = 0; i < perfNowNames.length; ++i){
        var n = perfNowNames[i];
        if(!!w['performance'][n]){
            perfNow = function(){return w['performance'][n]()};
            break;
        }
    }
    if(!perfNow) perfNow = Date.now;
    w.perfNow = perfNow;
})(window);

if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}


var RAPT = RAPT || {};

RAPT.MESSAGE = null;

RAPT.LEVELS = [
"Intro 1","Intro 2","Intro 3","Intro 4","It's Okay, You Can Press Escape","Doomed","Mr. Four-Arms","Chain","Traps","Walk Through Walls",
"My Head 'Asplode","No Cover","Hunter Food","Run!","Shocker","Laserland","Up and Down","Leap Of Faith","Sandwiched", "Clock Tower","Stick Together",
"Foursquare","Going Down Faster","Bomberland","Coordinated Panic","Going Down","Look But Don't Touch","Triple Threat",
"Better Keep Moving","Tour","Cube"
];


RAPT.gameScale = 60;

// text constants
var GAME_WIN_TEXT = "You won!  Hit SPACE to play the next level or ESC for the level selection menu.";
var GOLDEN_COG_TEXT = "You earned a golden cog!";
var SILVER_COG_TEXT = "You earned a silver cog!";
var GAME_LOSS_TEXT = "You lost.  Hit SPACE to restart, or ESC to select a new level.";
var TEXT_BOX_X_MARGIN = 6;
var TEXT_BOX_Y_MARGIN = 6;
var SECONDS_BETWEEN_TICKS = 1 / 60;
var useFixedPhysicsTick = true;


RAPT.gameState = null;
RAPT.game = null;

//_____________________________GAME

RAPT.Game = function(w, h, message) {

	RAPT.MESSAGE = message;

    this.w = w;
    this.h = h;
    //this.width2 = w / RAPT.gameScale;
	//this.height2 = h / RAPT.gameScale;

	this.json = null;
	//this.camera = new RAPT.Camera();
	this.fps = 0;
	this.fixedPhysicsTick = 0;

	this.isDone = false;
	this.onWin = null;
	//this.w3d = w3d;

	this.timeNow = 0;
    this.delta = 0;
    this.then = 0;

    this.timerStep = 1000/60;
    this.lastTime = 0;
	
	// whether this game is the last level in the menu, this will be updated by main.js when the menu loads
	//this.lastLevel = false;

	RAPT.gameState = new RAPT.GameState();

}

RAPT.Game.prototype = {
	constructor: RAPT.Game,
	resize : function(w, h) {
		this.w = w;
		this.h = h;
		//this.width2 = w / RAPT.gameScale;
		//this.height2 = h / RAPT.gameScale;
	},
	/*upGameScale:function(){
		this.width2 = this.width / RAPT.gameScale;
		this.height2 = this.height / RAPT.gameScale;
	},*/
	update:function(){


        //this.timeNow = this.now();//
        this.timeNow = window.perfNow();
        this.delta = this.timeNow - this.then;
        //this.skip ++;

        if (this.delta > this.timerStep) {
            //console.time("start update loop")

            //this.then = this.timeNow - (this.delta % this.timerStep);

            //if(this.inPlay) this.frame ++;

            //var neo = this.neo;
            //var name = this.neoname;
            //var data = this.data;
            //var i = this.neo.length;
            //while(i--) this.data[this.neo[i].name] = this.neo[i].update(this.frame);
            //while(i--) { k = neo[i]; data[k.name] = k.update(this.frame); }

            //while(i--) this.data[this.neoname[i]] = this.neo[i].update(this.frame);

            //this.updateTime();
            //this.autoScroll();
            var sec = this.delta/1000;

            RAPT.gameState.tick(sec);
			RAPT.Particle.tick(sec);
			RAPT.game.draw3d();

            this.then = this.timeNow - (this.delta % this.timerStep);

            /*if(this.frame >= this.nframe){ 
                if(this.isLoop) this.moveTo(0);
                else this.stop();
            }*/

           // console.timeEnd("start update loop")
        }
    },
	tick : function() {
		var currentTime = window.perfNow();//Date.now();//new Date();
        var seconds = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

		// when the screen isn't split, standing at the original spawn point:
		// * Triple Threat
		//	 - variable physics tick: 30 FPS
		//	 - fixed physics tick: 25 FPS
		// * Cube
		//	 - variable physics tick: 35 FPS
		//	 - fixed physics tick: 30 FPS
		// * Coordinated Panic
		//	 - variable physics tick: 55 FPS
		//	 - fixed physics tick: 50 FPS
		// overall, a fixed physics tick provides about 5 FPS drop but fixes a lot of
		// gameplay issues (measurements above approximate but within about +/-1) 

		if (useFixedPhysicsTick) {
			// fixed physics tick
			var count = 0;
			this.fixedPhysicsTick += seconds;
			while (++count <= 3 && this.fixedPhysicsTick >= 0) {
				this.fixedPhysicsTick -= SECONDS_BETWEEN_TICKS;
				RAPT.gameState.tick(SECONDS_BETWEEN_TICKS);
				RAPT.Particle.tick(SECONDS_BETWEEN_TICKS);
				this.draw3d();
			}
		} else {
			// variable physics tick
			RAPT.gameState.tick(seconds);
			RAPT.Particle.tick(seconds);
			this.draw3d();
		}


		// smooth the fps a bit
		this.fps = RAPT.lerp(this.fps, 1 / seconds, 0.05);
		
		// handle winning the game
		if (!this.isDone && RAPT.gameState.gameStatus != RAPT.GAME_IN_PLAY) {
			this.isDone = true;
			if (RAPT.gameState.gameStatus == RAPT.GAME_WON && this.onWin) {
				this.onWin();
			}
		}
	},
	message : function(s){
		RAPT.MESSAGE.innerHTML = s;
	},

	draw3d : function(){
		var mid = this.width2*0.25;
		var positionA = RAPT.gameState.playerA.getCenter();
		var positionB = RAPT.gameState.playerB.getCenter();

        var w = this.w / RAPT.gameScale;
        var h = this.h / RAPT.gameScale;

		var center = positionA.add(positionB).div(2);
		// maximum distance between a player and the center is the distance to the box that is half the size of the screen
		var temp = positionB.sub(positionA).unit();
		temp = new RAPT.Vector(w / Math.abs(temp.x), h / Math.abs(temp.y));
		var maxLength = Math.min(temp.x, temp.y) * 0.25;

		var isSplit = (positionB.sub(positionA).lengthSquared() > 4*maxLength*maxLength);

		//this.w3d.setSplit(isSplit);
		RAPT.W3D.setSplit(isSplit);

		if(!isSplit) {
			//this.w3d.upCamera(center.x, center.y, 0);
			RAPT.W3D.upCamera(center.x, center.y, 0);
		}else{
			var AtoB = positionB.sub(positionA).unit().mul(99);
			var split = AtoB.flip();

			// make sure a's center isn't more than maxLength from positionA
			var centerA = center.sub(positionA);
			if(centerA.lengthSquared() > maxLength*maxLength)  centerA = centerA.unit().mul(maxLength);
			centerA = centerA.add(positionA);

			// make sure b's center isn't more than maxLength from positionB
			var centerB = center.sub(positionB);
			if(centerB.lengthSquared() > maxLength*maxLength) centerB = centerB.unit().mul(maxLength);
			centerB = centerB.add(positionB);

			//if(centerA.y<=centerB.y){
				//this.w3d.upCamera(centerB.x, centerB.y, 2);
				//this.w3d.upCamera(centerA.x, centerA.y, 1);
				RAPT.W3D.upCamera(center.x, center.y, 0);
				RAPT.W3D.upCamera(centerA.x, centerA.y, 1);
				RAPT.W3D.upCamera(centerB.x, centerB.y, 2);
			//} else {
			//	this.w3d.upCamera(centerB.x, centerB.y, 1);
			//	this.w3d.upCadzmera(centerA.x, centerA.y, 2);
			//}

			var splitSize = Math.min(0.1, (positionB.sub(positionA).length() - 1.9 * maxLength) * 0.01);
			//var angle = Math.atan( (split.y + split.y) / (split.x + split.x ) ) - (Math.PI*0.5)
			var angle = Math.atan2( (split.y + split.y) , (split.x + split.x ) ) - (Math.PI*0.5)
			//this.w3d.effect.setAngle(-angle);
			//this.w3d.effect.setFuzzy(splitSize);

			RAPT.W3D.effect.setAngle(-angle);
			RAPT.W3D.effect.setFuzzy(splitSize);
		}
		//RAPT.W3D.tell(this.fps.toFixed(0));


		if (RAPT.gameState.gameStatus === RAPT.GAME_WON) {
			var gameWinText = (this.lastLevel ? "Congratulations, you beat the last level in this set!	Press SPACE or ESC to return to the level selection menu." : GAME_WIN_TEXT);
			var cogsCollectedText = "<br>Cogs Collected: " + RAPT.gameState.stats[RAPT.STAT_COGS_COLLECTED] + "/" + RAPT.gameState.stats[RAPT.STAT_NUM_COGS];
			this.message(gameWinText+cogsCollectedText)
		}else if (RAPT.gameState.gameStatus === RAPT.GAME_LOST) {
			this.message(GAME_LOSS_TEXT);
		}

	},

	load : function (levelname) {
        var xhr = new XMLHttpRequest();
        var _this = this;
        xhr.onreadystatechange =  function() {
            if (xhr.readyState == 4){
            	_this.json = JSON.parse(this.responseText);
            	_this.restart();
            }
        };
        xhr.open("get", 'level/'+levelname+'.json', true);
        xhr.send();
    },
    restart : function() {
        RAPT.Particle.reset();
        RAPT.gameState.loadLevelFromJSON(this.json);
    },
	keyDown : function(e) {
		var keyCode = e.which;
		var action = RAPT.Keys.fromKeyCode(keyCode);
		if (action != null) {
			if (action.indexOf('a-') == 0) RAPT.gameState.playerA[action.substr(2)] = true;
			else if (action.indexOf('b-') == 0) RAPT.gameState.playerB[action.substr(2)] = true;
			else RAPT.gameState[action] = true;
			e.preventDefault();
			e.stopPropagation();
		}
		if (keyCode === 32) {// space
            if (RAPT.gameState.gameStatus === RAPT.GAME_WON) playNext();
            else this.restart();
        }
	},
	keyUp : function(e) {
		var keyCode = e.which;
		var action = RAPT.Keys.fromKeyCode(keyCode);
		if (action != null) {
			if (action.indexOf('a-') == 0) RAPT.gameState.playerA[action.substr(2)] = false;
			else if (action.indexOf('b-') == 0) RAPT.gameState.playerB[action.substr(2)] = false;
			else RAPT.gameState[action] = false;
			e.preventDefault();
			e.stopPropagation();
		}
	}
}


RAPT.Keys = {
	keyMap: {
		'killKey': 75,     // k key

		// player a
		'a-jumpKey': 38,   // up arrow key
		'a-crouchKey': 40, // down arrow key
		'a-leftKey': 37,   // left arrow key
		'a-rightKey': 39,  // right arrow key

		// player b
		'b-jumpKey': 87,   // w key
		'b-jumpKey2': 90,   // z key
		'b-crouchKey': 83, // s key
		'b-leftKey': 65,   // a key
		'b-leftKey2': 81,   // q key
		'b-rightKey': 68   // d key
	},

	fromKeyCode: function(keyCode) {
		for (var name in this.keyMap) {
			if (keyCode == this.keyMap[name]) {
				if(name=='b-jumpKey2')name = 'b-jumpKey';
				if(name=='b-leftKey2')name = 'b-leftKey';
				return name;
			}
		}
		return null;
	},
};

