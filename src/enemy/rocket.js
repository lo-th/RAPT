//RAPT.ROCKET_SPRITE_RED = 0;
//RAPT.ROCKET_SPRITE_BLUE = 1;

RAPT.ROCKET_SPEED = 2.5;
// Max rotation in radians / second
RAPT.ROCKET_MAX_ROTATION = 8;
RAPT.ROCKET_RADIUS = .15;
RAPT.ROCKET_ELASTICITY = 1;
// In seconds, the amount of time the Rocket's direction is fixed
RAPT.ROCKET_HEADING_CONSTRAINT_TIME = 0.3;
RAPT.PARTICLE_FREQUENCY = 0.03;

RAPT.drawRocket = function (c) {
	var size = 0.075;
	c.strokeStyle = 'black';
	c.beginPath();
	c.moveTo(-RAPT.ROCKET_RADIUS, size);
	c.lineTo(RAPT.ROCKET_RADIUS - size, size);
	c.lineTo(RAPT.ROCKET_RADIUS, 0);
	c.lineTo(RAPT.ROCKET_RADIUS - size, -size);
	c.lineTo(-RAPT.ROCKET_RADIUS, -size);
	c.closePath();
	c.fill();
	c.stroke();
}

RAPT.Rocket = function (center, target, heading, maxRotation, type) {
	RAPT.RotatingEnemy.call(this, type, center, RAPT.ROCKET_RADIUS, heading, RAPT.ROCKET_ELASTICITY);
	this.target = target;
	this.maxRotation = maxRotation;
	this.timeUntilFree = RAPT.ROCKET_HEADING_CONSTRAINT_TIME;
	this.timeUntilNextParticle = 0;
	this.velocity = new RAPT.Vector(RAPT.ROCKET_SPEED * Math.cos(heading), RAPT.ROCKET_SPEED * Math.sin(heading));

	var cc = this.target.color;

	this.sprite = new RAPT.SpriteGroup({
		name:'roket',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[cc,0]],
		color:0X44CC66,
		list:['p1'],
		sizes: [ [0.7,0.7] ]
	});

	this.sprite.moveto(center);

	/*this.sprites = [new RAPT.Sprite(), new RAPT.Sprite()];
	this.sprites[RAPT.ROCKET_SPRITE_RED].drawGeometry = function(c) {
		c.fillStyle = 'red';
		RAPT.drawRocket(c);
	};
	this.sprites[RAPT.ROCKET_SPRITE_BLUE].drawGeometry = function(c) {
		c.fillStyle = 'blue';
		RAPT.drawRocket(c);
	};*/
}

//RAPT.Rocket.prototype = new RAPT.RotatingEnemy;
RAPT.Rocket.prototype = Object.create( RAPT.RotatingEnemy.prototype );

RAPT.Rocket.prototype.getTarget = function() { return this.target === RAPT.gameState.playerB; }

RAPT.Rocket.prototype.setTarget = function(player) { this.target = player; }

RAPT.Rocket.prototype.calcHeading = function(seconds) {
	if (this.target.isDead()) return;
	var delta = this.target.getCenter().sub(this.getCenter());
	var angle = delta.atan2();
	this.heading = RAPT.adjustAngleToTarget(this.heading, angle, this.maxRotation * seconds);
}

RAPT.Rocket.prototype.move = function(seconds) {
	if (this.timeUntilFree <= 0) {
		this.calcHeading(seconds);
		this.velocity = new RAPT.Vector(RAPT.ROCKET_SPEED * Math.cos(this.heading), RAPT.ROCKET_SPEED * Math.sin(this.heading));
	} else {
		this.timeUntilFree -= seconds;
	}
	return this.velocity.mul(seconds);
}

RAPT.Rocket.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	/*this.sprites[RAPT.ROCKET_SPRITE_RED].offsetBeforeRotation = position;
	this.sprites[RAPT.ROCKET_SPRITE_BLUE].offsetBeforeRotation = position;
	this.sprites[RAPT.ROCKET_SPRITE_RED].angle = this.heading;
	this.sprites[RAPT.ROCKET_SPRITE_BLUE].angle = this.heading;*/

	this.sprite.moveto(position);
	this.sprite.group.rotation.z = this.heading;

	position = position.sub(this.velocity.unit().mul(RAPT.ROCKET_RADIUS));

	this.timeUntilNextParticle -= seconds;
	while (this.timeUntilNextParticle <= 0 && !this.isDead()) { // must test IsDead() otherwise particles go through walls
		// add a flame
		//var direction = RAPT.Vector.fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0, 2)).sub(this.velocity.mul(3));
		RAPT.Particle().position(position).velocity(direction).radius(0.1, 0.15).bounces(1).decay(0.000001, 0.00001).expand(1.0, 1.2).color(1, 0.5, 0, 1).mixColor(1, 1, 0, 1).triangle();

		// add a puff of smoke
		//direction = Vector.fromAngle(randInRange(0, 2 * Math.PI));
		direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0.25, 1)).sub(this.velocity);
		RAPT.Particle().position(position).velocity(direction).radius(0.05, 0.1).bounces(1).elasticity(0.05, 0.9).decay(0.0005, 0.001).expand(1.2, 1.4).color(0, 0, 0, 0.25).mixColor(0.25, 0.25, 0.25, 0.75).circle().gravity(-0.4, 0);

		this.timeUntilNextParticle += RAPT.PARTICLE_FREQUENCY;
	}
}

RAPT.Rocket.prototype.reactToWorld = function(contact) {
	this.setDead(true);
}

RAPT.Rocket.prototype.reactToPlayer = function(player) {
	this.setDead(true);
	player.setDead(true);
}

RAPT.Rocket.prototype.onDeath = function() {
	var position = this.getCenter();
	this.sprite.remove();
	// fire
	for (var i = 0; i < 50; ++i) {
		//var direction = Vector.fromAngle(randInRange(0, 2 * Math.PI));
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0.5, 17));

		RAPT.Particle().position(position).velocity(direction).radius(0.02, 0.15).bounces(0, 4).elasticity(0.05, 0.9).decay(0.00001, 0.0001).expand(1.0, 1.2).color(1, 0.5, 0, 1).mixColor(1, 1, 0, 1).triangle();
	}
}

RAPT.Rocket.prototype.draw = function(c) {
	//this.sprites[this.target == RAPT.gameState.playerA ? RAPT.ROCKET_SPRITE_RED : RAPT.ROCKET_SPRITE_BLUE].draw(c);
}
