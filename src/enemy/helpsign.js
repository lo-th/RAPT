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

	this.sprite.moveto(center);

	this.hitBox = RAPT.makeAABB(center, RAPT.HELP_SIGN_WIDTH, RAPT.HELP_SIGN_HEIGHT);
	this.text = text;
	this.drawText = false;
	this.timeSinceStart = 0;
	if (width === undefined) {
		this.textWidth = RAPT.HELP_SIGN_TEXT_WIDTH;
	} else {
		this.textWidth = width;
	}

	this.isWasSeen = false;
};

RAPT.HelpSign.prototype = Object.create( RAPT.Enemy.prototype );

RAPT.HelpSign.prototype.getShape = function() { return this.hitBox; };

RAPT.HelpSign.prototype.canCollide = function() { return false; };

RAPT.HelpSign.prototype.tick = function(seconds) {
	
	var timeFloor = Math.floor(this.timeSinceStart);
	var scaleFactor = this.timeSinceStart - timeFloor;
	scaleFactor = Math.cos(scaleFactor * 2 * Math.PI) / 16 + 1;

	this.sprite.group.scale.x = scaleFactor;
	this.sprite.group.scale.y = scaleFactor;

	this.timeSinceStart += seconds;

	this.drawText = false;
	RAPT.Enemy.prototype.tick.call(this, seconds);

	if(this.drawText){
		RAPT.game.message(this.text);
	}
};

RAPT.HelpSign.prototype.reactToPlayer = function(player) {
	this.drawText = true;
};