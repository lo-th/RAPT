RAPT.STALACBAT_RADIUS = 0.2;
RAPT.STALACBAT_SPEED = 2;
//RAPT.STALACBAT_SPRITE_BODY = 0;
//RAPT.STALACBAT_SPRITE_LEFT_WING = 1;
//RAPT.STALACBAT_SPRITE_RIGHT_WING = 2;


RAPT.Stalacbat = function (center, target) {
	RAPT.FreefallEnemy.call(this, RAPT.ENEMY_STALACBAT, center, RAPT.STALACBAT_RADIUS, 0);

	this.target = target;
	this.isFalling = false;

	var cc = this.target.color +1

	this.sprite =  new RAPT.SpriteGroup({
		name:'stalacbat',
		material:RAPT.MAT_ENEMY,
		color:0X44CC00,
		nuv:16,
		list:['p1', 'w0', 'w1'],
		uvs:[[cc,1], [4,1], [5,1]],
	});

	this.sprite.moveto(center);
	this.startPosY = center.y;
	this.exp = false;
	
	

	/*this.sprites = [new RAPT.Sprite(), new RAPT.Sprite(), new RAPT.Sprite()];
	// Draw circle for body
	this.sprites[RAPT.STALACBAT_SPRITE_BODY].drawGeometry = function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		c.arc(0, 0, 0.1, 0, 2 * Math.PI, false);
		c.stroke();
		c.fill();
	}
	// Draw the two wings 
	this.sprites[RAPT.STALACBAT_SPRITE_LEFT_WING].drawGeometry = this.sprites[RAPT.STALACBAT_SPRITE_RIGHT_WING].drawGeometry = function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		c.arc(0, 0, 0.2, 0, Math.PI / 2, false);
		c.arc(0, 0, 0.15, Math.PI / 2, 0, true);
		c.stroke();

		c.beginPath();
		c.moveTo(0.07, 0.07);
		c.lineTo(0.1, 0.1);
		c.stroke();
	}

	this.sprites[RAPT.STALACBAT_SPRITE_LEFT_WING].setParent(this.sprites[RAPT.STALACBAT_SPRITE_BODY]);
	this.sprites[RAPT.STALACBAT_SPRITE_RIGHT_WING].setParent(this.sprites[RAPT.STALACBAT_SPRITE_BODY]);*/
}

//RAPT.Stalacbat.prototype = new RAPT.FreefallEnemy;
RAPT.Stalacbat.prototype = Object.create( RAPT.FreefallEnemy.prototype );

// Falls when the target is directly beneat it
RAPT.Stalacbat.prototype.move = function(seconds) {
	if (this.isFalling) {
		return RAPT.FreefallEnemy.prototype.move.call(this, seconds);
	} else if (this.target !== null && !this.target.isDead()) {
		var playerPos = this.target.getCenter();
		var pos = this.getCenter();
		if ((Math.abs(playerPos.x - pos.x) < 0.1) && (playerPos.y < pos.y)) {
			if (!RAPT.gameState.collider.lineOfSightWorld(pos, playerPos, RAPT.gameState.world)) {
				this.isFalling = true;
				return RAPT.FreefallEnemy.prototype.move.call(this, seconds);
			}
		}
	}
	return new RAPT.Vector(0, 0);
}

RAPT.Stalacbat.prototype.getTarget = function() {
	return this.target === RAPT.gameState.playerB;
}

RAPT.Stalacbat.prototype.afterTick = function(seconds) {
	var percent = this.velocity.y * -0.25;
	if (percent > 1) percent = 1;

	if(this.exp) return;

	var position = this.getCenter();
	//this.sprites[RAPT.STALACBAT_SPRITE_BODY].offsetBeforeRotation = new RAPT.Vector(position.x, position.y + 0.1 - 0.2 * percent);
	this.sprite.sprite[0].position.y = (position.y - 0.2 * percent)-this.startPosY;
	var angle = percent * RAPT.PI90;
	this.sprite.sprite[1].rotation.z =  angle;
	this.sprite.sprite[2].rotation.z =  -angle; //- Math.PI / 2;;//RAPT.randInRange(0, RAPT.TwoPI );
	
	//this.sprites[RAPT.STALACBAT_SPRITE_LEFT_WING].angle = Math.PI - angle;
	//this.sprites[RAPT.STALACBAT_SPRITE_RIGHT_WING].angle = angle - Math.PI / 2;
}

RAPT.Stalacbat.prototype.onDeath = function() {
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);
	this.exp = true;
	this.sprite.remove();

	var isRed = (this.target === RAPT.gameState.playerA) ? 0.8 : 0;
	var isBlue = (this.target === RAPT.gameState.playerB) ? 1 : 0;

	var position = this.getCenter();
	for (var i = 0; i < 15; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI)).mul(RAPT.randInRange(5, 10));
		RAPT.Particle().position(position).velocity(direction).radius(0.2).bounces(3).decay(0.01).elasticity(0.5).color(isRed, 0, isBlue, 1).triangle().fixangle();
	}
}

RAPT.Stalacbat.prototype.draw = function(c) {
	// Draw the colored "eye"
	//if (this.target === RAPT.gameState.playerA)  c.fillStyle = 'red';
	//else  c.fillStyle = 'blue';
	 
	// Draw the black wings
	//this.sprites[RAPT.STALACBAT_SPRITE_BODY].draw(c);
}
