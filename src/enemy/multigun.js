RAPT.MULTI_GUN_WIDTH = .5;
RAPT.MULTI_GUN_HEIGHT = .5;
RAPT.MULTI_GUN_SHOOT_FREQ = 1.25;
RAPT.MULTI_GUN_RANGE = 8;

RAPT.MultiGun = function (center) {
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_MULTI_GUN, center, RAPT.MULTI_GUN_WIDTH, RAPT.MULTI_GUN_HEIGHT, 0, RAPT.MULTI_GUN_SHOOT_FREQ, 0);


	this.redGun = null;
	this.blueGun = null;
	this.gunFired = new Array(4);
	this.gunPositions = new Array(4);
	
	var pos = this.getCenter();
	this.redGun = new RAPT.Vector(pos.x, pos.y);
	this.blueGun = new RAPT.Vector(pos.x, pos.y);
	this.gunPositions[0] = this.hitBox.lowerLeft;
	this.gunPositions[1] = new RAPT.Vector(this.hitBox.getRight(), this.hitBox.getBottom());
	this.gunPositions[2] = new RAPT.Vector(this.hitBox.getLeft(), this.hitBox.getTop());
	this.gunPositions[3] = this.hitBox.lowerLeft.add(new RAPT.Vector(this.hitBox.getWidth(), this.hitBox.getHeight()));
}

//RAPT.MultiGun.prototype = new RAPT.SpawningEnemy;
RAPT.MultiGun.prototype = Object.create( RAPT.SpawningEnemy.prototype );

RAPT.MultiGun.prototype.canCollide = function() {
	return false;
};

RAPT.MultiGun.prototype.vectorToIndex = function(v) {
	var indexX = (v.x < 0) ? 0 : 1;
	var indexY = (v.y < 0) ? 0 : 2;
	return indexX + indexY;
};

RAPT.MultiGun.prototype.spawn = function() {
	for (var i = 0; i < 4; ++i) {
		this.gunFired[i] = false;
	}

	var fired = false;
	for (var i = 0; i < 2; ++i) {
		var target = RAPT.gameState.getPlayer(i);
		var index = this.vectorToIndex(target.getCenter().sub(this.getCenter()));
		var relPosition = target.getCenter().sub(this.gunPositions[index]);
		// Player must be alive and in range to be shot
		if (!target.isDead() && relPosition.lengthSquared() < (RAPT.MULTI_GUN_RANGE * RAPT.MULTI_GUN_RANGE) &&
			!RAPT.gameState.collider.lineOfSightWorld(this.gunPositions[index], target.getCenter(), RAPT.gameState.world)) {
			if (!this.gunFired[index]) {
				RAPT.gameState.addEnemy(new RAPT.Laser(this.gunPositions[index], relPosition.atan2()), this.gunPositions[index]);
				this.gunFired[index] = true;
				fired = true;
			}
		}
	}
	return fired;
};

RAPT.MultiGun.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	var redGunTarget = this.gunPositions[this.vectorToIndex(RAPT.gameState.playerA.getCenter().sub(position))];
	var blueGunTarget = this.gunPositions[this.vectorToIndex(RAPT.gameState.playerB.getCenter().sub(position))];

	var speed = 4 * seconds;
	this.redGun.adjustTowardsTarget(redGunTarget, speed);
	this.blueGun.adjustTowardsTarget(blueGunTarget, speed);

	//bodySprite.SetOffsetBeforeRotation(position.x, position.y);
};

RAPT.MultiGun.prototype.draw = function(c) {
	// Draw the red and/or blue circles
	if (this.redGun.eq(this.blueGun) && !RAPT.gameState.playerA.isDead() && !RAPT.gameState.playerB.isDead()) {
		var angle = (this.redGun.sub(this.getCenter())).atan2();
		c.fillStyle = "rgb(205, 0, 0)";
		c.beginPath();
		c.arc(this.redGun.x, this.redGun.y, 0.1, angle, angle + Math.PI, false);
		c.fill();
		c.fillStyle = "rgb(0, 0, 255)";
		c.beginPath();
		c.arc(this.blueGun.x, this.blueGun.y, 0.1, angle + Math.PI, angle + 2 * Math.PI, false);
		c.fill();
	} else {
		if (!RAPT.gameState.playerA.isDead()) {
			c.fillStyle = "rgb(205, 0, 0)";
			c.beginPath();
			c.arc(this.redGun.x, this.redGun.y, 0.1, 0, 2 * Math.PI, false);
			c.fill();
		}
		if(!RAPT.gameState.playerB.isDead()) {
			c.fillStyle = "rgb(0, 0, 255)";
			c.beginPath();
			c.arc(this.blueGun.x, this.blueGun.y, 0.1, 0, 2 * Math.PI, false);
			c.fill();
		}
	}

	// Draw the body
	c.strokeStyle = "black";
	c.beginPath();
	// Bottom horizontal
	c.moveTo(this.gunPositions[0].x, this.gunPositions[0].y + 0.1);
	c.lineTo(this.gunPositions[1].x, this.gunPositions[1].y + 0.1);
	c.moveTo(this.gunPositions[0].x, this.gunPositions[0].y - 0.1);
	c.lineTo(this.gunPositions[1].x, this.gunPositions[1].y - 0.1);
	// Top horizontal
	c.moveTo(this.gunPositions[2].x, this.gunPositions[2].y - 0.1);
	c.lineTo(this.gunPositions[3].x, this.gunPositions[3].y - 0.1);
	c.moveTo(this.gunPositions[2].x, this.gunPositions[2].y + 0.1);
	c.lineTo(this.gunPositions[3].x, this.gunPositions[3].y + 0.1);
	// Left vertical
	c.moveTo(this.gunPositions[0].x + 0.1, this.gunPositions[0].y);
	c.lineTo(this.gunPositions[2].x + 0.1, this.gunPositions[2].y);
	c.moveTo(this.gunPositions[0].x - 0.1, this.gunPositions[0].y);
	c.lineTo(this.gunPositions[2].x - 0.1, this.gunPositions[2].y);
	// Right vertical
	c.moveTo(this.gunPositions[1].x - 0.1, this.gunPositions[1].y);
	c.lineTo(this.gunPositions[3].x - 0.1, this.gunPositions[3].y);
	c.moveTo(this.gunPositions[1].x + 0.1, this.gunPositions[1].y);
	c.lineTo(this.gunPositions[3].x + 0.1, this.gunPositions[3].y);
	c.stroke();

	// Draw the gun holders
	c.beginPath();
	c.arc(this.gunPositions[0].x, this.gunPositions[0].y, 0.1, 0, 2 * Math.PI, false);
	c.stroke();
	c.beginPath();
	c.arc(this.gunPositions[1].x, this.gunPositions[1].y, 0.1, 0, 2 * Math.PI, false);
	c.stroke();
	c.beginPath();
	c.arc(this.gunPositions[2].x, this.gunPositions[2].y, 0.1, 0, 2 * Math.PI, false);
	c.stroke();
	c.beginPath();
	c.arc(this.gunPositions[3].x, this.gunPositions[3].y, 0.1, 0, 2 * Math.PI, false);
	c.stroke();

};
