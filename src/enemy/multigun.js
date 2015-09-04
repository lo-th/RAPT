RAPT.MULTI_GUN_WIDTH = .5;
RAPT.MULTI_GUN_HEIGHT = .5;
RAPT.MULTI_GUN_SHOOT_FREQ = 1.25;
RAPT.MULTI_GUN_RANGE = 8;

RAPT.MultiGun = function (center) {
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_MULTI_GUN, center, RAPT.MULTI_GUN_WIDTH, RAPT.MULTI_GUN_HEIGHT, 0, RAPT.MULTI_GUN_SHOOT_FREQ, 0);

	this.redGun = null;
	this.blueGun = null;
	this.gunFired = new Array(4);
	this.gunPositions = new Array(4);
	
	var pos = this.getCenter();
	this.redGun = new RAPT.Vector(pos.x, pos.y);
	this.blueGun = new RAPT.Vector(pos.x, pos.y);
	this.gunPositions[0] = this.hitBox.lowerLeft;
	this.gunPositions[1] = new RAPT.Vector(this.hitBox.getRight(), this.hitBox.getBottom());
	this.gunPositions[2] = new RAPT.Vector(this.hitBox.getLeft(), this.hitBox.getTop());
	this.gunPositions[3] = this.hitBox.lowerLeft.add(new RAPT.Vector(this.hitBox.getWidth(), this.hitBox.getHeight()));

	this.sprite =  new RAPT.SpriteGroup({
		name:'spikenall',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		list:['p1', 'p2', 'p3', 'p4'],
		//sizes: [ [1,0.5]  ],
		uvs:[[3,3], [4,3], [5,3], [6,3]]
	});

	this.sprite.moveto(center);
}

RAPT.MultiGun.prototype = Object.create( RAPT.SpawningEnemy.prototype );

RAPT.MultiGun.prototype.canCollide = function() {
	return false;
};

RAPT.MultiGun.prototype.vectorToIndex = function(v) {
	var indexX = (v.x < 0) ? 0 : 1;
	var indexY = (v.y < 0) ? 0 : 2;
	return indexX + indexY;
};

RAPT.MultiGun.prototype.spawn = function() {
	for (var i = 0; i < 4; ++i) {
		this.gunFired[i] = false;
	}

	var fired = false;
	for (var i = 0; i < 2; ++i) {
		var target = RAPT.gameState.getPlayer(i);
		var index = this.vectorToIndex(target.getCenter().sub(this.getCenter()));
		var relPosition = target.getCenter().sub(this.gunPositions[index]);
		// Player must be alive and in range to be shot
		if (!target.isDead() && relPosition.lengthSquared() < (RAPT.MULTI_GUN_RANGE * RAPT.MULTI_GUN_RANGE) &&
			!RAPT.gameState.collider.lineOfSightWorld(this.gunPositions[index], target.getCenter(), RAPT.gameState.world)) {
			if (!this.gunFired[index]) {
				RAPT.gameState.addEnemy(new RAPT.Laser(this.gunPositions[index], relPosition.atan2()), this.gunPositions[index]);
				this.gunFired[index] = true;
				fired = true;
			}
		}
	}
	return fired;
};

RAPT.MultiGun.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	var redGunTarget = this.gunPositions[this.vectorToIndex(RAPT.gameState.playerA.getCenter().sub(position))];
	var blueGunTarget = this.gunPositions[this.vectorToIndex(RAPT.gameState.playerB.getCenter().sub(position))];

	var speed = 4 * seconds;
	this.redGun.adjustTowardsTarget(redGunTarget, speed);
	this.blueGun.adjustTowardsTarget(blueGunTarget, speed);

	var angle = (this.redGun.sub(position)).atan2()-RAPT.PI90;
	this.sprite.sprite[1].rotation.z = angle
	this.sprite.sprite[2].rotation.z = angle;

	this.sprite.sprite[1].position.set(this.redGun.x-position.x, this.redGun.y-position.y,0);
	this.sprite.sprite[2].position.set(this.blueGun.x-position.x, this.blueGun.y-position.y,0);
};