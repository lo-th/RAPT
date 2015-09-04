RAPT.SPIKE_BALL_RADIUS = 0.2;

// A boring old spike ball
RAPT.SpikeBall = function (center) {
	RAPT.Enemy.call(this, RAPT.ENEMY_SPIKE_BALL, 0);

	this.sprite =  new RAPT.SpriteGroup({
		name:'spikenall',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		color:0XFFCC00,
		list:['p1', 'p2', 'p3'],
		sizes: [ [0.5,0.5]  ]
	});

	this.sprite.moveto(center);

	this.hitCircle = new RAPT.Circle(center, RAPT.SPIKE_BALL_RADIUS);

	this.sprite.sprite[0].rotation.z = RAPT.randInRange(0, RAPT.TwoPI );
	this.sprite.sprite[1].rotation.z = RAPT.randInRange(0, RAPT.TwoPI );
	this.sprite.sprite[2].rotation.z = RAPT.randInRange(0, RAPT.TwoPI );
}

RAPT.SpikeBall.prototype = Object.create( RAPT.Enemy.prototype );

RAPT.SpikeBall.prototype.getShape = function() { return this.hitCircle; }

RAPT.SpikeBall.prototype.canCollide = function() { return false; }

RAPT.SpikeBall.prototype.afterTick = function(seconds) {
	this.sprite.sprite[0].rotation.z -= seconds * (25 * RAPT.ToRad);
	this.sprite.sprite[1].rotation.z += seconds * (65 * RAPT.ToRad);
	this.sprite.sprite[2].rotation.z += seconds * (15 * RAPT.ToRad);
}