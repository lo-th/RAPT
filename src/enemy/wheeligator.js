
RAPT.WHEELIGATOR_RADIUS = 0.3;
RAPT.WHEELIGATOR_SPEED = 3;
RAPT.WHEELIGATOR_ELASTICITY = 1;
RAPT.WHEELIGATOR_FLOOR_ELASTICITY = 0.3;

RAPT.Wheeligator = function (center, angle) {
	RAPT.WalkingEnemy.call(this, RAPT.ENEMY_WHEELIGATOR, center, RAPT.WHEELIGATOR_RADIUS, RAPT.WHEELIGATOR_ELASTICITY);

	this.sprite =  new RAPT.SpriteGroup({
		name:'wheeligator',
		material:RAPT.MAT_ENEMY,
		size : 0.7,
		uvs:[[0,1]],
		nuv:16,
		color:0X44CC66,
		list:['p1'],
		//sizes: [ [0.6,0.6] ]
	});

	//this.group.move(center.x, center.y)

	this.hitGround = false;
	this.angularVelocity = 0;
	this.startsRight = (Math.cos(angle) > 0);

	/*this.bodySprite = new RAPT.Sprite();
	
	this.bodySprite.drawGeometry = function(c) {
		var rim = 0.1;

		c.strokeStyle = 'black';
		c.beginPath();
		c.arc(0, 0, RAPT.WHEELIGATOR_RADIUS, 0, 2*Math.PI, false);
		c.arc(0, 0, RAPT.WHEELIGATOR_RADIUS - rim, Math.PI, 3*Math.PI, false);
		c.stroke();

		c.fillStyle = 'black';
		for(var i = 0; i < 4; i++) {
			var startAngle = i * (2*Math.PI / 4);
			var endAngle = startAngle + Math.PI / 4;
			c.beginPath();
			c.arc(0, 0, RAPT.WHEELIGATOR_RADIUS, startAngle, endAngle, false);
			c.arc(0, 0, RAPT.WHEELIGATOR_RADIUS - rim, endAngle, startAngle, true);
			c.fill();
		}
	};*/
};

//RAPT.Wheeligator.prototype = new RAPT.WalkingEnemy;//Object.create( WalkingEnemy.prototype );
RAPT.Wheeligator.prototype = Object.create( RAPT.WalkingEnemy.prototype );
//RAPT.Wheeligator.prototype.constructor = RAPT.Wheeligator;

RAPT.Wheeligator.prototype.move = function(seconds) {
	var isOnFloor = this.isOnFloor();

	if (!this.hitGround && isOnFloor) {
		if (this.velocity.x < RAPT.WHEELIGATOR_SPEED) {
			this.velocity.x = this.startsRight ? RAPT.WHEELIGATOR_SPEED : -RAPT.WHEELIGATOR_SPEED;
			this.hitGround = true;
		}
	}

	if (isOnFloor) {
		this.angularVelocity = -this.velocity.x / RAPT.WHEELIGATOR_RADIUS;
	}

	this.velocity.y += (RAPT.FREEFALL_ACCEL * seconds);

	

	return this.velocity.mul(seconds);
};

RAPT.Wheeligator.prototype.reactToWorld = function(contact) {
	// If a floor, bounce off like elasticity is FLOOR_ELASTICITY
	if (RAPT.getOrientation(contact.normal) === RAPT.EDGE_FLOOR) {
		var perpendicular = this.velocity.projectOntoAUnitVector(contact.normal);
		var parallel = this.velocity.sub(perpendicular);
		this.velocity = parallel.add(perpendicular.mul(RAPT.WHEELIGATOR_FLOOR_ELASTICITY));
		this.angularVelocity = -this.velocity.x / RAPT.WHEELIGATOR_RADIUS;
	}
};

RAPT.Wheeligator.prototype.afterTick = function(seconds) {
	this.sprite.moveto(this.getCenter());
	this.sprite.group.rotation.z += this.angularVelocity * seconds;

	//this.bodySprite.offsetBeforeRotation = this.getCenter();
	//this.bodySprite.angle = this.bodySprite.angle + this.angularVelocity * seconds;
};

RAPT.Wheeligator.prototype.draw = function(c) {
	//var pos = this.getCenter();
	//this.bodySprite.draw(c);
};
