RAPT.BOUNCY_ROCKET_SPEED = 4;
RAPT.BOUNCY_ROCKET_MAX_ROTATION = 3;
RAPT.BOUNCY_ROCKET_HEALTH = 2;

RAPT.drawBouncyRocket = function (c, isBlue) {
	var size = 0.1;
	c.strokeStyle = 'black';

	c.fillStyle = isBlue ? 'blue' : 'red';
	c.beginPath();
	c.moveTo(-RAPT.ROCKET_RADIUS, size);
	c.arc(RAPT.ROCKET_RADIUS - size, 0, size, Math.PI / 2, -Math.PI / 2, true);
	c.lineTo(-RAPT.ROCKET_RADIUS, -size);
	c.fill();
	c.stroke();

	c.fillStyle = isBlue ? 'red' : 'blue';
	c.beginPath();
	c.arc(-RAPT.ROCKET_RADIUS, 0, size, -Math.PI / 2, Math.PI / 2, false);
	c.closePath();
	c.fill();
	c.stroke();
}

//BouncyRocket.subclasses(Rocket);

RAPT.BouncyRocket = function (center, target, heading, launcher) {
	//Rocket.prototype.constructor.call(this, center, target, heading, BOUNCY_ROCKET_MAX_ROTATION, ENEMY_BOUNCY_ROCKET);
	RAPT.Rocket.call(this, center, target, heading, RAPT.BOUNCY_ROCKET_MAX_ROTATION, RAPT.ENEMY_BOUNCY_ROCKET);
	
	this.velocity = new RAPT.Vector(RAPT.BOUNCY_ROCKET_SPEED * Math.cos(heading), RAPT.BOUNCY_ROCKET_SPEED * Math.sin(heading));
	this.launcher = launcher;
	this.hitsUntilExplodes = RAPT.BOUNCY_ROCKET_HEALTH;

	this.sprites[RAPT.ROCKET_SPRITE_RED].drawGeometry = function(c) {
		RAPT.drawBouncyRocket(c, false);
	};
	this.sprites[RAPT.ROCKET_SPRITE_BLUE].drawGeometry = function(c) {
		RAPT.drawBouncyRocket(c, true);
	};
}

RAPT.BouncyRocket.prototype = Object.create( RAPT.Rocket.prototype );
//RAPT.BouncyRocket.prototype = new RAPT.Rocket;

RAPT.BouncyRocket.prototype.move = function(seconds) {
	this.heading = this.velocity.atan2();
	this.calcHeading(seconds);
	this.velocity = new RAPT.Vector(RAPT.BOUNCY_ROCKET_SPEED * Math.cos(this.heading), RAPT.BOUNCY_ROCKET_SPEED * Math.sin(this.heading));
	return this.velocity.mul(seconds);
}

RAPT.BouncyRocket.prototype.reactToWorld = function(contact) {
	--this.hitsUntilExplodes;

	if (this.hitsUntilExplodes <= 0) {
		this.setDead(true);
	} else {
		this.target = RAPT.gameState.getOtherPlayer(this.target);
	}
}

RAPT.BouncyRocket.prototype.setDead = function(isDead) {
	RAPT.Enemy.prototype.setDead.call(this, isDead);
	if (isDead && this.launcher !== null) {
		this.launcher.rocketDestroyed();
	}
}
