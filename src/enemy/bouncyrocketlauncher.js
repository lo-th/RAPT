RAPT.BOUNCY_LAUNCHER_WIDTH = .5;
RAPT.BOUNCY_LAUNCHER_HEIGHT = .5;
RAPT.BOUNCY_LAUNCHER_SHOOT_FREQ = 1;
RAPT.BOUNCY_LAUNCHER_RANGE = 8;

RAPT.BouncyRocketLauncher = function (center, target) {
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_BOUNCY_ROCKET_LAUNCHER, center, RAPT.BOUNCY_LAUNCHER_WIDTH, RAPT.BOUNCY_LAUNCHER_HEIGHT, 0, RAPT.BOUNCY_LAUNCHER_SHOOT_FREQ, 0);
	
	this.target = target;
	this.canFire = true;
	this.angle = 0;

	this.bodySprite = new RAPT.Sprite();
	if (this.target === RAPT.gameState.playerA) {
		this.bodySprite.drawGeometry = function(c) {
			// End of gun
			c.strokeStyle = 'black';
			c.beginPath();
			c.moveTo(0, -0.1);
			c.lineTo(-0.3, -0.1);
			c.lineTo(-0.3, 0.1);
			c.lineTo(0, 0 + 0.1);
			c.stroke();

			// Main body
			c.fillStyle = 'red';
			c.beginPath();
			c.arc(0, 0, 0.2, 0, 2 * Math.PI, false);
			c.fill();
			c.fillStyle = 'blue';
			c.beginPath();
			c.arc(0, 0, 0.2, 1.65 * Math.PI, 2.35 * Math.PI, false);
			c.fill();

			c.strokeStyle = 'black';
			c.beginPath();
			c.arc(0, 0, 0.2, 0, 2 * Math.PI, false);
			c.stroke();
			
			c.beginPath();
			c.moveTo(0.1, -0.18);
			c.lineTo(0.1, 0.18);
			c.stroke();
		}
	} else {
		this.bodySprite.drawGeometry = function(c) {
			// End of gun
			c.strokeStyle = 'black';
			c.beginPath();
			c.moveTo(0, -0.1);
			c.lineTo(-0.3, -0.1);
			c.lineTo(-0.3, 0.1);
			c.lineTo(0, 0 + 0.1);
			c.stroke();

			// Main body
			c.fillStyle = 'blue';
			c.beginPath();
			c.arc(0, 0, 0.2, 0, 2 * Math.PI, false);
			c.fill();
			c.fillStyle = 'red';
			c.beginPath();
			c.arc(0, 0, 0.2, 1.65 * Math.PI, 2.35 * Math.PI, false);
			c.fill();

			c.strokeStyle = 'black';
			c.beginPath();
			c.arc(0, 0, 0.2, 0, 2 * Math.PI, false);
			c.stroke();

			c.fillStyle = 'black';
			c.beginPath();
			c.moveTo(0.1, -0.18);
			c.lineTo(0.1, 0.18);
			c.stroke();
		}
	}
}

//RAPT.BouncyRocketLauncher.prototype = new RAPT.SpawningEnemy;
RAPT.BouncyRocketLauncher.prototype = Object.create( RAPT.SpawningEnemy.prototype );
//RAPT.BouncyRocketLauncher.prototype.constructor = RAPT.BouncyRocketLauncher;

RAPT.BouncyRocketLauncher.prototype.setTarget = function(player) { this.target = player; }

RAPT.BouncyRocketLauncher.prototype.canCollide = function() { return false; }

RAPT.BouncyRocketLauncher.prototype.rocketDestroyed = function() { this.canFire = true; }

RAPT.BouncyRocketLauncher.prototype.getTarget = function() { return this.target === RAPT.gameState.playerB; }

RAPT.BouncyRocketLauncher.prototype.spawn = function() {
	if (this.canFire && !this.target.isDead()) {
		var targetDelta = this.target.getCenter().sub(this.getCenter());
		// If Player is out of range or out of line of sight, don't launch anything
		if (targetDelta.length() < RAPT.BOUNCY_LAUNCHER_RANGE) {
			if (!RAPT.gameState.collider.lineOfSightWorld(this.getCenter(), this.target.getCenter(), RAPT.gameState.world))
			{
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
		this.bodySprite.angle = (position.sub(this.target.getCenter())).atan2();
	}
	this.bodySprite.offsetBeforeRotation = position;
}

RAPT.BouncyRocketLauncher.prototype.draw = function(c) {
	this.bodySprite.draw(c);
}
