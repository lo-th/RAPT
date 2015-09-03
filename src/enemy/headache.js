RAPT.HEADACHE_RADIUS = .15;
RAPT.HEADACHE_ELASTICITY = 0;
RAPT.HEADACHE_SPEED = 3;
RAPT.HEADACHE_RANGE = 6;

RAPT.HEADACHE_CLOUD_RADIUS = RAPT.HEADACHE_RADIUS * 0.5;

RAPT.HeadacheChain = function (center) {
	this.points = [];
	this.point = new RAPT.Vector(center.x * RAPT.gameScale, center.y * RAPT.gameScale);
	this.point.x += (Math.random() - 0.5) * RAPT.HEADACHE_RADIUS;
	this.point.y += (Math.random() - 0.5) * RAPT.HEADACHE_RADIUS;
	this.angle = Math.random() * Math.PI * 2;
}

//HeadacheChain.prototype = Object.create( Enemy.prototype );

RAPT.HeadacheChain.prototype.tick = function(seconds, center) {
	var speed = 600;
	
	var dx = this.point.x - center.x * RAPT.gameScale;
	var dy = this.point.y - center.y * RAPT.gameScale;
	var percentFromCenter = Math.min(1, Math.sqrt(dx*dx + dy*dy) / RAPT.HEADACHE_CLOUD_RADIUS);
	
	var angleFromCenter = Math.atan2(dy, dx) - this.angle;
	while (angleFromCenter < -Math.PI) angleFromCenter += Math.PI * 2;
	while (angleFromCenter > Math.PI) angleFromCenter -= Math.PI * 2;
	var percentHeading = (Math.PI - Math.abs(angleFromCenter)) / Math.PI;
	
	var randomOffset = speed * (Math.random() - 0.5) * seconds;
	this.angle += randomOffset * (1 - percentFromCenter * 0.8) + percentHeading * percentFromCenter * (angleFromCenter > 0 ? -2 : 2);
	this.angle -= Math.floor(this.angle / (Math.PI * 2)) * Math.PI * 2;
	
	this.point.x += speed * Math.cos(this.angle) * seconds;
	this.point.y += speed * Math.sin(this.angle) * seconds;
	this.points.push(new RAPT.Vector(this.point.x, this.point.y));
	if (this.points.length > 15) this.points.shift();
};

RAPT.HeadacheChain.prototype.draw = function(c) {
	for (var i = 1; i < this.points.length; i++) {
		var a = this.points[i - 1];
		var b = this.points[i];
		c.strokeStyle = 'rgba(0, 0, 0, ' + (i / this.points.length).toFixed(3) + ')';
		c.beginPath();
		c.moveTo(a.x / RAPT.gameScale, a.y / RAPT.gameScale);
		c.lineTo(b.x / RAPT.gameScale, b.y / RAPT.gameScale);
		c.stroke();
	}
};


RAPT.Headache = function (center, target) {
	RAPT.HoveringEnemy.call(this, RAPT.ENEMY_HEADACHE, center, RAPT.HEADACHE_RADIUS, RAPT.HEADACHE_ELASTICITY);

	this.target = target;
	this.isAttached = false;
	this.isTracking = false;
	this.restingOffset = new RAPT.Vector(0, -10);

	this.chains = [];
	for (var i = 0; i < 4; i++) {
		this.chains.push(new RAPT.HeadacheChain(center));
	}
}

//RAPT.Headache.prototype = new RAPT.HoveringEnemy;
RAPT.Headache.prototype = Object.create( RAPT.HoveringEnemy.prototype );

RAPT.Headache.prototype.move = function(seconds) {
	this.isTracking = false;

	// If the headache isn't yet attached to a Player
	if (!this.isAttached) {
		if (this.target.isDead()) return new RAPT.Vector(0, 0);
		var delta = this.target.getCenter().sub(this.getCenter());
		if (delta.lengthSquared() < (RAPT.HEADACHE_RANGE * RAPT.HEADACHE_RANGE) && !RAPT.gameState.collider.lineOfSightWorld(this.getCenter(), this.target.getCenter(), RAPT.gameState.world)) {
			// Seeks the top of the Player, not the center
			delta.y += 0.45;
			// Multiply be 3 so it attaches more easily if its close to a player
			if (delta.lengthSquared() > (RAPT.HEADACHE_SPEED * seconds * RAPT.HEADACHE_SPEED * seconds * 3))
			{
				this.isTracking = true;
				delta.normalize();
				delta = delta.mul(RAPT.HEADACHE_SPEED * seconds);
			} else {
				this.isAttached = true;
			}
			return delta;
		}
	} else {
		// If a headache is attached to a dead player, it vanishes
		if (this.target.isDead()) {
			this.setDead(true);
		}
		// Otherwise it moves with the player
		var delta = this.target.getCenter().add(new RAPT.Vector(0, 0.45)).sub(this.getCenter());
		// If player is crouching, adjust position
		if (this.target.getCrouch() && this.target.isOnFloor())
		{
			delta.y -= 0.25;
			if (this.target.facingRight) delta.x += 0.15;
			else delta.x -= 0.15;
		}
		this.hitCircle.moveBy(delta);
	}
	return new RAPT.Vector(0, 0);
};

RAPT.Headache.prototype.reactToWorld = function() {
	// Nothing happens
};

RAPT.Headache.prototype.onDeath = function() {
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);
	
	var position = this.getCenter();

	// body
	var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI)).mul(RAPT.randInRange(0, 0.05));
	var body = RAPT.Particle().position(position).velocity(direction).radius(RAPT.HEADACHE_RADIUS).bounces(3).elasticity(0.5).decay(0.01).circle().gravity(5);
	if (this.target == RAPT.gameState.playerA) {
		body.color(1, 0, 0, 1);
	} else {
		body.color(0, 0, 1, 1);
	}

	// black lines out from body
	for (var i = 0; i < 50; ++i) {
		var rotationAngle = RAPT.randInRange(0, 2 * Math.PI);
		direction = new RAPT.Vector().fromAngle(rotationAngle).mul(RAPT.randInRange(3, 5));
		RAPT.Particle().position(this.getCenter()).velocity(direction).angle(rotationAngle).radius(0.05).bounces(3).elasticity(0.5).decay(0.01).line().color(0, 0, 0, 1);
	}
};

RAPT.Headache.prototype.reactToPlayer = function(player) {
	if (player === this.target) {
		player.disableJump();
	} else if (player.getVelocity().y < 0 && player.getCenter().y > this.getCenter().y) {
		// The other player must jump on the headache from above to kill it
		this.setDead(true);
	}
};

RAPT.Headache.prototype.getTarget = function() {
	return this.target === RAPT.gameState.playerB;
};

RAPT.Headache.prototype.afterTick = function(seconds) {
	var center = this.getCenter();
	for (var i = 0; i < this.chains.length; i++) {
		this.chains[i].tick(seconds, center);
	}
};

RAPT.Headache.prototype.draw = function(c) {
	var center = this.getCenter();
	
	c.strokeStyle = 'black';
	for (var i = 0; i < this.chains.length; i++) {
		this.chains[i].draw(c);
	}
	
	c.fillStyle = (this.target == RAPT.gameState.playerA) ? 'red' : 'blue';
	c.beginPath();
	c.arc(center.x, center.y, RAPT.HEADACHE_RADIUS * 0.75, 0, Math.PI * 2, false);
	c.fill();
	c.stroke();
};