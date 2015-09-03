RAPT.SPIKE_BALL_RADIUS = 0.2;

/*RAPT.makeDrawSpikes = function (count) {
	var radii = [];
	for(var i = 0; i < count; i++) {
		radii.push(RAPT.randInRange(0.5, 1.5));
	}
	return function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		for(var i = 0; i < count; i++) {
			var angle = i * (2 * Math.PI / count);
			var radius = RAPT.SPIKE_BALL_RADIUS * radii[i];
			c.moveTo(0, 0);
			c.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
		}
		c.stroke();
	};
}*/


// A boring old spike ball
RAPT.SpikeBall = function (center) {
	RAPT.Enemy.call(this, RAPT.ENEMY_SPIKE_BALL, 0);

	this.group =  new RAPT.SpriteGroup({
		name:'spikenall',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		color:0XFFCC00,
		list:['p1', 'p2', 'p3'],
		sizes: [ [0.5,0.5]  ]
	});

	this.group.move(center.x, center.y);

	this.hitCircle = new RAPT.Circle(center, RAPT.SPIKE_BALL_RADIUS);

	this.group.sprite[0].rotation.z = RAPT.randInRange(0, RAPT.TwoPI );
	this.group.sprite[1].rotation.z = RAPT.randInRange(0, RAPT.TwoPI );
	this.group.sprite[2].rotation.z = RAPT.randInRange(0, RAPT.TwoPI );

	/*this.sprites = [new RAPT.Sprite(), new RAPT.Sprite(), new RAPT.Sprite()];

	this.sprites[0].drawGeometry = RAPT.makeDrawSpikes(11);
	this.sprites[1].drawGeometry = RAPT.makeDrawSpikes(13);
	this.sprites[2].drawGeometry = RAPT.makeDrawSpikes(7);

	this.sprites[1].setParent(this.sprites[0]);
	this.sprites[2].setParent(this.sprites[0]);

	this.sprites[0].angle = RAPT.randInRange(0, 2*Math.PI);
	this.sprites[1].angle = RAPT.randInRange(0, 2*Math.PI);
	this.sprites[2].angle = RAPT.randInRange(0, 2*Math.PI);*/
}

//RAPT.SpikeBall.prototype = new RAPT.Enemy;
RAPT.SpikeBall.prototype = Object.create( RAPT.Enemy.prototype );

RAPT.SpikeBall.prototype.getShape = function() { return this.hitCircle; }

RAPT.SpikeBall.prototype.canCollide = function() { return false; }

RAPT.SpikeBall.prototype.afterTick = function(seconds) {

	this.group.sprite[0].rotation.z -= seconds * (25 * RAPT.ToRad);
	this.group.sprite[1].rotation.z += seconds * (65 * RAPT.ToRad);
	this.group.sprite[2].rotation.z += seconds * (15 * RAPT.ToRad);

	


	/*this.sprites[0].offsetBeforeRotation = this.getCenter();

	this.sprites[0].angle -= seconds * (25 * Math.PI / 180);
	this.sprites[1].angle += seconds * (65 * Math.PI / 180);
	this.sprites[2].angle += seconds * (15 * Math.PI / 180);*/
}

RAPT.SpikeBall.prototype.draw = function(c) {
	//this.sprites[0].draw(c);
}