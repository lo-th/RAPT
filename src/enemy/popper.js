//RAPT.LEG_LENGTH = 0.3;

/*RAPT.POPPER_BODY = 0;
RAPT.POPPER_LEG1_UPPER = 1;
RAPT.POPPER_LEG2_UPPER = 2;
RAPT.POPPER_LEG3_UPPER = 3;
RAPT.POPPER_LEG4_UPPER = 4;
RAPT.POPPER_LEG1_LOWER = 5;
RAPT.POPPER_LEG2_LOWER = 6;
RAPT.POPPER_LEG3_LOWER = 7;
RAPT.POPPER_LEG4_LOWER = 8;*/
RAPT.POPPER_NUM_SPRITES = 9;

RAPT.popperStandingKeyframe =
	new RAPT.Keyframe(0, 0.1).add(0, -80, -80, 80, 80, 100, 100, -100, -100);
RAPT.popperJumpingKeyframes = [
	new RAPT.Keyframe(0, 0.2).add(0, -40, -30, 30, 40, 40, 40, -40, -40),
	new RAPT.Keyframe(0, 0.1).add(0, -80, -80, 80, 80, 100, 100, -100, -100)
];

RAPT.POPPER_RADIUS = 0.4;
RAPT.POPPER_JUMP_DELAY = 0.5;
RAPT.POPPER_MIN_JUMP_Y = 2.5;
RAPT.POPPER_MAX_JUMP_Y = 6.5;
RAPT.POPPER_ELASTICITY = 0.5;
RAPT.POPPER_ACCEL = -6;

/*RAPT.createPopperSprites = function () {
	var sprites = [];

	for(var i = 0; i < RAPT.POPPER_NUM_SPRITES; i++) {
		sprites.push(new RAPT.Sprite());
	}

	sprites[RAPT.POPPER_BODY].drawGeometry = function(c) {
		c.strokeStyle = 'black';
		c.fillStyle = 'black';
		c.beginPath();
		c.moveTo(0.2, -0.2);
		c.lineTo(-0.2, -0.2);
		c.lineTo(-0.3, 0);
		c.lineTo(-0.2, 0.2);
		c.lineTo(0.2, 0.2);
		c.lineTo(0.3, 0);
		c.lineTo(0.2, -0.2);
		c.moveTo(0.15, -0.15);
		c.lineTo(-0.15, -0.15);
		c.lineTo(-0.23, 0);
		c.lineTo(-0.15, 0.15);
		c.lineTo(0.15, 0.15);
		c.lineTo(0.23, 0);
		c.lineTo(0.15, -0.15);
		c.stroke();

		c.beginPath();
		c.arc(-0.075, 0, 0.04, 0, 2*Math.PI, false);
		c.arc(0.075, 0, 0.04, 0, 2*Math.PI, false);
		c.fill();
	};

	var legDrawGeometry = function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(0, -RAPT.LEG_LENGTH);
		c.stroke();
	};

	for(var i = 0; i < 4; i++) {
		sprites[RAPT.POPPER_LEG1_UPPER + i].drawGeometry = legDrawGeometry;
		sprites[RAPT.POPPER_LEG1_LOWER + i].drawGeometry = legDrawGeometry;
		sprites[RAPT.POPPER_LEG1_UPPER + i].setParent(sprites[RAPT.POPPER_BODY]);
		sprites[RAPT.POPPER_LEG1_LOWER + i].setParent(sprites[RAPT.POPPER_LEG1_UPPER + i]);
		sprites[RAPT.POPPER_LEG1_LOWER + i].offsetBeforeRotation = new RAPT.Vector(0, -RAPT.LEG_LENGTH);
	}

	sprites[RAPT.POPPER_LEG1_UPPER].offsetBeforeRotation = new RAPT.Vector(-0.2, -0.2);
	sprites[RAPT.POPPER_LEG2_UPPER].offsetBeforeRotation = new RAPT.Vector(-0.1, -0.2);
	sprites[RAPT.POPPER_LEG3_UPPER].offsetBeforeRotation = new RAPT.Vector(0.1, -0.2);
	sprites[RAPT.POPPER_LEG4_UPPER].offsetBeforeRotation = new RAPT.Vector(0.2, -0.2);

	return sprites;
}*/

RAPT.Popper = function (center) {
	RAPT.WalkingEnemy.call(this, RAPT.ENEMY_POPPER, center, RAPT.POPPER_RADIUS, RAPT.POPPER_ELASTICITY);

	this.sprite =  new RAPT.SpriteGroup({
		name:'popper',
		material:RAPT.MAT_ENEMY,
		size : 1,
		uvs:[[0,3], [1,3], [1,3], [1,3], [1,3], [2,3], [2,3], [2,3], [2,3] ],
		nuv:16,
		color:0X44CC66,
		list:['body', 'p1', 'p2', 'p3', 'p4', 'l1', 'l2', 'l3', 'l4'],
		parent:['' , 'body', 'body', 'body', 'body', 'p1', 'p2', 'p3', 'p4'],
		pos:   [ [0,0,0] ,[-0.25,-0.25,-1],[-0.1,-0.25,-1],[0.1,-0.25,-1],[0.25,-0.25,-1],  [0,-0.25,-2],[0,-0.25,-2],[0,-0.25,-2],[0,-0.25,-2]    ],
		center:[ [0,0]  , [0,-0.125], [0,-0.125], [0,-0.125], [0,-0.125], [0,-0.25], [0,-0.25]  , [0,-0.25] , [0,-0.25] ],
		//sizes: [ [1,1],  [0.5,0.5], [0.5,0.5], [0.5,0.5], [0.5,0.5], [0.5,0.5] ,[0.5,0.5], [0.5,0.5], [0.5,0.5]    ]
	});
	this.sprite.moveto(center);

	this.onFloor = false;
	this.timeToNextJump = RAPT.POPPER_JUMP_DELAY;
	//this.sprites = RAPT.createPopperSprites();
}

//RAPT.Popper.prototype = new RAPT.WalkingEnemy;
RAPT.Popper.prototype = Object.create( RAPT.WalkingEnemy.prototype );

RAPT.Popper.prototype.move = function(seconds) {
	if (this.timeToNextJump <= 0) {
		// POPPER_MIN_JUMP_Y <= velocity.y < POPPER_MAX_JUMP_Y
		this.velocity.y = RAPT.randInRange(RAPT.POPPER_MIN_JUMP_Y, RAPT.POPPER_MAX_JUMP_Y);
		// -(POPPER_MAX_JUMP_Y - POPPER_MIN_JUMP_Y) <= velocity.x <= (POPPER_MAX_JUMP_Y - POPPER_MIN_JUMP_Y)
		this.velocity.x = (Math.random() > 0.5) ? RAPT.POPPER_MAX_JUMP_Y - this.velocity.y : -RAPT.POPPER_MAX_JUMP_Y + this.velocity.y;

		this.timeToNextJump = RAPT.POPPER_JUMP_DELAY;
		this.onFloor = false;
	} else if (this.onFloor) {
		this.timeToNextJump = this.timeToNextJump - seconds;
	}
	return this.accelerate(new RAPT.Vector(0, RAPT.POPPER_ACCEL), seconds);
};

RAPT.Popper.prototype.reactToWorld = function(contact) {
	if (contact.normal.y >= .999) {
		this.velocity.x = 0;
		this.velocity.y = 0;
		this.onFloor = true;
	}
};

RAPT.Popper.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	

	//this.sprites[RAPT.POPPER_BODY].offsetBeforeRotation = position;

	// unfortunate hax because poppers bounce a little bit because of thdqe way Enemy::Tick() works
	var ref_shapePoint = {}, ref_worldPoint = {};
	var distance = RAPT.gameState.collider.closestToEntityWorld(this, 2 * RAPT.POPPER_RADIUS, ref_shapePoint, ref_worldPoint, RAPT.gameState.world);
	var isOnFloor = (distance < 3 * RAPT.POPPER_RADIUS && ref_shapePoint.ref.eq(position.add(new RAPT.Vector(0, -RAPT.POPPER_RADIUS))) && ref_worldPoint.ref.sub(ref_shapePoint.ref).length() < 0.1);

	var frame;
	if(!isOnFloor){
		var percent = this.velocity.y * -0.25;
		percent = (percent < 0) ? 1 / (1 - percent) - 1 : 1 - 1 / (1 + percent);
		frame = RAPT.popperJumpingKeyframes[0].lerpWith(RAPT.popperJumpingKeyframes[1], percent);
	}
	else frame = RAPT.popperStandingKeyframe;

	//this.sprites[RAPT.POPPER_BODY].offsetAfterRotation = frame.center;
	this.sprite.moveto(position.add(frame.center));

	for(var i = 0; i < RAPT.POPPER_NUM_SPRITES; i++) {
		//this.sprites[i].angle = frame.angles[i];
		this.sprite.sprite[i].rotation.z = frame.angles[i];
	}
};

RAPT.Popper.prototype.draw = function(c) {
	//this.sprites[RAPT.POPPER_BODY].draw(c);
};

RAPT.Popper.prototype.avoidsSpawn = function() {
	return true;
};
