//RAPT.SPIDER_LEG_HEIGHT = 0.5;

/*RAPT.SPIDER_BODY = 0;
RAPT.SPIDER_LEG1_TOP = 1;
RAPT.SPIDER_LEG2_TOP = 2;
RAPT.SPIDER_LEG3_TOP = 3;
RAPT.SPIDER_LEG4_TOP = 4;
RAPT.SPIDER_LEG5_TOP = 5;
RAPT.SPIDER_LEG6_TOP = 6;
RAPT.SPIDER_LEG7_TOP = 7;
RAPT.SPIDER_LEG8_TOP = 8;
RAPT.SPIDER_LEG1_BOTTOM = 9;
RAPT.SPIDER_LEG2_BOTTOM = 10;
RAPT.SPIDER_LEG3_BOTTOM = 11;
RAPT.SPIDER_LEG4_BOTTOM = 12;
RAPT.SPIDER_LEG5_BOTTOM = 13;
RAPT.SPIDER_LEG6_BOTTOM = 14;
RAPT.SPIDER_LEG7_BOTTOM = 15;
RAPT.SPIDER_LEG8_BOTTOM = 16;*/
RAPT.SPIDER_NUM_SPRITES = 17;

RAPT.spiderWalkingKeyframes = [
	new RAPT.Keyframe().add(0, -10, -20, -10, 10, -10, 10, -10, -20, 20, 10, 70, 20, 70, 20, 20, 10),
	new RAPT.Keyframe().add(0, 10, -10, -20, -10, -20, -10, 10, -10, 20, 20, 10, 70, 10, 70, 20, 20),
	new RAPT.Keyframe().add(0, -10, 10, -10, -20, -10, -20, -10, 10, 70, 20, 20, 10, 20, 10, 70, 20),
	new RAPT.Keyframe().add(0, -20, -10, 10, -10, 10, -10, -20, -10, 10, 70, 20, 20, 20, 20, 10, 70)
];

RAPT.spiderFallingKeyframes = [
	new RAPT.Keyframe().add(0, 7, 3, -1, -5, 5, 1, -3, -7, -14, -6, 2, 10, -10, -2, 6, 14),
	new RAPT.Keyframe().add(0, 30, 10, -30, -20, 30, 40, -10, -35, -50, -90, 40, 20, -50, -40, 70, 30)
];

RAPT.SPIDER_WIDTH = 0.9;
RAPT.SPIDER_HEIGHT = 0.3;
RAPT.SPIDER_SHOOT_FREQ = 2.0;
RAPT.SPIDER_SPEED = 1.0;
RAPT.SPIDER_ELASTICITY = 1.0;
RAPT.SPIDER_FLOOR_DIST = 1.0;
// Spiders can only see this many cells high
RAPT.SPIDER_SIGHT_HEIGHT = 10;

/*RAPT.drawSpiderBody = function (c) {
	var innerRadius = 0.5;
	c.beginPath();
	for(var i = 0; i <= 21; i++)
	{
		var angle = (0.25 + 0.5 * i / 21) * Math.PI;
		var radius = 0.6 + 0.05 * (i & 2);
		c.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius - 0.5);
	}
	for(var i = 21; i >= 0; i--)
	{
		var angle = (0.25 + 0.5 * i / 21) * Math.PI;
		c.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius - 0.5);
	}
	c.fill();
}

RAPT.drawSpiderLeg = function (c) {
	c.beginPath();
	c.moveTo(0, 0);
	c.lineTo(0, -RAPT.SPIDER_LEG_HEIGHT);
	c.stroke();
}

RAPT.createSpiderSprites = function () {
	var sprites = [];
	for(var i = 0; i < RAPT.SPIDER_NUM_SPRITES; i++) {
		sprites.push(new RAPT.Sprite());
		sprites[i].drawGeometry = (i == 0) ? RAPT.drawSpiderBody : RAPT.drawSpiderLeg;
	}

	for(var i = RAPT.SPIDER_LEG1_TOP; i <= RAPT.SPIDER_LEG8_TOP; i++) {
		sprites[i].setParent(sprites[RAPT.SPIDER_BODY]);
	}

	for(var i = RAPT.SPIDER_LEG1_BOTTOM; i <= RAPT.SPIDER_LEG8_BOTTOM; i++) {
		sprites[i].setParent(sprites[i - RAPT.SPIDER_LEG1_BOTTOM + RAPT.SPIDER_LEG1_TOP]);
	}

	sprites[RAPT.SPIDER_LEG1_TOP].offsetBeforeRotation = new RAPT.Vector(RAPT.SPIDER_WIDTH * 0.35, 0);
	sprites[RAPT.SPIDER_LEG2_TOP].offsetBeforeRotation = new RAPT.Vector(RAPT.SPIDER_WIDTH * 0.15, 0);
	sprites[RAPT.SPIDER_LEG3_TOP].offsetBeforeRotation = new RAPT.Vector(RAPT.SPIDER_WIDTH * -0.05, 0);
	sprites[RAPT.SPIDER_LEG4_TOP].offsetBeforeRotation = new RAPT.Vector(RAPT.SPIDER_WIDTH * -0.25, 0);

	sprites[RAPT.SPIDER_LEG5_TOP].offsetBeforeRotation = new RAPT.Vector(RAPT.SPIDER_WIDTH * 0.25, 0);
	sprites[RAPT.SPIDER_LEG6_TOP].offsetBeforeRotation = new RAPT.Vector(RAPT.SPIDER_WIDTH * 0.05, 0);
	sprites[RAPT.SPIDER_LEG7_TOP].offsetBeforeRotation = new RAPT.Vector(RAPT.SPIDER_WIDTH * -0.15, 0);
	sprites[RAPT.SPIDER_LEG8_TOP].offsetBeforeRotation = new RAPT.Vector(RAPT.SPIDER_WIDTH * -0.35, 0);

	for(var i = RAPT.SPIDER_LEG1_BOTTOM; i <= RAPT.SPIDER_LEG8_BOTTOM; i++)
		sprites[i].offsetBeforeRotation = new RAPT.Vector(0, -RAPT.SPIDER_LEG_HEIGHT);

	return sprites;
}*/

RAPT.RocketSpider = function (center, angle) {
	//SpawningEnemy.prototype.constructor.call(this, ENEMY_ROCKET_SPIDER, center.add(new Vector(0, 0.81 - SPIDER_LEGS_RADIUS + SPIDER_HEIGHT * 0.5)),
					//  SPIDER_WIDTH, SPIDER_HEIGHT, SPIDER_ELASTICITY, SPIDER_SHOOT_FREQ, 0);
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_ROCKET_SPIDER, center.add(new RAPT.Vector(0, 0.81 - RAPT.SPIDER_LEGS_RADIUS + RAPT.SPIDER_HEIGHT * 0.5)),
					  RAPT.SPIDER_WIDTH, RAPT.SPIDER_HEIGHT, RAPT.SPIDER_ELASTICITY, RAPT.SPIDER_SHOOT_FREQ, 0);
	this.leftChasesA = true;
	this.leftSpawnPoint = new RAPT.Vector(0, 0);
	this.rightSpawnPoint = new RAPT.Vector(0, 0);
	this.timeSinceStart = 0;
	this.legs = new RAPT.RocketSpiderLegs(center, angle, this);
	RAPT.gameState.addEnemy(this.legs, this.legs.getShape().getCenter());

	//this.sprites = RAPT.createSpiderSprites();

	this.sprite =  new RAPT.SpriteGroup({
		name:'roketspider',
		material:RAPT.MAT_ENEMY,
		size : 1,
		uvs:[[0,4],
		     [1,4], [1,4], [1,4], [1,4], [1,4], [1,4], [1,4], [1,4],
		     [2,4], [2,4], [2,4], [2,4], [2,4], [2,4], [2,4], [2,4]
		],
		nuv:16,
		color:0X44CC66,
		list:['body', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8'],
		parent:['' , 'body', 'body', 'body', 'body', 'body', 'body', 'body', 'body', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
		pos:   [ [0,0,0] ,
		         [0.35,0,-1],[0.15,0,-1],[-0.05,0,-1],[-0.25,0,-1],[0.25,0,-1],[0.05,0,-1],[-0.15,0,-1],[-0.35,0,-1],
		         [0,-0.5,-2],[0,-0.5,-2],[0,-0.5,-2],[0,-0.5,-2], [0,-0.5,-2],[0,-0.5,-2],[0,-0.5,-2],[0,-0.5,-2]    
		],
		center:[ [0,0], 
		         [0,-0.25], [0,-0.25], [0,-0.25], [0,-0.25], [0,-0.25], [0,-0.25], [0,-0.25], [0,-0.25],
		         [0,-0.25], [0,-0.25]  , [0,-0.25] , [0,-0.25], [0,-0.25], [0,-0.25]  , [0,-0.25] , [0,-0.25]
		],
		//sizes: [ [1,1],  [0.5,0.5], [0.5,0.5], [0.5,0.5], [0.5,0.5], [0.5,0.5] ,[0.5,0.5], [0.5,0.5], [0.5,0.5]    ]
	});
	this.sprite.moveto(center);
	
	// spiders periodically "twitch" when their animation resets because the
	// collision detection doesn't see them as on the floor, so only change
	// to a falling animation if we haven't been on the floor for a few ticks
	this.animationDelay = 0;
	this.animationIsOnFloor = 0;
}

//RAPT.RocketSpider.prototype = new RAPT.SpawningEnemy;
RAPT.RocketSpider.prototype = Object.create( RAPT.SpawningEnemy.prototype );


RAPT.RocketSpider.prototype.canCollide = function() { return false; }

// Returns true iff the target is in the spider's sight line
RAPT.RocketSpider.prototype.playerInSight = function(target) {
	if (target.isDead()) return false;
	var relativePos = target.getCenter().sub(this.getCenter());
	var relativeAngle = relativePos.atan2();
	// Player needs to be within a certain height range, in the line of sight, and between the angle of pi/4 and 3pi/4
	if (relativePos.y < RAPT.SPIDER_SIGHT_HEIGHT && (relativeAngle > Math.PI * .25) && (relativeAngle < Math.PI * .75)) {
		return (!RAPT.gameState.collider.lineOfSightWorld(this.getCenter(), target.getCenter(), RAPT.gameState.world));
	}
	return false;
}

RAPT.RocketSpider.prototype.spawnRocket = function(loc, target, angle) {
	RAPT.gameState.addEnemy(new RAPT.Rocket(loc, target, angle), this.getCenter());
}

// When either Player is above the cone of sight extending above the spider, shoot
RAPT.RocketSpider.prototype.spawn = function() {
	var center = this.getCenter();
	this.leftSpawnPoint = new RAPT.Vector(center.x - RAPT.SPIDER_WIDTH * .4, center.y + RAPT.SPIDER_HEIGHT * .4);
	this.rightSpawnPoint = new RAPT.Vector(center.x + RAPT.SPIDER_WIDTH * .4, center.y + RAPT.SPIDER_HEIGHT * .4);

	if (this.playerInSight(RAPT.gameState.playerA)) {
		if (this.playerInSight(RAPT.gameState.playerB)) {
			this.spawnRocket(this.leftChasesA ? this.leftSpawnPoint : this.rightSpawnPoint, RAPT.gameState.playerA, this.leftChasesA ? Math.PI * .75 : Math.PI * .25);
			this.spawnRocket(this.leftChasesA ? this.rightSpawnPoint : this.leftSpawnPoint, RAPT.gameState.playerB, this.leftChasesA ? Math.PI * .25 : Math.PI * .75);
			this.leftChasesA = !this.leftChasesA;
			return true;
		} else {
			this.spawnRocket(this.leftSpawnPoint, RAPT.gameState.playerA, Math.PI * .75);
			this.spawnRocket(this.rightSpawnPoint, RAPT.gameState.playerA, Math.PI * .25);
			return true;
		}
	} else if (this.playerInSight(RAPT.gameState.playerB)) {
		this.spawnRocket(this.leftSpawnPoint, RAPT.gameState.playerB, Math.PI * .75);
		this.spawnRocket(this.rightSpawnPoint, RAPT.gameState.playerB, Math.PI * .25);
		return true;
	}
	return false;
}

// Rocket spiders hover slowly over the floor, bouncing off walls with elasticity 1
RAPT.RocketSpider.prototype.move = function(seconds) {
	// The height difference is h = player_height - SPIDER_LEGS_RADIUS + SPIDER_HEIGHT / 2
	return this.legs.getCenter().sub(this.getCenter()).add(new RAPT.Vector(0, 0.81 - RAPT.SPIDER_LEGS_RADIUS + RAPT.SPIDER_HEIGHT * 0.5));
}

RAPT.RocketSpider.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	//this.sprites[RAPT.SPIDER_BODY].offsetBeforeRotation = position;
	//this.sprites[RAPT.SPIDER_BODY].flip = (this.legs.velocity.x > 0);

	this.sprite.moveto(position);
	this.sprite.flip((this.legs.velocity.x < 0))

	// work out whether the spider is on the floor (walking animation) or in the air (falling animation)
	var isOnFloor = this.legs.isOnFloor();
	if (isOnFloor != this.animationIsOnFloor) {
		// wait 1 tick before changing the animation to avoid "twitching"
		if (++this.animationDelay > 1) {
			this.animationIsOnFloor = isOnFloor;
			this.animationDelay = 0;
		}
	} else {
		this.animationDelay = 0;
	}

	this.timeSinceStart += seconds * 0.5;
	var frame;
	if(!this.animationIsOnFloor){
		var percent = this.legs.velocity.y * -0.25;
		percent = (percent < 0.01) ? 0 : 1 - 1 / (1 + percent);
		frame = RAPT.spiderFallingKeyframes[0].lerpWith(RAPT.spiderFallingKeyframes[1], percent);
	}
	else frame = new RAPT.Keyframe().lerp(RAPT.spiderWalkingKeyframes, 10 * this.timeSinceStart);

	for(var i = 0; i < RAPT.SPIDER_NUM_SPRITES; i++) {
		//this.sprites[i].angle = frame.angles[i];
		this.sprite.sprite[i].rotation.z = frame.angles[i];
	}
}

// The body of the Spider kills the player
RAPT.RocketSpider.prototype.reactToPlayer = function(player) {
	player.setDead(true);
}

RAPT.RocketSpider.prototype.onDeath = function() {
	// don't add this death to the stats because it is added in the legs OnDeath() method

	// add something that looks like the body
	//RAPT.Particle().position(this.getCenter()).bounces(1).gravity(5).decay(0.1).custom(RAPT.drawSpiderBody).color(0, 0, 0, 1).angle(0).angularVelocity(RAPT.randInRange(-Math.PI, Math.PI));
	RAPT.Particle().position(this.getCenter()).bounces(1).gravity(5).decay(0.1).customSprite(this.sprite).color(0, 0, 0, 1).angle(0).angularVelocity(RAPT.randInRange(-Math.PI, Math.PI));

	// TODO explode real sprite
	this.sprite.remove();
}

RAPT.RocketSpider.prototype.draw = function(c) {
	//c.strokeStyle = 'black';
	//c.fillStyle = 'black';
	//this.sprites[RAPT.SPIDER_BODY].draw(c);
}
