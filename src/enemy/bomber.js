RAPT.BOMBER_WIDTH = .4;
RAPT.BOMBER_HEIGHT = .4;
RAPT.BOMBER_SPEED = 2;
// Frequency is in seconds
RAPT.BOMB_FREQUENCY = 1.0;
RAPT.BOMBER_ELASTICITY = 1.0;
RAPT.BOMBER_EXPLOSION_POWER = 6;

RAPT.Bomber = function (center, angle) {
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_BOMBER, center, RAPT.BOMBER_WIDTH, RAPT.BOMBER_HEIGHT, RAPT.BOMBER_ELASTICITY, RAPT.BOMB_FREQUENCY, RAPT.randInRange(0, RAPT.BOMB_FREQUENCY));

	if (angle < Math.PI * 0.25) this.setVelocity(new RAPT.Vector(RAPT.BOMBER_SPEED, 0));
	else if (angle < Math.PI * 0.75) this.setVelocity(new RAPT.Vector(0, RAPT.BOMBER_SPEED));
	else if (angle < Math.PI * 1.25) this.setVelocity(new RAPT.Vector(-RAPT.BOMBER_SPEED, 0));
	else if (angle < Math.PI * 1.75) this.setVelocity(new RAPT.Vector(0, -RAPT.BOMBER_SPEED));
	else this.setVelocity(new RAPT.Vector(RAPT.BOMBER_SPEED, 0));

	this.sprite =  new RAPT.SpriteGroup({
		name:'bomber',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[5,0], [6,0]],

		list:['body', 'bombe1'],
		//sizes: [ [0.8,0.8] ]
		//pos:[[-0.2,-0.2], [0.2,0.2]]
	});

	this.sprite.moveto(center);
	this.startPosY = center.y;
}

//RAPT.Bomber.prototype = new RAPT.SpawningEnemy;
RAPT.Bomber.prototype = Object.create( RAPT.SpawningEnemy.prototype );
//RAPT.Bomber.prototype.constructor = RAPT.Bomber;

RAPT.Bomber.prototype.move = function(seconds) {
	return this.velocity.mul(seconds);
};

RAPT.Bomber.prototype.reactToPlayer = function(player) {
	var relativePos = player.getCenter().sub(this.getCenter());
	// If player jumps on top of the Bomber, it explodes
	if (relativePos.y > (RAPT.BOMBER_HEIGHT - .05)) {
		player.setVelocity(new RAPT.Vector(player.getVelocity().x, RAPT.BOMBER_EXPLOSION_POWER));
		this.setDead(true);
	} else if (player.isSuperJumping) {
		this.setDead(true);
	} else {
		player.setDead(true);
	}
};

RAPT.Bomber.prototype.spawn = function() {
	var spawnPoint = new RAPT.Vector(this.hitBox.lowerLeft.x + this.hitBox.getWidth() * 0.5, this.hitBox.getBottom());
	RAPT.gameState.addEnemy(new RAPT.Bomb(spawnPoint, new RAPT.Vector(0, Math.min(this.velocity.y, -.3))), spawnPoint);
	return true;
};

RAPT.Bomber.prototype.afterTick = function() {
	// drawing stuff
	var pos = this.getCenter();
	this.sprite.moveto(pos);
	
	var sc = 1 * this.getReloadPercentage();
	this.sprite.sprite[1].scale.set(sc,sc,sc);
};

RAPT.Bomber.prototype.onDeath = function() {
	this.sprite.remove();
	RAPT.Bomb.prototype.onDeath.call(this);
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);
};