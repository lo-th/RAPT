RAPT.Sprite = function(type, x1, x2, y1, y2) {
	this.flip = 0;
	this.angle = 0;
	this.offsetBeforeRotation = new RAPT.Vector(0, 0);
	this.offsetAfterRotation = new RAPT.Vector(0, 0);
	this.parent = null;
	this.firstChild = null;
	this.nextSibling = null;
	this.drawGeometry = null;

	/*if(RAPT.W3D && type){
		RAPT.W3D.addSprite(x1/50, y1/50, -1, 1, 1);
	}*/

	


	//addSprite()
}

RAPT.Sprite.prototype = {
	constructor: RAPT.Sprite,

	clone : function() {
		var sprite = new RAPT.Sprite();
		sprite.flip = this.flip;
		sprite.angle = this.angle;
		sprite.offsetBeforeRotation = this.offsetBeforeRotation;
		sprite.offsetAfterRotation = this.offsetAfterRotation;
		sprite.drawGeometry = this.drawGeometry;
		return sprite;
	},
	setParent : function(newParent) {
		// remove from the old parent
		if(this.parent !== null) {
			if(this.parent.firstChild == this) {
				this.parent.firstChild = this.nextSibling;
			} else {
				for(var sprite = this.parent.firstChild; sprite !== null; sprite = sprite.nextSibling) {
					if(sprite.nextSibling == this) {
						sprite.nextSibling = this.nextSibling;
					}
				}
			}
		}

		// switch to new parent
		this.nextSibling = null;
		this.parent = newParent;

		// add to new parent
		if(this.parent !== null) {
			this.nextSibling = this.parent.firstChild;
			this.parent.firstChild = this;
		}
	},
	draw : function(c) {

		c.save();
		c.translate(this.offsetBeforeRotation.x, this.offsetBeforeRotation.y);
		if(this.flip) { c.scale(-1, 1); }
		c.rotate(this.angle);
		c.translate(this.offsetAfterRotation.x, this.offsetAfterRotation.y);

		this.drawGeometry(c);
		for(var sprite = this.firstChild; sprite !== null; sprite = sprite.nextSibling) {
			sprite.draw(c);
		}
		c.restore();
	}
}

// 3D!!!
/*
RAPT.Sprite3D = function() {
	this.flip = 0;
	this.angle = 0;
	this.offsetBeforeRotation = new RAPT.Vector(0, 0);
	this.offsetAfterRotation = new RAPT.Vector(0, 0);
	this.parent = null;
	this.firstChild = null;
	this.nextSibling = null;
	this.drawGeometry = null;
}

RAPT.Sprite3D.prototype = {
	constructor: RAPT.Sprite3D,

	clone : function() {
		var sprite = new RAPT.Sprite3D();
		sprite.flip = this.flip;
		sprite.angle = this.angle;
		sprite.offsetBeforeRotation = this.offsetBeforeRotation;
		sprite.offsetAfterRotation = this.offsetAfterRotation;
		sprite.drawGeometry = this.drawGeometry;
		return sprite;
	},
	setParent : function(newParent) {
		// remove from the old parent
		if(this.parent !== null) {
			if(this.parent.firstChild == this) {
				this.parent.firstChild = this.nextSibling;
			} else {
				for(var sprite = this.parent.firstChild; sprite !== null; sprite = sprite.nextSibling) {
					if(sprite.nextSibling == this) {
						sprite.nextSibling = this.nextSibling;
					}
				}
			}
		}

		// switch to new parent
		this.nextSibling = null;
		this.parent = newParent;

		// add to new parent
		if(this.parent !== null) {
			this.nextSibling = this.parent.firstChild;
			this.parent.firstChild = this;
		}
	},
	draw : function(c) {
		c.save();
		c.translate(this.offsetBeforeRotation.x, this.offsetBeforeRotation.y);
		if(this.flip) { c.scale(-1, 1); }
		c.rotate(this.angle);
		c.translate(this.offsetAfterRotation.x, this.offsetAfterRotation.y);

		this.drawGeometry(c);
		for(var sprite = this.firstChild; sprite !== null; sprite = sprite.nextSibling) {
			sprite.draw(c);
		}
		c.restore();
	}
}*/
