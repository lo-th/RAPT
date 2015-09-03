
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