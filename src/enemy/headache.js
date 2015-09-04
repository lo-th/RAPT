RAPT.HEADACHE_RADIUS = .15;
RAPT.HEADACHE_ELASTICITY = 0;
RAPT.HEADACHE_SPEED = 3;
RAPT.HEADACHE_RANGE = 6;

RAPT.HEADACHE_CLOUD_RADIUS = RAPT.HEADACHE_RADIUS * 0.5;

RAPT.Headache = function (center, target) {
	RAPT.HoveringEnemy.call(this, RAPT.ENEMY_HEADACHE, center, RAPT.HEADACHE_RADIUS, RAPT.HEADACHE_ELASTICITY);

	this.target = target;
	this.isAttached = false;
	this.isTracking = false;
	//this.restingOffset = new RAPT.Vector(0, -10);

	var cc = this.target.color;

	this.sprite =  new RAPT.SpriteGroup({
		name:'headache',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[4+cc,2]],
		list:['p1'],
		pos:[[0,0,0.02]]
	});

	this.sprite.moveto(center);
}

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
			if (delta.lengthSquared() > (RAPT.HEADACHE_SPEED * seconds * RAPT.HEADACHE_SPEED * seconds * 3)){
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
		if (this.target.isDead()) this.setDead(true);
		
		// Otherwise it moves with the player
		var delta = this.target.getCenter().add(new RAPT.Vector(0, 0.45)).sub(this.getCenter());
		// If player is crouching, adjust position
		if (this.target.getCrouch() && this.target.isOnFloor()){
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
	this.sprite.remove();

	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);
	
	var position = this.getCenter();

	// body
	var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI)).mul(RAPT.randInRange(0, 0.05));
	var body = RAPT.Particle().position(position).velocity(direction).radius(RAPT.HEADACHE_RADIUS).bounces(3).elasticity(0.5).decay(0.01).circle().gravity(5);
	if (this.target == RAPT.gameState.playerA) body.color(1, 0, 0, 1);
	else  body.color(0, 0, 1, 1);

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
	this.sprite.moveto(center);
	this.sprite.group.rotation.z += seconds*3;
};