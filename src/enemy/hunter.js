//RAPT.HUNTER_BODY = 0;
//RAPT.HUNTER_CLAW1 = 1;
//RAPT.HUNTER_CLAW2 = 2;

RAPT.HUNTER_RADIUS = 0.3;
RAPT.HUNTER_ELASTICITY = 0.4;
RAPT.HUNTER_CHASE_ACCEL = 14;
RAPT.HUNTER_FLEE_ACCEL = 3;
RAPT.HUNTER_FLEE_RANGE = 10;
RAPT.HUNTER_CHASE_RANGE = 8;
RAPT.HUNTER_LOOKAHEAD = 20;

RAPT.STATE_IDLE = 0;
RAPT.STATE_RED = 1;
RAPT.STATE_BLUE = 2;
RAPT.STATE_BOTH = 3;

RAPT.Hunter = function (center) {
	RAPT.RotatingEnemy.call(this, RAPT.ENEMY_HUNTER, center, RAPT.HUNTER_RADIUS, 0, RAPT.HUNTER_ELASTICITY);

	this.angle = 0
	this.state = RAPT.STATE_IDLE;
	this.acceleration = new RAPT.Vector(0, 0);
	this.jawAngle = 0;

	this.sprite =  new RAPT.SpriteGroup({
		name:'hunter',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[1,2], [3,2], [2,2]],
		color:0XFFCC00,
		parent:['' , 'body', 'body'],
		list:['body', 'bottom','top'],
		pos:   [ [0,0,0] ,[-0.25,0,0],[-0.25,0,0]],
		center:[ [0,0]  , [0.25,0], [0.25,0]],
		sizes: [ [0.9,0.9] ]
	});

	this.sprite.moveto(center);

	/*this.sprites = [new RAPT.Sprite(), new RAPT.Sprite(), new RAPT.Sprite()];
	this.sprites[RAPT.HUNTER_BODY].drawGeometry = function(c) {
		c.beginPath();
		c.arc(0, 0, 0.1, 0, 2*Math.PI, false);
		c.stroke();
	};
	this.sprites[RAPT.HUNTER_CLAW1].drawGeometry = this.sprites[RAPT.HUNTER_CLAW2].drawGeometry = function(c) {
		c.beginPath();
		c.moveTo(0, 0.1);
		for(var i = 0; i <= 6; i++)
			c.lineTo((i & 1) / 24, 0.2 + i * 0.05);
		c.arc(0, 0.2, 0.3, 0.5*Math.PI, -0.5*Math.PI, true);
		c.stroke();
	};
	this.sprites[RAPT.HUNTER_CLAW1].setParent(this.sprites[RAPT.HUNTER_BODY]);
	this.sprites[RAPT.HUNTER_CLAW2].setParent(this.sprites[RAPT.HUNTER_BODY]);
	this.sprites[RAPT.HUNTER_CLAW2].flip = true;
	this.sprites[RAPT.HUNTER_BODY].offsetAfterRotation = new RAPT.Vector(0, -0.2);*/
}

//RAPT.Hunter.prototype = new RAPT.RotatingEnemy;
RAPT.Hunter.prototype = Object.create( RAPT.RotatingEnemy.prototype );

RAPT.Hunter.prototype.avoidsSpawn = function() { return true; };

RAPT.Hunter.prototype.calcAcceleration = function(target) {
	return target.unit().sub(this.velocity.mul(3.0 / RAPT.HUNTER_CHASE_ACCEL)).unit().mul(RAPT.HUNTER_CHASE_ACCEL);
};

RAPT.Hunter.prototype.playerInSight = function(target, distanceSquared) {
	if (target.isDead()) return false;
	var inSight = distanceSquared < (RAPT.HUNTER_CHASE_RANGE * RAPT.HUNTER_CHASE_RANGE);
	inSight &= !RAPT.gameState.collider.lineOfSightWorld(this.getCenter(), target.getCenter(), RAPT.gameState.world);
	return inSight;
};

RAPT.Hunter.prototype.move = function(seconds) {
	// Relative player positions
	var deltaA = RAPT.gameState.playerA.getCenter().sub(this.getCenter());
	var deltaB = RAPT.gameState.playerB.getCenter().sub(this.getCenter());
	// Projection positions with lookahead
	var projectedA = deltaA.add(RAPT.gameState.playerA.getVelocity().mul(RAPT.HUNTER_LOOKAHEAD * seconds));
	var projectedB = deltaB.add(RAPT.gameState.playerB.getVelocity().mul(RAPT.HUNTER_LOOKAHEAD * seconds));
	// Squared distances
	var distASquared = deltaA.lengthSquared();
	var distBSquared = deltaB.lengthSquared();
	// Checks if players are in sight
	var inSightA = this.playerInSight(RAPT.gameState.playerA, distASquared);
	var inSightB = this.playerInSight(RAPT.gameState.playerB, distBSquared);

	// If player A is in sight
	if (inSightA) {
		// If both in sight
		if (inSightB) {
			// If they're on the same side of the Hunter, the Hunter will flee
			if ((deltaA.dot(this.velocity) * deltaB.dot(this.velocity)) >= 0) {
				this.acceleration = deltaA.unit().add(deltaB.unit()).mul(-.5 * RAPT.HUNTER_FLEE_ACCEL);
				this.target = null;
				this.state = RAPT.STATE_BOTH;
			} else if (distASquared < distBSquared) {
				// Otherwise the hunter will chase after the closer of the two players
				this.acceleration = this.calcAcceleration(projectedA);
				this.target = RAPT.gameState.playerA;
				this.state = RAPT.STATE_RED;
			} else {
				this.acceleration = this.calcAcceleration(projectedB);
				this.target = RAPT.gameState.playerB;
				this.state = RAPT.STATE_BLUE;
			}
		// If only player A in sight
		} else {
			this.acceleration = this.calcAcceleration(projectedA);
			this.target = RAPT.gameState.playerA;
			this.state = RAPT.STATE_RED;
		}
	} else if (inSightB) {
		// If only player B in sight
		this.acceleration = this.calcAcceleration(projectedB);
		this.target = RAPT.gameState.playerB;
		this.state = RAPT.STATE_BLUE;
	} else {
		this.acceleration.x = this.acceleration.y = 0;
		this.target = null;
		this.state = RAPT.STATE_IDLE;
	}

	// Damp the movement so it doesn't keep floating around
	// Time independent version of multiplying by 0.99
	this.velocity.inplaceMul(Math.pow(0.366032, seconds));

	return this.accelerate(this.acceleration, seconds);
};

RAPT.Hunter.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	//this.sprites[RAPT.HUNTER_BODY].offsetBeforeRotation = position;

	this.sprite.moveto(position);

	if (this.target){
		var currentAngle = this.angle;//this.sprite.group.rotation.z;//this.sprites[RAPT.HUNTER_BODY].angle;
		var targetAngle = this.target.getCenter().sub(position).atan2() ;//- Math.PI / 2;
		this.angle = RAPT.adjustAngleToTarget(currentAngle, targetAngle, Math.PI * seconds)
		this.sprite.group.rotation.z = this.angle;//APT.adjustAngleToTarget(currentAngle, targetAngle, Math.PI * seconds) + RAPT.PI90;
		//this.sprites[RAPT.HUNTER_BODY].angle = RAPT.adjustAngleToTarget(currentAngle, targetAngle, Math.PI * seconds);
	}



	var targetJawAngle = this.target ? -0.2 : 0;
	this.jawAngle = RAPT.adjustAngleToTarget(this.jawAngle, targetJawAngle, 0.4 * seconds);
	//this.sprites[RAPT.HUNTER_CLAW1].angle = this.jawAngle;
	//this.sprites[RAPT.HUNTER_CLAW2].angle = this.jawAngle;

	this.sprite.sprite[1].rotation.z = this.jawAngle;
	this.sprite.sprite[2].rotation.z = -this.jawAngle;
};

RAPT.Hunter.prototype.draw = function(c) {
	/*c.fillStyle = (this.target == RAPT.gameState.playerA) ? 'red' : 'blue';
	c.strokeStyle = 'black';

	if (this.state != RAPT.STATE_IDLE)
	{
		var angle = this.sprites[RAPT.HUNTER_BODY].angle + Math.PI / 2;
		var fromEye = new RAPT.Vector().fromAngle(angle);
		var eye = this.getCenter().sub(fromEye.mul(0.2));

		if(this.state == RAPT.STATE_RED) {
			c.fillStyle = 'red';
			c.beginPath();
			c.arc(eye.x, eye.y, 0.1, 0, 2*Math.PI, false);
			c.fill();
		} else if(this.state == RAPT.STATE_BLUE) {
			c.fillStyle = 'blue';
			c.beginPath();
			c.arc(eye.x, eye.y, 0.1, 0, 2*Math.PI, false);
			c.fill();
		} else {
			c.fillStyle = 'red';
			c.beginPath();
			c.arc(eye.x, eye.y, 0.1, angle, angle + Math.PI, false);
			c.fill();

			c.fillStyle = 'blue';
			c.beginPath();
			c.arc(eye.x, eye.y, 0.1, angle + Math.PI, angle + 2*Math.PI, false);
			c.fill();

			c.beginPath();
			c.moveTo(eye.x - fromEye.x * 0.1, eye.y - fromEye.y * 0.1);
			c.lineTo(eye.x + fromEye.x * 0.1, eye.y + fromEye.y * 0.1);
			c.stroke();
		}
	}

	this.sprites[RAPT.HUNTER_BODY].draw(c);*/
};
