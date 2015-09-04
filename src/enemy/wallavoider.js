RAPT.WALL_AVOIDER_RADIUS = 0.3;
RAPT.WALL_AVOIDER_ACCEL = 3.3;

RAPT.WallAvoider = function (center, target) {
	RAPT.RotatingEnemy.call(this, RAPT.ENEMY_WALL_AVOIDER, center, RAPT.WALL_AVOIDER_RADIUS, 0, 0);

	this.target = target;
	this.acceleration = new RAPT.Vector(0,0);
	this.angularVelocity = 0;

	var cc = this.target.color;

	this.sprite =  new RAPT.SpriteGroup({
		name:'wallavoider',
		material:RAPT.MAT_ENEMY,
		nuv:16,
		list:['p1'],
		uvs:[[cc+2,5]]
	});

	this.sprite.moveto(center);
}

RAPT.WallAvoider.prototype = new RAPT.RotatingEnemy;
RAPT.WallAvoider.prototype = Object.create( RAPT.RotatingEnemy.prototype );

RAPT.WallAvoider.prototype.move = function(seconds) {
	if (this.target.isDead()) {
		this.velocity.x = this.velocity.y = 0;
		return this.velocity.mul(seconds);
	} else {
		var targetDelta = this.target.getCenter().sub(this.getCenter());
		var ref_shapePoint = {};
		var ref_worldPoint = {};
		var closestPointDist = RAPT.gameState.collider.closestToEntityWorld(this, 5, ref_shapePoint, ref_worldPoint, RAPT.gameState.world);
		// If something went horribly, horribly wrong
		if (closestPointDist < 0.001) {
			return this.accelerate(new RAPT.Vector(0, 0), seconds);
		}
		this.acceleration = targetDelta.unit();
		if (closestPointDist < Number.POSITIVE_INFINITY) {
			var closestPointDelta = ref_worldPoint.ref.sub(this.getCenter());
			var wallAvoidance = closestPointDelta.mul(-1 / (closestPointDist * closestPointDist));
			this.acceleration.inplaceAdd(wallAvoidance);
		}
		this.acceleration.normalize();
		this.acceleration.inplaceMul(RAPT.WALL_AVOIDER_ACCEL);

		// Time independent version of multiplying by 0.99
		this.velocity.inplaceMul(Math.pow(0.366032, seconds));
		return this.accelerate(this.acceleration, seconds);
	}
};

RAPT.WallAvoider.prototype.reactToWorld = function(contact) {
	this.setDead(true);
};

RAPT.WallAvoider.prototype.onDeath = function() {
	this.sprite.remove();
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);

	var position = this.getCenter();
	// fire
	for(var i = 0; i < 50; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0.5, 17));

		RAPT.Particle().position(position).velocity(direction).radius(0.02, 0.15).bounces(0, 4).elasticity(0.05, 0.9).decay(0.000001, 0.00001).expand(1.0, 1.2).color(1, 0.3, 0, 1).mixColor(1, 0.1, 0, 1).triangle();
	}
};

RAPT.WallAvoider.prototype.getTarget = function() {
	return this.target === RAPT.gameState.getPlayerB();
};

RAPT.WallAvoider.prototype.afterTick = function(seconds) {
	this.sprite.moveto(this.getCenter());
	this.angularVelocity = (this.angularVelocity + RAPT.randInRange(-Math.PI, Math.PI)) * 0.5;
	this.sprite.group.rotation.z += this.angularVelocity * seconds;
};