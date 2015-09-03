// enum
RAPT.DOORBELL_OPEN = 0;
RAPT.DOORBELL_CLOSE = 1;
RAPT.DOORBELL_TOGGLE = 2;
// Must be wider and taller than the player to avoid double toggling 
RAPT.DOORBELL_WIDTH = 0.40;
// PLAYER_HEIGHT + .01
RAPT.DOORBELL_HEIGHT = 0.76;
RAPT.DOORBELL_RADIUS = 0.11;
RAPT.DOORBELL_SLICES = 3;

RAPT.Doorbell = function (center, behavior, visible) {
	RAPT.Enemy.call(this, RAPT.ENEMY_DOORBELL, 1);
	this.hitBox = RAPT.makeAABB(center, RAPT.DOORBELL_WIDTH, RAPT.DOORBELL_HEIGHT);
	this.rotationPercent = 1;
	this.restingAngle = RAPT.randInRange(0, 2 * Math.PI);
	this.behavior = behavior;
	this.visible = visible;
	this.triggeredLastTick = false;
	this.triggeredThisTick = false;
	this.doors = [];

	this.sprite = new RAPT.SpriteGroup({
		name:'doorbell',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[13,0]],
		color:0X44CC66,
		list:['p1'],
		//sizes: [ [0.7,0.7] ]
	});

	this.sprite.moveto(center);
}

//RAPT.Doorbell.prototype = new RAPT.Enemy;
RAPT.Doorbell.prototype = Object.create( RAPT.Enemy.prototype );
//RAPT.Doorbell.prototype.constructor = RAPT.Doorbell;

RAPT.Doorbell.prototype.getShape = function() { return this.hitBox; }

RAPT.Doorbell.prototype.addDoor = function(doorIndex) { this.doors.push(doorIndex); }

RAPT.Doorbell.prototype.canCollide = function() { return false; }

RAPT.Doorbell.prototype.tick = function(seconds) {
	this.rotationPercent += seconds;
	if (this.rotationPercent > 1) {
		this.rotationPercent = 1;
	}

	this.sprite.sprite[0].rotation.z = (RAPT.PI90 * this.rotationPercent) - (RAPT.PI90 *0.5);

	this.triggeredThisTick = false;
	RAPT.Enemy.prototype.tick.call(this, seconds);
	this.triggeredLastTick = this.triggeredThisTick;
}

RAPT.Doorbell.prototype.reactToPlayer = function(player) {
	this.triggeredThisTick = true;
	if (this.triggeredLastTick) return;
	
	for (var i = 0; i < this.doors.length; ++i) {
		RAPT.gameState.getDoor(this.doors[i]).act(this.behavior, false, true);
	}

	for (var i = 0; i < 50; ++i) {
		var rotationAngle = RAPT.randInRange(0, 2 * Math.PI);
		var direction = new RAPT.Vector().fromAngle(rotationAngle).mul(RAPT.randInRange(3, 5));
		RAPT.Particle().position(this.getCenter()).velocity(direction).angle(rotationAngle).radius(0.1).bounces(3).elasticity(0.5).decay(0.01).line().color(1, 1, 1, 1);
	}

	this.rotationPercent = 0;
}

RAPT.Doorbell.prototype.draw = function(c) {
	/*if (this.visible) {
		var pos = this.getCenter();
		var startingAngle = this.restingAngle + (2 * Math.PI / 3) / (this.rotationPercent + 0.1);

		c.fillStyle = 'white';
		c.strokeStyle = 'black';
		c.beginPath();
		c.arc(pos.x, pos.y, RAPT.DOORBELL_RADIUS, 0, 2 * Math.PI, false);
		c.fill();
		c.stroke();

		c.beginPath();
		for (var i = 0; i < RAPT.DOORBELL_SLICES; ++i) {
			c.moveTo(pos.x, pos.y);
			var nextPos = pos.add(new RAPT.Vector().fromAngle(startingAngle + (i - 0.5) * (2 * Math.PI / RAPT.DOORBELL_SLICES)).mul(RAPT.DOORBELL_RADIUS));
			c.lineTo(nextPos.x, nextPos.y);
		}
		c.stroke();
	}*/
}
