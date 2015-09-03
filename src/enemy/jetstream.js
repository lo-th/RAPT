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
