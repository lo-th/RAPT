
RAPT.MAX_SPAWN_FORCE = 100.0;
RAPT.INNER_SPAWN_RADIUS = 1.0;
RAPT.OUTER_SPAWN_RADIUS = 1.1;

// enum for enemies
RAPT.ENEMY_BOMB = 0;
RAPT.ENEMY_BOMBER = 1;
RAPT.ENEMY_BOUNCY_ROCKET = 2;
RAPT.ENEMY_BOUNCY_ROCKET_LAUNCHER = 3;
RAPT.ENEMY_CLOUD = 4;
RAPT.ENEMY_MAGNET = 5;
RAPT.ENEMY_GRENADE = 6;
RAPT.ENEMY_GRENADIER = 7;
RAPT.ENEMY_HEADACHE = 8;
RAPT.ENEMY_HELP_SIGN = 9;
RAPT.ENEMY_HUNTER = 10;
RAPT.ENEMY_LASER = 11;
RAPT.ENEMY_MULTI_GUN = 12;
RAPT.ENEMY_POPPER = 13;
RAPT.ENEMY_RIOT_BULLET = 14;
RAPT.ENEMY_JET_STREAM = 15;
RAPT.ENEMY_ROCKET = 16;
RAPT.ENEMY_ROCKET_SPIDER = 17;
RAPT.ENEMY_ROLLER_BEAR = 18;
RAPT.ENEMY_SHOCK_HAWK = 19;
RAPT.ENEMY_SPIKE_BALL = 20;
RAPT.ENEMY_STALACBAT = 21;
RAPT.ENEMY_WALL_AVOIDER = 22;
RAPT.ENEMY_CRAWLER = 23;
RAPT.ENEMY_WHEELIGATOR = 24;
RAPT.ENEMY_DOORBELL = 25;

RAPT.Enemy = function (type, elasticity) {
	
	this.velocity = new RAPT.Vector(0, 0);
	// private variable to tell whether this enemy will be removed at the end of all Entity ticks
	this._isDead = false;
	this.type = type;
	this.elasticity = elasticity;
	this.shape = null;
}

RAPT.Enemy.prototype = {
	constructor: RAPT.Enemy,
	getVelocity : function() { return this.velocity; },
	setVelocity : function(vel) { this.velocity = vel; },
	isDead : function() { return this._isDead; },
	setDead : function(isDead) {
		if (this._isDead === isDead) return;
		this._isDead = isDead;
		if (this._isDead) this.onDeath();
		else this.onRespawn();
	},
	getShape : function(){ console.log( 'Enemy.getShape() unimplemented'); },
	//getColor : function() { console.log( 'RAPT.Entity.getColor() unimplemented'); },

	getCenter : function() { 
		var g =  this.getShape();
		//console.log(g.getType());  
		if(g)return g.getCenter();
		else return new RAPT.Vector(0,0);
	},
	setCenter : function(vec) { this.getShape().moveTo(vec); },

	isOnFloor : function() {
		RAPT.gameState.collider.onEntityWorld(this, RAPT.gameState.edgeQuad, RAPT.gameState.world);
		return (RAPT.gameState.edgeQuad.edges[RAPT.EDGE_FLOOR] != null);
	},
	//draw : function(){ console.log( 'Enemy.draw() unimplemented'); },

	//onDeath : function() {},
	onRespawn : function() {},

	tick : function(seconds) {
		if (this.avoidsSpawn()) {
			this.setVelocity(this.getVelocity().add(this.avoidSpawnForce().mul(seconds)));
		}

		var ref_deltaPosition = { ref: this.move(seconds) };
		var ref_velocity = { ref: this.getVelocity() };
		var shape = this.getShape();
		if(shape != undefined){
		var contact = null;
		// Only collide enemies that can collide with the world
		if (this.canCollide()) {
			contact = RAPT.gameState.collider.collideEntityWorld(this, ref_deltaPosition, ref_velocity, this.elasticity, RAPT.gameState.world, true);
			this.setVelocity(ref_velocity.ref);
		}
		shape.moveBy(ref_deltaPosition.ref);

		// If this enemy collided with the world, react to the world
		if (contact !== null) {
			this.reactToWorld(contact);
		}

		// If this is way out of bounds, kill it
		if (!RAPT.gameState.collider.containsPointShape(shape.getCenter(), RAPT.gameState.world.getHugeAabb())) {
			this.setDead(true);
		}

		// If the enemy is still alive, collide it with the players
		if (!this.isDead()) {
			var players = RAPT.gameState.collider.overlapShapePlayers(shape);
			for (var i = 0; i < players.length; ++i) {
				if (!players[i].isDead()) {
					this.reactToPlayer(players[i]);
				}
			}
		}
	}

		this.afterTick(seconds);
	},
	getColor : function() { return RAPT.EDGE_ENEMIES; },
	getElasticity : function() { return this.elasticity; },
	getType : function() { return this.type; },
	getTarget : function() { return -1; },
	setTarget : function(player) {},
	onDeath : function() {},
	canCollide : function() { return true; },
	avoidsSpawn : function() { return false; },

	// Accelerate updates velocity and returns the delta position
	accelerate : function(accel, seconds) {
		this.setVelocity(this.velocity.add(accel.mul(seconds)));
		return this.velocity.mul(seconds);
	},
	avoidSpawnForce : function() {
		var relSpawnPosition = RAPT.gameState.getSpawnPoint().sub(this.getCenter());
		var radius = this.getShape().radius;
		var distance = relSpawnPosition.length() - radius;

		// If inside the inner circle, push with max force
		if (distance < RAPT.INNER_SPAWN_RADIUS){
			return relSpawnPosition.unit().mul(-RAPT.MAX_SPAWN_FORCE);
		} else if (distance < RAPT.OUTER_SPAWN_RADIUS) {
			var magnitude = RAPT.MAX_SPAWN_FORCE * (1 - (distance - RAPT.INNER_SPAWN_RADIUS) / (RAPT.OUTER_SPAWN_RADIUS - RAPT.INNER_SPAWN_RADIUS));
			return relSpawnPosition.unit().mul(-magnitude);
		} else return new RAPT.Vector(0, 0);
	},

	// THE FOLLOWING SHOULD BE OVERRIDDEN BY ALL ENEMIES:

	// This moves the enemy
	move : function(seconds) {
		return new RAPT.Vector(0, 0);
	},

	// Enemy's reaction to a collision with the World, by default has no effect
	reactToWorld : function(contact) {},

	// Enemy's reaction to a collision with a Player, by default kills the Player
	reactToPlayer : function(player) {
		player.setDead(true);
	},

	// Do stuff that needs an updated enemy, like move the graphics
	afterTick : function(seconds) {}
}

//------------------------------------------------
// HOVERING ENEMY
//------------------------------------------------

RAPT.HoveringEnemy = function (type, center, radius, elasticity) {
	RAPT.Enemy.call(this, type, elasticity);
	this.hitCircle = new RAPT.Circle(center, radius);
}

//RAPT.HoveringEnemy.prototype = new RAPT.Enemy;
RAPT.HoveringEnemy.prototype = Object.create( RAPT.Enemy.prototype );
RAPT.HoveringEnemy.prototype.constructor = RAPT.HoveringEnemy;

RAPT.HoveringEnemy.prototype.getShape = function() {
	return this.hitCircle;
};

//------------------------------------------------
// FALLING ENEMY
//------------------------------------------------

RAPT.FREEFALL_ACCEL = -6;

RAPT.FreefallEnemy = function (type, center, radius, elasticity) {
	RAPT.Enemy.call(this, type, elasticity);
	this.hitCircle = new RAPT.Circle(center, radius);
}

//RAPT.FreefallEnemy.prototype = new RAPT.Enemy;//Object.create( Enemy.prototype );
RAPT.FreefallEnemy.prototype = Object.create( RAPT.Enemy.prototype );
RAPT.FreefallEnemy.prototype.constructor = RAPT.FreefallEnemy;

RAPT.FreefallEnemy.prototype.getShape = function() {
	return this.hitCircle;
};

/*RAPT.FreefallEnemy.prototype.draw = function(c) {
	var pos = this.hitCircle.center;
	c.fillStyle = 'black';
	c.beginPath();
	c.arc(pos.x, pos.y, this.hitCircle.radius, 0, Math.PI*2, false);
	c.fill();
};*/

// This moves the enemy and constrains its position
RAPT.FreefallEnemy.prototype.move = function(seconds) {
	return this.accelerate(new RAPT.Vector(0, RAPT.FREEFALL_ACCEL), seconds);
};

// Enemy's reaction to a collision with the World
RAPT.FreefallEnemy.prototype.reactToWorld = function(contact) {
	this.setDead(true);
};

// Enemy's reaction to a collision with a Player
RAPT.FreefallEnemy.prototype.reactToPlayer = function(player) {
	this.setDead(true);
	player.setDead(true);
};

//------------------------------------------------
// WALKING ENEMY
//------------------------------------------------

RAPT.WalkingEnemy = function (type, center, radius, elasticity) {
	RAPT.Enemy.call(this, type, elasticity);
	this.hitCircle = new RAPT.Circle(center, radius);
}

//RAPT.WalkingEnemy.prototype = new RAPT.Enemy;
RAPT.WalkingEnemy.prototype = Object.create( RAPT.Enemy.prototype );
RAPT.WalkingEnemy.prototype.constructor = RAPT.WalkingEnemy;

RAPT.WalkingEnemy.prototype.getShape = function() {
	return this.hitCircle;
};

RAPT.WalkingEnemy.prototype.move = function(seconds) {
	return this.velocity.mul(seconds);
};

//------------------------------------------------
// SPAWNING ENEMY
//------------------------------------------------

RAPT.SpawningEnemy = function (type, center, width, height, elasticity, frequency, startingTime) {
	RAPT.Enemy.call(this, type, elasticity);
	this.spawnFrequency = frequency;
	// Time until next enemy gets spawned
	this.timeUntilNextSpawn = startingTime;
	this.hitBox = RAPT.makeAABB(center, width, height);
}

//RAPT.SpawningEnemy.prototype = new RAPT.Enemy;//Object.create( Enemy.prototype );
RAPT.SpawningEnemy.prototype = Object.create( RAPT.Enemy.prototype );
RAPT.SpawningEnemy.prototype.constructor = RAPT.SpawningEnemy;

RAPT.SpawningEnemy.prototype.getShape = function() {
	return this.hitBox;
};

// return a number between 0 and 1 indicating how ready we are for
// the next spawn (0 is just spawned and 1 is about to spawn)
RAPT.SpawningEnemy.prototype.getReloadPercentage = function() {
	return 1 - this.timeUntilNextSpawn / this.spawnFrequency;
};

// Special tick to include a step to spawn enemies
RAPT.SpawningEnemy.prototype.tick = function(seconds) {
	this.timeUntilNextSpawn -= seconds;

	if (this.timeUntilNextSpawn <= 0) {
		// If an enemy is spawned, increase the time by the spawn frequency
		if (this.spawn()) {
			this.timeUntilNextSpawn += this.spawnFrequency;
		} else {
			this.timeUntilNextSpawn = 0;
		}
	}

	RAPT.Enemy.prototype.tick.call(this, seconds);
};

RAPT.SpawningEnemy.prototype.reactToPlayer = function(player) {
};

// Subclasses of this should overwrite Spawn() to spawn the right type of enemy
// Returns true iff an enemy is actually spawned
RAPT.SpawningEnemy.prototype.spawn = function() {
	throw 'SpawningEnemy.spawn() unimplemented';
}

//------------------------------------------------
// ROTATING ENEMY
//------------------------------------------------

RAPT.RotatingEnemy = function (type, center, radius, heading, elasticity) {
	RAPT.Enemy.call(this, type, elasticity);

	this.hitCircle = new RAPT.Circle(center, radius);
	this.heading = heading;
}

//RAPT.RotatingEnemy.prototype = new RAPT.Enemy;
RAPT.RotatingEnemy.prototype = Object.create( RAPT.Enemy.prototype );
RAPT.RotatingEnemy.prototype.constructor = RAPT.RotatingEnemy;

RAPT.RotatingEnemy.prototype.getShape = function() {
	return this.hitCircle;
};
