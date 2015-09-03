RAPT.WORLD_MARGIN = 60;

// class World
RAPT.World = function (w, h, spawnPoint, goal) {
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

	this.edges3d = [];
}

RAPT.World.prototype = {
	constructor: RAPT.World,
	rect : function (c, x, y, w, h) { c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h); },
	drawBorder : function(c, xmin, ymin, xmax, ymax) {
		var padding = 100;
		if(xmin < 0) this.rect(c, -padding, 0, padding, this.height);
		if(ymin < 0) this.rect(c, -padding, -padding, this.width + 2*padding, padding);
		if(xmax > this.width) this.rect(c, this.width, 0, padding, this.height);
		if(ymax > this.height) this.rect(c, -padding, this.height, this.width + 2*padding, padding);
	},
	draw : function(c, xmin, ymin, xmax, ymax) {

		var x, y;

		c.fillStyle = '#7F7F7F';
		c.strokeStyle = '#7F7F7F';

		this.drawBorder(c, xmin, ymin, xmax, ymax);

		xmin = Math.max(0, Math.floor(xmin));
		ymin = Math.max(0, Math.floor(ymin));
		xmax = Math.min(this.width, Math.ceil(xmax));
		ymax = Math.min(this.height, Math.ceil(ymax));

		x = xmax
		while(x!==xmin){
			x--;
			y = ymax
			while(y!==ymin){
				y--;
				this.cells[x][y].draw(c);
			}
		}

		c.strokeStyle = 'black';
		x = xmax
		while(x!==xmin){
			x--;
			y = ymax
			while(y!==ymin){
				y--;
				this.cells[x][y].drawEdges(c);
			}
		}

		/*for(var x = xmin; x < xmax; x++) {
			for(var y = ymin; y < ymax; y++) {
				this.cells[x][y].draw(c);
			}
		}*/

		/*c.strokeStyle = 'black';
		for(var x = xmin; x < xmax; x++) {
			for(var y = ymin; y < ymax; y++) {
				this.cells[x][y].drawEdges(c);
			}
		}*/
	},
	getCellNE:function(x, y){
		return (x >= 0 && y >= 0 && x < this.width && y < this.height) ? this.cells[x][y].ne : 0;
	},
	setCellNE : function(x, y, v) {
		c = this.getCell(x,y)
		if(c!==null)c.ne = v;
	},
	// cells outside the world return null
	getCell : function(x, y) {
		return (x >= 0 && y >= 0 && x < this.width && y < this.height) ? this.cells[x][y] : null;
	},
	// cells outside the world return solid
	getCellType : function(x, y) {
		return (x >= 0 && y >= 0 && x < this.width && y < this.height) ? this.cells[x][y].type : RAPT.CELL_SOLID;
	},
	setCell : function(x, y, type) {
		this.cells[x][y] = new RAPT.Cell(x, y, type);
	},
	createAllEdges : function() {
		this.edges3d = [];
		this.totalEdge = 0;
		for (var x = 0; x < this.cells.length; x++) {
			for (var y = 0; y < this.cells[0].length; y++) {
				this.cells[x][y].edges = this.createEdges(x, y);
				//this.findType(this.cells[x][y].edges);
				this.totalEdge+=this.cells[x][y].edges.length;
			}
		}
	},
	/*findType:function(edges){
		var t0, t1, t2, t4;
		var n = edges.length;
		var ref = edges[0];
		
		
		switch(n){
			case 1:
			    t0 = ref.type;
			    if(t0<4){  ref.rtype=0;  ref.r = this.findRotation('flat', t0);  }
			    else { 
			    	if( t0==4 || t0==7 ) ref.rtype = 4; 
			    	else ref.rtype = 5;
			    	ref.r = this.findRotation('diag', t0); 
			    }
			break
			case 2: 
			    if(this.testValue(edges,[0,1])){ref.rtype = 1; ref.r = 1;}
			    if(this.testValue(edges,[2,3])){ref.rtype = 1; ref.r = 0;}
			    if(this.testValue(edges,[1,2])){ref.rtype = 2; ref.r = 0;}
			    if(this.testValue(edges,[1,3])){ref.rtype = 2; ref.r = 3;}
			    if(this.testValue(edges,[0,2])){ref.rtype = 2; ref.r = 1;}
			    if(this.testValue(edges,[0,3])){ref.rtype = 2; ref.r = 2;}
			    

			   

			break
			case 3: break
			case 4: break
		}
		//return 
	},
	testValue:function(edges, v){
		//var vv = v;
		var i = v.length, j;
		while(i--){
			j = edges.length;
			while(j--){
				if(edges[j].type === v[i]) {v.splice(i,1);}
			}
		}
		if(v.length === 0) return true;
		else return false; 

	},
	findRotation:function(tt, t){
		var r = 0;
		switch(tt){
			case 'flat': 
			    if(t==2) r = 0;
			    if(t==3) r = 2;
			    if(t==1) r = 3;
			    if(t==0) r = 1;
			break
			case 'diag':
			    if(t==4) r = 0;
			    if(t==5) r = 0;
			    if(t==6) r = 3;
			    if(t==7) r = 1;
			break
			case 3: break
			case 4: break
		}

		return r;


	},*/
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

		//this.findType(edges);

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
