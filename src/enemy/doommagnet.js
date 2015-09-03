RAPT.DOOM_MAGNET_RADIUS = .3;
RAPT.DOOM_MAGNET_ELASTICITY = 0.5;
RAPT.DOOM_MAGNET_RANGE = 10;
RAPT.DOOM_MAGNET_ACCEL = 2;
RAPT.MAGNET_MAX_ROTATION = 2 * Math.PI;

RAPT.DoomMagnet = function(center) {
	RAPT.RotatingEnemy.call(this, RAPT.ENEMY_MAGNET, center, RAPT.DOOM_MAGNET_RADIUS, 0, RAPT.DOOM_MAGNET_ELASTICITY);

	this.sprite =  new RAPT.SpriteGroup({
		name:'doommagnet',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[0,2]],
		color:0XFFCC00,

		list:['p1'],
		sizes: [ [0.8,0.8] ]
	});

	this.sprite.moveto(center);

	/*this.bodySprite = new RAPT.Sprite();
	this.bodySprite.drawGeometry = function(c) {
		var length = 0.15;
		var outerRadius = 0.15;
		var innerRadius = 0.05;

		for (var scale = -1; scale <= 1; scale += 2) {
			c.fillStyle = 'red';
			c.beginPath();
			c.moveTo(-outerRadius - length, scale * innerRadius);
			c.lineTo(-outerRadius - length, scale * outerRadius);
			c.lineTo(-outerRadius - length + (outerRadius - innerRadius), scale * outerRadius);
			c.lineTo(-outerRadius - length + (outerRadius - innerRadius), scale * innerRadius);
			c.fill();

			c.fillStyle = 'blue';
			c.beginPath();
			c.moveTo(outerRadius + length, scale * innerRadius);
			c.lineTo(outerRadius + length, scale * outerRadius);
			c.lineTo(outerRadius + length - (outerRadius - innerRadius), scale * outerRadius);
			c.lineTo(outerRadius + length - (outerRadius - innerRadius), scale * innerRadius);
			c.fill();
		}
		c.strokeStyle = 'black';

		// draw one prong of the magnet 
		c.beginPath();
		c.arc(outerRadius, 0, outerRadius, 1.5 * Math.PI, 0.5 * Math.PI, true);
		c.lineTo(outerRadius + length, outerRadius);
		c.lineTo(outerRadius + length, innerRadius);

		c.arc(outerRadius, 0, innerRadius, 0.5 * Math.PI, 1.5 * Math.PI, false);
		c.lineTo(outerRadius + length, -innerRadius);
		c.lineTo(outerRadius + length, -outerRadius);
		c.lineTo(outerRadius, -outerRadius);
		c.stroke();

		// other prong
		c.beginPath();
		c.arc(-outerRadius, 0, outerRadius, 1.5 * Math.PI, 2.5 * Math.PI, false);
		c.lineTo(-outerRadius - length, outerRadius);
		c.lineTo(-outerRadius - length, innerRadius);

		c.arc(-outerRadius, 0, innerRadius, 2.5 * Math.PI, 1.5 * Math.PI, true);
		c.lineTo(-outerRadius - length, -innerRadius);
		c.lineTo(-outerRadius - length, -outerRadius);
		c.lineTo(-outerRadius, -outerRadius);
		c.stroke();
	}*/
}

//RAPT.DoomMagnet.prototype = new RAPT.RotatingEnemy;
RAPT.DoomMagnet.prototype = Object.create( RAPT.RotatingEnemy.prototype );
//RAPT.DoomMagnet.prototype.constructor = RAPT.DoomMagnet;

RAPT.DoomMagnet.prototype.avoidsSpawn = function() { 
	return true;
};

RAPT.DoomMagnet.prototype.calcHeadingVector = function(target) {
	if (target.isDead()) return new RAPT.Vector(0, 0);
	var delta = target.getCenter().sub(this.getCenter());
	if (delta.lengthSquared() > (RAPT.DOOM_MAGNET_RANGE * RAPT.DOOM_MAGNET_RANGE)) return new RAPT.Vector(0, 0);
	delta.normalize();
	return delta;
};

RAPT.DoomMagnet.prototype.move = function(seconds) {
	var playerA = RAPT.gameState.playerA;
	var playerB = RAPT.gameState.playerB;

	var headingA = this.calcHeadingVector(playerA);
	var headingB = this.calcHeadingVector(playerB);
	var heading = (headingA.add(headingB)).mul(RAPT.DOOM_MAGNET_ACCEL);

	var delta = this.accelerate(heading, seconds);
	// Time independent version of mulitiplying by 0.994
	this.velocity.inplaceMul(Math.pow(0.547821, seconds));

	var center = this.getCenter();
	var oldAngle = this.sprite.group.rotation.z;//this.bodySprite.angle;
	var targetAngle = oldAngle;
	if(!playerA.isDead() && playerB.isDead()) {
		targetAngle = (playerA.getCenter().sub(center)).atan2() + Math.PI;
	} else if (playerA.isDead() && !playerB.isDead()) {
		targetAngle = (playerB.getCenter().sub(center)).atan2();
	} else if (!playerA.isDead() && !playerB.isDead()) {
		var needsFlip = (playerA.getCenter().sub(center).flip().dot(playerB.getCenter().sub(center)) < 0);
		targetAngle = heading.atan2() - Math.PI * 0.5 + Math.PI * needsFlip;
	}
	//this.bodySprite.angle = RAPT.adjustAngleToTarget(oldAngle, targetAngle, RAPT.MAGNET_MAX_ROTATION * seconds);

	
	this.sprite.group.rotation.z = RAPT.adjustAngleToTarget(oldAngle, targetAngle, RAPT.MAGNET_MAX_ROTATION * seconds);

	return delta;
};

RAPT.DoomMagnet.prototype.afterTick = function(seconds) {
	this.sprite.moveto( this.getCenter());
	//var position = this.getCenter();
	//this.bodySprite.offsetBeforeRotation = new RAPT.Vector(position.x, position.y);
};

RAPT.DoomMagnet.prototype.draw = function(c) {
	//this.bodySprite.draw(c);
};
