RAPT.SPIDER_LEGS_RADIUS = .45;
RAPT.SPIDER_LEGS_WEAK_SPOT_RADIUS = .2;
RAPT.SPIDER_LEGS_ELASTICITY = 1.0;
RAPT.SPIDER_LEGS_FLOOR_ELASTICITY = 0.1;

RAPT.RocketSpiderLegs = function (center, angle, body) {
	RAPT.WalkingEnemy.call(this, -1, center, RAPT.SPIDER_LEGS_RADIUS, RAPT.SPIDER_LEGS_ELASTICITY);
	this.body = body;
	this.weakSpot = new RAPT.Circle(center, RAPT.SPIDER_LEGS_WEAK_SPOT_RADIUS);
	if (angle <= Math.PI * 0.5 || angle > Math.PI * 0.6666666) {
		this.velocity = new RAPT.Vector(RAPT.SPIDER_SPEED, 0);
	} else {
		this.velocity = new RAPT.Vector(-RAPT.SPIDER_SPEED, 0);
	}
}

//RocketSpiderLegs.prototype = Object.create( WalkingEnemy.prototype );
//RAPT.RocketSpiderLegs.prototype = new RAPT.WalkingEnemy;
RAPT.RocketSpiderLegs.prototype = Object.create( RAPT.WalkingEnemy.prototype );

// Returns true iff the Spider and player are on the same level floor, less than 1 cell horizontal distance away,
// and the spider is moving towards the player
RAPT.RocketSpiderLegs.prototype.playerWillCollide = function(player) {
	if (player.isDead()) return false;
	var toReturn = Math.abs(player.getShape().getAabb().getBottom() - this.hitCircle.getAabb().getBottom()) < .01;
	var xRelative = player.getCenter().x - this.getCenter().x;
	toReturn = toReturn && (Math.abs(xRelative) < 1) && (this.velocity.x * xRelative > -0.01);
	return toReturn;
}

// Walks in a straight line, but doesn't walk into the player
RAPT.RocketSpiderLegs.prototype.move = function(seconds) {
	if (this.isOnFloor()) {
		if (this.playerWillCollide(RAPT.gameState.playerA) || this.playerWillCollide(RAPT.gameState.playerB)) {
			this.velocity.x *= -1;
		}
		return this.velocity.mul(seconds);
	} else {
		return this.accelerate(new RAPT.Vector(0, RAPT.FREEFALL_ACCEL), seconds);
	}
}

// Acts like it has elasticity of SPIDER_FLOOR_ELASTICITY on floors, and maintains constant horizontal speed
RAPT.RocketSpiderLegs.prototype.reactToWorld = function(contact) {
	if (RAPT.getOrientation(contact.normal) === RAPT.EDGE_FLOOR) {
		var perpendicular = this.velocity.projectOntoAUnitVector(contact.normal);
		var parallel = this.velocity.sub(perpendicular);
		this.velocity = parallel.unit().mul(RAPT.SPIDER_SPEED).add(perpendicular.mul(RAPT.SPIDER_LEGS_FLOOR_ELASTICITY));
	}
}

// The player can kill the Spider by running through its legs
RAPT.RocketSpiderLegs.prototype.reactToPlayer = function(player) {
	this.weakSpot.moveTo(this.hitCircle.getCenter());
	if (RAPT.gameState.collider.overlapShapePlayers(this.weakSpot).length === 0) {
		this.setDead(true);
	}
}

// The legs of the spider are responsible for killing the body

RAPT.RocketSpiderLegs.prototype.setDead = function(isDead) {
	this.body.setDead(isDead);
	RAPT.Enemy.prototype.setDead.call(this, isDead);
}

RAPT.RocketSpiderLegs.prototype.onDeath = function() {
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);

	// make things that look like legs fly everywhere
	var position = this.getCenter();
	for (var i = 0; i < 16; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0.5, 5));

		var angle = RAPT.randInRange(0, 2*Math.PI);
		var angularVelocity = RAPT.randInRange(-Math.PI, Math.PI);

		RAPT.Particle().position(position).velocity(direction).radius(0.25).bounces(3).elasticity(0.5).decay(0.01).line().angle(angle).angularVelocity(angularVelocity).color(0, 0, 0, 1);
	}
}

RAPT.RocketSpiderLegs.prototype.draw = function(c) {
}
