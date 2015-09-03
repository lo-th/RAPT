RAPT.GRENADIER_WIDTH = .5;
RAPT.GRENADIER_HEIGHT = .5;
// Max speed at which a Grenadier can throw an enemy
RAPT.GRENADIER_RANGE = 8
RAPT.GRENADIER_SHOOT_FREQ = 1.2;


RAPT.Grenadier = function (center, target) {
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_GRENADIER, center, RAPT.GRENADIER_WIDTH, RAPT.GRENADIER_HEIGHT, 0, RAPT.GRENADIER_SHOOT_FREQ, RAPT.randInRange(0, RAPT.GRENADIER_SHOOT_FREQ));

	this.target = target;
	this.actualRecoilDistance = 0;
	this.targetRecoilDistance = 0;

	this.bodySprite = new RAPT.Sprite();
	this.bodySprite.drawGeometry = function(c) {
		var barrelLength = 0.25;
		var outerRadius = 0.25;
		var innerRadius = 0.175;

		c.beginPath();
		c.moveTo(-outerRadius, -barrelLength);
		c.lineTo(-innerRadius, -barrelLength);
		c.lineTo(-innerRadius, -0.02);
		c.lineTo(0, innerRadius);
		c.lineTo(innerRadius, -0.02);
		c.lineTo(innerRadius, -barrelLength);
		c.lineTo(outerRadius, -barrelLength);
		c.lineTo(outerRadius, 0);
		c.lineTo(0, outerRadius + 0.02);
		c.lineTo(-outerRadius, 0);
		c.closePath();
		c.fill();
		c.stroke();
	};
}

//RAPT.Grenadier.prototype = new RAPT.SpawningEnemy;
RAPT.Grenadier.prototype = Object.create( RAPT.SpawningEnemy.prototype );

RAPT.Grenadier.prototype.getTarget = function() {
	return this.target === RAPT.gameState.GetPlayerB();
};

RAPT.Grenadier.prototype.setTarget = function(player) {
	this.target = player;
};

RAPT.Grenadier.prototype.canCollide = function() {
	return false;
};

RAPT.Grenadier.prototype.spawn = function() {
	var targetDelta = this.target.getCenter().add(new RAPT.Vector(0, 3)).sub(this.getCenter());
	var direction = targetDelta.atan2();
	var distance = targetDelta.length();
	// If Player is out of range or out of line of sight, don't throw anything
	if (!this.target.isDead() && distance < RAPT.GRENADIER_RANGE) {
		if (!RAPT.gameState.collider.lineOfSightWorld(this.getCenter(), this.target.getCenter(), RAPT.gameState.world)) {
			this.targetRecoilDistance = distance * (0.6 / RAPT.GRENADIER_RANGE);
			RAPT.gameState.addEnemy(new RAPT.Grenade(this.getCenter(), direction, targetDelta.length()), this.getCenter());
			return true;
		}
	}
	return false;
};

RAPT.Grenadier.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	if(!this.target.isDead()) {
		this.bodySprite.angle = this.target.getCenter().add(new RAPT.Vector(0, 3)).sub(position).atan2() + Math.PI / 2;
	}
	this.bodySprite.offsetBeforeRotation = position;

	if (this.actualRecoilDistance < this.targetRecoilDistance) {
		this.actualRecoilDistance += 5 * seconds;
		if (this.actualRecoilDistance >= this.targetRecoilDistance) {
			this.actualRecoilDistance = this.targetRecoilDistance;
			this.targetRecoilDistance = 0;
		}
	} else {
		this.actualRecoilDistance -= 0.5 * seconds;
		if (this.actualRecoilDistance <= 0) {
			this.actualRecoilDistance = 0;
		}
	}

	this.bodySprite.offsetAfterRotation = new RAPT.Vector(0, this.actualRecoilDistance);
};

RAPT.Grenadier.prototype.draw = function(c) {
	c.fillStyle = (this.target == RAPT.gameState.playerA) ? 'red' : 'blue';
	c.strokeStyle = 'black';
	this.bodySprite.draw(c);
};
