RAPT.WALL_CRAWLER_SPEED = 1;
RAPT.WALL_CRAWLER_RADIUS = 0.25;
RAPT.PULL_FACTOR = 0.9;
RAPT.PUSH_FACTOR = 0.11;

RAPT.WallCrawler = function (center, direction) {
	RAPT.WalkingEnemy.call(this, RAPT.ENEMY_CRAWLER, center, RAPT.WALL_CRAWLER_RADIUS, 0);

	this.sprite =  new RAPT.SpriteGroup({
		name:'wallcrawler',
		material:RAPT.MAT_ENEMY,
		size : 1,
		uvs:[[1,1]],
		nuv:16,
		color:0X44CC66,
		list:['p1'],
		sizes:[ [0.7,0.7]  ],
		//center:[ [-0.125,-0.125]  ]
	});

	this.firstTick = true;
	this.clockwise = false;
	this.velocity = new RAPT.Vector(Math.cos(direction), Math.sin(direction));

	/*this.bodySprite = new RAPT.Sprite();
	this.bodySprite.drawGeometry = function(c) {
		var space = 0.15;
		c.fillStyle = 'black';
		c.strokeStyle = 'black';
		c.beginPath(); c.arc(0, 0, 0.25, Math.PI * 0.25 + space, Math.PI * 0.75 - space, false); c.stroke();
		c.beginPath(); c.arc(0, 0, 0.25, Math.PI * 0.75 + space, Math.PI * 1.25 - space, false); c.stroke();
		c.beginPath(); c.arc(0, 0, 0.25, Math.PI * 1.25 + space, Math.PI * 1.75 - space, false); c.stroke();
		c.beginPath(); c.arc(0, 0, 0.25, Math.PI * 1.75 + space, Math.PI * 2.25 - space, false); c.stroke();
		c.beginPath(); c.arc(0, 0, 0.15, 0, 2*Math.PI, false); c.stroke();
		c.beginPath();
		c.moveTo(0.15, 0); c.lineTo(0.25, 0);
		c.moveTo(0, 0.15); c.lineTo(0, 0.25);
		c.moveTo(-0.15, 0); c.lineTo(-0.25, 0);
		c.moveTo(0, -0.15); c.lineTo(0, -0.25);
		c.stroke();
		c.beginPath(); c.arc(0, 0, 0.05, 0, 2*Math.PI, false); c.fill();
	};*/
}

//RAPT.WallCrawler.prototype = new RAPT.WalkingEnemy;
RAPT.WallCrawler.prototype = Object.create( RAPT.WalkingEnemy.prototype );
//RAPT.WallCrawler.prototype.constructor = RAPT.WallCrawler;

// Rotates about the closest point in the world
RAPT.WallCrawler.prototype.move = function(seconds) {
	var ref_shapePoint = {};
	var ref_worldPoint = {};
	var closestPointDist = RAPT.gameState.collider.closestToEntityWorld(this, 2, ref_shapePoint, ref_worldPoint, RAPT.gameState.world);

	if (closestPointDist < Number.POSITIVE_INFINITY) {
		var delta = this.getCenter().sub(ref_worldPoint.ref);
		// Make sure it doesn't get too far away or get stuck in corners
		var flip = delta.flip();

		if (this.firstTick) {
			if (this.velocity.dot(flip) < 0) this.clockwise = true;
			else this.clockwise = false;
			this.firstTick = false;
		}
		if (delta.lengthSquared() > (RAPT.WALL_CRAWLER_RADIUS * RAPT.WALL_CRAWLER_RADIUS * 1.1)) {
			// Pull the crawler towards the wall
			if (this.clockwise) this.velocity = flip.mul(-1).sub(delta.mul(RAPT.PULL_FACTOR));
			else this.velocity = flip.sub(delta.mul(RAPT.PULL_FACTOR));
		} else {
			// Push the crawler away from the wall
			if (this.clockwise) this.velocity = flip.mul(-1).add(delta.mul(RAPT.PUSH_FACTOR));
			else this.velocity = flip.add(delta.mul(RAPT.PUSH_FACTOR));
		}
		this.velocity.normalize();
	}

	

	return this.velocity.mul(RAPT.WALL_CRAWLER_SPEED * seconds);
};

RAPT.WallCrawler.prototype.afterTick = function(seconds) {
	var deltaAngle = RAPT.WALL_CRAWLER_SPEED / RAPT.WALL_CRAWLER_RADIUS * seconds;
	/*this.bodySprite.offsetBeforeRotation = this.getCenter();
	if (this.clockwise) this.bodySprite.angle += deltaAngle;
	else this.bodySprite.angle -= deltaAngle;*/

    this.sprite.moveto(this.getCenter());
    if (this.clockwise) this.sprite.group.rotation.z += deltaAngle;
	else this.sprite.group.rotation.z -= deltaAngle;
};

RAPT.WallCrawler.prototype.draw = function(c) {
	//this.bodySprite.draw(c);
};
