// constants
RAPT.SPAWN_POINT_PARTICLE_FREQ = 0.3;

// enum GameStatus
RAPT.GAME_IN_PLAY = 0;
RAPT.GAME_WON = 1;
RAPT.GAME_LOST = 2;
RAPT.GAME_PAUSE = 3;

// enum StatIndex
RAPT.STAT_PLAYER_DEATHS = 0;
RAPT.STAT_ENEMY_DEATHS = 1;
RAPT.STAT_COGS_COLLECTED = 2;
RAPT.STAT_NUM_COGS = 3;

RAPT.drawMinX = 0;
RAPT.drawMinY = 0;
RAPT.drawMaxX = 0;
RAPT.drawMaxY = 0;

// class GameState
RAPT.GameState = function () {

	this.world = new RAPT.World();
	this.collider = new RAPT.CollisionDetector();
	this.edgeQuad = new RAPT.EdgeQuad();
	
	// Player color must be EDGE_RED or EDGE_BLUE to support proper collisions with doors!

	this.playerA = new RAPT.Player(new RAPT.Vector(), RAPT.EDGE_RED);
	this.playerB = new RAPT.Player(new RAPT.Vector(), RAPT.EDGE_BLUE);

	this.spawnPointParticleTimer = 0;
	this.spawnPointOffset = new RAPT.Vector();
	this.enemies = [];
	this.doors = [];
	this.timeSinceStart = 0;

	// keys (will be set automatically)
	this.killKey = false;

	// if you need to tell if the world has been modified (door has been opened/closed), just watch
	// for changes to this variable, which can be incremented by gameState.recordModification()
	this.modificationCount = 0;

	this.gameStatus = RAPT.GAME_IN_PLAY;
	this.stats = [0, 0, 0, 0];
}

// bounding rectangle around all pixels currently being drawn to (also includes 2 cells of padding,
// so just check that the enemy center is within these bounds, don't bother about adding the radius)

RAPT.GameState.prototype = {
	constructor: RAPT.GameState,
	recordModification : function() { this.modificationCount++; },
	getPlayer : function(i) { return (i == 0) ? this.playerA : this.playerB; },
	getOtherPlayer : function(player) { return (player == this.playerA) ? this.playerB : this.playerA;},
	getSpawnPoint : function() { return this.world.spawnPoint; },
	setSpawnPoint : function(point) {
		this.world.spawnPoint = new RAPT.Vector(point.x, point.y);
		// offset to keep spawn point from drawing below ground
		this.spawnPointOffset.y = 0.125;
		// prevents slipping?
		this.world.spawnPoint.y += 0.01;

		this.startPoint.move(this.world.spawnPoint.x-0.5, this.world.spawnPoint.y-0.5);
	},
	gameWon : function(){
		var goal = this.world.goal;
		var atGoalA = !this.playerA.isDead() && Math.abs(this.playerA.getCenter().x - goal.x) < 0.4 && 
						Math.abs(this.playerA.getCenter().y - goal.y) < 0.4;
		var atGoalB = !this.playerB.isDead() && Math.abs(this.playerB.getCenter().x - goal.x) < 0.4 && 
						Math.abs(this.playerB.getCenter().y - goal.y) < 0.4;
		return atGoalA && atGoalB;
	},
	gameLost : function() { return (this.playerA.isDead() && this.playerB.isDead());},
	incrementStat : function(stat) { ++this.stats[stat];},
	addEnemy : function(enemy, spawnerPosition) {
		// If adding at the start of the game, start at its own center
		if (typeof spawnerPosition === 'undefined') {
			spawnerPosition = enemy.getShape().getCenter();
		} else {
			// rewind the enemy back to the spawner's center
			if(enemy.getShape())enemy.getShape().moveTo(spawnerPosition);
		}

		//var ref_deltaPosition = { ref: enemy.getShape().getCenter().sub(spawnerPosition) };
		var ref_deltaPosition = { ref: enemy.getCenter().sub(spawnerPosition) };
		var ref_velocity = { ref: enemy.getVelocity() };

		// do collision detection and push the enemy backwards if it would hit any walls
		var contact = this.collider.collideEntityWorld(enemy, ref_deltaPosition, ref_velocity, enemy.getElasticity(), this.world, true);

		// put the velocity back into the enemy
		enemy.setVelocity(ref_velocity.ref);

		// move the spawned enemy as far out from the spawner as we can
		if(enemy.getShape() != undefined) enemy.getShape().moveBy(ref_deltaPosition.ref);

		// now we can add the enemy to the list
		this.enemies.push(enemy);
	},
	clearDoors : function() { this.doors = []; },
	addDoor : function(start, end, type, color, startsOpen) {
	    var cell1;
	    var cell2;
	    var valid = true;
	    var diag = 0;
		// left wall
		if (start.y + 1 == end.y && start.x == end.x) {
	        cell1 = this.world.getCell(start.x, start.y);
	        cell2 = this.world.getCell(start.x - 1, start.y);
	        if (!cell1 || !cell2 || cell1.leftWallOccupied() || cell2.rightWallOccupied()) {
	            valid = false;
	        }
		}
		// right wall
		else if (start.y - 1 == end.y && start.x == end.x) {
	        cell1 = this.world.getCell(start.x - 1, end.y);
	        cell2 = this.world.getCell(start.x, end.y);
	        if (!cell1 || !cell2 || cell1.rightWallOccupied() || cell2.leftWallOccupied()) {
	            valid = false;
	        }
		}
		// ceiling
		else if (start.x + 1 == end.x && start.y == end.y) {
	        cell1 = this.world.getCell(start.x, start.y - 1);
	        cell2 = this.world.getCell(start.x, start.y);
	        if (!cell1 || !cell2 || cell1.ceilingOccupied() || cell2.floorOccupied()) {
	            valid = false;
	        }
		}
		// floor
		else if (start.x - 1 == end.x && start.y == end.y) {
	        cell1 = this.world.getCell(end.x, start.y);
	        cell2 = this.world.getCell(end.x, start.y - 1);
	        if (!cell1 || !cell2 || cell1.floorOccupied() || cell2.ceilingOccupied()) {
	            valid = false;
	        }
		}
		//diagonal
		else {
	        var x = start.x < end.x ? start.x : end.x;
	        var y = start.y < end.y ? start.y : end.y;
	        cell1 = this.world.getCell(x, y);
	        cell2 = this.world.getCell(x, y);
	        if ((start.x < end.x) === (start.y < end.y)) {
	            if (!cell1 || cell1.posDiagOccupied()) {
	                valid = false;
	            } else diag = 4;
	        } else if (!cell1 || cell1.negDiagOccupied()) {
	            valid = false;
	        } else diag = 5;
		}

		var door;
	    if (!valid) {
	        // Make a dummy door that doesn't do anything
	        door = new RAPT.Door(null, null, null, null, diag);
	    } else if (type === RAPT.ONE_WAY) {
			door = new RAPT.Door(new RAPT.Edge(start, end, color), null, cell1, null, diag);
		} else {
			door = new RAPT.Door(new RAPT.Edge(start, end, color), new RAPT.Edge(end, start, color), cell1, cell2, diag);
		}
	    this.doors.push(door);
		if (!startsOpen) {
			door.act(RAPT.DOORBELL_CLOSE, true, false);
		}
	},
	getDoor : function(doorIndex) { return this.doors[doorIndex]; },

	// Kill all entities that intersect a given edge
	killAll : function(edge) {
		var i;
		for (i = 0; i < 2; ++i) {
			if (this.collider.intersectEntitySegment(this.getPlayer(i), edge.segment)) {
				this.getPlayer(i).setDead(true);
			}
		}

		i = this.enemies.length;
		while(i--){
		//for (var i = 0; i < this.enemies.length; ++i) {
			var enemy = this.enemies[i];
			if (enemy.canCollide() && this.collider.intersectEntitySegment(enemy, edge.segment)) {
				enemy.setDead(true);
			}
		}
	},
	tick : function(seconds) {
		var i;
		if (this.gameStatus === RAPT.GAME_WON || this.gameWon()) {
			this.gameStatus = RAPT.GAME_WON;
		} else if (this.gameStatus === RAPT.GAME_LOST || this.gameLost()) {
			this.gameStatus = RAPT.GAME_LOST;
		}

		this.timeSinceStart += seconds;

		if (this.killKey) {
			this.playerA.setDead(true);
			this.playerB.setDead(true);
		}

		this.playerA.tick(seconds);
		this.playerB.tick(seconds);

		i = this.doors.length;
		while(i--){
			this.doors[i].tick(seconds);
		}

		i = this.enemies.length;
		while(i--){
			this.enemies[i].tick(seconds);
		}

		i = this.enemies.length;
		while(i--){
			if (this.enemies[i].isDead()) this.enemies.splice(i, 1);
		}

		this.spawnPointParticleTimer -= seconds;
		if(this.spawnPointParticleTimer <= 0) {
			var position = this.world.spawnPoint.sub(new RAPT.Vector(0, 0.25));
			RAPT.Particle().position(position).velocity(new RAPT.Vector(RAPT.randInRange(-0.3, 0.3), 0.3)).radius(0.03, 0.05).bounces(0).decay(0.1, 0.2).color(1, 1, 1, 1).circle().gravity(-5);
			this.spawnPointParticleTimer += RAPT.SPAWN_POINT_PARTICLE_FREQ;
		}
	},

	addSpawnPoint:function(center){
		this.startPoint =  new RAPT.SpriteGroup({
			name:'start',
			material:RAPT.MAT_ENEMY,
			size : 1,
			nuv:16,
			uvs:[[14,2],[15,2],[14,3],[15,3]],
			list:['p1', 'p2', 'p3', 'p4'],
			sizes: [ [1,1]  ],
			pos: [ [0,1,0.1], [1,1,0.1], [0,0,0.1],[1,0,0.1]  ],

			//pos: [ [-0.5,0.5,0.1], [0.5,0.5,0.1], [-0.5,-0.5,0.1],[0.5,-0.5,0.1]  ],
		});
		//this.startPoint.move(center.x+0.5, center.y+0.5);
		this.startPoint.moveto(center);
	},
	addGoal:function(center){
		var end =  new RAPT.SpriteGroup({
			name:'end',
			material:RAPT.MAT_ENEMY,
			size : 1,
			nuv:16,
			uvs:[[14,1]],
			list:['p1'],
			sizes: [ [1,1]  ],
			pos:[[0.5,0.5,-0.24]]
		});
		end.moveto(center);
	},
    getInfo : function(){
    	var info = {}
    	info[0] = this.playerA.getInfo();
		info[1] = this.playerB.getInfo();
		return info;
    },
    message : function(s){
		RAPT.MESSAGE.innerHTML = s;
	},


    //---------------------------------------- LOADER
    reset:function(){

    	RAPT.Particle.reset();

    	this.spawnPointParticleTimer = 0;
    	this.timeSinceStart = 0;

		this.spawnPointOffset = new RAPT.Vector();
		this.enemies = [];
		this.doors = [];
		

		// keys (will be set automatically)
		this.killKey = false;

		// if you need to tell if the world has been modified (door has been opened/closed), just watch
		// for changes to this variable, which can be incremented by gameState.recordModification()
		this.modificationCount = 0;

		this.gameStatus = RAPT.GAME_IN_PLAY;
		this.stats = [0, 0, 0, 0];
    },

    loadLevelFromJSON : function(json) {
    	this.reset();
		// values are quoted (like json['width'] instead of json.width) so closure compiler doesn't touch them
		var w = json['width'], h = json['height'], x, y;

		// Reset stats
		//this.stats = [0, 0, 0, 0];

		// create 3d level
		var start = this.jsonToVec(json['start']);
		var end = this.jsonToVec(json['end']);

		// Load size, spawn point, and goal
		//this.world = new RAPT.World(w, h, start, end);
		this.world.init(w, h, start, end);
		
		// Load cells & create edges
		x = w;
		while(x--){
			y = h;
			while(y--){
				var type = json['cells'][y][x];
				this.world.setCell(x, y, type);

				if (type !== RAPT.CELL_SOLID) {
					//this.w3d.setCell(x + 0.5, y + 0.5, type);
					this.world.safety = new RAPT.Vector(x + 0.5, y + 0.5);
				}
			}
		}

		this.world.createAllEdges();

		// create 3d level
		//this.w3d.initLevel(this.world);
		RAPT.W3D.initLevel(this.world);

		// Reset players
		this.playerA.reset(this.world.spawnPoint, RAPT.EDGE_RED);
		this.playerB.reset(this.world.spawnPoint, RAPT.EDGE_BLUE);

		this.playerA.add3d();
		this.playerB.add3d();

		this.addSpawnPoint(start);
		this.addGoal(end);
		
		// Load entities
		for (var i = 0; i < json['entities'].length; ++i) {
			var e = json['entities'][i];
			switch (e['class']) {
				case 'cog': this.enemies.push(new RAPT.GoldenCog(this.jsonToVec(e['pos']))); break;
				case 'wall': RAPT.gameState.addDoor(this.jsonToVec(e['end']), this.jsonToVec(e['start']), e['oneway'] ? RAPT.ONE_WAY : RAPT.TWO_WAY, e['color'], e['open']); break;
				case 'button':
					var button = new RAPT.Doorbell(this.jsonToVec(e['pos']), e['type'], true);
					button.doors = e['walls'];
					this.enemies.push(button);
					break;
				case 'sign': this.enemies.push(new RAPT.HelpSign(this.jsonToVec(e['pos']), e['text'])); break;
				case 'enemy': this.enemies.push(this.jsonToEnemy(e)); break;
			}
		}
	},
	jsonToTarget : function (json) {
		return (json['color'] === 1 ? RAPT.gameState.playerA : RAPT.gameState.playerB);
	},
	jsonToVec : function (json) {
		return new RAPT.Vector(json[0], json[1]);
	},
	jsonToEnemy : function (json) {
		var pos = this.jsonToVec(json['pos']);
		switch (json['type']) {
			case 'bomber': return new RAPT.Bomber(pos, json['angle']);
			case 'bouncy rocket launcher': return new RAPT.BouncyRocketLauncher(pos, this.jsonToTarget(json));
			case 'corrosion cloud': return new RAPT.CorrosionCloud(pos, this.jsonToTarget(json));
			case 'doom magnet': return new RAPT.DoomMagnet(pos);
			case 'grenadier': return new RAPT.Grenadier(pos, this.jsonToTarget(json));
			case 'jet stream': return new RAPT.JetStream(pos, json['angle']);
			case 'headache': return new RAPT.Headache(pos, this.jsonToTarget(json));
			case 'hunter': return new RAPT.Hunter(pos);
			case 'multi gun': return new RAPT.MultiGun(pos);
			case 'popper': return new RAPT.Popper(pos);
			case 'rocket spider': return new RAPT.RocketSpider(pos, json['angle']);
			case 'shock hawk': return new RAPT.ShockHawk(pos, this.jsonToTarget(json));
			case 'spike ball': return new RAPT.SpikeBall(pos);
			case 'stalacbat': return new RAPT.Stalacbat(pos, this.jsonToTarget(json));
			case 'wall avoider': return new RAPT.WallAvoider(pos, this.jsonToTarget(json));
			case 'wall crawler': return new RAPT.WallCrawler(pos, json['angle']);
			case 'wheeligator': return new RAPT.Wheeligator(pos, json['angle']);
			default:
				console.log('Invalid enemy type in level');
				return new RAPT.SpikeBall(pos);
		}
	}
}