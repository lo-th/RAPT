RAPT.GOLDEN_COG_RADIUS = 0.25;

RAPT.GoldenCog = function (center) {
	RAPT.Enemy.call(this, -1, 0);

	this.sprite =  new RAPT.SpriteGroup({
		name:'goldencog',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[15,0]],
		color:0XFFCC00,
		list:['p1'],
		//sizes: [ [1,0.5]  ]
	});

	this.sprite.move(center.x, center.y);

	this.hitCircle = new RAPT.Circle(center, RAPT.GOLDEN_COG_RADIUS);
	this.timeSinceStart = 0;

	RAPT.gameState.incrementStat(RAPT.STAT_NUM_COGS);
}

//RAPT.GoldenCog.prototype = new RAPT.Enemy;
RAPT.GoldenCog.prototype = Object.create( RAPT.Enemy.prototype );

RAPT.GoldenCog.prototype.getShape = function() {
	return this.hitCircle;
};

RAPT.GoldenCog.prototype.reactToPlayer = function(player) {
	this.setDead(true);
};

RAPT.GoldenCog.prototype.onDeath = function() {
	if (RAPT.gameState.gameStatus === RAPT.GAME_IN_PLAY) {
		RAPT.gameState.incrementStat(RAPT.STAT_COGS_COLLECTED);
	}

	this.sprite.remove();

	// Golden particle goodness
	var position = this.getCenter();
	for (var i = 0; i < 100; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = this.velocity.add(direction.mul(RAPT.randInRange(1, 5)));

		//RAPT.Particle().position(position).velocity(direction).radius(0.01, 1.5).bounces(0, 4).elasticity(0.05, 0.9).decay(0.01, 0.5).color(0.9, 0.87, 0, 1).mixColor(1, 0.96, 0, 1).triangle().fixangle();
		RAPT.Particle().position(position).velocity(direction).radius(0.01, 0.05).bounces(0, 4).elasticity(0.05, 0.9).decay(0.01, 0.5).color(0.9, 0.87, 0, 1).mixColor(1, 0.96, 0, 1).triangle().fixangle();
	}
};

RAPT.GoldenCog.prototype.afterTick = function(seconds) {
	this.sprite.group.rotation.z += seconds;
	//this.timeSinceStart += seconds;
};

RAPT.GoldenCog.prototype.draw = function(c) {
	var position = this.getCenter();
	RAPT.drawGoldenCog(c, position.x, position.y, this.timeSinceStart);
};