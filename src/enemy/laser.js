RAPT.LASER_RADIUS = .15;
RAPT.LASER_SPEED = 5;
RAPT.LASER_BOUNCES = 0;

RAPT.Laser = function (center, direction) {
	RAPT.FreefallEnemy.call(this, RAPT.ENEMY_LASER, center, RAPT.LASER_RADIUS, 1);

	this.bouncesLeft = RAPT.LASER_BOUNCES;
	this.velocity = new RAPT.Vector(RAPT.LASER_SPEED * Math.cos(direction), RAPT.LASER_SPEED * Math.sin(direction));

	this.sprite = new RAPT.SpriteGroup({
		name:'laser',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[4,2]],
		list:['p1']
	});

	this.sprite.moveto(center);
	this.sprite.sprite[0].rotation.z = direction;

}

RAPT.Laser.prototype = Object.create( RAPT.FreefallEnemy.prototype );

RAPT.Laser.prototype.move = function(seconds) {
	this.sprite.moveto(this.getCenter());
	return this.velocity.mul(seconds);
};

RAPT.Laser.prototype.reactToWorld = function(contact) {
	if (this.bouncesLeft <= 0) {
		this.setDead(true);
		
		var position = this.getCenter();
		for (var i = 0; i < 20; ++i) {
			var angle = RAPT.randInRange(0, 2 * Math.PI);
			var direction = new RAPT.Vector().fromAngle(angle);
			direction = direction.mul(RAPT.randInRange(0.5, 5));

			RAPT.Particle().position(position).velocity(direction).angle(angle).radius(0.1).bounces(1).elasticity(1).decay(0.01).gravity(0).color(1, 1, 1, 1).line();
		}
	} else {
		
		--this.bouncesLeft;
	}
	//
};


RAPT.Laser.prototype.onDeath = function() {
	this.sprite.remove();
};