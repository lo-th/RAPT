RAPT.CORROSION_CLOUD_RADIUS = .5;
RAPT.CORROSION_CLOUD_SPEED = .7;
RAPT.CORROSION_CLOUD_ACCEL = 10;


RAPT.CorrosionCloud = function (center, target) {
	RAPT.RotatingEnemy.call(this, RAPT.ENEMY_CLOUD, center, RAPT.CORROSION_CLOUD_RADIUS, 0, 0);

	this.target = target;
	this.smoothedVelocity = new RAPT.Vector(0, 0);
}

//RAPT.CorrosionCloud.prototype = new RAPT.RotatingEnemy;
RAPT.CorrosionCloud.prototype = Object.create( RAPT.RotatingEnemy.prototype );

RAPT.CorrosionCloud.prototype.canCollide = function() {
	return false;
}

RAPT.CorrosionCloud.prototype.avoidsSpawn = function() {
	return true;
}

RAPT.CorrosionCloud.prototype.move = function(seconds) {
	var avoidingSpawn = false;
	if (!this.target) return new RAPT.Vector(0, 0);
	var targetDelta = this.target.getCenter().sub(this.getCenter());
	// As long as the max rotation is over 2 pi, it will rotate to face the player no matter what
	this.heading = RAPT.adjustAngleToTarget(this.heading, targetDelta.atan2(), 7);
	// ACCELERATION
	var speed = RAPT.CORROSION_CLOUD_SPEED * RAPT.CORROSION_CLOUD_ACCEL * seconds;
	this.velocity.x += speed * Math.cos(this.heading);
	this.velocity.y += speed * Math.sin(this.heading);

	if (this.velocity.lengthSquared() > (RAPT.CORROSION_CLOUD_SPEED * RAPT.CORROSION_CLOUD_SPEED)) {
		this.velocity.normalize();
		this.velocity.inplaceMul(RAPT.CORROSION_CLOUD_SPEED);
	}

	return this.velocity.mul(seconds);
};

RAPT.CorrosionCloud.prototype.afterTick = function(seconds) {
	var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
	var center = this.getCenter().add(direction.mul(RAPT.randInRange(0, RAPT.CORROSION_CLOUD_RADIUS)));

	var isRed = (this.target === RAPT.gameState.playerA) ? 0.4 : 0;
	var isBlue = (this.target === RAPT.gameState.playerB) ? 0.3 : 0;

	this.smoothedVelocity = this.smoothedVelocity.mul(0.95).add(this.velocity.mul(0.05));
	RAPT.Particle().position(center).velocity(this.smoothedVelocity.sub(new RAPT.Vector(0.1, 0.1)), this.smoothedVelocity.add(new RAPT.Vector(0.1, 0.1))).radius(0.01, 0.1).bounces(0, 4).elasticity(0.05, 0.9).decay(0.01, 0.5).expand(1, 1.2).color(0.2 + isRed, 0.2, 0.2 + isBlue, 1).mixColor(0.1 + isRed, 0.1, 0.1 + isBlue, 1).circle().gravity(-0.4, 0);
};

RAPT.CorrosionCloud.prototype.getTarget = function() {
	return this.target === RAPT.gameState.playerB;
};

RAPT.CorrosionCloud.prototype.draw = function(c) {
	// do nothing, it's all particles!
};
