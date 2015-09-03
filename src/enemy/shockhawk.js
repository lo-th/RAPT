RAPT.SHOCK_HAWK_RADIUS = 0.3;
RAPT.SHOCK_HAWK_ACCEL = 6;
RAPT.SHOCK_HAWK_DECEL = 0.8;
RAPT.SHOCK_HAWK_RANGE = 10;

RAPT.ShockHawk = function (center, target) {
	RAPT.HoveringEnemy.call(this, RAPT.ENEMY_SHOCK_HAWK, center, RAPT.SHOCK_HAWK_RADIUS, 0);
	this.target = target;
	this.chasing = false;

	var cc = this.target.color+2;

	this.sprite = new RAPT.SpriteGroup({
		name:'shockhawk',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[cc,0]],
		color:0X44CC66,
		list:['p1'],
		//sizes: [ [0.7,0.7] ]
	});

	this.sprite.moveto(center);

	/*this.bodySprite = new RAPT.Sprite();
	this.bodySprite.drawGeometry = function(c) {
		// draw solid center
		c.beginPath();
		c.moveTo(0, -0.15);
		c.lineTo(0.05, -0.1);
		c.lineTo(0, 0.1);
		c.lineTo(-0.05, -0.1);
		c.fill();

		// draw outlines
		c.beginPath();
		for(var scale = -1; scale <= 1; scale += 2) {
			c.moveTo(0, -0.3);
			c.lineTo(scale * 0.05, -0.2);
			c.lineTo(scale * 0.1, -0.225);
			c.lineTo(scale * 0.1, -0.275);
			c.lineTo(scale * 0.15, -0.175);
			c.lineTo(0, 0.3);

			c.moveTo(0, -0.15);
			c.lineTo(scale * 0.05, -0.1);
			c.lineTo(0, 0.1);
		}
		c.stroke();
	};*/
}
//RAPT.ShockHawk.prototype = new RAPT.HoveringEnemy;
RAPT.ShockHawk.prototype = Object.create( RAPT.HoveringEnemy.prototype );
//RAPT.ShockHawk.prototype.constructor = RAPT.ShockHawk;

RAPT.ShockHawk.prototype.getTarget = function() { return this.target === RAPT.gameState.playerB; }
RAPT.ShockHawk.prototype.setTarget = function(player) { this.target = player; }

RAPT.ShockHawk.prototype.avoidsSpawn = function() {
	if (this.chasing) return false;
	else return true;
}

RAPT.ShockHawk.prototype.move = function(seconds) {
	// Time independent version of multiplying by 0.998
	// solved x^0.01 = 0.998 for x very precisely using wolfram alpha
	this.velocity.inplaceMul(Math.pow(0.8185668046884278157989334904543296243702023236680159019579, seconds));
	if (!this.target || this.target.isDead()) {
		this.chasing = false;
		return this.accelerate(this.velocity.mul(-RAPT.SHOCK_HAWK_DECEL), seconds);
	}
	var relTargetPos = this.target.getCenter().sub(this.getCenter());
	if (relTargetPos.lengthSquared() > (RAPT.SHOCK_HAWK_RANGE * RAPT.SHOCK_HAWK_RANGE)) {
		this.chasing = false;
		return this.accelerate(this.velocity.mul(-RAPT.SHOCK_HAWK_DECEL), seconds);
	}
	this.chasing = true;
	relTargetPos.normalize();
	var accel = relTargetPos.mul(RAPT.SHOCK_HAWK_ACCEL);
	return this.accelerate(accel, seconds);
}

RAPT.ShockHawk.prototype.onDeath = function() {
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);
}

RAPT.ShockHawk.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	this.sprite.moveto(position);
	//this.bodySprite.offsetBeforeRotation = position;
	if(!this.target.isDead()) {
		
		this.sprite.group.rotation.z = this.target.getCenter().sub(position).atan2();
		//this.bodySprite.angle = this.target.getCenter().sub(position).atan2() - Math.PI / 2;
	}
}

RAPT.ShockHawk.prototype.draw = function(c) {
	/*c.fillStyle = (this.target == RAPT.gameState.playerA) ? 'red' : 'blue';
	c.strokeStyle = 'black';
	this.bodySprite.draw(c);*/
}
