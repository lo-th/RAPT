RAPT.PAUSE_AFTER_DEATH = 2;
RAPT.RESPAWN_INTERPOLATION_TIME = 1;
RAPT.PAUSE_BEFORE_RESPAWN = 0.3;
RAPT.PLAYER_ACCELERATION = 50;//50;
RAPT.PLAYER_MAX_SPEED = 8;//8;
RAPT.PLAYER_WIDTH = 0.2;
RAPT.PLAYER_HEIGHT = 0.75;
RAPT.PLAYER_SUPER_JUMP_SPEED = 10;
RAPT.PLAYER_CLAMBER_ACCEL_X = 5;
RAPT.PLAYER_CLAMBER_ACCEL_Y = 10;
RAPT.PLAYER_DEATH_SPEED = 15;
RAPT.PLAYER_GRAVITY = 10;
RAPT.SLIDE_PARTICLE_TIMER_PERIOD = 1 / 5;
RAPT.SUPER_PARTICLE_TIMER_PERIOD = 1 / 40;
RAPT.JUMP_MIN_WAIT = 0.5;
RAPT.WALL_FRICTION = 0.1;

// enum PlayerState
RAPT.PLAYER_STATE_FLOOR = 0;
RAPT.PLAYER_STATE_AIR = 1;
RAPT.PLAYER_STATE_CLAMBER = 2;
RAPT.PLAYER_STATE_LEFT_WALL = 3;
RAPT.PLAYER_STATE_RIGHT_WALL = 4;

// player keyframe
RAPT.runningKeyframes = [
	new RAPT.Keyframe(0, -5 / 50).add(5, -10, 65, -55, 20, 40, -20, -30, -30, 10),
	new RAPT.Keyframe(0, -2 / 50).add(5, -10, 35, -25, 0, 30, 18, -110, 0, 20),
	new RAPT.Keyframe(0, 0).add(5, -10, 10, -30, -20, 20, 60, -100, 10, 30),

	new RAPT.Keyframe(0, -5 / 50).add(5, -10, -20, -30, -30, 10, 65, -55, 20, 40),
	new RAPT.Keyframe(0, -2 / 50).add(5, -10, 18, -110, 0, 20, 35, -25, 0, 30),
	new RAPT.Keyframe(0, 0).add(5, -10, 60, -100, 10, 30, 10, -30, -20, 20)
];
RAPT.jumpingKeyframes = [
	new RAPT.Keyframe(0, 0).add(0, -10, 150, -170, -40, 30, -30, -20, 20, 150),
	new RAPT.Keyframe(0, 0).add(-20, 10, 60, -100, -80, 30, 30, -20, 30, 30)
];
RAPT.wallSlidingKeyframe =
	new RAPT.Keyframe((0.4 - RAPT.PLAYER_WIDTH) / 2, 0).add(0, -10, 150, -130, 140, 50, 50, -30, 50, 130);
RAPT.crouchingKeyframe =
	new RAPT.Keyframe(0, -0.25).add(30, -30, 130, -110, -30, 40, 60, -130, 20, 20);
RAPT.fallingKeyframes = [
	new RAPT.Keyframe(0, 0).add(-20, 5, 10, -30, -120, -30, 40, -20, 120, 30),
	new RAPT.Keyframe(0, 0).add(-20, 5, 10, -30, -130, -60, 40, -20, 150, 50)
];
RAPT.clamberingKeyframes = [
	new RAPT.Keyframe((0.4 - RAPT.PLAYER_WIDTH) / 2, 0).add(0, -10, 150, -130, 140, 50, 50, -30, 50, 130),
	new RAPT.Keyframe(0, -0.2).add(30, -30, 160, -180, -30, 40, 20, -10, 20, 20)
];


RAPT.Player = function (center, color) {

	this.velocity = new RAPT.Vector(0, 0);
	this._isDead = false;
	this.reset(center, color);
	this.info = [0,0,0];
	this.sprite = null;


}

RAPT.Player.prototype = {
	constructor: RAPT.Player,
	getVelocity : function() { return this.velocity; },
	setVelocity : function(vel) { this.velocity = vel; },
	isDead : function() { return this._isDead; },
	setDead : function(isDead) {
		if (this._isDead === isDead) return;
		this._isDead = isDead;
		if (this._isDead) this.onDeath();
		else this.onRespawn();
	},
	//getShape : function(){ console.log( 'RAPT.Entity.getShape() unimplemented'); },
	//getColor : function() { console.log( 'RAPT.Entity.getColor() unimplemented'); },

	getCenter : function() { return this.getShape().getCenter(); },
	setCenter : function(vec) { this.getShape().moveTo(vec); },
	
	

	//getCenter : function(){ return this.getShape().getCenter(); },
	//setCenter : function(center){ this.getShape().moveTo(center) },
	isOnFloor : function() {
		// THIS IS A GLOBAL NOW var edgeQuad = new EdgeQuad();
		RAPT.gameState.collider.onEntityWorld(this, RAPT.gameState.edgeQuad, RAPT.gameState.world);
		return (RAPT.gameState.edgeQuad.edges[RAPT.EDGE_FLOOR] != null);
	},
	//tick : function(){ console.log( 'RAPT.Entity.tick() unimplemented'); },
	//draw : function(){ console.log( 'RAPT.Entity.draw() unimplemented'); },

	//onDeath : function() {},
	//onRespawn : function() {},
	add3d: function(){
		var uvs = [[0,0], [0,1], [1,0], [1,1], [2, 0], [2,1], [1,0], [1,1], [2, 0], [2,1], [3,2]];
		if(this.color==1) uvs = [[0,2], [0,3], [1,2], [1,3], [2, 2], [2,3], [1,2], [1,3], [2, 2], [2,3], [3,2]];
		this.sprite = new RAPT.SpriteGroup({

			name:'player'+ this.color,
			material:RAPT.MAT_PLAYER,
			
			size : 0.4,
			ydecal:0.2,
			color: this.color==1 ? 0XFF0000 : 0X0000FF,
			list:  ['head'  , 'torso' , 'uplegl' , 'lowlegl' , 'uparml' , 'lowarml', 'uplegr' , 'lowlegr' , 'uparmr' , 'lowarmr', 'sabre' ],
			parent:['torso' , ''      , 'torso'  , 'uplegl'  , 'torso'  , 'uparml' , 'torso'  , 'uplegr'  , 'torso'  , 'uparmr', 'lowarml' ],
			nuv:4,
			uvs :  uvs,
			pos: [  [0,0.5,0] ,[0,0,0], 
			        [-0.02,-0.26,1]  , [0,-0.5,1]   , [-0.05, 0.4, 2]   , [0,-0.4, 2],
			        [0.05,-0.25, -1] , [0,-0.5, -1] , [-0.05, 0.4, -2]  , [0,-0.4, -2],
			        [0,-0.5, -1]  
			    ],
			center:[ [0,0.25]  ,[0,0],
			         [0,-0.25] , [0,-0.25]  , [0,-0.25] , [0,-0.25], 
			         [0,-0.25]  , [0,-0.25]  , [0,-0.25] , [0,-0.25],
			         [0.25,0]    
			    ]
		});
	},
	

	reset : function(center, color) {
		
		if(this.sprite) this.sprite.remove();

		this._isDead = false;
		// keys (will be set automatically)
		this.jumpKey = false;
		this.crouchKey = false;
		this.leftKey = false;
		this.rightKey = false;

		// the player is modeled as a triangle so it behaves like a
		// box on top (so it has width) and behaves like a point on
		// bottom (so it slides down when walking off ledges)
		this.polygon = new RAPT.Polygon(
			center,
			new RAPT.Vector(RAPT.PLAYER_WIDTH / 2, RAPT.PLAYER_HEIGHT / 2),
			new RAPT.Vector(-RAPT.PLAYER_WIDTH / 2, RAPT.PLAYER_HEIGHT / 2),
			new RAPT.Vector(0, -RAPT.PLAYER_HEIGHT / 2)
		);

		// physics stuff
		this.velocity = new RAPT.Vector(0, 0);
		this.actualVelocity = new RAPT.Vector(0, 0);
		this.boost = 0;
		this.boostTime = 0;
		this.boostMagnitude = 0;
		this.onDiagLastTick = false;
		this.jumpDisabled = false;
		this.lastContact = null;
		this.state = RAPT.PLAYER_STATE_FLOOR;
		this.prevState = RAPT.PLAYER_STATE_FLOOR;

		// animation stuff
		//this.sprites = RAPT.createPlayerSprites();
		this.facingRight = false;
		this.runningFrame = 0;
		this.fallingFrame = 0;
		this.crouchTimer = 0;
		this.timeSinceDeath = 0;
		this.positionOfDeath = new RAPT.Vector(0, 0);
		this.slideParticleTimer = 0;
		this.superJumpParticleTimer = 0;

		// other stuff
		this.isSuperJumping = false;
		this.color = color;
	},
	getShape : function(){ return this.polygon; },
	getColor : function(){ return this.color; },

	// returns 0 for red player and 1 for blue player
	getPlayerIndex : function() {
		return (this == RAPT.gameState.playerB);
	},
	getCrouch : function() {
		return this.crouchKey;
	},
	disableJump : function() {
		this.jumpDisabled = true;
	},
	addToVelocity : function(v) {
		this.velocity.inplaceAdd(v);
	},
	collideWithOtherPlayer : function() {
		// Do a co-op jump if a bunch of conditions hold: Both players on floor, the other player is crouching, and the two are colliding
		var otherPlayer = RAPT.gameState.getOtherPlayer(this);

		if(otherPlayer.crouchKey && !otherPlayer.isDead() && this.state == RAPT.PLAYER_STATE_FLOOR && otherPlayer.state == RAPT.PLAYER_STATE_FLOOR){
			// Other player not moving, this player moving fast enough in x
			if(otherPlayer.velocity.lengthSquared() < 0.01 &&
				Math.abs(this.velocity.x) > 4 /* && TODO: HAD TO COMMENT THIS OUT BECAUSE Y VELOCITY IS BIGGER THAN 0.1, WHY IS THIS
				Math.abs(this.velocity.y) < 0.1*/)
			{
				var relativePos = this.getCenter().sub(otherPlayer.getCenter());

				// if y-position within 0.01 and x-position within 0.1
				if(Math.abs(relativePos.y) <= 0.01 && Math.abs(relativePos.x) < 0.1){
					this.velocity = new RAPT.Vector(0, RAPT.PLAYER_SUPER_JUMP_SPEED);
					this.isSuperJumping = true;
				}
			}

			// Change the spawn point if the players are within 1 unit and we have waited for at least 1 second
			if(this.getCenter().sub(otherPlayer.getCenter()).lengthSquared() < 1 && this.crouchTimer > 1 && otherPlayer.crouchTimer >= this.crouchTimer){
				RAPT.gameState.setSpawnPoint(otherPlayer.getCenter());
			}
		}
	},
	tick : function(seconds) {
		this.tickDeath(seconds);

		if(!this.isDead()) {
			this.tickPhysics(seconds);
			this.tickParticles(seconds);
			this.tickAnimation(seconds);
		}
	},
	tickDeath : function(seconds) {
		// increment the death timer
		if(!this.isDead()) this.timeSinceDeath = 0;
		else this.timeSinceDeath += seconds;

		// respawn as needed (but only if the other player isn't also dead)
		if(this.timeSinceDeath > RAPT.PAUSE_AFTER_DEATH + RAPT.RESPAWN_INTERPOLATION_TIME + RAPT.PAUSE_BEFORE_RESPAWN && !RAPT.gameState.getOtherPlayer(this).isDead()) {
			this.setDead(false);
		}

		// if we're dead, interpolate back to the spawn point
		if(this.isDead()) {
			// smoothly interpolate the position of death to the spawn point (speeding up at the beginning and slowing down at the end)
			var destination = RAPT.gameState.getSpawnPoint();
			var percent = (this.timeSinceDeath - RAPT.PAUSE_AFTER_DEATH) / RAPT.RESPAWN_INTERPOLATION_TIME;
			percent = Math.max(0, Math.min(1, percent));
			percent = 0.5 - 0.5 * Math.cos(percent * Math.PI);
			percent = 0.5 - 0.5 * Math.cos(percent * Math.PI);
			this.setCenter(new RAPT.Vector().lerp(this.positionOfDeath, destination, percent));
		}
	},
	tickPhysics : function(seconds) {
		// if we hit something, stop the boost
		if(this.lastContact != null){
			this.boostMagnitude = 0;
			this.boostTime = 0;
		}

		// if we're not in a boost, decrease the boost magnitude
		this.boostTime -= seconds;
		if(this.boostTime < 0) this.boostMagnitude *= Math.pow(0.1, seconds);

		// if we hit something or fall down, turn super jumping off
		if(this.lastContact != null || this.velocity.y < 0) this.isSuperJumping = false;

		// move the player horizontally
		var moveLeft = (this.leftKey && !this.rightKey && !this.crouchKey);
		var moveRight = (this.rightKey && !this.leftKey && !this.crouchKey);

		// check for edge collisions.  sometimes if we hit an edge hard, we won't actually be within the margin
		// but we will have a contact so we use both methods to detect an edge contact
		RAPT.gameState.collider.onEntityWorld(this, RAPT.gameState.edgeQuad, RAPT.gameState.world);

		var onGround = (RAPT.gameState.edgeQuad.edges[RAPT.EDGE_FLOOR] != null) || (this.lastContact != null && RAPT.getOrientation(this.lastContact.normal) == RAPT.EDGE_FLOOR);
		var onLeft = (RAPT.gameState.edgeQuad.edges[RAPT.EDGE_LEFT] != null) || (this.lastContact != null && RAPT.getOrientation(this.lastContact.normal) == RAPT.EDGE_LEFT);
		var onRight = (RAPT.gameState.edgeQuad.edges[RAPT.EDGE_RIGHT] != null) || (this.lastContact != null && RAPT.getOrientation(this.lastContact.normal) == RAPT.EDGE_RIGHT);
		var onCeiling = (RAPT.gameState.edgeQuad.edges[RAPT.EDGE_CEILING] != null) || (this.lastContact != null && RAPT.getOrientation(this.lastContact.normal) == RAPT.EDGE_CEILING);

		if (!this.jumpDisabled && this.jumpKey){
			// do a vertical jump
			if(onGround){
				this.velocity.y = 6.5;
				this.boostTime = 0;
				this.boost = 0;
				this.boostMagnitude = 0;

				// boost away from the wall
				if(onLeft || onRight){
					this.boostTime = 0.5;
					this.boost = 1;
					this.boostMagnitude = 0.5;
				}

				// if it's on the right wall, just switch the boost direction
				if(onRight) this.boost = -this.boost;

				// if the other player is super jumping, make us super jumping too!
				if(RAPT.gameState.getOtherPlayer(this).isSuperJumping){
					this.velocity.y = RAPT.PLAYER_SUPER_JUMP_SPEED;
					this.isSuperJumping = true;
				}
			}
			// wall jump off the left wall
			else if(onLeft && !moveLeft && this.boostTime < 0){
				this.velocity = new RAPT.Vector(3.5, 6.5);
				this.boostTime = RAPT.JUMP_MIN_WAIT;
				this.boost = 2.5;
				this.boostMagnitude = 1;
			}
			// wall jump off the right wall
			else if(onRight && !moveRight && this.boostTime < 0){
				this.velocity = new RAPT.Vector(-3.5, 6.5);
				this.boostTime = RAPT.JUMP_MIN_WAIT;
				this.boost = -2.5;
				this.boostMagnitude = 1;
			}
		}

		// kill the boost when we hit a ceiling
		if(onCeiling) {
			this.boostTime = 0;
			this.boost = 0;
			this.boostMagnitude = 0;
		}

		// accelerate left and right (but not on ceilings, unless you are also on the ground for diagonal corners)
		if(onGround || !onCeiling) {
			if(moveLeft) {
				this.velocity.x -= RAPT.PLAYER_ACCELERATION * seconds;
				this.velocity.x = Math.max(this.velocity.x, -RAPT.PLAYER_MAX_SPEED);
			}
			if(moveRight) {
				this.velocity.x += RAPT.PLAYER_ACCELERATION * seconds;
				this.velocity.x = Math.min(this.velocity.x, RAPT.PLAYER_MAX_SPEED);
			}
		}

		if(RAPT.gameState.edgeQuad.edges[RAPT.EDGE_FLOOR]) this.state = RAPT.PLAYER_STATE_FLOOR;
		else if(RAPT.gameState.edgeQuad.edges[RAPT.EDGE_LEFT]) this.state = RAPT.PLAYER_STATE_LEFT_WALL;
		else if(RAPT.gameState.edgeQuad.edges[RAPT.EDGE_RIGHT]) this.state = RAPT.PLAYER_STATE_RIGHT_WALL;
		else this.state = RAPT.PLAYER_STATE_AIR;

		var ref_closestPointWorld = {}, ref_closestPointShape = {};
		var closestPointDistance = RAPT.gameState.collider.closestToEntityWorld(this, 0.1, ref_closestPointShape, ref_closestPointWorld, RAPT.gameState.world);

		if(this.state == RAPT.PLAYER_STATE_LEFT_WALL || this.state == RAPT.PLAYER_STATE_RIGHT_WALL) {
			// apply wall friction if the player is sliding down
			if (this.velocity.y < 0) {
				this.velocity.y *= Math.pow(RAPT.WALL_FRICTION, seconds);
			}
			if (this.velocity.y > -0.5 && this.prevState === RAPT.PLAYER_STATE_CLAMBER) {
				// continue clambering to prevent getting stuck alternating between clambering and climbing
				this.state = RAPT.PLAYER_STATE_CLAMBER;
			}
		}


		// start clambering if we're touching something below us, but not on a floor, wall, or ceiling
		if(this.state == RAPT.PLAYER_STATE_AIR && closestPointDistance < 0.01 && ref_closestPointShape.ref.y > ref_closestPointWorld.ref.y)
			this.state = RAPT.PLAYER_STATE_CLAMBER;

		if(this.state == RAPT.PLAYER_STATE_CLAMBER){	
			// clamber left
			if(this.leftKey && ref_closestPointWorld.ref.x - this.polygon.getCenter().x < 0) {
				this.velocity.x -= RAPT.PLAYER_CLAMBER_ACCEL_X * seconds;
				this.velocity.y += RAPT.PLAYER_CLAMBER_ACCEL_Y * seconds;
			}
			// clamber right
			if(this.rightKey && ref_closestPointWorld.ref.x - this.polygon.getCenter().x > 0) {
				this.velocity.x += RAPT.PLAYER_CLAMBER_ACCEL_X * seconds;
				this.velocity.y += RAPT.PLAYER_CLAMBER_ACCEL_Y * seconds;
			}
		}

		this.crouchTimer += seconds;
		if(!this.crouchKey || this.state != RAPT.PLAYER_STATE_FLOOR) this.crouchTimer = 0;

		// If on a floor
		if(this.state == RAPT.PLAYER_STATE_FLOOR) {
			if (this.crouchKey) {
				this.velocity.inplaceMul(Math.pow(0.000001, seconds));
			} else {
				this.velocity.y -= RAPT.PLAYER_GRAVITY * seconds;
				if (!this.jumpKey && this.leftKey != this.rightKey && 
					this.onDiagLastTick && RAPT.gameState.edgeQuad.edges[RAPT.EDGE_FLOOR].segment.normal.y < 0.99) {
					// If running down on a diagonal floor, dont let the player run off
					this.velocity = this.velocity.projectOntoAUnitVector(RAPT.gameState.edgeQuad.edges[RAPT.EDGE_FLOOR].segment.normal.flip()).mul(0.99);
					this.velocity.y += .001;
				}
			}
		} else {
			this.velocity.y -= RAPT.PLAYER_GRAVITY * seconds;
		}

		this.onDiagLastTick = (this.state == RAPT.PLAYER_STATE_FLOOR && RAPT.gameState.edgeQuad.edges[RAPT.EDGE_FLOOR].segment.normal.y < 0.99);
		this.collideWithOtherPlayer();

		// boost the velocity in the x direction
		this.actualVelocity = new RAPT.Vector().lerp(this.velocity, new RAPT.Vector(this.boost, this.velocity.y), this.boostMagnitude);
		if(this.boost != 0 && this.velocity.x / this.boost > 1)
			this.actualVelocity.x = this.velocity.x;

		var deltaPosition = this.actualVelocity.mul(seconds);
		// Time independent version of multiplying by 0.909511377
		this.velocity.x *= Math.pow(0.000076, seconds);

		var ref_deltaPosition = {ref: deltaPosition}, ref_velocity = {ref: this.velocity};
		var newContact = RAPT.gameState.collider.collideEntityWorld(this, ref_deltaPosition, ref_velocity, 0, RAPT.gameState.world, true);
		deltaPosition = ref_deltaPosition.ref;
		this.velocity = ref_velocity.ref;
		this.lastContact = newContact;

		this.polygon.moveBy(deltaPosition);

		if(this.actualVelocity.y < -RAPT.PLAYER_DEATH_SPEED && newContact != null && newContact.normal.y > 0.9) {
			this.setDead(true);
			this.onDeath();
		}

		// After everything, reenable jump
		this.prevState = this.state;
		this.jumpDisabled = false;
	},
	onDeath : function() {
		this.velocity = new RAPT.Vector(0, 0);
		this.state = RAPT.PLAYER_STATE_AIR;
		this.boost = this.boostMagnitude = 0;
		this.isSuperJumping = false;

		this.timeSinceDeath = 0;
		this.positionOfDeath = this.polygon.center;

		var isRed = (RAPT.gameState.playerA == this);
		var r = isRed ? 1 : 0.1;
		var g = 0.1;
		var b = isRed ? 0.1 : 1;

		this.sprite.visible(false);

		var i = 500;
		while(i--){
			var direction = new RAPT.Vector().fromAngle(RAPT.lerp(0, 2*Math.PI, Math.random()));
			direction = this.velocity.add(direction.mul(RAPT.lerp(1, 10, Math.random())));

			RAPT.Particle().triangle().position(this.polygon.center).velocity(direction).radius(0.01, 0.1).bounces(0, 4).elasticity(0.05, 0.9).decay(0.01, 0.02).expand(1, 1.2).color(r/2, g/2, b/2, 1).mixColor(r, g, b, 1).fixangle();
		}
		RAPT.gameState.incrementStat(RAPT.STAT_PLAYER_DEATHS);
	},
	onRespawn : function() {
		this.sprite.visible(true);
	},
	tickParticles : function(seconds) {
		// wall sliding particles
		if(this.state == RAPT.PLAYER_STATE_LEFT_WALL || this.state == RAPT.PLAYER_STATE_RIGHT_WALL) {
			var directionMultiplier = (this.state == RAPT.PLAYER_STATE_RIGHT_WALL) ? -1 : 1;
			var bounds = this.polygon.getAabb();
			var up = this.velocity.y;

			this.slideParticleTimer -= seconds * this.velocity.length();
			while(this.slideParticleTimer < 0) {
				this.slideParticleTimer += RAPT.SLIDE_PARTICLE_TIMER_PERIOD;

				// distribute the particles along the side of the bounding box closest to the world (add 0.25 because the hands reach over the bounding box)
				var position = new RAPT.Vector(
					(this.state == RAPT.PLAYER_STATE_RIGHT_WALL) ? bounds.getRight() : bounds.getLeft(),
					RAPT.lerp(bounds.getBottom(), bounds.getTop() + 0.25, Math.random()));
				var velocity = new RAPT.Vector(
					RAPT.lerp(0, directionMultiplier, Math.random()),
					RAPT.lerp(up, 2*up, Math.random()));

				RAPT.Particle().color(0.3, 0.3, 0.3, 1).mixColor(0.5, 0.3, 0.3, 1).position(position).circle().radius(0.02, 0.04).decay(0.01, 0.2).gravity(15).bounces(2, 4).velocity(velocity).elasticity(0.05, 0.1);
			}
		} else {
			this.slideParticleTimer = 0;
		}

		// super jump particles
		if(this.isSuperJumping) {
			this.superJumpParticleTimer -= seconds;
			while(this.superJumpParticleTimer < 0) {
				this.superJumpParticleTimer += RAPT.SUPER_PARTICLE_TIMER_PERIOD;
				var position = this.polygon.center.add(new RAPT.Vector(RAPT.randInRange(-0.2, 0.2), RAPT.randInRange(-0.4, 0.4)));
				RAPT.Particle().color(1, 1, 0, 1).mixColor(1, 1, 0, 0.75).position(position).circle().radius(0.03, 0.05).expand(1.1, 1.2).decay(0.1, 0.2).gravity(5).bounces(2, 3);
			}
		} else {
			this.superJumpParticleTimer = 0;
		}
	},
	tickAnimation : function(seconds) {
		var frame;
		var slowDownScale = 1;

		this.runningFrame += seconds * Math.abs(this.actualVelocity.x) * Math.PI;
		this.fallingFrame += 8 * seconds;

		if(this.state == RAPT.PLAYER_STATE_LEFT_WALL) {
			this.facingRight = false;
			frame = RAPT.wallSlidingKeyframe;
		} else if(this.state == RAPT.PLAYER_STATE_RIGHT_WALL) {
			this.facingRight = true;
			frame = RAPT.wallSlidingKeyframe;
		} else if(this.state == RAPT.PLAYER_STATE_AIR) {
			if(this.actualVelocity.x < 0) this.facingRight = false;
			else if(this.actualVelocity.x > 0) this.facingRight = true;

			if(this.actualVelocity.y > -RAPT.PLAYER_DEATH_SPEED) {
				var percent = this.actualVelocity.y / 4;
				percent = (percent < 0) ? 1 / (1 - percent) - 1 : 1 - 1 / (1 + percent);
				percent = 0.5 - 0.5 * percent;
				frame = RAPT.jumpingKeyframes[0].lerpWith(RAPT.jumpingKeyframes[1], percent);
			} else {
				frame = new RAPT.Keyframe().lerp(RAPT.fallingKeyframes, this.fallingFrame);
			}
		} else if(this.state == RAPT.PLAYER_STATE_CLAMBER) {
			var ref_shapePoint = {}, ref_worldPoint = {};
			RAPT.gameState.collider.closestToEntityWorld(this, 2, ref_shapePoint, ref_worldPoint, RAPT.gameState.world);

			// this should be from -0.5 to 0.5, so add 0.5 so it is from 0 to 1
			var percent = (this.getCenter().y - ref_worldPoint.ref.y) / RAPT.PLAYER_HEIGHT;
			percent += 0.5;

			frame = RAPT.clamberingKeyframes[0].lerpWith(RAPT.clamberingKeyframes[1], percent);

			this.facingRight = (ref_shapePoint.ref.x < ref_worldPoint.ref.x);
		} else if(this.crouchKey) {
			frame = RAPT.crouchingKeyframe;
		} else {
			frame = new RAPT.Keyframe().lerp(RAPT.runningKeyframes, this.runningFrame);
			if(this.actualVelocity.x < -0.1) this.facingRight = false;
			else if(this.actualVelocity.x > 0.1) this.facingRight = true;

			slowDownScale = Math.abs(this.actualVelocity.x) / 5;
			if(slowDownScale > 1) slowDownScale = 1;
		}

		if(this.sprite == null) return;

		// update 3d sprite rotation
		var i = this.sprite.length-1;
		while(i--){
			this.sprite.sprite[i].rotation.z = (frame.angles[i] * slowDownScale);
		}

		var offset = frame.center.mul(slowDownScale);
		var pos = this.getCenter();
		this.sprite.move(pos.x + offset.x * (this.facingRight ? -1 : 1), pos.y + offset.y);
		this.sprite.flip(this.facingRight);
	},
	getInfo : function(){
		var pos = this.getCenter();
		this.info[0] = pos.x || 0;
		this.info[1] = pos.y || 0;
		this.info[2] = this.state;
		return this.info;
	}
}