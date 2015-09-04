RAPT.W3D = null;
RAPT.MAT_PLAYER = null;
RAPT.GEO = {};

RAPT.Loader = function(file, callback){
    var loader = new THREE.SEA3D( { parser : THREE.SEA3D.DEFAULT } );
    loader.onComplete = function( e ) {
        var i = loader.meshes.length, m;
        while(i--){
            m = loader.meshes[i];
            //console.log(m.name)
            RAPT.GEO[m.name] = m.geometry;
        }
        callback();
    };

    loader.load( file );
};

RAPT.World3D = function(canvas){

    this.debug = document.getElementById( 'debug' );
    this.vs = {w:window.innerWidth, h:window.innerHeight, r:.0084, mw:0, mh:0, d:10};
    //this.vs.r = 1/this.vs.w;
    this.split = false;
    this.is2D = false;

    this.camera = [];
    this.initCameras();
    

    this.scene = new THREE.Scene();

    this.levelMaterial = new THREE.ShaderMaterial( {
        //attributes:[ 'size', 'color', 'uvpos' ],  
        uniforms:{
            ntiles :  { type: 'f', value: 8.0 },
            scale :  { type: 'f', value: 60.0 },//60
            map: { type: 't', value: null }
        },
        vertexShader:[
            'attribute vec4 color;',
            'attribute vec2 uvpos;',
            'attribute float size;',
            'uniform float scale;',
            'varying vec2 vPos;',
            'varying vec4 vColor;',
            'void main(){',
            '    vPos = uvpos;',
            '    vColor = color;',
            '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
            //'    vec4 mvPosition2 = modelViewMatrix * vec4( vec3(0.0,0.0,position.z), 1.0 );',
            '    gl_PointSize = size*scale;',
            //'    gl_PointSize = size * ( scale / length( mvPosition.xyz ) );',
            //'    gl_PointSize = size * ( scale / length( vec3(0.0,0.0,position.z) ) );',
            '    gl_Position = projectionMatrix * mvPosition;',
            '}'
        ].join('\n'),
        fragmentShader:[
            'uniform sampler2D map;',
            'uniform float ntiles;',
            'varying vec4 vColor;',
            'varying vec2 vPos;',
            RAPT.tileUV,
            //RAPT.decalUV,
            'void main(){',
            '    vec2 uv = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y );',
            '    vec2 coord = tileUV(uv, vPos, ntiles);',
            //'    vec2 coordd = decalUV(coord, 1.0, 64.0);',
            '    vec4 texture = texture2D( map, coord );',
            '    gl_FragColor = texture * vColor;',
            '}'
        ].join('\n'),
        //vertexColors:   THREE.VertexColors,
        depthTest: true,
        depthWrite: true,
        transparent: true
    });

    var map = THREE.ImageUtils.loadTexture( 'textures/map.png' );
    
    //map.wrapS = THREE.RepeatWrapping;
    //map.wrapT = THREE.RepeatWrapping;
    //map.magFilter = THREE.NearestFilter;
    //map.minFilter = THREE.NearestFilter;//LinearMipMapLinearFilter;
    //map.generateMipmaps = false;

    this.levelMaterial.uniforms.map.value = map;

    var map2 = THREE.ImageUtils.loadTexture( 'textures/map2.png' );

    var mapPlayer = THREE.ImageUtils.loadTexture( 'textures/player.png' );
    var mapEnemy = THREE.ImageUtils.loadTexture( 'textures/enemy.png' );

    RAPT.MAT_TEST = new THREE.MeshBasicMaterial( { map:map, color: 0xFFFFFF, shading: THREE.FlatShading, wireframe: false, transparent: true} );
    //RAPT.MAT_TEST2 = new THREE.MeshBasicMaterial( { color: 0x00FFF0, shading: THREE.FlatShading, wireframe: true, transparent: true} );
    RAPT.MAT_PLAYER = new THREE.MeshBasicMaterial( { map: mapPlayer, shading: THREE.FlatShading, wireframe: false, transparent: true, side:THREE.DoubleSide, alphaTest: 0.1 } );
    RAPT.MAT_ENEMY = new THREE.MeshBasicMaterial( { map: mapEnemy, shading: THREE.FlatShading, wireframe: false, transparent: true, side:THREE.DoubleSide, alphaTest: 0.1 } );
    //map2.magFilter = THREE.NearestFilter;
    //map2.minFilter = THREE.LinearMipMapLinearFilter;

    // init 3d particles
    RAPT.Particle.init3d(this.scene, map2);

    var geo = new THREE.SphereBufferGeometry (0.5);
    var mat1 = new THREE.MeshBasicMaterial( { color: 0xFF0000, shading: THREE.FlatShading, wireframe: true, transparent: true } )
    var mat2 = new THREE.MeshBasicMaterial( { color: 0x0000FF, shading: THREE.FlatShading, wireframe: true, transparent: true } )

    this.doors = [];

    this.sprites = [];

    /*this.player = [];
    this.player[0] = new THREE.Mesh( geo, mat1 );
    this.player[1] = new THREE.Mesh( geo, mat2 );

    this.scene.add( this.player[0] );
    this.scene.add( this.player[1] );*/

    //this.renderer = new THREE.WebGLRenderer( { precision:"mediump", canvas:canvas, antialias: true,  alpha: false, stencil:false } );
    this.renderer = new THREE.WebGLRenderer( { precision:"mediump", canvas:canvas, antialias: true,  alpha: false } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.vs.w, this.vs.h );
    this.renderer.setClearColor( 0x737373 , 1.0);
    
    
    //this.renderer.autoClear = false;

    //this.testMerge();



    this.effect = new RAPT.SplitEffect( this.renderer );
    this.effect.setSize( this.vs.w, this.vs.h );

    RAPT.W3D = this;

    var _this = this;
    canvas.onmousewheel = function(e) {_this.onMouseWheel(e)};
};

RAPT.World3D.prototype = {
    constructor: RAPT.World3D,
    /*upPlayers:function(p0, p1){
        this.player[0].position.set(p0.x, p0.y, 0);
        this.player[1].position.set(p1.x, p1.y, 0);
    },*/
    //initLevel:function(json){
    render: function(){

       // this.renderer.clear();
        // update particle engine
        RAPT.Particle.update();

        if(!this.split){
            
            this.renderer.render( this.scene, this.camera[0] );
            //debug.innerHTML = 'C0 x ' + this.camera[0].position.x.toFixed(0) + ' y ' + this.camera[0].position.y.toFixed(0)+ '<br>';
        }else{
            //this.renderer.clear();
            //RAPT.Particle.up();
            //this.renderer.clear();
            this.effect.render( this.scene, this.camera[1], this.camera[2] );
            //debug.innerHTML = 'C1 x ' + this.camera[1].position.x.toFixed(0) + ' y ' + this.camera[1].position.y.toFixed(0)+ '<br>';
            //debug.innerHTML += 'C2 x ' + this.camera[2].position.x.toFixed(0) + ' y ' + this.camera[2].position.y.toFixed(0)+ '<br>';
        }

        //renderer.clearDepth();
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
            var fov = 55;
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


        this.levelMaterial.uniforms.scale.value -= delta;// (0.5/this.vs.r)*2;
        //RAPT.Particle.scalemat()

        this.vs.d -= delta/6;//(0.5/this.vs.r)*2;

        //RAPT.gameScale -= delta

        //upCamera();
        //console.log(delta)

        this.camera[0].position.z = this.vs.d;
        this.camera[1].position.z = this.vs.d;
        this.camera[2].position.z = this.vs.d;

        e.preventDefault();
        e.stopPropagation();
    },
    initLevel:function(world){
        
        this.removeAll();
        this.clearAllDoor();

        this.edgeMerge(world);

        return;

        if(this.particleLevel){
            this.scene.remove( this.particleLevel );
            this.particleLevel.geometry.dispose();
        }
        if(this.particleCells){
            this.scene.remove( this.particleCells );
            this.particleCells.geometry.dispose();
        }

        var w = world.width, h = world.height, x=0, y=0, type;
        var n = w*h;
        var geometry = new THREE.BufferGeometry();

        var positions = new Float32Array( n * 3 );
        var uvpos = new Float32Array( n * 2 );
        var colors = new Float32Array( n * 4 );
        var size = new Float32Array( n );

        var color = new THREE.Color();
        var edges = null;
        var wall = [];
        var up, down, left, right;
        var levelType = 0;

        var v = n;
        while(v--){

            type = world.getCellType(x,y);

            positions[ v * 3 + 0 ] = x + 0.5;
            positions[ v * 3 + 1 ] = y + 0.5;
            positions[ v * 3 + 2 ] = 0;

            color.setHSL( v / n, 1.0, 0.5 );

            uvpos[ v * 2 + 0 ] = type;
            uvpos[ v * 2 + 1 ] = levelType;

            size[ v ] = 1.0;

            colors[ v * 4 + 0 ] = 1;
            colors[ v * 4 + 1 ] = 1;
            colors[ v * 4 + 2 ] = 1;
            if(type===0) colors[ v * 4 + 3 ] = 0;
            else colors[ v * 4 + 3 ] = 1;

            x++;
            if(x>(w-1)){ x = 0; y++; }
        }

        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        geometry.addAttribute( 'uvpos', new THREE.BufferAttribute( uvpos, 2 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 4 ) );
        geometry.addAttribute( 'size', new THREE.BufferAttribute( size, 1 ) );

        this.particleLevel = new THREE.PointCloud( geometry, this.levelMaterial );
        //this.particleLevel.position.z = -2;
        this.scene.add( this.particleLevel );

        // CELLS


        var ne = world.totalEdge;
        var nx = world.cells.length;
        var ny = world.cells[0].length;
        geometry = new THREE.BufferGeometry();

        positions = new Float32Array( ne * 3 );
        uvpos = new Float32Array( ne * 2 );
        colors = new Float32Array( ne * 4 );
        size = new Float32Array( ne );

        v = 0;//n;
        x = 0;
        y = 0;
        var j;
        var edges

        ;

        //while(v--){

        for (x = 0; x < nx; x++) {
            for (y = 0; y < ny; y++) {
                edges = world.cells[x][y].edges;
                if(edges.length){
                    j = edges.length;
                    while(j--){
                        positions[ v * 3 + 0 ] = x + 0.5;
                        positions[ v * 3 + 1 ] = y + 0.5;
                        positions[ v * 3 + 2 ] = 0;

                        uvpos[ v * 2 + 0 ] = edges[j].type;
                        uvpos[ v * 2 + 1 ] = 6;

                        size[ v ] = 1.0;

                        colors[ v * 4 + 0 ] = 1;
                        colors[ v * 4 + 1 ] = 1;
                        colors[ v * 4 + 2 ] = 1;
                        colors[ v * 4 + 3 ] = 0.5;
                        v++;
                    }
                }
            }
            //x++;
            //if(x>(w-1)){ x = 0; y++; }
        }

        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        geometry.addAttribute( 'uvpos', new THREE.BufferAttribute( uvpos, 2 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 4 ) );
        geometry.addAttribute( 'size', new THREE.BufferAttribute( size, 1 ) );

        this.particleCells = new THREE.PointCloud( geometry, this.levelMaterial );
        this.particleCells.position.z = 0.01;
        this.scene.add( this.particleCells );


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
    edgeMerge:function(world){
         if(this.edgemesh){
            this.scene.remove( this.edgemesh );
            this.edgemesh.geometry.dispose();
        }

        var basicplane0 = this.plane('front');
        var basicplane1 = this.plane('back');
        var basicplane2 = this.plane('floor', -Math.PI / 2, -0.5, false,  0, 0.5);
        var diagplane = this.plane('floor', -Math.PI / 2, 0, true, Math.PI / 4, 0.5);

        var tmpGeometry = new THREE.Geometry();

        var matrix = new THREE.Matrix4();
        var rmatrix = new THREE.Matrix4();
        var j, edges, type;
        var ne = world.totalEdge;
        var nx = world.cells.length;
        var ny = world.cells[0].length;
        var name = 'p0'

        for (var x = 0; x < nx; x++) {
            for (var y = 0; y < ny; y++) {

                

                celltype = world.getCellType(x,y);
                edges = world.cells[x][y].edges;

                if(celltype===0) {
                    name = 'g0';
                    matrix.makeTranslation(x+ 0.5,y+ 0.5, -0.25);
                    tmpGeometry.merge(basicplane1, matrix);
                } else if(celltype===1){
                    name = 'g1';
                    matrix.makeTranslation(x+ 0.5,y+ 0.5, 0.25);
                    if(world.getCellNE(x,y)) tmpGeometry.merge(basicplane0, matrix)
                }

                if(edges.length){
                    j = edges.length;
                    while(j--){
                        matrix.makeTranslation(x+ 0.5,y+ 0.5,0);
                        type = edges[j].type;

                        if(type<4){
                            rmatrix.makeRotationZ(0);
                            switch(type){
                                case 1:rmatrix.makeRotationZ(-RAPT.PI90); break
                                case 0:rmatrix.makeRotationZ(RAPT.PI90);break
                                case 3:rmatrix.makeRotationZ(RAPT.PI);  break
                                case 2:rmatrix.makeRotationZ(0); break
                            }

                            matrix.multiply(rmatrix);
                            tmpGeometry.merge(basicplane2, matrix);

                        } else{
                            switch(type){
                                case 7:rmatrix.makeRotationZ(RAPT.PI90);name='p5'; break
                                case 5:rmatrix.makeRotationZ(-RAPT.PI90); name='p4';break
                                case 6:rmatrix.makeRotationZ(RAPT.PI); name='p5'; break
                                case 4:rmatrix.makeRotationZ(0); name='p4'; break
                            }
                            /*switch(type){
                                case 6:rmatrix.makeRotationZ(-RAPT.PI90);name='p5'; break
                                case 7:rmatrix.makeRotationZ(RAPT.PI90); name='p4';break
                                case 5:rmatrix.makeRotationZ(0); name='p5'; break
                                case 4:rmatrix.makeRotationZ(0); name='p4'; break
                            }*/
                            matrix.multiply(rmatrix);
                            //tmpGeometry.merge(RAPT.GEO[name], matrix);
                            tmpGeometry.merge(diagplane, matrix);
                            tmpGeometry.merge(this.triangle(), matrix);
                            tmpGeometry.merge(this.triangle(true), matrix);
                        }

                        
                    }
                }
            }
        }

        tmpGeometry.mergeVertices();


        var geometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
        geometry.computeBoundingSphere();

        this.edgemesh = new THREE.Mesh(geometry, RAPT.MAT_TEST);
        this.scene.add(this.edgemesh);

    },
    
    tell:function(txt){
        debug.innerHTML = txt;
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
        var rz = this.vs.w/this.vs.h;
        i = this.camera.length;
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
        //renderer.clear();
        //c0.updateProjectionMatrix();
        //if(RAPT.W3D.edgemesh)RAPT.W3D.edgemesh.material = RAPT.MAT_TEST;
        //scene.updateMatrixWorld();
        renderer.render( scene, c0, _renderTargetL, true );
        //scene.updateMatrixWorld();
        //c1.updateProjectionMatrix();
        //if(RAPT.W3D.edgemesh)RAPT.W3D.edgemesh.material = RAPT.MAT_TEST2;
        renderer.render( scene, c1, _renderTargetR, true );
        //_scene.updateMatrixWorld();
        renderer.render( _scene, _camera );

    };

    this.dispose = function() {

        if ( _renderTargetL ) _renderTargetL.dispose();
        if ( _renderTargetR ) _renderTargetR.dispose();

    }

};