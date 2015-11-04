(function(w){
    var perfNow;
    var perfNowNames = ['now', 'webkitNow', 'msNow', 'mozNow'];
    if(!!w['performance']) for(var i = 0; i < perfNowNames.length; ++i){
        var n = perfNowNames[i];
        if(!!w['performance'][n]){
            perfNow = function(){return w['performance'][n]()};
            break;
        }
    }
    if(!perfNow) perfNow = Date.now;
    w.perfNow = perfNow;
})(window);

/*if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}*/

var THREE;

var playNext = playNext || null;

var RAPT = RAPT || {};

RAPT.MESSAGE = null;

RAPT.LEVELS = [
"Intro 1","Intro 2","Intro 3","Intro 4","It's Okay, You Can Press Escape","Doomed","Mr. Four-Arms","Chain","Traps","Walk Through Walls",
"My Head 'Asplode","No Cover","Hunter Food","Run!","Shocker","Laserland","Up and Down","Leap Of Faith","Sandwiched", "Clock Tower","Stick Together",
"Foursquare","Going Down Faster","Bomberland","Coordinated Panic","Going Down","Look But Don't Touch","Triple Threat",
"Better Keep Moving","Tour","Cube"
];


RAPT.gameScale = 60;

// text constants
var GAME_WIN_TEXT = "You won!  Hit SPACE to play the next level or ESC for the level selection menu.";
var GOLDEN_COG_TEXT = "You earned a golden cog!";
var SILVER_COG_TEXT = "You earned a silver cog!";
var GAME_LOSS_TEXT = "You lost.  Hit SPACE to restart, or ESC to select a new level.";
var TEXT_BOX_X_MARGIN = 6;
var TEXT_BOX_Y_MARGIN = 6;
var SECONDS_BETWEEN_TICKS = 1 / 60;
var useFixedPhysicsTick = false;


RAPT.gameState = null;
//RAPT.game = null;

//_____________________________GAME

RAPT.Game = function(message) {

	RAPT.MESSAGE = message;

    this.w = window.innerWidth;
    this.h = window.innerHeight;

	this.json = null;
	this.fps = 0;
	this.fixedPhysicsTick = 0;

	this.isDone = false;
	this.onWin = null;
	//this.w3d = w3d;

	this.timeNow = 0;
    this.delta = 0;
    this.then = 0;

    this.timerStep = 1000/60;
    this.lastTime = 0;

    this.pause = false;
	
	// whether this game is the last level in the menu, this will be updated by main.js when the menu loads
	//this.lastLevel = false;

	RAPT.gameState = new RAPT.GameState();

}

RAPT.Game.prototype = {
	constructor: RAPT.Game,
	resize : function() {
		this.w = window.innerWidth;
		this.h = window.innerHeight;
	},

    makePause : function(){
        this.pause = true;
    },
    stopPause:function(){
        this.pause = false;
        this.lastTime = window.perfNow();
    },
	tick : function() {
        if(this.pause) return;

		var currentTime = window.perfNow();//Date.now();//new Date();
        var seconds = (currentTime - this.lastTime) * 0.001;
        this.lastTime = currentTime;




       // this.delta = currentTime - this.then;
        //var seconds = (currentTime - (this.lastTime % this.timerStep)) * 0.001;
       // var seconds = this.delta* 0.001; //(currentTime - this.lastTime) * 0.001;
       // this.lastTime = currentTime;

        //this.then = this.timeNow - (this.delta % this.timerStep);

        //RAPT.W3D.tell(currentTime);

		// when the screen isn't split, standing at the original spawn point:
		// * Triple Threat
		//	 - variable physics tick: 30 FPS
		//	 - fixed physics tick: 25 FPS
		// * Cube
		//	 - variable physics tick: 35 FPS
		//	 - fixed physics tick: 30 FPS
		// * Coordinated Panic
		//	 - variable physics tick: 55 FPS
		//	 - fixed physics tick: 50 FPS
		// overall, a fixed physics tick provides about 5 FPS drop but fixes a lot of
		// gameplay issues (measurements above approximate but within about +/-1) 

		if (useFixedPhysicsTick) {
			// fixed physics tick
			var count = 0;
			this.fixedPhysicsTick += seconds;
			while (++count <= 3 && this.fixedPhysicsTick >= 0) {
				this.fixedPhysicsTick -= SECONDS_BETWEEN_TICKS;
				RAPT.gameState.tick(SECONDS_BETWEEN_TICKS);
				RAPT.Particle.tick(SECONDS_BETWEEN_TICKS);
				this.update3d();
			}
		} else {
			// variable physics tick
			RAPT.gameState.tick(seconds);
			RAPT.Particle.tick(seconds);

			this.update3d();
		}


		// smooth the fps a bit
		//this.fps = RAPT.lerp(this.fps, 1 / seconds, 0.05);
        //RAPT.W3D.tell(this.fps);
		
		// handle winning the game
		if (!this.isDone && RAPT.gameState.gameStatus != RAPT.GAME_IN_PLAY) {
			this.isDone = true;
			if (RAPT.gameState.gameStatus == RAPT.GAME_WON && this.onWin) {
				this.onWin();
			}
		}
	},
	message : function(s){
		RAPT.MESSAGE.innerHTML = s;
	},

	update3d : function(){
		var mid = this.width2*0.25;
		var positionA = RAPT.gameState.playerA.getCenter();
		var positionB = RAPT.gameState.playerB.getCenter();

        var w = this.w / RAPT.gameScale;
        var h = this.h / RAPT.gameScale;

		var center = positionA.add(positionB).div(2);
		// maximum distance between a player and the center is the distance to the box that is half the size of the screen
		var temp = positionB.sub(positionA).unit();
		temp = new RAPT.Vector(w / Math.abs(temp.x), h / Math.abs(temp.y));
		var maxLength = Math.min(temp.x, temp.y) * 0.25;

		var isSplit = (positionB.sub(positionA).lengthSquared() > 4*maxLength*maxLength);

		//this.w3d.setSplit(isSplit);
		RAPT.W3D.setSplit(isSplit);

		if(!isSplit) {
			//this.w3d.upCamera(center.x, center.y, 0);
			RAPT.W3D.upCamera(center.x, center.y, 0);
		}else{
			var AtoB = positionB.sub(positionA).unit().mul(99);
			var split = AtoB.flip();

			// make sure a's center isn't more than maxLength from positionA
			var centerA = center.sub(positionA);
			if(centerA.lengthSquared() > maxLength*maxLength)  centerA = centerA.unit().mul(maxLength);
			centerA = centerA.add(positionA);

			// make sure b's center isn't more than maxLength from positionB
			var centerB = center.sub(positionB);
			if(centerB.lengthSquared() > maxLength*maxLength) centerB = centerB.unit().mul(maxLength);
			centerB = centerB.add(positionB);

			RAPT.W3D.upCamera(centerA.x, centerA.y, 1);
			RAPT.W3D.upCamera(centerB.x, centerB.y, 2);

			var splitSize = Math.min(0.1, (positionB.sub(positionA).length() - 1.9 * maxLength) * 0.01);
			//var angle = Math.atan( (split.y + split.y) / (split.x + split.x ) ) - (Math.PI*0.5)
			var angle = Math.atan2( (split.y + split.y) , (split.x + split.x ) ) - (Math.PI*0.5);
			//this.w3d.effect.setAngle(-angle);
			//this.w3d.effect.setFuzzy(splitSize);

			RAPT.W3D.effect.setAngle(-angle);
			RAPT.W3D.effect.setFuzzy(splitSize);
		}


		if (RAPT.gameState.gameStatus === RAPT.GAME_WON) {
			var gameWinText = (this.lastLevel ? "Congratulations, you beat the last level in this set!	Press SPACE or ESC to return to the level selection menu." : GAME_WIN_TEXT);
			var cogsCollectedText = "<br>Cogs Collected: " + RAPT.gameState.stats[RAPT.STAT_COGS_COLLECTED] + "/" + RAPT.gameState.stats[RAPT.STAT_NUM_COGS];
			this.message(gameWinText+cogsCollectedText)
		}else if (RAPT.gameState.gameStatus === RAPT.GAME_LOST) {
			this.message(GAME_LOSS_TEXT);
		}

	},

	load : function (levelname) {
        var xhr = new XMLHttpRequest();
        var _this = this;
        xhr.onreadystatechange =  function() {
            if (xhr.readyState == 4){
            	_this.json = JSON.parse(this.responseText);
            	_this.restart();
            }
        };
        xhr.open("get", 'level/'+levelname+'.json', true);
        xhr.send();
    },
    restart : function() {
        
        RAPT.gameState.loadLevelFromJSON(this.json);
    },
	keyDown : function(e) {
		var keyCode = e.which;
		var action = RAPT.Keys.fromKeyCode(keyCode);
		if (action != null) {
			if (action.indexOf('a-') == 0) RAPT.gameState.playerA[action.substr(2)] = true;
			else if (action.indexOf('b-') == 0) RAPT.gameState.playerB[action.substr(2)] = true;
			else RAPT.gameState[action] = true;
			e.preventDefault();
			e.stopPropagation();
		}
		if (keyCode === 32) {// space
            if (RAPT.gameState.gameStatus === RAPT.GAME_WON) playNext();
            else this.restart();
        }
	},
	keyUp : function(e) {
		var keyCode = e.which;
		var action = RAPT.Keys.fromKeyCode(keyCode);
		if (action != null) {
			if (action.indexOf('a-') == 0) RAPT.gameState.playerA[action.substr(2)] = false;
			else if (action.indexOf('b-') == 0) RAPT.gameState.playerB[action.substr(2)] = false;
			else RAPT.gameState[action] = false;
			e.preventDefault();
			e.stopPropagation();
		}
	}
}


RAPT.Keys = {
	keyMap: {
		'killKey': 75,     // k key

		// player a
		'a-jumpKey': 38,   // up arrow key
		'a-crouchKey': 40, // down arrow key
		'a-leftKey': 37,   // left arrow key
		'a-rightKey': 39,  // right arrow key

		// player b
		'b-jumpKey': 87,   // w key
		'b-jumpKey2': 90,   // z key
		'b-crouchKey': 83, // s key
		'b-leftKey': 65,   // a key
		'b-leftKey2': 81,   // q key
		'b-rightKey': 68   // d key
	},

	fromKeyCode: function(keyCode) {
		for (var name in this.keyMap) {
			if (keyCode == this.keyMap[name]) {
				if(name=='b-jumpKey2')name = 'b-jumpKey';
				if(name=='b-leftKey2')name = 'b-leftKey';
				return name;
			}
		}
		return null;
	},
};



RAPT.random = Math.random;
RAPT.lerp = function (a, b, percent) { return a + (b - a) * percent; }
RAPT.randInRange = function (a, b) { return RAPT.lerp(a, b, RAPT.random()); }
RAPT.randInt = function (a, b, n) { return RAPT.lerp(a, b, RAPT.random()).toFixed(n || 0)*1;}

RAPT.PI    = 3.141592653589793;
RAPT.PI90  = 1.570796326794896;
RAPT.PI270 = 4.712388980384689;
RAPT.TwoPI = 6.283185307179586;

RAPT.ToRad = 0.0174532925199432957;
RAPT.ToDeg = 57.295779513082320876;


RAPT.adjustAngleToTarget = function (currAngle, targetAngle, maxRotation) {
    if (targetAngle - currAngle > RAPT.PI) currAngle += RAPT.TwoPI;
    else if (currAngle - targetAngle > RAPT.PI) currAngle -= RAPT.TwoPI;

    var deltaAngle = targetAngle - currAngle;
    if (Math.abs(deltaAngle) > maxRotation) deltaAngle = (deltaAngle > 0 ? maxRotation : -maxRotation);
    currAngle += deltaAngle;
    currAngle -= Math.floor(currAngle / RAPT.TwoPI) * RAPT.TwoPI;
    return currAngle;
}

// class Vector

RAPT.Vector = function (x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

RAPT.Vector.prototype = {
	constructor: RAPT.Vector,
	// math operations
	neg : function() { return new RAPT.Vector(-this.x, -this.y); },
	add : function(v) { return new RAPT.Vector(this.x + v.x, this.y + v.y); },
	sub : function(v) { return new RAPT.Vector(this.x - v.x, this.y - v.y); },
	mul : function(f) { return new RAPT.Vector(this.x * f, this.y * f); },
	div : function(f) { return new RAPT.Vector(this.x / f, this.y / f); },
	eq : function(v) { return Math.abs(this.x - v.x) + Math.abs(this.y - v.y) < 0.001; },

	// inplace operations
	inplaceNeg : function() { this.x = -this.x; this.y = -this.y; },
	inplaceAdd : function(v) { this.x += v.x; this.y += v.y; },
	inplaceSub : function(v) { this.x -= v.x; this.y -= v.y; },
	inplaceMul : function(f) { this.x *= f; this.y *= f; },
	inplaceDiv : function(f) { this.x /= f; this.y /= f; },
	inplaceFlip : function() { var t = this.x; this.x = this.y; this.y = -t; }, // turns 90 degrees right

	// other functions
	clone : function() { return new RAPT.Vector(this.x, this.y); },
	dot : function(v) { return this.x*v.x + this.y*v.y; },
	lengthSquared : function() { return this.dot(this); },
	length : function() { return Math.sqrt(this.lengthSquared()); },
	unit : function() { return this.div(this.length()); },
	normalize : function() { var len = this.length(); this.x /= len; this.y /= len; },
	flip : function() { return new RAPT.Vector(this.y, -this.x); }, // turns 90 degrees right
	atan2 : function() { return Math.atan2(this.y, this.x); },
	angleBetween : function(v) { return this.atan2() - v.atan2(); },
	rotate : function(theta) { var s = Math.sin(theta), c = Math.cos(theta); return new RAPT.Vector(this.x*c - this.y*s, this.x*s + this.y*c); },
	minComponents : function(v) { return new RAPT.Vector(Math.min(this.x, v.x), Math.min(this.y, v.y)); },
	maxComponents : function(v) { return new RAPT.Vector(Math.max(this.x, v.x), Math.max(this.y, v.y)); },
	projectOntoAUnitVector : function(v) { return v.mul(this.dot(v)); },
	toString : function() { return '(' + this.x.toFixed(3) + ', ' + this.y.toFixed(3) + ')'; },
	adjustTowardsTarget : function(target, maxDistance) {
		var v = ((target.sub(this)).lengthSquared() < maxDistance * maxDistance) ? target : this.add((target.sub(this)).unit().mul(maxDistance));
		this.x = v.x;
		this.y = v.y;
	},

	// static functions
	fromAngle : function(theta) { return new RAPT.Vector(Math.cos(theta), Math.sin(theta)); },
	lerp : function(a, b, percent) { return a.add(b.sub(a).mul(percent)); }
}
RAPT.SHAPE_CIRCLE = 0;
RAPT.SHAPE_AABB = 1;
RAPT.SHAPE_POLYGON = 2;

RAPT.MAX_VELOCITY = 30;
RAPT.MAX_COLLISIONS = 20;
// if the collision detection system fails, what elasticity should we use?
RAPT.MAX_EMERGENCY_ELASTICITY = 0.5;
RAPT.ON_MARGIN = 0.01;
RAPT.MAX_LOS_DISTANCE_SQUARED = 625;

// how far should we push something out if there's an emergency?
RAPT.EMERGENCY_PUSH_DISTANCE = 0.1;


RAPT.Contact = function (contactPoint, normal, proportionOfDelta) {
	this.proportionOfDelta = proportionOfDelta;
	this.contactPoint = contactPoint;
	this.normal = normal;
}

RAPT.CollisionDetector = function (){

};

RAPT.CollisionDetector.prototype = {
	constructor: RAPT.CollisionDetector,
	collideEntityWorld : function(entity, ref_deltaPosition, ref_velocity, elasticity, world, emergency) {
		return this.collideShapeWorld(entity.getShape(), ref_deltaPosition, ref_velocity, elasticity, world, entity.getColor(), emergency);
	},
	collideShapeWorld : function(shape, ref_deltaPosition, ref_velocity, elasticity, world, color, emergency) {
		// only chuck norris may divide by zero
		if(ref_deltaPosition.ref.lengthSquared() < 0.000000000001){
			ref_deltaPosition.ref = new RAPT.Vector(0, 0);
			return null;
		}

		// clamp the velocity, so this won't blow up
		// if we don't, the aabb will get too big.
		if(ref_velocity.ref.lengthSquared() > RAPT.MAX_VELOCITY * RAPT.MAX_VELOCITY) {
			ref_velocity.ref = ref_velocity.ref.unit().mul(RAPT.MAX_VELOCITY);
		}

		// this stores the contact that happened last (if any)
		// since this can hit multiple items in a single timestep
		var lastContact = null;

		var originalDelta = ref_deltaPosition.ref;
		var originalVelocity = ref_velocity.ref;

		// try this up to a certain number of times, if we get there we are PROBABLY stuck.
		var i = RAPT.MAX_COLLISIONS;
		while(i--){
			// check all the edges in the expanded bounding box of the swept area
			var newShape = shape.copy();
			newShape.moveBy(ref_deltaPosition.ref);
			var areaToCheck = shape.getAabb().union(newShape.getAabb());
			var edges = world.getEdgesInAabb(areaToCheck, color);

			// make a temporary new contact in case there is (another) collision
			var newContact = null;

			// see if this setting for deltaPosition causes a collision
			var it = edges.length;
			while(it--){
				var edge = edges[it];
				var segmentContact = this.collideShapeSegment(shape, ref_deltaPosition.ref, edge.segment);
				if(newContact === null || (segmentContact !== null && segmentContact.proportionOfDelta < newContact.proportionOfDelta)) {
					newContact = segmentContact;
				}
			}

			// if we didn't hit anything this iteration, return our last hit
			// on the first iteration, this means return NULL
			if(newContact === null){
				this.emergencyCollideShapeWorld(shape, ref_deltaPosition, ref_velocity, world);
				return lastContact;
			}

			// modify the velocity to not be pointing into the edge
			var velocityPerpendicular = ref_velocity.ref.projectOntoAUnitVector(newContact.normal);
			var velocityParallel = ref_velocity.ref.sub(velocityPerpendicular);
			ref_velocity.ref = velocityParallel.add(velocityPerpendicular.mul(-elasticity));

			// push the delta-position out of the edge
			var deltaPerpendicular = ref_deltaPosition.ref.projectOntoAUnitVector(newContact.normal);
			var deltaParallel = ref_deltaPosition.ref.sub(deltaPerpendicular);

			// TODO: This was here when I ported this, but it is incorrect because it
			// stops you short of an edge, which is good except the distance from that
			// edge grows with your speed.	A correct version is after this.
			// ref_deltaPosition.ref = ref_deltaPosition.ref.mul(newContact.proportionOfDelta).projectOntoAUnitVector(newContact.normal).mul(-elasticity).add(deltaParallel).add(newContact.normal.mul(0.001));

			var proportionLeft = 1 - newContact.proportionOfDelta;
			ref_deltaPosition.ref = ref_deltaPosition.ref.mul(newContact.proportionOfDelta).add(deltaPerpendicular.mul(-elasticity*proportionLeft)).add(deltaParallel.mul(proportionLeft)).add(newContact.normal.mul(0.0001));

			// the newly found contact is now the last one
			lastContact = newContact;
		}

		if(typeof console !== 'undefined' && console.log) {
			console.log("Collision loop ran out, damn!");
		}

		// if we are all looped out, take some emergency collision prevention measures.
		ref_deltaPosition.ref = new RAPT.Vector(0, 0);
		ref_velocity.ref = originalVelocity.mul(-(elasticity < RAPT.MAX_EMERGENCY_ELASTICITY ? elasticity : RAPT.MAX_EMERGENCY_ELASTICITY));
		if(emergency) this.emergencyCollideShapeWorld(shape, {ref: originalDelta}, ref_velocity, world);
		
		return lastContact;
	},
	overlapShapePlayers : function(shape) {
		var players = [];
		if(this.overlapShapes(RAPT.gameState.playerA.getShape(), shape)) players.push(RAPT.gameState.playerA);
		if(this.overlapShapes(RAPT.gameState.playerB.getShape(), shape)) players.push(RAPT.gameState.playerB);
		return players;
	},
	overlapPlayers : function() {
		return this.overlapShapes(RAPT.gameState.playerA.getShape(), RAPT.gameState.playerB.getShape());
	},
	// on-edges
	onEntityWorld : function(entity, edgeQuad, world) {
		this.penetrationEntityWorld(entity, edgeQuad, world);
		edgeQuad.throwOutIfGreaterThan(RAPT.ON_MARGIN);
	},
	// line of sight
	lineOfSightWorld : function(eye, target, world) {
		// if the target is too far, we can't see it
		if(target.sub(eye).lengthSquared() > (RAPT.MAX_LOS_DISTANCE_SQUARED)) return null;
		

		var edges = world.getEdgesInAabb(new RAPT.AABB(eye, target), RAPT.EDGE_ENEMIES);
		var minLosProportion = 1.1;
		var ref_edgeProportion = {};  // throwaway
		var ref_contactPoint = {};	// throwaway
		var firstEdge = null;

		var it = edges.length;
		while(it--){
			// this is only for edges that face towards the eye
			if(target.sub(eye).dot(edges[it].segment.normal) >= 0) continue;
			
			// find the edge closest to the viewer
			var ref_losProportion = {};

			// if the LOS is not blocked by this edge, then ignore this edge
			if(!this.intersectSegments(new RAPT.Segment(eye, target), edges[it].segment, ref_losProportion, ref_edgeProportion, ref_contactPoint)) continue;
			

			// if another edge was already closer, ignore this edge
			if(ref_losProportion.ref >= minLosProportion) continue;
			

			// otherwise this is the closest edge to the eye
			minLosProportion = ref_losProportion.ref;
			firstEdge = edges[it];
		}

		return firstEdge;
	},

	// puts the closest point in the world into worldpoint and the one on the shape
	// to shapepoint, returns the distance to the closest point in the world to the shape
	// will always find any point within radius of any point on the shape, may find ones farther out
	// returns infinity if nothing was found within radius
	closestToEntityWorld : function(entity, radius, ref_shapePoint, ref_worldPoint, world) {
		var shape = entity.getShape();
		var boundingBox = shape.getAabb().expand(radius);
		var edges = world.getEdgesInAabb(boundingBox, entity.getColor());

		var distance = Number.POSITIVE_INFINITY;
		var it = edges.length;
		while(it--){
			var ref_thisShapePoint = {}, ref_thisWorldPoint = {};
			var thisDistance = this.closestToShapeSegment(shape, ref_thisShapePoint, ref_thisWorldPoint, edges[it].segment);
			if(thisDistance < distance){
				distance = thisDistance;
				ref_shapePoint.ref = ref_thisShapePoint.ref;
				ref_worldPoint.ref = ref_thisWorldPoint.ref;
			}
		}
		return distance;
	},
	containsPointShape : function(point, shape) {
		switch(shape.getType()){
		case RAPT.SHAPE_CIRCLE:
			return (point.sub(shape.center).lengthSquared() < shape.radius * shape.radius);

		case RAPT.SHAPE_AABB:
			return (point.x >= shape.lowerLeft.x && point.x <= shape.lowerLeft.x + shape.size.x && point.y >= shape.lowerLeft.y && point.y <= shape.lowerLeft.y + shape.size.y);

		case RAPT.SHAPE_POLYGON:
		    var i = shape.vertices.length;
		    while(i--){
				// Is this point outside this edge?  if so, it's not inside the polygon
				if (point.sub(shape.vertices[i].add(shape.center)).dot(shape.segments[i].normal) > 0) return false;
			}
			// if the point was inside all of the edges, then it's inside the polygon.
			return true;
		}

		alert('assertion failed in CollisionDetector.containsPointShape');
	},

	// intersect, disregards entity color
	intersectEntitySegment : function(entity, segment) {
		return this.intersectShapeSegment(entity.getShape(), segment);
	},

	////////////////////////////////////////////////////////////////////////////////
	// private functions
	////////////////////////////////////////////////////////////////////////////////

	// INTERSECTIONS
	intersectSegments : function(segment0, segment1, ref_segmentProportion0, ref_segmentProportion1, ref_contactPoint) {
		var segStart0 = segment0.start;
		var segEnd0 = segment0.end;
		var segSize0 = segEnd0.sub(segStart0);
		var segStart1 = segment1.start;
		var segEnd1 = segment1.end;
		var segSize1 = segEnd1.sub(segStart1);

		// make sure these aren't parallel
		if(Math.abs(segSize0.dot(segSize1.flip())) < 0.000001) return false;

		// calculate the point of intersection...
		ref_segmentProportion0.ref = ((segStart1.y - segStart0.y) * segSize1.x + (segStart0.x - segStart1.x) * segSize1.y) / (segSize0.y  * segSize1.x - segSize1.y * segSize0.x);
		ref_segmentProportion1.ref = ((segStart0.y - segStart1.y) * segSize0.x + (segStart1.x - segStart0.x) * segSize0.y) / (segSize1.y * segSize0.x - segSize0.y  * segSize1.x);

		// where do these actually meet?
		ref_contactPoint.ref = segStart0.add(segSize0.mul(ref_segmentProportion0.ref));

		// make sure the point of intersection is inside segment0
		if(ref_segmentProportion0.ref < 0 || ref_segmentProportion0.ref > 1) return false;
		
		// make sure the point of intersection is inside segment1
		if(ref_segmentProportion1.ref < 0 || ref_segmentProportion1.ref > 1) return false;
		
		// now that we've checked all this, the segments do intersect.
		return true;
	},
	intersectCircleLine : function(circle, line, ref_lineProportion0, ref_lineProportion1) {
		// variables taken from http://local.wasp.uwa.edu.au/~pbourke/geometry/sphereline/
		// thanks, internet!

		var lineStart = line.start;
		var lineEnd = line.end;
		var lineSize = lineEnd.sub(lineStart);

		// find quadratic equation variables
		var a = lineSize.lengthSquared();
		var b = 2 * lineSize.dot(lineStart.sub(circle.center));
		var c = lineStart.sub(circle.center).lengthSquared() - circle.radius * circle.radius;

		var insideSqrt = b * b - 4 * a * c;
		if(insideSqrt < 0) return false;

		// calculate the point of intersection...
		//ref_lineProportion0.ref = (-b - Math.sqrt(insideSqrt)) * 0.5 / a;
		//ref_lineProportion1.ref = (-b + Math.sqrt(insideSqrt)) * 0.5 / a;

		var raa = 1/a;
		ref_lineProportion0.ref = (-b - Math.sqrt(insideSqrt)) * 0.5 * raa;
		ref_lineProportion1.ref = (-b + Math.sqrt(insideSqrt)) * 0.5 * raa;

		return true;
	},
	intersectShapeSegment : function(shape, segment) {
		switch(shape.getType()) {
    		case RAPT.SHAPE_CIRCLE: return this.intersectCircleSegment(shape, segment);
    		case RAPT.SHAPE_AABB: return this.intersectPolygonSegment(shape.getPolygon(), segment);
    		case RAPT.SHAPE_POLYGON: return this.intersectPolygonSegment(shape, segment);
		}

		alert('assertion failed in CollisionDetector.intersectShapeSegment');
	},
	intersectCircleSegment : function(circle, segment) {
		var ref_lineProportion0 = {}, ref_lineProportion1 = {};

		if(!this.intersectCircleLine(circle, segment, ref_lineProportion0, ref_lineProportion1)) return false;
		if(ref_lineProportion0.ref >= 0 && ref_lineProportion0.ref <= 1) return true;

		return (ref_lineProportion1.ref >= 0 && ref_lineProportion1.ref <= 1);
	},
	intersectPolygonSegment : function(polygon, segment) {
		// may fail on large enemies (if the segment is inside)

		var ref_segmentProportion0 = {}, ref_segmentProportion1 = {}, ref_contactPoint = {};
		var i = polygon.vertices.length;
		while(i--){
			if(this.intersectSegments(polygon.getSegment(i), segment, ref_segmentProportion0, ref_segmentProportion1, ref_contactPoint)) return true;
		}

		return false;
	},

	// COLLISIONS
	collideShapeSegment : function(shape, deltaPosition, segment) {
		var segmentNormal = segment.normal;

		// if the shape isn't traveling into this edge, then it can't collide with it
		if(deltaPosition.dot(segmentNormal) > 0.0) return null;
		

		switch(shape.getType()) {
    		case RAPT.SHAPE_CIRCLE: return this.collideCircleSegment(shape, deltaPosition, segment);
    		case RAPT.SHAPE_AABB: return this.collidePolygonSegment(shape.getPolygon(), deltaPosition, segment);
    		case RAPT.SHAPE_POLYGON: return this.collidePolygonSegment(shape, deltaPosition, segment);
		}

		alert('assertion failed in CollisionDetector.collideShapeSegment');
	},
	collideCircleSegment : function(circle, deltaPosition, segment) {
		var segmentNormal = segment.normal;

		// a directed radius towards the segment
		var radiusToLine = segmentNormal.mul(-circle.radius);

		// position of this circle after being moved
		var newCircle = new RAPT.Circle(circle.center.add(deltaPosition), circle.radius);

		// the point on the new circle farthest "in" this segment
		var newCircleInnermost = newCircle.center.add(radiusToLine);

		var endedInside = newCircleInnermost.sub(segment.start).dot(segmentNormal) < 0.001;

		// if the circle didn't end inside this segment, then it's not a collision.
		if(!endedInside) return null;
		

		// the point on the circle farthest "in" this segment, before moving
		var circleInnermost = newCircleInnermost.sub(deltaPosition);

		// did this circle start completely outside this segment?
		var startedOutside = circleInnermost.sub(segment.start).dot(segmentNormal) > 0;

		// if the circle started outside this segment, then it might have hit the flat part of this segment
		if(startedOutside) {
			var ref_segmentProportion = {}, ref_proportionOfDelta = {}, ref_contactPoint = {};
			if(this.intersectSegments(segment, new RAPT.Segment(circleInnermost, newCircleInnermost), ref_segmentProportion, ref_proportionOfDelta, ref_contactPoint)) {
				// we can return this because the circle will always hit the flat part before it hits an end
				return new RAPT.Contact(ref_contactPoint.ref, segmentNormal, ref_proportionOfDelta.ref);
			}
		}

		// get the contacts that occurred when the edge of the circle hit an endpoint of this edge.
		var startContact = this.collideCirclePoint(circle, deltaPosition, segment.start);
		var endContact = this.collideCirclePoint(circle, deltaPosition, segment.end);

		// select the collision that occurred first
		if(!startContact && !endContact) return null;
		if(startContact && !endContact) return startContact;
		if(!startContact && endContact) return endContact;
		if(startContact.proportionOfDelta < endContact.proportionOfDelta) return startContact;
		return endContact;
	},
	collideCirclePoint : function(circle, deltaPosition, point) {
		// deltaProportion1 is a throwaway
		// we can only use segmentProportion0 because segmentProportion1 represents the intersection
		// when the circle travels so that the point moves OUT of it, so we don't want to stop it from doing that.
		var ref_deltaProportion0 = {}, ref_deltaProportion1 = {};

		// BUGFIX: shock hawks were disappearing on Traps when deltaPosition was very small, which caused
		// us to try to solve a quadratic with a second order coefficient of zero and put NaNs everywhere
		var delta = deltaPosition.length();
		if (delta < 0.0000001) return false;
		
		// if these don't intersect at all, then forget about it.
		if(!this.intersectCircleLine(circle, new RAPT.Segment(point, point.sub(deltaPosition)), ref_deltaProportion0, ref_deltaProportion1)) return null;

		// check that this actually happens inside of the segment.
		if(ref_deltaProportion0.ref < 0 || ref_deltaProportion0.ref > 1) return null;

		// find where the circle will be at the time of the collision
		var circleCenterWhenCollides = circle.center.add(deltaPosition.mul(ref_deltaProportion0.ref));

		return new RAPT.Contact(point, circleCenterWhenCollides.sub(point).unit(), ref_deltaProportion0.ref);
	},
	collidePolygonSegment : function(polygon, deltaPosition, segment) {
		// use these for storing parameters about the collision.
		var ref_edgeProportion = {}; // throwaway
		var ref_deltaProportion = {}; // how far into the timestep we get before colliding
		var ref_contactPoint = {}; // where we collide

		// if this was touching the segment before, NO COLLISION
		if(this.intersectPolygonSegment(polygon, segment)) return null;	

		// the first instance of contact
		var firstContact = null;
		var i;

		// for each side of the polygon, check the edge's endpoints for a collision
        i = polygon.vertices.length;
        while(i--){

			var edgeEndpoints = [segment.start, segment.end];
			var edgeMiddle = segment.start.add(segment.end).div(2);

			// for each endpoint of the edge
			var j = 2;
			while(j--){

				var polygonSegment = polygon.getSegment(i);
				// if the polygon is trying to pass out of the edge, no collision
				if(polygonSegment.normal.dot(edgeEndpoints[j].sub(edgeMiddle)) > 0) {
					continue;
				}

				// if these don't intersect, ignore this edge
				if(!this.intersectSegments(polygonSegment, new RAPT.Segment(edgeEndpoints[j], edgeEndpoints[j].sub(deltaPosition)), ref_edgeProportion, ref_deltaProportion, ref_contactPoint)) {
					continue;
				}

				// if this contact is sooner, or if there wasn't one before, then we'll use this one
				if(!firstContact || ref_deltaProportion.ref < firstContact.proportionOfDelta) {
					firstContact = new RAPT.Contact(ref_contactPoint.ref, polygonSegment.normal.mul(-1), ref_deltaProportion.ref);
				}
			}
		}

		// for each point of the polygon, check for a collision
        i = polygon.vertices.length;
        while(i--){
	        var vertex = polygon.getVertex(i);
			// if these don't intersect, ignore this edge
			if(!this.intersectSegments(segment, new RAPT.Segment(vertex, vertex.add(deltaPosition)), ref_edgeProportion, ref_deltaProportion, ref_contactPoint)) {
				continue;
			}

			// if this contact is sooner, or if there wasn't one before, then we'll use this one
			if(!firstContact || ref_deltaProportion.ref < firstContact.proportionOfDelta) {
				firstContact = new RAPT.Contact(ref_contactPoint.ref, segment.normal, ref_deltaProportion.ref);
			}
		}

		// return the first instance of contact
		return firstContact;
	},

	// EMERGENCY COLLISIONS, PREVENTS FALLING THROUGH FLOORS
	emergencyCollideShapeWorld : function(shape, ref_deltaPosition, ref_velocity, world) {
		// do we need to push this shape anywhere?
		var push = false;

		var newShape = shape.copy();
		newShape.moveBy(ref_deltaPosition.ref);

		if(newShape.getAabb().getBottom() < 0) { push = true; }
		if(newShape.getAabb().getTop() > world.height) { push = true; }
		if(newShape.getAabb().getLeft() < 0) { push = true; }
		if(newShape.getAabb().getRight() > world.width) { push = true; }

		if(!push){
			var cells = world.getCellsInAabb(newShape.getAabb());
            var it = cells.length;
            while(it--){
				var cellShape = cells[it].getShape();
				if(!cellShape) {
					continue;
				}

				if(this.overlapShapes(newShape, cellShape)){
					push = true;
					break;
				}
			}
		}

		if(push){
			var minX = Math.floor(newShape.getCenter().x) - 3;
			var maxX = Math.floor(newShape.getCenter().x) + 3;
			var minY = Math.floor(newShape.getCenter().y) - 3;
			var maxY = Math.floor(newShape.getCenter().y) + 3;

			// find the closest open square, push toward that
			var bestSafety = world.safety;
			for(var x = minX; x <= maxX; x++){
				for(var y = minY; y <= maxY; y++){
					// if this cell doesn't exist or has a shape in it, not good to push towards.
					if(!world.getCell(x, y) || world.getCell(x, y).type != RAPT.CELL_EMPTY) {
						continue;
					}

					// loop through centers of squares and replace if closer
					var candidateSafety = new RAPT.Vector(x + 0.5, y + 0.5);
					if(candidateSafety.sub(newShape.getCenter()).lengthSquared() < bestSafety.sub(newShape.getCenter()).lengthSquared()) {
						bestSafety = candidateSafety;
					}
				}
			}

			newShape.moveBy(bestSafety.sub(newShape.getCenter()).unit().mul(RAPT.EMERGENCY_PUSH_DISTANCE));
			ref_deltaPosition.ref = newShape.getCenter().sub(shape.getCenter());

			// REMOVED TO PREVENT STOPPING WHEELIGATORS / THE PLAYER
			// ref_velocity.ref = new Vector(0, 0);
		}
	},

	// OVERLAPS
	overlapShapes : function(shape0, shape1) {
		var shapeTempPointer = null;
		var shape0Pointer = shape0.copy();
		var shape1Pointer = shape1.copy();

		// convert aabb's to polygons
		if(shape0Pointer.getType() == RAPT.SHAPE_AABB){
			shapeTempPointer = shape0Pointer;
			shape0Pointer = shape0Pointer.getPolygon();
		}
		if(shape1Pointer.getType() == RAPT.SHAPE_AABB){
			shapeTempPointer = shape1Pointer;
			shape1Pointer = shape1Pointer.getPolygon();
		}

		// swap the shapes so that they're in order
		if(shape0Pointer.getType() > shape1Pointer.getType()){
			shapeTempPointer = shape1Pointer;
			shape1Pointer = shape0Pointer;
			shape0Pointer = shapeTempPointer;
		}

		var result;
		var shape0Type = shape0Pointer.getType();
		var shape1Type = shape1Pointer.getType();

		// if they're both circles
		if(shape0Type == RAPT.SHAPE_CIRCLE && shape1Type == RAPT.SHAPE_CIRCLE) {
			result = this.overlapCircles(shape0Pointer, shape1Pointer);
		}

		// if one is a circle and one is a polygon
		else if(shape0Type == RAPT.SHAPE_CIRCLE && shape1Type == RAPT.SHAPE_POLYGON) {
			result = this.overlapCirclePolygon(shape0Pointer, shape1Pointer);
		}

		// if both are polygons
		else if(shape0Type == RAPT.SHAPE_POLYGON && shape1Type == RAPT.SHAPE_POLYGON) {
			result = this.overlapPolygons(shape0Pointer, shape1Pointer);
		}

		// we would only get here if we received an impossible pair of shapes.
		else {
			alert('assertion failed in CollisionDetector.overlapShapes');
		}

		return result;
	},
	overlapCircles : function(circle0, circle1) {
		return circle1.getCenter().sub(circle0.getCenter()).lengthSquared() <= (circle0.radius + circle1.radius) * (circle0.radius + circle1.radius);
	},
	overlapCirclePolygon : function(circle, polygon) {
		// see if any point on the border of the the polygon is in the circle
		var len = polygon.vertices.length;
        var i = len;
        while(i--){
			// if a segment of the polygon crosses the edge of the circle
			if(this.intersectCircleSegment(circle, polygon.getSegment(i))) return true;

			// if a vertex of the polygon is inside the circle
			if(polygon.getVertex(i).sub(circle.center).lengthSquared() < circle.radius * circle.radius) return true;
		
		}

		// otherwise, the circle could be completely inside the polygon
		var point = circle.center;
        i = len;
        while(i--){
			// Is this point outside this edge?  if so, it's not inside the polygon
			if (point.sub(polygon.vertices[i].add(polygon.center)).dot(polygon.segments[i].normal) > 0) return false;
			
		}
		// if the point was inside all of the edges, then it's inside the polygon.
		return true;
	},
	overlapPolygons : function(polygon0, polygon1) {
		var i;

		// see if any corner of polygon 0 is inside of polygon 1
        i = polygon0.vertices.length;
        while(i--){
			if(this.containsPointPolygon(polygon0.vertices[i].add(polygon0.center), polygon1)) return true;
		}

		// see if any corner of polygon 1 is inside of polygon 0
        i = polygon1.vertices.length;
        while(i--){
			if(this.containsPointPolygon(polygon1.vertices[i].add(polygon1.center), polygon0)) return true;
		}

		return false;
	},

	// CONTAINS
	containsPointPolygon : function(point, polygon) {
        var i = polygon.vertices.length;
        while(i--){
			// Is this point outside this edge?  if so, it's not inside the polygon
			if (point.sub(polygon.vertices[i].add(polygon.center)).dot(polygon.segments[i].normal) > 0) return false;
		}
		// if the point was inside all of the edges, then it's inside the polygon.
		return true;
	},

	// DISTANCES
	distanceShapeSegment : function(shape, segment) {
		// if the two are intersecting, the distance is obviously 0
		if(this.intersectShapeSegment(shape, segment)) return 0;
		

		var ref_shapePoint = {}, ref_worldPoint = {};
		return this.closestToShapeSegment(shape, ref_shapePoint, ref_worldPoint, segment);
	},
	distanceShapePoint : function(shape, point) {
		switch(shape.getType()) {
    		case RAPT.SHAPE_CIRCLE: return this.distanceCirclePoint(shape, point);
    		case RAPT.SHAPE_AABB: return this.distancePolygonPoint(shape.getPolygon(), point);
    		case RAPT.SHAPE_POLYGON: return this.distancePolygonPoint(shape, point);
		}

		alert('assertion failed in CollisionDetector.distanceShapePoint');
	},
	distanceCirclePoint : function(circle, point) {
		var distance = circle.center.sub(point).length();
		return distance > circle.radius ? distance - circle.radius : 0;
	},
	distancePolygonPoint : function(polygon, point) {
		var ref_polygonEdgeProportion = {}, ref_distanceProportion = {};
		var ref_closestPointOnPolygonEdge = {};	   //throwaway
		var distance = Number.POSITIVE_INFINITY;

		// see how close each endpoint of the segment is to a point on the middle of a polygon edge
        var i = polygon.vertices.length;
        while(i--){

			var polygonSegment = polygon.getSegment(i);

			// find where this segment endpoint projects onto the polygon edge
			this.intersectSegments(polygonSegment, new RAPT.Segment(point, point.add(polygonSegment.normal)), ref_polygonEdgeProportion, ref_distanceProportion, ref_closestPointOnPolygonEdge);

			// if this projects beyond the endpoints of the polygon's edge, ignore it
			if(ref_polygonEdgeProportion.ref < 0 || ref_polygonEdgeProportion.ref > 1) continue;
			
			var thisDistance = Math.abs(ref_distanceProportion.ref);

			if(thisDistance < distance) {
				distance = thisDistance;
			}
		}

		return distance;
	},

	// CLOSEST TO
	closestToShapeSegment : function(shape, ref_shapePoint, ref_segmentPoint, segment) {
		switch(shape.getType()){
    		case RAPT.SHAPE_CIRCLE: return this.closestToCircleSegment(shape, ref_shapePoint, ref_segmentPoint, segment);
    		case RAPT.SHAPE_AABB: return this.closestToPolygonSegment(shape.getPolygon(), ref_shapePoint, ref_segmentPoint, segment);
    		case RAPT.SHAPE_POLYGON: return this.closestToPolygonSegment(shape, ref_shapePoint, ref_segmentPoint, segment);
		}

		alert('assertion failed in CollisionDetector.closestToShapeSegment');
	},
	closestToCircleSegment : function(circle, ref_shapePoint, ref_segmentPoint, segment) {
		// see if the closest point is in the middle of the segment
		var ref_segmentProportion = {}, ref_projectProportion = {};
		this.intersectSegments(segment, new RAPT.Segment(circle.center, circle.center.sub(segment.normal)), ref_segmentProportion, ref_projectProportion, ref_segmentPoint);

		// if the closest point is in the middle of the segment
		if(ref_segmentProportion.ref >= 0 && ref_segmentProportion.ref <= 1){
			// this returns the distance of the circle from the segment, along the normal
			// since the normal is a unit vector and is also the shortest path, this works.
			ref_shapePoint.ref = circle.center.sub(segment.normal.mul(circle.radius * (ref_projectProportion.ref > 0 ? 1 : -1)));
			return ref_segmentPoint.ref.sub(circle.center).length() - circle.radius;
		}

		// otherwise, the closest point is one of the ends
		var distanceSquaredToStart = circle.center.sub(segment.start).lengthSquared();
		var distanceSquaredToEnd = circle.center.sub(segment.end).lengthSquared();

		// if the start is closer, use it
		if(distanceSquaredToStart < distanceSquaredToEnd){
			ref_segmentPoint.ref = segment.start;
			// this was WAY off in the version before the port, was relative to circle.center instead of absolute:
			ref_shapePoint.ref = circle.center.add(ref_segmentPoint.ref.sub(circle.center).unit().mul(circle.radius));
			return Math.sqrt(distanceSquaredToStart) - circle.radius;
		}

		// otherwise, the end is closer
		ref_segmentPoint.ref = segment.end;
		// this was WAY off in the version before the port, was relative to circle.center instead of absolute:
		ref_shapePoint.ref = circle.center.add(ref_segmentPoint.ref.sub(circle.center).unit().mul(circle.radius));
		return Math.sqrt(distanceSquaredToEnd) - circle.radius;
	},
	closestToPolygonSegment : function(polygon, ref_shapePoint, ref_segmentPoint, segment) {
		var distance = Number.POSITIVE_INFINITY;
		var thisDistance;

		// check every pair of points for distance
		var i = polygon.vertices.length;
		while(i--){
			var polygonPoint = polygon.getVertex(i);

			var j = 2;
			while(j--){
				var thisSegmentPoint = j == 0 ? segment.start : segment.end;
				thisDistance = polygonPoint.sub(thisSegmentPoint).length();

				if(thisDistance < distance){
					distance = thisDistance;
					ref_segmentPoint.ref = thisSegmentPoint;
					ref_shapePoint.ref = polygonPoint;
				}
			}
		}

		var ref_edgeProportion = {}, ref_polygonDistanceProportion = {}, ref_closestPoint = {};

		// see how close each vertex of the polygon is to a point in the middle of the edge
		i = polygon.vertices.length;
		while(i--){
			var polygonPoint = polygon.getVertex(i);

			// find where this polygon vertex projects onto the edge
			this.intersectSegments(segment, new RAPT.Segment(polygonPoint, polygonPoint.sub(segment.normal)), ref_edgeProportion, ref_polygonDistanceProportion, ref_closestPoint);

			// if this projects beyond the endpoints of the edge, ignore it
			if(ref_edgeProportion.ref < 0 || ref_edgeProportion.ref > 1) {
				continue;
			}

			// the distance along the normal of the segment from the segment to this vertex of the polygon
			thisDistance = Math.abs(ref_polygonDistanceProportion.ref);

			// if this is the closest we've found, use this
			if(thisDistance < distance){
				distance = thisDistance;
				ref_segmentPoint.ref = ref_closestPoint.ref;
				ref_shapePoint.ref = polygonPoint;
			}

		}

		var ref_polygonEdgeProportion = {}, ref_distanceProportion = {};

		// see how close each endpoint of the segment is to a point on the middle of a polygon edge
		i = polygon.vertices.length;
		while(i--){
			var polygonSegment = polygon.getSegment(i);

			var j = 2;
			while(j--){
				var thisSegmentPoint = j == 0 ? segment.start : segment.end;

				// find where this segment endpoint projects onto the polygon edge
				this.intersectSegments(polygonSegment, new RAPT.Segment(thisSegmentPoint, thisSegmentPoint.add(polygonSegment.normal)), ref_polygonEdgeProportion, ref_distanceProportion, ref_closestPoint);

				// if this projects beyond the endpoints of the polygon's edge, ignore it
				if(ref_polygonEdgeProportion.ref < 0 || ref_polygonEdgeProportion.ref > 1) {
					continue;
				}

				thisDistance = Math.abs(ref_distanceProportion.ref);

				if(thisDistance < distance){
					distance = thisDistance;
					ref_segmentPoint.ref = thisSegmentPoint;
					ref_shapePoint.ref = ref_closestPoint.ref;
				}
			}

		}

		return distance;
	},

	// PENETRATIONS
	penetrationEntityWorld : function(entity, edgeQuad, world) {
		var shape = entity.getShape();

		edgeQuad.nullifyEdges();

		var edges = world.getEdgesInAabb(shape.getAabb().expand(0.1), entity.getColor());
		var it = edges.length;
		while(it--){
			// if the polygon isn't close to this segment, forget about it
			var thisDistance = this.distanceShapeSegment(shape, edges[it].segment);
			if(thisDistance > 0.01) continue;
			

			// if the penetration is negative, ignore this segment
			var thisPenetration = this.penetrationShapeSegment(shape, edges[it].segment);
			if(thisPenetration < 0) continue;
			

			edgeQuad.minimize(edges[it], thisPenetration);
		}
	},
	penetrationShapeSegment : function(shape, segment) {
		switch(shape.getType()){
    		case RAPT.SHAPE_CIRCLE: return this.penetrationCircleSegment(shape, segment);
    		case RAPT.SHAPE_AABB: return this.penetrationPolygonSegment(shape.getPolygon(), segment);
    		case RAPT.SHAPE_POLYGON: return this.penetrationPolygonSegment(shape, segment);
		}

		alert('assertion failed in CollisionDetector.penetrationShapeSegment');
	},
	penetrationCircleSegment : function(circle, segment) {
		// a directed radius towards the segment
		var radiusToLine = segment.normal.mul(-circle.radius);

		// position on the circle closest to the inside of the line
		var innermost = circle.center.add(radiusToLine);

		// map this onto the normal.
		return innermost.sub(segment.start).dot(segment.normal);
	},
	penetrationPolygonSegment : function(polygon, segment) {
		var innermost = Number.POSITIVE_INFINITY;
		var ref_edgeProportion = {}, ref_penetrationProportion = {}, ref_closestPointOnSegment = {};

		// check the penetration of each vertex of the polygon
		var i = polygon.vertices.length;
		while(i--){
	        var vertex = polygon.getVertex(i);
			// find where this polygon point projects onto the segment
			this.intersectSegments( segment, new RAPT.Segment(vertex, vertex.sub(segment.normal)), ref_edgeProportion, ref_penetrationProportion, ref_closestPointOnSegment);

			// if this point projects onto the segment outside of its endpoints, don't consider this point to be projected
			// into this edge
			if(ref_edgeProportion.ref < 0 || ref_edgeProportion.ref > 1) continue;
			

			// the penetration of this vertex
			if(ref_penetrationProportion.ref < innermost)  innermost = ref_penetrationProportion.ref;
		}
		return innermost;
	}
}

//------------------------------
// AABB
//------------------------------

RAPT.makeAABB = function(c, width, height) {
	var center = new RAPT.Vector( 0, 0);
	if(c)center = new RAPT.Vector( c.x, c.y);
	//var center = new RAPT.Vector(c.x || 0,c.y || 0);
	var halfSize = new RAPT.Vector(width * 0.5, height * 0.5);
	var lowerLeft = center.sub(halfSize);
	var upperRight = center.add(halfSize);
	return new RAPT.AABB(lowerLeft, upperRight);
}

RAPT.AABB = function (lowerLeft, upperRight) {
	this.lowerLeft = new RAPT.Vector( Math.min(lowerLeft.x, upperRight.x), Math.min(lowerLeft.y, upperRight.y));
	this.size = new RAPT.Vector( Math.max(lowerLeft.x, upperRight.x), Math.max(lowerLeft.y, upperRight.y)).sub(this.lowerLeft);
}

RAPT.AABB.prototype = {
	constructor: RAPT.AABB,

	getTop : function() { return this.lowerLeft.y + this.size.y; },
	getLeft : function() { return this.lowerLeft.x; },
	getRight : function() { return this.lowerLeft.x + this.size.x; },
	getBottom : function() { return this.lowerLeft.y; },
	getWidth : function() { return this.size.x; },
	getHeight : function() { return this.size.y; },
	copy : function() {
		return new RAPT.AABB(this.lowerLeft, this.lowerLeft.add(this.size));
	},
	getPolygon : function() {
		var center = this.getCenter();
		var halfSize = this.size.div(2);
		return new RAPT.Polygon(center,
			new RAPT.Vector(+halfSize.x, +halfSize.y),
			new RAPT.Vector(-halfSize.x, +halfSize.y),
			new RAPT.Vector(-halfSize.x, -halfSize.y),
			new RAPT.Vector(+halfSize.x, -halfSize.y));
	},
	getType : function() {
		return RAPT.SHAPE_AABB;
	},
	getAabb : function() {
		return this;
	},
	moveBy : function(delta) {
		this.lowerLeft = this.lowerLeft.add(delta);
	},
	moveTo : function(destination) {
		this.lowerLeft = destination.sub(this.size.div(2));
	},
	getCenter : function() {
		return this.lowerLeft.add(this.size.div(2));
	},
	expand : function(margin) {
		var marginVector = new RAPT.Vector(margin, margin);
		return new RAPT.AABB(this.lowerLeft.sub(marginVector), this.lowerLeft.add(this.size).add(marginVector));
	},
	union : function(aabb) {
		return new RAPT.AABB(this.lowerLeft.minComponents(aabb.lowerLeft), this.lowerLeft.add(this.size).maxComponents(aabb.lowerLeft.add(aabb.size)));
	},
	include : function(point) {
		return new RAPT.AABB(this.lowerLeft.minComponents(point), this.lowerLeft.add(this.size).maxComponents(point));
	},
	offsetBy : function(offset) {
		return new RAPT.AABB(this.lowerLeft.add(offset), this.lowerLeft.add(this.size).add(offset));
	},

	draw : function(c) {
		c.strokeStyle = 'black';
		c.strokeRect(this.lowerLeft.x, this.lowerLeft.y, this.size.x, this.size.y);
	}
}



//------------------------------
// EDGEQUAD
//------------------------------


RAPT.EdgeQuad = function () {
	this.nullifyEdges();
	this.quantities = [0, 0, 0, 0];
}

RAPT.EdgeQuad.prototype = {
	constructor: RAPT.EdgeQuad,
	nullifyEdges : function() {
		this.edges = [null, null, null, null];
	},
	minimize : function(edge, quantity) {
		var orientation = edge.getOrientation();
		if(this.edges[orientation] == null || quantity < this.quantities[orientation]) {
			this.edges[orientation] = edge;
			this.quantities[orientation] = quantity;
		}
	},
	throwOutIfGreaterThan : function(minimum) {
		for(var i = 0; i < 4; i++) {
			if(this.quantities[i] > minimum) {
				this.edges[i] = null;
			}
		}
	}
}

//------------------------------
// SEGMENT
//------------------------------

RAPT.Segment = function (start, end) {
	this.start = start;
	this.end = end;
	this.normal = end.sub(start).flip().unit();
}
RAPT.Segment.prototype = {
	constructor: RAPT.Segment,
	offsetBy : function(offset) {
		return new RAPT.Segment(this.start.add(offset), this.end.add(offset));
	},
	/*draw : function(c) {
		c.beginPath();
		c.moveTo(this.start.x, this.start.y);
		c.lineTo(this.end.x, this.end.y);
		c.stroke();
	}*/
}



//------------------------------
// POLYGON
//------------------------------


/**
  *  For the polygon class, the segments and the bounding box are all relative to the center of the polygon.
  *  That is, when the polygon moves, the center is the only thing that changes.  This is to prevent
  *  floating-point arithmetic errors that would be caused by maintaining several sets of absolute coordinates.
  *
  *  Segment i goes from vertex i to vertex ((i + 1) % vertices.length)
  *
  *  When making a new polygon, please declare the vertices in counterclockwise order.	I'm not sure what will
  *  happen if you don't do that.
  */

RAPT.Polygon = function (center, vertices) {
	// center is the first argument, the next arguments are the vertices relative to the center
	//arguments = Array.prototype.slice.call(arguments);
	var arg = Array.prototype.slice.call(arguments);
	//this.center = arguments.shift();
    //this.vertices = arguments;
	this.center = arg.shift();
	this.vertices = arg;

	this.segments = [];
	for(var i = 0; i < this.vertices.length; i++) {
		this.segments.push(new RAPT.Segment(this.vertices[i], this.vertices[(i + 1) % this.vertices.length]));
	}

	this.boundingBox = new RAPT.AABB(this.vertices[0], this.vertices[0]);
	this.initializeBounds();
}

RAPT.Polygon.prototype = {
	constructor: RAPT.Polygon,
	copy : function() {
		var polygon = new RAPT.Polygon(this.center, this.vertices[0]);
		polygon.vertices = this.vertices;
		polygon.segments = this.segments;
		polygon.initializeBounds();
		return polygon;
	},
	getType : function() {
		return RAPT.SHAPE_POLYGON;
	},
	moveBy : function(delta) {
		this.center = this.center.add(delta);
	},
	moveTo : function(destination) {
		this.center = destination;
	},
	getVertex : function(i) {
		return this.vertices[i].add(this.center);
	},
	getSegment : function(i) {
		return this.segments[i].offsetBy(this.center);
	},
	getAabb : function() {
		return this.boundingBox.offsetBy(this.center);
	},
	getCenter : function() {
		return this.center;
	},

	// expand the aabb and the bounding circle to contain all vertices
	initializeBounds : function() {
		for(var i = 0; i < this.vertices.length; i++) {
			var vertex = this.vertices[i];

			// expand the bounding box to include this vertex
			this.boundingBox = this.boundingBox.include(vertex);
		}
	},
	/*draw : function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		for(var i = 0; i < this.vertices.length; i++) {
			c.lineTo(this.vertices[i].x + this.center.x, this.vertices[i].y + this.center.y);
		}
		c.closePath();
		c.stroke();
	}*/
}



//------------------------------
// CIRCLE
//------------------------------


RAPT.Circle = function (center, radius) {
	this.center = center || new RAPT.Vector(0,0);
	this.radius = radius;
}

RAPT.Circle.prototype = {
	constructor: RAPT.Circle,
	copy : function() {
		return new RAPT.Circle(this.center, this.radius);
	},
	getType : function() {
		return RAPT.SHAPE_CIRCLE;
	},
	getAabb : function() {
		var radiusVector = new RAPT.Vector(this.radius, this.radius);
		return new RAPT.AABB(this.center.sub(radiusVector), this.center.add(radiusVector));
	},
	getCenter : function() {
		return this.center;
	},
	moveBy : function(delta) {
		this.center = this.center.add(delta);
	},
	moveTo : function(destination) {
		this.center = destination;
	},
	offsetBy : function(offset) {
		return new RAPT.Circle(this.center.add(offset), this.radius);
	},
	/*draw : function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI*2, false);
		c.stroke();
	}*/
}


// Particles are statically allocated in a big array so that creating a
// new particle doesn't need to allocate any memory (for speed reasons).
// To create one, call Particle(), which will return one of the elements
// in that array with all values reset to defaults.  To change a property
// use the function with the name of that property.  Some property functions
// can take two values, which will pick a random number between those numbers.
// Example:
//
// Particle().position(center).color(0.9, 0, 0, 0.5).mixColor(1, 0, 0, 1).gravity(1).triangle()
// Particle().position(center).velocity(velocity).color(0, 0, 0, 1).gravity(0.4, 0.6).circle()


RAPT.PARTICLE_CIRCLE = 0;
RAPT.PARTICLE_TRIANGLE = 1;
RAPT.PARTICLE_LINE = 2;
RAPT.PARTICLE_CUSTOM = 3;

// class Particle
RAPT.ParticleInstance = function () {
}

RAPT.ParticleInstance.prototype = {
	constructor: RAPT.ParticleInstance,
	init : function() {
		// must use 'm_' here because many setting functions have the same name as their property
		this.m_bounces = 0;
		this.m_color =  new THREE.Vector4();
		this.m_type = 0;
		this.m_radius = 0;
		this.m_gravity = new THREE.Vector3();
		this.m_elasticity = 0;
		this.m_decay = 1;
		this.m_expand = 1;
		this.m_uvpos =  new THREE.Vector2();
		this.m_pos = new THREE.Vector3();
		this.m_velocity = new THREE.Vector3();
		this.m_angle = 0;
		this.m_angularVelocity = 0;
		this.m_drawFunc = null;

		this.ntiles = 8;
		this.m_animuv = false;
	},
	tick : function(seconds) {

		if(this.m_bounces < 0)  return false;

		if(this.m_animuv){
			this.m_uvpos.x ++;
			if(this.m_uvpos.x>this.ntiles){
				this.m_uvpos.x = 0;
				this.m_uvpos.y ++;
				if(this.m_uvpos.y>this.ntiles) this.m_uvpos.y = 0;
			}
		}

		this.m_color.w *= Math.pow(this.m_decay, seconds);// alpha
		this.m_radius *= Math.pow(this.m_expand, seconds);
		//
		if(this.m_gravity.x!==0)this.m_velocity.x -= this.m_gravity.x * seconds;
		if(this.m_gravity.y!==0)this.m_velocity.y -= this.m_gravity.y * seconds;
		if(this.m_gravity.z!==0)this.m_velocity.z -= this.m_gravity.z * seconds;
		//this.m_velocity.sub(this.m_gravity.clone().multiplyScalar(seconds));
		//this.m_pos.add(this.m_velocity.clone().multiplyScalar(seconds));
		this.m_pos.x += this.m_velocity.x * seconds;
		this.m_pos.y += this.m_velocity.y * seconds;
		this.m_pos.z += this.m_velocity.z * seconds;
		
		this.m_angle += this.m_angularVelocity * seconds;
		//if(this.m_alpha < 0.05) this.m_bounces = -1;
		if(this.m_color.w < 0.05) this.m_bounces = -1;
		return (this.m_bounces >= 0);
	},

	randOrTakeFirst : function (min, max) {
		return (typeof max !== 'undefined') ? RAPT.randInRange(min, max) : min;
	},
	cssRGBA : function (r, g, b, a) {
		return 'rgba(' + Math.round(r * 255) + ', ' + Math.round(g * 255) + ', ' + Math.round(b * 255) + ', ' + a + ')';
	},

	// all of these functions support chaining to fix constructor with 200 arguments
	fixangle : function(){
		var v1 = this.m_pos;
		var v2 = this.m_pos.clone().add(this.m_velocity.clone().multiplyScalar(10));
		this.m_angle = -(Math.atan2((v2.y-v1.y) , (v2.x-v1.x))+Math.PI);
        return this;
	},
	bounces : function(min, max) { this.m_bounces = Math.round(this.randOrTakeFirst(min, max)); return this; },
	type:function(t) {
		var x = 0, y = 0;
		switch(t){
			case 'circle': x=0; y=1; break;
			case 'triangle': x=2; y=1; break;
			case 'line': x=4; y=1; break;
			case 'custom': x=6; y=1; break;
		}
		this.m_uvpos.set(x,y);
		return this;
	},
	setuv:function(x,y){this.m_uvpos.set(x,y); return this;},
	animuv: function(){ this.m_animuv=true; return this;},
	circle : function() { this.m_type = RAPT.PARTICLE_CIRCLE; return this; },
	triangle : function() { this.m_type = RAPT.PARTICLE_TRIANGLE; return this; },
	line : function() { this.m_type = RAPT.PARTICLE_LINE; return this; },
	custom : function(drawFunc) { this.m_type = RAPT.PARTICLE_CUSTOM; this.m_drawFunc = drawFunc; return this; },
	customSprite : function(sprite) { /*this.m_type = RAPT.PARTICLE_CUSTOM; this.m_drawFunc = drawFunc; */return this; },
	color : function(r, g, b, a) { this.m_color.set(r||0, g||0, b||0, a||0); return this; },
	mixColor : function(r, g, b, a) { var percent = Math.random(); this.m_color.lerp(new THREE.Vector4(r, g, b, a), percent); return this; },
	radius : function(min, max) { this.m_radius = this.randOrTakeFirst(min, max); return this; },
	gravity : function(min, max, axe) { this.m_gravity[axe || 'y'] = this.randOrTakeFirst(min, max); return this; },
	elasticity : function(min, max) { this.m_elasticity = this.randOrTakeFirst(min, max); return this; },
	decay : function(min, max) { this.m_decay = this.randOrTakeFirst(min, max); return this; },
	expand : function(min, max) { this.m_expand = this.randOrTakeFirst(min, max); return this; },
	angle : function(min, max) { this.m_angle = this.randOrTakeFirst(min, max); return this; },
	angularVelocity : function(min, max) { this.m_angularVelocity = this.randOrTakeFirst(min, max); return this; },
	position : function(pos) { this.m_pos.set( pos.x || 0, pos.y || 0, pos.z || 0); return this; },
	velocity : function(vel) { this.m_velocity.set( vel.x || 0, vel.y || 0, vel.z || 0); return this; }
};

// wrap in anonymous function for private variables
RAPT.Particle = (function() {

	var particleMaterial = null;
	var geometry = null;
	var positions = null;
	var angles = null;
	var sizes = null;
	var uvpos = null;
	var colors = null;
	var values_size = null;
	
    //this.scene.add( this.particlesCloud );

	// particles is an array of ParticleInstances where the first count are in use
	//var particles = new Array(3000);
	var particles = new Array(6000);
	var maxCount = particles.length;
	var count = 0;
	var i = maxCount;
	while(i--){
		particles[i] = new RAPT.ParticleInstance();
	}
	/*for(var i = 0; i < particles.length; i++) {
		particles[i] = new RAPT.ParticleInstance();
	}*/


	RAPT.Particle = function()  {
		var particle = (count < maxCount) ? particles[count++] : particles[maxCount - 1];
		particle.init();
		return particle;
	}

	RAPT.Particle.reset = function() {
		count = 0;
		var v = 3000;
		while(v--){
			positions[v*3+0] = 0.0;
	    	positions[v*3+1] = 0.0;
	    	positions[v*3+2] = 0.0;
			colors[v*4+3] = 0.0;
		}
	};

	RAPT.Particle.init3d = function(scene, mapping)  {
		geometry = new THREE.BufferGeometry();
		var n = 3000;

		var blending = THREE.AdditiveBlending;
		
		/*THREE.NoBlending
		THREE.NormalBlending
		THREE.AdditiveBlending
		THREE.SubtractiveBlending
		THREE.MultiplyBlending
		THREE.CustomBlending*/

		positions = new Float32Array( n * 3 );
	    uvpos = new Float32Array( n * 2 );
	    colors = new Float32Array( n * 4 );
	    angles = new Float32Array( n );
	    sizes = new Float32Array( n );

	    var v = n;

	    while(v--){

	        sizes[v] = 0.3;
	        uvpos[v*2+1] = 1.0;
	    }

	    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	    geometry.addAttribute( 'colors', new THREE.BufferAttribute( colors, 4 ) );
	    geometry.addAttribute( 'uvPos', new THREE.BufferAttribute( uvpos, 2 ) );
	    geometry.addAttribute( 'angle', new THREE.BufferAttribute( angles, 1 ) );
	    geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );

		particleMaterial = new THREE.ShaderMaterial( {
	        //attributes:[ 'size', 'colors', 'uvPos', 'angle' ],
			uniforms:{
			    ntiles :  { type: 'f', value: 8.0 },
			    scale :  { type: 'f', value: 800.0 },
			    map: { type: 't', value: null },
			    alphaTest : { type:'f', value: 0.0 }
			},
			fragmentShader:[
			    'uniform sampler2D map;',
			    'uniform float ntiles;',
			    'uniform float alphaTest;',
			    'varying vec4 vColor;',
			    'varying vec2 vPos;',
			    'varying float vAngle;',

			    // map tile position see Shader.js
			    RAPT.tileUV,
			    // map tile rotation see Shader.js
			    RAPT.rotUV,

			    'void main(){',
			    '    vec2 uv = rotUV(vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y ), vAngle);',
			    '    vec2 coord = tileUV(uv, vPos, ntiles);',
			    '    vec4 texture = texture2D( map, coord );',
			    '    gl_FragColor = texture * vColor;',
			    '    if ( gl_FragColor.a <= alphaTest ) discard;',
			    '}'
			].join('\n'),
			vertexShader:[    
			    'attribute float angle;',
			    'attribute vec4 colors;',
			    'attribute vec2 uvPos;',
			    'attribute float size;',
			    'uniform float scale;',
			    'varying vec2 vPos;',
			    'varying vec4 vColor;',
			    'varying float vAngle;',

			    'void main(){',
			    '    vPos = uvPos;',
			    '    vColor = colors;',
			    '    vAngle = angle;',
			    '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
			    //'    gl_PointSize = size * scale;',
			    '    gl_PointSize = size * ( scale / length( mvPosition.xyz ) );',
			    '    gl_Position = projectionMatrix * mvPosition;',
			    '}'
			].join('\n'),
	        //vertexColors:   THREE.VertexColors,
	        depthTest: false,
	        depthWrite: true,
	        transparent: true,
	        blending:blending
	    });

        particleMaterial.uniforms.map.value = mapping;


	    var particlesCloud = new THREE.PointCloud( geometry, particleMaterial );
	    particlesCloud.position.set(0,0,0.01);
	    particlesCloud.frustumCulled = false;
		scene.add( particlesCloud );
	};

	RAPT.Particle.tick = function(seconds) {
		for(var i = 0; i < count; i++) {
			var isAlive = particles[i].tick(seconds);

			//

			positions[i * 3 + 0] = particles[i].m_pos.x.toFixed(3);
			positions[i * 3 + 1] = particles[i].m_pos.y.toFixed(3);
			positions[i * 3 + 2] = particles[i].m_pos.z.toFixed(3);

			//if(i===0) console.log(positions[i * 3 + 0], positions[i * 3 + 1]);

			colors[i * 4 + 0] = particles[i].m_color.x;
			colors[i * 4 + 1] = particles[i].m_color.y;
			colors[i * 4 + 2] = particles[i].m_color.z;
			colors[i * 4 + 3] = particles[i].m_color.w;

			if(particles[i].m_uvpos.x!==0 && particles[i].m_uvpos.y!==0){
				uvpos[i * 2 + 0] = particles[i].m_uvpos.x;
				uvpos[i * 2 + 1] = particles[i].m_uvpos.y;
			} else {
				uvpos[i * 2 + 0] = particles[i].m_type*2;
			}

			
			angles[i] = particles[i].m_angle;
			sizes[i] = particles[i].m_radius * 3;

			if (!isAlive) {
				
				// swap the current particle with the last active particle (this will swap with itself if this is the last active particle)
				var temp = particles[i];
				//
				particles[i] = particles[count - 1];

				colors[(count - 1) * 4 + 3] = 0.0;
				
				particles[count - 1] = temp;
				
				// forget about the dead particle that we just moved to the end of the active particle list
				count--;
				
				// don't skip the particle that we just swapped in
				i--;
			}
		}

		
	};

	RAPT.Particle.scalemat = function(z) {
		particleMaterial.uniforms.scale.value = z;
	}

	RAPT.Particle.update = function() {
		geometry.attributes.position.needsUpdate = true;
		geometry.attributes.colors.needsUpdate = true;
		geometry.attributes.uvPos.needsUpdate = true;
		geometry.attributes.angle.needsUpdate = true;
		geometry.attributes.size.needsUpdate = true;
	}

	return RAPT.Particle;
})();

RAPT.SpriteGroup = function(obj){
    this.group = new THREE.Group();
   
    if(obj.material) this.material = obj.material;
    else  this.material = new THREE.MeshBasicMaterial({color:obj.color, side:THREE.DoubleSide});
    
    this.size = obj.size || 1;
    this.group.scale.set(this.size, this.size, this.size);

    this.ydecal = obj.ydecal || 0;
    this.name = obj.name;
    this.list = obj.list;
    this.length = this.list.length;
    this.m = {};
    this.sprite = [];

    var n, p, pos, center, sizes, uvs;


    for(var i=0; i<this.length; i++){
        n = obj.list[i];
        pos = [0,0];
        center = [0,0];
        sizes = [1,1,0];
        uvs = [0,0];
        if(obj.pos) pos = obj.pos[i];
        if(obj.sizes) sizes = obj.sizes[i] || obj.sizes[0];
        if(obj.center) center = obj.center[i];
        if(obj.uvs) uvs = obj.uvs[i];
        
        this.m[n] = new RAPT.Box({ name:n, size:sizes, pos:pos, center:center, idx:i, nuv:obj.nuv || 1, uvs:uvs }, this.material);
        this.sprite[i] = this.m[n];
    }

    /*if(obj.order){
        var i = this.length;
        while(i--){
        //for(var i=0; i<this.length; i++){
            n = obj.order[i];
            p = '';
            if(obj.parent) p = obj.parent[i];
            if(p) this.m[p].add(this.m[n]);
            else this.group.add(this.m[n]);
        }
    } else {*/
        for(var i=0; i<this.length; i++){
            n = obj.list[i];
            p = '';
            if(obj.parent) p = obj.parent[i];
            if(p) this.m[p].add(this.m[n]);
            else this.group.add(this.m[n]);
        }
    //}

    

    /*for(var i=0; i<this.list.length; i++){
        
     
        if(this.meshs[obj.parent[i]]) this.meshs[obj.parent[i]].add(this.meshs[obj.list[i]]);
        else {
            console.log(obj.parent[i])
            this.group.add(this.meshs[obj.list[i]])}

        
    }*/

    RAPT.W3D.add(this);
    //console.log('player add', this.name)
}

RAPT.SpriteGroup.prototype = {
    constructor: RAPT.SpriteGroup,
    moveto:function(v){
        this.group.position.set(v.x,v.y+this.ydecal,0);
    },
    move:function(x,y){
        this.group.position.set(x,y+this.ydecal,0);
    },
    flip:function(b){
        if(b) this.group.scale.set(this.size, this.size, this.size);
        else this.group.scale.set(-this.size, this.size, this.size);
    },
    clear:function(){
        var i, j, k, s, s2;
        i = this.group.children.length;
        while (i--) {
            s = this.group.children[i];
            if(s.children.length){
                j = s.children.length;
                while (j--){
                    s2 = s.children[j];
                    if(s2.children.length){
                        k = s2.children.length;
                        //console.log('remove', this.name, k)
                        while (k--){
                            s2.remove(s2.children[k]);
                        }
                    }

                    s.remove(s2);
                }
            }
            this.group.remove(s);
            //s.clear();
        }

        i = this.sprite.length;
        while(i--){
            this.sprite[i].clear();
        }

        this.sprite = [];


        //console.log('player clear', this.name)
        
        //var i = this.length;
        //while(i--){
        //    this.sprite[i].clear()
        //}
        //this.material.dispose();
    },
    visible:function(b){
        if(!b) this.group.visible = false;
        else this.group.visible = true;
    },
    remove:function(){
        RAPT.W3D.remove(this);
    }
}




RAPT.Box = function(obj, mat){
    //this.name = obj.name;
    this.parent = null;

    var geo = new THREE.PlaneBufferGeometry(obj.size[0],obj.size[1]);
    geo.applyMatrix( new THREE.Matrix4().makeTranslation( obj.center[0], obj.center[1], 0 ) );

    THREE.Mesh.call( this, geo, mat );

    this.position.set(obj.pos[0],obj.pos[1], (obj.pos[2] || 0)*0.01);
    //this.position.set(obj.pos[0],obj.pos[1], 0);

    this.nuv = obj.nuv;
    if(this.nuv!==1){
        this.changeuv(obj.uvs[0],obj.uvs[1])
    }

}

//RAPT.Box.prototype = Object.create( THREE.Object3D.prototype );
RAPT.Box.prototype = Object.create( THREE.Mesh.prototype );
RAPT.Box.prototype.constructor = RAPT.Box;

RAPT.Box.prototype.addto = function(parent){
    this.parent = parent;
    this.parent.add(this.mesh);
}

RAPT.Box.prototype.clear = function(){
    //this.parent.remove(this.mesh);
    this.geometry.dispose();
    //this.parent = null;
}
RAPT.Box.prototype.changeuv = function(x,y){
    var w = 1/this.nuv;
    var a = x*w;
    var b = 1-(y*w);
    var uv = [a,b,a + w,b - w];
    this.geometry.attributes.uv.array = new Float32Array([ uv[0],uv[1],  uv[2],uv[1],  uv[0],uv[3],  uv[2],uv[3] ] );
}

// 2D TRANSFORM

// tile move
// pos = position of tile ex:(0.0,0.0) for first tile
// ntile = number of tile in map

RAPT.tileUV = [
    'vec2 tileUV(vec2 uv, vec2 pos, float ntile){',
    '    pos.y = ntiles-pos.y-1.0;',
    '    vec2 sc = vec2(1.0/ntile, 1.0/ntile);',
    '    return vec2(uv*sc)+(pos*sc);',
    '}',
].join("\n");

// tile rotation 
// angle in radian

RAPT.rotUV = [
    'vec2 rotUV(vec2 uv, float angle){',
    '    float s = sin(angle);',
    '    float c = cos(angle);',
    '    mat2 r = mat2( c, -s, s, c);',
    '    r *= 0.5; r += 0.5; r = r * 2.0 - 1.0;',
    '    uv -= 0.5; uv = uv * r; uv += 0.5;',
    '    return uv;',
    '}',
].join("\n");


RAPT.decalUV = [
    'vec2 decalUV(vec2 uv, float pix, float max){',
    '    float ps = uv.x / max;',
    '    float mx = uv.x / (uv.x-(ps*2.0));',
    '    vec2 decal = vec2( (ps*pix), - (ps*pix));',
    '    vec2 sc = vec2(uv.x*mx,uv.y*mx);',
    //'    uv -= ((2.0*pix)*ps);',
    '    return (uv);',
    '}',
].join("\n");

RAPT.MakeBasicShader = function(obj){
    return {
        uniforms:{
            map : { type: 't', value: obj.map || null },
            color : { type:'c', value: new THREE.Color(obj.color || 0xFFFFFF) },
            alphaTest : { type:'f', value: obj.alphaTest || 0 }
        },
        fragmentShader:[
            'uniform sampler2D map;',
            'uniform vec3 color;',
            'uniform float alphaTest;',
            'varying vec2 vUv;',
            'void main(){',
            '    vec4 diffuseColor = vec4(color, 1.0);',
            '    vec4 texelColor = texture2D(map, vUv);',
            '    diffuseColor *= texelColor;',
            '    gl_FragColor = diffuseColor;',
            '    if ( gl_FragColor.a < alphaTest ) discard;',
            '}'
        ].join('\n'),
        vertexShader:[
            'varying vec2 vUv;',
            'void main(){',
            '    vUv = uv;',
            '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
            '}'
        ].join('\n'),
        side: obj.side || THREE.FrontSide,
        transparent: obj.transparent || false,
        //alphaTest:obj.alphaTest || 0,
        shading: THREE.FlatShading,
        lights:false,
        fog:false

    }
}


RAPT.Keyframe = function (x, y) {
	this.center = new RAPT.Vector(x, y);
	this.angles = [];
}

RAPT.Keyframe.prototype = {
	constructor: RAPT.Keyframe,
	add : function(/* one or more angles */) {
		for(var i = 0; i < arguments.length; i++) {
			this.angles.push(arguments[i] * RAPT.ToRad);
		}
		return this;
	},
	lerpWith : function(keyframe, percent) {
		var result = new RAPT.Keyframe(
			RAPT.lerp(this.center.x, keyframe.center.x, percent),
			RAPT.lerp(this.center.y, keyframe.center.y, percent)
		);
		for(var i = 0; i < this.angles.length; i++) {
			result.angles.push(RAPT.lerp(this.angles[i], keyframe.angles[i], percent));
		}
		return result;
	},
	lerp : function(keyframes, percent) {
		var lower = Math.floor(percent);
		percent -= lower;
		lower = lower % keyframes.length;
		var upper = (lower + 1) % keyframes.length;
		return keyframes[lower].lerpWith(keyframes[upper], percent);
	}
}
RAPT.CELL_EMPTY = 0;
RAPT.CELL_SOLID = 1;
RAPT.CELL_FLOOR_DIAG_LEFT = 2;
RAPT.CELL_FLOOR_DIAG_RIGHT = 3;
RAPT.CELL_CEIL_DIAG_LEFT = 4;
RAPT.CELL_CEIL_DIAG_RIGHT = 5;

RAPT.Cell = function (x, y, type) {
	this.x = x;
	this.y = y;
	this.type = type;
	this.supType = 0;
	this.edges = [];
	this.ne = 0;
}

RAPT.Cell.prototype = {
	constructor: RAPT.Cell,
	bottomLeft : function() { return new RAPT.Vector(this.x, this.y); },
	bottomRight : function() { return new RAPT.Vector(this.x + 1, this.y); },
	topLeft : function() { return new RAPT.Vector(this.x, this.y + 1); },
	topRight : function() { return new RAPT.Vector(this.x + 1, this.y + 1); },
	ceilingOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_CEIL_DIAG_LEFT || this.type === RAPT.CELL_CEIL_DIAG_RIGHT;
	},
	floorOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_LEFT || this.type === RAPT.CELL_FLOOR_DIAG_RIGHT;
	},
	leftWallOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_LEFT || this.type === RAPT.CELL_CEIL_DIAG_LEFT;
	},
	rightWallOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_RIGHT || this.type === RAPT.CELL_CEIL_DIAG_RIGHT;
	},

	// This diagonal: /
	posDiagOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_RIGHT || this.type === RAPT.CELL_CEIL_DIAG_LEFT;
	},

	// This diagonal: \
	negDiagOccupied : function() {
	    return this.type === RAPT.CELL_SOLID || this.type === RAPT.CELL_FLOOR_DIAG_LEFT || this.type === RAPT.CELL_CEIL_DIAG_RIGHT;
	},

	addEdge : function(newEdge) {
		this.edges.push(newEdge);
	},
	getLastEdge:function(){
		return this.edges[this.edges.length-1];
	},
	removeEdge : function(edge) {
		var edgeIndex = this.getEdge(edge);
		this.edges.splice(edgeIndex, 1);
	},

	// returns all edges that block this color
	getBlockingEdges : function(color) {
		var blockingEdges = [];
		var i = this.edges.length;
		while(i--){
		//for(var i = 0; i < this.edges.length; i++) {
			if(this.edges[i].blocksColor(color)) {
				blockingEdges.push(this.edges[i]);
			}
		}
		return blockingEdges;
	},

	getEdge : function(edge) {
		var i = this.edges.length;
		while(i--){
			var thisEdge = this.edges[i];
			if ((thisEdge.getStart().sub(edge.getStart())).lengthSquared() < 0.001 && (thisEdge.getEnd().sub(edge.getEnd())).lengthSquared() < 0.001) {
				return i;
			}
		}
		return -1;
	},

	// returns a polygon that represents this cell
	getShape : function() {
		var vxy = new RAPT.Vector(this.x, this.y);
		var v00 = new RAPT.Vector(0, 0);
		var v01 = new RAPT.Vector(0, 1);
		var v10 = new RAPT.Vector(1, 0);
		var v11 = new RAPT.Vector(1, 1);
		switch(this.type) {
			case RAPT.CELL_SOLID: return new RAPT.Polygon(vxy, v00, v10, v11, v01);
			case RAPT.CELL_FLOOR_DIAG_LEFT: return new RAPT.Polygon(vxy, v00, v10, v01);
			case RAPT.CELL_FLOOR_DIAG_RIGHT: return new RAPT.Polygon(vxy, v00, v10, v11);
			case RAPT.CELL_CEIL_DIAG_LEFT: return new RAPT.Polygon(vxy, v00, v11, v01);
			case RAPT.CELL_CEIL_DIAG_RIGHT: return new RAPT.Polygon(vxy, v01, v10, v11);
		}
		return null;
	}
}

RAPT.ONE_WAY = 0;
RAPT.TWO_WAY = 1;

RAPT.Door = function(edge0, edge1, cell0, cell1, diag) {
	this.cells = [cell0, cell1];
	this.edges = [edge0, edge1];

	this.diag = diag;

	this.d = [];
	if(cell0 && edge0) this.add3dDoor(0, cell0, edge0);
	if(cell1 && edge1) this.add3dDoor(1, cell1, edge1);

	this.toOpen = false;
	this.toClose = false;

	this.posZ = 0;
}
RAPT.Door.prototype = {
	constructor: RAPT.Door,
	doorExists : function(i) {
		if (this.edges[i] === null) return false;
		var cell = this.cells[i];
		return cell !== null && cell.getEdge(this.edges[i]) !== -1;
	},
	doorPut : function(i, kill) {
		if (this.edges[i] !== null && !this.doorExists(i)) {
			var cell = this.cells[i];
			if (cell === null) return;
			cell.addEdge(new RAPT.Edge(this.edges[i].getStart(), this.edges[i].getEnd(), this.edges[i].color));

			this.toClose = true;

			if (kill) RAPT.gameState.killAll(this.edges[i]);
			RAPT.gameState.recordModification();
		}
	},
	tick : function(seconds) {

		if(this.toOpen){
			if(this.posZ > -0.5){
				this.posZ -= 0.01;
			    if(this.d[0])this.d[0].position.z = this.posZ;
			    if(this.d[1])this.d[1].position.z = this.posZ;
			}else{
				this.toOpen = false;
			}
		}

		if(this.toClose){
			if(this.posZ < 0){
				this.posZ += 0.01;
			    if(this.d[0])this.d[0].position.z = this.posZ;
			    if(this.d[1])this.d[1].position.z = this.posZ;
			}else{
				this.toClose = false;
			}
		}

	},
	doorRemove : function(i) {
		if (this.edges[i] !== null && this.doorExists(i)) {
			var cell = this.cells[i];
			if (cell === null) return;
			cell.removeEdge(this.edges[i]);
			this.remove3dDoor(i);
			RAPT.gameState.recordModification();
			//this.d[i].position.z = -2.5;
			this.toOpen = true;
		}
	},
	add3dDoor:function(i, cell, edge){
	//console.log('door add', type)
	    var x = cell.x;
	    var y = cell.y;
	    var start = edge.getStart();
	    var end = edge.getEnd();
	    var color = edge.color;
	    //var diag = true;
	    var type = edge.getOrientation();



	    //if(start.x == end.x || start.y == end.y) diag = false;

		if(this.diag == 0){
			this.d[i] = new THREE.Mesh(RAPT.GEO['door0']);
		}else{
			//console.log(this.diag)
			type = 0;
			if(start.x < end.x)type = 3;

			if(this.diag==4) this.d[i] = new THREE.Mesh(RAPT.GEO['door1']);
			else this.d[i] = new THREE.Mesh(RAPT.GEO['door2']);
		}

		switch(type){
        	case 1:this.d[i].rotation.z =-RAPT.PI90; break
            case 2:this.d[i].rotation.z =RAPT.PI90; break
            case 3:this.d[i].rotation.z =RAPT.PI;  break
            case 0:this.d[i].rotation.z =0;  break
        }

		this.d[i].position.set(x+0.5,y+0.5, 0 );
		if(color==1) this.d[i].material = RAPT.MAT_DOOR_R;
		else if(color==2)this.d[i].material = RAPT.MAT_DOOR_B
		else this.d[i].material = RAPT.MAT_DOOR;
		//RAPT.W3D.scene.add(this.d[i]);

		RAPT.W3D.addDoor(this.d[i]);

	},
	remove3dDoor:function(i){
		RAPT.W3D.scene.add(this.d[i]);
	},
	act : function(behavior, force, kill) {
		for (var i = 0; i < 2; ++i) {
			switch (behavior) {
			case RAPT.DOORBELL_OPEN:
				this.doorRemove(i);
				break;
			case RAPT.DOORBELL_CLOSE:
				this.doorPut(i, kill);
				break;
			case RAPT.DOORBELL_TOGGLE:
				if(this.doorExists(i)) {
					this.doorRemove(i);
				} else
					this.doorPut(i, kill);
				break;
			}
		}
	}
}

// enum EdgeType
RAPT.EDGE_FLOOR = 0;
RAPT.EDGE_LEFT = 1;
RAPT.EDGE_RIGHT = 2;
RAPT.EDGE_CEILING = 3;

// enum EdgeColor
RAPT.EDGE_NEUTRAL = 0;
RAPT.EDGE_RED = 1;
RAPT.EDGE_BLUE = 2;
RAPT.EDGE_PLAYERS = 3;
RAPT.EDGE_ENEMIES = 4;

// class Edge
RAPT.Edge = function (start, end, color, type) {
	this.segment = new RAPT.Segment(start, end);
	this.color = color;
	this.type = type || 0;
}
RAPT.Edge.prototype = {
	constructor: RAPT.Edge,
	blocksColor : function(entityColor) {
		switch(this.color) {
			case RAPT.EDGE_NEUTRAL: return true;
			case RAPT.EDGE_RED: return entityColor != RAPT.EDGE_RED;
			case RAPT.EDGE_BLUE: return entityColor != RAPT.EDGE_BLUE;
			case RAPT.EDGE_PLAYERS: return entityColor != RAPT.EDGE_RED && entityColor != RAPT.EDGE_BLUE;
			case RAPT.EDGE_ENEMIES: return entityColor != RAPT.EDGE_ENEMIES;
		}
		return false;
	},
	getStart : function() {
		return this.segment.start;
	},
	getEnd : function() {
		return this.segment.end;
	},
	getOrientation : function() {
		return RAPT.getOrientation(this.segment.normal);
	}
}

RAPT.getOrientation = function(normal) {
		if (normal.x > 0.9) return RAPT.EDGE_LEFT;
		if (normal.x < -0.9) return RAPT.EDGE_RIGHT;
		if (normal.y < 0) return RAPT.EDGE_CEILING;
		return RAPT.EDGE_FLOOR;
}
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
RAPT.WORLD_MARGIN = 60;

RAPT.World = function (w, h, spawnPoint, goal) {
	this.cells = null;
	this.width = 0;
	this.height = 0;
	this.totalEdge = 0;

	this.safety = new RAPT.Vector();
	this.spawnPoint = new RAPT.Vector();
	this.goal = new RAPT.Vector();
}

RAPT.World.prototype = {
	constructor: RAPT.World,
	init:function(w, h, spawnPoint, goal){
		this.cells = new Array(w);
		for (var x = 0; x < w; ++x) {
			this.cells[x] = new Array(h);
			for (var y = 0; y < h; ++y) {
				this.cells[x][y] = new RAPT.Cell(x, y, RAPT.CELL_SOLID);
			}
		}
		
		this.width = w;
		this.height = h;
		this.safety = spawnPoint;
		this.totalEdge = 0;

		this.spawnPoint = spawnPoint.add(new RAPT.Vector(0.5, 0.5));
		this.goal = goal.add(new RAPT.Vector(0.5, 0.5));
	},
	
	getCellNE:function(x, y){
		return (x >= 0 && y >= 0 && x < this.width && y < this.height) ? this.cells[x][y].ne : 0;
	},
	setCellNE : function(x, y, v) {
		var c = this.getCell(x,y);
		if(c!==null) c.ne = v;
	},
	// cells outside the world return null
	getCell : function(x, y) {
		return (x >= 0 && y >= 0 && x < this.width && y < this.height) ? this.cells[x][y] : null;
	},
	// cells outside the world return solid
	getCellType : function(x, y) {
		return (x >= 0 && y >= 0 && x < this.width && y < this.height) ? this.cells[x][y].type : RAPT.CELL_SOLID;
	},
	getEdges : function(x, y) {
		return (x >= 0 && y >= 0 && x < this.width && y < this.height) ? this.cells[x][y].edges : [];
	},
	setCell : function(x, y, type) {
		this.cells[x][y] = new RAPT.Cell(x, y, type);
	},
	createAllEdges : function() {
		//this.edges3d = [];
		this.totalEdge = 0;
		for (var x = 0; x < this.cells.length; x++) {
			for (var y = 0; y < this.cells[0].length; y++) {
				this.cells[x][y].edges = this.createEdges(x, y);
				this.totalEdge+=this.cells[x][y].edges.length;
			}
		}
	},
	createEdges : function(x, y) {
		var edges = [];

		var cellType = this.getCellType(x, y);
		var cellTypeXneg = this.getCellType(x - 1, y);
		var cellTypeYneg = this.getCellType(x, y - 1);
		var cellTypeXpos = this.getCellType(x + 1, y);
		var cellTypeYpos = this.getCellType(x, y + 1);

		var lowerLeft = new RAPT.Vector(x, y);
		var lowerRight = new RAPT.Vector(x + 1, y);
		var upperLeft = new RAPT.Vector(x, y + 1);
		var upperRight = new RAPT.Vector(x + 1, y + 1);

		// add horizontal and vertical edges
		if(this.IS_EMPTY_XNEG(cellType) && this.IS_SOLID_XPOS(cellTypeXneg))//left
			{edges.push(new RAPT.Edge(lowerLeft, upperLeft, RAPT.EDGE_NEUTRAL, 1));
			this.setCellNE(x-1, y, 1);
			this.setCellNE(x-1, y-1, 1);
			this.setCellNE(x-1, y+1, 1);
		}
		if(this.IS_EMPTY_YNEG(cellType) && this.IS_SOLID_YPOS(cellTypeYneg))//floor
			{edges.push(new RAPT.Edge(lowerRight, lowerLeft, RAPT.EDGE_NEUTRAL, 2));
			this.setCellNE(x, y-1, 1);
		}
		if(this.IS_EMPTY_XPOS(cellType) && this.IS_SOLID_XNEG(cellTypeXpos))//right
			{edges.push(new RAPT.Edge(upperRight, lowerRight, RAPT.EDGE_NEUTRAL, 0));
			this.setCellNE(x+1, y, 1);
			this.setCellNE(x+1, y-1, 1);
			this.setCellNE(x+1, y+1, 1);
		}
		if(this.IS_EMPTY_YPOS(cellType) && this.IS_SOLID_YNEG(cellTypeYpos))//top
			{edges.push(new RAPT.Edge(upperLeft, upperRight, RAPT.EDGE_NEUTRAL, 3));
				this.setCellNE(x, y + 1, 1);
			}

		// add diagonal edges
		if(cellType == RAPT.CELL_FLOOR_DIAG_RIGHT){
			edges.push(new RAPT.Edge(upperRight, lowerLeft, RAPT.EDGE_NEUTRAL, 4));
			this.setCellNE(x, y-1, 1);
			this.setCellNE(x, y+1, 1);
		}
		else if(cellType == RAPT.CELL_CEIL_DIAG_LEFT){
			edges.push(new RAPT.Edge(lowerLeft, upperRight, RAPT.EDGE_NEUTRAL, 6));
			this.setCellNE(x, y-1, 1);
			this.setCellNE(x, y+1, 1);
		}
		else if(cellType == RAPT.CELL_FLOOR_DIAG_LEFT){
			edges.push(new RAPT.Edge(lowerRight, upperLeft, RAPT.EDGE_NEUTRAL, 5));
			this.setCellNE(x, y-1, 1);
			this.setCellNE(x, y+1, 1);
		}
		else if(cellType == RAPT.CELL_CEIL_DIAG_RIGHT){
			edges.push(new RAPT.Edge(upperLeft, lowerRight, RAPT.EDGE_NEUTRAL, 7));
			this.setCellNE(x, y-1, 1);
			this.setCellNE(x, y+1, 1);
		}
		return edges;
	},
	getEdgesInAabb : function(aabb, color) {
		var xmin = Math.max(0, Math.floor(aabb.getLeft()));
		var ymin = Math.max(0, Math.floor(aabb.getBottom()));
		var xmax = Math.min(this.width, Math.ceil(aabb.getRight()));
		var ymax = Math.min(this.height, Math.ceil(aabb.getTop()));
		var edges = [];

		for(var x = xmin; x < xmax; x++)
			for(var y = ymin; y < ymax; y++)
				edges = edges.concat(this.cells[x][y].getBlockingEdges(color));

		return edges;
	},
	getCellsInAabb : function(aabb) {
		var xmin = Math.max(0, Math.floor(aabb.getLeft()));
		var ymin = Math.max(0, Math.floor(aabb.getBottom()));
		var xmax = Math.min(this.width, Math.ceil(aabb.getRight()));
		var ymax = Math.min(this.height, Math.ceil(aabb.getTop()));
		var cells = [];

		for(var x = xmin; x < xmax; x++)
			for(var y = ymin; y < ymax; y++)
				cells = cells.concat(this.cells[x][y]);

		return cells;
	},
	getHugeAabb : function() {
		return new RAPT.AABB(new RAPT.Vector(-RAPT.WORLD_MARGIN, -RAPT.WORLD_MARGIN), new RAPT.Vector(this.width + RAPT.WORLD_MARGIN, this.height + RAPT.WORLD_MARGIN));
	},
	getWidth : function() {
		return this.width;
	},
	getHeight : function() {
		return this.height;
	},
	// is this side of the cell empty?
	IS_EMPTY_XNEG : function (type){ return type == RAPT.CELL_EMPTY || type == RAPT.CELL_FLOOR_DIAG_RIGHT || type == RAPT.CELL_CEIL_DIAG_RIGHT; },
	IS_EMPTY_YNEG : function (type){ return type == RAPT.CELL_EMPTY || type == RAPT.CELL_CEIL_DIAG_LEFT || type == RAPT.CELL_CEIL_DIAG_RIGHT; },
	IS_EMPTY_XPOS : function (type){ return type == RAPT.CELL_EMPTY || type == RAPT.CELL_FLOOR_DIAG_LEFT || type == RAPT.CELL_CEIL_DIAG_LEFT; },
	IS_EMPTY_YPOS : function (type){ return type == RAPT.CELL_EMPTY || type == RAPT.CELL_FLOOR_DIAG_LEFT || type == RAPT.CELL_FLOOR_DIAG_RIGHT; },
	// is this side of the cell solid?
	IS_SOLID_XNEG : function (type){ return type == RAPT.CELL_SOLID || type == RAPT.CELL_FLOOR_DIAG_LEFT || type == RAPT.CELL_CEIL_DIAG_LEFT; },
	IS_SOLID_YNEG : function (type){ return type == RAPT.CELL_SOLID || type == RAPT.CELL_FLOOR_DIAG_LEFT || type == RAPT.CELL_FLOOR_DIAG_RIGHT; },
	IS_SOLID_XPOS : function (type){ return type == RAPT.CELL_SOLID || type == RAPT.CELL_FLOOR_DIAG_RIGHT || type == RAPT.CELL_CEIL_DIAG_RIGHT; },
	IS_SOLID_YPOS : function (type){ return type == RAPT.CELL_SOLID || type == RAPT.CELL_CEIL_DIAG_LEFT || type == RAPT.CELL_CEIL_DIAG_RIGHT; }
}

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
RAPT.W3D = null;
RAPT.MAT_PLAYER = null;
RAPT.GEO = {};

var debug = debug || null;

RAPT.Loader = function(file, callback){
    var loader = new THREE.SEA3D( { 
        //parser : THREE.SEA3D.DEFAULT 
        //container : null
    } );
    loader.onComplete = function( e ) {
        var i = loader.meshes.length, m;
        while(i--){
            m = loader.meshes[i];
            RAPT.GEO[m.name] = m.geometry;
        }
        callback();
    };

    loader.load( file );
};

RAPT.World3D = function(canvas){

    this.isMobile = false;
    this.antialias = true;

    var n = navigator.userAgent;
    if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i) || n.match(/Windows Phone/i)){ this.isMobile = true;  this.antialias = false; }

    this.debug = document.getElementById( 'debug' );
    this.vs = {w:window.innerWidth, h:window.innerHeight, r:.0084, mw:0, mh:0, d:10, fov:60};
    this.split = false;
    this.is2D = false;

    this.camera = [];
    this.initCameras();
    
    this.scene = new THREE.Scene();

    // define some geometry
    RAPT.GEO['front'] = this.plane('front');
    RAPT.GEO['back'] = this.plane('back');
    RAPT.GEO['floor'] = this.plane('floor', -Math.PI / 2, -0.5, false,  0, 0.5);
    RAPT.GEO['dfloor'] = this.plane('floor', -Math.PI / 2, 0, true, Math.PI / 4, 0.5);

    // create textures
    var textures = [];
    textures[0] = THREE.ImageUtils.loadTexture( 'textures/level.png' );
    textures[1] = THREE.ImageUtils.loadTexture( 'textures/particle.png' );
    textures[2] = THREE.ImageUtils.loadTexture( 'textures/player.png' );
    textures[3] = THREE.ImageUtils.loadTexture( 'textures/enemy.png' );
    textures[4] = THREE.ImageUtils.loadTexture( 'textures/level.png' );
    textures[4].flipY =false;

    var i = textures.length;
    while(i--){
        //textures[i].magFilter = THREE.NearestFilter;
        //textures[i].minFilter = THREE.LinearMipMapLinearFilter;
        //textures[i].generateMipmaps = false;
    }


    // create materials
     //RAPT.MAT_LEVEL = new THREE.MeshBasicMaterial( { map:textures[0], color: 0xFFFFFF, shading: THREE.FlatShading, wireframe: false, transparent: true} );
    RAPT.MAT_LEVEL = new THREE.ShaderMaterial(RAPT.MakeBasicShader({map:textures[0], transparent: true}));
   

    /*RAPT.MAT_DOOR_R = new THREE.MeshBasicMaterial( { map:textures[4], color: 0xFF0000, shading: THREE.FlatShading, wireframe: false, transparent: true} );
    RAPT.MAT_DOOR_B = new THREE.MeshBasicMaterial( { map:textures[4], color: 0x0066FF, shading: THREE.FlatShading, wireframe: false, transparent: true} );
    RAPT.MAT_DOOR = new THREE.MeshBasicMaterial( { map:textures[4], color: 0xFFFFFF, shading: THREE.FlatShading, wireframe: false, transparent: true} );*/

    RAPT.MAT_DOOR_R = new THREE.ShaderMaterial(RAPT.MakeBasicShader({map:textures[4], color: 0xFF0000, transparent: true}));
    RAPT.MAT_DOOR_B = new THREE.ShaderMaterial(RAPT.MakeBasicShader({map:textures[4], color: 0x0066FF, transparent: true}));
    RAPT.MAT_DOOR = new THREE.ShaderMaterial(RAPT.MakeBasicShader({map:textures[4], color: 0xFFFFFF, transparent: true}));
 
    //RAPT.MAT_PLAYER = new THREE.MeshBasicMaterial( { map: textures[2], shading: THREE.FlatShading, wireframe: false, transparent: true, side:THREE.DoubleSide, alphaTest: 0.1 } );
    RAPT.MAT_PLAYER = new THREE.ShaderMaterial(RAPT.MakeBasicShader({map:textures[2], transparent: true, side:THREE.DoubleSide, alphaTest: 0.1 }));


    //RAPT.MAT_ENEMY = new THREE.MeshBasicMaterial( { map: textures[3], shading: THREE.FlatShading, wireframe: false, transparent: true, side:THREE.DoubleSide, alphaTest: 0.1 } );
    RAPT.MAT_ENEMY = new THREE.ShaderMaterial(RAPT.MakeBasicShader({map:textures[3], transparent: true, side:THREE.DoubleSide, alphaTest: 0.1 }));
 
    // init 3d particles
    RAPT.Particle.init3d( this.scene, textures[1] );

    

    this.doors = [];
    this.sprites = [];

    this.renderer = new THREE.WebGLRenderer( { precision:"mediump", canvas:canvas, antialias: this.antialias,  alpha: false } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.vs.w, this.vs.h );
    this.renderer.setClearColor( 0x737373 , 1.0);

    this.effect = new RAPT.SplitEffect( this.renderer );
    this.effect.setSize( this.vs.w, this.vs.h );

    RAPT.W3D = this;

    //var _this = this;
    canvas.onmousewheel = function(e) { RAPT.W3D.onMouseWheel(e); };
};

RAPT.World3D.prototype = {
    constructor: RAPT.World3D,

    render: function(){
        // update particle engine
        RAPT.Particle.update();

        if(!this.split) this.renderer.render( this.scene, this.camera[0] );
        else this.effect.render( this.scene, this.camera[1], this.camera[2] );
    },
    addDoor:function(mesh){
       this.scene.add(mesh);
       this.doors.push(mesh);
    },
    clearAllDoor:function(){
        var i = this.doors.length;
        while(i--) this.scene.remove(this.doors[i]);
    },  
    initCameras:function(){
        if(this.is2D){
            this.camera[0] = new THREE.OrthographicCamera( -this.vs.w*this.vs.r, this.vs.w*this.vs.r, this.vs.h*this.vs.r, -this.vs.h*this.vs.r, 0.1, 100 );
            this.camera[1] = new THREE.OrthographicCamera( -this.vs.w*this.vs.r, this.vs.w*this.vs.r, this.vs.h*this.vs.r, -this.vs.h*this.vs.r, 0.1, 100 );
            this.camera[2] = new THREE.OrthographicCamera( -this.vs.w*this.vs.r, this.vs.w*this.vs.r, this.vs.h*this.vs.r, -this.vs.h*this.vs.r, 0.1, 100 );
            //this.distance = this.vs.d;
        } else {
            var rz = this.vs.w/this.vs.h;
            var fov = this.vs.fov;//55;
            this.camera[0] = new THREE.PerspectiveCamera( fov, rz, 0.1, 100 );
            this.camera[1] = new THREE.PerspectiveCamera( fov, rz, 0.1, 100 );
            this.camera[2] = new THREE.PerspectiveCamera( fov, rz, 0.1, 100 );
            //this.distance = this.vs.d;
           // this.vs.d = 20
        }
    },
    onMouseWheel: function (e){
        var delta = 0;
        if(e.wheelDeltaY){delta=e.wheelDeltaY*0.01;}
        else if(e.wheelDelta){delta=e.wheelDelta*0.05;}
        else if(e.detail){delta=-e.detail*1.0;}
        this.vs.r-=(delta*0.001);
        if(this.vs.r<0.001) this.vs.r = 0.001;

        //RAPT.Particle.scalemat()

        this.vs.d -= delta/6;//(0.5/this.vs.r)*2;

        var distance = this.vs.h/(2*Math.tan( this.vs.fov*(Math.PI/360)) );

        var camscale = Math.tan(( this.vs.fov / 2 ) / 180 * Math.PI);
        var fix = 1 / (camscale / (camscale + this.vs.d));

        
        var camfix = this.vs.w / 2 / camscale;
        //var rz = 60 - this.vs.d/0.16;
        //RAPT.gameScale += delta;
        var n = (RAPT.gameScale + (delta/3)).toFixed(0)*1;

        //RAPT.gameScale = n;
        //game.upGameScale();

        //console.log(this.vs.d, RAPT.gameScale, distance);
        //RAPT.gameScale -= delta

        this.camera[0].position.z = this.vs.d;
        this.camera[1].position.z = this.vs.d;
        this.camera[2].position.z = this.vs.d;

        e.preventDefault();
        e.stopPropagation();
    },
    
    plane:function(name, rx, y, diag, ry ,t){
        var geo;
        if(!t) t = 1;
        if(diag) geo = new THREE.PlaneBufferGeometry( Math.sqrt(Math.pow(1,2) + Math.pow(1,2)), t );
        else geo = new THREE.PlaneBufferGeometry( 1, t );
        geo.rotateX( rx || 0 );
        geo.rotateZ( ry || 0 );
        geo.translate( 0, y || 0, 0 );

        if(name=='front')this.changeuv(geo, 1,0, 8);
        if(name=='back')this.changeuv(geo, 1,2, 8);
        if(name=='floor')this.changeuv(geo, 1,4, 8);

        return new THREE.Geometry().fromBufferGeometry( geo );
    },
    triangle:function(up){
        var geo =  new THREE.Geometry();
        var uv;
        if(!up){
            uv = this.changeuv(null, 1,0, 8);
            geo.vertices.push(new THREE.Vector3(0.5, 0.5, 0.25));
            geo.vertices.push(new THREE.Vector3(-0.5, -0.5, 0.25));
            geo.vertices.push(new THREE.Vector3(0.5, -0.5, 0.25));
            geo.faces.push(new THREE.Face3(0,1,2));
            geo.faceVertexUvs[0].push([
                new THREE.Vector2(uv[2], uv[3]),
                new THREE.Vector2(uv[4], uv[5]),
                new THREE.Vector2(uv[6], uv[7]),
            ]);
        } else {
            uv = this.changeuv(null, 1,2, 8);
            geo.vertices.push(new THREE.Vector3(-0.5, -0.5, -0.25))
            geo.vertices.push(new THREE.Vector3(0.5,  0.5, -0.25));
            geo.vertices.push(new THREE.Vector3(-0.5, 0.5, -0.25));
            
            geo.faces.push(new THREE.Face3(0,1,2));
            geo.faceVertexUvs[0].push([
                new THREE.Vector2(uv[0], uv[1]),
                new THREE.Vector2(uv[2], uv[3]),
                new THREE.Vector2(uv[4], uv[5])
            ]);
        }
        geo.computeFaceNormals();
        return geo;
    },
    changeuv:function(geo,x,y,nuv){
        var w = 1/nuv;
        var a = x*w;
        var b = 1-(y*w);
        var uv = [a,b,a+w,b-w];
        var ar = new Float32Array([ uv[0],uv[1],uv[2],uv[1],uv[0],uv[3],uv[2],uv[3] ] )
        if(geo)geo.attributes.uv.array = ar;
        else return ar
    },
    clearLevel:function(){
        this.removeAll();
        this.clearAllDoor();

        if(this.edgemesh){
            this.scene.remove( this.edgemesh );
            this.edgemesh.geometry.dispose();
        }
    },
    initLevel:function(world){

        this.clearLevel();

        var tmpGeometry = new THREE.Geometry();
        var matrix = new THREE.Matrix4();
        var rmatrix = new THREE.Matrix4();
        var x, y, type, j, edges, etype;
        var ne = world.totalEdge;
        var nx = world.cells.length;
        var ny = world.cells[0].length;

        for (x = 0; x < nx; x++) {
            for (y = 0; y < ny; y++) {

                type = world.getCellType(x,y);
                edges = world.getEdges(x,y);

                if(type===0) {
                    matrix.makeTranslation(x+ 0.5,y+ 0.5, -0.25);
                    tmpGeometry.merge(RAPT.GEO.back, matrix);
                } else if(type===1){
                    matrix.makeTranslation(x+ 0.5,y+ 0.5, 0.25);
                    if(world.getCellNE(x,y)) tmpGeometry.merge(RAPT.GEO.front, matrix)
                }

                if(edges.length){
                    j = edges.length;
                    while(j--){
                        matrix.makeTranslation(x+ 0.5,y+ 0.5,0);
                        etype = edges[j].type;

                        if(etype<4){
                            rmatrix.makeRotationZ(0);
                            switch(etype){
                                case 1:rmatrix.makeRotationZ(-RAPT.PI90); break;
                                case 0:rmatrix.makeRotationZ(RAPT.PI90); break;
                                case 3:rmatrix.makeRotationZ(RAPT.PI);  break;
                                case 2:rmatrix.makeRotationZ(0); break;
                            }

                            matrix.multiply(rmatrix);
                            tmpGeometry.merge(RAPT.GEO.floor, matrix);

                        } else{
                            switch(etype){
                                case 7:rmatrix.makeRotationZ(RAPT.PI90); break;
                                case 5:rmatrix.makeRotationZ(-RAPT.PI90); break;
                                case 6:rmatrix.makeRotationZ(RAPT.PI); break;
                                case 4:rmatrix.makeRotationZ(0); break;
                            }
                            matrix.multiply(rmatrix);
                            tmpGeometry.merge(RAPT.GEO.dfloor, matrix);
                            tmpGeometry.merge(this.triangle(), matrix);
                            tmpGeometry.merge(this.triangle(true), matrix);
                        }
                        
                    }
                }
            }
        }

        // remove unuse vertices
        tmpGeometry.mergeVertices();

        var geometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
        geometry.computeBoundingSphere();

        this.edgemesh = new THREE.Mesh(geometry, RAPT.MAT_LEVEL);
        this.scene.add(this.edgemesh);

    },
    tell:function(txt){
        if(debug!==null) debug.innerHTML = txt;
    },
    upCamera:function(x,y,id){
        this.camera[id].position.set(x, y, this.vs.d);
    },
    resize: function(){
        var i, c;
        this.vs.w = window.innerWidth;
        this.vs.h = window.innerHeight;
        this.vs.mw = this.vs.w*0.5;
        this.vs.mh = this.vs.h*0.5;
        
        //this.vs.r = (1/this.vs.w)*100;

        this.updateCamera();

        if(this.split) this.effect.setSize(this.vs.w,this.vs.h);
        else this.renderer.setSize(this.vs.w,this.vs.h);
    },
    updateCamera:function(){
        var rz = this.vs.w / this.vs.h;
        var i = this.camera.length, c;
        while(i--){
            c = this.camera[i];
            if(this.is2D){
                c.left = -this.vs.w*this.vs.r;
                c.right = this.vs.w*this.vs.r;
                c.top = this.vs.h*this.vs.r;
                c.bottom = -this.vs.h*this.vs.r;
            }else{
                c.aspect = rz;
            }
            c.updateProjectionMatrix();
        }
    },
    setSplit:function(b){
        if(b!==this.split){
            this.split = b;
            this.resize();
        }
    },

    // SPRITE 

    add:function(s){
        this.sprites.push(s);
        this.scene.add(s.group);
    },
    remove:function(s){
        this.sprites.splice(this.sprites.indexOf(s), 1);
        this.scene.remove(s.group);
        s.clear();
    },
    removeAll:function(){
        //console.log('befor', this.sprites.length)
        var i = this.sprites.length;
        while(i--){
            this.remove(this.sprites[i]);
        }
        //console.log('after', this.sprites.length)
    }


};

/**
*  SCREEN SPLIT EFFECT
*/

RAPT.SplitEffect = function ( renderer, width, height ) {

    var _camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
    var _params = { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat };

    if ( width === undefined ) width = 512;
    if ( height === undefined ) height = 512;

    var _renderTargetL = new THREE.WebGLRenderTarget( width, height, _params );
    var _renderTargetR = new THREE.WebGLRenderTarget( width, height, _params );

    var _material = new THREE.ShaderMaterial( {

        uniforms: {

            "sourceA": { type: "t", value: _renderTargetL },
            "sourceB": { type: "t", value: _renderTargetR },
            "split": { type: "f", value: 0.5 },
            "angle": { type: "f", value: 0 },
            "fuzzy": { type: "f", value: 0 },
            "blendGamma": { type: "f", value: 2.2 },

        },

        vertexShader: [

            "precision mediump float;",
            "uniform float angle;",
            "varying float c;",
            "varying float s;",
            "varying float t;",

            "varying vec2 vUv;",

            "void main() {",
            "   c = cos(angle);",
            "   s = sin(angle);",
            "   t = abs(c + s);",
            "   vUv = vec2( uv.x, uv.y );",
            "   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
            "}"

        ].join( "\n" ),

        fragmentShader: [
        
            "precision mediump float;",
            "uniform sampler2D sourceA;",
            "uniform sampler2D sourceB;",
            "uniform float split;",
            "uniform float angle;",
            "uniform float fuzzy;",
            "uniform float blendGamma;",

            "varying vec2 vUv;",
            "varying float c;",
            "varying float s;",
            "varying float t;",

            "vec4 textureLookup(sampler2D tex, vec2 texCoord, vec3 exp) {",
            "   if (any(lessThan(texCoord, vec2(0.0))) || any(greaterThan(texCoord, vec2(1.0)))) {",
            "       return vec4(0.0);",
            "   } else {",
            "       vec4 pixel = texture2D(tex, texCoord);",
            "       pixel.rgb = pow(abs(pixel.rgb), exp);",
            "       return pixel;",
            "   }",
            "}",

            "void main() {",
            "   vec4 colorL, colorR;",
            "   vec2 uv = vUv;",
            "   vec3 exp = vec3(blendGamma);",
            "   vec4 pixel1 = textureLookup(sourceA, uv, exp);",
            "   vec4 pixel2 = textureLookup(sourceB, uv, exp);",
            "   float mn = (split - fuzzy * (1.0 - split));",
            "   float mx = (split + fuzzy * split);",
            "   vec2 coords = uv - vec2(0.5);",
            "   coords = vec2(coords.x * c - coords.y * s, coords.x * s + coords.y * c);",
            "   float scale = max(abs(c - s), abs(s + c));",
            "   coords /= scale;",
            "   coords += vec2(0.5);",
            "   float x = coords.x;",
            "   gl_FragColor = mix(pixel2, pixel1, smoothstep(mn, mx, x));",
            "   gl_FragColor.rgb = pow(abs(gl_FragColor.rgb), 1.0 / exp);",
            "}"

        ].join( "\n" )

    } );

    var _scene = new THREE.Scene();
    _scene.add( new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), _material ) );

    this.setAngle = function ( a ) {
        _material.uniforms[ "angle" ].value = a;
    };

    this.setFuzzy = function ( a ) {
        _material.uniforms[ "fuzzy" ].value = a;
    };

    this.setSize = function ( width, height ) {

        if ( _renderTargetL ) _renderTargetL.dispose();
        if ( _renderTargetR ) _renderTargetR.dispose();
        _renderTargetL = new THREE.WebGLRenderTarget( width, height, _params );
        _renderTargetR = new THREE.WebGLRenderTarget( width, height, _params );

        _material.uniforms[ "sourceA" ].value = _renderTargetL;
        _material.uniforms[ "sourceB" ].value = _renderTargetR;

        renderer.setSize( width, height );

    };

    this.render = function ( scene, c0, c1 ) {

        renderer.render( scene, c0, _renderTargetL, true );
        renderer.render( scene, c1, _renderTargetR, true );
        renderer.render( _scene, _camera );

    };

    this.dispose = function() {

        if ( _renderTargetL ) _renderTargetL.dispose();
        if ( _renderTargetR ) _renderTargetR.dispose();

    }

};
//RAPT.ROCKET_SPRITE_RED = 0;
//RAPT.ROCKET_SPRITE_BLUE = 1;

RAPT.ROCKET_SPEED = 2.5;
// Max rotation in radians / second
RAPT.ROCKET_MAX_ROTATION = 8;
RAPT.ROCKET_RADIUS = .15;
RAPT.ROCKET_ELASTICITY = 1;
// In seconds, the amount of time the Rocket's direction is fixed
RAPT.ROCKET_HEADING_CONSTRAINT_TIME = 0.3;
RAPT.PARTICLE_FREQUENCY = 0.03;

RAPT.drawRocket = function (c) {
	var size = 0.075;
	c.strokeStyle = 'black';
	c.beginPath();
	c.moveTo(-RAPT.ROCKET_RADIUS, size);
	c.lineTo(RAPT.ROCKET_RADIUS - size, size);
	c.lineTo(RAPT.ROCKET_RADIUS, 0);
	c.lineTo(RAPT.ROCKET_RADIUS - size, -size);
	c.lineTo(-RAPT.ROCKET_RADIUS, -size);
	c.closePath();
	c.fill();
	c.stroke();
}

RAPT.Rocket = function (center, target, heading, maxRotation, type) {
	RAPT.RotatingEnemy.call(this, type, center, RAPT.ROCKET_RADIUS, heading, RAPT.ROCKET_ELASTICITY);
	this.target = target;
	this.maxRotation = maxRotation;
	this.timeUntilFree = RAPT.ROCKET_HEADING_CONSTRAINT_TIME;
	this.timeUntilNextParticle = 0;
	this.velocity = new RAPT.Vector(RAPT.ROCKET_SPEED * Math.cos(heading), RAPT.ROCKET_SPEED * Math.sin(heading));

	var cc = this.target.color;

	this.sprite = new RAPT.SpriteGroup({
		name:'roket',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[cc,0]],
		list:['p1'],
		sizes: [ [0.7,0.7] ]
	});

	this.sprite.moveto(center);

	/*this.sprites = [new RAPT.Sprite(), new RAPT.Sprite()];
	this.sprites[RAPT.ROCKET_SPRITE_RED].drawGeometry = function(c) {
		c.fillStyle = 'red';
		RAPT.drawRocket(c);
	};
	this.sprites[RAPT.ROCKET_SPRITE_BLUE].drawGeometry = function(c) {
		c.fillStyle = 'blue';
		RAPT.drawRocket(c);
	};*/
}

//RAPT.Rocket.prototype = new RAPT.RotatingEnemy;
RAPT.Rocket.prototype = Object.create( RAPT.RotatingEnemy.prototype );

RAPT.Rocket.prototype.getTarget = function() { return this.target === RAPT.gameState.playerB; }

RAPT.Rocket.prototype.setTarget = function(player) { this.target = player; }

RAPT.Rocket.prototype.calcHeading = function(seconds) {
	if (this.target.isDead()) return;
	var delta = this.target.getCenter().sub(this.getCenter());
	var angle = delta.atan2();
	this.heading = RAPT.adjustAngleToTarget(this.heading, angle, this.maxRotation * seconds);
}

RAPT.Rocket.prototype.move = function(seconds) {
	if (this.timeUntilFree <= 0) {
		this.calcHeading(seconds);
		this.velocity = new RAPT.Vector(RAPT.ROCKET_SPEED * Math.cos(this.heading), RAPT.ROCKET_SPEED * Math.sin(this.heading));
	} else {
		this.timeUntilFree -= seconds;
	}
	return this.velocity.mul(seconds);
}

RAPT.Rocket.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	/*this.sprites[RAPT.ROCKET_SPRITE_RED].offsetBeforeRotation = position;
	this.sprites[RAPT.ROCKET_SPRITE_BLUE].offsetBeforeRotation = position;
	this.sprites[RAPT.ROCKET_SPRITE_RED].angle = this.heading;
	this.sprites[RAPT.ROCKET_SPRITE_BLUE].angle = this.heading;*/

	this.sprite.moveto(position);
	this.sprite.group.rotation.z = this.heading;

	position = position.sub(this.velocity.unit().mul(RAPT.ROCKET_RADIUS));

	this.timeUntilNextParticle -= seconds;
	while (this.timeUntilNextParticle <= 0 && !this.isDead()) { // must test IsDead() otherwise particles go through walls
		// add a flame
		//var direction = RAPT.Vector.fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0, 2)).sub(this.velocity.mul(3));
		RAPT.Particle().position(position).velocity(direction).radius(0.1, 0.15).bounces(1).decay(0.000001, 0.00001).expand(1.0, 1.2).color(1, 0.5, 0, 1).mixColor(1, 1, 0, 1).triangle();

		// add a puff of smoke
		//direction = Vector.fromAngle(randInRange(0, 2 * Math.PI));
		direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0.25, 1)).sub(this.velocity);
		RAPT.Particle().position(position).velocity(direction).radius(0.05, 0.1).bounces(1).elasticity(0.05, 0.9).decay(0.0005, 0.001).expand(1.2, 1.4).color(0, 0, 0, 0.25).mixColor(0.25, 0.25, 0.25, 0.75).circle().gravity(-0.4, 0);

		this.timeUntilNextParticle += RAPT.PARTICLE_FREQUENCY;
	}
}

RAPT.Rocket.prototype.reactToWorld = function(contact) {
	this.setDead(true);
}

RAPT.Rocket.prototype.reactToPlayer = function(player) {
	this.setDead(true);
	player.setDead(true);
}

RAPT.Rocket.prototype.onDeath = function() {
	var position = this.getCenter();
	this.sprite.remove();
	// fire
	for (var i = 0; i < 50; ++i) {
		//var direction = Vector.fromAngle(randInRange(0, 2 * Math.PI));
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0.5, 17));

		RAPT.Particle().position(position).velocity(direction).radius(0.02, 0.15).bounces(0, 4).elasticity(0.05, 0.9).decay(0.00001, 0.0001).expand(1.0, 1.2).color(1, 0.5, 0, 1).mixColor(1, 1, 0, 1).triangle();
	}
}

RAPT.Rocket.prototype.draw = function(c) {
	//this.sprites[this.target == RAPT.gameState.playerA ? RAPT.ROCKET_SPRITE_RED : RAPT.ROCKET_SPRITE_BLUE].draw(c);
}

RAPT.BOMB_RADIUS = 0.15;

RAPT.Bomb = function (center, velocity) {
	RAPT.FreefallEnemy.call(this, RAPT.ENEMY_BOMB, center, RAPT.BOMB_RADIUS, 0);
	this.velocity = velocity;

	this.sprite =  new RAPT.SpriteGroup({
		name:'bombe',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[6,0]],
		list:['bombe']
	});
	this.sprite.moveto(center);
}

RAPT.Bomb.prototype = Object.create( RAPT.FreefallEnemy.prototype );

RAPT.Bomb.prototype.afterTick = function(seconds) {
	this.sprite.moveto(this.hitCircle.center);
};

// bomb particle effects
RAPT.Bomb.prototype.onDeath = function() {
	this.sprite.remove();
	var position = this.getShape().getCenter();

	// fire
	for (var i = 0; i < 50; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI)).mul(RAPT.randInRange(0.5, 7));
		RAPT.Particle().position(position).velocity(direction).radius(0.02, 0.15).bounces(0, 4).elasticity(0.05, 0.9).decay(0.00001, 0.0001).expand(1.0, 1.2).color(1, 0.5, 0, 1).mixColor(1, 1, 0, 1).triangle().fixangle();
	}

	// white center
	// collide should be false on this
	RAPT.Particle().position(position).radius(0.1).bounces(0).gravity(false).decay(0.000001).expand(10).color(1, 1, 1, 5).circle();
};
RAPT.BOMBER_WIDTH = .4;
RAPT.BOMBER_HEIGHT = .4;
RAPT.BOMBER_SPEED = 2;
// Frequency is in seconds
RAPT.BOMB_FREQUENCY = 1.0;
RAPT.BOMBER_ELASTICITY = 1.0;
RAPT.BOMBER_EXPLOSION_POWER = 6;

RAPT.Bomber = function (center, angle) {
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_BOMBER, center, RAPT.BOMBER_WIDTH, RAPT.BOMBER_HEIGHT, RAPT.BOMBER_ELASTICITY, RAPT.BOMB_FREQUENCY, RAPT.randInRange(0, RAPT.BOMB_FREQUENCY));

	if (angle < Math.PI * 0.25) this.setVelocity(new RAPT.Vector(RAPT.BOMBER_SPEED, 0));
	else if (angle < Math.PI * 0.75) this.setVelocity(new RAPT.Vector(0, RAPT.BOMBER_SPEED));
	else if (angle < Math.PI * 1.25) this.setVelocity(new RAPT.Vector(-RAPT.BOMBER_SPEED, 0));
	else if (angle < Math.PI * 1.75) this.setVelocity(new RAPT.Vector(0, -RAPT.BOMBER_SPEED));
	else this.setVelocity(new RAPT.Vector(RAPT.BOMBER_SPEED, 0));

	this.sprite =  new RAPT.SpriteGroup({
		name:'bomber',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[5,0], [6,0]],

		list:['body', 'bombe1'],
		//sizes: [ [0.8,0.8] ]
		//pos:[[-0.2,-0.2], [0.2,0.2]]
	});

	this.sprite.moveto(center);
	this.startPosY = center.y;
}

//RAPT.Bomber.prototype = new RAPT.SpawningEnemy;
RAPT.Bomber.prototype = Object.create( RAPT.SpawningEnemy.prototype );
//RAPT.Bomber.prototype.constructor = RAPT.Bomber;

RAPT.Bomber.prototype.move = function(seconds) {
	return this.velocity.mul(seconds);
};

RAPT.Bomber.prototype.reactToPlayer = function(player) {
	var relativePos = player.getCenter().sub(this.getCenter());
	// If player jumps on top of the Bomber, it explodes
	if (relativePos.y > (RAPT.BOMBER_HEIGHT - .05)) {
		player.setVelocity(new RAPT.Vector(player.getVelocity().x, RAPT.BOMBER_EXPLOSION_POWER));
		this.setDead(true);
	} else if (player.isSuperJumping) {
		this.setDead(true);
	} else {
		player.setDead(true);
	}
};

RAPT.Bomber.prototype.spawn = function() {
	var spawnPoint = new RAPT.Vector(this.hitBox.lowerLeft.x + this.hitBox.getWidth() * 0.5, this.hitBox.getBottom());
	RAPT.gameState.addEnemy(new RAPT.Bomb(spawnPoint, new RAPT.Vector(0, Math.min(this.velocity.y, -.3))), spawnPoint);
	return true;
};

RAPT.Bomber.prototype.afterTick = function() {
	// drawing stuff
	var pos = this.getCenter();
	this.sprite.moveto(pos);
	
	var sc = 1 * this.getReloadPercentage();
	this.sprite.sprite[1].scale.set(sc,sc,sc);
};

RAPT.Bomber.prototype.onDeath = function() {
	this.sprite.remove();
	RAPT.Bomb.prototype.onDeath.call(this);
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);
};
RAPT.BOUNCY_ROCKET_SPEED = 4;
RAPT.BOUNCY_ROCKET_MAX_ROTATION = 3;
RAPT.BOUNCY_ROCKET_HEALTH = 2;

/*RAPT.drawBouncyRocket = function (c, isBlue) {
	var size = 0.1;
	c.strokeStyle = 'black';

	c.fillStyle = isBlue ? 'blue' : 'red';
	c.beginPath();
	c.moveTo(-RAPT.ROCKET_RADIUS, size);
	c.arc(RAPT.ROCKET_RADIUS - size, 0, size, Math.PI / 2, -Math.PI / 2, true);
	c.lineTo(-RAPT.ROCKET_RADIUS, -size);
	c.fill();
	c.stroke();

	c.fillStyle = isBlue ? 'red' : 'blue';
	c.beginPath();
	c.arc(-RAPT.ROCKET_RADIUS, 0, size, -Math.PI / 2, Math.PI / 2, false);
	c.closePath();
	c.fill();
	c.stroke();
}*/

//BouncyRocket.subclasses(Rocket);

RAPT.BouncyRocket = function (center, target, heading, launcher) {
	//Rocket.prototype.constructor.call(this, center, target, heading, BOUNCY_ROCKET_MAX_ROTATION, ENEMY_BOUNCY_ROCKET);
	RAPT.Rocket.call(this, center, target, heading, RAPT.BOUNCY_ROCKET_MAX_ROTATION, RAPT.ENEMY_BOUNCY_ROCKET);
	
	this.velocity = new RAPT.Vector(RAPT.BOUNCY_ROCKET_SPEED * Math.cos(heading), RAPT.BOUNCY_ROCKET_SPEED * Math.sin(heading));
	this.launcher = launcher;
	this.hitsUntilExplodes = RAPT.BOUNCY_ROCKET_HEALTH;

	

	if(this.sprite)this.sprite.remove();

	var cc = this.target.color;
	this.sprite = new RAPT.SpriteGroup({
		name:'bouncyrocket',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[cc+5,1]],
		list:['p1'],
	});

	this.sprite.moveto(center);

	/*this.sprites[RAPT.ROCKET_SPRITE_RED].drawGeometry = function(c) {
		RAPT.drawBouncyRocket(c, false);
	};
	this.sprites[RAPT.ROCKET_SPRITE_BLUE].drawGeometry = function(c) {
		RAPT.drawBouncyRocket(c, true);
	};*/
}

RAPT.BouncyRocket.prototype = Object.create( RAPT.Rocket.prototype );
//RAPT.BouncyRocket.prototype = new RAPT.Rocket;

RAPT.BouncyRocket.prototype.move = function(seconds) {
	this.heading = this.velocity.atan2();
	this.calcHeading(seconds);
	this.velocity = new RAPT.Vector(RAPT.BOUNCY_ROCKET_SPEED * Math.cos(this.heading), RAPT.BOUNCY_ROCKET_SPEED * Math.sin(this.heading));
	return this.velocity.mul(seconds);
}

RAPT.BouncyRocket.prototype.reactToWorld = function(contact) {
	--this.hitsUntilExplodes;

	if (this.hitsUntilExplodes <= 0) {
		this.setDead(true);
	} else {
		this.target = RAPT.gameState.getOtherPlayer(this.target);
	}
}

RAPT.BouncyRocket.prototype.setDead = function(isDead) {
	this.sprite.remove();
	RAPT.Enemy.prototype.setDead.call(this, isDead);
	if (isDead && this.launcher !== null) {
		this.launcher.rocketDestroyed();
	}
}

RAPT.BOUNCY_LAUNCHER_WIDTH = .5;
RAPT.BOUNCY_LAUNCHER_HEIGHT = .5;
RAPT.BOUNCY_LAUNCHER_SHOOT_FREQ = 1;
RAPT.BOUNCY_LAUNCHER_RANGE = 8;

RAPT.BouncyRocketLauncher = function (center, target) {
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_BOUNCY_ROCKET_LAUNCHER, center, RAPT.BOUNCY_LAUNCHER_WIDTH, RAPT.BOUNCY_LAUNCHER_HEIGHT, 0, RAPT.BOUNCY_LAUNCHER_SHOOT_FREQ, 0);
	
	this.target = target;
	this.canFire = true;
	this.angle = 0;

	var cc = this.target.color;
	this.sprite =  new RAPT.SpriteGroup({
		name:'bouncyrocketlaunch',
		material:RAPT.MAT_ENEMY,
		size:1,
		nuv:16,
		uvs:[[cc+7,1]],
		list:['p1']
	});

	this.sprite.moveto(center);
}

//RAPT.BouncyRocketLauncher.prototype = new RAPT.SpawningEnemy;
RAPT.BouncyRocketLauncher.prototype = Object.create( RAPT.SpawningEnemy.prototype );

RAPT.BouncyRocketLauncher.prototype.setTarget = function(player) { this.target = player; }

RAPT.BouncyRocketLauncher.prototype.canCollide = function() { return false; }

RAPT.BouncyRocketLauncher.prototype.rocketDestroyed = function() { this.canFire = true; }

RAPT.BouncyRocketLauncher.prototype.getTarget = function() { return this.target === RAPT.gameState.playerB; }

RAPT.BouncyRocketLauncher.prototype.spawn = function() {
	if (this.canFire && !this.target.isDead()) {
		var targetDelta = this.target.getCenter().sub(this.getCenter());
		// If Player is out of range or out of line of sight, don't launch anything
		if (targetDelta.length() < RAPT.BOUNCY_LAUNCHER_RANGE) {
			if (!RAPT.gameState.collider.lineOfSightWorld(this.getCenter(), this.target.getCenter(), RAPT.gameState.world)) {
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
		this.sprite.group.rotation.z = (position.sub(this.target.getCenter())).atan2() + RAPT.PI;
		//this.bodySprite.angle = (position.sub(this.target.getCenter())).atan2();
	}
	//this.bodySprite.offsetBeforeRotation = position;

	this.sprite.moveto(position);
}
RAPT.CORROSION_CLOUD_RADIUS = .5;
RAPT.CORROSION_CLOUD_SPEED = .7;
RAPT.CORROSION_CLOUD_ACCEL = 10;


RAPT.CorrosionCloud = function (center, target) {
	RAPT.RotatingEnemy.call(this, RAPT.ENEMY_CLOUD, center, RAPT.CORROSION_CLOUD_RADIUS, 0, 0);

	this.target = target;
	this.smoothedVelocity = new RAPT.Vector(0, 0);
}

//RAPT.CorrosionCloud.prototype = new RAPT.RotatingEnemy;
RAPT.CorrosionCloud.prototype = Object.create( RAPT.RotatingEnemy.prototype );

RAPT.CorrosionCloud.prototype.canCollide = function() {
	return false;
}

RAPT.CorrosionCloud.prototype.avoidsSpawn = function() {
	return true;
}

RAPT.CorrosionCloud.prototype.move = function(seconds) {
	var avoidingSpawn = false;
	if (!this.target) return new RAPT.Vector(0, 0);
	var targetDelta = this.target.getCenter().sub(this.getCenter());
	// As long as the max rotation is over 2 pi, it will rotate to face the player no matter what
	this.heading = RAPT.adjustAngleToTarget(this.heading, targetDelta.atan2(), 7);
	// ACCELERATION
	var speed = RAPT.CORROSION_CLOUD_SPEED * RAPT.CORROSION_CLOUD_ACCEL * seconds;
	this.velocity.x += speed * Math.cos(this.heading);
	this.velocity.y += speed * Math.sin(this.heading);

	if (this.velocity.lengthSquared() > (RAPT.CORROSION_CLOUD_SPEED * RAPT.CORROSION_CLOUD_SPEED)) {
		this.velocity.normalize();
		this.velocity.inplaceMul(RAPT.CORROSION_CLOUD_SPEED);
	}

	return this.velocity.mul(seconds);
};

RAPT.CorrosionCloud.prototype.afterTick = function(seconds) {
	var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
	var center = this.getCenter().add(direction.mul(RAPT.randInRange(0, RAPT.CORROSION_CLOUD_RADIUS)));

	var isRed = (this.target === RAPT.gameState.playerA) ? 0.4 : 0;
	var isBlue = (this.target === RAPT.gameState.playerB) ? 0.3 : 0;

	this.smoothedVelocity = this.smoothedVelocity.mul(0.95).add(this.velocity.mul(0.05));
	RAPT.Particle().position(center).velocity(this.smoothedVelocity.sub(new RAPT.Vector(0.1, 0.1)), this.smoothedVelocity.add(new RAPT.Vector(0.1, 0.1))).radius(0.01, 0.1).bounces(0, 4).elasticity(0.05, 0.9).decay(0.01, 0.5).expand(1, 1.2).color(0.2 + isRed, 0.2, 0.2 + isBlue, 1).mixColor(0.1 + isRed, 0.1, 0.1 + isBlue, 1).circle().gravity(-0.4, 0);
};

RAPT.CorrosionCloud.prototype.getTarget = function() {
	return this.target === RAPT.gameState.playerB;
};

RAPT.CorrosionCloud.prototype.draw = function(c) {
	// do nothing, it's all particles!
};

RAPT.DOOM_MAGNET_RADIUS = .3;
RAPT.DOOM_MAGNET_ELASTICITY = 0.5;
RAPT.DOOM_MAGNET_RANGE = 10;
RAPT.DOOM_MAGNET_ACCEL = 2;
RAPT.MAGNET_MAX_ROTATION = 2 * Math.PI;

RAPT.DoomMagnet = function(center) {
	RAPT.RotatingEnemy.call(this, RAPT.ENEMY_MAGNET, center, RAPT.DOOM_MAGNET_RADIUS, 0, RAPT.DOOM_MAGNET_ELASTICITY);

	this.sprite =  new RAPT.SpriteGroup({
		name:'doommagnet',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[0,2]],
		color:0XFFCC00,

		list:['p1'],
		sizes: [ [0.8,0.8] ]
	});

	this.sprite.moveto(center);

	/*this.bodySprite = new RAPT.Sprite();
	this.bodySprite.drawGeometry = function(c) {
		var length = 0.15;
		var outerRadius = 0.15;
		var innerRadius = 0.05;

		for (var scale = -1; scale <= 1; scale += 2) {
			c.fillStyle = 'red';
			c.beginPath();
			c.moveTo(-outerRadius - length, scale * innerRadius);
			c.lineTo(-outerRadius - length, scale * outerRadius);
			c.lineTo(-outerRadius - length + (outerRadius - innerRadius), scale * outerRadius);
			c.lineTo(-outerRadius - length + (outerRadius - innerRadius), scale * innerRadius);
			c.fill();

			c.fillStyle = 'blue';
			c.beginPath();
			c.moveTo(outerRadius + length, scale * innerRadius);
			c.lineTo(outerRadius + length, scale * outerRadius);
			c.lineTo(outerRadius + length - (outerRadius - innerRadius), scale * outerRadius);
			c.lineTo(outerRadius + length - (outerRadius - innerRadius), scale * innerRadius);
			c.fill();
		}
		c.strokeStyle = 'black';

		// draw one prong of the magnet 
		c.beginPath();
		c.arc(outerRadius, 0, outerRadius, 1.5 * Math.PI, 0.5 * Math.PI, true);
		c.lineTo(outerRadius + length, outerRadius);
		c.lineTo(outerRadius + length, innerRadius);

		c.arc(outerRadius, 0, innerRadius, 0.5 * Math.PI, 1.5 * Math.PI, false);
		c.lineTo(outerRadius + length, -innerRadius);
		c.lineTo(outerRadius + length, -outerRadius);
		c.lineTo(outerRadius, -outerRadius);
		c.stroke();

		// other prong
		c.beginPath();
		c.arc(-outerRadius, 0, outerRadius, 1.5 * Math.PI, 2.5 * Math.PI, false);
		c.lineTo(-outerRadius - length, outerRadius);
		c.lineTo(-outerRadius - length, innerRadius);

		c.arc(-outerRadius, 0, innerRadius, 2.5 * Math.PI, 1.5 * Math.PI, true);
		c.lineTo(-outerRadius - length, -innerRadius);
		c.lineTo(-outerRadius - length, -outerRadius);
		c.lineTo(-outerRadius, -outerRadius);
		c.stroke();
	}*/
}

//RAPT.DoomMagnet.prototype = new RAPT.RotatingEnemy;
RAPT.DoomMagnet.prototype = Object.create( RAPT.RotatingEnemy.prototype );
//RAPT.DoomMagnet.prototype.constructor = RAPT.DoomMagnet;

RAPT.DoomMagnet.prototype.avoidsSpawn = function() { 
	return true;
};

RAPT.DoomMagnet.prototype.calcHeadingVector = function(target) {
	if (target.isDead()) return new RAPT.Vector(0, 0);
	var delta = target.getCenter().sub(this.getCenter());
	if (delta.lengthSquared() > (RAPT.DOOM_MAGNET_RANGE * RAPT.DOOM_MAGNET_RANGE)) return new RAPT.Vector(0, 0);
	delta.normalize();
	return delta;
};

RAPT.DoomMagnet.prototype.move = function(seconds) {
	var playerA = RAPT.gameState.playerA;
	var playerB = RAPT.gameState.playerB;

	var headingA = this.calcHeadingVector(playerA);
	var headingB = this.calcHeadingVector(playerB);
	var heading = (headingA.add(headingB)).mul(RAPT.DOOM_MAGNET_ACCEL);

	var delta = this.accelerate(heading, seconds);
	// Time independent version of mulitiplying by 0.994
	this.velocity.inplaceMul(Math.pow(0.547821, seconds));

	var center = this.getCenter();
	var oldAngle = this.sprite.group.rotation.z;//this.bodySprite.angle;
	var targetAngle = oldAngle;
	if(!playerA.isDead() && playerB.isDead()) {
		targetAngle = (playerA.getCenter().sub(center)).atan2() + Math.PI;
	} else if (playerA.isDead() && !playerB.isDead()) {
		targetAngle = (playerB.getCenter().sub(center)).atan2();
	} else if (!playerA.isDead() && !playerB.isDead()) {
		var needsFlip = (playerA.getCenter().sub(center).flip().dot(playerB.getCenter().sub(center)) < 0);
		targetAngle = heading.atan2() - Math.PI * 0.5 + Math.PI * needsFlip;
	}
	//this.bodySprite.angle = RAPT.adjustAngleToTarget(oldAngle, targetAngle, RAPT.MAGNET_MAX_ROTATION * seconds);

	
	this.sprite.group.rotation.z = RAPT.adjustAngleToTarget(oldAngle, targetAngle, RAPT.MAGNET_MAX_ROTATION * seconds);

	return delta;
};

RAPT.DoomMagnet.prototype.afterTick = function(seconds) {
	this.sprite.moveto( this.getCenter());
	//var position = this.getCenter();
	//this.bodySprite.offsetBeforeRotation = new RAPT.Vector(position.x, position.y);
};

RAPT.DoomMagnet.prototype.draw = function(c) {
	//this.bodySprite.draw(c);
};

// enum
RAPT.DOORBELL_OPEN = 0;
RAPT.DOORBELL_CLOSE = 1;
RAPT.DOORBELL_TOGGLE = 2;
// Must be wider and taller than the player to avoid double toggling 
RAPT.DOORBELL_WIDTH = 0.40;
// PLAYER_HEIGHT + .01
RAPT.DOORBELL_HEIGHT = 0.76;
RAPT.DOORBELL_RADIUS = 0.11;
RAPT.DOORBELL_SLICES = 3;

RAPT.Doorbell = function (center, behavior, visible) {
	RAPT.Enemy.call(this, RAPT.ENEMY_DOORBELL, 1);
	this.hitBox = RAPT.makeAABB(center, RAPT.DOORBELL_WIDTH, RAPT.DOORBELL_HEIGHT);
	this.rotationPercent = 1;
	this.restingAngle = RAPT.randInRange(0, 2 * Math.PI);
	this.behavior = behavior;
	this.visible = visible;
	this.triggeredLastTick = false;
	this.triggeredThisTick = false;
	this.doors = [];

	this.sprite = new RAPT.SpriteGroup({
		name:'doorbell',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[13,0]],
		color:0X44CC66,
		list:['p1'],
		//sizes: [ [0.7,0.7] ]
	});

	this.sprite.moveto(center);
}

//RAPT.Doorbell.prototype = new RAPT.Enemy;
RAPT.Doorbell.prototype = Object.create( RAPT.Enemy.prototype );
//RAPT.Doorbell.prototype.constructor = RAPT.Doorbell;

RAPT.Doorbell.prototype.getShape = function() { return this.hitBox; }

RAPT.Doorbell.prototype.addDoor = function(doorIndex) { this.doors.push(doorIndex); }

RAPT.Doorbell.prototype.canCollide = function() { return false; }

RAPT.Doorbell.prototype.tick = function(seconds) {
	this.rotationPercent += seconds;
	if (this.rotationPercent > 1) {
		this.rotationPercent = 1;
	}

	this.sprite.sprite[0].rotation.z = (RAPT.PI90 * this.rotationPercent) - (RAPT.PI90 *0.5);

	this.triggeredThisTick = false;
	RAPT.Enemy.prototype.tick.call(this, seconds);
	this.triggeredLastTick = this.triggeredThisTick;
}

RAPT.Doorbell.prototype.reactToPlayer = function(player) {
	this.triggeredThisTick = true;
	if (this.triggeredLastTick) return;
	
	for (var i = 0; i < this.doors.length; ++i) {
		RAPT.gameState.getDoor(this.doors[i]).act(this.behavior, false, true);
	}

	for (var i = 0; i < 50; ++i) {
		var rotationAngle = RAPT.randInRange(0, 2 * Math.PI);
		var direction = new RAPT.Vector().fromAngle(rotationAngle).mul(RAPT.randInRange(3, 5));
		RAPT.Particle().position(this.getCenter()).velocity(direction).angle(rotationAngle).radius(0.1).bounces(3).elasticity(0.5).decay(0.01).line().color(1, 1, 1, 1).fixangle();
	}

	this.rotationPercent = 0;
}
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

/*RAPT.GoldenCog.prototype.draw = function(c) {
	var position = this.getCenter();
	RAPT.drawGoldenCog(c, position.x, position.y, this.timeSinceStart);
};*/
RAPT.GRENADE_LIFETIME = 5;
RAPT.GRENADE_RADIUS = 0.2;
RAPT.GRENADE_ELASTICITY = 0.5;

RAPT.Grenade = function (center, direction, speed) {
	RAPT.FreefallEnemy.call(this, RAPT.ENEMY_GRENADE, center, RAPT.GRENADE_RADIUS, RAPT.GRENADE_ELASTICITY);

	this.velocity = new RAPT.Vector(speed * Math.cos(direction), speed * Math.sin(direction));
	this.timeUntilExplodes = RAPT.GRENADE_LIFETIME;

	this.sprite =  new RAPT.SpriteGroup({
		name:'grenade',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[7,0], [8,0]],
		list:['p1', 'p2'],
		sizes: [ [0.8,0.8] ],
		
	});

	this.isDEAD = false;

	this.sprite.moveto(center);
}

//RAPT.Grenade.prototype = new RAPT.FreefallEnemy;
RAPT.Grenade.prototype = Object.create( RAPT.FreefallEnemy.prototype );

/*RAPT.Grenade.prototype.draw = function(c) {
	var position = this.getShape().getCenter();
	var percentUntilExplodes = this.timeUntilExplodes / RAPT.GRENADE_LIFETIME;

	// draw the expanding dot in the center
	c.fillStyle = 'black';
	c.beginPath();
	c.arc(position.x, position.y, (1 - percentUntilExplodes) * RAPT.GRENADE_RADIUS, 0, Math.PI*2, false);
	c.fill();

	// draw the rim
	c.strokeStyle = 'black';
	c.beginPath();
	c.arc(position.x, position.y, RAPT.GRENADE_RADIUS, 0, Math.PI*2, false);
	c.stroke();
};*/

// Grenades have a Tick that counts until their explosion
RAPT.Grenade.prototype.tick = function(seconds) {
	this.timeUntilExplodes -= seconds;

	if (this.timeUntilExplodes <= 0){
		this.setDead(true);
	}

	RAPT.FreefallEnemy.prototype.tick.call(this, seconds);
};

RAPT.Grenade.prototype.afterTick = function() {
	if(!this.isDEAD){
		var pos = this.getCenter();
		var percentUntilExplodes = this.timeUntilExplodes / RAPT.GRENADE_LIFETIME;
		var s = (1 - percentUntilExplodes) * 1;
		this.sprite.sprite[1].scale.set(s,s,s);
		this.sprite.moveto(pos);
	}
};	

// Grenades bounce around, and are not destroyed by edges like other FreefallEnemies
RAPT.Grenade.prototype.reactToWorld = function(contact) {
};

RAPT.Grenade.prototype.onDeath = function() {
	this.sprite.remove();
	this.isDEAD = true;
	var position = this.getCenter();

	// fire
	for (var i = 0; i < 100; i++) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI)).mul(RAPT.randInRange(1, 10));
		RAPT.Particle().position(position).velocity(direction).radius(0.1, 0.2).bounces(0, 4).elasticity(0.05, 0.9).decay(0.0001, 0.001).expand(1, 1.2).color(1, 0.25, 0, 1).mixColor(1, 0.5, 0, 1).triangle();
	}

	// smoke
	for(var i = 0; i < 50; i++) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = new RAPT.Vector(0, 1).add(direction.mul(RAPT.randInRange(0.25, 1)));
		RAPT.Particle().position(position).velocity(direction).radius(0.1, 0.2).bounces(1, 3).elasticity(0.05, 0.9).decay(0.0005, 0.1).expand(1.1, 1.3).color(0, 0, 0, 1).mixColor(0.5, 0.5, 0.5, 1).circle().gravity(-0.4, 0);
	}
};

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

	var cc = this.target.color;

	this.sprite =  new RAPT.SpriteGroup({
		name:'grenadier',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[8+cc,0]],
		list:['p1'],
		pos:[[0,0,-0.01]]
	});

	this.sprite.moveto(center);
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
		this.sprite.group.rotation.z = this.target.getCenter().add(new RAPT.Vector(0, 3)).sub(position).atan2() + Math.PI / 2;
		//this.bodySprite.angle = this.target.getCenter().add(new RAPT.Vector(0, 3)).sub(position).atan2() + Math.PI / 2;
	}
	//this.bodySprite.offsetBeforeRotation = position;

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


	//this.bodySprite.offsetAfterRotation = new RAPT.Vector(0, this.actualRecoilDistance);
};

/*RAPT.Grenadier.prototype.draw = function(c) {
	c.fillStyle = (this.target == RAPT.gameState.playerA) ? 'red' : 'blue';
	c.strokeStyle = 'black';
	this.bodySprite.draw(c);
};*/

RAPT.HEADACHE_RADIUS = .15;
RAPT.HEADACHE_ELASTICITY = 0;
RAPT.HEADACHE_SPEED = 3;
RAPT.HEADACHE_RANGE = 6;

RAPT.HEADACHE_CLOUD_RADIUS = RAPT.HEADACHE_RADIUS * 0.5;

RAPT.Headache = function (center, target) {
	RAPT.HoveringEnemy.call(this, RAPT.ENEMY_HEADACHE, center, RAPT.HEADACHE_RADIUS, RAPT.HEADACHE_ELASTICITY);

	this.target = target;
	this.isAttached = false;
	this.isTracking = false;
	//this.restingOffset = new RAPT.Vector(0, -10);

	var cc = this.target.color;

	this.sprite =  new RAPT.SpriteGroup({
		name:'headache',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[4+cc,2]],
		list:['p1'],
		pos:[[0,0,0.02]]
	});

	this.sprite.moveto(center);
}

RAPT.Headache.prototype = Object.create( RAPT.HoveringEnemy.prototype );

RAPT.Headache.prototype.move = function(seconds) {
	this.isTracking = false;

	// If the headache isn't yet attached to a Player
	if (!this.isAttached) {
		if (this.target.isDead()) return new RAPT.Vector(0, 0);
		var delta = this.target.getCenter().sub(this.getCenter());
		if (delta.lengthSquared() < (RAPT.HEADACHE_RANGE * RAPT.HEADACHE_RANGE) && !RAPT.gameState.collider.lineOfSightWorld(this.getCenter(), this.target.getCenter(), RAPT.gameState.world)) {
			// Seeks the top of the Player, not the center
			delta.y += 0.45;
			// Multiply be 3 so it attaches more easily if its close to a player
			if (delta.lengthSquared() > (RAPT.HEADACHE_SPEED * seconds * RAPT.HEADACHE_SPEED * seconds * 3)){
				this.isTracking = true;
				delta.normalize();
				delta = delta.mul(RAPT.HEADACHE_SPEED * seconds);
			} else {
				this.isAttached = true;
			}
			return delta;
		}
	} else {
		// If a headache is attached to a dead player, it vanishes
		if (this.target.isDead()) this.setDead(true);
		
		// Otherwise it moves with the player
		var delta = this.target.getCenter().add(new RAPT.Vector(0, 0.45)).sub(this.getCenter());
		// If player is crouching, adjust position
		if (this.target.getCrouch() && this.target.isOnFloor()){
			delta.y -= 0.25;
			if (this.target.facingRight) delta.x += 0.15;
			else delta.x -= 0.15;
		}
		this.hitCircle.moveBy(delta);
	}
	return new RAPT.Vector(0, 0);
};

RAPT.Headache.prototype.reactToWorld = function() {
	// Nothing happens
};

RAPT.Headache.prototype.onDeath = function() {
	this.sprite.remove();

	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);
	
	var position = this.getCenter();

	// body
	var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI)).mul(RAPT.randInRange(0, 0.05));
	var body = RAPT.Particle().position(position).velocity(direction).radius(RAPT.HEADACHE_RADIUS).bounces(3).elasticity(0.5).decay(0.01).circle().gravity(5);
	if (this.target == RAPT.gameState.playerA) body.color(1, 0, 0, 1);
	else  body.color(0, 0, 1, 1);

	// black lines out from body
	for (var i = 0; i < 50; ++i) {
		var rotationAngle = RAPT.randInRange(0, 2 * Math.PI);
		direction = new RAPT.Vector().fromAngle(rotationAngle).mul(RAPT.randInRange(3, 5));
		RAPT.Particle().position(this.getCenter()).velocity(direction).angle(rotationAngle).radius(0.05).bounces(3).elasticity(0.5).decay(0.01).line().color(0, 0, 0, 1);
	}
};

RAPT.Headache.prototype.reactToPlayer = function(player) {
	if (player === this.target) {
		player.disableJump();
	} else if (player.getVelocity().y < 0 && player.getCenter().y > this.getCenter().y) {
		// The other player must jump on the headache from above to kill it
		this.setDead(true);
	}
};

RAPT.Headache.prototype.getTarget = function() {
	return this.target === RAPT.gameState.playerB;
};

RAPT.Headache.prototype.afterTick = function(seconds) {
	var center = this.getCenter();
	this.sprite.moveto(center);
	this.sprite.group.rotation.z += seconds*3;
};
//RAPT.HELP_SIGN_TEXT_WIDTH = 1.5;
RAPT.HELP_SIGN_WIDTH = 0.76;
RAPT.HELP_SIGN_HEIGHT = 0.76;

// Help signs take in an array of strings, each string in the array is drawn
// on its own line.
RAPT.HelpSign = function (center, text, width) {
	RAPT.Enemy.call(this, RAPT.ENEMY_HELP_SIGN, 0);

	this.sprite =  new RAPT.SpriteGroup({
		name:'helpsign',
		material:RAPT.MAT_ENEMY,
		size:1,
		nuv:16,
		uvs:[[14,0]],
		color:0XFFCC00,
		list:['p1']
	});

	this.sprite.moveto(center);

	this.hitBox = RAPT.makeAABB(center, RAPT.HELP_SIGN_WIDTH, RAPT.HELP_SIGN_HEIGHT);
	this.text = text;
	this.drawText = false;
	this.timeSinceStart = 0;
	/*if (width === undefined) {
		this.textWidth = RAPT.HELP_SIGN_TEXT_WIDTH;
	} else {
		this.textWidth = width;
	}*/

	this.isWasSeen = false;
};

RAPT.HelpSign.prototype = Object.create( RAPT.Enemy.prototype );

RAPT.HelpSign.prototype.getShape = function() { return this.hitBox; };

RAPT.HelpSign.prototype.canCollide = function() { return false; };

RAPT.HelpSign.prototype.tick = function(seconds) {
	
	var timeFloor = Math.floor(this.timeSinceStart);
	var scaleFactor = this.timeSinceStart - timeFloor;
	scaleFactor = Math.cos(scaleFactor * 2 * Math.PI) / 16 + 1;

	this.sprite.group.scale.x = scaleFactor;
	this.sprite.group.scale.y = scaleFactor;

	this.timeSinceStart += seconds;

	this.drawText = false;
	RAPT.Enemy.prototype.tick.call(this, seconds);

	if(this.drawText){
		RAPT.gameState.message(this.text);
	}
};

RAPT.HelpSign.prototype.reactToPlayer = function(player) {
	this.drawText = true;
};
//RAPT.HUNTER_BODY = 0;
//RAPT.HUNTER_CLAW1 = 1;
//RAPT.HUNTER_CLAW2 = 2;

RAPT.HUNTER_RADIUS = 0.3;
RAPT.HUNTER_ELASTICITY = 0.4;
RAPT.HUNTER_CHASE_ACCEL = 14;
RAPT.HUNTER_FLEE_ACCEL = 3;
RAPT.HUNTER_FLEE_RANGE = 10;
RAPT.HUNTER_CHASE_RANGE = 8;
RAPT.HUNTER_LOOKAHEAD = 20;

RAPT.STATE_IDLE = 0;
RAPT.STATE_RED = 1;
RAPT.STATE_BLUE = 2;
RAPT.STATE_BOTH = 3;

RAPT.Hunter = function (center) {
	RAPT.RotatingEnemy.call(this, RAPT.ENEMY_HUNTER, center, RAPT.HUNTER_RADIUS, 0, RAPT.HUNTER_ELASTICITY);

	this.angle = 0
	this.state = RAPT.STATE_IDLE;
	this.acceleration = new RAPT.Vector(0, 0);
	this.jawAngle = 0;

	this.sprite =  new RAPT.SpriteGroup({
		name:'hunter',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[1,2], [3,2], [2,2]],
		color:0XFFCC00,
		parent:['' , 'body', 'body'],
		list:['body', 'bottom','top'],
		pos:   [ [0,0,0] ,[-0.25,0,0],[-0.25,0,0]],
		center:[ [0,0]  , [0.25,0], [0.25,0]],
		sizes: [ [0.9,0.9] ]
	});

	this.sprite.moveto(center);

	/*this.sprites = [new RAPT.Sprite(), new RAPT.Sprite(), new RAPT.Sprite()];
	this.sprites[RAPT.HUNTER_BODY].drawGeometry = function(c) {
		c.beginPath();
		c.arc(0, 0, 0.1, 0, 2*Math.PI, false);
		c.stroke();
	};
	this.sprites[RAPT.HUNTER_CLAW1].drawGeometry = this.sprites[RAPT.HUNTER_CLAW2].drawGeometry = function(c) {
		c.beginPath();
		c.moveTo(0, 0.1);
		for(var i = 0; i <= 6; i++)
			c.lineTo((i & 1) / 24, 0.2 + i * 0.05);
		c.arc(0, 0.2, 0.3, 0.5*Math.PI, -0.5*Math.PI, true);
		c.stroke();
	};
	this.sprites[RAPT.HUNTER_CLAW1].setParent(this.sprites[RAPT.HUNTER_BODY]);
	this.sprites[RAPT.HUNTER_CLAW2].setParent(this.sprites[RAPT.HUNTER_BODY]);
	this.sprites[RAPT.HUNTER_CLAW2].flip = true;
	this.sprites[RAPT.HUNTER_BODY].offsetAfterRotation = new RAPT.Vector(0, -0.2);*/
}

//RAPT.Hunter.prototype = new RAPT.RotatingEnemy;
RAPT.Hunter.prototype = Object.create( RAPT.RotatingEnemy.prototype );

RAPT.Hunter.prototype.avoidsSpawn = function() { return true; };

RAPT.Hunter.prototype.calcAcceleration = function(target) {
	return target.unit().sub(this.velocity.mul(3.0 / RAPT.HUNTER_CHASE_ACCEL)).unit().mul(RAPT.HUNTER_CHASE_ACCEL);
};

RAPT.Hunter.prototype.playerInSight = function(target, distanceSquared) {
	if (target.isDead()) return false;
	var inSight = distanceSquared < (RAPT.HUNTER_CHASE_RANGE * RAPT.HUNTER_CHASE_RANGE);
	inSight &= !RAPT.gameState.collider.lineOfSightWorld(this.getCenter(), target.getCenter(), RAPT.gameState.world);
	return inSight;
};

RAPT.Hunter.prototype.move = function(seconds) {
	// Relative player positions
	var deltaA = RAPT.gameState.playerA.getCenter().sub(this.getCenter());
	var deltaB = RAPT.gameState.playerB.getCenter().sub(this.getCenter());
	// Projection positions with lookahead
	var projectedA = deltaA.add(RAPT.gameState.playerA.getVelocity().mul(RAPT.HUNTER_LOOKAHEAD * seconds));
	var projectedB = deltaB.add(RAPT.gameState.playerB.getVelocity().mul(RAPT.HUNTER_LOOKAHEAD * seconds));
	// Squared distances
	var distASquared = deltaA.lengthSquared();
	var distBSquared = deltaB.lengthSquared();
	// Checks if players are in sight
	var inSightA = this.playerInSight(RAPT.gameState.playerA, distASquared);
	var inSightB = this.playerInSight(RAPT.gameState.playerB, distBSquared);

	// If player A is in sight
	if (inSightA) {
		// If both in sight
		if (inSightB) {
			// If they're on the same side of the Hunter, the Hunter will flee
			if ((deltaA.dot(this.velocity) * deltaB.dot(this.velocity)) >= 0) {
				this.acceleration = deltaA.unit().add(deltaB.unit()).mul(-.5 * RAPT.HUNTER_FLEE_ACCEL);
				this.target = null;
				this.state = RAPT.STATE_BOTH;
			} else if (distASquared < distBSquared) {
				// Otherwise the hunter will chase after the closer of the two players
				this.acceleration = this.calcAcceleration(projectedA);
				this.target = RAPT.gameState.playerA;
				this.state = RAPT.STATE_RED;
			} else {
				this.acceleration = this.calcAcceleration(projectedB);
				this.target = RAPT.gameState.playerB;
				this.state = RAPT.STATE_BLUE;
			}
		// If only player A in sight
		} else {
			this.acceleration = this.calcAcceleration(projectedA);
			this.target = RAPT.gameState.playerA;
			this.state = RAPT.STATE_RED;
		}
	} else if (inSightB) {
		// If only player B in sight
		this.acceleration = this.calcAcceleration(projectedB);
		this.target = RAPT.gameState.playerB;
		this.state = RAPT.STATE_BLUE;
	} else {
		this.acceleration.x = this.acceleration.y = 0;
		this.target = null;
		this.state = RAPT.STATE_IDLE;
	}

	// Damp the movement so it doesn't keep floating around
	// Time independent version of multiplying by 0.99
	this.velocity.inplaceMul(Math.pow(0.366032, seconds));

	return this.accelerate(this.acceleration, seconds);
};

RAPT.Hunter.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	//this.sprites[RAPT.HUNTER_BODY].offsetBeforeRotation = position;

	this.sprite.moveto(position);

	if (this.target){
		var currentAngle = this.angle;//this.sprite.group.rotation.z;//this.sprites[RAPT.HUNTER_BODY].angle;
		var targetAngle = this.target.getCenter().sub(position).atan2() ;//- Math.PI / 2;
		this.angle = RAPT.adjustAngleToTarget(currentAngle, targetAngle, Math.PI * seconds)
		this.sprite.group.rotation.z = this.angle;//APT.adjustAngleToTarget(currentAngle, targetAngle, Math.PI * seconds) + RAPT.PI90;
		//this.sprites[RAPT.HUNTER_BODY].angle = RAPT.adjustAngleToTarget(currentAngle, targetAngle, Math.PI * seconds);
	}



	var targetJawAngle = this.target ? -0.2 : 0;
	this.jawAngle = RAPT.adjustAngleToTarget(this.jawAngle, targetJawAngle, 0.4 * seconds);
	//this.sprites[RAPT.HUNTER_CLAW1].angle = this.jawAngle;
	//this.sprites[RAPT.HUNTER_CLAW2].angle = this.jawAngle;

	this.sprite.sprite[1].rotation.z = this.jawAngle;
	this.sprite.sprite[2].rotation.z = -this.jawAngle;
};

RAPT.Hunter.prototype.draw = function(c) {
	/*c.fillStyle = (this.target == RAPT.gameState.playerA) ? 'red' : 'blue';
	c.strokeStyle = 'black';

	if (this.state != RAPT.STATE_IDLE)
	{
		var angle = this.sprites[RAPT.HUNTER_BODY].angle + Math.PI / 2;
		var fromEye = new RAPT.Vector().fromAngle(angle);
		var eye = this.getCenter().sub(fromEye.mul(0.2));

		if(this.state == RAPT.STATE_RED) {
			c.fillStyle = 'red';
			c.beginPath();
			c.arc(eye.x, eye.y, 0.1, 0, 2*Math.PI, false);
			c.fill();
		} else if(this.state == RAPT.STATE_BLUE) {
			c.fillStyle = 'blue';
			c.beginPath();
			c.arc(eye.x, eye.y, 0.1, 0, 2*Math.PI, false);
			c.fill();
		} else {
			c.fillStyle = 'red';
			c.beginPath();
			c.arc(eye.x, eye.y, 0.1, angle, angle + Math.PI, false);
			c.fill();

			c.fillStyle = 'blue';
			c.beginPath();
			c.arc(eye.x, eye.y, 0.1, angle + Math.PI, angle + 2*Math.PI, false);
			c.fill();

			c.beginPath();
			c.moveTo(eye.x - fromEye.x * 0.1, eye.y - fromEye.y * 0.1);
			c.lineTo(eye.x + fromEye.x * 0.1, eye.y + fromEye.y * 0.1);
			c.stroke();
		}
	}

	this.sprites[RAPT.HUNTER_BODY].draw(c);*/
};

RAPT.JET_STREAM_WIDTH = 0.4;
RAPT.JET_STREAM_HEIGHT = 0.4;
RAPT.JET_STREAM_SHOOT_FREQ = 0.2;
RAPT.NUM_BARRELS = 3;

//RAPT.JET_STREAM_SPRITE_A = 0;
//RAPT.JET_STREAM_SPRITE_B = 1;

RAPT.JetStream = function (center, direction) {
	RAPT.SpawningEnemy.call(this, RAPT.ENEMY_JET_STREAM, center, RAPT.JET_STREAM_WIDTH, RAPT.JET_STREAM_HEIGHT, 0, RAPT.JET_STREAM_SHOOT_FREQ, 0);
	this.direction = direction;
	this.reloadAnimation = 0;

	this.sprite =  new RAPT.SpriteGroup({
		name:'jetstream',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[1,5], [0,5]],
		color:0XFFCC00,

		list:['p1', 'p2'],
		sizes: [ [0.8,0.8] ],
		pos:[[-0.2,-0.2], [0.2,0.2]]
	});

	this.sprite.moveto(center);

	/*this.sprites = [new RAPT.Sprite(), new RAPT.Sprite()];
	this.sprites[RAPT.JET_STREAM_SPRITE_A].drawGeometry = this.sprites[RAPT.JET_STREAM_SPRITE_B].drawGeometry = function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		for(var i = 0; i < RAPT.NUM_BARRELS; i++) {
			var angle = i * (2 * Math.PI / RAPT.NUM_BARRELS);
			c.moveTo(0, 0);
			c.lineTo(0.2 * Math.cos(angle), 0.2 * Math.sin(angle));
		}
		c.stroke();
	};*/
}

//RAPT.JetStream.prototype = new RAPT.SpawningEnemy;
RAPT.JetStream.prototype = Object.create( RAPT.SpawningEnemy.prototype );

RAPT.JetStream.prototype.canCollide = function() { return false; }

RAPT.JetStream.prototype.spawn = function() {
	RAPT.gameState.addEnemy(new RAPT.RiotBullet(this.getCenter(), this.direction), this.getCenter());
	return true;
}

RAPT.JetStream.prototype.afterTick = function(seconds) {
	this.reloadAnimation += seconds * (0.5 / RAPT.JET_STREAM_SHOOT_FREQ);

	var angle = this.reloadAnimation * (RAPT.TwoPI / RAPT.NUM_BARRELS);
	var targetAngle = this.direction - RAPT.PI90;
	var bodyOffset = new RAPT.Vector().fromAngle(targetAngle).mul(0.2);

	var position = this.getCenter();
	/*this.sprites[RAPT.JET_STREAM_SPRITE_A].angle = targetAngle + angle;
	this.sprites[RAPT.JET_STREAM_SPRITE_B].angle = targetAngle - angle;
	this.sprites[RAPT.JET_STREAM_SPRITE_A].offsetBeforeRotation = position.sub(bodyOffset);
	this.sprites[RAPT.JET_STREAM_SPRITE_B].offsetBeforeRotation = position.add(bodyOffset);*/

	this.sprite.sprite[0].rotation.z = targetAngle + angle;
	this.sprite.sprite[1].rotation.z = targetAngle - angle;

	// adjust for even NUM_BARRELS
	//if (!(RAPT.NUM_BARRELS & 1))
	//	this.sprites[RAPT.JET_STREAM_SPRITE_B].angle += Math.PI / RAPT.NUM_BARRELS;
}

RAPT.JetStream.prototype.draw = function(c) {
	/*this.sprites[RAPT.JET_STREAM_SPRITE_A].draw(c);
	this.sprites[RAPT.JET_STREAM_SPRITE_B].draw(c);

	var angle = this.reloadAnimation * (2 * Math.PI / RAPT.NUM_BARRELS);
	var targetAngle = this.direction - Math.PI / 2;
	var position = this.getCenter();
	var bodyOffset = new RAPT.Vector().fromAngle(targetAngle).mul(0.2);

	c.fillStyle = 'yellow';
	c.strokeStyle = 'black';

	for(var side = -1; side <= 1; side += 2)
	{
		for(var i = 0; i < RAPT.NUM_BARRELS; i++)
		{
			var theta = i * (2 * Math.PI / RAPT.NUM_BARRELS) - side * angle;
			var reload = (this.reloadAnimation - i * side) / RAPT.NUM_BARRELS + (side == 1) * 0.5;

			// adjust for even NUM_BARRELS
			if(side == 1 && !(RAPT.NUM_BARRELS & 1))
			{
				theta += Math.PI / RAPT.NUM_BARRELS;
				reload -= 0.5 / RAPT.NUM_BARRELS;
			}

			reload -= Math.floor(reload);

			var pos = position.add(bodyOffset.mul(side)).add(bodyOffset.rotate(theta));
			c.beginPath();
			c.arc(pos.x, pos.y, 0.1 * reload, 0, 2*Math.PI, false);
			c.fill();
			c.stroke();
		}
	}*/
}

RAPT.LASER_RADIUS = .15;
RAPT.LASER_SPEED = 5;
RAPT.LASER_BOUNCES = 0;

RAPT.Laser = function (center, direction) {
	RAPT.FreefallEnemy.call(this, RAPT.ENEMY_LASER, center, RAPT.LASER_RADIUS, 1);

	this.bouncesLeft = RAPT.LASER_BOUNCES;
	this.velocity = new RAPT.Vector(RAPT.LASER_SPEED * Math.cos(direction), RAPT.LASER_SPEED * Math.sin(direction));

	this.sprite = new RAPT.SpriteGroup({
		name:'laser',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[4,2]],
		list:['p1']
	});

	this.sprite.moveto(center);
	this.sprite.sprite[0].rotation.z = direction;

}

RAPT.Laser.prototype = Object.create( RAPT.FreefallEnemy.prototype );

RAPT.Laser.prototype.move = function(seconds) {
	this.sprite.moveto(this.getCenter());
	return this.velocity.mul(seconds);
};

RAPT.Laser.prototype.reactToWorld = function(contact) {
	if (this.bouncesLeft <= 0) {
		this.setDead(true);
		
		var position = this.getCenter();
		for (var i = 0; i < 20; ++i) {
			var angle = RAPT.randInRange(0, 2 * Math.PI);
			var direction = new RAPT.Vector().fromAngle(angle);
			direction = direction.mul(RAPT.randInRange(0.5, 5));

			RAPT.Particle().position(position).velocity(direction).angle(angle).radius(0.1).bounces(1).elasticity(1).decay(0.01).gravity(0).color(1, 1, 1, 1).line();
		}
	} else {
		--this.bouncesLeft;
	}
};


RAPT.Laser.prototype.onDeath = function() {
	this.sprite.remove();
};
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

RAPT.RIOT_BULLET_RADIUS = 0.1;
RAPT.RIOT_BULLET_SPEED = 7;

RAPT.RiotBullet = function (center, direction) {
	RAPT.FreefallEnemy.call(this, RAPT.ENEMY_RIOT_BULLET, center, RAPT.RIOT_BULLET_RADIUS, 0);
	this.velocity = new RAPT.Vector(RAPT.RIOT_BULLET_SPEED * Math.cos(direction), RAPT.RIOT_BULLET_SPEED * Math.sin(direction));

	this.sprite =  new RAPT.SpriteGroup({
		name:'riotbullet',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[2,5]],
		color:0XFFCC00,

		list:['p1'],
		sizes: [ [0.7,0.7] ]
	});

	this.sprite.moveto(center);
}

//RAPT.RiotBullet.prototype = new RAPT.FreefallEnemy;
RAPT.RiotBullet.prototype = Object.create( RAPT.FreefallEnemy.prototype );

RAPT.RiotBullet.prototype.reactToPlayer = function(player) {
	if (!this.isDead()) {
		// the delta-velocity applied to the player
		var deltaVelocity = this.velocity.mul(0.75);
		player.addToVelocity(deltaVelocity);
	}
	this.setDead(true);
}

RAPT.RiotBullet.prototype.afterTick = function(seconds) {
	this.sprite.moveto( this.getCenter());
}

RAPT.RiotBullet.prototype.onDeath = function() {
	var position = this.getCenter();
	this.sprite.remove();

	// smoke
	for (var i = 0; i < 5; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = this.velocity.add(direction.mul(RAPT.randInRange(0.1, 1)));

		RAPT.Particle().position(position).velocity(direction).radius(0.01, 0.1).bounces(0, 4).elasticity(0.05, 0.9).decay(0.0005, 0.005).expand(1.0, 1.2).color(0.9, 0.9, 0, 1).mixColor(1, 1, 0, 1).circle();
	}
	RAPT.Enemy.prototype.onDeath.call(this);
}

RAPT.RiotBullet.prototype.draw = function(c) {
	/*var pos = this.getCenter();
	c.strokeStyle = 'black';
	c.fillStyle = 'yellow';
	c.beginPath();
	c.arc(pos.x, pos.y, RAPT.RIOT_BULLET_RADIUS, 0, 2*Math.PI, false);
	c.fill();
	c.stroke();*/
}

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

RAPT.RocketSpider = function (center, angle) {
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
RAPT.SPIDER_LEGS_RADIUS = .45;
RAPT.SPIDER_LEGS_WEAK_SPOT_RADIUS = .2;
RAPT.SPIDER_LEGS_ELASTICITY = 1.0;
RAPT.SPIDER_LEGS_FLOOR_ELASTICITY = 0.1;

RAPT.RocketSpiderLegs = function (center, angle, body) {
	RAPT.WalkingEnemy.call(this, -1, center, RAPT.SPIDER_LEGS_RADIUS, RAPT.SPIDER_LEGS_ELASTICITY);
	this.body = body;
	this.weakSpot = new RAPT.Circle(center, RAPT.SPIDER_LEGS_WEAK_SPOT_RADIUS);
	if (angle <= Math.PI * 0.5 || angle > Math.PI * 0.6666666) {
		this.velocity = new RAPT.Vector(RAPT.SPIDER_SPEED, 0);
	} else {
		this.velocity = new RAPT.Vector(-RAPT.SPIDER_SPEED, 0);
	}
}

//RocketSpiderLegs.prototype = Object.create( WalkingEnemy.prototype );
//RAPT.RocketSpiderLegs.prototype = new RAPT.WalkingEnemy;
RAPT.RocketSpiderLegs.prototype = Object.create( RAPT.WalkingEnemy.prototype );

// Returns true iff the Spider and player are on the same level floor, less than 1 cell horizontal distance away,
// and the spider is moving towards the player
RAPT.RocketSpiderLegs.prototype.playerWillCollide = function(player) {
	if (player.isDead()) return false;
	var toReturn = Math.abs(player.getShape().getAabb().getBottom() - this.hitCircle.getAabb().getBottom()) < .01;
	var xRelative = player.getCenter().x - this.getCenter().x;
	toReturn = toReturn && (Math.abs(xRelative) < 1) && (this.velocity.x * xRelative > -0.01);
	return toReturn;
}

// Walks in a straight line, but doesn't walk into the player
RAPT.RocketSpiderLegs.prototype.move = function(seconds) {
	if (this.isOnFloor()) {
		if (this.playerWillCollide(RAPT.gameState.playerA) || this.playerWillCollide(RAPT.gameState.playerB)) {
			this.velocity.x *= -1;
		}
		return this.velocity.mul(seconds);
	} else {
		return this.accelerate(new RAPT.Vector(0, RAPT.FREEFALL_ACCEL), seconds);
	}
}

// Acts like it has elasticity of SPIDER_FLOOR_ELASTICITY on floors, and maintains constant horizontal speed
RAPT.RocketSpiderLegs.prototype.reactToWorld = function(contact) {
	if (RAPT.getOrientation(contact.normal) === RAPT.EDGE_FLOOR) {
		var perpendicular = this.velocity.projectOntoAUnitVector(contact.normal);
		var parallel = this.velocity.sub(perpendicular);
		this.velocity = parallel.unit().mul(RAPT.SPIDER_SPEED).add(perpendicular.mul(RAPT.SPIDER_LEGS_FLOOR_ELASTICITY));
	}
}

// The player can kill the Spider by running through its legs
RAPT.RocketSpiderLegs.prototype.reactToPlayer = function(player) {
	this.weakSpot.moveTo(this.hitCircle.getCenter());
	if (RAPT.gameState.collider.overlapShapePlayers(this.weakSpot).length === 0) {
		this.setDead(true);
	}
}

// The legs of the spider are responsible for killing the body

RAPT.RocketSpiderLegs.prototype.setDead = function(isDead) {
	this.body.setDead(isDead);
	RAPT.Enemy.prototype.setDead.call(this, isDead);
}

RAPT.RocketSpiderLegs.prototype.onDeath = function() {
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);

	// make things that look like legs fly everywhere
	var position = this.getCenter();
	for (var i = 0; i < 16; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0.5, 5));

		var angle = RAPT.randInRange(0, 2*Math.PI);
		var angularVelocity = RAPT.randInRange(-Math.PI, Math.PI);

		RAPT.Particle().position(position).velocity(direction).radius(0.25).bounces(3).elasticity(0.5).decay(0.01).line().angle(angle).angularVelocity(angularVelocity).color(0, 0, 0, 1);
	}
}

RAPT.RocketSpiderLegs.prototype.draw = function(c) {
}

RAPT.SHOCK_HAWK_RADIUS = 0.3;
RAPT.SHOCK_HAWK_ACCEL = 6;
RAPT.SHOCK_HAWK_DECEL = 0.8;
RAPT.SHOCK_HAWK_RANGE = 10;

RAPT.ShockHawk = function (center, target) {
	RAPT.HoveringEnemy.call(this, RAPT.ENEMY_SHOCK_HAWK, center, RAPT.SHOCK_HAWK_RADIUS, 0);
	this.target = target;
	this.chasing = false;

	var cc = this.target.color+2;

	this.sprite = new RAPT.SpriteGroup({
		name:'shockhawk',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		uvs:[[cc,0]],
		list:['p1'],
	});

	this.sprite.moveto(center);

}
//RAPT.ShockHawk.prototype = new RAPT.HoveringEnemy;
RAPT.ShockHawk.prototype = Object.create( RAPT.HoveringEnemy.prototype );
//RAPT.ShockHawk.prototype.constructor = RAPT.ShockHawk;

RAPT.ShockHawk.prototype.getTarget = function() { return this.target === RAPT.gameState.playerB; }
RAPT.ShockHawk.prototype.setTarget = function(player) { this.target = player; }

RAPT.ShockHawk.prototype.avoidsSpawn = function() {
	if (this.chasing) return false;
	else return true;
}

RAPT.ShockHawk.prototype.move = function(seconds) {
	// Time independent version of multiplying by 0.998
	// solved x^0.01 = 0.998 for x very precisely using wolfram alpha
	this.velocity.inplaceMul(Math.pow(0.8185668046884278157989334904543296243702023236680159019579, seconds));
	if (!this.target || this.target.isDead()) {
		this.chasing = false;
		return this.accelerate(this.velocity.mul(-RAPT.SHOCK_HAWK_DECEL), seconds);
	}
	var relTargetPos = this.target.getCenter().sub(this.getCenter());
	if (relTargetPos.lengthSquared() > (RAPT.SHOCK_HAWK_RANGE * RAPT.SHOCK_HAWK_RANGE)) {
		this.chasing = false;
		return this.accelerate(this.velocity.mul(-RAPT.SHOCK_HAWK_DECEL), seconds);
	}
	this.chasing = true;
	relTargetPos.normalize();
	var accel = relTargetPos.mul(RAPT.SHOCK_HAWK_ACCEL);
	return this.accelerate(accel, seconds);
}

RAPT.ShockHawk.prototype.onDeath = function() {
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);
}

RAPT.ShockHawk.prototype.afterTick = function(seconds) {
	var position = this.getCenter();
	this.sprite.moveto(position);
	//this.bodySprite.offsetBeforeRotation = position;
	if(!this.target.isDead()) {
		
		this.sprite.group.rotation.z = this.target.getCenter().sub(position).atan2();
		//this.bodySprite.angle = this.target.getCenter().sub(position).atan2() - Math.PI / 2;
	}
}

RAPT.ShockHawk.prototype.draw = function(c) {
	/*c.fillStyle = (this.target == RAPT.gameState.playerA) ? 'red' : 'blue';
	c.strokeStyle = 'black';
	this.bodySprite.draw(c);*/
}

RAPT.SPIKE_BALL_RADIUS = 0.2;

// A boring old spike ball
RAPT.SpikeBall = function (center) {
	RAPT.Enemy.call(this, RAPT.ENEMY_SPIKE_BALL, 0);

	this.sprite =  new RAPT.SpriteGroup({
		name:'spikenall',
		material:RAPT.MAT_ENEMY,
		size : 1,
		nuv:16,
		color:0XFFCC00,
		list:['p1', 'p2', 'p3'],
		sizes: [ [0.5,0.5]  ]
	});

	this.sprite.moveto(center);

	this.hitCircle = new RAPT.Circle(center, RAPT.SPIKE_BALL_RADIUS);

	this.sprite.sprite[0].rotation.z = RAPT.randInRange(0, RAPT.TwoPI );
	this.sprite.sprite[1].rotation.z = RAPT.randInRange(0, RAPT.TwoPI );
	this.sprite.sprite[2].rotation.z = RAPT.randInRange(0, RAPT.TwoPI );
}

RAPT.SpikeBall.prototype = Object.create( RAPT.Enemy.prototype );

RAPT.SpikeBall.prototype.getShape = function() { return this.hitCircle; }

RAPT.SpikeBall.prototype.canCollide = function() { return false; }

RAPT.SpikeBall.prototype.afterTick = function(seconds) {
	this.sprite.sprite[0].rotation.z -= seconds * (25 * RAPT.ToRad);
	this.sprite.sprite[1].rotation.z += seconds * (65 * RAPT.ToRad);
	this.sprite.sprite[2].rotation.z += seconds * (15 * RAPT.ToRad);
}
RAPT.STALACBAT_RADIUS = 0.2;
RAPT.STALACBAT_SPEED = 2;
//RAPT.STALACBAT_SPRITE_BODY = 0;
//RAPT.STALACBAT_SPRITE_LEFT_WING = 1;
//RAPT.STALACBAT_SPRITE_RIGHT_WING = 2;


RAPT.Stalacbat = function (center, target) {
	RAPT.FreefallEnemy.call(this, RAPT.ENEMY_STALACBAT, center, RAPT.STALACBAT_RADIUS, 0);

	this.target = target;
	this.isFalling = false;

	var cc = this.target.color +1

	this.sprite =  new RAPT.SpriteGroup({
		name:'stalacbat',
		material:RAPT.MAT_ENEMY,
		color:0X44CC00,
		nuv:16,
		list:['p1', 'w0', 'w1'],
		uvs:[[cc,1], [4,1], [5,1]],
	});

	this.sprite.moveto(center);
	this.startPosY = center.y;
	this.exp = false;
	
	

	/*this.sprites = [new RAPT.Sprite(), new RAPT.Sprite(), new RAPT.Sprite()];
	// Draw circle for body
	this.sprites[RAPT.STALACBAT_SPRITE_BODY].drawGeometry = function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		c.arc(0, 0, 0.1, 0, 2 * Math.PI, false);
		c.stroke();
		c.fill();
	}
	// Draw the two wings 
	this.sprites[RAPT.STALACBAT_SPRITE_LEFT_WING].drawGeometry = this.sprites[RAPT.STALACBAT_SPRITE_RIGHT_WING].drawGeometry = function(c) {
		c.strokeStyle = 'black';
		c.beginPath();
		c.arc(0, 0, 0.2, 0, Math.PI / 2, false);
		c.arc(0, 0, 0.15, Math.PI / 2, 0, true);
		c.stroke();

		c.beginPath();
		c.moveTo(0.07, 0.07);
		c.lineTo(0.1, 0.1);
		c.stroke();
	}

	this.sprites[RAPT.STALACBAT_SPRITE_LEFT_WING].setParent(this.sprites[RAPT.STALACBAT_SPRITE_BODY]);
	this.sprites[RAPT.STALACBAT_SPRITE_RIGHT_WING].setParent(this.sprites[RAPT.STALACBAT_SPRITE_BODY]);*/
}

//RAPT.Stalacbat.prototype = new RAPT.FreefallEnemy;
RAPT.Stalacbat.prototype = Object.create( RAPT.FreefallEnemy.prototype );

// Falls when the target is directly beneat it
RAPT.Stalacbat.prototype.move = function(seconds) {
	if (this.isFalling) {
		return RAPT.FreefallEnemy.prototype.move.call(this, seconds);
	} else if (this.target !== null && !this.target.isDead()) {
		var playerPos = this.target.getCenter();
		var pos = this.getCenter();
		if ((Math.abs(playerPos.x - pos.x) < 0.1) && (playerPos.y < pos.y)) {
			if (!RAPT.gameState.collider.lineOfSightWorld(pos, playerPos, RAPT.gameState.world)) {
				this.isFalling = true;
				return RAPT.FreefallEnemy.prototype.move.call(this, seconds);
			}
		}
	}
	return new RAPT.Vector(0, 0);
}

RAPT.Stalacbat.prototype.getTarget = function() {
	return this.target === RAPT.gameState.playerB;
}

RAPT.Stalacbat.prototype.afterTick = function(seconds) {
	var percent = this.velocity.y * -0.25;
	if (percent > 1) percent = 1;

	if(this.exp) return;

	var position = this.getCenter();
	//this.sprites[RAPT.STALACBAT_SPRITE_BODY].offsetBeforeRotation = new RAPT.Vector(position.x, position.y + 0.1 - 0.2 * percent);
	this.sprite.sprite[0].position.y = (position.y - 0.2 * percent)-this.startPosY;
	var angle = percent * RAPT.PI90;
	this.sprite.sprite[1].rotation.z =  angle;
	this.sprite.sprite[2].rotation.z =  -angle; //- Math.PI / 2;;//RAPT.randInRange(0, RAPT.TwoPI );
	
	//this.sprites[RAPT.STALACBAT_SPRITE_LEFT_WING].angle = Math.PI - angle;
	//this.sprites[RAPT.STALACBAT_SPRITE_RIGHT_WING].angle = angle - Math.PI / 2;
}

RAPT.Stalacbat.prototype.onDeath = function() {
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);
	this.exp = true;
	this.sprite.remove();

	var isRed = (this.target === RAPT.gameState.playerA) ? 0.8 : 0;
	var isBlue = (this.target === RAPT.gameState.playerB) ? 1 : 0;

	var position = this.getCenter();
	for (var i = 0; i < 15; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI)).mul(RAPT.randInRange(5, 10));
		RAPT.Particle().position(position).velocity(direction).radius(0.2).bounces(3).decay(0.01).elasticity(0.5).color(isRed, 0, isBlue, 1).triangle().fixangle();
	}
}

RAPT.Stalacbat.prototype.draw = function(c) {
	// Draw the colored "eye"
	//if (this.target === RAPT.gameState.playerA)  c.fillStyle = 'red';
	//else  c.fillStyle = 'blue';
	 
	// Draw the black wings
	//this.sprites[RAPT.STALACBAT_SPRITE_BODY].draw(c);
}

RAPT.WALL_AVOIDER_RADIUS = 0.3;
RAPT.WALL_AVOIDER_ACCEL = 3.3;

RAPT.WallAvoider = function (center, target) {
	RAPT.RotatingEnemy.call(this, RAPT.ENEMY_WALL_AVOIDER, center, RAPT.WALL_AVOIDER_RADIUS, 0, 0);

	this.target = target;
	this.acceleration = new RAPT.Vector(0,0);
	this.angularVelocity = 0;

	var cc = this.target.color;

	this.sprite =  new RAPT.SpriteGroup({
		name:'wallavoider',
		material:RAPT.MAT_ENEMY,
		nuv:16,
		list:['p1'],
		uvs:[[cc+2,5]]
	});

	this.sprite.moveto(center);
}

RAPT.WallAvoider.prototype = new RAPT.RotatingEnemy;
RAPT.WallAvoider.prototype = Object.create( RAPT.RotatingEnemy.prototype );

RAPT.WallAvoider.prototype.move = function(seconds) {
	if (this.target.isDead()) {
		this.velocity.x = this.velocity.y = 0;
		return this.velocity.mul(seconds);
	} else {
		var targetDelta = this.target.getCenter().sub(this.getCenter());
		var ref_shapePoint = {};
		var ref_worldPoint = {};
		var closestPointDist = RAPT.gameState.collider.closestToEntityWorld(this, 5, ref_shapePoint, ref_worldPoint, RAPT.gameState.world);
		// If something went horribly, horribly wrong
		if (closestPointDist < 0.001) {
			return this.accelerate(new RAPT.Vector(0, 0), seconds);
		}
		this.acceleration = targetDelta.unit();
		if (closestPointDist < Number.POSITIVE_INFINITY) {
			var closestPointDelta = ref_worldPoint.ref.sub(this.getCenter());
			var wallAvoidance = closestPointDelta.mul(-1 / (closestPointDist * closestPointDist));
			this.acceleration.inplaceAdd(wallAvoidance);
		}
		this.acceleration.normalize();
		this.acceleration.inplaceMul(RAPT.WALL_AVOIDER_ACCEL);

		// Time independent version of multiplying by 0.99
		this.velocity.inplaceMul(Math.pow(0.366032, seconds));
		return this.accelerate(this.acceleration, seconds);
	}
};

RAPT.WallAvoider.prototype.reactToWorld = function(contact) {
	this.setDead(true);
};

RAPT.WallAvoider.prototype.onDeath = function() {
	this.sprite.remove();
	RAPT.gameState.incrementStat(RAPT.STAT_ENEMY_DEATHS);

	var position = this.getCenter();
	// fire
	for(var i = 0; i < 50; ++i) {
		var direction = new RAPT.Vector().fromAngle(RAPT.randInRange(0, 2 * Math.PI));
		direction = direction.mul(RAPT.randInRange(0.5, 17));

		RAPT.Particle().position(position).velocity(direction).radius(0.02, 0.15).bounces(0, 4).elasticity(0.05, 0.9).decay(0.000001, 0.00001).expand(1.0, 1.2).color(1, 0.3, 0, 1).mixColor(1, 0.1, 0, 1).triangle();
	}
};

RAPT.WallAvoider.prototype.getTarget = function() {
	return this.target === RAPT.gameState.getPlayerB();
};

RAPT.WallAvoider.prototype.afterTick = function(seconds) {
	this.sprite.moveto(this.getCenter());
	this.angularVelocity = (this.angularVelocity + RAPT.randInRange(-Math.PI, Math.PI)) * 0.5;
	this.sprite.group.rotation.z += this.angularVelocity * seconds;
};
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


RAPT.WHEELIGATOR_RADIUS = 0.3;
RAPT.WHEELIGATOR_SPEED = 3;
RAPT.WHEELIGATOR_ELASTICITY = 1;
RAPT.WHEELIGATOR_FLOOR_ELASTICITY = 0.3;

RAPT.Wheeligator = function (center, angle) {
	RAPT.WalkingEnemy.call(this, RAPT.ENEMY_WHEELIGATOR, center, RAPT.WHEELIGATOR_RADIUS, RAPT.WHEELIGATOR_ELASTICITY);

	this.sprite =  new RAPT.SpriteGroup({
		name:'wheeligator',
		material:RAPT.MAT_ENEMY,
		size : 0.7,
		uvs:[[0,1]],
		nuv:16,
		color:0X44CC66,
		list:['p1'],
		//sizes: [ [0.6,0.6] ]
	});

	//this.group.move(center.x, center.y)

	this.hitGround = false;
	this.angularVelocity = 0;
	this.startsRight = (Math.cos(angle) > 0);

	/*this.bodySprite = new RAPT.Sprite();
	
	this.bodySprite.drawGeometry = function(c) {
		var rim = 0.1;

		c.strokeStyle = 'black';
		c.beginPath();
		c.arc(0, 0, RAPT.WHEELIGATOR_RADIUS, 0, 2*Math.PI, false);
		c.arc(0, 0, RAPT.WHEELIGATOR_RADIUS - rim, Math.PI, 3*Math.PI, false);
		c.stroke();

		c.fillStyle = 'black';
		for(var i = 0; i < 4; i++) {
			var startAngle = i * (2*Math.PI / 4);
			var endAngle = startAngle + Math.PI / 4;
			c.beginPath();
			c.arc(0, 0, RAPT.WHEELIGATOR_RADIUS, startAngle, endAngle, false);
			c.arc(0, 0, RAPT.WHEELIGATOR_RADIUS - rim, endAngle, startAngle, true);
			c.fill();
		}
	};*/
};

//RAPT.Wheeligator.prototype = new RAPT.WalkingEnemy;//Object.create( WalkingEnemy.prototype );
RAPT.Wheeligator.prototype = Object.create( RAPT.WalkingEnemy.prototype );
//RAPT.Wheeligator.prototype.constructor = RAPT.Wheeligator;

RAPT.Wheeligator.prototype.move = function(seconds) {
	var isOnFloor = this.isOnFloor();

	if (!this.hitGround && isOnFloor) {
		if (this.velocity.x < RAPT.WHEELIGATOR_SPEED) {
			this.velocity.x = this.startsRight ? RAPT.WHEELIGATOR_SPEED : -RAPT.WHEELIGATOR_SPEED;
			this.hitGround = true;
		}
	}

	if (isOnFloor) {
		this.angularVelocity = -this.velocity.x / RAPT.WHEELIGATOR_RADIUS;
	}

	this.velocity.y += (RAPT.FREEFALL_ACCEL * seconds);

	

	return this.velocity.mul(seconds);
};

RAPT.Wheeligator.prototype.reactToWorld = function(contact) {
	// If a floor, bounce off like elasticity is FLOOR_ELASTICITY
	if (RAPT.getOrientation(contact.normal) === RAPT.EDGE_FLOOR) {
		var perpendicular = this.velocity.projectOntoAUnitVector(contact.normal);
		var parallel = this.velocity.sub(perpendicular);
		this.velocity = parallel.add(perpendicular.mul(RAPT.WHEELIGATOR_FLOOR_ELASTICITY));
		this.angularVelocity = -this.velocity.x / RAPT.WHEELIGATOR_RADIUS;
	}
};

RAPT.Wheeligator.prototype.afterTick = function(seconds) {
	this.sprite.moveto(this.getCenter());
	this.sprite.group.rotation.z += this.angularVelocity * seconds;

	//this.bodySprite.offsetBeforeRotation = this.getCenter();
	//this.bodySprite.angle = this.bodySprite.angle + this.angularVelocity * seconds;
};

RAPT.Wheeligator.prototype.draw = function(c) {
	//var pos = this.getCenter();
	//this.bodySprite.draw(c);
};

