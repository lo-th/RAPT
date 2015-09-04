RAPT.BOUNCY_LAUNCHER_WIDTH = .5;
RAPT.BOUNCY_LAUNCHER_HEIGHT = .5;
RAPT.BOUNCY_LAUNCHER_SHOOT_FREQ = 1;
RAPT.BOUNCY_LAUNCHER_RANGE = 8;

RAPT.BouncyRocketLauncher = function (center, target) {
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_BOUNCY_ROCKET_LAUNCHER, center, RAPT.BOUNCY_LAUNCHER_WIDTH, RAPT.BOUNCY_LAUNCHER_HEIGHT, 0, RAPT.BOUNCY_LAUNCHER_SHOOT_FREQ, 0);
	
	this.target = target;
	this.canFire = true;
	this.angle = 0;

	var cc = this.target.color;
	this.sprite =  new RAPT.SpriteGroup({
		name:'bouncyrocketlaunch',
		material:RAPT.MAT_ENEMY,
		size:1,
		nuv:16,
		uvs:[[cc+7,1]],
		list:['p1']
	});

	this.sprite.moveto(center);
}

//RAPT.BouncyRocketLauncher.prototype = new RAPT.SpawningEnemy;
RAPT.BouncyRocketLauncher.prototype = Object.create( RAPT.SpawningEnemy.prototype );

RAPT.BouncyRocketLauncher.prototype.setTarget = function(player) { this.target = player; }

RAPT.BouncyRocketLauncher.prototype.canCollide = function() { return false; }

RAPT.BouncyRocketLauncher.prototype.rocketDestroyed = function() { this.canFire = true; }

RAPT.BouncyRocketLauncher.prototype.getTarget = function() { return this.target === RAPT.gameState.playerB; }

RAPT.BouncyRocketLauncher.prototype.spawn = function() {
	if (this.canFire && !this.target.isDead()) {
		var targetDelta = this.target.getCenter().sub(this.getCenter());
		// If Player is out of range or out of line of sight, don't launch anything
		if (targetDelta.length() < RAPT.BOUNCY_LAUNCHER_RANGE) {
			if (!RAPT.gameState.collider.lineOfSightWorld(this.getCenter(), this.target.getCenter(), RAPT.gameState.world)) {
				RAPT.gameState.addEnemy(new RAPT.BouncyRocket(this.getCenter(), this.target, targetDelta.atan2(), this), this.getCenter());
				this.canFire = false;
				return true;
			}
		}
	}
	return false;
}

RAPT.BouncyRocketLauncher.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	if (!this.target.isDead()) {
		this.sprite.group.rotation.z = (position.sub(this.target.getCenter())).atan2();
		//this.bodySprite.angle = (position.sub(this.target.getCenter())).atan2();
	}
	//this.bodySprite.offsetBeforeRotation = position;

	this.sprite.moveto(position);
}