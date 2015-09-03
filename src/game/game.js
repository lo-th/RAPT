var RAPT = RAPT || {};

RAPT.SHAPE_CIRCLE = 0;
RAPT.SHAPE_AABB = 1;
RAPT.SHAPE_POLYGON = 2;

RAPT.useBackgroundCache = true;

RAPT.gameScale = 60;

RAPT.RGB = 1/255;

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

RAPT.Game = function() {
	this.camera = new RAPT.Camera();
	this.fps = 0;
	this.fixedPhysicsTick = 0;

	this.isDone = false;
	this.onWin = null;
	//this.w3d = w3d;
	
	// whether this game is the last level in the menu, this will be updated by main.js when the menu loads
	//this.lastLevel = false;

	RAPT.gameState = new RAPT.GameState();
}

//Game.prototype = Object.create( Screen.prototype );
RAPT.Game.prototype = {
	constructor: RAPT.Game,
	resize : function(w, h) {
		this.width = w;
		this.height = h;

		this.width2 = w / RAPT.gameScale;
		this.height2 = h / RAPT.gameScale;
		this.playerA = RAPT.gameState.playerA;
		this.playerB = RAPT.gameState.playerB;
		this.camera = new RAPT.Camera(RAPT.gameState.playerA, RAPT.gameState.playerB, w / RAPT.gameScale, h / RAPT.gameScale);
	},
	tick : function(seconds) {
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
			}
		} else {
			// variable physics tick
			RAPT.gameState.tick(seconds);
			RAPT.Particle.tick(seconds);
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
	render : function(c, center, width, height, backgroundCache) {
		var halfWidth = width * 0.5;
		var halfHeight = height * 0.5;
		var xmin = center.x - halfWidth;
		var ymin = center.y - halfHeight;
		var xmax = center.x + halfWidth;
		var ymax = center.y + halfHeight;
		c.save();
		c.translate(-center.x, -center.y);
		
		// draw the background, backgroundCache is an optional argument
		if (backgroundCache) {
			backgroundCache.draw(c, xmin, ymin, xmax, ymax);
		} else {
			RAPT.gameState.world.draw(c, xmin, ymin, xmax, ymax);
		}
		
		RAPT.gameState.draw(c, xmin, ymin, xmax, ymax);
		RAPT.Particle.draw(c);
		c.restore();
	},
	message : function(s){
		RAPT.MESSAGE.innerHTML = s;
	},
	drawTextBox : function(c, textArray, xCenter, yCenter, textSize) {
		var numLines = textArray.length;
		if (numLines < 1) return;

		// Calculate the height of all lines and the widest line's width
		c.font = textSize + 'px Arial, sans-serif';
		var lineHeight = textSize + 2;
		var textHeight = lineHeight * numLines;
		var textWidth = -1;
		for (var i = 0; i < numLines; ++i) {
			var currWidth = c.measureText(textArray[i]).width;
			if (textWidth < currWidth) {
				textWidth = currWidth;
			}
		}

		// Draw the box
		c.fillStyle = '#BFBFBF';
		c.strokeStyle = '#7F7F7F';
		c.lineWidth = 1;
		var xLeft = xCenter - textWidth / 2 - TEXT_BOX_X_MARGIN;
		var yBottom = yCenter - textHeight / 2 - TEXT_BOX_Y_MARGIN;
		c.fillRect(xLeft, yBottom, textWidth + TEXT_BOX_X_MARGIN * 2, textHeight + TEXT_BOX_Y_MARGIN * 2);
		c.strokeRect(xLeft, yBottom, textWidth + TEXT_BOX_X_MARGIN * 2, textHeight + TEXT_BOX_Y_MARGIN * 2);

		// Draw the text
		c.fillStyle = 'black';
		c.textAlign = 'center';
		// yCurr starts at the top, so subtract half of height of box
		var yCurr = yCenter + 4 - (numLines - 1) * lineHeight / 2;
		for (var i = 0; i < numLines; ++i) {
			c.fillText(textArray[i], xCenter, yCurr);
			yCurr += lineHeight;
		}
	},

	draw3d : function(){
		var mid = this.width2*0.25;
		var positionA = this.playerA.getCenter();
		var positionB = this.playerB.getCenter();

		//this.w3d.upPlayers(positionA, positionB);
		//RAPT.W3D.upPlayers(positionA, positionB);

		var center = positionA.add(positionB).div(2);
		// maximum distance between a player and the center is the distance to the box that is half the size of the screen
		var temp = positionB.sub(positionA).unit();
		temp = new RAPT.Vector(this.width2 / Math.abs(temp.x), this.height2 / Math.abs(temp.y));
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
		RAPT.W3D.tell(this.fps.toFixed(0));


		if (RAPT.gameState.gameStatus === RAPT.GAME_WON) {
			var gameWinText = (this.lastLevel ? "Congratulations, you beat the last level in this set!	Press SPACE or ESC to return to the level selection menu." : GAME_WIN_TEXT);
			var cogsCollectedText = "<br>Cogs Collected: " + RAPT.gameState.stats[RAPT.STAT_COGS_COLLECTED] + "/" + RAPT.gameState.stats[RAPT.STAT_NUM_COGS];
			this.message(gameWinText+cogsCollectedText)
		}else if (RAPT.gameState.gameStatus === RAPT.GAME_LOST) {
			this.message(GAME_LOSS_TEXT);
		}

	},

	draw : function(c) {
		//return;
		/*if (!RAPT.useBackgroundCache) {
			// clear the background
			c.fillStyle = '#BFBFBF';
			c.fillRect(0, 0, this.width, this.height);
		}
		
		// draw the game
		c.save();
		c.translate(this.width * 0.5, this.height * 0.5);
		c.scale(RAPT.gameScale, -RAPT.gameScale);
		c.lineWidth = 1 / RAPT.gameScale;
		this.camera.draw(c, this);
		c.restore();

		if (RAPT.gameState.gameStatus === RAPT.GAME_WON) {
			// draw winning text
			c.save();
			var gameWinText = (this.lastLevel ? "Congratulations, you beat the last level in this set!	Press SPACE or ESC to return to the level selection menu." : GAME_WIN_TEXT);
			var cogsCollectedText = "Cogs Collected: " + RAPT.gameState.stats[RAPT.STAT_COGS_COLLECTED] + "/" + RAPT.gameState.stats[RAPT.STAT_NUM_COGS];
			this.drawTextBox(c, [gameWinText, "", cogsCollectedText], this.width / 2, this.height / 2, 14);
			c.restore();
		} else if (RAPT.gameState.gameStatus === RAPT.GAME_LOST) {
			// draw losing text
			c.save();
			this.drawTextBox(c, [GAME_LOSS_TEXT], this.width / 2, this.height / 2, 14);
			c.restore();
		}

		// draw the fps counter
		c.font = '10px Arial, sans-serif';
		c.fillStyle = 'black';
		var text = this.fps.toFixed(0) + ' FPS';
		c.fillText(text, this.width - 5 - c.measureText(text).width, this.height - 5);
		*/
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

