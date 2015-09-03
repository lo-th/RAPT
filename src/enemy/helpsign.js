RAPT.HELP_SIGN_TEXT_WIDTH = 1.5;
RAPT.HELP_SIGN_WIDTH = 0.76;
RAPT.HELP_SIGN_HEIGHT = 0.76;

// Help signs take in an array of strings, each string in the array is drawn
// on its own line.
RAPT.HelpSign = function (center, text, width) {
	RAPT.Enemy.call(this, RAPT.ENEMY_HELP_SIGN, 0);

	this.sprite =  new RAPT.SpriteGroup({
		name:'helpsign',
		material:RAPT.MAT_ENEMY,
		size:1,
		nuv:16,
		uvs:[[14,0]],
		color:0XFFCC00,
		list:['p1']
	});

	this.sprite.move(center.x, center.y);

	this.hitBox = RAPT.makeAABB(center, RAPT.HELP_SIGN_WIDTH, RAPT.HELP_SIGN_HEIGHT);
	this.textArray = null;
	this.text = text;
	this.drawText = false;
	this.timeSinceStart = 0;
	if (width === undefined) {
		this.textWidth = RAPT.HELP_SIGN_TEXT_WIDTH;
	} else {
		this.textWidth = width;
	}
}

//RAPT.HelpSign.prototype = new RAPT.Enemy;
RAPT.HelpSign.prototype = Object.create( RAPT.Enemy.prototype );

// Private helper
// Splits up a string into an array of phrases based on the width of the sign
RAPT.HelpSign.prototype.splitUpText = function(c, phrase) {
	var words = phrase.split(" ");
	var phraseArray = new Array();
	var lastPhrase = "";
	c.font = "12px sans serif";
	var maxWidth = this.textWidth * RAPT.gameScale;
	var measure = 0;
	for (var i = 0; i < words.length; ++i) {
		var word = words[i];
		measure = c.measureText(lastPhrase + word).width;
		if (measure < maxWidth) {
			lastPhrase += " " + word;
		} else {
			if (lastPhrase.length > 0) phraseArray.push(lastPhrase);
			lastPhrase = word;
		}
		if (i == words.length - 1) {
			phraseArray.push(lastPhrase);
			break;
		}
	}
	return phraseArray;
}

RAPT.HelpSign.prototype.getShape = function() { return this.hitBox; }

RAPT.HelpSign.prototype.canCollide = function() { return false; }

RAPT.HelpSign.prototype.tick = function(seconds) {
	
	var timeFloor = Math.floor(this.timeSinceStart);
	var scaleFactor = this.timeSinceStart - timeFloor;
	scaleFactor = Math.cos(scaleFactor * 2 * Math.PI) / 16 + 1;

	this.sprite.group.scale.x = scaleFactor
	this.sprite.group.scale.y = scaleFactor

	this.timeSinceStart += seconds;

	this.drawText = false;
	RAPT.Enemy.prototype.tick.call(this, seconds);

	if(this.drawText )RAPT.game.message(this.text);
}

RAPT.HelpSign.prototype.reactToPlayer = function(player) {
	this.drawText = true;
	
}
RAPT.HelpSign.prototype.afterTick = function(seconds) {
	//this.sprite.moveto( this.getCenter());
	//if(this.drawText )RAPT.game.message(this.text);
	//else RAPT.game.message('');
	//var position = this.getCenter();
	//this.bodySprite.offsetBeforeRotation = new RAPT.Vector(position.x, position.y);
};
RAPT.HelpSign.prototype.draw = function(c) {
	// split up the text into an array the first call
	/*if (this.textArray === null) {
		this.textArray = this.splitUpText(c, this.text);
	}
	var pos = this.getCenter();

	c.save();
	c.textAlign = "center";
	c.scale(1 / RAPT.gameScale, -1 / RAPT.gameScale);*/
/*
	c.save();
	// Draw the sprite
	c.font = "bold 34px sans-serif";
	c.lineWidth = 1;
	c.fillStyle = "yellow";
	c.strokeStyle = "black";
	c.translate(pos.x * RAPT.gameScale, -pos.y * RAPT.gameScale + 12);
	var timeFloor = Math.floor(this.timeSinceStart);
	var scaleFactor = this.timeSinceStart - timeFloor;
	scaleFactor = Math.cos(scaleFactor * 2 * Math.PI) / 16 + 1;

	// Convert from 0-2 to 1 - 1/16 to 1 + 1/16
	c.scale(scaleFactor, scaleFactor);
	c.fillText("?", 0, 0);
	c.strokeText("?", 0, 0);
	c.restore();
*/
	// Draw the text in a text box
	/*if (this.drawText) {
		var fontSize = 13;
		var xCenter = pos.x * RAPT.gameScale;
		var yCenter = -(pos.y + 0.5) * RAPT.gameScale - (fontSize + 2) * this.textArray.length / 2;
		//level.game.drawTextBox(c, this.textArray, xCenter, yCenter, fontSize);
		RAPT.game.drawTextBox(c, this.textArray, xCenter, yCenter, fontSize);
	}

	c.restore();*/
}