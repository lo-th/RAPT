RAPT.RIOT_BULLET_RADIUS = 0.1;
RAPT.RIOT_BULLET_SPEED = 7;

RAPT.RiotBullet = function (center, direction) {
	RAPT.FreefallEnemy.call(this, RAPT.ENEMY_RIOT_BULLET, center, RAPT.RIOT_BULLET_RADIUS, 0);
	this.velocity = new RAPT.Vector(RAPT.RIOT_BULLET_SPEED * Math.cos(direction), RAPT.RIOT_BULLET_SPEED * Math.sin(direction));

	this.sprite =  new RAPT.SpriteGroup({
		name:'riotbullet',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[2,5]],
		color:0XFFCC00,

		list:['p1'],
		sizes: [ [0.7,0.7] ]
	});

	this.sprite.moveto(center);
}

//RAPT.RiotBullet.prototype = new RAPT.FreefallEnemy;
RAPT.RiotBullet.prototype = Object.create( RAPT.FreefallEnemy.prototype );

RAPT.RiotBullet.prototype.reactToPlayer = function(player) {
	if (!this.isDead()) {
		// the delta-velocity applied to the player
		var deltaVelocity = this.velocity.mul(0.75);
		player.addToVelocity(deltaVelocity);
	}
	this.setDead(true);
}

RAPT.RiotBullet.prototype.afterTick = function(seconds) {
	this.sprite.moveto( this.getCenter());
}

RAPT.RiotBullet.prototype.onDeath = function() {
	var position = this.getCenter();
	this.sprite.remove();

	// smoke
	for (var i = 0; i < 5; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = this.velocity.add(direction.mul(RAPT.randInRange(0.1, 1)));

		RAPT.Particle().position(position).velocity(direction).radius(0.01, 0.1).bounces(0, 4).elasticity(0.05, 0.9).decay(0.0005, 0.005).expand(1.0, 1.2).color(0.9, 0.9, 0, 1).mixColor(1, 1, 0, 1).circle();
	}
	RAPT.Enemy.prototype.onDeath.call(this);
}

RAPT.RiotBullet.prototype.draw = function(c) {
	/*var pos = this.getCenter();
	c.strokeStyle = 'black';
	c.fillStyle = 'yellow';
	c.beginPath();
	c.arc(pos.x, pos.y, RAPT.RIOT_BULLET_RADIUS, 0, 2*Math.PI, false);
	c.fill();
	c.stroke();*/
}
